import { describe, expect, it } from 'vitest';
import { resolveConfig } from '../src/config.js';
import { UPSTREAM_URL, UPSTREAM_TIMEOUT_MS, MAX_CACHE_TTL } from '../src/constants.js';

describe('resolveConfig', () => {
  it('没有 env 时使用默认值', () => {
    expect(resolveConfig(undefined)).toEqual({
      upstreamUrl: UPSTREAM_URL,
      upstreamTimeoutMs: UPSTREAM_TIMEOUT_MS,
      maxCacheTtl: MAX_CACHE_TTL,
    });
  });

  it('读取 wrangler.toml [vars] 覆盖项', () => {
    expect(resolveConfig({
      UPSTREAM_DOH_URL: 'https://dns.alidns.com/dns-query',
      UPSTREAM_TIMEOUT_MS: '2000',
      CACHE_TTL_MAX: '600',
    })).toEqual({
      upstreamUrl: 'https://dns.alidns.com/dns-query',
      upstreamTimeoutMs: 2000,
      maxCacheTtl: 600,
    });
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
