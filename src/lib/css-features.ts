import bcd from "@mdn/browser-compat-data";
import { features as webFeatures } from "web-features";

/**
 * スニペットの CSS から「注目に値する CSS 機能」を自動検出し、
 * MDN browser-compat-data(BCD)と突き合わせて対応ブラウザ情報を返す。
 *
 * - 検出はビルド時のみ実行される(Astro SSG)ため、実行コストはビルドに閉じる
 * - 検出テーブルの bcdKey はモジュール読み込み時に実在検証され、
 *   BCD 側の構造変更(キー削除・移動)はビルドエラーとして即座に検知できる
 */

export const BROWSERS = ["chrome", "edge", "firefox", "safari"] as const;
export type BrowserId = (typeof BROWSERS)[number];

export const BROWSER_LABELS: Record<BrowserId, string> = {
  chrome: "Chrome",
  edge: "Edge",
  firefox: "Firefox",
  safari: "Safari",
};

/** false = 非対応、null = 不明 */
export type SupportVersion = string | false | null;
export type BrowserSupport = Record<BrowserId, SupportVersion>;

export interface FeatureDefinition {
  /** meta.json の features で指定する ID */
  id: string;
  /** バッジに表示するラベル */
  label: string;
  /** BCD のドット区切りキー(例: "css.selectors.has") */
  bcdKey: string;
  /** スニペット CSS に対する検出パターン */
  detect: RegExp;
}

/** Baseline ステータス。high = Widely available、low = Newly available、false = Limited availability */
export type BaselineStatus = "high" | "low" | false;

export interface BaselineInfo {
  status: BaselineStatus;
  /** Newly available になった日(YYYY-MM-DD) */
  lowDate: string | null;
  /** Widely available になった日(YYYY-MM-DD) */
  highDate: string | null;
}

export interface DetectedFeature {
  id: string;
  label: string;
  bcdKey: string;
  mdnUrl?: string;
  support: BrowserSupport;
  /** web-features に対応エントリがない場合は null */
  baseline: BaselineInfo | null;
}

export interface SnippetBaseline {
  /** 全機能の中で最も低いステータス。判定不能な場合は null */
  status: BaselineStatus | null;
  /** status が "low" のとき、最後に Newly available になった年 */
  sinceYear: string | null;
}

export interface SnippetFeatureData {
  features: DetectedFeature[];
  /** 全機能を満たすために必要な各ブラウザの最低バージョン */
  required: BrowserSupport;
  /** 対象ブラウザすべてで利用可能か */
  allSupported: boolean;
  /** 全ブラウザで利用可能になった時期(例: "2023年12月")。不明な場合は null */
  availableSince: string | null;
  /** スニペット全体の Baseline ステータス */
  baseline: SnippetBaseline;
}

/**
 * 検出対象の機能テーブル。
 * ここに載せた機能だけがバッジ化される(display: block のような
 * 基礎機能まで拾うとノイズになるため、意図的にリスト方式にしている)。
 * 追加時は bcdKey の実在がビルド時に検証される。
 */
