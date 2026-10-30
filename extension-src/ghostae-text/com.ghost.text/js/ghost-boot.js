/* ghost-boot.js - shared boot queue (perf pass, no behavior change).
   Modules push their init function here instead of registering their own
   DOMContentLoaded listener. The queue runs once, in push order, which is the
   same order the <script> tags execute in. Required because every script tag
   now uses `defer`: with defer, document.readyState is already "interactive"
   when a module executes, so the old `else boot()` fallbacks would otherwise
   have fired mid-load instead of after the DOM was parsed. */
(function (global, doc) {
  "use strict";
  if (global.GhostBoot && typeof global.GhostBoot.push === "function") return;
  var queue = [], flushed = false;
  function runOne(fn) {
    try { fn(); } catch (e) {
      try { if (global.console && console.error) console.error("[GhostBoot]", e); } catch (e2) {}
    }
  }
  function flush() {
    if (flushed) return;
    flushed = true;
    var list = queue; queue = [];
    for (var i = 0; i < list.length; i++) runOne(list[i]);
  }
  global.GhostBoot = {
    push: function (fn) {
      if (typeof fn !== "function") return;
      if (flushed) { runOne(fn); return; }
      queue.push(fn);
    },
    flush: flush,
    isReady: function () { return flushed; }
  };
  if (doc.readyState === "loading" || doc.readyState === "interactive") {
    doc.addEventListener("DOMContentLoaded", flush);
  }
  if (doc.readyState === "complete") setTimeout(flush, 0);
})(typeof window !== "undefined" ? window : this, document);
