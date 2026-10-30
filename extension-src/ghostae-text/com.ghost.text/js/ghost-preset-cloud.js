/* GHOST Preset Cloud — v1.0.0
 * The shipped package carries previews only. Real .ffx files live in private
 * server storage and are fetched on demand, counted against the licence plan.
 *   GhostPresetCloud.ensure(absolutePath) -> Promise<{ok, path, error, used, limit}>
 *   GhostPresetCloud.has(slug)            -> already downloaded on this key
 */
(function (global) {
  "use strict";
  var BASE = (global.GHOST_API_BASE || "https://ghostae.com").replace(/\/+$/, "");
  var API = BASE + "/api/public/v1/preset/download";
  var PANEL = "text";
  var owned = null;      // Set of slugs unlocked by this key
  var quota = { used: 0, limit: 10, plan: "free" };
  var inflight = {};

  function licenseKey() {
    try {
      var raw = global.GHOST_LICENSE_KEY ||
        localStorage.getItem("ghost.cloud.licenseKey") ||
        localStorage.getItem("ghost.license.key") || "";
      try { raw = JSON.parse(raw); } catch (e) {}
      return typeof raw === "string" ? raw.trim().toUpperCase() : "";
    } catch (e) { return ""; }
  }
  function device() {
    try {
      var id = localStorage.getItem("ghost.device.fingerprint") ||
               localStorage.getItem("ghost.cloud.deviceId") || "";
      try { id = JSON.parse(id); } catch (e) {}
      return typeof id === "string" ? id : "";
    } catch (e) { return ""; }
  }
  function fs() { return global.cep && global.cep.fs ? global.cep.fs : null; }
  function exists(path) {
    var f = fs();
    if (!f || !path) return false;
    try { var s = f.stat(path); return !!s && !s.err; } catch (e) { return false; }
  }
  /* absolute .../presets/animffx/Folder/Name.ffx -> "animffx/Folder/Name.ffx" */
  function slugOf(path) {
    var parts = String(path).replace(/\\/g, "/").split("/").filter(Boolean);
    var i = parts.lastIndexOf("presets");
    if (i >= 0 && i < parts.length - 1) return parts.slice(i + 1).join("/");
    return parts.slice(-3).join("/");
  }
  function makedirs(dir) {
    var f = fs();
    if (!f) return;
    var parts = String(dir).replace(/\\/g, "/").split("/");
    var cur = "";
    for (var i = 0; i < parts.length; i += 1) {
      cur += (i ? "/" : "") + parts[i];
      if (!cur || cur.indexOf(":") === cur.length - 1) continue;
      try { var s = f.stat(cur); if (!s || s.err) f.makedir(cur); } catch (e) {}
    }
  }
  function toBase64(buf) {
    var bytes = new Uint8Array(buf), chunk = 0x8000, out = "";
    for (var i = 0; i < bytes.length; i += chunk)
      out += String.fromCharCode.apply(null, bytes.subarray(i, i + chunk));
    return global.btoa(out);
  }
  function headers() {
    return { "content-type": "application/json", "x-ghost-license": licenseKey(), "x-ghost-panel": PANEL };
  }

  function list() {
    var key = licenseKey();
    if (!key) return Promise.resolve(null);
    return fetch(API + "?panel=" + PANEL + "&key=" + encodeURIComponent(key), { headers: headers() })
      .then(function (r) { return r.json(); })
      .then(function (d) {
        if (!d || !d.ok) return null;
        owned = {};
        (d.slugs || []).forEach(function (s) { owned[s] = true; });
        quota = { used: d.used || 0, limit: typeof d.limit === "number" ? d.limit : 10, plan: d.plan || "free" };
        return quota;
      })
      .catch(function () { return null; });
  }

  function grant(slug) {
    return fetch(API, {
      method: "POST",
      headers: headers(),
      body: JSON.stringify({ key: licenseKey(), slug: slug, device_fingerprint: device(), panel: PANEL })
    }).then(function (r) { return r.json(); });
  }

  function ensure(path) {
    if (!path) return Promise.resolve({ ok: false, error: "no_path" });
    if (!fs()) return Promise.resolve({ ok: true, path: path });           // web preview
    if (exists(path)) return Promise.resolve({ ok: true, path: path, cached: true });
    var slug = slugOf(path);
    if (inflight[slug]) return inflight[slug];
    var key = licenseKey();
    if (!key) return Promise.resolve({ ok: false, error: "no_license" });

    var job = grant(slug).then(function (res) {
      if (!res || !res.ok || !res.url) {
        return { ok: false, error: (res && res.error) || "unavailable", plan: res && res.plan, limit: res && res.limit, used: res && res.used };
      }
      quota = { used: res.used || quota.used, limit: typeof res.limit === "number" ? res.limit : quota.limit, plan: res.plan || quota.plan };
      return fetch(res.url).then(function (r) {
        if (!r.ok) throw new Error("download_failed");
        return r.arrayBuffer();
      }).then(function (buf) {
        var clean = String(path).replace(/\\/g, "/");
        makedirs(clean.slice(0, clean.lastIndexOf("/")));
        var enc = (global.cep && global.cep.encoding && global.cep.encoding.Base64) || "Base64";
        var w = fs().writeFile(clean, toBase64(buf), enc);
        if (w && w.err) throw new Error("write_failed");
        if (owned) owned[slug] = true;
        return { ok: true, path: path, downloaded: true, used: quota.used, limit: quota.limit };
      });
    }).catch(function (err) {
      return { ok: false, error: (err && err.message) || "network" };
    }).then(function (out) {
      delete inflight[slug];
      return out;
    });
    inflight[slug] = job;
    return job;
  }

  function has(pathOrSlug) {
    if (!pathOrSlug) return false;
    var slug = slugOf(pathOrSlug);
    if (owned && owned[slug]) return true;
    return exists(pathOrSlug);
  }

  global.GhostPresetCloud = {
    ensure: ensure,
    has: has,
    refresh: list,
    quota: function () { return quota; },
    slugOf: slugOf
  };
  try { setTimeout(list, 1500); } catch (e) {}
})(window);
