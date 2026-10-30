/* GHOST runtime profile and release variant switch. This file intentionally
   uses ES5 syntax because it is the first script loaded by every CEP panel. */
(function (global) {
    "use strict";

    /* ---- variant block (rewritten by the release builder) ---- */
    var VARIANT = {
        id: "current",
        label: "GHOST for After Effects 2025-2026",
        version: "3.40.2",
        aeRange: "2025 - 2026",
        profile: "full"
    };
    /* ---- end variant block ---- */

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