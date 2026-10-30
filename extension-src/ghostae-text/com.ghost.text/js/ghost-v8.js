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

  /* ── 1. Top bar ──────────────────────────────────────────────────── */
  var PRICE_ICON = '<svg class="gi gi-action" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M2.25 8.25h19.5M2.25 9h19.5m-16.5 5.25h6m-6 2.25h3m-3.75 3h15a2.25 2.25 0 0 0 2.25-2.25V6.75A2.25 2.25 0 0 0 19.5 4.5h-15a2.25 2.25 0 0 0-2.25 2.25v10.5A2.25 2.25 0 0 0 4.5 19.5Z"/></svg>';

  function topbar() {
    var actions = document.querySelector(".tk-right-actions");
    if (!actions) return;

    /* the "⋯" overflow button has no purpose here */
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

  /* ── 2. Favourite star (shared storage with the style section) ───── */
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

  /* ── 3. Expressions ─────────────────────────────────────────────── */
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

    /* Target: a single compact control that follows the AE selection */
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

  /* ── 4. Premium emoji artwork (Twemoji SVG, glyph fallback) ─────── */
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

  /* ── 5. Boot + observers ────────────────────────────────────────── */
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
