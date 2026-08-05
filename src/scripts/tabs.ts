import { bindPageInit, initElements } from "./init-elements.ts";

function syncTabFocusability(tabs: NodeListOf<HTMLButtonElement>) {
  tabs.forEach((tab) => {
    tab.tabIndex = tab.getAttribute("aria-selected") === "true" ? 0 : -1;
  });
}

function setupSnippetTabs(root: HTMLElement): () => void {
  const controller = new AbortController();
  const { signal } = controller;

  const tabs = root.querySelectorAll<HTMLButtonElement>(
    ".js-snippet-tab[data-tab]",
  );
  const panels = root.querySelectorAll<HTMLElement>(
    ".js-snippet-panel[data-panel]",
  );

  tabs.forEach((tab) => {
    const name = tab.dataset.tab;
    if (!name) return;

    tab.addEventListener(
      "click",
      () => {
        tabs.forEach((t) => {
          const isActive = t === tab;
          t.classList.toggle("c-snippet-tabs__tab--active", isActive);
          t.setAttribute("aria-selected", String(isActive));
        });
        syncTabFocusability(tabs);
        panels.forEach((p) => {
          const isActive = p.dataset.panel === name;
          p.classList.toggle("c-snippet-tabs__panel--active", isActive);
          p.hidden = !isActive;
        });
      },
      { signal },
    );

    tab.addEventListener(
      "keydown",
      (e) => {
        const currentIndex = Array.from(tabs).indexOf(tab);
        let next: HTMLButtonElement | undefined;
        if (e.key === "ArrowRight") next = tabs[currentIndex + 1] ?? tabs[0];
        if (e.key === "ArrowLeft")
          next = tabs[currentIndex - 1] ?? tabs[tabs.length - 1];
        if (e.key === "Home") next = tabs[0];
        if (e.key === "End") next = tabs[tabs.length - 1];
        if (next) {
          e.preventDefault();
          next.focus();
          next.click();
        }
      },
      { signal },
    );
  });

  syncTabFocusability(tabs);

  return () => controller.abort();
}

bindPageInit(() =>
  initElements<HTMLElement>(".js-snippet-tabs", setupSnippetTabs),
);
