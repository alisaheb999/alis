/*!
 * Ghostae Text — Panel 2028 (v3.31.0)
 * Presentation layer only. Re-arranges existing controls and adds small
 * UI utilities on top of ghost-menu-2027.js:
 *  • animation grid gets "FFX Presets" + "Web Presets" section headers with a
 *    hairline rule; the existing bottom toolbar moves into the Web Presets row
 *  • the bottom overflow becomes a 3-dot menu: All animations, Advance
 *    animation, Language, Settings
 *  • Settings sheet: autoplay-on-open, favourites import/export, FFX manage
 * No preset, animation or apply logic is modified.
 */
(function () {
    'use strict';

    var BM_KEY = 'ghost.toolkit.bookmarks';
    var AUTOPLAY_KEY = 'ghost.toolkit.autoplayOnOpen';

    var SVG = {
        dots3: '<svg viewBox="0 0 20 20" fill="currentColor" aria-hidden="true"><circle cx="4.5" cy="10" r="1.6"/><circle cx="10" cy="10" r="1.6"/><circle cx="15.5" cy="10" r="1.6"/></svg>',
        wand: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 20l9-9"/><path d="M14.5 4.5l1 2.5 2.5 1-2.5 1-1 2.5-1-2.5-2.5-1 2.5-1 1-2.5z"/><path d="M18.5 14l.7 1.8 1.8.7-1.8.7-.7 1.8-.7-1.8-1.8-.7 1.8-.7.7-1.8z"/></svg>',
        gear: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="2.9"/><path d="M19.3 14.2a1.5 1.5 0 00.3 1.7 1.9 1.9 0 01-2.7 2.7 1.5 1.5 0 00-2.5 1v.3a1.9 1.9 0 01-3.8 0v-.2a1.5 1.5 0 00-2.5-1 1.9 1.9 0 01-2.7-2.7 1.5 1.5 0 00-1-2.5H4.2a1.9 1.9 0 010-3.8h.2a1.5 1.5 0 001-2.5 1.9 1.9 0 012.7-2.7 1.5 1.5 0 002.5-1V3.9a1.9 1.9 0 013.8 0v.2a1.5 1.5 0 002.5 1 1.9 1.9 0 012.7 2.7 1.5 1.5 0 001 2.5h.2a1.9 1.9 0 010 3.8h-.2a1.5 1.5 0 00-1.3.9z"/></svg>',
        share: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4.5 15.5v2.5a2 2 0 002 2h11a2 2 0 002-2v-2.5"/><path d="M12 3.8v10.4M12 3.8L8.4 7.4M12 3.8l3.6 3.6"/></svg>',
        inbox: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4.5 14.5v3.5a2 2 0 002 2h11a2 2 0 002-2v-3.5"/><path d="M12 3.8v10.4M12 14.2L8.4 10.6M12 14.2l3.6-3.6"/></svg>',
        cloud: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M7.2 18.2a3.9 3.9 0 01-.2-7.8 5.4 5.4 0 0110.4-1.4 3.7 3.7 0 01-.4 9.2H7.2z"/></svg>',
        folder: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3.6 8.4V6.6A1.6 1.6 0 015.2 5h3.9l1.9 1.9h6.9a1.6 1.6 0 011.6 1.6v9.3a1.6 1.6 0 01-1.6 1.6H5.2a1.6 1.6 0 01-1.6-1.6V8.4z"/></svg>',
        globe: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="8.4"/><path d="M3.6 12h16.8M12 3.6c2.1 2.4 3.2 5.2 3.2 8.4s-1.1 6-3.2 8.4c-2.1-2.4-3.2-5.2-3.2-8.4s1.1-6 3.2-8.4z"/></svg>',
        grid: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="3.8" y="3.8" width="6.6" height="6.6" rx="1.8"/><rect x="13.6" y="3.8" width="6.6" height="6.6" rx="1.8"/><rect x="3.8" y="13.6" width="6.6" height="6.6" rx="1.8"/><rect x="13.6" y="13.6" width="6.6" height="6.6" rx="1.8"/></svg>',
        star: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 4.5l2.35 4.76 5.26.77-3.8 3.7.9 5.24L12 16.5l-4.71 2.47.9-5.24-3.8-3.7 5.26-.77L12 4.5z"/></svg>',
        filter: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 6.2h16M6.8 12h10.4M10 17.8h4"/></svg>'
    };

    function el(tag, cls, html) {
        var n = document.createElement(tag);
        if (cls) n.className = cls;
        if (html != null) n.innerHTML = html;
        return n;
    }
    function ls(key, fallback) {
        try { var v = window.localStorage.getItem(key); return v == null ? fallback : v; } catch (e) { return fallback; }
    }
    function lsSet(key, value) {
        try { window.localStorage.setItem(key, value); } catch (e) {}
    }
    function toast(msg, cls) {
        var region = document.getElementById('toolkitToastRegion') || document.getElementById('toolsToastRegion');
        if (!region) return;
        var n = el('div', 'toast ' + (cls || ''), '');
        n.textContent = msg;
        region.appendChild(n);
        setTimeout(function () { if (n.parentNode) n.parentNode.removeChild(n); }, 2600);
    }

    /* ── section headers around the animation grid ───────────────────── */
    function buildSections() {
        /* The static markup in toolkit.html already ships both section heads
           (Perfect Presets + Web Presets) with their own play toggle, so this
           no longer injects a second "Web Presets" row or relocates the
           toolbar — that is what produced the duplicate play button. */
        return;
    }

    /* ── bottom 3-dot menu ───────────────────────────────────────────── */
    function upgradeBottomMenu() {
        var panel = document.getElementById('tab-anim');
        var wrap = panel && panel.querySelector('.gm-wrap');
        if (!wrap || wrap.dataset.gp2) return;
        wrap.dataset.gp2 = '1';

        var btn = wrap.querySelector('.gm-dots');
        var pop = wrap.querySelector('.gm-pop');
        if (btn) {
            btn.innerHTML = SVG.dots3;
            btn.title = 'Panel menu';
        }
        if (!pop) return;

        function item(label, icon, onClick) {
            var b = el('button', 'gm-item', icon + '<span>' + label + '</span>');
            b.type = 'button';
            b.setAttribute('role', 'menuitem');
            b.addEventListener('click', function () {
                pop.hidden = true;
                if (btn) btn.classList.remove('is-open');
                onClick();
            });
            return b;
        }

        var advance = item('Advance animation', SVG.wand, function () {
            var tab = document.querySelector('.tools-tab[data-tab="advanced"]');
            if (tab) tab.click();
        });
        var langWrap = pop.querySelector('.tk-langbtn-wrap');
        if (langWrap) {
            pop.insertBefore(advance, langWrap);
            /* the old inline flag button is replaced by one tidy row that
               opens the language sheet — animation language only */
            langWrap.hidden = true;
            langWrap.style.display = 'none';
        } else {
            pop.appendChild(advance);
        }

        var animLangRow = item('Language', SVG.globe, function () { openLangSheet('anim'); });
        animLangRow.classList.add('gp2-lang-row');
        animLangRow.setAttribute('data-scope', 'anim');
        animLangRow.appendChild(el('span', 'gp2-lang-current', langLabel('anim')));
        if (langWrap) pop.insertBefore(animLangRow, langWrap);
        else pop.appendChild(animLangRow);

        pop.appendChild(el('div', 'gm-sep'));
        pop.appendChild(item('Export favourites', SVG.share, exportFavourites));
        pop.appendChild(item('Import favourites', SVG.inbox, importFavourites));
        pop.appendChild(item('Settings', SVG.gear, openSettings));
    }

    /* ── language sheet — one design, two independent scopes ─────────── */
    function langApi() { return window.GhostToolkitLang || null; }
    function langLabel(scope) {
        var api = langApi();
        if (!api) return '';
        return api.labelOf(scope === 'style' ? api.styleLang() : api.animLang());
    }
    function syncLangRows() {
        var rows = document.querySelectorAll('.gp2-lang-row .gp2-lang-current');
        for (var i = 0; i < rows.length; i += 1) {
            var scope = rows[i].parentNode.getAttribute('data-scope') || 'anim';
            rows[i].textContent = langLabel(scope);
        }
    }
    function openLangSheet(scope) {
        var api = langApi();
        if (!api) return;
        var old = document.getElementById('gp2LangSheet');
        if (old) old.remove();
        var current = scope === 'style' ? api.styleLang() : api.animLang();
        var wrap = el('div', 'gp2-sheet-wrap');
        wrap.id = 'gp2LangSheet';
        var sheet = el('div', 'gp2-sheet gp2-lang-sheet');
        sheet.setAttribute('role', 'dialog');
        sheet.setAttribute('aria-label', 'Preview language');
        sheet.appendChild(el('h3', null,
            (scope === 'style' ? 'Style' : 'Animation') + ' preview language' +
            '<small>Only the preview words change — every preset keeps the same effect.</small>'));
        var list = el('div', 'gp2-lang-list');
        api.languages().forEach(function (info) {
            var b = el('button', 'gp2-lang-opt' + (info.id === current ? ' is-active' : ''),
                '<span class="gp2-lang-flag">' + info.flag + '</span><span class="gp2-lang-name"></span>');
            b.type = 'button';
            var nameEl = b.querySelector('.gp2-lang-name');
            nameEl.textContent = info.label;
            nameEl.style.fontFamily = info.font;
            b.addEventListener('click', function () {
                if (scope === 'style') api.setStyleLang(info.id);
                else api.setAnimLang(info.id);
                wrap.remove();
                syncLangRows();
            });
            list.appendChild(b);
        });
        sheet.appendChild(list);
        var foot = el('div', 'gp2-sheet-foot');
        var done = el('button', 'gp2-btn gp2-btn-primary', 'Done');
        done.type = 'button';
        done.addEventListener('click', function () { wrap.remove(); });
        foot.appendChild(done);
        sheet.appendChild(foot);
        wrap.appendChild(sheet);
        wrap.addEventListener('click', function (e) { if (e.target === wrap) wrap.remove(); });
        document.addEventListener('keydown', function esc(e) {
            if (e.key === 'Escape') { wrap.remove(); document.removeEventListener('keydown', esc); }
        });
        document.body.appendChild(wrap);
    }


    /* ── favourites import / export ──────────────────────────────────── */
    function exportFavourites() {
        var raw = ls(BM_KEY, '[]');
        var blob = new Blob([JSON.stringify({ ghostFavourites: 1, savedAt: new Date().toISOString(), items: JSON.parse(raw || '[]') }, null, 2)], { type: 'application/json' });
        var a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = 'ghostae-favourites.json';
        document.body.appendChild(a);
        a.click();
        setTimeout(function () {
            URL.revokeObjectURL(a.href);
            if (a.parentNode) a.parentNode.removeChild(a);
        }, 400);
        toast('Favourites exported.', 'ok');
    }

    function importFavourites() {
        var input = document.createElement('input');
        input.type = 'file';
        input.accept = '.json,application/json';
        input.addEventListener('change', function () {
            var file = input.files && input.files[0];
            if (!file) return;
            var reader = new FileReader();
            reader.onload = function () {
                try {
                    var parsed = JSON.parse(String(reader.result || '{}'));
                    var items = parsed && parsed.items ? parsed.items : parsed;
                    if (!items || typeof items !== 'object') throw new Error('bad file');
                    lsSet(BM_KEY, JSON.stringify(items));
                    toast('Favourites restored — reloading…', 'ok');
                    setTimeout(function () { window.location.reload(); }, 500);
                } catch (e) {
                    toast('That file is not a favourites backup.', 'error');
                }
            };
            reader.readAsText(file);
        });
        input.click();
    }

    /* ── settings sheet ──────────────────────────────────────────────── */
    function autoplayOn() { return ls(AUTOPLAY_KEY, '1') !== '0'; }

    function openSettings() {
        var old = document.getElementById('gp2Settings');
        if (old) old.remove();
        var wrap = el('div', 'gp2-sheet-wrap');
        wrap.id = 'gp2Settings';
        wrap.innerHTML =
            '<div class="gp2-sheet" role="dialog" aria-label="Panel settings">' +
            '<h3>Panel settings</h3>' +
            '<div class="gp2-row"><div class="gp2-row-main">Autoplay previews on open<small>Cards animate as soon as the panel loads.</small></div>' +
            '<button type="button" class="gp2-switch" data-act="autoplay" aria-pressed="' + (autoplayOn() ? 'true' : 'false') + '" aria-label="Autoplay previews"></button></div>' +
            '<div class="gp2-row"><div class="gp2-row-main">Favourites backup<small>Export now, import after a reinstall.</small></div>' +
            '<button type="button" class="gp2-btn" data-act="fav-export">Export</button>' +
            '<button type="button" class="gp2-btn" data-act="fav-import">Import</button></div>' +
            '<div class="gp2-row"><div class="gp2-row-main">Manage FFX presets<small>Open your saved FFX list to remove one.</small></div>' +
            '<button type="button" class="gp2-btn" data-act="ffx">Open</button></div>' +
            '<div class="gp2-sheet-foot"><button type="button" class="gp2-btn gp2-btn-primary" data-act="close">Done</button></div>' +
            '</div>';
        document.body.appendChild(wrap);

        wrap.addEventListener('click', function (e) {
            var t = e.target.closest ? e.target.closest('[data-act]') : null;
            if (e.target === wrap) { wrap.remove(); return; }
            if (!t) return;
            var act = t.getAttribute('data-act');
            if (act === 'close') wrap.remove();
            else if (act === 'autoplay') {
                var on = t.getAttribute('aria-pressed') !== 'true';
                t.setAttribute('aria-pressed', on ? 'true' : 'false');
                lsSet(AUTOPLAY_KEY, on ? '1' : '0');
                if (window.GhostToolkitAutoplay) window.GhostToolkitAutoplay.set(on);
            } else if (act === 'fav-export') exportFavourites();
            else if (act === 'fav-import') importFavourites();
            else if (act === 'ffx') {
                wrap.remove();
                var tab = document.querySelector('.tools-tab[data-tab="color"]');
                if (tab) tab.click();
                setTimeout(function () {
                    var grid = document.getElementById('ffxStyleGrid');
                    if (grid && grid.scrollIntoView) grid.scrollIntoView({ behavior: 'smooth', block: 'center' });
                }, 260);
            }
        });
        document.addEventListener('keydown', function esc(e) {
            if (e.key === 'Escape') { wrap.remove(); document.removeEventListener('keydown', esc); }
        });
    }

    /* favourites export lives in the 3-dot panel menu — no toolbar button */
    function dropLegacyFavExport() {
        var old = document.querySelector('.gp2-fav-export');
        if (old && old.parentNode) old.parentNode.removeChild(old);
    }

    /* ── style presets: export the visible style list as a JSON pack ──── */
    function exportStylePresets() {
        /* CEP-safe export: use the ExtendScript host's native Save dialog. The
           old Blob/anchor download path is unreliable in some CEP builds. */
        if (window.GhostFfxStyleUI && window.GhostFfxStyleUI.exportPack) {
            window.GhostFfxStyleUI.exportPack();
            return;
        }
        var cards = document.querySelectorAll('#textStyleGrid .tk-card, #ffxStyleGrid .tk-card');
        var items = [];
        for (var i = 0; i < cards.length; i += 1) {
            var t = String(cards[i].getAttribute('title') || '').split('—')[0].trim();
            if (t) items.push({ name: t, category: cards[i].getAttribute('data-cat') || 'other' });
        }
        try {
            var blob = new Blob([JSON.stringify({ ghostStylePack: 1, savedAt: new Date().toISOString(), items: items }, null, 2)], { type: 'application/json' });
            var a = document.createElement('a');
            a.href = URL.createObjectURL(blob);
            a.download = 'ghostae-style-presets.json';
            document.body.appendChild(a);
            a.click();
            setTimeout(function () { URL.revokeObjectURL(a.href); if (a.parentNode) a.parentNode.removeChild(a); }, 400);
            toast('Style presets exported.', 'ok');
        } catch (e) {
            toast('Export is unavailable in this CEP build.', 'error');
        }
    }

    window.GhostStylePresetsExport = exportStylePresets;

    /* ── style category filter ───────────────────────────────────────── */
    var styleCat = 'all';
    function applyStyleCat() {
        var cards = document.querySelectorAll('#ffxStyleGrid .tk-card, #textStyleGrid .tk-card');
        for (var i = 0; i < cards.length; i += 1) {
            var cat = cards[i].getAttribute('data-cat') || 'other';
            cards[i].classList.toggle('gp2-cat-hidden', styleCat !== 'all' && cat !== styleCat);
        }
    }
    function buildStyleCategoryFilter() {
        var wrap = el('div', 'gm-wrap gp2-cat-wrap');
        var btn = el('button', 'tk-icon-btn tk-icon-btn-sm gp2-style-cat', SVG.filter);
        btn.type = 'button';
        btn.title = 'Filter by category / gradient lock';
        btn.setAttribute('aria-haspopup', 'true');
        btn.setAttribute('aria-expanded', 'false');
        var pop = el('div', 'gm-pop gp2-style-pop gp2-cat-pop');
        pop.hidden = true;
        pop.setAttribute('role', 'menu');

        function applyStyleCat() {
            var cards = document.querySelectorAll('#ffxStyleGrid .tk-card, #textStyleGrid .tk-card');
            for (var i = 0; i < cards.length; i += 1) {
                var cat = cards[i].getAttribute('data-cat') || 'other';
                cards[i].classList.toggle('gp2-cat-hidden', styleCat !== 'all' && cat !== styleCat);
            }
        }

        function paint() {
            pop.innerHTML = '';
            var cards = document.querySelectorAll('#ffxStyleGrid .tk-card, #textStyleGrid .tk-card');
            var seen = { all: true };
            var list = ['all'];
            for (var i = 0; i < cards.length; i += 1) {
                var c = cards[i].getAttribute('data-cat') || 'other';
                if (!seen[c]) { seen[c] = true; list.push(c); }
            }
            list.forEach(function (cat) {
                var label = cat === 'all' ? 'All styles' : cat.charAt(0).toUpperCase() + cat.slice(1);
                var b = el('button', 'gm-item' + (styleCat === cat ? ' is-active' : ''),
                    (cat === 'all' ? SVG.grid : SVG.filter) + '<span>' + label + '</span>');
                b.type = 'button';
                b.setAttribute('role', 'menuitem');
                b.addEventListener('click', function () {
                    styleCat = cat;
                    applyStyleCat();
                    btn.classList.toggle('is-on', cat !== 'all');
                    pop.hidden = true;
                    btn.classList.remove('is-open');
                    btn.setAttribute('aria-expanded', 'false');
                });
                pop.appendChild(b);
            });

            var sep = el('div', 'gm-sep');
            pop.appendChild(sep);
            var lockRow = el('button', 'gm-item', SVG.lock + '<span>Gradient Lock: checking…</span>');
            lockRow.type = 'button';
            lockRow.setAttribute('role', 'menuitem');
            pop.appendChild(lockRow);

            function setLockLabel(locked) {
                lockRow.innerHTML = (locked ? SVG.lock : SVG.unlock) + '<span>Gradient Lock: ' + (locked ? 'ON' : 'OFF') + '</span>';
                lockRow.setAttribute('aria-pressed', locked ? 'true' : 'false');
                lockRow.title = locked ? 'Unlock Ramp / 4-Color Gradient positions' : 'Lock Ramp / 4-Color Gradient positions';
            }
            function getUI() { return window.GhostFfxStyleUI || {}; }
            var ui = getUI();
            if (ui.getGradientLock) {
                ui.getGradientLock().then(function (res) {
                    if (res && res.ok) setLockLabel(!!res.locked);
                    else setLockLabel(false);
                }).catch(function () { setLockLabel(false); });
            } else {
                setLockLabel(false);
            }
            lockRow.addEventListener('click', function () {
                var ui2 = getUI();
                if (!ui2.getGradientLock || !ui2.setGradientLock) return;
                ui2.getGradientLock().then(function (res) {
                    if (!res || !res.ok) throw new Error((res && res.error) || 'Select a text layer first.');
                    return ui2.setGradientLock(!res.locked);
                }).then(function (res2) {
                    if (!res2 || !res2.ok) throw new Error((res2 && res2.error) || 'Could not change gradient lock.');
                    setLockLabel(!!res2.locked);
                    if (window.GhostWebStyleAPI && window.GhostWebStyleAPI.reportResult) {
                        window.GhostWebStyleAPI.reportResult('ffxStyleStatus', res2, res2.locked ? 'Gradient locked.' : 'Gradient unlocked.');
                    }
                }).catch(function (err) {
                    if (window.GhostWebStyleAPI && window.GhostWebStyleAPI.reportResult) {
                        window.GhostWebStyleAPI.reportResult('ffxStyleStatus', { ok: false, error: err.message }, '');
                    }
                });
            });
        }

        btn.addEventListener('click', function (e) {
            e.stopPropagation();
            paint();
            var open = pop.hidden;
            pop.hidden = !open;
            btn.classList.toggle('is-open', open);
            btn.setAttribute('aria-expanded', open ? 'true' : 'false');
        });
        document.addEventListener('click', function (e) {
            if (!pop.hidden && !wrap.contains(e.target)) {
                pop.hidden = true;
                btn.classList.remove('is-open');
                btn.setAttribute('aria-expanded', 'false');
            }
        }, true);
        var grid = document.getElementById('textStyleGrid');
        if (grid) new MutationObserver(applyStyleCat).observe(grid, { childList: true });
        var fgrid = document.getElementById('ffxStyleGrid');
        if (fgrid) new MutationObserver(applyStyleCat).observe(fgrid, { childList: true });
        wrap.appendChild(btn);
        wrap.appendChild(pop);
        return wrap;
    }

    function applyAutoplayPreference() {
        if (autoplayOn() || !window.GhostToolkitAutoplay) return;
        window.GhostToolkitAutoplay.set(false);
    }

    /* ── Style panel toolbar: right-aligned, everything in the 3-dot menu ─ */
    function buildStyleToolbar() {
        var panel = document.getElementById('tab-color');
        var head = panel && panel.querySelector('.tk-ts-head');
        var actions = head && head.querySelector('.tk-ts-actions');
        if (!panel || !actions || panel.querySelector('.gp2-style-toolbar')) return;

        var bar = el('div', 'tk-panel-toolbar gp2-style-toolbar');
        var folder = document.getElementById('ffxFolderButton');
        var imp = document.getElementById('ffxImportButton');
        var cloud = document.getElementById('cloudStyleRefresh');
        var langbar = document.getElementById('langGroups');
        if (langbar) langbar.classList.add('gp2-langbar', 'is-collapsed');

        /* category filter — sits before the favourite star */
        bar.appendChild(buildStyleCategoryFilter());

        /* favourites filter proxy — same behaviour as the animation section */
        var fav = el('button', 'tk-icon-btn tk-icon-btn-sm gp2-style-fav', SVG.star);
        fav.type = 'button';
        fav.title = 'Show favourites only';
        fav.setAttribute('aria-pressed', 'false');
        var globalFav = document.getElementById('tkBookmarkFilter');
        fav.addEventListener('click', function () { if (globalFav) globalFav.click(); });
        if (globalFav) {
            var syncFav = function () {
                var on = globalFav.getAttribute('aria-pressed') === 'true';
                fav.setAttribute('aria-pressed', on ? 'true' : 'false');
                fav.classList.toggle('is-on', on);
            };
            syncFav();
            new MutationObserver(syncFav).observe(globalFav, { attributes: true, attributeFilter: ['aria-pressed', 'class'] });
        }
        bar.appendChild(fav);

        /* dot menu holds every other style action */
        var wrap = el('div', 'gm-wrap');
        var dots = el('button', 'gm-dots', SVG.dots3);
        dots.type = 'button';
        dots.title = 'Style options';
        dots.setAttribute('aria-haspopup', 'true');
        dots.setAttribute('aria-expanded', 'false');
        var pop = el('div', 'gm-pop gp2-style-pop');
        pop.hidden = true;
        pop.setAttribute('role', 'menu');
        dots.addEventListener('click', function (e) {
            e.stopPropagation();
            var open = pop.hidden;
            pop.hidden = !open;
            dots.classList.toggle('is-open', open);
            dots.setAttribute('aria-expanded', open ? 'true' : 'false');
        });
        document.addEventListener('click', function (e) {
            if (!pop.hidden && !wrap.contains(e.target)) {
                pop.hidden = true;
                dots.classList.remove('is-open');
                dots.setAttribute('aria-expanded', 'false');
            }
        }, true);

        function close() {
            pop.hidden = true;
            dots.classList.remove('is-open');
            dots.setAttribute('aria-expanded', 'false');
        }
        function menuItem(label, icon, onClick) {
            var b = el('button', 'gm-item', icon + '<span>' + label + '</span>');
            b.type = 'button';
            b.setAttribute('role', 'menuitem');
            b.addEventListener('click', function () {
                close();
                if (onClick) onClick(b);
            });
            pop.appendChild(b);
            return b;
        }
        function proxy(label, icon, target, direct) {
            if (!target && !direct) return;
            if (target) target.hidden = true;
            menuItem(label, icon, function () { if (direct) direct(); else target.click(); });
        }
        proxy('Create preset', SVG.wand, null, function () {
            if (window.GhostFfxStyleUI && window.GhostFfxStyleUI.create) window.GhostFfxStyleUI.create();
        });
        proxy('Import preset', SVG.inbox, imp, function () {
            if (window.GhostFfxStyleUI && window.GhostFfxStyleUI.importPreset) window.GhostFfxStyleUI.importPreset();
        });
        menuItem('Export preset', SVG.share, exportStylePresets);
        proxy('Preset folder', SVG.folder, folder, function () {
            if (window.GhostFfxStyleUI && window.GhostFfxStyleUI.revealFolder) window.GhostFfxStyleUI.revealFolder();
        });
        var styleLangRow = menuItem('Language', SVG.globe, function () { openLangSheet('style'); });
        styleLangRow.classList.add('gp2-lang-row');
        styleLangRow.setAttribute('data-scope', 'style');
        styleLangRow.appendChild(el('span', 'gp2-lang-current', langLabel('style')));
        proxy('Cloud presets', SVG.cloud, cloud);
        wrap.appendChild(dots);
        wrap.appendChild(pop);
        bar.appendChild(wrap);

        actions.remove();
        /* the toolbar rides on the Web Presets header — title left, icons
           right, one single line so no vertical space is wasted */
        var sechead = panel.querySelector('.tk-ts-sechead.gp2-sechead');
        if (sechead) sechead.appendChild(bar);
        else head.parentNode.insertBefore(bar, head.nextSibling);
        if (head && !head.querySelector('*')) head.hidden = true;
    }


    function boot() {
        buildSections();
        upgradeBottomMenu();
        dropLegacyFavExport();
        buildStyleToolbar();
        applyAutoplayPreference();
    }

    function start() { setTimeout(boot, 220); setTimeout(boot, 900); }
    window.GhostBoot.push(start);
})();
