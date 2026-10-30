if (typeof window !== "undefined" && window.__ghostStamp) {
  window.__ghostStamp(
    "ghost-compat.js",
    /* @ghost-build */
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

  /* ---- AE 2020 hardening: API fallbacks, storage, boot timing ---- */
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

  /* localStorage is read-only or quota-locked in some AE panel sandboxes. */
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

  /* Layout capability flags the stylesheets react to. */
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
  /* Safety net: never leave a panel dead if load never fires. */
  setTimeout(startBoot, 4000);

  global.GhostCompat.ready = function (fn) {
    if (typeof fn !== "function") return;
    if (booted) { try { fn(); } catch (e) {} return; }
    readyQueue.push(fn);
  };
  global.GhostReady = global.GhostCompat.ready;

})(typeof window !== "undefined" ? window : this);
