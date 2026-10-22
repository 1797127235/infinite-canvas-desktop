const fs = require("node:fs");
const path = require("node:path");

/** 只有既没有 Codex 配置、也没有 Codex 可执行文件的全新用户，才由向导接管 Codex。 */
function setupCodexDecision(existingCodex) {
    return !existingCodex;
}

const KEY_ENV = "CANVAS_C2A_API_KEY";

function readSetup(userDataPath, safeStorage) {
    const file = path.join(userDataPath, "onboarding.json");
    if (!fs.existsSync(file)) return null;
    let record;
    try {
        record = JSON.parse(fs.readFileSync(file, "utf8"));
    } catch {
        throw new Error("桌面 C2A 初始化文件损坏；为避免覆盖原有配置，请先备份并移走 onboarding.json 后重新启动");
    }
    let apiKey;
    try {
        apiKey = safeStorage.decryptString(Buffer.from(record.encryptedApiKey, "base64"));
    } catch {
        throw new Error("无法解密桌面 C2A API Key；请检查系统钥匙串后重试，或备份后移走 onboarding.json 重新配置");
    }
    if (!apiKey || !record.baseUrl || !Array.isArray(record.models)) throw new Error("桌面 C2A 初始化文件格式不完整；为避免覆盖配置，请备份并移走 onboarding.json 后重新启动");
    return { setupId: record.setupId, baseUrl: record.baseUrl, apiKey, models: record.models, selectedTextModels: record.selectedTextModels || [], defaultTextModel: record.defaultTextModel || "", useManagedCodexHome: Boolean(record.useManagedCodexHome) };
}

function channelSetupForRenderer(setup) {
    return setup ? { setupId: setup.setupId, baseUrl: setup.baseUrl, apiKey: setup.apiKey, modelIds: setup.models.map((model) => model.id), defaultTextModel: setup.defaultTextModel } : null;
}

function saveSetup({ userDataPath, safeStorage, baseUrl, apiKey, models, selectedTextModels = [], defaultTextModel = "", setupCodex }) {
    if (!safeStorage.isEncryptionAvailable()) throw new Error("系统凭据加密不可用，请启用系统钥匙串后重试");
    if (safeStorage.getSelectedStorageBackend?.() === "basic_text") throw new Error("Linux 未检测到系统钥匙串；请安装并解锁 GNOME Keyring 或 KDE Wallet 后重试");
    if (!apiKey || !models.length) throw new Error("请先填写有效的 C2A Key 并获取模型列表");
    if (setupCodex && selectedTextModels.length && !selectedTextModels.includes(defaultTextModel)) throw new Error("默认助手模型必须属于已选文本模型");
    const { buildCodexModelCatalog, buildCodexToml, filterSelectedModels } = require("./onboarding");
    const selectedModels = setupCodex ? filterSelectedModels(models, selectedTextModels) : [];
    const setupCodexModels = setupCodex && selectedModels.some((model) => model.id === defaultTextModel);

    const root = path.join(userDataPath, "codex-home");
    const setupId = require("node:crypto").randomUUID();
    const record = {
        version: 1,
        setupId,
        baseUrl,
        encryptedApiKey: safeStorage.encryptString(apiKey).toString("base64"),
        models,
        selectedTextModels: setupCodexModels ? selectedTextModels : [],
        defaultTextModel: setupCodexModels ? defaultTextModel : "",
        useManagedCodexHome: setupCodexModels,
    };
    fs.mkdirSync(userDataPath, { recursive: true, mode: 0o700 });
    if (setupCodexModels) {
        fs.mkdirSync(root, { recursive: true, mode: 0o700 });
        fs.writeFileSync(path.join(root, "models.json"), JSON.stringify(buildCodexModelCatalog(selectedModels), null, 2), { mode: 0o600 });
        fs.writeFileSync(path.join(root, "config.toml"), buildCodexToml({ baseUrl, defaultModel: defaultTextModel, modelCatalogPath: path.join(root, "models.json"), keyEnvironmentVariable: KEY_ENV }), { mode: 0o600 });
    }
    const recordPath = path.join(userDataPath, "onboarding.json");
    const temporaryPath = `${recordPath}.${process.pid}.tmp`;
    fs.writeFileSync(temporaryPath, JSON.stringify(record), { mode: 0o600 });
    fs.renameSync(temporaryPath, recordPath);
    return { useManagedCodexHome: setupCodexModels, codexHome: setupCodexModels ? root : "" };
}

module.exports = { KEY_ENV, channelSetupForRenderer, readSetup, saveSetup, setupCodexDecision };
