// src/constants.js
// DoH Worker 常量定义

export const UPSTREAM_URL = 'https://dns.quad9.net/dns-query';
export const UPSTREAM_TIMEOUT_MS = 5000;
export const MAX_CACHE_TTL = 86400; // 24 小时
export const DEFAULT_TTL = 60; // NXDOMAIN 或空响应的默认 TTL
export const ECS_OPTION_CODE = 8; // CLIENT_SUBNET
export const IPV4_ECS_PREFIX = 24;
export const IPV6_ECS_PREFIX = 48;
export const EDNS_PAYLOAD_SIZE = 1232;
export const MAX_DNS_MESSAGE_SIZE = 65535;
export const CACHE_BASE = 'https://doh-cache/';