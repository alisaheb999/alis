if (typeof window !== "undefined" && window.__ghostStamp) {
  window.__ghostStamp(
    "ghost-search.js",
    /* @ghost-build */
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
      // "local" | "cloud" | provider id
      sourceLabel: row.sourceLabel || row.source,
      path: row.path || null,
      // local file path, when present
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
