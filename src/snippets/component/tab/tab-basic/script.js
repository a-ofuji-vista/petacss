(function () {
  let instanceIndex = 0;

  function syncTabFocusability(tabs) {
    tabs.forEach((tab) => {
      tab.tabIndex = tab.getAttribute("aria-selected") === "true" ? 0 : -1;
    });
  }

  function activateTab(tabs, panels, activeTab) {
    const name = activeTab.dataset.tab;
    if (!name) return;

    tabs.forEach((tab) => {
      const isActive = tab === activeTab;
      tab.classList.toggle("tab-basic__tab--active", isActive);
      tab.setAttribute("aria-selected", String(isActive));
    });

    syncTabFocusability(tabs);

    panels.forEach((panel) => {
      const isActive = panel.dataset.panel === name;
      panel.classList.toggle("tab-basic__panel--active", isActive);
      panel.hidden = !isActive;
    });
  }

  function initTabBasic(root) {
    if (root.dataset.tabBasicInit === "true") return;
    root.dataset.tabBasicInit = "true";

    instanceIndex += 1;

    const tabs = [...root.querySelectorAll(".js-tab-basic-tab[data-tab]")];
    const panels = [
      ...root.querySelectorAll(".js-tab-basic-panel[data-panel]"),
    ];

    if (tabs.length === 0 || panels.length === 0) return;

    tabs.forEach((tab, index) => {
      const panelName = tab.dataset.tab;
      const panel = panels.find((item) => item.dataset.panel === panelName);
      if (!panel) return;

      const tabId = `tab-basic-tab-${instanceIndex}-${index + 1}`;
      const panelId = `tab-basic-panel-${instanceIndex}-${index + 1}`;

      tab.id = tabId;
      tab.setAttribute("aria-controls", panelId);
      panel.id = panelId;
      panel.setAttribute("aria-labelledby", tabId);
    });

    tabs.forEach((tab) => {
      tab.addEventListener("click", () => {
        activateTab(tabs, panels, tab);
      });

      tab.addEventListener("keydown", (event) => {
        const currentIndex = tabs.indexOf(tab);
        let next;

        if (event.key === "ArrowRight") {
          next = tabs[currentIndex + 1] ?? tabs[0];
        }
        if (event.key === "ArrowLeft") {
          next = tabs[currentIndex - 1] ?? tabs.at(-1);
        }
        if (event.key === "Home") {
          next = tabs[0];
        }
        if (event.key === "End") {
          next = tabs.at(-1);
        }

        if (!next) return;

        event.preventDefault();
        next.focus();
        activateTab(tabs, panels, next);
      });
    });

    syncTabFocusability(tabs);
  }

  function initAll() {
    document.querySelectorAll(".js-tab-basic").forEach(initTabBasic);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initAll);
  } else {
    initAll();
  }
})();
