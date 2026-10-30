/* Ghostae Text — tab bar layout (v3.40.0)
 * The old "⋯" overflow chip is gone. Tabs stay in the strip; when the panel is
 * narrow they shrink to icon-only and the strip scrolls horizontally instead of
 * hiding anything behind a menu.
 */
(function (global) {
  "use strict";
  var doc = global.document;
  if (!doc || global.GhostTabBar) return;

  var bar, raf = 0;

  function build() {
    bar = doc.querySelector('.tools-tabs[role="tablist"]');
    if (!bar) return false;
    /* remove any legacy overflow chip / popup left in the DOM */
    var junk = doc.querySelectorAll(".ghost-more, .ghost-more-pop");
    for (var i = 0; i < junk.length; i += 1) {
      var el = junk[i];
      /* rescue tabs parked inside the popup */
      while (el.firstChild) {
        if (el.firstChild.getAttribute && el.firstChild.getAttribute("role") === "tab") bar.appendChild(el.firstChild);
        else el.removeChild(el.firstChild);
      }
      if (el.parentNode) el.parentNode.removeChild(el);
    }
    return true;
  }

  function layout() {
    if (!bar && !build()) return;
    bar.classList.remove("compact");
    if (bar.scrollWidth > bar.clientWidth + 2) bar.classList.add("compact");
  }

  function schedule() {
    if (raf) global.cancelAnimationFrame(raf);
    raf = global.requestAnimationFrame(function () { raf = 0; layout(); });
  }

  function boot() {
    if (!build()) return;
    schedule();
    if (global.ResizeObserver) new global.ResizeObserver(schedule).observe(bar.parentNode || bar);
    global.addEventListener("resize", schedule);
  }

  global.GhostTabBar = { refresh: schedule };

  global.GhostBoot.push(boot);
})(typeof window !== "undefined" ? window : this);
