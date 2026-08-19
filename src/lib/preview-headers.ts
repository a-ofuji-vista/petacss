/**
 * /preview/* 向けの HTTP レスポンスヘッダー。
 *
 * 別タブ用プレビューは /snippets/ 配下の動画など同一オリジン URL を読む必要があるため、
 * sandbox iframe（opaque origin）ではなく本オリジンで配信する。
 * スニペット JS から localStorage 等へ到達可能になるが、内容はリポジトリ管理の静的ファイルのみ。
 *
 * 外部サイトからの iframe 埋め込み（クリックジャッキング）は frame-ancestors / X-Frame-Options で拒否する。
 * frame-ancestors は meta CSP では指定できないため HTTP ヘッダーが必須（本番は public/preview/.htaccess）。
 */
export const PREVIEW_PAGE_HEADERS: Readonly<Record<string, string>> = {
  "X-Frame-Options": "SAMEORIGIN",
  "Content-Security-Policy": "frame-ancestors 'self'",
  "Cross-Origin-Opener-Policy": "same-origin",
  "Referrer-Policy": "same-origin",
};
