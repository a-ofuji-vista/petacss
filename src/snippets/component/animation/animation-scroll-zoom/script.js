(function () {
  function getScroller(root) {
    var overflowY = getComputedStyle(root).overflowY;
    return overflowY === "auto" || overflowY === "scroll"
      ? root
      : document.documentElement;
  }

  function getScrollerHeight(scroller) {
    if (scroller === document.documentElement || scroller === document.body) {
      return document.documentElement.clientHeight || window.innerHeight;
    }
    return scroller.clientHeight;
  }

  function readNumber(root, name, fallback) {
    var value = parseFloat(getComputedStyle(root).getPropertyValue(name));
    return Number.isFinite(value) ? value : fallback;
  }

  function clamp(value, min, max) {
    return Math.min(max, Math.max(min, value));
  }

  function lerp(start, end, progress) {
    return start + (end - start) * progress;
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
      .querySelectorAll(".js-animation-scroll-zoom")
      .forEach(function (root) {
        if (root.dataset.animationScrollZoomInit) return;
        root.dataset.animationScrollZoomInit = "true";

        var section = root.querySelector(".animation-scroll-zoom__section");
        var viewport = root.querySelector(".animation-scroll-zoom__viewport");
        var media = root.querySelector(".animation-scroll-zoom__media");
        var overlay = root.querySelector(".animation-scroll-zoom__overlay");
        var copy = root.querySelector(".animation-scroll-zoom__copy");
        if (!section || !viewport || !media || !overlay || !copy) return;

        if (reducedMotion) return;

        root.classList.add("js-animation-scroll-zoom--active");

        var scroller = getScroller(root);
        var travel = 0;
        var expandDuration = 1;
        var overlayDuration = 0.35;
        var copyDuration = 0.28;
        // duration 1 = 画面高さ 2 倍。--animation-hold は最初から画面高さの倍数。
        var viewportScrollPerDuration = 2;

        var radiusPx = 8;
        var startSize = 1;
        var endWidth = 1;
        var endHeight = 1;
        var expandScroll = expandDuration * viewportScrollPerDuration;
        var overlayScroll = overlayDuration * viewportScrollPerDuration;
        var copyScroll = copyDuration * viewportScrollPerDuration;
        var totalScroll = expandScroll + Math.max(overlayScroll, copyScroll);

        function cacheLayout() {
          var percent = readNumber(root, "--animation-media-width", 58);
          var maxWidth = readNumber(root, "--animation-media-max-width", 640);
          var scaleFrom = readNumber(root, "--animation-scale-from", 0.72);
          var size = Math.min(viewport.clientWidth * (percent / 100), maxWidth);

          radiusPx =
            parseFloat(
              getComputedStyle(root).getPropertyValue(
                "--animation-media-radius",
              ),
            ) || 8;
          startSize = Math.max(1, size * scaleFrom);
          endWidth = viewport.clientWidth;
          endHeight = viewport.clientHeight;
          expandScroll = expandDuration * viewportScrollPerDuration;
          overlayScroll = overlayDuration * viewportScrollPerDuration;
          copyScroll = copyDuration * viewportScrollPerDuration;
          totalScroll =
            expandScroll +
            Math.max(overlayScroll, copyScroll) +
            Math.max(0, readNumber(root, "--animation-hold", 1));
        }

        function getViewportHeight() {
          var scrollerH = getScrollerHeight(scroller);
          var raw = getComputedStyle(root)
            .getPropertyValue("--animation-viewport-height")
            .trim();

          if (!raw || /^100(?:dv|sv|lv)?vh$/i.test(raw)) {
            return scrollerH;
          }

          viewport.style.height = raw;
          var px = viewport.getBoundingClientRect().height;
          return px > 0 ? px : scrollerH;
        }

        function applyProgress(progress) {
          var pos = clamp(progress, 0, 1) * totalScroll;
          var expandP = clamp(pos / expandScroll, 0, 1);

          gsap.set(media, {
            width: lerp(startSize, endWidth, expandP),
            height: lerp(startSize, endHeight, expandP),
            borderRadius: lerp(radiusPx, 0, expandP),
          });

          var afterExpand = pos - expandScroll;
          var overlayP =
            afterExpand < 0 ? 0 : clamp(afterExpand / overlayScroll, 0, 1);
          var copyP =
            afterExpand < 0 ? 0 : clamp(afterExpand / copyScroll, 0, 1);

          gsap.set(overlay, { opacity: overlayP });
          gsap.set(copy, { opacity: copyP, y: lerp(20, 0, copyP) });
        }

        function layout() {
          var viewportH = getViewportHeight();
          viewport.style.height = viewportH + "px";
          viewport.style.top = "0px";
          cacheLayout();
          var unit = Math.max(viewportH, 240);
          travel = unit * totalScroll;
          var nextHeight = viewportH + travel + "px";
          if (section.style.height !== nextHeight) {
            section.style.height = nextHeight;
          }
        }

        layout();
        applyProgress(0);

        ScrollTrigger.create({
          trigger: section,
          scroller: scroller,
          start: "top top",
          end: "bottom bottom",
          scrub: true,
          invalidateOnRefresh: true,
          onRefreshInit: layout,
          onUpdate: function (self) {
            applyProgress(self.progress);
          },
          onRefresh: function (self) {
            applyProgress(self.progress);
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
