# DoH Worker — DNS-over-HTTPS 代理服务

在 Cloudflare Workers 上部署的 DNS-over-HTTPS (DoH) 代理服务，支持 **EDNS Client Subnet (ECS)**，根据访客真实 IP 返回更精确的 DNS 解析结果。

## 功能

- **DoH 协议** — 支持 RFC 8484，GET `?dns=base64url` 和 POST `application/dns-message`
- **ECS 注入** — 自动获取访客 IP，IPv4 /24 掩码，IPv6 /48 掩码，注入到上游 DNS 查询
- **上游 DNS** — 转发到 Quad9（`dns.quad9.net`），可通过 `UPSTREAM_DOH_URL` 替换
- **缓存** — 利用 Cloudflare Cache API 缓存 DNS 响应，按 ECS 子网 / DO / CD 维度区分，减少上游请求
- **隐私** — 只向上游转发 ECS，丢弃 COOKIE/NSID 等一次性 EDNS 选项；客户端可用 `/0` 前缀主动退出 ECS
- **CORS** — 支持跨域请求

## 部署

### 前置要求

- [Node.js](https://nodejs.org/) >= 18
- [Cloudflare 账号](https://dash.cloudflare.com/sign-up)（免费版即可）
- 一个域名（可选，绑定自定义域名用）

### 安装

```bash
# 克隆或进入项目目录
cd dns-worker

# 安装依赖
npm install
```

### 登录 Cloudflare

```bash
npx wrangler login
```

会自动打开浏览器，授权 Wrangler 访问你的 Cloudflare 账号。

### 部署

```bash
npx wrangler deploy
```

成功后输出类似：

```
Uploaded doh-worker (1.23 sec)
Published doh-worker (0.34 sec)
  https://doh-worker.<你的子域名>.workers.dev
```

这个 URL 就是你的 DoH 服务地址。

### 绑定自定义域名（可选）

```toml
# wrangler.toml 中取消注释并修改
routes = [
  { pattern = "dns.example.com/*", zone_id = "your-zone-id" }
]
```

然后重新部署：

```bash
npx wrangler deploy
```

## 使用方式

### 方式一：浏览器 / curl

**GET 请求：**

```bash
# 查询 example.com 的 A 记录
curl -v "https://doh-worker.<你的子域名>.workers.dev/?dns=AAEBAAABAAAAAAAAB2V4YW1wbGUDY29tAAABAAE"
```

**POST 请求：**

```bash
# 将 DNS 查询保存为二进制文件
curl -v -X POST \
  -H "Content-Type: application/dns-message" \
  --data-binary @query.bin \
  "https://doh-worker.<你的子域名>.workers.dev/"
```

### 方式二：配置到系统 DNS（推荐）

#### Windows 11

1. 打开 **设置 → 网络和 Internet → 以太网 / Wi-Fi**
2. 点击 **DNS 服务器分配 → 编辑**
3. 选择 **手动**，DNS-over-HTTPS 打开
4. 输入：
   - 首选 DNS：`https://doh-worker.<你的子域名>.workers.dev/`
5. 保存

#### Android 9+

1. 打开 **设置 → 网络和 Internet → 高级 → 私人 DNS**
2. 选择 **私人 DNS 提供商主机名**
3. 输入：`doh-worker.<你的子域名>.workers.dev`
4. 保存

> 注意：Android 的私人 DNS 只支持域名，不支持完整 URL 路径。

#### iOS / macOS

iOS 和 macOS 不支持直接配置 DoH URL，需要安装描述文件或使用第三方应用。

### 方式三：dig 测试

```bash
# 安装 dig（Windows 可以通过 WSL 或 bind-tools）
dig @doh-worker.<你的子域名>.workers.dev example.com
```

### 方式四：浏览器配置（Firefox）

1. 打开 **Firefox 设置 → 网络设置**
2. 勾选 **启用基于 HTTPS 的 DNS**
3. 选择 **自定义**
4. 输入：`https://doh-worker.<你的子域名>.workers.dev/`
5. 保存

## 验证 ECS 是否生效

ECS 注入是在查询中自动添加的，可以用抓包或者通过查询回显服务验证：

```bash
# 使用 dig +subnet 选项模拟 ECS 查询
# 或者直接检查上游是否返回了基于你 IP 的地址
```

如果同一个域名在不同地域的客户端得到不同的解析结果，说明 ECS 生效了。

## 本地开发

```bash
# 安装依赖
npm install

# 启动本地开发服务器
npx wrangler dev --port 8787

# 运行单元测试
npm test

# 测试 GET 请求
curl -v "http://localhost:8787/?dns=AAEBAAABAAAAAAAAB2V4YW1wbGUDY29tAAABAAE"

# 测试 POST 请求
curl -v -X POST \
  -H "Content-Type: application/dns-message" \
  --data-binary @query.bin \
  "http://localhost:8787/"
```

## 项目结构

```
dns-worker/
├── src/
│   ├── index.js        # Worker 入口 — 请求路由、ECS 注入、缓存、上游转发
│   ├── doh.js          # DoH 协议解析 (GET base64url / POST binary)
│   ├── ecs.js          # ECS 注入 — IP 掩码、OPT 伪记录构造
│   ├── cache.js        # 缓存键构建、Cache API 读写、TTL 提取
│   ├── upstream.js     # 上游 DoH 查询（默认 5 秒超时）
│   ├── response.js     # 响应格式化 + CORS + 错误响应
│   ├── config.js       # 运行时配置（读取 wrangler.toml [vars]）
│   └── constants.js    # 默认常量
├── test/               # Vitest 单元测试
├── wrangler.toml       # Worker 配置
├── package.json        # 依赖清单
└── .gitignore
```

## 常见问题

### Q: 部署后返回 502

检查上游 DoH 是否可达（默认 `https://dns.quad9.net/dns-query`）：

```bash
npx wrangler tail   # 查看 Workers 日志中的 "Upstream DNS query failed"
```

本地开发时 502 通常是本机网络无法访问上游 DoH 地址。

### Q: 如何修改上游 DNS 服务商？

优先改 `wrangler.toml`，不用改代码：

```toml
[vars]
UPSTREAM_DOH_URL = "https://dns.alidns.com/dns-query"
```

也可以改 `src/constants.js` 里的默认值 `UPSTREAM_URL`。

### Q: 如何关闭缓存？

在 `wrangler.toml` 中设置：

```toml
[vars]
CACHE_TTL_MAX = "0"
```

### Q: 如何修改 ECS 掩码长度？

编辑 `src/constants.js`：

```javascript
export const IPV4_ECS_PREFIX = 24; // 改为 32 则发送完整 IP
export const IPV6_ECS_PREFIX = 48; // 改为 128 则发送完整 IP
```

## 许可证

MIT