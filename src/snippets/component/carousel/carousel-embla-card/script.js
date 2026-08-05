(function () {
  function init() {
    if (typeof EmblaCarousel === "undefined") return;

    document.querySelectorAll(".js-carousel-embla-card").forEach((root) => {
      if (root.dataset.carouselEmblaCardInit) return;
      root.dataset.carouselEmblaCardInit = "true";

      const viewport = root.querySelector(".carousel-embla-card__viewport");
      const prevButton = root.querySelector(
        ".carousel-embla-card__arrow--prev",
      );
      const nextButton = root.querySelector(
        ".carousel-embla-card__arrow--next",
      );
      const paginationNode = root.querySelector(
        ".carousel-embla-card__pagination",
      );
      if (!viewport || !prevButton || !nextButton || !paginationNode) return;

      const emblaApi = EmblaCarousel(viewport, {
        align: "start",
        containScroll: "trimSnaps",
      });

      const dots = [];

      function createDots() {
        paginationNode.replaceChildren();
        dots.length = 0;

        emblaApi.scrollSnapList().forEach((_, index) => {
          const dot = document.createElement("button");
          dot.type = "button";
          dot.className = "carousel-embla-card__dot";
          dot.setAttribute("aria-label", `${index + 1} 枚目のスライドへ`);
          dot.addEventListener("click", () => emblaApi.scrollTo(index));
          paginationNode.appendChild(dot);
          dots.push(dot);
        });
      }

      function updateControls() {
        prevButton.disabled = !emblaApi.canScrollPrev();
        nextButton.disabled = !emblaApi.canScrollNext();

        const selectedIndex = emblaApi.selectedScrollSnap();
        dots.forEach((dot, index) => {
          const isSelected = index === selectedIndex;
          dot.classList.toggle(
            "carousel-embla-card__dot--selected",
            isSelected,
          );
          dot.setAttribute("aria-current", isSelected ? "true" : "false");
        });
      }

      prevButton.addEventListener("click", () => emblaApi.scrollPrev());
      nextButton.addEventListener("click", () => emblaApi.scrollNext());

      createDots();
      updateControls();

      emblaApi.on("select", updateControls);
      emblaApi.on("reInit", () => {
        createDots();
        updateControls();
        window.dispatchEvent(new Event("resize"));
      });

      window.dispatchEvent(new Event("resize"));
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
