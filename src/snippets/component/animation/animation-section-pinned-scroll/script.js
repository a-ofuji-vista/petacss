(function () {
  var SLIDE_CURRENT_CLASS =
    "js-animation-section-pinned-scroll__slide--current";
  var PROGRESS_ITEM_CLASS = "animation-section-pinned-scroll__progress-item";
  var PROGRESS_CURRENT_CLASS =
    "js-animation-section-pinned-scroll__progress-item--current";

  function getScroller(root) {
    var overflowY = getComputedStyle(root).overflowY;
    return overflowY === "auto" || overflowY === "scroll"
      ? root
      : document.documentElement;
  }

  function getScrollerHeight(scroller) {
    if (scroller === document.documentElement || scroller === document.body) {
      return window.innerHeight;
    }
    return scroller.clientHeight;
  }

  function init() {
    if (typeof gsap === "undefined" || typeof ScrollTrigger === "undefined") {
      return;
    }

    gsap.registerPlugin(ScrollTrigger);

    var reducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;

    document
      .querySelectorAll(".js-animation-section-pinned-scroll")
      .forEach(function (root) {
        if (root.dataset.animationSectionPinnedScrollInit) return;
        root.dataset.animationSectionPinnedScrollInit = "true";

        var section = root.querySelector(
          ".animation-section-pinned-scroll__section",
        );
        var viewport = root.querySelector(
          ".animation-section-pinned-scroll__viewport",
        );
        var slides = Array.from(
          root.querySelectorAll(".animation-section-pinned-scroll__slide"),
        );
        var progress = root.querySelector(
          ".animation-section-pinned-scroll__progress",
        );
        if (!section || !viewport || slides.length < 2) return;

        if (reducedMotion) return;

        root.classList.add("js-animation-section-pinned-scroll--active");

        var scroller = getScroller(root);
        var outro = root.querySelector(
          ".animation-section-pinned-scroll__outro",
        );
        var progressItems = [];
        var current = -1;
        var travel = 0;

        if (progress) {
          progress.replaceChildren();
          slides.forEach(function () {
            var item = document.createElement("li");
            item.className = PROGRESS_ITEM_CLASS;
            progress.appendChild(item);
            progressItems.push(item);
          });
        }

        function setCurrent(index) {
          if (index === current) return;
          current = index;
          slides.forEach(function (slide, i) {
            var isCurrent = i === index;
            slide.classList.toggle(SLIDE_CURRENT_CLASS, isCurrent);
            if (isCurrent) {
              slide.removeAttribute("aria-hidden");
            } else {
              slide.setAttribute("aria-hidden", "true");
            }
          });
          progressItems.forEach(function (item, i) {
            item.classList.toggle(PROGRESS_CURRENT_CLASS, i === index);
          });
        }

        function layout() {
          var viewportH = viewport.offsetHeight;
          var scrollerH = getScrollerHeight(scroller);
          var topOffset = Math.max(0, (scrollerH - viewportH) / 2);
          travel = Math.max(viewportH, 240) * slides.length;
          var nextHeight = viewportH + travel + "px";
          if (section.style.height !== nextHeight) {
            section.style.height = nextHeight;
          }
          viewport.style.top = topOffset + "px";

          if (outro) {
            outro.style.minHeight = Math.max(400, topOffset + 1) + "px";
          }
        }

        setCurrent(0);
        layout();
        ScrollTrigger.addEventListener("refreshInit", layout);

        ScrollTrigger.create({
          trigger: viewport,
          scroller: scroller,
          start: "center center",
          end: function () {
            return "+=" + travel;
          },
          invalidateOnRefresh: true,
          onUpdate: function (self) {
            var index = Math.min(
              slides.length - 1,
              Math.floor(self.progress * slides.length),
            );
            setCurrent(index);
          },
        });
      });

    ScrollTrigger.refresh();
  }

  if (typeof gsap !== "undefined" && typeof ScrollTrigger !== "undefined") {
    init();
    return;
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init, { once: true });
  } else {
    init();
  }
})();
