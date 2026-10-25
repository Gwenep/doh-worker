import { describe, expect, it } from 'vitest';
import { resolveConfig } from '../src/config.js';
import { UPSTREAM_URL, UPSTREAM_TIMEOUT_MS, MAX_CACHE_TTL } from '../src/constants.js';

describe('resolveConfig', () => {
  it('默认上游是 Quad9 的 ECS 端点', () => {
    // dns.quad9.net 不发送 ECS，会导致 CDN 按 Quad9 机房位置调度
    expect(UPSTREAM_URL).toBe('https://dns11.quad9.net/dns-query');
  });

  it('没有 env 时使用默认值', () => {
    expect(resolveConfig(undefined)).toEqual({
      upstreamUrl: UPSTREAM_URL,
      upstreamSource: 'default',
      upstreamTimeoutMs: UPSTREAM_TIMEOUT_MS,
      maxCacheTtl: MAX_CACHE_TTL,
      ecsFallback: true,
    });
  });

  it('读取 wrangler.toml [vars] 覆盖项', () => {
    expect(resolveConfig({
      UPSTREAM_DOH_URL: 'https://dns.alidns.com/dns-query',
      UPSTREAM_TIMEOUT_MS: '2000',
      CACHE_TTL_MAX: '600',
      ECS_FALLBACK: '0',
    })).toEqual({
      upstreamUrl: 'https://dns.alidns.com/dns-query',
      upstreamSource: 'env',
      upstreamTimeoutMs: 2000,
      maxCacheTtl: 600,
      ecsFallback: false,
    });
  });

  it('ECS_FALLBACK 支持常见的真假写法', () => {
    expect(resolveConfig({ ECS_FALLBACK: 'false' }).ecsFallback).toBe(false);
    expect(resolveConfig({ ECS_FALLBACK: 'off' }).ecsFallback).toBe(false);
    expect(resolveConfig({ ECS_FALLBACK: 'on' }).ecsFallback).toBe(true);
    expect(resolveConfig({ ECS_FALLBACK: '看不懂' }).ecsFallback).toBe(true);
  });

  it('环境变量会覆盖代码默认值（改 constants.js 对已部署的 Worker 无效）', () => {
    const config = resolveConfig({ UPSTREAM_DOH_URL: 'https://cloudflare-dns.com/dns-query' });

    expect(config.upstreamUrl).toBe('https://cloudflare-dns.com/dns-query');
    expect(config.upstreamSource).toBe('env');
  });

  it('非法数值回退到默认值', () => {
    const config = resolveConfig({ UPSTREAM_TIMEOUT_MS: 'abc', CACHE_TTL_MAX: '-1' });
    expect(config.upstreamTimeoutMs).toBe(UPSTREAM_TIMEOUT_MS);
    expect(config.maxCacheTtl).toBe(MAX_CACHE_TTL);
  });

  it('CACHE_TTL_MAX=0 表示关闭缓存', () => {
    expect(resolveConfig({ CACHE_TTL_MAX: '0' }).maxCacheTtl).toBe(0);
  });
});
