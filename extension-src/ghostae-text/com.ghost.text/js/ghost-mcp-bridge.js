if (typeof window !== "undefined" && window.__ghostStamp) {
  window.__ghostStamp(
    "ghost-mcp-bridge.js",
    /* @ghost-build */
    "3.40.2+20260829.ui-perfect"
  );
}
(function(global) {
  "use strict";
  var POLL_MS = 700;
  var HEARTBEAT_MS = 5e3;
  var BUSY_TIMEOUT_MS = 24e3;
  var STORAGE_KEY = "ghost.mcp.bridge.enabled";
  var cs = typeof CSInterface !== "undefined" ? new CSInterface() : null;
  var node = getNode();
  var timer = null;
  var heartbeatTimer = null;
  var busy = false;
  var listeners = [];
  function getNode() {
    try {
      var req = null;
      if (global.cep_node && typeof global.cep_node.require === "function") req = global.cep_node.require;
      else if (typeof require === "function") req = require;
      if (!req) return { available: false };
      return { available: true, fs: req("fs"), path: req("path"), os: req("os"), crypto: req("crypto") };
    } catch (error) {
      return { available: false };
    }
  }
  function bridgeRoot() {
    if (!node.available) return "";
    var home = node.os.homedir();
    var proc = typeof process !== "undefined" ? process : null;
    var plat = proc && proc.platform || node.os.platform && node.os.platform() || "";
    if (plat === "win32") {
      var appData = proc && proc.env && proc.env.APPDATA || node.path.join(home, "AppData", "Roaming");
      return node.path.join(appData, "GHOST", "mcp-bridge");
    }
    return node.path.join(home, "Library", "Application Support", "GHOST", "mcp-bridge");
  }
  function authToken() {
    if (!node.available) return "";
    var file = node.path.join(bridgeRoot(), "auth-token");
    try {
      if (node.fs.existsSync(file)) return String(node.fs.readFileSync(file, "utf8")).trim();
      ensureDir(bridgeRoot());
      var token = node.crypto && node.crypto.randomBytes ? node.crypto.randomBytes(32).toString("hex") : String(Date.now()) + String(Math.random()).slice(2);
      node.fs.writeFileSync(file, token, { encoding: "utf8", mode: 0o600 });
      return token;
    } catch (error) {
      return "";
    }
  }
  function ensureDir(dir) {
    if (!node.available || !dir) return;
    try {
      node.fs.mkdirSync(dir, { recursive: true });
    } catch (error) {
    }
  }
  function emit(message, level) {
    for (var i = 0; i < listeners.length; i++) {
      try {
        listeners[i]({ message, level: level || "info" });
      } catch (error) {
      }
    }
  }
  function writeHeartbeat() {
    if (!node.available) return;
    var root = bridgeRoot();
    ensureDir(root);
    var payload = {
      updatedAt: Date.now(),
      panel: cs && cs.getExtensionID && cs.getExtensionID() || "com.ghost.creativesystem",
      host: cs && cs.getHostEnvironment && cs.getHostEnvironment().appName || "AEFT",
      authToken: authToken(),
      protocolVersion: 2
    };
    try {
      node.fs.writeFileSync(node.path.join(root, "panel.json"), JSON.stringify(payload), "utf8");
    } catch (error) {
    }
  }
  function respond(id, ok, payload) {
    var dir = node.path.join(bridgeRoot(), "responses");
    ensureDir(dir);
    var body = { id, ok: !!ok, finishedAt: Date.now() };
    if (ok) body.result = payload;
    else body.error = String(payload);
    try {
      node.fs.writeFileSync(node.path.join(dir, id + ".json"), JSON.stringify(body), "utf8");
    } catch (error) {
    }
  }
  function handleRequest(file, id) {
    var raw = "";
    try {
      raw = node.fs.readFileSync(file, "utf8");
    } catch (error) {
      return;
    }
    try {
      node.fs.unlinkSync(file);
    } catch (error) {
    }
    var request = null;
    try {
      request = JSON.parse(raw);
    } catch (error) {
      request = null;
    }
    if (!request || typeof request.script !== "string" || !request.script.trim()) {
      respond(id, false, "Malformed MCP request.");
      return;
    }
    if (request.script.length > 250000) {
      respond(id, false, "MCP script exceeds the 250KB safety limit.");
      return;
    }
    var token = authToken();
    if (!token || request.token !== token) {
      respond(id, false, "Unauthorized MCP request.");
      return;
    }
    if (!cs) {
      respond(id, false, "CSInterface is not available in this panel.");
      return;
    }
    emit("MCP request " + id + " received.", "info");
    busy = true;
    var settled = false;
    var watchdog = global.setTimeout(function() {
      if (settled) return;
      settled = true;
      busy = false;
      respond(id, false, "After Effects did not answer this script in time.");
      emit("MCP request " + id + " timed out.", "warn");
    }, BUSY_TIMEOUT_MS);
    var finish = function(ok, payload, message, level) {
      if (settled) return;
      settled = true;
      global.clearTimeout(watchdog);
      busy = false;
      respond(id, ok, payload);
      emit(message, level);
    };
    try {
      cs.evalScript(request.script, function(result) {
        if (typeof result === "string" && result.indexOf("EvalScript error") === 0) {
          finish(false, result, "MCP request " + id + " failed in After Effects.", "warn");
          return;
        }
        finish(true, result, "MCP request " + id + " completed.", "ok");
      });
    } catch (error) {
      finish(false, error && error.message ? error.message : String(error), "MCP request " + id + " failed.", "warn");
    }
  }
  function poll() {
    if (busy || !node.available) return;
    var dir = node.path.join(bridgeRoot(), "requests");
    ensureDir(dir);
    var entries = [];
    try {
      entries = node.fs.readdirSync(dir);
    } catch (error) {
      return;
    }
    for (var i = 0; i < entries.length; i++) {
      if (!/\.json$/i.test(entries[i])) continue;
      handleRequest(node.path.join(dir, entries[i]), entries[i].replace(/\.json$/i, ""));
      return;
    }
  }
  var Bridge = {};
  Bridge.available = function() {
    return node.available && !!cs;
  };
  Bridge.root = bridgeRoot;
  Bridge.onLog = function(fn) {
    if (typeof fn === "function") listeners.push(fn);
  };
  Bridge.isEnabled = function() {
    try {
      return global.localStorage.getItem(STORAGE_KEY) === "1";
    } catch (error) {
      return false;
    }
  };
  Bridge.enable = function() {
    if (!Bridge.available()) {
      emit("MCP bridge needs Node.js access inside the CEP panel.", "warn");
      return false;
    }
    try {
      global.localStorage.setItem(STORAGE_KEY, "1");
    } catch (error) {
    }
    if (timer) return true;
    ensureDir(bridgeRoot());
    writeHeartbeat();
    timer = global.setInterval(poll, POLL_MS);
    heartbeatTimer = global.setInterval(writeHeartbeat, HEARTBEAT_MS);
    emit("MCP bridge listening at " + bridgeRoot(), "ok");
    return true;
  };
  Bridge.disable = function() {
    try {
      global.localStorage.setItem(STORAGE_KEY, "0");
    } catch (error) {
    }
    if (timer) {
      global.clearInterval(timer);
      timer = null;
    }
    if (heartbeatTimer) {
      global.clearInterval(heartbeatTimer);
      heartbeatTimer = null;
    }
    emit("MCP bridge stopped.", "info");
  };
  Bridge.status = function() {
    return {
      available: Bridge.available(),
      enabled: !!timer,
      root: bridgeRoot()
    };
  };
  global.GhostMcpBridge = Bridge;
  if (Bridge.isEnabled()) {
    try {
      Bridge.enable();
    } catch (error) {
    }
  }
})(window);
