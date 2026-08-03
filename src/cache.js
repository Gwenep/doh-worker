// src/cache.js
// 缓存键构建 & Cloudflare Cache API 读写

import { CACHE_BASE, MAX_CACHE_TTL } from './constants.js';

/**
 * 构建缓存键
 * 格式: qname|qtype|qclass|ecs<family>_<prefix>_<ip>|do<0|1>
 *
 * 缓存键包含 ECS 维度，因为不同子网可能得到不同的 DNS 响应
 */
function buildCacheKey(questions, ecsOption, dnssecOk) {
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
 */
export async function getFromCache(cacheRequest) {
  try {
    const response = await caches.default.match(cacheRequest);
    if (response) {
      const newResponse = new Response(response.body, response);
      newResponse.headers.set('X-Cache', 'HIT');
      newResponse.headers.set('X-Cache-TTL', response.headers.get('X-Cache-TTL') || 'unknown');
      return newResponse;
    }
  } catch (e) {
    // 缓存读取失败不是致命错误，回退到上游查询
    console.error('Cache read error:', e);
  }
  return null;
}

/**
 * 写入缓存
 */
export async function storeInCache(cacheRequest, dnsResponseBuffer, ttl) {
  try {
    const maxTTL = Math.min(ttl, MAX_CACHE_TTL);
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
 */
export function getMinTTL(decodedResponse) {
  if (decodedResponse.answers.length === 0) {
    return 60; // NXDOMAIN 或空响应的默认 TTL
  }

  let minTTL = Infinity;
  for (const answer of decodedResponse.answers) {
    if (answer.type === 'OPT') continue;
    if (answer.ttl < minTTL) {
      minTTL = answer.ttl;
    }
  }
  return minTTL;
}

export { buildCacheKey };