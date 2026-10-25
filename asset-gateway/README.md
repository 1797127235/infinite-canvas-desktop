# Asset Gateway（素材网关）

画布本地参考图/视频 → 公网临时 URL 的 Cloudflare Worker 网关，配套 R2 存储。
供视频生成脚本把大体积参考素材以公网 URL 提交给上游（绕开 base64 请求体限制）。

## 架构

```
桌面端 → POST /upload/init (Bearer C2A key)      → 校验 key（DO 缓存 10 分钟）+ 当日额度 → R2 multipart 会话
       → PUT  /upload/part?part=N (X-Upload-Token) → 写入分片（首片做魔数嗅探）
       → POST /upload/complete                     → 合并对象 ref/{sha256}.{ext}
       ← 返回 24h 签名 URL /f/{key}?exp&sig
上游 AI → GET /f/{key}?exp&sig                     → HMAC 校验后流出（强制 attachment）
桶生命周期 1 天自动删除对象
```

- 对象按内容寻址（sha256）：同一素材重复上传直接命中换发新 URL，不占额度。
- 额度：单 Key 每日 200 MB / 50 次（`src/limits.ts`）；单文件 20 MiB；分片 8 MiB。
- 上传令牌（1h）与取回 URL（24h）均为 HMAC-SHA256 签名的自包含凭据。
- 类型白名单：JPEG / PNG / WebP / MP4 / MOV，首片魔数嗅探校验。

## 部署（一次性）

```bash
cd asset-gateway
npm install
npx wrangler r2 bucket create infinite-canvas-assets   # 区域提示选 APAC
npx wrangler secret put SIGNING_SECRET                 # 随机 32+ 字节，如 openssl rand -base64 32
npx wrangler deploy
```

部署后还需在 Cloudflare 控制台完成：

1. **R2 桶生命周期**：`infinite-canvas-assets` → Settings → Object lifecycle → 添加规则：删除 1 天后的对象（前缀 `ref/`）。
2. **自定义域名**：Workers → asset-gateway → Settings → Domains & Routes → Add → Custom domain：`assets.antest.cc.cd`（zone `antest.cc.cd` 需已在本账号）。域名如更换，同步改 `wrangler.toml` 的 `GATEWAY_ORIGIN` 并重新 deploy；客户端读取配置，历史素材 URL 只保留 24 小时，迁移无残留。

## 本地开发与测试

```bash
npm run dev    # wrangler dev，本地模拟 R2 / Durable Objects
npm test       # Vitest（@cloudflare/vitest-plugin），R2/DO 本地模拟，上游 key 校验已 mock
```

## 运维备注

- 已部署：`assets.antest.cc.cd`（Worker custom domain）、桶 `infinite-canvas-assets`（APAC）、生命周期规则 `ref-daily-cleanup`（`ref/` 1 天过期）+ 默认 7 天中止未完成分片。
- 上游可达性已实测：xAI 能直接拉取签名 URL 素材（1×1 测试图被 xAI 按尺寸拒绝，证明下载链路成功）。
- Cloudflare 边缘的浏览器完整性检查会拦默认 `python-urllib` 这类 UA（error 1010）；桌面端 Electron 与浏览器都是正常 UA，不受影响。脚本调试时带常规 User-Agent 即可。
- 网关返回的 401（key 校验失败）/413（超 20 MiB）/415（类型不符）/429（超日额度）均为 JSON 错误体，可直接展示给用户。
