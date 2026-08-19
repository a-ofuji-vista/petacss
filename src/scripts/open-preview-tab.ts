import { resolveTheme } from "../lib/theme.ts";
import { bindPageInit, initElements } from "./init-elements.ts";

function syncPreviewThemeHash(link: HTMLAnchorElement): void {
  const theme = resolveTheme(document.documentElement.dataset.theme);
  const url = new URL(link.href, window.location.origin);
  link.href = `${url.pathname}#theme=${theme}`;
}

const previewLinks = new Set<HTMLAnchorElement>();
let stopThemeWatch: (() => void) | null = null;

function syncAllPreviewLinks(): void {
  for (const link of previewLinks) {
    syncPreviewThemeHash(link);
  }
}

function startThemeWatch(): void {
  if (stopThemeWatch) return;

  const controller = new AbortController();
  const { signal } = controller;

  matchMedia("(prefers-color-scheme: dark)").addEventListener(
    "change",
    syncAllPreviewLinks,
    { signal },
  );

  const themeObserver = new MutationObserver(syncAllPreviewLinks);
  themeObserver.observe(document.documentElement, {
    attributes: true,
    attributeFilter: ["data-theme"],
  });

  stopThemeWatch = () => {
    controller.abort();
    themeObserver.disconnect();
    stopThemeWatch = null;
  };
}

function stopThemeWatchIfIdle(): void {
  if (previewLinks.size === 0) {
    stopThemeWatch?.();
  }
}

function setupOpenPreviewLink(link: HTMLAnchorElement): () => void {
  previewLinks.add(link);
  startThemeWatch();
  syncPreviewThemeHash(link);

  return () => {
    previewLinks.delete(link);
    stopThemeWatchIfIdle();
  };
}

bindPageInit(() =>
  initElements<HTMLAnchorElement>(".js-open-preview-tab", setupOpenPreviewLink),
);
