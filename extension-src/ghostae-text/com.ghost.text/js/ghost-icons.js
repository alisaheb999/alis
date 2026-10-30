/* Ghostae Text — icon system (v3.13.0)
 * One inline SVG sprite, stroke-based, currentColor so it follows the theme.
 * Inlined as a JS string on purpose: CEP runs from file:// where external
 * <use href="file.svg#id"> and fetch() are both unreliable.
 * Usage in markup:  <svg class="gi"><use href="#gi-play"></use></svg>
 *            or:    <button data-gi="save" data-gi-size="20">Save</button>
 */
(function (global) {
  "use strict";
  if (global.GhostIcons) return;

  var P = {
    play: '<path d="M6 4.5l11 5.5-11 5.5z"/>',
    pause: '<path d="M7 4v12M13 4v12"/>',
    apply: '<path d="M3.5 10.5l4 4 9-9"/>',
    copy: '<rect x="7" y="7" width="9" height="9" rx="2"/><path d="M13 7V5a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h2"/>',
    save: '<path d="M4 3h9l3 3v11H4z"/><path d="M7 3v5h6V3M7 17v-5h6v5"/>',
    trash: '<path d="M3.5 5.5h13M8 5.5V4h4v1.5M5.5 5.5l.8 11h7.4l.8-11"/>',
    duplicate: '<rect x="3" y="3" width="10" height="10" rx="2"/><path d="M7 17h8a2 2 0 0 0 2-2V7"/>',
    search: '<circle cx="9" cy="9" r="5.5"/><path d="M13.2 13.2L17 17"/>',
    filter: '<path d="M3 4.5h14l-5.5 6.5v4.5l-3 1.5V11z"/>',
    refresh: '<path d="M16.5 8A6.5 6.5 0 1 0 16 12.5"/><path d="M16.5 4v4h-4"/>',
    settings: '<circle cx="10" cy="10" r="2.6"/><path d="M10 2.5v2M10 15.5v2M2.5 10h2M15.5 10h2M4.7 4.7l1.4 1.4M13.9 13.9l1.4 1.4M15.3 4.7l-1.4 1.4M6.1 13.9l-1.4 1.4"/>',
    lock: '<rect x="4.5" y="8.5" width="11" height="8" rx="2"/><path d="M7 8.5V6a3 3 0 0 1 6 0v2.5"/>',
    sparkle: '<path d="M10 2.5l1.7 4.3 4.3 1.7-4.3 1.7L10 14.5 8.3 10.2 4 8.5l4.3-1.7z"/><path d="M15.5 13.5l.7 1.8 1.8.7-1.8.7-.7 1.8-.7-1.8-1.8-.7 1.8-.7z"/>',
    download: '<path d="M10 3v9M6 9l4 4 4-4M4 16.5h12"/>',
    chevron: '<path d="M7.5 4.5l5 5.5-5 5.5"/>',
    grid: '<rect x="3" y="3" width="6" height="6" rx="1.5"/><rect x="11" y="3" width="6" height="6" rx="1.5"/><rect x="3" y="11" width="6" height="6" rx="1.5"/><rect x="11" y="11" width="6" height="6" rx="1.5"/>',
    list: '<path d="M6.5 5.5h11M6.5 10h11M6.5 14.5h11M3 5.5h.01M3 10h.01M3 14.5h.01"/>',
    eye: '<path d="M1.8 10S4.9 4.8 10 4.8 18.2 10 18.2 10 15.1 15.2 10 15.2 1.8 10 1.8 10z"/><circle cx="10" cy="10" r="2.4"/>',
    undo: '<path d="M6 7H3.5V4.5"/><path d="M3.9 7.4A6.5 6.5 0 1 1 3.5 12"/>',
    sun: '<circle cx="10" cy="10" r="3.4"/><path d="M10 2v2M10 16v2M2 10h2M16 10h2M4.6 4.6L6 6M14 14l1.4 1.4M15.4 4.6L14 6M6 14l-1.4 1.4"/>',
    moon: '<path d="M16 11.6A6.5 6.5 0 0 1 8.4 4a6.6 6.6 0 1 0 7.6 7.6z"/>',
    contrast: '<circle cx="10" cy="10" r="7"/><path d="M10 3v14a7 7 0 0 0 0-14z" fill="currentColor" stroke="none"/>'
  };

  function sprite() {
    var out = '<svg class="ghost-icon-sprite" aria-hidden="true" focusable="false">';
    for (var k in P) {
      if (!Object.prototype.hasOwnProperty.call(P, k)) continue;
      out += '<symbol id="gi-' + k + '" viewBox="0 0 20 20">' + P[k] + "</symbol>";
    }
    return out + "</svg>";
  }

  function markup(name, size) {
    if (!P[name]) return "";
    var cls = "gi" + (size === 20 ? " gi-20" : size === 24 ? " gi-24" : "");
    return '<svg class="' + cls + '" aria-hidden="true" focusable="false"><use href="#gi-' + name + '"></use></svg>';
  }

  function mount(doc) {
    var d = doc || global.document;
    if (!d || !d.body || d.getElementById("ghostIconSprite")) return;
    var host = d.createElement("div");
    host.id = "ghostIconSprite";
    host.setAttribute("aria-hidden", "true");
    host.className = "ghost-icon-sprite";
    host.innerHTML = sprite();
    d.body.insertBefore(host, d.body.firstChild);
  }

  /* Upgrade any element carrying data-gi="name" — non-destructive:
     the icon is prepended, existing label text stays where it is. */
  function upgrade(root) {
    var scope = root || global.document;
    if (!scope || !scope.querySelectorAll) return;
    var nodes = scope.querySelectorAll("[data-gi]:not([data-gi-done])");
    for (var i = 0; i < nodes.length; i += 1) {
      var el = nodes[i];
      var html = markup(el.getAttribute("data-gi"), parseInt(el.getAttribute("data-gi-size"), 10));
      if (!html) continue;
      el.insertAdjacentHTML("afterbegin", html);
      el.setAttribute("data-gi-done", "1");
      if (!el.getAttribute("aria-label") && !el.textContent.trim()) {
        el.setAttribute("aria-label", el.getAttribute("title") || el.getAttribute("data-gi"));
      }
    }
  }

  function boot() {
    mount(global.document);
    upgrade(global.document);
  }

  global.GhostIcons = { names: Object.keys(P), markup: markup, mount: mount, upgrade: upgrade };

  if (global.document) {
    global.GhostBoot.push(boot);
  }
})(typeof window !== "undefined" ? window : this);
