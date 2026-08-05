export type Theme = "dark" | "light";

export function getSystemTheme(): Theme {
  return matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

export function parseTheme(value: string | null | undefined): Theme | null {
  if (value === "dark" || value === "light") return value;
  return null;
}

export function resolveTheme(stored: string | null | undefined): Theme {
  return parseTheme(stored) ?? getSystemTheme();
}

export function toggleTheme(current: string | undefined): Theme {
  return parseTheme(current) === "dark" ? "light" : "dark";
}

/** FOUC 防止用。`<script is:inline>` にそのまま埋め込む。 */
export function buildThemeInitScript(): string {
  return `(function () {
  let stored;
  try {
    stored = localStorage.getItem("theme");
  } catch {}
  const theme =
    stored === "dark" || stored === "light"
      ? stored
      : matchMedia("(prefers-color-scheme: dark)").matches
        ? "dark"
        : "light";
  document.documentElement.dataset.theme = theme;
})();`;
}
