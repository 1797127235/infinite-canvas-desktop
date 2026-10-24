const assert = require("node:assert/strict");
const test = require("node:test");

const { buildCodexModelCatalog, buildCodexToml, classifyModel, enrichVisibleModels, fetchAvailableModels, filterSelectedModels, hasExistingCodexConfig, modelsDevProviderMap, normalizeOpenAIBaseUrl, openAIApiRoot } = require("./onboarding");

test("enriches every C2A-visible model without dropping IDs missing from models.dev", () => {
    const models = enrichVisibleModels(
        ["gpt-compatible", "provider/model-alias"],
        { provider: { models: { "model-alias": { name: "Model Alias", limit: { context: 128000, output: 8000 }, modalities: { input: ["text", "image"] }, reasoning: true } } } },
    );

    assert.deepEqual(models, [
        { id: "gpt-compatible", name: "gpt-compatible", contextWindow: undefined, contextInferred: false, maxOutputTokens: undefined, inputModalities: ["text"], reasoning: false, toolCall: false, capability: "text" },
        { id: "provider/model-alias", name: "Model Alias", contextWindow: 128000, contextInferred: false, maxOutputTokens: 8000, inputModalities: ["text", "image"], reasoning: true, toolCall: false, capability: "text" },
    ]);
});

test("fetches all models from C2A and never sends the API key to models.dev", async () => {
    const requests = [];
    const models = await fetchAvailableModels({
        baseUrl: "https://api.example.com/v1",
        apiKey: "test-secret",
        fetchImpl: async (url, options = {}) => {
            requests.push({ url, options });
            if (url.endsWith("/models")) return { ok: true, json: async () => ({ data: [{ id: "grok-4.7" }, { id: "MiniMax-H3" }] }) };
            throw new Error("metadata offline");
        },
    });

    assert.deepEqual(requests.map((request) => request.url), ["https://api.example.com/v1/models", "https://models.dev/api.json"]);
    assert.equal(requests[0].options.headers.Authorization, "Bearer test-secret");
    assert.equal(requests[1].options.headers, undefined);
    assert.deepEqual(models.map((model) => model.id), ["grok-4.7", "MiniMax-H3"]);
});

test("keeps multiple selected text models in selection order", () => {
    const selected = filterSelectedModels(
        [{ id: "text-b", name: "Text B", inputModalities: ["text"], capability: "text" }, { id: "image-x", name: "Image X", inputModalities: ["text", "image"], capability: "image" }, { id: "text-a", name: "Text A", inputModalities: ["text"], capability: "text" }],
        ["text-a", "text-b"],
    );

    assert.deepEqual(selected.map((model) => model.id), ["text-a", "text-b"]);
});

test("drops text models whose context length is unknown once metadata is available", () => {
    const models = [
        { id: "grok-4.7", name: "Grok 4.7", contextWindow: 500000, inputModalities: ["text"], capability: "text" },
        { id: "grok-4.7-build-fast", name: "grok-4.7-build-fast", inputModalities: ["text"], capability: "text" },
    ];
    assert.deepEqual(filterSelectedModels(models, ["grok-4.7", "grok-4.7-build-fast"]).map((model) => model.id), ["grok-4.7"]);
});

test("keeps every text model when models.dev is unreachable so offline setup still works", () => {
    const models = [
        { id: "grok-4.7", name: "grok-4.7", inputModalities: ["text"], capability: "text" },
        { id: "grok-4.7-build-fast", name: "grok-4.7-build-fast", inputModalities: ["text"], capability: "text" },
    ];
    assert.deepEqual(filterSelectedModels(models, ["grok-4.7", "grok-4.7-build-fast"]).map((model) => model.id), ["grok-4.7", "grok-4.7-build-fast"]);
});

test("uses models.dev output modalities to keep non-text models out of the Codex text picker", () => {
    const [imageModel, textModel] = enrichVisibleModels(
        ["vendor/opaque-a", "vendor/opaque-b"],
        { vendor: { models: { "opaque-a": { name: "Opaque A", modalities: { output: ["image"] } }, "opaque-b": { name: "Opaque B", modalities: { output: ["text"] } } } } },
    );
    assert.equal(imageModel.capability, "image");
    assert.equal(textModel.capability, "text");
    assert.deepEqual(filterSelectedModels([imageModel, textModel], [imageModel.id, textModel.id]).map((model) => model.id), [textModel.id]);
});

