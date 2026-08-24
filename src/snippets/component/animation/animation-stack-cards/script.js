(function () {
  /* 重ね表示は CSS sticky。GSAP は matchMedia のクラス切り替えのみ。 */
  /* style.css の 480px と揃える。未満では sticky なし。 */
  var DESKTOP_MIN_WIDTH = 480;

  function equalizeCardHeights(cards) {
    var inners = cards
      .map(function (card) {
        return card.querySelector(".animation-stack-cards__inner");
      })
      .filter(Boolean);
    var images = [];
    var cancelled = false;
    var rafId = 0;

    function apply() {
      if (cancelled) return;

      inners.forEach(function (el) {
        el.style.minHeight = "";
      });

      var max = 0;
      inners.forEach(function (el) {
        max = Math.max(max, el.offsetHeight);
      });

      inners.forEach(function (el) {
        el.style.minHeight = max + "px";
      });
    }

    function scheduleApply() {
      if (cancelled || rafId) return;
      rafId = requestAnimationFrame(function () {
        rafId = 0;
        apply();
      });
    }

    apply();
    window.addEventListener("resize", scheduleApply, { passive: true });

    if (document.fonts && document.fonts.ready) {
      document.fonts.ready.then(scheduleApply);
    }

    cards.forEach(function (card) {
      card.querySelectorAll("img").forEach(function (img) {
        images.push(img);
        if (!img.complete) {
          img.addEventListener("load", scheduleApply);
        }
      });
    });

    return function () {
      cancelled = true;
      if (rafId) {
        cancelAnimationFrame(rafId);
        rafId = 0;
      }
      window.removeEventListener("resize", scheduleApply);
      images.forEach(function (img) {
        img.removeEventListener("load", scheduleApply);
      });
      inners.forEach(function (el) {
        el.style.minHeight = "";
      });
    };
  }

  function init() {
    if (typeof gsap === "undefined") {
      return;
    }

    document
      .querySelectorAll(".js-animation-stack-cards")
      .forEach(function (root) {
        if (root.dataset.animationStackCardsInit) return;
        root.dataset.animationStackCardsInit = "true";

        var cards = Array.from(
          root.querySelectorAll(".animation-stack-cards__card"),
        );
        if (cards.length < 2) return;

        var section = root.querySelector(".animation-stack-cards__section");
        var labelStatic = section ? section.getAttribute("aria-label") : "";
        var labelMotion =
          section && section.getAttribute("data-label-motion")
            ? section.getAttribute("data-label-motion")
            : labelStatic;

        var mm = gsap.matchMedia();

        mm.add(
          {
            isDesktop: "(min-width: " + DESKTOP_MIN_WIDTH + "px)",
            reduceMotion: "(prefers-reduced-motion: reduce)",
          },
          function (context) {
            if (
              !context.conditions.isDesktop ||
              context.conditions.reduceMotion
            ) {
              return;
            }

            root.classList.add("js-animation-stack-cards--active");
            if (section && labelMotion) {
              section.setAttribute("aria-label", labelMotion);
            }

            var revertHeights = equalizeCardHeights(cards);

            return function () {
              revertHeights();
              root.classList.remove("js-animation-stack-cards--active");
              if (section && labelStatic) {
                section.setAttribute("aria-label", labelStatic);
              }
            };
          },
        );
      });
  }

  if (typeof gsap !== "undefined") {
    init();
    return;
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init, { once: true });
  } else {
    init();
  }
})();
