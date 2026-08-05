(function () {
  const DRAG_THRESHOLD = 5;
  const SUPPRESS_CLICK_MS = 100;

  function initDragScroll(el) {
    if (el.dataset.cardImageTextRow3ScrollInit === "true") return;
    el.dataset.cardImageTextRow3ScrollInit = "true";

    let isPointerDown = false;
    let isDragging = false;
    let suppressClick = false;
    let suppressClickTimeoutId = 0;
    let startX = 0;
    let startScrollLeft = 0;

    function clearSuppressClickTimeout() {
      if (suppressClickTimeoutId) {
        clearTimeout(suppressClickTimeoutId);
        suppressClickTimeoutId = 0;
      }
    }

    function canDrag() {
      return el.scrollWidth > el.clientWidth + 1;
    }

    function updateScrollState() {
      const scrollable = canDrag();
      el.classList.toggle("is-scrollable", scrollable);
      el.setAttribute(
        "aria-label",
        scrollable ? "カード一覧（横スクロール）" : "カード一覧",
      );
      if (scrollable) {
        el.tabIndex = 0;
      } else {
        el.removeAttribute("tabindex");
      }
    }

    updateScrollState();
    new ResizeObserver(updateScrollState).observe(el);

    function endDrag() {
      if (!isPointerDown) return;
      isPointerDown = false;
      if (isDragging) {
        suppressClick = true;
        isDragging = false;
        el.classList.remove("is-dragging");
        clearSuppressClickTimeout();
        suppressClickTimeoutId = setTimeout(() => {
          suppressClick = false;
          suppressClickTimeoutId = 0;
        }, SUPPRESS_CLICK_MS);
      }
    }

    el.addEventListener("pointerdown", (event) => {
      if (!canDrag() || event.button !== 0 || event.pointerType === "touch") {
        return;
      }

      isPointerDown = true;
      isDragging = false;
      suppressClick = false;
      clearSuppressClickTimeout();
      startX = event.clientX;
      startScrollLeft = el.scrollLeft;
      el.setPointerCapture(event.pointerId);
    });

    el.addEventListener("pointermove", (event) => {
      if (!isPointerDown) return;

      const dx = event.clientX - startX;
      if (!isDragging) {
        if (Math.abs(dx) < DRAG_THRESHOLD) return;
        isDragging = true;
        el.classList.add("is-dragging");
      }

      el.scrollLeft = startScrollLeft - dx;
      event.preventDefault();
    });

    el.addEventListener("pointerup", endDrag);
    el.addEventListener("pointercancel", endDrag);

    el.addEventListener(
      "click",
      (event) => {
        if (!suppressClick) return;
        event.preventDefault();
        event.stopPropagation();
        suppressClick = false;
        clearSuppressClickTimeout();
      },
      true,
    );
  }

  function initAll() {
    document
      .querySelectorAll(".js-card-image-text-row-3-scroll")
      .forEach(initDragScroll);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initAll);
  } else {
    initAll();
  }
})();
