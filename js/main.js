/* Mitsuki website — behavior
   Motion values mirror MotionTokens.swift (ease-out curve, 40ms staggers,
   reduce-motion fallbacks). */

(function () {
  "use strict";

  var docEl = document.documentElement;
  var reduceMotion = matchMedia("(prefers-reduced-motion: reduce)");

  /* ---------- Theme toggle (with View Transition circular reveal) ---------- */
  var toggle = document.getElementById("theme-toggle");

  function applyTheme(next) {
    docEl.dataset.theme = next;
    localStorage.setItem("mitsuki-theme", next);
  }

  if (toggle) {
    toggle.addEventListener("click", function (event) {
      var next = docEl.dataset.theme === "dark" ? "light" : "dark";

      if (!document.startViewTransition || reduceMotion.matches) {
        applyTheme(next);
        return;
      }

      var x = event.clientX || innerWidth - 60;
      var y = event.clientY || 40;
      var radius = Math.hypot(
        Math.max(x, innerWidth - x),
        Math.max(y, innerHeight - y)
      );

      var transition = document.startViewTransition(function () {
        applyTheme(next);
      });

      transition.ready.then(function () {
        docEl.animate(
          {
            clipPath: [
              "circle(0px at " + x + "px " + y + "px)",
              "circle(" + radius + "px at " + x + "px " + y + "px)"
            ]
          },
          {
            duration: 520,
            easing: "cubic-bezier(0.23, 1, 0.32, 1)", // Motion.easeOut
            pseudoElement: "::view-transition-new(root)"
          }
        );
      });
    });
  }

  /* ---------- Nav glass on scroll ---------- */
  var nav = document.getElementById("nav");
  if (nav) {
    var onScroll = function () {
      nav.classList.toggle("scrolled", scrollY > 8);
    };
    addEventListener("scroll", onScroll, { passive: true });
    onScroll();
  }

  /* ---------- Reveal-on-scroll fallback ---------- */
  /* Native scroll-driven animations are used when supported (see CSS).
     Otherwise an IntersectionObserver adds .in-view. */
  if (!CSS.supports("animation-timeline: view()")) {
    docEl.classList.add("no-sda");
    var observer = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add("in-view");
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.12, rootMargin: "0px 0px -8% 0px" }
    );
    document.querySelectorAll(".reveal").forEach(function (el) {
      observer.observe(el);
    });
  }

  /* ---------- Bento spotlight: track cursor per card ---------- */
  document.querySelectorAll(".bento-card").forEach(function (card) {
    card.addEventListener("pointermove", function (event) {
      var rect = card.getBoundingClientRect();
      card.style.setProperty("--mx", event.clientX - rect.left + "px");
      card.style.setProperty("--my", event.clientY - rect.top + "px");
    });
  });

  /* ---------- Hero mockup: type query, then reveal the card ---------- */
  var typed = document.getElementById("typed");
  var result = document.getElementById("mockup-result");

  if (typed && result) {
    if (reduceMotion.matches) {
      typed.textContent = "sakura";
      result.classList.add("show");
    } else {
      var QUERY = "sakura";
      var HOLD_MS = 5200; // result stays visible before the loop restarts

      var typeQuery = function (index) {
        if (index <= QUERY.length) {
          typed.textContent = QUERY.slice(0, index);
          setTimeout(function () {
            typeQuery(index + 1);
          }, 110 + Math.random() * 110);
        } else {
          setTimeout(function () {
            result.classList.add("show");
          }, 320);
          setTimeout(restart, HOLD_MS);
        }
      };

      var restart = function () {
        result.classList.remove("show");
        setTimeout(function () {
          typed.textContent = "";
          typeQuery(1);
        }, 420);
      };

      setTimeout(function () {
        typeQuery(1);
      }, 900);
    }
  }

  /* ---------- Sakura petal field (hero canvas) ---------- */
  var canvas = document.getElementById("petals");

  if (canvas && !reduceMotion.matches) {
    var ctx = canvas.getContext("2d");
    var petals = [];
    var rafId = null;
    var dpr = Math.min(devicePixelRatio || 1, 2);
    var width = 0;
    var height = 0;

    var themeColors = function () {
      var styles = getComputedStyle(docEl);
      return [
        styles.getPropertyValue("--petal-a").trim(),
        styles.getPropertyValue("--petal-b").trim()
      ];
    };
    var colors = themeColors();

    // Re-read petal colors after a theme switch.
    new MutationObserver(function () {
      colors = themeColors();
      petals.forEach(function (petal) {
        petal.color = colors[Math.random() < 0.7 ? 0 : 1];
      });
    }).observe(docEl, { attributes: true, attributeFilter: ["data-theme"] });

    var resize = function () {
      var rect = canvas.parentElement.getBoundingClientRect();
      width = rect.width;
      height = rect.height;
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      canvas.style.width = width + "px";
      canvas.style.height = height + "px";
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    var spawn = function (initial) {
      return {
        x: Math.random() * width,
        y: initial ? Math.random() * height : -16,
        size: 5 + Math.random() * 7,
        speedY: 0.35 + Math.random() * 0.7,
        drift: 0.25 + Math.random() * 0.5,
        phase: Math.random() * Math.PI * 2,
        phaseSpeed: 0.008 + Math.random() * 0.012,
        angle: Math.random() * Math.PI * 2,
        spin: (Math.random() - 0.5) * 0.025,
        opacity: 0.35 + Math.random() * 0.45,
        color: colors[Math.random() < 0.7 ? 0 : 1]
      };
    };

    var drawPetal = function (petal) {
      ctx.save();
      ctx.translate(petal.x, petal.y);
      ctx.rotate(petal.angle);
      ctx.globalAlpha = petal.opacity;
      ctx.fillStyle = petal.color;
      // five-lobed sakura petal silhouette: a teardrop with a notched tip
      var s = petal.size;
      ctx.beginPath();
      ctx.moveTo(0, -s);
      ctx.bezierCurveTo(s * 0.9, -s * 0.7, s * 0.8, s * 0.45, 0.18 * s, s * 0.85);
      ctx.lineTo(0, s * 0.55); // the notch
      ctx.lineTo(-0.18 * s, s * 0.85);
      ctx.bezierCurveTo(-s * 0.8, s * 0.45, -s * 0.9, -s * 0.7, 0, -s);
      ctx.fill();
      ctx.restore();
    };

    var tick = function () {
      ctx.clearRect(0, 0, width, height);
      petals.forEach(function (petal, i) {
        petal.phase += petal.phaseSpeed;
        petal.x += Math.sin(petal.phase) * petal.drift;
        petal.y += petal.speedY;
        petal.angle += petal.spin;
        if (petal.y > height + 20) petals[i] = spawn(false);
        drawPetal(petal);
      });
      rafId = requestAnimationFrame(tick);
    };

    var start = function () {
      if (rafId) return;
      resize();
      var count = Math.min(Math.round(width / 60), 26);
      petals = [];
      for (var i = 0; i < count; i++) petals.push(spawn(true));
      rafId = requestAnimationFrame(tick);
    };

    var stop = function () {
      if (rafId) {
        cancelAnimationFrame(rafId);
        rafId = null;
      }
    };

    addEventListener("resize", function () {
      stop();
      start();
    });

    document.addEventListener("visibilitychange", function () {
      document.hidden ? stop() : start();
    });

    reduceMotion.addEventListener("change", function (event) {
      if (event.matches) {
        stop();
        ctx.clearRect(0, 0, width, height);
      } else {
        start();
      }
    });

    start();
  }

  /* ---------- Footer year ---------- */
  var year = document.getElementById("year");
  if (year) year.textContent = new Date().getFullYear();
})();
