/**
 * `import.meta.env.BASE_URL` を付与したパスを返す。
 * Astro の BASE_URL は末尾 `/` の有無が環境で揺れるため、ここで正規化する。
 * ルートは `withBase()` / `withBase("/")` で `${base}/` になる。
 */
function normalizedBase(): string {
  return import.meta.env.BASE_URL.replace(/\/+$/, "");
}

export function withBase(path = ""): string {
  const base = normalizedBase();
  const normalized = path.replace(/^\/+/, "");
  if (!normalized) {
    return base ? `${base}/` : "/";
  }
  return `${base}/${normalized}`;
}

/** iframe srcdoc / 別タブプレビュー内の /snippets/... 絶対 URL 用（オリジン + BASE_URL） */
export function getAssetOrigin(origin: string): string {
  return `${origin.replace(/\/+$/, "")}${normalizedBase()}`;
}

/**
 * pathname から base を除き、サイト内比較用のパス（先頭 `/`）を返す。
 */
export function stripBase(pathname: string): string {
  const base = normalizedBase();
  if (base && (pathname === base || pathname.startsWith(`${base}/`))) {
    const rest = pathname.slice(base.length);
    return rest === "" ? "/" : rest.startsWith("/") ? rest : `/${rest}`;
  }
  return pathname;
}
