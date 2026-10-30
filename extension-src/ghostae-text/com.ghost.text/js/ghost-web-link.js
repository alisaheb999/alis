if (typeof window !== "undefined" && window.__ghostStamp) {
  window.__ghostStamp(
    "ghost-web-link.js",
    /* @ghost-build */
    "3.40.2+20260829.ui-perfect"
  );
}
(function(global) {
  "use strict";
  var PORT = 37421;
  var STORAGE_KEY = "ghost.weblink.enabled";
  var MAX_BYTES = 512 * 1024 * 1024;
  var cs = typeof CSInterface !== "undefined" ? new CSInterface() : null;
  var node = getNode();
  var server = null;
  var listeners = [];
  var lastError = "";
  function getNode() {
    try {
      var req = null;
      if (global.cep_node && typeof global.cep_node.require === "function") req = global.cep_node.require;
      else if (typeof require === "function") req = require;
      if (!req) return { available: false };
      return {
        available: true,
        fs: req("fs"),
        path: req("path"),
        os: req("os"),
        http: req("http"),
        https: req("https"),
        url: req("url")
      };
    } catch (error) {
      return { available: false };
    }
  }
  function inboxDir() {
    if (!node.available) return "";
    var home = node.os.homedir();
    var proc = typeof process !== "undefined" ? process : null;
    var plat = proc && proc.platform || node.os.platform && node.os.platform() || "";
    if (plat === "win32") {
      var appData = proc && proc.env && proc.env.APPDATA || node.path.join(home, "AppData", "Roaming");
      return node.path.join(appData, "GHOST", "web-inbox");
    }
    return node.path.join(home, "Library", "Application Support", "GHOST", "web-inbox");
  }
  function ensureDir(dir) {
    try {
      node.fs.mkdirSync(dir, { recursive: true });
    } catch (error) {
    }
  }
  function emit(event) {
    for (var i = 0; i < listeners.length; i += 1) {
      try {
        listeners[i](event);
      } catch (error) {
      }
    }
  }
  function safeName(name, fallbackExt) {
    var base = String(name || "").split("?")[0].split("#")[0];
    base = base.replace(/[\\\/:*?"<>|]+/g, "_").replace(/\s+/g, " ").trim();
    if (!base) base = "web-asset";
    if (!/\.[a-z0-9]{2,5}$/i.test(base)) base += fallbackExt || ".bin";
    if (base.length > 90) {
      var dot = base.lastIndexOf(".");
      base = base.slice(0, 60) + base.slice(dot);
    }
    return base;
  }
  function extFromType(type) {
    var map = {
      "image/jpeg": ".jpg",
      "image/png": ".png",
      "image/gif": ".gif",
      "image/webp": ".webp",
      "image/avif": ".avif",
      "image/svg+xml": ".svg",
      "video/mp4": ".mp4",
      "video/webm": ".webm",
      "video/quicktime": ".mov",
      "audio/mpeg": ".mp3",
      "audio/wav": ".wav",
      "audio/ogg": ".ogg",
      "audio/mp4": ".m4a"
    };
    return map[String(type || "").split(";")[0].toLowerCase()] || "";
  }
  function uniquePath(dir, name) {
    var target = node.path.join(dir, name);
    if (!node.fs.existsSync(target)) return target;
    var dot = name.lastIndexOf(".");
    var stem = dot > 0 ? name.slice(0, dot) : name;
    var ext = dot > 0 ? name.slice(dot) : "";
    for (var i = 2; i < 500; i += 1) {
      var candidate = node.path.join(dir, stem + "-" + i + ext);
      if (!node.fs.existsSync(candidate)) return candidate;
    }
    return node.path.join(dir, stem + "-" + Date.now() + ext);
  }
  function download(rawUrl, filename, referer, depth, rawDone) {
    var finished = false;
    var done = function(error, file, bytes) {
      if (finished) return;
      finished = true;
      rawDone(error, file, bytes);
    };
    if (depth > 5) return done(new Error("Too many redirects."));
    var parsed;
    try {
      parsed = node.url.parse(rawUrl);
    } catch (error) {
      return done(new Error("Invalid URL."));
    }
    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
      return done(new Error("Only http(s) URLs can be sent to After Effects."));
    }
    var client = parsed.protocol === "https:" ? node.https : node.http;
    var headers = {
      "User-Agent": "Mozilla/5.0 GHOST-Creative-System",
      "Accept": "*/*"
    };
    if (referer) {
      headers.Referer = referer;
      try {
        headers.Origin = node.url.parse(referer).protocol + "//" + node.url.parse(referer).host;
      } catch (error) {
      }
    }
    var request = client.get({
      protocol: parsed.protocol,
      hostname: parsed.hostname,
      port: parsed.port,
      path: parsed.path,
      headers
    }, function(res) {
      var status2 = res.statusCode || 0;
      if (status2 >= 300 && status2 < 400 && res.headers.location) {
        res.resume();
        var next = node.url.resolve(rawUrl, res.headers.location);
        return download(next, filename, referer, depth + 1, done);
      }
      if (status2 !== 200) {
        res.resume();
        return done(new Error("Source responded " + status2 + "."));
      }
      var length = Number(res.headers["content-length"] || 0);
      if (length && length > MAX_BYTES) {
        res.destroy();
        return done(new Error("File is larger than 512 MB."));
      }
      var dir = inboxDir();
      ensureDir(dir);
      var ext = extFromType(res.headers["content-type"]);
      var urlName = decodeURIComponent(String(parsed.pathname || "").split("/").pop() || "");
      var target = uniquePath(dir, safeName(filename || urlName, ext || ".bin"));
      var written = 0;
      var stream = node.fs.createWriteStream(target);
      res.on("data", function(chunk) {
        written += chunk.length;
        if (written > MAX_BYTES) {
          res.destroy();
          stream.destroy();
          try {
            node.fs.unlinkSync(target);
          } catch (error) {
          }
          done(new Error("File is larger than 512 MB."));
        }
      });
      res.pipe(stream);
      stream.on("finish", function() {
        done(null, target, written);
      });
      stream.on("error", function(error) {
        done(error);
      });
    });
    request.on("error", function(error) {
      done(error);
    });
    request.setTimeout(12e4, function() {
      request.destroy();
      done(new Error("Download timed out."));
    });
  }
  function evalHost(fn, args, done) {
    if (!cs) return done(new Error("After Effects bridge is unavailable."));
    var literal = (args || []).map(function(value) {
      return '"' + String(value).replace(/\\/g, "\\\\").replace(/"/g, '\\"') + '"';
    }).join(",");
    cs.evalScript("GhostHost." + fn + "(" + literal + ")", function(raw) {
      var text = String(raw == null ? "" : raw);
      if (!text || text === "EvalScript error.") return done(new Error("After Effects rejected the request."));
      try {
        done(null, JSON.parse(text));
      } catch (error) {
        done(null, { ok: true, raw: text });
      }
    });
  }
  function sendJson(res, status2, payload) {
    var body = JSON.stringify(payload);
    res.writeHead(status2, {
      "Content-Type": "application/json; charset=utf-8",
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Headers": "Content-Type",
      "Access-Control-Allow-Methods": "GET,POST,OPTIONS",
      "Cache-Control": "no-store",
      "Content-Length": Buffer.byteLength(body)
    });
    res.end(body);
  }
  function handleSend(payload, res) {
    var url = String(payload.url || "").trim();
    if (!url) return sendJson(res, 400, { ok: false, error: "Missing url." });
    emit({ type: "incoming", url, name: payload.filename || "" });
    download(url, payload.filename, payload.referer || payload.pageUrl, 0, function(error, file, bytes) {
      if (error) {
        lastError = error.message || String(error);
        emit({ type: "error", error: lastError, url });
        return sendJson(res, 502, { ok: false, error: lastError });
      }
      evalHost("addLayerToComp", [file], function(bridgeError, result) {
        if (bridgeError || !result || result.ok === false) {
          var message = bridgeError ? bridgeError.message : result && result.error || "Could not add the layer.";
          lastError = message;
          emit({ type: "error", error: message, url, file });
          return sendJson(res, 500, { ok: false, error: message, file });
        }
        emit({ type: "added", file, bytes, comp: result.compName || "" });
        sendJson(res, 200, {
          ok: true,
          file,
          bytes: bytes || 0,
          comp: result.compName || "",
          layer: result.layerName || ""
        });
      });
    });
  }
  var staged = [];
  var STAGED_MAX = 120;
  function stagedList() {
    return staged.slice();
  }
  function handleIdea(payload, res) {
    var url = String(payload.url || "").trim();
    if (!url) return sendJson(res, 400, { ok: false, error: "Missing url." });
    emit({ type: "incoming", url, name: payload.filename || "", staged: true });
    download(url, payload.filename, payload.referer || payload.pageUrl, 0, function(error, file, bytes) {
      if (error) {
        lastError = error.message || String(error);
        emit({ type: "error", error: lastError, url });
        return sendJson(res, 502, { ok: false, error: lastError });
      }
      var item = {
        id: "idea-" + Date.now() + "-" + Math.round(Math.random() * 1e6),
        file,
        name: payload.title || payload.filename || baseName(file),
        bytes: bytes || 0,
        source: payload.source || "browser",
        pageUrl: payload.pageUrl || "",
        at: Date.now()
      };
      staged.unshift(item);
      if (staged.length > STAGED_MAX) staged.length = STAGED_MAX;
      emit({ type: "staged", item });
      sendJson(res, 200, { ok: true, staged: true, item });
    });
  }
  function baseName(file) {
    var parts = String(file || "").split(/[\\/]/);
    return parts[parts.length - 1] || "Reference";
  }
  function readBody(req, res, done) {
    var chunks = "";
    req.on("data", function(chunk) {
      chunks += chunk;
      if (chunks.length > 2e4) {
        req.destroy();
      }
    });
    req.on("end", function() {
      var payload = {};
      try {
        payload = JSON.parse(chunks || "{}");
      } catch (error) {
        return sendJson(res, 400, { ok: false, error: "Invalid JSON body." });
      }
      done(payload);
    });
  }
  function handler(req, res) {
    var route = String(req.url || "").split("?")[0].replace(/\/+$/, "") || "/";
    if (req.method === "OPTIONS") return sendJson(res, 204, {});
    if (route === "/ghost/ping" && req.method === "GET") {
      return evalHost("getActiveContext", [], function(error, ctx) {
        sendJson(res, 200, {
          ok: true,
          app: "GHOST Creative System",
          panel: global.GHOST_PANEL_ID || "ghost-cache",
          comp: ctx && ctx.compName || ctx && ctx.comp && ctx.comp.name || "",
          lastError
        });
      });
    }
    if (route === "/ghost/send" && req.method === "POST") {
      readBody(req, res, function(payload) {
        handleSend(payload, res);
      });
      return;
    }
    if (route === "/ghost/idea" && req.method === "POST") {
      readBody(req, res, function(payload) {
        handleIdea(payload, res);
      });
      return;
    }
    if (route === "/ghost/idea" && req.method === "GET") {
      return sendJson(res, 200, { ok: true, items: stagedList() });
    }
    sendJson(res, 404, { ok: false, error: "Unknown route." });
  }
  function enable() {
    if (!node.available) {
      lastError = "Node access is disabled for this panel.";
      return false;
    }
    if (server) return true;
    try {
      server = node.http.createServer(handler);
      server.on("error", function(error) {
        lastError = error && error.code === "EADDRINUSE" ? "Port " + PORT + " is already in use (another GHOST panel is listening)." : error && error.message || String(error);
        emit({ type: "error", error: lastError });
        try {
          server.close();
        } catch (closeError) {
        }
        server = null;
      });
      server.listen(PORT, "127.0.0.1", function() {
        lastError = "";
        emit({ type: "listening", port: PORT });
      });
      try {
        localStorage.setItem(STORAGE_KEY, "1");
      } catch (error) {
      }
      return true;
    } catch (error) {
      lastError = error.message || String(error);
      server = null;
      return false;
    }
  }
  function disable() {
    if (server) {
      try {
        server.close();
      } catch (error) {
      }
    }
    server = null;
    try {
      localStorage.setItem(STORAGE_KEY, "0");
    } catch (error) {
    }
    emit({ type: "stopped" });
  }
  function status() {
    return {
      available: node.available,
      listening: Boolean(server),
      port: PORT,
      inbox: node.available ? inboxDir() : "",
      lastError
    };
  }
  global.GhostWebLink = {
    enable,
    disable,
    status,
    staged: stagedList,
    stage: function(payload) {
      return new Promise(function(resolve, reject) {
        if (!node.available) return reject(new Error("Node access is disabled for this panel."));
        download(payload.url, payload.filename, payload.referer || payload.pageUrl, 0, function(error, file, bytes) {
          if (error) return reject(error);
          var item = {
            id: "idea-" + Date.now() + "-" + Math.round(Math.random() * 1e6),
            file,
            name: payload.title || payload.filename || baseName(file),
            bytes: bytes || 0,
            source: payload.source || "panel",
            pageUrl: payload.pageUrl || "",
            at: Date.now()
          };
          staged.unshift(item);
          if (staged.length > STAGED_MAX) staged.length = STAGED_MAX;
          emit({ type: "staged", item });
          resolve(item);
        });
      });
    },
    importFile: function(file, name) {
      return new Promise(function(resolve, reject) {
        evalHost("addLayerToComp", [file], function(error, result) {
          if (error) return reject(error);
          if (result && result.ok === false) return reject(new Error(result.error || "Could not add the layer."));
          resolve(result || { ok: true, name: name || "" });
        });
      });
    },
    clearStaged: function() {
      staged = [];
      emit({ type: "staged-cleared" });
    },
    onEvent: function(fn) {
      if (typeof fn === "function") listeners.push(fn);
    }
  };
  var stored = null;
  try {
    stored = localStorage.getItem(STORAGE_KEY);
  } catch (error) {
  }
  if (stored !== "0") {
    global.GhostBoot.push(function() {
      enable();
    });
  }
})(typeof window !== "undefined" ? window : this);
