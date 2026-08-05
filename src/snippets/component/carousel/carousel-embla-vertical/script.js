(function () {
  function init() {
    if (typeof EmblaCarousel === "undefined") return;

    const reducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;

    document.querySelectorAll(".js-carousel-embla-vertical").forEach((root) => {
      if (root.dataset.carouselEmblaVerticalInit) return;
      root.dataset.carouselEmblaVerticalInit = "true";

      const viewport = root.querySelector(".carousel-embla-vertical__viewport");
      const container = root.querySelector(
        ".carousel-embla-vertical__container",
      );
      if (!viewport || !container) return;

      const originalSlides = Array.from(
        container.querySelectorAll(".carousel-embla-vertical__slide"),
      );
      if (!originalSlides.length) return;

      const speedValue = getComputedStyle(root)
        .getPropertyValue("--carousel-scroll-speed")
        .trim();
      const speed = parseFloat(speedValue);

      const plugins = [];
      if (!reducedMotion && typeof EmblaCarouselAutoScroll !== "undefined") {
        plugins.push(
          EmblaCarouselAutoScroll({
            direction: "forward",
            speed: Number.isFinite(speed) ? speed : 1,
            startDelay: 0,
            stopOnInteraction: false,
            stopOnMouseEnter: false,
            playOnInit: true,
          }),
        );
      }

      const emblaApi = EmblaCarousel(
        viewport,
        { axis: "y", loop: true, align: "start", watchDrag: false },
        plugins,
      );

      const MAX_DUPLICATE_ROUNDS = 12;

      function canLoop() {
        return Boolean(emblaApi.internalEngine()?.slideLooper?.canLoop());
      }

      function appendOriginalSlides() {
        originalSlides.forEach((slide) => {
          const clone = slide.cloneNode(true);
          clone.setAttribute("data-carousel-clone", "");
          clone.setAttribute("aria-hidden", "true");
          container.appendChild(clone);
        });
      }

      function ensureLoop() {
        let rounds = 0;
        while (!canLoop() && rounds < MAX_DUPLICATE_ROUNDS) {
          appendOriginalSlides();
          emblaApi.reInit();
          rounds += 1;
        }

        if (!reducedMotion && rounds > 0) {
          emblaApi.plugins()?.autoScroll?.play();
        }
      }

      ensureLoop();
      emblaApi.on("resize", ensureLoop);
    });
  }

  if (typeof EmblaCarousel !== "undefined") {
    init();
    return;
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init, { once: true });
  } else {
    init();
  }
})();
