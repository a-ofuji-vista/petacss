import {
  inlinePreviewAssets,
  inlinePreviewCssAssets,
  inlinePreviewExternalScripts,
  rewritePreviewMediaUrls,
} from "./preview-assets.ts";
import { PREVIEW_BRIDGE_MSG } from "./preview-bridge.ts";
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
 * 動画だけは data URI 化せずサイト配信の絶対 URL で読み込むため、
 * media-src に配信元オリジンを明示する。sandbox 付き iframe / srcdoc は
 * opaque origin になり 'self' がどのオリジンにも一致しないため。
 * assetBaseUrl は Astro base を含む場合があるので、CSP には origin だけ渡す。
 */
function buildPreviewCsp(assetBaseUrl: string): string {
  const mediaOrigin = new URL(assetBaseUrl).origin;
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

  window.addEventListener("message", function (event) {
    var data = event.data;
    if (!data || data.type !== MSG || data.action !== "set-color-scheme") return;
    applyColorScheme(data.colorScheme);
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

export interface PreviewDocOptions {
  /**
   * Preview 内アセットのベース URL（Astro `base` を含む。末尾スラッシュなし）。
   * 例: `http://localhost:4321/petacss`
   */
  assetOrigin: string;
  resetCss: string;
  tokensCss: string;
  css: string;
  html: string;
  js?: string;
  head?: string;
  previewPlacement?: PreviewPlacement;
  previewPadding?: boolean;
  previewDirection?: PreviewDirection;
  previewGap?: string;
  previewBackground?: string;
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
  previewPlacement = "center",
  previewPadding = true,
  previewDirection,
  previewGap,
  previewBackground,
}: PreviewDocOptions): Promise<string> {
  const safeAssetOrigin = escapeForHtmlAttribute(assetOrigin);
  const safeResetCss = escapeForStyleElement(resetCss);
  const safeTokensCss = escapeForStyleElement(tokensCss);
  const safeCss = escapeForStyleElement(inlinePreviewCssAssets(css));
  const htmlWithAssets = inlinePreviewAssets(
    rewritePreviewMediaUrls(html, assetOrigin),
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
<html lang="ja">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <!-- 別タブ表示は blob: URL で開かれ、blob: は opaque path のため
         /snippets/... を相対解決できない。base で明示しておく。 -->
    <base href="${safeAssetOrigin}/" />
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
    </style>
    <style>${safeCss}</style>
  </head>
  <body class="${previewBodyClass}"${previewBodyStyle ? ` style="${previewBodyStyle}"` : ""}>
    <div class="preview-content${previewPadding ? "" : " preview-content--bleed"}">
      ${safeHtml}
    </div>
    ${
      // defer はインラインスクリプト（src なし）には効果がないため付与しない。
      // .preview-content 内で埋め込まれた外部スクリプトは同期的に実行されるので、
      // 出現順がこの <script> より前である限り実行順は保証される。
      safeJs ? `<script>${safeJs}<\/script>` : ""
    }
  </body>
</html>`;
}
