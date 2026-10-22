type ConfigValue = { model_catalog_json?: unknown } | null | undefined;

export function shouldUseCodexModelCatalog(config: ConfigValue) {
    return typeof config?.model_catalog_json === "string" && config.model_catalog_json.trim().length > 0;
}
