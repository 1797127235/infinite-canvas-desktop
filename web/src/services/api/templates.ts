import { setMediaBlob } from "@/services/file-storage";
import { setImageBlob } from "@/services/image-storage";
import { useCanvasStore } from "@/stores/canvas/use-canvas-store";
import { useConfigStore } from "@/stores/use-config-store";
import type { CanvasBackgroundMode } from "@/lib/canvas-theme";
import type { CanvasConnection, CanvasNodeData, ViewportTransform } from "@/types/canvas";

// 内置工作流模板：索引和画布数据在 /templates/templates.json，媒体按 files 里的路径单独拉取。
// 节点 metadata.content 指向 /templates 静态地址，预览时浏览器直接加载；克隆时才把原文件写进本地存储。
export type WorkflowTemplateFile = {
    storageKey: string;
    path: string;
    mimeType: string;
};

export type WorkflowTemplate = {
    id: string;
    title: string;
    description: string;
    tags: string[];
    author: string;
    cover: string;
    /** 成果视频路径，可选；模板卡片悬停时懒加载并静音循环播放。 */
    previewVideo?: string;
    project: {
        title: string;
        backgroundMode?: CanvasBackgroundMode;
        viewport: ViewportTransform;
        nodes: CanvasNodeData[];
        connections: CanvasConnection[];
    };
    files: WorkflowTemplateFile[];
};

export async function fetchWorkflowTemplates() {
    const response = await fetch(TEMPLATE_INDEX_PATH);
    if (!response.ok) throw new Error("template index request failed");
    return (await response.json()) as WorkflowTemplate[];
}

/** 克隆模板：把模板媒体写入本地存储，改写节点里的静态地址，然后导入成一张新画布；返回新画布 id。 */
export async function cloneWorkflowTemplate(template: WorkflowTemplate) {
    const replacements = new Map<string, string>();
    for (const file of template.files) {
        const response = await fetch(`${TEMPLATE_BASE}${templateAssetPath(file.path)}`);
        if (!response.ok) throw new Error(`template media request failed: ${file.path}`);
        const blob = await response.blob();
        const typed = blob.type ? blob : blob.slice(0, blob.size, file.mimeType);
        // 沿用模板自带的 storageKey，同一模板重复克隆只会覆盖同样的字节。
        const url = file.storageKey.startsWith("image:") ? await setImageBlob(file.storageKey, typed) : await setMediaBlob(file.storageKey, typed);
        replacements.set(file.path, url);
    }
    const project = structuredClone(template.project);
    rewriteMediaContent(project, replacements);
    dropUnavailableModels(project, availableModelValues());
    return useCanvasStore.getState().importProject({ ...project, title: template.title });
}

const TEMPLATE_INDEX_PATH = "/templates/templates.json";
const TEMPLATE_BASE = "/templates/";
// 模板媒体只允许来自本应用自带的 /templates 目录，文件名限定为安全字符集，避免被配置成任意外部地址。
const TEMPLATE_ASSET_SEGMENT = /^[A-Za-z0-9._\-/]+\.(?:png|jpe?g|webp|gif|mp4|webm|mov|mp3|wav|m4a)$/i;

/** 校验并返回 /templates/ 下的相对路径；调用处只用字面前缀拼接这个已校验片段。 */
function templateAssetPath(path: string) {
    if (typeof path !== "string" || !path.startsWith(TEMPLATE_BASE)) throw new Error("template media path invalid");
    const segment = path.slice(TEMPLATE_BASE.length);
    if (!TEMPLATE_ASSET_SEGMENT.test(segment) || segment.includes("..")) throw new Error("template media path invalid");
    return segment;
}

/** 模板里的模型属于导出者自己的渠道，本机未必有；清掉后回落到用户自己的默认模型，避免克隆后卡在“模型不可用”。 */
function dropUnavailableModels(project: { nodes: CanvasNodeData[] }, available: Set<string>) {
    for (const node of project.nodes) {
        const model = node.metadata?.model;
        if (typeof model !== "string" || !model.trim() || available.has(model) || !node.metadata) continue;
        const { model: _dropped, ...rest } = node.metadata;
        node.metadata = rest;
    }
}

function availableModelValues() {
    const { channels } = useConfigStore.getState().config;
    return new Set(channels.flatMap((channel) => channel.models.map((model) => `${channel.id}::${model.name}`)));
}

/** 把节点 metadata 里的 /templates 静态地址换成刚写入本地存储得到的 blob 地址。 */
function rewriteMediaContent(value: unknown, replacements: Map<string, string>) {
    if (!value || typeof value !== "object") return;
    if (Array.isArray(value)) {
        value.forEach((item) => rewriteMediaContent(item, replacements));
        return;
    }
    const record = value as Record<string, unknown>;
    for (const field of ["content", "url", "dataUrl"]) {
        const current = record[field];
        if (typeof current === "string" && replacements.has(current)) record[field] = replacements.get(current)!;
    }
    Object.values(record).forEach((item) => rewriteMediaContent(item, replacements));
}
