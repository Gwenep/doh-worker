// scripts/ecs-probe.mjs
// 诊断 ECS 是否真正生效：查询 Akamai 的 whoami.ds.akahelp.net TXT 回显
//
// 用法:
//   node scripts/ecs-probe.mjs                     # 直连公共上游探测（需要能访问它们）
//   node scripts/ecs-probe.mjs 1.2.3.0/24          # 指定要测试的 ECS 子网
//   node scripts/ecs-probe.mjs --worker https://your-worker.workers.dev
//                                                  # 通过已部署的 Worker 验证端到端效果
//
// Akamai 的 TXT 回显形如: "ns" "1.2.3.4" "ecs" "5.6.7.0/24"
//   - 第三个字段是 ecs 表示权威 DNS 收到了 ECS
//   - 第四个字段就是权威 DNS 看到的客户端子网

import { Buffer } from 'node:buffer';
import { encode, decode } from 'dns-packet';

const ECS_OPTION_CODE = 8;
const TEST_NAME = 'whoami.ds.akahelp.net';

const upstreams = [
  { name: 'Quad9 (默认, 无 ECS)', url: 'https://dns.quad9.net/dns-query' },
  { name: 'Quad9 (dns11, ECS)', url: 'https://dns11.quad9.net/dns-query' },
  { name: 'Google', url: 'https://dns.google/dns-query' },
  { name: 'Cloudflare', url: 'https://cloudflare-dns.com/dns-query' },
];

function parseSubnet(input) {
  const [ip, prefixText] = input.split('/');
  const prefix = Number.parseInt(prefixText, 10);
  return {
    ip,
    family: ip.includes(':') ? 2 : 1,
    sourcePrefixLength: Number.isInteger(prefix) ? prefix : (ip.includes(':') ? 48 : 24),
    scopePrefixLength: 0,
  };
}

function makeQuery(ecs) {
  return encode({
    id: 0x1234,
    type: 'query',
    flags: 0x0100,
    questions: [{ name: TEST_NAME, type: 'TXT', class: 'IN' }],
    answers: [],
    authorities: [],
    additionals: [{
      name: '.',
      type: 'OPT',
      udpPayloadSize: 1232,
      extendedRcode: 0,
      ednsVersion: 0,
      flags: 0,
      options: ecs ? [{ code: ECS_OPTION_CODE, ...ecs }] : [],
    }],
  });
}

async function send(url, queryBuffer) {
  const startedAt = Date.now();
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/dns-message',
      'Accept': 'application/dns-message',
    },
    body: queryBuffer,
    signal: AbortSignal.timeout(8000),
  });
  const elapsed = Date.now() - startedAt;

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}`);
  }

  const decoded = decode(Buffer.from(await response.arrayBuffer()));
  const opt = decoded.additionals.find((rr) => rr.type === 'OPT');
  const responseEcs = opt && opt.options.find((o) => o.code === ECS_OPTION_CODE);
  const txtParts = decoded.answers
    .filter((rr) => rr.type === 'TXT')
    .flatMap((rr) => rr.data.map((part) => part.toString()));

  return {
    elapsed,
    rcode: decoded.rcode,
    txtParts,
    responseEcs: responseEcs
      ? `${responseEcs.ip}/${responseEcs.sourcePrefixLength} (scope /${responseEcs.scopePrefixLength})`
      : 'none',
    cache: response.headers.get('X-Cache'),
  };
}

function report(label, result) {
  console.log(`${label} — ${result.elapsed}ms, rcode=${result.rcode}${result.cache ? `, X-Cache=${result.cache}` : ''}`);
  console.log(`  TXT: ${result.txtParts.length ? result.txtParts.join(' ') : '(空)'}`);
  console.log(`  响应 ECS: ${result.responseEcs}`);
}

const args = process.argv.slice(2);
const workerIndex = args.indexOf('--worker');

if (workerIndex !== -1) {
  const workerUrl = (args[workerIndex + 1] || '').replace(/\/+$/, '');
  if (!workerUrl) {
    console.error('用法: node scripts/ecs-probe.mjs --worker https://your-worker.workers.dev');
    process.exit(1);
  }

  console.log(`通过 Worker 探测: ${workerUrl}`);
  console.log(`查询: ${TEST_NAME} TXT\n`);

  try {
    const result = await send(`${workerUrl}/`, makeQuery(null));
    report('[Worker]', result);

    const ecsField = result.txtParts[result.txtParts.indexOf('ecs') + 1];
    if (ecsField && /\/\d+$/.test(ecsField)) {
      console.log(`\n→ ECS 已生效：权威 DNS 看到的客户端子网是 ${ecsField}`);
    } else if (result.responseEcs !== 'none') {
      console.log('\n→ 上游接收了 ECS，但 Akamai 未回显子网（可能被中间缓存命中）');
    } else {
      console.log('\n→ 未检测到 ECS：权威 DNS 看到的是上游机房 IP，CDN 会按机房位置调度');
    }
  } catch (e) {
    console.error(`失败: ${e.message}`);
    process.exit(1);
  }
} else {
  const requested = parseSubnet(args[0] || '223.5.5.0/24');

  console.log(`探测目标: ${TEST_NAME} TXT`);
  console.log(`请求 ECS: ${requested.ip}/${requested.sourcePrefixLength}\n`);

  let reachable = 0;

  for (const { name, url } of upstreams) {
    for (const ecs of [null, requested]) {
      const label = `[${name}] ${ecs ? `带 ECS ${ecs.ip}/${ecs.sourcePrefixLength}` : '不带 ECS'}`;
      try {
        report(label, await send(url, makeQuery(ecs)));
        reachable += 1;
      } catch (e) {
        console.log(`${label} — 失败: ${e.message}`);
      }
      console.log('');
    }
  }

  if (reachable === 0) {
    console.log('所有上游都不可达。若在国内网络直连，这是正常现象；');
    console.log('请改用 --worker 模式，通过已部署的 Worker 验证。');
  }
}
