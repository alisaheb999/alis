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
if (typeof window !== "undefined" && window.__ghostStamp) {
  window.__ghostStamp(
    "ghost-compat.js",
    "3.40.2+20260829.ui-perfect"
  );
}
(function(global) {
  "use strict";
  var doc = global.document;
  try {
    if (global.NodeList && !global.NodeList.prototype.forEach) {
      global.NodeList.prototype.forEach = Array.prototype.forEach;
    }
    if (global.HTMLCollection && !global.HTMLCollection.prototype.forEach) {
      global.HTMLCollection.prototype.forEach = Array.prototype.forEach;
    }
    if (global.DOMTokenList && !global.DOMTokenList.prototype.forEach) {
      global.DOMTokenList.prototype.forEach = Array.prototype.forEach;
    }
  } catch (e) {
  }
  try {
    var ep = global.Element && global.Element.prototype;
    if (ep) {
      if (!ep.matches) ep.matches = ep.msMatchesSelector || ep.webkitMatchesSelector;
      if (!ep.closest) {
        ep.closest = function(sel) {
          var el = this;
          while (el && el.nodeType === 1) {
            if (el.matches(sel)) return el;
            el = el.parentElement || el.parentNode;
          }
          return null;
        };
      }
      if (!ep.remove) {
        ep.remove = function() {
          if (this.parentNode) this.parentNode.removeChild(this);
        };
      }
      if (!ep.append) {
        ep.append = function() {
          for (var i = 0; i < arguments.length; i++) {
            var n = arguments[i];
            this.appendChild(typeof n === "string" ? doc.createTextNode(n) : n);
          }
        };
      }
    }
  } catch (e) {
  }
  try {
    if (!Object.assign) {
      Object.assign = function(target) {
        for (var i = 1; i < arguments.length; i++) {
          var src = arguments[i];
          if (!src) continue;
          for (var k in src) if (Object.prototype.hasOwnProperty.call(src, k)) target[k] = src[k];
        }
        return target;
      };
    }
    if (!Object.entries) {
      Object.entries = function(o) {
        var out = [];
        for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) out.push([k, o[k]]);
        return out;
      };
    }
    if (!Object.values) {
      Object.values = function(o) {
        return Object.keys(o).map(function(k) {
          return o[k];
        });
      };
    }
    if (!Object.fromEntries) {
      Object.fromEntries = function(pairs) {
        var out = {};
        (pairs || []).forEach(function(p) {
          out[p[0]] = p[1];
        });
        return out;
      };
    }
    if (!Array.from) {
      Array.from = function(list, map) {
        var out = [];
        for (var i = 0; i < (list ? list.length : 0); i++) out.push(map ? map(list[i], i) : list[i]);
        return out;
      };
    }
    if (!Array.prototype.includes) {
      Array.prototype.includes = function(v) {
        return this.indexOf(v) !== -1;
      };
    }
    if (!Array.prototype.find) {
      Array.prototype.find = function(fn) {
        for (var i = 0; i < this.length; i++) if (fn(this[i], i, this)) return this[i];
        return void 0;
      };
    }
    if (!Array.prototype.findIndex) {
      Array.prototype.findIndex = function(fn) {
        for (var i = 0; i < this.length; i++) if (fn(this[i], i, this)) return i;
        return -1;
      };
    }
    if (!Array.prototype.flat) {
      Array.prototype.flat = function() {
        return this.reduce(function(a, b) {
          return a.concat(b);
        }, []);
      };
    }
    if (!String.prototype.includes) {
      String.prototype.includes = function(v) {
        return this.indexOf(v) !== -1;
      };
    }
    if (!String.prototype.startsWith) {
      String.prototype.startsWith = function(v) {
        return this.slice(0, v.length) === v;
      };
    }
    if (!String.prototype.endsWith) {
      String.prototype.endsWith = function(v) {
        return this.slice(-v.length) === v;
      };
    }
    if (!String.prototype.padStart) {
      String.prototype.padStart = function(len, pad) {
        var s = String(this);
        pad = pad === void 0 ? " " : pad;
        while (s.length < len) s = pad + s;
        return s;
      };
    }
    if (!String.prototype.trimStart) String.prototype.trimStart = String.prototype.trim;
    if (!String.prototype.trimEnd) String.prototype.trimEnd = String.prototype.trim;
    if (global.Promise && !global.Promise.prototype["finally"]) {
      global.Promise.prototype["finally"] = function(fn) {
        return this.then(
          function(v) {
            fn();
            return v;
          },
          function(e) {
            fn();
            throw e;
          }
        );
      };
    }
    if (global.Promise && !global.Promise.allSettled) {
      global.Promise.allSettled = function(list) {
        return global.Promise.all(
          (list || []).map(function(p) {
            return global.Promise.resolve(p).then(
              function(value) {
                return { status: "fulfilled", value };
              },
              function(reason) {
                return { status: "rejected", reason };
              }
            );
          })
        );
      };
    }
    if (!global.structuredClone) {
      global.structuredClone = function(v) {
        try {
          return JSON.parse(JSON.stringify(v));
        } catch (e) {
          return v;
        }
      };
    }
    if (!global.requestIdleCallback) {
      global.requestIdleCallback = function(fn) {
        return setTimeout(function() {
          fn({ didTimeout: false, timeRemaining: function() {
            return 8;
          } });
        }, 1);
      };
      global.cancelIdleCallback = function(id) {
        clearTimeout(id);
      };
    }
    if (!global.ResizeObserver) {
      global.ResizeObserver = function(cb) {
        this._cb = cb;
        this._onResize = function() {
          try {
            cb([]);
          } catch (e) {
          }
        };
      };
      global.ResizeObserver.prototype.observe = function() {
        global.addEventListener("resize", this._onResize);
      };
      global.ResizeObserver.prototype.unobserve = function() {
        global.removeEventListener("resize", this._onResize);
      };
      global.ResizeObserver.prototype.disconnect = global.ResizeObserver.prototype.unobserve;
    }
    if (!global.IntersectionObserver) {
      global.IntersectionObserver = function(cb) {
        this._cb = cb;
      };
      global.IntersectionObserver.prototype.observe = function(el) {
        var cb = this._cb;
        setTimeout(function() {
          try {
            cb([{ target: el, isIntersecting: true, intersectionRatio: 1 }]);
          } catch (e) {
          }
        }, 0);
      };
      global.IntersectionObserver.prototype.unobserve = function() {
      };
      global.IntersectionObserver.prototype.disconnect = function() {
      };
      global.IntersectionObserver.prototype.takeRecords = function() {
        return [];
      };
    }
  } catch (e) {
  }
  function detect() {
    var ua = String(global.navigator && global.navigator.userAgent || "");
    var m = /Chrome\/(\d+)/.exec(ua);
    var chrome = m ? parseInt(m[1], 10) : 0;
    var supports = global.CSS && global.CSS.supports ? function(prop, val) {
      try {
        return global.CSS.supports(prop, val);
      } catch (e) {
        return false;
      }
    } : function() {
      return false;
    };
    return {
      chrome,
      legacy: chrome > 0 && chrome < 100,
      aspectRatio: supports("aspect-ratio", "1 / 1"),
      colorMix: supports("color", "color-mix(in srgb, red 50%, blue)"),
      has: (function() {
        try {
          doc.querySelector(":has(*)");
          return true;
        } catch (e) {
          return false;
        }
      })(),
      contentVisibility: supports("content-visibility", "auto"),
      backdrop: supports("backdrop-filter", "blur(4px)")
    };
  }
  var caps = detect();
  global.GhostCompat = { caps };
  function flag() {
    var root = doc.documentElement;
    if (!root) return;
    if (caps.legacy) root.className += " ghost-legacy-host";
    if (!caps.aspectRatio) root.className += " no-aspect-ratio";
    if (!caps.colorMix) root.className += " no-color-mix";
    if (!caps.has) root.className += " no-has";
    if (!caps.backdrop) root.className += " no-backdrop";
  }
  flag();
  global.addEventListener("error", function(e) {
    try {
      var body = doc.body;
      if (!body || body.getAttribute("data-ghost-boot-error")) return;
      if (body.children.length > 1) return;
      body.setAttribute("data-ghost-boot-error", "1");
      var box = doc.createElement("div");
      box.style.cssText = "position:fixed;inset:0;z-index:99998;display:flex;align-items:center;justify-content:center;padding:24px;background:#141414;color:#e9e9ec;font:12px/1.6 -apple-system,Segoe UI,sans-serif;text-align:center";
      box.innerHTML = '<div><div style="font-size:13px;font-weight:600;margin-bottom:6px">This panel could not start</div><div style="opacity:.7;max-width:340px">' + String(e && e.message || "Unknown error") + '</div><div style="opacity:.5;margin-top:10px">After Effects build: Chromium ' + caps.chrome + ". Update GHOST from ghostae.com if this persists.</div></div>";
      body.appendChild(box);
    } catch (err) {
    }
  });
  try {
    if (!global.requestAnimationFrame) {
      global.requestAnimationFrame = function (fn) {
        return setTimeout(function () { fn(Date.now()); }, 16);
      };
      global.cancelAnimationFrame = function (id) { clearTimeout(id); };
    }
    if (!global.MutationObserver) {
      global.MutationObserver = function (cb) { this._cb = cb; };
      global.MutationObserver.prototype.observe = function () {};
      global.MutationObserver.prototype.disconnect = function () {};
      global.MutationObserver.prototype.takeRecords = function () { return []; };
    }
    /* Older CEF builds ship fetch() that fails silently on file:// hosted
       panels. Route every call through XHR when it is missing or broken. */
    if (typeof global.fetch !== "function") {
      global.fetch = function (url, opts) {
        opts = opts || {};
        return new global.Promise(function (resolve, reject) {
          var xhr = new global.XMLHttpRequest();
          xhr.open(opts.method || "GET", url, true);
          var headers = opts.headers || {};
          for (var k in headers) {
            if (Object.prototype.hasOwnProperty.call(headers, k)) {
              try { xhr.setRequestHeader(k, headers[k]); } catch (e) {}
            }
          }
          xhr.onload = function () {
            var text = xhr.responseText;
            resolve({
              ok: xhr.status >= 200 && xhr.status < 300,
              status: xhr.status,
              statusText: xhr.statusText,
              headers: { get: function (n) { return xhr.getResponseHeader(n); } },
              text: function () { return global.Promise.resolve(text); },
              json: function () {
                try { return global.Promise.resolve(JSON.parse(text)); }
                catch (e) { return global.Promise.reject(e); }
              }
            });
          };
          xhr.onerror = function () { reject(new Error("Network request failed")); };
          xhr.ontimeout = function () { reject(new Error("Network request timed out")); };
          try { xhr.send(opts.body || null); } catch (e) { reject(e); }
        });
      };
      global.GHOST_FETCH_POLYFILL = true;
    }
  } catch (e) {}
  var memStore = {};
  var storageOk = (function () {
    try {
      global.localStorage.setItem("__ghost_probe", "1");
      global.localStorage.removeItem("__ghost_probe");
      return true;
    } catch (e) { return false; }
  })();
  var safeStorage = {
    available: storageOk,
    get: function (key, fallback) {
      try {
        var v = storageOk ? global.localStorage.getItem(key) : memStore[key];
        return v === null || v === void 0 ? (fallback === void 0 ? null : fallback) : v;
      } catch (e) { return fallback === void 0 ? null : fallback; }
    },
    set: function (key, value) {
      try {
        if (storageOk) global.localStorage.setItem(key, value);
        else memStore[key] = String(value);
        return true;
      } catch (e) { memStore[key] = String(value); return false; }
    },
    remove: function (key) {
      try { if (storageOk) global.localStorage.removeItem(key); } catch (e) {}
      delete memStore[key];
    },
    getJSON: function (key, fallback) {
      try { return JSON.parse(safeStorage.get(key, "")) || fallback; }
      catch (e) { return fallback; }
    },
    setJSON: function (key, value) {
      try { return safeStorage.set(key, JSON.stringify(value)); }
      catch (e) { return false; }
    }
  };
  global.GhostStorage = safeStorage;
  global.GhostCompat.storage = safeStorage;
  try {
    var probe = doc.createElement("div");
    var style = probe.style;
    var hasGap = false;
    try { style.display = "flex"; style.gap = "1px"; hasGap = style.gap === "1px"; } catch (e) {}
    var hasGrid = false;
    try { style.display = "grid"; hasGrid = style.display === "grid"; } catch (e) {}
    var hasSticky = false;
    try { style.position = "sticky"; hasSticky = style.position === "sticky"; } catch (e) {}
    caps.gap = hasGap;
    caps.grid = hasGrid;
    caps.sticky = hasSticky;
    var root = doc.documentElement;
    if (root) {
      if (!hasGap) root.className += " no-gap";
      if (!hasGrid) root.className += " no-grid";
      if (!hasSticky) root.className += " no-sticky";
      /* var() is Chrome 49+, but a few AE embeds resolve it to "invalid"
         inside calc()/gradients — treat that as "no custom properties". */
      var varsOk = false;
      try {
        probe.style.setProperty("--ghost-probe", "9px");
        probe.style.paddingTop = "var(--ghost-probe)";
        varsOk = probe.style.paddingTop.indexOf("var(") === 0;
      } catch (e) {}
      caps.cssVars = varsOk;
      if (!varsOk) root.className += " no-css-vars";
    }
  } catch (e) {}
  /* Boot timing. CSInterface and stylesheets are not guaranteed to be live at
     DOMContentLoaded inside AE 2020, so panels wait for both. */
  var readyQueue = [];
  var booted = false;
  function csReady() {
    try {
      if (typeof global.CSInterface !== "function") return true; /* preview/browser */
      var cs = global.__ghostBootCs || (global.__ghostBootCs = new global.CSInterface());
      return !!(cs && cs.getHostEnvironment && cs.getHostEnvironment());
    } catch (e) { return false; }
  }
  function drain() {
    if (booted) return;
    booted = true;
    var list = readyQueue.slice();
    readyQueue.length = 0;
    for (var i = 0; i < list.length; i++) {
      try { list[i](); } catch (e) {
        if (global.console && console.error) console.error("[ghost] init failed", e);
      }
    }
  }
  function waitForHost(tries) {
    if (csReady() || tries <= 0) { drain(); return; }
    setTimeout(function () { waitForHost(tries - 1); }, 60);
  }
  function startBoot() { waitForHost(40); }
  if (doc.readyState === "complete") setTimeout(startBoot, 0);
  else global.addEventListener("load", function () { setTimeout(startBoot, 0); });
  setTimeout(startBoot, 4000);
  global.GhostCompat.ready = function (fn) {
    if (typeof fn !== "function") return;
    if (booted) { try { fn(); } catch (e) {} return; }
    readyQueue.push(fn);
  };
  global.GhostReady = global.GhostCompat.ready;
})(typeof window !== "undefined" ? window : this);
/*!
 * GHOST Creative System — window.__API__ compatibility layer.
 *
 * After Effects 2020/2021 embed Chromium 74-84. Those builds ship a partial
 * platform: fetch() can fail on file:// panels, localStorage may be read-only,
 * IntersectionObserver is missing and CSInterface is not usable at parse time.
 *
 * This file is intentionally ES5 and dependency-free, and must load BEFORE any
 * other GHOST script (it only augments, never replaces, existing behaviour).
 */
(function (global) {
  "use strict";
  if (global.__API__) return;
  var doc = global.document;
  function probeStorage() {
    try {
      var k = "__ghost_api_probe__";
      global.localStorage.setItem(k, k);
      global.localStorage.removeItem(k);
      return true;
    } catch (e) {
      return false;
    }
  }
  var hasStorage = probeStorage();
  var memory = {};
  /* Reuse the hardened store from ghost-compat.js when it is already present so
     both layers share one source of truth. */
  var store = global.GhostStorage || null;
  function xhrFetch(url, options) {
    options = options || {};
    return new global.Promise(function (resolve, reject) {
      var xhr = new global.XMLHttpRequest();
      try {
        xhr.open(options.method || "GET", url, true);
      } catch (e) {
        reject(e);
        return;
      }
      var headers = options.headers || {};
      for (var key in headers) {
        if (Object.prototype.hasOwnProperty.call(headers, key)) {
          try { xhr.setRequestHeader(key, headers[key]); } catch (e) {}
        }
      }
      if (typeof options.timeout === "number") xhr.timeout = options.timeout;
      xhr.onload = function () {
        var text = xhr.responseText;
        resolve({
          ok: xhr.status >= 200 && xhr.status < 300,
          status: xhr.status,
          statusText: xhr.statusText || "",
          headers: { get: function (name) { try { return xhr.getResponseHeader(name); } catch (e) { return null; } } },
          text: function () { return global.Promise.resolve(text); },
          json: function () {
            try { return global.Promise.resolve(JSON.parse(text)); }
            catch (e) { return global.Promise.reject(e); }
          }
        });
      };
      xhr.onerror = function () { reject(new Error("Network request failed: " + url)); };
      xhr.ontimeout = function () { reject(new Error("Network request timed out: " + url)); };
      try { xhr.send(options.body || null); } catch (e) { reject(e); }
    });
  }
  var API = {
    hasFetch: typeof global.fetch === "function",
    hasPromise: typeof global.Promise === "function",
    hasStorage: hasStorage,
    hasIntersectionObserver: typeof global.IntersectionObserver !== "undefined",
    hasMutationObserver: typeof global.MutationObserver !== "undefined",
    hasResizeObserver: typeof global.ResizeObserver !== "undefined",
    hasRAF: typeof global.requestAnimationFrame === "function",
    hasDragDrop: !!(doc && "draggable" in doc.createElement("div")),
    chrome: (function () {
      var m = /Chrome\/(\d+)/.exec(global.navigator && global.navigator.userAgent || "");
      return m ? parseInt(m[1], 10) : 0;
    })(),
    fetchWithFallback: function (url, options) {
      if (API.hasFetch) {
        try {
          return global.fetch(url, options).catch(function (err) {
            return xhrFetch(url, options).catch(function () { throw err; });
          });
        } catch (e) {
          return xhrFetch(url, options);
        }
      }
      return xhrFetch(url, options);
    },
    storage: {
      available: hasStorage,
      getItem: function (key) { return API.storage.get(key); },
      setItem: function (key, value) { return API.storage.set(key, value); },
      removeItem: function (key) { return API.storage.remove(key); },
      get: function (key) {
        if (store) return store.get(key, null);
        try {
          var v = hasStorage ? global.localStorage.getItem(key) : memory[key];
          return v === undefined ? null : v;
        } catch (e) { return null; }
      },
      set: function (key, value) {
        if (store) return store.set(key, value);
        try {
          if (hasStorage) global.localStorage.setItem(key, String(value));
          else memory[key] = String(value);
          return true;
        } catch (e) { memory[key] = String(value); return false; }
      },
      remove: function (key) {
        if (store) return store.remove(key);
        try { if (hasStorage) global.localStorage.removeItem(key); } catch (e) {}
        delete memory[key];
      },
      getJSON: function (key, fallback) {
        try {
          var raw = API.storage.get(key);
          return raw ? JSON.parse(raw) : fallback;
        } catch (e) { return fallback; }
      },
      setJSON: function (key, value) {
        try { return API.storage.set(key, JSON.stringify(value)); }
        catch (e) { return false; }
      }
    },
    /* Lazily constructed CSInterface — building it at parse time is the single
       most common cause of dead panels in AE 2020. */
    getCSInterface: function () {
      if (API._cs) return API._cs;
      try {
        if (typeof global.CSInterface !== "function") return null;
        API._cs = global.__ghostBootCs || (global.__ghostBootCs = new global.CSInterface());
      } catch (e) { API._cs = null; }
      return API._cs;
    },
    addBridgeListener: function (event, handler, retries) {
      retries = typeof retries === "number" ? retries : 5;
      var cs = API.getCSInterface();
      try {
        if (!cs) throw new Error("CSInterface unavailable");
        cs.addEventListener(event, handler);
        return true;
      } catch (e) {
        if (retries > 0) {
          setTimeout(function () { API.addBridgeListener(event, handler, retries - 1); }, 120);
        }
        return false;
      }
    },
    evalHost: function (expression, timeout) {
      timeout = timeout || 8000;
      return new global.Promise(function (resolve, reject) {
        var cs = API.getCSInterface();
        if (!cs) { reject(new Error("CSInterface unavailable")); return; }
        var settled = false;
        var timer = setTimeout(function () {
          if (settled) return;
          settled = true;
          reject(new Error("Host call timeout: " + expression.slice(0, 60)));
        }, timeout);
        try {
          cs.evalScript(expression, function (result) {
            if (settled) return;
            settled = true;
            clearTimeout(timer);
            resolve(result);
          });
        } catch (e) {
          settled = true;
          clearTimeout(timer);
          reject(e);
        }
      });
    },
    onReady: function (fn) {
      if (typeof fn !== "function") return;
      if (typeof global.GhostReady === "function") { global.GhostReady(fn); return; }
      if (global.GhostBoot) { global.GhostBoot.push(function () { setTimeout(fn, 60); }); return; }
      if (doc && doc.readyState === "loading") {
        doc.addEventListener("DOMContentLoaded", function () { setTimeout(fn, 60); });
      } else {
        setTimeout(fn, 100);
      }
    },
    panel: function (id, initial) {
      global.__GHOST_PANELS__ = global.__GHOST_PANELS__ || {};
      if (!global.__GHOST_PANELS__[id]) global.__GHOST_PANELS__[id] = initial || {};
      return global.__GHOST_PANELS__[id];
    },
    releasePanel: function (id) {
      try { if (global.__GHOST_PANELS__) delete global.__GHOST_PANELS__[id]; } catch (e) {}
    }
  };
  if (!API.hasIntersectionObserver) {
    global.IntersectionObserver = function (cb) {
      this._cb = cb;
      this.observe = function (el) {
        try { cb([{ target: el, isIntersecting: true, intersectionRatio: 1 }], this); } catch (e) {}
      };
      this.unobserve = function () {};
      this.disconnect = function () {};
      this.takeRecords = function () { return []; };
    };
  }
  if (!API.hasRAF) {
    global.requestAnimationFrame = function (fn) { return setTimeout(function () { fn(Date.now()); }, 16); };
    global.cancelAnimationFrame = function (id) { clearTimeout(id); };
  }
  /* ---- Global hardening ------------------------------------------------
     Rather than rewriting every call site, wrap the two APIs that throw on
     legacy CEF so all existing modules become safe at once. */
  /* Do not redefine window.localStorage. ghost-compat.js owns the hardened
     storage adapter and calls the native object internally. Wrapping the
     global object here made GhostStorage.get() call back into API.storage.get()
     forever, so a key visible in the input became an empty string immediately
     before activation. Callers use API.storage or GhostStorage directly. */
  /* fetch: keep the native implementation but fall back to XHR on rejection,
     which is what AE 2020 does for same-origin file:// requests. */
  try {
    if (API.hasFetch && !global.__GHOST_FETCH_WRAPPED__) {
      var nativeFetch = global.fetch;
      global.fetch = function (url, options) {
        try {
          return nativeFetch.call(global, url, options).catch(function (err) {
            return xhrFetch(url, options).catch(function () { throw err; });
          });
        } catch (e) {
          return xhrFetch(url, options);
        }
      };
      global.__GHOST_FETCH_WRAPPED__ = true;
    } else if (!API.hasFetch) {
      global.fetch = function (url, options) { return xhrFetch(url, options); };
      global.__GHOST_FETCH_WRAPPED__ = true;
    }
  } catch (e) {}
  /* ---- Small ES/DOM polyfills -------------------------------------------
     Present in Chromium 74, but AE panels occasionally run older embedded
     builds (and the mixed-context ExtendScript bridge strips some of these). */
  try {
    if (global.Promise && !global.Promise.prototype["finally"]) {
      global.Promise.prototype["finally"] = function (cb) {
        var P = this.constructor;
        return this.then(
          function (v) { return P.resolve(cb && cb()).then(function () { return v; }); },
          function (e) { return P.resolve(cb && cb()).then(function () { throw e; }); }
        );
      };
    }
    if (!Object.assign) {
      Object.assign = function (target) {
        for (var i = 1; i < arguments.length; i++) {
          var src = arguments[i];
          if (!src) continue;
          for (var k in src) {
            if (Object.prototype.hasOwnProperty.call(src, k)) target[k] = src[k];
          }
        }
        return target;
      };
    }
    if (!Array.from) {
      Array.from = function (list, map) {
        var out = [];
        for (var i = 0; i < (list && list.length || 0); i++) out.push(map ? map(list[i], i) : list[i]);
        return out;
      };
    }
    if (!Array.prototype.includes) {
      Array.prototype.includes = function (v) { return this.indexOf(v) !== -1; };
    }
    if (!String.prototype.includes) {
      String.prototype.includes = function (v) { return this.indexOf(v) !== -1; };
    }
    if (!Object.entries) {
      Object.entries = function (o) {
        return Object.keys(o).map(function (k) { return [k, o[k]]; });
      };
    }
    if (!Object.values) {
      Object.values = function (o) {
        return Object.keys(o).map(function (k) { return o[k]; });
      };
    }
    if (global.NodeList && !global.NodeList.prototype.forEach) {
      global.NodeList.prototype.forEach = Array.prototype.forEach;
    }
    if (global.Element && !global.Element.prototype.closest) {
      global.Element.prototype.closest = function (sel) {
        var el = this;
        while (el && el.nodeType === 1) {
          if (el.matches ? el.matches(sel) : el.msMatchesSelector(sel)) return el;
          el = el.parentElement;
        }
        return null;
      };
    }
  } catch (e) {}
  global.__API__ = API;
  global.GhostAPI = API;
})(typeof window !== "undefined" ? window : this);
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
  global.addEventListener("beforeunload", function () {
    try {
      if (global.__API__ && global.__API__.releasePanel) global.__API__.releasePanel(panelId());
    } catch (e) {}
  });
})(typeof window !== "undefined" ? window : this);
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
(function(global) {
  "use strict";
  var KEY = "ghost.cloud.baseUrl";
  var DEFAULT_BASE = "https://ghostae.com";
  var LEGACY_BASES = ["hi-there-buddy-4063.lovable.app", "lovableproject.com", "id-preview--"];
  function isLegacy(url) {
    for (var i = 0; i < LEGACY_BASES.length; i++) {
      if (url.indexOf(LEGACY_BASES[i]) !== -1) return true;
    }
    return false;
  }
  function normalise(value) {
    var text = String(value || "").trim();
    if (!text) return "";
    if (!/^https?:\/\//i.test(text)) return "";
    return text.replace(/\/+$/, "");
  }
  function baseUrl() {
    var stored = "";
    try {
      var raw = global.localStorage.getItem(KEY);
      if (raw) {
        try {
          raw = JSON.parse(raw);
        } catch (e) {
        }
        stored = normalise(raw);
        if (stored && isLegacy(stored)) {
          stored = "";
          try {
            global.localStorage.removeItem(KEY);
          } catch (e2) {
          }
        }
      }
    } catch (error) {
    }
    return stored || DEFAULT_BASE;
  }
  function setBaseUrl(value) {
    var next = normalise(value);
    try {
      if (next) global.localStorage.setItem(KEY, JSON.stringify(next));
      else global.localStorage.removeItem(KEY);
    } catch (error) {
    }
    return baseUrl();
  }
  function api(path) {
    var suffix = String(path || "");
    if (suffix && suffix.charAt(0) !== "/") suffix = "/" + suffix;
    return baseUrl() + suffix;
  }
  var CAPTION_TRANSCRIBE_PATH = "/api/public/v1/stt/transcribe";
  function captionTranscribeUrl() {
    return api(CAPTION_TRANSCRIBE_PATH);
  }
  global.GhostConfig = {
    DEFAULT_BASE,
    storageKey: KEY,
    baseUrl,
    setBaseUrl,
    api,
    CAPTION_TRANSCRIBE_PATH: CAPTION_TRANSCRIBE_PATH,
    captionTranscribeUrl: captionTranscribeUrl
  };
})(typeof window !== "undefined" ? window : this);
/* Ghostae Text — Heroicons registry (heroicons.com, 24px outline, MIT).
 * Icons are inlined because CEP panels run from file:// with no network.
 * Use: GhostHero.svg("sparkles", "gi gi-nav")  or  data-hero="sparkles".
 */
(function (global) {
  "use strict";
  var PATHS = {
  "adjustments-horizontal": "<path d=\"M10.5 6h9.75M10.5 6a1.5 1.5 0 1 1-3 0m3 0a1.5 1.5 0 1 0-3 0M3.75 6H7.5m3 12h9.75m-9.75 0a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m-3.75 0H7.5m9-6h3.75m-3.75 0a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m-9.75 0h9.75\"/>",
  "arrow-down-tray": "<path d=\"M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5M16.5 12 12 16.5m0 0L7.5 12m4.5 4.5V3\"/>",
  "arrow-path": "<path d=\"M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0 3.181 3.183a8.25 8.25 0 0 0 13.803-3.7M4.031 9.865a8.25 8.25 0 0 1 13.803-3.7l3.181 3.182m0-4.991v4.99\"/>",
  "arrow-up-tray": "<path d=\"M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5m-13.5-9L12 3m0 0 4.5 4.5M12 3v13.5\"/>",
  "arrow-uturn-left": "<path d=\"M9 15 3 9m0 0 6-6M3 9h12a6 6 0 0 1 0 12h-3\"/>",
  "bolt": "<path d=\"m3.75 13.5 10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75Z\"/>",
  "bookmark": "<path d=\"M17.593 3.322c1.1.128 1.907 1.077 1.907 2.185V21L12 17.25 4.5 21V5.507c0-1.108.806-2.057 1.907-2.185a48.507 48.507 0 0 1 11.186 0Z\"/>",
  "chat-bubble-bottom-center-text": "<path d=\"M7.5 8.25h9m-9 3H12m-9.75 1.51c0 1.6 1.123 2.994 2.707 3.227 1.129.166 2.27.293 3.423.379.35.026.67.21.865.501L12 21l2.755-4.133a1.14 1.14 0 0 1 .865-.501 48.172 48.172 0 0 0 3.423-.379c1.584-.233 2.707-1.626 2.707-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0 0 12 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018Z\"/>",
  "check": "<path d=\"m4.5 12.75 6 6 9-13.5\"/>",
  "chevron-down": "<path d=\"m19.5 8.25-7.5 7.5-7.5-7.5\"/>",
  "chevron-right": "<path d=\"m8.25 4.5 7.5 7.5-7.5 7.5\"/>",
  "clipboard": "<path d=\"M15.666 3.888A2.25 2.25 0 0 0 13.5 2.25h-3c-1.03 0-1.9.693-2.166 1.638m7.332 0c.055.194.084.4.084.612v0a.75.75 0 0 1-.75.75H9a.75.75 0 0 1-.75-.75v0c0-.212.03-.418.084-.612m7.332 0c.646.049 1.288.11 1.927.184 1.1.128 1.907 1.077 1.907 2.185V19.5a2.25 2.25 0 0 1-2.25 2.25H6.75A2.25 2.25 0 0 1 4.5 19.5V6.257c0-1.108.806-2.057 1.907-2.185a48.208 48.208 0 0 1 1.927-.184\"/>",
  "clipboard-document": "<path d=\"M8.25 7.5V6.108c0-1.135.845-2.098 1.976-2.192.373-.03.748-.057 1.123-.08M15.75 18H18a2.25 2.25 0 0 0 2.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 0 0-1.123-.08M15.75 18.75v-1.875a3.375 3.375 0 0 0-3.375-3.375h-1.5a1.125 1.125 0 0 1-1.125-1.125v-1.5A3.375 3.375 0 0 0 6.375 7.5H5.25m11.9-3.664A2.251 2.251 0 0 0 15 2.25h-1.5a2.251 2.251 0 0 0-2.15 1.586m5.8 0c.065.21.1.433.1.664v.75h-6V4.5c0-.231.035-.454.1-.664M6.75 7.5H4.875c-.621 0-1.125.504-1.125 1.125v12c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V16.5a9 9 0 0 0-9-9Z\"/>",
  "code-bracket": "<path d=\"M17.25 6.75 22.5 12l-5.25 5.25m-10.5 0L1.5 12l5.25-5.25m7.5-3-4.5 16.5\"/>",
  "cog-6-tooth": "<path d=\"M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.325.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 0 1 1.37.49l1.296 2.247a1.125 1.125 0 0 1-.26 1.431l-1.003.827c-.293.241-.438.613-.43.992a7.723 7.723 0 0 1 0 .255c-.008.378.137.75.43.991l1.004.827c.424.35.534.955.26 1.43l-1.298 2.247a1.125 1.125 0 0 1-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.47 6.47 0 0 1-.22.128c-.331.183-.581.495-.644.869l-.213 1.281c-.09.543-.56.94-1.11.94h-2.594c-.55 0-1.019-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 0 1-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 0 1-1.369-.49l-1.297-2.247a1.125 1.125 0 0 1 .26-1.431l1.004-.827c.292-.24.437-.613.43-.991a6.932 6.932 0 0 1 0-.255c.007-.38-.138-.751-.43-.992l-1.004-.827a1.125 1.125 0 0 1-.26-1.43l1.297-2.247a1.125 1.125 0 0 1 1.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.086.22-.128.332-.183.582-.495.644-.869l.214-1.28Z\"/> <path d=\"M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z\"/>",
  "cube-transparent": "<path d=\"m21 7.5-2.25-1.313M21 7.5v2.25m0-2.25-2.25 1.313M3 7.5l2.25-1.313M3 7.5l2.25 1.313M3 7.5v2.25m9 3 2.25-1.313M12 12.75l-2.25-1.313M12 12.75V15m0 6.75 2.25-1.313M12 21.75V19.5m0 2.25-2.25-1.313m0-16.875L12 2.25l2.25 1.313M21 14.25v2.25l-2.25 1.313m-13.5 0L3 16.5v-2.25\"/>",
  "cursor-arrow-rays": "<path d=\"M15.042 21.672 13.684 16.6m0 0-2.51 2.225.569-9.47 5.227 7.917-3.286-.672ZM12 2.25V4.5m5.834.166-1.591 1.591M20.25 10.5H18M7.757 14.743l-1.59 1.59M6 10.5H3.75m4.007-4.243-1.59-1.59\"/>",
  "document-arrow-down": "<path d=\"M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m.75 12 3 3m0 0 3-3m-3 3v-6m-1.5-9H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z\"/>",
  "document-text": "<path d=\"M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z\"/>",
  "ellipsis-horizontal": "<path d=\"M6.75 12a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0ZM12.75 12a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0ZM18.75 12a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0Z\"/>",
  "exclamation-triangle": "<path d=\"M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z\"/>",
  "eye": "<path d=\"M2.036 12.322a1.012 1.012 0 0 1 0-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178Z\"/> <path d=\"M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z\"/>",
  "face-smile": "<path d=\"M15.182 15.182a4.5 4.5 0 0 1-6.364 0M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0ZM9.75 9.75c0 .414-.168.75-.375.75S9 10.164 9 9.75 9.168 9 9.375 9s.375.336.375.75Zm-.375 0h.008v.015h-.008V9.75Zm5.625 0c0 .414-.168.75-.375.75s-.375-.336-.375-.75.168-.75.375-.75.375.336.375.75Zm-.375 0h.008v.015h-.008V9.75Z\"/>",
  "film": "<path d=\"M3.375 19.5h17.25m-17.25 0a1.125 1.125 0 0 1-1.125-1.125M3.375 19.5h1.5C5.496 19.5 6 18.996 6 18.375m-3.75 0V5.625m0 12.75v-1.5c0-.621.504-1.125 1.125-1.125m18.375 2.625V5.625m0 12.75c0 .621-.504 1.125-1.125 1.125m1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125m0 3.75h-1.5A1.125 1.125 0 0 1 18 18.375M20.625 4.5H3.375m17.25 0c.621 0 1.125.504 1.125 1.125M20.625 4.5h-1.5C18.504 4.5 18 5.004 18 5.625m3.75 0v1.5c0 .621-.504 1.125-1.125 1.125M3.375 4.5c-.621 0-1.125.504-1.125 1.125M3.375 4.5h1.5C5.496 4.5 6 5.004 6 5.625m-3.75 0v1.5c0 .621.504 1.125 1.125 1.125m0 0h1.5m-1.5 0c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125m1.5-3.75C5.496 8.25 6 7.746 6 7.125v-1.5M4.875 8.25C5.496 8.25 6 8.754 6 9.375v1.5m0-5.25v5.25m0-5.25C6 5.004 6.504 4.5 7.125 4.5h9.75c.621 0 1.125.504 1.125 1.125m1.125 2.625h1.5m-1.5 0A1.125 1.125 0 0 1 18 7.125v-1.5m1.125 2.625c-.621 0-1.125.504-1.125 1.125v1.5m2.625-2.625c.621 0 1.125.504 1.125 1.125v1.5c0 .621-.504 1.125-1.125 1.125M18 5.625v5.25M7.125 12h9.75m-9.75 0A1.125 1.125 0 0 1 6 10.875M7.125 12C6.504 12 6 12.504 6 13.125m0-2.25C6 11.496 5.496 12 4.875 12M18 10.875c0 .621-.504 1.125-1.125 1.125M18 10.875c0 .621.504 1.125 1.125 1.125m-2.25 0c.621 0 1.125.504 1.125 1.125m-12 5.25v-5.25m0 5.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125m-12 0v-1.5c0-.621-.504-1.125-1.125-1.125M18 18.375v-5.25m0 5.25v-1.5c0-.621.504-1.125 1.125-1.125M18 13.125v1.5c0 .621.504 1.125 1.125 1.125M18 13.125c0-.621.504-1.125 1.125-1.125M6 13.125v1.5c0 .621-.504 1.125-1.125 1.125M6 13.125C6 12.504 5.496 12 4.875 12m-1.5 0h1.5m-1.5 0c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125M19.125 12h1.5m0 0c.621 0 1.125.504 1.125 1.125v1.5c0 .621-.504 1.125-1.125 1.125m-17.25 0h1.5m14.25 0h1.5\"/>",
  "folder-open": "<path d=\"M3.75 9.776c.112-.017.227-.026.344-.026h15.812c.117 0 .232.009.344.026m-16.5 0a2.25 2.25 0 0 0-1.883 2.542l.857 6a2.25 2.25 0 0 0 2.227 1.932H19.05a2.25 2.25 0 0 0 2.227-1.932l.857-6a2.25 2.25 0 0 0-1.883-2.542m-16.5 0V6A2.25 2.25 0 0 1 6 3.75h3.879a1.5 1.5 0 0 1 1.06.44l2.122 2.12a1.5 1.5 0 0 0 1.06.44H18A2.25 2.25 0 0 1 20.25 9v.776\"/>",
  "globe-alt": "<path d=\"M12 21a9.004 9.004 0 0 0 8.716-6.747M12 21a9.004 9.004 0 0 1-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3m0 0a8.997 8.997 0 0 1 7.843 4.582M12 3a8.997 8.997 0 0 0-7.843 4.582m15.686 0A11.953 11.953 0 0 1 12 10.5c-2.998 0-5.74-1.1-7.843-2.918m15.686 0A8.959 8.959 0 0 1 21 12c0 .778-.099 1.533-.284 2.253m0 0A17.919 17.919 0 0 1 12 16.5c-3.162 0-6.133-.815-8.716-2.247m0 0A9.015 9.015 0 0 1 3 12c0-1.605.42-3.113 1.157-4.418\"/>",
  "hand-thumb-down": "<path d=\"M7.498 15.25H4.372c-1.026 0-1.945-.694-2.054-1.715a12.137 12.137 0 0 1-.068-1.285c0-2.848.992-5.464 2.649-7.521C5.287 4.247 5.886 4 6.504 4h4.016a4.5 4.5 0 0 1 1.423.23l3.114 1.04a4.5 4.5 0 0 0 1.423.23h1.294M7.498 15.25c.618 0 .991.724.725 1.282A7.471 7.471 0 0 0 7.5 19.75 2.25 2.25 0 0 0 9.75 22a.75.75 0 0 0 .75-.75v-.633c0-.573.11-1.14.322-1.672.304-.76.93-1.33 1.653-1.715a9.04 9.04 0 0 0 2.86-2.4c.498-.634 1.226-1.08 2.032-1.08h.384m-10.253 1.5H9.7m8.075-9.75c.01.05.027.1.05.148.593 1.2.925 2.55.925 3.977 0 1.487-.36 2.89-.999 4.125m.023-8.25c-.076-.365.183-.75.575-.75h.908c.889 0 1.713.518 1.972 1.368.339 1.11.521 2.287.521 3.507 0 1.553-.295 3.036-.831 4.398-.306.774-1.086 1.227-1.918 1.227h-1.053c-.472 0-.745-.556-.5-.96a8.95 8.95 0 0 0 .303-.54\"/>",
  "hand-thumb-up": "<path d=\"M6.633 10.25c.806 0 1.533-.446 2.031-1.08a9.041 9.041 0 0 1 2.861-2.4c.723-.384 1.35-.956 1.653-1.715a4.498 4.498 0 0 0 .322-1.672V2.75a.75.75 0 0 1 .75-.75 2.25 2.25 0 0 1 2.25 2.25c0 1.152-.26 2.243-.723 3.218-.266.558.107 1.282.725 1.282m0 0h3.126c1.026 0 1.945.694 2.054 1.715.045.422.068.85.068 1.285a11.95 11.95 0 0 1-2.649 7.521c-.388.482-.987.729-1.605.729H13.48c-.483 0-.964-.078-1.423-.23l-3.114-1.04a4.501 4.501 0 0 0-1.423-.23H5.904m10.598-9.75H14.25M5.904 18.5c.083.205.173.405.27.602.197.4-.078.898-.523.898h-.908c-.889 0-1.713-.518-1.972-1.368a12 12 0 0 1-.521-3.507c0-1.553.295-3.036.831-4.398C3.387 9.953 4.167 9.5 5 9.5h1.053c.472 0 .745.556.5.96a8.958 8.958 0 0 0-1.302 4.665c0 1.194.232 2.333.654 3.375Z\"/>",
  "information-circle": "<path d=\"m11.25 11.25.041-.02a.75.75 0 0 1 1.063.852l-.708 2.836a.75.75 0 0 0 1.063.853l.041-.021M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9-3.75h.008v.008H12V8.25Z\"/>",
  "language": "<path d=\"m10.5 21 5.25-11.25L21 21m-9-3h7.5M3 5.621a48.474 48.474 0 0 1 6-.371m0 0c1.12 0 2.233.038 3.334.114M9 5.25V3m3.334 2.364C11.176 10.658 7.69 15.08 3 17.502m9.334-12.138c.896.061 1.785.147 2.666.257m-4.589 8.495a18.023 18.023 0 0 1-3.827-5.802\"/>",
  "lock-closed": "<path d=\"M16.5 10.5V6.75a4.5 4.5 0 1 0-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 0 0 2.25-2.25v-6.75a2.25 2.25 0 0 0-2.25-2.25H6.75a2.25 2.25 0 0 0-2.25 2.25v6.75a2.25 2.25 0 0 0 2.25 2.25Z\"/>",
  "magnifying-glass": "<path d=\"m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z\"/>",
  "microphone": "<path d=\"M12 18.75a6 6 0 0 0 6-6v-1.5m-6 7.5a6 6 0 0 1-6-6v-1.5m6 7.5v3.75m-3.75 0h7.5M12 15.75a3 3 0 0 1-3-3V4.5a3 3 0 1 1 6 0v8.25a3 3 0 0 1-3 3Z\"/>",
  "paint-brush": "<path d=\"M9.53 16.122a3 3 0 0 0-5.78 1.128 2.25 2.25 0 0 1-2.4 2.245 4.5 4.5 0 0 0 8.4-2.245c0-.399-.078-.78-.22-1.128Zm0 0a15.998 15.998 0 0 0 3.388-1.62m-5.043-.025a15.994 15.994 0 0 1 1.622-3.395m3.42 3.42a15.995 15.995 0 0 0 4.764-4.648l3.876-5.814a1.151 1.151 0 0 0-1.597-1.597L14.146 6.32a15.996 15.996 0 0 0-4.649 4.763m3.42 3.42a6.776 6.776 0 0 0-3.42-3.42\"/>",
  "pause": "<path d=\"M15.75 5.25v13.5m-7.5-13.5v13.5\"/>",
  "pencil-square": "<path d=\"m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0 1 15.75 21H5.25A2.25 2.25 0 0 1 3 18.75V8.25A2.25 2.25 0 0 1 5.25 6H10\"/>",
  "photo": "<path d=\"m2.25 15.75 5.159-5.159a2.25 2.25 0 0 1 3.182 0l5.159 5.159m-1.5-1.5 1.409-1.409a2.25 2.25 0 0 1 3.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 0 0 1.5-1.5V6a1.5 1.5 0 0 0-1.5-1.5H3.75A1.5 1.5 0 0 0 2.25 6v12a1.5 1.5 0 0 0 1.5 1.5Zm10.5-11.25h.008v.008h-.008V8.25Zm.375 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Z\"/>",
  "play": "<path d=\"M5.25 5.653c0-.856.917-1.398 1.667-.986l11.54 6.347a1.125 1.125 0 0 1 0 1.972l-11.54 6.347a1.125 1.125 0 0 1-1.667-.986V5.653Z\"/>",
  "plus": "<path d=\"M12 4.5v15m7.5-7.5h-15\"/>",
  "queue-list": "<path d=\"M3.75 12h16.5m-16.5 3.75h16.5M3.75 19.5h16.5M5.625 4.5h12.75a1.875 1.875 0 0 1 0 3.75H5.625a1.875 1.875 0 0 1 0-3.75Z\"/>",
  "rocket-launch": "<path d=\"M15.59 14.37a6 6 0 0 1-5.84 7.38v-4.8m5.84-2.58a14.98 14.98 0 0 0 6.16-12.12A14.98 14.98 0 0 0 9.631 8.41m5.96 5.96a14.926 14.926 0 0 1-5.841 2.58m-.119-8.54a6 6 0 0 0-7.381 5.84h4.8m2.581-5.84a14.927 14.927 0 0 0-2.58 5.84m2.699 2.7c-.103.021-.207.041-.311.06a15.09 15.09 0 0 1-2.448-2.448 14.9 14.9 0 0 1 .06-.312m-2.24 2.39a4.493 4.493 0 0 0-1.757 4.306 4.493 4.493 0 0 0 4.306-1.758M16.5 9a1.5 1.5 0 1 1-3 0 1.5 1.5 0 0 1 3 0Z\"/>",
  "sparkles": "<path d=\"M9.813 15.904 9 18.75l-.813-2.846a4.5 4.5 0 0 0-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 0 0 3.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 0 0 3.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 0 0-3.09 3.09ZM18.259 8.715 18 9.75l-.259-1.035a3.375 3.375 0 0 0-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 0 0 2.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 0 0 2.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 0 0-2.456 2.456ZM16.894 20.567 16.5 21.75l-.394-1.183a2.25 2.25 0 0 0-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 0 0 1.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 0 0 1.423 1.423l1.183.394-1.183.394a2.25 2.25 0 0 0-1.423 1.423Z\"/>",
  "square-3-stack-3d": "<path d=\"M6.429 9.75 2.25 12l4.179 2.25m0-4.5 5.571 3 5.571-3m-11.142 0L2.25 7.5 12 2.25l9.75 5.25-4.179 2.25m0 0L21.75 12l-4.179 2.25m0 0 4.179 2.25L12 21.75 2.25 16.5l4.179-2.25m11.142 0-5.571 3-5.571-3\"/>",
  "squares-2x2": "<path d=\"M3.75 6A2.25 2.25 0 0 1 6 3.75h2.25A2.25 2.25 0 0 1 10.5 6v2.25a2.25 2.25 0 0 1-2.25 2.25H6a2.25 2.25 0 0 1-2.25-2.25V6ZM3.75 15.75A2.25 2.25 0 0 1 6 13.5h2.25a2.25 2.25 0 0 1 2.25 2.25V18a2.25 2.25 0 0 1-2.25 2.25H6A2.25 2.25 0 0 1 3.75 18v-2.25ZM13.5 6a2.25 2.25 0 0 1 2.25-2.25H18A2.25 2.25 0 0 1 20.25 6v2.25A2.25 2.25 0 0 1 18 10.5h-2.25a2.25 2.25 0 0 1-2.25-2.25V6ZM13.5 15.75a2.25 2.25 0 0 1 2.25-2.25H18a2.25 2.25 0 0 1 2.25 2.25V18A2.25 2.25 0 0 1 18 20.25h-2.25A2.25 2.25 0 0 1 13.5 18v-2.25Z\"/>",
  "star": "<path d=\"M11.48 3.499a.562.562 0 0 1 1.04 0l2.125 5.111a.563.563 0 0 0 .475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 0 0-.182.557l1.285 5.385a.562.562 0 0 1-.84.61l-4.725-2.885a.562.562 0 0 0-.586 0L6.982 20.54a.562.562 0 0 1-.84-.61l1.285-5.386a.562.562 0 0 0-.182-.557l-4.204-3.602a.562.562 0 0 1 .321-.988l5.518-.442a.563.563 0 0 0 .475-.345L11.48 3.5Z\"/>",
  "swatch": "<path d=\"M4.098 19.902a3.75 3.75 0 0 0 5.304 0l6.401-6.402M6.75 21A3.75 3.75 0 0 1 3 17.25V4.125C3 3.504 3.504 3 4.125 3h5.25c.621 0 1.125.504 1.125 1.125v4.072M6.75 21a3.75 3.75 0 0 0 3.75-3.75V8.197M6.75 21h13.125c.621 0 1.125-.504 1.125-1.125v-5.25c0-.621-.504-1.125-1.125-1.125h-4.072M10.5 8.197l2.88-2.88c.438-.439 1.15-.439 1.59 0l3.712 3.713c.44.44.44 1.152 0 1.59l-2.879 2.88M6.75 17.25h.008v.008H6.75v-.008Z\"/>",
  "trash": "<path d=\"m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0\"/>",
  "variable": "<path d=\"M4.745 3A23.933 23.933 0 0 0 3 12c0 3.183.62 6.22 1.745 9M19.5 3c.967 2.78 1.5 5.817 1.5 9s-.533 6.22-1.5 9M8.25 8.885l1.444-.89a.75.75 0 0 1 1.105.402l2.402 7.206a.75.75 0 0 0 1.104.401l1.445-.889m-8.25.75.213.09a1.687 1.687 0 0 0 2.062-.617l4.45-6.676a1.688 1.688 0 0 1 2.062-.618l.213.09\"/>",
  "x-mark": "<path d=\"M6 18 18 6M6 6l12 12\"/>"
};
  function svg(name, cls, extra) {
    var inner = PATHS[name];
    if (!inner) return "";
    return '<svg class="' + (cls || "gi") + '" viewBox="0 0 24 24" fill="none" stroke="currentColor" ' +
      'stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"' +
      (extra ? " " + extra : "") + ">" + inner + "</svg>";
  }
  function upgrade(root) {
    var scope = root || global.document;
    if (!scope || !scope.querySelectorAll) return;
    var nodes = scope.querySelectorAll("[data-hero]:not([data-hero-done])");
    for (var i = 0; i < nodes.length; i += 1) {
      var el = nodes[i];
      var html = svg(el.getAttribute("data-hero"), el.getAttribute("data-hero-class") || "gi gi-action");
      if (!html) continue;
      el.insertAdjacentHTML("afterbegin", html);
      el.setAttribute("data-hero-done", "1");
    }
  }
  global.GhostHero = { paths: PATHS, svg: svg, upgrade: upgrade, has: function (n) { return !!PATHS[n]; } };
  if (global.document) {
    global.GhostBoot.push(function () { upgrade(); });
  }
}(typeof window !== "undefined" ? window : this));
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
/* GHOST runtime profile and release variant switch. This file intentionally
   uses ES5 syntax because it is the first script loaded by every CEP panel. */
(function (global) {
    "use strict";
    var VARIANT = {
        id: "current",
        label: "GHOST for After Effects 2025-2026",
        version: "3.40.2",
        aeRange: "2025 - 2026",
        profile: "full"
    };
    var chromeMajor = (function () {
        try {
            var agent = global.navigator && global.navigator.userAgent || "";
            var match = /Chrome\/(\d+)/.exec(agent);
            return match ? parseInt(match[1], 10) : 999;
        } catch (error) { return 999; }
    }());
    var legacyEngine = chromeMajor < 84;
    var noModernJs = chromeMajor < 80;
    var profile = legacyEngine ? "lite" : (VARIANT.profile || "full");
    var lite = profile === "lite";
    var balanced = profile === "balanced";
    global.GhostVariant = VARIANT;
    global.GHOST_CHROME_MAJOR = chromeMajor;
    global.GHOST_LEGACY_ENGINE = legacyEngine;
    global.GHOST_PERF_PROFILE = lite ? "eco" : (balanced ? "balanced" : "full");
    global.GHOST_DISABLE_BLUR = lite || balanced;
    global.GHOST_REDUCED_MOTION = lite;
    global.GHOST_DISABLE_PREVIEW = lite;
    global.GHOST_RENDER_BATCH = lite ? 12 : (balanced ? 24 : 40);
    function addClass(name) {
        var root = global.document && global.document.documentElement;
        if (root && (" " + root.className + " ").indexOf(" " + name + " ") < 0) {
            root.className += " " + name;
        }
    }
    function injectCss(file, flag) {
        var doc = global.document;
        if (!doc || doc.querySelector('link[data-' + flag + ']')) return;
        var link = doc.createElement("link");
        link.rel = "stylesheet";
        link.href = "css/" + file + "?v=" + VARIANT.version;
        link.setAttribute("data-" + flag, "1");
        (doc.head || doc.documentElement).appendChild(link);
    }
    addClass("ghost-profile-" + profile);
    if (lite) {
        addClass("ghost-lite");
        addClass("ghost-reduced-motion");
        injectCss("ghost-lite.css", "ghost-lite");
    }
    if (legacyEngine) {
        addClass("ghost-legacy");
        injectCss("ghost-legacy-compat.css", "ghost-legacy");
    }
    if (global.GHOST_DISABLE_BLUR) addClass("ghost-no-blur");
    if (noModernJs) {
        global.GHOST_DISABLE_TAILWIND = true;
        addClass("ghost-tw-off");
        injectCss("ghost-tw-static.css", "ghost-tw-static");
        if (!global.tailwind) global.tailwind = { config: {} };
        if (!global.lucide) {
            global.lucide = { createIcons: function () {}, icons: {} };
        }
    }
}(typeof window !== "undefined" ? window : this));
(function(global) {
  "use strict";
  var build = {
    version: "3.41.0",
    edition: "Premium",
    buildDate: "2026-09-01",
    buildId: "3.41.0+20260901.strict-gradient-unlock",
    codename: "Neon Fresh",
    isStable: true
  };
  global.GHOST_BUILD = build;
  global.GhostBuild = build;
})(typeof window !== "undefined" ? window : this);
if (typeof window !== "undefined" && window.__ghostStamp) {
  window.__ghostStamp(
    "ghost-web-link.js",
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
if (typeof window !== "undefined" && window.__ghostStamp) {
  window.__ghostStamp(
    "ghost-mcp-bridge.js",
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
(function() {
  "use strict";
  var PLANS = [
    { id: "free", name: "Free", bn: "ফ্রি", price: 0, year: 0, tokens: "100K", accent: "#8c8c8c" },
    { id: "basic", name: "Basic", bn: "বেসিক", price: 149, year: 1290, tokens: "1M", accent: "#34d399" },
    { id: "pro", name: "Premium", bn: "প্রিমিয়াম", price: 399, year: 3990, tokens: "5M", accent: "#2680eb", popular: true },
    { id: "ultra", name: "Ultra", bn: "আল্ট্রা", price: 999, year: 9990, tokens: "20M", accent: "#a855f7" }
  ];
  var MATRIX = [
    { panel: "Ghost Cache", icon: "◈", note: "Asset library — local + cloud vault", rows: [
      ["Local asset indexing", "1 folder", "5 folders", "Unlimited", "Unlimited"],
      ["Cloud vault downloads", "25 / month", "500 / month", "5,000 / month", "Unlimited"],
      ["Cloud categories", "Icons + Emoji", "Icons, Emoji, Audio, LUTs", "All categories", "All + early drops"],
      ["Premium asset packs", "no", "Limited (5 packs)", "yes", "yes"],
      ["Bookmarks & smart folders", "20 items", "500 items", "Unlimited", "Unlimited"],
      ["AI auto-tagging", "no", "no", "yes", "yes"],
      ["Team shared library", "no", "no", "no", "yes (5 seats)"]
    ] },
    { panel: "Ghost Command", icon: "◇", note: "AI assistant — token হিসেবে খরচ হয়", rows: [
      ["Monthly AI tokens", "100K", "1M", "5M", "20M"],
      ["Fast models (Flash / Groq)", "yes", "yes", "yes", "yes"],
      ["Reasoning models (Pro / Claude / GPT)", "no", "500K tokens", "yes", "yes"],
      ["Expression generator + auto-apply", "5 / day", "50 / day", "Unlimited", "Unlimited"],
      ["Layer-level project access", "Read only", "Read + basic edit", "Full control", "Full control"],
      ["Voice input & transcription", "no", "15 min / month", "3 hours / month", "12 hours / month"],
      ["Chat history & sessions", "3 sessions", "50 sessions", "Unlimited", "Unlimited + export"],
      ["Token top-up purchase", "no", "yes", "yes", "yes (bulk rate)"]
    ] },
    { panel: "Ghostae Text / TOOLKIT", icon: "⌁", note: "Text animation, FFX style, colour plate", rows: [
      ["Text animation presets", "30 of 300+", "150 of 300+", "All 300+", "All + monthly new"],
      ["FFX text styles", "15 styles", "120 styles", "All 305", "All 305"],
      ["Save custom FFX preset", "no", "10 presets", "Unlimited", "Unlimited + share"],
      ["Colour plates", "50 plates", "300 plates", "All 1,000", "All 1,000"],
      ["Gradient rig & colour plates", "no", "Limited", "yes", "yes"],
      ["One-click combos", "3 combos", "20 combos", "All combos", "All + custom"],
      ["Emoji & icon library", "200 items", "1,000 items", "All 1,900+", "All 1,900+"]
    ] },
    { panel: "Ghost Tools", icon: "⚒", note: "Workflow utility, Project Manager, Editor Board", rows: [
      ["Layer Hider, Workspace, Notes", "yes", "yes", "yes", "yes"],
      ["Auto-save & recovery", "5 min only", "Custom interval", "Custom + versions", "Custom + versions"],
      ["Project Manager", "Scan only", "Scan + report", "Scan + backup", "Scan + backup + restore"],
      ["Project backup / collect files", "no", "no", "yes", "yes (batch)"],
      ["Editor Board", "1 board", "10 boards", "Unlimited", "Unlimited"],
      ["SRT import & Caption AI", "SRT import", "SRT + 10 AI captions", "Unlimited AI captions", "Unlimited + storyboard"],
      ["Remove background", "3 / month", "50 / month", "500 / month", "2,000 / month"]
    ] },
    { panel: "SYSTEM & LICENSE", icon: "⇪", note: "Update, device, support, license", rows: [
      ["Activation devices", "1 device", "1 device", "2 devices", "5 devices"],
      ["Patch & version updates", "yes", "yes", "yes", "yes (early access)"],
      ["Cloud sync of settings", "no", "no", "yes", "yes"],
      ["Commercial licence", "no", "no", "yes", "yes (studio-wide)"],
      ["Support", "Community", "Email (72h)", "Priority (24h)", "Priority + call"]
    ] }
  ];
  var TOKEN_PACKS = [
    ["500K tokens", "~150 chat replies", 79],
    ["1.5M tokens", "Most popular top-up", 199],
    ["4M tokens", "Heavy expression + caption work", 449],
    ["10M tokens", "Studio batch jobs", 899]
  ];
  var TOKEN_COSTS = [
    ["Short chat reply (Flash)", "~700 tokens"],
    ["Expression generate + apply", "~1,500 tokens"],
    ["Reasoning answer (Pro / Claude)", "~6,000 tokens"],
    ["1 min audio → caption", "~4,000 tokens"],
    ["Storyboard (10 shots)", "~15,000 tokens"]
  ];
  function esc(s) {
    return String(s).replace(/[&<>"]/g, function(c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c];
    });
  }
  function cell(v) {
    if (v === "yes") return '<span class="gp-yes">✔</span>';
    if (v === "no") return '<span class="gp-no">🔒 Locked</span>';
    var limited = /Limited|only|of \d|\/ (day|month)|^\d/.test(v);
    return '<span class="' + (limited ? "gp-limit" : "gp-ok") + '">' + esc(v) + "</span>";
  }
  function currentPlan() {
    try {
      var s = JSON.parse(localStorage.getItem("ghost.licenseState") || "null");
      if (s && s.plan) return String(s.plan).toLowerCase();
    } catch (e) {
    }
    return localStorage.getItem("ghost.plan") || "free";
  }
  function planCards(cycle) {
    var cur = currentPlan();
    return PLANS.map(function(p) {
      var price = cycle === "yearly" ? p.year : p.price;
      var unlocked = MATRIX.map(function(g) {
        var i = ["free", "basic", "pro", "ultra"].indexOf(p.id) + 1;
        var n = g.rows.filter(function(r) {
          return r[i] !== "no";
        }).length;
        return '<li><span class="gp-pl">' + g.icon + " " + esc(g.panel) + '</span><b style="color:' + (n === g.rows.length ? "#34d399" : "#e0b070") + '">' + n + "/" + g.rows.length + "</b></li>";
      }).join("");
      return '<div class="gp-card' + (p.popular ? " gp-pop" : "") + (cur === p.id ? " gp-current" : "") + '" style="--gp-accent:' + p.accent + '">' + (p.popular ? '<span class="gp-badge">POPULAR</span>' : "") + (cur === p.id ? '<span class="gp-badge gp-badge-cur">YOUR PLAN</span>' : "") + '<div class="gp-name"><i></i>' + p.name + " <em>" + p.bn + '</em></div><div class="gp-price">৳' + price + "<small>/" + (cycle === "yearly" ? "yr" : "mo") + '</small></div><div class="gp-tokens">AI tokens <b>' + p.tokens + ' / mo</b></div><ul class="gp-list">' + unlocked + "</ul></div>";
    }).join("");
  }
  function matrixHtml(active) {
    var tabs = MATRIX.map(function(g2, i) {
      return '<button class="gp-tab' + (i === active ? " is-on" : "") + '" data-tab="' + i + '">' + g2.icon + " " + esc(g2.panel) + "</button>";
    }).join("");
    var g = MATRIX[active];
    var rows = g.rows.map(function(r) {
      return "<tr><td>" + esc(r[0]) + "</td><td>" + cell(r[1]) + "</td><td>" + cell(r[2]) + "</td><td>" + cell(r[3]) + "</td><td>" + cell(r[4]) + "</td></tr>";
    }).join("");
    return '<div class="gp-tabs">' + tabs + '</div><div class="gp-note">' + esc(g.note) + '</div><div class="gp-tablewrap"><table class="gp-table"><thead><tr><th>Feature</th>' + PLANS.map(function(p) {
      return '<th><span style="color:' + p.accent + '">●</span> ' + p.name + "</th>";
    }).join("") + "</tr></thead><tbody>" + rows + '</tbody></table></div><div class="gp-legend"><span class="gp-yes">✔</span> included · <span class="gp-limit">quota limited</span> · <span class="gp-no">🔒 locked</span></div>';
  }
  function tokensHtml() {
    return '<div class="gp-two"><div class="gp-box"><h4>AI token top-up</h4><p>Token শেষ হলে যেকোনো সময় top-up — expire হয় না।</p><table class="gp-table">' + TOKEN_PACKS.map(function(t) {
      return "<tr><td><b>" + t[0] + "</b></td><td>" + esc(t[1]) + '</td><td class="gp-r">৳' + t[2] + "</td></tr>";
    }).join("") + '</table></div><div class="gp-box"><h4>What a token buys</h4><p>গড় খরচ (model অনুযায়ী কম-বেশি হতে পারে)।</p><table class="gp-table">' + TOKEN_COSTS.map(function(t) {
      return "<tr><td>" + esc(t[0]) + '</td><td class="gp-r">' + t[1] + "</td></tr>";
    }).join("") + "</table></div></div>";
  }
  var state = { cycle: "monthly", tab: 0 };
  function render(root) {
    root.querySelector(".gp-cards").innerHTML = planCards(state.cycle);
    root.querySelector(".gp-matrix").innerHTML = matrixHtml(state.tab);
  }
  var PLAN_INFO = {
    free: { name: "Free", price: "৳0", tokens: "100K tokens / month" },
    basic: { name: "Basic", price: "৳149", tokens: "1M tokens / month" },
    pro: { name: "Premium", price: "৳399", tokens: "5M tokens / month" },
    ultra: { name: "Ultra", price: "৳999", tokens: "20M tokens / month" },
    team: { name: "Team", price: "৳1,999", tokens: "Pooled team tokens" }
  };
  function siteUrl(path) {
    var base = window.GhostConfig && window.GhostConfig.baseUrl() || "https://ghostae.com";
    return base + (path || "");
  }
  function openSite(url) {
    try {
      if (window.GhostSystem && window.GhostSystem.openURL) return window.GhostSystem.openURL(url);
      if (typeof CSInterface !== "undefined") return new CSInterface().openURLInDefaultBrowser(url);
    } catch (e) {
    }
    try {
      window.open(url, "_blank");
    } catch (e2) {
    }
  }
  function open() {
    var old = document.getElementById("ghostPlansModal");
    if (old) old.remove();
    var id = currentPlan();
    if (id === "premium") id = "pro";
    var info = PLAN_INFO[id] || PLAN_INFO.free;
    var wrap = document.createElement("div");
    wrap.id = "ghostPlansModal";
    wrap.className = "gp-overlay gp-overlay-mini";
    wrap.innerHTML = '<div class="gp-mini" role="dialog" aria-label="Your plan"><button class="gp-close" aria-label="Close">✕</button><div class="gp-mini-label">Your plan</div><div class="gp-mini-name">' + esc(info.name) + '</div><div class="gp-mini-price">' + esc(info.price) + '<small>/mo</small></div><div class="gp-mini-tokens">' + esc(info.tokens) + '</div><button class="gp-mini-cta" type="button">See pricing</button><button class="gp-mini-support" type="button">Support</button></div>';
    document.body.appendChild(wrap);
    wrap.addEventListener("click", function(e) {
      var t = e.target;
      if (t === wrap || t.classList.contains("gp-close")) {
        wrap.remove();
        return;
      }
      if (t.classList.contains("gp-mini-cta")) {
        openSite(siteUrl("/pricing"));
        wrap.remove();
      }
      if (t.classList.contains("gp-mini-support")) {
        openSite(siteUrl("/support"));
        wrap.remove();
      }
    });
  }
  function bindUpgradeButtons() {
    var btns = document.querySelectorAll(".plan-upgrade-button");
    for (var i = 0; i < btns.length; i++) {
      btns[i].addEventListener("click", open);
    }
  }
  window.GhostPlans = { open, plans: PLANS, matrix: MATRIX, currentPlan };
  window.GhostBoot.push(bindUpgradeButtons);
})();
function CSXSWindowType() {
}
CSXSWindowType._PANEL = "Panel";
CSXSWindowType._MODELESS = "Modeless";
CSXSWindowType._MODAL_DIALOG = "ModalDialog";
EvalScript_ErrMessage = "EvalScript error.";
function Version(major, minor, micro, special) {
  this.major = major;
  this.minor = minor;
  this.micro = micro;
  this.special = special;
}
Version.MAX_NUM = 999999999;
function VersionBound(version, inclusive) {
  this.version = version;
  this.inclusive = inclusive;
}
function VersionRange(lowerBound, upperBound) {
  this.lowerBound = lowerBound;
  this.upperBound = upperBound;
}
function Runtime(name, versionRange) {
  this.name = name;
  this.versionRange = versionRange;
}
function Extension(id, name, mainPath, basePath, windowType, width, height, minWidth, minHeight, maxWidth, maxHeight, defaultExtensionDataXml, specialExtensionDataXml, requiredRuntimeList, isAutoVisible, isPluginExtension) {
  this.id = id;
  this.name = name;
  this.mainPath = mainPath;
  this.basePath = basePath;
  this.windowType = windowType;
  this.width = width;
  this.height = height;
  this.minWidth = minWidth;
  this.minHeight = minHeight;
  this.maxWidth = maxWidth;
  this.maxHeight = maxHeight;
  this.defaultExtensionDataXml = defaultExtensionDataXml;
  this.specialExtensionDataXml = specialExtensionDataXml;
  this.requiredRuntimeList = requiredRuntimeList;
  this.isAutoVisible = isAutoVisible;
  this.isPluginExtension = isPluginExtension;
}
function CSEvent(type, scope, appId, extensionId) {
  this.type = type;
  this.scope = scope;
  this.appId = appId;
  this.extensionId = extensionId;
}
CSEvent.prototype.data = "";
function SystemPath() {
}
SystemPath.USER_DATA = "userData";
SystemPath.COMMON_FILES = "commonFiles";
SystemPath.MY_DOCUMENTS = "myDocuments";
SystemPath.APPLICATION = "application";
SystemPath.EXTENSION = "extension";
SystemPath.HOST_APPLICATION = "hostApplication";
function ColorType() {
}
ColorType.RGB = "rgb";
ColorType.GRADIENT = "gradient";
ColorType.NONE = "none";
function RGBColor(red, green, blue, alpha) {
  this.red = red;
  this.green = green;
  this.blue = blue;
  this.alpha = alpha;
}
function Direction(x, y) {
  this.x = x;
  this.y = y;
}
function GradientStop(offset, rgbColor) {
  this.offset = offset;
  this.rgbColor = rgbColor;
}
function GradientColor(type, direction, numStops, arrGradientStop) {
  this.type = type;
  this.direction = direction;
  this.numStops = numStops;
  this.arrGradientStop = arrGradientStop;
}
function UIColor(type, antialiasLevel, color) {
  this.type = type;
  this.antialiasLevel = antialiasLevel;
  this.color = color;
}
function AppSkinInfo(baseFontFamily, baseFontSize, appBarBackgroundColor, panelBackgroundColor, appBarBackgroundColorSRGB, panelBackgroundColorSRGB, systemHighlightColor) {
  this.baseFontFamily = baseFontFamily;
  this.baseFontSize = baseFontSize;
  this.appBarBackgroundColor = appBarBackgroundColor;
  this.panelBackgroundColor = panelBackgroundColor;
  this.appBarBackgroundColorSRGB = appBarBackgroundColorSRGB;
  this.panelBackgroundColorSRGB = panelBackgroundColorSRGB;
  this.systemHighlightColor = systemHighlightColor;
}
function HostEnvironment(appName, appVersion, appLocale, appUILocale, appId, isAppOnline, appSkinInfo) {
  this.appName = appName;
  this.appVersion = appVersion;
  this.appLocale = appLocale;
  this.appUILocale = appUILocale;
  this.appId = appId;
  this.isAppOnline = isAppOnline;
  this.appSkinInfo = appSkinInfo;
}
function HostCapabilities(EXTENDED_PANEL_MENU, EXTENDED_PANEL_ICONS, DELEGATE_APE_ENGINE, SUPPORT_HTML_EXTENSIONS, DISABLE_FLASH_EXTENSIONS) {
  this.EXTENDED_PANEL_MENU = EXTENDED_PANEL_MENU;
  this.EXTENDED_PANEL_ICONS = EXTENDED_PANEL_ICONS;
  this.DELEGATE_APE_ENGINE = DELEGATE_APE_ENGINE;
  this.SUPPORT_HTML_EXTENSIONS = SUPPORT_HTML_EXTENSIONS;
  this.DISABLE_FLASH_EXTENSIONS = DISABLE_FLASH_EXTENSIONS;
}
function ApiVersion(major, minor, micro) {
  this.major = major;
  this.minor = minor;
  this.micro = micro;
}
function MenuItemStatus(menuItemLabel, enabled, checked) {
  this.menuItemLabel = menuItemLabel;
  this.enabled = enabled;
  this.checked = checked;
}
function ContextMenuItemStatus(menuItemID, enabled, checked) {
  this.menuItemID = menuItemID;
  this.enabled = enabled;
  this.checked = checked;
}
function CSInterface() {
}
CSInterface.THEME_COLOR_CHANGED_EVENT = "com.adobe.csxs.events.ThemeColorChanged";
CSInterface.prototype.hostEnvironment = window.__adobe_cep__ ? JSON.parse(window.__adobe_cep__.getHostEnvironment()) : null;
CSInterface.prototype.getHostEnvironment = function() {
  this.hostEnvironment = JSON.parse(window.__adobe_cep__.getHostEnvironment());
  return this.hostEnvironment;
};
CSInterface.prototype.loadBinAsync = function(urlName, callback) {
  try {
    var xhr = new XMLHttpRequest();
    xhr.responseType = "arraybuffer";
    xhr.open("GET", urlName, true);
    xhr.onerror = function() {
      console.log("Unable to load snapshot from given URL");
      return false;
    };
    xhr.send();
    xhr.onload = () => {
      window.__adobe_cep__.loadSnapshot(xhr.response);
      if (typeof callback === "function") {
        callback();
      } else if (typeof callback !== "undefined") {
        console.log("Provided callback is not a function");
      }
    };
  } catch (err) {
    console.log(err);
    return false;
  }
  return true;
};
CSInterface.prototype.loadBinSync = function(pathName) {
  try {
    var OSVersion = this.getOSInformation();
    if (pathName.startsWith("file://")) {
      if (OSVersion.indexOf("Windows") >= 0) {
        pathName = pathName.replace("file:///", "");
      } else if (OSVersion.indexOf("Mac") >= 0) {
        pathName = pathName.replace("file://", "");
      }
      window.__adobe_cep__.loadSnapshot(pathName);
      return true;
    }
  } catch (err) {
    console.log(err);
    return false;
  }
  return false;
};
CSInterface.prototype.closeExtension = function() {
  window.__adobe_cep__.closeExtension();
};
CSInterface.prototype.getSystemPath = function(pathType) {
  var path = decodeURI(window.__adobe_cep__.getSystemPath(pathType));
  var OSVersion = this.getOSInformation();
  if (OSVersion.indexOf("Windows") >= 0) {
    path = path.replace("file:///", "");
  } else if (OSVersion.indexOf("Mac") >= 0) {
    path = path.replace("file://", "");
  }
  return path;
};
CSInterface.prototype.evalScript = function(script, callback) {
  if (callback === null || callback === void 0) {
    callback = function(result) {
    };
  }
  window.__adobe_cep__.evalScript(script, callback);
};
CSInterface.prototype.getApplicationID = function() {
  var appId = this.hostEnvironment.appId;
  return appId;
};
CSInterface.prototype.getHostCapabilities = function() {
  var hostCapabilities = JSON.parse(window.__adobe_cep__.getHostCapabilities());
  return hostCapabilities;
};
CSInterface.prototype.dispatchEvent = function(event) {
  if (typeof event.data == "object") {
    event.data = JSON.stringify(event.data);
  }
  window.__adobe_cep__.dispatchEvent(event);
};
CSInterface.prototype.addEventListener = function(type, listener, obj) {
  window.__adobe_cep__.addEventListener(type, listener, obj);
};
CSInterface.prototype.removeEventListener = function(type, listener, obj) {
  window.__adobe_cep__.removeEventListener(type, listener, obj);
};
CSInterface.prototype.requestOpenExtension = function(extensionId, params) {
  window.__adobe_cep__.requestOpenExtension(extensionId, params);
};
CSInterface.prototype.getExtensions = function(extensionIds) {
  var extensionIdsStr = JSON.stringify(extensionIds);
  var extensionsStr = window.__adobe_cep__.getExtensions(extensionIdsStr);
  var extensions = JSON.parse(extensionsStr);
  return extensions;
};
CSInterface.prototype.getNetworkPreferences = function() {
  var result = window.__adobe_cep__.getNetworkPreferences();
  var networkPre = JSON.parse(result);
  return networkPre;
};
CSInterface.prototype.initResourceBundle = function() {
  var resourceBundle = JSON.parse(window.__adobe_cep__.initResourceBundle());
  var resElms = document.querySelectorAll("[data-locale]");
  for (var n = 0; n < resElms.length; n++) {
    var resEl = resElms[n];
    var resKey = resEl.getAttribute("data-locale");
    if (resKey) {
      for (var key in resourceBundle) {
        if (key.indexOf(resKey) === 0) {
          var resValue = resourceBundle[key];
          if (key.length == resKey.length) {
            resEl.innerHTML = resValue;
          } else if ("." == key.charAt(resKey.length)) {
            var attrKey = key.substring(resKey.length + 1);
            resEl[attrKey] = resValue;
          }
        }
      }
    }
  }
  return resourceBundle;
};
CSInterface.prototype.dumpInstallationInfo = function() {
  return window.__adobe_cep__.dumpInstallationInfo();
};
CSInterface.prototype.getOSInformation = function() {
  var userAgent = navigator.userAgent;
  if (navigator.platform == "Win32" || navigator.platform == "Windows") {
    var winVersion = "Windows";
    var winBit = "";
    if (userAgent.indexOf("Windows") > -1) {
      if (userAgent.indexOf("Windows NT 5.0") > -1) {
        winVersion = "Windows 2000";
      } else if (userAgent.indexOf("Windows NT 5.1") > -1) {
        winVersion = "Windows XP";
      } else if (userAgent.indexOf("Windows NT 5.2") > -1) {
        winVersion = "Windows Server 2003";
      } else if (userAgent.indexOf("Windows NT 6.0") > -1) {
        winVersion = "Windows Vista";
      } else if (userAgent.indexOf("Windows NT 6.1") > -1) {
        winVersion = "Windows 7";
      } else if (userAgent.indexOf("Windows NT 6.2") > -1) {
        winVersion = "Windows 8";
      } else if (userAgent.indexOf("Windows NT 6.3") > -1) {
        winVersion = "Windows 8.1";
      } else if (userAgent.indexOf("Windows NT 10") > -1) {
        winVersion = "Windows 10";
      }
      if (userAgent.indexOf("WOW64") > -1 || userAgent.indexOf("Win64") > -1) {
        winBit = " 64-bit";
      } else {
        winBit = " 32-bit";
      }
    }
    return winVersion + winBit;
  } else if (navigator.platform == "MacIntel" || navigator.platform == "Macintosh") {
    var result = "Mac OS X";
    if (userAgent.indexOf("Mac OS X") > -1) {
      result = userAgent.substring(userAgent.indexOf("Mac OS X"), userAgent.indexOf(")"));
      result = result.replace(/_/g, ".");
    }
    return result;
  }
  return "Unknown Operation System";
};
CSInterface.prototype.openURLInDefaultBrowser = function(url) {
  return cep.util.openURLInDefaultBrowser(url);
};
CSInterface.prototype.getExtensionID = function() {
  return window.__adobe_cep__.getExtensionId();
};
CSInterface.prototype.getScaleFactor = function() {
  return window.__adobe_cep__.getScaleFactor();
};
if (navigator.appVersion.toLowerCase().indexOf("windows") >= 0) {
  CSInterface.prototype.getMonitorScaleFactor = function() {
    return window.__adobe_cep__.getMonitorScaleFactor();
  };
}
CSInterface.prototype.setScaleFactorChangedHandler = function(handler) {
  window.__adobe_cep__.setScaleFactorChangedHandler(handler);
};
CSInterface.prototype.getCurrentApiVersion = function() {
  var apiVersion = JSON.parse(window.__adobe_cep__.getCurrentApiVersion());
  return apiVersion;
};
CSInterface.prototype.setPanelFlyoutMenu = function(menu) {
  if ("string" != typeof menu) {
    return;
  }
  window.__adobe_cep__.invokeSync("setPanelFlyoutMenu", menu);
};
CSInterface.prototype.updatePanelMenuItem = function(menuItemLabel, enabled, checked) {
  var ret2 = false;
  if (this.getHostCapabilities().EXTENDED_PANEL_MENU) {
    var itemStatus = new MenuItemStatus(menuItemLabel, enabled, checked);
    ret2 = window.__adobe_cep__.invokeSync("updatePanelMenuItem", JSON.stringify(itemStatus));
  }
  return ret2;
};
CSInterface.prototype.setContextMenu = function(menu, callback) {
  if ("string" != typeof menu) {
    return;
  }
  window.__adobe_cep__.invokeAsync("setContextMenu", menu, callback);
};
CSInterface.prototype.setContextMenuByJSON = function(menu, callback) {
  if ("string" != typeof menu) {
    return;
  }
  window.__adobe_cep__.invokeAsync("setContextMenuByJSON", menu, callback);
};
CSInterface.prototype.updateContextMenuItem = function(menuItemID, enabled, checked) {
  var itemStatus = new ContextMenuItemStatus(menuItemID, enabled, checked);
  ret = window.__adobe_cep__.invokeSync("updateContextMenuItem", JSON.stringify(itemStatus));
};
CSInterface.prototype.isWindowVisible = function() {
  return window.__adobe_cep__.invokeSync("isWindowVisible", "");
};
CSInterface.prototype.resizeContent = function(width, height) {
  window.__adobe_cep__.resizeContent(width, height);
};
CSInterface.prototype.registerInvalidCertificateCallback = function(callback) {
  return window.__adobe_cep__.registerInvalidCertificateCallback(callback);
};
CSInterface.prototype.registerKeyEventsInterest = function(keyEventsInterest) {
  return window.__adobe_cep__.registerKeyEventsInterest(keyEventsInterest);
};
CSInterface.prototype.setWindowTitle = function(title) {
  window.__adobe_cep__.invokeSync("setWindowTitle", title);
};
CSInterface.prototype.getWindowTitle = function() {
  return window.__adobe_cep__.invokeSync("getWindowTitle", "");
};
if (typeof window !== "undefined" && window.__ghostStamp) {
  window.__ghostStamp(
    "ghost-cloud.js",
    "3.40.2+20260829.ui-perfect"
  );
}
(function(global) {
  "use strict";
  var BUILD = global.GHOST_BUILD && global.GHOST_BUILD.buildId || "dev";
  if (global.__ghostStamp) global.__ghostStamp("js/ghost-cloud.js", BUILD);
  var DEFAULT_BASE = global.GhostConfig && global.GhostConfig.DEFAULT_BASE || "";
  var LS = {
    base: "ghost.cloud.baseUrl",
    key: "ghost.cloud.licenseKey",
    state: "ghost.cloud.licenseState",
    config: "ghost.cloud.config",
    assets: "ghost.cloud.assetCache",
    device: "ghost.cloud.deviceId"
  };
  function read(k, fallback) {
    try {
      var v = global.GhostStorage && global.GhostStorage.get
        ? global.GhostStorage.get(k, null)
        : global.localStorage.getItem(k);
      return v === null ? fallback : JSON.parse(v);
    } catch (e) {
      return fallback;
    }
  }
  function write(k, v) {
    try {
      var serialized = JSON.stringify(v);
      if (global.GhostStorage && global.GhostStorage.set) global.GhostStorage.set(k, serialized);
      else global.localStorage.setItem(k, serialized);
    } catch (e) {
    }
  }
  function drop(k) {
    try {
      if (global.GhostStorage && global.GhostStorage.remove) global.GhostStorage.remove(k);
      else global.localStorage.removeItem(k);
    } catch (e) {
    }
  }
  var SHARED_DIR = null;
  var nodeFs = null;
  var nodePath = null;
  var nodeOs = null;
  try {
    var nodeRequire = global.cep_node && global.cep_node.require ? global.cep_node.require : typeof require === "function" ? require : null;
    if (nodeRequire) {
      nodeFs = nodeRequire("fs");
      nodePath = nodeRequire("path");
      nodeOs = nodeRequire("os");
    }
  } catch (e) {
    nodeFs = null;
  }
  function sharedDir() {
    if (SHARED_DIR !== null) return SHARED_DIR;
    SHARED_DIR = "";
    try {
      var base = "";
      if (nodeFs && nodePath && nodeOs) {
        base = nodePath.join(nodeOs.homedir(), "Documents", "Ghostae", "License");
        if (!nodeFs.existsSync(base)) nodeFs.mkdirSync(base, { recursive: true });
      }
      if (!base) {
        var cs = new global.CSInterface();
        base = cs.getSystemPath ? cs.getSystemPath("userData") : "";
      }
      if (base) {
        var dir = nodeFs ? base : base.replace(/[\\/]+$/, "") + "/GHOST";
        if (global.cep && global.cep.fs) {
          var stat = global.cep.fs.stat(dir);
          if (!stat || stat.err) global.cep.fs.makedir(dir);
        }
        SHARED_DIR = dir;
      }
    } catch (e) {
      SHARED_DIR = "";
    }
    return SHARED_DIR;
  }
  function sharedFile() {
    var dir = sharedDir();
    return dir ? dir + "/activation.json" : "";
  }
  function sharedRead() {
    try {
      var file = sharedFile();
      if (!file) return null;
      var data = "";
      if (nodeFs && nodeFs.existsSync(file)) data = nodeFs.readFileSync(file, "utf8");
      else if (global.cep && global.cep.fs) {
        var res = global.cep.fs.readFile(file);
        if (res && !res.err) data = res.data || "";
      }
      if (!data) return null;
      var parsed = JSON.parse(data);
      return parsed && typeof parsed === "object" ? parsed : null;
    } catch (e) {
      return null;
    }
  }
  function sharedWrite(payload) {
    try {
      var file = sharedFile();
      if (!file) return false;
      if (nodeFs) nodeFs.writeFileSync(file, JSON.stringify(payload), "utf8");
      else if (global.cep && global.cep.fs) global.cep.fs.writeFile(file, JSON.stringify(payload));
      else return false;
      return true;
    } catch (e) {
      return false;
    }
  }
  var HARD_REASONS = { not_found: true, revoked: true, suspended: true, expired: true, device_revoked: true, no_key: true };
  function sharedClear() {
    try {
      var file = sharedFile();
      if (file && nodeFs && nodeFs.existsSync(file)) nodeFs.unlinkSync(file);
      else if (file && global.cep && global.cep.fs) global.cep.fs.deleteFile(file);
    } catch (e) {
    }
  }
  function pushShared() {
    sharedWrite({
      licenseKey: read(LS.key, ""),
      state: read(LS.state, null),
      device: read(LS.device, null),
      base: read(LS.base, DEFAULT_BASE),
      savedAt: Date.now()
    });
  }
  function pullShared() {
    var shared = sharedRead();
    if (!shared) return false;
    if (shared.device && !read(LS.device, null)) write(LS.device, shared.device);
    if (shared.base) write(LS.base, shared.base);
    var localKey = read(LS.key, "");
    var localState = read(LS.state, null);
    var sharedNewer = !localState || !localState.checkedAt || (shared.state && shared.state.checkedAt || 0) > localState.checkedAt;
    if (shared.licenseKey && (!localKey || sharedNewer)) {
      write(LS.key, shared.licenseKey);
      if (shared.state) write(LS.state, shared.state);
      return true;
    }
    return false;
  }
  function hash(str) {
    var h = 2166136261;
    for (var i = 0; i < str.length; i++) {
      h ^= str.charCodeAt(i);
      h = h + ((h << 1) + (h << 4) + (h << 7) + (h << 8) + (h << 24)) >>> 0;
    }
    return ("00000000" + h.toString(16)).slice(-8);
  }
  function fingerprint() {
    var cached = read(LS.device, null);
    if (cached) return cached;
    var parts = [];
    try {
      var cs = new global.CSInterface();
      var info = cs.getHostEnvironment() || {};
      parts.push(cs.getOSInformation());
      parts.push(cs.getSystemPath ? cs.getSystemPath("userData") : "");
    } catch (e) {
      parts.push("no-cep");
    }
    var seed = parts.join("|");
    var id = "ghost-" + hash(seed) + hash(seed.split("").reverse().join("")) + hash(seed + "ghost-device");
    write(LS.device, id);
    return id;
  }
  function baseUrl() {
    if (global.GhostConfig && global.GhostConfig.baseUrl) return global.GhostConfig.baseUrl();
    var stored = read(LS.base, "");
    if (stored && /hi-there-buddy-4063|lovableproject\.com|id-preview--/.test(stored)) {
      drop(LS.base);
      stored = "";
    }
    return stored || DEFAULT_BASE;
  }
  function reportClientError(message, source) {
    try {
      if (global.__GHOST_ERRORS__ && global.__GHOST_ERRORS__.push) {
        global.__GHOST_ERRORS__.push(message, source || "ghost-cloud");
      } else if (global.console && console.error) {
        console.error("[GHOST] " + message);
      }
    } catch (e) {
    }
  }
  function request(method, path, body) {
    return new Promise(function(resolve, reject) {
      var xhr = new XMLHttpRequest();
      xhr.open(method, baseUrl() + path, true);
      xhr.timeout = 2e4;
      xhr.setRequestHeader("Content-Type", "application/json");
      xhr.setRequestHeader("X-Ghost-Version", global.GHOST_BUILD && global.GHOST_BUILD.version || "0.0.0");
      xhr.setRequestHeader("X-Ghost-Device", fingerprint());
      /* Activation must not depend on a successful storage round-trip. Some
         CEP sandboxes expose read-only storage; the request body still carries
         the key and is also used for the compatibility header. */
      var key = body && body.license_key ? String(body.license_key) : read(LS.key, "");
      if (key) xhr.setRequestHeader("X-Ghost-Key", key);
      xhr.onload = function() {
        var parsed = null;
        try {
          parsed = JSON.parse(xhr.responseText);
        } catch (e) {
        }
        if (!parsed) {
          try {
            console.error("[GHOST] Bad response", method, path, xhr.status, String(xhr.responseText || "").slice(0, 200));
          } catch (e3) {
          }
          var bad = new Error("Bad response from GHOST Cloud (" + xhr.status + ")");
          bad.code = xhr.status >= 500 ? "server_error" : "bad_response";
          reportClientError(bad.message, method + " " + path);
          return reject(bad);
        }
        if (xhr.status >= 400 || parsed.ok === false) {
          try {
            console.error("[GHOST] API error", method, path, xhr.status, parsed && parsed.error);
          } catch (e2) {
          }
          var err = new Error(parsed.error && parsed.error.message || "HTTP " + xhr.status);
          err.code = parsed.error && parsed.error.code;
          err.status = xhr.status;
          reportClientError(err.code + ": " + err.message, method + " " + path);
          return reject(err);
        }
        resolve(parsed);
      };
      xhr.onerror = function() {
        var err = new Error("network_unreachable");
        err.code = "network_unreachable";
        reportClientError("network_unreachable", method + " " + path);
        reject(err);
      };
      xhr.ontimeout = function() {
        var err = new Error("network_timeout");
        err.code = "network_timeout";
        reportClientError("network_timeout", method + " " + path);
        reject(err);
      };
      try {
        xhr.send(body ? JSON.stringify(body) : null);
      } catch (sendError) {
        sendError.code = sendError.code || "request_send_failed";
        reportClientError(sendError.message || "request_send_failed", method + " " + path);
        reject(sendError);
      }
    });
  }
  function state() {
    return read(LS.state, { valid: false, plan: null, reason: "unknown", checkedAt: 0 });
  }
  var SESSION_VERIFIED = false;
  function graceHours() {
    var cfg = read(LS.config, {});
    var hb = cfg.core && cfg.core.heartbeat;
    return hb && hb.graceHours || 72;
  }
  function withinGrace() {
    var s = state();
    if (!s.valid || !s.checkedAt) return false;
    return Date.now() - s.checkedAt < graceHours() * 3600 * 1e3;
  }
  function purgePremium(keys) {
    (keys || []).forEach(function(name) {
      drop("ghost.premium." + name);
    });
    drop(LS.assets);
  }
  /* Plan entitlements → concrete controls. The server sends the module list for
     the active plan; these selectors are the panel surfaces they cover. */
  var MODULE_SELECTORS = {
    "removebg": '#removeBgRunBtn, [data-tool="removebg"] .primary-button, #removeBgBtn',
    "storyboard.ai": "#boardGenerateBtn, #storyboardGenerateBtn",
    "tools.backup": '#pmBackupBtn, #pmOpenBackup, [data-pm-action="backup"], [data-pm-action="restore"]',
    "text.ffx.custom": "#ffxSaveButton",
    "template.full": '#templateImportBtn, [data-template-action="import"], [data-template-action="render"]',
    "cloud.premium": '[data-access="premium"], .asset-card.is-premium',
    "command.reasoning": '[data-model-tier="reasoning"]',
    "team.share": '[data-team-share]'
  };
  function planNotice() {
    try {
      var plan = (state().plan || "free").toString();
      var msg = "This is a premium feature — your current plan is " + plan.toUpperCase() + ". Upgrade at ghostae.com/pricing.";
      if (global.GhostToast && global.GhostToast.show) global.GhostToast.show(msg);
      else if (global.alert) global.alert(msg);
    } catch (e) {
    }
  }
  function applySelectorLocks(set) {
    var licensed = Cloud.isLicensed();
    Object.keys(MODULE_SELECTORS).forEach(function(mod) {
      var nodes;
      try {
        nodes = document.querySelectorAll(MODULE_SELECTORS[mod]);
      } catch (e) {
        return;
      }
      var blocked = !licensed || set[mod] === true;
      for (var i = 0; i < nodes.length; i++) {
        var node = nodes[i];
        node.classList.toggle("ghost-locked", blocked);
        node.setAttribute("data-premium", mod);
        if (blocked) {
          node.setAttribute("aria-disabled", "true");
          if (!node.__ghostPlanGuard) {
            node.__ghostPlanGuard = function(e) {
              if (node.classList.contains("ghost-locked")) {
                e.preventDefault();
                e.stopPropagation();
                planNotice();
              }
            };
            node.addEventListener("click", node.__ghostPlanGuard, true);
          }
        } else {
          node.removeAttribute("aria-disabled");
        }
      }
    });
  }
  function applyLock(locked) {
    var set = {};
    (locked || []).forEach(function(m) {
      set[m] = true;
    });
    Cloud.lockedModules = set;
    try {
      document.body.setAttribute("data-ghost-licensed", Cloud.isLicensed() ? "1" : "0");
      var nodes = document.querySelectorAll("[data-premium]");
      for (var i = 0; i < nodes.length; i++) {
        var mod = nodes[i].getAttribute("data-premium");
        var blocked = !Cloud.isLicensed() || set[mod] === true;
        nodes[i].classList.toggle("ghost-locked", blocked);
        if (blocked) nodes[i].setAttribute("aria-disabled", "true");
        else nodes[i].removeAttribute("aria-disabled");
      }
    } catch (e) {
    }
    applySelectorLocks(set);
    emit("lockchange", { locked: set, licensed: Cloud.isLicensed() });
  }
  var listeners = {};
  function emit(name, detail) {
    (listeners[name] || []).forEach(function(fn) {
      try {
        fn(detail);
      } catch (e) {
      }
    });
  }
  var Cloud = {
    lockedModules: {},
    setBaseUrl: function(url) {
      write(LS.base, String(url || DEFAULT_BASE).replace(/\/+$/, ""));
    },
    getBaseUrl: baseUrl,
    deviceId: fingerprint,
    licenseKey: function() {
      return read(LS.key, "");
    },
    state,
    config: function() {
      return read(LS.config, {});
    },
    request,
    stock: function(opts) {
      opts = opts || {};
      var q = [
        "q=" + encodeURIComponent(opts.q || ""),
        "source=" + encodeURIComponent(opts.source || "pexels"),
        "type=" + encodeURIComponent(opts.type || "photo"),
        "limit=" + encodeURIComponent(opts.limit || 18)
      ].join("&");
      return request("GET", "/api/public/v1/stock/search?" + q).then(function(res) {
        return res && res.items || [];
      });
    },
    on: function(name, fn) {
      listeners[name] = listeners[name] || [];
      listeners[name].push(fn);
    },
    isLicensed: function() {
      return SESSION_VERIFIED && global.GHOST_LICENSE_BLOCKED !== true;
    },
    can: function(moduleName) {
      if (!Cloud.isLicensed()) return false;
      return Cloud.lockedModules[moduleName] !== true;
    },
    activate: function(licenseKey) {
      var normalizedKey = String(licenseKey || "").trim().toUpperCase();
      write(LS.key, normalizedKey);
      return request("POST", "/api/public/v1/license/activate", {
        license_key: normalizedKey,
        device_fingerprint: fingerprint(),
        platform: global.navigator ? global.navigator.platform : "unknown",
        hostname: "after-effects"
      }).then(function(res) {
        SESSION_VERIFIED = true;
        write(LS.state, {
          valid: true,
          plan: res.license.plan,
          reason: "ok",
          seats: res.license.seats,
          expiresAt: res.license.expires_at,
          checkedAt: Date.now()
        });
        emit("activated", res.license);
        return Cloud.sync();
      });
    },
    verify: function() {
      if (!Cloud.licenseKey()) {
        SESSION_VERIFIED = false;
        write(LS.state, { valid: false, reason: "no_key", checkedAt: Date.now() });
        applyLock(null);
        return Promise.resolve(state());
      }
      return request("POST", "/api/public/v1/license/verify", {
        license_key: Cloud.licenseKey(),
        device_fingerprint: fingerprint()
      }).then(function(res) {
        var valid = !!(res.license && res.license.valid);
        SESSION_VERIFIED = valid;
        write(LS.state, {
          valid,
          plan: res.license.plan || null,
          reason: res.license.reason,
          seats: res.license.seats,
          expiresAt: res.license.expires_at,
          checkedAt: Date.now()
        });
        if (!valid && HARD_REASONS[String(res.license.reason)]) {
          purgePremium(["cache", "ffx", "history"]);
          sharedClear();
          emit("revoked", res.license);
        } else if (!valid) {
          emit("attention", res.license);
        }
        return state();
      }).catch(function(err) {
        emit("offline", err);
        if (!withinGrace()) {
          var s = state();
          s.valid = false;
          s.reason = "offline_grace_expired";
          write(LS.state, s);
        }
        return state();
      });
    },
    adoptShared: function() {
      return pullShared();
    },
    deactivateLocal: function() {
      SESSION_VERIFIED = false;
      drop(LS.key);
      drop(LS.state);
      purgePremium(["cache", "ffx", "history"]);
      sharedClear();
      applyLock(null);
      emit("deactivated", {});
    },
    sync: function() {
      return request("GET", "/api/public/v1/sync/config").then(function(res) {
        write(LS.config, res.config || {});
        if (res.purge && res.purge.length) purgePremium(res.purge);
        applyLock(res.locked_modules);
        var accent = res.config && res.config.ui && res.config.ui.accent;
        if (accent && accent.color) {
          try {
            document.documentElement.style.setProperty("--ghost-accent", accent.color);
          } catch (e) {
          }
        }
        emit("sync", res);
        return res;
      }).catch(function(err) {
        emit("syncerror", err);
        return null;
      });
    },
    assets: function(opts) {
      opts = opts || {};
      var q = [];
      if (opts.slug) q.push("slug=" + encodeURIComponent(opts.slug));
      if (opts.type) q.push("type=" + encodeURIComponent(opts.type));
      if (opts.q) q.push("q=" + encodeURIComponent(opts.q));
      if (opts.category) q.push("category=" + encodeURIComponent(opts.category));
      if (opts.pack) q.push("pack=" + encodeURIComponent(opts.pack));
      if (opts.limit) q.push("limit=" + encodeURIComponent(opts.limit));
      if (opts.offset) q.push("offset=" + encodeURIComponent(opts.offset));
      var path = "/api/public/v1/assets/fetch" + (q.length ? "?" + q.join("&") : "");
      return request("GET", path).then(function(res) {
        var cache = read(LS.assets, {});
        (res.assets || []).forEach(function(a) {
          var meta = {};
          for (var key in a) {
            if (Object.prototype.hasOwnProperty.call(a, key) && key !== "url") meta[key] = a[key];
          }
          cache[a.slug || a.id] = { meta, cachedAt: Date.now() };
        });
        write(LS.assets, cache);
        res.assets = res.assets || [];
        Cloud._lastAssetTotal = res.total || res.assets.length;
        return res.assets;
      });
    },
    /**
     * Cloud taxonomy: every pack with its categories and counts.
     * Cached for 12 hours so the library opens instantly offline.
     */
    assetFacets: function(force) {
      var cached = read("ghost.cloud.facets", null);
      if (!force && cached && cached.at && Date.now() - cached.at < 432e5 && cached.packs && cached.packs.length) {
        return Promise.resolve(cached.packs);
      }
      return request("GET", "/api/public/v1/assets/facets").then(function(res) {
        var packs = res && res.packs || [];
        if (packs.length) write("ghost.cloud.facets", { at: Date.now(), packs });
        return packs;
      }).catch(function() {
        return cached && cached.packs || [];
      });
    },
    /**
     * Cloud FFX text styles — real .ffx presets with rendered PNG previews.
     * Signed URLs expire, so the list is cached for 15 minutes only and the
     * panel always re-fetches before installing a preset.
     */
    textStyles: function(force) {
      var cached = read("ghost.cloud.textStyles", null);
      if (!force && cached && cached.at && Date.now() - cached.at < 9e5 && cached.styles) {
        return Promise.resolve(cached.styles);
      }
      return request("GET", "/api/public/v1/text-styles").then(function(res) {
        var styles = res && res.styles || [];
        write("ghost.cloud.textStyles", { at: Date.now(), styles });
        return styles;
      }).catch(function() {
        return cached && cached.styles || [];
      });
    },
    searchAssets: function(opts) {
      return Cloud.assets(opts).then(function(assets) {
        if (assets.length || Cloud.isLicensed()) {
          return { assets, total: Cloud._lastAssetTotal || assets.length };
        }
        var limit = Math.min(Number(opts && opts.limit || 36), 36);
        return request("GET", "/api/public/v1/assets/showcase?limit=" + limit).then(function(res) {
          var rows = (res.assets || []).filter(function(a) {
            if (opts && opts.type && a.type !== opts.type) return false;
            if (opts && opts.pack && a.pack !== opts.pack) return false;
            if (opts && opts.category && a.category !== opts.category) return false;
            if (opts && opts.q && String(a.title || "").toLowerCase().indexOf(String(opts.q).toLowerCase()) < 0) return false;
            return true;
          }).map(function(a, index) {
            return {
              id: "showcase-" + index,
              slug: String(a.title || "asset").toLowerCase().replace(/[^a-z0-9]+/g, "-"),
              title: a.title,
              type: a.type,
              access_level: "preview",
              meta: { pack: a.pack, category: a.category, file_name: a.title + "." + String(a.ext || "png").toLowerCase() },
              url: a.url,
              preview_only: true
            };
          });
          return { assets: rows, total: rows.length, previewOnly: true };
        });
      });
    },
    cachedAssets: function() {
      return read(LS.assets, {});
    },
    /* ---------------- GHOST Vault (external asset library) ----------------
       Served through our own backend so the vault API key never reaches the
       panel. Facets are cached for 6 hours so the browser opens instantly. */
    vaultFacets: function(force) {
      var cached = read("ghost.vault.facets", null);
      if (!force && cached && cached.at && Date.now() - cached.at < 216e5 && cached.facets) {
        return Promise.resolve(cached.facets);
      }
      return request("GET", "/api/public/v1/vault/facets").then(function(res) {
        var facets = {
          id: res.pack && res.pack.id || "vault",
          label: res.pack && res.pack.label || "GHOST Vault",
          total: Number(res.total || 0) || 0,
          expected: Number(res.expected || 0) || 0,
          bytes: Number(res.bytes || 0) || 0,
          partial: !!res.partial,
          updatedAt: res.updatedAt || null,
          categories: res.categories || []
        };
        write("ghost.vault.facets", { at: Date.now(), facets });
        Cloud._vaultTotals = facets;
        return facets;
      }).catch(function() {
        Cloud._vaultTotals = cached && cached.facets || null;
        return Cloud._vaultTotals;
      });
    },
    vaultTotals: function() {
      return Cloud._vaultTotals || null;
    },
    vaultSearch: function(opts) {
      opts = opts || {};
      var q = [];
      if (opts.q) q.push("q=" + encodeURIComponent(opts.q));
      if (opts.category) q.push("category=" + encodeURIComponent(opts.category));
      if (opts.kind) q.push("kind=" + encodeURIComponent(opts.kind));
      q.push("limit=" + encodeURIComponent(opts.limit || 120));
      q.push("offset=" + encodeURIComponent(opts.offset || 0));
      return request("GET", "/api/public/v1/vault/search?" + q.join("&")).then(function(res) {
        var assets = (res.assets || []).map(function(a) {
          return {
            id: a.id,
            slug: a.slug,
            title: a.name,
            type: a.asset_type || a.kind || "file",
            size_bytes: a.size_bytes || 0,
            url: a.url,
            thumb_url: a.preview_url || null,
            source: "vault",
            meta: {
              pack: "vault",
              category: a.category || "general",
              category_label: a.category_label || "",
              file_name: a.file_name || a.name
            }
          };
        });
        return {
          assets,
          total: Number(res.total || assets.length) || 0,
          bytes: Number(res.bytes || 0) || 0,
          grandTotal: Number(res.grandTotal || 0) || 0
        };
      });
    },
    vaultSync: function(pages, force) {
      var path = "/api/public/v1/vault/sync?pages=" + (pages || 6) + (force ? "&force=1" : "");
      return request("POST", path).catch(function() {
        return null;
      });
    },
    votes: function() {
      return read("ghost.feedback.votes", {});
    },
    vote: function(opts) {
      opts = opts || {};
      var kind = opts.kind || "animation";
      var name = String(opts.name || "");
      var choice = opts.vote === "down" ? "down" : "up";
      var store = read("ghost.feedback.votes", {});
      store[kind + "::" + name] = { vote: choice, at: Date.now() };
      write("ghost.feedback.votes", store);
      return request("POST", "/api/public/v1/feedback/vote", {
        preset_name: name,
        preset_kind: kind,
        panel: opts.panel || "ghost-text",
        vote: choice
      }).then(function(res) {
        emit("vote", { name, kind, vote: choice, up: res.up, down: res.down });
        return res;
      }).catch(function(err) {
        var queue = read("ghost.feedback.queue", []);
        queue.push({ type: "vote", name, kind, panel: opts.panel || "ghost-text", vote: choice });
        write("ghost.feedback.queue", queue.slice(-200));
        throw err;
      });
    },
    report: function(opts) {
      opts = opts || {};
      var payload = {
        panel: opts.panel || "unknown",
        message: String(opts.message || "").trim(),
        contact: opts.contact || "",
        severity: opts.severity || "issue"
      };
      return request("POST", "/api/public/v1/feedback/report", payload).catch(function(err) {
        var queue = read("ghost.feedback.queue", []);
        queue.push({ type: "report", payload });
        write("ghost.feedback.queue", queue.slice(-200));
        throw err;
      });
    },
    runtimeReport: function(opts) {
      opts = opts || {};
      return request("POST", "/api/public/v1/runtime-report", {
        panel: opts.panel || (typeof document !== "undefined" && document.title) || "unknown",
        message: String(opts.message || "Unknown runtime error").slice(0, 1200),
        source: String(opts.source || "").slice(0, 300),
        line: Number(opts.line || 0) || 0,
        column: Number(opts.column || 0) || 0,
        stack: String(opts.stack || "").slice(0, 3000),
        chrome: Number(global.GHOST_CHROME_MAJOR || 0) || 0,
        variant: global.GhostVariant && global.GhostVariant.id || "unknown"
      }).catch(function() { return null; });
    },
    flushFeedback: function() {
      var queue = read("ghost.feedback.queue", []);
      if (!queue.length) return Promise.resolve(0);
      write("ghost.feedback.queue", []);
      var sent = 0;
      return queue.reduce(function(chain, item) {
        return chain.then(function() {
          var p = item.type === "report" ? request("POST", "/api/public/v1/feedback/report", item.payload) : request("POST", "/api/public/v1/feedback/vote", {
            preset_name: item.name,
            preset_kind: item.kind,
            panel: item.panel,
            vote: item.vote
          });
          return p.then(function() {
            sent++;
          }).catch(function() {
            var q = read("ghost.feedback.queue", []);
            q.push(item);
            write("ghost.feedback.queue", q);
          });
        });
      }, Promise.resolve()).then(function() {
        return sent;
      });
    },
    start: function() {
      applyLock(read(LS.config, {}).premium ? null : null);
      var tick = function() {
        Cloud.verify().then(function() {
          Cloud.flushFeedback();
          return Cloud.sync();
        });
      };
      tick();
      var cfg = read(LS.config, {});
      var hb = cfg.core && cfg.core.heartbeat && cfg.core.heartbeat.intervalSeconds || 900;
      if (Cloud._timer) clearInterval(Cloud._timer);
      Cloud._timer = setInterval(tick, Math.max(hb, 300) * 1e3);
      return Cloud;
    }
  };
  global.GhostCloud = Cloud;
  var reporting = false;
  global.addEventListener("error", function(event) {
    if (reporting) return;
    reporting = true;
    Cloud.runtimeReport({
      message: event && event.message,
      source: event && event.filename,
      line: event && event.lineno,
      column: event && event.colno,
      stack: event && event.error && event.error.stack
    }).then(function() { reporting = false; });
  });
  global.addEventListener("unhandledrejection", function(event) {
    if (reporting) return;
    var reason = event && event.reason;
    reporting = true;
    Cloud.runtimeReport({ message: reason && reason.message || String(reason || "Unhandled promise rejection"), stack: reason && reason.stack }).then(function() { reporting = false; });
  });
})(typeof window !== "undefined" ? window : this);
if (typeof window !== "undefined" && window.__ghostStamp) {
  window.__ghostStamp(
    "ghost-connect.js",
    "3.40.2+20260829.ui-perfect"
  );
}
(function(global) {
  "use strict";
  var SERVICES = ["cache", "assistant", "command"];
  var LABEL = {
    cache: "GHOST Cache",
    assistant: "GHOST AI Assistant",
    command: "GHOST Command"
  };
  var state = {
    online: false,
    mode: "offline",
    checkedAt: 0,
    providers: {},
    services: {}
  };
  SERVICES.forEach(function(id) {
    state.services[id] = { id, label: LABEL[id], connected: true, mode: "offline" };
  });
  var listeners = [];
  function emit() {
    var snapshot = Connect.snapshot();
    listeners.forEach(function(fn) {
      try {
        fn(snapshot);
      } catch (e) {
      }
    });
    try {
      var evt = document.createEvent("Event");
      evt.initEvent("ghost-connection", true, false);
      evt.detail = snapshot;
      document.dispatchEvent(evt);
    } catch (e) {
    }
    paint();
  }
  function apply(online) {
    state.online = !!online;
    state.mode = online ? "online" : "offline";
    state.checkedAt = Date.now();
    SERVICES.forEach(function(id) {
      state.services[id].connected = true;
      state.services[id].mode = state.mode;
    });
    emit();
  }
  function chip() {
    var el = document.getElementById("ghostConnectChip");
    if (el) return el;
    var host = document.querySelector(".header-control-capsule") || document.querySelector(".brand-row") || document.querySelector(".sidebar-topbar");
    if (!host) return null;
    el = document.createElement("div");
    el.id = "ghostConnectChip";
    el.className = "ghost-connect-chip is-checking";
    el.setAttribute("role", "status");
    el.innerHTML = '<span class="gcc-dot" aria-hidden="true"></span><span class="gcc-text">Connecting…</span>';
    el.title = "GHOST Cache · AI Assistant · Command";
    if (host.firstChild) {
      host.insertBefore(el, host.firstChild);
    } else {
      host.appendChild(el);
    }
    return el;
  }
  function paint() {
    var el = chip();
    if (!el) return;
    var text = el.querySelector(".gcc-text");
    el.classList.remove("is-checking", "is-online", "is-offline");
    el.classList.add(state.online ? "is-online" : "is-offline");
    if (text) text.textContent = state.online ? "Connected" : "Connected (Offline Mode)";
    el.title = SERVICES.map(function(id) {
      return LABEL[id] + ": connected" + (state.online ? "" : " (offline)");
    }).join("\n");
  }
  var timer = null;
  function probe() {
    if (!global.GhostCloud || !global.GhostCloud.request) {
      apply(false);
      return Promise.resolve(state);
    }
    return global.GhostCloud.request("GET", "/api/public/v1/providers/status").then(function(res) {
      state.providers = res && (res.providers || res.availability) || {};
      apply(true);
      return state;
    }).catch(function() {
      apply(false);
      return state;
    });
  }
  var Connect = {
    services: SERVICES,
    snapshot: function() {
      return {
        online: state.online,
        mode: state.mode,
        label: state.online ? "Connected" : "Connected (Offline Mode)",
        checkedAt: state.checkedAt,
        providers: state.providers,
        services: state.services
      };
    },
    isOnline: function() {
      return state.online;
    },
    isConnected: function(id) {
      return !id || !!state.services[id];
    },
    providerReady: function(name) {
      return !!state.providers[String(name || "").toLowerCase()];
    },
    on: function(fn) {
      if (typeof fn === "function") {
        listeners.push(fn);
        fn(Connect.snapshot());
      }
    },
    refresh: probe,
    start: function() {
      chip();
      paint();
      probe();
      if (timer) global.clearInterval(timer);
      timer = global.setInterval(probe, 5 * 60 * 1e3);
      try {
        global.addEventListener("online", probe);
        global.addEventListener("focus", function() {
          if (Date.now() - state.checkedAt > 6e4) probe();
        });
      } catch (e) {
      }
      return Connect;
    }
  };
  global.GhostConnect = Connect;
  function boot() {
    Connect.start();
  }
  window.GhostBoot.push(boot);
})(typeof window !== "undefined" ? window : this);
if (typeof window !== "undefined" && window.__ghostStamp) {
  window.__ghostStamp(
    "ghost-sidebar.js",
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
if (typeof window !== "undefined" && window.__ghostStamp) {
  window.__ghostStamp(
    "ghost-search.js",
    "3.40.2+20260829.ui-perfect"
  );
}
(function(global) {
  "use strict";
  var TYPE_ALIASES = {
    icon: ["icon", "icons", "svg"],
    svg: ["svg"],
    png: ["png", "image"],
    image: ["image", "photo", "png", "jpg"],
    mockup: ["mockup", "mockups"],
    sfx: ["sfx", "sound", "sound-effect", "audio"],
    music: ["music", "audio"],
    video: ["video", "footage"],
    lottie: ["lottie", "json"],
    illustration: ["illustration", "vector"],
    template: ["template", "aep"],
    font: ["font", "typeface"],
    sticker: ["sticker", "stickers"]
  };
  var API_MAP = {
    image: [{ source: "pexels", type: "photo" }, { source: "pixabay", type: "photo" }],
    png: [{ source: "pexels", type: "photo" }, { source: "pixabay", type: "photo" }],
    photo: [{ source: "pexels", type: "photo" }, { source: "pixabay", type: "photo" }],
    video: [{ source: "pexels", type: "video" }, { source: "pixabay", type: "video" }],
    sfx: [{ source: "freesound", type: "audio" }],
    music: [{ source: "freesound", type: "audio" }],
    sticker: [{ source: "giphy", type: "sticker" }],
    gif: [{ source: "giphy", type: "gif" }]
  };
  function ext(name) {
    var m = String(name || "").match(/\.([a-z0-9]{2,5})$/i);
    return m ? m[1].toLowerCase() : "";
  }
  function humanSize(bytes) {
    var n = Number(bytes);
    if (!n || n < 0) return "";
    if (n < 1024) return n + " B";
    if (n < 1048576) return (n / 1024).toFixed(0) + " KB";
    return (n / 1048576).toFixed(n < 10485760 ? 1 : 0) + " MB";
  }
  function kindOf(value, fileName) {
    var raw = String(value || "").toLowerCase();
    var e = ext(fileName);
    if (!raw) {
      if (["svg"].indexOf(e) >= 0) return "svg";
      if (["png", "jpg", "jpeg", "webp"].indexOf(e) >= 0) return "image";
      if (["mp3", "wav", "aac", "m4a", "ogg"].indexOf(e) >= 0) return "audio";
      if (["mp4", "mov", "webm"].indexOf(e) >= 0) return "video";
      if (["json"].indexOf(e) >= 0) return "lottie";
      if (["ttf", "otf", "woff", "woff2"].indexOf(e) >= 0) return "font";
      if (["aep", "ffx"].indexOf(e) >= 0) return "template";
      return "asset";
    }
    for (var key in TYPE_ALIASES) {
      if (!Object.prototype.hasOwnProperty.call(TYPE_ALIASES, key)) continue;
      if (TYPE_ALIASES[key].indexOf(raw) >= 0) return key;
    }
    return raw;
  }
  function normalise(row) {
    return {
      id: row.id,
      title: row.title || "",
      type: row.type || "asset",
      ext: row.ext || "",
      thumb: row.thumb || null,
      preview: row.preview || row.thumb || null,
      resolution: row.resolution || "",
      size: row.size || "",
      source: row.source,
      sourceLabel: row.sourceLabel || row.source,
      path: row.path || null,
      download: row.download || null,
      credit: row.credit || null,
      raw: row.raw || null
    };
  }
  function fromLocal(asset) {
    var name = asset.name || asset.fileName || "";
    return normalise({
      id: "local:" + (asset.path || name),
      title: name || asset.title || "",
      type: kindOf(asset.type, name),
      ext: ext(name),
      thumb: asset.thumbnail || asset.preview || (asset.path ? "file:///" + String(asset.path).replace(/\\/g, "/") : null),
      resolution: asset.width && asset.height ? asset.width + "×" + asset.height : "",
      size: humanSize(asset.size || asset.bytes),
      source: "local",
      sourceLabel: "Local Library",
      path: asset.path || null,
      raw: asset
    });
  }
  function fromCloud(asset) {
    var meta = asset.meta || {};
    var name = meta.file_name || asset.slug || asset.title || "";
    return normalise({
      id: "cloud:" + (asset.slug || asset.id),
      title: asset.title || asset.slug || name,
      type: kindOf(asset.type, name),
      ext: ext(name),
      thumb: asset.thumb_url || asset.url || null,
      preview: asset.url || null,
      resolution: meta.width && meta.height ? meta.width + "×" + meta.height : meta.resolution || "",
      size: humanSize(meta.size || meta.bytes || asset.size),
      source: "cloud",
      sourceLabel: "Cloud Library",
      download: asset.url || null,
      raw: asset
    });
  }
  function fromStock(item) {
    return normalise({
      id: item.source + ":" + item.id,
      title: item.title || "",
      type: item.type === "photo" ? "image" : item.type === "audio" ? "sfx" : item.type,
      ext: item.type === "audio" ? "mp3" : item.type === "video" ? "mp4" : "jpg",
      thumb: item.preview || null,
      preview: item.preview || null,
      resolution: item.width && item.height ? item.width + "×" + item.height : "",
      size: item.duration ? Math.round(item.duration) + "s" : "",
      source: item.source,
      sourceLabel: item.source.charAt(0).toUpperCase() + item.source.slice(1) + " (API)",
      download: item.download || null,
      credit: item.credit || null,
      raw: item
    });
  }
  var cache = {};
  var CACHE_MS = 4 * 60 * 1e3;
  var CACHE_MAX = 40;
  function pruneCache() {
    var keys = Object.keys(cache);
    var now = Date.now();
    keys.forEach(function(k) {
      if (now - cache[k].at > CACHE_MS) delete cache[k];
    });
    keys = Object.keys(cache);
    if (keys.length <= CACHE_MAX) return;
    keys.sort(function(a, b) {
      return cache[a].at - cache[b].at;
    });
    keys.slice(0, keys.length - CACHE_MAX).forEach(function(k) {
      delete cache[k];
    });
  }
  function providerCalls(kind) {
    var list = API_MAP[kind] || API_MAP.image;
    if (!global.GhostConnect) return list;
    return list.filter(function(entry) {
      return global.GhostConnect.providerReady(entry.source) !== false;
    });
  }
  function search(query, opts) {
    opts = opts || {};
    var q = String(query || "").trim();
    if (q.length < 2) return Promise.resolve({ query: q, results: [], sources: {} });
    var kind = String(opts.kind || "image").toLowerCase();
    var limit = Number(opts.limit || 60);
    var key = q.toLowerCase() + "|" + kind + "|" + limit + "|" + (opts.includeApi === false ? 0 : 1);
    var hit = cache[key];
    if (hit && Date.now() - hit.at < CACHE_MS) return Promise.resolve(hit.value);
    var results = [];
    var sources = { local: 0, cloud: 0, api: 0 };
    var partial = typeof opts.onPartial === "function" ? opts.onPartial : null;
    function push(rows, bucket) {
      rows.forEach(function(row) {
        results.push(row);
      });
      sources[bucket] += rows.length;
      if (partial) partial({ query: q, results: results.slice(), sources, stage: bucket });
    }
    var localPromise = Promise.resolve().then(function() {
      var rows = [];
      try {
        if (global.GhostCacheAPI && global.GhostCacheAPI.searchLocal) {
          rows = global.GhostCacheAPI.searchLocal(q, limit) || [];
        }
      } catch (e) {
        rows = [];
      }
      push(rows.map(fromLocal), "local");
    });
    var cloudPromise = localPromise.then(function() {
      if (!global.GhostCloud || !global.GhostCloud.searchAssets) return null;
      return global.GhostCloud.searchAssets({ q, limit: Math.min(limit, 60), offset: 0 }).then(function(res) {
        push((res && res.assets || []).map(fromCloud), "cloud");
      }).catch(function() {
      });
    });
    var apiPromise = cloudPromise.then(function() {
      if (opts.includeApi === false) return null;
      if (!global.GhostCloud || !global.GhostCloud.stock) return null;
      if (global.GhostConnect && !global.GhostConnect.isOnline()) return null;
      var calls = providerCalls(kind);
      if (!calls.length) return null;
      return Promise.all(calls.map(function(entry) {
        return global.GhostCloud.stock({ q, source: entry.source, type: entry.type, limit: 12 }).then(function(items) {
          return (items || []).map(fromStock);
        }).catch(function() {
          return [];
        });
      })).then(function(batches) {
        var rows = [];
        batches.forEach(function(b) {
          rows = rows.concat(b);
        });
        push(rows, "api");
      });
    });
    return apiPromise.then(function() {
      var value = { query: q, results, sources };
      cache[key] = { at: Date.now(), value };
      pruneCache();
      return value;
    });
  }
  global.GhostSearch = {
    search,
    normalise,
    fromCloud,
    fromLocal,
    fromStock,
    humanSize,
    kindOf,
    clearCache: function() {
      cache = {};
    }
  };
})(typeof window !== "undefined" ? window : this);
if (typeof window !== "undefined" && window.__ghostStamp) {
  window.__ghostStamp(
    "ghost-patch.js",
    "3.40.2+20260829.ui-perfect"
  );
}
(function(global) {
  "use strict";
  var FEED = "/api/public/v1/patch/latest?channel=stable";
  var POLL_MS = 10 * 60 * 1e3;
  var LS_DONE = "ghost.patch.applied";
  var LS_STAGED = "ghost.patch.staged";
  var STATUS_FILE = "patch-status.json";
  var Patch = {};
  var overlay = null;
  var els = {};
  var current = null;
  var busy = false;
  function build() {
    try {
      return {
        available: true,
        fs: global.cep_node.require("fs"),
        path: global.cep_node.require("path"),
        child: global.cep_node.require("child_process"),
        crypto: global.cep_node.require("crypto"),
        os: global.cep_node.require("os")
      };
    } catch (e) {
      return { available: false };
    }
  }
  var node = build();
  function version() {
    return global.GHOST_BUILD && global.GHOST_BUILD.version || "0.0.0";
  }
  function compare(a, b) {
    var x = String(a || "0").split(".");
    var y = String(b || "0").split(".");
    for (var i = 0; i < 3; i += 1) {
      var l = parseInt(x[i] || "0", 10) || 0;
      var r = parseInt(y[i] || "0", 10) || 0;
      if (l !== r) return l > r ? 1 : -1;
    }
    return 0;
  }
  function base() {
    return global.GhostConfig && global.GhostConfig.baseUrl() || "";
  }
  function el(tag, cls, text) {
    var n = document.createElement(tag);
    if (cls) n.className = cls;
    if (text != null) n.textContent = text;
    return n;
  }
  function updatesDir() {
    if (!node.available) return null;
    try {
      var cs = new global.CSInterface();
      var dir = node.path.join(cs.getSystemPath("userData"), "GHOST", "Updates");
      var parts = dir.split(node.path.sep);
      var cur = "";
      for (var i = 0; i < parts.length; i += 1) {
        cur = cur ? cur + node.path.sep + parts[i] : parts[i];
        if (!cur) {
          cur = node.path.sep;
          continue;
        }
        try {
          if (!node.fs.existsSync(cur)) node.fs.mkdirSync(cur);
        } catch (e) {
        }
      }
      return dir;
    } catch (e) {
      return null;
    }
  }
  function extensionRoot() {
    try {
      var cs = new global.CSInterface();
      return cs.getSystemPath("extension");
    } catch (e) {
      return null;
    }
  }
  function sha256(file) {
    try {
      return node.crypto.createHash("sha256").update(node.fs.readFileSync(file)).digest("hex");
    } catch (e) {
      return "";
    }
  }
  function ensureOverlay() {
    if (overlay) return overlay;
    overlay = el("div", "ghost-patch-gate");
    overlay.setAttribute("role", "dialog");
    overlay.setAttribute("aria-modal", "true");
    var box = el("div", "ghost-patch-box");
    var head = el("div", "ghost-patch-head");
    head.appendChild(el("div", "ghost-patch-mark", "⇪"));
    var titles = el("div", "ghost-patch-titles");
    els.title = el("div", "ghost-patch-title", "Update required");
    els.sub = el("div", "ghost-patch-sub", "GHOST Creative System");
    titles.appendChild(els.title);
    titles.appendChild(els.sub);
    head.appendChild(titles);
    box.appendChild(head);
    els.notes = el("div", "ghost-patch-notes");
    box.appendChild(els.notes);
    els.bar = el("div", "ghost-patch-bar");
    els.fill = el("i");
    els.bar.appendChild(els.fill);
    els.bar.style.display = "none";
    box.appendChild(els.bar);
    els.status = el("div", "ghost-patch-status");
    box.appendChild(els.status);
    var row = el("div", "ghost-patch-row");
    els.action = el("button", "ghost-patch-btn ghost-patch-primary", "Download");
    els.later = el("button", "ghost-patch-btn", "Re-check");
    row.appendChild(els.action);
    row.appendChild(els.later);
    box.appendChild(row);
    els.meta = el("div", "ghost-patch-meta");
    box.appendChild(els.meta);
    overlay.appendChild(box);
    (document.body || document.documentElement).appendChild(overlay);
    els.action.addEventListener("click", function() {
      runAction();
    });
    els.later.addEventListener("click", function() {
      if (els.later.textContent.indexOf("Continue") === 0) {
        clearStaged();
        unlock();
        return;
      }
      check(true);
    });
    return overlay;
  }
  function status(text, kind) {
    if (!els.status) return;
    els.status.textContent = text || "";
    els.status.setAttribute("data-kind", kind || "info");
  }
  function progress(ratio) {
    if (!els.bar) return;
    if (ratio == null) {
      els.bar.style.display = "none";
      return;
    }
    els.bar.style.display = "block";
    els.fill.style.width = Math.max(0, Math.min(100, Math.round(ratio * 100))) + "%";
  }
  function lock(patch) {
    ensureOverlay();
    current = patch;
    overlay.classList.add("is-open");
    document.documentElement.classList.add("ghost-patch-locked");
    els.title.textContent = "Update " + patch.version + " required";
    els.sub.textContent = (patch.title || "GHOST Creative System") + "  ·  running " + version();
    els.notes.textContent = patch.notes || "নতুন patch এসেছে। Download করুন, তারপর After Effects restart দিন — আপনার asset, preset বা licence আবার download করতে হবে না।";
    els.meta.textContent = patch.sizeBytes ? "Patch size: " + (patch.sizeBytes / 1024 / 1024).toFixed(2) + " MB" : "";
    var staged = readJSON(LS_STAGED);
    if (staged && staged.version === patch.version) {
      stagedState();
    } else {
      els.action.textContent = "⬇ Download";
      els.action.disabled = false;
      els.later.style.display = "";
      status("Click Download to fetch this patch.");
      progress(null);
    }
  }
  function unlock() {
    if (!overlay) return;
    overlay.classList.remove("is-open");
    document.documentElement.classList.remove("ghost-patch-locked");
  }
  function stagedState() {
    var staged = readJSON(LS_STAGED) || {};
    els.action.textContent = "Restart After Effects";
    els.action.disabled = false;
    els.later.style.display = "none";
    progress(1);
    if ((staged.boots || 0) >= 1) {
      els.action.textContent = "⟳ Re-download & install";
      els.later.style.display = "";
      els.later.textContent = "Continue without update";
      status("Restart did not install the patch (updater never ran). Re-download to try again, or continue without it.", "error");
    } else {
      status("Patch staged ✔  Close After Effects completely and open it again — the update installs itself on restart.", "ok");
    }
  }
  function statusPath() {
    var dir = updatesDir();
    return dir && node.available ? node.path.join(dir, STATUS_FILE) : null;
  }
  function readUpdaterStatus() {
    var file = statusPath();
    if (!file) return null;
    try {
      return JSON.parse(node.fs.readFileSync(file, "utf8"));
    } catch (e) {
      return null;
    }
  }
  function clearStaged() {
    try {
      global.localStorage.removeItem(LS_STAGED);
    } catch (e) {
    }
  }
  function reconcileStaged() {
    var staged = readJSON(LS_STAGED);
    if (!staged) return;
    if (staged.version && version() && String(version()).indexOf(String(staged.version)) === 0) {
      clearStaged();
      unlock();
      return;
    }
    var updater = readUpdaterStatus();
    if (updater && updater.patchId === staged.patchId && updater.state === "installed") {
      clearStaged();
      unlock();
      return;
    }
    if (updater && updater.patchId === staged.patchId && updater.state === "failed") {
      clearStaged();
      if (current && els.action) {
        status("Update could not be installed: " + (updater.message || "unknown updater error"), "error");
        els.action.textContent = "⬇ Retry download";
        els.action.disabled = false;
        els.later.style.display = "";
      }
      return;
    }
    staged.boots = (staged.boots || 0) + 1;
    writeJSON(LS_STAGED, staged);
    if (staged.boots > 3) clearStaged();
  }
  function readJSON(key) {
    try {
      return JSON.parse(global.localStorage.getItem(key) || "null");
    } catch (e) {
      return null;
    }
  }
  function writeJSON(key, value) {
    try {
      global.localStorage.setItem(key, JSON.stringify(value));
    } catch (e) {
    }
  }
  function runAction() {
    if (busy || !current) return;
    var staged = readJSON(LS_STAGED);
    if (staged && staged.version === current.version && (staged.boots || 0) < 1) {
      status("Waiting for After Effects to close…", "ok");
      return;
    }
    if (staged) clearStaged();
    download(current);
  }
  function download(patch) {
    if (!node.available) {
      status("This panel cannot write files. Download the patch from the GHOST website and use “Apply Update File”.", "error");
      return;
    }
    var dir = updatesDir();
    if (!dir) {
      status("Could not create the update folder.", "error");
      return;
    }
    var file = node.path.join(dir, "GHOST_patch_" + String(patch.version).replace(/[^0-9A-Za-z.]/g, "_") + ".ghostupdate");
    busy = true;
    els.action.disabled = true;
    els.later.style.display = "none";
    status("Downloading patch " + patch.version + "…");
    progress(0);
    // Mandatory integrity gate. A server-supplied hash for a server-supplied
    // file is not a complete integrity guarantee on its own, but it stops
    // accidental corruption and raises the bar for a MITM attacker who does
    // not control the server. Without a hash there is nothing to verify
    // against, so the patch must be rejected instead of trusted.
    if (!patch.sha256) {
      try { if (global.console) global.console.error("ghost-patch: missing_integrity_hash", patch.version); } catch (e0) {
      }
      fail("Patch rejected: the server did not supply an integrity hash (missing_integrity_hash).");
      return;
    }
    var url = /^https?:/i.test(patch.url) ? patch.url : base() + patch.url;
    if (!/^https:\/\//i.test(url)) {
      try { if (global.console) global.console.error("ghost-patch: insecure_download_url", url); } catch (e1) {
      }
      fail("Patch rejected: the download URL is not HTTPS.");
      return;
    }
    var xhr = new XMLHttpRequest();
    xhr.open("GET", url, true);
    xhr.responseType = "arraybuffer";
    xhr.timeout = 18e4;
    xhr.onprogress = function(e) {
      if (e.lengthComputable) progress(e.loaded / e.total);
    };
    xhr.onload = function() {
      if (xhr.status < 200 || xhr.status >= 300) {
        fail("Download failed (HTTP " + xhr.status + ").");
        return;
      }
      try {
        var buffer = global.cep_node.Buffer.from(new Uint8Array(xhr.response));
        node.fs.writeFileSync(file, buffer);
      } catch (e) {
        fail("Could not save the patch: " + (e.message || e));
        return;
      }
      // Verification is mandatory (no longer skippable): the descriptor was
      // required to carry sha256 above, and a mismatch deletes the download.
      var actual = sha256(file);
      if (actual.toLowerCase() !== String(patch.sha256).toLowerCase()) {
        try {
          node.fs.unlinkSync(file);
        } catch (e2) {
        }
        fail("Checksum mismatch — the patch was rejected for your safety.");
        return;
      }
      stage(patch, file);
    };
    xhr.onerror = function() {
      fail("Network error while downloading the patch.");
    };
    xhr.ontimeout = function() {
      fail("The patch download timed out.");
    };
    xhr.send();
  }
  function fail(message) {
    busy = false;
    progress(null);
    els.action.disabled = false;
    els.action.textContent = "⬇ Retry download";
    els.later.style.display = "";
    status(message, "error");
  }
  function stage(patch, file) {
    status("Verifying and staging the patch…");
    var target = extensionRoot();
    if (!node.available || !target) {
      fail("Could not resolve the extension folder.");
      return;
    }
    var isWindows = false;
    try {
      isWindows = node.os.platform() === "win32";
    } catch (e) {
    }
    try {
      if (isWindows) {
        var script = node.path.join(target, "installer", "stage-local-update.ps1");
        if (!node.fs.existsSync(script)) {
          fail("The update helper is missing from this install.");
          return;
        }
        var child = node.child.spawn("powershell.exe", [
          "-NoProfile",
          "-ExecutionPolicy",
          "Bypass",
          "-File",
          script,
          "-PackagePath",
          file,
          "-TargetPath",
          target,
          "-CurrentVersion",
          version(),
          "-StatusPath",
          statusPath()
        ], { detached: true, stdio: "ignore", windowsHide: true });
        child.unref();
      } else {
        var pending = node.path.join(updatesDir(), "pending.ghostupdate");
        node.fs.writeFileSync(pending, node.fs.readFileSync(file));
      }
    } catch (e) {
      fail("Staging failed: " + (e.message || e));
      return;
    }
    busy = false;
    writeJSON(LS_STAGED, { version: patch.version, patchId: patch.patchId, file, stagedAt: Date.now() });
    stagedState();
  }
  function fetchFeed() {
    return new Promise(function(resolve, reject) {
      var xhr = new XMLHttpRequest();
      xhr.open("GET", base() + FEED, true);
      xhr.timeout = 15e3;
      xhr.setRequestHeader("X-Ghost-Version", version());
      xhr.onload = function() {
        var parsed = null;
        try {
          parsed = JSON.parse(xhr.responseText);
        } catch (e) {
        }
        if (!parsed || parsed.ok === false) {
          reject(new Error("bad_feed"));
          return;
        }
        resolve(parsed.patch || null);
      };
      xhr.onerror = function() {
        reject(new Error("offline"));
      };
      xhr.ontimeout = function() {
        reject(new Error("timeout"));
      };
      xhr.send();
    });
  }
  function check(manual) {
    return fetchFeed().then(function(patch) {
      reconcileStaged();
      if (!patch || !patch.version) {
        if (manual) status("You are running the latest build.", "ok");
        if (!current) unlock();
        return null;
      }
      var applied = readJSON(LS_DONE);
      if (compare(patch.version, version()) <= 0) {
        try {
          global.localStorage.removeItem(LS_STAGED);
        } catch (e) {
        }
        writeJSON(LS_DONE, { version: version(), at: Date.now() });
        current = null;
        unlock();
        if (manual) status("You are running the latest build.", "ok");
        return null;
      }
      if (applied && applied.skipped === patch.version && !patch.mandatory) return patch;
      if (patch.mandatory) lock(patch);
      else notifyOptional(patch);
      return patch;
    }).catch(function(err) {
      if (manual) status("Update check failed — check your connection.", "error");
      return null;
    });
  }
  function notifyOptional(patch) {
    if (global.GhostCacheAPI && global.GhostCacheAPI.showToast) {
      global.GhostCacheAPI.showToast("GHOST " + patch.version + " is available — open Update to install.");
    }
    Patch.pending = patch;
  }
  Patch.check = check;
  Patch.open = function() {
    if (Patch.pending) lock(Patch.pending);
    else check(true);
  };
  Patch.state = function() {
    return { current, staged: readJSON(LS_STAGED) };
  };
  function boot() {
    reconcileStaged();
    setTimeout(function() {
      check(false);
    }, 1200);
    setInterval(function() {
      check(false);
    }, POLL_MS);
  }
  window.GhostBoot.push(boot);
  global.GhostPatch = Patch;
})(typeof window !== "undefined" ? window : this);
if (typeof window !== "undefined" && window.__ghostStamp) {
  window.__ghostStamp(
    "ghost-gate.js",
    "3.40.2+20260829.ui-perfect"
  );
}
(function(global) {
  "use strict";
  var Cloud = global.GhostCloud;
  if (!Cloud) {
    (function hardLock() {
      function paint() {
        try {
          var root = document.documentElement;
          root.className += " ghost-gated";
          var box = document.createElement("div");
          box.className = "ghost-gate-overlay is-open";
          box.style.cssText = "position:fixed;inset:0;z-index:99999;display:flex;align-items:center;justify-content:center;padding:24px;background:#f8fafc;color:#0f172a;text-align:center;font:12px/1.6 -apple-system,'Segoe UI',sans-serif";
          box.innerHTML = '<div><div style="font-size:14px;font-weight:600;margin-bottom:6px">Activation required</div><div style="opacity:.7;max-width:320px;margin:0 auto">The licence service did not load in this After Effects build. Close and reopen the panel, or reinstall GHOST from ghostae.com.</div></div>';
          (document.body || root).appendChild(box);
          if (document.body) document.body.setAttribute("data-ghost-licensed", "0");
        } catch (e) {
        }
      }
      global.GhostBoot.push(paint);
    })();
    global.GhostGate = {
      lock: function() {
      },
      unlock: function() {
      },
      open: function() {
      },
      isLicensed: function() {
        return false;
      },
      guard: function() {
        return function() {
        };
      }
    };
    return;
  }
  var overlay = null;
  var busy = false;
  var isAudioMuted = false;
  var audioCtx = null;
  document.documentElement.className += " ghost-tw-off";
  function playSound(freq, type, duration) {
    if (isAudioMuted) return;
    freq = freq || 440;
    type = type || "sine";
    duration = duration || 0.08;
    try {
      if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      if (audioCtx.state === "suspended") audioCtx.resume();
      var osc = audioCtx.createOscillator();
      var gain = audioCtx.createGain();
      osc.type = type;
      osc.frequency.value = freq;
      gain.gain.setValueAtTime(0.04, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(1e-3, audioCtx.currentTime + duration);
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start();
      osc.stop(audioCtx.currentTime + duration);
    } catch (e) {
    }
  }
  function formatKeyInput(input) {
    var val = String(input.value || "").toUpperCase().replace(/[^A-Z0-9]/g, "");
    var groups = [];
    var prefix;
    var body;
    var i;
    if (val.indexOf("GHOST") === 0) {
      prefix = "GHOST";
      body = val.slice(5, 21);
    } else if (val.length >= 16) {
      prefix = "GHOST";
      body = val.slice(0, 16);
    } else {
      prefix = "";
      body = val.slice(0, 16);
    }
    for (i = 0; i < body.length; i += 4) groups.push(body.slice(i, i + 4));
    input.value = (prefix ? prefix + (groups.length ? "-" : "") : "") + groups.join("-");
  }
  function switchTab(tabId) {
    playSound(520, "sine", 0.05);
    document.querySelectorAll(".tab-panel").forEach(function(p) {
      p.classList.add("hidden");
      p.classList.remove("active");
    });
    var activePanel = document.getElementById(tabId);
    if (activePanel) {
      activePanel.classList.remove("hidden");
      setTimeout(function() {
        activePanel.classList.add("active");
      }, 10);
    }
    var btnActivate = document.getElementById("btn-tab-activate");
    var btnStatus = document.getElementById("btn-tab-status");
    if (btnActivate) {
      btnActivate.className = tabId === "tab-activate" ? "flex-1 py-1.5 rounded-lg text-slate-900 bg-white shadow-sm transition-all focus-ring" : "flex-1 py-1.5 rounded-lg text-slate-500 hover:text-slate-900 transition-all focus-ring";
    }
    if (btnStatus) {
      btnStatus.className = tabId === "tab-status" ? "flex-1 py-1.5 rounded-lg text-slate-900 bg-white shadow-sm transition-all focus-ring" : "flex-1 py-1.5 rounded-lg text-slate-500 hover:text-slate-900 transition-all focus-ring";
    }
  }
  function toggleAudio() {
    isAudioMuted = !isAudioMuted;
    var btn = document.getElementById("soundBtn");
    if (btn) {
      btn.classList.toggle("text-slate-300", isAudioMuted);
      btn.classList.toggle("text-slate-500", !isAudioMuted);
    }
    showToast(isAudioMuted ? "Muted" : "Unmuted");
  }
  function showToast(message, isSuccess) {
    var toast = document.getElementById("toast");
    var toastMsg = document.getElementById("toastMsg");
    var toastDot = document.getElementById("toastDot");
    if (!toast || !toastMsg || !toastDot) return;
    toastMsg.textContent = message;
    toastDot.className = "w-2 h-2 rounded-full " + (isSuccess ? "bg-emerald-400" : "bg-blue-400");
    toast.classList.remove("opacity-0", "pointer-events-none", "translate-y-3");
    toast.classList.add("opacity-100", "translate-y-0");
    setTimeout(function() {
      toast.classList.remove("opacity-100", "translate-y-0");
      toast.classList.add("opacity-0", "pointer-events-none", "translate-y-3");
    }, 2500);
  }
  function openSupportDrawer() {
    playSound(480, "sine", 0.05);
    var drawer = document.getElementById("supportDrawer");
    if (!drawer) return;
    drawer.classList.remove("opacity-0", "pointer-events-none");
    drawer.firstElementChild.classList.remove("translate-y-full", "sm:translate-y-4");
  }
  function closeSupportDrawer() {
    var drawer = document.getElementById("supportDrawer");
    if (!drawer) return;
    drawer.firstElementChild.classList.add("translate-y-full", "sm:translate-y-4");
    setTimeout(function() {
      drawer.classList.add("opacity-0", "pointer-events-none");
    }, 150);
  }
  function pulseLogoEffect() {
    playSound(700, "sine", 0.06);
    var logo = document.getElementById("appLogo");
    if (!logo) return;
    logo.classList.add("scale-110");
    setTimeout(function() {
      logo.classList.remove("scale-110");
    }, 200);
  }
  function reasonText(reason) {
    if (reason && reason.indexOf("license_") === 0) reason = reason.slice(8);
    switch (reason) {
      case "not_found":
        return "Invalid key.";
      case "revoked":
        return "Key revoked.";
      case "suspended":
        return "Key suspended.";
      case "expired":
        return "Key expired.";
      case "seat_limit":
        return "Seat limit reached.";
      case "device_revoked":
        return "Device revoked.";
      case "offline_grace_expired":
        return "Offline grace expired.";
      case "no_key":
        return "Key required.";
      case "device_not_activated":
        return "This device is not activated yet — press Activate.";
      case "bad_request":
        return "Request rejected. Check the key format (GHOST-XXXX-XXXX-XXXX-XXXX).";
      case "bad_signature":
        return "Security check failed. Reinstall the extension.";
      case "rate_limited":
        return "Too many attempts. Wait a minute and retry.";
      case "network_unreachable":
      case "network_error":
        return "No internet connection to GHOST Cloud.";
      case "network_timeout":
        return "GHOST Cloud timed out. Retry in a moment.";
      case "server_error":
        return "GHOST Cloud is unavailable. Try again shortly.";
      case "inactive":
        return "Key inactive. Contact support.";
      case "unknown":
        return "";
      default:
        return reason ? "Error: " + reason : "License verification failed.";
    }
  }
  function updateMeta() {
    var stateText = document.getElementById("licenseStateText");
    var deviceText = document.getElementById("deviceText");
    if (stateText) {
      if (Cloud.isLicensed()) {
        stateText.textContent = "Active";
        stateText.className = "font-bold text-emerald-600";
      } else {
        stateText.textContent = "Inactive";
        stateText.className = "font-bold text-slate-700";
      }
    }
    if (deviceText) {
      deviceText.textContent = Cloud.deviceId() || "#UNKNOWN";
    }
  }
  function showCompatibilityNotice() {
    var KEY = "ghost.compatibility.notice.v1";
    try { if (sessionStorage.getItem(KEY) === "1") return; } catch (e) {}
    var major = null, full = "";
    try {
      if (window.CSInterface) {
        var env = new window.CSInterface().getHostEnvironment();
        if (env && env.appVersion) {
          full = String(env.appVersion);
          var m = /^(\d+)/.exec(full);
          if (m) major = parseInt(m[1], 10);
        }
      }
    } catch (e2) {}
    var wrap = document.getElementById("ghostCompatibilityNotice");
    if (wrap) return;
    wrap = document.createElement("div");
    wrap.id = "ghostCompatibilityNotice";
    wrap.className = "gp2-sheet-wrap";
    var current = full ? "<small>Detected After Effects: <b>" + full.replace(/</g, "&lt;").replace(/>/g, "&gt;") + "</b></small>" : "";
    wrap.innerHTML =
      '<div class="gp2-sheet" role="alertdialog" aria-modal="true" aria-label="After Effects compatibility notice">' +
      "<h3>After Effects compatibility</h3>" +
      '<div class="gp2-row"><div class="gp2-row-main">' +
      "GHOST works best on After Effects 2025 (25.x) and 2026 (26.x), and on later 25+ releases." +
      "<small><b>Perfect Color Presets</b> require After Effects 2025 (25.x) or newer. On supported versions before 25.x, the other sections may work, but some features or results may vary.</small>" +
      current +
      "</div></div>" +
      '<div class="gp2-sheet-foot"><button type="button" class="gp2-btn gp2-btn-primary" data-act="ok">Got it</button></div>' +
      "</div>";
    document.body.appendChild(wrap);
    function close() {
      if (wrap && wrap.parentNode) wrap.parentNode.removeChild(wrap);
      try { sessionStorage.setItem(KEY, "1"); } catch (e) {}
    }
    wrap.addEventListener("click", function(e) {
      var t = e.target && e.target.closest ? e.target.closest('[data-act="ok"]') : null;
      if (t || e.target === wrap) close();
    });
    document.addEventListener("keydown", function esc(e) {
      if (e.key === "Escape") { close(); document.removeEventListener("keydown", esc); }
    });
    var btn = wrap.querySelector('[data-act="ok"]');
    if (btn && btn.focus) btn.focus();
  }

  function activate() {
    var input = document.getElementById("licenseKey");
    var btn = document.getElementById("activateBtn");
    if (!input || !btn) return;
    formatKeyInput(input);
    var key = (input.value || "").replace(/^\s+|\s+$/g, "").toUpperCase();
    if (!key) {
      playSound(220, "sawtooth", 0.15);
      showToast("Enter your licence key.", false);
      input.focus();
      return;
    }
    if (!/^GHOST-[A-Z0-9]{4}-[A-Z0-9]{4}-[A-Z0-9]{4}-[A-Z0-9]{4}$/.test(key)) {
      playSound(220, "sawtooth", 0.15);
      showToast("Incomplete key — needs GHOST-XXXX-XXXX-XXXX-XXXX (4 groups).", false);
      input.focus();
      return;
    }
    if (busy) return;
    busy = true;
    btn.disabled = true;
    btn.innerHTML = "<span>Validating...</span>";
    playSound(880, "sine", 0.1);
    Cloud.activate(key).then(function() {
      busy = false;
      btn.disabled = false;
      if (Cloud.isLicensed()) {
        btn.innerHTML = "<span>Activated</span>";
        btn.className = "flex-1 min-h-[40px] py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-md interactive-scale focus-ring spring-transition flex items-center justify-center gap-1.5";
        updateMeta();
        showToast("Activated", true);
        playSound(1200, "sine", 0.2);
        setTimeout(unlock, 800);
        setTimeout(showCompatibilityNotice, 900);
      } else {
        btn.innerHTML = "<span>Activate</span>";
        btn.className = "flex-1 min-h-[40px] py-2.5 px-4 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-md interactive-scale focus-ring spring-transition flex items-center justify-center gap-1.5";
        lock(reasonText(Cloud.state().reason) || "Activation failed.");
        showToast(reasonText(Cloud.state().reason) || "Activation failed.", false);
      }
    }).catch(function(err) {
      busy = false;
      btn.disabled = false;
      btn.innerHTML = "<span>Activate</span>";
      var code = err && (err.code || err.message);
      var msg = err && err.message;
      if (code === "bad_request" || code === "not_found") showToast(msg || reasonText(code), false);
      else showToast(reasonText(code) || msg || "Activation failed.", false);
      lock("");
    });
  }
  function recheck() {
    if (busy) return;
    busy = true;
    showToast("Verifying...", false);
    Cloud.verify().then(function(s) {
      busy = false;
      if (Cloud.isLicensed()) {
        updateMeta();
        setTimeout(unlock, 400);
      } else {
        showToast(reasonText(s.reason) || "License invalid.", false);
      }
    }).catch(function() {
      busy = false;
      showToast("Cloud unreachable.", false);
    });
  }
  function build() {
    if (overlay) return overlay;
    overlay = document.createElement("div");
    overlay.className = "ghost-gate-overlay select-none";
    overlay.setAttribute("role", "dialog");
    overlay.setAttribute("aria-modal", "true");
    if (!document.getElementById("ghostGateCleanStyle")) {
      var gateStyle = document.createElement("style");
      gateStyle.id = "ghostGateCleanStyle";
      gateStyle.textContent = ".ghost-gate-overlay{position:fixed!important;inset:0!important;z-index:99999!important;display:flex;align-items:center;justify-content:center;padding:18px;background:#111318;color:#e8e9ed;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif}.ghost-gate-overlay>div:first-child,.ghost-gate-overlay #soundBtn,.ghost-gate-overlay #helpBtn,.ghost-gate-overlay #supportDrawer{display:none!important}.ghost-gate-overlay #ghost-gate-main-container{position:relative;width:100%;max-width:360px;margin:auto;z-index:1}.ghost-gate-overlay .glass-chrome{overflow:hidden;border:1px solid #323640;border-radius:12px;background:#1b1e24;box-shadow:0 20px 50px rgba(0,0,0,.45)}.ghost-gate-overlay header{padding:16px 16px 12px!important;border-bottom:1px solid #2d313a!important;background:#1b1e24!important}.ghost-gate-overlay header>div:first-child,.ghost-gate-overlay header>div:nth-child(2){display:none!important}.ghost-gate-overlay #logoBox{width:36px;height:36px}.ghost-gate-overlay #logoBox>div{width:36px;height:36px;padding:7px;border:1px solid #343946;border-radius:9px;background:#111318}.ghost-gate-overlay h1{font-size:14px;color:#f5f6f8}.ghost-gate-overlay nav{display:flex;margin-top:12px;padding:3px;border:1px solid #30343e;border-radius:8px;background:#14171c}.ghost-gate-overlay nav button{flex:1;padding:7px;border:0;border-radius:6px;background:transparent;color:#8f96a3;font-size:11px;font-weight:600}.ghost-gate-overlay #btn-tab-activate,.ghost-gate-overlay #btn-tab-status{box-shadow:none!important}.ghost-gate-overlay .tab-panel{padding:16px!important}.ghost-gate-overlay .tab-panel.hidden{display:none!important}.ghost-gate-overlay #tab-activate>div:first-child>div{position:relative;display:flex;align-items:center}.ghost-gate-overlay #licenseKey{box-sizing:border-box;width:100%;height:44px;padding:0 76px 0 12px;border:1px solid #373c47;border-radius:8px;outline:0;background:#111318;color:#f5f6f8;font:11px/1 ui-monospace,SFMono-Regular,Consolas,monospace;letter-spacing:.04em}.ghost-gate-overlay #licenseKey:focus{border-color:#2979ff;box-shadow:0 0 0 2px rgba(41,121,255,.16)}.ghost-gate-overlay #licenseKey+button{position:absolute!important;right:6px!important;top:7px!important;bottom:auto!important;display:flex!important;align-items:center!important;height:30px!important;margin:0!important;padding:0 9px!important;border:1px solid #373c47!important;border-radius:6px!important;background:#262a32!important;color:#d7dae0!important;font-size:10px!important}.ghost-gate-overlay #licenseKey~span,.ghost-gate-overlay #tab-activate>div:first-child span.absolute{display:none!important}.ghost-gate-overlay #tab-activate>div:nth-child(2){display:flex!important;gap:8px!important;padding-top:10px!important}.ghost-gate-overlay #activateBtn{box-sizing:border-box;width:100%;min-height:40px;border:0;border-radius:8px;background:#286fe8;color:#fff;font-size:11px;font-weight:700}.ghost-gate-overlay #tab-status{color:#d8dbe1}.ghost-gate-overlay #toast{position:fixed!important;left:50%!important;right:auto!important;bottom:16px!important;transform:translateX(-50%)!important;max-width:calc(100% - 24px)}";
      document.head.appendChild(gateStyle);
    }
    overlay.innerHTML = `
    <!-- Background Light Ambience -->
    <div class="fixed inset-0 pointer-events-none overflow-hidden z-[-1]">
        <div class="absolute -top-40 -left-40 w-96 h-96 bg-blue-100/60 rounded-full blur-3xl"></div>
        <div class="absolute -bottom-40 -right-40 w-96 h-96 bg-slate-200/50 rounded-full blur-3xl"></div>
    </div>
    <main class="relative w-full max-w-sm mx-auto z-10" id="ghost-gate-main-container">
        <div class="glass-chrome rounded-[28px] overflow-hidden spring-transition">
            <!-- Header Bar -->
            <header class="relative px-5 pt-4 pb-3 border-b border-slate-200/60 bg-white/60">
                <div class="w-10 h-1 bg-slate-200 rounded-full mx-auto mb-3" aria-hidden="true"></div>
                <!-- Control Bar -->
                <div class="flex items-center justify-end mb-2">
                    <button id="soundBtn" class="w-8 h-8 rounded-full text-slate-500 hover:text-slate-900 hover:bg-slate-100 focus-ring spring-transition flex items-center justify-center" aria-label="Toggle Audio">
                        <svg id="soundIcon" class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2">
                            <path stroke-linecap="round" stroke-linejoin="round" d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z"></path>
                        </svg>
                    </button>
                </div>
                <!-- Branding Badge -->
                <div class="flex items-center gap-3 pt-1">
                    <div class="relative cursor-pointer shrink-0" id="logoBox">
                        <div class="w-11 h-11 bg-slate-900 rounded-xl border border-slate-200 flex items-center justify-center p-2 shadow-sm">
                            <img id="appLogo" 
                                 src="assets/app-mark.svg" 
                                 alt="GhostAE" 
                                 class="w-full h-full object-contain filter brightness-110"
                                 onerror="this.onerror=null; this.src='assets/app-mark.svg';">
                        </div>
                    </div>
                    <div>
                        <h1 class="text-base font-bold tracking-tight text-slate-900">GhostAE</h1>
                    </div>
                </div>
                <!-- Navigation Tabs -->
                <nav class="flex items-center gap-1 bg-slate-100 p-1 rounded-xl border border-slate-200/60 mt-4 text-xs font-semibold">
                    <button id="btn-tab-activate" class="flex-1 py-1.5 rounded-lg text-slate-900 bg-white shadow-sm transition-all focus-ring">Activate</button>
                    <button id="btn-tab-status" class="flex-1 py-1.5 rounded-lg text-slate-500 hover:text-slate-900 transition-all focus-ring">Status</button>
                </nav>
            </header>
            <!-- Activate Tab -->
            <section id="tab-activate" class="tab-panel active p-5 space-y-4" role="tabpanel">
                <div class="space-y-1.5">
                    <div class="relative flex items-center">
                        <span class="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2">
                                <path stroke-linecap="round" stroke-linejoin="round" d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z"></path>
                            </svg>
                        </span>
                        <input type="text" id="licenseKey" placeholder="XXXX-XXXX-XXXX-XXXX" autocomplete="off" spellcheck="false"
                               class="w-full pl-10 pr-20 py-3 bg-white text-slate-900 placeholder-slate-400 text-xs font-mono tracking-wider rounded-xl border border-slate-200 focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600 spring-transition shadow-sm">
                        <button type="button" id="pasteBtn" aria-label="Paste key from clipboard"
                                class="absolute inset-y-0 right-1.5 my-auto h-7 px-2.5 bg-slate-100 hover:bg-slate-200 text-slate-600 hover:text-slate-900 text-[11px] font-semibold rounded-lg border border-slate-200/80 spring-transition focus-ring flex items-center gap-1 active:scale-95">
                            <svg class="w-3.5 h-3.5 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2">
                                <path stroke-linecap="round" stroke-linejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 012-2h2a2 2 0 012 2M9 5a2 2 0 012-2h2a2 2 0 012 2"></path>
                            </svg>
                            <span>Paste</span>
                        </button>
                    </div>
                </div>
                <div class="flex items-center gap-2 pt-1">
                    <button type="button" id="helpBtn" class="w-24 min-h-[40px] py-2.5 px-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs rounded-xl border border-slate-200/80 interactive-scale focus-ring spring-transition flex items-center justify-center">
                        Help
                    </button>
                    <button type="button" id="activateBtn" class="flex-1 min-h-[40px] py-2.5 px-4 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-md interactive-scale focus-ring spring-transition flex items-center justify-center gap-1.5">
                        <span>Activate</span>
                        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2.5">
                            <path stroke-linecap="round" stroke-linejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6"></path>
                        </svg>
                    </button>
                </div>
            </section>
            <!-- Status Tab -->
            <section id="tab-status" class="tab-panel hidden p-5 space-y-3" role="tabpanel">
                <div class="content-card p-4 rounded-xl space-y-3 text-xs">
                    <div class="flex items-center justify-between border-b border-slate-100 pb-2">
                        <span class="text-slate-500">License</span>
                        <span id="licenseStateText" class="font-bold text-slate-700">Inactive</span>
                    </div>
                    <div class="flex items-center justify-between border-b border-slate-100 pb-2">
                        <span class="text-slate-500">Type</span>
                        <span class="font-semibold text-slate-900">GhostAE Engine</span>
                    </div>
                    <div class="flex items-center justify-between">
                        <span class="text-slate-500">Device</span>
                        <span id="deviceText" class="font-mono text-[10px] text-slate-500">#UNKNOWN</span>
                    </div>
                </div>
            </section>
            <!-- Footer -->
            <footer class="px-5 py-3 bg-slate-50 border-t border-slate-200/60 flex items-center justify-center text-xs">
                <a href="https://ghostae.com" target="_blank" rel="noopener noreferrer" class="inline-flex items-center gap-1 text-slate-600 font-semibold hover:text-slate-900 transition-colors text-[11px] focus-ring">
                    <span>ghostae.com</span>
                    <svg class="w-3 h-3 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2">
                        <path stroke-linecap="round" stroke-linejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"></path>
                    </svg>
                </a>
            </footer>
        </div>
    </main>
    <div id="supportDrawer" class="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-slate-900/30 backdrop-blur-xs opacity-0 pointer-events-none spring-transition p-0 sm:p-4">
        <div class="w-full max-w-sm glass-chrome rounded-t-[24px] sm:rounded-[24px] p-5 space-y-4 transform translate-y-full sm:translate-y-4 spring-transition" id="supportDrawerInner">
            <div class="w-10 h-1 bg-slate-300 rounded-full mx-auto" aria-hidden="true"></div>
            <div class="flex items-center justify-between border-b border-slate-200/60 pb-2">
                <h2 class="text-sm font-bold text-slate-900">Help</h2>
                <button id="closeDrawerBtn" class="text-slate-400 hover:text-slate-700 p-1 rounded-lg hover:bg-slate-100">
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2">
                        <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12"></path>
                    </svg>
                </button>
            </div>
            <div class="space-y-2 text-xs text-slate-600">
                <div class="content-card p-3 rounded-xl space-y-1">
                    <p class="font-bold text-slate-900">Key retrieval</p>
                    <p class="text-slate-500 text-[11px]">Check purchase receipt email.</p>
                </div>
                <div class="content-card p-3 rounded-xl space-y-1">
                    <p class="font-bold text-slate-900">Activation limit</p>
                    <p class="text-slate-500 text-[11px]">Single machine license.</p>
                </div>
            </div>
            <a href="https://ghostae.com" target="_blank" id="supportLinkBtn" class="w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs rounded-xl flex items-center justify-center gap-1 spring-transition">
                <span>Support Center</span>
                <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M14 5l7 7m0 0l-7 7m7-7H3"></path>
                </svg>
            </a>
        </div>
    </div>
    <!-- Toast Notification -->
    <div id="toast" class="fixed bottom-5 left-1/2 -translate-x-1/2 bg-slate-900 text-white border border-slate-800 px-4 py-2.5 rounded-xl shadow-xl text-xs font-medium opacity-0 pointer-events-none spring-transition transform translate-y-3 z-[100000] flex items-center gap-2">
        <span id="toastDot" class="w-2 h-2 rounded-full bg-blue-400"></span>
        <span id="toastMsg">Ready</span>
    </div>
        `;
    (document.body || document.documentElement).appendChild(overlay);
    var doc = document;
    function bind(id, ev, fn) {
      try {
        var el = doc.getElementById(id);
        if (el) el.addEventListener(ev, fn, false);
        return el;
      } catch (e) {
        return null;
      }
    }
    bind("btn-tab-activate", "click", function() {
      switchTab("tab-activate");
    });
    bind("btn-tab-status", "click", function() {
      switchTab("tab-status");
    });
    bind("soundBtn", "click", toggleAudio);
    bind("logoBox", "click", pulseLogoEffect);
    bind("helpBtn", "click", openSupportDrawer);
    bind("closeDrawerBtn", "click", closeSupportDrawer);
    bind("supportLinkBtn", "click", closeSupportDrawer);
    bind("supportDrawer", "click", closeSupportDrawer);
    bind("supportDrawerInner", "click", function(e) {
      e.stopPropagation();
    });
    bind("activateBtn", "click", function(e) {
      if (e && e.preventDefault) e.preventDefault();
      activate();
    });
    bind("recheckBtn", "click", recheck);
    var input = doc.getElementById("licenseKey");
    if (input) {
      input.addEventListener("input", function() {
        formatKeyInput(this);
      });
      input.addEventListener("keydown", function(e) {
        var key = e.key || e.keyIdentifier;
        if (key === "Enter" || e.keyCode === 13) {
          e.preventDefault();
          activate();
        }
      });
    }
    function pasteInto(text) {
      if (!text || !input) return;
      input.value = text;
      formatKeyInput(input);
      showToast("Pasted", false);
      playSound(700, "sine", 0.08);
    }
    bind("pasteBtn", "click", function() {
      playSound(500, "sine", 0.05);
      var nav = window.navigator;
      try {
        if (nav && nav.clipboard && nav.clipboard.readText) {
          var pending = nav.clipboard.readText();
          if (pending && pending.then) pending.then(pasteInto).catch(function() {
            pasteInto(window.prompt("Paste your key here:"));
          });
          else pasteInto(window.prompt("Paste your key here:"));
        } else {
          pasteInto(window.prompt("Paste your key here:"));
        }
      } catch (e) {
        pasteInto(window.prompt("Paste your key here:"));
      }
    });
    doc.addEventListener("keydown", function(e) {
      if (e.key === "Escape" || e.keyCode === 27) closeSupportDrawer();
    });
    return overlay;
  }
  function detectUtilityCss() {
    function setFallback(on) {
      var root = document.documentElement;
      var cls = (" " + root.className + " ").replace(/\sghost-tw-off\s/g, " ");
      root.className = (on ? cls + " ghost-tw-off" : cls).replace(/\s+/g, " ").replace(/^\s|\s$/g, "");
    }
    function probe() {
      try {
        var el = document.createElement("div");
        el.className = "hidden";
        el.setAttribute("aria-hidden", "true");
        (document.body || document.documentElement).appendChild(el);
        var display = "";
        if (window.getComputedStyle) display = window.getComputedStyle(el).display;
        else if (el.currentStyle) display = el.currentStyle.display;
        if (el.parentNode) el.parentNode.removeChild(el);
        setFallback(display !== "none");
      } catch (e) {
        setFallback(true);
      }
    }
    setTimeout(probe, 120);
    setTimeout(probe, 900);
    setTimeout(probe, 2500);
  }
  function lock(reasonMsg) {
    build();
    overlay.style.display = "";
    overlay.setAttribute("aria-hidden", "false");
    overlay.classList.add("is-open");
    document.documentElement.classList.add("ghost-gated");
    try {
      document.body.setAttribute("data-ghost-licensed", "0");
    } catch (e) {
    }
    if (reasonMsg && reasonMsg.trim() !== "") showToast(reasonMsg, false);
    updateMeta();
    var input = document.getElementById("licenseKey");
    if (input && !input.value) {
      input.value = Cloud.licenseKey() || "";
      formatKeyInput(input);
    }
    setTimeout(function() {
      try {
        if (input) input.focus();
      } catch (e) {
      }
    }, 60);
  }
  function unlock() {
    if (overlay) {
      overlay.classList.remove("is-open");
      overlay.setAttribute("aria-hidden", "true");
      overlay.style.display = "none";
    }
    document.documentElement.classList.remove("ghost-gated");
    try {
      document.body.setAttribute("data-ghost-licensed", "1");
    } catch (e) {
    }
  }
  var HARD_REASONS = { not_found: true, revoked: true, suspended: true, expired: true, device_revoked: true, no_key: true };
  function evaluate() {
    if (Cloud.isLicensed()) return unlock();
    var current = Cloud.state();
    lock(current.reason === "unknown" ? "" : reasonText(current.reason));
  }
  var Gate = {
    lock,
    unlock,
    open: function() {
      lock("");
    },
    isLicensed: function() {
      return Cloud.isLicensed();
    },
    guard: function(fn) {
      return function() {
        if (!Cloud.isLicensed()) {
          lock(reasonText(Cloud.state().reason));
          return;
        }
        return fn.apply(this, arguments);
      };
    }
  };
  function boot() {
    build();
    lock(Cloud.licenseKey() ? "Verifying license…" : "");
    if (Cloud.licenseKey()) {
      showToast("Verifying license…", false);
    }
    Cloud.on("revoked", function() {
      lock("License revoked by cloud.");
    });
    Cloud.on("attention", function() {
      showToast("Re-syncing your license…", false);
    });
    Cloud.on("deactivated", function() {
      lock("");
    });
    Cloud.on("lockchange", function() {
      evaluate();
    });
    Cloud.on("shared", function() {
      showToast("Key found in another panel...", false);
    });
    Cloud.start();
    try {
      Cloud.verify().then(evaluate, evaluate);
    } catch (e) {
      setTimeout(evaluate, 400);
    }
  }
  global.GhostBoot.push(boot);
  global.GhostGate = Gate;
})(typeof window !== "undefined" ? window : this);
/*
 * Ghostae Text — remote control gate.
 *
 * Talks to the main server every 2 minutes (and right after the panel opens).
 *
 * Server can, at any moment and per single key:
 *   - suspend / revoke / delete the key      -> panel locks (no premium use)
 *   - publish a mandatory update             -> panel blocks + Download button
 *   - send a private message to one user     -> banner inside the panel
 *
 * A previously verified key gets a short retry window on connection failure.
 */
(function () {
  var BASE = (window.GHOST_API_BASE || "https://ghostae.com").replace(/\/+$/, "");
  var PANEL = "text";
  var POLL_MS = 2 * 60 * 1000;
  var FAILS = 0;
  function licenseKey() {
    try {
      var raw =
        window.GHOST_LICENSE_KEY ||
        localStorage.getItem("ghost.cloud.licenseKey") ||
        localStorage.getItem("ghost.license.key") ||
        "";
      try { raw = JSON.parse(raw); } catch (e) {}
      return typeof raw === "string" ? raw : "";
    } catch (e) {
      return "";
    }
  }
  function device() {
    try {
      var id = localStorage.getItem("ghost.device.fingerprint");
      if (!id) id = localStorage.getItem("ghost.cloud.deviceId");
      try { id = JSON.parse(id); } catch (e) {}
      return typeof id === "string" ? id : "";
    } catch (e) {
      return "";
    }
  }
  function openExternal(url) {
    try {
      if (window.cep && window.cep.util && window.cep.util.openURLInDefaultBrowser) {
        window.cep.util.openURLInDefaultBrowser(url);
        return;
      }
    } catch (e) {}
    try { window.open(url, "_blank"); } catch (e) {}
  }
  function overlay(opts) {
    var el = document.getElementById("ghost-control-gate");
    if (!el) {
      el = document.createElement("div");
      el.id = "ghost-control-gate";
      el.setAttribute(
        "style",
        "position:fixed;inset:0;z-index:2147483000;display:flex;align-items:center;" +
          "justify-content:center;text-align:center;padding:24px;" +
          "background:rgba(6,10,22,.94);font-family:-apple-system,Segoe UI,Roboto,sans-serif;color:#eaf1ff"
      );
      (document.body || document.documentElement).appendChild(el);
    }
    // Server-supplied badge/title/body are inserted via textContent (never
    // innerHTML), and opts.url is only ever assigned inside a handler — a
    // compromised/MITM'd control response cannot inject markup or script.
    var wrap = document.createElement("div");
    wrap.style.maxWidth = "360px";
    var badgeEl = document.createElement("div");
    badgeEl.setAttribute("style", "font-size:11px;letter-spacing:.18em;text-transform:uppercase;color:#5b9dff;font-weight:800");
    badgeEl.textContent = opts.badge || "Ghostae";
    var titleEl = document.createElement("h2");
    titleEl.setAttribute("style", "margin:10px 0 6px;font-size:19px;font-weight:800");
    titleEl.textContent = opts.title || "";
    var bodyEl = document.createElement("p");
    bodyEl.setAttribute("style", "margin:0;font-size:12.5px;line-height:1.6;opacity:.75");
    bodyEl.textContent = opts.body || "";
    wrap.appendChild(badgeEl);
    wrap.appendChild(titleEl);
    wrap.appendChild(bodyEl);
    if (opts.url) {
      var btn = document.createElement("button");
      btn.id = "ghost-gate-btn";
      btn.setAttribute("style", "margin-top:16px;border:0;cursor:pointer;" +
        "border-radius:999px;padding:11px 26px;font-size:11px;font-weight:800;letter-spacing:.14em;" +
        "text-transform:uppercase;background:#2f6bff;color:#fff");
      btn.textContent = "Download update";
      btn.onclick = function () { openExternal(opts.url); };
      wrap.appendChild(btn);
    }
    el.textContent = "";
    el.appendChild(wrap);
  }
  function clearOverlay() {
    var el = document.getElementById("ghost-control-gate");
    if (el && el.parentNode) el.parentNode.removeChild(el);
  }
  function notice(text) {
    var seen = "";
    try { seen = localStorage.getItem("ghost.control.notice") || ""; } catch (e) {}
    if (!text) {
      var old = document.getElementById("ghost-control-notice");
      if (old && old.parentNode) old.parentNode.removeChild(old);
      return;
    }
    if (seen === text) return;
    var bar = document.getElementById("ghost-control-notice");
    if (!bar) {
      bar = document.createElement("div");
      bar.id = "ghost-control-notice";
      bar.setAttribute(
        "style",
        "position:fixed;left:10px;right:10px;bottom:10px;z-index:2147482000;" +
          "border-radius:12px;padding:11px 14px;font:600 12px/1.5 -apple-system,Segoe UI,Roboto,sans-serif;" +
          "background:#12203c;color:#eaf1ff;border:1px solid rgba(91,157,255,.35);display:flex;gap:10px;align-items:flex-start"
      );
      (document.body || document.documentElement).appendChild(bar);
    }
    // Static wrapper markup only; the server-supplied text goes in via textContent.
    bar.innerHTML =
      '<span style="flex:1"></span>' +
      '<button id="ghost-notice-x" style="border:0;background:transparent;color:#8fb4ff;cursor:pointer;font-weight:800">✕</button>';
    bar.firstChild.textContent = text;
    var x = document.getElementById("ghost-notice-x");
    if (x)
      x.onclick = function () {
        try { localStorage.setItem("ghost.control.notice", text); } catch (e) {}
        if (bar.parentNode) bar.parentNode.removeChild(bar);
      };
  }
  /* One place that publishes the verification verdict, so the top-bar status
     icon and any other UI never has to guess. */
  function publish(status, ok, updateRequired) {
    window.GHOST_LICENSE_BLOCKED = !ok;
    window.GHOST_LICENSE_STATUS = status;
    window.GHOST_UPDATE_REQUIRED = !!updateRequired;
    if (ok) window.GHOST_LICENSE_VERIFIED_AT = Date.now();
    try {
      document.body.setAttribute("data-ghost-plan", ok ? "active" : "problem");
    } catch (e) {}
    try {
      document.dispatchEvent(new CustomEvent("ghost-license-state", { detail: { status: status, ok: ok } }));
    } catch (e) {
      try {
        var ev = document.createEvent("Event");
        ev.initEvent("ghost-license-state", true, true);
        document.dispatchEvent(ev);
      } catch (e2) {}
    }
    if (window.GhostPlanStatus && window.GhostPlanStatus.refresh) window.GhostPlanStatus.refresh();
  }
  function apply(data) {
    var up = data.update || {};
    if (up.blocked && up.url) {
      publish("update_required", false, true);
      overlay({
        badge: "Update required" + (up.version ? " · v" + up.version : ""),
        title: "A new Ghostae version is available",
        body: up.message || "This version is no longer supported. Download the latest build to continue.",
        url: up.url,
      });
      return;
    }
    var lic = data.license || {};
    var off = lic.valid !== true ||
      lic.blocked === true ||
      lic.status === "suspended" ||
      lic.status === "revoked" ||
      lic.status === "expired" ||
      lic.status === "not_found";
    if (off) {
      publish(lic.status || "invalid", false, false);
      try {
        localStorage.removeItem("ghost.cloud.licenseState");
        if (lic.status === "not_found" || lic.status === "revoked") localStorage.removeItem("ghost.cloud.licenseKey");
      } catch (e) {}
      if (window.GhostGate && window.GhostGate.lock) window.GhostGate.lock("");
      overlay({
        badge: "License " + (lic.status === "not_found" ? "removed" : lic.status),
        title: lic.message || "This activation key is turned off",
        body: "Contact Ghostae support on WhatsApp +880 1345 407572 to reactivate your key.",
      });
      return;
    }
    publish(lic.status || "active", true, false);
    clearOverlay();
    notice(lic.notice || data.notice || "");
  }
  function poll() {
    var url = BASE + "/api/public/v1/control";
    var key = licenseKey();
    if (!key) {
      publish("no_key", false, false);
      if (window.GhostGate && window.GhostGate.lock) window.GhostGate.lock("");
      return;
    }
    try {
      fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-ghost-panel": PANEL },
        body: JSON.stringify({ license_key: key, device_fingerprint: device(), panel: PANEL }),
        cache: "no-store"
      })
        .then(function (r) { if (!r.ok) throw new Error("control_" + r.status); return r.json(); })
        .then(function (d) {
          if (!d || d.ok !== true) throw new Error("control_body");
          FAILS = 0;
          apply(d);
        })
        .catch(function () {
          FAILS += 1;
          publish("offline", FAILS < 3, false);
          if (FAILS >= 3) {
            if (window.GhostGate && window.GhostGate.lock) window.GhostGate.lock("");
            overlay({
              badge: "Offline",
              title: "Ghostae cannot reach the licence server",
              body: "Connect to the internet once to keep using this panel.",
            });
          }
        });
    } catch (e) {}
  }
  window.GhostControlGate = { check: poll };
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", poll);
  else poll();
  setInterval(poll, POLL_MS);
  /* Re-verify as soon as the panel regains focus, so a key revoked while the
     panel sat idle locks immediately instead of up to POLL_MS later. */
  var LAST = 0;
  function recheck() {
    var now = Date.now();
    if (now - LAST < 15000) return;
    LAST = now;
    poll();
  }
  window.addEventListener("focus", recheck);
  document.addEventListener("visibilitychange", function () {
    if (!document.hidden) recheck();
  });
  window.addEventListener("online", recheck);
})();
if (typeof window !== "undefined" && window.__ghostStamp) {
  window.__ghostStamp(
    "ghost-feedback.js",
    "3.40.2+20260829.ui-perfect"
  );
}
(function(global) {
  "use strict";
  var BUILD = global.GHOST_BUILD && global.GHOST_BUILD.buildId || "dev";
  if (global.__ghostStamp) global.__ghostStamp("js/ghost-feedback.js", BUILD);
  var panelName = global.GHOST_PANEL_ID || document.documentElement.getAttribute("data-ghost-panel") || "unknown";
  var root = null;
  var els = {};
  var busy = false;
  function el(tag, cls, text) {
    var n = document.createElement(tag);
    if (cls) n.className = cls;
    if (text != null) n.textContent = text;
    return n;
  }
  function build() {
    if (root) return root;
    root = el("div", "ghost-fb");
    els.dot = el("button", "ghost-fb-dot");
    els.dot.type = "button";
    els.dot.title = "সমস্যা জানান / Report a problem";
    els.dot.setAttribute("aria-label", "Report a problem");
    root.appendChild(els.dot);
    els.sheet = el("div", "ghost-fb-sheet");
    els.sheet.appendChild(el("div", "ghost-fb-title", "কী সমস্যা হচ্ছে?"));
    els.sheet.appendChild(el("div", "ghost-fb-sub", "আপনার মন্তব্য সোজা GHOST admin panel-এ যাবে।"));
    els.severity = document.createElement("select");
    els.severity.className = "ghost-fb-select";
    [["issue", "Issue / সমস্যা"], ["bug", "Bug"], ["crash", "Crash"], ["idea", "Idea / পরামর্শ"]].forEach(function(pair) {
      var o = document.createElement("option");
      o.value = pair[0];
      o.textContent = pair[1];
      els.severity.appendChild(o);
    });
    els.sheet.appendChild(els.severity);
    els.text = document.createElement("textarea");
    els.text.className = "ghost-fb-text";
    els.text.rows = 4;
    els.text.placeholder = "যেমন: Text animation apply হচ্ছে কিন্তু bounce দেখা যাচ্ছে না…";
    els.sheet.appendChild(els.text);
    els.contact = document.createElement("input");
    els.contact.className = "ghost-fb-input";
    els.contact.type = "text";
    els.contact.placeholder = "Email (optional)";
    els.sheet.appendChild(els.contact);
    var row = el("div", "ghost-fb-row");
    els.send = el("button", "ghost-fb-btn ghost-fb-primary", "Send");
    els.send.type = "button";
    els.close = el("button", "ghost-fb-btn", "Close");
    els.close.type = "button";
    row.appendChild(els.send);
    row.appendChild(els.close);
    els.sheet.appendChild(row);
    els.status = el("div", "ghost-fb-status");
    els.sheet.appendChild(els.status);
    root.appendChild(els.sheet);
    (document.body || document.documentElement).appendChild(root);
    els.dot.addEventListener("click", function() {
      root.classList.toggle("is-open");
    });
    els.close.addEventListener("click", function() {
      root.classList.remove("is-open");
    });
    els.send.addEventListener("click", send);
    return root;
  }
  function status(text, kind) {
    if (!els.status) return;
    els.status.textContent = text || "";
    els.status.setAttribute("data-kind", kind || "info");
  }
  function send() {
    if (busy) return;
    var message = (els.text.value || "").trim();
    if (message.length < 3) return status("আরেকটু বিস্তারিত লিখুন।", "error");
    if (!global.GhostCloud || !global.GhostCloud.report) return status("Cloud client পাওয়া যায়নি।", "error");
    busy = true;
    els.send.disabled = true;
    status("পাঠানো হচ্ছে…", "info");
    global.GhostCloud.report({
      panel: panelName,
      message,
      contact: (els.contact.value || "").trim(),
      severity: els.severity.value
    }).then(function() {
      busy = false;
      els.send.disabled = false;
      els.text.value = "";
      status("ধন্যবাদ! রিপোর্ট পাঠানো হয়েছে ✔", "ok");
      setTimeout(function() {
        root.classList.remove("is-open");
      }, 1200);
    }).catch(function() {
      busy = false;
      els.send.disabled = false;
      status("Offline — পরে নিজে থেকেই পাঠানো হবে।", "warn");
    });
  }
  function boot() {
    build();
  }
  global.GhostBoot.push(boot);
  global.GhostFeedback = {
    open: function() {
      build().classList.add("is-open");
    },
    close: function() {
      if (root) root.classList.remove("is-open");
    }
  };
})(typeof window !== "undefined" ? window : this);
window.GHOST_EMOJI_DATA = [{ "id": "smileys", "icon": "😀", "label": "Smileys", "labelBn": "হাসিমুখ", "items": ["😀", "😃", "😄", "😁", "😆", "😅", "🤣", "😂", "🙂", "🙃", "🫠", "😉", "😊", "😇", "🥰", "😍", "🤩", "😘", "😗", "☺️", "😚", "😙", "🥲", "😋", "😛", "😜", "🤪", "😝", "🤑", "🤗", "🤭", "🫢", "🫣", "🤫", "🤔", "🫡", "🤐", "🤨", "😐", "😑", "😶", "🫥", "😶‍🌫️", "😏", "😒", "🙄", "😬", "😮‍💨", "🤥", "🫨", "🙂‍↔️", "🙂‍↕️", "😌", "😔", "😪", "🤤", "😴", "🫩", "😷", "🤒", "🤕", "🤢", "🤮", "🤧", "🥵", "🥶", "🥴", "😵", "😵‍💫", "🤯", "🤠", "🥳", "🥸", "😎", "🤓", "🧐", "😕", "🫤", "😟", "🙁", "☹️", "😮", "😯", "😲", "😳", "🥺", "🥹", "😦", "😧", "😨", "😰", "😥", "😢", "😭", "😱", "😖", "😣", "😞", "😓", "😩", "😫", "🥱", "😤", "😡", "😠", "🤬", "😈", "👿", "💀", "☠️", "💩", "🤡", "👹", "👺", "👻", "👽", "👾", "🤖", "😺", "😸", "😹", "😻", "😼", "😽", "🙀", "😿", "😾", "🙈", "🙉", "🙊", "💌", "💘", "💝", "💖", "💗", "💓", "💞", "💕", "💟", "❣️", "💔", "❤️‍🔥", "❤️‍🩹", "❤️", "🩷", "🧡", "💛", "💚", "💙", "🩵", "💜", "🤎", "🖤", "🩶", "🤍", "💋", "💯", "💢", "💥", "💫", "💦", "💨", "🕳️", "💬", "👁️‍🗨️", "🗨️", "🗯️", "💭", "💤"], "names": ["grinning face", "grinning face with big eyes", "grinning face with smiling eyes", "beaming face with smiling eyes", "grinning squinting face", "grinning face with sweat", "rolling on the floor laughing", "face with tears of joy", "slightly smiling face", "upside-down face", "melting face", "winking face", "smiling face with smiling eyes", "smiling face with halo", "smiling face with hearts", "smiling face with heart-eyes", "star-struck", "face blowing a kiss", "kissing face", "smiling face", "kissing face with closed eyes", "kissing face with smiling eyes", "smiling face with tear", "face savoring food", "face with tongue", "winking face with tongue", "zany face", "squinting face with tongue", "money-mouth face", "smiling face with open hands", "face with hand over mouth", "face with open eyes and hand over mouth", "face with peeking eye", "shushing face", "thinking face", "saluting face", "zipper-mouth face", "face with raised eyebrow", "neutral face", "expressionless face", "face without mouth", "dotted line face", "face in clouds", "smirking face", "unamused face", "face with rolling eyes", "grimacing face", "face exhaling", "lying face", "shaking face", "head shaking horizontally", "head shaking vertically", "relieved face", "pensive face", "sleepy face", "drooling face", "sleeping face", "face with bags under eyes", "face with medical mask", "face with thermometer", "face with head-bandage", "nauseated face", "face vomiting", "sneezing face", "hot face", "cold face", "woozy face", "face with crossed-out eyes", "face with spiral eyes", "exploding head", "cowboy hat face", "partying face", "disguised face", "smiling face with sunglasses", "nerd face", "face with monocle", "confused face", "face with diagonal mouth", "worried face", "slightly frowning face", "frowning face", "face with open mouth", "hushed face", "astonished face", "flushed face", "pleading face", "face holding back tears", "frowning face with open mouth", "anguished face", "fearful face", "anxious face with sweat", "sad but relieved face", "crying face", "loudly crying face", "face screaming in fear", "confounded face", "persevering face", "disappointed face", "downcast face with sweat", "weary face", "tired face", "yawning face", "face with steam from nose", "enraged face", "angry face", "face with symbols on mouth", "smiling face with horns", "angry face with horns", "skull", "skull and crossbones", "pile of poo", "clown face", "ogre", "goblin", "ghost", "alien", "alien monster", "robot", "grinning cat", "grinning cat with smiling eyes", "cat with tears of joy", "smiling cat with heart-eyes", "cat with wry smile", "kissing cat", "weary cat", "crying cat", "pouting cat", "see-no-evil monkey", "hear-no-evil monkey", "speak-no-evil monkey", "love letter", "heart with arrow", "heart with ribbon", "sparkling heart", "growing heart", "beating heart", "revolving hearts", "two hearts", "heart decoration", "heart exclamation", "broken heart", "heart on fire", "mending heart", "red heart", "pink heart", "orange heart", "yellow heart", "green heart", "blue heart", "light blue heart", "purple heart", "brown heart", "black heart", "grey heart", "white heart", "kiss mark", "hundred points", "anger symbol", "collision", "dizzy", "sweat droplets", "dashing away", "hole", "speech balloon", "eye in speech bubble", "left speech bubble", "right anger bubble", "thought balloon", "ZZZ"] }, { "id": "people", "icon": "🧑", "label": "People", "labelBn": "মানুষ", "items": ["👋", "🤚", "🖐️", "✋", "🖖", "🫱", "🫲", "🫳", "🫴", "🫷", "🫸", "👌", "🤌", "🤏", "✌️", "🤞", "🫰", "🤟", "🤘", "🤙", "👈", "👉", "👆", "🖕", "👇", "☝️", "🫵", "👍", "👎", "✊", "👊", "🤛", "🤜", "👏", "🙌", "🫶", "👐", "🤲", "🤝", "🙏", "✍️", "💅", "🤳", "💪", "🦾", "🦿", "🦵", "🦶", "👂", "🦻", "👃", "🧠", "🫀", "🫁", "🦷", "🦴", "👀", "👁️", "👅", "👄", "🫦", "👶", "🧒", "👦", "👧", "🧑", "👱", "👨", "🧔", "🧔‍♂️", "🧔‍♀️", "👨‍🦰", "👨‍🦱", "👨‍🦳", "👨‍🦲", "👩", "👩‍🦰", "🧑‍🦰", "👩‍🦱", "🧑‍🦱", "👩‍🦳", "🧑‍🦳", "👩‍🦲", "🧑‍🦲", "👱‍♀️", "👱‍♂️", "🧓", "👴", "👵", "🙍", "🙍‍♂️", "🙍‍♀️", "🙎", "🙎‍♂️", "🙎‍♀️", "🙅", "🙅‍♂️", "🙅‍♀️", "🙆", "🙆‍♂️", "🙆‍♀️", "💁", "💁‍♂️", "💁‍♀️", "🙋", "🙋‍♂️", "🙋‍♀️", "🧏", "🧏‍♂️", "🧏‍♀️", "🙇", "🙇‍♂️", "🙇‍♀️", "🤦", "🤦‍♂️", "🤦‍♀️", "🤷", "🤷‍♂️", "🤷‍♀️", "🧑‍⚕️", "👨‍⚕️", "👩‍⚕️", "🧑‍🎓", "👨‍🎓", "👩‍🎓", "🧑‍🏫", "👨‍🏫", "👩‍🏫", "🧑‍⚖️", "👨‍⚖️", "👩‍⚖️", "🧑‍🌾", "👨‍🌾", "👩‍🌾", "🧑‍🍳", "👨‍🍳", "👩‍🍳", "🧑‍🔧", "👨‍🔧", "👩‍🔧", "🧑‍🏭", "👨‍🏭", "👩‍🏭", "🧑‍💼", "👨‍💼", "👩‍💼", "🧑‍🔬", "👨‍🔬", "👩‍🔬", "🧑‍💻", "👨‍💻", "👩‍💻", "🧑‍🎤", "👨‍🎤", "👩‍🎤", "🧑‍🎨", "👨‍🎨", "👩‍🎨", "🧑‍✈️", "👨‍✈️", "👩‍✈️", "🧑‍🚀", "👨‍🚀", "👩‍🚀", "🧑‍🚒", "👨‍🚒", "👩‍🚒", "👮", "👮‍♂️", "👮‍♀️", "🕵️", "🕵️‍♂️", "🕵️‍♀️", "💂", "💂‍♂️", "💂‍♀️", "🥷", "👷", "👷‍♂️", "👷‍♀️", "🫅", "🤴", "👸", "👳", "👳‍♂️", "👳‍♀️", "👲", "🧕", "🤵", "🤵‍♂️", "🤵‍♀️", "👰", "👰‍♂️", "👰‍♀️", "🤰", "🫃", "🫄", "🤱", "👩‍🍼", "👨‍🍼", "🧑‍🍼", "👼", "🎅", "🤶", "🧑‍🎄", "🦸", "🦸‍♂️", "🦸‍♀️", "🦹", "🦹‍♂️", "🦹‍♀️", "🧙", "🧙‍♂️", "🧙‍♀️", "🧚", "🧚‍♂️", "🧚‍♀️", "🧛", "🧛‍♂️", "🧛‍♀️", "🧜", "🧜‍♂️", "🧜‍♀️", "🧝", "🧝‍♂️", "🧝‍♀️", "🧞", "🧞‍♂️", "🧞‍♀️", "🧟", "🧟‍♂️", "🧟‍♀️", "🧌", "💆", "💆‍♂️", "💆‍♀️", "💇", "💇‍♂️", "💇‍♀️", "🚶", "🚶‍♂️", "🚶‍♀️", "🚶‍➡️", "🚶‍♀️‍➡️", "🚶‍♂️‍➡️", "🧍", "🧍‍♂️", "🧍‍♀️", "🧎", "🧎‍♂️", "🧎‍♀️", "🧎‍➡️", "🧎‍♀️‍➡️", "🧎‍♂️‍➡️", "🧑‍🦯", "🧑‍🦯‍➡️", "👨‍🦯", "👨‍🦯‍➡️", "👩‍🦯", "👩‍🦯‍➡️", "🧑‍🦼", "🧑‍🦼‍➡️", "👨‍🦼", "👨‍🦼‍➡️", "👩‍🦼", "👩‍🦼‍➡️", "🧑‍🦽", "🧑‍🦽‍➡️", "👨‍🦽", "👨‍🦽‍➡️", "👩‍🦽", "👩‍🦽‍➡️", "🏃", "🏃‍♂️", "🏃‍♀️", "🏃‍➡️", "🏃‍♀️‍➡️", "🏃‍♂️‍➡️", "💃", "🕺", "🕴️", "👯", "👯‍♂️", "👯‍♀️", "🧖", "🧖‍♂️", "🧖‍♀️", "🧗", "🧗‍♂️", "🧗‍♀️", "🤺", "🏇", "⛷️", "🏂", "🏌️", "🏌️‍♂️", "🏌️‍♀️", "🏄", "🏄‍♂️", "🏄‍♀️", "🚣", "🚣‍♂️", "🚣‍♀️", "🏊", "🏊‍♂️", "🏊‍♀️", "⛹️", "⛹️‍♂️", "⛹️‍♀️", "🏋️", "🏋️‍♂️", "🏋️‍♀️", "🚴", "🚴‍♂️", "🚴‍♀️", "🚵", "🚵‍♂️", "🚵‍♀️", "🤸", "🤸‍♂️", "🤸‍♀️", "🤼", "🤼‍♂️", "🤼‍♀️", "🤽", "🤽‍♂️", "🤽‍♀️", "🤾", "🤾‍♂️", "🤾‍♀️", "🤹", "🤹‍♂️", "🤹‍♀️", "🧘", "🧘‍♂️", "🧘‍♀️", "🛀", "🛌", "🧑‍🤝‍🧑", "👭", "👫", "👬", "💏", "👩‍❤️‍💋‍👨", "👨‍❤️‍💋‍👨", "👩‍❤️‍💋‍👩", "💑", "👩‍❤️‍👨", "👨‍❤️‍👨", "👩‍❤️‍👩", "👨‍👩‍👦", "👨‍👩‍👧", "👨‍👩‍👧‍👦", "👨‍👩‍👦‍👦", "👨‍👩‍👧‍👧", "👨‍👨‍👦", "👨‍👨‍👧", "👨‍👨‍👧‍👦", "👨‍👨‍👦‍👦", "👨‍👨‍👧‍👧", "👩‍👩‍👦", "👩‍👩‍👧", "👩‍👩‍👧‍👦", "👩‍👩‍👦‍👦", "👩‍👩‍👧‍👧", "👨‍👦", "👨‍👦‍👦", "👨‍👧", "👨‍👧‍👦", "👨‍👧‍👧", "👩‍👦", "👩‍👦‍👦", "👩‍👧", "👩‍👧‍👦", "👩‍👧‍👧", "🗣️", "👤", "👥", "🫂", "👪", "🧑‍🧑‍🧒", "🧑‍🧑‍🧒‍🧒", "🧑‍🧒", "🧑‍🧒‍🧒", "👣", "🫆"], "names": ["waving hand", "raised back of hand", "hand with fingers splayed", "raised hand", "vulcan salute", "rightwards hand", "leftwards hand", "palm down hand", "palm up hand", "leftwards pushing hand", "rightwards pushing hand", "OK hand", "pinched fingers", "pinching hand", "victory hand", "crossed fingers", "hand with index finger and thumb crossed", "love-you gesture", "sign of the horns", "call me hand", "backhand index pointing left", "backhand index pointing right", "backhand index pointing up", "middle finger", "backhand index pointing down", "index pointing up", "index pointing at the viewer", "thumbs up", "thumbs down", "raised fist", "oncoming fist", "left-facing fist", "right-facing fist", "clapping hands", "raising hands", "heart hands", "open hands", "palms up together", "handshake", "folded hands", "writing hand", "nail polish", "selfie", "flexed biceps", "mechanical arm", "mechanical leg", "leg", "foot", "ear", "ear with hearing aid", "nose", "brain", "anatomical heart", "lungs", "tooth", "bone", "eyes", "eye", "tongue", "mouth", "biting lip", "baby", "child", "boy", "girl", "person", "person: blond hair", "man", "person: beard", "man: beard", "woman: beard", "man: red hair", "man: curly hair", "man: white hair", "man: bald", "woman", "woman: red hair", "person: red hair", "woman: curly hair", "person: curly hair", "woman: white hair", "person: white hair", "woman: bald", "person: bald", "woman: blond hair", "man: blond hair", "older person", "old man", "old woman", "person frowning", "man frowning", "woman frowning", "person pouting", "man pouting", "woman pouting", "person gesturing NO", "man gesturing NO", "woman gesturing NO", "person gesturing OK", "man gesturing OK", "woman gesturing OK", "person tipping hand", "man tipping hand", "woman tipping hand", "person raising hand", "man raising hand", "woman raising hand", "deaf person", "deaf man", "deaf woman", "person bowing", "man bowing", "woman bowing", "person facepalming", "man facepalming", "woman facepalming", "person shrugging", "man shrugging", "woman shrugging", "health worker", "man health worker", "woman health worker", "student", "man student", "woman student", "teacher", "man teacher", "woman teacher", "judge", "man judge", "woman judge", "farmer", "man farmer", "woman farmer", "cook", "man cook", "woman cook", "mechanic", "man mechanic", "woman mechanic", "factory worker", "man factory worker", "woman factory worker", "office worker", "man office worker", "woman office worker", "scientist", "man scientist", "woman scientist", "technologist", "man technologist", "woman technologist", "singer", "man singer", "woman singer", "artist", "man artist", "woman artist", "pilot", "man pilot", "woman pilot", "astronaut", "man astronaut", "woman astronaut", "firefighter", "man firefighter", "woman firefighter", "police officer", "man police officer", "woman police officer", "detective", "man detective", "woman detective", "guard", "man guard", "woman guard", "ninja", "construction worker", "man construction worker", "woman construction worker", "person with crown", "prince", "princess", "person wearing turban", "man wearing turban", "woman wearing turban", "person with skullcap", "woman with headscarf", "person in tuxedo", "man in tuxedo", "woman in tuxedo", "person with veil", "man with veil", "woman with veil", "pregnant woman", "pregnant man", "pregnant person", "breast-feeding", "woman feeding baby", "man feeding baby", "person feeding baby", "baby angel", "Santa Claus", "Mrs. Claus", "Mx Claus", "superhero", "man superhero", "woman superhero", "supervillain", "man supervillain", "woman supervillain", "mage", "man mage", "woman mage", "fairy", "man fairy", "woman fairy", "vampire", "man vampire", "woman vampire", "merperson", "merman", "mermaid", "elf", "man elf", "woman elf", "genie", "man genie", "woman genie", "zombie", "man zombie", "woman zombie", "troll", "person getting massage", "man getting massage", "woman getting massage", "person getting haircut", "man getting haircut", "woman getting haircut", "person walking", "man walking", "woman walking", "person walking facing right", "woman walking facing right", "man walking facing right", "person standing", "man standing", "woman standing", "person kneeling", "man kneeling", "woman kneeling", "person kneeling facing right", "woman kneeling facing right", "man kneeling facing right", "person with white cane", "person with white cane facing right", "man with white cane", "man with white cane facing right", "woman with white cane", "woman with white cane facing right", "person in motorized wheelchair", "person in motorized wheelchair facing right", "man in motorized wheelchair", "man in motorized wheelchair facing right", "woman in motorized wheelchair", "woman in motorized wheelchair facing right", "person in manual wheelchair", "person in manual wheelchair facing right", "man in manual wheelchair", "man in manual wheelchair facing right", "woman in manual wheelchair", "woman in manual wheelchair facing right", "person running", "man running", "woman running", "person running facing right", "woman running facing right", "man running facing right", "woman dancing", "man dancing", "person in suit levitating", "people with bunny ears", "men with bunny ears", "women with bunny ears", "person in steamy room", "man in steamy room", "woman in steamy room", "person climbing", "man climbing", "woman climbing", "person fencing", "horse racing", "skier", "snowboarder", "person golfing", "man golfing", "woman golfing", "person surfing", "man surfing", "woman surfing", "person rowing boat", "man rowing boat", "woman rowing boat", "person swimming", "man swimming", "woman swimming", "person bouncing ball", "man bouncing ball", "woman bouncing ball", "person lifting weights", "man lifting weights", "woman lifting weights", "person biking", "man biking", "woman biking", "person mountain biking", "man mountain biking", "woman mountain biking", "person cartwheeling", "man cartwheeling", "woman cartwheeling", "people wrestling", "men wrestling", "women wrestling", "person playing water polo", "man playing water polo", "woman playing water polo", "person playing handball", "man playing handball", "woman playing handball", "person juggling", "man juggling", "woman juggling", "person in lotus position", "man in lotus position", "woman in lotus position", "person taking bath", "person in bed", "people holding hands", "women holding hands", "woman and man holding hands", "men holding hands", "kiss", "kiss: woman, man", "kiss: man, man", "kiss: woman, woman", "couple with heart", "couple with heart: woman, man", "couple with heart: man, man", "couple with heart: woman, woman", "family: man, woman, boy", "family: man, woman, girl", "family: man, woman, girl, boy", "family: man, woman, boy, boy", "family: man, woman, girl, girl", "family: man, man, boy", "family: man, man, girl", "family: man, man, girl, boy", "family: man, man, boy, boy", "family: man, man, girl, girl", "family: woman, woman, boy", "family: woman, woman, girl", "family: woman, woman, girl, boy", "family: woman, woman, boy, boy", "family: woman, woman, girl, girl", "family: man, boy", "family: man, boy, boy", "family: man, girl", "family: man, girl, boy", "family: man, girl, girl", "family: woman, boy", "family: woman, boy, boy", "family: woman, girl", "family: woman, girl, boy", "family: woman, girl, girl", "speaking head", "bust in silhouette", "busts in silhouette", "people hugging", "family", "family: adult, adult, child", "family: adult, adult, child, child", "family: adult, child", "family: adult, child, child", "footprints", "fingerprint"] }, { "id": "nature", "icon": "🌸", "label": "Animals & Nature", "labelBn": "প্রকৃতি", "items": ["🐵", "🐒", "🦍", "🦧", "🐶", "🐕", "🦮", "🐕‍🦺", "🐩", "🐺", "🦊", "🦝", "🐱", "🐈", "🐈‍⬛", "🦁", "🐯", "🐅", "🐆", "🐴", "🫎", "🫏", "🐎", "🦄", "🦓", "🦌", "🦬", "🐮", "🐂", "🐃", "🐄", "🐷", "🐖", "🐗", "🐽", "🐏", "🐑", "🐐", "🐪", "🐫", "🦙", "🦒", "🐘", "🦣", "🦏", "🦛", "🐭", "🐁", "🐀", "🐹", "🐰", "🐇", "🐿️", "🦫", "🦔", "🦇", "🐻", "🐻‍❄️", "🐨", "🐼", "🦥", "🦦", "🦨", "🦘", "🦡", "🐾", "🦃", "🐔", "🐓", "🐣", "🐤", "🐥", "🐦", "🐧", "🕊️", "🦅", "🦆", "🦢", "🦉", "🦤", "🪶", "🦩", "🦚", "🦜", "🪽", "🐦‍⬛", "🪿", "🐦‍🔥", "🐸", "🐊", "🐢", "🦎", "🐍", "🐲", "🐉", "🦕", "🦖", "🐳", "🐋", "🐬", "🦭", "🐟", "🐠", "🐡", "🦈", "🐙", "🐚", "🪸", "🪼", "🦀", "🦞", "🦐", "🦑", "🦪", "🐌", "🦋", "🐛", "🐜", "🐝", "🪲", "🐞", "🦗", "🪳", "🕷️", "🕸️", "🦂", "🦟", "🪰", "🪱", "🦠", "💐", "🌸", "💮", "🪷", "🏵️", "🌹", "🥀", "🌺", "🌻", "🌼", "🌷", "🪻", "🌱", "🪴", "🌲", "🌳", "🌴", "🌵", "🌾", "🌿", "☘️", "🍀", "🍁", "🍂", "🍃", "🪹", "🪺", "🍄", "🪾"], "names": ["monkey face", "monkey", "gorilla", "orangutan", "dog face", "dog", "guide dog", "service dog", "poodle", "wolf", "fox", "raccoon", "cat face", "cat", "black cat", "lion", "tiger face", "tiger", "leopard", "horse face", "moose", "donkey", "horse", "unicorn", "zebra", "deer", "bison", "cow face", "ox", "water buffalo", "cow", "pig face", "pig", "boar", "pig nose", "ram", "ewe", "goat", "camel", "two-hump camel", "llama", "giraffe", "elephant", "mammoth", "rhinoceros", "hippopotamus", "mouse face", "mouse", "rat", "hamster", "rabbit face", "rabbit", "chipmunk", "beaver", "hedgehog", "bat", "bear", "polar bear", "koala", "panda", "sloth", "otter", "skunk", "kangaroo", "badger", "paw prints", "turkey", "chicken", "rooster", "hatching chick", "baby chick", "front-facing baby chick", "bird", "penguin", "dove", "eagle", "duck", "swan", "owl", "dodo", "feather", "flamingo", "peacock", "parrot", "wing", "black bird", "goose", "phoenix", "frog", "crocodile", "turtle", "lizard", "snake", "dragon face", "dragon", "sauropod", "T-Rex", "spouting whale", "whale", "dolphin", "seal", "fish", "tropical fish", "blowfish", "shark", "octopus", "spiral shell", "coral", "jellyfish", "crab", "lobster", "shrimp", "squid", "oyster", "snail", "butterfly", "bug", "ant", "honeybee", "beetle", "lady beetle", "cricket", "cockroach", "spider", "spider web", "scorpion", "mosquito", "fly", "worm", "microbe", "bouquet", "cherry blossom", "white flower", "lotus", "rosette", "rose", "wilted flower", "hibiscus", "sunflower", "blossom", "tulip", "hyacinth", "seedling", "potted plant", "evergreen tree", "deciduous tree", "palm tree", "cactus", "sheaf of rice", "herb", "shamrock", "four leaf clover", "maple leaf", "fallen leaf", "leaf fluttering in wind", "empty nest", "nest with eggs", "mushroom", "leafless tree"] }, { "id": "food", "icon": "🍔", "label": "Food", "labelBn": "খাবার", "items": ["🍇", "🍈", "🍉", "🍊", "🍋", "🍋‍🟩", "🍌", "🍍", "🥭", "🍎", "🍏", "🍐", "🍑", "🍒", "🍓", "🫐", "🥝", "🍅", "🫒", "🥥", "🥑", "🍆", "🥔", "🥕", "🌽", "🌶️", "🫑", "🥒", "🥬", "🥦", "🧄", "🧅", "🥜", "🫘", "🌰", "🫚", "🫛", "🍄‍🟫", "🫜", "🍞", "🥐", "🥖", "🫓", "🥨", "🥯", "🥞", "🧇", "🧀", "🍖", "🍗", "🥩", "🥓", "🍔", "🍟", "🍕", "🌭", "🥪", "🌮", "🌯", "🫔", "🥙", "🧆", "🥚", "🍳", "🥘", "🍲", "🫕", "🥣", "🥗", "🍿", "🧈", "🧂", "🥫", "🍱", "🍘", "🍙", "🍚", "🍛", "🍜", "🍝", "🍠", "🍢", "🍣", "🍤", "🍥", "🥮", "🍡", "🥟", "🥠", "🥡", "🍦", "🍧", "🍨", "🍩", "🍪", "🎂", "🍰", "🧁", "🥧", "🍫", "🍬", "🍭", "🍮", "🍯", "🍼", "🥛", "☕", "🫖", "🍵", "🍶", "🍾", "🍷", "🍸", "🍹", "🍺", "🍻", "🥂", "🥃", "🫗", "🥤", "🧋", "🧃", "🧉", "🧊", "🥢", "🍽️", "🍴", "🥄", "🔪", "🫙", "🏺"], "names": ["grapes", "melon", "watermelon", "tangerine", "lemon", "lime", "banana", "pineapple", "mango", "red apple", "green apple", "pear", "peach", "cherries", "strawberry", "blueberries", "kiwi fruit", "tomato", "olive", "coconut", "avocado", "eggplant", "potato", "carrot", "ear of corn", "hot pepper", "bell pepper", "cucumber", "leafy green", "broccoli", "garlic", "onion", "peanuts", "beans", "chestnut", "ginger root", "pea pod", "brown mushroom", "root vegetable", "bread", "croissant", "baguette bread", "flatbread", "pretzel", "bagel", "pancakes", "waffle", "cheese wedge", "meat on bone", "poultry leg", "cut of meat", "bacon", "hamburger", "french fries", "pizza", "hot dog", "sandwich", "taco", "burrito", "tamale", "stuffed flatbread", "falafel", "egg", "cooking", "shallow pan of food", "pot of food", "fondue", "bowl with spoon", "green salad", "popcorn", "butter", "salt", "canned food", "bento box", "rice cracker", "rice ball", "cooked rice", "curry rice", "steaming bowl", "spaghetti", "roasted sweet potato", "oden", "sushi", "fried shrimp", "fish cake with swirl", "moon cake", "dango", "dumpling", "fortune cookie", "takeout box", "soft ice cream", "shaved ice", "ice cream", "doughnut", "cookie", "birthday cake", "shortcake", "cupcake", "pie", "chocolate bar", "candy", "lollipop", "custard", "honey pot", "baby bottle", "glass of milk", "hot beverage", "teapot", "teacup without handle", "sake", "bottle with popping cork", "wine glass", "cocktail glass", "tropical drink", "beer mug", "clinking beer mugs", "clinking glasses", "tumbler glass", "pouring liquid", "cup with straw", "bubble tea", "beverage box", "mate", "ice", "chopsticks", "fork and knife with plate", "fork and knife", "spoon", "kitchen knife", "jar", "amphora"] }, { "id": "travel", "icon": "✈️", "label": "Travel", "labelBn": "ভ্রমণ", "items": ["🌍", "🌎", "🌏", "🌐", "🗺️", "🗾", "🧭", "🏔️", "⛰️", "🌋", "🗻", "🏕️", "🏖️", "🏜️", "🏝️", "🏞️", "🏟️", "🏛️", "🏗️", "🧱", "🪨", "🪵", "🛖", "🏘️", "🏚️", "🏠", "🏡", "🏢", "🏣", "🏤", "🏥", "🏦", "🏨", "🏩", "🏪", "🏫", "🏬", "🏭", "🏯", "🏰", "💒", "🗼", "🗽", "⛪", "🕌", "🛕", "🕍", "⛩️", "🕋", "⛲", "⛺", "🌁", "🌃", "🏙️", "🌄", "🌅", "🌆", "🌇", "🌉", "♨️", "🎠", "🛝", "🎡", "🎢", "💈", "🎪", "🚂", "🚃", "🚄", "🚅", "🚆", "🚇", "🚈", "🚉", "🚊", "🚝", "🚞", "🚋", "🚌", "🚍", "🚎", "🚐", "🚑", "🚒", "🚓", "🚔", "🚕", "🚖", "🚗", "🚘", "🚙", "🛻", "🚚", "🚛", "🚜", "🏎️", "🏍️", "🛵", "🦽", "🦼", "🛺", "🚲", "🛴", "🛹", "🛼", "🚏", "🛣️", "🛤️", "🛢️", "⛽", "🛞", "🚨", "🚥", "🚦", "🛑", "🚧", "⚓", "🛟", "⛵", "🛶", "🚤", "🛳️", "⛴️", "🛥️", "🚢", "✈️", "🛩️", "🛫", "🛬", "🪂", "💺", "🚁", "🚟", "🚠", "🚡", "🛰️", "🚀", "🛸", "🛎️", "🧳", "⌛", "⏳", "⌚", "⏰", "⏱️", "⏲️", "🕰️", "🕛", "🕧", "🕐", "🕜", "🕑", "🕝", "🕒", "🕞", "🕓", "🕟", "🕔", "🕠", "🕕", "🕡", "🕖", "🕢", "🕗", "🕣", "🕘", "🕤", "🕙", "🕥", "🕚", "🕦", "🌑", "🌒", "🌓", "🌔", "🌕", "🌖", "🌗", "🌘", "🌙", "🌚", "🌛", "🌜", "🌡️", "☀️", "🌝", "🌞", "🪐", "⭐", "🌟", "🌠", "🌌", "☁️", "⛅", "⛈️", "🌤️", "🌥️", "🌦️", "🌧️", "🌨️", "🌩️", "🌪️", "🌫️", "🌬️", "🌀", "🌈", "🌂", "☂️", "☔", "⛱️", "⚡", "❄️", "☃️", "⛄", "☄️", "🔥", "💧", "🌊"], "names": ["globe showing Europe-Africa", "globe showing Americas", "globe showing Asia-Australia", "globe with meridians", "world map", "map of Japan", "compass", "snow-capped mountain", "mountain", "volcano", "mount fuji", "camping", "beach with umbrella", "desert", "desert island", "national park", "stadium", "classical building", "building construction", "brick", "rock", "wood", "hut", "houses", "derelict house", "house", "house with garden", "office building", "Japanese post office", "post office", "hospital", "bank", "hotel", "love hotel", "convenience store", "school", "department store", "factory", "Japanese castle", "castle", "wedding", "Tokyo tower", "Statue of Liberty", "church", "mosque", "hindu temple", "synagogue", "shinto shrine", "kaaba", "fountain", "tent", "foggy", "night with stars", "cityscape", "sunrise over mountains", "sunrise", "cityscape at dusk", "sunset", "bridge at night", "hot springs", "carousel horse", "playground slide", "ferris wheel", "roller coaster", "barber pole", "circus tent", "locomotive", "railway car", "high-speed train", "bullet train", "train", "metro", "light rail", "station", "tram", "monorail", "mountain railway", "tram car", "bus", "oncoming bus", "trolleybus", "minibus", "ambulance", "fire engine", "police car", "oncoming police car", "taxi", "oncoming taxi", "automobile", "oncoming automobile", "sport utility vehicle", "pickup truck", "delivery truck", "articulated lorry", "tractor", "racing car", "motorcycle", "motor scooter", "manual wheelchair", "motorized wheelchair", "auto rickshaw", "bicycle", "kick scooter", "skateboard", "roller skate", "bus stop", "motorway", "railway track", "oil drum", "fuel pump", "wheel", "police car light", "horizontal traffic light", "vertical traffic light", "stop sign", "construction", "anchor", "ring buoy", "sailboat", "canoe", "speedboat", "passenger ship", "ferry", "motor boat", "ship", "airplane", "small airplane", "airplane departure", "airplane arrival", "parachute", "seat", "helicopter", "suspension railway", "mountain cableway", "aerial tramway", "satellite", "rocket", "flying saucer", "bellhop bell", "luggage", "hourglass done", "hourglass not done", "watch", "alarm clock", "stopwatch", "timer clock", "mantelpiece clock", "twelve o’clock", "twelve-thirty", "one o’clock", "one-thirty", "two o’clock", "two-thirty", "three o’clock", "three-thirty", "four o’clock", "four-thirty", "five o’clock", "five-thirty", "six o’clock", "six-thirty", "seven o’clock", "seven-thirty", "eight o’clock", "eight-thirty", "nine o’clock", "nine-thirty", "ten o’clock", "ten-thirty", "eleven o’clock", "eleven-thirty", "new moon", "waxing crescent moon", "first quarter moon", "waxing gibbous moon", "full moon", "waning gibbous moon", "last quarter moon", "waning crescent moon", "crescent moon", "new moon face", "first quarter moon face", "last quarter moon face", "thermometer", "sun", "full moon face", "sun with face", "ringed planet", "star", "glowing star", "shooting star", "milky way", "cloud", "sun behind cloud", "cloud with lightning and rain", "sun behind small cloud", "sun behind large cloud", "sun behind rain cloud", "cloud with rain", "cloud with snow", "cloud with lightning", "tornado", "fog", "wind face", "cyclone", "rainbow", "closed umbrella", "umbrella", "umbrella with rain drops", "umbrella on ground", "high voltage", "snowflake", "snowman", "snowman without snow", "comet", "fire", "droplet", "water wave"] }, { "id": "activities", "icon": "⚽", "label": "Activities", "labelBn": "খেলা", "items": ["🎃", "🎄", "🎆", "🎇", "🧨", "✨", "🎈", "🎉", "🎊", "🎋", "🎍", "🎎", "🎏", "🎐", "🎑", "🧧", "🎀", "🎁", "🎗️", "🎟️", "🎫", "🎖️", "🏆", "🏅", "🥇", "🥈", "🥉", "⚽", "⚾", "🥎", "🏀", "🏐", "🏈", "🏉", "🎾", "🥏", "🎳", "🏏", "🏑", "🏒", "🥍", "🏓", "🏸", "🥊", "🥋", "🥅", "⛳", "⛸️", "🎣", "🤿", "🎽", "🎿", "🛷", "🥌", "🎯", "🪀", "🪁", "🔫", "🎱", "🔮", "🪄", "🎮", "🕹️", "🎰", "🎲", "🧩", "🧸", "🪅", "🪩", "🪆", "♠️", "♥️", "♦️", "♣️", "♟️", "🃏", "🀄", "🎴", "🎭", "🖼️", "🎨", "🧵", "🪡", "🧶", "🪢"], "names": ["jack-o-lantern", "Christmas tree", "fireworks", "sparkler", "firecracker", "sparkles", "balloon", "party popper", "confetti ball", "tanabata tree", "pine decoration", "Japanese dolls", "carp streamer", "wind chime", "moon viewing ceremony", "red envelope", "ribbon", "wrapped gift", "reminder ribbon", "admission tickets", "ticket", "military medal", "trophy", "sports medal", "1st place medal", "2nd place medal", "3rd place medal", "soccer ball", "baseball", "softball", "basketball", "volleyball", "american football", "rugby football", "tennis", "flying disc", "bowling", "cricket game", "field hockey", "ice hockey", "lacrosse", "ping pong", "badminton", "boxing glove", "martial arts uniform", "goal net", "flag in hole", "ice skate", "fishing pole", "diving mask", "running shirt", "skis", "sled", "curling stone", "bullseye", "yo-yo", "kite", "water pistol", "pool 8 ball", "crystal ball", "magic wand", "video game", "joystick", "slot machine", "game die", "puzzle piece", "teddy bear", "piñata", "mirror ball", "nesting dolls", "spade suit", "heart suit", "diamond suit", "club suit", "chess pawn", "joker", "mahjong red dragon", "flower playing cards", "performing arts", "framed picture", "artist palette", "thread", "sewing needle", "yarn", "knot"] }, { "id": "objects", "icon": "💡", "label": "Objects", "labelBn": "বস্তু", "items": ["👓", "🕶️", "🥽", "🥼", "🦺", "👔", "👕", "👖", "🧣", "🧤", "🧥", "🧦", "👗", "👘", "🥻", "🩱", "🩲", "🩳", "👙", "👚", "🪭", "👛", "👜", "👝", "🛍️", "🎒", "🩴", "👞", "👟", "🥾", "🥿", "👠", "👡", "🩰", "👢", "🪮", "👑", "👒", "🎩", "🎓", "🧢", "🪖", "⛑️", "📿", "💄", "💍", "💎", "🔇", "🔈", "🔉", "🔊", "📢", "📣", "📯", "🔔", "🔕", "🎼", "🎵", "🎶", "🎙️", "🎚️", "🎛️", "🎤", "🎧", "📻", "🎷", "🪗", "🎸", "🎹", "🎺", "🎻", "🪕", "🥁", "🪘", "🪇", "🪈", "🪉", "📱", "📲", "☎️", "📞", "📟", "📠", "🔋", "🪫", "🔌", "💻", "🖥️", "🖨️", "⌨️", "🖱️", "🖲️", "💽", "💾", "💿", "📀", "🧮", "🎥", "🎞️", "📽️", "🎬", "📺", "📷", "📸", "📹", "📼", "🔍", "🔎", "🕯️", "💡", "🔦", "🏮", "🪔", "📔", "📕", "📖", "📗", "📘", "📙", "📚", "📓", "📒", "📃", "📜", "📄", "📰", "🗞️", "📑", "🔖", "🏷️", "💰", "🪙", "💴", "💵", "💶", "💷", "💸", "💳", "🧾", "💹", "✉️", "📧", "📨", "📩", "📤", "📥", "📦", "📫", "📪", "📬", "📭", "📮", "🗳️", "✏️", "✒️", "🖋️", "🖊️", "🖌️", "🖍️", "📝", "💼", "📁", "📂", "🗂️", "📅", "📆", "🗒️", "🗓️", "📇", "📈", "📉", "📊", "📋", "📌", "📍", "📎", "🖇️", "📏", "📐", "✂️", "🗃️", "🗄️", "🗑️", "🔒", "🔓", "🔏", "🔐", "🔑", "🗝️", "🔨", "🪓", "⛏️", "⚒️", "🛠️", "🗡️", "⚔️", "💣", "🪃", "🏹", "🛡️", "🪚", "🔧", "🪛", "🔩", "⚙️", "🗜️", "⚖️", "🦯", "🔗", "⛓️‍💥", "⛓️", "🪝", "🧰", "🧲", "🪜", "🪏", "⚗️", "🧪", "🧫", "🧬", "🔬", "🔭", "📡", "💉", "🩸", "💊", "🩹", "🩼", "🩺", "🩻", "🚪", "🛗", "🪞", "🪟", "🛏️", "🛋️", "🪑", "🚽", "🪠", "🚿", "🛁", "🪤", "🪒", "🧴", "🧷", "🧹", "🧺", "🧻", "🪣", "🧼", "🫧", "🪥", "🧽", "🧯", "🛒", "🚬", "⚰️", "🪦", "⚱️", "🧿", "🪬", "🗿", "🪧", "🪪"], "names": ["glasses", "sunglasses", "goggles", "lab coat", "safety vest", "necktie", "t-shirt", "jeans", "scarf", "gloves", "coat", "socks", "dress", "kimono", "sari", "one-piece swimsuit", "briefs", "shorts", "bikini", "woman’s clothes", "folding hand fan", "purse", "handbag", "clutch bag", "shopping bags", "backpack", "thong sandal", "man’s shoe", "running shoe", "hiking boot", "flat shoe", "high-heeled shoe", "woman’s sandal", "ballet shoes", "woman’s boot", "hair pick", "crown", "woman’s hat", "top hat", "graduation cap", "billed cap", "military helmet", "rescue worker’s helmet", "prayer beads", "lipstick", "ring", "gem stone", "muted speaker", "speaker low volume", "speaker medium volume", "speaker high volume", "loudspeaker", "megaphone", "postal horn", "bell", "bell with slash", "musical score", "musical note", "musical notes", "studio microphone", "level slider", "control knobs", "microphone", "headphone", "radio", "saxophone", "accordion", "guitar", "musical keyboard", "trumpet", "violin", "banjo", "drum", "long drum", "maracas", "flute", "harp", "mobile phone", "mobile phone with arrow", "telephone", "telephone receiver", "pager", "fax machine", "battery", "low battery", "electric plug", "laptop", "desktop computer", "printer", "keyboard", "computer mouse", "trackball", "computer disk", "floppy disk", "optical disk", "dvd", "abacus", "movie camera", "film frames", "film projector", "clapper board", "television", "camera", "camera with flash", "video camera", "videocassette", "magnifying glass tilted left", "magnifying glass tilted right", "candle", "light bulb", "flashlight", "red paper lantern", "diya lamp", "notebook with decorative cover", "closed book", "open book", "green book", "blue book", "orange book", "books", "notebook", "ledger", "page with curl", "scroll", "page facing up", "newspaper", "rolled-up newspaper", "bookmark tabs", "bookmark", "label", "money bag", "coin", "yen banknote", "dollar banknote", "euro banknote", "pound banknote", "money with wings", "credit card", "receipt", "chart increasing with yen", "envelope", "e-mail", "incoming envelope", "envelope with arrow", "outbox tray", "inbox tray", "package", "closed mailbox with raised flag", "closed mailbox with lowered flag", "open mailbox with raised flag", "open mailbox with lowered flag", "postbox", "ballot box with ballot", "pencil", "black nib", "fountain pen", "pen", "paintbrush", "crayon", "memo", "briefcase", "file folder", "open file folder", "card index dividers", "calendar", "tear-off calendar", "spiral notepad", "spiral calendar", "card index", "chart increasing", "chart decreasing", "bar chart", "clipboard", "pushpin", "round pushpin", "paperclip", "linked paperclips", "straight ruler", "triangular ruler", "scissors", "card file box", "file cabinet", "wastebasket", "locked", "unlocked", "locked with pen", "locked with key", "key", "old key", "hammer", "axe", "pick", "hammer and pick", "hammer and wrench", "dagger", "crossed swords", "bomb", "boomerang", "bow and arrow", "shield", "carpentry saw", "wrench", "screwdriver", "nut and bolt", "gear", "clamp", "balance scale", "white cane", "link", "broken chain", "chains", "hook", "toolbox", "magnet", "ladder", "shovel", "alembic", "test tube", "petri dish", "dna", "microscope", "telescope", "satellite antenna", "syringe", "drop of blood", "pill", "adhesive bandage", "crutch", "stethoscope", "x-ray", "door", "elevator", "mirror", "window", "bed", "couch and lamp", "chair", "toilet", "plunger", "shower", "bathtub", "mouse trap", "razor", "lotion bottle", "safety pin", "broom", "basket", "roll of paper", "bucket", "soap", "bubbles", "toothbrush", "sponge", "fire extinguisher", "shopping cart", "cigarette", "coffin", "headstone", "funeral urn", "nazar amulet", "hamsa", "moai", "placard", "identification card"] }, { "id": "symbols", "icon": "✅", "label": "Symbols", "labelBn": "প্রতীক", "items": ["🏧", "🚮", "🚰", "♿", "🚹", "🚺", "🚻", "🚼", "🚾", "🛂", "🛃", "🛄", "🛅", "⚠️", "🚸", "⛔", "🚫", "🚳", "🚭", "🚯", "🚱", "🚷", "📵", "🔞", "☢️", "☣️", "⬆️", "↗️", "➡️", "↘️", "⬇️", "↙️", "⬅️", "↖️", "↕️", "↔️", "↩️", "↪️", "⤴️", "⤵️", "🔃", "🔄", "🔙", "🔚", "🔛", "🔜", "🔝", "🛐", "⚛️", "🕉️", "✡️", "☸️", "☯️", "✝️", "☦️", "☪️", "☮️", "🕎", "🔯", "🪯", "♈", "♉", "♊", "♋", "♌", "♍", "♎", "♏", "♐", "♑", "♒", "♓", "⛎", "🔀", "🔁", "🔂", "▶️", "⏩", "⏭️", "⏯️", "◀️", "⏪", "⏮️", "🔼", "⏫", "🔽", "⏬", "⏸️", "⏹️", "⏺️", "⏏️", "🎦", "🔅", "🔆", "📶", "🛜", "📳", "📴", "♀️", "♂️", "⚧️", "✖️", "➕", "➖", "➗", "🟰", "♾️", "‼️", "⁉️", "❓", "❔", "❕", "❗", "〰️", "💱", "💲", "⚕️", "♻️", "⚜️", "🔱", "📛", "🔰", "⭕", "✅", "☑️", "✔️", "❌", "❎", "➰", "➿", "〽️", "✳️", "✴️", "❇️", "©️", "®️", "™️", "🫟", "#️⃣", "*️⃣", "0️⃣", "1️⃣", "2️⃣", "3️⃣", "4️⃣", "5️⃣", "6️⃣", "7️⃣", "8️⃣", "9️⃣", "🔟", "🔠", "🔡", "🔢", "🔣", "🔤", "🅰️", "🆎", "🅱️", "🆑", "🆒", "🆓", "ℹ️", "🆔", "Ⓜ️", "🆕", "🆖", "🅾️", "🆗", "🅿️", "🆘", "🆙", "🆚", "🈁", "🈂️", "🈷️", "🈶", "🈯", "🉐", "🈹", "🈚", "🈲", "🉑", "🈸", "🈴", "🈳", "㊗️", "㊙️", "🈺", "🈵", "🔴", "🟠", "🟡", "🟢", "🔵", "🟣", "🟤", "⚫", "⚪", "🟥", "🟧", "🟨", "🟩", "🟦", "🟪", "🟫", "⬛", "⬜", "◼️", "◻️", "◾", "◽", "▪️", "▫️", "🔶", "🔷", "🔸", "🔹", "🔺", "🔻", "💠", "🔘", "🔳", "🔲", "★", "☆", "✦", "❖", "➜", "∞", "™", "⌘"], "names": ["ATM sign", "litter in bin sign", "potable water", "wheelchair symbol", "men’s room", "women’s room", "restroom", "baby symbol", "water closet", "passport control", "customs", "baggage claim", "left luggage", "warning", "children crossing", "no entry", "prohibited", "no bicycles", "no smoking", "no littering", "non-potable water", "no pedestrians", "no mobile phones", "no one under eighteen", "radioactive", "biohazard", "up arrow", "up-right arrow", "right arrow", "down-right arrow", "down arrow", "down-left arrow", "left arrow", "up-left arrow", "up-down arrow", "left-right arrow", "right arrow curving left", "left arrow curving right", "right arrow curving up", "right arrow curving down", "clockwise vertical arrows", "counterclockwise arrows button", "BACK arrow", "END arrow", "ON! arrow", "SOON arrow", "TOP arrow", "place of worship", "atom symbol", "om", "star of David", "wheel of dharma", "yin yang", "latin cross", "orthodox cross", "star and crescent", "peace symbol", "menorah", "dotted six-pointed star", "khanda", "Aries", "Taurus", "Gemini", "Cancer", "Leo", "Virgo", "Libra", "Scorpio", "Sagittarius", "Capricorn", "Aquarius", "Pisces", "Ophiuchus", "shuffle tracks button", "repeat button", "repeat single button", "play button", "fast-forward button", "next track button", "play or pause button", "reverse button", "fast reverse button", "last track button", "upwards button", "fast up button", "downwards button", "fast down button", "pause button", "stop button", "record button", "eject button", "cinema", "dim button", "bright button", "antenna bars", "wireless", "vibration mode", "mobile phone off", "female sign", "male sign", "transgender symbol", "multiply", "plus", "minus", "divide", "heavy equals sign", "infinity", "double exclamation mark", "exclamation question mark", "red question mark", "white question mark", "white exclamation mark", "red exclamation mark", "wavy dash", "currency exchange", "heavy dollar sign", "medical symbol", "recycling symbol", "fleur-de-lis", "trident emblem", "name badge", "Japanese symbol for beginner", "hollow red circle", "check mark button", "check box with check", "check mark", "cross mark", "cross mark button", "curly loop", "double curly loop", "part alternation mark", "eight-spoked asterisk", "eight-pointed star", "sparkle", "copyright", "registered", "trade mark", "splatter", "keycap: #", "keycap: *", "keycap: 0", "keycap: 1", "keycap: 2", "keycap: 3", "keycap: 4", "keycap: 5", "keycap: 6", "keycap: 7", "keycap: 8", "keycap: 9", "keycap: 10", "input latin uppercase", "input latin lowercase", "input numbers", "input symbols", "input latin letters", "A button (blood type)", "AB button (blood type)", "B button (blood type)", "CL button", "COOL button", "FREE button", "information", "ID button", "circled M", "NEW button", "NG button", "O button (blood type)", "OK button", "P button", "SOS button", "UP! button", "VS button", "Japanese “here” button", "Japanese “service charge” button", "Japanese “monthly amount” button", "Japanese “not free of charge” button", "Japanese “reserved” button", "Japanese “bargain” button", "Japanese “discount” button", "Japanese “free of charge” button", "Japanese “prohibited” button", "Japanese “acceptable” button", "Japanese “application” button", "Japanese “passing grade” button", "Japanese “vacancy” button", "Japanese “congratulations” button", "Japanese “secret” button", "Japanese “open for business” button", "Japanese “no vacancy” button", "red circle", "orange circle", "yellow circle", "green circle", "blue circle", "purple circle", "brown circle", "black circle", "white circle", "red square", "orange square", "yellow square", "green square", "blue square", "purple square", "brown square", "black large square", "white large square", "black medium square", "white medium square", "black medium-small square", "white medium-small square", "black small square", "white small square", "large orange diamond", "large blue diamond", "small orange diamond", "small blue diamond", "red triangle pointed up", "red triangle pointed down", "diamond with a dot", "radio button", "white square button", "black square button", "star", "star outline", "sparkle four", "diamond", "arrow", "infinity", "trademark", "command"] }, { "id": "flags", "icon": "🏳️", "label": "Flags", "labelBn": "পতাকা", "items": ["🏁", "🚩", "🎌", "🏴", "🏳️", "🏳️‍🌈", "🏳️‍⚧️", "🏴‍☠️", "🇦🇨", "🇦🇩", "🇦🇪", "🇦🇫", "🇦🇬", "🇦🇮", "🇦🇱", "🇦🇲", "🇦🇴", "🇦🇶", "🇦🇷", "🇦🇸", "🇦🇹", "🇦🇺", "🇦🇼", "🇦🇽", "🇦🇿", "🇧🇦", "🇧🇧", "🇧🇩", "🇧🇪", "🇧🇫", "🇧🇬", "🇧🇭", "🇧🇮", "🇧🇯", "🇧🇱", "🇧🇲", "🇧🇳", "🇧🇴", "🇧🇶", "🇧🇷", "🇧🇸", "🇧🇹", "🇧🇻", "🇧🇼", "🇧🇾", "🇧🇿", "🇨🇦", "🇨🇨", "🇨🇩", "🇨🇫", "🇨🇬", "🇨🇭", "🇨🇮", "🇨🇰", "🇨🇱", "🇨🇲", "🇨🇳", "🇨🇴", "🇨🇵", "🇨🇶", "🇨🇷", "🇨🇺", "🇨🇻", "🇨🇼", "🇨🇽", "🇨🇾", "🇨🇿", "🇩🇪", "🇩🇬", "🇩🇯", "🇩🇰", "🇩🇲", "🇩🇴", "🇩🇿", "🇪🇦", "🇪🇨", "🇪🇪", "🇪🇬", "🇪🇭", "🇪🇷", "🇪🇸", "🇪🇹", "🇪🇺", "🇫🇮", "🇫🇯", "🇫🇰", "🇫🇲", "🇫🇴", "🇫🇷", "🇬🇦", "🇬🇧", "🇬🇩", "🇬🇪", "🇬🇫", "🇬🇬", "🇬🇭", "🇬🇮", "🇬🇱", "🇬🇲", "🇬🇳", "🇬🇵", "🇬🇶", "🇬🇷", "🇬🇸", "🇬🇹", "🇬🇺", "🇬🇼", "🇬🇾", "🇭🇰", "🇭🇲", "🇭🇳", "🇭🇷", "🇭🇹", "🇭🇺", "🇮🇨", "🇮🇩", "🇮🇪", "🇮🇱", "🇮🇲", "🇮🇳", "🇮🇴", "🇮🇶", "🇮🇷", "🇮🇸", "🇮🇹", "🇯🇪", "🇯🇲", "🇯🇴", "🇯🇵", "🇰🇪", "🇰🇬", "🇰🇭", "🇰🇮", "🇰🇲", "🇰🇳", "🇰🇵", "🇰🇷", "🇰🇼", "🇰🇾", "🇰🇿", "🇱🇦", "🇱🇧", "🇱🇨", "🇱🇮", "🇱🇰", "🇱🇷", "🇱🇸", "🇱🇹", "🇱🇺", "🇱🇻", "🇱🇾", "🇲🇦", "🇲🇨", "🇲🇩", "🇲🇪", "🇲🇫", "🇲🇬", "🇲🇭", "🇲🇰", "🇲🇱", "🇲🇲", "🇲🇳", "🇲🇴", "🇲🇵", "🇲🇶", "🇲🇷", "🇲🇸", "🇲🇹", "🇲🇺", "🇲🇻", "🇲🇼", "🇲🇽", "🇲🇾", "🇲🇿", "🇳🇦", "🇳🇨", "🇳🇪", "🇳🇫", "🇳🇬", "🇳🇮", "🇳🇱", "🇳🇴", "🇳🇵", "🇳🇷", "🇳🇺", "🇳🇿", "🇴🇲", "🇵🇦", "🇵🇪", "🇵🇫", "🇵🇬", "🇵🇭", "🇵🇰", "🇵🇱", "🇵🇲", "🇵🇳", "🇵🇷", "🇵🇸", "🇵🇹", "🇵🇼", "🇵🇾", "🇶🇦", "🇷🇪", "🇷🇴", "🇷🇸", "🇷🇺", "🇷🇼", "🇸🇦", "🇸🇧", "🇸🇨", "🇸🇩", "🇸🇪", "🇸🇬", "🇸🇭", "🇸🇮", "🇸🇯", "🇸🇰", "🇸🇱", "🇸🇲", "🇸🇳", "🇸🇴", "🇸🇷", "🇸🇸", "🇸🇹", "🇸🇻", "🇸🇽", "🇸🇾", "🇸🇿", "🇹🇦", "🇹🇨", "🇹🇩", "🇹🇫", "🇹🇬", "🇹🇭", "🇹🇯", "🇹🇰", "🇹🇱", "🇹🇲", "🇹🇳", "🇹🇴", "🇹🇷", "🇹🇹", "🇹🇻", "🇹🇼", "🇹🇿", "🇺🇦", "🇺🇬", "🇺🇲", "🇺🇳", "🇺🇸", "🇺🇾", "🇺🇿", "🇻🇦", "🇻🇨", "🇻🇪", "🇻🇬", "🇻🇮", "🇻🇳", "🇻🇺", "🇼🇫", "🇼🇸", "🇽🇰", "🇾🇪", "🇾🇹", "🇿🇦", "🇿🇲", "🇿🇼", "🏴󠁧󠁢󠁥󠁮󠁧󠁿", "🏴󠁧󠁢󠁳󠁣󠁴󠁿", "🏴󠁧󠁢󠁷󠁬󠁳󠁿", "৳"], "names": ["chequered flag", "triangular flag", "crossed flags", "black flag", "white flag", "rainbow flag", "transgender flag", "pirate flag", "flag: Ascension Island", "flag: Andorra", "flag: United Arab Emirates", "flag: Afghanistan", "flag: Antigua & Barbuda", "flag: Anguilla", "flag: Albania", "flag: Armenia", "flag: Angola", "flag: Antarctica", "flag: Argentina", "flag: American Samoa", "flag: Austria", "flag: Australia", "flag: Aruba", "flag: Åland Islands", "flag: Azerbaijan", "flag: Bosnia & Herzegovina", "flag: Barbados", "flag: Bangladesh", "flag: Belgium", "flag: Burkina Faso", "flag: Bulgaria", "flag: Bahrain", "flag: Burundi", "flag: Benin", "flag: St. Barthélemy", "flag: Bermuda", "flag: Brunei", "flag: Bolivia", "flag: Caribbean Netherlands", "flag: Brazil", "flag: Bahamas", "flag: Bhutan", "flag: Bouvet Island", "flag: Botswana", "flag: Belarus", "flag: Belize", "flag: Canada", "flag: Cocos (Keeling) Islands", "flag: Congo - Kinshasa", "flag: Central African Republic", "flag: Congo - Brazzaville", "flag: Switzerland", "flag: Côte d’Ivoire", "flag: Cook Islands", "flag: Chile", "flag: Cameroon", "flag: China", "flag: Colombia", "flag: Clipperton Island", "flag: Sark", "flag: Costa Rica", "flag: Cuba", "flag: Cape Verde", "flag: Curaçao", "flag: Christmas Island", "flag: Cyprus", "flag: Czechia", "flag: Germany", "flag: Diego Garcia", "flag: Djibouti", "flag: Denmark", "flag: Dominica", "flag: Dominican Republic", "flag: Algeria", "flag: Ceuta & Melilla", "flag: Ecuador", "flag: Estonia", "flag: Egypt", "flag: Western Sahara", "flag: Eritrea", "flag: Spain", "flag: Ethiopia", "flag: European Union", "flag: Finland", "flag: Fiji", "flag: Falkland Islands", "flag: Micronesia", "flag: Faroe Islands", "flag: France", "flag: Gabon", "flag: United Kingdom", "flag: Grenada", "flag: Georgia", "flag: French Guiana", "flag: Guernsey", "flag: Ghana", "flag: Gibraltar", "flag: Greenland", "flag: Gambia", "flag: Guinea", "flag: Guadeloupe", "flag: Equatorial Guinea", "flag: Greece", "flag: South Georgia & South Sandwich Islands", "flag: Guatemala", "flag: Guam", "flag: Guinea-Bissau", "flag: Guyana", "flag: Hong Kong SAR China", "flag: Heard & McDonald Islands", "flag: Honduras", "flag: Croatia", "flag: Haiti", "flag: Hungary", "flag: Canary Islands", "flag: Indonesia", "flag: Ireland", "flag: Israel", "flag: Isle of Man", "flag: India", "flag: British Indian Ocean Territory", "flag: Iraq", "flag: Iran", "flag: Iceland", "flag: Italy", "flag: Jersey", "flag: Jamaica", "flag: Jordan", "flag: Japan", "flag: Kenya", "flag: Kyrgyzstan", "flag: Cambodia", "flag: Kiribati", "flag: Comoros", "flag: St. Kitts & Nevis", "flag: North Korea", "flag: South Korea", "flag: Kuwait", "flag: Cayman Islands", "flag: Kazakhstan", "flag: Laos", "flag: Lebanon", "flag: St. Lucia", "flag: Liechtenstein", "flag: Sri Lanka", "flag: Liberia", "flag: Lesotho", "flag: Lithuania", "flag: Luxembourg", "flag: Latvia", "flag: Libya", "flag: Morocco", "flag: Monaco", "flag: Moldova", "flag: Montenegro", "flag: St. Martin", "flag: Madagascar", "flag: Marshall Islands", "flag: North Macedonia", "flag: Mali", "flag: Myanmar (Burma)", "flag: Mongolia", "flag: Macao SAR China", "flag: Northern Mariana Islands", "flag: Martinique", "flag: Mauritania", "flag: Montserrat", "flag: Malta", "flag: Mauritius", "flag: Maldives", "flag: Malawi", "flag: Mexico", "flag: Malaysia", "flag: Mozambique", "flag: Namibia", "flag: New Caledonia", "flag: Niger", "flag: Norfolk Island", "flag: Nigeria", "flag: Nicaragua", "flag: Netherlands", "flag: Norway", "flag: Nepal", "flag: Nauru", "flag: Niue", "flag: New Zealand", "flag: Oman", "flag: Panama", "flag: Peru", "flag: French Polynesia", "flag: Papua New Guinea", "flag: Philippines", "flag: Pakistan", "flag: Poland", "flag: St. Pierre & Miquelon", "flag: Pitcairn Islands", "flag: Puerto Rico", "flag: Palestinian Territories", "flag: Portugal", "flag: Palau", "flag: Paraguay", "flag: Qatar", "flag: Réunion", "flag: Romania", "flag: Serbia", "flag: Russia", "flag: Rwanda", "flag: Saudi Arabia", "flag: Solomon Islands", "flag: Seychelles", "flag: Sudan", "flag: Sweden", "flag: Singapore", "flag: St. Helena", "flag: Slovenia", "flag: Svalbard & Jan Mayen", "flag: Slovakia", "flag: Sierra Leone", "flag: San Marino", "flag: Senegal", "flag: Somalia", "flag: Suriname", "flag: South Sudan", "flag: São Tomé & Príncipe", "flag: El Salvador", "flag: Sint Maarten", "flag: Syria", "flag: Eswatini", "flag: Tristan da Cunha", "flag: Turks & Caicos Islands", "flag: Chad", "flag: French Southern Territories", "flag: Togo", "flag: Thailand", "flag: Tajikistan", "flag: Tokelau", "flag: Timor-Leste", "flag: Turkmenistan", "flag: Tunisia", "flag: Tonga", "flag: Türkiye", "flag: Trinidad & Tobago", "flag: Tuvalu", "flag: Taiwan", "flag: Tanzania", "flag: Ukraine", "flag: Uganda", "flag: U.S. Outlying Islands", "flag: United Nations", "flag: United States", "flag: Uruguay", "flag: Uzbekistan", "flag: Vatican City", "flag: St. Vincent & Grenadines", "flag: Venezuela", "flag: British Virgin Islands", "flag: U.S. Virgin Islands", "flag: Vietnam", "flag: Vanuatu", "flag: Wallis & Futuna", "flag: Samoa", "flag: Kosovo", "flag: Yemen", "flag: Mayotte", "flag: South Africa", "flag: Zambia", "flag: Zimbabwe", "flag: England", "flag: Scotland", "flag: Wales", "bangladeshi taka"] }];
window.GHOST_EMOJI_TOTAL = 1915;
/* ============================================================================
   Ghostae Text — Canonical Motion Model  (ONE source of truth)
   ----------------------------------------------------------------------------
   Ghost Motion JSON
     -> validate()          strict, never silently drops properties
     -> normalize()         Canonical Motion Model (units resolved, clamped)
     -> timing()            the single timing/selector solver
     -> Preview renderer    (ghost-anim-pack.js, CSS keyframes)
     -> AE Apply adapter    (host.jsx, native After Effects properties)
   This file is loaded by BOTH sides:
     • the CEP panel loads it as a normal <script>  (attaches to window)
     • host.jsx $.evalFile's it into ExtendScript   (attaches to $.global)
   Because Preview and Apply read the same model and the same solver, the panel
   can no longer show something After Effects will not build. Any property the
   Apply adapter cannot map is reported as a validation error — never ignored.
   ES5 only: the legacy CEP engine and ExtendScript both have to parse this.
   ========================================================================= */
(function (root) {
  "use strict";
  var VERSION = 3;
  /* ── property table: canonical name -> native AE text-animator property ──
     dim      expected dimension (1 = number, 2/3/4 = array length)
     unit     px | percent | degrees | color  (documentation + validation)
     rest     the value AE shows when the animation is finished (no effect) */
  var PROPERTY_TABLE = {
    opacity:    { matchName: "ADBE Text Opacity",          dim: 1, unit: "percent", rest: 100,        min: 0,     max: 100 },
    position:   { matchName: "ADBE Text Position",         dim: 2, unit: "px",      rest: [0, 0],     min: -12000, max: 12000 },
    scale:      { matchName: "ADBE Text Scale",            dim: 2, unit: "percent", rest: [100, 100], min: -1000, max: 1000 },
    rotation:   { matchName: "ADBE Text Rotation",         dim: 1, unit: "degrees", rest: 0,          min: -3600, max: 3600 },
    rotationX:  { matchName: "ADBE Text Rotation X",       dim: 1, unit: "degrees", rest: 0,          min: -3600, max: 3600, needs3D: true },
    rotationY:  { matchName: "ADBE Text Rotation Y",       dim: 1, unit: "degrees", rest: 0,          min: -3600, max: 3600, needs3D: true },
    blur:       { matchName: "ADBE Text Blur",             dim: 2, unit: "px",      rest: [0, 0],     min: 0,     max: 500 },
    tracking:   { matchName: "ADBE Text Tracking Amount",  dim: 1, unit: "px",      rest: 0,          min: -500,  max: 1000 },
    skew:       { matchName: "ADBE Text Skew",             dim: 1, unit: "degrees", rest: 0,          min: -85,   max: 85 },
    fillColor:  { matchName: "ADBE Text Fill Color",       dim: 4, unit: "color",   rest: null }
  };
  /* Accepted JSON aliases -> canonical property name. A JSON key is NEVER
     assumed to be an AE property name. */
  var PROPERTY_ALIASES = {
    opacity: "opacity", alpha: "opacity",
    position: "position", pos: "position",
    posx: "position.x", px: "position.x",
    posy: "position.y", py: "position.y",
    posz: "position.z",
    scale: "scale", scalex: "scale.x", scaley: "scale.y",
    rotation: "rotation", rotz: "rotation", rotationz: "rotation",
    rotx: "rotationX", rotationx: "rotationX",
    roty: "rotationY", rotationy: "rotationY",
    blur: "blur", blurx: "blur.x", blury: "blur.y",
    tracking: "tracking", letterspacing: "tracking",
    skew: "skew",
    color: "fillColor", fill: "fillColor", fillcolor: "fillColor",
    usecolor: "@useColor"
  };
  var BASIS = { chars: 1, charsExcl: 2, words: 3, lines: 4 };
  var SHAPES = { square: 1, rampup: 2, rampdown: 3, triangle: 4, round: 5, smooth: 6 };
  /* ── easing: one table, two representations of the same curve ───────────
     bezier  = CSS cubic-bezier control points (preview)
     ae      = KeyframeEase(speed, influence) pairs (After Effects)      */
  var EASINGS = {
    linear:    { bezier: [0, 0, 1, 1],           ae: { inInfluence: 0.1,  outInfluence: 0.1 } },
    easeIn:    { bezier: [0.42, 0, 1, 1],        ae: { inInfluence: 0.1,  outInfluence: 75 } },
    easeOut:   { bezier: [0, 0, 0.3, 1],         ae: { inInfluence: 75,   outInfluence: 0.1 } },
    easeInOut: { bezier: [0.45, 0, 0.55, 1],     ae: { inInfluence: 60,   outInfluence: 60 } },
    smooth:    { bezier: [0.16, 1, 0.3, 1],      ae: { inInfluence: 85,   outInfluence: 20 } }
  };
  var EASING_ALIASES = {
    linear: "linear", none: "linear",
    "ease-in": "easeIn", easein: "easeIn", in: "easeIn",
    "ease-out": "easeOut", easeout: "easeOut", out: "easeOut",
    "ease-in-out": "easeInOut", easeinout: "easeInOut", inout: "easeInOut",
    smooth: "smooth", expo: "smooth", "default": "smooth"
  };
  function has(obj, key) { return obj && Object.prototype.hasOwnProperty.call(obj, key); }
  function low(value) { return String(value == null ? "" : value).toLowerCase().replace(/[\s_]+/g, ""); }
  function isNum(value) { return typeof value === "number" && isFinite(value); }
  function clamp(value, min, max) {
    if (isNum(min) && value < min) return min;
    if (isNum(max) && value > max) return max;
    return value;
  }
  /* ── time: ONE conversion function for the whole system ─────────────────
     value may be a number (seconds by default) or { frames: n } / "12f".  */
  function toSeconds(value, fps, unitHint) {
    var rate = isNum(fps) && fps > 0 ? fps : 25;
    if (value == null) return null;
    if (typeof value === "object") {
      if (isNum(value.frames)) return value.frames / rate;
      if (isNum(value.seconds)) return value.seconds;
      if (isNum(value.value)) return toSeconds(value.value, rate, value.unit || unitHint);
      return null;
    }
    var text = String(value).replace(/\s+/g, "");
    var frameMatch = /^(-?[0-9.]+)f$/i.exec(text);
    if (frameMatch) return Number(frameMatch[1]) / rate;
    var seconds = Number(text);
    if (!isFinite(seconds)) return null;
    if (low(unitHint) === "frames") return seconds / rate;
    return seconds;
  }
  function toFrames(seconds, fps) {
    var rate = isNum(fps) && fps > 0 ? fps : 25;
    return Math.round(Number(seconds) * rate);
  }
  function toRgba(value) {
    if (value == null) return null;
    if (value instanceof Array || (typeof value === "object" && isNum(value.length))) {
      var arr = [];
      for (var i = 0; i < 4; i += 1) {
        var part = Number(value[i]);
        if (!isFinite(part)) part = i === 3 ? 1 : 0;
        if (part > 1) part = part / 255;
        arr.push(clamp(part, 0, 1));
      }
      return arr;
    }
    if (typeof value === "object") {
      if (isNum(value.r)) return toRgba([value.r, value.g, value.b, has(value, "a") ? value.a : 1]);
      return null;
    }
    var hex = String(value).replace(/^#/, "");
    if (hex.length === 3) hex = hex[0] + hex[0] + hex[1] + hex[1] + hex[2] + hex[2];
    if (!/^[0-9a-fA-F]{6}$/.test(hex)) return null;
    return [
      parseInt(hex.slice(0, 2), 16) / 255,
      parseInt(hex.slice(2, 4), 16) / 255,
      parseInt(hex.slice(4, 6), 16) / 255,
      1
    ];
  }
  function toHex(rgba) {
    function part(n) {
      var v = Math.round(clamp(Number(n) || 0, 0, 1) * 255).toString(16);
      return v.length < 2 ? "0" + v : v;
    }
    if (!rgba) return "#ffffff";
    return "#" + part(rgba[0]) + part(rgba[1]) + part(rgba[2]);
  }
  /* ── normalize ─────────────────────────────────────────────────────────
     Accepts:
       • an animation-pack entry  { name, basis, direction, duration, stagger,
                                    from:{...}, selector:{...} }
       • the flat legacy apply payload { presetName, opacity, posY, start... }
     Returns { ok:true, model } or { ok:false, errors:[...] }.            */
  function normalize(input, options) {
    var opts = options || {};
    var errors = [];
    var warnings = [];
    if (!input || typeof input !== "object") {
      return { ok: false, errors: ["Motion document must be an object."] };
    }
    var fps = isNum(opts.fps) ? opts.fps : (isNum(input.fps) ? input.fps : 25);
    var name = String(input.name || input.presetName || "").replace(/^\s+|\s+$/g, "");
    if (!name) errors.push('Missing "name".');
    var basisRaw = low(input.basis || input.basedOn || "chars");
    var basisKey = null;
    if (basisRaw === "chars" || basisRaw === "characters" || basisRaw === "char") basisKey = "chars";
    else if (basisRaw === "charsexcl" || basisRaw === "charactersexcludingspaces") basisKey = "charsExcl";
    else if (basisRaw === "words" || basisRaw === "word") basisKey = "words";
    else if (basisRaw === "lines" || basisRaw === "line") basisKey = "lines";
    if (!basisKey) { basisKey = "chars"; warnings.push('Unknown basis "' + input.basis + '" — using chars.'); }
    var direction = low(input.direction) === "out" ? "out" : "in";
    var duration = toSeconds(has(input, "duration") ? input.duration : 1.2, fps, input.timeUnit);
    if (duration == null) { errors.push('"duration" is not a valid time value.'); duration = 1.2; }
    duration = clamp(duration, 0.05, 30);
    var stagger = toSeconds(has(input, "stagger") ? input.stagger : 0.05, fps, input.timeUnit);
    if (stagger == null) { errors.push('"stagger" is not a valid time value.'); stagger = 0; }
    stagger = clamp(stagger, 0, 2);
    var easingName = EASING_ALIASES[low(input.easing || input.ease || "smooth")];
    if (!easingName) {
      warnings.push('Unknown easing "' + input.easing + '" — using smooth.');
      easingName = "smooth";
    }
    var source = input.from || input.state || input.offsetState || input;
    /* When the document supplies an explicit offset-state object, every key in
       it must map to a real After Effects animator property: silently ignoring
       one is exactly how Preview and Apply used to drift apart. */
    var strictSource = !!(input.from || input.state || input.offsetState);
    var META_KEYS = { usecolor: 1, color: 1, name: 1, comment: 1, notes: 1 };
    var offsetState = {};
    var pending = { position: null, scale: null, blur: null };
    var useColor = has(source, "useColor") ? !!source.useColor : (has(input, "useColor") ? !!input.useColor : false);
    function ensureVec(key, restValue) {
      if (!pending[key]) pending[key] = [restValue[0], restValue[1]];
      return pending[key];
    }
    for (var rawKey in source) {
      if (!has(source, rawKey)) continue;
      var value = source[rawKey];
      if (typeof value === "function" || value == null) continue;
      var canonical = PROPERTY_ALIASES[low(rawKey)];
      if (!canonical) {
        if (strictSource && !META_KEYS[low(rawKey)]) {
          errors.push('Property "' + rawKey + '" is not a supported Ghost Motion property.');
        }
        continue; /* container/meta keys are handled elsewhere */
      }
      if (canonical === "@useColor") continue;
      var dot = canonical.indexOf(".");
      if (dot > 0) {
        var base = canonical.slice(0, dot);
        var axis = canonical.slice(dot + 1);
        var spec = PROPERTY_TABLE[base];
        var num = Number(value);
        if (!isFinite(num)) { errors.push('Property "' + rawKey + '" must be a number.'); continue; }
        var vec = ensureVec(base, spec.rest);
        var index = axis === "y" ? 1 : (axis === "z" ? 2 : 0);
        if (index === 2 && spec.dim < 3) { warnings.push("position.z ignored: animator position is 2D."); continue; }
        vec[index] = clamp(num, spec.min, spec.max);
        continue;
      }
      var propSpec = PROPERTY_TABLE[canonical];
      if (!propSpec) { errors.push('Property "' + rawKey + '" cannot be applied in After Effects.'); continue; }
      if (canonical === "fillColor") {
        var rgba = toRgba(value);
        if (!rgba) { errors.push('Property "' + rawKey + '" is not a valid colour.'); continue; }
        offsetState.fillColor = { value: rgba, hex: toHex(rgba) };
        continue;
      }
      if (propSpec.dim === 1) {
        var single = Number(value);
        if (!isFinite(single)) { errors.push('Property "' + rawKey + '" must be a number.'); continue; }
        offsetState[canonical] = { value: clamp(single, propSpec.min, propSpec.max) };
        continue;
      }
      if (value instanceof Array || (typeof value === "object" && isNum(value.length))) {
        var out = [];
        for (var d = 0; d < propSpec.dim; d += 1) {
          var comp = Number(value[d]);
          if (!isFinite(comp)) comp = propSpec.rest[d];
          out.push(clamp(comp, propSpec.min, propSpec.max));
        }
        pending[canonical] = out;
      } else {
        var uni = Number(value);
        if (!isFinite(uni)) { errors.push('Property "' + rawKey + '" must be a number or array.'); continue; }
        pending[canonical] = [clamp(uni, propSpec.min, propSpec.max), clamp(uni, propSpec.min, propSpec.max)];
      }
    }
    for (var vecKey in pending) {
      if (!has(pending, vecKey) || !pending[vecKey]) continue;
      offsetState[vecKey] = { value: pending[vecKey] };
    }
    if (offsetState.fillColor && !useColor) delete offsetState.fillColor;
    if (useColor && !offsetState.fillColor) {
      var fallback = toRgba(source.color || input.color || "#ffffff");
      offsetState.fillColor = { value: fallback, hex: toHex(fallback) };
    }
    /* Drop properties whose offset value equals the rest value: they would be
       written to AE as a no-op and would also do nothing in the preview. */
    var active = {};
    for (var key in offsetState) {
      if (!has(offsetState, key)) continue;
      var table = PROPERTY_TABLE[key];
      var entry = offsetState[key];
      if (key !== "fillColor" && isRest(entry.value, table.rest)) {
        warnings.push('Property "' + key + '" equals its rest value — no keyframes needed.');
        continue;
      }
      active[key] = {
        canonical: key,
        matchName: table.matchName,
        dim: table.dim,
        unit: table.unit,
        needs3D: !!table.needs3D,
        offsetValue: entry.value,
        restValue: table.rest,
        hex: entry.hex || null
      };
    }
    var sel = input.selector || {};
    var shapeKey = low(sel.shape || input.shape || "square");
    if (shapeKey === "ramp-up") shapeKey = "rampup";
    if (shapeKey === "ramp-down") shapeKey = "rampdown";
    if (!SHAPES[shapeKey]) {
      if (sel.shape || input.shape) warnings.push('Unknown selector shape "' + (sel.shape || input.shape) + '" — using square.');
      shapeKey = "square";
    }
    function selNum(key, fallbackValue, min, max) {
      var raw = has(sel, key) ? sel[key] : (has(input, key) ? input[key] : fallbackValue);
      var out = Number(raw);
      if (!isFinite(out)) {
        if (raw != null && raw !== "") errors.push('selector.' + key + ' must be a number.');
        out = fallbackValue;
      }
      return clamp(out, min, max);
    }
    var model = {
      version: VERSION,
      name: name || "Custom",
      basis: basisKey,
      basedOn: BASIS[basisKey],
      direction: direction,
      fps: fps,
      timing: { duration: duration, stagger: stagger, unit: "seconds" },
      easing: {
        name: easingName,
        bezier: EASINGS[easingName].bezier,
        ae: EASINGS[easingName].ae
      },
      selector: {
        start: selNum("start", 0, 0, 100),
        end: selNum("end", 100, 0, 100),
        offset: selNum("offset", 0, -100, 100),
        shape: shapeKey,
        shapeCode: SHAPES[shapeKey],
        easeHigh: selNum("easeHigh", 0, -100, 100),
        easeLow: selNum("easeLow", 0, -100, 100),
        randomize: !!(sel.randomize || input.randomize)
      },
      properties: active,
      text: input.text != null ? String(input.text) : null,
      createLayer: !!input.createLayer,
      warnings: warnings
    };
    if (!countKeys(active)) errors.push("No animatable properties found — the text would not move.");
    if (errors.length) return { ok: false, errors: errors, warnings: warnings };
    return { ok: true, model: model };
  }
  function isRest(value, rest) {
    if (rest == null) return false;
    if (value instanceof Array) {
      for (var i = 0; i < value.length; i += 1) {
        if (Number(value[i]) !== Number(rest[i])) return false;
      }
      return true;
    }
    return Number(value) === Number(rest);
  }
  function countKeys(obj) {
    var n = 0;
    for (var k in obj) { if (has(obj, k)) n += 1; }
    return n;
  }
  function propertyList(model) {
    var out = [];
    for (var key in model.properties) {
      if (has(model.properties, key)) out.push(model.properties[key]);
    }
    return out;
  }
  /* ── timing solver — the single place stagger/duration is interpreted ──
     Preview: unit i animates for `unitDuration` starting at `delayFor(i)`.
     After Effects: one Range Selector Offset sweep. The selector window is
     solved so a single unit spends exactly `unitDuration` in transition:
        r = unitDuration / total
        unitWidth = 100 / unitCount
        window = 100 * (r - unitWidth/100) / (1 - r)
     Both descriptions therefore encode the same motion.               */
  function timing(model, unitCount) {
    var n = Math.max(1, Math.round(Number(unitCount) || 1));
    var unitDuration = model.timing.duration;
    var stagger = model.timing.stagger;
    var total = unitDuration + stagger * Math.max(0, n - 1);
    var unitWidth = 100 / n;
    var ratio = total > 0 ? unitDuration / total : 1;
    var window = 100;
    if (ratio < 1) window = 100 * (ratio - unitWidth / 100) / (1 - ratio);
    if (!isFinite(window) || window < unitWidth) window = unitWidth;
    if (window > 100) window = 100;
    var out = model.direction === "out";
    /* Offset sweeps the window across the text. IN ends with the window
       pushed past the text (no effect left); OUT starts there. */
    var offsetFrom = out ? -window : model.selector.offset - window;
    var offsetTo = out ? 100 : 100;
    if (out) { offsetFrom = -window; offsetTo = 100; }
    return {
      unitCount: n,
      unitDuration: unitDuration,
      stagger: stagger,
      total: total,
      unitWidth: unitWidth,
      delayFor: function (index) {
        var order = index;
        if (model.selector.randomize) {
          order = Math.abs(Math.round(Math.sin((index + 1) * 777.7) * n)) % n;
        }
        if (out) order = n - 1 - order;
        return order * stagger;
      },
      ae: {
        basedOn: model.basedOn,
        shapeCode: model.selector.shapeCode,
        randomize: model.selector.randomize,
        easeHigh: model.selector.easeHigh,
        easeLow: model.selector.easeLow,
        rangeStart: 0,
        rangeEnd: window,
        offsetFrom: offsetFrom,
        offsetTo: offsetTo,
        keyTimes: [0, total],
        keyValues: out ? [offsetTo, offsetFrom] : [offsetFrom, offsetTo],
        influenceIn: model.easing.ae.inInfluence,
        influenceOut: model.easing.ae.outInfluence
      }
    };
  }
  /* -- preview CSS built from the SAME normalized properties Apply writes --
     Anything the AE adapter cannot express is not in model.properties, so it
     cannot appear in the preview either. */
  function cssKeyframes(model) {
    var props = propertyList(model);
    var decls = [];
    var tx = 0, ty = 0, sx = 1, sy = 1, rz = 0, rx = 0, ry = 0, sk = 0, blur = 0;
    var useTransform = false, useBlur = false;
    for (var i = 0; i < props.length; i += 1) {
      var p = props[i], v = p.offsetValue;
      if (p.canonical === "opacity") { decls.push("opacity: " + (Number(v) / 100)); continue; }
      if (p.canonical === "tracking") { decls.push("letter-spacing: " + (Number(v) / 10) + "px"); continue; }
      if (p.canonical === "fillColor") { decls.push("color: " + (p.hex || toHex(v))); continue; }
      if (p.canonical === "blur") { blur = Number(v[0]); useBlur = true; continue; }
      useTransform = true;
      if (p.canonical === "position") { tx = Number(v[0]); ty = Number(v[1]); }
      else if (p.canonical === "scale") { sx = Number(v[0]) / 100; sy = Number(v[1]) / 100; }
      else if (p.canonical === "rotation") rz = Number(v);
      else if (p.canonical === "rotationX") rx = Number(v);
      else if (p.canonical === "rotationY") ry = Number(v);
      else if (p.canonical === "skew") sk = Number(v);
    }
    if (useTransform) {
      decls.push("transform: translate(" + tx + "px," + ty + "px) scale(" + sx + "," + sy +
        ") rotateX(" + rx + "deg) rotateY(" + ry + "deg) rotate(" + rz + "deg) skewX(" + sk + "deg)");
    }
    if (useBlur) decls.push("filter: blur(" + blur + "px)");
    var restDecls = [];
    for (var d = 0; d < decls.length; d += 1) {
      var name = decls[d].split(":")[0];
      if (name === "opacity") restDecls.push("opacity: 1");
      else if (name === "letter-spacing") restDecls.push("letter-spacing: normal");
      else if (name === "transform") restDecls.push("transform: none");
      else if (name === "filter") restDecls.push("filter: blur(0px)");
      else if (name === "color") restDecls.push("color: inherit");
    }
    var offset = decls.join("; ") + (decls.length ? ";" : "");
    var rest = restDecls.join("; ") + (restDecls.length ? ";" : "");
    var body = model.direction === "out"
      ? "0% { " + rest + " } 100% { " + offset + " }"
      : "0% { " + offset + " } 100% { " + rest + " }";
    return { offset: offset, rest: rest, body: body, name: cssKeyframeName(model) };
  }
  function cssKeyframeName(model) {
    return "ghostMotion-" + stableSignature(model).replace(/[^a-zA-Z0-9_-]+/g, "-");
  }
  function cssEasing(model) {
    var b = model.easing.bezier;
    return "cubic-bezier(" + b[0] + "," + b[1] + "," + b[2] + "," + b[3] + ")";
  }
  function splitUnits(text, basis) {
    var source = String(text == null ? "" : text);
    if (basis === "lines") return source.split(/\r\n|\r|\n/);
    if (basis === "words") {
      var words = source.split(/\s+/), keep = [];
      for (var i = 0; i < words.length; i += 1) { if (words[i] !== "") keep.push(words[i]); }
      return keep;
    }
    var chars = [];
    for (var c = 0; c < source.length; c += 1) {
      if (basis === "charsExcl" && /\s/.test(source.charAt(c))) continue;
      chars.push(source.charAt(c));
    }
    return chars;
  }
  function unitCount(text, basis) {
    var list = splitUnits(text, basis);
    return list.length ? list.length : 1;
  }
  function expectation(model, unitCountValue, startTime) {
    var plan = timing(model, unitCountValue);
    var t0 = Number(startTime) || 0;
    var props = propertyList(model);
    var expected = [];
    for (var i = 0; i < props.length; i += 1) {
      expected.push({
        property: props[i].canonical,
        matchName: props[i].matchName,
        dim: props[i].dim,
        value: props[i].offsetValue,
        keyframes: 0
      });
    }
    expected.push({
      property: "selector.offset",
      matchName: "ADBE Text Percent Offset",
      dim: 1,
      keyframes: 2,
      keyTimes: [t0 + plan.ae.keyTimes[0], t0 + plan.ae.keyTimes[1]],
      keyValues: plan.ae.keyValues
    });
    return { plan: plan, expected: expected };
  }
  function snapTime(seconds, fps) {
    var rate = isNum(fps) && fps > 0 ? fps : 25;
    return Math.round(Number(seconds) * rate) / rate;
  }
  function cloneValue(value) {
    if (!(value instanceof Array)) return value;
    var out = [];
    for (var i = 0; i < value.length; i += 1) out.push(value[i]);
    return out;
  }
  function normalizeInterpolation(value) {
    var key = low(value || "bezier");
    if (key === "hold" || key === "step") return "hold";
    if (key === "linear") return "linear";
    return "bezier";
  }
  function explicitKeyframes(input, model, property) {
    var source = input.keyframes || [];
    var nested = input.properties && input.properties[property.canonical];
    if (nested && nested.keyframes) source = source.concat(nested.keyframes);
    var out = [];
    for (var i = 0; i < source.length; i += 1) {
      var raw = source[i] || {};
      var rawName = raw.property || raw.name || raw.target;
      var canonical = PROPERTY_ALIASES[low(rawName)] || rawName;
      if (canonical !== property.canonical) continue;
      var time = toSeconds(has(raw, "time") ? raw.time : raw.at, model.fps, raw.timeUnit || input.timeUnit);
      if (time == null || time < 0) continue;
      var value = raw.value;
      if (property.dim === 1) value = Number(value);
      else if (!(value instanceof Array)) value = [Number(value), Number(value)];
      if (property.dim === 1 && !isFinite(value)) continue;
      out.push({
        time: snapTime(time, model.fps),
        value: cloneValue(value),
        interpolation: normalizeInterpolation(raw.interpolation || raw.type),
        easeIn: Number(raw.easeIn != null ? raw.easeIn : model.easing.ae.inInfluence),
        easeOut: Number(raw.easeOut != null ? raw.easeOut : model.easing.ae.outInfluence)
      });
    }
    out.sort(function (a, b) { return a.time - b.time; });
    return out;
  }
  function stableSignature(model) {
    var names = [], props = propertyList(model);
    for (var i = 0; i < props.length; i += 1) names.push(props[i].canonical);
    names.sort();
    return "GM3|" + String(model.name).replace(/[^a-zA-Z0-9_-]+/g, "_").slice(0, 36) + "|" + names.join("+");
  }
  function plan(input, options) {
    var opts = options || {};
    var normalized = normalize(input, opts);
    if (!normalized.ok) return normalized;
    var model = normalized.model;
    var text = opts.text != null ? String(opts.text) : String(model.text != null ? model.text : input.text || model.name);
    var count = unitCount(text, model.basis);
    var solved = timing(model, count);
    var start = snapTime(Number(opts.startTime) || 0, model.fps);
    var operations = [], props = propertyList(model), maxRelative = solved.total;
    for (var i = 0; i < props.length; i += 1) {
      var frames = explicitKeyframes(input, model, props[i]);
      if (frames.length) maxRelative = Math.max(maxRelative, frames[frames.length - 1].time);
      for (var f = 0; f < frames.length; f += 1) frames[f].time = start + frames[f].time;
      operations.push({
        kind: "animatorProperty",
        canonical: props[i].canonical,
        matchName: props[i].matchName,
        dim: props[i].dim,
        needs3D: props[i].needs3D,
        value: cloneValue(props[i].offsetValue),
        keyframes: frames
      });
    }
    operations.push({
      kind: "rangeSelector",
      matchName: "ADBE Text Selector",
      start: solved.ae.rangeStart,
      end: solved.ae.rangeEnd,
      basedOn: solved.ae.basedOn,
      shapeCode: solved.ae.shapeCode,
      randomize: solved.ae.randomize,
      easeHigh: solved.ae.easeHigh,
      easeLow: solved.ae.easeLow,
      keyframes: [
        { property: "ADBE Text Percent Offset", time: start + snapTime(solved.ae.keyTimes[0], model.fps), value: solved.ae.keyValues[0], interpolation: normalizeInterpolation(model.easing.name), easeIn: solved.ae.influenceIn, easeOut: solved.ae.influenceOut },
        { property: "ADBE Text Percent Offset", time: start + snapTime(solved.ae.keyTimes[1], model.fps), value: solved.ae.keyValues[1], interpolation: normalizeInterpolation(model.easing.name), easeIn: solved.ae.influenceIn, easeOut: solved.ae.influenceOut }
      ]
    });
    return {
      ok: true,
      plan: {
        version: VERSION,
        signature: stableSignature(model),
        animatorName: "GHOST MOTION — " + model.name,
        model: model,
        text: text,
        unitCount: count,
        startTime: start,
        endTime: start + snapTime(maxRelative, model.fps),
        operations: operations,
        warnings: normalized.warnings || []
      }
    };
  }
  root.GhostMotion = {
    VERSION: VERSION,
    PROPERTY_TABLE: PROPERTY_TABLE,
    EASINGS: EASINGS,
    BASIS: BASIS,
    SHAPES: SHAPES,
    normalize: normalize,
    propertyList: propertyList,
    timing: timing,
    cssEasing: cssEasing,
    cssKeyframes: cssKeyframes,
    cssKeyframeName: cssKeyframeName,
    splitUnits: splitUnits,
    unitCount: unitCount,
    expectation: expectation,
    plan: plan,
    snapTime: snapTime,
    stableSignature: stableSignature,
    toSeconds: toSeconds,
    toFrames: toFrames,
    toRgba: toRgba,
    toHex: toHex
  };
})(typeof window !== "undefined" ? window : (typeof $ !== "undefined" && $.global ? $.global : this));
(function (root) {
  "use strict";
  var VERSION = 1;
  function fail(stage, message, details) {
    return { ok: false, stage: stage, error: String(message || "Unknown error"), details: details || [] };
  }
  function validate(plan, adapter) {
    var errors = [];
    if (!plan || plan.version < 3) errors.push("A Ghost Motion v3 execution plan is required.");
    if (!plan || !plan.signature) errors.push("Execution plan has no stable signature.");
    if (!plan || !plan.operations || !plan.operations.length) errors.push("Execution plan has no operations.");
    if (!adapter) errors.push("Apply adapter is missing.");
    var required = ["begin", "resolve", "apply", "verify", "commit", "rollback"];
    for (var i = 0; i < required.length; i += 1) {
      if (!adapter || typeof adapter[required[i]] !== "function") errors.push("Apply adapter is missing " + required[i] + "().");
    }
    return errors;
  }
  function execute(plan, adapter, options) {
    var errors = validate(plan, adapter);
    if (errors.length) return fail("validate", errors.join(" "), errors);
    var opts = options || {}, retries = Number(opts.retries);
    if (!isFinite(retries) || retries < 0) retries = 1;
    if (retries > 2) retries = 2;
    var log = [], last = null;
    for (var attempt = 0; attempt <= retries; attempt += 1) {
      var tx = null;
      try {
        log.push("attempt " + (attempt + 1) + ": begin " + plan.signature);
        tx = adapter.begin(plan, attempt);
        if (!tx) throw new Error("Adapter did not create a transaction.");
        for (var i = 0; i < plan.operations.length; i += 1) {
          var resolved = adapter.resolve(tx, plan.operations[i], plan);
          if (!resolved) throw new Error("Could not resolve operation " + i + " (" + plan.operations[i].kind + ").");
          adapter.apply(tx, resolved, plan.operations[i], plan);
        }
        var verification = adapter.verify(tx, plan) || { ok: false, errors: ["Verifier returned no result."] };
        if (!verification.ok) {
          last = fail("verify", (verification.errors || ["Verification failed."]).join(" | "), verification.errors || []);
          log.push("attempt " + (attempt + 1) + ": verification failed");
          adapter.rollback(tx, plan, last);
          continue;
        }
        adapter.commit(tx, plan);
        log.push("attempt " + (attempt + 1) + ": committed");
        return { ok: true, stage: "commit", attempts: attempt + 1, verification: verification, log: log, signature: plan.signature };
      } catch (error) {
        last = fail("apply", error && error.message ? error.message : error);
        log.push("attempt " + (attempt + 1) + ": " + last.error);
        try { if (tx) adapter.rollback(tx, plan, last); } catch (ignored) {}
      }
    }
    last = last || fail("apply", "Apply failed.");
    last.attempts = retries + 1;
    last.log = log;
    return last;
  }
  root.GhostApplyEngine = { VERSION: VERSION, validate: validate, execute: execute };
})(typeof window !== "undefined" ? window : (typeof $ !== "undefined" && $.global ? $.global : this));
/* ============================================================================
   Ghostae Text — Animation Pack (custom / AI-generated animations)
   ----------------------------------------------------------------------------
   One single description drives BOTH sides of the panel:
     • the card preview in the Animation tab (CSS keyframes built here), and
     • the real After Effects animator (the very same numbers are handed to
       GhostHost.toolkitApplyAdvancedAnimation).
   That is why a pasted animation cannot drift between preview and apply any
   more: there is no second, hand-written translation of the preset.
   The JSON below is intentionally flat and fully documented so an AI can be
   asked to "write a Ghostae animation pack" and produce something importable.
   Kept in ES5 for the legacy CEP (Chromium) engine that ships with older
   After Effects builds.
   ========================================================================= */
(function() {
  "use strict";
  var STORE_KEY = "ghostae.animationPacks.v1";
  /* v3.22.5 — the hand-added "Manual Extend" packs are retired. They were
     experiments and they shipped divergent motion, so they are cleared once
     per install instead of lingering in local storage. */
  var PURGE_KEY = "ghostae.animationPacks.purged.v3225";
  try {
    if (window.localStorage && !window.localStorage.getItem(PURGE_KEY)) {
      window.localStorage.removeItem(STORE_KEY);
      window.localStorage.setItem(PURGE_KEY, "1");
    }
  } catch (ePurge) {}
  /* v3.25.0 — the hand-added JSON pack badged MINE ("Soft Rise" / "Soft Res")
     is retired for good. The earlier one-off purge only matched "Soft Res",
     so the card survived under its real name. read() now filters these names
     on every load and rewrites storage, which also protects against the pack
     being re-imported from an old JSON file. */
  var RETIRED_PACKS = {
    "soft res": 1, "mine soft res": 1, "softres": 1,
    "soft rise": 1, "mine soft rise": 1, "softrise": 1
  };
  function isRetired(item) {
    var key = String(item && item.name || "").toLowerCase().replace(/\s+/g, " ").replace(/^\s+|\s+$/g, "");
    return Object.prototype.hasOwnProperty.call(RETIRED_PACKS, key);
  }
  var BASIS = { chars: 1, charsExcl: 1, words: 1, lines: 1 };
  var SHAPES = { square: 1, rampup: 1, rampdown: 1, triangle: 1, round: 1, smooth: 1 };
  var SPEC_TEXT = [
    "{",
    '  "format": "ghostae-animation-pack",',
    '  "version": 1,',
    '  "animations": [',
    "    {",
    '      "name": "Blur Rise",',
    '      "basis": "chars",          // chars | charsExcl | words | lines',
    '      "direction": "in",         // in = animate on, out = animate off',
    '      "duration": 1.2,           // seconds, 0.2 - 6',
    '      "stagger": 0.05,           // seconds between units, 0 - 0.4',
    '      "from": {                  // the offset state the text animates FROM',
    '        "opacity": 0,            // 0 - 100',
    '        "posX": 0,               // px',
    '        "posY": 60,              // px',
    '        "scale": 100,            // %, 100 = no scaling',
    '        "rotZ": 0,               // degrees',
    '        "rotX": 0,               // degrees (turns the layer 3D)',
    '        "rotY": 0,               // degrees (turns the layer 3D)',
    '        "blur": 20,              // px',
    '        "tracking": 0,           // letter spacing',
    '        "skew": 0,               // degrees',
    '        "useColor": false,',
    '        "color": "#ffffff"',
    "      },",
    '      "selector": {              // AE range selector, optional',
    '        "start": 0,',
    '        "end": 100,',
    '        "offset": 0,',
    '        "shape": "square",       // square | rampup | rampdown | triangle | round | smooth',
    '        "easeHigh": 40,          // -100 - 100',
    '        "easeLow": 0,',
    '        "randomize": false',
    "      }",
    "    }",
    "  ]",
    "}"
  ].join("\n");
  var PROMPT_TEXT = [
    "You are generating an animation pack for the Ghostae Text After Effects panel.",
    "Reply with JSON only — no prose, no markdown fence, no comments.",
    "",
    "Rules:",
    '- Top level: { "format": "ghostae-animation-pack", "version": 1, "animations": [ ... ] }',
    "- Every animation needs a unique short name (2-3 words).",
    '- basis: "chars" | "charsExcl" | "words" | "lines"',
    '- direction: "in" or "out"',
    "- duration: seconds (0.2 - 6) PER UNIT. stagger: seconds per unit (0 - 0.4).",
    '- easing: "linear" | "easeIn" | "easeOut" | "easeInOut" | "smooth" (default smooth).',
    "- from{} may ONLY contain: opacity, posX, posY, position, scale, scaleX, scaleY, rotZ, rotX, rotY,",
    "  blur, tracking, skew, useColor, color. Any other key is rejected, not ignored.",
    "- Values equal to the rest state (opacity 100, scale 100, everything else 0) are dropped: omit them.",
    '- Optional keyframes[]: { "property": "posY", "time": 0.2 | "6f", "value": -8,',
    '  "interpolation": "bezier" | "linear" | "hold", "easeIn": 85, "easeOut": 20 }.',
    "  Only use them for overshoot/hold curves, and only for properties present in from{}.",
    '- from: the state the text animates FROM — opacity 0-100, posX/posY px, scale % (100 = none),',
    "  rotZ/rotX/rotY degrees, blur px, tracking, skew degrees, useColor bool, color hex.",
    '- selector: start/end/offset 0-100, shape "square"|"rampup"|"rampdown"|"triangle"|"round"|"smooth",',
    "  easeHigh/easeLow -100..100, randomize bool.",
    "",
    "Example of one valid animation:",
    SPEC_TEXT
  ].join("\n");
  function num(value, fallback, min, max) {
    var out = Number(value);
    if (isNaN(out)) out = fallback;
    if (typeof min === "number" && out < min) out = min;
    if (typeof max === "number" && out > max) out = max;
    return out;
  }
  function slug(name) {
    return String(name).toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "") || "custom";
  }
  /* Accepts either the full pack object, a bare array, or a single animation.
     Also tolerates a ```json fence, which is what people usually paste. */
  function parse(text) {
    var raw = String(text || "").replace(/^\s*```(?:json)?/i, "").replace(/```\s*$/, "");
    raw = raw.replace(/\/\/[^\n\r]*/g, "");
    if (!raw.replace(/\s/g, "")) return { ok: false, error: "Paste the animation JSON first." };
    var data;
    try {
      data = JSON.parse(raw);
    } catch (e) {
      return { ok: false, error: "That is not valid JSON: " + (e.message || e) };
    }
    var list = [];
    if (data && data.animations && data.animations.length) list = data.animations;
    else if (data && data.length) list = data;
    else if (data && data.name) list = [data];
    if (!list.length) return { ok: false, error: 'No animations found — expected an "animations" array.' };
    var out = [];
    for (var i = 0; i < list.length; i += 1) {
      var one = normalize(list[i]);
      if (!one.ok) return one;
      out.push(one.spec);
    }
    return { ok: true, animations: out };
  }
  /* Reads the first alias present so pasted JSON may use posY / py / y etc.
     without silently losing the value before it reaches GhostMotion. */
  function pick(source, names) {
    for (var i = 0; i < names.length; i += 1) {
      if (source && Object.prototype.hasOwnProperty.call(source, names[i]) && source[names[i]] != null) {
        return source[names[i]];
      }
    }
    return undefined;
  }
  function normalize(input) {
    if (!input || typeof input !== "object") return { ok: false, error: "Each animation must be an object." };
    var name = String(input.name || "").replace(/^\s+|\s+$/g, "");
    if (!name) return { ok: false, error: 'Every animation needs a "name".' };
    var from = input.from || input.state || input.offsetState || {};
    var sel = input.selector || {};
    var basis = String(input.basis || input.basedOn || "chars");
    if (!BASIS[basis]) basis = "chars";
    var shape = String(sel.shape || input.shape || "square");
    if (!SHAPES[shape]) shape = "square";
    var colorRaw = String(pick(from, ["color", "fill", "fillColor"]) || "");
    return {
      ok: true,
      spec: {
        name: name.slice(0, 40),
        basis: basis,
        direction: String(input.direction || "in") === "out" ? "out" : "in",
        duration: num(input.duration, 1.2, 0.2, 6),
        stagger: num(input.stagger, 0.05, 0, 0.4),
        easing: input.easing || input.ease || null,
        keyframes: input.keyframes && input.keyframes.length ? input.keyframes : [],
        properties: input.properties || null,
        from: {
          opacity: num(pick(from, ["opacity", "alpha"]), 0, 0, 100),
          posX: num(pick(from, ["posX", "px", "positionX"]), 0, -2000, 2000),
          posY: num(pick(from, ["posY", "py", "positionY"]), 0, -2000, 2000),
          scale: num(pick(from, ["scale"]), 100, 0, 500),
          rotZ: num(pick(from, ["rotZ", "rotation", "rotationZ"]), 0, -720, 720),
          rotX: num(pick(from, ["rotX", "rotationX"]), 0, -720, 720),
          rotY: num(pick(from, ["rotY", "rotationY"]), 0, -720, 720),
          blur: num(pick(from, ["blur"]), 0, 0, 200),
          tracking: num(pick(from, ["tracking", "letterSpacing"]), 0, -100, 400),
          skew: num(pick(from, ["skew"]), 0, -80, 80),
          useColor: !!pick(from, ["useColor"]),
          color: /^#[0-9a-fA-F]{6}$/.test(colorRaw) ? colorRaw : "#ffffff"
        },
        selector: {
          start: num(sel.start, 0, 0, 100),
          end: num(sel.end, 100, 0, 100),
          offset: num(sel.offset, 0, -100, 100),
          shape: shape,
          easeHigh: num(sel.easeHigh, 0, -100, 100),
          easeLow: num(sel.easeLow, 0, -100, 100),
          randomize: !!sel.randomize
        }
      }
    };
  }
  function read() {
    try {
      var raw = window.localStorage.getItem(STORE_KEY);
      var list = raw ? JSON.parse(raw) : [];
      if (!list || !list.length) return [];
      var kept = [];
      for (var i = 0; i < list.length; i += 1) {
        if (!isRetired(list[i])) kept.push(list[i]);
      }
      if (kept.length !== list.length) {
        try { window.localStorage.setItem(STORE_KEY, JSON.stringify(kept)); } catch (eW) {}
      }
      return kept;
    } catch (e) {
      return [];
    }
  }
  function write(list) {
    try {
      window.localStorage.setItem(STORE_KEY, JSON.stringify(list));
    } catch (e) {}
  }
  function list() {
    return read();
  }
  function add(specs) {
    var current = read();
    var byName = {};
    current.forEach(function(item, index) {
      byName[item.name.toLowerCase()] = index;
    });
    var added = 0, replaced = 0;
    specs.forEach(function(spec) {
      if (isRetired(spec)) return;
      var key = spec.name.toLowerCase();
      if (Object.prototype.hasOwnProperty.call(byName, key)) {
        current[byName[key]] = spec;
        replaced += 1;
      } else {
        byName[key] = current.length;
        current.push(spec);
        added += 1;
      }
    });
    write(current);
    return { added: added, replaced: replaced, total: current.length };
  }
  function remove(name) {
    var key = String(name).toLowerCase();
    write(read().filter(function(item) {
      return String(item.name).toLowerCase() !== key;
    }));
  }
  function styleTag() {
    var tag = document.getElementById("ghostAnimPackStyles");
    if (!tag) {
      tag = document.createElement("style");
      tag.id = "ghostAnimPackStyles";
      document.head.appendChild(tag);
    }
    return tag;
  }
  var injected = {};
  /* The preview keyframes are generated from the SAME canonical model the
     After Effects adapter applies (GhostMotion.cssKeyframes). The legacy
     hand-written CSS below is only a fallback for a missing GhostMotion. */
  function keyframeName(spec, model) {
    var GM = window.GhostMotion;
    if (GM && model) {
      var css = GM.cssKeyframes(model);
      if (injected[css.name]) return css.name;
      styleTag().appendChild(document.createTextNode("@keyframes " + css.name + " { " + css.body + " }\n"));
      injected[css.name] = true;
      return css.name;
    }
    var key = "ghostPack-" + slug(spec.name);
    if (injected[key]) return key;
    var f = spec.from;
    var offset = "opacity: " + (f.opacity / 100) +
      "; transform: translate(" + f.posX + "px," + f.posY + "px) scale(" + (f.scale / 100) +
      ") rotateX(" + f.rotX + "deg) rotateY(" + f.rotY + "deg) rotate(" + f.rotZ + "deg) skewX(" + f.skew +
      "deg); filter: blur(" + f.blur + "px); letter-spacing: " + (f.tracking / 10) + "px;" +
      (f.useColor ? " color: " + f.color + ";" : "");
    var rest = "opacity: 1; transform: none; filter: blur(0); letter-spacing: normal;";
    var body = spec.direction === "out"
      ? "0% { " + rest + " } 100% { " + offset + " }"
      : "0% { " + offset + " } 100% { " + rest + " }";
    styleTag().appendChild(document.createTextNode("@keyframes " + key + " { " + body + " }\n"));
    injected[key] = true;
    return key;
  }
  function units(text, basis) {
    var source = String(text || "GHOST");
    if (basis === "words" || basis === "lines") {
      return source.split(/\s+/).filter(function(part) {
        return part !== "";
      });
    }
    try {
      return Array.from(source);
    } catch (e) {
      return source.split("");
    }
  }
  /* Preview renders the SAME canonical model the Apply adapter consumes:
     timing, stagger order, direction and easing all come from GhostMotion. */
  function previewNode(spec, text) {
    var wrap = document.createElement("span");
    wrap.className = "tk-preview-text tk-seq tk-pack-preview";
    var GM = window.GhostMotion;
    var parts = GM ? GM.splitUnits(String(text || spec.name), spec.basis) : units(text, spec.basis);
    if (!parts.length) parts = ["G"];
    var model = null, plan = null, ease = "cubic-bezier(.16,1,.3,1)";
    if (GM) {
      var norm = GM.normalize(spec);
      if (norm.ok) {
        model = norm.model;
        plan = GM.timing(model, parts.length);
        ease = GM.cssEasing(model);
      }
    }
    var key = keyframeName(spec, model);
    for (var i = 0; i < parts.length; i += 1) {
      var unit = document.createElement("span");
      unit.className = "tk-seq-unit";
      unit.textContent = parts[i] === " " ? "\u00a0" : parts[i];
      var delay = plan ? plan.delayFor(i) : i * spec.stagger;
      var dur = plan ? plan.unitDuration : spec.duration;
      unit.style.animation = key + " " + dur + "s " + ease + " " + delay + "s infinite alternate both";
      if (spec.basis === "words" || spec.basis === "lines") unit.style.marginRight = "0.28em";
      wrap.appendChild(unit);
    }
    return wrap;
  }
  /* ── apply payload ─────────────────────────────────────────────────────
     The structured spec (from / selector / keyframes / properties) is sent
     verbatim so the host normalizer sees exactly the document the preview
     normalized. The flat legacy keys are kept for older host builds. */
  function payload(spec, options) {
    var opts = options || {};
    var f = spec.from;
    var body = {
      presetName: spec.name,
      name: spec.name,
      text: opts.text || spec.name,
      createLayer: !!opts.createLayer,
      from: f,
      selector: spec.selector,
      easing: spec.easing || null,
      keyframes: spec.keyframes || [],
      properties: spec.properties || null,
      opacity: f.opacity,
      posY: f.posY,
      posX: f.posX,
      scale: f.scale,
      rotZ: f.rotZ,
      rotX: f.rotX,
      rotY: f.rotY,
      blur: f.blur,
      tracking: f.tracking,
      skew: f.skew,
      color: f.color,
      useColor: f.useColor,
      start: spec.selector.start,
      end: spec.selector.end,
      offset: spec.selector.offset,
      basis: spec.basis,
      shape: spec.selector.shape,
      easeHigh: spec.selector.easeHigh,
      easeLow: spec.selector.easeLow,
      randomize: spec.selector.randomize,
      duration: opts.duration || spec.duration,
      stagger: spec.stagger,
      direction: spec.direction
    };
    if (opts.duration) body.from = f;
    return body;
  }
  window.GhostAnimPack = {
    SPEC_TEXT: SPEC_TEXT,
    PROMPT_TEXT: PROMPT_TEXT,
    parse: parse,
    list: list,
    add: add,
    remove: remove,
    previewNode: previewNode,
    payload: payload,
    slug: slug
  };
})();
(function(w){"use strict";w.GHOST_BUNDLED_ANIM_CATALOG=[{"name":"Position & Rotation Characters Left (B)","folder":"Position & Rotation Characters Left (B)","category":"Position Characters (B)"},{"name":"Position & Rotation Characters Up (B)","folder":"Position & Rotation Characters Up (B)","category":"Position Characters (B)"},{"name":"Position Characters Down (B)","folder":"Position Characters Down (B)","category":"Position Characters (B)"},{"name":"Position Characters Left (B)","folder":"Position Characters Left (B)","category":"Position Characters (B)"},{"name":"Position Characters Right (B)","folder":"Position Characters Right (B)","category":"Position Characters (B)"},{"name":"Position Characters Up (B)","folder":"Position Characters Up (B)","category":"Position Characters (B)"},{"name":"Position & Rotation Words Down (B)","folder":"Position & Rotation Words Down (B)","category":"Position Words (B)"},{"name":"Position & Rotation Words Left (B)","folder":"Position & Rotation Words Left (B)","category":"Position Words (B)"},{"name":"Position & Rotation Words Right (B)","folder":"Position & Rotation Words Right (B)","category":"Position Words (B)"},{"name":"Position & Rotation Words Up (B)","folder":"Position & Rotation Words Up (B)","category":"Position Words (B)"},{"name":"Position Words Down (B)","folder":"Position Words Down (B)","category":"Position Words (B)"},{"name":"Position Words Left (B)","folder":"Position Words Left (B)","category":"Position Words (B)"},{"name":"Position Words Right (B)","folder":"Position Words Right (B)","category":"Position Words (B)"},{"name":"Position Words Up (B)","folder":"Position Words Up (B)","category":"Position Words (B)"},{"name":"Position Line Down (B)","folder":"Position Line Down (B)","category":"Position line (B)"},{"name":"Position Line Left (B)","folder":"Position Line Left (B)","category":"Position line (B)"},{"name":"Position Line Right (B)","folder":"Position Line Right (B)","category":"Position line (B)"},{"name":"Position Line Up (B)","folder":"Position Line Up (B)","category":"Position line (B)"},{"name":"Scale & Rotation Characters (B)","folder":"Scale & Rotation Characters (B)","category":"Scale (B)"},{"name":"Scale & Rotation Words (B)","folder":"Scale & Rotation Words (B)","category":"Scale (B)"},{"name":"Scale & Tracking Characters (B)","folder":"Scale & Tracking Characters (B)","category":"Scale (B)"},{"name":"Scale & Tracking Characters 2 (B)","folder":"Scale & Tracking Characters 2 (B)","category":"Scale (B)"},{"name":"Scale & Tracking Words (B)","folder":"Scale & Tracking Words (B)","category":"Scale (B)"},{"name":"Scale & Tracking Words 2 (B)","folder":"Scale & Tracking Words 2 (B)","category":"Scale (B)"},{"name":"Scale Characters (B)","folder":"Scale Characters (B)","category":"Scale (B)"},{"name":"Scale Line (B)","folder":"Scale Line (B)","category":"Scale (B)"},{"name":"Scale Words (B)","folder":"Scale Words (B)","category":"Scale (B)"},{"name":"3D Characters & Rotation Down","folder":"3D Characters & Rotation Down","category":"3D Characters"},{"name":"3D Characters & Rotation Front","folder":"3D Characters & Rotation Front","category":"3D Characters"},{"name":"3D Characters & Rotation Left","folder":"3D Characters & Rotation Left","category":"3D Characters"},{"name":"3D Characters & Rotation Up","folder":"3D Characters & Rotation Up","category":"3D Characters"},{"name":"3D Characters Down","folder":"3D Characters Down","category":"3D Characters"},{"name":"3D Characters Front","folder":"3D Characters Front","category":"3D Characters"},{"name":"3D Characters Left","folder":"3D Characters Left","category":"3D Characters"},{"name":"3D Characters Right","folder":"3D Characters Right","category":"3D Characters"},{"name":"3D Characters Up","folder":"3D Characters Up","category":"3D Characters"},{"name":"3D Words & Rotation Down","folder":"3D Words & Rotation Down","category":"3D Words"},{"name":"3D Words & Rotation Front","folder":"3D Words & Rotation Front","category":"3D Words"},{"name":"3D Words & Rotation Left","folder":"3D Words & Rotation Left","category":"3D Words"},{"name":"3D Words & Rotation Right","folder":"3D Words & Rotation Right","category":"3D Words"},{"name":"3D Words & Rotation Up","folder":"3D Words & Rotation Up","category":"3D Words"},{"name":"3D Words Down","folder":"3D Words Down","category":"3D Words"},{"name":"3D Words Front","folder":"3D Words Front","category":"3D Words"},{"name":"3D Words Left","folder":"3D Words Left","category":"3D Words"},{"name":"3D Words Right","folder":"3D Words Right","category":"3D Words"},{"name":"3D Words Up","folder":"3D Words Up","category":"3D Words"},{"name":"Anchor Point Characters Down","folder":"Anchor Point Characters Down","category":"Anchor Point Characters"},{"name":"Anchor Point Characters Right","folder":"Anchor Point Characters Right","category":"Anchor Point Characters"},{"name":"Anchor Point Characters Up","folder":"Anchor Point Characters Up","category":"Anchor Point Characters"},{"name":"Anchor Point Characters left","folder":"Anchor Point Characters left","category":"Anchor Point Characters"},{"name":"Anchor Point Words Down","folder":"Anchor Point Words Down","category":"Anchor Point Words"},{"name":"Anchor Point Words Right","folder":"Anchor Point Words Right","category":"Anchor Point Words"},{"name":"Anchor Point Words Up","folder":"Anchor Point Words Up","category":"Anchor Point Words"},{"name":"Anchor Point Words left","folder":"Anchor Point Words left","category":"Anchor Point Words"},{"name":"Opacity & Blur Characters","folder":"Opacity & Blur Characters","category":"Opacity Characters"},{"name":"Opacity Characters 1","folder":"Opacity Characters 1","category":"Opacity Characters"},{"name":"Opacity Characters 2","folder":"Opacity Characters 2","category":"Opacity Characters"},{"name":"Opacity Characters 3","folder":"Opacity Characters 3","category":"Opacity Characters"},{"name":"Opacity & Blur Words","folder":"Opacity & Blur Words","category":"Opacity Words"},{"name":"Opacity Words 1","folder":"Opacity Words 1","category":"Opacity Words"},{"name":"Opacity Words 2","folder":"Opacity Words 2","category":"Opacity Words"},{"name":"Opacity Words 3","folder":"Opacity Words 3","category":"Opacity Words"},{"name":"Opacity Words 4","folder":"Opacity Words 4","category":"Opacity Words"},{"name":"Position Characters Down 2","folder":"Position Characters Down 2","category":"Position Characters"},{"name":"Position Characters Down 3","folder":"Position Characters Down 3","category":"Position Characters"},{"name":"Position Characters Down","folder":"Position Characters Down","category":"Position Characters"},{"name":"Position Characters Right 2","folder":"Position Characters Right 2","category":"Position Characters"},{"name":"Position Characters Right 3","folder":"Position Characters Right 3","category":"Position Characters"},{"name":"Position Characters Right","folder":"Position Characters Right","category":"Position Characters"},{"name":"Position Characters Up 2","folder":"Position Characters Up 2","category":"Position Characters"},{"name":"Position Characters Up 3","folder":"Position Characters Up 3","category":"Position Characters"},{"name":"Position Characters Up","folder":"Position Characters Up","category":"Position Characters"},{"name":"Position & Blur Words Down","folder":"Position & Blur Words Down","category":"Position Words"},{"name":"Position & Blur Words Left","folder":"Position & Blur Words Left","category":"Position Words"},{"name":"Position & Blur Words Right","folder":"Position & Blur Words Right","category":"Position Words"},{"name":"Position & Blur Words Up","folder":"Position & Blur Words Up","category":"Position Words"},{"name":"Position Words Down","folder":"Position Words Down","category":"Position Words"},{"name":"Position Words Left","folder":"Position Words Left","category":"Position Words"},{"name":"Position Words Right","folder":"Position Words Right","category":"Position Words"},{"name":"Position Words Up","folder":"Position Words Up","category":"Position Words"},{"name":"Random Characters & Blur 2","folder":"Random Characters & Blur 2","category":"Random Characters"},{"name":"Random Characters & Blur 3","folder":"Random Characters & Blur 3","category":"Random Characters"},{"name":"Random Characters & Blur","folder":"Random Characters & Blur","category":"Random Characters"},{"name":"Random Characters Down","folder":"Random Characters Down","category":"Random Characters"},{"name":"Random Characters Left","folder":"Random Characters Left","category":"Random Characters"},{"name":"Random Characters Right","folder":"Random Characters Right","category":"Random Characters"},{"name":"Random Characters Up","folder":"Random Characters Up","category":"Random Characters"},{"name":"Random Characters","folder":"Random Characters","category":"Random Characters"},{"name":"Random Words & Blur 2","folder":"Random Words & Blur 2","category":"Random Words"},{"name":"Random Words & Blur 3","folder":"Random Words & Blur 3","category":"Random Words"},{"name":"Random Words & Blur","folder":"Random Words & Blur","category":"Random Words"},{"name":"Random Words Down","folder":"Random Words Down","category":"Random Words"},{"name":"Random Words Left","folder":"Random Words Left","category":"Random Words"},{"name":"Random Words Right","folder":"Random Words Right","category":"Random Words"},{"name":"Random Words Up","folder":"Random Words Up","category":"Random Words"},{"name":"Random Words","folder":"Random Words","category":"Random Words"},{"name":"Typewriter 1","folder":"Typewriter 1","category":"Typewriter"},{"name":"Typewriter 2","folder":"Typewriter 2","category":"Typewriter"},{"name":"Typewriter 3","folder":"Typewriter 3","category":"Typewriter"},{"name":"Typewriter 5","folder":"Typewriter 5","category":"Typewriter"}];w.GHOST_BUNDLED_STYLE_CATALOG=[{"name":"4 color 1","file":"4 color 1.ffx","preview":"4 color 1.png","category":"Color"},{"name":"4 color 2","file":"4 color 2.ffx","preview":"4 color 2.png","category":"Color"},{"name":"4 color 3","file":"4 color 3.ffx","preview":"4 color 3.png","category":"Color"},{"name":"4 color 4","file":"4 color 4.ffx","preview":"4 color 4.png","category":"Color"},{"name":"Soft Blue Dark Black ramp ","file":"Soft Blue Dark Black ramp .ffx","preview":"Soft Blue Dark Black ramp .png","category":"Color"},{"name":"Soft Green Dark Green ramp ","file":"Soft Green Dark Green ramp .ffx","preview":"Soft Green Dark Green ramp .png","category":"Color"},{"name":"Soft Orange Dark Orange Ramp ","file":"Soft Orange Dark Orange Ramp .ffx","preview":"Soft Orange Dark Orange Ramp .png","category":"Color"},{"name":"Soft sky Dark Black ramp ","file":"Soft sky Dark Black ramp .ffx","preview":"Soft sky Dark Black ramp .png","category":"Color"},{"name":"Soft syen Dark syen  ramp ","file":"Soft syen Dark syen  ramp .ffx","preview":"Soft syen Dark syen  ramp .png","category":"Color"},{"name":"Soft tail Dark tail ramp ","file":"Soft tail Dark tail ramp .ffx","preview":"Soft tail Dark tail ramp .png","category":"Color"},{"name":"Soft White Dark Black ramp ","file":"Soft White Dark Black ramp .ffx","preview":"Soft White Dark Black ramp .png","category":"Color"},{"name":"Soft Yellow Dark Black ramp ","file":"Soft Yellow Dark Black ramp .ffx","preview":"Soft Yellow Dark Black ramp .png","category":"Color"},{"name":"White Black ramp ","file":"White Black ramp .ffx","preview":"White Black ramp .png","category":"Color"}];})(window);
if (typeof window !== "undefined" && window.__ghostStamp) {
  window.__ghostStamp(
    "toolkit.js",
    "3.40.7+20260901.style-lock-menu"
  );
}
(function() {
  "use strict";
  /* Hot-path helpers: CEP's Chromium repaints slowly, so keystroke-driven
     grid filtering is debounced and batched instead of running per keypress. */
  var tkDebounce = (typeof window !== "undefined" && window.GhostPerf)
    ? window.GhostPerf.debounce
    : function(fn) { return fn; };
  var cs = null;
  try {
    cs = new CSInterface();
  } catch (e) {
    cs = null;
  }
  var statusEl = null;
  var toastRegion = null;
  /* v3.23.0 — the two FFX animation cards ("Kinetic Rise" / "Elastic Drop")
     were removed from the Animations tab on request. FFX_COLOR (Text tab)
     is untouched. */
  var FFX_COLOR = [
    { label: "Neon Ghost Look", file: "GHOST_Neon_Look.ffx", fallback: "Ghost Cyan", color: "#2680eb" },
    { label: "Gold Cinematic", file: "GHOST_Gold_Cinematic.ffx", fallback: "Molten Gold", color: "#f0c74a" }
  ];
  /* ══════════════════════════════════════════════════════════════
     50 built-in presets. Every one of them is built with the Pop In
     recipe from docs/GHOST-MOTION-RULES.md (JOB B): GHOST-prefixed
     sliders + text animators, an Expressible Selector (Range Type2 = 3)
     driven by textIndex, start time from the layer "IN" marker, plus a
     dedicated opacity animator. `group` feeds the category menu next to
     the play button; `anim` is the matching preview class in
     css/toolkit.css, generated from the SAME offset table as the After
     Effects values, so the card and the layer stay identical.
     ══════════════════════════════════════════════════════════════ */
  var ANIMATIONS = [
    { name: "Pop In Up", group: "pop", anim: "tk-anim-popin-up", seq: "char" },
    { name: "Pop In Down", group: "pop", anim: "tk-anim-popin-down", seq: "char" },
    { name: "Pop In Left", group: "pop", anim: "tk-anim-popin-left", seq: "char" },
    { name: "Pop In Right", group: "pop", anim: "tk-anim-popin-right", seq: "char" },
    { name: "Pop In Scale", group: "pop", anim: "tk-anim-popin-scale", seq: "char" },
    { name: "Pop In Spin", group: "pop", anim: "tk-anim-popin-spin", seq: "char" },
    { name: "Pop In Blur", group: "pop", anim: "tk-anim-popin-blur", seq: "char" },
    { name: "Pop In Track", group: "pop", anim: "tk-anim-popin-track", seq: "char" },
    { name: "Bounce Drop", group: "bounce", anim: "tk-anim-bounce-drop", seq: "char" },
    { name: "Bounce Rise", group: "bounce", anim: "tk-anim-bounce-rise", seq: "char" },
    { name: "Bounce Squash", group: "bounce", anim: "tk-anim-bounce-squash", seq: "char" },
    { name: "Bounce Swing", group: "bounce", anim: "tk-anim-bounce-swing", seq: "char" },
    { name: "Bounce Spread", group: "bounce", anim: "tk-anim-bounce-spread", seq: "char" },
    { name: "Bounce Skew", group: "bounce", anim: "tk-anim-bounce-skew", seq: "char" },
    { name: "Bounce Side", group: "bounce", anim: "tk-anim-bounce-side", seq: "char" },
    { name: "Bounce Tilt", group: "bounce", anim: "tk-anim-bounce-tilt", seq: "char" },
    { name: "Bounce Pop", group: "bounce", anim: "tk-anim-bounce-pop", seq: "char" },
    { name: "Bounce Roll", group: "bounce", anim: "tk-anim-bounce-roll", seq: "char" },
    { name: "Elastic Rise", group: "elastic", anim: "tk-anim-elastic-rise", seq: "char" },
    { name: "Elastic Snap", group: "elastic", anim: "tk-anim-elastic-snap", seq: "char" },
    { name: "Elastic Wobble", group: "elastic", anim: "tk-anim-elastic-wobble", seq: "char" },
    { name: "Elastic Stretch", group: "elastic", anim: "tk-anim-elastic-stretch", seq: "char" },
    { name: "Fade Soft", group: "fade", anim: "tk-anim-fade-soft", seq: "char" },
    { name: "Fade Up", group: "fade", anim: "tk-anim-fade-up", seq: "char" },
    { name: "Fade Down", group: "fade", anim: "tk-anim-fade-down", seq: "char" },
    { name: "Fade Scale", group: "fade", anim: "tk-anim-fade-scale", seq: "char" },
    { name: "Fade Track", group: "fade", anim: "tk-anim-fade-track", seq: "char" },
    { name: "Slide Soft In", group: "slide", anim: "tk-anim-slide-soft-in", seq: "char" },
    { name: "Slide Soft Out", group: "slide", anim: "tk-anim-slide-soft-out", seq: "char" },
    { name: "Slide Rise", group: "slide", anim: "tk-anim-slide-rise", seq: "char" },
    { name: "Slide Fall", group: "slide", anim: "tk-anim-slide-fall", seq: "char" },
    { name: "Slide Diagonal", group: "slide", anim: "tk-anim-slide-diagonal", seq: "char" },
    { name: "Scale Burst", group: "scale", anim: "tk-anim-scale-burst", seq: "char" },
    { name: "Scale Shrink", group: "scale", anim: "tk-anim-scale-shrink", seq: "char" },
    { name: "Scale Wide", group: "scale", anim: "tk-anim-scale-wide", seq: "char" },
    { name: "Scale Tall", group: "scale", anim: "tk-anim-scale-tall", seq: "char" },
    { name: "Rotate Sweep", group: "rotate", anim: "tk-anim-rotate-sweep", seq: "char" },
    { name: "Rotate Flip Up", group: "rotate", anim: "tk-anim-rotate-flip-up", seq: "char" },
    { name: "Rotate Flip Side", group: "rotate", anim: "tk-anim-rotate-flip-side", seq: "char" },
    { name: "Rotate Tumble", group: "rotate", anim: "tk-anim-rotate-tumble", seq: "char" },
    { name: "Blur Rise", group: "blur", anim: "tk-anim-blur-rise", seq: "char" },
    { name: "Blur Zoom", group: "blur", anim: "tk-anim-blur-zoom", seq: "char" },
    { name: "Blur Drift", group: "blur", anim: "tk-anim-blur-drift", seq: "char" },
    { name: "Blur Focus", group: "blur", anim: "tk-anim-blur-focus", seq: "char" },
    { name: "Track Wide", group: "track", anim: "tk-anim-track-wide", seq: "char" },
    { name: "Track Tight", group: "track", anim: "tk-anim-track-tight", seq: "char" },
    { name: "Track Glow", group: "track", anim: "tk-anim-track-glow", seq: "char" },
    { name: "Skew Slice", group: "skew", anim: "tk-anim-skew-slice", seq: "char" },
    { name: "Skew Snap", group: "skew", anim: "tk-anim-skew-snap", seq: "char" },
    { name: "Skew Rise", group: "skew", anim: "tk-anim-skew-rise", seq: "char" },
    { name: "Wave Flow", group: "wave", anim: "tk-anim-wave-flow", seq: "char" },
    { name: "Wave Ripple", group: "wave", anim: "tk-anim-wave-ripple", seq: "char" },
    { name: "Wave Drift", group: "wave", anim: "tk-anim-wave-drift", seq: "char" },
    { name: "Glitch Slice", group: "glitch", anim: "tk-anim-glitch-slice", seq: "char" },
    { name: "Glitch Jitter", group: "glitch", anim: "tk-anim-glitch-jitter", seq: "char" },
    { name: "Glitch Blur", group: "glitch", anim: "tk-anim-glitch-blur", seq: "char" },
    { name: "Cinema Reveal", group: "cinema", anim: "tk-anim-cinema-reveal", seq: "char" },
    { name: "Cinema Push", group: "cinema", anim: "tk-anim-cinema-push", seq: "char" },
    { name: "Cinema Drift", group: "cinema", anim: "tk-anim-cinema-drift", seq: "char" },
    { name: "Kinetic Snap", group: "kinetic", anim: "tk-anim-kinetic-snap", seq: "char" },
    { name: "Kinetic Punch", group: "kinetic", anim: "tk-anim-kinetic-punch", seq: "char" },
    { name: "Kinetic Swing", group: "kinetic", anim: "tk-anim-kinetic-swing", seq: "char" },
    { name: "Reveal Rise", group: "reveal", anim: "tk-anim-reveal-rise", seq: "char" },
    { name: "Reveal Stretch", group: "reveal", anim: "tk-anim-reveal-stretch", seq: "char" },
    { name: "Reveal Spread", group: "reveal", anim: "tk-anim-reveal-spread", seq: "char" }
  ];
  var ANIM_CATEGORIES = [
    { id: "all", label: "All animations", labelBn: "সব animation" },
    { id: "pop", label: "Pop In", labelBn: "Pop In" },
    { id: "bounce", label: "Bounce", labelBn: "Bounce" },
    { id: "elastic", label: "Elastic", labelBn: "Elastic" },
    { id: "fade", label: "Fade", labelBn: "Fade" },
    { id: "slide", label: "Slide", labelBn: "Slide" },
    { id: "scale", label: "Scale", labelBn: "Scale" },
    { id: "rotate", label: "Rotate", labelBn: "Rotate" },
    { id: "blur", label: "Blur", labelBn: "Blur" },
    { id: "track", label: "Tracking", labelBn: "Tracking" },
    { id: "skew", label: "Skew", labelBn: "Skew" },
    { id: "wave", label: "Wave", labelBn: "Wave" },
    { id: "glitch", label: "Glitch", labelBn: "Glitch" },
    { id: "cinema", label: "Cinematic", labelBn: "Cinematic" },
    { id: "kinetic", label: "Kinetic", labelBn: "Kinetic" },
    { id: "reveal", label: "Reveal", labelBn: "Reveal" }
  ];
  var COLORS = [
    { name: "Ghost Cyan", css: "#00f0ff", glow: true },
    { name: "Neon Magenta", css: "#ff2bad", glow: true },
    { name: "Acid Green", css: "#74ff3d", glow: true },
    { name: "Molten Gold", css: "#ffc728", glow: true },
    { name: "Ice Blue", css: "#9ed9ff", glow: false },
    { name: "Blood Red", css: "#eb1f29", glow: true },
    { name: "Pure White", css: "#ffffff", glow: false },
    { name: "Deep Void", css: "#111114", glow: false, stroke: "#6b6b6b" },
    { name: "Sunset Pink", css: "#ff6b99", glow: true },
    { name: "Electric Purple", css: "#a659ff", glow: true },
    { name: "Solar Blaze", css: "#ff730d", glow: true },
    { name: "Holo Silver", css: "#e6eef5", glow: true, stroke: "#00f0ff" },
    { name: "Lavender Dream", css: "#b8bfff", glow: true },
    { name: "Radioactive Yellow", css: "#fce647", glow: true, stroke: "#854d0e" },
    { name: "Cyber Teal", css: "#2ed4bf", glow: true },
    { name: "Ember Orange", css: "#ff5921", glow: true },
    { name: "Deep Ocean", css: "#0d59bf", glow: true },
    { name: "Sky Cyan", css: "#59c7ff", glow: true },
    { name: "Mint Fresh", css: "#66f2bf", glow: true },
    { name: "Forest Green", css: "#218042", glow: false },
    { name: "Lime Punch", css: "#c7ff21", glow: true },
    { name: "Royal Blue", css: "#2680eb", glow: true },
    { name: "Indigo Night", css: "#4a38d9", glow: true },
    { name: "Violet Haze", css: "#8c4ce6", glow: true },
    { name: "Rose Gold", css: "#e8ad99", glow: false },
    { name: "Champagne", css: "#f5e6c2", glow: false },
    { name: "Bronze", css: "#a66e33", glow: false },
    { name: "Copper Glow", css: "#d97333", glow: true },
    { name: "Steel Grey", css: "#8c949e", glow: false },
    { name: "Graphite", css: "#33363b", glow: false, stroke: "#999999" },
    { name: "Charcoal Ink", css: "#1a1a1c", glow: false, stroke: "#ffffff" },
    { name: "Coral Reef", css: "#ff7061", glow: true },
    { name: "Peach Cream", css: "#ffd1ab", glow: false },
    { name: "Bubblegum", css: "#ff87cc", glow: true },
    { name: "Hot Crimson", css: "#db143d", glow: true },
    { name: "Wine Red", css: "#730f24", glow: false, stroke: "#e6808c" },
    { name: "Aqua Marine", css: "#00d9b3", glow: true },
    { name: "Sea Foam", css: "#a1edd9", glow: false },
    { name: "Sand Dune", css: "#d9bf8c", glow: false },
    { name: "Toxic Slime", css: "#9ef200", glow: true, stroke: "#1a4d00" },
    { name: "Plasma Pink", css: "#ff008c", glow: true },
    { name: "UV Purple", css: "#6b00ff", glow: true },
    { name: "Arctic White", css: "#f2faff", glow: true, stroke: "#59c7ff" },
    { name: "Matte Black", css: "#050505", glow: false, stroke: "#555555" },
    { name: "Gold Foil", css: "#d4b038", glow: true, stroke: "#66500d" },
    { name: "Chrome Blue", css: "#bfd9f2", glow: true, stroke: "#2666b3" },
    { name: "Retro Amber", css: "#ffb84d", glow: true },
    { name: "Cosmic Teal", css: "#0099a6", glow: true },
    { name: "Midnight Blue", css: "#17215c", glow: false, stroke: "#6699ff" }
  ];
  var EMOJI_GROUPS = [
    {
      id: "smileys",
      icon: "😀",
      label: "Smileys",
      labelBn: "হাসিমুখ",
      items: ["😀", "😃", "😄", "😁", "😆", "😅", "🤣", "😂", "🙂", "🙃", "🫠", "😉", "😊", "😇", "🥰", "😍", "🤩", "😘", "😗", "😚", "😙", "🥲", "😋", "😛", "😜", "🤪", "😝", "🤑", "🤗", "🤭", "🫢", "🤫", "🤔", "🫡", "🤐", "🤨", "😐", "😑", "😶", "🫥", "😏", "😒", "🙄", "😬", "🤥", "😌", "😔", "😪", "🤤", "😴", "😷", "🤒", "🤕", "🤢", "🤮", "🤧", "🥵", "🥶", "🥴", "😵", "🤯", "🤠", "🥳", "🥸", "😎", "🤓", "🧐", "😕", "🫤", "😟", "🙁", "😮", "😯", "😲", "😳", "🥺", "🥹", "😦", "😧", "😨", "😰", "😥", "😢", "😭", "😱", "😖", "😣", "😞", "😓", "😩", "😫", "🥱", "😤", "😡", "😠", "🤬", "😈", "👿", "💀", "☠️", "💩", "🤡", "👹", "👺", "👻", "👽", "👾", "🤖", "😺", "😸", "😹", "😻", "😼", "😽", "🙀", "😿", "😾"]
    },
    {
      id: "gestures",
      icon: "👍",
      label: "Gestures",
      labelBn: "অঙ্গভঙ্গি",
      items: ["👋", "🤚", "🖐️", "✋", "🖖", "🫱", "🫲", "🫳", "🫴", "👌", "🤌", "🤏", "✌️", "🤞", "🫰", "🤟", "🤘", "🤙", "👈", "👉", "👆", "🖕", "👇", "☝️", "🫵", "👍", "👎", "✊", "👊", "🤛", "🤜", "👏", "🙌", "🫶", "👐", "🤲", "🤝", "🙏", "✍️", "💅", "🤳", "💪", "🦾", "🦵", "🦿", "🦶", "👂", "🦻", "👃", "🧠", "🫀", "🫁", "🦷", "🦴", "👀", "👁️", "👅", "👄", "🫦"]
    },
    {
      id: "hearts",
      icon: "❤️",
      label: "Hearts",
      labelBn: "হৃদয়",
      items: ["❤️", "🧡", "💛", "💚", "💙", "💜", "🖤", "🤍", "🤎", "💔", "❤️‍🔥", "❤️‍🩹", "❣️", "💕", "💞", "💓", "💗", "💖", "💘", "💝", "💟", "♥️", "💌", "💋", "😻", "🥰", "😍", "😘"]
    },
    {
      id: "fx",
      icon: "✨",
      label: "FX & Motion",
      labelBn: "ইফেক্ট",
      items: ["⚡", "🔥", "✨", "💥", "💫", "🌟", "⭐", "🌠", "☄️", "💢", "💦", "💨", "🕳️", "💣", "🧨", "🎆", "🎇", "🪄", "🔮", "🧿", "🌀", "🌪️", "🌈", "☀️", "🌙", "🌡️", "❄️", "🫧", "🩸", "🌫️"]
    },
    {
      id: "ui",
      icon: "✅",
      label: "UI & Signs",
      labelBn: "সাইন",
      items: ["✅", "☑️", "✔️", "❌", "❎", "⭕", "🚫", "⚠️", "❓", "❔", "❗", "❕", "‼️", "⁉️", "➕", "➖", "✖️", "➗", "🟰", "♾️", "🔴", "🟠", "🟡", "🟢", "🔵", "🟣", "⚫", "⚪", "🟤", "🔺", "🔻", "🔸", "🔹", "🔶", "🔷", "🔳", "🔲", "▶️", "⏸️", "⏹️", "⏺️", "⏭️", "⏮️", "⏩", "⏪", "🔀", "🔁", "🔂", "🔄", "🔃", "🔔", "🔕", "🔒", "🔓", "🔑", "🗝️", "🔗", "📍", "📌", "🏷️"]
    },
    {
      id: "tech",
      icon: "💻",
      label: "Tech",
      labelBn: "টেক",
      items: ["💻", "🖥️", "🖨️", "⌨️", "🖱️", "💽", "💾", "💿", "📀", "🧮", "📱", "📲", "☎️", "📞", "📟", "📠", "🔌", "🔋", "🪫", "📡", "🛰️", "🌐", "🖲️", "🕹️", "🎮", "👾", "🤖", "⚙️", "🛠️", "🔧", "🔨", "⛏️", "🪛", "🔩", "🧰", "🧲", "🔬", "🔭", "🧪", "⚗️", "🧬", "💡", "🔦", "🪪", "🗜️"]
    },
    {
      id: "media",
      icon: "🎬",
      label: "Media",
      labelBn: "মিডিয়া",
      items: ["🎬", "🎥", "📽️", "🎞️", "📺", "📷", "📸", "📹", "📼", "🎙️", "🎚️", "🎛️", "🎤", "🎧", "🔊", "🔉", "🔈", "🔇", "📢", "📣", "🎵", "🎶", "🎼", "🎹", "🥁", "🎸", "🎺", "🎻", "🪕", "🎷", "🪗", "🎨", "🖌️", "🖍️", "✏️", "🖊️", "🖋️", "✂️", "📐", "📏"]
    },
    {
      id: "business",
      icon: "📈",
      label: "Business",
      labelBn: "ব্যবসা",
      items: ["📈", "📉", "📊", "💹", "💰", "💵", "💴", "💶", "💷", "💸", "💳", "🪙", "🧾", "🏦", "🏧", "💼", "📁", "📂", "🗂️", "📄", "📃", "📑", "📋", "📝", "🗒️", "🗓️", "📅", "📆", "⏳", "⌛", "⏰", "⏱️", "⏲️", "🕰️", "📬", "📮", "📦", "🔖", "📎", "🖇️"]
    },
    {
      id: "awards",
      icon: "🏆",
      label: "Awards",
      labelBn: "পুরস্কার",
      items: ["🏆", "🥇", "🥈", "🥉", "🏅", "🎖️", "👑", "💎", "🎯", "🎖", "🎗️", "🎫", "🎟️", "🎁", "🎉", "🎊", "🎈", "🪅", "🧧", "🕶️", "👔", "💍", "🔱", "⚜️", "🚀", "🛸", "🎪"]
    },
    {
      id: "nature",
      icon: "🌸",
      label: "Nature",
      labelBn: "প্রকৃতি",
      items: ["🌸", "💮", "🏵️", "🌹", "🥀", "🌺", "🌻", "🌼", "🌷", "🌱", "🪴", "🌲", "🌳", "🌴", "🌵", "🌾", "🌿", "☘️", "🍀", "🍁", "🍂", "🍃", "🪺", "🍄", "🌊", "🌋", "🏔️", "⛰️", "🏕️", "🏝️", "🌅", "🌄", "🌇", "🌆", "🌃", "🌌", "☁️", "⛅", "🌧️", "⛈️", "🌩️", "🌨️", "🌬️"]
    },
    {
      id: "animals",
      icon: "🐶",
      label: "Animals",
      labelBn: "প্রাণী",
      items: ["🐶", "🐱", "🐭", "🐹", "🐰", "🦊", "🐻", "🐼", "🐨", "🐯", "🦁", "🐮", "🐷", "🐸", "🐵", "🙈", "🙉", "🙊", "🐔", "🐧", "🐦", "🦅", "🦉", "🦇", "🐺", "🐗", "🐴", "🦄", "🐝", "🪲", "🦋", "🐌", "🐞", "🐢", "🐍", "🦕", "🐙", "🦑", "🦐", "🦀", "🐠", "🐟", "🐬", "🐳", "🦈", "🐊", "🐘", "🦒", "🦓", "🐫"]
    },
    {
      id: "food",
      icon: "🍔",
      label: "Food",
      labelBn: "খাবার",
      items: ["🍎", "🍏", "🍊", "🍋", "🍌", "🍉", "🍇", "🍓", "🫐", "🍒", "🍑", "🥭", "🍍", "🥥", "🥝", "🍅", "🥑", "🌽", "🌶️", "🥕", "🥔", "🍞", "🥐", "🥖", "🧀", "🥚", "🍳", "🥞", "🧇", "🥓", "🍔", "🍟", "🍕", "🌭", "🥪", "🌮", "🌯", "🥙", "🍜", "🍲", "🍛", "🍣", "🍱", "🍤", "🍚", "🍙", "🍢", "🍡", "🍧", "🍨", "🍦", "🍰", "🎂", "🧁", "🍩", "🍪", "🍫", "🍬", "🍭", "🍯", "🍿", "☕", "🍵", "🧃", "🥤", "🍺", "🍻", "🥂", "🍷", "🥃"]
    },
    {
      id: "travel",
      icon: "✈️",
      label: "Travel",
      labelBn: "ভ্রমণ",
      items: ["🚗", "🚕", "🚙", "🚌", "🚎", "🏎️", "🚓", "🚑", "🚒", "🚐", "🛻", "🚚", "🚛", "🚜", "🏍️", "🛵", "🚲", "🛴", "🚨", "🚔", "🚍", "🚝", "🚄", "🚅", "🚈", "🚂", "🚆", "✈️", "🛫", "🛬", "🛩️", "🚁", "🛸", "🚀", "🛰️", "⛵", "🚤", "🛥️", "🚢", "⚓", "🗺️", "🧭", "🏁", "🚦", "🚧", "🗽", "🗼", "🏰", "🕌", "🕍", "⛩️", "🏯"]
    },
    {
      id: "sports",
      icon: "⚽",
      label: "Sports",
      labelBn: "খেলা",
      items: ["⚽", "🏀", "🏈", "⚾", "🥎", "🎾", "🏐", "🏉", "🥏", "🎱", "🪀", "🏓", "🏸", "🏒", "🏑", "🥍", "🏏", "🪃", "🥅", "⛳", "🪁", "🏹", "🎣", "🤿", "🥊", "🥋", "🎽", "🛹", "🛼", "🛷", "⛸️", "🥌", "🎿", "⛷️", "🏂", "🏋️", "🤸", "🤺", "🤾", "🏌️", "🏇", "🧘", "🏄", "🏊", "🚴", "🚵", "🎖️", "🎲", "🧩", "♟️"]
    },
    {
      id: "flags",
      icon: "🏳️",
      label: "Flags",
      labelBn: "পতাকা",
      items: ["🏳️", "🏴", "🏁", "🚩", "🏳️‍🌈", "🇧🇩", "🇮🇳", "🇵🇰", "🇳🇵", "🇱🇰", "🇺🇸", "🇬🇧", "🇨🇦", "🇦🇺", "🇩🇪", "🇫🇷", "🇮🇹", "🇪🇸", "🇳🇱", "🇸🇪", "🇳🇴", "🇩🇰", "🇫🇮", "🇵🇱", "🇷🇺", "🇺🇦", "🇹🇷", "🇸🇦", "🇦🇪", "🇶🇦", "🇪🇬", "🇿🇦", "🇳🇬", "🇰🇪", "🇧🇷", "🇦🇷", "🇲🇽", "🇨🇳", "🇯🇵", "🇰🇷", "🇮🇩", "🇲🇾", "🇸🇬", "🇹🇭", "🇻🇳", "🇵🇭"]
    },
    {
      id: "symbols",
      icon: "★",
      label: "Symbols",
      labelBn: "প্রতীক",
      items: ["★", "☆", "✦", "✧", "❖", "◆", "◇", "●", "○", "■", "□", "▲", "▼", "◀", "▶", "➜", "➤", "➔", "⇒", "⇔", "«", "»", "†", "‡", "§", "¶", "©", "®", "™", "∞", "≠", "≈", "±", "÷", "×", "√", "∑", "∆", "π", "Ω", "µ", "λ", "α", "β", "γ", "θ", "°", "‰", "№", "℮", "⌘", "⌥", "⇧", "⌫", "⏎", "☑", "☒", "☯", "☮", "⚛", "⚜", "⚕", "⚖", "⚔", "⚑", "⌁", "⌬"]
    },
    {
      id: "bangla",
      icon: "৳",
      label: "Bangla",
      labelBn: "বাংলা",
      items: ["৳", "০", "১", "২", "৩", "৪", "৫", "৬", "৭", "৮", "৯", "।", "॥", "ঁ", "ঃ", "৺", "৻", "ৎ", "‍", "★", "✦", "❖"]
    }
  ];
  (function mergeEmojiData() {
    var data = window.GHOST_EMOJI_DATA;
    if (!data || !data.length) return;
    var generatedIds = {};
    data.forEach(function(g) {
      generatedIds[g.id] = 1;
    });
    var curated = EMOJI_GROUPS.filter(function(g) {
      return !generatedIds[g.id];
    });
    var merged = curated.concat(data);
    EMOJI_GROUPS.length = 0;
    merged.forEach(function(g) {
      EMOJI_GROUPS.push(g);
    });
  })();
  /* Curated "Premium" set — hand-picked, high-impact glyphs editors reach for
     first in title cards, reactions and thumbnails. Kept as the default folder. */
  EMOJI_GROUPS.unshift({
    id: "premium",
    icon: "\u2728",
    label: "Premium",
    labelBn: "প্রিমিয়াম",
    items: ["\u2728", "\uD83D\uDD25", "\uD83D\uDCAB", "\u2B50", "\uD83C\uDF1F", "\uD83D\uDC8E", "\uD83D\uDC51", "\uD83C\uDFC6", "\uD83E\uDD47", "\uD83C\uDF96\uFE0F", "\uD83D\uDCAF", "\u26A1", "\uD83D\uDE80", "\uD83C\uDFAF", "\uD83D\uDD1D", "\uD83D\uDCC8", "\uD83D\uDCB0", "\uD83D\uDCB8", "\uD83E\uDD11", "\uD83D\uDECD\uFE0F", "\uD83C\uDF89", "\uD83C\uDF8A", "\uD83E\uDD73", "\uD83C\uDF88", "\uD83C\uDF81", "\u2764\uFE0F", "\uD83E\uDDE1", "\uD83D\uDC9C", "\uD83D\uDC99", "\uD83D\uDDA4", "\uD83E\uDD0D", "\uD83D\uDC96", "\uD83D\uDC95", "\uD83D\uDC98", "\uD83D\uDE0D", "\uD83E\uDD70", "\uD83E\uDD29", "\uD83D\uDE0E", "\uD83E\uDD2F", "\uD83D\uDE31", "\uD83D\uDE02", "\uD83E\uDD23", "\uD83D\uDE0F", "\uD83E\uDD14", "\uD83D\uDC40", "\uD83D\uDC4D", "\uD83D\uDC4E", "\uD83D\uDC4F", "\uD83D\uDE4C", "\uD83D\uDCAA", "\uD83E\uDD1D", "\uD83D\uDC4C", "\u270C\uFE0F", "\uD83E\uDD1F", "\uD83D\uDC4B", "\uD83D\uDD14", "\uD83D\uDCE3", "\uD83D\uDCA1", "\uD83D\uDD0D", "\uD83D\uDD12", "\uD83E\uDDE9", "\uD83C\uDFAC", "\uD83C\uDFA5", "\uD83C\uDFA8", "\uD83C\uDFB5", "\uD83C\uDFA7", "\uD83C\uDFA4", "\uD83D\uDCF1", "\uD83D\uDCBB", "\uD83D\uDDA5\uFE0F", "\uD83D\uDCF8", "\uD83D\uDCBE", "\uD83E\uDDE0", "\uD83E\uDD16", "\uD83D\uDEE1\uFE0F", "\u2705", "\u274C", "\u2757", "\u2753", "\u27A1\uFE0F", "\u2B06\uFE0F", "\u2B07\uFE0F", "\uD83D\uDD25", "\uD83C\uDF08", "\u2600\uFE0F", "\uD83C\uDF19", "\u26A0\uFE0F", "\u267B\uFE0F", "\uD83D\uDD34", "\uD83D\uDFE1", "\uD83D\uDFE2", "\uD83D\uDD35", "\uD83D\uDFE3", "\u26AB", "\u26AA"],
    names: ["sparkles", "fire", "dizzy", "star", "glowing star", "gem", "crown", "trophy", "gold medal", "medal", "hundred", "high voltage", "rocket", "target", "top", "chart up", "money bag", "money wings", "money face", "shopping", "party popper", "confetti", "partying face", "balloon", "gift", "red heart", "orange heart", "purple heart", "blue heart", "black heart", "white heart", "sparkling heart", "two hearts", "heart with arrow", "heart eyes", "smiling with hearts", "star struck", "cool", "mind blown", "screaming", "tears of joy", "rofl", "smirk", "thinking", "eyes", "thumbs up", "thumbs down", "clap", "raised hands", "muscle", "handshake", "ok hand", "victory", "love you", "wave", "bell", "megaphone", "bulb", "search", "lock", "puzzle", "clapper", "camera movie", "art", "music", "headphone", "mic", "phone", "laptop", "desktop", "camera", "floppy", "brain", "robot", "shield", "check", "cross", "exclamation", "question", "right arrow", "up arrow", "down arrow", "flame", "rainbow", "sun", "moon", "warning", "recycle", "red circle", "yellow circle", "green circle", "blue circle", "purple circle", "black circle", "white circle"]
  });
  var EMOJIS = (function() {
    var out = [], seen = {};
    for (var g = 0; g < EMOJI_GROUPS.length; g += 1) {
      var it = EMOJI_GROUPS[g].items;
      for (var i = 0; i < it.length; i += 1) {
        if (!seen[it[i]]) {
          seen[it[i]] = 1;
          out.push(it[i]);
        }
      }
    }
    return out;
  })();
  var EXPRESSIONS = [
    { name: "Bounce", desc: "Impact effect.", target: "Position", code: "amp=.12; freq=2.6; decay=5.0;\nn=0;\nif (numKeys>0){ n=nearestKey(time).index; if (key(n).time>time) n--; }\nif (n>0){ t=time-key(n).time; v=velocityAtTime(key(n).time-.001); value+v*amp*Math.sin(freq*t*2*Math.PI)/Math.exp(decay*t); } else value;" },
    { name: "Wiggle", desc: "Organic oscillation.", target: "Position", code: "wiggle(2,15);" },
    { name: "Rotation", desc: "Smooth rotation.", target: "Rotation", code: "time * 60;" },
    { name: "Pulse", desc: "Scaling heartbeat.", target: "Scale", code: "amp=8; freq=1;\nvalue + [amp,amp]*Math.sin(time*freq*2*Math.PI);" },
    { name: "Loop Out", target: "Position", code: 'loopOut("cycle");' },
    { name: "Auto Fade", target: "Opacity", code: "fadeIn=0.5; fadeOut=0.5;\nlinear(time, inPoint, inPoint+fadeIn, 0, 100) - linear(time, outPoint-fadeOut, outPoint, 0, 100);" },
    { name: "Pendulum Rotate", target: "Rotation", code: "amp=15; freq=1.2; decay=1.5;\namp*Math.sin(freq*time*2*Math.PI)/Math.exp(decay*time*0.2);" },
    { name: "Breathing Scale", target: "Scale", code: "amp=4; freq=0.8;\nvalue + amp*Math.sin(freq*time*2*Math.PI);" },
    { name: "Typewriter", target: "Text", code: 'speed=25;\ncursor="|";\nnumChars=Math.floor(time*speed);\ntext.sourceText.substr(0,numChars)+cursor;' },
    { name: "Counter $", target: "Text", code: 'val = effect("Slider Control")("Slider");\n"$" + val.toFixed(0).replace(/\\B(?=(\\d{3})+(?!\\d))/g, ",");' },
    { name: "Counter %", target: "Text", code: 'v = effect("Slider Control")("Slider");\nMath.round(v) + "%";' },
    { name: "Hacker Decrypt", target: "Text", code: 'chars="ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";\nsrc=text.sourceText;\nshown=Math.floor(time*18);\nres="";\nfor(i=0;i<src.length;i++){ res += (i<shown) ? src[i] : chars[Math.floor(random(0,chars.length))]; }\nres;' },
    { name: "Word Reveal", target: "Text", code: 'words = text.sourceText.split(" ");\ncount = Math.floor(time*3);\nwords.slice(0,count).join(" ");' },
    { name: "Random Flicker", target: "Opacity", code: "seedRandom(index,true);\nrandom(40,100);" }
  ];
  EXPRESSIONS.push.apply(EXPRESSIONS, [
    {
      "name": "Wiggle 2/10",
      "target": "Position",
      "code": "wiggle(2,10);"
    },
    {
      "name": "Wiggle 2/20",
      "target": "Position",
      "code": "wiggle(2,20);"
    },
    {
      "name": "Wiggle 3/30",
      "target": "Position",
      "code": "wiggle(3,30);"
    },
    {
      "name": "Wiggle 1/8",
      "target": "Position",
      "code": "wiggle(1,8);"
    },
    {
      "name": "Wiggle 5/40",
      "target": "Position",
      "code": "wiggle(5,40);"
    },
    {
      "name": "Wiggle 0.5/6",
      "target": "Position",
      "code": "wiggle(0.5,6);"
    },
    {
      "name": "Wiggle 4/60",
      "target": "Position",
      "code": "wiggle(4,60);"
    },
    {
      "name": "Wiggle 1.5/14",
      "target": "Position",
      "code": "wiggle(1.5,14);"
    },
    {
      "name": "Scale Wiggle 1/4",
      "target": "Scale",
      "code": "wiggle(1,4);"
    },
    {
      "name": "Scale Wiggle 2/8",
      "target": "Scale",
      "code": "wiggle(2,8);"
    },
    {
      "name": "Scale Wiggle 3/12",
      "target": "Scale",
      "code": "wiggle(3,12);"
    },
    {
      "name": "Scale Wiggle 0.5/3",
      "target": "Scale",
      "code": "wiggle(0.5,3);"
    },
    {
      "name": "Rotate Wiggle 1/5",
      "target": "Rotation",
      "code": "wiggle(1,5);"
    },
    {
      "name": "Rotate Wiggle 2/12",
      "target": "Rotation",
      "code": "wiggle(2,12);"
    },
    {
      "name": "Rotate Wiggle 4/25",
      "target": "Rotation",
      "code": "wiggle(4,25);"
    },
    {
      "name": "Loop Out cycle",
      "target": "Position",
      "code": 'loopOut("cycle");'
    },
    {
      "name": "Loop In cycle",
      "target": "Position",
      "code": 'loopIn("cycle");'
    },
    {
      "name": "Scale Loop cycle",
      "target": "Scale",
      "code": 'loopOut("cycle");'
    },
    {
      "name": "Rotate Loop cycle",
      "target": "Rotation",
      "code": 'loopOut("cycle");'
    },
    {
      "name": "Loop Out pingpong",
      "target": "Position",
      "code": 'loopOut("pingpong");'
    },
    {
      "name": "Loop In pingpong",
      "target": "Position",
      "code": 'loopIn("pingpong");'
    },
    {
      "name": "Scale Loop pingpong",
      "target": "Scale",
      "code": 'loopOut("pingpong");'
    },
    {
      "name": "Rotate Loop pingpong",
      "target": "Rotation",
      "code": 'loopOut("pingpong");'
    },
    {
      "name": "Loop Out offset",
      "target": "Position",
      "code": 'loopOut("offset");'
    },
    {
      "name": "Loop In offset",
      "target": "Position",
      "code": 'loopIn("offset");'
    },
    {
      "name": "Scale Loop offset",
      "target": "Scale",
      "code": 'loopOut("offset");'
    },
    {
      "name": "Rotate Loop offset",
      "target": "Rotation",
      "code": 'loopOut("offset");'
    },
    {
      "name": "Loop Out continue",
      "target": "Position",
      "code": 'loopOut("continue");'
    },
    {
      "name": "Loop In continue",
      "target": "Position",
      "code": 'loopIn("continue");'
    },
    {
      "name": "Scale Loop continue",
      "target": "Scale",
      "code": 'loopOut("continue");'
    },
    {
      "name": "Rotate Loop continue",
      "target": "Rotation",
      "code": 'loopOut("continue");'
    },
    {
      "name": "Auto Fade 0.2s/0.2s",
      "target": "Opacity",
      "code": "fi=0.2; fo=0.2;\nlinear(time, inPoint, inPoint+fi, 0, 100) - linear(time, outPoint-fo, outPoint, 0, 100);"
    },
    {
      "name": "Auto Fade 0.5s/0.5s",
      "target": "Opacity",
      "code": "fi=0.5; fo=0.5;\nlinear(time, inPoint, inPoint+fi, 0, 100) - linear(time, outPoint-fo, outPoint, 0, 100);"
    },
    {
      "name": "Auto Fade 1s/1s",
      "target": "Opacity",
      "code": "fi=1; fo=1;\nlinear(time, inPoint, inPoint+fi, 0, 100) - linear(time, outPoint-fo, outPoint, 0, 100);"
    },
    {
      "name": "Auto Fade 0.3s/1.2s",
      "target": "Opacity",
      "code": "fi=0.3; fo=1.2;\nlinear(time, inPoint, inPoint+fi, 0, 100) - linear(time, outPoint-fo, outPoint, 0, 100);"
    },
    {
      "name": "Bounce Key 0.08",
      "target": "Position",
      "code": "amp=0.08; freq=2; decay=4;\nn=0;\nif (numKeys>0){ n=nearestKey(time).index; if (key(n).time>time) n--; }\nif (n>0){ t=time-key(n).time; v=velocityAtTime(key(n).time-.001); value+v*amp*Math.sin(freq*t*2*Math.PI)/Math.exp(decay*t); } else value;"
    },
    {
      "name": "Bounce Key 0.12",
      "target": "Position",
      "code": "amp=0.12; freq=2.6; decay=5;\nn=0;\nif (numKeys>0){ n=nearestKey(time).index; if (key(n).time>time) n--; }\nif (n>0){ t=time-key(n).time; v=velocityAtTime(key(n).time-.001); value+v*amp*Math.sin(freq*t*2*Math.PI)/Math.exp(decay*t); } else value;"
    },
    {
      "name": "Bounce Key 0.2",
      "target": "Position",
      "code": "amp=0.2; freq=3.2; decay=6;\nn=0;\nif (numKeys>0){ n=nearestKey(time).index; if (key(n).time>time) n--; }\nif (n>0){ t=time-key(n).time; v=velocityAtTime(key(n).time-.001); value+v*amp*Math.sin(freq*t*2*Math.PI)/Math.exp(decay*t); } else value;"
    },
    {
      "name": "Bounce Key 0.3",
      "target": "Position",
      "code": "amp=0.3; freq=1.8; decay=3;\nn=0;\nif (numKeys>0){ n=nearestKey(time).index; if (key(n).time>time) n--; }\nif (n>0){ t=time-key(n).time; v=velocityAtTime(key(n).time-.001); value+v*amp*Math.sin(freq*t*2*Math.PI)/Math.exp(decay*t); } else value;"
    },
    {
      "name": "Breathe 3/0.8",
      "target": "Scale",
      "code": "amp=3; freq=0.8;\nvalue + amp*Math.sin(freq*time*2*Math.PI);"
    },
    {
      "name": "Breathe 6/1.2",
      "target": "Scale",
      "code": "amp=6; freq=1.2;\nvalue + amp*Math.sin(freq*time*2*Math.PI);"
    },
    {
      "name": "Breathe 10/0.5",
      "target": "Scale",
      "code": "amp=10; freq=0.5;\nvalue + amp*Math.sin(freq*time*2*Math.PI);"
    },
    {
      "name": "Breathe 2/2",
      "target": "Scale",
      "code": "amp=2; freq=2;\nvalue + amp*Math.sin(freq*time*2*Math.PI);"
    },
    {
      "name": "Pendulum 8deg",
      "target": "Rotation",
      "code": "amp=8; freq=1; decay=1.5;\namp*Math.sin(freq*time*2*Math.PI)/Math.exp(decay*time*0.2);"
    },
    {
      "name": "Pendulum 15deg",
      "target": "Rotation",
      "code": "amp=15; freq=1.2; decay=1.5;\namp*Math.sin(freq*time*2*Math.PI)/Math.exp(decay*time*0.2);"
    },
    {
      "name": "Pendulum 25deg",
      "target": "Rotation",
      "code": "amp=25; freq=0.6; decay=1.5;\namp*Math.sin(freq*time*2*Math.PI)/Math.exp(decay*time*0.2);"
    },
    {
      "name": "Spin 10/sec",
      "target": "Rotation",
      "code": "time*10;"
    },
    {
      "name": "Spin 30/sec",
      "target": "Rotation",
      "code": "time*30;"
    },
    {
      "name": "Spin 60/sec",
      "target": "Rotation",
      "code": "time*60;"
    },
    {
      "name": "Spin 120/sec",
      "target": "Rotation",
      "code": "time*120;"
    },
    {
      "name": "Spin 360/sec",
      "target": "Rotation",
      "code": "time*360;"
    },
    {
      "name": "Float Y 6px",
      "target": "Position",
      "code": "amp=6; freq=0.4;\n[value[0], value[1] + amp*Math.sin(freq*time*2*Math.PI)];"
    },
    {
      "name": "Float Y 20px",
      "target": "Position",
      "code": "amp=20; freq=0.7;\n[value[0], value[1] + amp*Math.sin(freq*time*2*Math.PI)];"
    },
    {
      "name": "Float Y 45px",
      "target": "Position",
      "code": "amp=45; freq=1;\n[value[0], value[1] + amp*Math.sin(freq*time*2*Math.PI)];"
    },
    {
      "name": "Float X 6px",
      "target": "Position",
      "code": "amp=6; freq=0.5;\n[value[0] + amp*Math.sin(freq*time*2*Math.PI), value[1]];"
    },
    {
      "name": "Float X 20px",
      "target": "Position",
      "code": "amp=20; freq=1;\n[value[0] + amp*Math.sin(freq*time*2*Math.PI), value[1]];"
    },
    {
      "name": "Float X 40px",
      "target": "Position",
      "code": "amp=40; freq=2;\n[value[0] + amp*Math.sin(freq*time*2*Math.PI), value[1]];"
    },
    {
      "name": "Shake 10",
      "target": "Position",
      "code": "seedRandom(index,true);\nwiggle(24,10);"
    },
    {
      "name": "Shake 25",
      "target": "Position",
      "code": "seedRandom(index,true);\nwiggle(24,25);"
    },
    {
      "name": "Shake 50",
      "target": "Position",
      "code": "seedRandom(index,true);\nwiggle(24,50);"
    },
    {
      "name": "Flicker 40-100",
      "target": "Opacity",
      "code": "seedRandom(index,true);\nrandom(40,100);"
    },
    {
      "name": "Flicker 0-100",
      "target": "Opacity",
      "code": "seedRandom(index,true);\nrandom(0,100);"
    },
    {
      "name": "Flicker 70-100",
      "target": "Opacity",
      "code": "seedRandom(index,true);\nrandom(70,100);"
    },
    {
      "name": "Typewriter 15cps",
      "target": "Text",
      "code": "speed=15;\nnumChars=Math.floor(time*speed);\ntext.sourceText.substr(0,numChars);"
    },
    {
      "name": "Typewriter 25cps",
      "target": "Text",
      "code": "speed=25;\nnumChars=Math.floor(time*speed);\ntext.sourceText.substr(0,numChars);"
    },
    {
      "name": "Typewriter 40cps",
      "target": "Text",
      "code": "speed=40;\nnumChars=Math.floor(time*speed);\ntext.sourceText.substr(0,numChars);"
    },
    {
      "name": "Typewriter 60cps",
      "target": "Text",
      "code": "speed=60;\nnumChars=Math.floor(time*speed);\ntext.sourceText.substr(0,numChars);"
    },
    {
      "name": "Typewriter Cursor 15",
      "target": "Text",
      "code": 'speed=15;\nn=Math.floor(time*speed);\ntext.sourceText.substr(0,n)+((Math.floor(time*4)%2)?"|":"");'
    },
    {
      "name": "Typewriter Cursor 30",
      "target": "Text",
      "code": 'speed=30;\nn=Math.floor(time*speed);\ntext.sourceText.substr(0,n)+((Math.floor(time*4)%2)?"|":"");'
    },
    {
      "name": "Word Reveal 2/sec",
      "target": "Text",
      "code": 'w = text.sourceText.split(" ");\nc = Math.floor(time*2);\nw.slice(0,c).join(" ");'
    },
    {
      "name": "Word Reveal 4/sec",
      "target": "Text",
      "code": 'w = text.sourceText.split(" ");\nc = Math.floor(time*4);\nw.slice(0,c).join(" ");'
    },
    {
      "name": "Word Reveal 6/sec",
      "target": "Text",
      "code": 'w = text.sourceText.split(" ");\nc = Math.floor(time*6);\nw.slice(0,c).join(" ");'
    },
    {
      "name": "Counter Integer",
      "target": "Text",
      "code": 'v = effect("Slider Control")("Slider");\nv.toFixed(0);'
    },
    {
      "name": "Counter 1 decimal",
      "target": "Text",
      "code": 'v = effect("Slider Control")("Slider");\nv.toFixed(1);'
    },
    {
      "name": "Counter 2 decimals",
      "target": "Text",
      "code": 'v = effect("Slider Control")("Slider");\nv.toFixed(2);'
    },
    {
      "name": "Counter Comma",
      "target": "Text",
      "code": 'v = effect("Slider Control")("Slider");\nv.toFixed(0).replace(/\\B(?=(\\d{3})+(?!\\d))/g, ",");'
    },
    {
      "name": "Counter Percent",
      "target": "Text",
      "code": 'v = effect("Slider Control")("Slider");\nMath.round(v) + "%";'
    },
    {
      "name": "Counter Taka",
      "target": "Text",
      "code": 'v = effect("Slider Control")("Slider");\n"৳ " + v.toFixed(0).replace(/\\B(?=(\\d{3})+(?!\\d))/g, ",");'
    },
    {
      "name": "Counter Dollar",
      "target": "Text",
      "code": 'v = effect("Slider Control")("Slider");\n"$" + v.toFixed(0).replace(/\\B(?=(\\d{3})+(?!\\d))/g, ",");'
    },
    {
      "name": "Counter K/M",
      "target": "Text",
      "code": 'v = effect("Slider Control")("Slider");\nv>=1000000 ? (v/1000000).toFixed(1)+"M" : v>=1000 ? (v/1000).toFixed(1)+"K" : Math.round(v)+"";'
    },
    {
      "name": "Timecode mm:ss",
      "target": "Text",
      "code": 't=Math.max(0,time);\nm=Math.floor(t/60); s=Math.floor(t%60);\n(m<10?"0":"")+m+":"+(s<10?"0":"")+s;'
    },
    {
      "name": "Countdown 10s",
      "target": "Text",
      "code": 't=Math.max(0, 10-(time-inPoint));\nMath.ceil(t)+"";'
    },
    {
      "name": "Uppercase Source",
      "target": "Text",
      "code": "text.sourceText.toUpperCase();"
    },
    {
      "name": "Layer Name Text",
      "target": "Text",
      "code": "thisLayer.name;"
    },
    {
      "name": "Comp Name Text",
      "target": "Text",
      "code": "thisComp.name;"
    },
    {
      "name": "Today Date",
      "target": "Text",
      "code": 'd = new Date();\nd.getDate()+"/"+(d.getMonth()+1)+"/"+d.getFullYear();'
    },
    {
      "name": "Hacker Decrypt",
      "target": "Text",
      "code": 'chars="ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%";\nsrc=text.sourceText;\nshown=Math.floor(time*18);\nres="";\nfor(i=0;i<src.length;i++){ res += (i<shown) ? src[i] : chars[Math.floor(random(0,chars.length))]; }\nres;'
    },
    {
      "name": "Bangla Digits",
      "target": "Text",
      "code": 'en="0123456789"; bn="০১২৩৪৫৬৭৮৯";\ns=text.sourceText; r="";\nfor(i=0;i<s.length;i++){ k=en.indexOf(s[i]); r += (k>-1)? bn[k] : s[i]; }\nr;'
    },
    {
      "name": "Inertia Smooth",
      "target": "Position",
      "code": "amp=0.05; freq=3; decay=6;\nn=0;\nif (numKeys>0){ n=nearestKey(time).index; if (key(n).time>time) n--; }\nif (n>0){ t=time-key(n).time; v=velocityAtTime(key(n).time-.001); value+v*amp*Math.sin(freq*t*2*Math.PI)/Math.exp(decay*t); } else value;"
    },
    {
      "name": "Inertia Heavy",
      "target": "Position",
      "code": "amp=0.25; freq=3; decay=3;\nn=0;\nif (numKeys>0){ n=nearestKey(time).index; if (key(n).time>time) n--; }\nif (n>0){ t=time-key(n).time; v=velocityAtTime(key(n).time-.001); value+v*amp*Math.sin(freq*t*2*Math.PI)/Math.exp(decay*t); } else value;"
    },
    {
      "name": "Smooth Position",
      "target": "Position",
      "code": "smooth(0.4, 8);"
    },
    {
      "name": "Smooth Scale",
      "target": "Scale",
      "code": "smooth(0.4, 8);"
    },
    {
      "name": "Smooth Rotation",
      "target": "Rotation",
      "code": "smooth(0.4, 8);"
    },
    {
      "name": "Time Remap Loop",
      "target": "Opacity",
      "code": 'loopOut("cycle");'
    },
    {
      "name": "Blink 2/sec",
      "target": "Opacity",
      "code": "(Math.floor(time*2)%2)*100;"
    },
    {
      "name": "Blink 5/sec",
      "target": "Opacity",
      "code": "(Math.floor(time*5)%2)*100;"
    },
    {
      "name": "Pulse Opacity",
      "target": "Opacity",
      "code": "50 + 50*Math.sin(time*2*Math.PI);"
    },
    {
      "name": "Fade On Screen",
      "target": "Opacity",
      "code": "linear(time, inPoint, inPoint+0.4, 0, 100);"
    },
    {
      "name": "Pop Scale In",
      "target": "Scale",
      "code": "s=linear(time, inPoint, inPoint+0.3, 0, 100);\n[s,s];"
    },
    {
      "name": "Elastic Scale In",
      "target": "Scale",
      "code": "t=time-inPoint;\nk = t<0 ? 0 : 100 - 100*Math.cos(t*14)/Math.exp(t*6);\n[k,k];"
    },
    {
      "name": "Random Position Grid",
      "target": "Position",
      "code": "seedRandom(index,true);\n[value[0]+random(-40,40), value[1]+random(-40,40)];"
    },
    {
      "name": "Stagger By Index",
      "target": "Position",
      "code": "d = index*0.06;\nt = time - d;\ny = value[1] + linear(t, inPoint, inPoint+0.5, 80, 0);\n[value[0], y];"
    },
    {
      "name": "Anchor To Centre",
      "target": "Position",
      "code": "[thisComp.width/2, thisComp.height/2];"
    },
    {
      "name": "Follow Mouse-less Null",
      "target": "Position",
      "code": 'try{ thisComp.layer("CONTROL").transform.position }catch(e){ value }'
    }
  ]);
  (function addDistinctExpressionPack() {
    var levels = ["Soft", "Light", "Medium", "Strong", "Extreme"];
    var families = [
      { name: "Orbit Position", target: "Position", desc: "Circular position orbit.", code: function(v2) {
        return "r=" + 12 * v2 + "; s=" + 0.25 * v2 + ";\\nvalue+[Math.cos(time*s*6.283)*r,Math.sin(time*s*6.283)*r];";
      } },
      { name: "Figure Eight", target: "Position", desc: "Figure-eight travel path.", code: function(v2) {
        return "r=" + 10 * v2 + "; s=" + 0.18 * v2 + ";\\nvalue+[Math.sin(time*s*6.283)*r,Math.sin(time*s*12.566)*r/2];";
      } },
      { name: "Horizontal Wave", target: "Position", desc: "Side-to-side movement.", code: function(v2) {
        return "a=" + 8 * v2 + "; f=" + 0.35 * v2 + ";\\nvalue+[Math.sin(time*f*6.283)*a,0];";
      } },
      { name: "Vertical Wave", target: "Position", desc: "Up-and-down movement.", code: function(v2) {
        return "a=" + 8 * v2 + "; f=" + 0.35 * v2 + ";\\nvalue+[0,Math.sin(time*f*6.283)*a];";
      } },
      { name: "Noise Drift", target: "Position", desc: "Slow organic drifting.", code: function(v2) {
        return "seedRandom(index,true);\\na=" + 4 * v2 + "; f=" + 0.12 * v2 + ";\\nvalue+[noise(time*f)*a,noise((time+10)*f)*a];";
      } },
      { name: "Breathing Scale", target: "Scale", desc: "Even scale breathing.", code: function(v2) {
        return "a=" + 1.5 * v2 + "; f=" + 0.3 * v2 + ";\\nvalue+[a,a]*Math.sin(time*f*6.283);";
      } },
      { name: "Scale Pop", target: "Scale", desc: "Quick repeating scale pop.", code: function(v2) {
        return "a=" + 2 * v2 + "; f=" + 0.6 * v2 + ";\\np=Math.pow(Math.max(0,Math.sin(time*f*6.283)),3)*a;\\nvalue+[p,p];";
      } },
      { name: "Scale Ping", target: "Scale", desc: "Sharp scale ping.", code: function(v2) {
        return "a=" + 2 * v2 + "; f=" + 0.45 * v2 + ";\\np=(Math.sin(time*f*6.283)+1)*a;\\nvalue+[p,p];";
      } },
      { name: "Vertical Scale Wave", target: "Scale", desc: "Height-only scale wave.", code: function(v2) {
        return "a=" + 2 * v2 + "; f=" + 0.4 * v2 + ";\\nvalue+[0,Math.sin(time*f*6.283)*a];";
      } },
      { name: "Constant Spin", target: "Rotation", desc: "Continuous rotation.", code: function(v2) {
        return "time*" + 12 * v2 + ";";
      } },
      { name: "Rotation Swing", target: "Rotation", desc: "Smooth swinging rotation.", code: function(v2) {
        return "a=" + 3 * v2 + "; f=" + 0.3 * v2 + ";\\nvalue+a*Math.sin(time*f*6.283);";
      } },
      { name: "Rotation Tick", target: "Rotation", desc: "Stepped clock-like rotation.", code: function(v2) {
        return "step=" + 3 * v2 + "; rate=" + v2 + ";\\nvalue+Math.floor(time*rate)*step;";
      } },
      { name: "Rotation Jitter", target: "Rotation", desc: "Organic rotation jitter.", code: function(v2) {
        return "seedRandom(Math.floor(time*" + v2 + "),true);\\nvalue+random(-" + 2 * v2 + "," + 2 * v2 + ");";
      } },
      { name: "Opacity Pulse", target: "Opacity", desc: "Smooth opacity pulse.", code: function(v2) {
        return "low=" + (50 - v2 * 5) + "; f=" + 0.25 * v2 + ";\\nlinear(Math.sin(time*f*6.283),-1,1,low,100);";
      } },
      { name: "Opacity Blink", target: "Opacity", desc: "Rhythmic hard blink.", code: function(v2) {
        return "f=" + 0.35 * v2 + ";\\nMath.sin(time*f*6.283)>0 ? 100 : " + 15 * v2 + ";";
      } },
      { name: "Opacity Flicker", target: "Opacity", desc: "Random held flicker.", code: function(v2) {
        return "seedRandom(Math.floor(time*" + 2 * v2 + "),true);\\nrandom(" + 20 * v2 + ",100);";
      } },
      { name: "Opacity Ramp", target: "Opacity", desc: "Repeating opacity ramp.", code: function(v2) {
        return "f=" + 0.2 * v2 + ";\\nlinear((time*f)%1,0,1," + 10 * v2 + ",100);";
      } },
      { name: "Timecode Text", target: "Text", desc: "Live composition timecode.", code: function(v2) {
        return "t=Math.max(0,time*" + v2 + ');\\nm=Math.floor(t/60); s=Math.floor(t%60);\\n(m<10?\\"0\\":\\"\\")+m+\\":\\"+(s<10?\\"0\\":\\"\\")+s;';
      } },
      { name: "Frame Counter", target: "Text", desc: "Live frame-number counter.", code: function(v2) {
        return "Math.floor(time/thisComp.frameDuration*" + v2 + ");";
      } },
      { name: "Text Reveal Random", target: "Text", desc: "Random-order text reveal.", code: function(v2) {
        return "seedRandom(index,true);\\nsrc=text.sourceText.toString(); n=Math.floor(time*" + 4 * v2 + ');\\nout=\\"\\"; for(i=0;i<src.length;i++){out+=(random()*src.length<n)?src[i]:\\" \\";} out;';
      } }
    ];
    var f, v;
    for (f = 0; f < families.length; f += 1) {
      for (v = 1; v <= 5; v += 1) {
        EXPRESSIONS.push({
          name: families[f].name + " — " + levels[v - 1],
          desc: families[f].desc,
          target: families[f].target,
          code: families[f].code(v)
        });
      }
    }
  })();
  function byId(id) {
    return document.getElementById(id);
  }
  function setStatus(text, cls) {
    if (!statusEl) return;
    statusEl.textContent = text;
    statusEl.className = "tools-status " + (cls || "");
  }
  function setInline(id, text, cls) {
    var el = byId(id);
    if (!el) return;
    el.textContent = text || "";
    el.className = "tool-inline-status " + (cls || "");
    el.hidden = !text;
  }
  function toast(text, cls) {
    if (!toastRegion) return;
    var node = document.createElement("div");
    node.className = "toast " + (cls || "");
    node.textContent = text;
    toastRegion.appendChild(node);
    setTimeout(function() {
      node.style.transition = "opacity .3s";
      node.style.opacity = "0";
      setTimeout(function() {
        if (node.parentNode) node.parentNode.removeChild(node);
      }, 300);
    }, 2400);
  }
  function evalScript(script) {
    return new Promise(function(resolve, reject) {
      if (!cs) return reject(new Error("CEP bridge unavailable"));
      try {
        cs.evalScript(script, function(result) {
          var raw = result == null ? "" : String(result);
          if (raw === "" || raw === "undefined" || raw === "null") {
            return reject(new Error("GHOST host script is not loaded — restart After Effects."));
          }
          if (raw.indexOf("EvalScript error") === 0) return reject(new Error(raw));
          try {
            resolve(JSON.parse(raw));
          } catch (e) {
            reject(new Error("Unexpected host reply: " + raw.slice(0, 160)));
          }
        });
      } catch (err) {
        reject(err);
      }
    });
  }
  var hostReloadPromise = null;
  function hostScriptPath() {
    if (!cs || !cs.getSystemPath) return "";
    try {
      var root = cs.getSystemPath("extension");
      return root ? String(root).replace(/\\/g, "/") + "/js/host.jsx" : "";
    } catch (e) {
      return "";
    }
  }
  function ensureHostScript() {
    var path = hostScriptPath();
    if (!path) return Promise.reject(new Error("Ghostae Text must be opened inside After Effects."));
    if (hostReloadPromise) return hostReloadPromise;
    var expected = window.GHOST_BUILD && window.GHOST_BUILD.version ? String(window.GHOST_BUILD.version) : "";
    hostReloadPromise = new Promise(function(resolve, reject) {
      var probe = 'typeof GhostHost !== "undefined" && GhostHost.toolkitHostBuild ? GhostHost.toolkitHostBuild() : "__GHOST_MISSING__"';
      cs.evalScript(probe, function(result) {
        var rawProbe = String(result == null ? "" : result);
        var usable = rawProbe !== "__GHOST_MISSING__" && rawProbe.indexOf("EvalScript error") !== 0;
        var stale = expected && usable && rawProbe.indexOf('"version":"' + expected + '"') === -1;
        if (usable && !stale) {
          hostReloadPromise = null;
          return resolve();
        }
        var load = '$.evalFile(new File("' + esc(path) + '")); typeof GhostHost !== "undefined" && GhostHost.toolkitHostBuild ? GhostHost.toolkitHostBuild() : "__GHOST_LOAD_FAILED__"';
        cs.evalScript(load, function(loaded) {
          hostReloadPromise = null;
          var raw = String(loaded == null ? "" : loaded);
          if (raw === "__GHOST_LOAD_FAILED__" || raw.indexOf("EvalScript error") === 0) {
            return reject(new Error("Ghostae Text host script could not load: " + raw));
          }
          if (expected && raw.indexOf('"version":"' + expected + '"') === -1) {
            return reject(new Error("Ghostae Text host build is incompatible with this panel."));
          }
          resolve();
        });
      });
    });
    return hostReloadPromise;
  }
  function esc(value) {
    return String(value).replace(/\\/g, "\\\\").replace(/"/g, '\\"');
  }
  function call(fn, args) {
    var parts = (args || []).map(function(a) {
      return '"' + esc(a) + '"';
    });
    var expression = "GhostHost." + fn + "(" + parts.join(",") + ")";
    return ensureHostScript().then(function() {
      return evalScript(expression);
    });
  }
  function reportResult(statusId, result, okText) {
    if (result && result.ok) {
      setInline(statusId, okText, "ok");
      toast(okText, "ok");
    } else {
      var message = result && result.error ? result.error : "Failed.";
      setInline(statusId, message, "error");
      toast(message, "error");
    }
  }
  var LANGUAGES = [
    {
      id: "en",
      flag: "🇺🇸",
      label: "English",
      word: "TEXT",
      words: ["MAKE", "IT", "POP"],
      phrases: ["MAKE IT POP", "BOLD MOVE", "GO BIG", "STAY SHARP", "NEW DROP", "PURE VIBE", "LOUD & CLEAR", "NEXT LEVEL", "SHINE ON", "HEADLINE", "STUDIO", "PRIME TIME"],
      font: "'SF Pro Display','Segoe UI',Inter,Arial,sans-serif"
    },
    {
      id: "bn",
      flag: "🇧🇩",
      label: "বাংলা",
      word: "বাংলা",
      words: ["দারুণ", "লেখা"],
      phrases: ["দারুণ লেখা", "নতুন শুরু", "সাহসী মন", "আলো ছড়াও", "স্বপ্ন বড়", "চলো এগিয়ে", "রঙিন দিন", "মন খুলে", "গল্প বলো", "শিরোনাম", "সেরা কাজ", "ভালোবাসা"],
      font: "'Li Ador Noirrit','Noto Sans Bengali','Nirmala UI','Vrinda',sans-serif"
    },
    {
      id: "hi",
      flag: "🇮🇳",
      label: "हिन्दी",
      word: "नमस्ते",
      words: ["शानदार", "लेख"],
      phrases: ["शानदार लेख", "नई शुरुआत", "बड़ा सोचो", "रोशनी फैलाओ", "कहानी कहो", "रंगीन दिन", "आगे बढ़ो", "दिल से", "सुर्खियाँ", "बेहतरीन", "चमक उठो", "सपने बड़े"],
      font: "'Noto Sans Devanagari','Nirmala UI','Mangal',sans-serif"
    },
    {
      id: "zh",
      flag: "🇨🇳",
      label: "中文",
      word: "文字",
      words: ["创作", "标题"],
      phrases: ["创意标题", "全新开始", "大胆一点", "光芒四射", "讲个故事", "多彩一天", "继续前行", "用心制作", "头条新闻", "精彩作品", "闪耀登场", "梦想更大"],
      font: "'Noto Sans SC','Microsoft YaHei','PingFang SC',sans-serif"
    },
    {
      id: "ar",
      flag: "🇸🇦",
      label: "العربية",
      word: "نص",
      words: ["اصنع", "رائعا"],
      phrases: ["نص رائع", "بداية جديدة", "فكر بجرأة", "انشر النور", "احك قصة", "يوم ملون", "إلى الأمام", "من القلب", "عنوان بارز", "عمل مميز", "تألق الآن", "حلم كبير"],
      font: "'Noto Naskh Arabic','Segoe UI',Tahoma,sans-serif",
      rtl: true
    },
    {
      id: "es",
      flag: "🇪🇸",
      label: "Español",
      word: "TEXTO",
      words: ["HAZLO", "BRILLAR"],
      phrases: ["HAZLO BRILLAR", "NUEVO INICIO", "PIENSA EN GRANDE", "PURA ENERGÍA", "CUENTA TU HISTORIA", "DÍA DE COLOR", "SIGUE ADELANTE", "HECHO CON AMOR", "TITULAR", "GRAN TRABAJO", "A ESCENA", "SUEÑA MÁS"],
      font: "'SF Pro Display','Segoe UI',Inter,Arial,sans-serif"
    },
    {
      id: "id",
      flag: "🇮🇩",
      label: "Indonesia",
      word: "TEKS",
      words: ["BUAT", "MENARIK"],
      phrases: ["BUAT MENARIK", "AWAL BARU", "BERANI BEDA", "SEBAR CAHAYA", "CERITAKAN", "HARI WARNA", "TERUS MAJU", "DARI HATI", "JUDUL UTAMA", "KARYA TERBAIK", "TAMPIL BEDA", "MIMPI BESAR"],
      font: "'SF Pro Display','Segoe UI',Inter,Arial,sans-serif"
    },
    {
      id: "pt",
      flag: "🇧🇷",
      label: "Português",
      word: "TEXTO",
      words: ["FAÇA", "BRILHAR"],
      phrases: ["FAÇA BRILHAR", "NOVO COMEÇO", "PENSE GRANDE", "ESPALHE LUZ", "CONTE A HISTÓRIA", "DIA COLORIDO", "SIGA EM FRENTE", "FEITO COM AMOR", "MANCHETE", "GRANDE OBRA", "ENTRE EM CENA", "SONHE MAIS"],
      font: "'SF Pro Display','Segoe UI',Inter,Arial,sans-serif"
    },
    {
      id: "ru",
      flag: "🇷🇺",
      label: "Русский",
      word: "ТЕКСТ",
      words: ["СДЕЛАЙ", "ЯРЧЕ"],
      phrases: ["СДЕЛАЙ ЯРЧЕ", "НОВЫЙ СТАРТ", "МЫСЛИ ШИРЕ", "ДАРИ СВЕТ", "РАССКАЖИ", "ЯРКИЙ ДЕНЬ", "ТОЛЬКО ВПЕРЁД", "ОТ ДУШИ", "ЗАГОЛОВОК", "ЛУЧШЕЕ", "СИЯЙ", "БОЛЬШАЯ МЕЧТА"],
      font: "'Noto Sans','Segoe UI',Arial,sans-serif"
    },
    {
      id: "ja",
      flag: "🇯🇵",
      label: "日本語",
      word: "テキスト",
      words: ["文字を", "飾る"],
      phrases: ["文字を飾る", "新しい始まり", "大胆にいこう", "光を放て", "物語を語る", "彩りの一日", "前へ進もう", "心を込めて", "見出し", "最高の作品", "輝く瞬間", "大きな夢"],
      font: "'Noto Sans JP','Yu Gothic','Hiragino Sans',sans-serif"
    }
  ];
  /* Animation names translated token-by-token so every preview card shows
     what it does in the language the user picked. Order of each array:
     bn, hi, zh, ar, es, id, pt, ru, ja — English is the dictionary key. */
  var ANIM_LANG_ORDER = ["bn", "hi", "zh", "ar", "es", "id", "pt", "ru", "ja"];
  var ANIM_WORDS = {
    "3d": ["থ্রিডি", "3D", "3D", "ثلاثي", "3D", "3D", "3D", "3D", "3D"],
    "blur": ["ব্লার", "धुंधला", "模糊", "ضباب", "Desenfoque", "Buram", "Desfoque", "Размытие", "ぼかし"],
    "bounce": ["বাউন্স", "उछाल", "弹跳", "ارتداد", "Rebote", "Pantul", "Salto", "Отскок", "バウンス"],
    "by": ["করে", "दर", "逐", "تلو", "por", "per", "por", "за", "ごと"],
    "cascade": ["ক্যাসকেড", "झरना", "层叠", "تتابع", "Cascada", "Kaskade", "Cascata", "Каскад", "カスケード"],
    "char": ["অক্ষর", "अक्षर", "字符", "حرف", "Letra", "Huruf", "Letra", "Символ", "文字"],
    "chars": ["অক্ষর", "अक्षर", "字符", "حروف", "Letras", "Huruf", "Letras", "Символы", "文字"],
    "letter": ["অক্ষর", "अक्षर", "字符", "حرف", "Letra", "Huruf", "Letra", "Символ", "文字"],
    "crop": ["ক্রপ", "क्रॉप", "裁切", "قص", "Recorte", "Potong", "Corte", "Кроп", "クロップ"],
    "down": ["নিচে", "नीचे", "向下", "لأسفل", "Abajo", "Bawah", "Baixo", "Вниз", "ダウン"],
    "drop": ["ড্রপ", "गिरना", "落下", "سقوط", "Caída", "Jatuh", "Queda", "Падение", "ドロップ"],
    "elastic": ["ইলাস্টিক", "लचीला", "弹性", "مرن", "Elástico", "Elastis", "Elástico", "Упругий", "エラスティック"],
    "exit": ["প্রস্থান", "निकास", "退出", "خروج", "Salida", "Keluar", "Saída", "Выход", "エグジット"],
    "expand": ["প্রসারণ", "विस्तार", "扩展", "توسيع", "Expandir", "Melebar", "Expandir", "Расширение", "エクスパンド"],
    "fade": ["ফেড", "फ़ेड", "淡化", "تلاشي", "Fundido", "Pudar", "Fusão", "Затухание", "フェード"],
    "flicker": ["ঝিলিক", "टिमटिमाहट", "闪烁", "وميض", "Parpadeo", "Kedip", "Cintilar", "Мерцание", "フリッカー"],
    "flip": ["ফ্লিপ", "पलट", "翻转", "قلب", "Giro", "Balik", "Virar", "Переворот", "フリップ"],
    "glitch": ["গ্লিচ", "ग्लिच", "故障", "خلل", "Glitch", "Glitch", "Glitch", "Глитч", "グリッチ"],
    "in": ["ইন", "इन", "进入", "دخول", "Entrada", "Masuk", "Entrada", "Вход", "イン"],
    "jelly": ["জেলি", "जेली", "果冻", "هلام", "Gelatina", "Jeli", "Gelatina", "Желе", "ゼリー"],
    "left": ["বামে", "बाएँ", "向左", "لليسار", "Izquierda", "Kiri", "Esquerda", "Влево", "レフト"],
    "line": ["লাইন", "पंक्ति", "行", "سطر", "Línea", "Baris", "Linha", "Строка", "ライン"],
    "neon": ["নিয়ন", "नियॉन", "霓虹", "نيون", "Neón", "Neon", "Néon", "Неон", "ネオン"],
    "out": ["আউট", "आउट", "退出", "خروج", "Salida", "Keluar", "Saída", "Выход", "アウト"],
    "overshoot": ["ওভারশুট", "ओवरशूट", "过冲", "تجاوز", "Sobrepaso", "Overshoot", "Excesso", "Перелёт", "オーバーシュート"],
    "pop": ["পপ", "पॉप", "弹出", "ظهور", "Pop", "Pop", "Pop", "Поп", "ポップ"],
    "premium": ["প্রিমিয়াম", "प्रीमियम", "高级", "مميز", "Premium", "Premium", "Premium", "Премиум", "プレミアム"],
    "pulse": ["পালস", "स्पंदन", "脉冲", "نبض", "Pulso", "Denyut", "Pulso", "Пульс", "パルス"],
    "random": ["এলোমেলো", "यादृच्छिक", "随机", "عشوائي", "Aleatorio", "Acak", "Aleatório", "Случайно", "ランダム"],
    "reveal": ["প্রকাশ", "प्रकट", "显现", "كشف", "Revelar", "Ungkap", "Revelar", "Проявление", "リビール"],
    "rgb": ["RGB", "RGB", "RGB", "RGB", "RGB", "RGB", "RGB", "RGB", "RGB"],
    "right": ["ডানে", "दाएँ", "向右", "لليمين", "Derecha", "Kanan", "Direita", "Вправо", "ライト"],
    "rise": ["উত্থান", "उठान", "上升", "صعود", "Ascenso", "Naik", "Subida", "Подъём", "ライズ"],
    "roll": ["রোল", "रोल", "滚动", "تدحرج", "Rodar", "Gulung", "Rolar", "Ролл", "ロール"],
    "rotate": ["ঘূর্ণন", "घुमाव", "旋转", "دوران", "Rotar", "Putar", "Rotação", "Поворот", "回転"],
    "rotation": ["ঘূর্ণন", "घुमाव", "旋转", "دوران", "Rotación", "Rotasi", "Rotação", "Вращение", "回転"],
    "scale": ["স্কেল", "स्केल", "缩放", "تحجيم", "Escala", "Skala", "Escala", "Масштаб", "スケール"],
    "shake": ["কাঁপুনি", "हिलना", "抖动", "اهتزاز", "Sacudida", "Getar", "Tremor", "Тряска", "シェイク"],
    "shift": ["শিফট", "शिफ्ट", "偏移", "إزاحة", "Desplazar", "Geser", "Deslocar", "Сдвиг", "シフト"],
    "sine": ["সাইন", "साइन", "正弦", "جيبي", "Seno", "Sinus", "Seno", "Синус", "サイン"],
    "skew": ["স্কিউ", "तिरछा", "倾斜", "إمالة", "Sesgo", "Miring", "Inclinar", "Наклон", "スキュー"],
    "slide": ["স্লাইড", "स्लाइड", "滑动", "انزلاق", "Deslizar", "Geser", "Deslizar", "Слайд", "スライド"],
    "smooth": ["মসৃণ", "चिकना", "平滑", "سلس", "Suave", "Halus", "Suave", "Плавно", "スムーズ"],
    "soft": ["নরম", "मुलायम", "柔和", "ناعم", "Suave", "Lembut", "Suave", "Мягкий", "ソフト"],
    "spin": ["স্পিন", "चक्कर", "旋转", "دوران", "Giro", "Berputar", "Giro", "Вращение", "スピン"],
    "squash": ["স্কোয়াশ", "दबाव", "压扁", "سحق", "Aplastar", "Pipih", "Achatar", "Сжатие", "スカッシュ"],
    "stagger": ["স্ট্যাগার", "क्रमिक", "错开", "تدرج", "Escalonado", "Bertahap", "Escalonado", "Каскадно", "ずらし"],
    "stretch": ["টান", "खिंचाव", "拉伸", "تمدد", "Estirar", "Regang", "Esticar", "Растяжение", "ストレッチ"],
    "style": ["স্টাইল", "शैली", "样式", "نمط", "Estilo", "Gaya", "Estilo", "Стиль", "スタイル"],
    "swing": ["দোলা", "झूला", "摆动", "تأرجح", "Balanceo", "Ayun", "Balanço", "Качание", "スイング"],
    "tracking": ["ট্র্যাকিং", "अक्षर-अंतर", "字距", "تباعد", "Interletra", "Spasi", "Espaçamento", "Трекинг", "トラッキング"],
    "typewriter": ["টাইপরাইটার", "टाइपराइटर", "打字机", "آلة كاتبة", "Máquina", "Mesin Ketik", "Máquina", "Печать", "タイプライター"],
    "up": ["উপরে", "ऊपर", "向上", "لأعلى", "Arriba", "Atas", "Cima", "Вверх", "アップ"],
    "vertical": ["উল্লম্ব", "लंबवत", "垂直", "عمودي", "Vertical", "Vertikal", "Vertical", "Вертикально", "バーティカル"],
    "wave": ["ঢেউ", "लहर", "波浪", "موجة", "Onda", "Gelombang", "Onda", "Волна", "ウェーブ"],
    "wipe": ["ওয়াইপ", "वाइप", "擦除", "مسح", "Barrido", "Sapu", "Varredura", "Вайп", "ワイプ"],
    "word": ["শব্দ", "शब्द", "单词", "كلمة", "Palabra", "Kata", "Palavra", "Слово", "単語"],
    "zoom": ["জুম", "ज़ूम", "缩放", "تكبير", "Zoom", "Zoom", "Zoom", "Зум", "ズーム"]
  };
  var lang = "en";
  /* v3.34.0 — the Style tab keeps its own preview language: changing the
     animation language must never touch the style grid, and vice versa. */
  var styleLang = "en";
  try {
    var storedLang = window.localStorage.getItem("ghost.previewLang");
    if (storedLang) lang = storedLang;
    var storedStyleLang = window.localStorage.getItem("ghost.styleLang");
    styleLang = storedStyleLang || lang;
  } catch (eLang) {
  }
  function langById(id) {
    for (var i = 0; i < LANGUAGES.length; i += 1) if (LANGUAGES[i].id === id) return LANGUAGES[i];
    return LANGUAGES[0];
  }
  function langInfo() {
    return langById(lang);
  }
  function styleLangInfo() {
    return langById(styleLang);
  }
  function localizedName(name) {
    var text = String(name || "");
    if (lang === "en") return text;
    var slot = ANIM_LANG_ORDER.indexOf(lang);
    if (slot === -1) return text;
    var parts = text.split(/\s+/);
    var out = [];
    for (var i = 0; i < parts.length; i += 1) {
      var raw = parts[i];
      var key = raw.toLowerCase().replace(/[^a-z0-9&]/g, "");
      var hit = ANIM_WORDS[key];
      out.push(hit && hit[slot] ? hit[slot] : raw);
    }
    return out.join(lang === "zh" || lang === "ja" ? "" : " ");
  }
  function phrase(index) {
    var info = langInfo();
    var list = info.phrases && info.phrases.length ? info.phrases : [info.word];
    return list[Math.abs(index || 0) % list.length];
  }
  function stylePhrase(index) {
    var info = styleLangInfo();
    var list = info.phrases && info.phrases.length ? info.phrases : [info.word];
    return list[Math.abs(index || 0) % list.length];
  }
  function sample() {
    var info = langInfo();
    return { word: info.word, words: info.words || [info.word], line: info.word };
  }
  function styleLabel(item) {
    var name = String(item && item.name || "");
    if (name.indexOf("—") !== -1) {
      var parts = name.split("—");
      var tail = parts[parts.length - 1].replace(/^\s+|\s+$/g, "");
      if (tail) return tail;
    }
    return name;
  }
  function pickColors(list, count) {
    var out = [];
    if (!list || !list.length) return out;
    if (list.length <= count) return list.slice(0);
    for (var i = 0; i < count; i += 1) {
      out.push(list[Math.round(i * (list.length - 1) / (count - 1))]);
    }
    return out;
  }
  function styleSpec(item) {
    var chars = item.chars && item.chars.length ? item.chars.slice(0) : null;
    var spec = {
      v: 2,
      name: styleLabel(item),
      tracking: item.overlap ? -30 : 0,
      fill: null,
      stroke: null,
      glow: null,
      shadow: null,
      extrude: null
    };
    if (chars && chars.length >= 2) {
      var stops = pickColors(chars, chars.length >= 3 ? 4 : 2);
      spec.fill = { type: stops.length >= 3 ? "ramp4" : "ramp", colors: stops, angle: 0 };
    } else if (chars && chars.length === 1) {
      spec.fill = { type: "solid", colors: [chars[0]] };
    } else {
      spec.fill = { type: "solid", colors: [item.solid || "#ffffff"] };
    }
    if (item.outline) spec.stroke = { color: item.outline, em: 0.05 };
    if (item.shadow) {
      spec.extrude = { color: item.shadow, steps: 3, stepEm: 0.03, angle: 135 };
    }
    if (item.glow) {
      spec.glow = {
        em: 0.12,
        intensity: 1,
        color: item.shadow || item.glowColor || (chars && chars[0]) || item.solid || "#ffffff"
      };
    }
    return spec;
  }
  var previewIdleObserver = null;
  function previewObserver() {
    if (previewIdleObserver !== null) return previewIdleObserver;
    if (typeof window.IntersectionObserver !== "function") {
      previewIdleObserver = false;
      return false;
    }
    previewIdleObserver = new window.IntersectionObserver(function(entries) {
      for (var i = 0; i < entries.length; i += 1) {
        var el = entries[i].target;
        if (entries[i].isIntersecting) el.classList.remove("tk-card-idle");
        else el.classList.add("tk-card-idle");
      }
    }, { rootMargin: "80px 0px" });
    return previewIdleObserver;
  }
  function watchPreview(card) {
    var obs = previewObserver();
    if (!obs) return;
    card.classList.add("tk-card-idle");
    try {
      obs.observe(card);
    } catch (e) {
    }
  }
  function voteBar(kind, name) {
    var bar = document.createElement("span");
    bar.className = "tk-vote";
    var stored = window.GhostCloud && window.GhostCloud.votes && window.GhostCloud.votes() || {};
    var mine = stored[kind + "::" + name];
    function button(choice, glyph, tip) {
      var b = document.createElement("button");
      b.type = "button";
      b.className = "tk-vote-btn tk-vote-" + choice;
      b.innerHTML = glyph;
      b.title = tip;
      b.setAttribute("aria-label", tip);
      if (mine && mine.vote === choice) b.classList.add("is-on");
      b.addEventListener("click", function(event) {
        event.stopPropagation();
        event.preventDefault();
        var siblings = bar.querySelectorAll(".tk-vote-btn");
        for (var i = 0; i < siblings.length; i++) siblings[i].classList.remove("is-on");
        b.classList.add("is-on");
        bar.classList.add("has-vote");
        bar.setAttribute("data-sent", "1");
        if (!window.GhostCloud || !window.GhostCloud.vote) return;
        window.GhostCloud.vote({ kind, name, vote: choice, panel: "ghost-toolkit" }).then(function() {
          bar.setAttribute("title", "Thanks — feedback sent.");
        }).catch(function() {
          bar.setAttribute("title", "Saved offline — will send later.");
        });
      });
      b.addEventListener("keydown", function(event) {
        event.stopPropagation();
      });
      return b;
    }
    var heroSvg = function(name, size) {
      if (window.GhostHero && window.GhostHero.has(name)) {
        return window.GhostHero.svg(name, "gi", 'width="' + size + '" height="' + size + '"');
      }
      return "";
    };
    var thumbsUpSvg = heroSvg("hand-thumb-up", 10);
    var thumbsDownSvg = heroSvg("hand-thumb-down", 10);
    bar.appendChild(button("up", thumbsUpSvg, lang === "bn" ? "কাজ করছে — like দিন" : "If working, give me a like"));
    var div = document.createElement("span");
    div.className = "tk-vote-divider";
    bar.appendChild(div);
    bar.appendChild(button("down", thumbsDownSvg, lang === "bn" ? "কাজ করছে না" : "Not working"));
    return bar;
  }
  var BM_KEY = "ghost.toolkit.bookmarks";
  var bookmarks = null;
  function bmLoad() {
    if (bookmarks) return bookmarks;
    bookmarks = {};
    try {
      var raw = window.localStorage.getItem(BM_KEY);
      var parsed = raw ? JSON.parse(raw) : null;
      if (parsed && typeof parsed === "object") bookmarks = parsed;
    } catch (e) {
      bookmarks = {};
    }
    return bookmarks;
  }
  function bmSave() {
    try {
      window.localStorage.setItem(BM_KEY, JSON.stringify(bmLoad()));
    } catch (e) {
    }
  }
  function bmHas(key) {
    return !!bmLoad()[key];
  }
  function bmToggle(key) {
    var map = bmLoad();
    if (map[key]) delete map[key];
    else map[key] = 1;
    bmSave();
    return !!map[key];
  }
  function bmCount() {
    var map = bmLoad(), n = 0, k;
    for (k in map) {
      if (Object.prototype.hasOwnProperty.call(map, k)) n += 1;
    }
    return n;
  }
  function bmStar(card, key) {
    var star = document.createElement("button");
    star.type = "button";
    star.className = "tk-bm-star";
    if (window.GhostHero && window.GhostHero.has("star")) {
      star.innerHTML = window.GhostHero.svg("star", "gi", 'width="9" height="9"');
    } else {
      star.textContent = "★";
    }
    star.title = lang === "bn" ? "Bookmark — shortcut হিসেবে রাখুন" : "Bookmark this preset";
    star.setAttribute("aria-label", star.title);
    var paint = function() {
      var on = bmHas(key);
      star.classList.toggle("is-on", on);
      card.classList.toggle("is-bookmarked", on);
      card.setAttribute("data-bookmarked", on ? "1" : "0");
    };
    paint();
    star.addEventListener("click", function(event) {
      event.stopPropagation();
      event.preventDefault();
      bmToggle(key);
      paint();
      if (typeof applyFilter === "function") applyFilter();
    });
    star.addEventListener("keydown", function(event) {
      event.stopPropagation();
    });
    card.appendChild(star);
  }
  function previewCard(labelText, badgeText, badgeClass, inner, opts) {
    var options = opts || {};
    var card = document.createElement("div");
    card.className = "tk-card" + (options.compact ? " tk-card-compact" : "");
    card.setAttribute("role", "button");
    card.setAttribute("tabindex", "0");
    card.title = labelText;
    card.setAttribute("data-search", String(labelText).toLowerCase());
    if (options.group) card.setAttribute("data-group", options.group);
    if (badgeText) {
      var badge = document.createElement("span");
      badge.className = "tk-card-badge " + (badgeClass || "");
      badge.textContent = badgeText;
      card.appendChild(badge);
    }
    card.appendChild(inner);
    if (!options.noLabel) {
      var label = document.createElement("span");
      label.className = "tk-card-label";
      label.textContent = labelText;
      card.appendChild(label);
    }
    /* v3.23.0 — the vote bar is ALWAYS a floating overlay. It used to sit
       inside .tk-card-label, which is pointer-events:none, so like/dislike
       could not be clicked at all. As an overlay it owns its own hit area. */
    if (options.voteKind) {
      var floating = voteBar(options.voteKind, labelText);
      floating.classList.add("tk-vote-float");
      if (floating.querySelector(".tk-vote-btn.is-on")) floating.classList.add("has-vote");
      card.appendChild(floating);
    }
    if (options.bookmark !== false) {
      bmStar(card, (options.voteKind || options.group || "preset") + "|" + labelText);
    }
    watchPreview(card);
    return card;
  }
  function activate(card, handler) {
    card.addEventListener("click", handler);
    card.addEventListener("keydown", function(event) {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        handler();
      }
    });
  }
  function animPreviewNode(animClass, text, color) {
    var span = document.createElement("span");
    span.className = "tk-preview-text " + animClass;
    span.textContent = text || sample().word;
    if (color) span.style.color = color;
    span.style.fontFamily = langInfo().font;
    if (langInfo().rtl) span.setAttribute("dir", "rtl");
    if (lang === "bn") span.classList.add("tk-bn");
    return span;
  }
  /* popDelay in host.jsx is 0.15s per unit — the preview uses the same
     number so the card and the applied layer stagger identically. */
  var TK_SEQ_DELAY = { word: 0.22, char: 0.15 };
  function seqPreviewNode(animClass, mode, tint, hue, text, delay) {
    var wrap = document.createElement("span");
    wrap.className = "tk-preview-text tk-seq" + (lang === "bn" ? " tk-bn" : "");
    wrap.style.fontFamily = langInfo().font;
    if (langInfo().rtl) wrap.setAttribute("dir", "rtl");
    if (tint) {
      wrap.classList.add(hue ? "tk-color-hue" : "tk-color-seq");
      wrap.style.setProperty("--tk-c1", tint);
    }
    var source = text || (mode === "word" ? sample().words.join(" ") : sample().word);
    var parts;
    if (mode === "word") {
      parts = String(source).split(/\s+/);
    } else {
      try {
        if (typeof Intl !== "undefined" && Intl.Segmenter) {
          parts = [];
          var iter = new Intl.Segmenter("en", { granularity: "grapheme" }).segment(String(source));
          for (var seg of iter) parts.push(seg.segment);
        } else {
          parts = Array.from(String(source));
        }
      } catch (e) {
        parts = Array.from(String(source));
      }
    }
    for (var i = 0; i < parts.length; i += 1) {
      var unit = document.createElement("span");
      unit.className = "tk-seq-unit " + animClass;
      unit.textContent = parts[i] === " " ? "\u00a0" : parts[i];
      var step = delay || TK_SEQ_DELAY[mode] || 0.15;
      unit.style.animationDelay = i * step + "s";
      if (mode === "word") unit.style.marginRight = "0.28em";
      wrap.appendChild(unit);
    }
    return wrap;
  }
  /* ── Perfect Presets (real .ffx animation pack) ─────────────────────
     Cards are built from <extension>/presets/animffx/<Name>/ — image + clip
     for the preview, the .ffx itself for the apply. Preview == result. */
  var animFfxAll = [], animFfxCat = "All", animFfxAuto = false, animFfxClips = [];
  /* Perfect Preset preview policy. Keep the number of simultaneously decoding
     videos small, but never destroy a preview's source just to save memory. */
  var FFX_PLAY_FRAMES = 20;
  var FFX_POSTPLAY_FRAMES = 5;
  var FFX_FALLBACK_FPS = 18;
  var FFX_RETRY_BASE_MS = 700;
  var FFX_RETRY_MAX_MS = 5000;
  var FFX_PLAYING_CLASS = "is-clip-on";
  function animFfxCard(preset) {
    var media = document.createElement("span");
    media.className = "tk-ffx-media";
    if (preset.preview || preset.previewUrl) {
      var shot = document.createElement("img");
      shot.className = "tk-ffx-card-shot";
      shot.alt = preset.name;
      shot.addEventListener("error", function() {
        /* Most bundled previews are PNGs. Older manifests incorrectly said
           JPG, so retry the sibling PNG once before giving up. */
        var current = String(shot.getAttribute("src") || "");
        if (!shot.getAttribute("data-ghost-preview-fallback")) {
          var alt = current.replace(/\.(jpe?g|webp)$/i, ".png");
          if (alt !== current) {
            shot.setAttribute("data-ghost-preview-fallback", "1");
            shot.src = alt;
            return;
          }
        }
        if (shot.parentNode) shot.parentNode.removeChild(shot);
      });
      shot.src = preset.previewUrl || ffxFileUrl(preset.preview);
      media.appendChild(shot);
    }
    var card = previewCard(preset.name, null, null, media, {
      voteKind: "ffx",
      group: "ffx"
    });
    card.classList.add("tk-ffx-card");
    card.title = preset.name + (preset.category ? " — " + preset.category : "");
    card.setAttribute("data-search", (preset.name + " " + (preset.category || "") + " ffx animation preset").toLowerCase());
    card.setAttribute("data-cat", preset.category || "Presets");
    var clipUrl = preset.videoUrl || (preset.video ? ffxFileUrl(preset.video) : "");
    if (clipUrl) card.setAttribute("data-clip", clipUrl);
    card.addEventListener("mouseenter", function() {
      /* Autoplay ON: the rotation governs playback, hover doesn't interfere.
         Autoplay OFF: the still image is the resting state, and hovering is
         what plays the one-shot preview. */
      if (animFfxAuto) return;
      ffxPlayCard(card, "hover");
    });
    card.addEventListener("mouseleave", function() {
      if (!animFfxAuto && !card.ghostManualPreview) ffxStopCard(card);
    });
    var cloud = window.GhostPresetCloud;
    if (cloud && cloud.has(preset.path)) card.classList.add("is-downloaded");
    activate(card, function() {
      restartCardPreview(card);
      var applyIt = function() {
        setInline("animFfxStatus", "Applying " + preset.name + "…", "");
        return call("toolkitApplyFFX", [preset.path, ""]).then(function(res) {
          reportResult("animFfxStatus", res, preset.name + " applied.");
        }).catch(function(err) {
          reportResult("animFfxStatus", { ok: false, error: err.message }, "");
        });
      };
      var cl = window.GhostPresetCloud;
      if (!cl) return applyIt();
      if (cl.has(preset.path)) { card.classList.add("is-downloaded"); return applyIt(); }
      card.classList.add("is-downloading");
      setInline("animFfxStatus", "Downloading " + preset.name + "…", "");
      cl.ensure(preset.path).then(function(out) {
        card.classList.remove("is-downloading");
        if (out && out.ok) {
          card.classList.add("is-downloaded");
          return applyIt();
        }
        var e = out && out.error;
        var msg = e === "limit_reached"
          ? "Free limit " + (out.limit || 10) + " reached — upgrade to Lifetime for all presets."
          : e === "no_license" ? "Activate your licence key first."
          : "Preset download failed (" + (e || "network") + ").";
        setInline("animFfxStatus", msg, "err");
      });
    });
    return card;

  }
  /* Lazy preview clips. The source is attached only when a card needs to
     play. A failed play never hides the still image, so a blocked/unsupported
     codec cannot turn the card black. */
  function ffxVisible(card) {
    if (!card || !card.isConnected) return false;
    if (document.hidden) return false;
    if (card.classList.contains("tk-hidden")) return false;
    if (card.closest && card.closest(".tk-hidden")) return false;
    var grid = byId("animFfxGrid");
    if (!grid || !grid.contains(card) || grid.classList.contains("tk-hidden")) return false;
    try {
      var cs = window.getComputedStyle(card);
      if (cs.display === "none" || cs.visibility === "hidden") return false;
    } catch (e) {}
    var r = card.getBoundingClientRect();
    var vh = window.innerHeight || 800;
    return r.width > 0 && r.height > 0 && r.bottom > 0 && r.top < vh;
  }
  function ffxPostPlayDelay(clip) {
    var fps = FFX_FALLBACK_FPS;
    try {
      var duration = Number(clip && clip.duration);
      if (isFinite(duration) && duration > 0) {
        var measured = FFX_PLAY_FRAMES / duration;
        if (isFinite(measured) && measured > 1 && measured < 120) fps = measured;
      }
    } catch (e) {}
    return Math.max(100, Math.round((FFX_POSTPLAY_FRAMES / fps) * 1000));
  }
  function ffxEnsureClip(card) {
    if (!card || card.ghostClipDead) return null;
    var clip = card.querySelector(".tk-ffx-card-clip");
    if (clip) return clip;
    var url = card.getAttribute("data-clip");
    if (!url) return null;
    var media = card.querySelector(".tk-ffx-media") || card;
    clip = document.createElement("video");
    clip.className = "tk-ffx-card-clip";
    clip.muted = true;
    clip.defaultMuted = true;
    clip.loop = false;
    clip.setAttribute("muted", "");
    clip.setAttribute("playsinline", "");
    clip.setAttribute("webkit-playsinline", "");
    clip.setAttribute("preload", "metadata");
    clip.setAttribute("data-ghost-preserve-media", "1");
    clip.addEventListener("loadeddata", function() { card.classList.add("is-clip-ready"); });
    clip.addEventListener("playing", function() {
      card.classList.add("is-clip-ready");
      card.classList.add(FFX_PLAYING_CLASS);
      if (window.GhostStability && window.GhostStability.registerMedia) window.GhostStability.registerMedia(clip);
    });
    clip.addEventListener("pause", function() {
      card.classList.remove(FFX_PLAYING_CLASS);
      if (window.GhostStability && window.GhostStability.forgetMedia) window.GhostStability.forgetMedia(clip);
    });
    clip.addEventListener("ended", function() {
      card.ghostPlayPending = null;
      if (animFfxAuto && card.getAttribute("data-ghost-autoplay") === "1" && ffxVisible(card)) {
        try { clip.currentTime = 0; } catch (e) {}
        ffxPlayCard(card, "autoplay");
        return;
      }
      card.classList.remove(FFX_PLAYING_CLASS, "is-clip-ready");
      card.ghostManualPreview = false;
    });
    clip.addEventListener("canplay", function() {
      if (animFfxAuto && card.getAttribute("data-ghost-autoplay") === "1" && ffxVisible(card) && clip.paused && !card.ghostPlayPending) {
        ffxPlayCard(card, "autoplay");
      }
    });
    clip.addEventListener("stalled", function() { card.ghostLastMediaEvent = Date.now(); });
    clip.addEventListener("waiting", function() { card.ghostLastMediaEvent = Date.now(); });
    clip.addEventListener("error", function() {
      card.ghostClipDead = true;
      card.ghostPlayPending = null;
      card.ghostManualPreview = false;
      card.classList.remove(FFX_PLAYING_CLASS, "is-clip-ready");
      if (window.GhostStability && window.GhostStability.forgetMedia) window.GhostStability.forgetMedia(clip);
      if (clip.parentNode) clip.parentNode.removeChild(clip);
    });
    clip.src = url;
    media.appendChild(clip);
    animFfxClips.push(clip);
    if (window.GhostStability && window.GhostStability.registerMedia) window.GhostStability.registerMedia(clip);
    return clip;
  }
  function ffxPlayingCards() {
    var grid = byId("animFfxGrid"), out = [];
    if (!grid) return out;
    var cards = grid.querySelectorAll(".tk-ffx-card.is-clip-on");
    for (var i = 0; i < cards.length; i += 1) out.push(cards[i]);
    return out;
  }
  function ffxStopCard(card) {
    if (!card) return;
    /* Invalidate any in-flight play() promise. CEP can resolve play() after a
       stop, and without a generation token that stale promise can turn the
       card back on and create the visible stop/start flicker. */
    card.ghostPlayGeneration = (card.ghostPlayGeneration || 0) + 1;
    card.ghostPlayPending = false;
    card.removeAttribute("data-ghost-autoplay");
    if (card.ghostPreviewTimer) {
      window.clearTimeout(card.ghostPreviewTimer);
      card.ghostPreviewTimer = null;
    }
    if (card.ghostRetryTimer) {
      window.clearTimeout(card.ghostRetryTimer);
      card.ghostRetryTimer = null;
    }
    card.ghostPreviewHoldUntil = 0;
    card.ghostManualPreview = false;
    card.ghostRetryCount = 0;
    card.ghostRetryAt = 0;
    card.classList.remove(FFX_PLAYING_CLASS, "is-clip-ready");
    var clip = card.querySelector(".tk-ffx-card-clip");
    if (!clip) return;
    try { clip.loop = false; clip.pause(); clip.currentTime = 0; } catch (e) {}
    if (window.GhostStability && window.GhostStability.forgetMedia) window.GhostStability.forgetMedia(clip);
  }
  function ffxScheduleRetry(card) {
    if (!card || !animFfxAuto || card.getAttribute("data-ghost-autoplay") !== "1") return;
    card.ghostRetryCount = Math.min((card.ghostRetryCount || 0) + 1, 6);
    var delay = Math.min(FFX_RETRY_MAX_MS, FFX_RETRY_BASE_MS * Math.pow(2, card.ghostRetryCount - 1));
    card.ghostRetryAt = Date.now() + delay;
    if (card.ghostRetryTimer) window.clearTimeout(card.ghostRetryTimer);
    card.ghostRetryTimer = window.setTimeout(function() {
      card.ghostRetryTimer = null;
      if (animFfxAuto && card.getAttribute("data-ghost-autoplay") === "1" && ffxVisible(card)) ffxPlayCard(card, "autoplay");
    }, delay);
  }
  function ffxPlayCard(card, reason) {
    var clip = ffxEnsureClip(card);
    if (!clip) return Promise.resolve(false);
    /* Autoplay previews are continuous loops. Manual/hover previews remain
       one-shot. This removes the end → delay → replay gap that made cards
       appear to stop/start repeatedly. */
    clip.loop = reason === "autoplay";
    /* Never stack play() calls while one is still resolving. The 1.5s
       watchdog otherwise races slow CEP media startup and can restart the same
       clip repeatedly. */
    if (card.ghostPlayPending) return card.ghostPlayPending;
    var generation = (card.ghostPlayGeneration || 0) + 1;
    card.ghostPlayGeneration = generation;
    if (reason === "click" || reason === "manual") {
      card.ghostManualPreview = true;
      card.ghostPreviewHoldUntil = 0;
      if (card.ghostPreviewTimer) {
        window.clearTimeout(card.ghostPreviewTimer);
        card.ghostPreviewTimer = null;
      }
    }
    if (clip.readyState >= 1 && (clip.paused || reason !== "autoplay")) {
      try { clip.currentTime = 0; } catch (eSeek) {}
    }
    try { clip.muted = true; clip.defaultMuted = true; } catch (eMute) {}
    var p;
    try { p = clip.play(); }
    catch (ePlay) {
      card.ghostManualPreview = false;
      card.classList.remove(FFX_PLAYING_CLASS);
      return Promise.resolve(false);
    }
    var onSuccess = function() {
      if (card.ghostPlayGeneration !== generation) return false;
      if (animFfxAuto && card.getAttribute("data-ghost-autoplay") !== "1") return false;
      card.classList.add("is-clip-ready");
      card.classList.add(FFX_PLAYING_CLASS);
      card.ghostRetryCount = 0;
      card.ghostRetryAt = 0;
      return true;
    };
    if (p && typeof p.then === "function") {
      var pending = p.then(onSuccess).catch(function() {
        if (card.ghostPlayGeneration === generation) {
          card.ghostManualPreview = false;
          card.classList.remove(FFX_PLAYING_CLASS);
          if (reason === "autoplay") ffxScheduleRetry(card);
        }
        if (window.GhostStability && window.GhostStability.forgetMedia) window.GhostStability.forgetMedia(clip);
        return false;
      });
      card.ghostPlayPending = pending;
      pending.then(function() {
        if (card.ghostPlayGeneration === generation) card.ghostPlayPending = null;
      });
      return pending;
    }
    if (card.ghostPlayGeneration !== generation) return Promise.resolve(false);
    card.classList.add(FFX_PLAYING_CLASS);
    return Promise.resolve(true);
  }
  function ffxCardDistance(card) {
    var r = card.getBoundingClientRect();
    var vh = window.innerHeight || 800;
    var center = (r.top + r.bottom) / 2;
    return Math.abs(center - vh / 2);
  }
  function ffxSyncAutoplay() {
    var grid = byId("animFfxGrid");
    if (!grid) return;
    var all = grid.querySelectorAll(".tk-ffx-card"), wanted = [];
    for (var i = 0; i < all.length; i += 1) {
      var card = all[i];
      if (animFfxAuto && ffxVisible(card)) wanted.push(card);
    }
    for (var j = 0; j < all.length; j += 1) {
      var item = all[j];
      if (wanted.indexOf(item) !== -1) {
        item.setAttribute("data-ghost-autoplay", "1");
        if (item.ghostRetryAt && Date.now() < item.ghostRetryAt) continue;
        var clip = item.querySelector(".tk-ffx-card-clip");
        if (!clip || (!clip.paused && !item.ghostPlayPending)) {
          if (clip && !clip.paused) item.classList.add(FFX_PLAYING_CLASS);
          continue;
        }
        if (!item.ghostPlayPending) ffxPlayCard(item, "autoplay");
      } else {
        ffxStopCard(item);
      }
    }
  }
  var ffxScrollTimer = null;
  function ffxWatchScroll() {
    if (ffxWatchScroll.bound) return;
    ffxWatchScroll.bound = true;
    var handler = function() {
      if (!animFfxAuto || ffxScrollTimer) return;
      ffxScrollTimer = window.setTimeout(function() { ffxScrollTimer = null; ffxSyncAutoplay(); }, 180);
    };
    window.addEventListener("scroll", handler, true);
    window.addEventListener("resize", handler);
  }
  /* Scroll/resize and each clip's own "ended" event are what normally
     drive ffxSyncAutoplay(). That leaves a gap: if a clip's play()
     promise is silently rejected (a stalled file load, a stability
     eviction, a CEP quirk on first paint) it never fires "ended" and
     never resyncs, so the card just sits dark until the user happens to
     scroll. A slow watchdog closes that gap by re-checking on a timer
     instead of relying only on those triggers. */
  var ffxWatchdogTimer = null;
  var ffxWatchdogTick = null;
  function ffxStartWatchdog() {
    if (ffxWatchdogTimer || !animFfxAuto) return;
    ffxWatchdogTick = function () {
      ffxWatchdogTimer = null;
      if (!animFfxAuto || (window.GhostIdle && window.GhostIdle.isSuspended && window.GhostIdle.isSuspended())) return;
      ffxSyncAutoplay();
      ffxWatchdogTimer = window.setTimeout(ffxWatchdogTick, 1500);
    };
    ffxWatchdogTimer = window.setTimeout(ffxWatchdogTick, 1500);
  }
  function ffxStopWatchdog() {
    if (ffxWatchdogTimer) window.clearTimeout(ffxWatchdogTimer);
    ffxWatchdogTimer = null;
    ffxWatchdogTick = null;
  }
  /* Visibility changes can make CEP pause media without emitting the same
     sequence of events as a normal user pause. Resync immediately on return
     instead of waiting for the 1.5s watchdog tick. */
  var ffxVisibilityBound = false;
  if (!ffxVisibilityBound) {
    ffxVisibilityBound = true;
    document.addEventListener("visibilitychange", function() {
      if (animFfxAuto && !document.hidden) window.setTimeout(ffxSyncAutoplay, 50);
    });
    document.addEventListener("ghost:resume", function() {
      if (animFfxAuto) window.setTimeout(ffxSyncAutoplay, 50);
    });
  }
  /* ── preview autoplay controller ────────────────────────────────────
     One play/pause button per section (Perfect Presets, Web Presets).
     Each section remembers its own state. While a section is paused,
     hovering a card replays just that card from the start. */
  var AUTOPLAY_KEYS = { ffx: "ghost.toolkit.autoplay.ffx", web: "ghost.toolkit.autoplay.web" };
  var animWebAuto = false;
  function autoplayRead(section, fallback) {
    try {
      var raw = window.localStorage.getItem(AUTOPLAY_KEYS[section]);
      return raw == null ? fallback : raw === "1";
    } catch (e) { return fallback; }
  }
  function autoplayWrite(section, on) {
    try { window.localStorage.setItem(AUTOPLAY_KEYS[section], on ? "1" : "0"); } catch (e) {}
  }
  function syncPlayButton(id, on, label) {
    var btn = byId(id);
    if (!btn) return;
    var text = (on ? "Pause " : "Play ") + label + " previews";
    btn.setAttribute("aria-pressed", on ? "true" : "false");
    btn.title = text;
    btn.setAttribute("aria-label", text);
  }
  var MANUAL_PREVIEW_MS = 5200;
  function restartCardPreview(card) {
    if (!card) return;
    /* Explicit preview must work with autoplay OFF, parked cards, and
       keyboard activation — not only while the pointer happens to hover. */
    if (card.getAttribute && card.getAttribute("data-clip")) {
      ffxPlayCard(card, "click");
      return;
    }
    if (card.ghostManualPreviewTimer) {
      window.clearTimeout(card.ghostManualPreviewTimer);
      card.ghostManualPreviewTimer = null;
    }
    card.classList.remove("tk-manual-preview");
    card.classList.add("tk-anim-restart");
    void card.offsetWidth;
    card.classList.remove("tk-anim-restart");
    void card.offsetWidth;
    card.classList.add("tk-manual-preview");
    card.ghostManualPreviewTimer = window.setTimeout(function() {
      card.ghostManualPreviewTimer = null;
      card.classList.remove("tk-manual-preview");
    }, MANUAL_PREVIEW_MS);
  }
  function wireHoverReplay(grid) {
    if (!grid || grid.getAttribute("data-hover-replay")) return;
    grid.setAttribute("data-hover-replay", "1");
    grid.addEventListener("mouseover", function(event) {
      if (grid.classList.contains("is-autoplay")) return;
      var card = event.target && event.target.closest ? event.target.closest(".tk-card") : null;
      if (!card || card === event.relatedTarget) return;
      if (event.relatedTarget && card.contains(event.relatedTarget)) return;
      if (card.classList.contains("tk-ffx-card")) return;
      restartCardPreview(card);
    });
  }
  function animFfxSetAuto(on, persist) {
    animFfxAuto = !!on;
    var grid = byId("animFfxGrid");
    if (grid) {
      grid.classList.toggle("is-autoplay", animFfxAuto);
      grid.classList.toggle("is-paused", !animFfxAuto);
      wireHoverReplay(grid);
    }
    ffxWatchScroll();
    ffxSyncAutoplay();
    if (animFfxAuto) ffxStartWatchdog(); else ffxStopWatchdog();
    syncPlayButton("animFfxPlayBtn", animFfxAuto, "Perfect Preset");
    if (persist !== false) autoplayWrite("ffx", animFfxAuto);
  }
  function animWebSetAuto(on, persist) {
    animWebAuto = !!on;
    var grid = byId("animGrid");
    if (grid) {
      grid.classList.toggle("is-autoplay", animWebAuto);
      grid.classList.toggle("is-paused", !animWebAuto);
      grid.classList.toggle("tk-anim-paused", !animWebAuto);
      wireHoverReplay(grid);
    }
    syncPlayButton("animWebPlayBtn", animWebAuto, "Web Preset");
    if (persist !== false) autoplayWrite("web", animWebAuto);
  }
  function bindSectionPlayButtons() {
    if (document.body) document.body.classList.remove("disable-auto-animate");
    var ffxBtn = byId("animFfxPlayBtn");
    if (ffxBtn && !ffxBtn.getAttribute("data-bound")) {
      ffxBtn.setAttribute("data-bound", "1");
      ffxBtn.addEventListener("click", function() { animFfxSetAuto(!animFfxAuto); });
      /* Autoplay is enabled by default for Perfect Presets. An explicit
         user choice in localStorage still wins. */
      animFfxSetAuto(autoplayRead("ffx", true), false);
    }
    var webBtn = byId("animWebPlayBtn");
    if (webBtn && !webBtn.getAttribute("data-bound")) {
      webBtn.setAttribute("data-bound", "1");
      webBtn.addEventListener("click", function() { animWebSetAuto(!animWebAuto); });
      animWebSetAuto(autoplayRead("web", true), false);
    }
    wireHoverReplay(byId("animFfxGrid"));
    wireHoverReplay(byId("animGrid"));
  }
  window.GhostToolkitAutoplay = {
    set: function(on) { animFfxSetAuto(!!on); animWebSetAuto(!!on); },
    setFfx: function(on) { animFfxSetAuto(!!on); },
    setWeb: function(on) { animWebSetAuto(!!on); },
    get: function() { return { ffx: animFfxAuto, web: animWebAuto }; }
  };
  function animFfxPaint() {
    var grid = byId("animFfxGrid");
    var empty = byId("animFfxEmpty");
    if (!grid) return;
    animFfxClips = [];
    var frag = document.createDocumentFragment(), shown = 0;
    animFfxAll.forEach(function(preset) {
      if (animFfxCat !== "All" && (preset.category || "Presets") !== animFfxCat) return;
      frag.appendChild(animFfxCard(preset));
      shown += 1;
    });
    /* Dispose old preview media before replacing the grid. This invalidates
       stale play() promises and prevents detached videos from surviving a
       category/filter rebuild. */
    var oldCards = grid.querySelectorAll(".tk-ffx-card");
    for (var oi = 0; oi < oldCards.length; oi += 1) ffxStopCard(oldCards[oi]);
    grid.innerHTML = "";
    grid.appendChild(frag);
    if (empty) empty.hidden = shown > 0;
    var label = byId("animFfxCatLabel");
    if (label) label.textContent = animFfxCat;
    bindSectionPlayButtons();
    animFfxSetAuto(animFfxAuto, false);
    if (typeof applyFilter === "function") applyFilter();
  }
  function animFfxBuildMenu() {
    var btn = byId("animFfxCatBtn"), menu = byId("animFfxCatMenu");
    if (!btn || !menu) return;
    var cats = ["All"], seen = {};
    animFfxAll.forEach(function(preset) {
      var c = preset.category || "Presets";
      if (!seen[c]) { seen[c] = 1; cats.push(c); }
    });
    menu.innerHTML = "";
    cats.forEach(function(cat) {
      var item = document.createElement("button");
      item.type = "button";
      item.className = "tk-catmenu-item" + (cat === animFfxCat ? " active" : "");
      item.setAttribute("role", "menuitem");
      item.textContent = cat;
      item.addEventListener("click", function() {
        animFfxCat = cat;
        menu.hidden = true;
        btn.setAttribute("aria-expanded", "false");
        animFfxBuildMenu();
        animFfxPaint();
      });
      menu.appendChild(item);
    });
    if (!btn.getAttribute("data-bound")) {
      btn.setAttribute("data-bound", "1");
      btn.addEventListener("click", function() {
        menu.hidden = !menu.hidden;
        btn.setAttribute("aria-expanded", menu.hidden ? "false" : "true");
      });
      document.addEventListener("click", function(event) {
        if (menu.hidden) return;
        if (btn.contains(event.target) || menu.contains(event.target)) return;
        menu.hidden = true;
        btn.setAttribute("aria-expanded", "false");
      });
    }
  }
  /* Manifest fallback: read presets/animffx/pack.json straight from the panel
     folder. Works even when the host folder scan comes back empty (path or
     permission quirks in some AE installs). Files are <Folder>/<Folder>.ext. */
  function animFfxFromPack() {
    if (window.GHOST_BUNDLED_ANIM_CATALOG && Array.isArray(window.GHOST_BUNDLED_ANIM_CATALOG)) {
      var embeddedRoot = extensionRoot();
      return Promise.resolve(window.GHOST_BUNDLED_ANIM_CATALOG.map(function(entry) {
        var folder = String(entry.folder || entry.name || "");
        var dir = "presets/animffx/" + folder + "/" + folder;
        return {name:entry.name||folder,category:entry.category||"Presets",path:(embeddedRoot?embeddedRoot+"/":"")+dir+".ffx",preview:embeddedRoot?embeddedRoot+"/"+dir+".png":null,previewUrl:embeddedRoot?null:encodeURI(dir+".png"),video:embeddedRoot?embeddedRoot+"/"+dir+".mp4":null,videoUrl:embeddedRoot?null:encodeURI(dir+".mp4"),perfect:true,kind:"ffx"};
      }));
    }
    return fetchText("presets/animffx/pack.json").then(function(text) {
      if (!text) return [];
      var data;
      try { data = JSON.parse(text); } catch (eJson) { return []; }
      var list = data && data.presets ? data.presets : [];
      var root = extensionRoot();
      var out = [];
      for (var i = 0; i < list.length; i += 1) {
        var entry = list[i];
        if (!entry || !entry.folder) continue;
        var dir = "presets/animffx/" + entry.folder + "/" + entry.folder;
        out.push({
          name: entry.name || entry.folder,
          category: entry.category || "Presets",
          path: (root ? root + "/" : "") + dir + ".ffx",
          preview: root ? root + "/" + dir + ".png" : null,
          previewUrl: root ? null : encodeURI(dir + ".png"),
          video: root ? root + "/" + dir + ".mp4" : null,
          videoUrl: root ? null : encodeURI(dir + ".mp4"),
          perfect: true,
          kind: "ffx"
        });
      }
      return out;
    }).catch(function() { return []; });
  }
  function renderFfxAnim() {
    var grid = byId("animFfxGrid");
    if (!grid) return;
    function mergeCatalog(hostList, fallbackList) {
      var out = [], seen = {};
      (hostList || []).concat(fallbackList || []).forEach(function(item) {
        if (!item || !item.name) return;
        var key = String(item.name).toLowerCase();
        if (seen[key]) return;
        seen[key] = true;
        out.push(item);
      });
      return out;
    }
    function paint(list) { animFfxAll = list || []; animFfxBuildMenu(); animFfxPaint(); }
    animFfxFromPack().then(function(fallbackList) {
      paint(fallbackList);
      call("toolkitListAnimFfx", [extensionRoot()]).then(function(res) {
        var hostList = res && res.ok && res.presets ? res.presets : [];
        var merged = mergeCatalog(hostList, fallbackList);
        if (merged.length) paint(merged);
      }).catch(function() {});
    }).catch(function() {
      call("toolkitListAnimFfx", [extensionRoot()]).then(function(res) {
        paint(res && res.ok && res.presets ? res.presets : []);
      }).catch(function() { paint([]); });
    });
  }
  function renderFfxColor(installed) {
    var grid = byId("ffxColorGrid");
    if (!grid) return;
    grid.innerHTML = "";
    FFX_COLOR.forEach(function(item) {
      var has = installed.indexOf(item.file) !== -1;
      var node = animPreviewNode("", "GHOST", item.color);
      node.style.textShadow = "0 0 10px " + item.color;
      var card = previewCard(item.label, has ? "FFX" : "FFX*", has ? "" : "missing", node);
      activate(card, function() {
        setInline("ffxColorStatus", "Applying " + item.label + "…", "");
        call("toolkitApplyFFX", [item.file, ""]).then(function(res) {
          if (res && res.ok) return reportResult("ffxColorStatus", res, item.label + " applied.");
          return call("toolkitApplyColor", [item.fallback]).then(function(fb) {
            reportResult("ffxColorStatus", fb, item.label + " applied (built-in look).");
          });
        }).catch(function(err) {
          reportResult("ffxColorStatus", { ok: false, error: err.message }, "");
        });
      });
      grid.appendChild(card);
    });
  }
  var TK_DEFAULT_DURATION = 1;
  function currentDuration() {
    var slider = byId("animDuration");
    return slider ? parseInt(slider.value, 10) / 10 : TK_DEFAULT_DURATION;
  }
  /* v3.23.0 — the per-card .ffx download button was removed on request.
     Duration is fixed at 1.0s now that the bottom timing slider is gone. */
  function renderAnimations() {
    var grid = byId("animGrid");
    if (!grid) return;
    var frag = document.createDocumentFragment();
    ANIMATIONS.forEach(function(item) {
      var caption = localizedName(item.name);
      var node = item.seq
        ? seqPreviewNode(item.anim, item.seq, item.tint, item.hue, caption, item.delay)
        : animPreviewNode(item.anim, caption, item.tint);
      node.classList.add("tk-preview-name");
      if (caption.length > 12) node.classList.add("tk-preview-long");
      var card = previewCard(item.name, null, null, node, { group: item.group, voteKind: "animation" });
      activate(card, function() {
        restartCardPreview(card);
        setInline("animStatus", "Applying " + item.name + "…", "");
        call("toolkitApplyAnimation", [item.name, String(currentDuration())]).then(function(res) {
          reportResult("animStatus", res, item.name + " applied.");
        }).catch(function(err) {
          reportResult("animStatus", { ok: false, error: err.message }, "");
        });
      });
      frag.appendChild(card);
    });
    grid.innerHTML = "";
    grid.appendChild(frag);
    applyGroup();
  }
  /* ── custom / AI-generated animation packs ───────────────────
     The card preview and the After Effects apply call are built from the very
     same spec object (js/ghost-anim-pack.js), which is what keeps an imported
     animation from looking different once it lands on the layer. */
  /* ── Ghost Motion engine handshake ────────────────────────────────
     Apply used to fail with "execution engine could not be loaded" because
     ExtendScript could not derive the extension folder on its own. The panel
     knows exactly where it lives, so it hands the path over and — if the host
     still cannot read the files — streams the module sources across. Same
     files the preview uses, so there is still one source of truth. */
  var motionRoot = null, motionReady = null;
  function extensionRoot() {
    if (motionRoot !== null) return motionRoot;
    motionRoot = "";
    try { if (cs && cs.getSystemPath) motionRoot = String(cs.getSystemPath("extension")).replace(/\\/g, "/"); } catch (e) { motionRoot = ""; }
    return motionRoot;
  }
  /* Register the exact CEP extension root with ExtendScript before any
     bundled FFX catalog is queried. Older builds referenced this helper
     without defining it, which aborted the Style boot sequence. */
  function ffxRegisterRoot() {
    var root = extensionRoot();
    if (!root) return Promise.resolve({ ok: false, error: "Extension root unavailable." });
    return call("toolkitFfxSetRoot", [root]).then(function(res) {
      if (!res || !res.ok) throw new Error((res && res.error) || "Could not register the FFX extension root.");
      return res;
    });
  }
  function fetchText(url) {
    return new Promise(function(resolve) {
      try {
        var xhr = new XMLHttpRequest();
        xhr.open("GET", url, true);
        xhr.onload = function() { resolve(xhr.status === 0 || (xhr.status >= 200 && xhr.status < 300) ? xhr.responseText : ""); };
        xhr.onerror = function() { resolve(""); };
        xhr.send(null);
      } catch (e) { resolve(""); }
    });
  }
  function ensureMotionEngine() {
    if (motionReady) return motionReady;
    motionReady = Promise.all([fetchText("js/ghost-motion.js"), fetchText("js/ghost-apply-engine.js")])
      .then(function(sources) {
        if (!sources[0] || !sources[1]) return null;
        return call("toolkitInstallMotionEngine", [sources[0], sources[1]]).catch(function() { return null; });
      })
      .catch(function() { return null; });
    return motionReady;
  }
  function motionBody(spec) {
    var body = window.GhostAnimPack.payload(spec, { duration: currentDuration() });
    body.extensionRoot = extensionRoot();
    return body;
  }
  function applyAnimationPack(spec) {
    if (!window.GhostAnimPack) return;
    var body = motionBody(spec);
    setInline("animStatus", "Applying " + spec.name + "…", "");
    ensureMotionEngine().then(function() {
      return call("toolkitApplyAdvancedAnimation", [JSON.stringify(body)]);
    }).then(function(res) {
      reportResult("animStatus", res, spec.name + " applied — editable in After Effects.");
    }).catch(function(err) {
      reportResult("animStatus", { ok: false, error: err.message }, "");
    });
  }
  /* Automated Preview/Apply consistency check. Run from the panel console:
        GhostText.diagnoseMotion("Blur Rise")        // probe, then clean up
        GhostText.diagnoseMotion("Blur Rise", true)  // probe and keep it
     Compares the plan the preview rendered with the structure After Effects
     actually built and prints every resolution step. */
  function diagnoseMotion(name, keep) {
    if (!window.GhostAnimPack) return Promise.reject(new Error("Animation pack module missing."));
    var specs = window.GhostAnimPack.list(), spec = null;
    for (var i = 0; i < specs.length; i += 1) {
      if (String(specs[i].name).toLowerCase() === String(name).toLowerCase()) { spec = specs[i]; break; }
    }
    if (!spec) return Promise.reject(new Error('No saved animation called "' + name + '".'));
    var body = motionBody(spec);
    body.keep = !!keep;
    setInline("animStatus", "Diagnosing " + spec.name + "…", "");
    return ensureMotionEngine().then(function() {
      return call("toolkitDiagnoseMotion", [JSON.stringify(body)]);
    }).then(function(res) {
      console.log("[Ghost Motion] " + (res.parity || (res.ok ? "OK" : "FAILED")));
      (res.steps || []).forEach(function(step) { console.log("  " + step); });
      (res.warnings || []).forEach(function(warn) { console.warn("  warning: " + warn); });
      if (!res.ok) console.error("  " + (res.error || "unknown divergence"));
      setInline("animStatus", res.ok ? spec.name + ": preview matches apply." : spec.name + ": " + (res.error || "divergence"), res.ok ? "ok" : "err");
      return res;
    });
  }
  function renderCustomAnimations(grid) {
    if (!window.GhostAnimPack) return;
    window.GhostAnimPack.list().forEach(function(spec) {
      var node = window.GhostAnimPack.previewNode(spec, spec.name);
      node.classList.add("tk-preview-name");
      if (spec.name.length > 12) node.classList.add("tk-preview-long");
      var card = previewCard(spec.name, "MINE", "tk-badge-custom", node, {
        group: spec.basis === "words" ? "word" : "char",
        voteKind: "animation"
      });
      activate(card, function() {
        applyAnimationPack(spec);
      });
      var del = document.createElement("button");
      del.type = "button";
      del.className = "tk-card-del";
      del.title = "Remove " + spec.name;
      del.setAttribute("aria-label", del.title);
      del.innerHTML = window.GhostHero ? window.GhostHero.svg("trash", "gi", 'width="12" height="12"') : "×";
      del.addEventListener("click", function(event) {
        event.stopPropagation();
        event.preventDefault();
        window.GhostAnimPack.remove(spec.name);
        renderAnimations();
        setInline("animStatus", spec.name + " removed.", "ok");
      });
      card.appendChild(del);
      grid.appendChild(card);
    });
  }
  function bindAnimPackModal() {
    var modal = byId("animPackModal");
    if (!modal) return;
    var input = byId("animPackInput");
    var previewBar = byId("animPackPreview");
    var openBtn = byId("animAddBtn");
    function close() {
      modal.hidden = true;
    }
    function open() {
      modal.hidden = false;
      setInline("animPackStatus", "", "");
      if (input) input.focus();
    }
    /* Live preview inside the modal: the user sees the animation before it is
       ever added, using the exact renderer the library cards use. */
    function refreshPreview() {
      if (!previewBar || !input) return;
      previewBar.innerHTML = "";
      var parsed = window.GhostAnimPack.parse(input.value);
      if (!parsed.ok) {
        if (input.value.replace(/\s/g, "")) setInline("animPackStatus", parsed.error, "warn");
        else setInline("animPackStatus", "", "");
        return;
      }
      setInline("animPackStatus", parsed.animations.length + " animation(s) ready to add.", "ok");
      parsed.animations.forEach(function(spec) {
        var cell = document.createElement("div");
        cell.className = "tk-pack-previewcell";
        cell.appendChild(window.GhostAnimPack.previewNode(spec, spec.name));
        var label = document.createElement("span");
        label.className = "tk-card-label";
        label.textContent = spec.name;
        cell.appendChild(label);
        previewBar.appendChild(cell);
      });
    }
    if (openBtn) openBtn.addEventListener("click", open);
    var closeBtn = byId("animPackClose");
    if (closeBtn) closeBtn.addEventListener("click", close);
    modal.addEventListener("click", function(event) {
      if (event.target === modal) close();
    });
    if (input) input.addEventListener("input", tkDebounce(refreshPreview, 220));
    var promptBtn = byId("animPackPrompt");
    if (promptBtn) promptBtn.addEventListener("click", function() {
      copyText(window.GhostAnimPack.PROMPT_TEXT);
      setInline("animPackStatus", "AI prompt copied — paste it into any AI, then paste the JSON back here.", "ok");
    });
    var formatBtn = byId("animPackFormat");
    if (formatBtn) formatBtn.addEventListener("click", function() {
      copyText(window.GhostAnimPack.SPEC_TEXT);
      setInline("animPackStatus", "Format copied.", "ok");
    });
    var fileBtn = byId("animPackFile");
    if (fileBtn) fileBtn.addEventListener("click", function() {
      var picker = document.createElement("input");
      picker.type = "file";
      picker.accept = ".json,application/json,text/plain";
      picker.addEventListener("change", function() {
        var file = picker.files && picker.files[0];
        if (!file) return;
        var reader = new FileReader();
        reader.onload = function() {
          if (input) input.value = String(reader.result || "");
          refreshPreview();
        };
        reader.readAsText(file);
      });
      picker.click();
    });
    var addBtn = byId("animPackAdd");
    if (addBtn) addBtn.addEventListener("click", function() {
      var parsed = window.GhostAnimPack.parse(input ? input.value : "");
      if (!parsed.ok) return setInline("animPackStatus", parsed.error, "error");
      var out = window.GhostAnimPack.add(parsed.animations);
      renderAnimations();
      if (input) input.value = "";
      if (previewBar) previewBar.innerHTML = "";
      var msg = out.added + " added" + (out.replaced ? ", " + out.replaced + " updated" : "") + " — find them in the Animation tab.";
      setInline("animPackStatus", msg, "ok");
      toast(msg, "ok");
      close();
    });
    document.addEventListener("keydown", function(event) {
      if (event.key === "Escape" && !modal.hidden) close();
    });
  }
  var TEXT_STYLES = [];
  function textStylePreviewNode(item, spec, index) {
    var info = styleLangInfo();
    var wrap = document.createElement("span");
    wrap.className = "tk-preview-text";
    wrap.style.fontWeight = "800";
    wrap.style.letterSpacing = item.overlap ? "-0.03em" : "0.02em";
    wrap.style.fontFamily = info.font;
    if (info.rtl) wrap.setAttribute("dir", "rtl");
    var word = stylePhrase(index);
    if (word.length > 10) wrap.classList.add("tk-preview-long");
    wrap.textContent = word;
    var fill = spec && spec.fill || { type: "solid", colors: ["#ffffff"] };
    if (fill.type === "solid" || fill.colors.length < 2) {
      wrap.style.color = fill.colors[0];
    } else {
      var stopList = [];
      for (var g = 0; g < fill.colors.length; g += 1) {
        stopList.push(fill.colors[g] + " " + Math.round(g * 100 / (fill.colors.length - 1)) + "%");
      }
      wrap.style.backgroundImage = "linear-gradient(90deg," + stopList.join(",") + ")";
      wrap.style.webkitBackgroundClip = "text";
      wrap.style.backgroundClip = "text";
      wrap.style.webkitTextFillColor = "transparent";
      wrap.style.color = "transparent";
    }
    var isRamp = wrap.style.webkitTextFillColor === "transparent";
    if (spec && spec.stroke) {
      var strokeEm = isRamp ? Math.min(spec.stroke.em, 0.022) : spec.stroke.em;
      wrap.style.webkitTextStroke = strokeEm + "em " + spec.stroke.color;
      wrap.style.paintOrder = "stroke fill";
    }
    var layers = [];
    if (spec && spec.extrude) {
      /* solid fills keep the hard 3-step extrude; ramps get one soft lift so
         the preview never turns into a muddy stack of offset copies */
      var steps = isRamp ? 1 : spec.extrude.steps;
      for (var s = 1; s <= steps; s += 1) {
        var off = (spec.extrude.stepEm * s).toFixed(4) + "em";
        layers.push(off + " " + off + " " + (isRamp ? "0.04em " : "0 ") + spec.extrude.color);
      }
    }
    if (spec && spec.shadow) {
      layers.push(spec.shadow.em + "em " + spec.shadow.em + "em " + (spec.shadow.softEm || 0) + "em " + spec.shadow.color);
    }
    if (spec && spec.glow && !isRamp) {
      layers.push("0 0 " + (spec.glow.em * 0.6).toFixed(3) + "em " + spec.glow.color);
    }
    if (layers.length) {
      if (isRamp) {
        var filters = [];
        for (var f = 0; f < layers.length; f += 1) filters.push("drop-shadow(" + layers[f] + ")");
        wrap.style.filter = filters.join(" ");
      } else {
        wrap.style.textShadow = layers.join(", ");
      }
    }
    return wrap;
  }
  var TEXT_STYLE_PAGE = 30;
  var textStylePage = 1;
  function textStyleCard(item, index) {
    var spec = styleSpec(item);
    var label = spec.name;
    var card = previewCard(label, null, null, textStylePreviewNode(item, spec, index), { noLabel: true, voteKind: "text-style" });
    card.title = label + " — " + item.desc;
    card.setAttribute("data-search", (label + " " + item.desc).toLowerCase());
    card.setAttribute("data-cat", item.cat || "other");
    activate(card, function() {
      setInline("textStyleStatus", "Applying " + label + "…", "");
      var payload = item;
      try {
        payload = JSON.parse(JSON.stringify(item));
        payload.spec = spec;
      } catch (eClone) {
      }
      call("toolkitApplyTextStyle", [label, JSON.stringify(payload)]).then(function(res) {
        reportResult("textStyleStatus", res, label + " applied.");
        if (res && res.ok && res.fontOk === false) {
          setInline("textStyleStatus", res.warning || "Font missing.", "warn");
        }
      }).catch(function(err) {
        reportResult("textStyleStatus", { ok: false, error: err.message }, "");
      });
    });
    return card;
  }
  function renderTextStyles(page) {
    var grid = byId("textStyleGrid");
    if (!grid) return;
    textStylePage = page || 1;
    var frag = document.createDocumentFragment();
    var limit = Math.min(TEXT_STYLE_PAGE * textStylePage, TEXT_STYLES.length);
    for (var i = 0; i < limit; i += 1) frag.appendChild(textStyleCard(TEXT_STYLES[i], i));
    if (limit < TEXT_STYLES.length) {
      var more = document.createElement("button");
      more.type = "button";
      more.className = "tk-load-more";
      more.textContent = "Load more (" + (TEXT_STYLES.length - limit) + " left)";
      more.addEventListener("click", function() {
        renderTextStyles(textStylePage + 1);
      });
      frag.appendChild(more);
    }
    grid.innerHTML = "";
    grid.appendChild(frag);
  }
  function expandTextStyles() {
    var total = Math.ceil(TEXT_STYLES.length / TEXT_STYLE_PAGE);
    if (textStylePage < total) renderTextStyles(total);
  }
  function renderCloudTextStyles(force) {
    var grid = byId("cloudStyleGrid");
    var empty = byId("cloudStyleEmpty");
    if (grid) grid.innerHTML = "";
    if (empty) {
      empty.hidden = false;
      empty.textContent = "No built-in styles available.";
    }
  }
  function cloudStyleCard(style) {
    var card = document.createElement("div");
    card.className = "tk-card tk-ffx-card tk-cloud-style";
    card.setAttribute("tabindex", "0");
    card.title = style.name;
    card.setAttribute("data-search", (style.name + " ffx cloud text style " + (style.tags || []).join(" ")).toLowerCase());
    if (style.preview) {
      var shot = document.createElement("img");
      shot.className = "tk-ffx-card-shot";
      shot.alt = style.name;
      shot.loading = "lazy";
      shot.src = style.preview;
      card.appendChild(shot);
    } else {
      var fallback = document.createElement("span");
      fallback.className = "tk-preview-text";
      fallback.textContent = sample().word;
      card.appendChild(fallback);
    }
    var tag = document.createElement("span");
    tag.className = "tk-ffx-card-tag";
    tag.textContent = "FFX";
    card.appendChild(tag);
    var name = document.createElement("span");
    name.className = "tk-ffx-card-name";
    name.textContent = style.name;
    card.appendChild(name);
    activate(card, function() {
      if (!style.url) {
        setInline("cloudStyleStatus", "This style has no download link yet.", "warn");
        return;
      }
      setInline("cloudStyleStatus", "Installing " + style.name + "…", "");
      fetchBase64(style.url).then(function(b64) {
        return call("toolkitFfxInstallCloud", [style.slug || style.name, style.name, b64]);
      }).then(function(res) {
        if (!res || !res.ok) {
          reportResult("cloudStyleStatus", res || { ok: false, error: "Install failed." }, "");
          return null;
        }
        setInline("cloudStyleStatus", "Applying " + style.name + "…", "");
        return call("toolkitFfxApplyStyle", [res.file]);
      }).then(function(applied) {
        if (applied) reportResult("cloudStyleStatus", applied, style.name + " applied.");
      }).catch(function(err) {
        reportResult("cloudStyleStatus", { ok: false, error: err.message }, "");
      });
    });
    return card;
  }
  function fetchBase64(url) {
    return fetch(url).then(function(res) {
      if (!res.ok) throw new Error("Download failed (" + res.status + ")");
      return res.blob();
    }).then(function(blob) {
      return new Promise(function(resolve, reject) {
        var reader = new FileReader();
        reader.onload = function() {
          var out = String(reader.result || "");
          var at = out.indexOf(",");
          resolve(at === -1 ? out : out.slice(at + 1));
        };
        reader.onerror = function() {
          reject(new Error("Could not read the preset."));
        };
        reader.readAsDataURL(blob);
      });
    });
  }
  /* Animation-side language. It drives the animation grid, captions and
     combos only — the Style tab owns its own language (setStyleLang). */
  function setLang(id) {
    if (!id || id === lang) return;
    lang = id;
    try {
      window.localStorage.setItem("ghost.previewLang", id);
    } catch (eStore) {
    }
    syncAnimLangButton();
    renderAnimations();
    renderCombos();
    applyFilter();
  }
  function setStyleLang(id) {
    if (!id || id === styleLang) return;
    styleLang = id;
    try {
      window.localStorage.setItem("ghost.styleLang", id);
    } catch (eStore2) {
    }
    renderTextStyles(textStylePage);
    applyFilter();
  }
  /* Small surface the 2028 presentation layer talks to for the language
     sheets, so neither side has to reach into private state. */
  window.GhostToolkitLang = {
    languages: function() {
      return LANGUAGES.map(function(l) {
        return { id: l.id, flag: l.flag, label: l.label, font: l.font };
      });
    },
    animLang: function() { return lang; },
    styleLang: function() { return styleLang; },
    setAnimLang: setLang,
    setStyleLang: setStyleLang,
    labelOf: function(id) { return langById(id).label; }
  };
  function syncAnimLangButton() {
    var btn = byId("animLangBtn");
    if (!btn) return;
    var info = langInfo();
    var flag = btn.querySelector(".tk-langbtn-flag");
    if (flag) flag.textContent = info.flag;
    btn.title = "Preview language — " + info.label;
    var menu = byId("animLangMenu");
    if (!menu) return;
    var items = menu.querySelectorAll(".tk-langmenu-item");
    Array.prototype.forEach.call(items, function(el) {
      el.classList.toggle("active", el.getAttribute("data-lang") === lang);
    });
  }
  function buildAnimLangMenu() {
    var btn = byId("animLangBtn");
    var menu = byId("animLangMenu");
    if (!btn || !menu || menu.getAttribute("data-built")) return;
    menu.setAttribute("data-built", "1");
    LANGUAGES.forEach(function(info) {
      var item = document.createElement("button");
      item.type = "button";
      item.className = "tk-langmenu-item" + (info.id === lang ? " active" : "");
      item.setAttribute("data-lang", info.id);
      item.innerHTML = '<span class="tk-langmenu-flag"></span><span class="tk-langmenu-name"></span>';
      item.querySelector(".tk-langmenu-flag").textContent = info.flag;
      var name = item.querySelector(".tk-langmenu-name");
      name.textContent = info.label;
      name.style.fontFamily = info.font;
      item.addEventListener("click", function() {
        setLang(info.id);
        menu.hidden = true;
        btn.setAttribute("aria-expanded", "false");
      });
      menu.appendChild(item);
    });
    btn.addEventListener("click", function(event) {
      event.stopPropagation();
      menu.hidden = !menu.hidden;
      btn.setAttribute("aria-expanded", menu.hidden ? "false" : "true");
    });
    document.addEventListener("click", function(event) {
      if (menu.hidden) return;
      if (menu.contains(event.target) || btn.contains(event.target)) return;
      menu.hidden = true;
      btn.setAttribute("aria-expanded", "false");
    });
    document.addEventListener("keydown", function(event) {
      if (event.key === "Escape" && !menu.hidden) {
        menu.hidden = true;
        btn.setAttribute("aria-expanded", "false");
      }
    });
    syncAnimLangButton();
  }
  /* v3.34.0 — the old chip row is gone: language is picked from the panel
     menu sheet, so the Style tab keeps its full width for presets. */
  function renderLangChips() {
    var bar = byId("langGroups");
    if (bar) {
      bar.innerHTML = "";
      bar.hidden = true;
    }
    buildAnimLangMenu();
  }
  function renderColors() {
    var grid = byId("colorGrid");
    if (!grid) return;
    grid.innerHTML = "";
    COLORS.forEach(function(item) {
      var swatch = document.createElement("div");
      swatch.className = "tk-swatch";
      swatch.setAttribute("role", "button");
      swatch.setAttribute("tabindex", "0");
      swatch.title = item.name;
      swatch.setAttribute("aria-label", item.name);
      swatch.setAttribute("data-search", item.name.toLowerCase());
      swatch.style.background = item.css;
      if (item.glow) swatch.style.boxShadow = "0 0 10px " + item.css;
      if (item.stroke) swatch.style.border = "2px solid " + item.stroke;
      activate(swatch, function() {
        setInline("colorStatus", "Applying " + item.name + "…", "");
        call("toolkitApplyColor", [item.name]).then(function(res) {
          reportResult("colorStatus", res, item.name + " applied.");
        }).catch(function(err) {
          reportResult("colorStatus", { ok: false, error: err.message }, "");
        });
      });
      grid.appendChild(swatch);
    });
  }
  var COMBOS = [
    { name: "Viral Pop", icon: "⚡", color: "Radioactive Yellow", anim: "Char Pop", desc: "Yellow + char pop" },
    { name: "Cinematic Title", icon: "🎬", color: "Gold Foil", anim: "Char Tracking In", desc: "Gold + tracking in" },
    { name: "Social Caption", icon: "📱", color: "Pure White", anim: "Word by Word", desc: "White + word reveal" },
    { name: "Neon Glitch", icon: "👾", color: "Ghost Cyan", anim: "RGB Glitch", desc: "Cyan + glitch" },
    { name: "Soft Intro", icon: "🌙", color: "Lavender Dream", anim: "Char Blur", desc: "Lavender + blur in" },
    { name: "Bold Impact", icon: "💥", color: "Hot Crimson", anim: "Char Overshoot", desc: "Red + overshoot" },
    { name: "Typewriter Story", icon: "⌨", color: "Pure White", anim: "Typewriter Chars", desc: "Classic typewriter" },
    { name: "Rainbow Party", icon: "🌈", style: "Rainbow Pop", anim: "Char Wave", desc: "Rainbow + wave" },
    { name: "3D Candy", icon: "🍬", style: "Candy 3D Outline", anim: "Char Pop", desc: "Candy extrude + pop" },
    { name: "বাংলা টাইটেল", icon: "🇧🇩", style: "Bangla Blue Title", anim: "Word Rise", desc: "নীল টাইটেল + রাইজ" }
  ];
  function runChain(steps, statusId, label) {
    setInline(statusId, "Applying " + label + "…", "");
    var index = 0;
    function next() {
      if (index >= steps.length) {
        setInline(statusId, label + " applied.", "ok");
        return;
      }
      var step = steps[index];
      index += 1;
      call(step.fn, step.args).then(function(res) {
        if (res && res.ok === false && index === 1) {
          setInline(statusId, res.error || "Failed.", "error");
          return;
        }
        next();
      }).catch(function(err) {
        setInline(statusId, err.message, "error");
      });
    }
    next();
  }
  function renderCombos() {
    var grid = byId("comboGrid");
    if (!grid) return;
    grid.innerHTML = "";
    COMBOS.forEach(function(item) {
      var node = document.createElement("span");
      node.className = "tk-combo-preview";
      var glyph = document.createElement("span");
      glyph.className = "tk-combo-icon";
      glyph.textContent = item.icon;
      var text = document.createElement("span");
      text.className = "tk-preview-text " + (item.anim ? animClassFor(item.anim) : "");
      text.textContent = item.name;
      node.appendChild(glyph);
      node.appendChild(text);
      var card = previewCard(item.name, null, null, node, { noLabel: true });
      card.title = item.name + " — " + item.desc;
      card.setAttribute("data-search", (item.name + " " + item.desc).toLowerCase());
      activate(card, function() {
        var steps = [];
        if (item.style) steps.push({ fn: "toolkitApplyTextStyle", args: [item.style] });
        if (item.color) steps.push({ fn: "toolkitApplyColor", args: [item.color] });
        if (item.anim) steps.push({ fn: "toolkitApplyAnimation", args: [item.anim, String(currentDuration())] });
        runChain(steps, "comboStatus", item.name);
      });
      grid.appendChild(card);
    });
  }
  function animClassFor(name) {
    for (var i = 0; i < ANIMATIONS.length; i += 1) {
      if (ANIMATIONS[i].name === name) return ANIMATIONS[i].anim;
    }
    return "";
  }
  var TYPO = [
    { icon: "A+", action: "sizeUp", label: "Font size +" },
    { icon: "A-", action: "sizeDown", label: "Font size −" },
    { icon: "A↔", action: "trackUp", label: "Tracking +" },
    { icon: "A↔-", action: "trackDown", label: "Tracking −" },
    { icon: "↕+", action: "leadUp", label: "Leading +" },
    { icon: "↕-", action: "leadDown", label: "Leading −" },
    { icon: "↕A", action: "autoLeading", label: "Auto leading" },
    { icon: "⇤", action: "alignLeft", label: "Align left" },
    { icon: "≡", action: "alignCenter", label: "Align centre" },
    { icon: "⇥", action: "alignRight", label: "Align right" },
    { icon: "AA", action: "upper", label: "UPPERCASE" },
    { icon: "aa", action: "lower", label: "lowercase" },
    { icon: "Aa", action: "title", label: "Title Case" },
    { icon: "B", action: "faux", label: "Faux bold toggle" },
    { icon: "I", action: "italic", label: "Faux italic toggle" },
    { icon: "◍", action: "strokeOn", label: "Add outline" },
    { icon: "◌", action: "strokeOff", label: "Remove outline" },
    { icon: "⤢", action: "fitComp", label: "Fit width to comp" },
    { icon: "✛", action: "anchorCenter", label: "Anchor to centre" },
    { icon: "◉", action: "centerComp", label: "Centre in comp" }
  ];
  function renderTypography() {
    var grid = byId("typeGrid");
    if (!grid) return;
    grid.innerHTML = "";
    TYPO.forEach(function(item) {
      var button = document.createElement("button");
      button.type = "button";
      button.className = "tk-action";
      button.title = item.label;
      button.setAttribute("data-search", item.label.toLowerCase());
      button.innerHTML = '<span class="tk-action-icon"></span>';
      button.firstChild.textContent = item.icon;
      button.addEventListener("click", function() {
        setInline("typeStatus", item.label + "…", "");
        call("toolkitApplyTypography", [item.action, ""]).then(function(res) {
          reportResult("typeStatus", res, item.label + " ✓");
        }).catch(function(err) {
          reportResult("typeStatus", { ok: false, error: err.message }, "");
        });
      });
      grid.appendChild(button);
    });
  }
  var selectedEmoji = "";
  var emojiFolder = "premium";
  /* Older CEF builds ship an incomplete emoji font, so newer glyphs render as
     an empty "tofu" box. Measuring the glyph against a guaranteed-missing
     codepoint tells us whether this After Effects build can draw it; anything
     unsupported is left out instead of showing a blank tile. */
  var emojiSupportCache = {};
  var emojiSupportCtx = null;
  var emojiFilterOn = null;
  function emojiRenders(glyph) {
    /* If the runtime cannot even draw the most basic emoji it has no emoji font
       at all — in that case filtering would empty the grid, so we show
       everything and let After Effects deal with the glyphs. */
    if (emojiFilterOn === null) {
      emojiFilterOn = true;
      emojiFilterOn = emojiRendersRaw("\uD83D\uDE00");
    }
    if (!emojiFilterOn) return true;
    return emojiRendersRaw(glyph);
  }
  function emojiRendersRaw(glyph) {
    if (Object.prototype.hasOwnProperty.call(emojiSupportCache, glyph)) return emojiSupportCache[glyph];
    var ok = true;
    try {
      if (!emojiSupportCtx) {
        var canvas = document.createElement("canvas");
        canvas.width = 40;
        canvas.height = 40;
        emojiSupportCtx = canvas.getContext("2d");
        if (emojiSupportCtx) emojiSupportCtx.font = "28px sans-serif";
      }
      if (emojiSupportCtx) {
        emojiSupportCtx.font = "28px sans-serif";
        var tofu = emojiSupportCtx.measureText("\uDBFF\uDFFF").width;
        var w = emojiSupportCtx.measureText(glyph).width;
        ok = w > 0 && Math.abs(w - tofu) > 0.5;
      }
    } catch (e) { ok = true; }
    emojiSupportCache[glyph] = ok;
    return ok;
  }
  function emojiSearchIndex() {
    var out = [];
    EMOJI_GROUPS.forEach(function(group) {
      group.items.forEach(function(glyph, gi) {
        out.push({
          glyph: glyph,
          name: (group.names && group.names[gi]) || "",
          group: group
        });
      });
    });
    return out;
  }
  function renderEmojis() {
    var host = byId("emojiGrid");
    if (!host) return;
    host.className = "tk-emoji-host ge-emoji-host ge-emoji-lean";
    host.innerHTML = "";
    var heroIcon = function(name, cls) {
      return window.GhostHero && window.GhostHero.has(name) ? window.GhostHero.svg(name, cls || "gi gi-action") : "";
    };
    var head = document.createElement("div");
    head.className = "ge-head";
    head.innerHTML = '<span class="ge-head-title">Text based emoji</span><span class="ge-head-rule"></span>';
    var searchBtn = document.createElement("button");
    searchBtn.type = "button";
    searchBtn.className = "ge-head-ico";
    searchBtn.title = "Search emoji";
    searchBtn.setAttribute("aria-label", "Search emoji");
    searchBtn.innerHTML = heroIcon("magnifying-glass", "gi") ||
      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><circle cx="11" cy="11" r="6"/><path d="M16 16l4 4"/></svg>';
    var search = document.createElement("input");
    search.type = "search";
    search.className = "ge-head-search";
    search.placeholder = "Search…";
    search.hidden = true;
    search.setAttribute("aria-label", "Search emoji");
    var catBtn = document.createElement("button");
    catBtn.type = "button";
    catBtn.className = "ge-head-ico";
    catBtn.title = "Categories";
    catBtn.setAttribute("aria-expanded", "false");
    catBtn.innerHTML = heroIcon("squares-2x2", "gi") ||
      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><rect x="4" y="4" width="6" height="6" rx="1.4"/><rect x="14" y="4" width="6" height="6" rx="1.4"/><rect x="4" y="14" width="6" height="6" rx="1.4"/><rect x="14" y="14" width="6" height="6" rx="1.4"/></svg>';
    head.appendChild(search);
    head.appendChild(searchBtn);
    head.appendChild(catBtn);
    host.appendChild(head);
    var rail = document.createElement("div");
    rail.className = "tk-emoji-rail ge-cat-bar";
    host.appendChild(rail);
    var categoryMenu = document.createElement("div");
    categoryMenu.className = "ge-category-menu";
    categoryMenu.hidden = true;
    host.appendChild(categoryMenu);
    var gridWrap = document.createElement("div");
    gridWrap.className = "ge-grid-wrap";
    host.appendChild(gridWrap);
    var grid = document.createElement("div");
    grid.className = "tk-emoji-grid ge-asset-grid";
    gridWrap.appendChild(grid);
    function emojiTile(glyph, emojiName, group) {
      var button = document.createElement("button");
      button.type = "button";
      button.className = "tk-emoji-button ge-asset-tile";
      var glyphSpan = document.createElement("span");
      glyphSpan.className = "ge-tile-glyph";
      glyphSpan.textContent = glyph;
      button.appendChild(glyphSpan);
      button.setAttribute("aria-label", group.label + " emoji " + glyph);
      button.title = emojiName || group.label;
      return button;
    }
    grid.addEventListener("click", function(ev) {
      var tile = ev.target && ev.target.closest ? ev.target.closest(".ge-asset-tile") : null;
      if (!tile) return;
      var glyph = tile.getAttribute("data-glyph");
      if (glyph) openEmojiModal(glyph);
    });
    function paint(groupId) {
      emojiFolder = groupId;
      Array.prototype.forEach.call(rail.children, function(tab) {
        var on = tab.getAttribute("data-folder") === groupId;
        tab.classList.toggle("is-active", on);
        tab.classList.toggle("active", on);
        tab.setAttribute("aria-selected", on ? "true" : "false");
      });
      var group2 = null;
      for (var i = 0; i < EMOJI_GROUPS.length; i += 1) {
        if (EMOJI_GROUPS[i].id === groupId) { group2 = EMOJI_GROUPS[i]; break; }
      }
      if (!group2) return;
      categoryMenu.hidden = true;
      catBtn.setAttribute("aria-expanded", "false");
      var frag = document.createDocumentFragment();
      group2.items.forEach(function(glyph, gi) {
        if (!emojiRenders(glyph)) return;
        var tile = emojiTile(glyph, group2.names && group2.names[gi] || "", group2);
        tile.setAttribute("data-glyph", glyph);
        frag.appendChild(tile);
      });
      grid.textContent = "";
      grid.appendChild(frag);
    }
    search.addEventListener("input", tkDebounce(function() {
      var query = search.value.toLowerCase().replace(/^\s+|\s+$/g, "");
      if (!query) { paint(emojiFolder); return; }
      var frag = document.createDocumentFragment();
      var shown = 0;
      emojiSearchIndex().forEach(function(entry) {
        if (shown >= 300) return;
        var hay = (entry.glyph + " " + entry.name + " " + entry.group.label).toLowerCase();
        if (hay.indexOf(query) === -1) return;
        if (!emojiRenders(entry.glyph)) return;
        var tile = emojiTile(entry.glyph, entry.name, entry.group);
        tile.setAttribute("data-glyph", entry.glyph);
        frag.appendChild(tile);
        shown += 1;
      });
      grid.textContent = "";
      grid.appendChild(frag);
    }, 90));
    searchBtn.addEventListener("click", function() {
      search.hidden = !search.hidden;
      if (!search.hidden) { search.focus(); }
      else if (search.value) { search.value = ""; paint(emojiFolder); }
    });
    var railFrag = document.createDocumentFragment();
    var menuFrag = document.createDocumentFragment();
    EMOJI_GROUPS.forEach(function(group2) {
      var tab = document.createElement("button");
      tab.type = "button";
      tab.className = "tk-emoji-folder ge-cat-pill";
      tab.setAttribute("data-folder", group2.id);
      tab.setAttribute("role", "tab");
      tab.title = group2.label + " (" + group2.items.length + ")";
      tab.textContent = group2.label;
      railFrag.appendChild(tab);
      var category = document.createElement("button");
      category.type = "button";
      category.className = "ge-category-option";
      category.setAttribute("data-folder", group2.id);
      var ico = document.createElement("span");
      ico.className = "ge-category-option-icon";
      ico.textContent = group2.icon;
      var copy = document.createElement("span");
      copy.className = "ge-category-option-copy";
      var b = document.createElement("b");
      b.textContent = group2.label;
      var s = document.createElement("small");
      s.textContent = group2.items.length + " emoji";
      copy.appendChild(b);
      copy.appendChild(s);
      category.appendChild(ico);
      category.appendChild(copy);
      menuFrag.appendChild(category);
    });
    rail.appendChild(railFrag);
    categoryMenu.appendChild(menuFrag);
    function pickFolder(ev) {
      var btn = ev.target && ev.target.closest ? ev.target.closest("[data-folder]") : null;
      if (!btn) return;
      if (search.value) { search.value = ""; }
      paint(btn.getAttribute("data-folder"));
    }
    rail.addEventListener("click", pickFolder);
    categoryMenu.addEventListener("click", pickFolder);
    catBtn.addEventListener("click", function() {
      categoryMenu.hidden = !categoryMenu.hidden;
      catBtn.setAttribute("aria-expanded", categoryMenu.hidden ? "false" : "true");
    });
    paint(emojiFolder);
  }
  function openEmojiModal(glyph) {
    selectedEmoji = glyph;
    var modal = byId("emojiModal");
    if (!modal) return;
    byId("modalEmojiIcon").textContent = glyph;
    byId("modalEmojiName").textContent = "Selected: " + glyph;
    modal.hidden = false;
  }
  function closeEmojiModal() {
    var modal = byId("emojiModal");
    if (modal) modal.hidden = true;
  }
  function copyText(value) {
    try {
      var ta = document.createElement("textarea");
      ta.value = value;
      ta.style.position = "fixed";
      ta.style.opacity = "0";
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      document.body.removeChild(ta);
      return true;
    } catch (e) {
      return false;
    }
  }
  var EXPR_ICONS = {
    wiggle: { fx: "fx-wiggle", d: "M2 12h3l2-5 3 10 3-8 2 3h5" },
    rotat: { fx: "fx-spin", d: "M21 12a9 9 0 1 1-3-6.7M21 3v5h-5" },
    spin: { fx: "fx-spin", d: "M21 12a9 9 0 1 1-3-6.7M21 3v5h-5" },
    bounce: { fx: "fx-bounce", d: "M12 3v10M12 21a5 5 0 0 0 0-10 5 5 0 0 0 0 10Z" },
    pulse: { fx: "fx-pulse", d: "M20.8 5.6a5 5 0 0 0-7.1 0L12 7.3l-1.7-1.7a5 5 0 1 0-7.1 7.1l8.8 8.8 8.8-8.8a5 5 0 0 0 0-7.1Z" },
    scale: { fx: "fx-pulse", d: "M4 9V4h5M20 15v5h-5M4 4l6 6M20 20l-6-6" },
    loop: { fx: "fx-spin", d: "M17 2l4 4-4 4M3 11v-1a4 4 0 0 1 4-4h14M7 22l-4-4 4-4M21 13v1a4 4 0 0 1-4 4H3" },
    time: { fx: "fx-spin", d: "M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18ZM12 7v5l3 2" },
    random: { fx: "fx-wiggle", d: "M16 3h5v5M4 20 21 3M21 16v5h-5M15 15l6 6M4 4l5 5" },
    inertia: { fx: "fx-slide", d: "M3 17c4 0 4-10 8-10s4 10 8 10" },
    bezier: { fx: "fx-slide", d: "M3 18c6 0 12-12 18-12" },
    position: { fx: "fx-slide", d: "M5 12h14M12 5l7 7-7 7" },
    opacity: { fx: "fx-pulse", d: "M12 3v18M12 3a9 9 0 0 1 0 18Z" },
    blur: { fx: "fx-pulse", d: "M12 3c-3 4-5 6.5-5 9a5 5 0 0 0 10 0c0-2.5-2-5-5-9Z" },
    text: { fx: "fx-wiggle", d: "M4 6h16M9 6v13M4 6V4h16v2" },
    audio: { fx: "fx-bounce", d: "M4 12v2M8 8v10M12 5v14M16 9v6M20 11v2" },
    shake: { fx: "fx-wiggle", d: "M3 12h4l2-6 3 12 3-9 2 3h4" },
    flicker: { fx: "fx-pulse", d: "M13 2 4 14h6l-1 8 9-12h-6l1-8Z" },
    color: { fx: "fx-pulse", d: "M12 21a9 9 0 1 1 9-9c0 2-1.5 3-3 3h-2a2 2 0 0 0-2 2c0 1.5-1 4-2 4Z" }
  };
  var EXPR_ICON_FALLBACK = { fx: "fx-slide", d: "M4 7h16M4 12h10M4 17h7" };
  function exprIconFor(name) {
    var key = String(name || "").toLowerCase();
    for (var k in EXPR_ICONS) {
      if (EXPR_ICONS.hasOwnProperty(k) && key.indexOf(k) !== -1) return EXPR_ICONS[k];
    }
    return EXPR_ICON_FALLBACK;
  }
  function exprDescFor(item) {
    if (item.desc) return item.desc;
    var code = String(item.code || "").split("\n")[0];
    return code ? code.slice(0, 90) : "Expression for " + item.target + ".";
  }
  var expressionAutoplay = false;
  function setExpressionAutoplay(enabled) {
    expressionAutoplay = !!enabled;
    document.body.classList.toggle("expr-autoplay", expressionAutoplay);
    document.body.classList.toggle("expr-motion-paused", !expressionAutoplay);
    var button = document.querySelector("#exprAutoplay");
    if (button) {
      button.textContent = expressionAutoplay ? "Ⅱ" : "▶";
      button.title = expressionAutoplay ? "Turn expression autoplay off" : "Turn expression autoplay on";
      button.setAttribute("aria-label", button.title);
      button.setAttribute("aria-pressed", expressionAutoplay ? "true" : "false");
    }
    var cards = document.querySelectorAll("#exprGrid .tk-expr-card");
    for (var i = 0; i < cards.length; i += 1) cards[i].classList.toggle("expr-preview-active", expressionAutoplay);
  }
  /* v3.41.0 — expression category chips. The category is derived from the
     preset target, so no data file has to be touched when new expressions are
     pushed into EXPRESSIONS. Filtering is pure DOM class work (no re-render),
     which keeps the panel snappy on the legacy CEP engine. */
  var EXPR_CATS = [
    { id: "all", label: "All" },
    { id: "position", label: "Position", match: ["position", "anchor"] },
    { id: "scale", label: "Scale", match: ["scale"] },
    { id: "rotation", label: "Rotation", match: ["rotation", "orientation"] },
    { id: "opacity", label: "Opacity", match: ["opacity"] },
    { id: "text", label: "Text", match: ["text", "source text"] }
  ];
  var exprActiveCat = "all";
  function exprCatOf(item) {
    var target = String(item && item.target || "").toLowerCase();
    for (var i = 1; i < EXPR_CATS.length; i += 1) {
      var m = EXPR_CATS[i].match;
      for (var j = 0; j < m.length; j += 1) {
        if (target.indexOf(m[j]) !== -1) return EXPR_CATS[i].id;
      }
    }
    return "other";
  }
  function exprApplyFilter() {
    var query = "";
    var search = document.querySelector(".tk-expr-reference-search");
    if (search) query = String(search.value || "").toLowerCase().replace(/^\s+|\s+$/g, "");
    var cards = document.querySelectorAll("#exprGrid .tk-expr-card");
    for (var i = 0; i < cards.length; i += 1) {
      var okText = !query || (cards[i].getAttribute("data-search") || "").indexOf(query) !== -1;
      var okCat = exprActiveCat === "all" || cards[i].getAttribute("data-cat") === exprActiveCat;
      cards[i].style.display = okText && okCat ? "flex" : "none";
    }
  }
  function ensureExpressionReferenceControls() {
    var toolbar = document.querySelector(".tk-expr-toolbar");
    if (!toolbar || toolbar.querySelector(".tk-expr-reference-actions")) return;
    var cats = document.createElement("div");
    cats.className = "tk-expr-cats";
    EXPR_CATS.forEach(function(cat) {
      var chip = document.createElement("button");
      chip.type = "button";
      chip.className = "tk-expr-cat" + (cat.id === exprActiveCat ? " active" : "");
      chip.textContent = cat.label;
      chip.setAttribute("data-cat", cat.id);
      chip.addEventListener("click", function() {
        exprActiveCat = cat.id;
        var all = cats.querySelectorAll(".tk-expr-cat");
        for (var i = 0; i < all.length; i += 1) {
          all[i].classList.toggle("active", all[i].getAttribute("data-cat") === exprActiveCat);
        }
        exprApplyFilter();
      });
      cats.appendChild(chip);
    });
    toolbar.appendChild(cats);
    var actions = document.createElement("div");
    actions.className = "tk-expr-reference-actions";
    var search = document.createElement("input");
    search.type = "search";
    search.className = "tk-expr-reference-search";
    search.placeholder = "Search";
    search.setAttribute("aria-label", "Search expressions");
    search.addEventListener("input", tkDebounce(exprApplyFilter, 90));
    actions.appendChild(search);
    var refreshButton = document.createElement("button");
    refreshButton.type = "button";
    refreshButton.className = "tk-expr-reference-icon";
    refreshButton.textContent = "↻";
    refreshButton.title = "Reset expression search";
    refreshButton.setAttribute("aria-label", "Reset expression search");
    refreshButton.addEventListener("click", function() {
      search.value = "";
      search.dispatchEvent(new Event("input"));
      search.focus();
    });
    actions.appendChild(refreshButton);
    var autoplayButton = document.createElement("button");
    autoplayButton.type = "button";
    autoplayButton.id = "exprAutoplay";
    autoplayButton.className = "tk-expr-reference-icon";
    autoplayButton.textContent = "▶";
    autoplayButton.title = "Turn expression autoplay on";
    autoplayButton.setAttribute("aria-label", "Turn expression autoplay on");
    autoplayButton.setAttribute("aria-pressed", "false");
    autoplayButton.addEventListener("click", function() { setExpressionAutoplay(!expressionAutoplay); });
    actions.appendChild(autoplayButton);
    toolbar.appendChild(actions);
    setExpressionAutoplay(false);
  }
  function renderExpressions() {
    var grid = byId("exprGrid");
    if (!grid) return;
    ensureExpressionReferenceControls();
    grid.innerHTML = "";
    grid.classList.add("tk-expr-grid");
    var exprPreviewObserver = null;
    var expressionFragment = document.createDocumentFragment();
    EXPRESSIONS.forEach(function(item) {
      var card = document.createElement("article");
      card.className = "tk-expr-card";
      card.tabIndex = 0;
      card.title = item.name;
      card.setAttribute("data-search", (item.name + " " + item.target + " " + (item.desc || "")).toLowerCase());
      card.setAttribute("data-cat", exprCatOf(item));
      var meta = exprIconFor(item.name);
      var icon = document.createElement("div");
      icon.className = "tk-expr-icon " + meta.fx;
      icon.innerHTML = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="' + meta.d + '"/></svg>';
      card.appendChild(icon);
      var pop = document.createElement("div");
      pop.className = "tk-expr-pop";
      var title = document.createElement("h3");
      title.textContent = item.name;
      pop.appendChild(title);
      var desc = document.createElement("p");
      desc.className = "tk-expr-desc";
      desc.textContent = exprDescFor(item);
      pop.appendChild(desc);
      if (item.code) {
        var code = document.createElement("code");
        code.className = "tk-expr-code";
        code.textContent = item.code;
        pop.appendChild(code);
      }
      var metaRow = document.createElement("div");
      metaRow.className = "tk-expr-meta";
      var target = document.createElement("span");
      target.className = "tk-expr-target";
      target.textContent = item.target;
      metaRow.appendChild(target);
      metaRow.appendChild(voteBar("expression", item.name));
      pop.appendChild(metaRow);
      var actions = document.createElement("div");
      actions.className = "tk-expr-actions";
      var apply = document.createElement("button");
      apply.type = "button";
      apply.className = "primary-button";
      apply.textContent = "Apply";
      apply.addEventListener("click", function(ev) {
        ev.stopPropagation();
        var sel = byId("exprTarget");
        var mode = sel && sel.value ? sel.value : "selected";
        setInline("exprStatus", "Applying " + item.name + " → " + mode + "…", "");
        call("toolkitApplyExpression", [item.name, mode]).then(function(res) {
          reportResult(
            "exprStatus",
            res,
            item.name + " applied on " + (res && res.target || mode) + (res && res.fromSelection ? " (" + res.fromSelection + " selected propert" + (res.fromSelection === 1 ? "y" : "ies") + ")" : "") + "."
          );
        }).catch(function(err) {
          reportResult("exprStatus", { ok: false, error: err.message }, "");
        });
      });
      actions.appendChild(apply);
      var copy = document.createElement("button");
      copy.type = "button";
      copy.className = "ghost-button";
      copy.textContent = "Copy";
      copy.title = item.code;
      copy.addEventListener("click", function(ev) {
        ev.stopPropagation();
        var done = copyText(item.code);
        setInline("exprStatus", done ? item.name + " copied." : "Copy failed.", done ? "ok" : "error");
      });
      actions.appendChild(copy);
      pop.appendChild(actions);
      card.appendChild(pop);
      card.addEventListener("dblclick", function() {
        apply.click();
      });
      card.addEventListener("mouseenter", function() {
        var r = card.getBoundingClientRect();
        var vw = window.innerWidth || document.documentElement.clientWidth;
        var vh = window.innerHeight || document.documentElement.clientHeight;
        var edge = 8;
        var gap = 10;
        var popWidth = Math.min(250, Math.max(180, vw - edge * 2));
        var left;
        var top;
        pop.style.width = popWidth + "px";
        pop.style.right = "auto";
        pop.style.bottom = "auto";
        pop.style.margin = "0";
        left = r.right + gap;
        if (left + popWidth > vw - edge) left = r.left - gap - popWidth;
        left = Math.max(edge, Math.min(left, vw - popWidth - edge));
        top = r.top;
        top = Math.max(edge, Math.min(top, vh - pop.offsetHeight - edge));
        pop.style.left = left - r.left + "px";
        pop.style.top = top - r.top + "px";
      });
      expressionFragment.appendChild(card);
    });
    grid.appendChild(expressionFragment);
    var expressionCards = grid.querySelectorAll(".tk-expr-card");
    for (var staticIndex = 0; staticIndex < expressionCards.length; staticIndex += 1) {
      expressionCards[staticIndex].classList.toggle("expr-preview-active", expressionAutoplay);
    }
    if (typeof window.IntersectionObserver === "function") {
      exprPreviewObserver = new window.IntersectionObserver(function(entries) {
        if (!expressionAutoplay) return;
        for (var ei = 0; ei < entries.length; ei += 1) {
          entries[ei].target.classList.toggle("expr-preview-active", entries[ei].isIntersecting);
        }
      }, { root: grid.parentNode, rootMargin: "80px 0px", threshold: 0.01 });
      for (var ci = 0; ci < expressionCards.length; ci += 1) exprPreviewObserver.observe(expressionCards[ci]);
    }
  }
  var SEARCHABLE = ".tk-card, .tk-emoji-button, .tk-expr-card, .tk-swatch, .tk-action";
  function panelGrids(panel) {
    return panel.querySelectorAll(".tk-grid, .tk-emoji-grid, .tk-expr-grid, .tk-action-grid");
  }
  function ensureEmptyNode(grid) {
    var node = grid.querySelector(".tk-empty");
    if (!node) {
      node = document.createElement("div");
      node.className = "tk-empty";
      node.textContent = "No match in this section.";
      grid.appendChild(node);
    }
    return node;
  }
  var bmOnly = false;
  function applyFilter() {
    var input = byId("tkSearch");
    var term = input ? input.value.trim().toLowerCase() : "";
    var clear = byId("tkSearchClear");
    if (clear) clear.hidden = term.length === 0;
    if (term) {
      try {
        expandTextStyles();
      } catch (eX) {
      }
    }
    var countEl = byId("tkBookmarkCount");
    if (countEl) countEl.textContent = String(bmCount());
    var panels = document.querySelectorAll(".tools-tab-panel");
    var totalVisible = 0;
    Array.prototype.forEach.call(panels, function(panel) {
      var panelVisible = 0;
      Array.prototype.forEach.call(panelGrids(panel), function(grid) {
        var items = grid.querySelectorAll(SEARCHABLE);
        var shown = 0;
        Array.prototype.forEach.call(items, function(item) {
          var hay = (item.getAttribute("data-search") || item.textContent || "").toLowerCase();
          var match = !term || hay.indexOf(term) !== -1;
          if (match && bmOnly) match = item.getAttribute("data-bookmarked") === "1";
          item.classList.toggle("tk-hidden", !match);
          if (match) shown++;
        });
        if (items.length) {
          var empty = ensureEmptyNode(grid);
          empty.classList.toggle("tk-hidden", shown > 0);
        }
        panelVisible += shown;
      });
      var key = panel.id.replace("tab-", "");
      var counter = document.querySelector('.tk-tab-count[data-count="' + key + '"]');
      if (counter) {
        if (key === "emoji") {
          counter.textContent = "1915";
        } else {
          counter.textContent = String(panelVisible);
        }
      }
      totalVisible += panelVisible;
    });
    var meta = byId("tkResultCount");
    if (meta) meta.textContent = term ? totalVisible + " match" + (totalVisible === 1 ? "" : "es") : "All presets";
    if (animFfxAuto) window.setTimeout(ffxSyncAutoplay, 0);
  }
  function bindSearch() {
    var star = byId("tkBookmarkFilter");
    if (star) {
      star.addEventListener("click", function() {
        bmOnly = !bmOnly;
        star.classList.toggle("is-on", bmOnly);
        star.setAttribute("aria-pressed", bmOnly ? "true" : "false");
        applyFilter();
      });
    }
    var input = byId("tkSearch");
    if (input) {
      input.addEventListener("input", tkDebounce(applyFilter, 90));
      input.addEventListener("keydown", function(event) {
        if (event.key === "Escape") {
          input.value = "";
          applyFilter();
        }
      });
    }
    var clear = byId("tkSearchClear");
    if (clear) {
      clear.addEventListener("click", function() {
        if (input) {
          input.value = "";
          input.focus();
        }
        applyFilter();
      });
    }
    document.addEventListener("keydown", function(event) {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "f") {
        event.preventDefault();
        if (input) {
          input.focus();
          input.select();
        }
      }
    });
  }
  function bindTabs() {
    var tabs = document.querySelectorAll(".tools-tab");
    Array.prototype.forEach.call(tabs, function(tab) {
      tab.addEventListener("click", function() {
        Array.prototype.forEach.call(tabs, function(other) {
          other.classList.remove("active");
          other.setAttribute("aria-selected", "false");
        });
        tab.classList.add("active");
        tab.setAttribute("aria-selected", "true");
        var panels = document.querySelectorAll(".tools-tab-panel");
        Array.prototype.forEach.call(panels, function(panel) {
          panel.classList.remove("active");
        });
        var active = byId("tab-" + tab.getAttribute("data-tab"));
        if (active) active.classList.add("active");
      });
    });
  }
  var group = "all";
  function categoryLabel(id) {
    for (var i = 0; i < ANIM_CATEGORIES.length; i += 1) {
      if (ANIM_CATEGORIES[i].id === id) {
        return lang === "bn" ? ANIM_CATEGORIES[i].labelBn : ANIM_CATEGORIES[i].label;
      }
    }
    return "All animations";
  }
  function applyGroup() {
    var grid = byId("animGrid");
    if (!grid) return;
    var shown = 0;
    Array.prototype.forEach.call(grid.querySelectorAll(".tk-card"), function(card) {
      var g = card.getAttribute("data-group");
      var off = group !== "all" && g !== group;
      card.classList.toggle("tk-group-off", off);
      if (!off) shown += 1;
    });
    var badge = byId("animCatLabel");
    if (badge) badge.textContent = categoryLabel(group);
    var count = byId("animCatCount");
    if (count) count.textContent = String(shown);
    var btn = byId("animCatBtn");
    if (btn) btn.classList.toggle("is-filtered", group !== "all");
    var menu = byId("animCatMenu");
    if (menu) {
      Array.prototype.forEach.call(menu.querySelectorAll(".tk-catmenu-item"), function(item) {
        item.classList.toggle("active", item.getAttribute("data-group") === group);
      });
    }
    var chips = document.querySelectorAll("#animGroups .tk-chip");
    Array.prototype.forEach.call(chips, function(chip) {
      chip.classList.toggle("active", chip.getAttribute("data-group") === group);
    });
  }
  function renderCategoryMenu() {
    var menu = byId("animCatMenu");
    var btn = byId("animCatBtn");
    if (!menu || !btn) return;
    menu.innerHTML = "";
    ANIM_CATEGORIES.forEach(function(cat) {
      var total = 0;
      for (var i = 0; i < ANIMATIONS.length; i += 1) {
        if (cat.id === "all" || ANIMATIONS[i].group === cat.id) total += 1;
      }
      if (!total) return;
      var item = document.createElement("button");
      item.type = "button";
      item.className = "tk-catmenu-item" + (cat.id === group ? " active" : "");
      item.setAttribute("data-group", cat.id);
      item.setAttribute("role", "menuitem");
      var name = document.createElement("span");
      name.className = "tk-catmenu-name";
      name.textContent = lang === "bn" ? cat.labelBn : cat.label;
      var num = document.createElement("span");
      num.className = "tk-catmenu-count";
      num.textContent = String(total);
      item.appendChild(name);
      item.appendChild(num);
      item.addEventListener("click", function() {
        group = cat.id;
        closeCategoryMenu();
        applyGroup();
      });
      menu.appendChild(item);
    });
  }
  function closeCategoryMenu() {
    var menu = byId("animCatMenu");
    var btn = byId("animCatBtn");
    if (menu) menu.hidden = true;
    if (btn) btn.setAttribute("aria-expanded", "false");
  }
  function bindCategoryMenu() {
    var btn = byId("animCatBtn");
    var menu = byId("animCatMenu");
    if (!btn || !menu) return;
    btn.addEventListener("click", function(event) {
      event.stopPropagation();
      var open = menu.hidden;
      if (open) renderCategoryMenu();
      menu.hidden = !open;
      btn.setAttribute("aria-expanded", open ? "true" : "false");
    });
    document.addEventListener("click", function(event) {
      if (menu.hidden) return;
      if (menu.contains(event.target) || btn.contains(event.target)) return;
      closeCategoryMenu();
    });
    document.addEventListener("keydown", function(event) {
      if (event.key === "Escape") closeCategoryMenu();
    });
    renderCategoryMenu();
  }
  function bindGroups() {
    var chips = document.querySelectorAll("#animGroups .tk-chip");
    Array.prototype.forEach.call(chips, function(chip) {
      chip.addEventListener("click", function() {
        Array.prototype.forEach.call(chips, function(c) {
          c.classList.remove("active");
        });
        chip.classList.add("active");
        group = chip.getAttribute("data-group");
        applyGroup();
      });
    });
    bindCategoryMenu();
    renderLangChips();
    var cloudRefresh = byId("cloudStyleRefresh");
    if (cloudRefresh) {
      cloudRefresh.addEventListener("click", function() {
        renderCloudTextStyles(true);
      });
    }
    var toggle = byId("tkSearchToggle");
    var box = byId("tkSearchBox");
    if (toggle && box) {
      toggle.addEventListener("click", function() {
        box.classList.toggle("open");
        if (box.classList.contains("open")) byId("tkSearch").focus();
      });
    }
  }
  function bindControls() {
    var slider = byId("animDuration");
    if (slider) {
      slider.addEventListener("input", function() {
        var value = currentDuration().toFixed(1) + "s";
        var lbl = byId("animDurationLabel");
        if (lbl) lbl.textContent = value;
        var curve = byId("curveEaseLabel");
        if (curve) curve.textContent = "Duration: " + value;
      });
    }
    var copyButton = byId("emojiCopyButton");
    if (copyButton) {
      copyButton.addEventListener("click", function() {
        try {
          var area = document.createElement("textarea");
          area.value = selectedEmoji;
          document.body.appendChild(area);
          area.select();
          document.execCommand("copy");
          document.body.removeChild(area);
          setInline("emojiStatus", "Copied " + selectedEmoji, "ok");
          toast("Copied " + selectedEmoji, "ok");
        } catch (e) {
          setInline("emojiStatus", "Copy failed.", "error");
        }
        closeEmojiModal();
      });
    }
    var insertButton = byId("emojiInsertButton");
    if (insertButton) {
      insertButton.addEventListener("click", function() {
        closeEmojiModal();
        setInline("emojiStatus", "Inserting " + selectedEmoji + "…", "");
        call("toolkitInsertEmoji", [selectedEmoji]).then(function(res) {
          reportResult("emojiStatus", res, "Inserted " + selectedEmoji);
        }).catch(function(err) {
          reportResult("emojiStatus", { ok: false, error: err.message }, "");
        });
      });
    }
    var cancelButton = byId("emojiCancelButton");
    if (cancelButton) cancelButton.addEventListener("click", closeEmojiModal);
    var modal = byId("emojiModal");
    if (modal) {
      modal.addEventListener("click", function(event) {
        if (event.target === modal) closeEmojiModal();
      });
    }
    document.addEventListener("keydown", function(event) {
      if (event.key === "Escape") closeEmojiModal();
    });
  }
  function refreshContext() {
    if (!cs) {
      setStatus("Preview mode", "ok");
      return;
    }
    call("toolkitGetContext", []).then(function(res) {
      if (!res || !res.ok) return setStatus("Host not ready", "error");
      if (typeof res.fontSize === "number" && res.fontSize > 0 && res.fontSize !== ffxRefFontSize) {
        ffxRefFontSize = res.fontSize;
        if (typeof loadFfxStyles === "function") loadFfxStyles();
      }
      if (!res.comp) return setStatus("No active comp", "pending");
      setStatus(res.selected + " layer(s) selected", "ok");
    }).catch(function() {
      setStatus("Host unavailable", "error");
    });
  }
  function loadFfx() {
    if (!cs) {
      renderFfxAnim([]);
      renderFfxColor([]);
      applyFilter();
      return;
    }
    call("toolkitListFFX", []).then(function(res) {
      var installed = [];
      if (res && res.ok && res.presets) {
        installed = res.presets.map(function(p) {
          return p.name;
        });
      }
      renderFfxAnim(installed);
      renderFfxColor(installed);
      applyFilter();
    }).catch(function() {
      renderFfxAnim([]);
      renderFfxColor([]);
      applyFilter();
    });
  }
  function reloadHostScript() {
    return ensureHostScript().catch(function(error) {
      setStatus(error.message || String(error), "error");
    });
  }
  function verifyHostBuild() {
    if (!cs) return;
    call("toolkitHostBuild", []).then(function(res) {
      var expected = window.GHOST_BUILD && window.GHOST_BUILD.version || "";
      if (!res || !res.ok) return setStatus("Host script not loaded — restart After Effects", "error");
      if (expected && res.version && res.version !== expected) {
        setStatus("Old host script running (" + res.version + ") — restart After Effects", "error");
        toast("Stale host script " + res.version + " vs panel " + expected, "error");
      }
    }).catch(function() {
    });
  }
  var FFX_GROUPS = [
    { key: "fill", label: "Fill Colour", on: true },
    { key: "stroke", label: "Stroke", on: true },
    { key: "font", label: "Font / Typeface", on: true },
    { key: "size", label: "Font Size", on: true },
    { key: "tracking", label: "Tracking", on: true },
    { key: "leading", label: "Leading", on: true },
    { key: "justification", label: "Justification", on: false },
    { key: "baseline", label: "Baseline Shift", on: false },
    { key: "effects", label: "Effects", on: true },
    { key: "layerStyles", label: "Layer Styles", on: true },
    { key: "animators", label: "Text Animators", on: false },
    { key: "moreOptions", label: "More Options", on: false },
    { key: "pathOptions", label: "Path Options", on: false },
    { key: "transform", label: "Transform", on: false },
    { key: "masks", label: "Masks", on: false },
    { key: "blend", label: "Blend Mode", on: false }
  ];
  function ffxFileUrl(path) {
    var clean = String(path).replace(/\\/g, "/");
    if (clean.charAt(0) !== "/") clean = "/" + clean;
    return "file://" + encodeURI(clean);
  }
  function renderFfxCheckList() {
    var box = byId("ffxCheckList");
    if (!box || box.childNodes.length) return;
    FFX_GROUPS.forEach(function(group2) {
      var row = document.createElement("label");
      row.className = "tk-ffx-row";
      var input = document.createElement("input");
      input.type = "checkbox";
      input.value = group2.key;
      input.checked = !!group2.on;
      input.setAttribute("data-ffx-group", group2.key);
      var text = document.createElement("span");
      text.textContent = group2.label;
      row.appendChild(input);
      row.appendChild(text);
      box.appendChild(row);
    });
  }
  function ffxSelectedGroups() {
    var out = {};
    var inputs = document.querySelectorAll("#ffxCheckList input[type=checkbox]");
    for (var i = 0; i < inputs.length; i += 1) {
      if (inputs[i].checked) out[inputs[i].value] = true;
    }
    var toggle = byId("ffxPreviewToggle");
    out.preview = !toggle || toggle.checked;
    var lock = byId("ffxRampLockToggle");
    out.rampLock = !lock || lock.checked;
    return out;
  }
  function openFfxModal() {
    renderFfxCheckList();
    var modal = byId("ffxModal");
    if (!modal) return;
    setInline("ffxModalStatus", "", "");
    modal.hidden = false;
    var input = byId("ffxNameInput");
    if (input) {
      if (!input.value) input.value = "My Text Style";
      input.focus();
      input.select();
    }
  }
  function closeFfxModal() {
    var modal = byId("ffxModal");
    if (modal) modal.hidden = true;
  }
  /* ── FFX live preview ──────────────────────────────────────────────────
   * After Effects TextDocument units (AE scripting guide), and how each one
   * maps to CSS in this preview:
   *   fillColor / strokeColor : [r,g,b] floats 0..1  -> rgb() 0..255
   *   fontSize                : PIXELS (comp pixels, NOT points, NOT fps or
   *                             pixel-aspect dependent) -> preview reference
   *   strokeWidth             : PIXELS at the layer font size, stroke is
   *                             centred on the glyph outline, exactly like
   *                             CSS -webkit-text-stroke -> scale by
   *                             previewPx / referenceFontSizePx
   *   tracking                : THOUSANDTHS OF AN EM (1/1000 em) -> em/1000
   *   tsume                   : fraction 0..1 of an em removed each side ->
   *                             subtract (tsume * 2 / 2) em from letterSpacing
   *   leading                 : PIXELS (absolute), only meaningful when
   *                             autoLeading is false -> unitless line-height
   *                             = leading / referenceFontSizePx
   *   baselineShift           : PIXELS -> em = px / referenceFontSizePx
   *   allCaps / smallCaps / fauxBold / fauxItalic / justification : booleans
   *                             / enum -> text-transform, weight, style, align
   * A .ghostffx preset only carries fontSize when the "size" group was saved.
   * When it is absent, the AE layer keeps its own size, so the preview scales
   * against the live selected text layer's fontSize (reported by
   * toolkitGetContext) and falls back to AE's 72 px default.
   * ---------------------------------------------------------------------- */
  var FFX_PREVIEW_FONT_PX = 20;
  var FFX_DEFAULT_REF_FONT_PX = 72;
  var ffxRefFontSize = FFX_DEFAULT_REF_FONT_PX;
  function ffxReferenceFontSize(doc) {
    var size = doc && typeof doc.fontSize === "number" ? doc.fontSize : ffxRefFontSize;
    if (!size || isNaN(size) || size <= 0) size = FFX_DEFAULT_REF_FONT_PX;
    return size;
  }
  function ffxStyledPreview(preset) {
    var doc = preset && preset.doc ? preset.doc : null;
    var span = document.createElement("span");
    span.className = "tk-preview-text tk-ffx-live";
    span.textContent = preset.sample || preset.name || "Aa";
    if (!doc) return span;
    var rgb = function(c) {
      if (!c || c.length < 3) return null;
      return "rgb(" + c.slice(0, 3).map(function(v) {
        return Math.max(0, Math.min(255, Math.round(v * 255)));
      }).join(",") + ")";
    };
    var refSize = ffxReferenceFontSize(doc);
    var pxToPreview = FFX_PREVIEW_FONT_PX / refSize;
    var fill = doc.applyFill === false ? null : rgb(doc.fillColor);
    var stroke = doc.applyStroke ? rgb(doc.strokeColor) : null;
    if (fill) span.style.color = fill;
    if (stroke) {
      var w = Number(doc.strokeWidth);
      if (isNaN(w) || w < 0) w = 0;
      w = w * pxToPreview;
      span.style.webkitTextStroke = (Math.round(w * 100) / 100) + "px " + stroke;
      span.style.paintOrder = doc.strokeOverFill ? "fill stroke" : "stroke fill";
    }
    var trackEm = typeof doc.tracking === "number" ? doc.tracking / 1e3 : 0;
    if (typeof doc.tsume === "number" && doc.tsume) trackEm -= doc.tsume;
    if (trackEm) span.style.letterSpacing = trackEm.toFixed(4) + "em";
    if (doc.autoLeading === false && typeof doc.leading === "number" && doc.leading > 0) {
      span.style.lineHeight = String(Math.round(doc.leading / refSize * 1e3) / 1e3);
    }
    if (typeof doc.baselineShift === "number" && doc.baselineShift) {
      span.style.position = "relative";
      span.style.bottom = (Math.round(doc.baselineShift / refSize * 1e3) / 1e3) + "em";
    }
    if (typeof doc.justification === "string") {
      if (/LEFT/i.test(doc.justification)) span.style.textAlign = "left";
      else if (/RIGHT/i.test(doc.justification)) span.style.textAlign = "right";
      else if (/CENTER/i.test(doc.justification)) span.style.textAlign = "center";
    }
    if (doc.fontFamily) span.style.fontFamily = '"' + String(doc.fontFamily).replace(/"/g, "") + '", inherit';
    if (doc.allCaps) span.style.textTransform = "uppercase";
    else if (doc.smallCaps) span.style.fontVariant = "small-caps";
    if (doc.fauxBold) span.style.fontWeight = "800";
    if (doc.fauxItalic) span.style.fontStyle = "italic";
    return span;
  }
  function ffxCard(preset) {
    var card = document.createElement("div");
    card.className = "tk-card tk-ffx-card tk-ffx-style-card";
    card.setAttribute("role", "button");
    card.setAttribute("tabindex", "0");
    card.setAttribute("data-search", (preset.name + " ffx text style " + (preset.groups || []).join(" ")).toLowerCase());
    /* Style cards are intentionally visual-only: the bundled/user PNG is the
       source of truth. No preset name, badge, duplicate/copy control or live
       CSS reconstruction is shown in the card. */
    var media = document.createElement("div");
    media.className = "tk-ffx-media";
    if (preset.preview) {
      var shot = document.createElement("img");
      shot.className = "tk-ffx-card-shot";
      shot.alt = "";
      shot.draggable = false;
      shot.addEventListener("error", function() {
        if (shot.parentNode) shot.parentNode.removeChild(shot);
        card.classList.add("is-preview-missing");
      });
      shot.src = ffxFileUrl(preset.preview);
      media.appendChild(shot);
    } else {
      card.classList.add("is-preview-missing");
    }
    /* Optional motion preview is retained for folders that already ship one;
       it never adds text or controls to the card. */
    if (preset.video) {
      var clip = document.createElement("video");
      clip.className = "tk-ffx-card-clip";
      clip.muted = true;
      clip.defaultMuted = true;
      clip.loop = true;
      clip.setAttribute("muted", "");
      clip.setAttribute("playsinline", "");
      clip.preload = "metadata";
      clip.addEventListener("loadeddata", function() { card.classList.add("is-clip-ready"); });
      clip.addEventListener("playing", function() { card.classList.add("is-clip-ready", "is-clip-on"); });
      clip.addEventListener("pause", function() { card.classList.remove("is-clip-on"); });
      clip.addEventListener("error", function() {
        card.classList.remove("is-clip-on", "is-clip-ready");
        if (clip.parentNode) clip.parentNode.removeChild(clip);
      });
      clip.src = ffxFileUrl(preset.video);
      media.appendChild(clip);
      card.addEventListener("mouseenter", function() {
        try { clip.currentTime = 0; } catch (e) {}
        var play = clip.play();
        if (play && play.catch) play.catch(function() {});
      });
      card.addEventListener("mouseleave", function() {
        try { clip.pause(); clip.currentTime = 0; } catch (e) {}
        card.classList.remove("is-clip-on");
      });
    }
    card.appendChild(media);
    /* Gradient lock is controlled from the Style header Filter menu only.
       Cards intentionally have no per-card lock control. */
    activate(card, function() {
      setInline("ffxStyleStatus", "Applying style…", "");
      /* The Filter-menu lock is the single source of truth. Read it before
         applying the FFX so the preset cannot silently change the user's
         chosen lock state. */
      call("toolkitFfxGetGradientLock", []).then(function(state) {
        var lockGradient = !!(state && state.ok && state.locked);
        return call("toolkitFfxApplyStyle", [preset.file, lockGradient ? "true" : "false"]);
      }).then(function(res) {
        if (!res || !res.ok) reportResult("ffxStyleStatus", res, "Style could not be applied.");
        else reportResult("ffxStyleStatus", res, "Style applied.");
        return res;
      }).catch(function(err) {
        reportResult("ffxStyleStatus", { ok: false, error: err.message }, "");
      });
    });
    return card;
  }
  function styleFfxFromPack() {
    if (window.GHOST_BUNDLED_STYLE_CATALOG && Array.isArray(window.GHOST_BUNDLED_STYLE_CATALOG)) {
      var root = extensionRoot();
      return Promise.resolve(window.GHOST_BUNDLED_STYLE_CATALOG.map(function(entry) {
        var file = String(entry.file || ""), base = file.replace(/\.ffx$/i, "");
        var rel = "presets/style ffx/" + file;
        var previewRel = "presets/style ffx/" + (entry.preview || (base + ".png"));
        return { name:entry.name||base, file:root?root+"/"+rel:rel, path:root?root+"/"+rel:rel, preview:root?root+"/"+previewRel:null, previewUrl:root?null:encodeURI(previewRel), groups:["style"], sample:"", savedAt:"", doc:null, bundled:true, perfect:true, rampLock:true, kind:"style-ffx", category:entry.category||"Color" };
      }));
    }
    return fetchText("presets/style ffx/pack.json").then(function(text) {
      if (!text) return [];
      var data; try { data=JSON.parse(text); } catch(e) { return []; }
      var list=data&&data.presets?data.presets:[], root=extensionRoot(), out=[];
      for(var i=0;i<list.length;i+=1){var entry=list[i];if(!entry||!entry.file)continue;var file=String(entry.file),base=file.replace(/\.ffx$/i,"");var rel="presets/style ffx/"+file;var previewRel="presets/style ffx/"+(entry.preview||(base+".png"));out.push({name:entry.name||base,file:root?root+"/"+rel:rel,path:root?root+"/"+rel:rel,preview:root?root+"/"+previewRel:null,previewUrl:root?null:encodeURI(previewRel),groups:["style"],sample:"",savedAt:"",doc:null,bundled:true,perfect:true,rampLock:true,kind:"style-ffx",category:entry.category||"Color"});}
      return out;
    }).catch(function(){return [];});
  }
  function loadFfxStyles() {
    var grid=byId("ffxStyleGrid"), empty=byId("ffxStyleEmpty");
    if(!grid)return;
    grid.innerHTML="";
    if(empty){empty.hidden=true;empty.textContent="";}
    function merge(hostList,fallbackList){var out=[],seen={};(hostList||[]).concat(fallbackList||[]).forEach(function(item){if(!item||!item.name)return;var key=String(item.name).toLowerCase();if(seen[key])return;seen[key]=1;out.push(item);});return out;}
    function paint(list){grid.innerHTML="";var styles=(list||[]).filter(function(p){return p&&(p.kind==="style-ffx"||p.kind==="style-ghostffx"||p.scope==="textStyle"||(p.groups||[]).indexOf("style")!==-1);});styles.forEach(function(p){grid.appendChild(ffxCard(p));});if(empty){empty.hidden=styles.length>0;empty.textContent=styles.length?"":"No FFX style presets available.";}applyFilter();}
    styleFfxFromPack().then(function(fallbackList){
      paint(fallbackList);
      call("toolkitFfxListStyles",[]).then(function(res){var hostList=res&&res.ok&&Array.isArray(res.presets)?res.presets:[];var merged=merge(hostList,fallbackList);if(merged.length)paint(merged);}).catch(function(){});
    }).catch(function(){call("toolkitFfxListStyles",[]).then(function(res){paint(res&&res.ok&&res.presets?res.presets:[]);}).catch(function(){paint([]);});});
  }
  function saveFfxStyle() {
    var input = byId("ffxNameInput");
    var name = input ? String(input.value || "").replace(/^\s+|\s+$/g, "") : "";
    if (!name) {
      setInline("ffxModalStatus", "Give the preset a name first.", "warn");
      return;
    }
    var groups = ffxSelectedGroups();
    var picked = 0;
    for (var key in groups) {
      if (groups.hasOwnProperty(key) && key !== "preview" && groups[key]) picked += 1;
    }
    if (!picked) {
      setInline("ffxModalStatus", "Select at least one property group.", "warn");
      return;
    }
    setInline("ffxModalStatus", "Saving preset…", "");
    call("toolkitFfxSaveStyle", [name, JSON.stringify(groups)]).then(function(res) {
      if (res && res.ok) {
        setInline("ffxModalStatus", "", "");
        closeFfxModal();
        setInline("ffxStyleStatus", name + " saved → " + res.folder, "ok");
        toast(name + " saved as FFX text style.", "ok");
        loadFfxStyles();
      } else {
        setInline("ffxModalStatus", res && res.error || "Could not save the preset.", "error");
      }
    }).catch(function(err) {
      setInline("ffxModalStatus", err.message, "error");
    });
  }
  function bindFfxStyles() {
    var importButton = byId("ffxImportButton");
    if (importButton) {
      importButton.addEventListener("click", function() {
        setInline("ffxStyleStatus", "Choose a .ffx / .ghostffx file…", "");
        call("toolkitFfxImportStyle", []).then(function(res) {
          if (res && res.cancelled) return setInline("ffxStyleStatus", "", "");
          if (res && res.ok) {
            setInline("ffxStyleStatus", res.imported.join(", ") + " imported.", "ok");
            loadFfxStyles();
          } else {
            setInline("ffxStyleStatus", res && res.error || "Import failed.", "error");
          }
        }).catch(function(err) {
          setInline("ffxStyleStatus", err.message, "error");
        });
      });
    }
    var folderButton = byId("ffxFolderButton");
    if (folderButton) {
      folderButton.addEventListener("click", function() {
        call("toolkitFfxRevealFolder", []).then(function(res) {
          reportResult("ffxStyleStatus", res, "Preset folder opened.");
        }).catch(function(err) {
          setInline("ffxStyleStatus", err.message, "error");
        });
      });
    }
    var save = byId("ffxSaveButton");
    if (save) save.addEventListener("click", saveFfxStyle);
    var native = byId("ffxNativeButton");
    if (native) {
      native.addEventListener("click", function() {
        setInline("ffxModalStatus", "Opening the After Effects preset dialog…", "");
        call("toolkitFfxNativeSave", []).then(function(res) {
          if (res && res.ok) {
            setInline("ffxModalStatus", "Save it into: " + res.folder, "ok");
          } else {
            setInline("ffxModalStatus", res && res.error || "AE dialog unavailable.", "error");
          }
        }).catch(function(err) {
          setInline("ffxModalStatus", err.message, "error");
        });
      });
    }
    var all = byId("ffxSelectAll");
    var none = byId("ffxSelectNone");
    function setAll(state) {
      var inputs = document.querySelectorAll("#ffxCheckList input[type=checkbox]");
      for (var i = 0; i < inputs.length; i += 1) inputs[i].checked = state;
    }
    if (all) all.addEventListener("click", function() {
      renderFfxCheckList();
      setAll(true);
    });
    if (none) none.addEventListener("click", function() {
      renderFfxCheckList();
      setAll(false);
    });
    var cancel = byId("ffxCancelButton");
    if (cancel) cancel.addEventListener("click", closeFfxModal);
    var modal = byId("ffxModal");
    if (modal) {
      modal.addEventListener("click", function(event) {
        if (event.target === modal) closeFfxModal();
      });
    }
    document.addEventListener("keydown", function(event) {
      if (event.key === "Escape") closeFfxModal();
    });
  }
  function boot() {
    statusEl = byId("toolkitStatus");
    toastRegion = byId("toolkitToastRegion");
    bindTabs();
    bindControls();
    bindGroups();
    bindSearch();
    bindAnimPackModal();
    renderAnimations();
    renderFfxAnim();
    renderColors();
    renderTextStyles();
    renderCloudTextStyles(false);
    renderEmojis();
    renderExpressions();
    renderCombos();
    renderTypography();
    applyFilter();
    ffxRegisterRoot();
    loadFfx();
    bindFfxStyles();
    loadFfxStyles();
    reloadHostScript().then(function() {
      verifyHostBuild();
      refreshContext();
    });
    scheduleContextRefresh();
  }
  /* Context polling used to hit the ExtendScript host every 4s forever, even
     with the panel hidden or untouched. Now it only runs while the panel is
     visible, never overlaps an in-flight call, and backs off to 20s while the
     user is working inside AE (no panel focus / no interaction). */
  var ctxTimer = 0;
  var ctxBusy = false;
  var ctxLastTouch = Date.now();
  function contextIdleDelay() {
    var idleFor = Date.now() - ctxLastTouch;
    var focused = !window.GhostIdle || window.GhostIdle.isFocused();
    if (focused && idleFor < 3e4) return 4e3;
    return 2e4;
  }
  function scheduleContextRefresh(delay) {
    if (ctxTimer) clearTimeout(ctxTimer);
    ctxTimer = setTimeout(runContextRefresh, typeof delay === "number" ? delay : contextIdleDelay());
  }
  function runContextRefresh() {
    ctxTimer = 0;
    if (window.GhostIdle && !window.GhostIdle.isVisible()) return; /* resumed by ghost:resume */
    if (ctxBusy) return scheduleContextRefresh(1e3);
    ctxBusy = true;
    try {
      refreshContext();
    } catch (e) {
    }
    ctxBusy = false;
    scheduleContextRefresh();
  }
  document.addEventListener("ghost:resume", function() {
    ctxLastTouch = Date.now();
    scheduleContextRefresh(0);
  });
  ["pointerdown", "keydown", "focusin"].forEach(function(evt) {
    document.addEventListener(evt, function() {
      var wasIdle = Date.now() - ctxLastTouch > 3e4;
      ctxLastTouch = Date.now();
      if (wasIdle) scheduleContextRefresh(0);
    }, true);
  });
  window.GhostBoot.push(boot);
  /* Public bridge used only by the bundled Web Style Presets module.
     The core call/applyFilter functions remain private to toolkit.js. */
  window.GhostWebStyleAPI = {
    call: call,
    reportResult: reportResult,
    applyFilter: applyFilter
  };
  /* Public, stable UI bridge for the Style header.  Menu actions call these
     real handlers instead of proxying clicks through hidden DOM nodes. */
  window.GhostFfxStyleUI = {
    create: function () { openFfxModal(); },
    importPreset: function () {
      var importButton = byId("ffxImportButton");
      if (importButton) { importButton.click(); return; }
      setInline("ffxStyleStatus", "Import control unavailable.", "error");
    },
    revealFolder: function () {
      call("toolkitFfxRevealFolder", []).then(function (res) {
        reportResult("ffxStyleStatus", res, "Preset folder opened.");
      }).catch(function (err) {
        setInline("ffxStyleStatus", err.message, "error");
      });
    },
    setGradientLock: function (locked) {
      return call("toolkitFfxSetGradientLock", [locked ? "true" : "false"]);
    },
    getGradientLock: function () {
      return call("toolkitFfxGetGradientLock", []);
    },
    exportPack: function () {
      return call("toolkitFfxExportStylePack", []).then(function (res) {
        if (res && res.ok) {
          setInline("ffxStyleStatus", "Preset pack exported.", "ok");
          toast("Style preset pack exported.", "ok");
        } else if (!(res && res.cancelled)) {
          setInline("ffxStyleStatus", (res && res.error) || "Export failed.", "error");
        }
        return res;
      }).catch(function (err) {
        setInline("ffxStyleStatus", err.message, "error");
        return { ok: false, error: err.message };
      });
    }
  };
  window.GhostText = window.GhostText || {};
  window.GhostText.diagnoseMotion = diagnoseMotion;
})();
/* GHOST WEB STYLE PRESETS — visual text ramps, testing only.
 * The existing Style toolbar/layout remains untouched.
 * Web cards are rendered into the original textStyleGrid so the existing
 * Style search + favourite filter infrastructure continues to work.
 */
(function(){
  "use strict";
  function byId(id){ return document.getElementById(id); }
  function api(){ return window.GhostWebStyleAPI || {}; }
  function setStatus(text,kind){
    var n=byId("textStyleStatus");
    if(!n)return;
    n.hidden=!text;
    n.textContent=text||"";
    n.className="tool-inline-status"+(kind?" "+kind:"");
  }
  function esc(s){ return String(s||"").replace(/[&<>\"]/g,function(c){return ({"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;"})[c];}); }
  function gradientCss(g){
    var colors=(g&&g.colors)||[];
    var stops=[];
    for(var i=0;i<colors.length;i++){
      var c=colors[i];
      var pos=(typeof c.position==="number")?Math.round(c.position*100):Math.round(i*100/Math.max(1,colors.length-1));
      stops.push(String(c.color||"#fff")+" "+pos+"%");
    }
    return "linear-gradient("+Number(g&&g.angle||135)+"deg,"+stops.join(",")+")";
  }
  function card(p,index){
    if(!p || !p.id || !p.gradient || !p.gradient.colors || p.gradient.colors.length!==4) return null;
    var phrases=["নতুন রঙ","স্বপ্ন ছোঁয়া","মনের কথা","রঙিন দিন","শুভ সকাল","ভালো থাকুন","আজকের গল্প","আলোর পথে","নতুন শুরু","তোমার গল্প"];
    var phrase=phrases[index%phrases.length];
    var card=document.createElement("div");
    card.className="tk-card tk-web-bangla-ramp-card";
    card.setAttribute("role","button");
    card.setAttribute("tabindex","0");
    card.setAttribute("data-search",(phrase+" "+(p.name||"")+" web preset").toLowerCase());
    card.setAttribute("data-cat","color");
    card.title=phrase;
    var preview=document.createElement("div");
    preview.className="tk-web-bangla-ramp-preview";
    preview.style.backgroundImage=gradientCss(p.gradient);
    /* bundled demo image (ramp_XX.png) sits on top; if it cannot load we
       simply keep the CSS gradient preview underneath. */
    var shot=document.createElement("img");
    shot.className="tk-web-bangla-ramp-shot";
    shot.alt=(p.name||p.id||"preset");
    shot.setAttribute("loading","lazy");
    shot.onerror=function(){ if(shot.parentNode) shot.parentNode.removeChild(shot); preview.classList.remove("has-shot"); };
    shot.onload=function(){ preview.classList.add("has-shot"); };
    shot.src="presets/web-style-testing/"+encodeURIComponent(String(p.id))+".png";
    preview.appendChild(shot);
    var glow=document.createElement("span");
    glow.className="tk-web-bangla-ramp-glow";
    preview.appendChild(glow);
    var text=document.createElement("span");
    text.className="tk-web-bangla-ramp-text";
    text.textContent=phrase;
    text.style.backgroundImage=gradientCss(p.gradient);
    text.style.webkitBackgroundClip="text";
    text.style.backgroundClip="text";
    text.style.color="transparent";
    preview.appendChild(text);
    var star=document.createElement("button");
    star.type="button";
    star.className="tk-web-bangla-ramp-star";
    star.setAttribute("aria-label","Favourite");
    star.innerHTML="<svg viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.7\"><path d=\"M11.48 3.499a.562.562 0 0 1 1.04 0l2.125 5.111a.563.563 0 0 0 .475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 0 0-.182.557l1.285 5.385a.562.562 0 0 1-.84.61l-4.725-2.885a.562.562 0 0 0-.586 0L6.982 20.54a.562.562 0 0 1-.84-.61l1.285-5.386a.563.563 0 0 0-.182-.557l-4.204-3.602a.562.562 0 0 1 .321-.988l5.518-.442a.563.563 0 0 0 .475-.345L11.48 3.5Z\"/></svg>";
    star.addEventListener("click",function(e){
      e.preventDefault(); e.stopPropagation();
      var key="ghost.toolkit.bookmarks";
      var map={};
      try{map=JSON.parse(localStorage.getItem(key)||"{}")}catch(ignore){}
      var k="web-style|"+p.id;
      map[k]=!map[k];
      try{localStorage.setItem(key,JSON.stringify(map));}catch(ignore2){}
      star.classList.toggle("is-on",!!map[k]);
      card.classList.toggle("is-bookmarked",!!map[k]);
      var global=byId("tkBookmarkFilter");
      if(global && typeof global.click==="function"){
        var active=global.getAttribute("aria-pressed")==="true";
        if(active) global.click();
        if(active) global.click();
      }
    });
    try{
      var bm={}; bm=JSON.parse(localStorage.getItem("ghost.toolkit.bookmarks")||"{}");
      if(bm["web-style|"+p.id]){star.classList.add("is-on");card.classList.add("is-bookmarked");}
    }catch(ignore3){}
    preview.appendChild(star);
    card.appendChild(preview);
    var handler=function(){
      setStatus("Applying…","");
      if(typeof api().call!=="function"){setStatus("Web preset bridge unavailable.","error");return;}
      api().call("toolkitApplyWebStylePreset",[String(p.id)]).then(function(res){
        if(typeof api().reportResult==="function") api().reportResult("textStyleStatus",res,(res&&res.ok)?"Applied.":"");
        else setStatus((res&&res.ok)?"Applied.":(res&&res.error)||"Apply failed.",res&&res.ok?"":"error");
      }).catch(function(e){setStatus(e.message||"Apply failed.","error");});
    };
    card.addEventListener("click",function(e){if(e.target===star || star.contains(e.target))return;handler();});
    card.addEventListener("keydown",function(e){if(e.key==="Enter"||e.key===" "){e.preventDefault();handler();}});
    return card;
  }
  function paintList(list){
    var grid=byId("textStyleGrid");
    if(!grid) return;
    grid.innerHTML="";
    for(var i=0;i<list.length;i++){ var c=card(list[i],i); if(c) grid.appendChild(c); }
    var empty=byId("textStyleEmpty");
    if(empty){ empty.hidden=list.length>0; empty.textContent=list.length?"":"No web presets available."; }
    try{ var apiObj=api(); if(apiObj && typeof apiObj.applyFilter==="function") apiObj.applyFilter(); }catch(ignore){}
  }
  function bundledFallback(){
    return new Promise(function(resolve,reject){
      try{
        var xhr=new XMLHttpRequest();
        xhr.open("GET","presets/web-style-testing/web-presets.json",true);
        xhr.onload=function(){
          if(xhr.status===0 || (xhr.status>=200 && xhr.status<300)){
            try{
              var data=JSON.parse(xhr.responseText||"{}");
              var list=(data&&Array.isArray(data.presets))?data.presets:[];
              resolve(list.filter(function(p){return p&&p.id&&p.gradient&&p.gradient.colors&&p.gradient.colors.length===4;}));
            }catch(e){reject(e);}
          }else reject(new Error("Bundled web preset JSON could not be read."));
        };
        xhr.onerror=function(){reject(new Error("Bundled web preset JSON could not be read."));};
        xhr.send(null);
      }catch(e){reject(e);}
    });
  }
  function load(){
    var grid=byId("textStyleGrid");
    if(!grid)return;
    var empty=byId("textStyleEmpty");
    if(empty){empty.hidden=false;empty.textContent="Loading web presets\u2026";}
    /* The bundled JSON is the only source that carries the 4-colour gradient,
       so it is always the source of truth for rendering. Applying still goes
       through the host by preset id. */
    bundledFallback().then(paintList).catch(function(e){
      if(empty){empty.hidden=false;empty.textContent=(e&&e.message)||"Could not load web presets.";}
    });
  }
  window.GhostBoot.push(function(){setTimeout(load,80);});
  window.GhostWebStyleTesting={reload:load};
})();
/* ══════════════════════════════════════════════════════════════
   GHOST — User Presets (My Animations / My Colours)
   Save an animation or a colour set from the selected AE layer,
   browse them, apply them back, delete them.
   ══════════════════════════════════════════════════════════════ */
(function () {
  "use strict";
  var cs = null;
  try { cs = (typeof CSInterface !== "undefined") ? new CSInterface() : null; } catch (e) { cs = null; }
  function esc(value) {
    return String(value).replace(/\\/g, "\\\\").replace(/"/g, '\\"');
  }
  function evalScript(script) {
    return new Promise(function (resolve, reject) {
      if (!cs) return reject(new Error("CEP bridge unavailable"));
      try {
        cs.evalScript(script, function (result) {
          var raw = result == null ? "" : String(result);
          if (raw === "" || raw === "undefined" || raw === "null") {
            return reject(new Error("GHOST host script is not loaded — restart After Effects."));
          }
          if (raw.indexOf("EvalScript error") === 0) return reject(new Error(raw));
          try { resolve(JSON.parse(raw)); }
          catch (err) { reject(new Error("Unexpected host reply: " + raw.slice(0, 160))); }
        });
      } catch (err) { reject(err); }
    });
  }
  function hostPath() {
    if (!cs || !cs.getSystemPath) return "";
    try {
      var root = cs.getSystemPath("extension");
      return root ? String(root).replace(/\\/g, "/") + "/js/host.jsx" : "";
    } catch (e) { return ""; }
  }
  var loading = null;
  function ensureHost() {
    if (!cs) return Promise.reject(new Error("Open this panel inside After Effects."));
    if (loading) return loading;
    loading = new Promise(function (resolve, reject) {
      var probe = 'typeof GhostHost !== "undefined" && GhostHost.toolkitAnimListPresets ? "ok" : "__MISSING__"';
      cs.evalScript(probe, function (result) {
        if (String(result) === "ok") { loading = null; return resolve(); }
        var path = hostPath();
        if (!path) { loading = null; return reject(new Error("Extension path unavailable.")); }
        var load = '$.evalFile(new File("' + esc(path) + '")); typeof GhostHost !== "undefined" && GhostHost.toolkitAnimListPresets ? "ok" : "__FAILED__"';
        cs.evalScript(load, function (loaded) {
          loading = null;
          if (String(loaded) !== "ok") return reject(new Error("Host script could not load."));
          resolve();
        });
      });
    });
    return loading;
  }
  function call(fn, args) {
    var parts = (args || []).map(function (a) { return '"' + esc(a) + '"'; });
    return ensureHost().then(function () {
      return evalScript("GhostHost." + fn + "(" + parts.join(",") + ")");
    });
  }
  function fileUrl(path) {
    var clean = String(path).replace(/\\/g, "/");
    if (clean.charAt(0) !== "/") clean = "/" + clean;
    return "file://" + encodeURI(clean);
  }
  function setStatus(id, text, cls) {
    var el = document.getElementById(id);
    if (!el) return;
    el.textContent = text || "";
    el.className = "tool-inline-status " + (cls || "");
    el.hidden = !text;
  }
  function el(tag, cls, text) {
    var node = document.createElement(tag);
    if (cls) node.className = cls;
    if (text != null) node.textContent = text;
    return node;
  }
  function buildSection(cfg) {
    var host = document.getElementById(cfg.tabId);
    if (!host || document.getElementById(cfg.gridId)) return;
    var wrap = el("div", "tk-up-section");
    wrap.id = cfg.sectionId;
    var head = el("div", "tk-up-head");
    head.appendChild(el("h3", "tk-up-title", cfg.title));
    var folderBtn = el("button", "tk-up-mini", "Folder");
    folderBtn.type = "button";
    folderBtn.title = "Open the preset folder";
    folderBtn.addEventListener("click", function () {
      call("toolkitPresetRevealFolder", [cfg.kind]).catch(function () {});
    });
    head.appendChild(folderBtn);
    wrap.appendChild(head);
    var bar = el("div", "tk-up-bar");
    var input = document.createElement("input");
    input.type = "text";
    input.id = cfg.inputId;
    input.className = "tk-up-input";
    input.maxLength = 64;
    input.placeholder = cfg.placeholder;
    bar.appendChild(input);
    var saveBtn = el("button", "tk-up-save", cfg.saveLabel);
    saveBtn.type = "button";
    saveBtn.title = cfg.saveTitle;
    bar.appendChild(saveBtn);
    wrap.appendChild(bar);
    var grid = el("div", "tk-grid tk-up-grid");
    grid.id = cfg.gridId;
    wrap.appendChild(grid);
    var status = el("div", "tool-inline-status");
    status.id = cfg.statusId;
    status.hidden = true;
    wrap.appendChild(status);
    host.appendChild(wrap);
    function save() {
      var name = (input.value || "").replace(/^\s+|\s+$/g, "");
      if (!name) {
        setStatus(cfg.statusId, "Type a preset name first.", "error");
        input.focus();
        return;
      }
      setStatus(cfg.statusId, "Saving " + name + "…", "");
      call(cfg.saveFn, [name]).then(function (res) {
        if (res && res.ok) {
          setStatus(cfg.statusId, name + " saved.", "ok");
          input.value = "";
          load();
        } else {
          setStatus(cfg.statusId, (res && res.error) || "Could not save.", "error");
        }
      }).catch(function (err) {
        setStatus(cfg.statusId, err.message, "error");
      });
    }
    saveBtn.addEventListener("click", save);
    input.addEventListener("keydown", function (ev) {
      if (ev.key === "Enter") { ev.preventDefault(); save(); }
    });
    function card(preset) {
      var node = el("div", "tk-card tk-up-card");
      node.setAttribute("role", "button");
      node.setAttribute("tabindex", "0");
      node.title = preset.name + (preset.source ? " — from " + preset.source : "");
      node.setAttribute("data-search", (preset.name + " " + cfg.searchTag).toLowerCase());
      if (cfg.kind === "color") {
        var sw = el("span", "tk-up-swatch");
        var c = preset.swatch;
        sw.style.background = (c && c.length === 3)
          ? "rgb(" + c[0] + "," + c[1] + "," + c[2] + ")"
          : "linear-gradient(135deg,#7c5cff,#22d3ee)";
        node.appendChild(sw);
      } else if (preset.preview) {
        var img = document.createElement("img");
        img.className = "tk-up-shot";
        img.alt = preset.name;
        img.addEventListener("error", function () {
          if (img.parentNode) img.parentNode.removeChild(img);
        });
        img.src = fileUrl(preset.preview);
        node.appendChild(img);
      } else {
        node.appendChild(el("span", "tk-up-glyph", "✦"));
      }
      var del = el("button", "tk-up-del", "✕");
      del.type = "button";
      del.title = "Delete preset";
      del.addEventListener("click", function (ev) {
        ev.stopPropagation();
        call(cfg.deleteFn, [preset.file]).then(function () {
          setStatus(cfg.statusId, preset.name + " deleted.", "ok");
          load();
        }).catch(function (err) {
          setStatus(cfg.statusId, err.message, "error");
        });
      });
      node.appendChild(del);
      node.appendChild(el("span", "tk-up-name", preset.name));
      function apply() {
        setStatus(cfg.statusId, "Applying " + preset.name + "…", "");
        call(cfg.applyFn, [preset.file]).then(function (res) {
          if (res && res.ok) setStatus(cfg.statusId, preset.name + " applied.", "ok");
          else setStatus(cfg.statusId, (res && res.error) || "Could not apply.", "error");
        }).catch(function (err) {
          setStatus(cfg.statusId, err.message, "error");
        });
      }
      node.addEventListener("click", apply);
      node.addEventListener("keydown", function (ev) {
        if (ev.key === "Enter" || ev.key === " ") { ev.preventDefault(); apply(); }
      });
      return node;
    }
    function load() {
      call(cfg.listFn, []).then(function (res) {
        grid.innerHTML = "";
        var presets = (res && res.ok && res.presets) ? res.presets : [];
        if (!presets.length) {
          grid.appendChild(el("div", "tk-up-empty", cfg.emptyText));
          return;
        }
        presets.forEach(function (p) { grid.appendChild(card(p)); });
      }).catch(function () {
        grid.innerHTML = "";
        grid.appendChild(el("div", "tk-up-empty", cfg.emptyText));
      });
    }
    load();
  }
  function boot() {
    /* v3.41.1 — "My Animations" and "My Colours" sections are retired by
       request. Nothing is registered here any more. */
  }
  window.GhostBoot.push(boot);
})();
(function() {
  "use strict";
  var cs = null;
  try {
    cs = new CSInterface();
  } catch (e) {
    cs = null;
  }
  var PRESETS = [
    { key: "drop-fade", name: "Drop Fade", state: { opacity: 0, posY: 60, scale: 100, rotZ: 0, rotX: 0, rotY: 0, blur: 0, tracking: 0, skew: 0, shape: "square", easeHigh: 40, easeLow: 0, duration: 18, stagger: 4 } },
    { key: "blur-in", name: "Blur In", state: { opacity: 0, posY: 0, scale: 100, rotZ: 0, rotX: 0, rotY: 0, blur: 24, tracking: 12, skew: 0, shape: "rampup", easeHigh: 70, easeLow: 0, duration: 22, stagger: 5 } },
    { key: "scale-pop", name: "Scale Pop", state: { opacity: 0, posY: 0, scale: 0, rotZ: 0, rotX: 0, rotY: 0, blur: 0, tracking: 0, skew: 0, shape: "triangle", easeHigh: 85, easeLow: -40, duration: 14, stagger: 3 } },
    { key: "rotate-3d", name: "3D Flip", state: { opacity: 0, posY: 0, scale: 100, rotZ: 0, rotX: 90, rotY: 0, blur: 0, tracking: 0, skew: 0, shape: "square", easeHigh: 60, easeLow: 0, duration: 20, stagger: 5 } },
    { key: "swing-in", name: "Swing In", state: { opacity: 0, posY: 30, scale: 120, rotZ: -25, rotX: 0, rotY: 0, blur: 0, tracking: 0, skew: 20, shape: "round", easeHigh: 75, easeLow: -25, duration: 24, stagger: 6 } },
    { key: "tracking-slide", name: "Tracking Slide", state: { opacity: 0, posY: 0, scale: 100, rotZ: 0, rotX: 0, rotY: 0, blur: 6, tracking: 60, skew: 0, shape: "smooth", easeHigh: 90, easeLow: 0, duration: 26, stagger: 3 } }
  ];
  var state = {
    presetKey: "drop-fade",
    presetName: "Drop Fade",
    text: "GHOST KINETIC TEXT",
    opacity: 0,
    posY: 60,
    scale: 80,
    rotZ: 0,
    rotX: 0,
    rotY: 0,
    blur: 10,
    tracking: 0,
    skew: 0,
    color: "#1473e6",
    useColor: false,
    start: 0,
    end: 100,
    offset: 0,
    basis: "chars",
    shape: "square",
    easeHigh: 0,
    easeLow: 0,
    randomize: false,
    duration: 18,
    stagger: 4,
    direction: "in"
  };
  function byId(id) {
    return document.getElementById(id);
  }
  function toast(text, cls) {
    var region = byId("toolkitToastRegion") || byId("toolsToastRegion");
    if (!region) return;
    var node = document.createElement("div");
    node.className = "toast " + (cls || "");
    node.textContent = text;
    region.appendChild(node);
    setTimeout(function() {
      node.style.transition = "opacity .3s";
      node.style.opacity = "0";
      setTimeout(function() {
        if (node.parentNode) node.parentNode.removeChild(node);
      }, 300);
    }, 2400);
  }
  function setStatus(text, cls) {
    var el = byId("advStatus");
    if (!el) return;
    el.textContent = text || "";
    el.className = "tool-inline-status " + (cls || "");
    el.hidden = !text;
  }
  function evalScript(script) {
    return new Promise(function(resolve, reject) {
      if (!cs) return reject(new Error("CEP bridge unavailable"));
      try {
        cs.evalScript(script, function(result) {
          var raw = result == null ? "" : String(result);
          if (raw === "" || raw === "undefined" || raw === "null") {
            return reject(new Error("GHOST host script is not loaded — restart After Effects."));
          }
          if (raw.indexOf("EvalScript error") === 0) return reject(new Error(raw));
          try {
            resolve(JSON.parse(raw));
          } catch (e) {
            reject(new Error("Unexpected host reply: " + raw.slice(0, 160)));
          }
        });
      } catch (err) {
        reject(err);
      }
    });
  }
  function esc(value) {
    return String(value).replace(/\\/g, "\\\\").replace(/"/g, '\\"');
  }
  function keyframes() {
    var tag = byId("advKeyframes");
    if (!tag) {
      tag = document.createElement("style");
      tag.id = "advKeyframes";
      document.head.appendChild(tag);
    }
    tag.innerHTML = "@keyframes ghostAdvAnim {\n  0% { opacity: " + state.opacity / 100 + "; transform: translateY(" + state.posY + "px) scale(" + state.scale / 100 + ") rotateX(" + state.rotX + "deg) rotateY(" + state.rotY + "deg) rotate(" + state.rotZ + "deg) skewX(" + state.skew + "deg); filter: blur(" + state.blur + "px); letter-spacing: " + state.tracking / 10 + "px;" + (state.useColor ? " color: " + state.color + ";" : "") + " }\n  100% { opacity: 1; transform: none; filter: blur(0); letter-spacing: normal; }\n}";
  }
  function renderStage() {
    var stage = byId("advStage");
    if (!stage) return;
    stage.innerHTML = "";
    var chars = String(state.text || " ").split("");
    var total = chars.length;
    var duration = state.duration / 10;
    var stagger = state.stagger / 100;
    chars.forEach(function(char, index) {
      var span = document.createElement("span");
      span.className = "adv-char";
      span.textContent = char === " " ? " " : char;
      var order = state.randomize ? Math.abs(Math.round(Math.sin(index * 777) * total)) % Math.max(total, 1) : index;
      var delay = state.direction === "out" ? (total - order) * stagger : order * stagger;
      span.style.animation = "ghostAdvAnim " + duration + "s cubic-bezier(.16,1,.3,1) " + delay + "s infinite alternate";
      stage.appendChild(span);
    });
    keyframes();
  }
  function replay() {
    keyframes();
    renderStage();
  }
  var SLIDERS = [
    ["advOpacity", "opacity", "advOpacityVal", function(v) {
      return v;
    }],
    ["advPosY", "posY", "advPosYVal", function(v) {
      return v;
    }],
    ["advScale", "scale", "advScaleVal", function(v) {
      return v;
    }],
    ["advRotZ", "rotZ", "advRotZVal", function(v) {
      return v;
    }],
    ["advRotX", "rotX", "advRotXVal", function(v) {
      return v;
    }],
    ["advRotY", "rotY", "advRotYVal", function(v) {
      return v;
    }],
    ["advBlur", "blur", "advBlurVal", function(v) {
      return v;
    }],
    ["advTracking", "tracking", "advTrackingVal", function(v) {
      return v;
    }],
    ["advSkew", "skew", "advSkewVal", function(v) {
      return v;
    }],
    ["advStart", "start", "advStartVal", function(v) {
      return v;
    }],
    ["advEnd", "end", "advEndVal", function(v) {
      return v;
    }],
    ["advOffset", "offset", "advOffsetVal", function(v) {
      return v;
    }],
    ["advEaseHigh", "easeHigh", "advEaseHighVal", function(v) {
      return v;
    }],
    ["advEaseLow", "easeLow", "advEaseLowVal", function(v) {
      return v;
    }],
    ["advDuration", "duration", "advDurationVal", function(v) {
      return (v / 10).toFixed(1) + "s";
    }],
    ["advStagger", "stagger", "advStaggerVal", function(v) {
      return (v / 100).toFixed(2) + "s";
    }]
  ];
  function syncControls() {
    SLIDERS.forEach(function(entry) {
      var input = byId(entry[0]);
      var label = byId(entry[2]);
      if (input) input.value = state[entry[1]];
      if (label) label.textContent = entry[3](Number(state[entry[1]]));
    });
    var shape = byId("advShape");
    if (shape) shape.value = state.shape;
    var basis = byId("advBasis");
    if (basis) basis.value = state.basis;
    var dir = byId("advDirection");
    if (dir) dir.value = state.direction;
    var rand = byId("advRandomize");
    if (rand) rand.checked = !!state.randomize;
    var useColor = byId("advUseColor");
    if (useColor) useColor.checked = !!state.useColor;
    var color = byId("advColor");
    if (color) color.value = state.color;
    var preset = byId("advPreset");
    if (preset) preset.value = state.presetKey;
  }
  function applyPreset(key) {
    var preset = null;
    for (var i = 0; i < PRESETS.length; i += 1) if (PRESETS[i].key === key) preset = PRESETS[i];
    if (!preset) return;
    state.presetKey = preset.key;
    state.presetName = preset.name;
    Object.keys(preset.state).forEach(function(prop) {
      state[prop] = preset.state[prop];
    });
    syncControls();
    replay();
    setStatus("Preset loaded: " + preset.name + " — tweak and apply.", "ok");
  }
  function applyToAe(createLayer) {
    var payload = JSON.stringify({
      presetName: state.presetName,
      text: state.text,
      createLayer: !!createLayer,
      opacity: state.opacity,
      posY: state.posY,
      scale: state.scale,
      rotZ: state.rotZ,
      rotX: state.rotX,
      rotY: state.rotY,
      blur: state.blur,
      tracking: state.tracking,
      skew: state.skew,
      color: state.color,
      useColor: state.useColor,
      start: state.start,
      end: state.end,
      offset: state.offset,
      basis: state.basis,
      shape: state.shape,
      easeHigh: state.easeHigh,
      easeLow: state.easeLow,
      randomize: state.randomize,
      duration: state.duration / 10,
      stagger: state.stagger / 100,
      direction: state.direction
    });
    if (!cs) {
      setStatus("Preview mode — open Ghostae Text inside After Effects to apply.", "warn");
      toast("Preview only: Advance Animation", "warn");
      return;
    }
    setStatus("Applying editable animator…", "pending");
    evalScript('GhostHost.toolkitApplyAdvancedAnimation("' + esc(payload) + '")').then(function(res) {
      if (res && res.ok) {
        var msg = (res.animator || "Animator") + " applied to " + res.applied + " layer(s) — editable in AE.";
        setStatus(msg, "ok");
        toast(msg, "ok");
      } else {
        var err = res && res.error ? res.error : "Failed to apply animation.";
        setStatus(err, "error");
        toast(err, "error");
      }
    }).catch(function(error) {
      setStatus(error.message || String(error), "error");
      toast("Apply failed.", "error");
    });
  }
  function bind() {
    var preset = byId("advPreset");
    if (preset) {
      preset.innerHTML = PRESETS.map(function(p) {
        return '<option value="' + p.key + '">' + p.name + "</option>";
      }).join("");
      preset.addEventListener("change", function(event) {
        applyPreset(event.target.value);
      });
    }
    SLIDERS.forEach(function(entry) {
      var input = byId(entry[0]);
      if (!input) return;
      input.addEventListener("input", function(event) {
        state[entry[1]] = Number(event.target.value);
        var label = byId(entry[2]);
        if (label) label.textContent = entry[3](Number(event.target.value));
        replay();
      });
    });
    [["advShape", "shape"], ["advBasis", "basis"], ["advDirection", "direction"]].forEach(function(pair) {
      var el = byId(pair[0]);
      if (!el) return;
      el.addEventListener("change", function(event) {
        state[pair[1]] = event.target.value;
        replay();
      });
    });
    var rand = byId("advRandomize");
    if (rand) rand.addEventListener("change", function(e) {
      state.randomize = e.target.checked;
      replay();
    });
    var useColor = byId("advUseColor");
    if (useColor) useColor.addEventListener("change", function(e) {
      state.useColor = e.target.checked;
      replay();
    });
    var color = byId("advColor");
    if (color) color.addEventListener("input", function(e) {
      state.color = e.target.value;
      state.useColor = true;
      syncControls();
      replay();
    });
    var text = byId("advText");
    if (text) text.addEventListener("input", function(e) {
      state.text = e.target.value;
      renderStage();
    });
    var replayBtn = byId("advReplay");
    if (replayBtn) replayBtn.addEventListener("click", replay);
    var apply = byId("advApply");
    if (apply) apply.addEventListener("click", function() {
      applyToAe(false);
    });
    var applyNew = byId("advApplyNew");
    if (applyNew) applyNew.addEventListener("click", function() {
      applyToAe(true);
    });
    var reset = byId("advReset");
    if (reset) reset.addEventListener("click", function() {
      applyPreset("drop-fade");
    });
  }
  function boot() {
    if (!byId("advStage")) return;
    bind();
    var text = byId("advText");
    if (text && text.value) state.text = text.value;
    syncControls();
    replay();
  }
  window.GhostBoot.push(boot);
})();
/* Ghostae Text — icon system (v3.13.0)
 * One inline SVG sprite, stroke-based, currentColor so it follows the theme.
 * Inlined as a JS string on purpose: CEP runs from file:// where external
 * <use href="file.svg#id"> and fetch() are both unreliable.
 * Usage in markup:  <svg class="gi"><use href="#gi-play"></use></svg>
 *            or:    <button data-gi="save" data-gi-size="20">Save</button>
 */
(function (global) {
  "use strict";
  if (global.GhostIcons) return;
  var P = {
    play: '<path d="M6 4.5l11 5.5-11 5.5z"/>',
    pause: '<path d="M7 4v12M13 4v12"/>',
    apply: '<path d="M3.5 10.5l4 4 9-9"/>',
    copy: '<rect x="7" y="7" width="9" height="9" rx="2"/><path d="M13 7V5a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h2"/>',
    save: '<path d="M4 3h9l3 3v11H4z"/><path d="M7 3v5h6V3M7 17v-5h6v5"/>',
    trash: '<path d="M3.5 5.5h13M8 5.5V4h4v1.5M5.5 5.5l.8 11h7.4l.8-11"/>',
    duplicate: '<rect x="3" y="3" width="10" height="10" rx="2"/><path d="M7 17h8a2 2 0 0 0 2-2V7"/>',
    search: '<circle cx="9" cy="9" r="5.5"/><path d="M13.2 13.2L17 17"/>',
    filter: '<path d="M3 4.5h14l-5.5 6.5v4.5l-3 1.5V11z"/>',
    refresh: '<path d="M16.5 8A6.5 6.5 0 1 0 16 12.5"/><path d="M16.5 4v4h-4"/>',
    settings: '<circle cx="10" cy="10" r="2.6"/><path d="M10 2.5v2M10 15.5v2M2.5 10h2M15.5 10h2M4.7 4.7l1.4 1.4M13.9 13.9l1.4 1.4M15.3 4.7l-1.4 1.4M6.1 13.9l-1.4 1.4"/>',
    lock: '<rect x="4.5" y="8.5" width="11" height="8" rx="2"/><path d="M7 8.5V6a3 3 0 0 1 6 0v2.5"/>',
    sparkle: '<path d="M10 2.5l1.7 4.3 4.3 1.7-4.3 1.7L10 14.5 8.3 10.2 4 8.5l4.3-1.7z"/><path d="M15.5 13.5l.7 1.8 1.8.7-1.8.7-.7 1.8-.7-1.8-1.8-.7 1.8-.7z"/>',
    download: '<path d="M10 3v9M6 9l4 4 4-4M4 16.5h12"/>',
    chevron: '<path d="M7.5 4.5l5 5.5-5 5.5"/>',
    grid: '<rect x="3" y="3" width="6" height="6" rx="1.5"/><rect x="11" y="3" width="6" height="6" rx="1.5"/><rect x="3" y="11" width="6" height="6" rx="1.5"/><rect x="11" y="11" width="6" height="6" rx="1.5"/>',
    list: '<path d="M6.5 5.5h11M6.5 10h11M6.5 14.5h11M3 5.5h.01M3 10h.01M3 14.5h.01"/>',
    eye: '<path d="M1.8 10S4.9 4.8 10 4.8 18.2 10 18.2 10 15.1 15.2 10 15.2 1.8 10 1.8 10z"/><circle cx="10" cy="10" r="2.4"/>',
    undo: '<path d="M6 7H3.5V4.5"/><path d="M3.9 7.4A6.5 6.5 0 1 1 3.5 12"/>',
    sun: '<circle cx="10" cy="10" r="3.4"/><path d="M10 2v2M10 16v2M2 10h2M16 10h2M4.6 4.6L6 6M14 14l1.4 1.4M15.4 4.6L14 6M6 14l-1.4 1.4"/>',
    moon: '<path d="M16 11.6A6.5 6.5 0 0 1 8.4 4a6.6 6.6 0 1 0 7.6 7.6z"/>',
    contrast: '<circle cx="10" cy="10" r="7"/><path d="M10 3v14a7 7 0 0 0 0-14z" fill="currentColor" stroke="none"/>'
  };
  function sprite() {
    var out = '<svg class="ghost-icon-sprite" aria-hidden="true" focusable="false">';
    for (var k in P) {
      if (!Object.prototype.hasOwnProperty.call(P, k)) continue;
      out += '<symbol id="gi-' + k + '" viewBox="0 0 20 20">' + P[k] + "</symbol>";
    }
    return out + "</svg>";
  }
  function markup(name, size) {
    if (!P[name]) return "";
    var cls = "gi" + (size === 20 ? " gi-20" : size === 24 ? " gi-24" : "");
    return '<svg class="' + cls + '" aria-hidden="true" focusable="false"><use href="#gi-' + name + '"></use></svg>';
  }
  function mount(doc) {
    var d = doc || global.document;
    if (!d || !d.body || d.getElementById("ghostIconSprite")) return;
    var host = d.createElement("div");
    host.id = "ghostIconSprite";
    host.setAttribute("aria-hidden", "true");
    host.className = "ghost-icon-sprite";
    host.innerHTML = sprite();
    d.body.insertBefore(host, d.body.firstChild);
  }
  /* Upgrade any element carrying data-gi="name" — non-destructive:
     the icon is prepended, existing label text stays where it is. */
  function upgrade(root) {
    var scope = root || global.document;
    if (!scope || !scope.querySelectorAll) return;
    var nodes = scope.querySelectorAll("[data-gi]:not([data-gi-done])");
    for (var i = 0; i < nodes.length; i += 1) {
      var el = nodes[i];
      var html = markup(el.getAttribute("data-gi"), parseInt(el.getAttribute("data-gi-size"), 10));
      if (!html) continue;
      el.insertAdjacentHTML("afterbegin", html);
      el.setAttribute("data-gi-done", "1");
      if (!el.getAttribute("aria-label") && !el.textContent.trim()) {
        el.setAttribute("aria-label", el.getAttribute("title") || el.getAttribute("data-gi"));
      }
    }
  }
  function boot() {
    mount(global.document);
    upgrade(global.document);
  }
  global.GhostIcons = { names: Object.keys(P), markup: markup, mount: mount, upgrade: upgrade };
  if (global.document) {
    global.GhostBoot.push(boot);
  }
})(typeof window !== "undefined" ? window : this);
/* Ghostae Text — UI uplift runtime (v3.13.0)
 * Theme switcher, tab keyboard navigation, editable slider values,
 * empty states, keyboard shortcuts, success feedback.
 * Purely additive: it never renames or removes an existing id/class,
 * so every binding in js/toolkit.js keeps working.
 */
(function (global) {
  "use strict";
  var doc = global.document;
  if (!doc || global.GhostUI) return;
  var perf = global.GhostPerf || {};
  var debounce =
    perf.debounce ||
    function (fn, ms) {
      var t = 0;
      return function () {
        var a = arguments, s = this;
        clearTimeout(t);
        t = setTimeout(function () { fn.apply(s, a); }, ms || 90);
      };
    };
  var THEME_KEY = "ghost.ui.theme";
  var THEMES = [
    { id: "dark", icon: "moon", label: "AE Dark" },
    { id: "darkest", icon: "contrast", label: "AE Darkest" },
    { id: "light", icon: "sun", label: "AE Light" }
  ];
  function readTheme() {
    try { return global.localStorage.getItem(THEME_KEY) || "dark"; } catch (e) { return "dark"; }
  }
  function setTheme(id) {
    doc.documentElement.setAttribute("data-ghost-theme", id);
    try { global.localStorage.setItem(THEME_KEY, id); } catch (e) {}
    var btns = doc.querySelectorAll(".ghost-theme-switch button");
    for (var i = 0; i < btns.length; i += 1) {
      btns[i].setAttribute("aria-pressed", btns[i].getAttribute("data-theme") === id ? "true" : "false");
    }
  }
  function mountThemeSwitch() {
    doc.documentElement.setAttribute("data-ghost-theme", "dark");
  }
  function wireAutoAnimate() {
    /* Removed in 3.40.1: each preset section owns its own play/pause button
       (see bindSectionPlayButtons in toolkit.js). Kept as a guarded no-op for
       older builds that still ship the global toolbar button. */
    var btn = doc.getElementById("autoAnimateBtn");
    if (!btn || btn.getAttribute("data-ghost-wired")) return;
    btn.setAttribute("data-ghost-wired", "1");
    var sync = function () {
      var paused = doc.body.classList.contains("disable-auto-animate");
      btn.setAttribute("aria-pressed", paused ? "false" : "true");
      btn.setAttribute("title", paused ? "Play card previews" : "Pause card previews");
    };
    btn.addEventListener("click", function () {
      doc.body.classList.toggle("disable-auto-animate");
      sync();
    });
    sync();
  }
  function wireTabs() {
    var bar = doc.querySelector('.tools-tabs[role="tablist"]');
    if (!bar || bar.getAttribute("data-ghost-keys")) return;
    bar.setAttribute("data-ghost-keys", "1");
    bar.addEventListener("keydown", function (ev) {
      var key = ev.key;
      if (key !== "ArrowRight" && key !== "ArrowLeft" && key !== "Home" && key !== "End") return;
      var tabs = [];
      var all = bar.querySelectorAll('[role="tab"]');
      for (var i = 0; i < all.length; i += 1) {
        if (all[i].offsetParent !== null) tabs.push(all[i]);
      }
      if (!tabs.length) return;
      var idx = tabs.indexOf(doc.activeElement);
      if (idx < 0) idx = 0;
      var next =
        key === "Home" ? 0 :
        key === "End" ? tabs.length - 1 :
        key === "ArrowRight" ? (idx + 1) % tabs.length :
        (idx - 1 + tabs.length) % tabs.length;
      ev.preventDefault();
      tabs[next].focus();
      tabs[next].click();
    });
    var sync = function () {
      var all = bar.querySelectorAll('[role="tab"]');
      for (var i = 0; i < all.length; i += 1) {
        all[i].tabIndex = all[i].classList.contains("active") ? 0 : -1;
      }
    };
    bar.addEventListener("click", function () { setTimeout(sync, 0); });
    sync();
  }
  function wireSliderValues(root) {
    var rows = (root || doc).querySelectorAll(".adv-row:not([data-ghost-num])");
    for (var i = 0; i < rows.length; i += 1) {
      (function (row) {
        var range = row.querySelector('input[type="range"]');
        var out = row.querySelector("b");
        if (!range || !out) return;
        row.setAttribute("data-ghost-num", "1");
        out.setAttribute("title", "Click to type a value");
        out.style.cursor = "text";
        out.addEventListener("click", function (ev) {
          ev.preventDefault();
          ev.stopPropagation();
          if (row.querySelector(".ghost-num")) return;
          var input = doc.createElement("input");
          input.type = "number";
          input.className = "ghost-num";
          input.value = range.value;
          input.min = range.min;
          input.max = range.max;
          input.step = range.step || "any";
          out.style.display = "none";
          out.parentNode.insertBefore(input, out);
          input.focus();
          input.select();
          var commit = function (apply) {
            if (apply && input.value !== "") {
              range.value = input.value;
              range.dispatchEvent(new Event("input", { bubbles: true }));
              range.dispatchEvent(new Event("change", { bubbles: true }));
            }
            input.remove();
            out.style.display = "";
          };
          input.addEventListener("blur", function () { commit(true); });
          input.addEventListener("keydown", function (ev) {
            if (ev.key === "Enter") { ev.preventDefault(); commit(true); }
            if (ev.key === "Escape") { ev.preventDefault(); commit(false); }
          });
        });
      })(rows[i]);
    }
  }
  var GRIDS = ["animGrid", "colorGrid", "emojiGrid", "exprGrid"];
  function visibleCount(grid) {
    var n = 0;
    var kids = grid.children;
    for (var i = 0; i < kids.length; i += 1) {
      var el = kids[i];
      if (el.classList && el.classList.contains("ghost-empty")) continue;
      if (el.hidden) continue;
      if (el.style && el.style.display === "none") continue;
      if (el.classList && (el.classList.contains("tk-hidden") || el.classList.contains("is-hidden") || el.classList.contains("tk-empty"))) continue;
      n += 1;
    }
    return n;
  }
  function findSearchFor(grid) {
    var panel = grid.closest ? grid.closest(".tools-tab-panel") : null;
    var local = panel
      ? panel.querySelector('input[type="search"], input[type="text"][id*="earch"], input[placeholder*="earch"]')
      : null;
    return local || doc.getElementById("tkSearch");
  }
  function syncEmpty(grid) {
    /* The toolkit already renders its own ".tk-empty" node when a filter
       matches nothing — enhance that one instead of adding a second. */
    var native = grid.querySelector(".tk-empty");
    if (native) {
      native.classList.add("ghost-empty");
      if (!native.getAttribute("role")) native.setAttribute("role", "status");
      addClear(native, grid);
      var own = grid.querySelector(":scope > .ghost-empty[data-ghost-own]");
      if (own) own.remove();
      return;
    }
    var node = grid.querySelector(":scope > .ghost-empty[data-ghost-own]");
    if (visibleCount(grid) > 0) {
      if (node) node.remove();
      return;
    }
    if (node) return;
    node = doc.createElement("div");
    node.className = "ghost-empty";
    node.setAttribute("data-ghost-own", "1");
    node.setAttribute("role", "status");
    node.innerHTML =
      (global.GhostIcons ? global.GhostIcons.markup("search", 24) : "") +
      "<div>No matches found</div>";
    addClear(node, grid);
    grid.appendChild(node);
  }
  function addClear(node, grid) {
    if (node.querySelector("[data-ghost-clear]")) return;
    var search = findSearchFor(grid);
    if (!search || !search.value) return;
    var btn = doc.createElement("button");
    btn.type = "button";
    btn.setAttribute("data-ghost-clear", "1");
    btn.textContent = "Clear search";
    btn.addEventListener("click", function () {
      search.value = "";
      search.dispatchEvent(new Event("input", { bubbles: true }));
      search.focus();
    });
    node.appendChild(btn);
  }
  function wireEmptyStates() {
    if (!global.MutationObserver) return;
    GRIDS.forEach(function (id) {
      var grid = doc.getElementById(id);
      if (!grid || grid.getAttribute("data-ghost-empty")) return;
      grid.setAttribute("data-ghost-empty", "1");
      var run = debounce(function () { syncEmpty(grid); }, 120);
      new global.MutationObserver(run).observe(grid, {
        childList: true,
        subtree: true,
        attributes: true,
        attributeFilter: ["style", "hidden", "class"]
      });
      run();
    });
  }
  function activeSearch() {
    var panel = doc.querySelector(".tools-tab-panel.active") || doc;
    return (
      panel.querySelector('input[type="search"], input[placeholder*="earch"], input[id*="earch"]') ||
      doc.getElementById("tkSearch")
    );
  }
  function wireShortcuts() {
    if (doc.body.getAttribute("data-ghost-keys")) return;
    doc.body.setAttribute("data-ghost-keys", "1");
    doc.addEventListener("keydown", function (ev) {
      var mod = ev.ctrlKey || ev.metaKey;
      if (mod && (ev.key === "f" || ev.key === "F")) {
        var s = activeSearch();
        if (s) { ev.preventDefault(); s.focus(); s.select(); }
        return;
      }
      if (ev.key === "Escape") {
        var el = doc.activeElement;
        if (el && el.tagName === "INPUT" && el.value) {
          el.value = "";
          el.dispatchEvent(new Event("input", { bubbles: true }));
        }
      }
    });
  }
  function wirePulse() {
    if (doc.body.getAttribute("data-ghost-pulse")) return;
    doc.body.setAttribute("data-ghost-pulse", "1");
    doc.addEventListener(
      "click",
      function (ev) {
        var btn = ev.target && ev.target.closest ? ev.target.closest("button") : null;
        if (!btn || btn.disabled) return;
        var label = ((btn.textContent || "") + " " + (btn.title || "")).toLowerCase();
        if (!/apply|save|copy|create|add/.test(label)) return;
        btn.classList.remove("ghost-pulse");
        void btn.offsetWidth;
        btn.classList.add("ghost-pulse");
        setTimeout(function () { btn.classList.remove("ghost-pulse"); }, 600);
      },
      true
    );
  }
  function refresh() {
    if (global.GhostIcons) global.GhostIcons.upgrade(doc);
    mountThemeSwitch();
    wireTabs();
    wireSliderValues(doc);
    wireEmptyStates();
    wireAutoAnimate();
  }
  function boot() {
    setTheme(readTheme());
    refresh();
    wireShortcuts();
    wirePulse();
    if (global.MutationObserver) {
      /* Re-wiring is only meaningful when new elements land. Ignore text and
         attribute churn (preview animations, counters) so a busy panel does
         not re-run the icon/tab pass hundreds of times per minute. */
      var run = debounce(refresh, 600);
      global.GhostObserver.onBodyMutation(function (records) {
        for (var i = 0; i < records.length; i += 1) {
          var added = records[i].addedNodes;
          for (var j = 0; j < added.length; j += 1) {
            if (added[j].nodeType === 1) return run();
          }
        }
      });
    }
  }
  global.GhostUI = { setTheme: setTheme, refresh: refresh };
  global.GhostBoot.push(boot);
})(typeof window !== "undefined" ? window : this);
/* Ghostae Text — tab bar layout (v3.40.0)
 * The old "⋯" overflow chip is gone. Tabs stay in the strip; when the panel is
 * narrow they shrink to icon-only and the strip scrolls horizontally instead of
 * hiding anything behind a menu.
 */
(function (global) {
  "use strict";
  var doc = global.document;
  if (!doc || global.GhostTabBar) return;
  var bar, raf = 0;
  function build() {
    bar = doc.querySelector('.tools-tabs[role="tablist"]');
    if (!bar) return false;
    var junk = doc.querySelectorAll(".ghost-more, .ghost-more-pop");
    for (var i = 0; i < junk.length; i += 1) {
      var el = junk[i];
      while (el.firstChild) {
        if (el.firstChild.getAttribute && el.firstChild.getAttribute("role") === "tab") bar.appendChild(el.firstChild);
        else el.removeChild(el.firstChild);
      }
      if (el.parentNode) el.parentNode.removeChild(el);
    }
    return true;
  }
  function layout() {
    if (!bar && !build()) return;
    bar.classList.remove("compact");
    if (bar.scrollWidth > bar.clientWidth + 2) bar.classList.add("compact");
  }
  function schedule() {
    if (raf) global.cancelAnimationFrame(raf);
    raf = global.requestAnimationFrame(function () { raf = 0; layout(); });
  }
  function boot() {
    if (!build()) return;
    schedule();
    if (global.ResizeObserver) new global.ResizeObserver(schedule).observe(bar.parentNode || bar);
    global.addEventListener("resize", schedule);
  }
  global.GhostTabBar = { refresh: schedule };
  global.GhostBoot.push(boot);
})(typeof window !== "undefined" ? window : this);
/*!
 * Ghostae Text — Plan status indicator (v1.0.0)
 *
 * A single check-badge icon sits in the top bar, right after the Expressions
 * tab. It reports one thing only: is this panel's licence verified with the
 * Ghostae server right now?
 *
 *   green  → plan active, last server verification succeeded
 *   red    → problem: licence blocked / revoked / expired, mandatory update,
 *            or the server could not be reached
 *
 * Purely presentational: state is read from GhostCloud / ghost-control-gate,
 * never decided here.
 */
(function () {
  'use strict';
  var ICON =
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' +
    '<path d="M9 12.75 11.25 15 15 9.75"/>' +
    '<path d="M12 2.25c-1.06 0-2.062.474-2.734 1.293a2.25 2.25 0 0 1-1.548.83 2.25 2.25 0 0 0-2.245 2.245 2.25 2.25 0 0 1-.83 1.548A2.25 2.25 0 0 0 3.75 9.75c0 .414.083.816.24 1.18a2.25 2.25 0 0 1 0 2.14 2.25 2.25 0 0 0 1.083 3 2.25 2.25 0 0 1 1.548.83 2.25 2.25 0 0 0 2.245 2.245 2.25 2.25 0 0 1 1.548.83c.672.82 1.673 1.293 2.734 1.293s2.062-.474 2.734-1.293a2.25 2.25 0 0 1 1.548-.83 2.25 2.25 0 0 0 2.245-2.245 2.25 2.25 0 0 1 .83-1.548c.82-.672 1.293-1.673 1.293-2.734s-.474-2.062-1.293-2.734a2.25 2.25 0 0 1-.83-1.548 2.25 2.25 0 0 0-2.245-2.245 2.25 2.25 0 0 1-1.548-.83A3.987 3.987 0 0 0 12 2.25Z"/></svg>';
  var STYLE =
    '.ghost-plan-dot{display:inline-flex;align-items:center;justify-content:center;' +
    'width:26px;height:26px;flex:0 0 auto;margin:0 2px;border:0;background:transparent;' +
    'border-radius:999px;cursor:default;transition:color .2s ease,background-color .2s ease}' +
    '.ghost-plan-dot svg{width:18px;height:18px}' +
    '.ghost-plan-dot.is-ok{color:#22c55e;background:rgba(34,197,94,.12)}' +
    '.ghost-plan-dot.is-bad{color:#ef4444;background:rgba(239,68,68,.14)}' +
    '.ghost-plan-dot.is-wait{color:#5b9dff;background:rgba(91,157,255,.12)}';
  function injectStyle() {
    if (document.getElementById('ghost-plan-dot-style')) return;
    var s = document.createElement('style');
    s.id = 'ghost-plan-dot-style';
    s.textContent = STYLE;
    (document.head || document.documentElement).appendChild(s);
  }
  function licensed() {
    try {
      if (window.GhostCloud && typeof window.GhostCloud.isLicensed === 'function')
        return !!window.GhostCloud.isLicensed();
    } catch (e) {}
    try {
      return document.body.getAttribute('data-ghost-licensed') === '1';
    } catch (e) {}
    return false;
  }
  function state() {
    if (window.GHOST_LICENSE_BLOCKED === true) return 'bad';
    if (window.GHOST_UPDATE_REQUIRED === true) return 'bad';
    if (!licensed()) return 'bad';
    if (window.GHOST_LICENSE_VERIFIED_AT) return 'ok';
    return 'wait';
  }
  function label(st) {
    if (st === 'ok') return 'Plan active — licence verified';
    if (st === 'wait') return 'Checking licence with the Ghostae server…';
    if (window.GHOST_UPDATE_REQUIRED === true) return 'Update required — download the latest build';
    if (window.GHOST_LICENSE_STATUS) return 'Licence problem: ' + window.GHOST_LICENSE_STATUS;
    return 'Licence problem — panel locked';
  }
  var node = null;
  function mount() {
    if (node && node.parentNode) return true;
    var right = document.querySelector('.tools-header .tk-right-actions');
    if (!right) return false;
    injectStyle();
    node = document.createElement('span');
    node.className = 'ghost-plan-dot is-wait';
    node.id = 'ghostPlanDot';
    node.innerHTML = ICON;
    right.insertBefore(node, right.firstChild);
    return true;
  }
  function paint() {
    if (!mount()) return;
    var st = state();
    node.className = 'ghost-plan-dot is-' + (st === 'ok' ? 'ok' : st === 'wait' ? 'wait' : 'bad');
    node.title = label(st);
    node.setAttribute('aria-label', node.title);
  }
  window.GhostPlanStatus = { refresh: paint };
  function start() {
    paint();
    if (!start._timer) start._timer = setInterval(paint, 5000);
    document.addEventListener('ghost-license-state', paint);
    try {
      /* This observer intentionally remains attribute-scoped. The shared
         GhostObserver watches childList/subtree only, so routing this here
         would silently break license-state updates. */
      if (global.MutationObserver && document.body) {
        new global.MutationObserver(paint).observe(document.body, {
          attributes: true,
          attributeFilter: ['data-ghost-licensed']
        });
      }
    } catch (e) {}
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start);
  else start();
})();
/*!
 * Ghostae Text — Menu 2027 (v3.28.0)
 * Presentation-only re-arrangement of the existing toolbar controls:
 *  • top bar keeps just the search field and one 6-dot overflow menu
 *  • overflow menu proxies clicks to the panel's existing preset / cloud /
 *    upgrade buttons (the original nodes are moved, never re-implemented)
 *  • the favourites filter moves into the animation section toolbar
 *  • category + language controls move into a bottom overflow menu
 * No preset logic, animation or data flow is modified.
 */
(function () {
    'use strict';
    var SVG = {
        dots: '<svg viewBox="0 0 20 20" fill="currentColor" aria-hidden="true"><circle cx="7" cy="10" r="1.7"/><circle cx="13" cy="10" r="1.7"/></svg>',
        plus: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 4v16m8-8H4"/></svg>',
        importIco: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M9 13h6m-3-3v6m-9 1V7a2 2 0 012-2h6l2 2h6a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2z"/></svg>',
        exportIco: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"/></svg>',
        cloud: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M7 18a4 4 0 010-8 5.5 5.5 0 0110.6-1.5A3.75 3.75 0 0117 18H7z"/></svg>',
        rocket: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M15.6 14.4a6 6 0 01-5.85 7.35v-4.8m5.85-2.55A15 15 0 0021.75 2.25 15 15 0 009.6 8.4m6 6a15 15 0 01-5.85 2.6m-.1-8.55a6 6 0 00-7.4 5.85h4.8"/></svg>',
        planActive: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M9 12.75 11.25 15 15 9.75"/><path d="M12 2.25c-1.06 0-2.062.474-2.734 1.293a2.25 2.25 0 0 1-1.548.83 2.25 2.25 0 0 0-2.245 2.245 2.25 2.25 0 0 1-.83 1.548A2.25 2.25 0 0 0 3.75 9.75c0 .414.083.816.24 1.18a2.25 2.25 0 0 1 0 2.14 2.25 2.25 0 0 0 1.083 3 2.25 2.25 0 0 1 1.548.83 2.25 2.25 0 0 0 2.245 2.245 2.25 2.25 0 0 1 1.548.83c.672.82 1.673 1.293 2.734 1.293s2.062-.474 2.734-1.293a2.25 2.25 0 0 1 1.548-.83 2.25 2.25 0 0 0 2.245-2.245 2.25 2.25 0 0 1 .83-1.548c.82-.672 1.293-1.673 1.293-2.734s-.474-2.062-1.293-2.734a2.25 2.25 0 0 1-.83-1.548 2.25 2.25 0 0 0-2.245-2.245 2.25 2.25 0 0 1-1.548-.83A3.987 3.987 0 0 0 12 2.25Z"/></svg>'
    };
    /* Whether the current key/device is licensed right now. Read fresh on every
       call rather than cached, since activation can happen while the panel
       is already open (no reload). */
    function isLicensed() {
        try {
            if (window.GhostCloud && typeof window.GhostCloud.isLicensed === 'function') {
                return !!window.GhostCloud.isLicensed();
            }
        } catch (e) {}
        try {
            return document.body.getAttribute('data-ghost-licensed') === '1';
        } catch (e) {
            return false;
        }
    }
    function el(tag, cls, html) {
        var n = document.createElement(tag);
        if (cls) n.className = cls;
        if (html) n.innerHTML = html;
        return n;
    }
    var openPop = null;
    function closeOpen() {
        if (!openPop) return;
        openPop.pop.hidden = true;
        openPop.btn.classList.remove('is-open');
        openPop.btn.setAttribute('aria-expanded', 'false');
        openPop = null;
    }
    document.addEventListener('click', function (e) {
        if (openPop && !openPop.wrap.contains(e.target)) closeOpen();
    }, true);
    document.addEventListener('keydown', function (e) {
        if (e.key === 'Escape') closeOpen();
    });
    function makeMenu(opts) {
        var wrap = el('div', 'gm-wrap');
        var btn = el('button', 'gm-dots' + (opts.btnClass ? ' ' + opts.btnClass : ''), SVG.dots);
        btn.type = 'button';
        btn.title = opts.title || 'More options';
        btn.setAttribute('aria-haspopup', 'true');
        btn.setAttribute('aria-expanded', 'false');
        var pop = el('div', 'gm-pop' + (opts.popClass ? ' ' + opts.popClass : ''));
        pop.hidden = true;
        pop.setAttribute('role', 'menu');
        btn.addEventListener('click', function (e) {
            e.stopPropagation();
            var wasOpen = openPop && openPop.pop === pop;
            closeOpen();
            if (wasOpen) return;
            pop.hidden = false;
            btn.classList.add('is-open');
            btn.setAttribute('aria-expanded', 'true');
            openPop = { wrap: wrap, btn: btn, pop: pop };
        });
        wrap.appendChild(btn);
        wrap.appendChild(pop);
        return { wrap: wrap, pop: pop, btn: btn };
    }
    function item(label, icon, ink, onClick) {
        var b = el('button', 'gm-item' + (ink ? ' gm-ink-' + ink : ''), '<span class="gm-item-icon">' + icon + '</span><span>' + label + '</span>');
        b.type = 'button';
        b.setAttribute('role', 'menuitem');
        b.addEventListener('click', function () {
            closeOpen();
            onClick();
        });
        return b;
    }
    function proxy(selector, tabName) {
        return function () {
            if (tabName) {
                var tab = document.querySelector('.tools-tab[data-tab="' + tabName + '"]');
                if (tab && !tab.classList.contains('active')) tab.click();
            }
            var target = document.querySelector(selector);
            if (target) setTimeout(function () { target.click(); }, tabName ? 80 : 0);
        };
    }
    function syncLangLabel(langWrap) {
        var btn = langWrap.querySelector('.tk-langbtn');
        var menu = langWrap.querySelector('.tk-langmenu');
        if (!btn) return;
        var label = btn.querySelector('.gm-lang-name');
        if (!label) {
            label = el('span', 'gm-lang-name');
            btn.appendChild(label);
        }
        function read() {
            var active = menu && menu.querySelector('.tk-langmenu-item.active .tk-langmenu-name');
            var txt = active ? active.textContent.trim() : '';
            label.textContent = txt || (btn.getAttribute('title') || '').replace(/^[^—]*—\s*/, '') || 'English';
        }
        read();
        if (menu) {
            new MutationObserver(read).observe(menu, { subtree: true, attributes: true, childList: true });
        }
        new MutationObserver(read).observe(btn, { attributes: true, attributeFilter: ['title'] });
    }
    function build() {
        var header = document.querySelector('.tools-header');
        var right = header && header.querySelector('.tk-right-actions');
        var toolbar = document.querySelector('#tab-anim .tk-panel-toolbar');
        if (!right || right.querySelector('.gm-wrap')) return;
        var top = makeMenu({ title: 'More options' });
        var createPresetBtn = item('Create Preset', isLicensed() ? SVG.planActive : SVG.plus, isLicensed() ? 'emerald' : 'indigo', proxy('#ffxSaveButton', 'color'));
        createPresetBtn.classList.add('gm-item-create-preset');
        top.pop.appendChild(createPresetBtn);
        top.pop.appendChild(item('Import Preset', SVG.importIco, 'blue', proxy('#ffxImportButton', 'color')));
        top.pop.appendChild(item('Preset Folder', SVG.exportIco, 'cyan', proxy('#ffxFolderButton', 'color')));
        top.pop.appendChild(el('div', 'gm-sep'));
        var upgrade = document.querySelector('.tk-right-actions .plan-upgrade-button');
        if (upgrade) {
            top.pop.appendChild(item('Upgrade Plan', SVG.rocket, 'amber', function () { upgrade.click(); }));
        }
        right.appendChild(top.wrap);
        /* Create Preset's icon doubles as the panel's plan-status indicator
           (saving a custom FFX preset is a paid-plan feature): a plain "+"
           means no active plan, a check-badge means the license is active
           right now. Re-checked whenever the menu opens and whenever the
           license state changes, since activation can happen live without
           reloading the panel. */
        function refreshCreatePresetIcon() {
            var btn = document.querySelector('.gm-item-create-preset');
            if (!btn) return;
            var iconWrap = btn.querySelector('.gm-item-icon');
            var licensed = isLicensed();
            if (iconWrap) iconWrap.innerHTML = licensed ? SVG.planActive : SVG.plus;
            btn.classList.toggle('gm-ink-emerald', licensed);
            btn.classList.toggle('gm-ink-indigo', !licensed);
            btn.title = licensed ? 'Create Preset — plan active' : 'Create Preset';
        }
        top.btn.addEventListener('click', refreshCreatePresetIcon);
        try {
            new MutationObserver(refreshCreatePresetIcon).observe(document.body, {
                attributes: true,
                attributeFilter: ['data-ghost-licensed']
            });
        } catch (e) {}
        var bm = document.getElementById('tkBookmarkFilter');
        if (bm && toolbar) toolbar.appendChild(bm);
        if (toolbar) {
            var bottom = makeMenu({ title: 'Category & language' });
            var cat = toolbar.querySelector('.tk-catbtn-wrap');
            var lang = toolbar.querySelector('.tk-langbtn-wrap');
            if (cat) bottom.pop.appendChild(cat);
            if (lang) bottom.pop.appendChild(lang);
            if (cat || lang) toolbar.appendChild(bottom.wrap);
            if (lang) syncLangLabel(lang);
        }
    }
    window.GhostBoot.push(function () { setTimeout(build, 60); });
})();
/*!
 * Ghostae Text — Panel 2028 (v3.31.0)
 * Presentation layer only. Re-arranges existing controls and adds small
 * UI utilities on top of ghost-menu-2027.js:
 *  • animation grid gets "FFX Presets" + "Web Presets" section headers with a
 *    hairline rule; the existing bottom toolbar moves into the Web Presets row
 *  • the bottom overflow becomes a 3-dot menu: All animations, Advance
 *    animation, Language, Settings
 *  • Settings sheet: autoplay-on-open, favourites import/export, FFX manage
 * No preset, animation or apply logic is modified.
 */
(function () {
    'use strict';
    var BM_KEY = 'ghost.toolkit.bookmarks';
    var AUTOPLAY_KEY = 'ghost.toolkit.autoplayOnOpen';
    var SVG = {
        dots3: '<svg viewBox="0 0 20 20" fill="currentColor" aria-hidden="true"><circle cx="4.5" cy="10" r="1.6"/><circle cx="10" cy="10" r="1.6"/><circle cx="15.5" cy="10" r="1.6"/></svg>',
        wand: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 20l9-9"/><path d="M14.5 4.5l1 2.5 2.5 1-2.5 1-1 2.5-1-2.5-2.5-1 2.5-1 1-2.5z"/><path d="M18.5 14l.7 1.8 1.8.7-1.8.7-.7 1.8-.7-1.8-1.8-.7 1.8-.7.7-1.8z"/></svg>',
        gear: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="2.9"/><path d="M19.3 14.2a1.5 1.5 0 00.3 1.7 1.9 1.9 0 01-2.7 2.7 1.5 1.5 0 00-2.5 1v.3a1.9 1.9 0 01-3.8 0v-.2a1.5 1.5 0 00-2.5-1 1.9 1.9 0 01-2.7-2.7 1.5 1.5 0 00-1-2.5H4.2a1.9 1.9 0 010-3.8h.2a1.5 1.5 0 001-2.5 1.9 1.9 0 012.7-2.7 1.5 1.5 0 002.5-1V3.9a1.9 1.9 0 013.8 0v.2a1.5 1.5 0 002.5 1 1.9 1.9 0 012.7 2.7 1.5 1.5 0 001 2.5h.2a1.9 1.9 0 010 3.8h-.2a1.5 1.5 0 00-1.3.9z"/></svg>',
        share: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4.5 15.5v2.5a2 2 0 002 2h11a2 2 0 002-2v-2.5"/><path d="M12 3.8v10.4M12 3.8L8.4 7.4M12 3.8l3.6 3.6"/></svg>',
        inbox: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4.5 14.5v3.5a2 2 0 002 2h11a2 2 0 002-2v-3.5"/><path d="M12 3.8v10.4M12 14.2L8.4 10.6M12 14.2l3.6-3.6"/></svg>',
        cloud: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M7.2 18.2a3.9 3.9 0 01-.2-7.8 5.4 5.4 0 0110.4-1.4 3.7 3.7 0 01-.4 9.2H7.2z"/></svg>',
        folder: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3.6 8.4V6.6A1.6 1.6 0 015.2 5h3.9l1.9 1.9h6.9a1.6 1.6 0 011.6 1.6v9.3a1.6 1.6 0 01-1.6 1.6H5.2a1.6 1.6 0 01-1.6-1.6V8.4z"/></svg>',
        globe: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="8.4"/><path d="M3.6 12h16.8M12 3.6c2.1 2.4 3.2 5.2 3.2 8.4s-1.1 6-3.2 8.4c-2.1-2.4-3.2-5.2-3.2-8.4s1.1-6 3.2-8.4z"/></svg>',
        grid: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="3.8" y="3.8" width="6.6" height="6.6" rx="1.8"/><rect x="13.6" y="3.8" width="6.6" height="6.6" rx="1.8"/><rect x="3.8" y="13.6" width="6.6" height="6.6" rx="1.8"/><rect x="13.6" y="13.6" width="6.6" height="6.6" rx="1.8"/></svg>',
        star: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 4.5l2.35 4.76 5.26.77-3.8 3.7.9 5.24L12 16.5l-4.71 2.47.9-5.24-3.8-3.7 5.26-.77L12 4.5z"/></svg>',
        filter: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 6.2h16M6.8 12h10.4M10 17.8h4"/></svg>'
    };
    function el(tag, cls, html) {
        var n = document.createElement(tag);
        if (cls) n.className = cls;
        if (html != null) n.innerHTML = html;
        return n;
    }
    function ls(key, fallback) {
        try { var v = window.localStorage.getItem(key); return v == null ? fallback : v; } catch (e) { return fallback; }
    }
    function lsSet(key, value) {
        try { window.localStorage.setItem(key, value); } catch (e) {}
    }
    function toast(msg, cls) {
        var region = document.getElementById('toolkitToastRegion') || document.getElementById('toolsToastRegion');
        if (!region) return;
        var n = el('div', 'toast ' + (cls || ''), '');
        n.textContent = msg;
        region.appendChild(n);
        setTimeout(function () { if (n.parentNode) n.parentNode.removeChild(n); }, 2600);
    }
    function buildSections() {
        /* The static markup in toolkit.html already ships both section heads
           (Perfect Presets + Web Presets) with their own play toggle, so this
           no longer injects a second "Web Presets" row or relocates the
           toolbar — that is what produced the duplicate play button. */
        return;
    }
    function upgradeBottomMenu() {
        var panel = document.getElementById('tab-anim');
        var wrap = panel && panel.querySelector('.gm-wrap');
        if (!wrap || wrap.dataset.gp2) return;
        wrap.dataset.gp2 = '1';
        var btn = wrap.querySelector('.gm-dots');
        var pop = wrap.querySelector('.gm-pop');
        if (btn) {
            btn.innerHTML = SVG.dots3;
            btn.title = 'Panel menu';
        }
        if (!pop) return;
        function item(label, icon, onClick) {
            var b = el('button', 'gm-item', icon + '<span>' + label + '</span>');
            b.type = 'button';
            b.setAttribute('role', 'menuitem');
            b.addEventListener('click', function () {
                pop.hidden = true;
                if (btn) btn.classList.remove('is-open');
                onClick();
            });
            return b;
        }
        var advance = item('Advance animation', SVG.wand, function () {
            var tab = document.querySelector('.tools-tab[data-tab="advanced"]');
            if (tab) tab.click();
        });
        var langWrap = pop.querySelector('.tk-langbtn-wrap');
        if (langWrap) {
            pop.insertBefore(advance, langWrap);
            /* the old inline flag button is replaced by one tidy row that
               opens the language sheet — animation language only */
            langWrap.hidden = true;
            langWrap.style.display = 'none';
        } else {
            pop.appendChild(advance);
        }
        var animLangRow = item('Language', SVG.globe, function () { openLangSheet('anim'); });
        animLangRow.classList.add('gp2-lang-row');
        animLangRow.setAttribute('data-scope', 'anim');
        animLangRow.appendChild(el('span', 'gp2-lang-current', langLabel('anim')));
        if (langWrap) pop.insertBefore(animLangRow, langWrap);
        else pop.appendChild(animLangRow);
        pop.appendChild(el('div', 'gm-sep'));
        pop.appendChild(item('Export favourites', SVG.share, exportFavourites));
        pop.appendChild(item('Import favourites', SVG.inbox, importFavourites));
        pop.appendChild(item('Settings', SVG.gear, openSettings));
    }
    function langApi() { return window.GhostToolkitLang || null; }
    function langLabel(scope) {
        var api = langApi();
        if (!api) return '';
        return api.labelOf(scope === 'style' ? api.styleLang() : api.animLang());
    }
    function syncLangRows() {
        var rows = document.querySelectorAll('.gp2-lang-row .gp2-lang-current');
        for (var i = 0; i < rows.length; i += 1) {
            var scope = rows[i].parentNode.getAttribute('data-scope') || 'anim';
            rows[i].textContent = langLabel(scope);
        }
    }
    function openLangSheet(scope) {
        var api = langApi();
        if (!api) return;
        var old = document.getElementById('gp2LangSheet');
        if (old) old.remove();
        var current = scope === 'style' ? api.styleLang() : api.animLang();
        var wrap = el('div', 'gp2-sheet-wrap');
        wrap.id = 'gp2LangSheet';
        var sheet = el('div', 'gp2-sheet gp2-lang-sheet');
        sheet.setAttribute('role', 'dialog');
        sheet.setAttribute('aria-label', 'Preview language');
        sheet.appendChild(el('h3', null,
            (scope === 'style' ? 'Style' : 'Animation') + ' preview language' +
            '<small>Only the preview words change — every preset keeps the same effect.</small>'));
        var list = el('div', 'gp2-lang-list');
        api.languages().forEach(function (info) {
            var b = el('button', 'gp2-lang-opt' + (info.id === current ? ' is-active' : ''),
                '<span class="gp2-lang-flag">' + info.flag + '</span><span class="gp2-lang-name"></span>');
            b.type = 'button';
            var nameEl = b.querySelector('.gp2-lang-name');
            nameEl.textContent = info.label;
            nameEl.style.fontFamily = info.font;
            b.addEventListener('click', function () {
                if (scope === 'style') api.setStyleLang(info.id);
                else api.setAnimLang(info.id);
                wrap.remove();
                syncLangRows();
            });
            list.appendChild(b);
        });
        sheet.appendChild(list);
        var foot = el('div', 'gp2-sheet-foot');
        var done = el('button', 'gp2-btn gp2-btn-primary', 'Done');
        done.type = 'button';
        done.addEventListener('click', function () { wrap.remove(); });
        foot.appendChild(done);
        sheet.appendChild(foot);
        wrap.appendChild(sheet);
        wrap.addEventListener('click', function (e) { if (e.target === wrap) wrap.remove(); });
        document.addEventListener('keydown', function esc(e) {
            if (e.key === 'Escape') { wrap.remove(); document.removeEventListener('keydown', esc); }
        });
        document.body.appendChild(wrap);
    }
    function exportFavourites() {
        var raw = ls(BM_KEY, '[]');
        var blob = new Blob([JSON.stringify({ ghostFavourites: 1, savedAt: new Date().toISOString(), items: JSON.parse(raw || '[]') }, null, 2)], { type: 'application/json' });
        var a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = 'ghostae-favourites.json';
        document.body.appendChild(a);
        a.click();
        setTimeout(function () {
            URL.revokeObjectURL(a.href);
            if (a.parentNode) a.parentNode.removeChild(a);
        }, 400);
        toast('Favourites exported.', 'ok');
    }
    function importFavourites() {
        var input = document.createElement('input');
        input.type = 'file';
        input.accept = '.json,application/json';
        input.addEventListener('change', function () {
            var file = input.files && input.files[0];
            if (!file) return;
            var reader = new FileReader();
            reader.onload = function () {
                try {
                    var parsed = JSON.parse(String(reader.result || '{}'));
                    var items = parsed && parsed.items ? parsed.items : parsed;
                    if (!items || typeof items !== 'object') throw new Error('bad file');
                    lsSet(BM_KEY, JSON.stringify(items));
                    toast('Favourites restored — reloading…', 'ok');
                    setTimeout(function () { window.location.reload(); }, 500);
                } catch (e) {
                    toast('That file is not a favourites backup.', 'error');
                }
            };
            reader.readAsText(file);
        });
        input.click();
    }
    function autoplayOn() { return ls(AUTOPLAY_KEY, '1') !== '0'; }
    function openSettings() {
        var old = document.getElementById('gp2Settings');
        if (old) old.remove();
        var wrap = el('div', 'gp2-sheet-wrap');
        wrap.id = 'gp2Settings';
        wrap.innerHTML =
            '<div class="gp2-sheet" role="dialog" aria-label="Panel settings">' +
            '<h3>Panel settings</h3>' +
            '<div class="gp2-row"><div class="gp2-row-main">Autoplay previews on open<small>Cards animate as soon as the panel loads.</small></div>' +
            '<button type="button" class="gp2-switch" data-act="autoplay" aria-pressed="' + (autoplayOn() ? 'true' : 'false') + '" aria-label="Autoplay previews"></button></div>' +
            '<div class="gp2-row"><div class="gp2-row-main">Favourites backup<small>Export now, import after a reinstall.</small></div>' +
            '<button type="button" class="gp2-btn" data-act="fav-export">Export</button>' +
            '<button type="button" class="gp2-btn" data-act="fav-import">Import</button></div>' +
            '<div class="gp2-row"><div class="gp2-row-main">Manage FFX presets<small>Open your saved FFX list to remove one.</small></div>' +
            '<button type="button" class="gp2-btn" data-act="ffx">Open</button></div>' +
            '<div class="gp2-sheet-foot"><button type="button" class="gp2-btn gp2-btn-primary" data-act="close">Done</button></div>' +
            '</div>';
        document.body.appendChild(wrap);
        wrap.addEventListener('click', function (e) {
            var t = e.target.closest ? e.target.closest('[data-act]') : null;
            if (e.target === wrap) { wrap.remove(); return; }
            if (!t) return;
            var act = t.getAttribute('data-act');
            if (act === 'close') wrap.remove();
            else if (act === 'autoplay') {
                var on = t.getAttribute('aria-pressed') !== 'true';
                t.setAttribute('aria-pressed', on ? 'true' : 'false');
                lsSet(AUTOPLAY_KEY, on ? '1' : '0');
                if (window.GhostToolkitAutoplay) window.GhostToolkitAutoplay.set(on);
            } else if (act === 'fav-export') exportFavourites();
            else if (act === 'fav-import') importFavourites();
            else if (act === 'ffx') {
                wrap.remove();
                var tab = document.querySelector('.tools-tab[data-tab="color"]');
                if (tab) tab.click();
                setTimeout(function () {
                    var grid = document.getElementById('ffxStyleGrid');
                    if (grid && grid.scrollIntoView) grid.scrollIntoView({ behavior: 'smooth', block: 'center' });
                }, 260);
            }
        });
        document.addEventListener('keydown', function esc(e) {
            if (e.key === 'Escape') { wrap.remove(); document.removeEventListener('keydown', esc); }
        });
    }
    function dropLegacyFavExport() {
        var old = document.querySelector('.gp2-fav-export');
        if (old && old.parentNode) old.parentNode.removeChild(old);
    }
    function exportStylePresets() {
        /* CEP-safe export: use the ExtendScript host's native Save dialog. The
           old Blob/anchor download path is unreliable in some CEP builds. */
        if (window.GhostFfxStyleUI && window.GhostFfxStyleUI.exportPack) {
            window.GhostFfxStyleUI.exportPack();
            return;
        }
        var cards = document.querySelectorAll('#textStyleGrid .tk-card, #ffxStyleGrid .tk-card');
        var items = [];
        for (var i = 0; i < cards.length; i += 1) {
            var t = String(cards[i].getAttribute('title') || '').split('—')[0].trim();
            if (t) items.push({ name: t, category: cards[i].getAttribute('data-cat') || 'other' });
        }
        try {
            var blob = new Blob([JSON.stringify({ ghostStylePack: 1, savedAt: new Date().toISOString(), items: items }, null, 2)], { type: 'application/json' });
            var a = document.createElement('a');
            a.href = URL.createObjectURL(blob);
            a.download = 'ghostae-style-presets.json';
            document.body.appendChild(a);
            a.click();
            setTimeout(function () { URL.revokeObjectURL(a.href); if (a.parentNode) a.parentNode.removeChild(a); }, 400);
            toast('Style presets exported.', 'ok');
        } catch (e) {
            toast('Export is unavailable in this CEP build.', 'error');
        }
    }
    window.GhostStylePresetsExport = exportStylePresets;
    var styleCat = 'all';
    function applyStyleCat() {
        var cards = document.querySelectorAll('#ffxStyleGrid .tk-card, #textStyleGrid .tk-card');
        for (var i = 0; i < cards.length; i += 1) {
            var cat = cards[i].getAttribute('data-cat') || 'other';
            cards[i].classList.toggle('gp2-cat-hidden', styleCat !== 'all' && cat !== styleCat);
        }
    }
    function buildStyleCategoryFilter() {
        var wrap = el('div', 'gm-wrap gp2-cat-wrap');
        var btn = el('button', 'tk-icon-btn tk-icon-btn-sm gp2-style-cat', SVG.filter);
        btn.type = 'button';
        btn.title = 'Filter by category / gradient lock';
        btn.setAttribute('aria-haspopup', 'true');
        btn.setAttribute('aria-expanded', 'false');
        var pop = el('div', 'gm-pop gp2-style-pop gp2-cat-pop');
        pop.hidden = true;
        pop.setAttribute('role', 'menu');
        function applyStyleCat() {
            var cards = document.querySelectorAll('#ffxStyleGrid .tk-card, #textStyleGrid .tk-card');
            for (var i = 0; i < cards.length; i += 1) {
                var cat = cards[i].getAttribute('data-cat') || 'other';
                cards[i].classList.toggle('gp2-cat-hidden', styleCat !== 'all' && cat !== styleCat);
            }
        }
        function paint() {
            pop.innerHTML = '';
            var cards = document.querySelectorAll('#ffxStyleGrid .tk-card, #textStyleGrid .tk-card');
            var seen = { all: true };
            var list = ['all'];
            for (var i = 0; i < cards.length; i += 1) {
                var c = cards[i].getAttribute('data-cat') || 'other';
                if (!seen[c]) { seen[c] = true; list.push(c); }
            }
            list.forEach(function (cat) {
                var label = cat === 'all' ? 'All styles' : cat.charAt(0).toUpperCase() + cat.slice(1);
                var b = el('button', 'gm-item' + (styleCat === cat ? ' is-active' : ''),
                    (cat === 'all' ? SVG.grid : SVG.filter) + '<span>' + label + '</span>');
                b.type = 'button';
                b.setAttribute('role', 'menuitem');
                b.addEventListener('click', function () {
                    styleCat = cat;
                    applyStyleCat();
                    btn.classList.toggle('is-on', cat !== 'all');
                    pop.hidden = true;
                    btn.classList.remove('is-open');
                    btn.setAttribute('aria-expanded', 'false');
                });
                pop.appendChild(b);
            });
            var sep = el('div', 'gm-sep');
            pop.appendChild(sep);
            var lockRow = el('button', 'gm-item', SVG.lock + '<span>Gradient Lock: checking…</span>');
            lockRow.type = 'button';
            lockRow.setAttribute('role', 'menuitem');
            pop.appendChild(lockRow);
            function setLockLabel(locked) {
                lockRow.innerHTML = (locked ? SVG.lock : SVG.unlock) + '<span>Gradient Lock: ' + (locked ? 'ON' : 'OFF') + '</span>';
                lockRow.setAttribute('aria-pressed', locked ? 'true' : 'false');
                lockRow.title = locked ? 'Unlock Ramp / 4-Color Gradient positions' : 'Lock Ramp / 4-Color Gradient positions';
            }
            function getUI() { return window.GhostFfxStyleUI || {}; }
            var ui = getUI();
            if (ui.getGradientLock) {
                ui.getGradientLock().then(function (res) {
                    if (res && res.ok) setLockLabel(!!res.locked);
                    else setLockLabel(false);
                }).catch(function () { setLockLabel(false); });
            } else {
                setLockLabel(false);
            }
            lockRow.addEventListener('click', function () {
                var ui2 = getUI();
                if (!ui2.getGradientLock || !ui2.setGradientLock) return;
                ui2.getGradientLock().then(function (res) {
                    if (!res || !res.ok) throw new Error((res && res.error) || 'Select a text layer first.');
                    return ui2.setGradientLock(!res.locked);
                }).then(function (res2) {
                    if (!res2 || !res2.ok) throw new Error((res2 && res2.error) || 'Could not change gradient lock.');
                    setLockLabel(!!res2.locked);
                    if (window.GhostWebStyleAPI && window.GhostWebStyleAPI.reportResult) {
                        window.GhostWebStyleAPI.reportResult('ffxStyleStatus', res2, res2.locked ? 'Gradient locked.' : 'Gradient unlocked.');
                    }
                }).catch(function (err) {
                    if (window.GhostWebStyleAPI && window.GhostWebStyleAPI.reportResult) {
                        window.GhostWebStyleAPI.reportResult('ffxStyleStatus', { ok: false, error: err.message }, '');
                    }
                });
            });
        }
        btn.addEventListener('click', function (e) {
            e.stopPropagation();
            paint();
            var open = pop.hidden;
            pop.hidden = !open;
            btn.classList.toggle('is-open', open);
            btn.setAttribute('aria-expanded', open ? 'true' : 'false');
        });
        document.addEventListener('click', function (e) {
            if (!pop.hidden && !wrap.contains(e.target)) {
                pop.hidden = true;
                btn.classList.remove('is-open');
                btn.setAttribute('aria-expanded', 'false');
            }
        }, true);
        var grid = document.getElementById('textStyleGrid');
        if (grid) new MutationObserver(applyStyleCat).observe(grid, { childList: true });
        var fgrid = document.getElementById('ffxStyleGrid');
        if (fgrid) new MutationObserver(applyStyleCat).observe(fgrid, { childList: true });
        wrap.appendChild(btn);
        wrap.appendChild(pop);
        return wrap;
    }
    function applyAutoplayPreference() {
        if (autoplayOn() || !window.GhostToolkitAutoplay) return;
        window.GhostToolkitAutoplay.set(false);
    }
    function buildStyleToolbar() {
        var panel = document.getElementById('tab-color');
        var head = panel && panel.querySelector('.tk-ts-head');
        var actions = head && head.querySelector('.tk-ts-actions');
        if (!panel || !actions || panel.querySelector('.gp2-style-toolbar')) return;
        var bar = el('div', 'tk-panel-toolbar gp2-style-toolbar');
        var folder = document.getElementById('ffxFolderButton');
        var imp = document.getElementById('ffxImportButton');
        var cloud = document.getElementById('cloudStyleRefresh');
        var langbar = document.getElementById('langGroups');
        if (langbar) langbar.classList.add('gp2-langbar', 'is-collapsed');
        bar.appendChild(buildStyleCategoryFilter());
        var fav = el('button', 'tk-icon-btn tk-icon-btn-sm gp2-style-fav', SVG.star);
        fav.type = 'button';
        fav.title = 'Show favourites only';
        fav.setAttribute('aria-pressed', 'false');
        var globalFav = document.getElementById('tkBookmarkFilter');
        fav.addEventListener('click', function () { if (globalFav) globalFav.click(); });
        if (globalFav) {
            var syncFav = function () {
                var on = globalFav.getAttribute('aria-pressed') === 'true';
                fav.setAttribute('aria-pressed', on ? 'true' : 'false');
                fav.classList.toggle('is-on', on);
            };
            syncFav();
            new MutationObserver(syncFav).observe(globalFav, { attributes: true, attributeFilter: ['aria-pressed', 'class'] });
        }
        bar.appendChild(fav);
        var wrap = el('div', 'gm-wrap');
        var dots = el('button', 'gm-dots', SVG.dots3);
        dots.type = 'button';
        dots.title = 'Style options';
        dots.setAttribute('aria-haspopup', 'true');
        dots.setAttribute('aria-expanded', 'false');
        var pop = el('div', 'gm-pop gp2-style-pop');
        pop.hidden = true;
        pop.setAttribute('role', 'menu');
        dots.addEventListener('click', function (e) {
            e.stopPropagation();
            var open = pop.hidden;
            pop.hidden = !open;
            dots.classList.toggle('is-open', open);
            dots.setAttribute('aria-expanded', open ? 'true' : 'false');
        });
        document.addEventListener('click', function (e) {
            if (!pop.hidden && !wrap.contains(e.target)) {
                pop.hidden = true;
                dots.classList.remove('is-open');
                dots.setAttribute('aria-expanded', 'false');
            }
        }, true);
        function close() {
            pop.hidden = true;
            dots.classList.remove('is-open');
            dots.setAttribute('aria-expanded', 'false');
        }
        function menuItem(label, icon, onClick) {
            var b = el('button', 'gm-item', icon + '<span>' + label + '</span>');
            b.type = 'button';
            b.setAttribute('role', 'menuitem');
            b.addEventListener('click', function () {
                close();
                if (onClick) onClick(b);
            });
            pop.appendChild(b);
            return b;
        }
        function proxy(label, icon, target, direct) {
            if (!target && !direct) return;
            if (target) target.hidden = true;
            menuItem(label, icon, function () { if (direct) direct(); else target.click(); });
        }
        proxy('Create preset', SVG.wand, null, function () {
            if (window.GhostFfxStyleUI && window.GhostFfxStyleUI.create) window.GhostFfxStyleUI.create();
        });
        proxy('Import preset', SVG.inbox, imp, function () {
            if (window.GhostFfxStyleUI && window.GhostFfxStyleUI.importPreset) window.GhostFfxStyleUI.importPreset();
        });
        menuItem('Export preset', SVG.share, exportStylePresets);
        proxy('Preset folder', SVG.folder, folder, function () {
            if (window.GhostFfxStyleUI && window.GhostFfxStyleUI.revealFolder) window.GhostFfxStyleUI.revealFolder();
        });
        var styleLangRow = menuItem('Language', SVG.globe, function () { openLangSheet('style'); });
        styleLangRow.classList.add('gp2-lang-row');
        styleLangRow.setAttribute('data-scope', 'style');
        styleLangRow.appendChild(el('span', 'gp2-lang-current', langLabel('style')));
        proxy('Cloud presets', SVG.cloud, cloud);
        wrap.appendChild(dots);
        wrap.appendChild(pop);
        bar.appendChild(wrap);
        actions.remove();
        /* the toolbar rides on the Web Presets header — title left, icons
           right, one single line so no vertical space is wasted */
        var sechead = panel.querySelector('.tk-ts-sechead.gp2-sechead');
        if (sechead) sechead.appendChild(bar);
        else head.parentNode.insertBefore(bar, head.nextSibling);
        if (head && !head.querySelector('*')) head.hidden = true;
    }
    function boot() {
        buildSections();
        upgradeBottomMenu();
        dropLegacyFavExport();
        buildStyleToolbar();
        applyAutoplayPreference();
    }
    function start() { setTimeout(boot, 220); setTimeout(boot, 900); }
    window.GhostBoot.push(start);
})();
/* ghost-style-version-gate.js — warn when the Style tab is opened on AE older
   than 2025 (app major version < 25). No-op on AE 2025+. Pure UI notice; it
   never blocks the tab and touches nothing else. */
(function () {
    "use strict";
    if (window.GhostStyleVersionGate) return;
    var MIN_MAJOR = 25; /* After Effects 2025 == app version 25.x */
    var cachedMajor;    /* undefined = not checked yet, null = unknown */
    function detectMajor() {
        if (cachedMajor !== undefined) return cachedMajor;
        var v = null;
        try {
            if (window.CSInterface) {
                var env = new window.CSInterface().getHostEnvironment();
                if (env && env.appVersion) v = String(env.appVersion);
            }
        } catch (e) { /* fall through */ }
        if (!v) {
            try {
                if (window.CSInterface) {
                    new window.CSInterface().evalScript("app.version", function (r) {
                        var m = /^(\d+)/.exec(String(r || ""));
                        if (m) cachedMajor = parseInt(m[1], 10);
                    });
                }
            } catch (e2) { /* ignore */ }
            cachedMajor = null; /* async fallback resolves later; stay silent this time */
            return cachedMajor;
        }
        var m = /^(\d+)/.exec(v);
        cachedMajor = m ? parseInt(m[1], 10) : null;
        return cachedMajor;
    }
    function close(wrap) {
        if (wrap && wrap.parentNode) wrap.parentNode.removeChild(wrap);
    }
    function showNotice() {
        if (document.getElementById("ghostStyleVerGate")) return;
        var wrap = document.createElement("div");
        wrap.className = "gp2-sheet-wrap";
        wrap.id = "ghostStyleVerGate";
        wrap.innerHTML =
            '<div class="gp2-sheet" role="alertdialog" aria-modal="true" aria-label="Style section compatibility">' +
            "<h3>Perfect Color Presets need After Effects 2025+</h3>" +
            '<div class="gp2-row"><div class="gp2-row-main">Perfect Color Presets require After Effects 2025 (25.x) or newer.' +
            "<small>Other sections may still work on supported older versions, but results can vary.</small>" +
            "</div></div>" +
            '<div class="gp2-sheet-foot"><button type="button" class="gp2-btn gp2-btn-primary" data-act="ok">Got it</button></div>' +
            "</div>";
        document.body.appendChild(wrap);
        wrap.addEventListener("click", function (e) {
            var t = e.target && e.target.closest ? e.target.closest('[data-act="ok"]') : null;
            if (t || e.target === wrap) close(wrap);
        });
        document.addEventListener("keydown", function esc(e) {
            if (e.key === "Escape") { close(wrap); document.removeEventListener("keydown", esc); }
        });
        var btn = wrap.querySelector('[data-act="ok"]');
        if (btn && btn.focus) btn.focus();
    }
    function onTabActivate(tab) {
        if (!tab || tab.getAttribute("data-tab") !== "color") return;
        var major = detectMajor();
        if (major === null) return;   /* unknown version: stay silent, never a false alarm */
        if (major >= MIN_MAJOR) return; /* AE 2025+: no popup */
        showNotice();
    }
    document.addEventListener("click", function (e) {
        var tab = e.target && e.target.closest ? e.target.closest('.tools-tab[data-tab]') : null;
        if (tab) onTabActivate(tab);
    }, true);
    window.GhostStyleVersionGate = { check: onTabActivate, minMajor: MIN_MAJOR };
})();
(function () {
  'use strict';
  function q(id) { return document.getElementById(id); }
  function make(label, icon, fn) {
    var b=document.createElement('button'); b.type='button'; b.className='gm-item'; b.setAttribute('role','menuitem');
    b.innerHTML=icon+'<span>'+label+'</span>'; b.addEventListener('click',function(){ fn(); }); return b;
  }
  var icons={
    wand:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M4 20l9-9"/><path d="M14.5 4.5l1 2.5 2.5 1-2.5 1-1 2.5-1-2.5-2.5-1 2.5-1 1-2.5z"/></svg>',
    inbox:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M4.5 14.5v3.5a2 2 0 0 0 2 2h11a2 2 0 0 0 2-2v-3.5"/><path d="M12 3.8v10.4M12 14.2L8.4 10.6M12 14.2l3.6-3.6"/></svg>',
    share:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M4.5 15.5v2.5a2 2 0 0 0 2 2h11a2 2 0 0 0 2-2v-2.5"/><path d="M12 3.8v10.4M12 3.8L8.4 7.4M12 3.8l3.6 3.6"/></svg>',
    folder:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M3.6 8.4V6.6A1.6 1.6 0 0 1 5.2 5h3.9L11 6.9h6.9a1.6 1.6 0 0 1 1.6 1.6v9.3a1.6 1.6 0 0 1-1.6 1.6H5.2a1.6 1.6 0 0 1-1.6-1.6V8.4z"/></svg>',
    lockOn:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><rect x="4.8" y="10.4" width="14.4" height="9" rx="2.2"/><path d="M8.4 10.4V7.8a3.6 3.6 0 0 1 7.2 0v2.6"/></svg>',
    lockOff:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><rect x="4.8" y="10.4" width="14.4" height="9" rx="2.2"/><path d="M8.4 10.4V7.8a3.6 3.6 0 0 1 6.9-1.1"/></svg>',
    cloud:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7"><path d="M7.2 18.2a3.9 3.9 0 0 1-.2-7.8 5.4 5.4 0 0 1 10.4-1.4 3.7 3.7 0 0 1-.4 9.2H7.2z"/></svg>'
  };
  function init(){
    var header=q('perfectColorHeaderActions'), menu=q('perfectColorActionsMenu'), dots=q('perfectColorActions');
    if(!header||!menu||!dots||header.dataset.ready==='1') return;
    header.dataset.ready='1';
    var imp=q('ffxImportButton'), folder=q('ffxFolderButton'), cloud=q('cloudStyleRefresh');
    function ui(){ return window.GhostFfxStyleUI || {}; }
    function close(){ menu.hidden=true; dots.setAttribute('aria-expanded','false'); }
    function proxy(label,icon,target,direct){ if(!target && !direct) return; menu.appendChild(make(label,icon,function(){ close(); if(typeof direct==='function') direct(); else if(target) target.click(); })); }
    proxy('Create preset',icons.wand,null,function(){ if(typeof ui().create==='function') ui().create(); });
    proxy('Import preset',icons.inbox,imp,function(){ if(typeof ui().importPreset==='function') ui().importPreset(); else if(imp) imp.click(); });
    menu.appendChild(make('Export preset',icons.share,function(){ close(); if(typeof ui().exportPack==='function') ui().exportPack(); else if(typeof window.GhostStylePresetsExport==='function') window.GhostStylePresetsExport(); }));
    proxy('Preset folder',icons.folder,folder,function(){ if(typeof ui().revealFolder==='function') ui().revealFolder(); else if(folder) folder.click(); });
    proxy('Cloud presets',icons.cloud,cloud);
    dots.addEventListener('click',function(e){e.stopPropagation(); menu.hidden=!menu.hidden; dots.setAttribute('aria-expanded',menu.hidden?'false':'true');});
    document.addEventListener('click',function(e){if(!header.contains(e.target)){menu.hidden=true;dots.setAttribute('aria-expanded','false');}});
    var fav=q('tkBookmarkFilter'), favBtn=q('perfectColorFavorite');
    if(fav&&favBtn){
      function sync(){var on=fav.getAttribute('aria-pressed')==='true';favBtn.setAttribute('aria-pressed',on?'true':'false');favBtn.classList.toggle('is-on',on);}
      favBtn.addEventListener('click',function(){fav.click();}); sync();
      if(window.MutationObserver) new MutationObserver(sync).observe(fav,{attributes:true,attributeFilter:['aria-pressed','class']});
    }
    var lock=q('perfectColorLock');
    if(lock){
      var LK='ghost.text.rampLock';
      function state(){
        var st=null;
        try{ st=JSON.parse(localStorage.getItem(LK)||'null'); }catch(e){ st=null; }
        if(!st||typeof st!=='object') st={};
        if(typeof st.gradient!=='boolean') st.gradient=true;
        if(typeof st.four!=='boolean') st.four=true;
        return st;
      }
      function save(st){ try{ localStorage.setItem(LK,JSON.stringify(st)); }catch(e){} }
      function paintLock(){ var st=state(); lock.classList.toggle('is-on', !!(st.gradient||st.four)); }
      function callHost(on,key){
        function done(res){ try{ res=typeof res==='string'?JSON.parse(res):res; }catch(e){res=null;} if(res&&res.ok===false&&window.console) console.warn(res.error); }
        var api=window.GhostWebStyleAPI||window.GhostToolkitAPI||{};
        if(typeof api.call==='function'){ try{ var task=api.call('toolkitFfxSetGradientLock',[!!on,String(key)]);if(task&&task.then)task.then(done); }catch(e){} }
        else if(window.__adobe_cep__&&window.CSInterface){ try{new window.CSInterface().evalScript('GhostHost.toolkitFfxSetGradientLock('+(on?'true':'false')+',"'+String(key)+'")',done);}catch(e2){} }
      }
      function closePop(){
        var pop=document.getElementById('perfectColorLockMenu');
        if(pop&&pop.parentNode) pop.parentNode.removeChild(pop);
        lock.setAttribute('aria-expanded','false');
      }
      function row(label,key){
        var b=document.createElement('button'); b.type='button';
        b.setAttribute('role','menuitemcheckbox');
        function paint(){
          var on=!!state()[key];
          b.className='gm-item'+(on?' is-on':'');
          b.setAttribute('aria-checked',on?'true':'false');
          b.innerHTML=(on?icons.lockOn:icons.lockOff)+'<span>'+label+' — '+(on?'Locked':'Unlocked')+'</span>';
        }
        paint();
        b.addEventListener('click',function(e){
          e.stopPropagation();
          var cur=state(); cur[key]=!cur[key]; save(cur);
          callHost(!!cur[key],key);
          paint(); paintLock();
        });
        return b;
      }
      function place(pop){
        var r=lock.getBoundingClientRect();
        pop.style.position='fixed';
        pop.style.zIndex='99999';
        pop.style.margin='0';
        pop.style.visibility='hidden';
        pop.style.left='0px'; pop.style.top='0px';
        var w=pop.offsetWidth||200, h=pop.offsetHeight||80;
        var left=Math.min(Math.max(8,r.right-w), Math.max(8,window.innerWidth-w-8));
        var top=r.bottom+6;
        if(top+h>window.innerHeight-8) top=Math.max(8,r.top-h-6);
        pop.style.left=left+'px';
        pop.style.top=top+'px';
        pop.style.visibility='visible';
      }
      lock.addEventListener('click',function(e){
        e.stopPropagation();
        if(document.getElementById('perfectColorLockMenu')){ closePop(); return; }
        var pop=document.createElement('div');
        pop.id='perfectColorLockMenu'; pop.className='gm-pop gp2-style-pop is-open';
        pop.setAttribute('role','menu'); pop.hidden=false;
        pop.appendChild(row('Gradient Ramp','gradient'));
        pop.appendChild(row('Four Color Ramp','four'));
        document.body.appendChild(pop);
        place(pop);
        lock.setAttribute('aria-expanded','true');
      });
      document.addEventListener('click',function(e){
        var pop=document.getElementById('perfectColorLockMenu');
        if(pop && !pop.contains(e.target) && e.target!==lock && !lock.contains(e.target)) closePop();
      });
      window.addEventListener('resize',closePop);
      window.addEventListener('scroll',closePop,true);
      paintLock();
    }
  }
  function animHeader(){
    var panel=document.getElementById('tab-anim');
    if(!panel) return;
    ['animFfxPlayBtn','animWebPlayBtn'].forEach(function(id){
      var b=document.getElementById(id);
      if(b&&b.parentNode) b.parentNode.removeChild(b);
    });
    var bar=panel.querySelector('.tk-panel-toolbar.tk-toolbar-inhead');
    if(bar){
      var head=bar.parentNode&&bar.parentNode.classList&&bar.parentNode.classList.contains('tk-ts-sechead')?bar.parentNode:panel.querySelector('.tk-ts-sechead');
      if(head){
        bar.classList.add('gp2-anim-toolbar-right');
        if(!head.querySelector('.gp2-rule')){
          var rule=document.createElement('span'); rule.className='gp2-rule';
          head.insertBefore(rule,bar);
        }
        head.appendChild(bar);
      }
    }
  }
  var BM='ghost.toolkit.bookmarks';
  function bmMap(){ try{ return JSON.parse(localStorage.getItem(BM)||'{}')||{}; }catch(e){ return {}; } }
  function bmSet(map){ try{ localStorage.setItem(BM,JSON.stringify(map)); }catch(e){} }
  var STAR='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 4.5l2.35 4.76 5.26.77-3.8 3.7.9 5.24L12 16.5l-4.71 2.47.9-5.24-3.8-3.7 5.26-.77L12 4.5z"/></svg>';
  function starify(card,key){
    if(!card||card.querySelector('.tk-bm-star')) return;
    var b=document.createElement('button');
    b.type='button'; b.className='tk-bm-star';
    b.title='Favourite'; b.setAttribute('aria-label','Favourite');
    b.innerHTML=STAR;
    function paint(){
      var on=!!bmMap()[key];
      b.classList.toggle('is-on',on);
      card.classList.toggle('is-bookmarked',on);
      card.setAttribute('data-bookmarked',on?'1':'0');
    }
    paint();
    b.addEventListener('click',function(e){
      e.preventDefault(); e.stopPropagation();
      var map=bmMap();
      if(map[key]) delete map[key]; else map[key]=1;
      bmSet(map); paint();
      var cnt=document.getElementById('tkBookmarkCount');
      if(cnt) cnt.textContent=String(Object.keys(bmMap()).length);
    });
    card.appendChild(b);
  }
  function starifyGrids(){
    var grids=['ffxStyleGrid','textStyleGrid','themeGrid','colorGrid'];
    for(var i=0;i<grids.length;i++){
      var g=document.getElementById(grids[i]);
      if(!g) continue;
      var cards=g.querySelectorAll('.tk-card');
      for(var j=0;j<cards.length;j++){
        var c=cards[j];
        if(c.classList.contains('tk-web-bangla-ramp-card')) continue;
        starify(c,'style|'+(c.getAttribute('data-search')||c.title||(grids[i]+':'+j)));
      }
    }
  }
  function watchGrids(){
    if(!window.MutationObserver) return;
    var obs=new MutationObserver(function(){ starifyGrids(); });
    ['ffxStyleGrid','themeGrid','colorGrid'].forEach(function(id){
      var g=document.getElementById(id);
      if(g) obs.observe(g,{childList:true});
    });
  }
  function extras(){ animHeader(); starifyGrids(); watchGrids(); }
  window.GhostBoot.push(function(){setTimeout(extras,500);setTimeout(extras,1500);setTimeout(extras,2800);});
  window.GhostBoot.push(function(){setTimeout(init,350);setTimeout(init,1000);});
})();
/* GHOSTAE Text — v8 UI pass
   • top bar: search no longer breaks the tab strip, "⋯" replaced by a pricing button
   • expressions: single Target control, no category chips, no reload button,
     duplicate presets removed, favourite star on every card
   • grids: cards stretch so no dead space is left on the right edge
   • emoji: premium Twemoji SVG artwork with a plain-glyph fallback
   Presentation only — apply/host logic is untouched. */
(function () {
  "use strict";
  function q(id) { return document.getElementById(id); }
  function on(el, ev, fn) { if (el) el.addEventListener(ev, fn); }
  var PRICE_ICON = '<svg class="gi gi-action" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M2.25 8.25h19.5M2.25 9h19.5m-16.5 5.25h6m-6 2.25h3m-3.75 3h15a2.25 2.25 0 0 0 2.25-2.25V6.75A2.25 2.25 0 0 0 19.5 4.5h-15a2.25 2.25 0 0 0-2.25 2.25v10.5A2.25 2.25 0 0 0 4.5 19.5Z"/></svg>';
  function topbar() {
    var actions = document.querySelector(".tk-right-actions");
    if (!actions) return;
    var dots = actions.querySelectorAll(".gm-wrap, .gm-dots");
    for (var i = 0; i < dots.length; i += 1) {
      if (dots[i].parentNode) dots[i].parentNode.removeChild(dots[i]);
    }
    var plan = actions.querySelector(".plan-upgrade-button");
    if (plan && !plan.classList.contains("gp2-pricing-btn")) {
      plan.classList.add("gp2-pricing-btn");
      plan.innerHTML = PRICE_ICON;
      plan.title = "Pricing — your current plan";
      plan.setAttribute("aria-label", "Pricing");
      plan.addEventListener("click", function (e) {
        if (window.GhostPlans && typeof window.GhostPlans.open === "function") {
          e.preventDefault();
          e.stopPropagation();
          try { window.GhostPlans.open(); } catch (err) {}
        }
      }, true);
    }
    var input = q("tkSearch");
    if (input) input.placeholder = "Search";
    var box = q("tkSearchBox");
    var header = document.querySelector(".tk-topbar") || (box && box.closest ? box.closest("header") : null);
    if (box && header) {
      var sync = function () { header.classList.toggle("gp2-search-open", box.classList.contains("open")); };
      if (window.MutationObserver) {
        new MutationObserver(sync).observe(box, { attributes: true, attributeFilter: ["class"] });
      }
      sync();
    }
  }
  var BM = "ghost.toolkit.bookmarks";
  function bmMap() { try { return JSON.parse(localStorage.getItem(BM) || "{}") || {}; } catch (e) { return {}; } }
  function bmSet(m) { try { localStorage.setItem(BM, JSON.stringify(m)); } catch (e) {} }
  var STAR = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 4.5l2.35 4.76 5.26.77-3.8 3.7.9 5.24L12 16.5l-4.71 2.47.9-5.24-3.8-3.7 5.26-.77L12 4.5z"/></svg>';
  function starify(card, key) {
    if (!card || card.querySelector(".tk-bm-star")) return;
    var b = document.createElement("button");
    b.type = "button";
    b.className = "tk-bm-star";
    b.title = "Favourite";
    b.setAttribute("aria-label", "Favourite");
    b.innerHTML = STAR;
    function paint() {
      var on2 = !!bmMap()[key];
      b.classList.toggle("is-on", on2);
      card.classList.toggle("is-bookmarked", on2);
    }
    paint();
    b.addEventListener("click", function (e) {
      e.preventDefault();
      e.stopPropagation();
      var m = bmMap();
      if (m[key]) delete m[key]; else m[key] = 1;
      bmSet(m);
      paint();
      var c = q("tkBookmarkCount");
      if (c) c.textContent = String(Object.keys(bmMap()).length);
    });
    card.appendChild(b);
  }
  /* Families whose members only differ by a number read as the same preset,
     so keep the two most useful and drop the rest. */
  function familyKey(name) {
    return String(name || "")
      .toLowerCase()
      .replace(/[0-9]+(\.[0-9]+)?/g, "")
      .replace(/[\/\-–—_%()]+/g, " ")
      .replace(/\b(px|deg|sec|s|cps|key|out|in)\b/g, "")
      .replace(/\s+/g, " ")
      .trim();
  }
  function exprPass() {
    var panel = q("tab-expression");
    if (!panel) return;
    var cats = panel.querySelector(".tk-expr-cats");
    if (cats && cats.parentNode) cats.parentNode.removeChild(cats);
    var acts = panel.querySelector(".tk-expr-reference-actions");
    if (acts) {
      var btns = acts.querySelectorAll(".tk-expr-reference-icon");
      for (var i = 0; i < btns.length; i += 1) {
        if (btns[i].id !== "exprAutoplay") btns[i].parentNode.removeChild(btns[i]);
      }
    }
    var sel = q("exprTarget");
    if (sel && !sel.classList.contains("gp2-target")) {
      sel.classList.add("gp2-target");
      var keep = sel.querySelector('option[value="selected"]');
      sel.innerHTML = "";
      if (!keep) {
        keep = document.createElement("option");
        keep.value = "selected";
      }
      keep.textContent = "Target — Selected";
      keep.selected = true;
      sel.appendChild(keep);
      sel.setAttribute("aria-label", "Target: selected property");
      sel.title = "Applies to the property selected in After Effects";
    }
    var lbl = panel.querySelector(".tk-expr-toolbar > label");
    if (lbl && lbl.parentNode) lbl.parentNode.removeChild(lbl);
    var grid = q("exprGrid");
    if (!grid) return;
    var cards = grid.querySelectorAll(".tk-expr-card");
    if (!cards.length) return;
    var seenCode = {}, fam = {};
    for (var j = 0; j < cards.length; j += 1) {
      var card = cards[j];
      var name = (card.title || "").trim();
      var codeEl = card.querySelector(".tk-expr-code");
      var code = codeEl ? codeEl.textContent.replace(/\s+/g, "") : "";
      var fk = familyKey(name);
      fam[fk] = (fam[fk] || 0) + 1;
      var dupe = (code && seenCode[code]) || fam[fk] > 2;
      if (code) seenCode[code] = 1;
      if (dupe) {
        card.parentNode.removeChild(card);
        continue;
      }
      if (name && !card.querySelector(".tk-expr-label")) {
        var t = document.createElement("span");
        t.className = "tk-expr-label";
        t.textContent = name;
        var icon = card.querySelector(".tk-expr-icon");
        if (icon && icon.nextSibling) card.insertBefore(t, icon.nextSibling);
        else card.appendChild(t);
      }
      starify(card, "expr|" + name);
    }
  }
  var TW = "https://cdn.jsdelivr.net/gh/jdecked/twemoji@15.1.0/assets/svg/";
  function codePoints(glyph) {
    var pts = [], i = 0, c, lo;
    while (i < glyph.length) {
      c = glyph.charCodeAt(i++);
      if (c >= 0xd800 && c <= 0xdbff && i < glyph.length) {
        lo = glyph.charCodeAt(i++);
        pts.push(((c - 0xd800) * 0x400 + lo - 0xdc00 + 0x10000).toString(16));
      } else {
        pts.push(c.toString(16));
      }
    }
    if (pts.length > 1) pts = pts.filter(function (p) { return p !== "fe0f"; });
    return pts.join("-");
  }
  function emojiPass() {
    var spans = document.querySelectorAll(".ge-tile-glyph:not(.gp2-emoji-done)");
    for (var i = 0; i < spans.length; i += 1) {
      (function (span) {
        span.classList.add("gp2-emoji-done");
        var glyph = span.textContent.trim();
        if (!glyph) return;
        var cp = codePoints(glyph);
        if (!cp) return;
        var img = new Image();
        img.className = "gp2-emoji-img";
        img.alt = glyph;
        img.loading = "lazy";
        img.draggable = false;
        img.onload = function () { span.textContent = ""; span.appendChild(img); };
        img.onerror = function () { span.classList.add("gp2-emoji-plain"); };
        img.src = TW + cp + ".svg";
      })(spans[i]);
    }
  }
  function pass() {
    topbar();
    exprPass();
    emojiPass();
  }
  function boot() {
    pass();
    [400, 1200, 2500, 4000].forEach(function (t) { setTimeout(pass, t); });
    if (window.MutationObserver) {
      var mo = new MutationObserver(function () {
        clearTimeout(boot._t);
        boot._t = setTimeout(function () { exprPass(); emojiPass(); }, 120);
      });
      var main = document.querySelector("main") || document.body;
      mo.observe(main, { childList: true, subtree: true });
    }
  }
  window.GhostBoot.push(boot);
})();
(function () {
    'use strict';
    var BM_KEY = 'ghost.toolkit.bookmarks';
    var DROP = /^(category|categories|all animations|advance animation|advanced animation|language|settings|panel settings)$/i;
    function toast(msg, cls) {
        var region = document.getElementById('toolkitToastRegion') || document.getElementById('toolsToastRegion');
        if (!region) return;
        var n = document.createElement('div');
        n.className = 'toast ' + (cls || '');
        n.textContent = msg;
        region.appendChild(n);
        setTimeout(function () { if (n.parentNode) n.parentNode.removeChild(n); }, 2600);
    }
    function pruneAnimMenu() {
        var panel = document.getElementById('tab-anim');
        if (!panel) return;
        var pops = panel.querySelectorAll('.gm-pop');
        for (var p = 0; p < pops.length; p += 1) {
            var pop = pops[p];
            var kids = pop.children;
            for (var i = kids.length - 1; i >= 0; i -= 1) {
                var node = kids[i];
                var label = (node.textContent || '').trim().split('\n')[0].trim();
                var isCat = node.classList.contains('tk-catbtn-wrap');
                var isLang = node.classList.contains('tk-langbtn-wrap') || node.classList.contains('gp2-lang-row');
                if (isCat || isLang || DROP.test(label)) node.remove();
            }
            var seps = pop.querySelectorAll('.gm-sep');
            for (var s = 0; s < seps.length; s += 1) {
                var el = seps[s];
                if (!el.previousElementSibling || !el.nextElementSibling ||
                    el.nextElementSibling.classList.contains('gm-sep')) el.remove();
            }
            if (!pop.children.length) {
                var wrap = pop.parentNode;
                if (wrap && wrap.classList.contains('gm-wrap')) wrap.style.display = 'none';
            }
        }
    }
    function hideAdvanced() {
        var tab = document.querySelector('.tools-tab[data-tab="advanced"]');
        if (!tab) return;
        tab.hidden = true;
        tab.setAttribute('aria-hidden', 'true');
        tab.tabIndex = -1;
        if (tab.classList.contains('active')) {
            var anim = document.querySelector('.tools-tab[data-tab="anim"]');
            if (anim) anim.click();
        }
    }
    function readFavs() {
        try { return JSON.parse(window.localStorage.getItem(BM_KEY) || '[]'); } catch (e) { return []; }
    }
    function writeFavs(list) {
        try { window.localStorage.setItem(BM_KEY, JSON.stringify(list)); return true; } catch (e) { return false; }
    }
    function normalise(input) {
        var raw = input && input.items != null ? input.items : input;
        if (Object.prototype.toString.call(raw) === '[object Array]') {
            return raw.filter(function (x) { return x != null; });
        }
        if (raw && typeof raw === 'object') {
            return Object.keys(raw).filter(function (k) { return !!raw[k]; });
        }
        return null;
    }
    function keyOf(entry) { return typeof entry === 'string' ? entry : JSON.stringify(entry); }
    function exportFavourites() {
        var items = readFavs();
        var payload = JSON.stringify({ ghostFavourites: 1, savedAt: new Date().toISOString(), count: items.length, items: items }, null, 2);
        var name = 'ghostae-favourites-' + new Date().toISOString().slice(0, 10) + '.json';
        try {
            var blob = new Blob([payload], { type: 'application/json' });
            var a = document.createElement('a');
            a.href = URL.createObjectURL(blob);
            a.download = name;
            document.body.appendChild(a);
            a.click();
            setTimeout(function () {
                URL.revokeObjectURL(a.href);
                if (a.parentNode) a.parentNode.removeChild(a);
            }, 400);
            toast('Favourites exported (' + items.length + ').', 'ok');
        } catch (e) {
            toast('Export is unavailable in this build.', 'error');
        }
    }
    function importFavourites() {
        var input = document.createElement('input');
        input.type = 'file';
        input.accept = '.json,application/json';
        input.style.display = 'none';
        document.body.appendChild(input);
        input.addEventListener('change', function () {
            var file = input.files && input.files[0];
            if (!file) { input.remove(); return; }
            var reader = new FileReader();
            reader.onload = function () {
                var items;
                try { items = normalise(JSON.parse(String(reader.result || ''))); } catch (e) { items = null; }
                if (!items) { toast('That file is not a favourites backup.', 'error'); input.remove(); return; }
                var merged = readFavs();
                var seen = {};
                merged.forEach(function (x) { seen[keyOf(x)] = 1; });
                var added = 0;
                items.forEach(function (x) {
                    var k = keyOf(x);
                    if (!seen[k]) { seen[k] = 1; merged.push(x); added += 1; }
                });
                if (!writeFavs(merged)) { toast('Could not save favourites.', 'error'); input.remove(); return; }
                toast(added ? added + ' favourite' + (added === 1 ? '' : 's') + ' imported — refreshing…' : 'Already up to date.', 'ok');
                input.remove();
                if (added) setTimeout(function () { window.location.reload(); }, 600);
            };
            reader.onerror = function () { toast('Could not read that file.', 'error'); input.remove(); };
            reader.readAsText(file);
        });
        input.click();
    }
    function bindFavRows() {
        var rows = document.querySelectorAll('#tab-anim .gm-item');
        for (var i = 0; i < rows.length; i += 1) {
            var row = rows[i];
            if (row.getAttribute('data-gf-fav')) continue;
            var label = (row.textContent || '').trim().toLowerCase();
            if (label.indexOf('export favo') === 0) {
                row.setAttribute('data-gf-fav', '1');
                row.addEventListener('click', function (e) { e.stopPropagation(); exportFavourites(); }, true);
            } else if (label.indexOf('import favo') === 0) {
                row.setAttribute('data-gf-fav', '1');
                row.addEventListener('click', function (e) { e.stopPropagation(); importFavourites(); }, true);
            }
        }
    }
    window.GhostFavourites = { exportAll: exportFavourites, importAll: importFavourites };
    function planLabel() {
        try {
            var api = window.GhostPlans;
            var v = api && (api.currentLabel ? api.currentLabel() : (api.current ? api.current() : null));
            if (v && typeof v === 'string') return v;
        } catch (e) {}
        return 'Lifetime';
    }
    function mountPlanChip() {
        var actions = document.querySelector('.tk-right-actions');
        if (!actions || document.getElementById('gfPlanChip')) return;
        var chip = document.createElement('span');
        chip.id = 'gfPlanChip';
        chip.className = 'gf-plan-chip';
        chip.title = 'Pro — ' + planLabel();
        chip.innerHTML =
            '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true">' +
            '<circle cx="12" cy="12" r="8.4" stroke-width="1.6"/><path d="M12 8.4v7.2M8.4 12h7.2"/></svg>' +
            '<span class="gf-plan-name"></span>';
        chip.querySelector('.gf-plan-name').textContent = planLabel();
        var search = document.getElementById('tkSearchBox');
        if (search && search.nextSibling) actions.insertBefore(chip, search.nextSibling);
        else actions.appendChild(chip);
    }
    function fastTabs() {
        var tabs = document.querySelectorAll('.tools-tab');
        for (var i = 0; i < tabs.length; i += 1) {
            tabs[i].addEventListener('pointerdown', function () {
                var shell = document.querySelector('.tools-shell');
                if (!shell) return;
                shell.classList.add('gf-switching');
                requestAnimationFrame(function () {
                    requestAnimationFrame(function () { shell.classList.remove('gf-switching'); });
                });
            }, { passive: true });
        }
    }
    function run() { hideAdvanced(); pruneAnimMenu(); bindFavRows(); mountPlanChip(); }
    function boot() {
        run();
        fastTabs();
        var queued = false;
        window.GhostObserver.onBodyMutation(function () {
            if (queued) return;
            queued = true;
            setTimeout(function () { queued = false; run(); }, 80);
        });
        document.addEventListener('click', function () { setTimeout(run, 0); }, true);
    }
    window.GhostBoot.push(function () { setTimeout(boot, 120); });
})();
/* GHOSTAE Text v15 — layer icon → multi-layer apply
 * Additive. Removes v14 junk UI (text tools rail, batch chips, font pairs).
 * Host bridge (ExtendScript, host.jsx):
 *   ghostListCompLayers()                  -> JSON: {ok:true,layers:[{index,name,type}]}
 *   ghostApplyToLayers(indicesJson, kind, payload) -> JSON: {ok:true,count:N}
 */
(function () {
  'use strict';
  var TARGETS = [
    { id: 'anim', toolbar: '#tab-anim .tk-toolbar-inhead', kind: 'anim' },
    { id: 'style', toolbar: '#perfectColorHeaderActions', kind: 'style' }
  ];
  var selected = [];   // stable layer IDs
  var cs = null;
  try { if (window.CSInterface) cs = new window.CSInterface(); } catch (e) { cs = null; }
  function toast(msg) {
    var c = document.getElementById('toast-container') || document.getElementById('toolkitToastRegion');
    if (!c) { return; }
    var el = document.createElement('div');
    el.className = 'tk-toast is-visible';
    el.textContent = msg;
    c.appendChild(el);
    setTimeout(function () { el.remove(); }, 2400);
  }
  function evalHost(expr, cb) {
    if (cs && cs.evalScript) { cs.evalScript(expr, cb); return; }
    cb('');
  }
  function icon() {
    return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round">' +
      '<path d="M12 3.5 3.5 8 12 12.5 20.5 8 12 3.5Z"/><path d="M3.5 12 12 16.5 20.5 12"/><path d="M3.5 16 12 20.5 20.5 16"/></svg>';
  }
  function inject(target) {
    var bar = document.querySelector(target.toolbar);
    if (!bar || bar.querySelector('.gh-layer-wrap')) { return; }
    var wrap = document.createElement('div');
    wrap.className = 'gh-layer-wrap';
    wrap.innerHTML =
      '<button type="button" class="gh-layer-btn" title="Select layers">' +
      icon() + '<span class="gh-layer-count" hidden></span></button>';
    bar.insertBefore(wrap, bar.firstChild);
    wrap.querySelector('.gh-layer-btn').addEventListener('click', function (e) {
      e.stopPropagation();
      openSheet();
    });
  }
  function refreshBadges() {
    document.querySelectorAll('.gh-layer-wrap').forEach(function (w) {
      var b = w.querySelector('.gh-layer-btn');
      var c = w.querySelector('.gh-layer-count');
      if (selected.length) {
        b.classList.add('is-armed');
        c.hidden = false;
        c.textContent = String(selected.length);
      } else {
        b.classList.remove('is-armed');
        c.hidden = true;
      }
    });
  }
  var scrim = null;
  function buildSheet() {
    if (scrim) { return scrim; }
    scrim = document.createElement('div');
    scrim.className = 'gh-sheet-scrim';
    scrim.innerHTML =
      '<div class="gh-sheet">' +
      '<div class="gh-sheet-head"><span class="gh-sheet-title">Layers</span>' +
      '<span class="gh-sheet-sub"></span>' +
      '<button type="button" class="gh-sheet-close" aria-label="Close">&times;</button></div>' +
      '<div class="gh-sheet-list"></div>' +
      '<div class="gh-sheet-hint">Pick layers, then click any preset — it applies to all of them.</div>' +
      '</div>';
    document.body.appendChild(scrim);
    scrim.addEventListener('click', function (e) {
      if (e.target === scrim || e.target.closest('.gh-sheet-close')) { closeSheet(); }
    });
    return scrim;
  }
  function closeSheet() {
    if (scrim) { scrim.classList.remove('is-open'); }
  }
  function openSheet() {
    var s = buildSheet();
    var list = s.querySelector('.gh-sheet-list');
    list.innerHTML = '<div class="gh-empty">Reading comp…</div>';
    s.classList.add('is-open');
    evalHost('ghostListCompLayers()', function (res) {
      var data = null;
      try { data = JSON.parse(res); } catch (e) { data = null; }
      if (!data || !data.ok || !data.layers || !data.layers.length) {
        list.innerHTML = '<div class="gh-empty">No layers found in the active comp.</div>';
        return;
      }
      reconcile(data.layers);
      renderRows(list, data.layers);
    });
  }
  function renderRows(list, layers) {
    list.innerHTML = '';
    var all = document.createElement('button');
    all.type = 'button';
    all.className = 'gh-row is-all';
    all.innerHTML = '<span class="gh-box"></span><span class="gh-name">Select all</span>';
    list.appendChild(all);
    layers.forEach(function (ly) {
      var row = document.createElement('button');
      row.type = 'button';
      row.className = 'gh-row';
      row.dataset.id = String(ly.id);
      row.innerHTML = '<span class="gh-box"></span><span class="gh-name"></span>' +
        (ly.type === 'text' ? '<span class="gh-tag">TEXT</span>' : '');
      row.querySelector('.gh-name').textContent = ly.name;
      if (selected.indexOf(String(ly.id)) !== -1) { row.classList.add('is-on'); }
      row.addEventListener('click', function () {
        row.classList.toggle('is-on');
        sync(list);
      });
      list.appendChild(row);
    });
    all.addEventListener('click', function () {
      var on = !all.classList.contains('is-on');
      all.classList.toggle('is-on', on);
      list.querySelectorAll('.gh-row:not(.is-all)').forEach(function (r) { r.classList.toggle('is-on', on); });
      sync(list);
    });
    sync(list);
  }
  function sync(list) {
    selected = [];
    list.querySelectorAll('.gh-row.is-on:not(.is-all)').forEach(function (r) {
      selected.push(String(r.dataset.id));
    });
    var sub = scrim.querySelector('.gh-sheet-sub');
    if (sub) { sub.textContent = selected.length ? selected.length + ' selected' : ''; }
    refreshBadges();
  }
  function reconcile(layers) {
    var live = {};
    for (var i = 0; i < layers.length; i += 1) live[String(layers[i].id)] = true;
    selected = selected.filter(function (id) { return !!live[String(id)]; });
    refreshBadges();
  }
  function refreshLive(done) {
    evalHost('ghostListCompLayers()', function (res) {
      var data = null; try { data = JSON.parse(res); } catch (e) {}
      if (!data || !data.ok || !data.layers) { selected = []; refreshBadges(); done(false); return; }
      reconcile(data.layers); done(selected.length > 0);
    });
  }
  /* ---------- preset click interception ----------
   * Instead of guessing a payload, we make AE's own timeline selection match
   * the sheet selection and then replay the click so the panel's native apply
   * path runs exactly as it does for a manual timeline selection. */
  var GRIDS = '#animFfxGrid, #animGrid, #ffxStyleGrid, #textStyleGrid';
  var relaying = false;
  document.addEventListener('click', function (e) {
    if (relaying || !selected.length) { return; }
    if (!e.target.closest) { return; }
    if (e.target.closest('.gh-sheet, .gh-layer-wrap, .gh-sheet-scrim')) { return; }
    var grid = e.target.closest(GRIDS);
    if (!grid) { return; }
    var node = e.target;
    e.preventDefault();
    e.stopPropagation();
    if (e.stopImmediatePropagation) { e.stopImmediatePropagation(); }
    refreshLive(function (hasSelection) {
      if (!hasSelection) { toast('Selected layers no longer exist'); return; }
      evalHost('ghostSelectLayersByIds(' + JSON.stringify(JSON.stringify(selected)) + ')', function (res) {
        var out = null; try { out = JSON.parse(res); } catch (err) {}
        selected = out && out.ok && out.valid ? out.valid.map(String) : [];
        refreshBadges();
        if (!out || !out.ok || !out.count) { toast('Selected layers no longer exist'); return; }
        relaying = true;
        try { node.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true, view: window })); } catch (err2) {}
        setTimeout(function () { relaying = false; }, 0);
        toast('Applied to ' + out.count + ' layers');
      });
    });
  }, true);
  function mount() { TARGETS.forEach(inject); refreshBadges(); }
  window.GhostBoot.push(mount);
  document.addEventListener('click', function (e) {
    if (e.target.closest && e.target.closest('[role="tab"]')) { setTimeout(mount, 30); }
  });
  var refreshTimer = 0;
  function scheduleRefresh() { clearTimeout(refreshTimer); refreshTimer = setTimeout(function () { if (selected.length) refreshLive(function () {}); }, 120); }
  window.addEventListener('focus', scheduleRefresh);
  document.addEventListener('visibilitychange', function () { if (!document.hidden) scheduleRefresh(); });
})();
