// src/constants.js
// DoH Worker 默认常量（运行时可通过 wrangler.toml 的 [vars] 覆盖，见 config.js）

// Quad9 的 ECS 端点：dns11.quad9.net (9.9.9.11) 才会把 EDNS Client-Subnet 传给权威 DNS。
// 注意：dns.quad9.net (9.9.9.9) 默认不发送 ECS，用它会让 CDN 按 Quad9 机房位置调度。
export const UPSTREAM_URL = 'https://dns11.quad9.net/dns-query';
export const UPSTREAM_TIMEOUT_MS = 5000;
export const MAX_CACHE_TTL = 86400; // 24 小时
export const DEFAULT_TTL = 60; // 没有 SOA 时负缓存使用的默认 TTL
export const ECS_OPTION_CODE = 8; // CLIENT_SUBNET
export const IPV4_ECS_PREFIX = 24;
export const IPV6_ECS_PREFIX = 48;
export const EDNS_PAYLOAD_SIZE = 1232;
export const MAX_DNS_MESSAGE_SIZE = 65535;
export const CACHE_BASE = 'https://doh-cache/';

// 只有这些 rcode 的响应才允许写入缓存（SERVFAIL/REFUSED 等缓存会放大上游故障）
export const CACHEABLE_RCODES = ['NOERROR', 'NXDOMAIN'];
