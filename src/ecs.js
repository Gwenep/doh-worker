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
 * 解析 IPv4 地址为 4 个字节，非法时返回 null
 */
function parseIPv4(ip) {
  const parts = String(ip).split('.').map(Number);
  if (parts.length !== 4) {
    return null;
  }
  return parts.every((p) => Number.isInteger(p) && p >= 0 && p <= 255) ? parts : null;
}

/**
 * IPv4 地址掩码
 * 将 IP 地址的前 prefixLength 位保留，其余位清零
 * 例如: maskIPv4('203.0.113.55', 24) → '203.0.113.0'
 * 非法地址（或非法前缀）返回 null
 */
export function maskIPv4(ip, prefixLength = IPV4_ECS_PREFIX) {
  const parts = parseIPv4(ip);
  if (!parts || !Number.isInteger(prefixLength) || prefixLength < 0 || prefixLength > 32) {
    return null;
  }

  const fullBytes = Math.floor(prefixLength / 8);
  const remainder = prefixLength % 8;

  // 非整字节前缀：先保留边界字节的高位，其余清零（RFC 7871 要求前缀外的位为 0）
  if (remainder > 0) {
    parts[fullBytes] &= (0xff << (8 - remainder)) & 0xff;
  }
  for (let i = fullBytes + (remainder > 0 ? 1 : 0); i < 4; i++) {
    parts[i] = 0;
  }

  return parts.join('.');
}

/**
 * 解析 IPv6 地址为 8 个 16 位分组，非法时返回 null
 * 支持 :: 缩写与 IPv4 映射地址（::ffff:203.0.113.5）
 */
function parseIPv6(ip) {
  let addr = String(ip).trim().toLowerCase();
  if (!addr.includes(':')) {
    return null;
  }

  // 把末尾的 IPv4 形式转换成两个 16 位分组
  const v4Match = /(\d{1,3}(?:\.\d{1,3}){3})$/.exec(addr);
  if (v4Match) {
    const v4 = parseIPv4(v4Match[1]);
    if (!v4) {
      return null;
    }
    addr = `${addr.slice(0, -v4Match[1].length)}${((v4[0] << 8) | v4[1]).toString(16)}:${((v4[2] << 8) | v4[3]).toString(16)}`;
  }

  const halves = addr.split('::');
  if (halves.length > 2) {
    return null;
  }

  const left = halves[0] ? halves[0].split(':') : [];
  const right = halves.length === 2 && halves[1] ? halves[1].split(':') : [];
  const missing = 8 - left.length - right.length;

  // 没有 :: 时必须正好 8 组；有 :: 时至少要省略 1 组
  if (missing < 0 || (halves.length === 2 ? missing < 1 : missing !== 0)) {
    return null;
  }

  const groups = [...left, ...Array(missing).fill('0'), ...right];
  if (!groups.every((g) => /^[0-9a-f]{1,4}$/.test(g))) {
    return null;
  }

  return groups.map((g) => parseInt(g, 16));
}

/**
 * 展开 IPv6 地址（处理 :: 缩写）
 * 例如: expandIPv6('2001:db8::1') → '2001:db8:0:0:0:0:0:1'
 * 非法地址返回 null
 */
export function expandIPv6(ip) {
  const groups = parseIPv6(ip);
  return groups ? groups.map((g) => g.toString(16)).join(':') : null;
}

/**
 * IPv6 地址掩码
 * 将 IPv6 地址的前 prefixLength 位保留，其余位清零
 * 例如: maskIPv6('2001:db8:abcd:1234:5678:9abc:def0:1234', 48) → '2001:db8:abcd:0:0:0:0:0'
 * 非法地址（或非法前缀）返回 null
 */
export function maskIPv6(ip, prefixLength = IPV6_ECS_PREFIX) {
  const groups = parseIPv6(ip);
  if (!groups || !Number.isInteger(prefixLength) || prefixLength < 0 || prefixLength > 128) {
    return null;
  }

  const fullGroups = Math.floor(prefixLength / 16);
  const remainder = prefixLength % 16;

  if (remainder > 0) {
    groups[fullGroups] &= (0xffff << (16 - remainder)) & 0xffff;
  }
  for (let i = fullGroups + (remainder > 0 ? 1 : 0); i < 8; i++) {
    groups[i] = 0;
  }

  return groups.map((g) => g.toString(16)).join(':');
}

/**
 * 根据 IP 地址类型自动选择掩码方式
 * 非法 IP 返回 null
 */
export function maskIp(ip, prefixLength) {
  if (String(ip).includes(':')) {
    return maskIPv6(ip, Math.min(prefixLength, 128));
  }
  return maskIPv4(ip, Math.min(prefixLength, 32));
}

