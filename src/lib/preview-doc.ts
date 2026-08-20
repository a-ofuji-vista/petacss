import {
  inlinePreviewAssets,
  inlinePreviewCssAssets,
  inlinePreviewExternalScripts,
  rewritePreviewAssetUrls,
  rewritePreviewCssAssetUrls,
} from "./preview-assets.ts";
import { PREVIEW_RELOAD_ICON_SVG } from "./preview-reload-icon.ts";
import { PREVIEW_BRIDGE_MSG } from "./preview-bridge.ts";
import { PREVIEW_FRAME_GUARD_SCRIPT } from "./preview-frame-guard.ts";
import {
  escapeForBodyFragment,
  escapeForHtmlAttribute,
  escapeForScriptElement,
  escapeForStyleElement,
} from "./preview-escape.ts";
import type { PreviewDirection, PreviewPlacement } from "./snippets.ts";

export {
  escapeForBodyFragment,
  escapeForHtmlAttribute,
  escapeForScriptElement,
  escapeForStyleElement,
} from "./preview-escape.ts";

/**
 * 動画だけは data URI 化せず絶対 URL で読み込むため、media-src に配信元を明示する。
 * 末尾 `/` でパスプレフィックス一致（/snippets/... を許可）。sandbox 付き iframe /
 * srcdoc は opaque origin になり 'self' がどのオリジンにも一致しないため。
 */
function buildPreviewCsp(assetOrigin: string): string {
  const mediaOrigin = `${assetOrigin.replace(/\/+$/, "")}/`;
  return [
    "default-src 'none'",
    "style-src 'unsafe-inline' https://fonts.googleapis.com",
    "script-src 'unsafe-inline'",
    "font-src https://fonts.gstatic.com",
    "img-src data: blob:",
    `media-src data: blob: ${mediaOrigin}`,
    "connect-src 'none'",
  ].join("; ");
}

/**
 * 親ページとは postMessage のみで通信するブリッジ。
 * window.parent.document 等の同一オリジン API は使わない。
 */