test("keeps the input modalities models.dev reports instead of forcing text-only", () => {
    const catalog = buildCodexModelCatalog([
        { id: "coding-a", name: "Coding A", contextWindow: 128000, maxOutputTokens: 8000, inputModalities: ["text", "image"], reasoning: true, capability: "text" },
        { id: "coding-b", name: "Coding B", contextWindow: 64000, maxOutputTokens: 4000, inputModalities: ["text"], reasoning: false, capability: "text" },
    ]);

    assert.equal(catalog.models.length, 2);
    assert.deepEqual(catalog.models.map((model) => model.slug), ["coding-a", "coding-b"]);
    assert.deepEqual(catalog.models.map((model) => model.context_window), [128000, 64000]);
    assert.deepEqual(catalog.models.map((model) => model.input_modalities), [["text", "image"], ["text"]]);
    for (const model of catalog.models) {
        assert.ok(model.supported_reasoning_levels.length > 0);
        assert.ok("truncation_policy" in model);
        assert.ok("supports_parallel_tool_calls" in model);
    }
});

test("drops modalities Codex rejects so the whole catalog still parses", () => {
    // models.dev 会给出 pdf / video，而 Codex 的枚举只有 text / image / audio，
    // 原样透传会让整个 model_catalog_json 解析失败、助手直接无法启动。
    const [model] = buildCodexModelCatalog([{ id: "grok-4.7", name: "Grok 4.7", inputModalities: ["text", "image", "pdf"], capability: "text" }]).models;

    assert.deepEqual(model.input_modalities, ["text", "image"]);
});

test("falls back to text-only modalities when metadata is missing", () => {
    const [model] = buildCodexModelCatalog([{ id: "coding-a", name: "Coding A", capability: "text" }]).models;

    assert.deepEqual(model.input_modalities, ["text"]);
});

test("configures selected models on a Responses provider without embedding credentials", () => {
    const toml = buildCodexToml({ baseUrl: "https://api.example.com", defaultModel: "coding-a", modelCatalogPath: "/private/codex/models.json", keyEnvironmentVariable: "CANVAS_C2A_API_KEY" });

    assert.match(toml, /model = "coding-a"/);
    assert.match(toml, /model_provider = "canvas_c2a"/);
    assert.match(toml, /base_url = "https:\/\/api\.example\.com\/v1"/);
    assert.match(toml, /wire_api = "responses"/);
    assert.match(toml, /env_key = "CANVAS_C2A_API_KEY"/);
    assert.match(toml, /model_catalog_json = "\/private\/codex\/models\.json"/);
    assert.doesNotMatch(toml, /sk-[A-Za-z0-9_-]+/);
});

test("resolves a model ID shared by many providers through canonical_model_id", () => {
    // 真实场景：grok-4.7 在 9 个 provider 下都有，azure 报的 context 和原厂不同。
    const map = modelsDevProviderMap({
        xai: { models: { "grok-4.7": { id: "grok-4.7", name: "Grok 4.7", limit: { context: 500000, output: 500000 }, canonical_model_id: "xai/grok-4.7" } } },
        azure: { models: { "grok-4.7": { id: "grok-4.7", name: "Grok 4.7", limit: { context: 200000, output: 128000 }, canonical_model_id: "xai/grok-4.7" } } },
    });
    const [model] = enrichVisibleModels(["grok-4.7"], map.catalog, map.aliases);
    assert.equal(model.contextWindow, 500000);
    assert.equal(model.maxOutputTokens, 500000);
    assert.equal(model.name, "Grok 4.7");
});

