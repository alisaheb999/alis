/* Ghostae Caption — unified animation gallery.
 * Groups: premium (4 built-in templates, handled by panel.js) + bundled .ffx packs.
 * Names are never shown in the UI; they are kept in data attributes / payload. */
(function () {
  "use strict";

  var groups = window.GHOST_PRESET_GROUPS || [];
  window.ghostSelectedFfx = "";
  window.ghostSelectedFfxName = "";

  var gridEl, premiumEl, tabsEl;
  var active = "premium";

  function findGroup(id) {
    for (var i = 0; i < groups.length; i++) if (groups[i].id === id) return groups[i];
    return null;
  }

  function renderTabs() {
    if (!tabsEl) return;
    var btns = tabsEl.querySelectorAll(".anim-group");
    for (var i = 0; i < btns.length; i++) {
      btns[i].className = "anim-group" + (btns[i].getAttribute("data-group") === active ? " active" : "");
    }
  }

  function renderGrid() {
    if (active === "premium") {
      if (premiumEl) premiumEl.style.display = "";
      gridEl.style.display = "none";
      gridEl.innerHTML = "";
      return;
    }
    if (premiumEl) premiumEl.style.display = "none";
    gridEl.style.display = "";
    var g = findGroup(active);
    if (!g) { gridEl.innerHTML = ""; return; }
    var html = "";
    for (var i = 0; i < g.items.length; i++) {
      var it = g.items[i];
      html += '<div class="anim-card' + (it.ffx === window.ghostSelectedFfx ? " active" : "") +
        '" data-ffx="' + it.ffx + '" data-name="' + it.name + '" data-video="' + (it.video || "") + '" title="' + it.name + '">' +
        '<img class="anim-thumb" src="' + it.thumb + '" alt="">' +
        (it.video ? '<video class="anim-video" muted loop playsinline preload="none"></video>' : "") +
        '<span class="anim-badge">&#10003;</span></div>';
    }
    gridEl.innerHTML = html;

    var cards = gridEl.querySelectorAll(".anim-card");
    for (var c = 0; c < cards.length; c++) {
      cards[c].onmouseenter = function () {
        var v = this.querySelector("video"), src = this.getAttribute("data-video");
        if (!v || !src) return;
        if (!v.getAttribute("src")) v.setAttribute("src", src);
        v.style.opacity = "1";
        try { v.play(); } catch (e) {}
      };
      cards[c].onmouseleave = function () {
        var v = this.querySelector("video");
        if (!v) return;
        try { v.pause(); } catch (e) {}
        v.style.opacity = "0";
      };
      cards[c].onclick = function () {
        var ffx = this.getAttribute("data-ffx");
        if (window.ghostSelectedFfx === ffx) {
          window.ghostSelectedFfx = "";
          window.ghostSelectedFfxName = "";
        } else {
          window.ghostSelectedFfx = ffx;
          window.ghostSelectedFfxName = this.getAttribute("data-name");
        }
        renderGrid();
      };
    }
  }

  window.ghostInitAnimations = function () {
    gridEl = document.getElementById("animGrid");
    premiumEl = document.getElementById("premiumGrid");
    tabsEl = document.getElementById("animGroups");
    if (!gridEl || !tabsEl) return;

    var btns = tabsEl.querySelectorAll(".anim-group");
    for (var i = 0; i < btns.length; i++) {
      btns[i].onclick = function () {
        active = this.getAttribute("data-group");
        if (active === "premium") {
          window.ghostSelectedFfx = "";
          window.ghostSelectedFfxName = "";
        }
        renderTabs();
        renderGrid();
      };
    }
    renderTabs();
    renderGrid();
  };
})();
