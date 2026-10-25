# DoH Worker — DNS-over-HTTPS 代理服务

在 Cloudflare Workers 上部署的 DNS-over-HTTPS (DoH) 代理服务，支持 **EDNS Client Subnet (ECS)**，根据访客真实 IP 返回更精确的 DNS 解析结果。

## 功能

- **DoH 协议** — 支持 RFC 8484，GET `?dns=base64url` 和 POST `application/dns-message`
- **ECS 注入** — 自动获取访客 IP，IPv4 /24 掩码，IPv6 /48 掩码，注入到上游 DNS 查询
- **上游 DNS** — 转发到 Quad9 的 ECS 端点（`dns11.quad9.net`），可通过 `UPSTREAM_DOH_URL` 替换
- **缓存** — 利用 Cloudflare Cache API 缓存 DNS 响应，按 ECS 子网 / DO / CD 维度区分，减少上游请求
- **ECS 回退** — 上游按 ECS 返回 `127.0.0.1` / `0.0.0.0`（区域限制等）时，自动改用不带 ECS 的查询重试一次
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

最省事的方式：浏览器直接打开诊断接口（不需要装任何东西）：

```
https://doh-worker.<你的子域名>.workers.dev/__diag
```

返回的 JSON 里有几块关键信息：

- `upstream` — 当前实际使用的上游，用来确认部署的是不是最新版本
- `upstreamSource` — `default` 表示用的是代码默认值；`env` 表示被控制台 / `wrangler.toml` 的变量覆盖了（**改 `src/constants.js` 不会生效**）
- `client.ecs` — 本次请求实际注入的子网（掩码后的，不含完整 IP）
- `ecsForwarded` / `echo[].forwarded` — 权威 DNS 是否真的收到了这个子网

想看某个具体域名是否受 ECS 影响，加 `?domain=`：

```
https://doh-worker.<你的子域名>.workers.dev/__diag?domain=example.com
```

它会同时查两次——带 ECS 和不带 ECS——然后给出 `domain.sameAnswer`：

- `false`：该域名对 ECS 敏感，ECS 正在影响调度
- `true`：该域名忽略 ECS，换上游或改前缀都没用

> 前提是 `ecsForwarded` 为 `true`。若上游本身不使用客户端 ECS（例如 `cloudflare-dns.com`），带 / 不带 ECS 的两次查询实际都带着上游自己的位置，`sameAnswer` 不能用来判断该域名是否支持 ECS。

还要看 `client.ecs` 是不是你**真实宽带出口**的子网。如果它是云厂商 / 代理的地址，说明 DoH 请求走了代理，权威 DNS 会按代理位置调度，这同样会导致解析到远端节点。

注意：`__diag` 的结果不经过缓存，始终是上游的实时应答。诊断接口只回显掩码后的子网，不输出完整客户端 IP。

也可以用命令行脚本查询 Akamai 的回显服务：

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
│   ├── diag.js         # /__diag 诊断接口（ECS 是否到达权威 DNS）
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

### Q: 某个域名解析出 127.0.0.1

`127.0.0.1` / `0.0.0.0` 几乎不会出现在正常公网解析里，通常是 CDN 按区域限制主动返回的拒绝结果（例如腾讯云海外 CDN 对未备案域名的大陆来源）。

Worker 默认会做一次回退：带 ECS 拿到此类地址时，自动改用**不带 ECS**的查询重试，避免整个域名不可用。回退后的结果通常按上游（Quad9 → Cloudflare 出口）的位置调度。

关闭回退：

```toml
[vars]
ECS_FALLBACK = "0"
```

注意：回退只是“让它可用”，不会让被区域限制的服务变快——这类服务需要 DNS 与流量走同一个允许区域的代理。

### Q: 改了默认上游，线上却没变化

`UPSTREAM_DOH_URL` 的优先级高于 `src/constants.js` 里的默认值。只要 Worker 的 **Settings → Variables and Secrets**（或 `wrangler.toml` 的 `[vars]`）里存在这个变量，改代码就不会生效。

打开 `/__diag` 看 `upstreamSource`：

- `default` — 用的是代码默认值
- `env` — 变量正在覆盖

另外缓存键里也包含上游 host，切换上游后不会命中旧缓存，但仍需清一次本地 DNS 缓存（`ipconfig /flushdns`）。

### Q: 为什么有些域名解析出来延迟很低，有些很高？

ECS 只对**支持 ECS 的权威 DNS / CDN** 有效，而且必须用会转发 ECS 的上游：

- `dns.quad9.net`（9.9.9.9）不发送 ECS，CDN 只能看到 Quad9 机房位置
- 本项目默认的 `dns11.quad9.net`（9.9.9.11）会把**查询里自带的 ECS 子网**原样转给权威 DNS
- `1.1.1.1` 只对少数域名转发 ECS；`8.8.8.8` 会拒绝 Akamai 测试域名的 ECS

所以现象是：走全局 anycast 的站点正常，依赖 geo-DNS 的站点（尤其国内 CDN）可能拿到远端节点。

排查顺序：

1. 打开 `https://<你的 Worker>/__diag`，看 `upstream` 是否为 `dns11.quad9.net`、`echo[].forwarded` 是否为 `true`
2. 打开 `https://<你的 Worker>/__diag?domain=<慢的域名>`，看 `domain.sameAnswer`
   - `false` → ECS 起作用了，慢是 CDN 给的节点本身不优
   - `true` → 该域名的权威 DNS 忽略 ECS，换上游/改前缀都无效
3. 若 `forwarded` 为 `false`，先确认 Worker 已经重新部署（旧代码仍指向 `dns.quad9.net`）

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