# PETA CSS

Web サイトでよく使う UI パーツを、コピー＆ペーストですぐ使える形で公開しているスニペット集です。
特定のフレームワークに縛られず、HTML / CSS / JavaScript をそのままコピーして、どんなプロジェクトにも取り込めます。Google Fonts や Embla Carousel などが必要なスニペットもありますが、依存関係は各スニペットに記載しています。

本番サイト： https://a-ofuji-vista.github.io/petacss/

## 特徴

- Preview / HTML / CSS（必要なら JS）をタブで切り替えて確認やコピーができる
- スニペットが使う CSS 機能を自動検出し、MDN browser-compat-data と突き合わせて対応ブラウザバッジを表示
- ライト / ダークテーマ切り替え（OS 設定を初期値として利用）
- CSS の命名は BEM（`block__element--modifier`）に統一。サイト本体は `p-` / `l-` / `c-` プレフィックスで役割を区別し、JavaScript 向け DOM フックには `js-` を使う

## 技術スタック

| 項目               | 内容                          |
| ------------------ | ----------------------------- |
| フレームワーク     | Astro 6.x                     |
| 言語               | TypeScript（strict）          |
| リセット CSS       | destyle.css                   |
| ブラウザ対応データ | @mdn/browser-compat-data      |
| Baseline データ    | web-features                  |
| コードハイライト   | highlight.js + base16-dracula |
| 整形 / Lint        | Prettier / Stylelint          |

## 前提条件

- Node.js v22.12.0 以上（奇数版は非対応）
- npm（Node.js 同梱）

## セットアップ

```bash
npm install
npm run dev
```

`http://localhost:4321/` で開発サーバーが起動します。

## コマンド

| コマンド                 | 説明                                                                                                          |
| ------------------------ | ------------------------------------------------------------------------------------------------------------- |
| `npm run dev`            | 開発サーバーを起動                                                                                            |
| `npm run build`          | 本番ビルド（`dist/` に出力）                                                                                  |
| `npm run preview`        | ビルド結果をローカルで確認                                                                                    |
| `npm run format`         | Prettier で整形                                                                                               |
| `npm run format:check`   | 整形チェック                                                                                                  |
| `npm run lint:css`       | Stylelint で CSS を検査                                                                                       |
| `npm run lint:css:fix`   | Stylelint で自動修正                                                                                          |
| `npm run check:labels`   | サブカテゴリ slug の整合性を検証（フォルダ・スニペット・`sub-category-labels.json` の一致。`build` でも実行） |
| `npm run check:slugs`    | スニペット slug（最下層フォルダ名）の一意性を検証（`build` でも実行）                                         |
| `npm run check:baseline` | `css-features.ts` 登録済み BCD キーの Baseline ステータスを手動確認（開発用。`build` では実行しない）         |

## 本番デプロイ

本サイトは GitHub Pages（`https://a-ofuji-vista.github.io/petacss/`）で公開します。`main` への push で GitHub Actions がビルドし、Pages へデプロイします。

### 初回セットアップ

1. GitHub リポジトリの **Settings → Pages → Build and deployment** で Source を **GitHub Actions** にする
2. `main` に push（または Actions の **Deploy to GitHub Pages** を手動実行）する
3. Actions 成功後、https://a-ofuji-vista.github.io/petacss/ で表示を確認する

### ローカルでビルド結果を確認する

```bash
npm ci
npm run build
npm run preview
```

`base` が `/petacss` のため、プレビューは `http://localhost:4321/petacss/` で確認します。

## サイト構成

| ルート                 | 説明                                            |
| ---------------------- | ----------------------------------------------- |
| `/`                    | What is PETA CSS?（PETA CSS とは）              |
| `/changelog`           | Update History（更新履歴）                      |
| `/snippets`            | All snippets（すべてのスニペット一覧）          |
| `/snippets/[category]` | サブカテゴリ別ページ（例： `/snippets/button`） |

## ディレクトリ構成

