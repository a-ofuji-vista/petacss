(function () {
  function getScroller(root) {
    const overflowY = getComputedStyle(root).overflowY;
    return overflowY === "auto" || overflowY === "scroll"
      ? root
      : document.documentElement;
  }

  function init() {
    if (typeof gsap === "undefined" || typeof ScrollTrigger === "undefined") {
      return;
    }

    gsap.registerPlugin(ScrollTrigger);

    const reducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;

    document.querySelectorAll(".js-animation-gsap-fade-in").forEach((root) => {
      if (root.dataset.animationGsapFadeInInit) return;
      root.dataset.animationGsapFadeInInit = "true";

      const items = root.querySelectorAll(".animation-gsap-fade-in__item");
      if (!items.length) return;

      if (reducedMotion) return;

      const scroller = getScroller(root);
      let nextAt = 0;

      items.forEach((item) => {
        gsap.set(item, { opacity: 0, y: 40 });
        ScrollTrigger.create({
          trigger: item,
          scroller,
          start: "top 80%",
          once: true,
          onEnter: () => {
            const now = performance.now() / 1000;
            const delay = Math.max(0, nextAt - now);
            nextAt = now + delay + 0.18;
            gsap.to(item, {
              opacity: 1,
              y: 0,
              duration: 0.7,
              delay,
              ease: "power2.out",
            });
          },
        });
      });

      ScrollTrigger.refresh();
    });
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
