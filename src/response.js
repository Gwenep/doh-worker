// src/response.js
// 响应格式化 — 设置 Content-Type、Cache-Control、CORS 头

/**
 * 将 Buffer 编码为 base64url 字符串
 * RFC 4648 base64url（无填充，+ 替换为 -，/ 替换为 _）
 */
export function bufferToBase64url(buf) {
  const base64 = btoa(String.fromCharCode(...new Uint8Array(buf)));
  return base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

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
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Accept',
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
      'Access-Control-Allow-Origin': '*',
      'Cache-Control': 'no-store',
    }
  });
}