```text
/
├── public/                 # 静的アセット（favicon、ロゴ、Preview 用共有メディアなど）
├── scripts/                # 開発用ユーティリティ（Baseline 照合、ビルド前チェックなど）
├── src/
│   ├── components/
│   │   ├── structures/     # ヘッダー、フッター、グローバルナビ、目次など
│   │   └── ui/             # スニペットカード、タブ、コードブロックなど
│   ├── layouts/
│   │   └── BaseLayout.astro
│   ├── lib/                # スニペット読み込み、更新履歴、テーマなど
│   ├── pages/              # ルーティング
│   ├── scripts/            # タブ切替、コピー、Preview など
│   ├── snippets/           # スニペット本体（素の HTML / CSS / JS）
│   │   ├── component/
│   │   ├── project/
│   │   └── layout/
│   └── styles/             # reset.css, tokens.css, global.css
└── package.json
```

### プレビュー用共有アセット（`public/snippets/`）

複数スニペットの Preview から参照する画像・動画を置きます。リポジトリに含めるため clone サイズに影響します。

| ファイル          | 概算サイズ | 用途                           |
| ----------------- | ---------- | ------------------------------ |
| `card-sample.jpg` | ~330 KB    | カード・カルーセル系スニペット |
| `bg_noise.png`    | ~85 KB     | ノイズテクスチャ背景           |
| `bg-video.webm`   | —          | **同梱しない**（下記参照）     |
| `bg-video.mp4`    | —          | **同梱しない**（下記参照）     |

Video bg スニペットの Preview 用動画（`bg-video.webm` / `bg-video.mp4`）はリポジトリサイズの都合で **意図的にコミット対象外** としています（`.gitignore` 参照）。Preview で動画を確認する場合は、ローカルの `public/snippets/` に任意のサンプル動画を配置してください（HTML の `<source>` パスに合わせてファイル名を揃えます）。動画が読み込めない環境では CSS の `--video-fallback` 下地が表示されます。

## スニペットの追加

スニペットは `src/snippets/` 配下に `index.html`・`style.css` などの素ファイルとして管理します。
1 スニペット = 1 ディレクトリです。

### 1. ディレクトリを作成する

カテゴリは親フォルダ名から自動で決まります。

- `component/` — ボタン、インプット、カード、モーダルなど UI パーツ
- `project/` — FAQ、フォーム、プロフィールなど、複数要素を組み合わせた機能単位のパーツ
- `layout/` — ヘッダー、フッターなどレイアウト部品

例：

```text
src/snippets/component/button/button-solid/
├── index.html
├── style.css
└── meta.json
```

```text
src/snippets/layout/header/header-basic/
├── index.html
├── style.css
├── script.js
└── meta.json
```

```text
src/snippets/component/decoration/marquee-text/
├── index.html
├── style.css
├── head.html
└── meta.json
```

### 2. 各ファイルを作成する

| ファイル     | 内容                                                                                              |
| ------------ | ------------------------------------------------------------------------------------------------- |
| `index.html` | スニペットの HTML マークアップ                                                                    |
| `style.css`  | スニペット専用の CSS（BEM 命名を厳守）                                                            |
| `meta.json`  | 表示用メタ情報                                                                                    |
| `script.js`  | スニペット用 JavaScript（任意）                                                                   |
| `head.html`  | `<head>` に追加するマークアップ（Google Fonts など）。任意。HTML タブでは先頭にコメント付きで表示 |

JavaScript が必要な場合は `script.js` を、`<head>` への追加が必要な場合は `head.html` を追加します（いずれも任意）。

`meta.json` のフィールド：

| フィールド          | 必須 | 説明                                                                                                                   |
| ------------------- | ---- | ---------------------------------------------------------------------------------------------------------------------- |
| `title`             | ✓    | スニペットの表示名                                                                                                     |
| `order`             | ✓    | 同一サブカテゴリ内の並び順（昇順）                                                                                     |
| `description`       | —    | 説明文（任意）                                                                                                         |
| `previewPlacement`  | —    | Preview タブの配置。`"center"`（既定： 上下左右中央）または `"start"`（左上開始、レイアウト向け）                      |
| `previewPadding`    | —    | Preview パネルの余白。`true`（既定： あり）または `false`（余白なし。ヘッダーなど画面端まで表示する場合）              |
| `previewScroll`     | —    | Preview パネル内のスクロール。`true`（縦長コンテンツ向け）または `false`（既定： iframe の高さを内容に合わせて伸ばす） |
| `previewDirection`  | —    | プレビュー内の並び方向。`"row"`（横並び）または `"column"`（縦並び）。                                                 |
| `previewGap`        | —    | プレビュー内の要素間隔。CSS の `gap` 値（例： `"var(--space-4)"`）                                                     |
| `previewBackground` | —    | Preview パネルと iframe 内の背景色を固定。CSS の color 値（例： `"#fff"`）。テーマ切り替えの影響を受けない             |
| `features`          | —    | 対応ブラウザバッジに手動追加する機能 ID の配列（`css-features.ts` の `FEATURE_DEFINITIONS` を参照）                    |

