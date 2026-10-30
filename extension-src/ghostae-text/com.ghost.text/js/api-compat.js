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

    /* Never throws — falls back to XHR when fetch is missing or unusable. */
    fetchWithFallback: function (url, options) {
      if (API.hasFetch) {
        try {
          return global.fetch(url, options).catch(function (err) {
            /* Legacy CEF rejects some same-origin file requests; retry via XHR. */
            return xhrFetch(url, options).catch(function () { throw err; });
          });
        } catch (e) {
          return xhrFetch(url, options);
        }
      }
      return xhrFetch(url, options);
    },

    /* Storage that degrades to memory instead of throwing. */
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

    /* Bridge listeners registered before CEP is live are silently dropped. */
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

    /* evalScript with a hard timeout so a stalled host cannot hang the panel. */
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

    /* DOM-ready that also tolerates "already loaded" and gives CSS a tick. */
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

    /* Namespaced per-panel state so multiple panels never collide. */
    panel: function (id, initial) {
      global.__GHOST_PANELS__ = global.__GHOST_PANELS__ || {};
      if (!global.__GHOST_PANELS__[id]) global.__GHOST_PANELS__[id] = initial || {};
      return global.__GHOST_PANELS__[id];
    },
    releasePanel: function (id) {
      try { if (global.__GHOST_PANELS__) delete global.__GHOST_PANELS__[id]; } catch (e) {}
    }
  };

  /* Minimal observer stubs so callers can use them unconditionally. */
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
