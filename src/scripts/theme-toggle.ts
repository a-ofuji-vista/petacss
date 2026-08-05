import { toggleTheme } from "../lib/theme.ts";
import { bindPageInit, initElements } from "./init-elements.ts";

function setupThemeToggle(button: HTMLButtonElement): () => void {
  const controller = new AbortController();
  const { signal } = controller;

  button.addEventListener(
    "click",
    () => {
      const root = document.documentElement;
      const next = toggleTheme(root.dataset.theme);
      root.dataset.theme = next;
      try {
        localStorage.setItem("theme", next);
      } catch {}
    },
    { signal },
  );

  return () => controller.abort();
}

bindPageInit(() =>
  initElements<HTMLButtonElement>(".js-theme-toggle", setupThemeToggle),
);
