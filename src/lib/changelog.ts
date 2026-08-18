export interface ChangelogEntry {
  date: string;
  added?: string[];
  changed?: string[];
}

export const changelog: ChangelogEntry[] = [
  {
    date: "2026-08-18",
    added: ["Animation スニペットを追加"],
  },
  {
    date: "2026-08-05",
    added: ["PETA CSS サイトを公開"],
  },
];

export function formatChangelogDate(isoDate: string): string {
  const [year, month, day] = isoDate.split("-");
  return `${year}.${month}.${day}`;
}

export function getChangelogSlug(date: string): string {
  return date;
}
