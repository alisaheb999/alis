/* Ghostae Text — shared performance helpers.
 * Loaded before every panel script so hot handlers (drag, search, scroll)
 * can coalesce work into one frame instead of running per event.
 * CEP's embedded Chromium is much slower than a desktop browser, so an
 * unthrottled keystroke filter over ~2000 tiles is the single biggest
 * source of the panel's input lag. */
(function (global) {
  "use strict";
  if (global.GhostPerf) return;

  var raf =
    global.requestAnimationFrame ||
    function (fn) {
      return global.setTimeout(function () {
        fn(Date.now());
      }, 16);
    };
  var caf = global.cancelAnimationFrame || global.clearTimeout;

  /* Coalesce repeated calls into one call per animation frame.
     The LAST arguments received before the frame fires are the ones used. */
  function rafThrottle(fn) {
    var pending = 0;
    var lastArgs = null;
    var lastThis = null;
    return function () {
      lastArgs = arguments;
      lastThis = this;
      if (pending) return;
      pending = raf(function () {
        pending = 0;
        fn.apply(lastThis, lastArgs);
      });
    };
  }

  /* Trailing-edge debounce — for work that only matters once the user
     stops typing (grid filtering, persisting state). */
  function debounce(fn, wait) {
    var timer = 0;
    var ms = typeof wait === "number" ? wait : 90;
    return function () {
      var args = arguments;
      var self = this;
      if (timer) global.clearTimeout(timer);
      timer = global.setTimeout(function () {
        timer = 0;
        fn.apply(self, args);
      }, ms);
    };
  }

  /* Run a long list of items in frame-sized slices so the panel keeps
     responding while a big grid is filtered or built. */
  function chunk(items, step, done, perFrame) {
    var size = perFrame || 200;
    var i = 0;
    var total = items.length;
    (function run() {
      var end = Math.min(total, i + size);
      for (; i < end; i += 1) step(items[i], i);
      if (i < total) raf(run);
      else if (done) done();
    })();
  }

  global.GhostPerf = {
    raf: raf,
    caf: caf,
    rafThrottle: rafThrottle,
    debounce: debounce,
    chunk: chunk
  };
})(typeof window !== "undefined" ? window : this);
