import { describe, expect, it } from 'vitest';
import { base64urlToBuffer, parseGetRequest, parsePostRequest } from '../src/doh.js';

function postRequest(body, headers = { 'Content-Type': 'application/dns-message' }) {
  return new Request('https://doh.example/', { method: 'POST', headers, body });
}

describe('base64urlToBuffer', () => {
  it('解码无填充的 base64url', () => {
    const raw = Buffer.from([0x00, 0x01, 0x02, 0xfb, 0xff]);
    expect(base64urlToBuffer(raw.toString('base64url'))).toEqual(raw);
  });

  it('拒绝非法字符', () => {
    expect(() => base64urlToBuffer('abc$def')).toThrow(/base64url/);
  });
});

describe('parseGetRequest', () => {
  it('读取 ?dns= 参数', () => {
    const raw = Buffer.from([1, 2, 3, 4]);
    const url = new URL(`https://doh.example/?dns=${raw.toString('base64url')}`);
    expect(parseGetRequest(url)).toEqual(raw);
  });

  it('缺少参数或参数过长时报错', () => {
    expect(() => parseGetRequest(new URL('https://doh.example/'))).toThrow(/Missing dns/);
    expect(() => parseGetRequest(new URL(`https://doh.example/?dns=${'A'.repeat(2049)}`)))
      .toThrow(/too long/);
  });
});

describe('parsePostRequest', () => {
  it('读取 DNS 线格式 body', async () => {
    const body = Buffer.from([9, 8, 7]);
    expect(await parsePostRequest(postRequest(body))).toEqual(body);
  });

  it('拒绝不支持的 Content-Type', async () => {
    await expect(parsePostRequest(postRequest('x', { 'Content-Type': 'text/plain' })))
      .rejects.toThrow(/Unsupported Content-Type/);
  });

  it('未声明 Content-Type 时保持兼容', async () => {
    const body = Buffer.from([1]);
    expect(await parsePostRequest(postRequest(body, {}))).toEqual(body);
  });

  it('拒绝空 body', async () => {
    await expect(parsePostRequest(postRequest(new Uint8Array(0)))).rejects.toThrow(/Empty POST body/);
  });

  it('按 Content-Length 提前拒绝超大请求', async () => {
    const request = postRequest(Buffer.from([1]), {
      'Content-Type': 'application/dns-message',
      'Content-Length': '70000',
    });
    await expect(parsePostRequest(request)).rejects.toThrow(/too large/);
  });
});