function findOptRecord(parsedPacket) {
  return parsedPacket.additionals.find((r) => r.type === 'OPT') || null;
}

function createOptRecord() {
  return {
    name: '.',
    type: 'OPT',
    udpPayloadSize: EDNS_PAYLOAD_SIZE,
    extendedRcode: 0,
    ednsVersion: 0,
    flags: 0,
    options: [],
  };
}

function findClientEcs(optRecord) {
  if (!optRecord) {
    return null;
  }
  // dns-packet 解码后 code 为数字，type 为字符串，两者都兼容
  return optRecord.options.find((o) => o.code === ECS_OPTION_CODE || o.type === 'CLIENT_SUBNET') || null;
}

/**
 * 只保留指定的 ECS 选项，丢弃其余 EDNS 选项（COOKIE/NSID/PADDING 等）。
 * 这些选项只对单次查询有意义，若随响应一起缓存会串给其他客户端。
 */
function keepOnlyEcs(optRecord, ecsOption) {
  if (optRecord) {
    optRecord.options = ecsOption ? [ecsOption] : [];
  }
}

/**
 * 把客户端自带的 ECS 选项规范化为缓存键需要的形状
 * （decode 后的 IP 可能带上前缀之外的非零位）
 */
function normalizeClientEcs(clientEcs) {
  const sourcePrefixLength = Number.isInteger(clientEcs.sourcePrefixLength)
    ? clientEcs.sourcePrefixLength
    : 0;

  return {
    code: ECS_OPTION_CODE,
    ip: maskIp(clientEcs.ip || '', sourcePrefixLength) || clientEcs.ip || '',
    family: clientEcs.family,
    sourcePrefixLength,
    scopePrefixLength: 0,
  };
}

/**
 * 向解码后的 DNS 数据包注入 ECS 选项
 *
 * 规则：
 * - 客户端已用源前缀 0 表示退出 ECS 时，不注入（RFC 7871 §7.1.1）
 * - 客户端自带 ECS 时，使用不超过其声明长度的前缀（RFC 7871 §7.1.2.2）
 * - 始终丢弃 ECS 之外的 EDNS 选项，避免跨客户端缓存污染
 *
 * @param {Object} parsedPacket - dnsPacket.decode() 的结果
 * @param {string|null} clientIp - 客户端真实 IP（来自 CF-Connecting-IP）
 * @returns {Object|null} 实际生效的 ECS 选项，或 null（未使用 ECS）
 */
export function injectECS(parsedPacket, clientIp) {
  const optRecord = findOptRecord(parsedPacket);
  const clientEcs = findClientEcs(optRecord);

  // 没有真实 IP：原样保留客户端自己的 ECS（如果有），仅清理其它选项
  if (!clientIp) {
    keepOnlyEcs(optRecord, clientEcs);
    return clientEcs ? normalizeClientEcs(clientEcs) : null;
  }

  // 客户端明确表示不希望使用 ECS
  if (clientEcs && clientEcs.sourcePrefixLength === 0) {
    keepOnlyEcs(optRecord, null);
    return null;
  }

  const isV6 = clientIp.includes(':');
  const family = isV6 ? 2 : 1; // 1=IPv4, 2=IPv6
  const maxPrefix = isV6 ? IPV6_ECS_PREFIX : IPV4_ECS_PREFIX;

  // 不得使用比客户端声明更长的前缀
  let sourcePrefixLength = maxPrefix;
  if (clientEcs && clientEcs.family === family && Number.isInteger(clientEcs.sourcePrefixLength)) {
    sourcePrefixLength = Math.min(maxPrefix, clientEcs.sourcePrefixLength);
  }

  const maskedIp = sourcePrefixLength > 0 ? maskIp(clientIp, sourcePrefixLength) : null;
  if (!maskedIp) {
    // IP 非法或前缀为 0：退回客户端自带 ECS（如有），不注入
    keepOnlyEcs(optRecord, clientEcs);
    return clientEcs ? normalizeClientEcs(clientEcs) : null;
  }

  const ecsOption = {
    code: ECS_OPTION_CODE,
    ip: maskedIp,
    sourcePrefixLength,
    scopePrefixLength: 0,
    family,
  };

  if (!optRecord) {
    parsedPacket.additionals.push(createOptRecord());
  }
  keepOnlyEcs(findOptRecord(parsedPacket), ecsOption);

  return ecsOption;
}

/**
 * 获取 DNSSEC OK 位状态
 */
export function getDnssecOk(parsedPacket) {
  const optRecord = findOptRecord(parsedPacket);
  if (optRecord) {
    return !!(optRecord.flags & (1 << 15));
  }
  return false;
}
