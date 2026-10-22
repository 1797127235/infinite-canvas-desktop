const DEFAULT_REASONING_LEVELS = [
    { effort: "low", description: "Low reasoning" },
    { effort: "medium", description: "Medium reasoning" },
    { effort: "high", description: "High reasoning" },
];

/**
 * 同一个裸 ID 常常挂在多个 provider 下（grok-4.7 在 9 个 provider 里都有）。
 * 优先取 canonical_model_id 指向的原厂条目；原厂没有对应条目时取该组 context 的众数；
 * 两方都无法确定就返回 undefined，宁可不填也不猜一个 provider 的值。
 */
function representativeModel(entries) {
    if (entries.length === 1) return entries[0][1];
    const groups = new Map();
    for (const entry of entries) {
        const key = entry[1].canonical_model_id || entry[1].id || entry[0];
        groups.set(key, [...(groups.get(key) || []), entry]);
    }
    const ranked = [...groups].sort((a, b) => b[1].length - a[1].length);
    if (ranked.length > 1 && ranked[0][1].length === ranked[1][1].length) return undefined;
    const [canonicalId, group] = ranked[0];
    const firstParty = group.find(([providerId]) => providerId === canonicalId.split("/")[0]);
    if (firstParty) return firstParty[1];
    const counts = new Map();
    for (const [, model] of group) {
        const context = model.limit?.context;
        if (Number.isFinite(context)) counts.set(context, (counts.get(context) || 0) + 1);
    }
    const [context, count] = [...counts].sort((a, b) => b[1] - a[1] || a[0] - b[0])[0] || [];
    return count * 2 > group.length ? group.find(([, model]) => model.limit?.context === context)[1] : undefined;
}

function modelsDevProviderMap(modelsDev) {
    const catalog = new Map();
    const byId = new Map();
    for (const [providerId, provider] of Object.entries(modelsDev || {})) {
        for (const [id, model] of Object.entries(provider.models || {})) {
            catalog.set(`${providerId}/${id}`, model);
            byId.set(id, [...(byId.get(id) || []), [providerId, model]]);
        }
    }
    const aliases = new Map();
    for (const [id, entries] of byId) {
        const picked = representativeModel(entries);
        if (picked) aliases.set(id, picked);
    }
    return { catalog, aliases };
}

/** 是否已有 Codex 配置或安装：只做存在性判断，不读凭据内容。 */
function hasExistingCodexConfig({ configTomlExists, authJsonExists, codexExecutableExists }) {
    return Boolean(configTomlExists || authJsonExists || codexExecutableExists);
}

async function fetchAvailableModels({ baseUrl, apiKey, fetchImpl = fetch }) {
    const apiRoot = openAIApiRoot(baseUrl);
    const modelsResponse = await fetchImpl(`${apiRoot}/models`, { headers: { Authorization: `Bearer ${apiKey}` } });
    if (!modelsResponse.ok) throw new Error(`C2A 模型列表请求失败（HTTP ${modelsResponse.status}）`);
    const payload = await modelsResponse.json();
    const ids = (payload.data || []).map((model) => model.id).filter(Boolean);
    let metadata = {};
    try {
        const metadataResponse = await fetchImpl("https://models.dev/api.json");
        if (metadataResponse.ok) metadata = await metadataResponse.json();
    } catch {}
    const maps = modelsDevProviderMap(metadata);
    return enrichVisibleModels(ids, maps.catalog, maps.aliases);
}

function parseBaseUrl(value) {
    let url;
    try {
        url = new URL(String(value || "").trim());
    } catch {
        throw new Error("Base URL 必须是有效的 HTTP(S) 地址");
    }
    if (!["http:", "https:"].includes(url.protocol) || !url.hostname || url.username || url.password) throw new Error("Base URL 必须是有效的 HTTP(S) 地址");
    url.hash = "";
    return url;
}

function normalizeOpenAIBaseUrl(value) {
    const url = parseBaseUrl(value);
    url.pathname = url.pathname.replace(/\/+$/, "").replace(/\/v1$/i, "");
    return url.toString().replace(/\/$/, "");
}

function openAIApiRoot(value) {
    return `${normalizeOpenAIBaseUrl(value)}/v1`;
}

function classifyModel(id) {
    const name = id.toLowerCase();
    if (/(^|[-_/])(video|sora|veo|kling|wan|hailuo)([-_/]|$)/.test(name) || name.includes("minimax-h3")) return "video";
    if (/(^|[-_/])(image|dall-e|dalle|flux|imagen|seedream)([-_/]|$)/.test(name) || name.includes("grok-imagine-image")) return "image";
    if (/(^|[-_/])(audio|tts|speech|voice|music)([-_/]|$)/.test(name)) return "audio";
    return "text";
}

function capabilityFromMetadata(id, detail) {
    const inferred = classifyModel(id);
    if (inferred !== "text" || !Array.isArray(detail?.modalities?.output)) return inferred;
    const outputs = detail.modalities.output;
    if (outputs.length === 1 && typeof outputs[0] === "string") {
        if (outputs[0].startsWith("image")) return "image";
        if (outputs[0].startsWith("audio")) return "audio";
        if (outputs[0].startsWith("video")) return "video";
    }
    return inferred;
}

