// src/upstream.js
// 上游 DNS 查询 — 转发到 1.1.1.1 DoH 端点

import { UPSTREAM_URL, UPSTREAM_TIMEOUT_MS } from './constants.js';

/**
 * 向上游 DoH 服务器发送 DNS 查询
 *
 * @param {Buffer} dnsWireFormat - 编码后的 DNS 查询（含 ECS 注入）
 * @returns {Promise<Response>} - 上游的响应
 */
export async function queryUpstream(dnsWireFormat) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), UPSTREAM_TIMEOUT_MS);

  try {
    const response = await fetch(UPSTREAM_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/dns-message',
        'Accept': 'application/dns-message',
      },
      body: dnsWireFormat,
      signal: controller.signal,
    });

    if (!response.ok) {
      throw new Error(`Upstream returned ${response.status}`);
    }

    return response;
  } finally {
    clearTimeout(timeoutId);
  }
}