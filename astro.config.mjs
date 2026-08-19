// @ts-check
import { defineConfig } from "astro/config";
import sitemap from "@astrojs/sitemap";

const PREVIEW_VIDEO_PATH = /^\/snippets\/[^?#]+\.(?:mp4|webm)(?:[?#]|$)/;

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
 * @param {import("node:http").IncomingMessage} req
 */
function isSandboxedPreviewMediaRequest(req) {
  if (!PREVIEW_VIDEO_PATH.test(req.url ?? "")) return false;

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
 * 中の <video> が出す /snippets/... へのリクエストは Sec-Fetch-Site: cross-site となり、
 * Astro dev サーバーのクロスオリジンサブリソース保護に 403 で弾かれる。
 * 動画を data URI 化すれば回避できるが数 MB の base64 がページ HTML に載るため、
 * dev 環境でのみ public/snippets 配下の動画に限ってこの保護を素通りさせる。
 *
 * 保護を外す範囲を最小化するため、パスに加えて「メディア要素からのリクエストであること」
 * 「Origin / Referer が自オリジン（もしくは opaque origin）であること」も確認する。
 *
 * @returns {import("astro").AstroIntegration}
 */
function allowSandboxedPreviewMedia() {
  return {
    name: "petacss:allow-sandboxed-preview-media",
    hooks: {
      "astro:server:setup": ({ server }) => {
        server.httpServer?.prependListener("request", (req) => {
          if (isSandboxedPreviewMediaRequest(req)) {
            delete req.headers["sec-fetch-site"];
          }
        });
      },
    },
  };
}

// https://astro.build/config
export default defineConfig({
  site: "https://petacss.yomosugara.net",
  integrations: [
    sitemap({
      filter: (page) => !new URL(page).pathname.startsWith("/preview/"),
    }),
    allowSandboxedPreviewMedia(),
  ],
});
