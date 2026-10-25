// src/diag.js
// 诊断接口 /__diag —— 用浏览器打开即可确认 ECS 是否真的到达权威 DNS
//
// 只回显掩码后的子网，不输出完整客户端 IP。
//
//   /__diag                          → 看部署版本、当前上游、ECS 是否被权威 DNS 收到
//   /__diag?domain=example.com       → 对比同一域名“带 ECS / 不带 ECS”的解析结果
//   /__diag?domain=example.com&type=AAAA

import { Buffer } from 'buffer';
import { decode, encode } from 'dns-packet';
import { getClientIp, injectECS, maskIp } from './ecs.js';
import { queryUpstream } from './upstream.js';
import { errorResponse, CORS_HEADERS } from './response.js';
import { ECS_OPTION_CODE, EDNS_PAYLOAD_SIZE, IPV4_ECS_PREFIX, IPV6_ECS_PREFIX } from './constants.js';

export const DIAG_PATH = '/__diag';

// 两个权威侧回显服务：Akamai 与 Google
const ECHO_TARGETS = [
  { key: 'akamai', name: 'whoami.ds.akahelp.net' },
  { key: 'google', name: 'o-o.myaddr.l.google.com' },
];

const ALLOWED_TYPES = new Set(['A', 'AAAA', 'CNAME', 'TXT', 'MX', 'NS', 'SOA', 'SRV', 'HTTPS', 'PTR']);
const DOMAIN_PATTERN = /^[a-z0-9_]([a-z0-9_-]*[a-z0-9_])?(\.[a-z0-9_]([a-z0-9_-]*[a-z0-9_])?)*$/i;

// 已知上游对“客户端自带 ECS”的态度，用于在诊断里给出更准确的结论
const UPSTREAM_NOTES = {
  'cloudflare-dns.com': 'Cloudflare 的 1.1.1.1 不使用客户端传入的 ECS，只按它自己的出口地址调度（对少数域名会插入自己的子网）。',
  '1.1.1.1': 'Cloudflare 的 1.1.1.1 不使用客户端传入的 ECS。',
  'dns.quad9.net': 'Quad9 的默认端点 9.9.9.9 不发送 ECS，换成 dns11.quad9.net（9.9.9.11）才会转发。',
  'dns.google': 'Google Public DNS 会转发 ECS，但拒绝 Akamai 等部分域名的 ECS，且不接受比 /24 更细的 IPv4 前缀。',
  'dns.alidns.com': '阿里 DoH 主要按来源 IP 调度，不保证使用客户端传入的 ECS。',
  'doh.pub': '腾讯 DoH 主要按来源 IP 调度，不保证使用客户端传入的 ECS。',
};

function formatEcs(option) {
  if (!option) {
    return 'none';
  }
  return `${option.ip}/${option.sourcePrefixLength}/${option.scopePrefixLength ?? 0}`;
}

function txtParts(answers) {
  return (answers || [])
    .filter((r) => r.type === 'TXT')
    .map((r) => (r.data || []).map((part) => Buffer.from(part).toString('utf8')).join(' '));
}

function recordData(record) {
  if (record.type === 'TXT') {
    return (record.data || []).map((part) => Buffer.from(part).toString('utf8')).join(' ');
  }
  return typeof record.data === 'string' ? record.data : JSON.stringify(record.data);
}

function buildQuery(name, type, clientIp, useEcs) {
  const packet = {
    id: Math.floor(Math.random() * 0x10000),
    type: 'query',
    flags: 0x0100,
    questions: [{ name, type, class: 'IN' }],
    answers: [],
    authorities: [],
    additionals: [{
      name: '.',
      type: 'OPT',
      udpPayloadSize: EDNS_PAYLOAD_SIZE,
      extendedRcode: 0,
      ednsVersion: 0,
      flags: 0,
      options: [],
    }],
  };

  // clientIp 传 null 表示这次故意不注入 ECS（对照组）
  const ecs = injectECS(packet, useEcs ? clientIp : null);
  return { wire: encode(packet), ecs };
}

async function ask(name, type, clientIp, useEcs, config) {
  const startedAt = Date.now();
  const { wire, ecs } = buildQuery(name, type, clientIp, useEcs);
  const buffer = await queryUpstream(wire, config);
  const elapsedMs = Date.now() - startedAt;
  const response = decode(buffer);
  const opt = (response.additionals || []).find((r) => r.type === 'OPT');
  const ecsOption = opt
    ? (opt.options || []).find((o) => o.code === ECS_OPTION_CODE || o.type === 'CLIENT_SUBNET')
    : null;

  return {
    elapsedMs,
    rcode: response.rcode,
    sentEcs: ecs ? formatEcs(ecs) : 'none',
    responseEcs: formatEcs(ecsOption),
    txt: txtParts(response.answers).join(' | '),
    answers: (response.answers || []).map((r) => ({
      name: r.name,
      type: r.type,
      ttl: r.ttl,
      data: recordData(r),
    })),
  };
}

function addressKey(result) {
  return result.answers
    .filter((a) => a.type === 'A' || a.type === 'AAAA' || a.type === 'CNAME')
    .map((a) => `${a.type}:${a.data}`)
    .sort()
    .join(',');
}

function json(body, status = 200) {
  return new Response(JSON.stringify(body, null, 2), {
    status,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'no-store',
      'X-Content-Type-Options': 'nosniff',
      ...CORS_HEADERS,
    },
  });
}

/**
 * 处理 /__diag 请求
 *
 * @param {Request} request
 * @param {URL} url
 * @param {{upstreamUrl: string, upstreamTimeoutMs: number, maxCacheTtl: number}} config
 */
