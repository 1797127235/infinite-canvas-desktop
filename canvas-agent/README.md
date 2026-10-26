# Infinite Canvas 桌面桥接服务

`canvas-agent` 是桌面应用的内部组件，连接画布前端与 Codex app-server，不再作为独立 CLI 发布或启动。

## 内部进程

- `index.js desktop`：由 Electron 主进程启动，提供本机 HTTP/SSE 服务。
- `index.js mcp`：由 Codex app-server 启动，提供 stdio 画布工具并转发到同一 HTTP 服务；这是内部协议适配器，不是独立产品入口。
- Codex 可执行文件、端口和允许的网页来源均由桌面壳提供，无需全局安装 Codex 或手动注册 MCP。

## 开发与排查

从 [`desktop/`](../desktop/README.md) 构建资源并启动桌面程序。无参数运行 Agent 会报错退出，不会启动独立服务。

日志统一由 Electron 写入 `userData/desktop.log`：

- Windows：`%APPDATA%\Infinite Canvas\desktop.log`
- Linux：通常为 `~/.config/Infinite Canvas/desktop.log`

需要 Debug 详情时，给桌面程序传入 `--debug`（开发时 `npm start -- --debug`）。Agent 只向父进程输出，不再生成 `~/.infinite-canvas/logs/canvas-agent-*.log`；旧日志不会被自动删除。

会话配置、补充历史、图片预览及 Skill 仍保存在 `~/.infinite-canvas/`，它们不是日志，本次不搬迁或清空。
