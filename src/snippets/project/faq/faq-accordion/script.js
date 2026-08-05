(function () {
  const reducedMotion = matchMedia("(prefers-reduced-motion: reduce)");
  let instanceIndex = 0;

  function getTransitionMs(root) {
    const duration = getComputedStyle(root)
      .getPropertyValue("--faq-duration")
      .trim();
    if (!duration) return 0;
    const ms = duration.endsWith("ms")
      ? parseFloat(duration)
      : parseFloat(duration) * 1000;
    return Number.isFinite(ms) ? ms : 0;
  }

  function panelHasTransition(panel) {
    return (
      parseFloat(getComputedStyle(panel).transitionDuration.split(",")[0]) > 0
    );
  }

  function initFaqAccordion(root) {
    if (root.dataset.faqAccordionInit === "true") return;
    root.dataset.faqAccordionInit = "true";

    instanceIndex += 1;

    const heading = root.querySelector(".faq-accordion__heading");
    if (heading) {
      const headingId = `faq-accordion-heading-${instanceIndex}`;
      heading.id = headingId;
      root.setAttribute("aria-labelledby", headingId);
    }

    root.classList.add("faq-accordion--enhanced");

    root.querySelectorAll(".js-faq-accordion-item").forEach((item) => {
      const summary = item.querySelector(".faq-accordion__question");
      const panel = item.querySelector(".js-faq-accordion-panel");
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
        item.classList.toggle("faq-accordion__item--expanded", open);
        item.toggleAttribute("open", open);
      }

      if (item.hasAttribute("open")) {
        item.classList.add("faq-accordion__item--expanded");
      }

      summary.addEventListener("click", (event) => {
        event.preventDefault();

        const willOpen = !item.classList.contains(
          "faq-accordion__item--expanded",
        );

        if (reducedMotion.matches) {
          cleanupTransition();
          item.classList.remove("faq-accordion__item--animating");
          setExpanded(willOpen);
          return;
        }

        cleanupTransition();

        item.classList.add("faq-accordion__item--animating");
        void panel.offsetHeight;

        let finished = false;
        const finish = () => {
          if (finished) return;
          finished = true;
          cleanupTransition();
          item.classList.remove("faq-accordion__item--animating");
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
              item.classList.add("faq-accordion__item--expanded");
            });
          });
        } else {
          item.classList.remove("faq-accordion__item--expanded");
        }
      });
    });
  }

  function initAll() {
    document.querySelectorAll(".js-faq-accordion").forEach(initFaqAccordion);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initAll);
  } else {
    initAll();
  }
})();
