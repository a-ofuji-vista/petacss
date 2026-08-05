(function () {
  let instanceIndex = 0;

  function syncTabFocusability(tabs) {
    tabs.forEach((tab) => {
      tab.tabIndex = tab.getAttribute("aria-selected") === "true" ? 0 : -1;
    });
  }

  function updateIndicator(indicator, tab, list) {
    const listRect = list.getBoundingClientRect();
    const tabRect = tab.getBoundingClientRect();
    const insetInline = 8;
    const left = tabRect.left - listRect.left + insetInline;
    const width = Math.max(0, tabRect.width - insetInline * 2);

    indicator.style.setProperty("--indicator-left", `${left}px`);
    indicator.style.setProperty("--indicator-width", `${width}px`);
  }

  function getActiveTab(tabs) {
    return tabs.find((tab) =>
      tab.classList.contains("tab-slide-highlight__tab--active"),
    );
  }

  function activateTab(tabs, panels, indicator, list, activeTab) {
    const name = activeTab.dataset.tab;
    if (!name) return;

    tabs.forEach((tab) => {
      const isActive = tab === activeTab;
      tab.classList.toggle("tab-slide-highlight__tab--active", isActive);
      tab.setAttribute("aria-selected", String(isActive));
    });

    syncTabFocusability(tabs);
    updateIndicator(indicator, activeTab, list);

    panels.forEach((panel) => {
      const isActive = panel.dataset.panel === name;
      panel.classList.toggle("tab-slide-highlight__panel--active", isActive);
      panel.hidden = !isActive;
    });
  }

  function initTabSlideHighlight(root) {
    if (root.dataset.tabSlideHighlightInit === "true") return;
    root.dataset.tabSlideHighlightInit = "true";

    instanceIndex += 1;

    const list = root.querySelector(".tab-slide-highlight__list");
    const indicator = root.querySelector(".js-tab-slide-highlight-indicator");
    const tabs = [
      ...root.querySelectorAll(".js-tab-slide-highlight-tab[data-tab]"),
    ];
    const panels = [
      ...root.querySelectorAll(".js-tab-slide-highlight-panel[data-panel]"),
    ];

    if (!list || !indicator || tabs.length === 0 || panels.length === 0) return;

    tabs.forEach((tab, index) => {
      const panelName = tab.dataset.tab;
      const panel = panels.find((item) => item.dataset.panel === panelName);
      if (!panel) return;

      const tabId = `tab-slide-highlight-tab-${instanceIndex}-${index + 1}`;
      const panelId = `tab-slide-highlight-panel-${instanceIndex}-${index + 1}`;

      tab.id = tabId;
      tab.setAttribute("aria-controls", panelId);
      panel.id = panelId;
      panel.setAttribute("aria-labelledby", tabId);
    });

    const activeTab = getActiveTab(tabs) ?? tabs[0];
    updateIndicator(indicator, activeTab, list);

    const resizeObserver = new ResizeObserver(() => {
      const current = getActiveTab(tabs) ?? tabs[0];
      updateIndicator(indicator, current, list);
    });

    resizeObserver.observe(list);
    tabs.forEach((tab) => resizeObserver.observe(tab));

    tabs.forEach((tab) => {
      tab.addEventListener("click", () => {
        activateTab(tabs, panels, indicator, list, tab);
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
        activateTab(tabs, panels, indicator, list, next);
      });
    });

    syncTabFocusability(tabs);
  }

  function initAll() {
    document
      .querySelectorAll(".js-tab-slide-highlight")
      .forEach(initTabSlideHighlight);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initAll);
  } else {
    initAll();
  }
})();
