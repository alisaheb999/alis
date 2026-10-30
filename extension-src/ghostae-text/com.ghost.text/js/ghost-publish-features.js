/* GHOSTAE Text v15 — layer icon → multi-layer apply
 * Additive. Removes v14 junk UI (text tools rail, batch chips, font pairs).
 * Host bridge (ExtendScript, host.jsx):
 *   ghostListCompLayers()                  -> JSON: {ok:true,layers:[{index,name,type}]}
 *   ghostApplyToLayers(indicesJson, kind, payload) -> JSON: {ok:true,count:N}
 */
(function () {
  'use strict';

  var TARGETS = [
    { id: 'anim', toolbar: '#tab-anim .tk-toolbar-inhead', kind: 'anim' },
    { id: 'style', toolbar: '#perfectColorHeaderActions', kind: 'style' }
  ];

  var selected = [];   // stable layer IDs
  var cs = null;

  try { if (window.CSInterface) cs = new window.CSInterface(); } catch (e) { cs = null; }

  function toast(msg) {
    var c = document.getElementById('toast-container') || document.getElementById('toolkitToastRegion');
    if (!c) { return; }
    var el = document.createElement('div');
    el.className = 'tk-toast is-visible';
    el.textContent = msg;
    c.appendChild(el);
    setTimeout(function () { el.remove(); }, 2400);
  }

  function evalHost(expr, cb) {
    if (cs && cs.evalScript) { cs.evalScript(expr, cb); return; }
    cb('');
  }

  /* ---------- icon injection ---------- */
  function icon() {
    return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round">' +
      '<path d="M12 3.5 3.5 8 12 12.5 20.5 8 12 3.5Z"/><path d="M3.5 12 12 16.5 20.5 12"/><path d="M3.5 16 12 20.5 20.5 16"/></svg>';
  }

  function inject(target) {
    var bar = document.querySelector(target.toolbar);
    if (!bar || bar.querySelector('.gh-layer-wrap')) { return; }

    var wrap = document.createElement('div');
    wrap.className = 'gh-layer-wrap';
    wrap.innerHTML =
      '<button type="button" class="gh-layer-btn" title="Select layers">' +
      icon() + '<span class="gh-layer-count" hidden></span></button>';
    bar.insertBefore(wrap, bar.firstChild);

    wrap.querySelector('.gh-layer-btn').addEventListener('click', function (e) {
      e.stopPropagation();
      openSheet();
    });
  }


  function refreshBadges() {
    document.querySelectorAll('.gh-layer-wrap').forEach(function (w) {
      var b = w.querySelector('.gh-layer-btn');
      var c = w.querySelector('.gh-layer-count');
      if (selected.length) {
        b.classList.add('is-armed');
        c.hidden = false;
        c.textContent = String(selected.length);
      } else {
        b.classList.remove('is-armed');
        c.hidden = true;
      }
    });
  }

  /* ---------- sheet ---------- */
  var scrim = null;

  function buildSheet() {
    if (scrim) { return scrim; }
    scrim = document.createElement('div');
    scrim.className = 'gh-sheet-scrim';
    scrim.innerHTML =
      '<div class="gh-sheet">' +
      '<div class="gh-sheet-head"><span class="gh-sheet-title">Layers</span>' +
      '<span class="gh-sheet-sub"></span>' +
      '<button type="button" class="gh-sheet-close" aria-label="Close">&times;</button></div>' +
      '<div class="gh-sheet-list"></div>' +
      '<div class="gh-sheet-hint">Pick layers, then click any preset — it applies to all of them.</div>' +
      '</div>';
    document.body.appendChild(scrim);

    scrim.addEventListener('click', function (e) {
      if (e.target === scrim || e.target.closest('.gh-sheet-close')) { closeSheet(); }
    });
    return scrim;
  }

  function closeSheet() {
    if (scrim) { scrim.classList.remove('is-open'); }
  }

  function openSheet() {
    var s = buildSheet();
    var list = s.querySelector('.gh-sheet-list');
    list.innerHTML = '<div class="gh-empty">Reading comp…</div>';
    s.classList.add('is-open');

    evalHost('ghostListCompLayers()', function (res) {
      var data = null;
      try { data = JSON.parse(res); } catch (e) { data = null; }
      if (!data || !data.ok || !data.layers || !data.layers.length) {
        list.innerHTML = '<div class="gh-empty">No layers found in the active comp.</div>';
        return;
      }
      reconcile(data.layers);
      renderRows(list, data.layers);
    });
  }

  function renderRows(list, layers) {
    list.innerHTML = '';
    var all = document.createElement('button');
    all.type = 'button';
    all.className = 'gh-row is-all';
    all.innerHTML = '<span class="gh-box"></span><span class="gh-name">Select all</span>';
    list.appendChild(all);

    layers.forEach(function (ly) {
      var row = document.createElement('button');
      row.type = 'button';
      row.className = 'gh-row';
      row.dataset.id = String(ly.id);
      row.innerHTML = '<span class="gh-box"></span><span class="gh-name"></span>' +
        (ly.type === 'text' ? '<span class="gh-tag">TEXT</span>' : '');
      row.querySelector('.gh-name').textContent = ly.name;
      if (selected.indexOf(String(ly.id)) !== -1) { row.classList.add('is-on'); }
      row.addEventListener('click', function () {
        row.classList.toggle('is-on');
        sync(list);
      });
      list.appendChild(row);
    });

    all.addEventListener('click', function () {
      var on = !all.classList.contains('is-on');
      all.classList.toggle('is-on', on);
      list.querySelectorAll('.gh-row:not(.is-all)').forEach(function (r) { r.classList.toggle('is-on', on); });
      sync(list);
    });

    sync(list);
  }

  function sync(list) {
    selected = [];
    list.querySelectorAll('.gh-row.is-on:not(.is-all)').forEach(function (r) {
      selected.push(String(r.dataset.id));
    });
    var sub = scrim.querySelector('.gh-sheet-sub');
    if (sub) { sub.textContent = selected.length ? selected.length + ' selected' : ''; }
    refreshBadges();
  }


  function reconcile(layers) {
    var live = {};
    for (var i = 0; i < layers.length; i += 1) live[String(layers[i].id)] = true;
    selected = selected.filter(function (id) { return !!live[String(id)]; });
    refreshBadges();
  }

  function refreshLive(done) {
    evalHost('ghostListCompLayers()', function (res) {
      var data = null; try { data = JSON.parse(res); } catch (e) {}
      if (!data || !data.ok || !data.layers) { selected = []; refreshBadges(); done(false); return; }
      reconcile(data.layers); done(selected.length > 0);
    });
  }
  /* ---------- preset click interception ----------
   * Instead of guessing a payload, we make AE's own timeline selection match
   * the sheet selection and then replay the click so the panel's native apply
   * path runs exactly as it does for a manual timeline selection. */
  var GRIDS = '#animFfxGrid, #animGrid, #ffxStyleGrid, #textStyleGrid';
  var relaying = false;

  document.addEventListener('click', function (e) {
    if (relaying || !selected.length) { return; }
    if (!e.target.closest) { return; }
    if (e.target.closest('.gh-sheet, .gh-layer-wrap, .gh-sheet-scrim')) { return; }
    var grid = e.target.closest(GRIDS);
    if (!grid) { return; }

    var node = e.target;
    e.preventDefault();
    e.stopPropagation();
    if (e.stopImmediatePropagation) { e.stopImmediatePropagation(); }

    refreshLive(function (hasSelection) {
      if (!hasSelection) { toast('Selected layers no longer exist'); return; }
      evalHost('ghostSelectLayersByIds(' + JSON.stringify(JSON.stringify(selected)) + ')', function (res) {
        var out = null; try { out = JSON.parse(res); } catch (err) {}
        selected = out && out.ok && out.valid ? out.valid.map(String) : [];
        refreshBadges();
        if (!out || !out.ok || !out.count) { toast('Selected layers no longer exist'); return; }
        relaying = true;
        try { node.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true, view: window })); } catch (err2) {}
        setTimeout(function () { relaying = false; }, 0);
        toast('Applied to ' + out.count + ' layers');
      });
    });
  }, true);



  /* ---------- init ---------- */
  function mount() { TARGETS.forEach(inject); refreshBadges(); }

  window.GhostBoot.push(mount);

  document.addEventListener('click', function (e) {
    if (e.target.closest && e.target.closest('[role="tab"]')) { setTimeout(mount, 30); }
  });
  var refreshTimer = 0;
  function scheduleRefresh() { clearTimeout(refreshTimer); refreshTimer = setTimeout(function () { if (selected.length) refreshLive(function () {}); }, 120); }
  window.addEventListener('focus', scheduleRefresh);
  document.addEventListener('visibilitychange', function () { if (!document.hidden) scheduleRefresh(); });
})();
