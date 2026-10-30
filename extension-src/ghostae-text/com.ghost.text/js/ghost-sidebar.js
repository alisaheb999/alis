if (typeof window !== "undefined" && window.__ghostStamp) {
  window.__ghostStamp(
    "ghost-sidebar.js",
    /* @ghost-build */
    "3.40.2+20260829.ui-perfect"
  );
}
(function(global) {
  "use strict";
  var KEY = "ghost.sidebar.width";
  var MIN = 168;
  var MAX = 460;
  function stored() {
    var raw = 0;
    try {
      raw = parseInt(global.localStorage.getItem(KEY) || "0", 10) || 0;
    } catch (e) {
    }
    return raw >= MIN && raw <= MAX ? raw : 0;
  }
  function apply(px) {
    document.documentElement.style.setProperty("--sidebar-width", px + "px");
  }
  function boot() {
    var sidebar = document.querySelector(".sidebar");
    if (!sidebar || sidebar.querySelector(".sidebar-resizer")) return;
    var saved = stored();
    if (saved) apply(saved);
    var handle = document.createElement("div");
    handle.className = "sidebar-resizer";
    handle.setAttribute("role", "separator");
    handle.setAttribute("aria-orientation", "vertical");
    handle.title = "Drag to resize · double-click to reset";
    sidebar.appendChild(handle);
    var dragging = false;
    var saveTimer = null;
    function move(e) {
      if (!dragging) return;
      var rect = sidebar.getBoundingClientRect();
      var next = Math.round(Math.min(MAX, Math.max(MIN, e.clientX - rect.left)));
      apply(next);
      if (saveTimer) clearTimeout(saveTimer);
      saveTimer = setTimeout(function() {
        try {
          global.localStorage.setItem(KEY, String(next));
        } catch (err) {
        }
      }, 120);
      e.preventDefault();
    }
    function stop() {
      if (!dragging) return;
      dragging = false;
      document.body.classList.remove("is-resizing-sidebar");
    }
    handle.addEventListener("mousedown", function(e) {
      dragging = true;
      document.body.classList.add("is-resizing-sidebar");
      e.preventDefault();
    });
    // Drag resize is coalesced to one layout write per frame; CEP fires
    // mousemove far faster than it can repaint the panel.
    document.addEventListener("mousemove", (global.GhostPerf ? global.GhostPerf.rafThrottle(move) : move));
    document.addEventListener("mouseup", stop);
    handle.addEventListener("dblclick", function() {
      document.documentElement.style.removeProperty("--sidebar-width");
      try {
        global.localStorage.removeItem(KEY);
      } catch (e) {
      }
    });
  }
  global.GhostBoot.push(boot);
})(typeof window !== "undefined" ? window : this);
