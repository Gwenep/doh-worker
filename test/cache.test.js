import { describe, expect, it } from 'vitest';
import { buildCacheKey, getMinTTL, storeInCache, getFromCache, buildCacheRequest } from '../src/cache.js';

const question = { name: 'example.com', type: 'A', class: 'IN' };

class FakeCache {
  constructor() {
    this.store = new Map();
  }

  async match(request) {
    const response = this.store.get(request.url);
    return response ? response.clone() : undefined;
  }

  async put(request, response) {
    this.store.set(request.url, response.clone());
  }
}

function installFakeCache() {
  const cache = new FakeCache();
  globalThis.caches = { default: cache };
  return cache;
}

describe('buildCacheKey', () => {
  it('没有 ECS 时使用 ecsnone', () => {
    expect(buildCacheKey([question], null, false)).toBe('example.com|A|IN|ecsnone|do0|cd0');
  });

  it('包含 ECS 子网、DO 与 CD 维度', () => {
    const ecs = { family: 1, sourcePrefixLength: 24, ip: '203.0.113.0' };
    expect(buildCacheKey([question], ecs, true, true))
      .toBe('example.com|A|IN|ecs1_24_203.0.113.0|do1|cd1');
  });

  it('包含上游标识，切换上游后不会命中旧缓存', () => {
    expect(buildCacheKey([question], null, false, false, 'dns11.quad9.net'))
      .toBe('dns11.quad9.net|example.com|A|IN|ecsnone|do0|cd0');
  });
});

describe('getMinTTL', () => {
  it('取所有 answer 的最小 TTL', () => {
    expect(getMinTTL({
      answers: [
        { type: 'CNAME', ttl: 300 },
        { type: 'A', ttl: 60 },
      ],
    })).toBe(60);
  });

  it('忽略 OPT 记录', () => {
    expect(getMinTTL({
      answers: [{ type: 'OPT', ttl: 0 }, { type: 'A', ttl: 120 }],
    })).toBe(120);
  });

  it('负缓存使用 SOA TTL 与 minimum 的较小值', () => {
    expect(getMinTTL({
      answers: [],
      authorities: [{ type: 'SOA', ttl: 3600, data: { minimum: 300 } }],
    })).toBe(300);

    expect(getMinTTL({
      answers: [],
      authorities: [{ type: 'SOA', ttl: 60, data: { minimum: 300 } }],
    })).toBe(60);
  });

  it('没有 answer 也没有 SOA 时使用默认 TTL', () => {
    expect(getMinTTL({ answers: [], authorities: [] })).toBe(60);
  });

  it('SOA minimum 为 0 时不缓存', () => {
    expect(getMinTTL({
      answers: [],
      authorities: [{ type: 'SOA', ttl: 3600, data: { minimum: 0 } }],
    })).toBe(0);
  });
});

describe('cache read/write', () => {
  it('命中时把事务 ID 改回本次请求的 ID，并标记 X-Cache', async () => {
    installFakeCache();

    const request = buildCacheRequest('example.com|A|IN|ecsnone|do0|cd0');
    const stored = Buffer.from([0x11, 0x11, 0x81, 0x80, 0, 1, 0, 1, 0, 0, 0, 0]);
    await storeInCache(request, stored, 300);

    const cached = await getFromCache(request, 0xbeef);
    expect(cached.headers.get('X-Cache')).toBe('HIT');
    expect(cached.headers.get('X-Cache-TTL')).toBe('300');

    const body = Buffer.from(await cached.arrayBuffer());
    expect(body.readUInt16BE(0)).toBe(0xbeef);
    expect(body.slice(2)).toEqual(stored.slice(2));
  });

  it('未命中返回 null', async () => {
    installFakeCache();
    expect(await getFromCache(buildCacheRequest('miss'), 1)).toBeNull();
  });

  it('写入时按 maxCacheTtl 截断', async () => {
    const cache = installFakeCache();
    const request = buildCacheRequest('ttl-cap');
    await storeInCache(request, Buffer.from([0, 0]), 86400, 600);

    const stored = await cache.match(request);
    expect(stored.headers.get('X-Cache-TTL')).toBe('600');
    expect(stored.headers.get('Cache-Control')).toContain('max-age=600');
  });
});
