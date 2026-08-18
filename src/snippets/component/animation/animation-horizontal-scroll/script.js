(function () {
  function getScroller(root) {
    const overflowY = getComputedStyle(root).overflowY;
    return overflowY === "auto" || overflowY === "scroll"
      ? root
      : document.documentElement;
  }

  function getTravel(viewport, track) {
    const last = track.lastElementChild;
    if (!last) return 0;

    const currentX = parseFloat(String(gsap.getProperty(track, "x"))) || 0;
    const paddingRight = parseFloat(getComputedStyle(track).paddingRight) || 0;
    const lastRight = last.getBoundingClientRect().right - currentX;
    const viewportRight = viewport.getBoundingClientRect().right;

    return Math.max(0, Math.ceil(lastRight + paddingRight - viewportRight));
  }

  function init() {
    if (typeof gsap === "undefined" || typeof ScrollTrigger === "undefined") {
      return;
    }

    gsap.registerPlugin(ScrollTrigger);

    const reducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;

    document
      .querySelectorAll(".js-animation-horizontal-scroll")
      .forEach((root) => {
        if (root.dataset.animationHorizontalScrollInit) return;
        root.dataset.animationHorizontalScrollInit = "true";

        const section = root.querySelector(
          ".animation-horizontal-scroll__section",
        );
        const viewport = root.querySelector(
          ".animation-horizontal-scroll__viewport",
        );
        const track = root.querySelector(".animation-horizontal-scroll__track");
        if (!section || !viewport || !track) return;

        if (reducedMotion) return;

        root.classList.add("js-animation-horizontal-scroll--active");

        const scroller = getScroller(root);
        const outro = root.querySelector(".animation-horizontal-scroll__outro");
        let travel = 0;

        function getScrollerHeight() {
          if (
            scroller === document.documentElement ||
            scroller === document.body
          ) {
            return window.innerHeight;
          }
          return scroller.clientHeight;
        }

        function layout() {
          travel = getTravel(viewport, track);
          const viewportH = viewport.offsetHeight;
          const scrollerH = getScrollerHeight();
          const topOffset = Math.max(0, (scrollerH - viewportH) / 2);
          const nextHeight = `${viewportH + travel}px`;
          if (section.style.height !== nextHeight) {
            section.style.height = nextHeight;
          }
          viewport.style.top = `${topOffset}px`;

          if (outro) {
            const leftover = Math.max(0, topOffset);
            outro.style.minHeight = `${Math.max(400, leftover + 1)}px`;
          }
        }

        layout();
        ScrollTrigger.addEventListener("refreshInit", layout);

        gsap.to(track, {
          x: () => -travel,
          ease: "none",
          scrollTrigger: {
            trigger: viewport,
            scroller,
            start: "center center",
            end: () => "+=" + travel,
            scrub: true,
            invalidateOnRefresh: true,
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
