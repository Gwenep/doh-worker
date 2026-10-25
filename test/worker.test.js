import { beforeEach, describe, expect, it, vi } from 'vitest';
import { decode, encode } from 'dns-packet';
import worker from '../src/index.js';

const CLIENT_IP = '203.0.113.55';

const RD = 0x0100;
const RA = 0x0080;
const TC = 0x0200;
const CD = 0x0010;

class FakeCache {
  constructor() {
    this.store = new Map();
    this.putCount = 0;
  }

  async match(request) {
    const response = this.store.get(request.url);
    return response ? response.clone() : undefined;
  }

  async put(request, response) {
    this.putCount += 1;
    this.store.set(request.url, response.clone());
  }
}

let cache;
let upstreamBodies;

function makeQuery({ id = 0x1234, name = 'example.com', type = 'A', flags = RD, additionals = [], questions } = {}) {
  return encode({
    id,
    type: 'query',
    flags,
    questions: questions || [{ name, type, class: 'IN' }],
    answers: [],
    authorities: [],
    additionals,
  });
}

function makeUpstreamResponse(queryBuffer, { ttl = 300, rcode = 0, flags = RA } = {}) {
  const query = decode(queryBuffer);
  return encode({
    id: query.id,
    type: 'response',
    flags: flags | rcode,
    questions: query.questions,
    answers: rcode === 0
      ? [{ name: query.questions[0].name, type: 'A', class: 'IN', ttl, data: '93.184.216.34' }]
      : [],
    authorities: [],
    additionals: [],
  });
}

function callWorker({ method = 'GET', body, headers = {}, env = {} } = {}) {
  const waitUntil = [];
  const ctx = { waitUntil: (promise) => waitUntil.push(promise) };
  const requestHeaders = { 'CF-Connecting-IP': CLIENT_IP, ...headers };
  const request = method === 'GET'
    ? new Request(`https://doh.example/?dns=${Buffer.from(body).toString('base64url')}`, { headers: requestHeaders })
    : new Request('https://doh.example/', { method, headers: requestHeaders, body });

  return worker.fetch(request, env, ctx).then(async (response) => {
    await Promise.all(waitUntil);
    return response;
  });
}

beforeEach(() => {
  cache = new FakeCache();
  upstreamBodies = [];
  globalThis.caches = { default: cache };

  globalThis.fetch = vi.fn(async (url, init) => {
    const body = Buffer.from(init.body);
    upstreamBodies.push(body);
    return new Response(makeUpstreamResponse(body), {
      headers: { 'Content-Type': 'application/dns-message' },
    });
  });
});

