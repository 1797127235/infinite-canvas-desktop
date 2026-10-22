const assert = require("node:assert/strict");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const test = require("node:test");

const { readSetup, saveSetup, setupCodexDecision } = require("./onboarding-store");
const models = [
    { id: "text-a", name: "Text A", contextWindow: 128000, inputModalities: ["text"], reasoning: true, capability: "text" },
    { id: "image-x", name: "Image X", inputModalities: ["text", "image"], reasoning: false, capability: "image" },
];

function fakeSafeStorage(backend = "gnome_libsecret") {
    return {
        isEncryptionAvailable: () => true,
        getSelectedStorageBackend: () => backend,
        encryptString: (value) => Buffer.from(`enc:${value}`),
        decryptString: (value) => String(value).replace(/^enc:/, ""),
    };
}

test("persists the canvas key encrypted and writes selected text models in an isolated CODEX_HOME", (context) => {
    const userDataPath = fs.mkdtempSync(path.join(os.tmpdir(), "canvas-onboarding-"));
    context.after(() => fs.rmSync(userDataPath, { recursive: true, force: true }));
    const result = saveSetup({ userDataPath, safeStorage: fakeSafeStorage(), baseUrl: "https://api.example.com", apiKey: "secret-c2a-key", models, selectedTextModels: ["text-a"], defaultTextModel: "text-a", setupCodex: true });
    const recordText = fs.readFileSync(path.join(userDataPath, "onboarding.json"), "utf8");

    assert.equal(recordText.includes("secret-c2a-key"), false);
    assert.equal(readSetup(userDataPath, fakeSafeStorage()).apiKey, "secret-c2a-key");
    assert.equal(result.useManagedCodexHome, true);
    const catalog = JSON.parse(fs.readFileSync(path.join(result.codexHome, "models.json"), "utf8"));
    assert.deepEqual(catalog.models.map((model) => model.slug), ["text-a"]);
    assert.match(fs.readFileSync(path.join(result.codexHome, "config.toml"), "utf8"), /CANVAS_C2A_API_KEY/);
});

test("refuses to persist a key when Linux safeStorage has fallen back to basic text", () => {
    const userDataPath = fs.mkdtempSync(path.join(os.tmpdir(), "canvas-onboarding-"));
    try {
        assert.throws(() => saveSetup({ userDataPath, safeStorage: fakeSafeStorage("basic_text"), baseUrl: "https://api.example.com", apiKey: "secret", models, setupCodex: false }), /系统钥匙串/);
        assert.equal(fs.existsSync(path.join(userDataPath, "onboarding.json")), false);
    } finally {
        fs.rmSync(userDataPath, { recursive: true, force: true });
    }
});

test("allows canvas setup when the key has no selectable text model and defers Codex setup", (context) => {
    const userDataPath = fs.mkdtempSync(path.join(os.tmpdir(), "canvas-onboarding-"));
    context.after(() => fs.rmSync(userDataPath, { recursive: true, force: true }));
    const imageOnly = [{ id: "image-x", name: "Image X", inputModalities: ["text", "image"], reasoning: false, capability: "image" }];
    const result = saveSetup({ userDataPath, safeStorage: fakeSafeStorage(), baseUrl: "https://api.example.com", apiKey: "secret-c2a-key", models: imageOnly, setupCodex: true });
    assert.equal(result.useManagedCodexHome, false);
    assert.equal(fs.existsSync(path.join(userDataPath, "codex-home", "config.toml")), false);
    assert.equal(readSetup(userDataPath, fakeSafeStorage()).apiKey, "secret-c2a-key");
});

test("refuses to overwrite a malformed setup record", (context) => {
    const userDataPath = fs.mkdtempSync(path.join(os.tmpdir(), "canvas-onboarding-"));
    context.after(() => fs.rmSync(userDataPath, { recursive: true, force: true }));
    const file = path.join(userDataPath, "onboarding.json");
    fs.writeFileSync(file, "{broken", { mode: 0o600 });
    assert.throws(() => readSetup(userDataPath, fakeSafeStorage()), /onboarding/i);
    assert.equal(fs.readFileSync(file, "utf8"), "{broken");
});

test("leaves the setup record intact when encrypted key material cannot be decrypted", (context) => {
    const userDataPath = fs.mkdtempSync(path.join(os.tmpdir(), "canvas-onboarding-"));
    context.after(() => fs.rmSync(userDataPath, { recursive: true, force: true }));
    saveSetup({ userDataPath, safeStorage: fakeSafeStorage(), baseUrl: "https://api.example.com", apiKey: "secret-c2a-key", models, setupCodex: false });
    const file = path.join(userDataPath, "onboarding.json");
    const before = fs.readFileSync(file, "utf8");
    assert.throws(() => readSetup(userDataPath, { decryptString: () => { throw new Error("keyring unavailable"); } }), /无法解密/);
    assert.equal(fs.readFileSync(file, "utf8"), before);
});

test("creates a managed Codex provider only when Codex is not installed or configured", () => {
    assert.equal(setupCodexDecision(false), true);
    assert.equal(setupCodexDecision(true), false);
});

test("does not create or change Codex configuration for users who already have Codex configured", (context) => {
    const userDataPath = fs.mkdtempSync(path.join(os.tmpdir(), "canvas-onboarding-"));
    context.after(() => fs.rmSync(userDataPath, { recursive: true, force: true }));
    const result = saveSetup({ userDataPath, safeStorage: fakeSafeStorage(), baseUrl: "https://api.example.com", apiKey: "secret-c2a-key", models, setupCodex: false });

    assert.equal(result.useManagedCodexHome, false);
    assert.equal(fs.existsSync(path.join(userDataPath, "codex-home", "config.toml")), false);
    assert.equal(readSetup(userDataPath, fakeSafeStorage()).apiKey, "secret-c2a-key");
});
