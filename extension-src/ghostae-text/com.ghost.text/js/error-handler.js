/*!
 * GHOST Creative System — panel error handler.
 *
 * Legacy CEF panels fail silently: a single uncaught error stops the rest of a
 * module from initialising with nothing in the UI. This captures errors early,
 * mirrors them to the ExtendScript log and keeps a local ring buffer that the
 * Diagnostics view can read.
 */
(function (global) {
  "use strict";

  if (global.__GHOST_ERRORS__) return;

  var MAX = 40;
  var log = [];
  var seen = {};

  function panelId() {
    try {
      var path = String(global.location && global.location.pathname || "");
      var file = path.split("/").pop() || "panel";
      return file.replace(/\.html?$/i, "") || "panel";
    } catch (e) { return "panel"; }
  }

  function record(entry) {
    var key = entry.message + "|" + entry.source;
    if (seen[key]) { seen[key].count += 1; return null; }
    entry.count = 1;
    entry.panel = panelId();
    entry.at = new Date().toISOString();
    seen[key] = entry;
    log.push(entry);
    if (log.length > MAX) log.shift();
    return entry;
  }

  function toHost(entry) {
    try {
      var api = global.__API__;
      var cs = api && api.getCSInterface ? api.getCSInterface() : null;
      if (!cs || typeof cs.evalScript !== "function") return;
      var msg = (entry.panel + ": " + entry.message + " @ " + entry.source)
        .replace(/\\/g, "\\\\").replace(/"/g, '\\"').replace(/[\r\n]+/g, " ");
      cs.evalScript('typeof GhostHost !== "undefined" && GhostHost.logError ? GhostHost.logError("' + msg + '") : ""');
    } catch (e) {}
  }

  function handle(message, source, error) {
    var entry = record({
      message: String(message || "Unknown error"),
      source: String(source || ""),
      stack: error && error.stack ? String(error.stack).slice(0, 1200) : ""
    });
    if (!entry) return;
    if (global.console && console.error) console.error("[GHOST] " + entry.message + " @ " + entry.source);
    toHost(entry);
  }

  global.addEventListener("error", function (event) {
    /* Asset load failures arrive as element-scoped errors — keep them quiet. */
    if (event && event.target && event.target !== global && event.target.tagName) {
      record({
        message: "Failed to load " + (event.target.currentSrc || event.target.src || event.target.href || event.target.tagName),
        source: "resource",
        stack: ""
      });
      return;
    }
    handle(event && event.message, (event && event.filename ? event.filename.split("/").pop() : "") + ":" + (event && event.lineno || 0), event && event.error);
  }, true);

  global.addEventListener("unhandledrejection", function (event) {
    var reason = event && event.reason;
    handle(reason && reason.message || String(reason || "Unhandled promise rejection"), "promise", reason);
  });

  global.__GHOST_ERRORS__ = {
    list: function () { return log.slice(); },
    push: function (message, source) { handle(message, source || "manual", null); },
    clear: function () { log.length = 0; seen = {}; }
  };

  /* Release per-panel state so reopening a panel starts clean. */
  global.addEventListener("beforeunload", function () {
    try {
      if (global.__API__ && global.__API__.releasePanel) global.__API__.releasePanel(panelId());
    } catch (e) {}
  });
})(typeof window !== "undefined" ? window : this);
