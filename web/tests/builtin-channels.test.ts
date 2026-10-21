import { afterAll, expect, test } from "bun:test";
import type { AiConfig } from "../src/stores/use-config-store";

// Config and i18n use browser storage during module initialization.
const values = new Map<string, string>();
const originalStorage = Object.getOwnPropertyDescriptor(globalThis, "localStorage");
Object.defineProperty(globalThis, "localStorage", {
    configurable: true,
    value: {
        getItem: (key: string) => values.get(key) ?? null,
        setItem: (key: string, value: string) => values.set(key, value),
        removeItem: (key: string) => values.delete(key),
    },
});
afterAll(() => {
    if (originalStorage) Object.defineProperty(globalThis, "localStorage", originalStorage);
    else Reflect.deleteProperty(globalThis, "localStorage");
});

const { defaultConfig, normalizeChannels } = await import("../src/stores/use-config-store");
const { AGNES_CHANNEL } = await import("../src/constant/agnes-channel");
const { C2A_CHANNEL } = await import("../src/constant/c2a-channel");

const baseUrls = (channels: { baseUrl: string }[]) => channels.map((channel) => channel.baseUrl);
const scriptCount = (models: { script?: string }[]) => models.filter((model) => model.script?.trim()).length;
const withChannels = (channels: unknown[]): AiConfig => ({ ...defaultConfig, channels }) as AiConfig;

test("默认配置同时内置 Agnes 与 C2A", () => {
    expect(baseUrls(defaultConfig.channels)).toEqual([AGNES_CHANNEL.baseUrl, C2A_CHANNEL.baseUrl]);
    const c2a = defaultConfig.channels.find((channel) => channel.id === C2A_CHANNEL.id);
    expect(c2a?.models.map((model) => model.name)).toEqual(C2A_CHANNEL.models.map((model) => model.name));
    // Grok 视频两个 + MiniMax-H3 + H3-Max，共 4 个模型带内置脚本。
    expect(scriptCount(c2a?.models ?? [])).toBe(4);
});

test("全新安装（本地无配置）会得到两个内置渠道", () => {
    expect(baseUrls(normalizeChannels(withChannels([])))).toEqual([AGNES_CHANNEL.baseUrl, C2A_CHANNEL.baseUrl]);
});

test("老配置只有 Agnes 时补齐 C2A，不覆盖已有 Key", () => {
    const channels = normalizeChannels(withChannels([{ ...AGNES_CHANNEL, apiKey: "sk-agnes-keep-me" }]));
    expect(baseUrls(channels)).toEqual([AGNES_CHANNEL.baseUrl, C2A_CHANNEL.baseUrl]);
    expect(channels[0].apiKey).toBe("sk-agnes-keep-me");
    expect(channels[1].apiKey).toBe("");
});

test("只保存了 C2A 时补齐 Agnes，C2A 的 Key 与模型保持不变并刷回脚本", () => {
    const saved = { ...C2A_CHANNEL, apiKey: "sk-c2a", models: [{ name: "grok-4.7", capability: "text" as const, script: "" }] };
    const channels = normalizeChannels(withChannels([saved]));
    expect(baseUrls(channels)).toEqual([C2A_CHANNEL.baseUrl, AGNES_CHANNEL.baseUrl]);
    expect(channels[0].id).toBe(C2A_CHANNEL.id);
    expect(channels[0].apiKey).toBe("sk-c2a");
    // 缺失的内置模型补回来，脚本也补齐。
    expect(channels[0].models.length).toBe(C2A_CHANNEL.models.length);
    expect(scriptCount(channels[0].models)).toBe(4);
});

test("用户自建的第三方渠道原样保留，内置渠道追加在后", () => {
    const thirdParty = { id: "custom", name: "自建", baseUrl: "https://example.com/v1", apiKey: "sk-x", apiFormat: "openai" as const, models: [{ name: "my-model", capability: "text" as const }] };
    const channels = normalizeChannels(withChannels([thirdParty]));
    expect(baseUrls(channels)).toEqual([thirdParty.baseUrl, AGNES_CHANNEL.baseUrl, C2A_CHANNEL.baseUrl]);
    expect(channels[0].apiKey).toBe("sk-x");
    expect(channels[0].models.map((model) => model.name)).toEqual(["my-model"]);
});

test("旧版保存的 C2A 渠道脚本丢失时会被内置脚本刷新", () => {
    const stale = { ...C2A_CHANNEL, models: C2A_CHANNEL.models.map((model) => ({ name: model.name, capability: model.capability, script: "" })) };
    const channels = normalizeChannels(withChannels([AGNES_CHANNEL, stale]));
    const c2a = channels.find((channel) => channel.baseUrl === C2A_CHANNEL.baseUrl);
    expect(scriptCount(c2a?.models ?? [])).toBe(4);
});

test("不会重复追加内置渠道", () => {
    const channels = normalizeChannels(withChannels([AGNES_CHANNEL, C2A_CHANNEL]));
    expect(channels.length).toBe(2);
});

test("旧版回退出来的「默认渠道」按地址认回内置渠道并换成真实名称", () => {
    // 旧版本在 channels 为空时会用 config.baseUrl 造一个「默认渠道」，名字是通用名。
    const legacy = { id: "default", name: "默认渠道", baseUrl: AGNES_CHANNEL.baseUrl, apiKey: "sk-keep", apiFormat: "openai" as const, models: [{ name: "agnes-image-2.5-flash", capability: "image" as const }] };
    const channels = normalizeChannels(withChannels([legacy]));
    expect(baseUrls(channels)).toEqual([AGNES_CHANNEL.baseUrl, C2A_CHANNEL.baseUrl]);
    expect(channels[0].name).toBe(AGNES_CHANNEL.name);
    expect(channels[0].apiKey).toBe("sk-keep");
});

test("用户自己改过的渠道名不被覆盖", () => {
    const renamed = { ...AGNES_CHANNEL, name: "我的 Agnes" };
    const channels = normalizeChannels(withChannels([renamed, C2A_CHANNEL]));
    expect(channels[0].name).toBe("我的 Agnes");
});
