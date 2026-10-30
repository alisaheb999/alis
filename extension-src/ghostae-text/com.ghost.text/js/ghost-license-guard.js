/*!
 * GHOSTAE — License Guard (recurring verification + tamper resistance)
 * ------------------------------------------------------------------
 * Drop-in module. ES5 only (CEP / Chromium-embedded: no arrow fns, no let/const).
 * It does NOT modify ghost-cloud.js or ghost-gate.js — it wraps them at runtime.
 *
 * Adds:
 *  1. Private trusted state (not readable/writable from outside).
 *  2. GhostCloud.isLicensed / .can and GhostGate.guard become non-writable
 *     getters -> monkey-patch proof.
 *  3. Recurring server session checks, interval clamped to [300,1800]s + jitter.
 *  4. Consecutive-failure counter -> hard lock after 6 fails outside grace.
 *  5. Freshness re-check (600s) before every guarded premium action.
 *  6. Clock-tamper detection (wall clock vs performance.now drift > 5 min).
 *  7. Function-integrity self-check (djb2 hash of critical functions).
 *  8. Server-signed session_token required; expiry must be in the future.
 *  9. 72h offline grace, valid only while the signed token is unexpired.
 * 10. Everything fails CLOSED (locked) on any unexpected error.
 *
 * Requires (already in the panel): window.GhostCloud, window.GhostGate, window.GhostBoot.
 * Server endpoints:
 *   POST /api/public/v1/license/session -> { ok, license:{valid,reason,plan}, session_token, expires_at, heartbeat_seconds }
 *   POST /api/public/v1/license/tamper  -> { ok }
 */