const FEATURE_DEFINITIONS: FeatureDefinition[] = [
  {
    id: "nesting",
    label: "CSS Nesting",
    bcdKey: "css.selectors.nesting",
    // 「& セレクタ」またはルール内にネストされた(インデントされた)@メディア
    detect: /(^|[\s({;,])&(?=[\s.:>~+#[])|^\s+@media\b/m,
  },
  {
    id: "has",
    label: ":has()",
    bcdKey: "css.selectors.has",
    detect: /:has\(/,
  },
  {
    id: "subgrid",
    label: "subgrid",
    bcdKey: "css.properties.grid-template-columns.subgrid",
    detect: /\bsubgrid\b/,
  },
  {
    id: "container-query",
    label: "@container",
    bcdKey: "css.at-rules.container",
    detect: /@container\b|\bcontainer(?:-type|-name)\s*:/,
  },
  {
    id: "media-range",
    label: "Media range syntax",
    bcdKey: "css.at-rules.media.range_syntax",
    detect:
      /@media[^{]*(?:(?:width|height)\s*(?:<=|>=|<|>)|(?:<=|>=|<|>)\s*(?:width|height))/,
  },
  {
    id: "color-mix",
    label: "color-mix()",
    bcdKey: "css.types.color.color-mix",
    detect: /color-mix\(/,
  },
  {
    id: "backdrop-filter",
    label: "backdrop-filter",
    bcdKey: "css.properties.backdrop-filter",
    detect: /\bbackdrop-filter\s*:/,
  },
  {
    id: "starting-style",
    label: "@starting-style",
    bcdKey: "css.at-rules.starting-style",
    detect: /@starting-style\b/,
  },
  {
    id: "transition-behavior",
    label: "transition-behavior",
    bcdKey: "css.properties.transition-behavior",
    detect: /\btransition-behavior\s*:|\ballow-discrete\b/,
  },
  {
    id: "interpolate-size",
    label: "interpolate-size",
    bcdKey: "css.properties.interpolate-size.allow-keywords",
    detect: /\binterpolate-size\s*:/,
  },
  {
    id: "details-content",
    label: "::details-content",
    bcdKey: "css.selectors.details-content",
    detect: /::details-content\b/,
  },
  {
    id: "backdrop",
    label: "::backdrop",
    bcdKey: "css.selectors.backdrop",
    detect: /::backdrop\b/,
  },
  {
    id: "overscroll-behavior",
    label: "overscroll-behavior",
    bcdKey: "css.properties.overscroll-behavior",
    detect: /\boverscroll-behavior(?:-[xy]|-inline|-block)?\s*:/,
  },
  {
    id: "text-wrap-balance",
    label: "text-wrap: balance",
    bcdKey: "css.properties.text-wrap.balance",
    detect: /\btext-wrap\s*:\s*balance\b/,
  },
  {
    id: "text-wrap-pretty",
    label: "text-wrap: pretty",
    bcdKey: "css.properties.text-wrap.pretty",
    detect: /\btext-wrap\s*:\s*pretty\b/,
  },
  {
    id: "calc-keyword",
    label: "calc(infinity)",
    bcdKey: "css.types.calc-keyword",
    detect: /calc\(\s*[^)]*\b(?:infinity|pi|nan)\b/i,
  },
  {
    id: "dynamic-viewport-units",
    label: "dvh / svh / lvh",
    bcdKey: "css.types.length.viewport_percentage_units_dynamic",
    detect: /\b\d*\.?\d+(?:dvh|dvw|dvi|dvb|dvmin|dvmax|svh|svw|lvh|lvw)\b/,
  },
  {
    id: "focus-visible",
    label: ":focus-visible",
    bcdKey: "css.selectors.focus-visible",
    detect: /:focus-visible\b/,
  },
  {
    id: "aspect-ratio",
    label: "aspect-ratio",
    bcdKey: "css.properties.aspect-ratio",
    detect: /\baspect-ratio\s*:/,
  },
  {
    id: "inset",
    label: "inset",
    bcdKey: "css.properties.inset",
    detect: /\binset\s*:/,
  },
  {
    id: "logical-properties",
    label: "Logical properties",
    bcdKey: "css.properties.margin-inline",
    detect:
      /\b(?:margin|padding)-(?:inline|block)\b|\binset-(?:inline|block)\b|\b(?:block|inline)-size\s*:/,
  },
  {
    id: "where",
    label: ":where()",
    bcdKey: "css.selectors.where",
    detect: /:where\(/,
  },
  {
    id: "is",
    label: ":is()",
    bcdKey: "css.selectors.is",
    detect: /:is\(/,
  },
  {
    id: "clamp",
    label: "clamp()",
    bcdKey: "css.types.clamp",
    detect: /\bclamp\(/,
  },
  {
    id: "min-max",
    label: "min() / max()",
    bcdKey: "css.types.min",
    detect: /(?<![-\w])(?:min|max)\(/,
  },
  {
    id: "position-sticky",
    label: "position: sticky",
    bcdKey: "css.properties.position.sticky",
    detect: /\bposition\s*:\s*sticky\b/,
  },
  {
    id: "prefers-reduced-motion",
    label: "prefers-reduced-motion",
    bcdKey: "css.at-rules.media.prefers-reduced-motion",
    detect: /\bprefers-reduced-motion\b/,
  },
  {
    id: "any-hover",
    label: "any-hover",
    bcdKey: "css.at-rules.media.any-hover",
    detect: /@media[^{]*\bany-hover\b/,
  },
  {
    id: "gap",
    label: "gap",
    bcdKey: "css.properties.gap",
    detect: /(?<![-\w])(?:row-|column-)?gap\s*:/,
  },
  {
    id: "place-items",
    label: "place-items",
    bcdKey: "css.properties.place-items",
    detect: /\bplace-items\s*:/,
  },
  {
    id: "object-fit",
    label: "object-fit",
    bcdKey: "css.properties.object-fit",
    detect: /\bobject-fit\s*:/,
  },
  {
    id: "grid",
    label: "grid",
    bcdKey: "css.properties.display.grid",
    detect:
      /\bdisplay\s*:\s*(?:inline-)?grid\b|\bgrid-template\b|\bgrid-area\s*:/,
  },
  {
    id: "flex",
    label: "flex",
    bcdKey: "css.properties.display.flex",
    detect: /\bdisplay\s*:\s*(?:inline-)?flex\b/,
  },
];

// ---------------------------------------------------------------------------
// BCD 照合
// ---------------------------------------------------------------------------

interface CompatStatement {
  mdn_url?: string;
  support: Record<string, unknown>;
}

function resolveCompat(bcdKey: string): CompatStatement {
  let node: unknown = bcd;
  for (const part of bcdKey.split(".")) {
    node = (node as Record<string, unknown> | undefined)?.[part];
  }
  const compat = (node as { __compat?: CompatStatement } | undefined)?.__compat;
  if (!compat) {
    throw new Error(
      `[css-features] BCD キーが見つかりません: "${bcdKey}"。` +
        `@mdn/browser-compat-data の更新でキーが移動した可能性があります。`,
    );
  }
  return compat;
}

interface SupportStatement {
  version_added?: string | boolean | null;
  flags?: unknown[];
  prefix?: string;
  alternative_name?: string;
  partial_implementation?: boolean;
}

/** フラグ付き・ベンダープレフィックス付きなどを除いた素の対応バージョンを返す */
function pickVersion(raw: unknown): SupportVersion {
  const statements = (Array.isArray(raw) ? raw : [raw]) as SupportStatement[];
  const clean =
    statements.find(
      (s) =>
        s &&
        !s.flags &&
        !s.prefix &&
        !s.alternative_name &&
        !s.partial_implementation,
    ) ?? statements[0];
  const version = clean?.version_added;
  if (version === undefined || version === null) return null;
  if (version === false || version === "preview") return false;
  if (version === true) return null; // バージョン不明で対応済み
  return version.replace(/^≤/, "");
}

function getBrowserSupport(compat: CompatStatement): BrowserSupport {
  const support = {} as BrowserSupport;
  for (const browser of BROWSERS) {
    support[browser] = pickVersion(compat.support[browser]);
  }
  return support;
}

// ---------------------------------------------------------------------------
// Baseline(web-features)照合
// ---------------------------------------------------------------------------

/** web-features の baseline 値を BaselineStatus に正規化する */
function toBaselineStatus(raw: boolean | "high" | "low"): BaselineStatus {
  if (raw === "high" || raw === "low") return raw;
  return raw === false ? false : "high";
}

/** BCD キー → Baseline 情報の逆引きインデックス */
const baselineIndex: ReadonlyMap<string, BaselineInfo> = (() => {
  const index = new Map<string, BaselineInfo>();
  for (const feature of Object.values(webFeatures)) {
    if (feature.kind !== "feature") continue;
    const { status, compat_features: compatFeatures } = feature;
    if (!status || !compatFeatures) continue;
    // 日付には「≤2023-01-01」のような上限表記が入ることがあるため除去する
    const info: BaselineInfo = {
      status: toBaselineStatus(status.baseline),
      lowDate: status.baseline_low_date?.replace(/^≤/, "") ?? null,
      highDate: status.baseline_high_date?.replace(/^≤/, "") ?? null,
    };
    for (const key of compatFeatures) {
      if (!index.has(key)) index.set(key, info);
    }
  }
  return index;
})();

// 検出テーブルの bcdKey をモジュール読み込み時(=ビルド時)に検証・解決する
const RESOLVED_FEATURES: ReadonlyMap<string, DetectedFeature> = new Map(
  FEATURE_DEFINITIONS.map((def) => {
    const compat = resolveCompat(def.bcdKey);
    return [
      def.id,
      {
        id: def.id,
        label: def.label,
        bcdKey: def.bcdKey,
        mdnUrl: compat.mdn_url,
        support: getBrowserSupport(compat),
        baseline: baselineIndex.get(def.bcdKey) ?? null,
      },
    ];
  }),
);

// ---------------------------------------------------------------------------
// 検出と集計
// ---------------------------------------------------------------------------

function versionNumber(version: SupportVersion): number {
  if (version === false) return Infinity;
  if (version === null) return 0;
  return Number.parseFloat(version);
}

/** 新しい機能(要求バージョンが高い機能)ほど先頭に並べる */
function recencyScore(feature: DetectedFeature): number {
  return Math.max(
    ...BROWSERS.map((b) => {
      const n = versionNumber(feature.support[b]);
      return Number.isFinite(n) ? n : 0;
    }),
  );
}

/** 指定バージョンのブラウザリリース日(YYYY-MM-DD)を BCD から引く */
function releaseDate(browser: BrowserId, version: string): string | null {
  const releases = (
    bcd.browsers as Record<
      string,
      { releases: Record<string, { release_date?: string }> }
    >
  )[browser]?.releases;
  return releases?.[version]?.release_date ?? null;
}

/**
 * 全ブラウザで利用可能になった時期を求める。
 * 各ブラウザの必要バージョンのリリース日のうち、最も遅い日付を採用する。
 */
function resolveAvailableSince(required: BrowserSupport): string | null {
  let latest: string | null = null;
  for (const browser of BROWSERS) {
    const version = required[browser];
    if (version === false) return null;
    // null はバージョン不明(相当古くから対応)なので集計に影響させない
    if (version === null) continue;
    const date = releaseDate(browser, version);
    if (!date) return null;
    if (latest === null || date > latest) latest = date;
  }
  if (latest === null) return null;
  const [year, month] = latest.split("-");
  return `${year}年${Number.parseInt(month, 10)}月`;
}

/**
 * スニペット全体の Baseline ステータスを求める。
 * 検出された全機能のうち最も低いステータスを採用する(false < low < high)。
 * web-features に載っていない機能は判定から除外する。
 */
function aggregateBaseline(features: DetectedFeature[]): SnippetBaseline {
  const infos = features
    .map((f) => f.baseline)
    .filter((b): b is BaselineInfo => b !== null);
  if (infos.length === 0) return { status: null, sinceYear: null };

  if (infos.some((b) => b.status === false)) {
    return { status: false, sinceYear: null };
  }

  const lows = infos.filter((b) => b.status === "low");
  if (lows.length > 0) {
    const latestLowDate = lows
      .map((b) => b.lowDate)
      .filter((d): d is string => d !== null)
      .sort()
      .at(-1);
    return { status: "low", sinceYear: latestLowDate?.slice(0, 4) ?? null };
  }

  return { status: "high", sinceYear: null };
}

function aggregateRequired(features: DetectedFeature[]): BrowserSupport {
  const required = {} as BrowserSupport;
  for (const browser of BROWSERS) {
    let max: SupportVersion = null;
    for (const feature of features) {
      const version = feature.support[browser];
      if (version === false) {
        max = false;
        break;
      }
      if (version === null) continue;
      if (max === null || versionNumber(version) > versionNumber(max)) {
        max = version;
      }
    }
    required[browser] = max;
  }
  return required;
}

/**
 * スニペットの CSS から使用機能を検出し、対応ブラウザ情報付きで返す。
 * @param css スニペットの CSS ソース
 * @param extraIds meta.json の features で手動追加された機能 ID
 */
export function getSnippetFeatures(
  css: string,
  extraIds: string[] = [],
): SnippetFeatureData {
  const detected = new Map<string, DetectedFeature>();

  for (const def of FEATURE_DEFINITIONS) {
    if (def.detect.test(css)) {
      detected.set(def.id, RESOLVED_FEATURES.get(def.id)!);
    }
  }

  for (const id of extraIds) {
    const feature = RESOLVED_FEATURES.get(id);
    if (!feature) {
      console.warn(
        `[css-features] meta.json の features に未知の ID "${id}" が指定されています。` +
          `利用可能な ID: ${[...RESOLVED_FEATURES.keys()].join(", ")}`,
      );
      continue;
    }
    detected.set(id, feature);
  }

  const features = [...detected.values()].sort(
    (a, b) => recencyScore(b) - recencyScore(a),
  );

  const required = aggregateRequired(features);
  const allSupported =
    features.length > 0 && BROWSERS.every((b) => required[b] !== false);

  return {
    features,
    required,
    allSupported,
    availableSince: allSupported ? resolveAvailableSince(required) : null,
    baseline: aggregateBaseline(features),
  };
}

/** Baseline ステータスの表示用ラベル */
export function baselineLabel(status: BaselineStatus): string {
  if (status === "high") return "Widely available";
  if (status === "low") return "Newly available";
  return "Limited availability";
}

/** スニペット全体の Baseline バッジ文言 */
export function snippetBaselineText(baseline: SnippetBaseline): string {
  if (baseline.status === "high") return "Widely available";
  if (baseline.status === "low") {
    return baseline.sinceYear
      ? `${baseline.sinceYear} Newly available`
      : "Newly available";
  }
  if (baseline.status === false) return "Limited availability";
  return "";
}

/** 個別機能の Baseline バッジ文言 */
export function featureBaselineText(baseline: BaselineInfo): string {
  if (baseline.status === "high") return "Widely available";
  if (baseline.status === "low") {
    const year = baseline.lowDate?.slice(0, 4);
    return year ? `${year} Newly available` : "Newly available";
  }
  return "Limited availability";
}

/** Baseline バッジの title 属性用説明文 */
export function baselineDescription(
  status: BaselineStatus,
  sinceYear?: string | null,
): string {
  if (status === "high") {
    return "Baseline Widely available: すべての主要ブラウザで30か月以上前から利用可能";
  }
  if (status === "low") {
    return `Baseline Newly available: ${sinceYear ?? "近"}年からすべての主要ブラウザで利用可能`;
  }
  return "Baseline Limited availability: 一部の主要ブラウザで未対応";
}

/** "120" -> "120+"、false -> "✕"、null -> "?" の表示用整形 */
export function formatVersion(version: SupportVersion): string {
  if (version === false) return "✕";
  if (version === null) return "?";
  return `${version}+`;
}
