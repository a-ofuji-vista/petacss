(function () {
  function getScroller(root) {
    var overflowY = getComputedStyle(root).overflowY;
    return overflowY === "auto" || overflowY === "scroll"
      ? root
      : document.documentElement;
  }

  function prepareCircle(circle) {
    var length = circle.getTotalLength();
    if (!length) {
      var radius = parseFloat(circle.getAttribute("r")) || 0;
      length = 2 * Math.PI * radius;
    }
    var overlap = 2;
    var dash = length + overlap;
    circle.style.strokeDasharray = String(dash);
    circle.style.strokeDashoffset = String(dash);
    return dash;
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
      .querySelectorAll(".js-animation-scroll-circles")
      .forEach(function (root) {
        if (root.dataset.animationScrollCirclesInit) return;
        root.dataset.animationScrollCirclesInit = "true";

        var section = root.querySelector(".animation-scroll-circles__section");
        var left = root.querySelector(
          ".animation-scroll-circles__circle--left",
        );
        var right = root.querySelector(
          ".animation-scroll-circles__circle--right",
        );
        if (!section || !left || !right) return;

        if (reducedMotion) return;

        var scroller = getScroller(root);
        var leftLength = prepareCircle(left);
        var rightLength = prepareCircle(right);
        var played = false;

        function play() {
          if (played) return;
          played = true;

          var timeline = gsap.timeline();
          timeline.fromTo(
            left,
            { strokeDashoffset: leftLength },
            {
              strokeDashoffset: 0,
              duration: 1.35,
              ease: "power1.inOut",
            },
          );
          timeline.fromTo(
            right,
            { strokeDashoffset: rightLength },
            {
              strokeDashoffset: 0,
              duration: 1.35,
              ease: "power1.inOut",
            },
            "-=0.18",
          );
        }

        ScrollTrigger.create({
          trigger: section,
          scroller: scroller,
          start: "top 78%",
          once: true,
          onEnter: play,
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
