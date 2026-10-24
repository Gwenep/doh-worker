// src/response.js
// 响应格式化 — 设置 Content-Type、Cache-Control、CORS 头

/**
 * 所有响应共用的 CORS 头（预检响应也会用到）
 */
export const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Accept',
};

/**
 * 格式化 DNS 响应
 *
 * @param {Buffer} dnsWireFormat - DNS 响应线格式数据
 * @param {number} ttl - 缓存 TTL（秒），0 表示不缓存
 * @returns {Response} - HTTP Response
 */
export function formatResponse(dnsWireFormat, ttl) {
  const headers = {
    'Content-Type': 'application/dns-message',
    ...CORS_HEADERS,
    'X-Cache': 'MISS',
  };

  if (ttl > 0) {
    headers['Cache-Control'] = `public, max-age=${ttl}`;
  } else {
    headers['Cache-Control'] = 'no-cache, no-store, must-revalidate';
  }

  return new Response(dnsWireFormat, { headers });
}

/**
 * 构建错误响应
 * 只返回固定文案，内部细节通过 console.error 记录，避免泄露实现信息
 */
export function errorResponse(status, message) {
  const body = JSON.stringify({
    error: true,
    message,
    status
  });

  return new Response(body, {
    status,
    headers: {
      'Content-Type': 'application/json',
      'X-Content-Type-Options': 'nosniff',
      ...CORS_HEADERS,
      'Cache-Control': 'no-store',
    }
  });
}
