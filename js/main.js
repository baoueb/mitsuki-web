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

  /* ---------- D. Demos that start when visible (minis, media card) ---------- */
  var playOnView = document.querySelectorAll(".sc-mini, .sc-onview");

  if (playOnView.length) {
    if (reduceMotion) {
      playOnView.forEach(function (el) {
        el.classList.add("play");
      });
    } else {
      var playObserver = new IntersectionObserver(
        function (entries) {
          entries.forEach(function (entry) {
            entry.target.classList.toggle("play", entry.isIntersecting);
          });
        },
        { threshold: 0.3 }
      );
      playOnView.forEach(function (el) {
        playObserver.observe(el);
      });
    }
  }

  /* ---------- E. Extension capture demo ---------- */
  /* A scripted "screen recording": subtitles fade in, a cursor taps 倒し,
     the popup confirms it, and the scene flies into the Mitsuki card.
     Phase classes are cumulative on #ext-stage; see style.css (.sc-ext). */
  var extStage = document.getElementById("ext-stage");

  if (extStage) {
    var extBrowser = extStage.querySelector(".sc-ext-browser");
    var extPlayer = document.getElementById("ext-player");
    var extTok = document.getElementById("ext-tok");
    var extPop = document.getElementById("ext-pop");
    var extRing = document.getElementById("ext-ring");
    var extCursor = document.getElementById("ext-cursor");
    var extPhone = document.getElementById("ext-phone");
    var extSteps = Array.prototype.slice.call(document.querySelectorAll("#ext-steps li"));

    var EXT_PHASES = ["p-subs", "p-cursor", "p-hover", "p-hit", "p-save", "p-deck", "open"];

    var extSetSteps = function (n) {
      extSteps.forEach(function (li, i) {
        li.classList.toggle("on", i < n);
        li.classList.toggle("now", i === n - 1);
      });
    };

    if (reduceMotion) {
      extStage.classList.add("p-subs", "p-hit", "open");
      extPhone.classList.add("built");
      extSetSteps(4);
      extSteps.forEach(function (li) {
        li.classList.remove("now");
      });
    } else {
      var extVisible = false;
      var extTimer = null;
      var extQueued = null;

      // single-chain setTimeout that pauses while the demo is offscreen
      var extLater = function (fn, ms) {
        clearTimeout(extTimer);
        extTimer = setTimeout(function () {
          if (!extVisible) {
            extQueued = fn;
            return;
          }
          fn();
        }, ms);
      };

      var relTo = function (parentEl, el) {
        var p = parentEl.getBoundingClientRect();
        var r = el.getBoundingClientRect();
        return { left: r.left - p.left, top: r.top - p.top, width: r.width, height: r.height };
      };

      /* -- cursor: tip of the arrow lands on (x, y), browser-relative -- */
      var extCursorSet = function (x, y) {
        var c = extCursor.getBoundingClientRect();
        extCursor.style.setProperty("--cx", x - c.width * 0.2 + "px");
        extCursor.style.setProperty("--cy", y - c.height * 0.12 + "px");
      };

      var extCursorJump = function (x, y) {
        extCursor.classList.add("jump");
        extCursorSet(x, y);
        void extCursor.offsetWidth; // commit the teleport before any glide
      };

      var extCursorGlide = function (x, y) {
        extCursor.classList.remove("jump");
        extCursorSet(x, y);
      };

      var extPlacePop = function () {
        var r = relTo(extPlayer, extTok);
        extPop.style.left = r.left + r.width / 2 + "px";
        extPop.style.top = r.top + "px";
      };

      var extClickRipple = function () {
        var r = relTo(extPlayer, extTok);
        extRing.style.left = r.left + r.width / 2 + "px";
        extRing.style.top = r.top + r.height / 2 + "px";
        extRing.classList.remove("go");
        void extRing.offsetWidth;
        extRing.classList.add("go");
      };

      var extReset = function () {
        EXT_PHASES.forEach(function (p) {
          extStage.classList.remove(p);
        });
        extStage.classList.remove("toast-out");
        extPhone.classList.remove("built");
        extRing.classList.remove("go");
        extCursor.classList.remove("show", "down");
        extSetSteps(0);
      };

      var extRun = function () {
        extReset();
        var pr = relTo(extBrowser, extPlayer);
        extCursorJump(pr.left + pr.width * 0.85, pr.top + pr.height * 0.88);

        extLater(function () {
          // 1 — the video is playing with its Japanese subtitles
          extStage.classList.add("p-subs");
          extSetSteps(1);
          extLater(extStepCursor, 1700);
        }, 500);
      };

      var extStepCursor = function () {
        extStage.classList.add("p-cursor");
        extCursor.classList.add("show");
        var r = relTo(extBrowser, extTok);
        extCursorGlide(r.left + r.width * 0.52, r.top + r.height * 0.62);
        extLater(extStepHover, 1100);
      };

      var extStepHover = function () {
        // 2 — the word lights up and the dictionary popup appears
        extPlacePop();
        extStage.classList.add("p-hover");
        extSetSteps(2);
        extLater(extStepClick, 1550);
      };

      var extStepClick = function () {
        extCursor.classList.add("down");
        extClickRipple();
        extLater(function () {
          extCursor.classList.remove("down");
          extStage.classList.remove("p-hover"); // popup away…
          extStage.classList.add("p-hit"); // …the word keeps its highlight
          extLater(extStepCapture, 340);
        }, 190);
      };

      var extStepCapture = function () {
        // 3 — the word is added: a toast confirms, and the Mitsuki card slides in
        //     from the right while the player smoothly shrinks to make room
        extStage.classList.add("p-save"); // toast "Added 倒し"
        extSetSteps(3);
        extCursor.classList.remove("show");
        extLater(function () {
          extStage.classList.add("open"); // card slides in + player resizes
          extLater(extStepDeck, 1650);
        }, 260);
      };

      var extStepDeck = function () {
        // 4 — the card front rests in the deck, ready to review
        extStage.classList.add("p-deck");
        extLater(function () {
          extStage.classList.add("toast-out");
          extLater(extStepReveal, 1050);
        }, 1000);
      };

      var extStepReveal = function () {
        // …tap to reveal: front cross-fades to the answer, scene included
        extPhone.classList.add("built");
        extSetSteps(4);
        // hold on the answer, then close the card and loop
        extLater(extStepClose, 3400);
      };

      var extStepClose = function () {
        // the card slides back out and the player expands, then we restart
        extStage.classList.remove("open");
        extPhone.classList.remove("built");
        extLater(extRun, 820);
      };

      new IntersectionObserver(
        function (entries) {
          extVisible = entries[0].isIntersecting;
          if (extVisible && extQueued) {
            var fn = extQueued;
            extQueued = null;
            fn();
          }
        },
        { threshold: 0.3 }
      ).observe(extStage);

      extLater(extRun, 500);
    }
  }
})();

