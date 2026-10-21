# Infinite Canvas Desktop

Windows / Linux 桌面版。目标是把网页版需要用户自己做的事全部内置：不需要装 Node、不需要敲 `npx`、不需要填 Agent 地址和 token、不需要自己开本地代理。

## 桌面壳内置了什么

| 能力 | 网页版 | 桌面版 |
| --- | --- | --- |
| 网页产物 | 自己部署静态站点 | 打包进安装包，由主进程用同源本地服务托管 |
| Canvas Agent | `npx @basketikun/canvas-agent@latest` + 填地址 token | 主进程直接拉起，地址由壳注入 |
| Codex 运行时 | 用户自己 `npm i -g @openai/codex` | 首次启动下载到用户数据目录，之后复用 |
| 本地代理 | `npx @basketikun/canvas-proxy@latest` | 主进程直接拉起，网页自动启用 |
| 跨域 | 需要代理或直连 | Agent 走同源反代（`/agent-api`），AI 接口走内置代理 |

## 开发运行

```bash
cd desktop
npm install
npm run resources   # 构建 web/dist 与 canvas-agent/dist，并只留生产依赖
npm start
```

`npm run resources` 会依次执行 canvas-agent 的安装与构建、裁剪 devDependencies、以及网页构建。产物缺失时桌面壳会直接报错并提示执行它。

## 打包

```bash
npm run dist:win     # NSIS 安装包（x64）
npm run dist:linux   # AppImage + deb（x64）
npm run dist         # 两个平台一起打
```

产物在 `desktop/release/`。

### 应用图标

图标统一放在 `desktop/build/`：

- `build/icon.ico`：Windows 用，7 个尺寸（16/24/32/48/64/128/256）。
- `build/icons/`：Linux 用，8 个尺寸（16/32/48/64/128/256/512/1024）。
- `build/icon.png`：1024×1024 母版，上面两套都由它生成。

Linux 必须给多尺寸，不能只给一张 1024：`hicolor` 主题的 `index.theme` 只索引到 `512x512/apps`，只装 1024 尺寸时系统找不到图标，会回退成 Electron 默认图标。重装后若启动器仍显示旧图标，执行一次 `sudo gtk-update-icon-cache -f -t /usr/share/icons/hicolor`。

### 在 Linux 上打 Windows 包

`electron-builder --win` 只有一步真需要 Wine：NSIS 生成卸载器时要执行一次临时安装包。`bash build-win.sh` 用系统 Wine 完成这一步：

```bash
sudo apt-get install -y --no-install-recommends wine64   # 自带 i386-windows，32 位 NSIS 走 WoW64
bash build-win.sh                                        # 等价于 USE_SYSTEM_WINE=true electron-builder --win --x64
```

不要用 electron-builder 自带的 Wine 便携包（`toolsets.wine`）：`wine@1.0.0/1.0.1` 的 Linux 包只有 `x86_64-unix`，缺 `lib/wine/x86_64-windows` 的 PE 内置 DLL，跑安装包会 `failed to load kernel32.dll, status c0000135`。Debian/Ubuntu 只装 `wine64` 时没有 `/usr/bin/wine`，脚本会补一个转发脚本到 `~/.local/bin/wine`。安装包故意**不含** Codex 平台二进制（单平台约 350MB），首次启动时按平台从 npm registry 下载并解压到用户数据目录：

- Windows：`%APPDATA%/Infinite Canvas/codex/<version>/vendor/x86_64-pc-windows-msvc/bin/codex.exe`
- Linux：`~/.config/Infinite Canvas/codex/<version>/vendor/<triple>/bin/codex`

### 下载源与校验

默认**只走国内镜像** `https://registry.npmmirror.com`，实测 137MB 平台包 16 秒左右下完。镜像不可用或校验不通过时才回退官方源 `https://registry.npmjs.org`，这个兜底只在失败时触发，不影响镜像优先。

镜像地址可用环境变量覆盖：

```bash
CANVAS_CODEX_MIRROR=https://registry.npmjs.org npm start
```

npmmirror 只做缓存转发，不重新打包，所以内容与官方逐字节一致（实测 `codex-0.146.0-linux-x64.tgz` 的 sha512、sha1、unpackedSize 与官方 registry 元数据完全相同）。下载完成后仍会用 `canvas-agent/package-lock.json` 里的官方 `integrity` 做一次 sha512 强校验，镜像内容异常或版本不一致会直接丢弃该文件并回退官方源。

Electron 本体走 `electronDownload.mirror` 指向的 npmmirror 镜像，同样只缓存官方产物。

只支持 Windows x64 与 Linux x64 / arm64；其它平台启动会明确报错。

## 运行期行为与边界值

- Codex 运行时下载：流式写入，每累计 4MB 上报一次进度；失败会在启动页显示原因并允许重试。
- Canvas Agent 启动等待：90 秒内未通过 `/health` 视为失败，启动页给出重试。
- 本地代理启动等待：30 秒。
- Codex 账号操作（状态 / 浏览器登录 / API Key 登录）：单次最长 300 秒。
- 退出应用时会一并结束 Agent 与代理子进程；Windows 上用 `taskkill /T` 清理 Codex 子进程。

## 账号

画布助手由本机 Codex 驱动。菜单「文件 → Codex 账号…」可以查看登录状态、用 API Key 登录、或走浏览器登录；本机已经登录过 Codex 的会直接复用 `~/.codex`。

## 安全约束

- 渲染进程：`contextIsolation: true`、`sandbox: true`、`nodeIntegration: false`，只通过 preload 的 `contextBridge` 暴露少量接口。
- 本地服务只监听 `127.0.0.1`，并校验 `Host` 头，挡住 DNS rebinding。
- 页面只允许停留在本地服务，其它链接交给系统浏览器打开。
- 网页服务固定监听 `127.0.0.1:17370`（可用 `CANVAS_DESKTOP_WEB_PORT` 覆盖）；端口一变，按 origin 隔离的本地配置与画布数据就读不到了。
- 页面响应带 CSP：脚本仅允许同源，并允许 `unsafe-eval`（渠道的模型调用脚本用 `new Function` 执行，禁掉等于关掉该功能）。
