(function () {
  function getScroller(root) {
    const overflowY = getComputedStyle(root).overflowY;
    return overflowY === "auto" || overflowY === "scroll"
      ? root
      : document.documentElement;
  }

  function cloneMarqueeItem(node) {
    if (node.tagName !== "IMG") {
      return node.cloneNode(true);
    }

    const deco = document.createElement("span");
    deco.className = node.className;
    deco.setAttribute("aria-hidden", "true");
    const src = node.currentSrc || node.getAttribute("src") || "";
    if (src) {
      deco.style.backgroundImage = `url("${src.replace(/"/g, "%22")}")`;
    }
    return deco;
  }

  function cloneGroup(group) {
    const clone = group.cloneNode(false);
    clone.setAttribute("aria-hidden", "true");
    Array.from(group.children).forEach((child) => {
      clone.appendChild(cloneMarqueeItem(child));
    });
    return clone;
  }

  function fillGroup(group) {
    const originalCount = Number(
      group.dataset.animationScrollMarqueeOriginalCount || 0,
    );

    if (originalCount > 0) {
      while (group.childElementCount > originalCount) {
        group.lastElementChild.remove();
      }
    } else if (group.childElementCount > 0) {
      group.dataset.animationScrollMarqueeOriginalCount = String(
        group.childElementCount,
      );
    }

    const minWidth = Math.max(window.innerWidth, 640);
    let safety = 0;

    while (
      group.offsetWidth > 0 &&
      group.offsetWidth < minWidth &&
      safety < 8
    ) {
      Array.from(group.children).forEach((child) => {
        group.appendChild(cloneMarqueeItem(child));
      });
      safety += 1;
    }
  }

  function prepareTrack(row) {
    const track = row.querySelector(".animation-scroll-marquee__track");
    const group = track
      ? track.querySelector(".animation-scroll-marquee__group")
      : null;
    if (!track || !group) return null;

    fillGroup(group);

    if (track.dataset.animationScrollMarqueePrepared !== "true") {
      track.appendChild(cloneGroup(group));
      track.dataset.animationScrollMarqueePrepared = "true";
      return track;
    }

    const groups = track.querySelectorAll(".animation-scroll-marquee__group");
    const clone = groups[1];
    if (clone && clone.childElementCount !== group.childElementCount) {
      clone.replaceWith(cloneGroup(group));
    }

    return track;
  }

  function relayout() {
    document
      .querySelectorAll(".js-animation-scroll-marquee-row")
      .forEach((row) => {
        const track = row.querySelector(".animation-scroll-marquee__track");
        if (track?.dataset.animationScrollMarqueePrepared !== "true") return;
        prepareTrack(row);
      });

    if (typeof ScrollTrigger !== "undefined") {
      ScrollTrigger.refresh();
    }
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
        paused: true,
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
        let tickerAttached = false;

        const tick = () => {
          let running = false;

          stages.forEach((state) => {
            if (!state.active) return;

            if (state.mode === "auto") {
              if (state.boost !== 0) {
                state.boost *= 0.9;
                if (Math.abs(state.boost) < 0.02) state.boost = 0;
              }
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

            if (state.mode === "auto") {
              if (
                state.boost === 0 &&
                Math.abs(state.current - state.target) < 0.001
              ) {
                state.current = state.target;
              } else {
                running = true;
              }
            } else if (Math.abs(state.current) < 0.001) {
              state.current = 0;
            } else {
              running = true;
            }

            if (state.applied !== state.current) {
              state.applied = state.current;
              state.tweens.forEach((tween) => {
                tween.timeScale(state.current);
              });
            }
          });

          if (!running) {
            gsap.ticker.remove(tick);
            tickerAttached = false;
          }
        };

        const ensureTicker = () => {
          if (tickerAttached) return;
          tickerAttached = true;
          gsap.ticker.add(tick);
        };

        const setStageActive = (state, active) => {
          state.active = active;
          if (active) {
            state.tweens.forEach((tween) => tween.resume());
            if (
              state.mode !== "auto" ||
              state.boost !== 0 ||
              Math.abs(state.current - state.target) >= 0.001
            ) {
              ensureTicker();
            }
            return;
          }

          state.tweens.forEach((tween) => tween.pause());
          if (state.mode !== "auto") {
            state.boost = 0;
            state.target = 0;
            state.current = 0;
            state.applied = null;
            state.tweens.forEach((tween) => tween.timeScale(0));
          }
        };

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
              applied: null,
              active: false,
            };

            const trigger = ScrollTrigger.create({
              trigger: stage,
              scroller,
              start: "top bottom",
              end: "bottom top",
              onToggle: (self) => {
                setStageActive(state, self.isActive);
              },
              onUpdate: (self) => {
                const velocity = self.getVelocity();
                if (state.mode === "auto") {
                  state.boost = gsap.utils.clamp(-5, 5, velocity / 280);
                } else {
                  state.target = gsap.utils.clamp(-6, 6, velocity / 280);
                }
                if (self.isActive) ensureTicker();
              },
            });

            setStageActive(state, trigger.isActive);
            stages.push(state);
          });

        if (!stages.length) return;

        ScrollTrigger.refresh();
      });
  }

  function start() {
    const pending = [];

    if (document.fonts && document.fonts.status !== "loaded") {
      pending.push(document.fonts.ready);
    }

    document
      .querySelectorAll(".js-animation-scroll-marquee img")
      .forEach((image) => {
        if (image.complete) return;
        pending.push(
          new Promise((resolve) => {
            image.addEventListener("load", resolve, { once: true });
            image.addEventListener("error", resolve, { once: true });
          }),
        );
      });

    if (!pending.length) {
      init();
      return;
    }

    let booted = false;
    const boot = () => {
      if (booted) {
        relayout();
        return;
      }
      booted = true;
      init();
    };

    const timer = window.setTimeout(boot, 1200);
    Promise.all(pending).then(() => {
      window.clearTimeout(timer);
      boot();
    });
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
