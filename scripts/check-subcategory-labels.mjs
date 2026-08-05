/**
 * サブカテゴリ slug の整合性を検証する。
 *
 * - 英語ラベル: フォルダ名から snippets.ts の folderToSubCategoryLabel で自動生成
 * - 日本語ラベル: src/lib/sub-category-labels.json で手動管理
 *
 * フォルダ構造・スニペットパス・JSON の 3 系統が同じ slug 集合になることを確認する。
 * 実行: npm run check:labels（build でも実行）
 */
import { readdirSync, statSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import subCategoryLabels from "../src/lib/sub-category-labels.json" with { type: "json" };

const __dirname = dirname(fileURLToPath(import.meta.url));
const snippetsRoot = join(__dirname, "../src/snippets");
const categories = ["component", "layout", "project"];

/** src/lib/snippets.ts の folderToSubCategoryLabel と同一ロジック */
function folderToSubCategoryLabel(folder) {
  return folder
    .split("-")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

function collectSubCategorySlugsFromFolders() {
  const slugs = new Set();
  for (const category of categories) {
    for (const entry of readdirSync(join(snippetsRoot, category), {
      withFileTypes: true,
    })) {
      if (entry.isDirectory()) slugs.add(entry.name);
    }
  }
  return slugs;
}

function collectSubCategorySlugsFromSnippets() {
  const slugs = new Set();

  function walk(dir, parts) {
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
      if (!entry.isDirectory()) continue;

      const nextParts = [...parts, entry.name];
      const fullPath = join(dir, entry.name);
      const metaPath = join(fullPath, "meta.json");

      if (statSync(metaPath, { throwIfNoEntry: false })?.isFile()) {
        if (nextParts.length >= 3) {
          slugs.add(nextParts.at(-2));
        }
        continue;
      }

      walk(fullPath, nextParts);
    }
  }

  for (const category of categories) {
    walk(join(snippetsRoot, category), [category]);
  }

  return slugs;
}

const folderSlugs = collectSubCategorySlugsFromFolders();
const snippetSlugs = collectSubCategorySlugsFromSnippets();
const jsonSlugs = new Set(Object.keys(subCategoryLabels));

/** @type {string[]} */
const errors = [];

function report(title, slugs, hint) {
  if (slugs.length === 0) return;
  errors.push(title);
  for (const slug of slugs.sort()) {
    const labelEn = folderToSubCategoryLabel(slug);
    const labelJa = subCategoryLabels[slug];
    const jaPart = labelJa ? ` / 日本語: ${labelJa}` : "";
    errors.push(`  - ${slug} (英語: ${labelEn}${jaPart})`);
  }
  errors.push(`  → ${hint}`);
  errors.push("");
}

const missingInJson = [...folderSlugs].filter((slug) => !jsonSlugs.has(slug));
report(
  "sub-category-labels.json に未登録のサブカテゴリがあります:",
  missingInJson,
  "src/lib/sub-category-labels.json に labelJa を追加してください。",
);

const orphanInJson = [...jsonSlugs].filter((slug) => !folderSlugs.has(slug));
report(
  "sub-category-labels.json に存在しないサブカテゴリフォルダへの登録があります:",
  orphanInJson,
  "フォルダを削除した場合は JSON からも削除してください。",
);

const snippetNotInFolders = [...snippetSlugs].filter(
  (slug) => !folderSlugs.has(slug),
);
report(
  "スニペットが参照するサブカテゴリ slug がカテゴリ直下フォルダに存在しません:",
  snippetNotInFolders,
  "サブカテゴリは component|layout|project/<slug>/ の直下フォルダ名として配置してください。",
);

if (errors.length > 0) {
  console.error(errors.join("\n"));
  process.exit(1);
}

console.log(
  `OK: ${folderSlugs.size} サブカテゴリ — フォルダ・スニペット・sub-category-labels.json が一致`,
);
