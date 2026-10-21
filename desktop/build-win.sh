#!/usr/bin/env bash
# 在 Linux 上借 Wine 打 Windows 安装包。
# 不用 electron-builder 自带的 Wine 11 便携包（toolsets.wine）：该包只带 x86_64-unix，
# 缺 lib/wine/x86_64-windows 里的 PE 内置 DLL（连 kernel32.dll 都没有），
# 跑 NSIS 卸载器那一步必定 c0000135，所以这里统一走系统 Wine。
set -euo pipefail
cd "$(dirname "$0")"

if ! command -v wine64 >/dev/null; then
    echo "缺少 Wine：sudo apt-get install -y --no-install-recommends wine64" >&2
    exit 1
fi

# Debian/Ubuntu 只装 wine64 时没有 /usr/bin/wine，而 electron-builder 按名字找 wine。
if ! command -v wine >/dev/null; then
    mkdir -p "$HOME/.local/bin"
    printf '#!/bin/sh\nexec /usr/bin/wine64 "$@"\n' > "$HOME/.local/bin/wine"
    chmod +x "$HOME/.local/bin/wine"
    echo "已生成 $HOME/.local/bin/wine，请确认它在 PATH 中" >&2
fi

USE_SYSTEM_WINE=true exec npx electron-builder --win --x64 "$@"
