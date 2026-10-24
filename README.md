# DoH Worker — DNS-over-HTTPS 代理服务

在 Cloudflare Workers 上部署的 DNS-over-HTTPS (DoH) 代理服务，支持 **EDNS Client Subnet (ECS)**，根据访客真实 IP 返回更精确的 DNS 解析结果。

## 功能

- **DoH 协议** — 支持 RFC 8484，GET `?dns=base64url` 和 POST `application/dns-message`
- **ECS 注入** — 自动获取访客 IP，IPv4 /24 掩码，IPv6 /48 掩码，注入到上游 DNS 查询
- **上游 DNS** — 转发到 Quad9 的 ECS 端点（`dns11.quad9.net`），可通过 `UPSTREAM_DOH_URL` 替换
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

### 方式一：wrangler CLI 部署

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

### 方式二：单文件粘贴（免 CLI）

仓库根目录的 `worker.js` 已经把源码、`dns-packet` 和 Buffer polyfill 打包成一个文件，可直接粘贴到 Cloudflare 控制台：

1. 打开 [Cloudflare Dashboard](https://dash.cloudflare.com/) → **Workers & Pages** → 创建或选择 Worker
2. 点击 **Edit code**
3. 删掉编辑器里的示例代码，把 `worker.js` 全文粘贴进去
4. 点击 **Deploy**

> 已内置所有依赖，**不需要开启 Node.js 兼容开关**，也不需要在控制台安装任何东西。
> `worker.js` 是构建产物，不要直接修改；改完 `src/` 后运行 `npm run build` 重新生成。
> 只想换上游 DNS 时，可以在 `worker.js` 里搜索 `https://dns.quad9.net/dns-query` 直接替换，或在 Worker 的 Settings → Variables 里加 `UPSTREAM_DOH_URL`。

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

用 Akamai 的回显服务查询，直接看权威 DNS 收到的客户端子网：

```bash
# 通过已部署的 Worker 验证（推荐）
node scripts/ecs-probe.mjs --worker https://doh-worker.<你的子域名>.workers.dev
```

正常输出类似：

```
[Worker] — 180ms, rcode=NOERROR, X-Cache=MISS
  TXT: ns 203.0.113.1 ecs 203.0.113.0/24
  响应 ECS: 203.0.113.0/24 (scope /24)

→ ECS 已生效：权威 DNS 看到的客户端子网是 203.0.113.0/24
```

如果 `TXT` 里没有 `ecs` 字段，说明 ECS 没有传到权威 DNS，检查：

1. 上游是不是 `dns11.quad9.net`（`dns.quad9.net` 默认**不发送** ECS）
2. 请求里是否带 `CF-Connecting-IP`（本地 `wrangler dev` 没有这个头，不会注入 ECS）
3. 是否命中了之前写入的缓存（响应里 `X-Cache` 为 `HIT` 时换一个域名再测）

也可以在能直连公共 DNS 的网络环境下，对比不同上游对 ECS 的处理：

```bash
node scripts/ecs-probe.mjs 1.2.3.0/24
```

## 本地开发

```bash
# 安装依赖
npm install

# 启动本地开发服务器
npx wrangler dev --port 8787

# 运行单元测试
npm test

# 重新生成单文件版 worker.js
npm run build

# 可选：在本地 workerd 中验证单文件版（不开启 nodejs_compat）
npm run verify:bundle

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
├── scripts/            # 单文件打包 / 验证脚本
├── test/               # Vitest 单元测试
├── worker.js           # 单文件构建产物（粘贴到控制台用，勿手改）
├── wrangler.toml       # Worker 配置
├── package.json        # 依赖清单
└── .gitignore
```

## 常见问题

### Q: 部署后返回 502

检查上游 DoH 是否可达（默认 `https://dns11.quad9.net/dns-query`）：

```bash
npx wrangler tail   # 查看 Workers 日志中的 "Upstream DNS query failed"
```

本地开发时 502 通常是本机网络无法访问上游 DoH 地址。

### Q: 为什么有些域名解析出来延迟很低，有些很高？

ECS 只对**支持 ECS 的权威 DNS / CDN** 有效，而且必须用会转发 ECS 的上游：

- `dns.quad9.net`、`1.1.1.1`、`8.8.8.8` 默认都**不发送** ECS，CDN 会按解析器机房位置调度
- 本项目默认的 `dns11.quad9.net`（9.9.9.11）才会真正把客户端子网传给权威 DNS

所以现象是：走全局 anycast 的站点正常，依赖 geo-DNS 的站点（尤其国内 CDN）会拿到境外节点。
先用 `node scripts/ecs-probe.mjs --worker <你的 Worker 地址>` 确认 ECS 是否真的到达权威 DNS；
若某些站点仍慢，通常是该站点的权威 DNS/CDN 本身忽略 ECS，属于上游限制，可考虑对国内域名改用支持 ECS 的国内 DoH（如 `dns.alidns.com`）做分线路解析。

切换上游或修改 ECS 后，记得清一下本地 DNS 缓存（`ipconfig /flushdns`），否则系统还会用旧 TTL 里的结果。

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