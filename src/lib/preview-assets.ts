import fs from "node:fs";
import path from "node:path";
import { escapeForScriptElement } from "./preview-escape.ts";

const PUBLIC_DIR = path.resolve(process.cwd(), "public");

const IMAGE_MIME: Record<string, string> = {
  gif: "image/gif",
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  png: "image/png",
  svg: "image/svg+xml",
  webp: "image/webp",
};

// 動画 (mp4/webm) は意図的に含めない。data URI 化に向かないため URL のまま配信する
// （詳細は inlinePreviewAssets の doc コメントを参照）。安易に拡張子を追加しないこと。
const IMAGE_EXT = "(?:gif|jpe?g|png|svg|webp)";
const PUBLIC_IMAGE_PATH = `\\/[^"'\\)\\s]+\\.${IMAGE_EXT}`;

const SRC_ATTR_PATTERN = new RegExp(
  `src=(["'])(${PUBLIC_IMAGE_PATH})\\1`,
  "gi",
);
const CSS_URL_PATTERN = new RegExp(
  `url\\(\\s*(["']?)(${PUBLIC_IMAGE_PATH})\\1\\s*\\)`,
  "gi",
);

function inlinePublicAsset(assetPath: string): string | undefined {
  const filePath = path.normalize(path.join(PUBLIC_DIR, assetPath.slice(1)));
  const relative = path.relative(PUBLIC_DIR, filePath);

  if (relative.startsWith("..") || path.isAbsolute(relative)) {
    return undefined;
  }

  if (!fs.existsSync(filePath) || !fs.statSync(filePath).isFile()) {
    return undefined;
  }

  const ext = path.extname(assetPath).slice(1).toLowerCase();
  const mime = IMAGE_MIME[ext];
  if (!mime) return undefined;

  const data = fs.readFileSync(filePath);
  return `data:${mime};base64,${data.toString("base64")}`;
}

/**
 * Preview 用 HTML 内の public 配下画像を data URI に差し替える。
 * sandbox 付き srcdoc は opaque origin のため dev サーバーが 403 するのを避ける。
 * コピー用 HTML（SnippetTabs の HTML タブ）は変更しない。
 *
 * 動画は対象外。data URI 化すると数 MB の base64 がページ HTML に直接載り、
 * Range リクエストもブラウザキャッシュも効かなくなるため URL のまま配信し、
 * dev サーバーの 403 は astro.config.mjs の allowSandboxedPreviewMedia で回避する。
 */
export function inlinePreviewAssets(html: string): string {
  return html.replace(SRC_ATTR_PATTERN, (match, quote, assetPath) => {
    const inlined = inlinePublicAsset(assetPath);
    return inlined ? `src=${quote}${inlined}${quote}` : match;
  });
}

/**
 * Preview 用 CSS 内の public 配下画像 url() を data URI に差し替える。
 * sandbox 付き srcdoc では同一オリジン URL も読み込めないため HTML と同様にインライン化する。
 */
export function inlinePreviewCssAssets(css: string): string {
  return css.replace(CSS_URL_PATTERN, (match, quote, assetPath) => {
    const inlined = inlinePublicAsset(assetPath);
    return inlined ? `url(${quote}${inlined}${quote})` : match;
  });
}

const ALLOWED_SCRIPT_HOSTS = new Set(["unpkg.com", "cdn.jsdelivr.net"]);

const EXTERNAL_SCRIPT_PATTERN =
  /<script\b[^>]*\ssrc=(["'])(https:\/\/[^"']+)\1[^>]*>\s*<\/script>/gi;

const FETCH_TIMEOUT_MS = 5000;

const scriptContentCache = new Map<string, string>();

function isAllowedScriptUrl(url: string): boolean {
  try {
    return ALLOWED_SCRIPT_HOSTS.has(new URL(url).hostname);
  } catch {
    return false;
  }
}

/**
 * 許可ホストからの fetch に失敗した場合は、CSP により script が
 * サイレントに無効化されビルドログにも何も残らないため、原因調査の
 * 手がかりとして警告を出す。
 */
async function fetchScriptContent(url: string): Promise<string | undefined> {
  const cached = scriptContentCache.get(url);
  if (cached !== undefined) return cached;

  if (!isAllowedScriptUrl(url)) return undefined;

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

  try {
    const response = await fetch(url, { signal: controller.signal });
    if (!response.ok) {
      console.warn(
        `[preview-assets] 外部スクリプトの取得に失敗しました (status: ${response.status}): ${url}`,
      );
      return undefined;
    }
    const content = await response.text();
    scriptContentCache.set(url, content);
    return content;
  } catch (error) {
    console.warn(
      `[preview-assets] 外部スクリプトの取得に失敗しました: ${url}`,
      error,
    );
    return undefined;
  } finally {
    clearTimeout(timeout);
  }
}

/**
 * Preview 用 HTML 内の外部 CDN script をインライン化する。
 * sandbox 付き srcdoc では CSP 上の外部 script 読み込みを避けるため。
 * コピー用 HTML（SnippetTabs の HTML タブ）は変更しない。
 */
export async function inlinePreviewExternalScripts(
  html: string,
): Promise<string> {
  const matches = [...html.matchAll(EXTERNAL_SCRIPT_PATTERN)];
  if (matches.length === 0) return html;

  const uniqueUrls = [...new Set(matches.map((match) => match[2]))];
  await Promise.all(uniqueUrls.map((url) => fetchScriptContent(url)));

  let result = html;
  for (const match of matches) {
    const content = scriptContentCache.get(match[2]);
    if (content === undefined) continue;
    // 置換文字列だと GSAP 等に含まれる `$&` / `$'` が replace の特殊パターンになり、
    // 後続の script タグや DOM を壊す。関数 replacer なら挿入文字列はそのまま使われる。
    result = result.replace(
      match[0],
      () => `<script>${escapeForScriptElement(content)}</script>`,
    );
  }

  return result;
}
