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

/* ============================================================
   Showcase — "Inside the app" live previews
   Command palette loop, Review Mode explorer, dashboard cycle.
   ============================================================ */
(function () {
  "use strict";

  var reduceMotion = matchMedia("(prefers-reduced-motion: reduce)").matches;

  function countUp(el, target, ms) {
    var start = null;
    function tick(now) {
      if (!start) start = now;
      var p = Math.min((now - start) / ms, 1);
      el.textContent = Math.round(target * (1 - Math.pow(1 - p, 3)));
      if (p < 1) requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);
  }

  /* ---------- A. Command demo ---------- */
  var cmdWindow = document.getElementById("cmd-demo");

  if (cmdWindow) {
    var typedEl = document.getElementById("cmd-typed");
    var palette = document.getElementById("cmd-palette");
    var paletteItems = Array.prototype.slice.call(palette.querySelectorAll("li"));
    var results = Array.prototype.slice.call(cmdWindow.querySelectorAll(".sc-result"));
    var legendRows = Array.prototype.slice.call(document.querySelectorAll("#cmd-legend .sc-cmd-row"));

    var cmdScenes = [
      { type: "/gr ながら", panel: "gr" },
      { type: "/tr", panel: "tr" },
      { type: "/nat", panel: "nat" },
      { type: "/cor", panel: "cor" },
      { type: "/exp 木漏れ日", panel: "exp" },
      { type: "/cc", panel: "cc" },
      { type: "/diff 帰る vs 戻る", panel: "diff" }
    ];

    var showResult = function (panel) {
      results.forEach(function (r) {
        r.classList.remove("show");
      });
      var target = cmdWindow.querySelector('.sc-result[data-panel="' + panel + '"]');
      if (target) {
        void target.offsetWidth; // restart entry animation
        target.classList.add("show");
      }
    };

    var setLegend = function (index) {
      legendRows.forEach(function (row, i) {
        row.classList.toggle("active", i === index);
      });
    };

    if (reduceMotion) {
      // Static fallback: show the /diff command fully executed.
      typedEl.textContent = "/diff 帰る vs 戻る";
      showResult("diff");
      setLegend(6);
    } else {
      var cmdIdx = 0;
      var charI = 0;
      var cmdVisible = false;
      var cmdTimer = null;
      var cmdQueued = null;

      // setTimeout that pauses while the demo is offscreen
      var later = function (fn, ms) {
        clearTimeout(cmdTimer);
        cmdTimer = setTimeout(function () {
          if (!cmdVisible) {
            cmdQueued = fn;
            return;
          }
          fn();
        }, ms);
      };

      // Mirrors ContentViewCommandRouter.matchingCommands: prefix match on
      // the trigger; once an argument is being typed, pin the exact match.
      var updatePalette = function (text) {
        if (!text || text.charAt(0) !== "/") {
          palette.classList.remove("open");
          return;
        }
        var spaceIdx = text.indexOf(" ");
        var prefix = spaceIdx === -1 ? text : text.slice(0, spaceIdx);
        var any = false;
        paletteItems.forEach(function (li) {
          var trig = li.dataset.trigger;
          var show = spaceIdx === -1 ? trig.indexOf(prefix) === 0 : trig === prefix;
          li.hidden = !show;
          li.classList.toggle("selected", show && trig === prefix);
          if (show) any = true;
        });
        palette.classList.toggle("open", any);
      };

      var typeNext = function () {
        var str = cmdScenes[cmdIdx].type;
        if (charI < str.length) {
          charI++;
          typedEl.textContent = str.slice(0, charI);
          updatePalette(typedEl.textContent);
          later(typeNext, 80 + Math.random() * 90);
        } else {
          later(execute, 460);
        }
      };

      var execute = function () {
        palette.classList.remove("open");
        showResult(cmdScenes[cmdIdx].panel);
        setLegend(cmdIdx);
        later(clearScene, 4300);
      };

      var clearScene = function () {
        results.forEach(function (r) {
          r.classList.remove("show");
        });
        typedEl.textContent = "";
        cmdIdx = (cmdIdx + 1) % cmdScenes.length;
        charI = 0;
        later(typeNext, 600);
      };

      legendRows.forEach(function (row) {
        row.addEventListener("click", function () {
          cmdIdx = +row.dataset.i;
          charI = 0;
          cmdQueued = null;
          results.forEach(function (r) {
            r.classList.remove("show");
          });
          typedEl.textContent = "";
          later(typeNext, 120);
        });
      });

      new IntersectionObserver(
        function (entries) {
          cmdVisible = entries[0].isIntersecting;
          if (cmdVisible && cmdQueued) {
            var fn = cmdQueued;
            cmdQueued = null;
            fn();
          }
        },
        { threshold: 0.25 }
      ).observe(cmdWindow);

      later(typeNext, 900);
    }
  }

  /* ---------- B. Review Mode explorer ---------- */
  var revWindow = document.getElementById("rev-demo");
  var tabsWrap = document.getElementById("rev-tabs");

  if (revWindow && tabsWrap) {
    var revTabs = Array.prototype.slice.call(tabsWrap.querySelectorAll(".sc-tab"));
    var revScenes = Array.prototype.slice.call(revWindow.querySelectorAll(".sc-scene"));
    var revHint = document.getElementById("rev-hint");
    var revOrder = revTabs.map(function (t) {
      return t.dataset.scene;
    });
    var revCur = 0;
    var revTimer = null;
    var revVisible = false;

    var revActivate = function (index) {
      revCur = index;
      var name = revOrder[index];
      revTabs.forEach(function (tab, i) {
        tab.classList.toggle("active", i === index);
        tab.setAttribute("aria-selected", i === index ? "true" : "false");
      });
      revScenes.forEach(function (scene) {
        scene.classList.toggle("active", scene.dataset.scene === name);
      });
      revWindow.dataset.active = name;
      if (revHint) {
        revHint.textContent = name === "hide" ? "Reveal the answer" : "Choose a rating";
      }
      // on narrow viewports the rail scrolls horizontally — follow the active tab
      if (tabsWrap.scrollWidth > tabsWrap.clientWidth) {
        tabsWrap.scrollTo({
          left: revTabs[index].offsetLeft - 16,
          behavior: reduceMotion ? "auto" : "smooth"
        });
      }
      // restart the autoplay progress bar on the newly active tab
      tabsWrap.classList.remove("running");
      void tabsWrap.offsetWidth;
      if (revVisible && !reduceMotion) tabsWrap.classList.add("running");
    };

    var armRev = function () {
      clearTimeout(revTimer);
      if (!revVisible || reduceMotion) return;
      revTimer = setTimeout(function () {
        revActivate((revCur + 1) % revOrder.length);
        armRev();
      }, 7000);
    };

    revTabs.forEach(function (tab, i) {
      tab.addEventListener("click", function () {
        revActivate(i);
        armRev();
      });
    });

    if (!reduceMotion) {
      new IntersectionObserver(
        function (entries) {
          revVisible = entries[0].isIntersecting;
          if (revVisible) {
            revActivate(revCur);
            armRev();
          } else {
            clearTimeout(revTimer);
            tabsWrap.classList.remove("running");
          }
        },
        { threshold: 0.25 }
      ).observe(revWindow);
    }
  }

  /* ---------- C. Dashboard ---------- */
  var dashWindow = document.getElementById("dash-demo");
  var dashBlock = document.getElementById("dash-block");

  if (dashWindow && dashBlock) {
    var tree = document.getElementById("tree");
    var treeLabel = document.getElementById("tree-label");
    var goalRing = document.getElementById("goal-ring");
    var goalN = document.getElementById("goal-n");
    var bloomRing = document.getElementById("bloom-ring");
    var bloomWord = document.getElementById("bloom-word");
    var counts = Array.prototype.slice.call(dashWindow.querySelectorAll(".sc-count"));

    var stages = [
      { label: "Sprout", wave: 0, bloom: 8 },
      { label: "Partial Bloom", wave: 1, bloom: 40 },
      { label: "Near Bloom", wave: 2, bloom: 70 },
      { label: "Full Bloom", wave: 3, bloom: 100 }
    ];

    var applyStage = function (stage) {
      tree.dataset.wave = String(stage.wave);
      treeLabel.textContent = stage.label;
      treeLabel.classList.remove("pop");
      void treeLabel.offsetWidth;
      treeLabel.classList.add("pop");
      bloomRing.style.strokeDashoffset = String(100 - stage.bloom);
      bloomWord.textContent = stage.label;
    };

    var dashStarted = false;
    var stageIdx = 0;
    var stageTimer = null;

    var startDash = function () {
      dashWindow.classList.add("play");
      dashBlock.classList.add("play");
      if (!dashStarted) {
        dashStarted = true;
        counts.forEach(function (el) {
          countUp(el, +el.dataset.count, 1100);
        });
        countUp(goalN, 72, 1100);
        goalRing.style.strokeDashoffset = "28";
      }
    };

    if (reduceMotion) {
      startDash();
      counts.forEach(function (el) {
        el.textContent = el.dataset.count;
      });
      goalN.textContent = "72";
      applyStage(stages[3]);
    } else {
      new IntersectionObserver(
        function (entries) {
          if (entries[0].isIntersecting) {
            startDash();
            clearInterval(stageTimer);
            stageTimer = setInterval(function () {
              stageIdx = (stageIdx + 1) % stages.length;
              applyStage(stages[stageIdx]);
            }, 2800);
          } else {
            clearInterval(stageTimer);
          }
        },
        { threshold: 0.3 }
      ).observe(dashWindow);
    }
  }

  /* ---------- D. Practice minis: start loops when visible ---------- */
  var minis = document.querySelectorAll(".sc-mini");

  if (minis.length) {
    if (reduceMotion) {
      minis.forEach(function (mini) {
        mini.classList.add("play");
      });
    } else {
      var miniObserver = new IntersectionObserver(
        function (entries) {
          entries.forEach(function (entry) {
            entry.target.classList.toggle("play", entry.isIntersecting);
          });
        },
        { threshold: 0.3 }
      );
      minis.forEach(function (mini) {
        miniObserver.observe(mini);
      });
    }
  }
})();
