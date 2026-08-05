(function () {
  const reducedMotion = matchMedia("(prefers-reduced-motion: reduce)");

  function getTransitionMs(root) {
    const duration = getComputedStyle(root)
      .getPropertyValue("--accordion-duration")
      .trim();
    if (!duration) return 0;
    const ms = duration.endsWith("ms")
      ? parseFloat(duration)
      : parseFloat(duration) * 1000;
    return Number.isFinite(ms) ? ms : 0;
  }

  function panelHasTransition(panel) {
    return getComputedStyle(panel)
      .transitionDuration.split(",")
      .some((duration) => parseFloat(duration) > 0);
  }

  function initAccordionBasic(root) {
    if (root.dataset.accordionBasicInit === "true") return;
    root.dataset.accordionBasicInit = "true";

    root.classList.add("accordion-basic--enhanced");

    root.querySelectorAll(".js-accordion-basic-item").forEach((item) => {
      const summary = item.querySelector(".accordion-basic__trigger");
      const panel = item.querySelector(".js-accordion-basic-panel");
      if (!summary || !panel) return;

      let transitionHandler = null;
      let cancelHandler = null;
      let fallbackTimer = 0;

      function cleanupTransition() {
        if (transitionHandler) {
          panel.removeEventListener("transitionend", transitionHandler);
          transitionHandler = null;
        }
        if (cancelHandler) {
          panel.removeEventListener("transitioncancel", cancelHandler);
          cancelHandler = null;
        }
        if (fallbackTimer) {
          clearTimeout(fallbackTimer);
          fallbackTimer = 0;
        }
      }

      function setExpanded(open) {
        item.classList.toggle("accordion-basic__item--expanded", open);
        item.toggleAttribute("open", open);
      }

      if (item.hasAttribute("open")) {
        item.classList.add("accordion-basic__item--expanded");
      }

      summary.addEventListener("click", (event) => {
        event.preventDefault();

        const willOpen = !item.classList.contains(
          "accordion-basic__item--expanded",
        );

        if (reducedMotion.matches) {
          cleanupTransition();
          item.classList.remove("accordion-basic__item--animating");
          setExpanded(willOpen);
          return;
        }

        cleanupTransition();

        item.classList.add("accordion-basic__item--animating");
        void panel.offsetHeight;

        let finished = false;
        const finish = () => {
          if (finished) return;
          finished = true;
          cleanupTransition();
          item.classList.remove("accordion-basic__item--animating");
          setExpanded(willOpen);
        };

        if (!panelHasTransition(panel)) {
          setExpanded(willOpen);
          finish();
          return;
        }

        const onTransitionDone = (transitionEvent) => {
          if (transitionEvent.target !== panel) return;
          if (transitionEvent.propertyName !== "grid-template-rows") return;
          finish();
        };

        transitionHandler = onTransitionDone;
        cancelHandler = onTransitionDone;

        panel.addEventListener("transitionend", transitionHandler);
        panel.addEventListener("transitioncancel", cancelHandler);
        fallbackTimer = window.setTimeout(finish, getTransitionMs(root) + 50);

        if (willOpen) {
          item.setAttribute("open", "");
          requestAnimationFrame(() => {
            requestAnimationFrame(() => {
              item.classList.add("accordion-basic__item--expanded");
            });
          });
        } else {
          item.classList.remove("accordion-basic__item--expanded");
        }
      });
    });
  }

  function initAll() {
    document
      .querySelectorAll(".js-accordion-basic")
      .forEach(initAccordionBasic);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initAll);
  } else {
    initAll();
  }
})();
