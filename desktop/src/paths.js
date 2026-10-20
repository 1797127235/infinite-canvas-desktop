const fs = require("node:fs");
const path = require("node:path");
const { app } = require("electron");

/** 仓库根目录；打包后目录结构不同，统一在 layout() 里区分。 */
const repoRoot = path.resolve(__dirname, "..", "..");
const packaged = app.isPackaged;

/** 桌面壳依赖的三份产物所在根目录。 */
function layout() {
    const root = packaged ? process.resourcesPath : repoRoot;
    return {
        packed: packaged,
        web: packaged ? path.join(root, "web") : path.join(root, "web", "dist"),
        agentEntry: path.join(root, "canvas-agent", "dist", "index.js"),
        agentHome: path.join(root, "canvas-agent"),
        proxyEntry: path.join(root, "canvas-proxy", "index.js"),
        codexPackageJson: path.join(root, "canvas-agent", "node_modules", "@openai", "codex", "package.json"),
    };
}

/** canvas-agent 依赖的 Codex 版本，用来决定下载哪个平台包。 */
function codexVersion() {
    const { codexPackageJson } = layout();
    if (!fs.existsSync(codexPackageJson)) throw new Error("安装包缺少 Canvas Agent 依赖，请先执行 npm run resources");
    try {
        return String(JSON.parse(fs.readFileSync(codexPackageJson, "utf8")).version || "");
    } catch {
        throw new Error(`无法读取 Canvas Agent 依赖版本：${codexPackageJson}`);
    }
}

module.exports = { layout, codexVersion, repoRoot };