const PREVIEW_BRIDGE_SCRIPT = escapeForScriptElement(`(function () {
  var MSG = ${JSON.stringify(PREVIEW_BRIDGE_MSG)};

  if (window.opener) {
    window.opener = null;
  }

  if (window.parent === window) {
    document.documentElement.classList.add("preview-standalone");
    // 別タブでは iframe 用の embed-scroll を外し、document 自体をスクロールさせる。
    document.documentElement.classList.remove("preview-embed-scroll");
  }

  function getThemeFromHash() {
    var params = new URLSearchParams(location.hash.replace(/^#/, ""));
    var theme = params.get("theme");
    return theme === "dark" || theme === "light" ? theme : undefined;
  }

  function applyColorScheme(scheme) {
    var resolved =
      scheme === "dark" || scheme === "light"
        ? scheme
        : matchMedia("(prefers-color-scheme: dark)").matches
          ? "dark"
          : "light";
    document.documentElement.style.colorScheme = resolved;
    document.documentElement.dataset.theme = resolved;
  }

  var initialTheme = getThemeFromHash();
  applyColorScheme(initialTheme);

  matchMedia("(prefers-color-scheme: dark)").addEventListener("change", function () {
    applyColorScheme(initialTheme);
  });

  var embedScroll = document.documentElement.classList.contains("preview-embed-scroll");

  window.addEventListener("message", function (event) {
    var data = event.data;
    if (!data || data.type !== MSG) return;
    if (data.action === "set-color-scheme") {
      applyColorScheme(data.colorScheme);
      return;
    }
    if (data.action !== "set-scroll") return;
    if (!embedScroll || window.parent === window) return;
    if (typeof data.scrollTop !== "number" || !Number.isFinite(data.scrollTop)) return;
    document.documentElement.scrollTop = Math.max(0, data.scrollTop);
  });

  document.addEventListener(
    "click",
    function (event) {
      var anchor = event.target.closest("a[href]");
      if (!anchor) return;
      event.preventDefault();
    },
    true,
  );

  if (embedScroll) {
    document.addEventListener(
      "wheel",
      function (event) {
        if (window.parent === window) return;
        event.preventDefault();
        parent.postMessage(
          {
            type: MSG,
            action: "wheel",
            deltaY: event.deltaY,
            deltaMode: event.deltaMode,
          },
          "*",
        );
      },
      { passive: false },
    );

    var lastTouchY = null;

    document.addEventListener(
      "touchstart",
      function (event) {
        if (window.parent === window) return;
        if (event.touches.length !== 1) {
          lastTouchY = null;
          return;
        }
        lastTouchY = event.touches[0].clientY;
      },
      { passive: true },
    );

    document.addEventListener(
      "touchmove",
      function (event) {
        if (window.parent === window) return;
        if (event.touches.length !== 1 || lastTouchY === null) return;
        event.preventDefault();
        var currentY = event.touches[0].clientY;
        var deltaY = lastTouchY - currentY;
        lastTouchY = currentY;
        if (deltaY === 0) return;
        parent.postMessage(
          {
            type: MSG,
            action: "wheel",
            deltaY: deltaY,
            deltaMode: 0,
          },
          "*",
        );
      },
      { passive: false },
    );

    document.addEventListener(
      "touchend",
      function () {
        lastTouchY = null;
      },
      { passive: true },
    );

    document.addEventListener(
      "touchcancel",
      function () {
        lastTouchY = null;
      },
      { passive: true },
    );
  }

  function measureHeight() {
    var content = document.querySelector(".preview-content");
    if (!content) return Math.ceil(document.body.scrollHeight);

    var style = getComputedStyle(content);
    var paddingY =
      (parseFloat(style.paddingTop) || 0) +
      (parseFloat(style.paddingBottom) || 0);
    var children = content.children;

    if (children.length > 0) {
      var flexDirection = style.flexDirection;
      var isRow =
        flexDirection === "row" || flexDirection === "row-reverse";
      var gap = isRow
        ? parseFloat(style.columnGap || style.gap) || 0
        : parseFloat(style.rowGap || style.gap) || 0;
      var childHeight = 0;

      for (var i = 0; i < children.length; i++) {
        childHeight += children[i].getBoundingClientRect().height;
        if (i > 0) childHeight += gap;
      }

      return Math.ceil(childHeight + paddingY);
    }

    return Math.ceil(content.scrollHeight);
  }

  function reportHeight() {
    if (reportHeight.scheduled) return;
    reportHeight.scheduled = true;
    requestAnimationFrame(function () {
      reportHeight.scheduled = false;
      parent.postMessage(
        { type: MSG, action: "resize", height: measureHeight() },
        "*",
      );
    });
  }

  function observeContent() {
    var content = document.querySelector(".preview-content");
    if (!content) return;
    reportHeight();
    var resizeObserver = new ResizeObserver(reportHeight);
    resizeObserver.observe(content);
    for (var i = 0; i < content.children.length; i++) {
      resizeObserver.observe(content.children[i]);
    }
    if (document.fonts && document.fonts.ready) {
      document.fonts.ready.then(reportHeight);
    }
    window.addEventListener("load", reportHeight);
    window.addEventListener("resize", reportHeight);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", observeContent);
  } else {
    observeContent();
  }
})();`);

/**
 * previewScroll 時、親のクリップ領域を ScrollTrigger に伝える。
 * GSAP 読み込み後・スニペット JS より前に置く。
 */
const PREVIEW_SCROLL_PROXY_SCRIPT = escapeForScriptElement(`(function () {
  if (typeof ScrollTrigger === "undefined") return;

  var MSG = ${JSON.stringify(PREVIEW_BRIDGE_MSG)};
  var inFrame = window.parent !== window;
  var received = false;
  var viewHeight = inFrame ? 1 : window.innerHeight;
  var scroller = document.documentElement;

  if (typeof gsap !== "undefined") {
    gsap.registerPlugin(ScrollTrigger);
  }

  ScrollTrigger.scrollerProxy(scroller, {
    scrollTop: function () {
      return scroller.scrollTop;
    },
    getBoundingClientRect: function () {
      return {
        top: 0,
        left: 0,
        width: window.innerWidth,
        height: inFrame ? viewHeight : window.innerHeight,
      };
    },
    pinType: "transform",
  });

  var updateRaf = 0;

  window.addEventListener("message", function (event) {
    var data = event.data;
    if (!data || data.type !== MSG || data.action !== "set-scroll") return;
    if (typeof data.clientHeight !== "number" || !Number.isFinite(data.clientHeight)) {
      return;
    }

    viewHeight = Math.max(1, data.clientHeight);
    var first = !received;
    received = true;

    if (first) {
      ScrollTrigger.refresh();
      return;
    }

    if (updateRaf) return;
    updateRaf = requestAnimationFrame(function () {
      updateRaf = 0;
      ScrollTrigger.update();
    });
  });
})();`);

const PREVIEW_RELOAD_SCRIPT = escapeForScriptElement(`(function () {
  if (window.parent !== window) return;
  var button = document.querySelector(".preview-reload");
  if (!button) return;
  if ("scrollRestoration" in history) {
    history.scrollRestoration = "manual";
  }
  button.addEventListener("click", function () {
    document.documentElement.scrollTop = 0;
    document.body.scrollTop = 0;
    location.reload();
  });
})();`);

