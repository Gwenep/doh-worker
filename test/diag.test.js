import { beforeEach, describe, expect, it, vi } from 'vitest';
import { decode, encode } from 'dns-packet';
import worker from '../src/index.js';

const CLIENT_IP = '203.0.113.55';
const CLIENT_PREFIX = '203.0.113.0/24';

// 模拟权威侧回显：带 ECS 时把收到的子网写进 TXT
function makeEchoResponse(queryBuffer) {
  const query = decode(queryBuffer);
  const question = query.questions[0];
  const opt = (query.additionals || []).find((r) => r.type === 'OPT');
  const ecs = opt ? (opt.options || []).find((o) => o.code === 8) : null;
  const subnet = ecs ? `${ecs.ip}/${ecs.sourcePrefixLength}` : null;

  let answers = [];

  if (question.name === 'whoami.ds.akahelp.net') {
    answers = [{
      name: question.name,
      type: 'TXT',
      class: 'IN',
      ttl: 60,
      data: subnet ? ['ns', '198.51.100.9', 'ecs', subnet] : ['ns', '198.51.100.9'],
    }];
  } else if (question.name === 'o-o.myaddr.l.google.com') {
    answers = [{
      name: question.name,
      type: 'TXT',
      class: 'IN',
      ttl: 60,
      data: [subnet ? `edns0-client-subnet ${subnet}` : '"198.51.100.9"'],
    }];
  } else if (question.type === 'A') {
    // 模拟“按 ECS 调度”的站点：带 ECS 返回 203.0.113.x，不带返回 198.51.100.x
    answers = [{
      name: question.name,
      type: 'A',
      class: 'IN',
      ttl: 60,
      data: subnet && subnet.startsWith('203.0.113') ? '203.0.113.10' : '198.51.100.10',
    }];
  }

  return encode({
    id: query.id,
    type: 'response',
    flags: 0x8180,
    questions: query.questions,
    answers,
    authorities: [],
    additionals: [],
  });
}

let upstreamCalls;

beforeEach(() => {
  upstreamCalls = [];
  globalThis.fetch = vi.fn(async (url, init) => {
    const body = Buffer.from(init.body);
    upstreamCalls.push(decode(body));
    return new Response(makeEchoResponse(body), {
      headers: { 'Content-Type': 'application/dns-message' },
    });
  });
});

function callDiag(path = '/__diag', headers = { 'CF-Connecting-IP': CLIENT_IP }, env = {}) {
  return worker.fetch(new Request(`https://doh.example${path}`, { headers }), env, { waitUntil: () => {} });
}