test("infers context from the same family when C2A reports no metadata for a variant", () => {
    const map = modelsDevProviderMap({
        xai: { models: { "grok-4.7": { id: "grok-4.7", name: "Grok 4.7", limit: { context: 500000, output: 500000 }, canonical_model_id: "xai/grok-4.7" } } },
    });
    const [variant, exact] = enrichVisibleModels(["grok-4.7-build-fast", "grok-4.7"], map.catalog, map.aliases);
    assert.equal(variant.contextWindow, 500000);
    assert.equal(variant.contextInferred, true);
    assert.equal(exact.contextInferred, false);
});

test("does not infer from a single leading segment so unrelated IDs are not guessed", () => {
    const map = modelsDevProviderMap({ xai: { models: { grok: { id: "grok", limit: { context: 999 } } } } });
    const [model] = enrichVisibleModels(["grok-composer-2.5-fast"], map.catalog, map.aliases);
    assert.equal(model.contextWindow, undefined);
    assert.equal(model.contextInferred, false);
});

test("falls back to the consensus context when no first-party entry exists", () => {
    // 真实场景：deepseek-v4.1-flash 的 canonical 指向 deepseek，但该 provider 没有这个条目。
    const entry = (context) => ({ id: "deepseek-v4.1-flash", limit: { context }, canonical_model_id: "deepseek/deepseek-v4.1-flash" });
    const map = modelsDevProviderMap({
        a: { models: { "deepseek-v4.1-flash": entry(1000000) } },
        b: { models: { "deepseek-v4.1-flash": entry(1000000) } },
        c: { models: { "deepseek-v4.1-flash": entry(1048576) } },
    });
    const [model] = enrichVisibleModels(["deepseek-v4.1-flash"], map.catalog, map.aliases);
    assert.equal(model.contextWindow, 1000000);
});

test("does not attach arbitrary first-provider metadata when a model ID is ambiguous", () => {
    const map = modelsDevProviderMap({ first: { models: { shared: { name: "Wrong", limit: { context: 999999 } } } }, second: { models: { shared: { name: "Also Wrong", limit: { context: 888888 } } } } });
    const [model] = enrichVisibleModels(["shared"], map.catalog, map.aliases);
    assert.equal(model.contextWindow, undefined);
    assert.equal(model.name, "shared");
});

test("matches models.dev provider IDs without stripping original C2A IDs", () => {
    const map = modelsDevProviderMap({ "anthropic/openai-compat": { models: { "reasoner-1": { name: "Reasoner 1" } } } });
    const models = enrichVisibleModels(["reasoner-1", "custom/unknown"], map.catalog, map.aliases);
    assert.equal(models[0].id, "reasoner-1");
    assert.equal(models[0].name, "Reasoner 1");
    assert.equal(models[1].id, "custom/unknown");
});

test("detects existing Codex config or auth without reading credential contents", () => {
    assert.equal(hasExistingCodexConfig({ configTomlExists: false, authJsonExists: true, codexExecutableExists: false }), true);
    assert.equal(hasExistingCodexConfig({ configTomlExists: false, authJsonExists: false, codexExecutableExists: true }), true);
    assert.equal(hasExistingCodexConfig({ configTomlExists: false, authJsonExists: false, codexExecutableExists: false }), false);
});

test("keeps the channel Base URL at the site root while deriving a single OpenAI /v1 root", () => {
    assert.equal(normalizeOpenAIBaseUrl("https://api.example.com/"), "https://api.example.com");
    assert.equal(normalizeOpenAIBaseUrl("https://api.example.com/v1/"), "https://api.example.com");
    assert.equal(openAIApiRoot("https://api.example.com"), "https://api.example.com/v1");
    assert.equal(openAIApiRoot("https://api.example.com/v1/"), "https://api.example.com/v1");
});

test("classifies image and video models while leaving unknown models text-capable", () => {
    assert.equal(classifyModel("grok-imagine-image-2.0"), "image");
    assert.equal(classifyModel("MiniMax-H3"), "video");
    assert.equal(classifyModel("provider/coding-model"), "text");
});

test("rejects malformed model IDs instead of generating unsafe Codex configuration", () => {
    assert.throws(() => buildCodexToml({ baseUrl: "file:///etc/passwd", defaultModel: "bad\"model", modelCatalogPath: "/private/models.json", keyEnvironmentVariable: "CANVAS_C2A_API_KEY" }));
});
