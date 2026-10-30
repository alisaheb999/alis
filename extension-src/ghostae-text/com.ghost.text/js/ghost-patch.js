if (typeof window !== "undefined" && window.__ghostStamp) {
  window.__ghostStamp(
    "ghost-patch.js",
    /* @ghost-build */
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
