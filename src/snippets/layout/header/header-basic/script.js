(function () {
  let navIdCounter = 0;
  const onLayoutChangeHandlers = [];

  const isCollapsible = (toggle) =>
    typeof toggle.checkVisibility === "function"
      ? toggle.checkVisibility()
      : getComputedStyle(toggle).display !== "none";

  const ensureNavId = (nav) => {
    if (
      nav.id &&
      document.querySelectorAll(`#${CSS.escape(nav.id)}`).length === 1
    ) {
      return nav.id;
    }
    let id;
    do {
      id = `header-basic-nav-${++navIdCounter}`;
    } while (document.getElementById(id));
    nav.id = id;
    return nav.id;
  };

  document.querySelectorAll(".js-header-basic").forEach((header) => {
    const toggle = header.querySelector(".js-header-basic-toggle");
    const nav = header.querySelector(".js-header-basic-nav");
    if (!toggle || !nav) return;

    const labelOpen = toggle.dataset.labelOpen || "メニューを開く";
    const labelClose = toggle.dataset.labelClose || "メニューを閉じる";

    header.classList.add("header-basic--enhanced");

    toggle.setAttribute("aria-controls", ensureNavId(nav));

    const syncInert = () => {
      const open = header.classList.contains("header-basic--open");
      const animating = header.classList.contains("header-basic--animating");
      if (!isCollapsible(toggle) || (open && !animating)) {
        nav.removeAttribute("inert");
      } else {
        nav.setAttribute("inert", "");
      }
    };

    const onEscapeKeydown = (event) => {
      if (event.key !== "Escape") return;
      if (!header.contains(document.activeElement)) return;
      setOpen(false);
      toggle.focus();
    };

    const setOpen = (open) => {
      header.classList.toggle("header-basic--open", open);
      toggle.setAttribute("aria-expanded", String(open));
      toggle.setAttribute("aria-label", open ? labelClose : labelOpen);
      syncInert();
      if (open) {
        document.addEventListener("keydown", onEscapeKeydown);
      } else {
        document.removeEventListener("keydown", onEscapeKeydown);
      }
    };

    toggle.addEventListener("click", () => {
      header.classList.add("header-basic--animating");
      setOpen(!header.classList.contains("header-basic--open"));
      if (parseFloat(getComputedStyle(nav).transitionDuration) === 0) {
        header.classList.remove("header-basic--animating");
        syncInert();
      }
    });

    nav.addEventListener("transitionend", (event) => {
      if (event.target !== nav) return;
      if (event.propertyName !== "grid-template-rows") return;
      header.classList.remove("header-basic--animating");
      syncInert();
    });

    nav.addEventListener("click", (event) => {
      const target = event.target;
      if (!(target instanceof Element)) return;
      if (target.closest("a[href]")) {
        setOpen(false);
      }
    });

    let wasCollapsible = isCollapsible(toggle);
    const onLayoutChange = () => {
      const collapsible = isCollapsible(toggle);
      if (collapsible === wasCollapsible) return;
      wasCollapsible = collapsible;
      if (!collapsible) {
        header.classList.remove("header-basic--animating");
        setOpen(false);
      } else {
        syncInert();
      }
    };
    onLayoutChangeHandlers.push(onLayoutChange);

    syncInert();
  });

  let resizeRafId = 0;
  window.addEventListener(
    "resize",
    () => {
      if (resizeRafId) return;
      resizeRafId = requestAnimationFrame(() => {
        resizeRafId = 0;
        onLayoutChangeHandlers.forEach((handler) => handler());
      });
    },
    { passive: true },
  );
})();
