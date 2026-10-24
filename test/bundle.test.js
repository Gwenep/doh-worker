import { readFileSync } from 'node:fs';
import { describe, expect, it, vi } from 'vitest';
import { build } from 'esbuild';
import { encode } from 'dns-packet';
import { bundleOptions, BUNDLE_FILE } from '../scripts/bundle.js';
import bundledWorker from '../worker.js';

const root = process.cwd();

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

describe(`单文件产物 ${BUNDLE_FILE}`, () => {
  it('与源码打包结果保持一致（改了 src 记得 npm run build）', async () => {
    const result = await build({ ...bundleOptions({ write: false }), outfile: BUNDLE_FILE });
    const generated = result.outputFiles[0].text.replace(/\r\n/g, '\n').trim();
    const committed = readFileSync(`${root}/${BUNDLE_FILE}`, 'utf8').replace(/\r\n/g, '\n').trim();

    expect(committed).toBe(generated);
  });

  it('是自包含的：没有运行时 import / require，且内置 Buffer polyfill', () => {
    const source = readFileSync(`${root}/${BUNDLE_FILE}`, 'utf8');

    expect(source).not.toMatch(/^\s*import\s.+?from\s+['"]/m);
    expect(source).not.toMatch(/\brequire\(['"]/);
    // buffer polyfill 的特征常量（缺少它说明打包时把 node:buffer 当成了外部依赖）
    expect(source).toContain('INSPECT_MAX_BYTES');
  });

  it('可以独立处理 DoH 请求', async () => {
    const originalCaches = globalThis.caches;
    const originalFetch = globalThis.fetch;

    globalThis.caches = { default: new FakeCache() };
    globalThis.fetch = vi.fn(async (url, init) => {
      const query = Buffer.from(init.body);
      return new Response(encode({
        id: query.readUInt16BE(0),
        type: 'response',
        flags: 0x8180,
        questions: [{ name: 'example.com', type: 'A', class: 'IN' }],
        answers: [{ name: 'example.com', type: 'A', class: 'IN', ttl: 120, data: '93.184.216.34' }],
        authorities: [],
        additionals: [],
      }), { headers: { 'Content-Type': 'application/dns-message' } });
    });

    try {
      const query = encode({
        id: 0x4242,
        type: 'query',
        flags: 0x0100,
        questions: [{ name: 'example.com', type: 'A', class: 'IN' }],
        answers: [],
        authorities: [],
        additionals: [],
      });

      const response = await bundledWorker.fetch(
        new Request(`https://doh.example/?dns=${Buffer.from(query).toString('base64url')}`, {
          headers: { 'CF-Connecting-IP': '203.0.113.55' },
        }),
        {},
        { waitUntil: () => {} },
      );

      expect(response.status).toBe(200);
      expect(response.headers.get('Content-Type')).toBe('application/dns-message');

      const body = Buffer.from(await response.arrayBuffer());
      expect(body.readUInt16BE(0)).toBe(0x4242);
    } finally {
      globalThis.caches = originalCaches;
      globalThis.fetch = originalFetch;
    }
  });
});
