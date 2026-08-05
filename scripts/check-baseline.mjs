/**
 * FEATURE_DEFINITIONS（src/lib/css-features.ts）に登録済みの BCD キーについて、
 * web-features の Baseline ステータスを手動確認する開発用スクリプト。
 * ビルドや CI では実行されない。機能追加・更新時の調査用。
 *
 * 実行: npm run check:baseline
 */
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { features } from "web-features";

const __dirname = dirname(fileURLToPath(import.meta.url));
const cssFeaturesSource = readFileSync(
  join(__dirname, "../src/lib/css-features.ts"),
  "utf8",
);
const bcdKeys = [...cssFeaturesSource.matchAll(/bcdKey:\s*"([^"]+)"/g)].map(
  (match) => match[1],
);

const index = new Map();
for (const [id, f] of Object.entries(features)) {
  if (!f.compat_features) continue;
  for (const key of f.compat_features) {
    if (!index.has(key)) index.set(key, { id, f });
  }
}

for (const key of bcdKeys) {
  const hit = index.get(key);
  if (!hit) {
    console.log(`MISSING  ${key}`);
    continue;
  }
  const s = hit.f.status;
  console.log(
    `${key}  ->  ${hit.id}  baseline:${s.baseline}  low:${s.baseline_low_date ?? "-"}  high:${s.baseline_high_date ?? "-"}`,
  );
}
