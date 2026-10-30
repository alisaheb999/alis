/* ghost-observer.js - shared document.body MutationObserver (perf pass).
   Several modules each created their own MutationObserver on
   document.body with { childList: true, subtree: true }. They now share a
   single observer that fans the same records out to each subscriber, in
   subscription order. Each subscriber keeps its own throttle/debounce and
   its own record filtering, so trigger timing and mutation coverage are
   unchanged - only the number of live observers drops. */
(function (global, doc) {
  "use strict";
  if (global.GhostObserver) return;
  var subs = [], mo = null;
  function dispatch(records, observer) {
    for (var i = 0; i < subs.length; i++) {
      try { subs[i](records, observer); } catch (e) {
        try { if (global.console && console.error) console.error("[GhostObserver]", e); } catch (e2) {}
      }
    }
  }
  global.GhostObserver = {
    onBodyMutation: function (fn) {
      if (typeof fn !== "function") return;
      subs.push(fn);
      if (!mo && global.MutationObserver && doc.body) {
        mo = new global.MutationObserver(dispatch);
        mo.observe(doc.body, { childList: true, subtree: true });
      }
    }
  };
})(typeof window !== "undefined" ? window : this, document);
