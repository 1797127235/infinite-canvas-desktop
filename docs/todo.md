# TODO

待办事项。功能测试确认后移入文档站的[待测试](/zh-CN/docs/progress/pending-test)，确认通过后再写进[功能介绍](/zh-CN/docs/overview/features)。

## 本地 Agent 与 Skill

- 本地 Agent 接入后续：按[本地 Agent 接入规划](/zh-CN/docs/progress/local-agent-integration-plan)把 Claude Code CLI Adapter 升级为 Claude Agent SDK Adapter，并完善工具队列体验。
- Agent Skill 后续：补充网络检索安装、Skill 资源文件管理和可控的本地记忆沉淀。

## 更新能力

当前桌面版没有任何自动更新：`desktop` 只依赖 `electron` 与 `electron-builder`，没有 `electron-updater`，`electron-builder.yml` 也没有 `publish` 配置，升级只能重新打安装包让用户重装。网页产物、Canvas Agent、本地代理都打在安装包里，所以改一行前端也要重发整个桌面版。

### 桌面程序自动更新

接入 `electron-updater` 与 `publish`，让应用自己检查、下载并在重启后安装。

动手前需要先确认：

- 更新源放在哪里（GitHub Releases 在国内可达性差）
- 是否购买代码签名证书（Windows 未签名会弹 SmartScreen 警告）
- 更新失败或用户拒绝时的回退方式
- Linux 的 AppImage / deb 更新路径差异

必须保持不变的是 `userData` 目录和固定网页端口 `127.0.0.1:17370`——端口一变，按 origin 隔离的本地配置与画布数据就读不到了。

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

`web/src/components/layout/version-release-modal.tsx` 与 `web/src/hooks/use-version-check.ts` 已无任何调用方，顶栏移除版本号后用户看不到「有新版本」提示。恢复自动更新时需要一并决定这个入口放在哪里。

## 文档

- `pending-test.zh-CN.mdx` 中关于 Canvas Agent 启动时检查 npm 更新的描述与现状不符，`canvas-agent/src/version-check.ts` 已明确不查询 npm，只往日志输出本地版本。