const PREVIEW_RELOAD_STYLE = `
      .preview-reload {
        display: none;
      }

      html.preview-standalone .preview-reload {
        position: fixed;
        top: var(--space-4);
        right: var(--space-4);
        z-index: var(--z-header);
        display: inline-flex;
        align-items: center;
        justify-content: center;
        width: var(--size-touch-target);
        height: var(--size-touch-target);
        padding: 0;
        color: var(--color-fg-default);
        cursor: pointer;
        background-color: var(--color-bg-default);
        border: 1px solid var(--color-border-default);
        border-radius: var(--radius-sm);
      }

      html.preview-standalone .preview-reload:focus-visible {
        outline: var(--focus-ring-width) solid var(--color-focus);
        outline-offset: var(--focus-ring-offset);
      }

      @media (any-hover: hover) {
        html.preview-standalone .preview-reload {
          transition: background-color var(--transition-fast);
        }

        html.preview-standalone .preview-reload:hover {
          background-color: var(--color-bg-surface);
        }
      }
`;

const PREVIEW_RELOAD_MARKUP = `<button type="button" class="preview-reload" aria-label="プレビューを再読み込み" title="再読み込み">
      ${PREVIEW_RELOAD_ICON_SVG}
    </button>
    <script>${PREVIEW_RELOAD_SCRIPT}<\/script>`;

export interface PreviewDocOptions {
  /** プレビュー内の /snippets/... を絶対 URL に書き換える際のオリジン（origin + BASE_URL）。 */
  assetOrigin: string;
  resetCss: string;
  tokensCss: string;
  css: string;
  html: string;
  js?: string;
  head?: string;
  /** ブラウザタブ用タイトル（未指定時は Preview | PETA CSS） */
  title?: string;
  previewPlacement?: PreviewPlacement;
  previewPadding?: boolean;
  previewDirection?: PreviewDirection;
  previewGap?: string;
  previewBackground?: string;
  /** 別タブ表示時にプレビュー再読み込みボタンを出す（Animation など） */
  showPreviewReload?: boolean;
  /**
   * プレビュー枠で縦スクロールする。iframe は枠の高さに固定し、
   * 親のスクロール量を iframe の scrollTop に伝える。
   */
  previewScroll?: boolean;
  /**
   * X-Frame-Options 相当のフレームガードを `<head>` 先頭に挿入する。
   * sandbox 付き埋め込み iframe（opaque origin）では誤作動するため、
   * /preview/[slug] の単独ページからのみ true にすること。
   */
  enableFrameGuard?: boolean;
}

function buildPreviewBodyAttrs({
  previewPlacement,
  previewDirection,
  previewGap,
  previewBackground,
}: Pick<
  PreviewDocOptions,
  "previewPlacement" | "previewDirection" | "previewGap" | "previewBackground"
>): { className: string; style: string } {
  const className =
    previewPlacement === "center"
      ? "preview-body preview-body--center"
      : "preview-body preview-body--start";

  const styleParts: string[] = [];
  if (previewDirection) {
    styleParts.push(`--preview-direction: ${previewDirection}`);
  }
  if (previewGap) {
    styleParts.push(`--preview-gap: ${previewGap}`);
  }
  if (previewBackground) {
    styleParts.push(`--preview-background: ${previewBackground}`);
  }

  return { className, style: styleParts.join("; ") };
}

/**
 * スニペット Preview 用の独立 HTML ドキュメントを組み立てる。
 * destyle.css → tokens → Preview 用最小スタイル → スニペット CSS の順で読み込み、
 * 最後にスニペット HTML / JS を body に展開する。
 */