### 3. 命名ルール

| 項目                   | ルール                                                                                                                                                           | 例                   |
| ---------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------- |
| スラッグ（フォルダ名） | ケバブケース、サイト全体で一意（最下層フォルダ）。`npm run check:slugs` で検証                                                                                   | `button-solid`       |
| サブカテゴリフォルダ   | カテゴリフォルダとスラッグの間に置く。URL・表示名はここから自動導出                                                                                              | `button/` → `Button` |
| サブカテゴリ日本語名   | 新規サブカテゴリ追加時は `src/lib/sub-category-labels.json` に登録。英語名はフォルダ名から自動生成（`npm run check:labels` でフォルダ・JSON の双方向一致を検証） | `"button": "ボタン"` |
| CSS クラス             | BEM。Block 名はスラッグと揃える                                                                                                                                  | `.button-solid`      |

### 4. 対応ブラウザバッジ（自動生成）

各スニペットカードには対応ブラウザ情報が表示されます。これらはビルド時に `style.css` の中身から自動生成されるため、通常は何も書く必要がありません。

- 検出テーブルは `src/lib/css-features.ts` の `FEATURE_DEFINITIONS` で管理。新しい機能を検出したい場合はここに ID・ラベル・BCD キー・検出パターンを追加する。追加前後に Baseline ステータスを確認したい場合は `npm run check:baseline` を実行する（web-features との対応・Baseline 日付の一覧表示）
- 対応バージョンは [@mdn/browser-compat-data](https://github.com/mdn/browser-compat-data)（BCD）から取得。BCD キーの実在はビルド時に検証され、キーが無効ならビルドエラーになる
- Baseline ステータスは [web-features](https://github.com/web-platform-dx/web-features) から取得。スニペット全体のステータスは検出された機能のうち最も低いもの（Limited availability < Newly available < Widely available）を採用する
- 「対応ブラウザ」のバージョンは、検出された全機能を満たす各ブラウザの最低バージョン
- 正規表現で検出できない機能（例： HTML 側の都合で使っている機能）は `meta.json` の `features` に機能 ID を書いて手動追加できる

### 5. 動作確認

```bash
npm run format
npm run lint:css
npm run build
```

## 更新履歴の更新

更新履歴は `/changelog` ページに表示されます。データは `src/lib/changelog.ts` の `changelog` 配列で管理します。

**新しい日付の更新**は配列の **先頭** に追加してください。先頭エントリの日付がリリースバナーにも使われます。

```typescript
export const changelog: ChangelogEntry[] = [
  {
    date: "2026-06-18",
    added: ["Card スニペットを追加"],
    changed: ["サイドバーの並び順を調整"],
  },
  // ...既存エントリ
];
```

| フィールド | 必須 | 説明                                             |
| ---------- | ---- | ------------------------------------------------ |
| `date`     | ✓    | 更新日（`YYYY-MM-DD` 形式）                      |
| `added`    | —    | 「追加」セクションに表示する項目（文字列の配列） |
| `changed`  | —    | 「変更」セクションに表示する項目（文字列の配列） |

サイト上部のリリースバナーは `src/lib/release.ts` で制御します。日付は `changelog[0]` から自動取得されます。

```typescript
export const release = {
  enabled: true,
  message: "Card スニペットを追加しました。",
  emoji: "🐟", // 非表示にする場合は false
} as const;
```

絵文字の目安： `🐧` 公開・告知 / `🐟` コンテンツ追加 / `❄️` 軽微な更新

## 参考リンク

- [Astro 公式ドキュメント](https://docs.astro.build/ja/)
- [destyle.css](https://github.com/nicolas-cusan/destyle.css)
- [highlight.js](https://highlightjs.org/)
- [BEM](https://en.bem.info/methodology/)
