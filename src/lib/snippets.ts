import subCategoryLabels from "./sub-category-labels.json";

export type Category = "Component" | "Project" | "Layout";

const CATEGORY_ORDER: Category[] = ["Component", "Project", "Layout"];

const SUB_CATEGORY_LABEL_JA: Record<string, string> = subCategoryLabels;

export type PreviewPlacement = "center" | "start";
export type PreviewDirection = "row" | "column";

export interface SnippetMeta {
  title: string;
  order: number;
  description?: string;
  previewPlacement?: PreviewPlacement;
  previewPadding?: boolean;
  previewScroll?: boolean;
  previewDirection?: PreviewDirection;
  previewGap?: string;
  previewBackground?: string;
  features?: string[];
}

export interface SubCategoryInfo {
  slug: string;
  label: string;
  labelJa: string;
}

export interface Snippet {
  slug: string;
  category: Category;
  subCategory: string;
  subCategorySlug: string;
  meta: SnippetMeta;
  html: string;
  css: string;
  js?: string;
  head?: string;
}

const htmlMap = import.meta.glob("../snippets/**/index.html", {
  query: "?raw",
  import: "default",
  eager: true,
}) as Record<string, string>;

const cssMap = import.meta.glob("../snippets/**/style.css", {
  query: "?raw",
  import: "default",
  eager: true,
}) as Record<string, string>;

const jsMap = import.meta.glob("../snippets/**/script.js", {
  query: "?raw",
  import: "default",
  eager: true,
}) as Record<string, string>;

const headMap = import.meta.glob("../snippets/**/head.html", {
  query: "?raw",
  import: "default",
  eager: true,
}) as Record<string, string>;

const metaMap = import.meta.glob("../snippets/**/meta.json", {
  import: "default",
  eager: true,
}) as Record<string, SnippetMeta>;

interface PathInfo {
  category: Category;
  subCategorySlug: string;
  subCategory: string;
  slug: string;
}

/** 英語ラベル生成。check-subcategory-labels.mjs と同一ロジック（変更時は両方を更新） */
function folderToSubCategoryLabel(folder: string): string {
  return folder
    .split("-")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

function pathToInfo(path: string): PathInfo | null {
  const m = path.match(
    /snippets\/([^/]+)\/(.+)\/(?:index\.html|style\.css|script\.js|head\.html|meta\.json)$/,
  );
  if (!m) return null;
  const categoryFolder = m[1];
  const segments = m[2].split("/");
  const slug = segments.at(-1);
  if (!slug || segments.length < 2) return null;

  const subCategorySlug = segments[segments.length - 2];
  const category =
    categoryFolder.charAt(0).toUpperCase() + categoryFolder.slice(1);
  if (
    category !== "Component" &&
    category !== "Layout" &&
    category !== "Project"
  ) {
    return null;
  }
  return {
    category: category as Category,
    subCategorySlug,
    subCategory: folderToSubCategoryLabel(subCategorySlug),
    slug,
  };
}

function pickBySlug<T>(map: Record<string, T>, slug: string): T | undefined {
  const entry = Object.entries(map).find(([p]) => pathToInfo(p)?.slug === slug);
  return entry?.[1];
}

export function shouldShowPreviewReload(
  snippet: Pick<Snippet, "subCategorySlug">,
): boolean {
  return snippet.subCategorySlug === "animation";
}

export function formatSnippetHtmlForDisplay(
  html: string,
  head?: string,
): string {
  const trimmedHead = head?.trim();
  if (!trimmedHead) return html;

  return `<!-- 以下を <head> に追加 -->\n${trimmedHead}\n\n${html.trim()}`;
}

let _cache: Snippet[] | null = null;

export function getAllSnippets(): Snippet[] {
  if (_cache) return _cache;

  const list: Snippet[] = [];
  for (const [path, meta] of Object.entries(metaMap)) {
    const info = pathToInfo(path);
    if (!info) continue;

    const html = pickBySlug(htmlMap, info.slug);
    const css = pickBySlug(cssMap, info.slug);
    if (html === undefined || css === undefined) continue;

    list.push({
      slug: info.slug,
      category: info.category,
      subCategory: info.subCategory,
      subCategorySlug: info.subCategorySlug,
      meta,
      html,
      css,
      js: pickBySlug(jsMap, info.slug),
      head: pickBySlug(headMap, info.slug),
    });
  }

  _cache = list.sort((a, b) => a.meta.order - b.meta.order);
  return _cache;
}

export function getSnippetsBySubCategory(sub: string): Snippet[] {
  return getAllSnippets().filter(
    (s) => s.subCategorySlug.toLowerCase() === sub.toLowerCase(),
  );
}

export function getSubCategoryCounts(): ReadonlyMap<string, number> {
  const counts = new Map<string, number>();
  for (const s of getAllSnippets()) {
    const key = s.subCategorySlug.toLowerCase();
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }
  return counts;
}

export function getCategoryTree(): {
  category: Category;
  subCategories: SubCategoryInfo[];
}[] {
  const map = new Map<Category, Map<string, string>>();
  for (const s of getAllSnippets()) {
    if (!map.has(s.category)) map.set(s.category, new Map());
    map.get(s.category)!.set(s.subCategorySlug, s.subCategory);
  }
  return CATEGORY_ORDER.filter((category) => map.has(category)).map(
    (category) => {
      const subs = map.get(category)!;
      return {
        category,
        subCategories: [...subs.entries()].map(([slug, label]) => ({
          slug,
          label,
          labelJa: SUB_CATEGORY_LABEL_JA[slug] ?? label,
        })),
      };
    },
  );
}
