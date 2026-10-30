if (typeof window !== "undefined" && window.__ghostStamp) {
  window.__ghostStamp(
    "ghost-cloud.js",
    /* @ghost-build */
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
  /** Reasons that must gate every panel. Everything else is treated as soft. */
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
  // Never trust a persisted `valid` flag by itself. This process-local flag is
  // set only after the current CEP session receives a successful server reply.
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
    /** Raw signed request — used by the unified search + connection probe. */
    request,
    /** Stock/API provider search (Pexels, Pixabay, Freesound, GIPHY…). */
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
          // Truly dead key: wipe the machine licence so every panel gates.
          purgePremium(["cache", "ffx", "history"]);
          sharedClear();
          emit("revoked", res.license);
        } else if (!valid) {
          // A server rejection is authoritative. Keep the key visible for
          // correction, but never unlock from a locally cached value.
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
    /** Pull a licence activated in a sibling panel. Returns true when adopted. */
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
    /** Raw search result including paging info (used by the cloud library browser). */
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
    /* ---------------- feedback (preset votes + problem reports) ---------------- */
    /** Local record of this machine's votes so the UI can show the current choice. */
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
    /** Send anything that was captured while offline. */
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
    /** Boot: verify this panel's licence, sync, then heartbeat forever. */
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
