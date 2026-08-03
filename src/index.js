// src/index.js
// DoH Worker 入口 — 请求路由、ECS 注入、缓存、上游转发

import { decode, encode } from 'dns-packet';
import { parseGetRequest, parsePostRequest } from './doh.js';
import { injectECS, getClientIp, getDnssecOk } from './ecs.js';
import { buildCacheKey, buildCacheRequest, getFromCache, storeInCache, getMinTTL } from './cache.js';
import { queryUpstream } from './upstream.js';
import { formatResponse, errorResponse } from './response.js';

export default {
  async fetch(request, env, ctx) {
    try {
      const url = new URL(request.url);
      const pathname = url.pathname.replace(/\/+$/, '') || '/';

      // 只响应根路径 /，其他路径返回 404
      if (pathname !== '/') {
        return errorResponse(404, 'Not Found — use the root path /');
      }

      // 处理 OPTIONS 预检请求
      if (request.method === 'OPTIONS') {
        return new Response(null, {
          headers: {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type, Accept',
            'Access-Control-Max-Age': '86400',
          }
        });
      }

      // ====================================================================
      // 步骤 1: 解析 DoH 请求 — 提取 DNS 线格式数据
      // ====================================================================
      let dnsWireFormat;

      if (request.method === 'GET') {
        try {
          dnsWireFormat = parseGetRequest(url);
        } catch (e) {
          return errorResponse(400, e.message);
        }
      } else if (request.method === 'POST') {
        try {
          dnsWireFormat = parsePostRequest(await request.arrayBuffer());
        } catch (e) {
          return errorResponse(400, e.message);
        }
      } else {
        return errorResponse(405, 'Method Not Allowed — use GET or POST');
      }

      // ====================================================================
      // 步骤 2: 解码 DNS 数据包
      // ====================================================================
      let parsed;
      try {
        parsed = decode(dnsWireFormat);
      } catch (e) {
        return errorResponse(400, 'Invalid DNS message — failed to decode');
      }

      // ====================================================================
      // 步骤 3: 注入 ECS — 获取访客 IP，掩码后注入 OPT 伪记录
      // ====================================================================
      const clientIp = getClientIp(request);
      const ecsOption = injectECS(parsed, clientIp);
      const dnssecOk = getDnssecOk(parsed);

      // ====================================================================
      // 步骤 4: 缓存查找
      // ====================================================================
      const cacheKey = buildCacheKey(parsed.questions, ecsOption, dnssecOk);
      const cacheRequest = buildCacheRequest(cacheKey);

      const cachedResponse = await getFromCache(cacheRequest);
      if (cachedResponse) {
        return cachedResponse;
      }

      // ====================================================================
      // 步骤 5: 重新编码修改后的 DNS 数据包（含 ECS）
      // ====================================================================
      let modifiedWireFormat;
      try {
        modifiedWireFormat = encode(parsed);
      } catch (e) {
        return errorResponse(500, 'Failed to encode modified DNS message');
      }

      // ====================================================================
      // 步骤 6: 查询上游 DNS 服务（1.1.1.1）
      // ====================================================================
      let upstreamResponse;
      try {
        upstreamResponse = await queryUpstream(modifiedWireFormat);
      } catch (e) {
        if (e.name === 'AbortError') {
          return errorResponse(504, 'Upstream DNS query timed out');
        }
        return errorResponse(502, `Upstream DNS query failed: ${e.message}`);
      }

      // ====================================================================
      // 步骤 7: 读取上游响应，计算 TTL 并缓存
      // ====================================================================
      const upstreamBuf = Buffer.from(await upstreamResponse.arrayBuffer());

      // 解码响应以提取 TTL
      let decodedUpstream;
      try {
        decodedUpstream = decode(upstreamBuf);
      } catch (e) {
        // 如果无法解码上游响应，仍然转发给客户端，但不缓存
        return formatResponse(upstreamBuf, 0);
      }

      const ttl = getMinTTL(decodedUpstream);
      if (ttl > 0) {
        // 后台缓存，不阻塞客户端响应
        ctx.waitUntil(storeInCache(cacheRequest, upstreamBuf, ttl));
      }

      // ====================================================================
      // 步骤 8: 返回响应
      // ====================================================================
      return formatResponse(upstreamBuf, ttl);

    } catch (e) {
      console.error('Unhandled error:', e);
      return errorResponse(500, `Internal Server Error: ${e.message}`);
    }
  }
};