export async function handleDiagnostic(request, url, config) {
  if (request.method !== 'GET') {
    return errorResponse(405, 'Method Not Allowed — /__diag only supports GET');
  }

  const clientIp = getClientIp(request);
  const prefix = clientIp
    ? (clientIp.includes(':') ? IPV6_ECS_PREFIX : IPV4_ECS_PREFIX)
    : null;
  const maskedIp = clientIp && prefix ? maskIp(clientIp, prefix) : null;
  const expectedEcs = maskedIp ? `${maskedIp}/${prefix}` : null;

  let upstreamHost = '';
  try {
    upstreamHost = new URL(config.upstreamUrl).host;
  } catch (e) {
    upstreamHost = '';
  }
  const upstreamSource = config.upstreamSource || 'default';

  const hints = [];
  if (!clientIp) {
    hints.push('没有收到 CF-Connecting-IP：说明请求没有经过已部署的 Worker（本地 wrangler dev、反向代理丢了请求头，或客户端连的不是 Worker）。这种情况下不会注入 ECS。');
  }

  let echo;
  try {
    echo = await Promise.all(ECHO_TARGETS.map(async (target) => {
      const [withEcs, withoutEcs] = await Promise.all([
        ask(target.name, 'TXT', clientIp, true, config),
        ask(target.name, 'TXT', clientIp, false, config),
      ]);

      return {
        service: target.key,
        name: target.name,
        forwarded: expectedEcs ? withEcs.txt.includes(expectedEcs) : false,
        withEcs,
        withoutEcs,
      };
    }));
  } catch (e) {
    return json({
      ok: false,
      error: `查询回显服务失败: ${e.message}`,
      upstream: config.upstreamUrl,
      upstreamSource,
      client: { hasCfConnectingIp: !!clientIp, ecs: expectedEcs },
      hints,
    }, 502);
  }

  const forwardedCount = echo.filter((item) => item.forwarded).length;
  const ecsForwarded = forwardedCount > 0;

  if (expectedEcs && ecsForwarded) {
    hints.push(`ECS 已到达权威 DNS：权威服务器看到的客户端子网是 ${expectedEcs}。所以“透传”本身是生效的；某些域名仍慢，说明该域名的权威 DNS/CDN 忽略 ECS，或者慢与 DNS 解析结果无关。`);
  } else if (expectedEcs) {
    hints.push(`权威 DNS 没有看到 ${expectedEcs}，withEcs.txt 里显示的是权威服务器实际收到的值。`);
    if (UPSTREAM_NOTES[upstreamHost]) {
      hints.push(`当前上游 ${upstreamHost}：${UPSTREAM_NOTES[upstreamHost]}`);
    }
    hints.push('另外，若 upstreamSource 是 env，说明控制台 / wrangler 里配置的 UPSTREAM_DOH_URL 正在覆盖代码默认值——改 src/constants.js 不会生效。');
  }

  if (clientIp && maskedIp) {
    hints.push(`注意：client.ecs 是 Worker 看到的来源子网。如果它不是你本地宽带的出口地址（例如云厂商 / 代理的地址），说明 DoH 请求走了代理，权威 DNS 会按那个位置调度，而不是你的位置。`);
  }

  let domainReport = null;
  const domainParam = url.searchParams.get('domain');
  if (domainParam) {
    const domain = domainParam.trim().replace(/\.$/, '').toLowerCase();
    const type = (url.searchParams.get('type') || 'A').toUpperCase();

    if (!domain || domain.length > 253 || !DOMAIN_PATTERN.test(domain)) {
      return errorResponse(400, 'Invalid domain');
    }
    if (!ALLOWED_TYPES.has(type)) {
      return errorResponse(400, `Unsupported type, use one of: ${[...ALLOWED_TYPES].join(', ')}`);
    }

    try {
      const [withEcs, withoutEcs] = await Promise.all([
        ask(domain, type, clientIp, true, config),
        ask(domain, type, clientIp, false, config),
      ]);
      const sameAnswer = addressKey(withEcs) === addressKey(withoutEcs);

      domainReport = { domain, type, sameAnswer, withEcs, withoutEcs };

      if (!expectedEcs) {
        // 没有 ECS 时两组结果必然相同，不下结论
      } else if (!ecsForwarded) {
        hints.push(`${domain} 的对比结果不可用于判断 ECS 敏感性：当前上游没有转发客户端 ECS，两次查询实际携带的都是上游自己的位置信息。先把上游修对（见上一条），再测这个域名。`);
      } else if (sameAnswer) {
        hints.push(`${domain} 对 ECS 不敏感：带 ECS 和不带 ECS 返回的地址完全一样。说明该域名的权威 DNS 不使用 ECS，换上游 / 改前缀都没用；延迟来自 CDN 调度或线路本身。`);
      } else {
        hints.push(`${domain} 对 ECS 敏感：带 ECS 与不带 ECS 返回了不同地址，说明 ECS 正在影响调度。若带 ECS 的地址仍然慢，说明该 CDN 依据 ECS 给出的节点对你并不优。`);
      }
    } catch (e) {
      return json({
        ok: false,
        error: `查询 ${domain} 失败: ${e.message}`,
        upstream: config.upstreamUrl,
        upstreamSource,
        ecsForwarded,
        client: { hasCfConnectingIp: !!clientIp, ecs: expectedEcs },
        echo,
        hints,
      }, 502);
    }
  }

  return json({
    ok: true,
    build: 'ecs-diag-v2',
    upstream: config.upstreamUrl,
    upstreamSource,
    ecsForwarded,
    ecsFallback: config.ecsFallback !== false,
    client: {
      hasCfConnectingIp: !!clientIp,
      ecs: expectedEcs,
    },
    echo,
    domain: domainReport,
    hints,
  });
}
