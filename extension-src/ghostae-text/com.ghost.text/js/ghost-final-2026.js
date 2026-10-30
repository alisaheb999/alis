/*! GHOSTAE Text — Final polish 2026 (additive, loads last) */
(function () {
    'use strict';
    var BM_KEY = 'ghost.toolkit.bookmarks';
    var DROP = /^(category|categories|all animations|advance animation|advanced animation|language|settings|panel settings)$/i;

    function toast(msg, cls) {
        var region = document.getElementById('toolkitToastRegion') || document.getElementById('toolsToastRegion');
        if (!region) return;
        var n = document.createElement('div');
        n.className = 'toast ' + (cls || '');
        n.textContent = msg;
        region.appendChild(n);
        setTimeout(function () { if (n.parentNode) n.parentNode.removeChild(n); }, 2600);
    }

    function pruneAnimMenu() {
        var panel = document.getElementById('tab-anim');
        if (!panel) return;
        var pops = panel.querySelectorAll('.gm-pop');
        for (var p = 0; p < pops.length; p += 1) {
            var pop = pops[p];
            var kids = pop.children;
            for (var i = kids.length - 1; i >= 0; i -= 1) {
                var node = kids[i];
                var label = (node.textContent || '').trim().split('\n')[0].trim();
                var isCat = node.classList.contains('tk-catbtn-wrap');
                var isLang = node.classList.contains('tk-langbtn-wrap') || node.classList.contains('gp2-lang-row');
                if (isCat || isLang || DROP.test(label)) node.remove();
            }
            var seps = pop.querySelectorAll('.gm-sep');
            for (var s = 0; s < seps.length; s += 1) {
                var el = seps[s];
                if (!el.previousElementSibling || !el.nextElementSibling ||
                    el.nextElementSibling.classList.contains('gm-sep')) el.remove();
            }
            if (!pop.children.length) {
                var wrap = pop.parentNode;
                if (wrap && wrap.classList.contains('gm-wrap')) wrap.style.display = 'none';
            }
        }
    }

    function hideAdvanced() {
        var tab = document.querySelector('.tools-tab[data-tab="advanced"]');
        if (!tab) return;
        tab.hidden = true;
        tab.setAttribute('aria-hidden', 'true');
        tab.tabIndex = -1;
        if (tab.classList.contains('active')) {
            var anim = document.querySelector('.tools-tab[data-tab="anim"]');
            if (anim) anim.click();
        }
    }

    function readFavs() {
        try { return JSON.parse(window.localStorage.getItem(BM_KEY) || '[]'); } catch (e) { return []; }
    }
    function writeFavs(list) {
        try { window.localStorage.setItem(BM_KEY, JSON.stringify(list)); return true; } catch (e) { return false; }
    }
    function normalise(input) {
        var raw = input && input.items != null ? input.items : input;
        if (Object.prototype.toString.call(raw) === '[object Array]') {
            return raw.filter(function (x) { return x != null; });
        }
        if (raw && typeof raw === 'object') {
            return Object.keys(raw).filter(function (k) { return !!raw[k]; });
        }
        return null;
    }
    function keyOf(entry) { return typeof entry === 'string' ? entry : JSON.stringify(entry); }

    function exportFavourites() {
        var items = readFavs();
        var payload = JSON.stringify({ ghostFavourites: 1, savedAt: new Date().toISOString(), count: items.length, items: items }, null, 2);
        var name = 'ghostae-favourites-' + new Date().toISOString().slice(0, 10) + '.json';
        try {
            var blob = new Blob([payload], { type: 'application/json' });
            var a = document.createElement('a');
            a.href = URL.createObjectURL(blob);
            a.download = name;
            document.body.appendChild(a);
            a.click();
            setTimeout(function () {
                URL.revokeObjectURL(a.href);
                if (a.parentNode) a.parentNode.removeChild(a);
            }, 400);
            toast('Favourites exported (' + items.length + ').', 'ok');
        } catch (e) {
            toast('Export is unavailable in this build.', 'error');
        }
    }

    function importFavourites() {
        var input = document.createElement('input');
        input.type = 'file';
        input.accept = '.json,application/json';
        input.style.display = 'none';
        document.body.appendChild(input);
        input.addEventListener('change', function () {
            var file = input.files && input.files[0];
            if (!file) { input.remove(); return; }
            var reader = new FileReader();
            reader.onload = function () {
                var items;
                try { items = normalise(JSON.parse(String(reader.result || ''))); } catch (e) { items = null; }
                if (!items) { toast('That file is not a favourites backup.', 'error'); input.remove(); return; }
                var merged = readFavs();
                var seen = {};
                merged.forEach(function (x) { seen[keyOf(x)] = 1; });
                var added = 0;
                items.forEach(function (x) {
                    var k = keyOf(x);
                    if (!seen[k]) { seen[k] = 1; merged.push(x); added += 1; }
                });
                if (!writeFavs(merged)) { toast('Could not save favourites.', 'error'); input.remove(); return; }
                toast(added ? added + ' favourite' + (added === 1 ? '' : 's') + ' imported — refreshing…' : 'Already up to date.', 'ok');
                input.remove();
                if (added) setTimeout(function () { window.location.reload(); }, 600);
            };
            reader.onerror = function () { toast('Could not read that file.', 'error'); input.remove(); };
            reader.readAsText(file);
        });
        input.click();
    }

    function bindFavRows() {
        var rows = document.querySelectorAll('#tab-anim .gm-item');
        for (var i = 0; i < rows.length; i += 1) {
            var row = rows[i];
            if (row.getAttribute('data-gf-fav')) continue;
            var label = (row.textContent || '').trim().toLowerCase();
            if (label.indexOf('export favo') === 0) {
                row.setAttribute('data-gf-fav', '1');
                row.addEventListener('click', function (e) { e.stopPropagation(); exportFavourites(); }, true);
            } else if (label.indexOf('import favo') === 0) {
                row.setAttribute('data-gf-fav', '1');
                row.addEventListener('click', function (e) { e.stopPropagation(); importFavourites(); }, true);
            }
        }
    }
    window.GhostFavourites = { exportAll: exportFavourites, importAll: importFavourites };

    function planLabel() {
        try {
            var api = window.GhostPlans;
            var v = api && (api.currentLabel ? api.currentLabel() : (api.current ? api.current() : null));
            if (v && typeof v === 'string') return v;
        } catch (e) {}
        return 'Lifetime';
    }
    function mountPlanChip() {
        var actions = document.querySelector('.tk-right-actions');
        if (!actions || document.getElementById('gfPlanChip')) return;
        var chip = document.createElement('span');
        chip.id = 'gfPlanChip';
        chip.className = 'gf-plan-chip';
        chip.title = 'Pro — ' + planLabel();
        chip.innerHTML =
            '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true">' +
            '<circle cx="12" cy="12" r="8.4" stroke-width="1.6"/><path d="M12 8.4v7.2M8.4 12h7.2"/></svg>' +
            '<span class="gf-plan-name"></span>';
        chip.querySelector('.gf-plan-name').textContent = planLabel();

        var search = document.getElementById('tkSearchBox');
        if (search && search.nextSibling) actions.insertBefore(chip, search.nextSibling);
        else actions.appendChild(chip);
    }

    function fastTabs() {
        var tabs = document.querySelectorAll('.tools-tab');
        for (var i = 0; i < tabs.length; i += 1) {
            tabs[i].addEventListener('pointerdown', function () {
                var shell = document.querySelector('.tools-shell');
                if (!shell) return;
                shell.classList.add('gf-switching');
                requestAnimationFrame(function () {
                    requestAnimationFrame(function () { shell.classList.remove('gf-switching'); });
                });
            }, { passive: true });
        }
    }

    function run() { hideAdvanced(); pruneAnimMenu(); bindFavRows(); mountPlanChip(); }

    function boot() {
        run();
        fastTabs();
        var queued = false;
        /* [perf] shared body observer; identical 80ms throttle. */
        window.GhostObserver.onBodyMutation(function () {
            if (queued) return;
            queued = true;
            setTimeout(function () { queued = false; run(); }, 80);
        });
        document.addEventListener('click', function () { setTimeout(run, 0); }, true);
    }

    window.GhostBoot.push(function () { setTimeout(boot, 120); });
})();
