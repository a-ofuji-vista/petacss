/**
 * srcdoc 内の <style> に埋め込む CSS から、HTML パーサが誤って
 * 閉じタグと認識する `</style` 列を無害化する。
 */
export function escapeForStyleElement(css: string): string {
  return css.replace(/<\/style/gi, "<\\/style");
}

/**
 * srcdoc 内の <script> に埋め込む JS から、HTML パーサが誤って
 * 閉じタグと認識する `</script` 列を無害化する。
 */
export function escapeForScriptElement(js: string): string {
  return js.replace(/<\/script/gi, "<\\/script");
}

/**
 * body フラグメント内の `</body>` や `</html>` など、
 * 外側のプレビュードキュメント構造を壊す終端タグを無害化する。
 * HTML パーサが許容するタグ名と `>` 間の空白（例: `</body >`）も対象とする。
 */
export function escapeForBodyFragment(html: string): string {
  return html.replace(/<\/(body|html|head)\s*>/gi, "&lt;/$1>");
}

/**
 * ダブルクォートで囲んだ HTML 属性値に埋め込む文字列をエスケープする。
 * 属性の途中で抜け出しタグを注入できないようにする。
 * HTML パーサは属性値の実体参照をデコードしてから解釈するため、
 * URL / CSP など本来の意味は保持される。
 */
export function escapeForHtmlAttribute(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}
