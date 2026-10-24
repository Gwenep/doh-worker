// 一次性验证：在真实 workerd 运行时里、且不开启 nodejs_compat 的情况下运行 worker.js
import { Miniflare } from 'miniflare';
import { encode } from 'dns-packet';
import { Buffer } from 'node:buffer';

const mf = new Miniflare({
  modules: true,
  scriptPath: 'worker.js',
  compatibilityDate: '2025-04-01',
  // 注意：这里故意不设置 compatibilityFlags: ['nodejs_compat']
  outboundService: async (request) => {
    const query = Buffer.from(await request.arrayBuffer());
    return new Response(encode({
      id: query.readUInt16BE(0),
      type: 'response',
      flags: 0x8180,
      questions: [{ name: 'example.com', type: 'A', class: 'IN' }],
      answers: [{ name: 'example.com', type: 'A', class: 'IN', ttl: 120, data: '93.184.216.34' }],
      authorities: [],
      additionals: [],
    }), { headers: { 'Content-Type': 'application/dns-message' } });
  },
});

const query = encode({
  id: 0x4242,
  type: 'query',
  flags: 0x0100,
  questions: [{ name: 'example.com', type: 'A', class: 'IN' }],
  answers: [],
  authorities: [],
  additionals: [],
});

const response = await mf.dispatchFetch(
  `https://doh.example/?dns=${Buffer.from(query).toString('base64url')}`,
  { headers: { 'CF-Connecting-IP': '203.0.113.55' } },
);

console.log('status:', response.status);
console.log('content-type:', response.headers.get('Content-Type'));

const body = Buffer.from(await response.arrayBuffer());
console.log('id:', body.readUInt16BE(0).toString(16));
console.log('answers:', body.length);

await mf.dispose();
