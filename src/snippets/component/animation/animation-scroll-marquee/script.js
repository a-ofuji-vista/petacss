(function () {
  function getScroller(root) {
    const overflowY = getComputedStyle(root).overflowY;
    return overflowY === "auto" || overflowY === "scroll"
      ? root
      : document.documentElement;
  }

  function prepareTrack(row) {
    const track = row.querySelector(".animation-scroll-marquee__track");
    const group = track
      ? track.querySelector(".animation-scroll-marquee__group")
      : null;
    if (!track || !group) return null;

    if (track.dataset.animationScrollMarqueePrepared !== "true") {
      const minWidth = Math.max(window.innerWidth, 640);
      let safety = 0;

      while (
        group.offsetWidth > 0 &&
        group.offsetWidth < minWidth &&
        safety < 8
      ) {
        Array.from(group.children).forEach((child) => {
          group.appendChild(child.cloneNode(true));
        });
        safety += 1;
      }

      const clone = group.cloneNode(true);
      clone.setAttribute("aria-hidden", "true");
      track.appendChild(clone);
      track.dataset.animationScrollMarqueePrepared = "true";
    }

    return track;
  }

  function createTween(track, isLtr) {
    return gsap.fromTo(
      track,
      { xPercent: isLtr ? -50 : 0 },
      {
        xPercent: isLtr ? 0 : -50,
        duration: 20,
        ease: "none",
        repeat: -1,
      },
    );
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
      .querySelectorAll(".js-animation-scroll-marquee")
      .forEach((root) => {
        if (root.dataset.animationScrollMarqueeInit) return;
        root.dataset.animationScrollMarqueeInit = "true";

        if (reducedMotion) return;

        const scroller = getScroller(root);
        const stages = [];

        root
          .querySelectorAll(".js-animation-scroll-marquee-stage")
          .forEach((stage) => {
            const mode = stage.dataset.mode === "auto" ? "auto" : "scroll";
            const tweens = [];

            stage
              .querySelectorAll(".js-animation-scroll-marquee-row")
              .forEach((row) => {
                const track = prepareTrack(row);
                if (!track) return;

                const tween = createTween(
                  track,
                  row.dataset.direction === "ltr",
                );
                tween.timeScale(mode === "auto" ? 1 : 0);
                tweens.push(tween);
              });

            if (!tweens.length) return;

            const state = {
              mode,
              tweens,
              boost: 0,
              target: mode === "auto" ? 1 : 0,
              current: mode === "auto" ? 1 : 0,
            };

            ScrollTrigger.create({
              trigger: stage,
              scroller,
              start: "top bottom",
              end: "bottom top",
              onUpdate: (self) => {
                const velocity = self.getVelocity();
                if (state.mode === "auto") {
                  state.boost = gsap.utils.clamp(-5, 5, velocity / 280);
                } else {
                  state.target = gsap.utils.clamp(-6, 6, velocity / 280);
                }
              },
            });

            stages.push(state);
          });

        if (!stages.length) return;

        gsap.ticker.add(() => {
          stages.forEach((state) => {
            if (state.mode === "auto") {
              state.boost *= 0.9;
              if (Math.abs(state.boost) < 0.02) state.boost = 0;
              state.target =
                state.boost >= 0 ? 1 + state.boost : -1 + state.boost;
            } else {
              state.target *= 0.88;
              if (Math.abs(state.target) < 0.001) state.target = 0;
            }

            if (state.current !== 0 && state.current * state.target < 0) {
              state.current = state.target;
            } else {
              state.current += (state.target - state.current) * 0.2;
            }

            if (state.mode !== "auto" && Math.abs(state.current) < 0.001) {
              state.current = 0;
            }

            state.tweens.forEach((tween) => {
              tween.timeScale(state.current);
            });
          });
        });

        ScrollTrigger.refresh();
      });
  }

  function start() {
    if (document.fonts && document.fonts.status !== "loaded") {
      const timer = window.setTimeout(init, 1200);
      document.fonts.ready.then(() => {
        window.clearTimeout(timer);
        init();
      });
      return;
    }

    init();
  }

  if (typeof gsap !== "undefined" && typeof ScrollTrigger !== "undefined") {
    start();
    return;
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", start, { once: true });
  } else {
    start();
  }
})();