/**
 * C2A 不返回任何模型元数据，所以只能按同家族推断：逐段剥掉尾部后缀，找到已有真实元数据的基准模型。
 * 例如 grok-4.7-build-fast → grok-4.7、grok-3-mini-fast → grok-3-mini。
 * 只认剥到至少两段的结果，避免 grok-* 这种过宽的匹配；基准模型本身必须已解析出元数据。
 */
function inferFromFamily(bareId, aliases) {
    const segments = bareId.split("-");
    for (let end = segments.length - 1; end >= 2; end -= 1) {
        const base = aliases.get(segments.slice(0, end).join("-"));
        if (base) return base;
    }
    return undefined;
}

function enrichVisibleModels(visibleIds, modelsDev, aliases = new Map()) {
    const catalog = modelsDev instanceof Map ? modelsDev : modelsDevProviderMap(modelsDev).catalog;
    return visibleIds.map((rawId) => {
        const id = String(typeof rawId === "object" ? rawId.id : rawId || "").trim();
        const bareId = id.includes("/") ? id.split("/").at(-1) : id;
        const resolved = catalog.get(id) || aliases.get(bareId);
        const detail = resolved || inferFromFamily(bareId, aliases);
        const inferred = !resolved && Boolean(detail);
        const modalities = detail?.modalities?.input;
        return {
            id,
            name: detail?.name || id,
            contextWindow: Number.isFinite(detail?.limit?.context) && detail.limit.context > 0 ? detail.limit.context : undefined,
            contextInferred: inferred,
            maxOutputTokens: Number.isFinite(detail?.limit?.output) && detail.limit.output > 0 ? detail.limit.output : undefined,
            inputModalities: Array.isArray(modalities) && modalities.length ? modalities : ["text"],
            reasoning: Boolean(detail?.reasoning),
            toolCall: Boolean(detail?.tool_call),
            capability: capabilityFromMetadata(id, detail),
        };
    }).filter((model) => model.id);
}

/**
 * 助手只能选文本模型，且必须能确定上下文长度：models.dev 里查不到的私有变体直接丢弃。
 * models.dev 整体不可用时所有模型都没有元数据，此时保留全部，不让离线变成「无法配置助手」。
 */
function filterSelectedModels(models, selectedIds) {
    const byId = new Map(models.map((model) => [model.id, model]));
    const picked = [...new Set(selectedIds.map(String))].map((id) => byId.get(id)).filter((model) => model?.capability === "text" && model.inputModalities.includes("text"));
    const hasMetadata = models.some((model) => model.contextWindow !== undefined);
    return hasMetadata ? picked.filter((model) => model.contextWindow !== undefined) : picked;
}

function buildCodexModelCatalog(models) {
    if (!models.length) throw new Error("至少选择一个文本模型");
    return {
        models: models.map((model, priority) => ({
            slug: model.id,
            display_name: model.name || model.id,
            description: null,
            supported_reasoning_levels: model.reasoning ? DEFAULT_REASONING_LEVELS : [{ effort: "low", description: "Low reasoning" }],
            default_reasoning_level: model.reasoning ? "medium" : "low",
            shell_type: "shell_command",
            visibility: "list",
            supported_in_api: true,
            priority: priority + 1,
            availability_nux: null,
            upgrade: null,
            base_instructions: "",
            model_messages: null,
            default_reasoning_summary: "auto",
            support_verbosity: false,
            default_verbosity: null,
            apply_patch_tool_type: null,
            truncation_policy: { mode: "tokens", limit: model.contextWindow ? Math.min(32000, model.contextWindow) : 32000 },
            supports_parallel_tool_calls: model.toolCall === true,
            experimental_supported_tools: [],
            ...(model.contextWindow ? { context_window: model.contextWindow } : {}),
            input_modalities: ["text"],
        })),
    };
}

function buildCodexToml({ baseUrl, defaultModel, modelCatalogPath, keyEnvironmentVariable }) {
    const normalizedBaseUrl = openAIApiRoot(baseUrl);
    for (const [label, value] of Object.entries({ defaultModel, modelCatalogPath, keyEnvironmentVariable })) {
        if (!value || /[\r\n\0]/.test(value)) throw new Error(`${label} 无效`);
    }
    const quote = (value) => JSON.stringify(value);
    return [
        `model = ${quote(defaultModel)}`,
        'model_provider = "canvas_c2a"',
        `model_catalog_json = ${quote(modelCatalogPath)}`,
        "",
        "[model_providers.canvas_c2a]",
        'name = "C2A"',
        `base_url = ${quote(normalizedBaseUrl)}`,
        `env_key = ${quote(keyEnvironmentVariable)}`,
        'wire_api = "responses"',
        "",
    ].join("\n");
}

module.exports = { buildCodexModelCatalog, buildCodexToml, classifyModel, enrichVisibleModels, fetchAvailableModels, filterSelectedModels, hasExistingCodexConfig, modelsDevProviderMap, normalizeOpenAIBaseUrl, openAIApiRoot };
