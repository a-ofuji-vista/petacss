// @ts-check
import { defineConfig } from "astro/config";
import sitemap from "@astrojs/sitemap";

/**
 * Origin / Referer が dev サーバー自身を指しているか判定する。
 * sandbox 付き iframe の <video> は no-cors GET のため Origin を送らず、
 * opaque origin の場合は "null" になり得るので、いずれも自オリジン扱いとする。
 *
 * @param {string | string[] | undefined} value
 * @param {string} host
 */
function isSelfOrigin(value, host) {
  if (value === undefined || value === "null") return true;
  if (typeof value !== "string") return false;

  try {
    return new URL(value).host === host;
  } catch {
    return false;
  }
}

/**
 * @param {string} pathname
 * @param {string} base
 */
function isPreviewVideoPath(pathname, base) {
  const normalizedBase = base.replace(/\/+$/, "");
  const prefixes =
    normalizedBase && normalizedBase !== "/" ? [normalizedBase, ""] : [""];

  return prefixes.some((prefix) => {
    if (prefix && !pathname.startsWith(prefix)) return false;
    const path = pathname.slice(prefix.length);
    return /^\/snippets\/[^?#]+\.(?:mp4|webm)(?:[?#]|$)/.test(path);
  });
}

/**
 * @param {import("node:http").IncomingMessage} req
 * @param {string} base
 */
function isSandboxedPreviewMediaRequest(req, base) {
  let pathname = req.url ?? "";
  try {
    pathname = new URL(req.url ?? "/", "http://localhost").pathname;
  } catch {
    // keep raw url
  }

  if (!isPreviewVideoPath(pathname, base)) return false;

  // Sec-Fetch-Dest を送らないブラウザ（Safari）もあるため、送られている場合のみ検証する。
  const dest = req.headers["sec-fetch-dest"];
  if (dest !== undefined && dest !== "video" && dest !== "audio") return false;

  const host = req.headers.host;
  if (host === undefined) return false;

  return (
    isSelfOrigin(req.headers.origin, host) &&
    isSelfOrigin(req.headers.referer, host)
  );
}

/**
 * スニペットのプレビューは sandbox 付き iframe（opaque origin）で描画されるため、
 * 中の <video> が出す /{base}/snippets/... へのリクエストは Sec-Fetch-Site: cross-site となり、
 * Astro dev サーバーのクロスオリジンサブリソース保護に 403 で弾かれる。
 * 動画を data URI 化すれば回避できるが数 MB の base64 がページ HTML に載るため、
 * dev 環境でのみ public/snippets 配下の動画に限ってこの保護を素通りさせる。
 *
 * 保護を外す範囲を最小化するため、パスに加えて「メディア要素からのリクエストであること」
 * 「Origin / Referer が自オリジン（もしくは opaque origin）であること」も確認する。
 *
 * @param {string} base
 * @returns {import("astro").AstroIntegration}
 */
function allowSandboxedPreviewMedia(base) {
  return {
    name: "petacss:allow-sandboxed-preview-media",
    hooks: {
      "astro:server:setup": ({ server }) => {
        server.httpServer?.prependListener("request", (req) => {
          if (isSandboxedPreviewMediaRequest(req, base)) {
            delete req.headers["sec-fetch-site"];
          }
        });
      },
    },
  };
}

const siteBase = "/petacss";

// https://astro.build/config
export default defineConfig({
  site: "https://a-ofuji-vista.github.io",
  base: siteBase,
  integrations: [
    sitemap({
      filter: (page) => {
        const pathname = new URL(page).pathname;
        const previewPrefix = `${siteBase}/preview/`;
        return (
          !pathname.startsWith(previewPrefix) &&
          pathname !== `${siteBase}/preview`
        );
      },
    }),
    allowSandboxedPreviewMedia(siteBase),
  ],
});
