// src/cache.js
// 缓存键构建 & Cloudflare Cache API 读写

import { CACHE_BASE, MAX_CACHE_TTL, DEFAULT_TTL } from './constants.js';

/**
 * 构建缓存键
 * 格式: qname|qtype|qclass|ecs<family>_<prefix>_<ip>|do<0|1>|cd<0|1>
 *
 * 缓存键包含 ECS 维度，因为不同子网可能得到不同的 DNS 响应；
 * CD 位影响 DNSSEC 校验结果（AD 位），同样必须区分。
 */
function buildCacheKey(questions, ecsOption, dnssecOk, checkingDisabled = false) {
  const q = questions[0];
  const parts = [
    q.name,
    q.type || 'A',
    q.class || 'IN'
  ];

  if (ecsOption) {
    parts.push(`ecs${ecsOption.family}_${ecsOption.sourcePrefixLength}_${ecsOption.ip}`);
  } else {
    parts.push('ecsnone');
  }

  parts.push(`do${dnssecOk ? 1 : 0}`);
  parts.push(`cd${checkingDisabled ? 1 : 0}`);

  return parts.join('|');
}

/**
 * 构建 Cache API 用的 Request 对象
 * Cloudflare Cache API 需要 Request 对象作为键
 */
export function buildCacheRequest(cacheKey) {
  const url = CACHE_BASE + encodeURIComponent(cacheKey);
  return new Request(url);
}

/**
 * 从缓存中查找
 * 返回缓存的 Response，或 null（缓存未命中）
 *
 * 缓存里存的是整段 DNS 报文，其中事务 ID 属于写入缓存的第一个请求，
 * 因此命中时必须把 ID 改回本次请求的 ID，否则严格校验 ID 的客户端会丢弃响应。
 *
 * @param {Request} cacheRequest - 缓存键
 * @param {number} requestId - 本次请求的 DNS 事务 ID
 */
export async function getFromCache(cacheRequest, requestId) {
  try {
    const response = await caches.default.match(cacheRequest);
    if (!response) {
      return null;
    }

    const dnsBuffer = Buffer.from(await response.arrayBuffer());
    if (dnsBuffer.length >= 2 && Number.isInteger(requestId)) {
      dnsBuffer.writeUInt16BE(requestId & 0xffff, 0);
    }

    const headers = new Headers(response.headers);
    headers.set('X-Cache', 'HIT');
    headers.set('X-Cache-TTL', response.headers.get('X-Cache-TTL') || 'unknown');

    return new Response(dnsBuffer, { headers });
  } catch (e) {
    // 缓存读取失败不是致命错误，回退到上游查询
    console.error('Cache read error:', e);
  }
  return null;
}

/**
 * 写入缓存
 */
export async function storeInCache(cacheRequest, dnsResponseBuffer, ttl, maxCacheTtl = MAX_CACHE_TTL) {
  try {
    const maxTTL = Math.min(ttl, maxCacheTtl);
    const headers = {
      'Content-Type': 'application/dns-message',
      'Cache-Control': `public, max-age=${maxTTL}, s-maxage=${maxTTL}`,
      'X-Cache-TTL': String(maxTTL),
    };

    const response = new Response(dnsResponseBuffer, { headers });
    await caches.default.put(cacheRequest, response);
  } catch (e) {
    console.error('Cache write error:', e);
  }
}

/**
 * 从 DNS 响应中提取最小 TTL
 * 正响应取所有 answer 的最小 TTL；负响应（NXDOMAIN/NODATA）按 RFC 2308
 * 取 SOA 记录 TTL 与 SOA minimum 的较小值。
 */
export function getMinTTL(decodedResponse) {
  const answerTTLs = (decodedResponse.answers || [])
    .filter((rr) => rr.type !== 'OPT' && typeof rr.ttl === 'number')
    .map((rr) => rr.ttl);

  if (answerTTLs.length > 0) {
    return Math.min(...answerTTLs);
  }

  const soa = (decodedResponse.authorities || []).find((rr) => rr.type === 'SOA');
  if (soa) {
    const soaTTL = typeof soa.ttl === 'number' ? soa.ttl : DEFAULT_TTL;
    const minimum = soa.data && typeof soa.data.minimum === 'number' ? soa.data.minimum : DEFAULT_TTL;
    return Math.max(0, Math.min(soaTTL, minimum));
  }

  return DEFAULT_TTL;
}

export { buildCacheKey };
