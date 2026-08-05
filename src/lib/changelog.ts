export interface ChangelogEntry {
  date: string;
  added?: string[];
  changed?: string[];
}

export const changelog: ChangelogEntry[] = [
  {
    date: "2026-06-12",
    added: [
      "PETA CSS サイトを公開",
      "Button / Header スニペットを追加",
      "Preview / HTML / CSS タブとコピー機能を実装",
    ],
  },
  {
    date: "2026-05-20",
    added: ["Update History ページを追加", "リリースバナーを追加"],
    changed: [
      "グローバルナビに Update History リンクを追加",
      "トップページの Previous / Next ナビを更新",
    ],
  },
];

export function formatChangelogDate(isoDate: string): string {
  const [year, month, day] = isoDate.split("-");
  return `${year}.${month}.${day}`;
}

export function getChangelogSlug(date: string): string {
  return date;
}
