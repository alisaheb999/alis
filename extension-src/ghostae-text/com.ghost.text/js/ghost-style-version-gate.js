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

    /* Clicks fire in capture phase so the notice appears right as the tab opens. */
    document.addEventListener("click", function (e) {
        var tab = e.target && e.target.closest ? e.target.closest('.tools-tab[data-tab]') : null;
        if (tab) onTabActivate(tab);
    }, true);

    window.GhostStyleVersionGate = { check: onTabActivate, minMajor: MIN_MAJOR };
})();
