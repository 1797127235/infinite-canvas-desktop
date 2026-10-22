import type { ReactNode } from "react";
import { useEffect, useRef } from "react";
import { App } from "antd";
import { useTranslation } from "react-i18next";

import { applyOnboardingChannel, useConfigStore } from "@/stores/use-config-store";
import { isDesktopShell } from "@/constant/desktop-shell";
import { usePromptSourceScheduler } from "@/hooks/use-prompt-source-scheduler";

export function ClientRootInit({ children }: { children: ReactNode }) {
    const { message } = App.useApp();
    const { t } = useTranslation();
    const handledConfigParams = useRef(false);
    const onboardingLoaded = useRef(false);
    const importChannelCredentials = useConfigStore((state) => state.importChannelCredentials);
    const openConfigDialog = useConfigStore((state) => state.openConfigDialog);

    usePromptSourceScheduler();

    useEffect(() => {
        if (!isDesktopShell || onboardingLoaded.current || !window.canvasDesktop?.readOnboarding) return;
        onboardingLoaded.current = true;
        void window.canvasDesktop
            .readOnboarding()
            .then((setup) => {
                if (!setup || window.localStorage.getItem("infinite-canvas:desktop-c2a-onboarding") === setup.setupId) return;
                const store = useConfigStore.getState();
                const config = applyOnboardingChannel(store.config, setup);
                useConfigStore.setState({ config });
                window.localStorage.setItem("infinite-canvas:desktop-c2a-onboarding", setup.setupId);
            })
            .catch((error) => {
                message.error(error instanceof Error ? error.message : "读取 C2A 初始化配置失败");
            });
    }, [message]);

    useEffect(() => {
        if (handledConfigParams.current) return;
        const searchParams = new URLSearchParams(window.location.search);
        const baseUrl = searchParams.get("baseUrl") || searchParams.get("baseurl");
        const apiKey = searchParams.get("apiKey") || searchParams.get("apikey");
        if (!baseUrl && !apiKey) return;
        handledConfigParams.current = true;
        searchParams.delete("baseUrl");
        searchParams.delete("baseurl");
        searchParams.delete("apiKey");
        searchParams.delete("apikey");
        window.history.replaceState(null, "", `${window.location.pathname}${searchParams.size ? `?${searchParams}` : ""}${window.location.hash}`);
        const result = importChannelCredentials({ baseUrl, apiKey });
        openConfigDialog(false, "channels");
        if (result.status === "created") message.success(t("config.importedChannelCreated", { name: result.channelName }));
        else if (result.status === "updated") message.success(t("config.importedChannelUpdated", { name: result.channelName }));
        else if (result.status === "missing-base-url") message.error(t("config.importedChannelBaseUrlRequired"));
        else message.error(t("config.importedChannelBaseUrlInvalid"));
    }, [importChannelCredentials, message, openConfigDialog, t]);

    return <>{children}</>;
}
