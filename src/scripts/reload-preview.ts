import { bindPageInit, initElements } from "./init-elements.ts";

const RELOAD_MARK = /\n<!--reload:\d+-->$/;

function reloadPreviewIframe(iframe: HTMLIFrameElement) {
  const current = iframe.srcdoc;
  if (!current) return;

  const base = current.replace(RELOAD_MARK, "");
  iframe.srcdoc = `${base}\n<!--reload:${Date.now()}-->`;
}

function setupReloadPreviewButton(button: HTMLButtonElement): () => void {
  const root = button.closest(".js-snippet-tabs");
  if (!(root instanceof HTMLElement)) {
    return () => {};
  }

  const controller = new AbortController();
  const { signal } = controller;

  button.addEventListener(
    "click",
    () => {
      const iframe =
        root.querySelector<HTMLIFrameElement>(".js-preview-iframe");
      if (!iframe?.srcdoc) return;

      root
        .querySelector<HTMLElement>(".js-preview-loader")
        ?.removeAttribute("hidden");

      const scrollEl = root.querySelector(".c-snippet-tabs__preview-scroll");
      if (scrollEl instanceof HTMLElement) {
        scrollEl.scrollTop = 0;
        scrollEl.scrollLeft = 0;
      }

      const previewTab = root.querySelector<HTMLButtonElement>(
        '.js-snippet-tab[data-tab="preview"]',
      );
      if (previewTab?.getAttribute("aria-selected") !== "true") {
        previewTab?.click();
      }

      reloadPreviewIframe(iframe);
    },
    { signal },
  );

  return () => controller.abort();
}

bindPageInit(() =>
  initElements<HTMLButtonElement>(
    ".js-reload-preview",
    setupReloadPreviewButton,
  ),
);