/* ============================================================
   Navigation, FAQ accordion, and small interaction guards
   ============================================================ */
(function () {
  "use strict";

  var reduceMotion = matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---------- Mobile navigation ---------- */
  var nav = document.getElementById("nav");
  var navToggle = document.getElementById("nav-toggle");
  var mobileNav = document.getElementById("mobile-nav");
  var scrim = document.getElementById("nav-scrim");
  var navIsOpen = false;
  var scrimTimer = null;

  function setNav(open) {
    if (!nav || !navToggle) return;
    navIsOpen = open;
    nav.classList.toggle("nav-open", open);
    navToggle.setAttribute("aria-expanded", open ? "true" : "false");
    navToggle.setAttribute("aria-label", open ? "Close menu" : "Open menu");

    clearTimeout(scrimTimer);
    if (open) {
      scrim.hidden = false;
      // next frame so the opacity transition runs
      requestAnimationFrame(function () {
        scrim.classList.add("show");
      });
      // a single scroll dismisses the panel, like a native sheet
      addEventListener("scroll", closeOnScroll, { passive: true, once: true });
    } else {
      scrim.classList.remove("show");
      removeEventListener("scroll", closeOnScroll);
      scrimTimer = setTimeout(
        function () {
          scrim.hidden = true;
        },
        reduceMotion ? 0 : 260
      );
    }
  }

  function closeNav() {
    setNav(false);
  }
  function closeOnScroll() {
    if (navIsOpen) closeNav();
  }

  if (navToggle && mobileNav && scrim) {
    navToggle.addEventListener("click", function () {
      setNav(!navIsOpen);
    });
    scrim.addEventListener("click", closeNav);
    mobileNav.querySelectorAll("a").forEach(function (link) {
      link.addEventListener("click", closeNav);
    });
    addEventListener("keydown", function (e) {
      if (e.key === "Escape" && navIsOpen) {
        closeNav();
        navToggle.focus();
      }
    });
    // if the viewport grows past the mobile breakpoint, never stay stuck open
    matchMedia("(min-width: 761px)").addEventListener("change", function (e) {
      if (e.matches && navIsOpen) closeNav();
    });
  }

  /* ---------- Scrollspy: highlight the section in view ---------- */
  var spyLinks = Array.prototype.slice.call(
    document.querySelectorAll('.nav-links a[href^="#"], .mobile-nav a[href^="#"]')
  );

  if (spyLinks.length && "IntersectionObserver" in window) {
    var linksByHash = {};
    spyLinks.forEach(function (link) {
      var hash = link.getAttribute("href");
      (linksByHash[hash] = linksByHash[hash] || []).push(link);
    });

    var sections = Object.keys(linksByHash)
      .map(function (hash) {
        return document.querySelector(hash);
      })
      .filter(Boolean);

    var setActive = function (hash) {
      spyLinks.forEach(function (link) {
        link.classList.toggle("active", link.getAttribute("href") === hash);
      });
    };

    var spy = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) setActive("#" + entry.target.id);
        });
      },
      // the active section is the one crossing the upper-middle band
      { rootMargin: "-45% 0px -50% 0px", threshold: 0 }
    );
    sections.forEach(function (section) {
      spy.observe(section);
    });
  }

  /* ---------- FAQ accordion ---------- */
  var faqList = document.getElementById("faq-list");

  if (faqList) {
    var openItem = function (item) {
      var panel = item.querySelector(".faq-a");
      var btn = item.querySelector(".faq-q");
      panel.hidden = false;
      void panel.offsetHeight; // reflow so grid-template-rows can transition
      item.classList.add("open");
      btn.setAttribute("aria-expanded", "true");
    };

    var closeItem = function (item) {
      var panel = item.querySelector(".faq-a");
      var btn = item.querySelector(".faq-q");
      item.classList.remove("open");
      btn.setAttribute("aria-expanded", "false");

      if (reduceMotion) {
        panel.hidden = true;
        return;
      }
      // hide from the a11y tree only after the collapse finishes
      var onEnd = function (e) {
        if (
          e.target === panel &&
          e.propertyName === "grid-template-rows" &&
          !item.classList.contains("open")
        ) {
          panel.hidden = true;
          panel.removeEventListener("transitionend", onEnd);
        }
      };
      panel.addEventListener("transitionend", onEnd);
    };

    faqList.querySelectorAll(".faq-q").forEach(function (btn) {
      btn.addEventListener("click", function () {
        var item = btn.closest(".faq-item");
        if (item.classList.contains("open")) closeItem(item);
        else openItem(item);
      });
    });
  }

  /* ---------- Don't let disabled (#) links jump to the top ---------- */
  document.addEventListener("click", function (e) {
    var disabled = e.target.closest('a[aria-disabled="true"]');
    if (disabled) e.preventDefault();
  });

  /* ---------- Dynamic download link (always latest GitHub release) ---------- */
  fetch("https://api.github.com/repos/baoueb/Mitsuki/releases/latest")
    .then(function (r) { return r.json(); })
    .then(function (data) {
      var dmg = (data.assets || []).find(function (a) { return a.name.endsWith(".dmg"); });
      if (!dmg) return;
      document.querySelectorAll("a[data-download]").forEach(function (el) {
        el.href = dmg.browser_download_url;
      });
    })
    .catch(function () {});
})();