(function (global) {
  "use strict";

  if (!global || global.__GHOST_LICENSE_GUARD__) return;
  global.__GHOST_LICENSE_GUARD__ = true;

  var Cloud = global.GhostCloud;
  if (!Cloud) {
    try {
      global.GHOST_LICENSE_BLOCKED = true;
      if (global.document && document.body) document.body.setAttribute("data-ghost-licensed", "0");
    } catch (e) {}
    return;
  }

  /* ------------------------------------------------------------------ config */

  var LS_STATE = "ghost.guard.session";
  var MIN_INTERVAL = 300;
  var MAX_INTERVAL = 1800;
  var JITTER = 0.2;
  var FRESH_MAX_AGE = 600;
  var GRACE_HOURS = 72;
  var MAX_FAILURES = 6;
  var CLOCK_SLACK_MS = 5 * 60 * 1000;

  /* ---------------------------------------------------------------- private */

  var TRUSTED = false;
  var BLOCKED = false;
  var failures = 0;
  var timer = null;
  var inFlight = null;
  var lastReason = "unknown";
  var currentInterval = 900;

  var wall0 = Date.now();
  var perf0 = nowPerf();
  var integrity = null;

  function nowPerf() {
    try {
      if (global.performance && typeof global.performance.now === "function") {
        return global.performance.now();
      }
    } catch (e) {}
    return null;
  }

  function djb2(str) {
    var h = 5381;
    var s = String(str || "");
    for (var i = 0; i < s.length; i++) h = (h * 33 ^ s.charCodeAt(i)) >>> 0;
    return h.toString(16);
  }

  function readState() {
    try {
      var raw = global.GhostStorage && global.GhostStorage.get
        ? global.GhostStorage.get(LS_STATE, null)
        : global.localStorage.getItem(LS_STATE);
      if (!raw) return null;
      var parsed = JSON.parse(raw);
      return parsed && typeof parsed === "object" ? parsed : null;
    } catch (e) {
      return null;
    }
  }

  function writeState(obj) {
    try {
      var raw = JSON.stringify(obj);
      if (global.GhostStorage && global.GhostStorage.set) global.GhostStorage.set(LS_STATE, raw);
      else global.localStorage.setItem(LS_STATE, raw);
    } catch (e) {}
  }

  function clearState() {
    try {
      if (global.GhostStorage && global.GhostStorage.remove) global.GhostStorage.remove(LS_STATE);
      else global.localStorage.removeItem(LS_STATE);
    } catch (e) {}
  }

  function tokenAlive(s) {
    if (!s || !s.token || !s.exp) return false;
    return Number(s.exp) > Date.now();
  }

  function withinGrace() {
    var s = readState();
    if (!s || !s.valid || !s.checkedAt) return false;
    if (!tokenAlive(s)) return false;
    return (Date.now() - Number(s.checkedAt)) < GRACE_HOURS * 3600 * 1000;
  }

  function ageSeconds() {
    var s = readState();
    if (!s || !s.checkedAt) return Infinity;
    var age = (Date.now() - Number(s.checkedAt)) / 1000;
    return age < 0 ? Infinity : age;
  }

  /** The only function allowed to answer "is this machine licensed?". */
  function isLicensedInner() {
    if (BLOCKED) return false;
    if (global.GHOST_LICENSE_BLOCKED === true) return false;
    return TRUSTED === true;
  }

  /* ------------------------------------------------------------------- lock */

  function applyLocked(reasonMessage) {
    try {
      if (global.document && document.body) document.body.setAttribute("data-ghost-licensed", "0");
      var Gate = global.GhostGate;
      if (Gate && typeof Gate.lock === "function") Gate.lock(reasonMessage || "");
    } catch (e) {}
  }

  function applyUnlocked() {
    try {
      if (global.document && document.body) document.body.setAttribute("data-ghost-licensed", "1");
      var Gate = global.GhostGate;
      if (Gate && typeof Gate.unlock === "function") Gate.unlock();
    } catch (e) {}
  }

  function safeKey() {
    try { return Cloud.licenseKey ? String(Cloud.licenseKey() || "") : ""; } catch (e) { return ""; }
  }
  function safeDevice() {
    try { return Cloud.deviceId ? String(Cloud.deviceId() || "") : ""; } catch (e) { return ""; }
  }

  function report(kind, detail) {
    try {
      if (!Cloud.request) return;
      Cloud.request("POST", "/api/public/v1/license/tamper", {
        license_key: safeKey(),
        device_fingerprint: safeDevice(),
        kind: String(kind || "unknown"),
        detail: String(detail == null ? "" : detail).slice(0, 500),
        panel: global.GHOST_PANEL_ID || (global.document && document.title) || "unknown"
      })["catch"](function () { return null; });
    } catch (e) {}
  }

  function hardBlock(kind, detail) {
    BLOCKED = true;
    TRUSTED = false;
    try { global.GHOST_LICENSE_BLOCKED = true; } catch (e) {}
    clearState();
    lastReason = kind === "clock" ? "clock_tamper" : "override_tamper";
    applyLocked(kind === "clock"
      ? "System clock changed. Reconnect to verify your license."
      : "License check was modified. Reinstall GHOST from ghostae.com.");
    report(kind, detail);
  }

  /* --------------------------------------------------------- tamper sensors */

  function checkClock() {
    var p = nowPerf();
    if (p === null || perf0 === null) return true;
    var expected = wall0 + (p - perf0);
    if (Math.abs(Date.now() - expected) > CLOCK_SLACK_MS) {
      hardBlock("clock", "wall drift " + Math.round(Date.now() - expected) + "ms");
      return false;
    }
    return true;
  }

  function snapshotIntegrity() {
    var g = global.GhostGate;
    return {
      licensed: djb2(String(global.GhostCloud && global.GhostCloud.isLicensed)),
      guard: djb2(String(g && g.guard)),
      lock: djb2(String(g && g.lock))
    };
  }

  function checkIntegrity() {
    if (!integrity) { integrity = snapshotIntegrity(); return true; }
    var now = snapshotIntegrity();
    if (now.licensed !== integrity.licensed || now.guard !== integrity.guard || now.lock !== integrity.lock) {
      hardBlock("override", "function hash changed");
      return false;
    }
    return true;
  }

  /* ------------------------------------------------------------ server call */

  function reasonText(reason) {
    switch (String(reason)) {
      case "not_found": return "This license key was not found.";
      case "revoked": return "License revoked.";
      case "suspended": return "License suspended.";
      case "expired": return "License expired.";
      case "device_revoked": return "This device was removed from the license.";
      case "seat_limit": return "All seats for this license are in use.";
      case "no_key": return "";
      default: return "Activation required.";
    }
  }

  /** One signed session check. Resolves { licensed:boolean, reason:string }. */
  function checkSession() {
    if (BLOCKED) return Promise.resolve({ licensed: false, reason: "blocked" });
    if (inFlight) return inFlight;

    var key = safeKey();
    if (!key) {
      TRUSTED = false;
      lastReason = "no_key";
      clearState();
      applyLocked("");
      return Promise.resolve({ licensed: false, reason: "no_key" });
    }

    inFlight = Cloud.request("POST", "/api/public/v1/license/session", {
      license_key: key,
      device_fingerprint: safeDevice(),
      panel: global.GHOST_PANEL_ID || "ghost-panel",
      version: (global.GHOST_BUILD && global.GHOST_BUILD.version) || "0.0.0",
      client_time: Date.now()
    }).then(function (res) {
      inFlight = null;
      var lic = (res && res.license) || {};
      var token = res && (res.session_token || lic.session_token);
      var exp = Number(res && (res.expires_at || lic.session_expires_at)) || 0;
      var ok = !!(lic.valid === true && token && String(token).length > 20 && exp > Date.now());

      if (ok) {
        failures = 0;
        TRUSTED = true;
        lastReason = "ok";
        writeState({
          valid: true,
          token: String(token),
          exp: exp,
          plan: lic.plan || null,
          checkedAt: Date.now()
        });
        applyUnlocked();
        var hb = Number(res && res.heartbeat_seconds) || 0;
        if (hb) currentInterval = hb;
        return { licensed: true, reason: "ok" };
      }

      // Server said no -> authoritative. Never fall back to cache.
      failures = 0;
      TRUSTED = false;
      lastReason = String(lic.reason || "invalid");
      clearState();
      applyLocked(reasonText(lastReason));
      return { licensed: false, reason: lastReason };
    })["catch"](function (err) {
      inFlight = null;
      failures++;
      if (withinGrace() && failures < MAX_FAILURES) {
        TRUSTED = true;
        lastReason = "offline_grace";
        applyUnlocked();
        return { licensed: true, reason: "offline_grace" };
      }
      TRUSTED = false;
      lastReason = "offline_grace_expired";
      applyLocked("Connect to the internet to verify your license.");
      return { licensed: false, reason: lastReason, error: err && err.code };
    });

    return inFlight;
  }

  /* -------------------------------------------------------------- heartbeat */

  function clampInterval(seconds) {
    var s = Number(seconds) || 900;
    if (s < MIN_INTERVAL) s = MIN_INTERVAL;
    if (s > MAX_INTERVAL) s = MAX_INTERVAL;
    var jitter = 1 + ((Math.random() * 2 - 1) * JITTER);
    return Math.round(s * jitter * 1000);
  }

  function scheduleNext(seconds) {
    if (timer) { try { clearTimeout(timer); } catch (e) {} }
    if (BLOCKED) return;
    timer = setTimeout(tick, clampInterval(seconds));
  }

  function tick() {
    if (BLOCKED) return;
    if (!checkClock()) return;
    if (!checkIntegrity()) return;
    checkSession().then(function () {
      scheduleNext(currentInterval);
    }, function () {
      TRUSTED = false;
      applyLocked("");
      scheduleNext(currentInterval);
    });
  }

  /* ----------------------------------------------------- freshness for work */

  function requireFresh(maxAgeSeconds, callback) {
    var maxAge = Number(maxAgeSeconds) || FRESH_MAX_AGE;
    function run(licensed) {
      if (licensed && isLicensedInner()) {
        try { return callback(); } catch (e) { return undefined; }
      }
      applyLocked(reasonText(lastReason));
      return undefined;
    }
    if (BLOCKED) return run(false);
    if (!checkClock() || !checkIntegrity()) return run(false);
    if (ageSeconds() <= maxAge && isLicensedInner()) return run(true);
    return checkSession().then(function (res) {
      return run(!!(res && res.licensed));
    }, function () {
      return run(withinGrace());
    });
  }

  /* -------------------------------------------------------------- hardening */

  // GhostCloud.isLicensed -> non-writable getter backed by private state.
  try {
    Object.defineProperty(Cloud, "isLicensed", {
      configurable: false,
      enumerable: true,
      get: function () {
        return function () { return isLicensedInner(); };
      }
    });
  } catch (e) {
    try { Cloud.isLicensed = function () { return isLicensedInner(); }; } catch (e2) {}
  }

  // GhostCloud.can -> same private check + module lock map.
  try {
    Object.defineProperty(Cloud, "can", {
      configurable: false,
      enumerable: true,
      get: function () {
        return function (moduleName) {
          if (!isLicensedInner()) return false;
          try {
            var locked = Cloud.lockedModules || {};
            return locked[moduleName] !== true;
          } catch (e) {
            return false;
          }
        };
      }
    });
  } catch (e) {}

  function hardenGate() {
    var Gate = global.GhostGate;
    if (!Gate || Gate.__ghostHardened) return;
    var originalGuard = typeof Gate.guard === "function" ? Gate.guard : function (fn) { return fn; };

    var hardened = function (fn) {
      var inner = originalGuard.call(Gate, fn);
      return function () {
        var self = this;
        var args = arguments;
        if (!isLicensedInner()) {
          applyLocked(reasonText(lastReason));
          return undefined;
        }
        return requireFresh(FRESH_MAX_AGE, function () {
          return inner.apply(self, args);
        });
      };
    };

    try {
      Object.defineProperty(Gate, "guard", {
        configurable: false, enumerable: true,
        get: function () { return hardened; }
      });
    } catch (e) {
      Gate.guard = hardened;
    }

    try {
      Object.defineProperty(Gate, "isLicensed", {
        configurable: false, enumerable: true,
        get: function () { return function () { return isLicensedInner(); }; }
      });
    } catch (e) {}

    try {
      Object.defineProperty(Gate, "__ghostHardened", { value: true, enumerable: false });
    } catch (e) { Gate.__ghostHardened = true; }

    integrity = snapshotIntegrity();
  }

  /* ------------------------------------------------------------------- boot */

  function boot() {
    TRUSTED = false;
    applyLocked(safeKey() ? "Verifying license…" : "");
    hardenGate();
    integrity = snapshotIntegrity();

    try {
      if (global.document && document.addEventListener) {
        document.addEventListener("visibilitychange", function () {
          if (!document.hidden && ageSeconds() > FRESH_MAX_AGE) tick();
        });
      }
      if (global.addEventListener) {
        global.addEventListener("online", function () { failures = 0; tick(); });
        global.addEventListener("focus", function () {
          if (ageSeconds() > FRESH_MAX_AGE * 3) tick();
        });
      }
    } catch (e) {}

    try {
      if (typeof Cloud.on === "function") {
        Cloud.on("revoked", function () { TRUSTED = false; clearState(); applyLocked("License revoked."); });
        Cloud.on("deactivated", function () { TRUSTED = false; clearState(); applyLocked(""); });
        Cloud.on("activated", function () { failures = 0; tick(); });
      }
    } catch (e) {}

    tick();
  }

  var Guard = {
    isLicensed: function () { return isLicensedInner(); },
    requireFresh: requireFresh,
    refresh: function () { return checkSession(); },
    guard: function (fn) {
      return function () {
        var self = this, args = arguments;
        return requireFresh(FRESH_MAX_AGE, function () { return fn.apply(self, args); });
      };
    },
    reason: function () { return lastReason; },
    status: function () {
      return {
        licensed: isLicensedInner(),
        blocked: BLOCKED,
        reason: lastReason,
        ageSeconds: ageSeconds(),
        failures: failures,
        grace: withinGrace()
      };
    }
  };

  try {
    Object.defineProperty(global, "GhostLicenseGuard", {
      value: Object.freeze(Guard), writable: false, configurable: false, enumerable: true
    });
  } catch (e) {
    global.GhostLicenseGuard = Guard;
  }

  try {
    if (global.GhostBoot && typeof global.GhostBoot.push === "function") global.GhostBoot.push(boot);
    else if (global.document && document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", function () { setTimeout(boot, 0); });
    } else {
      setTimeout(boot, 0);
    }
  } catch (e) {
    setTimeout(boot, 250);
  }
})(typeof window !== "undefined" ? window : this);
