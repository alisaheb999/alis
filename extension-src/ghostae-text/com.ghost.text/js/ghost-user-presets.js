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

  /* ── shared section builder ─────────────────────────────── */

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
