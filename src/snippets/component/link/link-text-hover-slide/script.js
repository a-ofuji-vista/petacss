(function () {
  function initLinkTextHoverSlide(link) {
    if (link.dataset.linkTextHoverSlideInit === "true") return;
    link.dataset.linkTextHoverSlideInit = "true";

    const inner = link.querySelector(".link-text-hover-slide__inner");
    const text = inner?.querySelector(".link-text-hover-slide__text");
    if (!inner || !text) return;

    const clone = text.cloneNode(true);
    clone.setAttribute("aria-hidden", "true");
    inner.appendChild(clone);

    link.classList.add("link-text-hover-slide--enhanced");
  }

  function initAll() {
    document
      .querySelectorAll(".js-link-text-hover-slide")
      .forEach(initLinkTextHoverSlide);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initAll);
  } else {
    initAll();
  }
})();
