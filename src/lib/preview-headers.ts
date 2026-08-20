/**
 * /preview/* 向けの HTTP レスポンスヘッダー（開発サーバー / SSR 向け）。
 *
 * 別タブ用プレビューは /snippets/ 配下の動画など同一オリジン URL を読む必要があるため、
 * sandbox iframe（opaque origin）ではなく本オリジンで配信する。
 * スニペット JS から localStorage 等へ到達可能になるが、内容はリポジトリ管理の静的ファイルのみ。
 *
 * 本番は GitHub Pages（静的出力）のため、ビルド時に HTML 本文のみ書き出され
 * これらのヘッダーはリクエスト時に送信されない。
 * クリックジャッキング対策の本番防御は preview-frame-guard.ts（HTML 内同期スクリプト）に委ねる。
 * frame-ancestors は meta CSP でも指定できない。
 * Referrer-Policy は自ページから送出する Referer を制御するもので、フレーム埋め込み防止とは無関係。
 * 本番では preview-doc.ts の `<meta name="referrer">` が開発時の Referrer-Policy ヘッダー相当。
 */
export const PREVIEW_PAGE_HEADERS: Readonly<Record<string, string>> = {
  "X-Frame-Options": "SAMEORIGIN",
  "Content-Security-Policy": "frame-ancestors 'self'",
  "Cross-Origin-Opener-Policy": "same-origin",
  "Referrer-Policy": "same-origin",
};
