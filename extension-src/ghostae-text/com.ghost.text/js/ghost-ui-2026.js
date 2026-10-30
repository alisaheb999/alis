/* Ghostae Text — UI uplift runtime (v3.13.0)
 * Theme switcher, tab keyboard navigation, editable slider values,
 * empty states, keyboard shortcuts, success feedback.
 * Purely additive: it never renames or removes an existing id/class,
 * so every binding in js/toolkit.js keeps working.
 */
(function (global) {
  "use strict";
  var doc = global.document;
  if (!doc || global.GhostUI) return;

  var perf = global.GhostPerf || {};
  var debounce =
    perf.debounce ||
    function (fn, ms) {
      var t = 0;
      return function () {
        var a = arguments, s = this;
        clearTimeout(t);
        t = setTimeout(function () { fn.apply(s, a); }, ms || 90);
      };
    };

  /* ---------------- theme ---------------- */
  var THEME_KEY = "ghost.ui.theme";
  var THEMES = [
    { id: "dark", icon: "moon", label: "AE Dark" },
    { id: "darkest", icon: "contrast", label: "AE Darkest" },
    { id: "light", icon: "sun", label: "AE Light" }
  ];

  function readTheme() {
    try { return global.localStorage.getItem(THEME_KEY) || "dark"; } catch (e) { return "dark"; }
  }
  function setTheme(id) {
    doc.documentElement.setAttribute("data-ghost-theme", id);
    try { global.localStorage.setItem(THEME_KEY, id); } catch (e) {}
    var btns = doc.querySelectorAll(".ghost-theme-switch button");
    for (var i = 0; i < btns.length; i += 1) {
      btns[i].setAttribute("aria-pressed", btns[i].getAttribute("data-theme") === id ? "true" : "false");
    }
  }

  function mountThemeSwitch() {
    // Theme switcher removed; panel always uses AE Dark.
    doc.documentElement.setAttribute("data-ghost-theme", "dark");
  }

  /* ---------------- preview play / pause ---------------- */
  function wireAutoAnimate() {
    /* Removed in 3.40.1: each preset section owns its own play/pause button
       (see bindSectionPlayButtons in toolkit.js). Kept as a guarded no-op for
       older builds that still ship the global toolbar button. */
    var btn = doc.getElementById("autoAnimateBtn");
    if (!btn || btn.getAttribute("data-ghost-wired")) return;
    btn.setAttribute("data-ghost-wired", "1");
    var sync = function () {
      var paused = doc.body.classList.contains("disable-auto-animate");
      btn.setAttribute("aria-pressed", paused ? "false" : "true");
      btn.setAttribute("title", paused ? "Play card previews" : "Pause card previews");
    };
    btn.addEventListener("click", function () {
      doc.body.classList.toggle("disable-auto-animate");
      sync();
    });
    sync();
  }

  /* ---------------- tabs: arrow keys ---------------- */
  function wireTabs() {
    var bar = doc.querySelector('.tools-tabs[role="tablist"]');
    if (!bar || bar.getAttribute("data-ghost-keys")) return;
    bar.setAttribute("data-ghost-keys", "1");
    bar.addEventListener("keydown", function (ev) {
      var key = ev.key;
      if (key !== "ArrowRight" && key !== "ArrowLeft" && key !== "Home" && key !== "End") return;
      var tabs = [];
      var all = bar.querySelectorAll('[role="tab"]');
      for (var i = 0; i < all.length; i += 1) {
        if (all[i].offsetParent !== null) tabs.push(all[i]);
      }
      if (!tabs.length) return;
      var idx = tabs.indexOf(doc.activeElement);
      if (idx < 0) idx = 0;
      var next =
        key === "Home" ? 0 :
        key === "End" ? tabs.length - 1 :
        key === "ArrowRight" ? (idx + 1) % tabs.length :
        (idx - 1 + tabs.length) % tabs.length;
      ev.preventDefault();
      tabs[next].focus();
      tabs[next].click();
    });
    /* roving tabindex so the tab bar is one stop, not seven */
    var sync = function () {
      var all = bar.querySelectorAll('[role="tab"]');
      for (var i = 0; i < all.length; i += 1) {
        all[i].tabIndex = all[i].classList.contains("active") ? 0 : -1;
      }
    };
    bar.addEventListener("click", function () { setTimeout(sync, 0); });
    sync();
  }

  /* ---------------- editable slider values ---------------- */
  function wireSliderValues(root) {
    var rows = (root || doc).querySelectorAll(".adv-row:not([data-ghost-num])");
    for (var i = 0; i < rows.length; i += 1) {
      (function (row) {
        var range = row.querySelector('input[type="range"]');
        var out = row.querySelector("b");
        if (!range || !out) return;
        row.setAttribute("data-ghost-num", "1");
        out.setAttribute("title", "Click to type a value");
        out.style.cursor = "text";
        out.addEventListener("click", function (ev) {
          /* the row is a <label>, so stop the click from re-focusing the range */
          ev.preventDefault();
          ev.stopPropagation();
          if (row.querySelector(".ghost-num")) return;
          var input = doc.createElement("input");
          input.type = "number";
          input.className = "ghost-num";
          input.value = range.value;
          input.min = range.min;
          input.max = range.max;
          input.step = range.step || "any";
          out.style.display = "none";
          out.parentNode.insertBefore(input, out);
          input.focus();
          input.select();
          var commit = function (apply) {
            if (apply && input.value !== "") {
              range.value = input.value;
              range.dispatchEvent(new Event("input", { bubbles: true }));
              range.dispatchEvent(new Event("change", { bubbles: true }));
            }
            input.remove();
            out.style.display = "";
          };
          input.addEventListener("blur", function () { commit(true); });
          input.addEventListener("keydown", function (ev) {
            if (ev.key === "Enter") { ev.preventDefault(); commit(true); }
            if (ev.key === "Escape") { ev.preventDefault(); commit(false); }
          });
        });
      })(rows[i]);
    }
  }

  /* ---------------- empty states ---------------- */
  var GRIDS = ["animGrid", "colorGrid", "emojiGrid", "exprGrid"];

  function visibleCount(grid) {
    var n = 0;
    var kids = grid.children;
    for (var i = 0; i < kids.length; i += 1) {
      var el = kids[i];
      if (el.classList && el.classList.contains("ghost-empty")) continue;
      if (el.hidden) continue;
      if (el.style && el.style.display === "none") continue;
      /* the toolkit filters with a .tk-hidden class, not inline styles */
      if (el.classList && (el.classList.contains("tk-hidden") || el.classList.contains("is-hidden") || el.classList.contains("tk-empty"))) continue;
      n += 1;
    }
    return n;
  }

  function findSearchFor(grid) {
    var panel = grid.closest ? grid.closest(".tools-tab-panel") : null;
    var local = panel
      ? panel.querySelector('input[type="search"], input[type="text"][id*="earch"], input[placeholder*="earch"]')
      : null;
    /* the toolkit ships one shared search box in the header */
    return local || doc.getElementById("tkSearch");
  }

  function syncEmpty(grid) {
    /* The toolkit already renders its own ".tk-empty" node when a filter
       matches nothing — enhance that one instead of adding a second. */
    var native = grid.querySelector(".tk-empty");
    if (native) {
      native.classList.add("ghost-empty");
      if (!native.getAttribute("role")) native.setAttribute("role", "status");
      addClear(native, grid);
      var own = grid.querySelector(":scope > .ghost-empty[data-ghost-own]");
      if (own) own.remove();
      return;
    }
    var node = grid.querySelector(":scope > .ghost-empty[data-ghost-own]");
    if (visibleCount(grid) > 0) {
      if (node) node.remove();
      return;
    }
    if (node) return;
    node = doc.createElement("div");
    node.className = "ghost-empty";
    node.setAttribute("data-ghost-own", "1");
    node.setAttribute("role", "status");
    node.innerHTML =
      (global.GhostIcons ? global.GhostIcons.markup("search", 24) : "") +
      "<div>No matches found</div>";
    addClear(node, grid);
    grid.appendChild(node);
  }

  function addClear(node, grid) {
    if (node.querySelector("[data-ghost-clear]")) return;
    var search = findSearchFor(grid);
    if (!search || !search.value) return;
    var btn = doc.createElement("button");
    btn.type = "button";
    btn.setAttribute("data-ghost-clear", "1");
    btn.textContent = "Clear search";
    btn.addEventListener("click", function () {
      search.value = "";
      search.dispatchEvent(new Event("input", { bubbles: true }));
      search.focus();
    });
    node.appendChild(btn);
  }

  function wireEmptyStates() {
    if (!global.MutationObserver) return;
    GRIDS.forEach(function (id) {
      var grid = doc.getElementById(id);
      if (!grid || grid.getAttribute("data-ghost-empty")) return;
      grid.setAttribute("data-ghost-empty", "1");
      var run = debounce(function () { syncEmpty(grid); }, 120);
      new global.MutationObserver(run).observe(grid, {
        childList: true,
        subtree: true,
        attributes: true,
        attributeFilter: ["style", "hidden", "class"]
      });
      run();
    });
  }

  /* ---------------- shortcuts ---------------- */
  function activeSearch() {
    var panel = doc.querySelector(".tools-tab-panel.active") || doc;
    return (
      panel.querySelector('input[type="search"], input[placeholder*="earch"], input[id*="earch"]') ||
      doc.getElementById("tkSearch")
    );
  }

  function wireShortcuts() {
    if (doc.body.getAttribute("data-ghost-keys")) return;
    doc.body.setAttribute("data-ghost-keys", "1");
    doc.addEventListener("keydown", function (ev) {
      var mod = ev.ctrlKey || ev.metaKey;
      if (mod && (ev.key === "f" || ev.key === "F")) {
        var s = activeSearch();
        if (s) { ev.preventDefault(); s.focus(); s.select(); }
        return;
      }
      if (ev.key === "Escape") {
        var el = doc.activeElement;
        if (el && el.tagName === "INPUT" && el.value) {
          el.value = "";
          el.dispatchEvent(new Event("input", { bubbles: true }));
        }
      }
    });
  }

  /* ---------------- success feedback ---------------- */
  function wirePulse() {
    if (doc.body.getAttribute("data-ghost-pulse")) return;
    doc.body.setAttribute("data-ghost-pulse", "1");
    doc.addEventListener(
      "click",
      function (ev) {
        var btn = ev.target && ev.target.closest ? ev.target.closest("button") : null;
        if (!btn || btn.disabled) return;
        var label = ((btn.textContent || "") + " " + (btn.title || "")).toLowerCase();
        if (!/apply|save|copy|create|add/.test(label)) return;
        btn.classList.remove("ghost-pulse");
        void btn.offsetWidth;
        btn.classList.add("ghost-pulse");
        setTimeout(function () { btn.classList.remove("ghost-pulse"); }, 600);
      },
      true
    );
  }

  /* ---------------- boot ---------------- */
  function refresh() {
    if (global.GhostIcons) global.GhostIcons.upgrade(doc);
    mountThemeSwitch();
    wireTabs();
    wireSliderValues(doc);
    wireEmptyStates();
    wireAutoAnimate();
  }

  function boot() {
    setTheme(readTheme());
    refresh();
    wireShortcuts();
    wirePulse();
    /* panels build their grids asynchronously — re-wire as content lands */
    if (global.MutationObserver) {
      /* Re-wiring is only meaningful when new elements land. Ignore text and
         attribute churn (preview animations, counters) so a busy panel does
         not re-run the icon/tab pass hundreds of times per minute. */
      var run = debounce(refresh, 600);
      /* [perf] shared body observer; same records, same filter + debounce. */
      global.GhostObserver.onBodyMutation(function (records) {
        for (var i = 0; i < records.length; i += 1) {
          var added = records[i].addedNodes;
          for (var j = 0; j < added.length; j += 1) {
            if (added[j].nodeType === 1) return run();
          }
        }
      });
    }
  }

  global.GhostUI = { setTheme: setTheme, refresh: refresh };

  global.GhostBoot.push(boot);
})(typeof window !== "undefined" ? window : this);