describe('GET 请求', () => {
  it('返回 DNS 响应并写入缓存', async () => {
    const response = await callWorker({ body: makeQuery() });

    expect(response.status).toBe(200);
    expect(response.headers.get('Content-Type')).toBe('application/dns-message');
    expect(response.headers.get('X-Cache')).toBe('MISS');
    expect(cache.putCount).toBe(1);

    const dns = decode(Buffer.from(await response.arrayBuffer()));
    expect(dns.answers[0].data).toBe('93.184.216.34');
  });

  it('缓存命中时不再访问上游，并把事务 ID 改回本次请求的 ID', async () => {
    await callWorker({ body: makeQuery({ id: 0x1234 }) });
    const hit = await callWorker({ body: makeQuery({ id: 0xabcd }) });

    expect(upstreamBodies).toHaveLength(1);
    expect(hit.headers.get('X-Cache')).toBe('HIT');

    const dns = decode(Buffer.from(await hit.arrayBuffer()));
    expect(dns.id).toBe(0xabcd);
    expect(dns.questions[0].name).toBe('example.com');
  });

  it('注入 ECS 后再查询上游', async () => {
    await callWorker({ body: makeQuery() });

    const upstream = decode(upstreamBodies[0]);
    const opt = upstream.additionals.find((rr) => rr.type === 'OPT');
    expect(opt.options).toHaveLength(1);
    expect(opt.options[0]).toMatchObject({
      family: 1,
      ip: '203.0.113.0',
      sourcePrefixLength: 24,
    });
  });

  it('尊重客户端声明的更短 ECS 前缀', async () => {
    const additionals = [{
      name: '.',
      type: 'OPT',
      udpPayloadSize: 1232,
      extendedRcode: 0,
      ednsVersion: 0,
      flags: 0,
      options: [{ code: 8, family: 1, ip: '198.51.100.0', sourcePrefixLength: 16, scopePrefixLength: 0 }],
    }];

    await callWorker({ body: makeQuery({ additionals }) });

    const opt = decode(upstreamBodies[0]).additionals.find((rr) => rr.type === 'OPT');
    expect(opt.options[0]).toMatchObject({ ip: '203.0.0.0', sourcePrefixLength: 16 });
  });

  it('客户端 /0 退出 ECS 时不向上游发送 ECS', async () => {
    const additionals = [{
      name: '.',
      type: 'OPT',
      udpPayloadSize: 1232,
      extendedRcode: 0,
      ednsVersion: 0,
      flags: 0,
      options: [{ code: 8, family: 1, ip: '0.0.0.0', sourcePrefixLength: 0, scopePrefixLength: 0 }],
    }];

    await callWorker({ body: makeQuery({ additionals }) });

    const opt = decode(upstreamBodies[0]).additionals.find((rr) => rr.type === 'OPT');
    expect(opt.options).toHaveLength(0);
  });

  it('不向上游转发 COOKIE 等 EDNS 选项', async () => {
    const additionals = [{
      name: '.',
      type: 'OPT',
      udpPayloadSize: 1232,
      extendedRcode: 0,
      ednsVersion: 0,
      flags: 0,
      options: [{ code: 10, data: Buffer.from('cookie!!') }],
    }];

    await callWorker({ body: makeQuery({ additionals }) });

    const opt = decode(upstreamBodies[0]).additionals.find((rr) => rr.type === 'OPT');
    expect(opt.options).toHaveLength(1);
    expect(opt.options[0].code).toBe(8);
  });

  it('CD 位不同的请求不会共用缓存', async () => {
    await callWorker({ body: makeQuery({ flags: RD }) });
    await callWorker({ body: makeQuery({ flags: RD | CD }) });

    expect(upstreamBodies).toHaveLength(2);
    expect(cache.putCount).toBe(2);
  });

  it('切换上游后不会命中旧上游的缓存', async () => {
    await callWorker({ body: makeQuery(), env: { UPSTREAM_DOH_URL: 'https://dns11.quad9.net/dns-query' } });
    await callWorker({ body: makeQuery(), env: { UPSTREAM_DOH_URL: 'https://dns.google/dns-query' } });

    expect(upstreamBodies).toHaveLength(2);
    expect(cache.putCount).toBe(2);
  });

  it('缺少 dns 参数返回 400', async () => {
    const response = await worker.fetch(new Request('https://doh.example/'), {}, { waitUntil: () => {} });
    expect(response.status).toBe(400);
  });
});

describe('POST 请求', () => {
  it('接受 application/dns-message', async () => {
    const response = await callWorker({
      method: 'POST',
      body: makeQuery(),
      headers: { 'Content-Type': 'application/dns-message' },
    });
    expect(response.status).toBe(200);
    expect(upstreamBodies).toHaveLength(1);
  });

  it('拒绝错误的 Content-Type', async () => {
    const response = await callWorker({
      method: 'POST',
      body: makeQuery(),
      headers: { 'Content-Type': 'text/plain' },
    });
    expect(response.status).toBe(400);
    expect(upstreamBodies).toHaveLength(0);
  });
});

describe('输入校验', () => {
  it('拒绝 QDCOUNT=0 的查询', async () => {
    const response = await callWorker({ body: makeQuery({ questions: [] }) });
    expect(response.status).toBe(400);
  });

  it('拒绝多问题查询', async () => {
    const questions = [
      { name: 'example.com', type: 'A', class: 'IN' },
      { name: 'example.net', type: 'A', class: 'IN' },
    ];
    const response = await callWorker({ body: makeQuery({ questions }) });
    expect(response.status).toBe(400);
    expect(upstreamBodies).toHaveLength(0);
  });

  it('拒绝非 QUERY 操作码（如 UPDATE）', async () => {
    const response = await callWorker({ body: makeQuery({ flags: RD | (5 << 11) }) });
    expect(response.status).toBe(400);
  });

  it('非法 base64url 返回 400', async () => {
    const response = await worker.fetch(
      new Request('https://doh.example/?dns=***'),
      {},
      { waitUntil: () => {} },
    );
    expect(response.status).toBe(400);
  });
});

