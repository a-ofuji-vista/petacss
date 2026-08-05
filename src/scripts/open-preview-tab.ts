import { resolveTheme } from "../lib/theme.ts";
import { bindPageInit, initElements } from "./init-elements.ts";

/**
 * プレビュータブが閉じられた、または blob 以外へ遷移したら Object URL を解放する。
 * blob 表示中は revoke すると再読込・履歴遷移で表示できなくなるため、維持する。
 */
function schedulePreviewBlobRevoke(
  openedWindow: Window,
  previewObjectUrl: string,
): void {
  let revoked = false;

  const revoke = () => {
    if (revoked) return;
    revoked = true;
    URL.revokeObjectURL(previewObjectUrl);
    window.clearInterval(revokeTimer);
  };

  const revokeTimer = window.setInterval(() => {
    if (openedWindow.closed) {
      revoke();
      return;
    }

    try {
      const href = openedWindow.location.href;
      // window.open 直後の about:blank は blob ロード前の一瞬なので維持
      if (href === "about:blank") return;
      if (!href.startsWith(previewObjectUrl)) {
        revoke();
      }
    } catch {
      // 別オリジンへ遷移したら blob は不要
      revoke();
    }
  }, 1000);
}

function setupOpenPreviewButton(button: HTMLButtonElement): () => void {
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

      const previewBlob = new Blob([iframe.srcdoc], { type: "text/html" });
      const previewObjectUrl = URL.createObjectURL(previewBlob);
      const theme = resolveTheme(document.documentElement.dataset.theme);
      const previewUrl = `${previewObjectUrl}#theme=${theme}`;
      const openedWindow = window.open(
        previewUrl,
        "_blank",
        "noopener,noreferrer",
      );

      if (openedWindow) {
        schedulePreviewBlobRevoke(openedWindow, previewObjectUrl);
      } else {
        URL.revokeObjectURL(previewObjectUrl);
      }
    },
    { signal },
  );

  return () => controller.abort();
}

bindPageInit(() =>
  initElements<HTMLButtonElement>(
    ".js-open-preview-tab",
    setupOpenPreviewButton,
  ),
);
