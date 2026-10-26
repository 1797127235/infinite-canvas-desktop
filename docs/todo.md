# TODO

待办事项。功能测试确认后移入文档站的[待测试](/docs/progress/pending-test)，确认通过后再写进[功能介绍](/docs/overview/features)。

## 素材网关（视频参考素材走公网 URL）

背景：C2A 的 Grok 视频通道对 base64 参考图有约 675 KB 的总请求体硬限制，视频参考素材（几十 MB）更不可能走 base64；公网 URL 实测 9.3 MB 图片全流程通过。方案：Cloudflare Worker + R2 网关把本地素材换成 24 小时签名 URL（`asset-gateway/`，已实现并通过测试）。

- M1 网关 ✅：`asset-gateway/`（init/分片/complete/签名取回/DO 额度/魔数嗅探），Vitest 8/8 通过；已部署到 `assets.antest.cc.cd`（APAC 桶 + `ref/` 1 天生命周期 + 上游拉取实测通过）。
- M2 客户端接入 ✅：`web/src/services/api/object-storage.ts` 的 `uploadAsset()` 注入模型调用脚本（分片上传、默认直接上传、无 Key 返回 null）；Grok 视频脚本改为「网关 URL 优先、参考图降级总预算 440 KB 压缩 base64、参考视频直接报错」，真实任务验证通过。
- M3 全渠道接入 ✅（按渠道分流）：Grok 走网关 URL（境外上游拉取实测稳定）；MiniMax / 万相改回 Base64 直传——实测国内上游（DashScope / MiniMax 服务器）从 Cloudflare 拉素材跨 jpg/png、2.4MB～18.7MB、多小时十几次任务全部失败（下载超时），无法依赖；三类渠道均带参考图真实出片验证通过。顺带修复 wan3 渠道自上线以来不可用的问题（DashScope 原生路径 `/api/v1/...` 被 `buildApiUrl` 叠加 `/v1` 前缀导致 404，模型脚本的 `/api/` 开头路径现按原样拼接）。
- 后续增强（可选）：上传进度 UI（`uploadAsset` 已支持 onProgress，画布节点未展示）；网关用量看板与异常告警。

## 本地 Agent 与 Skill

- 本地 Agent 接入后续：把 Claude Code CLI Adapter 升级为 Claude Agent SDK Adapter，并完善工具队列体验。
- Agent Skill 后续：补充网络检索安装、Skill 资源文件管理和可控的本地记忆沉淀。

## 更新能力

### 工作流模板在线更新

`web/public/templates/templates.json` 与素材目前打包进安装包，前端只从同源 `/templates/` 读取，既没有版本号也没有远程地址。

要让模板可以随时新增而不发版，需要：

- 把索引改成 `{ version, templates }` 结构
- 增加类似 `PLUGIN_REGISTRY_URL` 的远程地址常量
- 让 `fetchWorkflowTemplates()` 远程失败时回落到内置副本
- 放开 `templates.ts` 里只允许 `/templates/` 前缀的媒体路径校验

需要先确认：

- 远程源用 jsDelivr（免费、国内不稳定、缓存数小时、单文件 20MB 上限）还是对象存储（国内快、可即时生效、有成本）
- 57MB 素材是移出安装包（安装包变小，但离线时看不到预览、也无法克隆）还是继续留在包内（则新增模板仍要发版）

### 版本更新提示入口缺失

桌面版自动更新已接入 `electron-updater`，入口是菜单「帮助 → 检查更新…」加原生弹窗，不依赖网页组件。网页侧的 `web/src/components/layout/version-release-modal.tsx` 与 `web/src/hooks/use-version-check.ts` 仍无任何调用方，自部署网页版的用户看不到「有新版本」提示，需要决定这个入口放在哪里（或确认网页版不需要）。

## 桌面 Agent 文档

独立 CLI 与外部插件入口已移除，桌面启动、日志及内部 MCP 链路的验收见[待测试](/docs/progress/pending-test)。