describe('缓存策略', () => {
  it('不缓存 SERVFAIL', async () => {
    globalThis.fetch = vi.fn(async (url, init) => {
      const body = Buffer.from(init.body);
      upstreamBodies.push(body);
      return new Response(makeUpstreamResponse(body, { rcode: 2, flags: RA }), {
        headers: { 'Content-Type': 'application/dns-message' },
      });
    });

    await callWorker({ body: makeQuery() });
    await callWorker({ body: makeQuery({ id: 0x7777 }) });

    expect(cache.putCount).toBe(0);
    expect(upstreamBodies).toHaveLength(2);
  });

  it('不缓存截断（TC=1）响应', async () => {
    globalThis.fetch = vi.fn(async (url, init) => {
      const body = Buffer.from(init.body);
      upstreamBodies.push(body);
      return new Response(makeUpstreamResponse(body, { flags: RA | TC }), {
        headers: { 'Content-Type': 'application/dns-message' },
      });
    });

    await callWorker({ body: makeQuery() });

    expect(cache.putCount).toBe(0);
  });

  it('上游失败时返回 502 且不泄露内部细节', async () => {
    globalThis.fetch = vi.fn(async () => new Response('boom', { status: 500 }));

    const response = await callWorker({ body: makeQuery() });

    expect(response.status).toBe(502);
    const body = await response.json();
    expect(body.message).toBe('Upstream DNS query failed');
  });

  it('上游返回错误 Content-Type 时拒绝转发', async () => {
    globalThis.fetch = vi.fn(async () => new Response('<html>oops</html>', {
      headers: { 'Content-Type': 'text/html' },
    }));

    const response = await callWorker({ body: makeQuery() });
    expect(response.status).toBe(502);
  });
});

describe('路由', () => {
  it('非根路径返回 404', async () => {
    const response = await worker.fetch(new Request('https://doh.example/foo'), {}, { waitUntil: () => {} });
    expect(response.status).toBe(404);
  });

  it('OPTIONS 预检在任何路径都返回 CORS 头', async () => {
    const response = await worker.fetch(
      new Request('https://doh.example/foo', { method: 'OPTIONS' }),
      {},
      { waitUntil: () => {} },
    );
    expect(response.status).toBe(200);
    expect(response.headers.get('Access-Control-Allow-Origin')).toBe('*');
  });

  it('不支持的方法返回 405', async () => {
    const response = await worker.fetch(
      new Request('https://doh.example/', { method: 'PUT', body: 'x' }),
      {},
      { waitUntil: () => {} },
    );
    expect(response.status).toBe(405);
  });
});

describe('ECS ���ˣ�127.0.0.1 �ܾ���', () => {
  function mockBlockedByEcs() {
    globalThis.fetch = vi.fn(async (url, init) => {
      const body = Buffer.from(init.body);
      upstreamBodies.push(body);

      const query = decode(body);
      const opt = (query.additionals || []).find((r) => r.type === 'OPT');
      const hasEcs = !!(opt && (opt.options || []).some((o) => o.code === 8));

      return new Response(encode({
        id: query.id,
        type: 'response',
        flags: RA,
        questions: query.questions,
        answers: [{
          name: query.questions[0].name,
          type: 'A',
          class: 'IN',
          ttl: 60,
          data: hasEcs ? '127.0.0.1' : '43.174.32.224',
        }],
        authorities: [],
        additionals: [],
      }), { headers: { 'Content-Type': 'application/dns-message' } });
    });
  }

  it('�� ECS �õ� 127.0.0.1 ʱ�Զ����ò��� ECS �Ĳ�ѯ', async () => {
    mockBlockedByEcs();

    const response = await callWorker({ body: makeQuery() });
    const decoded = decode(Buffer.from(await response.arrayBuffer()));

    expect(upstreamBodies).toHaveLength(2);
    const retryOpt = decode(upstreamBodies[1]).additionals.find((r) => r.type === 'OPT');
    expect(retryOpt.options.some((o) => o.code === 8)).toBe(false);
    expect(decoded.answers[0].data).toBe('43.174.32.224');
  });

  it('ECS_FALLBACK=0 ʱ�������ε� 127.0.0.1', async () => {
    mockBlockedByEcs();

    const response = await callWorker({ body: makeQuery(), env: { ECS_FALLBACK: '0' } });
    const decoded = decode(Buffer.from(await response.arrayBuffer()));

    expect(upstreamBodies).toHaveLength(1);
    expect(decoded.answers[0].data).toBe('127.0.0.1');
  });

  it('������Ӧ���ᴥ������', async () => {
    const response = await callWorker({ body: makeQuery() });
    const decoded = decode(Buffer.from(await response.arrayBuffer()));

    expect(upstreamBodies).toHaveLength(1);
    expect(decoded.answers[0].data).toBe('93.184.216.34');
  });
});
