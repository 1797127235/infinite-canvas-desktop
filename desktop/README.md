# Infinite Canvas Desktop

Windows / Linux 桌面版。Canvas Agent 仅作为桌面内部组件运行，不再提供独立 npm CLI；用户无需安装 Node、填写 Agent 地址或自己启动代理。

## 桌面壳内置了什么

| 能力 | 网页版 | 桌面版 |
| --- | --- | --- |
| 网页产物 | 自己部署静态站点 | 打包进安装包，由主进程用同源本地服务托管 |
| Canvas Agent | 不再提供独立 CLI 接入 | 主进程以 `desktop` 模式拉起，地址由壳注入 |
| Codex 运行时 | 用户自己 `npm i -g @openai/codex` | 首次启动下载到用户数据目录，之后复用 |
| 本地代理 | `npx @basketikun/canvas-proxy@latest` | 主进程直接拉起，网页自动启用 |
| 跨域 | 需要代理或直连 | Agent 走同源反代（`/agent-api`），AI 接口走内置代理 |

## 首次启动配置

第一次启动时，桌面向导会用默认 C2A Base URL 拉取该 Key 可见的全部模型。新用户可多选 Codex 文本模型并指定默认项；模型元数据（上下文长度、输入模态、推理能力）从 models.dev 补齐；同一 ID 挂在多个 provider 下时按 `canonical_model_id` 取原厂条目，没有原厂条目则取该组上下文长度的众数；仍查不到时按同家族推断（`grok-4.7-build-fast` 取 `grok-4.7`，要求剥到至少两段），推断值在向导里标注「推断」。彻底查不到元数据、也无法同家族推断的文本模型不会进入助手模型列表，画布渠道仍保留 Key 可见的全部模型及内置视频脚本；models.dev 整体不可用时保留全部文本模型，不让离线阻断助手配置。

检测到已有 Codex 配置或可执行文件时，向导只设置画布 C2A 渠道，不修改用户的 Codex provider、登录状态或配置文件。全新用户的 Codex provider 和多模型目录写入应用专属 `userData/codex-home/`，不触碰 `~/.codex/config.toml`。助手用的 C2A Key 由 Electron `safeStorage` 通过系统凭据后端加密；Linux 处于 `basic_text` 降级后端时会拒绝配置助手并提示启用 GNOME Keyring 或 KDE Wallet，不会静默写入明文。画布渠道 Key 沿用软件现有的浏览器本地配置存储机制。

## 开发运行

```bash
cd desktop
npm install
npm run resources   # 构建 web/dist 与 canvas-agent/dist，并只留生产依赖
npm start
```

`npm run resources` 会依次执行 canvas-agent 的安装与构建、裁剪 devDependencies、以及网页构建。网页部分用 bun 安装与构建（`antd 6` 与 `@ant-design/pro-components` 的 peer 声明冲突，npm 会直接 ERESOLVE），需要先装好 bun。产物缺失时桌面壳会直接报错并提示执行它。

## 打包

```bash
npm run dist:win     # NSIS 安装包（x64）
npm run dist:linux   # AppImage + deb（x64）
npm run dist         # 两个平台一起打
```

产物在 `desktop/release/`。

### 自动更新

更新源是本仓库（`1797127235/infinite-canvas-desktop`）的 GitHub Releases，由 `electron-builder.yml` 的 `publish` 显式声明——fork 的 `homepage` 指向 upstream，不显式声明 electron-updater 会按 package.json 找错仓库。发布新版本时把 `release/` 里的安装包、`.blockmap` 与 `latest.yml`（Windows）/ `latest-linux.yml`（Linux）一并传到对应版本的 Release，已安装的客户端即可收到更新；也可以交给 electron-builder 直接发布草稿：

```bash
GH_TOKEN=<github token> npm run dist -- --publish always
```

运行期行为：仅打包后启用；启动时静默检查一次，离线或 GitHub 不可达时静默跳过；「帮助 → 检查更新…」可手动检查并弹窗反馈结果。发现新版本自动后台下载（Windows 走 `.blockmap` 增量下载），完成后弹窗询问重启安装，更新覆盖整个安装包（网页产物、Canvas Agent、本地代理一起更新）。安装包文件名不能带空格：electron-builder 写进 latest.yml 时把空格换成 `-`，GitHub 存资产名时把空格换成 `.`，两边对不上下载就 404（已实测），`artifactName` 已改用无空格命名，发布时不要再上传旧的带空格产物。安装包未签名，Windows 更新可能弹 SmartScreen 警告。`deb` 包自动更新需要系统授权，Linux 用户建议使用 AppImage。

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

## 日志

桌面壳是唯一文件日志出口，Agent、Codex app-server 和代理的子进程输出统一收集到 `userData/desktop.log`：

- Windows：`%APPDATA%\Infinite Canvas\desktop.log`
- Linux：通常为 `~/.config/Infinite Canvas/desktop.log`

需要详细日志时给桌面程序传入 `--debug`，开发时用 `npm start -- --debug`；详情仍写入同一个文件。Agent 不再单独创建按日期命名的日志，也不会自动删除以前的日志文件。`~/.infinite-canvas/` 中的会话、附件和 Skill 数据不受影响。

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
