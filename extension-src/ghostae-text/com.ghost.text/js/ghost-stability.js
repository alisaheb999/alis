if (typeof window !== "undefined" && window.__ghostStamp) {
  window.__ghostStamp("ghost-stability.js", "3.40.5+20260830.autoplay-deepfix");
}
(function(global) {
  "use strict";
  if (!global || global.GhostStability) return;
  var doc = global.document;
  var MAX_LIVE_MEDIA = 8;
  var live = [];
  var suspended = false;

  function isAutoplay(el) {
    try { return el && el.getAttribute("data-ghost-autoplay") === "1"; } catch (e) { return false; }
  }
  function isPreserved(el) {
    try { return el && el.getAttribute("data-ghost-preserve-media") === "1"; } catch (e) { return false; }
  }
  function removeFromLive(el) {
    var i = live.indexOf(el);
    if (i !== -1) live.splice(i, 1);
  }
  function release(el, reset) {
    if (!el) return;
    try { el.pause(); } catch (e) {}
    if (reset) {
      try { if (el.readyState >= 1) el.currentTime = 0; } catch (e2) {}
    }
    if (!isPreserved(el)) {
      try { el.removeAttribute("src"); } catch (e3) {}
      try { el.load(); } catch (e4) {}
    }
    removeFromLive(el);
  }
  function evictIfNeeded() {
    while (live.length > MAX_LIVE_MEDIA) {
      var victim = -1;
      for (var i=0; i<live.length; i++) {
        if (!isAutoplay(live[i])) { victim=i; break; }
      }
      if (victim === -1) return; // never interrupt active autoplay
      release(live[victim], false);
    }
  }
  function registerMedia(el) {
    if (!el) return;
    removeFromLive(el);
    live.push(el);
    evictIfNeeded();
  }
  function forgetMedia(el) { removeFromLive(el); }
  function pauseAll(opts) {
    var reset = !opts || opts.reset !== false;
    var snapshot = live.slice();
    for (var i=0; i<snapshot.length; i++) release(snapshot[i], reset);
  }
  function panelHidden() {
    try {
      return !!(doc && (doc.hidden || (doc.body && doc.body.classList.contains("ghost-panel-suspended"))));
    } catch (e) { return false; }
  }
  function suspend() {
    suspended = true;
    pauseAll({reset:false});
    try { if (doc && doc.body) doc.body.classList.add("ghost-panel-suspended"); } catch (e) {}
  }
  function resume() {
    suspended = false;
    try { if (doc && doc.body) doc.body.classList.remove("ghost-panel-suspended"); } catch (e) {}
    try {
      var ev = doc.createEvent("Event"); ev.initEvent("ghost:resume", false, false); doc.dispatchEvent(ev);
    } catch (e2) {}
  }

  global.GhostStability = {
    version: "1.2.0-deep-autoplay",
    maxLiveMedia: MAX_LIVE_MEDIA,
    liveMedia: function() { return live.length; },
    registerMedia: registerMedia,
    forgetMedia: forgetMedia,
    pauseAll: pauseAll,
    releaseAllMedia: function() { pauseAll({reset:true}); },
    isSuspended: function() { return suspended || panelHidden(); },
    suspend: suspend,
    resume: resume,
    errors: function() { return []; }
  };

  if (doc) {
    doc.addEventListener("visibilitychange", function() {
      if (doc.hidden) pauseAll({reset:false});
      else {
        try { var ev=doc.createEvent("Event"); ev.initEvent("ghost:resume", false, false); doc.dispatchEvent(ev); } catch (e) {}
      }
    });
  }
})(typeof window !== "undefined" ? window : this);
