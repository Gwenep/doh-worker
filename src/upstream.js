// src/upstream.js
// 上游 DNS 查询 — 转发到配置的 DoH 端点（默认 Quad9）

import { Buffer } from 'buffer';
import { UPSTREAM_URL, UPSTREAM_TIMEOUT_MS } from './constants.js';

/**
 * 向上游 DoH 服务器发送 DNS 查询
 *
 * 响应体在定时器清除之前读完，保证超时覆盖整个请求（上游可能发完响应头后挂住）。
 *
 * @param {Buffer} dnsWireFormat - 编码后的 DNS 查询（含 ECS 注入）
 * @param {{upstreamUrl?: string, upstreamTimeoutMs?: number}} [config]
 * @returns {Promise<Buffer>} - 上游返回的 DNS 报文
 */
export async function queryUpstream(dnsWireFormat, config) {
  const { upstreamUrl = UPSTREAM_URL, upstreamTimeoutMs = UPSTREAM_TIMEOUT_MS } = config || {};

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), upstreamTimeoutMs);

  try {
    const response = await fetch(upstreamUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/dns-message',
        'Accept': 'application/dns-message',
      },
      body: dnsWireFormat,
      signal: controller.signal,
    });

    if (!response.ok) {
      throw new Error(`upstream returned HTTP ${response.status}`);
    }

    const contentType = (response.headers.get('Content-Type') || '').toLowerCase();
    if (contentType && !contentType.includes('application/dns-message')) {
      throw new Error(`unexpected upstream Content-Type: ${contentType}`);
    }

    return Buffer.from(await response.arrayBuffer());
  } finally {
    clearTimeout(timeoutId);
  }
}
