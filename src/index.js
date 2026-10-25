// src/index.js
// DoH Worker 入口 — 请求路由、ECS 注入、缓存、上游转发

import { decode, encode } from 'dns-packet';
import { parseGetRequest, parsePostRequest } from './doh.js';
import { injectECS, getClientIp, getDnssecOk, removeECS } from './ecs.js';
import { buildCacheKey, buildCacheRequest, getFromCache, storeInCache, getMinTTL } from './cache.js';
import { queryUpstream } from './upstream.js';
import { formatResponse, errorResponse, CORS_HEADERS } from './response.js';
import { handleDiagnostic, DIAG_PATH } from './diag.js';
import { resolveConfig } from './config.js';
import { CACHEABLE_RCODES } from './constants.js';

// DNS 头部 CD（Checking Disabled）位，影响 DNSSEC 校验结果
const CD_FLAG = 0x0010;

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const pathname = url.pathname.replace(/\/+$/, '') || '/';

    // 预检请求要在路径检查之前响应，否则跨域调用非根路径会直接 404
    if (request.method === 'OPTIONS') {
      return new Response(null, {
        headers: {
          ...CORS_HEADERS,
          'Access-Control-Max-Age': '86400',
        }
      });
    }

    // 诊断接口：浏览器打开即可确认 ECS 是否真的到达权威 DNS
    if (pathname === DIAG_PATH) {
      return handleDiagnostic(request, url, resolveConfig(env));
    }

    // 只响应根路径 /，其他路径返回 404
    if (pathname !== '/') {
      return errorResponse(404, 'Not Found — use the root path /');
    }

    try {
      const config = resolveConfig(env);

      // ==================================================================
      // 步骤 1: 解析 DoH 请求 — 提取 DNS 线格式数据
      // ==================================================================
      let dnsWireFormat;

      if (request.method === 'GET') {
        try {
          dnsWireFormat = parseGetRequest(url);
        } catch (e) {
          return errorResponse(400, e.message);
        }
      } else if (request.method === 'POST') {
        try {
          dnsWireFormat = await parsePostRequest(request);
        } catch (e) {
          return errorResponse(400, e.message);
        }
      } else {
        return errorResponse(405, 'Method Not Allowed — use GET or POST');
      }

      // ==================================================================
      // 步骤 2: 解码并校验 DNS 数据包
      // ==================================================================
      let parsed;
      try {
        parsed = decode(dnsWireFormat);
      } catch (e) {
        return errorResponse(400, 'Invalid DNS message — failed to decode');
      }

      // 只接受标准查询：避免把 UPDATE/NOTIFY 或伪造的响应报文转发给上游
      if (parsed.type !== 'query' || parsed.opcode !== 'QUERY') {
        return errorResponse(400, 'Only standard DNS queries are supported');
      }
      // 缓存键只取第一个问题，多问题查询会互相污染，直接拒绝
      if (parsed.questions.length !== 1) {
        return errorResponse(400, 'Exactly one question is required');
      }

      // ==================================================================
      // 步骤 3: 注入 ECS — 获取访客 IP，掩码后注入 OPT 伪记录
      // ==================================================================
      const clientIp = getClientIp(request);
      const ecsOption = injectECS(parsed, clientIp);
      const dnssecOk = getDnssecOk(parsed);
      const checkingDisabled = !!(parsed.flags & CD_FLAG);

      // ==================================================================
      // 步骤 4: 缓存查找（命中时事务 ID 会被改回本次请求的 ID）
      // ==================================================================
      const cacheKey = buildCacheKey(
        parsed.questions,
        ecsOption,
        dnssecOk,
        checkingDisabled,
        new URL(config.upstreamUrl).host,
      );
      const cacheRequest = buildCacheRequest(cacheKey);

      const cachedResponse = await getFromCache(cacheRequest, parsed.id);
      if (cachedResponse) {
        return cachedResponse;
      }

      // ==================================================================
      // 步骤 5: 重新编码修改后的 DNS 数据包（含 ECS）并查询上游
      // ==================================================================
      let modifiedWireFormat;
      try {
        modifiedWireFormat = encode(parsed);
      } catch (e) {
        return errorResponse(500, 'Failed to encode modified DNS message');
      }

      let upstreamBuf;
      try {
        upstreamBuf = await queryUpstream(modifiedWireFormat, config);
      } catch (e) {
        // 细节只写日志，返回给客户端的文案保持固定
        console.error('Upstream DNS query failed:', e.message);
        if (e.name === 'AbortError') {
          return errorResponse(504, 'Upstream DNS query timed out');
        }
        return errorResponse(502, 'Upstream DNS query failed');
      }

      // ==================================================================
      // 步骤 6: 读取上游响应，计算 TTL 并缓存
      // ==================================================================
      let decodedUpstream;
      try {
        decodedUpstream = decode(upstreamBuf);
      } catch (e) {
        // 无法解码上游响应时仍然转发给客户端，但不缓存
        return formatResponse(upstreamBuf, 0);
      }

      // 上游若返回了不同的事务 ID，修正后再转发/缓存
      if (decodedUpstream.id !== parsed.id) {
        upstreamBuf.writeUInt16BE(parsed.id, 0);
        decodedUpstream.id = parsed.id;
      }

      // 带 ECS 却拿到 127.0.0.1 / 0.0.0.0，通常是 CDN 拒绝该子网（如区域限制），
      // 用不带 ECS 的查询重试一次，避免整个域名因此不可用。
      if (ecsOption && config.ecsFallback && isBlockedAnswer(decodedUpstream)) {
        try {
          removeECS(parsed);
          const retryBuf = await queryUpstream(encode(parsed), config);
          const retryDecoded = decode(retryBuf);

          if (!isBlockedAnswer(retryDecoded)) {
            if (retryDecoded.id !== parsed.id) {
              retryBuf.writeUInt16BE(parsed.id, 0);
              retryDecoded.id = parsed.id;
            }
            upstreamBuf = retryBuf;
            decodedUpstream = retryDecoded;
          }
        } catch (e) {
          console.error('ECS fallback query failed:', e.message);
        }
      }

      const ttl = getMinTTL(decodedUpstream);

      // 截断响应与 SERVFAIL/REFUSED 等错误结果不该进缓存，否则会放大上游故障
      const cacheable = config.maxCacheTtl > 0
        && ttl > 0
        && !decodedUpstream.flag_tc
        && CACHEABLE_RCODES.includes(decodedUpstream.rcode);

      if (cacheable) {
        // 后台缓存，不阻塞客户端响应
        ctx.waitUntil(storeInCache(cacheRequest, upstreamBuf, ttl, config.maxCacheTtl));
      }

      // ==================================================================
      // 步骤 7: 返回响应
      // ==================================================================
      return formatResponse(upstreamBuf, ttl);

    } catch (e) {
      console.error('Unhandled error:', e);
      return errorResponse(500, 'Internal Server Error');
    }
  }
};

// 127.0.0.1 / 0.0.0.0 这类地址几乎不会出现在正常的公网解析里，
// 通常代表 CDN 或权威 DNS 主动“拒绝服务”，例如按区域限制返回。
const BLOCKED_ADDRESSES = new Set(['127.0.0.1', '0.0.0.0', '::1', '::']);

/**
 * 判断响应是否只有“拒绝”地址（没有任何可用的 A/AAAA）
 *
 * @param {Object} decoded - dnsPacket.decode() 的结果
 */
function isBlockedAnswer(decoded) {
  const addresses = (decoded.answers || []).filter((r) => r.type === 'A' || r.type === 'AAAA');
  if (addresses.length === 0) {
    return false;
  }
  return addresses.every((r) => BLOCKED_ADDRESSES.has(r.data));
}
