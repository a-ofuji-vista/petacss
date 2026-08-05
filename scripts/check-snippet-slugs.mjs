import { readdirSync, statSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const snippetsRoot = join(__dirname, "../src/snippets");
const categories = ["component", "layout", "project"];

/** @type {Map<string, string[]>} */
const slugToPaths = new Map();

function collectSnippetDirs(dir, parts) {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    if (!entry.isDirectory()) continue;

    const nextParts = [...parts, entry.name];
    const fullPath = join(dir, entry.name);
    const metaPath = join(fullPath, "meta.json");

    if (statSync(metaPath, { throwIfNoEntry: false })?.isFile()) {
      const slug = entry.name;
      const relativePath = ["snippets", ...nextParts].join("/");
      const paths = slugToPaths.get(slug) ?? [];
      paths.push(relativePath);
      slugToPaths.set(slug, paths);
      continue;
    }

    collectSnippetDirs(fullPath, nextParts);
  }
}

for (const category of categories) {
  collectSnippetDirs(join(snippetsRoot, category), [category]);
}

const duplicates = [...slugToPaths.entries()].filter(
  ([, paths]) => paths.length > 1,
);

if (duplicates.length > 0) {
  console.error(
    "重複するスニペット slug があります（html/css/js/head の紐付けは slug の最初の一致のみ使用されます）:",
  );
  for (const [slug, paths] of duplicates) {
    console.error(`  slug "${slug}":`);
    for (const p of paths) {
      console.error(`    - ${p}`);
    }
  }
  console.error(
    "各スニペットフォルダ名（末尾 slug）が全体で一意になるようリネームしてください。",
  );
  process.exit(1);
}

console.log(`OK: ${slugToPaths.size} スニペット slug はすべて一意`);
