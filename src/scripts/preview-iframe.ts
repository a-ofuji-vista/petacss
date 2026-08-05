import {
  PREVIEW_BRIDGE_MSG,
  PREVIEW_MAX_HEIGHT,
  type PreviewBridgeMessage,
} from "../lib/preview-bridge.ts";
import { resolveTheme } from "../lib/theme.ts";
import { bindPageInit, initElements } from "./init-elements.ts";

function isPreviewBridgeMessage(data: unknown): data is PreviewBridgeMessage {
  if (!data || typeof data !== "object") return false;
  const msg = data as PreviewBridgeMessage;
  return msg.type === PREVIEW_BRIDGE_MSG;
}

function parseCssLengthPx(value: string): number | undefined {
  const px = Number.parseFloat(value);
  return Number.isFinite(px) ? px : undefined;
}

function getPreviewMinHeight(root: HTMLElement): number | undefined {
  const raw =
    root.style.getPropertyValue("--snippet-panel-min-height").trim() ||
    getComputedStyle(root)
      .getPropertyValue("--snippet-panel-min-height")
      .trim();
  return raw ? parseCssLengthPx(raw) : undefined;
}

function setupPreviewIframe(iframe: HTMLIFrameElement): () => void {
  const controller = new AbortController();
  const { signal } = controller;
  let pendingHeight: number | undefined;
  let heightRaf = 0;

  const flushHeight = () => {
    heightRaf = 0;
    if (pendingHeight === undefined) return;

    const height = pendingHeight;
    pendingHeight = undefined;

    const root = iframe.closest(".js-snippet-tabs");
    if (!(root instanceof HTMLElement)) return;

    const minHeight = getPreviewMinHeight(root);
    const isScroll = root.classList.contains("c-snippet-tabs--preview-scroll");
    const isNoPadding = root.classList.contains(
      "c-snippet-tabs--preview-no-padding",
    );

    let effectiveHeight = height;

    if (!isScroll && isNoPadding && minHeight != null) {
      effectiveHeight = minHeight;
    }

    root.style.setProperty("--snippet-panel-height", `${effectiveHeight}px`);
  };

  const applyHeight = (height: number) => {
    pendingHeight = Math.min(
      Math.max(0, Math.ceil(height)),
      PREVIEW_MAX_HEIGHT,
    );
    if (heightRaf) return;
    heightRaf = requestAnimationFrame(flushHeight);
  };

  const syncColorScheme = () => {
    iframe.contentWindow?.postMessage(
      {
        type: PREVIEW_BRIDGE_MSG,
        action: "set-color-scheme",
        colorScheme: resolveTheme(document.documentElement.dataset.theme),
      } satisfies PreviewBridgeMessage,
      "*",
    );
  };

  const onMessage = (event: MessageEvent) => {
    if (event.source !== iframe.contentWindow) return;
    if (!isPreviewBridgeMessage(event.data)) return;
    if (event.data.action !== "resize") return;
    if (
      typeof event.data.height !== "number" ||
      !Number.isFinite(event.data.height)
    ) {
      return;
    }
    applyHeight(event.data.height);
  };

  const hideLoader = () => {
    const root = iframe.closest(".js-snippet-tabs");
    if (!(root instanceof HTMLElement)) return;
    root
      .querySelector<HTMLElement>(".js-preview-loader")
      ?.setAttribute("hidden", "");
  };

  window.addEventListener("message", onMessage, { signal });
  iframe.addEventListener("load", syncColorScheme, { signal });
  iframe.addEventListener("load", hideLoader, { signal });
  if (iframe.contentDocument?.readyState === "complete") {
    syncColorScheme();
    hideLoader();
  }
  matchMedia("(prefers-color-scheme: dark)").addEventListener(
    "change",
    syncColorScheme,
    { signal },
  );

  const themeObserver = new MutationObserver(syncColorScheme);
  themeObserver.observe(document.documentElement, {
    attributes: true,
    attributeFilter: ["data-theme"],
  });

  return () => {
    controller.abort();
    themeObserver.disconnect();
    if (heightRaf) cancelAnimationFrame(heightRaf);
  };
}

bindPageInit(() =>
  initElements<HTMLIFrameElement>(".js-preview-iframe", setupPreviewIframe),
);
