(function () {
  var MIXED_EFFECTS = [
    { opacity: 0, y: 48 },
    { opacity: 0, y: -48 },
    { opacity: 0, x: -36 },
    { opacity: 0, x: 36 },
    { opacity: 0, scale: 0.2, rotation: -24 },
    { opacity: 0, scale: 1.6, filter: "blur(10px)" },
    { opacity: 0, rotation: 90, scale: 0.5 },
    { opacity: 0, y: 24, rotation: 12 },
  ];

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

  function splitText(target) {
    var text = target.textContent.trim();
    if (!text) return [];

    target.textContent = "";
    target.setAttribute("aria-label", text);

    return Array.from(text).map(function (char) {
      var span = document.createElement("span");
      span.className = "animation-text-split__char";
      span.textContent = char === " " ? "\u00a0" : char;
      span.setAttribute("aria-hidden", "true");
      target.appendChild(span);
      return span;
    });
  }

  function getMixedFrom(charIndex) {
    return MIXED_EFFECTS[charIndex % MIXED_EFFECTS.length];
  }

  function animateChars(chars, mode, timeline) {
    chars.forEach(function (char, index) {
      var from;
      var to = {
        opacity: 1,
        x: 0,
        y: 0,
        scale: 1,
        rotation: 0,
        filter: "blur(0px)",
        duration: 0.65,
        ease: "power3.out",
      };

      if (mode === "wave") {
        from = { opacity: 0, y: 40 };
        to.ease = "power2.out";
        to.duration = 0.55;
      } else if (mode === "pop") {
        from = { opacity: 0, scale: 0, rotation: -8 };
        to.ease = "back.out(2)";
        to.duration = 0.7;
      } else {
        from = getMixedFrom(index);
        to.ease = index % 3 === 0 ? "power4.out" : "power3.out";
      }

      gsap.set(char, from);
      timeline.to(char, to, index * 0.06);
    });
  }

  function animateScrub(target, chars, scroller) {
    var scrub = target.closest(".animation-text-split__scrub");
    var section = target.closest(".animation-text-split__scrub-section");
    var viewport = target.closest(".animation-text-split__scrub-viewport");
    var outro = scrub
      ? scrub.querySelector(".animation-text-split__outro")
      : null;
    if (!section || !viewport) return;

    var travel = Math.max(560, chars.length * 40);

    function layout() {
      var viewportH = viewport.offsetHeight;
      var leftover = Math.max(
        0,
        Math.ceil((getScrollerHeight(scroller) - viewportH) / 2),
      );
      var nextHeight = viewportH + travel + "px";
      if (section.style.height !== nextHeight) {
        section.style.height = nextHeight;
      }
      viewport.style.top = leftover + "px";

      if (outro) {
        outro.style.minHeight = Math.max(400, leftover + 1) + "px";
      }
    }

    layout();
    ScrollTrigger.addEventListener("refreshInit", layout);

    var timeline = gsap.timeline({
      scrollTrigger: {
        trigger: viewport,
        scroller: scroller,
        start: "center center",
        end: function () {
          return "+=" + travel;
        },
        scrub: 0.55,
        invalidateOnRefresh: true,
      },
    });

    chars.forEach(function (char, index) {
      gsap.set(char, { opacity: 0, y: 36, filter: "blur(8px)" });
      timeline.to(
        char,
        {
          opacity: 1,
          y: 0,
          filter: "blur(0px)",
          duration: 1,
          ease: "none",
        },
        index * 0.45,
      );
    });
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
      .querySelectorAll(".js-animation-text-split")
      .forEach(function (root) {
        if (root.dataset.animationTextSplitInit) return;
        root.dataset.animationTextSplitInit = "true";

        var targets = root.querySelectorAll(".js-animation-text-split-target");
        if (!targets.length) return;

        var scroller = getScroller(root);

        targets.forEach(function (target) {
          var mode = target.dataset.animationTextSplitMode || "mixed";
          var chars = splitText(target);
          if (!chars.length) return;

          if (reducedMotion) {
            gsap.set(chars, { opacity: 1, clearProps: "transform,filter" });
            return;
          }

          if (mode === "scrub") {
            animateScrub(target, chars, scroller);
            return;
          }

          var played = false;

          ScrollTrigger.create({
            trigger: target,
            scroller: scroller,
            start: "top 82%",
            once: true,
            onEnter: function () {
              if (played) return;
              played = true;

              var timeline = gsap.timeline();
              animateChars(chars, mode, timeline);
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
