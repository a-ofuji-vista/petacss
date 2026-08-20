import { escapeForScriptElement } from "./preview-escape.ts";

/**
 * GitHub Pages 等の静的ホストでは HTTP レスポンスヘッダーを付与できない。
 * frame-ancestors は meta CSP でも指定不可のため、`<head>` 先頭の同期スクリプトで
 * X-Frame-Options: SAMEORIGIN / frame-ancestors 'self' 相当の防御を行う。
 *
 * PREVIEW_PAGE_HEADERS と方針を揃える（自オリジンの iframe のみ許可）。
 */
const PREVIEW_FRAME_GUARD_SOURCE = `(function () {
  if (window.top === window.self) return;

  try {
    if (window.top.location.origin === window.location.origin) return;
  } catch (_) {
    // クロスオリジン iframe: top への参照が Same-Origin Policy で遮断される
  }

  try {
    window.top.location = window.location;
  } catch (_) {
    document.documentElement.remove();
  }
})();`;

export const PREVIEW_FRAME_GUARD_SCRIPT = escapeForScriptElement(
  PREVIEW_FRAME_GUARD_SOURCE,
);