export async function buildPreviewDoc({
  assetOrigin,
  resetCss,
  tokensCss,
  css,
  html,
  js,
  head,
  title,
  previewPlacement = "center",
  previewPadding = true,
  previewDirection,
  previewGap,
  previewBackground,
  showPreviewReload = false,
  previewScroll = false,
  enableFrameGuard = false,
}: PreviewDocOptions): Promise<string> {
  const safeAssetOrigin = escapeForHtmlAttribute(assetOrigin);
  const safeTitle = escapeForHtmlAttribute(
    title ? `${title} | PETA CSS` : "Preview | PETA CSS",
  );
  const safeResetCss = escapeForStyleElement(resetCss);
  const safeTokensCss = escapeForStyleElement(tokensCss);
  const safeCss = escapeForStyleElement(
    rewritePreviewCssAssetUrls(inlinePreviewCssAssets(css), assetOrigin),
  );
  const htmlWithAssets = rewritePreviewAssetUrls(
    inlinePreviewAssets(html),
    assetOrigin,
  );
  // スニペット側の HTML だけを対象にエスケープしてから外部スクリプトを埋め込む。
  // 埋め込み後にエスケープすると、フェッチした第三者スクリプトの中身
  // （文字列リテラル等）に `</body>` 等が偶然含まれていた場合に書き換えてしまうため。
  const escapedHtml = escapeForBodyFragment(htmlWithAssets);
  const safeHtml = await inlinePreviewExternalScripts(escapedHtml);
  const safeJs = js ? escapeForScriptElement(js) : undefined;
  const safeHead = head?.trim();
  const { className: previewBodyClass, style: previewBodyStyle } =
    buildPreviewBodyAttrs({
      previewPlacement,
      previewDirection,
      previewGap,
      previewBackground,
    });

  return `<!doctype html>
<html lang="ja"${previewScroll ? ` class="preview-embed-scroll"` : ""}>
  <head>
    <meta charset="utf-8" />
    ${enableFrameGuard ? `<script>${PREVIEW_FRAME_GUARD_SCRIPT}<\/script>` : ""}
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>${safeTitle}</title>
    <meta name="robots" content="noindex, nofollow" />
    <meta name="referrer" content="same-origin" />
    <meta http-equiv="Content-Security-Policy" content="${buildPreviewCsp(safeAssetOrigin)}" />
    <link rel="preconnect" href="https://fonts.googleapis.com" />
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
    <link
      href="https://fonts.googleapis.com/css2?family=Inter:ital,wght@0,400;0,500;0,600;0,700;0,800;0,900;1,700&family=Noto+Sans+JP:wght@400;500;600;700;800;900&display=swap"
      rel="stylesheet"
    />
    ${safeHead ? safeHead : ""}
    <script>${PREVIEW_BRIDGE_SCRIPT}<\/script>
    <style>${safeResetCss}</style>
    <style>${safeTokensCss}</style>
    <style>
      html {
        width: 100%;
        height: 100%;
        overflow: hidden;
      }

      body {
        width: 100%;
        min-height: 100%;
        margin: 0;
        overflow: hidden;
      }

      html.preview-standalone {
        overflow: auto;
        overflow-x: hidden;
      }

      html.preview-standalone body,
      html.preview-embed-scroll body {
        height: auto;
        overflow: visible;
      }

      html.preview-embed-scroll {
        overflow: hidden;
        overflow-x: hidden;
        touch-action: none;
      }

      html.preview-standalone.preview-embed-scroll {
        overflow: auto;
        overflow-x: hidden;
        touch-action: auto;
      }

      html.preview-standalone .preview-body--center {
        align-items: flex-start;
      }

      .preview-body {
        display: flex;
        box-sizing: border-box;
        width: 100%;
        margin: 0;
        min-height: 100%;
        background-color: var(--preview-background, var(--color-bg-default));
        font-family: var(--font-sans);
      }

      .preview-content {
        display: flex;
        box-sizing: border-box;
        flex-shrink: 0;
        gap: var(--preview-gap, 0);
        width: 100%;
        max-width: 100%;
        /* outline + outline-offset (2px + 2px) が iframe 端で見切れない余白 */
        padding: 4px;
      }

      .preview-content--bleed {
        padding: 0;
      }

      .preview-body--center .preview-content {
        flex-direction: var(--preview-direction, row);
        align-items: center;
        justify-content: center;
      }

      .preview-body--start .preview-content {
        flex-direction: var(--preview-direction, column);
        align-items: flex-start;
        justify-content: flex-start;
      }

      .preview-body--center {
        align-items: center;
        justify-content: center;
      }

      .preview-body--start {
        align-items: flex-start;
        justify-content: flex-start;
      }
      ${showPreviewReload ? PREVIEW_RELOAD_STYLE : ""}
    </style>
    <style>${safeCss}</style>
  </head>
  <body class="${previewBodyClass}"${previewBodyStyle ? ` style="${previewBodyStyle}"` : ""}>
    <div class="preview-content${previewPadding ? "" : " preview-content--bleed"}">
      ${safeHtml}
    </div>
    <script>${PREVIEW_SCROLL_PROXY_SCRIPT}<\/script>
    ${
      // defer はインラインスクリプト（src なし）には効果がないため付与しない。
      // .preview-content 内で埋め込まれた外部スクリプトは同期的に実行されるので、
      // 出現順がこの <script> より前である限り実行順は保証される。
      safeJs ? `<script>${safeJs}<\/script>` : ""
    }
    ${showPreviewReload ? PREVIEW_RELOAD_MARKUP : ""}
  </body>
</html>`;
}
