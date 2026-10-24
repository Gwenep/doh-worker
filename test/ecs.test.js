import { describe, expect, it } from 'vitest';
import {
  maskIPv4,
  maskIPv6,
  maskIp,
  expandIPv6,
  injectECS,
  getDnssecOk,
  getClientIp,
} from '../src/ecs.js';

function optRecord(options = [], flags = 0) {
  return {
    name: '.',
    type: 'OPT',
    udpPayloadSize: 1232,
    extendedRcode: 0,
    ednsVersion: 0,
    flags,
    options,
  };
}

function packet(additionals = []) {
  return {
    id: 1,
    type: 'query',
    flags: 0x0100,
    questions: [{ name: 'example.com', type: 'A', class: 'IN' }],
    answers: [],
    authorities: [],
    additionals,
  };
}

describe('maskIPv4', () => {
  it('按 /24 掩码', () => {
    expect(maskIPv4('203.0.113.55', 24)).toBe('203.0.113.0');
  });

  it('按非整字节前缀 /20 掩码时清零前缀外的位', () => {
    expect(maskIPv4('203.0.113.55', 20)).toBe('203.0.112.0');
    expect(maskIPv4('203.255.255.255', 20)).toBe('203.255.240.0');
  });

  it('/32 保留完整地址，/0 全部清零', () => {
    expect(maskIPv4('203.0.113.55', 32)).toBe('203.0.113.55');
    expect(maskIPv4('203.0.113.55', 0)).toBe('0.0.0.0');
  });

  it('非法地址或前缀返回 null', () => {
    expect(maskIPv4('203.0.113')).toBeNull();
    expect(maskIPv4('203.0.113.999')).toBeNull();
    expect(maskIPv4('not-an-ip')).toBeNull();
    expect(maskIPv4('203.0.113.55', 33)).toBeNull();
  });
});

describe('expandIPv6 / maskIPv6', () => {
  it('展开 :: 缩写', () => {
    expect(expandIPv6('2001:db8::1')).toBe('2001:db8:0:0:0:0:0:1');
    expect(expandIPv6('::1')).toBe('0:0:0:0:0:0:0:1');
  });

  it('支持 IPv4 映射地址', () => {
    expect(expandIPv6('::ffff:203.0.113.5')).toBe('0:0:0:0:0:ffff:cb00:7105');
  });

  it('按 /48 和 /56 掩码', () => {
    expect(maskIPv6('2001:db8:abcd:1234:5678:9abc:def0:1234', 48))
      .toBe('2001:db8:abcd:0:0:0:0:0');
    expect(maskIPv6('2001:db8:abcd:1234:5678:9abc:def0:1234', 56))
      .toBe('2001:db8:abcd:1200:0:0:0:0');
    expect(maskIPv6('2001:db8:abcd:ff34:5678:9abc:def0:1234', 56))
      .toBe('2001:db8:abcd:ff00:0:0:0:0');
  });

  it('非法地址或前缀返回 null', () => {
    expect(expandIPv6('2001:db8:::1')).toBeNull();
    expect(expandIPv6('2001:db8::1::2')).toBeNull();
    expect(expandIPv6('1:2:3:4:5:6:7')).toBeNull();
    expect(maskIPv6('2001:db8::1', 129)).toBeNull();
  });

  it('按地址类型自动分派', () => {
    expect(maskIp('203.0.113.55', 24)).toBe('203.0.113.0');
    expect(maskIp('2001:db8:abcd::1', 48)).toBe('2001:db8:abcd:0:0:0:0:0');
    expect(maskIp('garbage', 24)).toBeNull();
  });
});

describe('injectECS', () => {
  it('没有客户端 IP 时不创建 OPT，返回 null', () => {
    const p = packet();
    expect(injectECS(p, null)).toBeNull();
    expect(p.additionals).toHaveLength(0);
  });

  it('为 IPv4 客户端创建带 ECS 的 OPT 记录', () => {
    const p = packet();
    const ecs = injectECS(p, '203.0.113.55');

    expect(ecs).toMatchObject({ family: 1, ip: '203.0.113.0', sourcePrefixLength: 24, scopePrefixLength: 0 });
    expect(p.additionals).toHaveLength(1);
    expect(p.additionals[0]).toMatchObject({ type: 'OPT', udpPayloadSize: 1232 });
    expect(p.additionals[0].options).toHaveLength(1);
  });

  it('为 IPv6 客户端注入 /48 ECS', () => {
    const p = packet();
    const ecs = injectECS(p, '2001:db8:abcd:1234::1');

    expect(ecs).toMatchObject({ family: 2, ip: '2001:db8:abcd:0:0:0:0:0', sourcePrefixLength: 48 });
  });

  it('保留客户端已有 OPT 的 DO 标志', () => {
    const p = packet([optRecord([], 1 << 15)]);
    injectECS(p, '203.0.113.55');

    expect(getDnssecOk(p)).toBe(true);
    expect(p.additionals).toHaveLength(1);
  });

  it('不得使用比客户端声明更长的前缀', () => {
    const p = packet([optRecord([
      { code: 8, family: 1, ip: '198.51.100.0', sourcePrefixLength: 16, scopePrefixLength: 0 },
    ])]);
    const ecs = injectECS(p, '203.0.113.55');

    expect(ecs).toMatchObject({ family: 1, ip: '203.0.0.0', sourcePrefixLength: 16 });
    expect(p.additionals[0].options).toHaveLength(1);
  });

  it('客户端 /0 表示退出 ECS，不注入', () => {
    const p = packet([optRecord([
      { code: 8, family: 1, ip: '0.0.0.0', sourcePrefixLength: 0, scopePrefixLength: 0 },
    ])]);
    const ecs = injectECS(p, '203.0.113.55');

    expect(ecs).toBeNull();
    expect(p.additionals[0].options).toHaveLength(0);
  });

  it('替换客户端自带 ECS 时不会产生重复选项', () => {
    const p = packet([optRecord([
      { code: 8, family: 1, ip: '198.51.100.0', sourcePrefixLength: 24, scopePrefixLength: 0 },
    ])]);
    injectECS(p, '203.0.113.55');

    expect(p.additionals[0].options).toHaveLength(1);
    expect(p.additionals[0].options[0]).toMatchObject({ sourcePrefixLength: 24, ip: '203.0.113.0' });
  });

  it('丢弃 COOKIE/NSID/PADDING 等其它 EDNS 选项', () => {
    const p = packet([optRecord([
      { code: 10, data: Buffer.from('cookie!!') },
      { code: 3, data: Buffer.from('nsid') },
      { code: 12, data: Buffer.alloc(8) },
    ])]);
    injectECS(p, '203.0.113.55');

    expect(p.additionals[0].options).toHaveLength(1);
    expect(p.additionals[0].options[0].code).toBe(8);
  });

  it('非法客户端 IP 时退回不注入', () => {
    const p = packet();
    expect(injectECS(p, 'definitely-not-an-ip')).toBeNull();
    expect(p.additionals).toHaveLength(0);
  });
});

describe('getClientIp', () => {
  it('读取 CF-Connecting-IP', () => {
    const request = new Request('https://doh.example/', {
      headers: { 'CF-Connecting-IP': '203.0.113.55' },
    });
    expect(getClientIp(request)).toBe('203.0.113.55');
    expect(getClientIp(new Request('https://doh.example/'))).toBeNull();
  });
});
