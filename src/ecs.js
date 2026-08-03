// src/ecs.js
// ECS (EDNS Client Subnet) 注入逻辑
// 从 CF-Connecting-IP 获取访客真实 IP，掩码后注入 DNS 查询的 OPT 伪记录

import { ECS_OPTION_CODE, IPV4_ECS_PREFIX, IPV6_ECS_PREFIX, EDNS_PAYLOAD_SIZE } from './constants.js';

/**
 * 从请求头获取客户端真实 IP
 * Cloudflare 在 CF-Connecting-IP 头中提供访客 IP
 */
export function getClientIp(request) {
  return request.headers.get('CF-Connecting-IP') || null;
}

/**
 * IPv4 地址掩码
 * 将 IP 地址的前 prefixLength 位保留，其余位清零
 * 例如: maskIPv4('203.0.113.55', 24) → '203.0.113.0'
 */
export function maskIPv4(ip, prefixLength = IPV4_ECS_PREFIX) {
  const parts = ip.split('.').map(Number);
  const bytes = Math.ceil(prefixLength / 8);
  for (let i = bytes; i < 4; i++) {
    parts[i] = 0;
  }
  return parts.join('.');
}

/**
 * 展开 IPv6 地址（处理 :: 缩写）
 * 例如: expandIPv6('2001:db8::1') → '2001:db8:0:0:0:0:0:1'
 */
export function expandIPv6(ip) {
  if (ip.includes('::')) {
    const parts = ip.split('::');
    const left = parts[0] ? parts[0].split(':') : [];
    const right = parts[1] ? parts[1].split(':') : [];
    const missing = 8 - left.length - right.length;
    return [...left, ...Array(missing).fill('0'), ...right].join(':');
  }
  return ip;
}

/**
 * IPv6 地址掩码
 * 将 IPv6 地址的前 prefixLength 位保留，其余位清零
 * 例如: maskIPv6('2001:db8:abcd:1234:5678:9abc:def0:1234', 48) → '2001:db8:abcd:0:0:0:0:0'
 */
export function maskIPv6(ip, prefixLength = IPV6_ECS_PREFIX) {
  const expanded = expandIPv6(ip);
  const groups = expanded.split(':').map(h => parseInt(h, 16));
  const bytes = Math.ceil(prefixLength / 16);
  for (let i = bytes; i < 8; i++) {
    groups[i] = 0;
  }
  return groups.map(g => g.toString(16)).join(':');
}

/**
 * 根据 IP 地址类型自动选择掩码方式
 */
export function maskIp(clientIp, prefixLength) {
  if (clientIp.includes(':')) {
    return maskIPv6(clientIp, Math.min(prefixLength, IPV6_ECS_PREFIX));
  }
  return maskIPv4(clientIp, Math.min(prefixLength, IPV4_ECS_PREFIX));
}

/**
 * 向解码后的 DNS 数据包注入 ECS 选项
 *
 * @param {Object} parsedPacket - dnsPacket.decode() 的结果
 * @param {string} clientIp - 客户端真实 IP（来自 CF-Connecting-IP）
 * @returns {Object|null} 注入的 ECS 选项对象，或 null（跳过 ECS）
 */
export function injectECS(parsedPacket, clientIp) {
  if (!clientIp) {
    return null; // 没有真实 IP，跳过 ECS
  }

  const isV6 = clientIp.includes(':');
  const family = isV6 ? 2 : 1; // 1=IPv4, 2=IPv6
  const sourcePrefixLength = isV6 ? IPV6_ECS_PREFIX : IPV4_ECS_PREFIX;
  const maskedIp = maskIp(clientIp, sourcePrefixLength);

  // 查找或创建 OPT 伪记录
  let optRecord = parsedPacket.additionals.find(r => r.type === 'OPT');

  if (!optRecord) {
    // 创建新的 OPT 记录
    optRecord = {
      name: '.',
      type: 'OPT',
      udpPayloadSize: EDNS_PAYLOAD_SIZE,
      extendedRcode: 0,
      ednsVersion: 0,
      flags: 0,
      options: []
    };
    parsedPacket.additionals.push(optRecord);
  }

  // 删除现有的 ECS 选项（如果有的话）
  optRecord.options = optRecord.options.filter(o => {
    const code = typeof o.code === 'number' ? o.code : 0;
    return code !== ECS_OPTION_CODE;
  });

  // 添加新的 ECS 选项
  const ecsOption = {
    code: ECS_OPTION_CODE,
    ip: maskedIp,
    sourcePrefixLength,
    scopePrefixLength: 0,
    family
  };

  optRecord.options.push(ecsOption);

  return ecsOption;
}

/**
 * 获取 DNSSEC OK 位状态
 */
export function getDnssecOk(parsedPacket) {
  const optRecord = parsedPacket.additionals.find(r => r.type === 'OPT');
  if (optRecord) {
    return !!(optRecord.flags & (1 << 15));
  }
  return false;
}