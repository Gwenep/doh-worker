// src/doh.js
// DoH 协议解析 — GET ?dns=base64url 和 POST application/dns-message

import { MAX_DNS_MESSAGE_SIZE } from './constants.js';

/**
 * 将 base64url 字符串解码为 Buffer
 * RFC 4648 base64url（无填充，- 替换 +，_ 替换 /）
 */
export function base64urlToBuffer(base64url) {
  if (!/^[A-Za-z0-9_-]+$/.test(base64url)) {
    throw new Error('dns parameter is not valid base64url');
  }

  let base64 = base64url.replace(/-/g, '+').replace(/_/g, '/');
  while (base64.length % 4 !== 0) {
    base64 += '=';
  }

  const binaryStr = atob(base64);
  const bytes = new Uint8Array(binaryStr.length);
  for (let i = 0; i < binaryStr.length; i++) {
    bytes[i] = binaryStr.charCodeAt(i);
  }
  return Buffer.from(bytes);
}

/**
 * 解析 GET 请求的 ?dns=base64url 参数
 */
export function parseGetRequest(url) {
  const dnsParam = url.searchParams.get('dns');
  if (!dnsParam) {
    throw new Error('Missing dns query parameter');
  }
  if (dnsParam.length > 2048) {
    throw new Error('dns parameter too long');
  }
  return base64urlToBuffer(dnsParam);
}

/**
 * 解析 POST 请求的 application/dns-message body
 */
export async function parsePostRequest(request) {
  const contentType = (request.headers.get('Content-Type') || '').split(';')[0].trim().toLowerCase();
  if (contentType && contentType !== 'application/dns-message') {
    throw new Error('Unsupported Content-Type — expected application/dns-message');
  }

  // 先看声明的长度，避免把超大 body 整个读进内存
  const declaredLength = Number(request.headers.get('Content-Length'));
  if (Number.isFinite(declaredLength) && declaredLength > MAX_DNS_MESSAGE_SIZE) {
    throw new Error('DNS message too large');
  }

  const body = Buffer.from(await request.arrayBuffer());
  if (body.length === 0) {
    throw new Error('Empty POST body');
  }
  if (body.length > MAX_DNS_MESSAGE_SIZE) {
    throw new Error('DNS message too large');
  }
  return body;
}