describe('GET /__diag', () => {
  it('回显当前上游与客户端 ECS 前缀', async () => {
    const response = await callDiag();
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(response.headers.get('Cache-Control')).toBe('no-store');
    expect(body.ok).toBe(true);
    expect(body.upstream).toMatch(/^https:\/\//);
    expect(body.upstreamSource).toBe('default');
    expect(body.ecsForwarded).toBe(true);
    expect(body.client).toEqual({ hasCfConnectingIp: true, ecs: CLIENT_PREFIX });
  });

  it('环境变量覆盖上游时标明来源', async () => {
    const body = await callDiag('/__diag', { 'CF-Connecting-IP': CLIENT_IP }, {
      UPSTREAM_DOH_URL: 'https://cloudflare-dns.com/dns-query',
    }).then((r) => r.json());

    expect(body.upstream).toBe('https://cloudflare-dns.com/dns-query');
    expect(body.upstreamSource).toBe('env');
  });

  it('上游忽略客户端 ECS 时，不把域名误判为“不支持 ECS”', async () => {
    // 模拟 Cloudflare：无论我们传什么，都回显自己的出口子网
    globalThis.fetch = vi.fn(async (url, init) => {
      const query = decode(Buffer.from(init.body));
      const question = query.questions[0];
      const resolverEcs = '2a06:98c0:3600::/56';

      const answers = question.name === 'whoami.ds.akahelp.net'
        ? [{ name: question.name, type: 'TXT', class: 'IN', ttl: 20, data: ['ecs', `${resolverEcs}/56`] }]
        : (question.type === 'A'
          ? [{ name: question.name, type: 'A', class: 'IN', ttl: 60, data: '43.159.77.250' }]
          : []);

      return new Response(encode({
        id: query.id,
        type: 'response',
        flags: 0x8180,
        questions: query.questions,
        answers,
        authorities: [],
        additionals: [],
      }), { headers: { 'Content-Type': 'application/dns-message' } });
    });

    const body = await callDiag('/__diag?domain=nikke-kr.com', { 'CF-Connecting-IP': CLIENT_IP }, {
      UPSTREAM_DOH_URL: 'https://cloudflare-dns.com/dns-query',
    }).then((r) => r.json());

    expect(body.ecsForwarded).toBe(false);
    expect(body.domain.sameAnswer).toBe(true);
    expect(body.hints.join('')).toContain('不使用客户端传入的 ECS');
    expect(body.hints.join('')).toContain('不可用于判断 ECS 敏感性');
    expect(body.hints.join('')).not.toContain('对 ECS 不敏感');
  });

  it('判定 ECS 是否到达权威 DNS', async () => {
    const body = await callDiag().then((r) => r.json());

    expect(body.echo).toHaveLength(2);
    for (const item of body.echo) {
      expect(item.forwarded).toBe(true);
      expect(item.withEcs.sentEcs).toBe(`${CLIENT_PREFIX}/0`);
      expect(item.withEcs.txt).toContain(CLIENT_PREFIX);
      expect(item.withoutEcs.sentEcs).toBe('none');
      expect(item.withoutEcs.txt).not.toContain(CLIENT_PREFIX);
    }
  });

  it('没有 CF-Connecting-IP 时明确报错原因且不注入 ECS', async () => {
    const body = await callDiag('/__diag', {}).then((r) => r.json());

    expect(body.client).toEqual({ hasCfConnectingIp: false, ecs: null });
    expect(body.echo.every((item) => item.forwarded === false)).toBe(true);
    expect(body.hints.join('')).toContain('CF-Connecting-IP');
  });

  it('对比域名在带 / 不带 ECS 下的解析结果', async () => {
    const body = await callDiag('/__diag?domain=cdn.example.com').then((r) => r.json());

    expect(body.domain.sameAnswer).toBe(false);
    expect(body.domain.withEcs.answers[0].data).toBe('203.0.113.10');
    expect(body.domain.withoutEcs.answers[0].data).toBe('198.51.100.10');
    expect(body.hints.join('')).toContain('对 ECS 敏感');
  });

  it('域名忽略 ECS 时判定为不敏感', async () => {
    globalThis.fetch = vi.fn(async (url, init) => {
      const body = Buffer.from(init.body);
      const query = decode(body);
      const question = query.questions[0];

      // 回显服务照常反映 ECS，但业务域名无论带不带 ECS 都返回同一组地址
      if (question.type !== 'A') {
        return new Response(makeEchoResponse(body), {
          headers: { 'Content-Type': 'application/dns-message' },
        });
      }

      return new Response(encode({
        id: query.id,
        type: 'response',
        flags: 0x8180,
        questions: query.questions,
        answers: [{ name: question.name, type: 'A', class: 'IN', ttl: 60, data: '198.51.100.10' }],
        authorities: [],
        additionals: [],
      }), { headers: { 'Content-Type': 'application/dns-message' } });
    });

    const body = await callDiag('/__diag?domain=static.example.com').then((r) => r.json());

    expect(body.ecsForwarded).toBe(true);
    expect(body.domain.sameAnswer).toBe(true);
    expect(body.hints.join('')).toContain('对 ECS 不敏感');
  });

  it('拒绝非法域名与查询类型', async () => {
    expect((await callDiag('/__diag?domain=not a domain')).status).toBe(400);
    expect((await callDiag('/__diag?domain=example.com&type=ANY')).status).toBe(400);
  });

  it('只接受 GET', async () => {
    const response = await worker.fetch(
      new Request('https://doh.example/__diag', { method: 'POST', body: 'x' }),
      {},
      { waitUntil: () => {} },
    );

    expect(response.status).toBe(405);
  });

  it('上游失败时返回 502 并带上上游地址', async () => {
    globalThis.fetch = vi.fn(async () => new Response('boom', { status: 503 }));

    const response = await callDiag();
    const body = await response.json();

    expect(response.status).toBe(502);
    expect(body.ok).toBe(false);
    expect(body.upstream).toMatch(/^https:\/\//);
  });
});
