/*
 * ghost-idle.js — zero idle work governor (v3.25.0)
 *
 * A CEP panel keeps running while the user is working inside After Effects.
 * This module parks every recurring cost (CSS preview animations and the
 * polling timers routed through GhostStability's setInterval wrapper) as soon
 * as the panel is not actually being used, and wakes everything on the next
 * paint when the user comes back.
 *
 * A panel counts as "in use" when it is visible AND has focus. That covers
 * the three real cases:
 *   1. the panel tab is switched away / the panel is closed → visibilitychange
 *   2. another panel or the composition viewer is clicked → window blur
 *   3. After Effects itself goes to the background      → window blur
 * Waking is immediate; sleeping waits a short grace period so a click that
 * momentarily moves focus (a modal, a file picker) does not flicker.
 */
(function (global) {
  "use strict";
  var doc = global.document;
  if (!doc) return;

  var SLEEP_DELAY = 600;      /* ms of "not in use" before we park anything */
  var suspended = false;
  var sleepTimer = null;
  var focused = true;   /* set from hasFocus() at startup, then event-driven */
  var cepVisible = true;

  function hidden() {
    return doc.hidden === true || cepVisible === false;
  }
  function hasFocus() {
    try { return doc.hasFocus(); } catch (e) { return true; }
  }
  function inUse() {
    /* focus is event-driven: document.hasFocus() only seeds the first value,
       because some CEP builds keep reporting true after the host takes over. */
    return !hidden() && focused;
  }

  function suspend() {
    if (suspended) return;
    suspended = true;
    if (global.GhostStability && global.GhostStability.suspend) global.GhostStability.suspend();
    if (global.GhostIntervalManager) global.GhostIntervalManager.suspend();
    if (doc.body) doc.body.classList.add("ghost-panel-suspended");
    emit("ghost:suspend");
  }

  function resume() {
    if (!suspended) return;
    suspended = false;
    if (global.GhostStability && global.GhostStability.resume) global.GhostStability.resume();
    if (global.GhostIntervalManager) global.GhostIntervalManager.resume();
    if (doc.body) doc.body.classList.remove("ghost-panel-suspended");
    emit("ghost:resume");
  }

  function emit(name) {
    try {
      var ev = doc.createEvent("Event");
      ev.initEvent(name, false, false);
      doc.dispatchEvent(ev);
    } catch (e) {
    }
  }

  function clearSleep() {
    if (sleepTimer) {
      global.clearTimeout(sleepTimer);
      sleepTimer = null;
    }
  }

  function sync() {
    if (inUse()) {
      clearSleep();
      resume();
      return;
    }
    if (suspended || sleepTimer) return;
    sleepTimer = global.setTimeout(function () {
      sleepTimer = null;
      if (!inUse()) suspend();
    }, SLEEP_DELAY);
  }

  doc.addEventListener("visibilitychange", sync);
  global.addEventListener("focus", function () { focused = true; sync(); });
  global.addEventListener("blur", function () { focused = false; sync(); });
  /* pointer/keyboard activity inside the panel always means "in use", even if
     the host never handed us a real focus event. */
  ["pointerdown", "mousedown", "wheel", "keydown", "mousemove"].forEach(function (name) {
    doc.addEventListener(name, function () {
      if (!focused) { focused = true; sync(); }
      else if (suspended) sync();
    }, true);
  });

  /* CEP tells us when the panel window is shown or hidden — this is what fires
     when the user switches to a different panel in the same dock group. */
  function bindCep() {
    try {
      var CS = global.CSInterface;
      if (typeof CS !== "function") return false;
      var cs = new CS();
      cs.addEventListener("com.adobe.csxs.events.WindowVisibilityChanged", function (event) {
        var data = event && event.data;
        var vis = data && (data.visibility !== undefined ? data.visibility : data);
        cepVisible = !(vis === false || vis === "false" || vis === 0 || vis === "hidden");
        sync();
      });
      return true;
    } catch (e) {
      return false;
    }
  }
  if (!bindCep()) {
    var tries = 0;
    var pollCep = function () {
      tries += 1;
      if (bindCep() || tries > 40) return;
      global.setTimeout(pollCep, 250);
    };
    global.setTimeout(pollCep, 250);
  }

  /* Scrolling a 60-card grid while every card animates is the other source of
     jank. The grid is parked for the duration of the scroll and released
     120 ms after the last scroll event. */
  var scrollTimer = null;
  function markScroll() {
    if (!doc.body) return;
    if (!scrollTimer) doc.body.classList.add("is-scrolling");
    else global.clearTimeout(scrollTimer);
    scrollTimer = global.setTimeout(function () {
      scrollTimer = null;
      doc.body.classList.remove("is-scrolling");
    }, 120);
  }
  doc.addEventListener("scroll", markScroll, true);
  doc.addEventListener("wheel", markScroll, true);

  focused = hasFocus();
  global.GhostBoot.push(sync);

  /* Park recurring timers while the panel is asleep. This is deliberately
     installed after the idle governor is ready and before feature modules load.
     Existing clearInterval semantics are preserved through a small handle map. */
  var nativeSetInterval = global.setInterval;
  var nativeClearInterval = global.clearInterval;
  var managedIntervals = [];
  var nextIntervalId = 1;
  function managedSetInterval(fn, delay) {
    var entry = { id: nextIntervalId++, fn: fn, delay: Math.max(1, Number(delay) || 1), nativeId: null, active: true };
    function arm() { if (entry.active && entry.nativeId == null) entry.nativeId = nativeSetInterval(fn, entry.delay); }
    function disarm() { if (entry.nativeId != null) { nativeClearInterval(entry.nativeId); entry.nativeId = null; } }
    entry.arm = arm; entry.disarm = disarm; managedIntervals.push(entry); arm();
    return entry.id;
  }
  function managedClearInterval(id) {
    for (var n=managedIntervals.length-1;n>=0;n--) {
      var e=managedIntervals[n];
      if (e.id===id || e.nativeId===id) { e.active=false; e.disarm(); managedIntervals.splice(n,1); return; }
    }
    try { nativeClearInterval(id); } catch (ignore) {}
  }
  function parkIntervals() { for (var n=0;n<managedIntervals.length;n++) managedIntervals[n].disarm(); }
  function resumeIntervals() { for (var n=0;n<managedIntervals.length;n++) managedIntervals[n].arm(); }
  global.GhostIntervalManager = { suspend: parkIntervals, resume: resumeIntervals, count: function(){return managedIntervals.length;} };
  global.setInterval = managedSetInterval;
  global.clearInterval = managedClearInterval;

  global.GhostIdle = {
    isSuspended: function () { return suspended; },
    isVisible: function () { return !hidden(); },
    isFocused: function () { return focused && hasFocus(); },
    isInUse: inUse,
    suspend: suspend,
    resume: resume
  };
})(typeof window !== "undefined" ? window : this);
