/*!
 * Ghostae Text — Menu 2027 (v3.28.0)
 * Presentation-only re-arrangement of the existing toolbar controls:
 *  • top bar keeps just the search field and one 6-dot overflow menu
 *  • overflow menu proxies clicks to the panel's existing preset / cloud /
 *    upgrade buttons (the original nodes are moved, never re-implemented)
 *  • the favourites filter moves into the animation section toolbar
 *  • category + language controls move into a bottom overflow menu
 * No preset logic, animation or data flow is modified.
 */
(function () {
    'use strict';

    var SVG = {
        dots: '<svg viewBox="0 0 20 20" fill="currentColor" aria-hidden="true"><circle cx="7" cy="10" r="1.7"/><circle cx="13" cy="10" r="1.7"/></svg>',
        plus: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 4v16m8-8H4"/></svg>',
        importIco: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M9 13h6m-3-3v6m-9 1V7a2 2 0 012-2h6l2 2h6a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2z"/></svg>',
        exportIco: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"/></svg>',
        cloud: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M7 18a4 4 0 010-8 5.5 5.5 0 0110.6-1.5A3.75 3.75 0 0117 18H7z"/></svg>',
        rocket: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M15.6 14.4a6 6 0 01-5.85 7.35v-4.8m5.85-2.55A15 15 0 0021.75 2.25 15 15 0 009.6 8.4m6 6a15 15 0 01-5.85 2.6m-.1-8.55a6 6 0 00-7.4 5.85h4.8"/></svg>',
        planActive: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M9 12.75 11.25 15 15 9.75"/><path d="M12 2.25c-1.06 0-2.062.474-2.734 1.293a2.25 2.25 0 0 1-1.548.83 2.25 2.25 0 0 0-2.245 2.245 2.25 2.25 0 0 1-.83 1.548A2.25 2.25 0 0 0 3.75 9.75c0 .414.083.816.24 1.18a2.25 2.25 0 0 1 0 2.14 2.25 2.25 0 0 0 1.083 3 2.25 2.25 0 0 1 1.548.83 2.25 2.25 0 0 0 2.245 2.245 2.25 2.25 0 0 1 1.548.83c.672.82 1.673 1.293 2.734 1.293s2.062-.474 2.734-1.293a2.25 2.25 0 0 1 1.548-.83 2.25 2.25 0 0 0 2.245-2.245 2.25 2.25 0 0 1 .83-1.548c.82-.672 1.293-1.673 1.293-2.734s-.474-2.062-1.293-2.734a2.25 2.25 0 0 1-.83-1.548 2.25 2.25 0 0 0-2.245-2.245 2.25 2.25 0 0 1-1.548-.83A3.987 3.987 0 0 0 12 2.25Z"/></svg>'
    };

    /* Whether the current key/device is licensed right now. Read fresh on every
       call rather than cached, since activation can happen while the panel
       is already open (no reload). */
    function isLicensed() {
        try {
            if (window.GhostCloud && typeof window.GhostCloud.isLicensed === 'function') {
                return !!window.GhostCloud.isLicensed();
            }
        } catch (e) {}
        try {
            return document.body.getAttribute('data-ghost-licensed') === '1';
        } catch (e) {
            return false;
        }
    }

    function el(tag, cls, html) {
        var n = document.createElement(tag);
        if (cls) n.className = cls;
        if (html) n.innerHTML = html;
        return n;
    }

    var openPop = null;
    function closeOpen() {
        if (!openPop) return;
        openPop.pop.hidden = true;
        openPop.btn.classList.remove('is-open');
        openPop.btn.setAttribute('aria-expanded', 'false');
        openPop = null;
    }
    document.addEventListener('click', function (e) {
        if (openPop && !openPop.wrap.contains(e.target)) closeOpen();
    }, true);
    document.addEventListener('keydown', function (e) {
        if (e.key === 'Escape') closeOpen();
    });

    function makeMenu(opts) {
        var wrap = el('div', 'gm-wrap');
        var btn = el('button', 'gm-dots' + (opts.btnClass ? ' ' + opts.btnClass : ''), SVG.dots);
        btn.type = 'button';
        btn.title = opts.title || 'More options';
        btn.setAttribute('aria-haspopup', 'true');
        btn.setAttribute('aria-expanded', 'false');
        var pop = el('div', 'gm-pop' + (opts.popClass ? ' ' + opts.popClass : ''));
        pop.hidden = true;
        pop.setAttribute('role', 'menu');
        btn.addEventListener('click', function (e) {
            e.stopPropagation();
            var wasOpen = openPop && openPop.pop === pop;
            closeOpen();
            if (wasOpen) return;
            pop.hidden = false;
            btn.classList.add('is-open');
            btn.setAttribute('aria-expanded', 'true');
            openPop = { wrap: wrap, btn: btn, pop: pop };
        });
        wrap.appendChild(btn);
        wrap.appendChild(pop);
        return { wrap: wrap, pop: pop, btn: btn };
    }

    function item(label, icon, ink, onClick) {
        var b = el('button', 'gm-item' + (ink ? ' gm-ink-' + ink : ''), '<span class="gm-item-icon">' + icon + '</span><span>' + label + '</span>');
        b.type = 'button';
        b.setAttribute('role', 'menuitem');
        b.addEventListener('click', function () {
            closeOpen();
            onClick();
        });
        return b;
    }

    function proxy(selector, tabName) {
        return function () {
            if (tabName) {
                var tab = document.querySelector('.tools-tab[data-tab="' + tabName + '"]');
                if (tab && !tab.classList.contains('active')) tab.click();
            }
            var target = document.querySelector(selector);
            if (target) setTimeout(function () { target.click(); }, tabName ? 80 : 0);
        };
    }

    /* language button shows the currently selected language name only */
    function syncLangLabel(langWrap) {
        var btn = langWrap.querySelector('.tk-langbtn');
        var menu = langWrap.querySelector('.tk-langmenu');
        if (!btn) return;
        var label = btn.querySelector('.gm-lang-name');
        if (!label) {
            label = el('span', 'gm-lang-name');
            btn.appendChild(label);
        }
        function read() {
            var active = menu && menu.querySelector('.tk-langmenu-item.active .tk-langmenu-name');
            var txt = active ? active.textContent.trim() : '';
            label.textContent = txt || (btn.getAttribute('title') || '').replace(/^[^—]*—\s*/, '') || 'English';
        }
        read();
        if (menu) {
            new MutationObserver(read).observe(menu, { subtree: true, attributes: true, childList: true });
        }
        new MutationObserver(read).observe(btn, { attributes: true, attributeFilter: ['title'] });
    }

    function build() {
        var header = document.querySelector('.tools-header');
        var right = header && header.querySelector('.tk-right-actions');
        var toolbar = document.querySelector('#tab-anim .tk-panel-toolbar');
        if (!right || right.querySelector('.gm-wrap')) return;

        /* ── top overflow menu ── */
        var top = makeMenu({ title: 'More options' });
        var createPresetBtn = item('Create Preset', isLicensed() ? SVG.planActive : SVG.plus, isLicensed() ? 'emerald' : 'indigo', proxy('#ffxSaveButton', 'color'));
        createPresetBtn.classList.add('gm-item-create-preset');
        top.pop.appendChild(createPresetBtn);
        top.pop.appendChild(item('Import Preset', SVG.importIco, 'blue', proxy('#ffxImportButton', 'color')));
        top.pop.appendChild(item('Preset Folder', SVG.exportIco, 'cyan', proxy('#ffxFolderButton', 'color')));
        /* v3.41.0 — Cloud Presets entry retired with the cloud style grid. */
        top.pop.appendChild(el('div', 'gm-sep'));
        var upgrade = document.querySelector('.tk-right-actions .plan-upgrade-button');
        if (upgrade) {
            top.pop.appendChild(item('Upgrade Plan', SVG.rocket, 'amber', function () { upgrade.click(); }));
        }
        right.appendChild(top.wrap);

        /* Create Preset's icon doubles as the panel's plan-status indicator
           (saving a custom FFX preset is a paid-plan feature): a plain "+"
           means no active plan, a check-badge means the license is active
           right now. Re-checked whenever the menu opens and whenever the
           license state changes, since activation can happen live without
           reloading the panel. */
        function refreshCreatePresetIcon() {
            var btn = document.querySelector('.gm-item-create-preset');
            if (!btn) return;
            var iconWrap = btn.querySelector('.gm-item-icon');
            var licensed = isLicensed();
            if (iconWrap) iconWrap.innerHTML = licensed ? SVG.planActive : SVG.plus;
            btn.classList.toggle('gm-ink-emerald', licensed);
            btn.classList.toggle('gm-ink-indigo', !licensed);
            btn.title = licensed ? 'Create Preset — plan active' : 'Create Preset';
        }
        top.btn.addEventListener('click', refreshCreatePresetIcon);
        try {
            new MutationObserver(refreshCreatePresetIcon).observe(document.body, {
                attributes: true,
                attributeFilter: ['data-ghost-licensed']
            });
        } catch (e) {}

        /* ── favourites filter moves into the animation toolbar ── */
        var bm = document.getElementById('tkBookmarkFilter');
        if (bm && toolbar) toolbar.appendChild(bm);

        /* ── bottom overflow: category + language ── */
        if (toolbar) {
            var bottom = makeMenu({ title: 'Category & language' });
            var cat = toolbar.querySelector('.tk-catbtn-wrap');
            var lang = toolbar.querySelector('.tk-langbtn-wrap');
            if (cat) bottom.pop.appendChild(cat);
            if (lang) bottom.pop.appendChild(lang);
            if (cat || lang) toolbar.appendChild(bottom.wrap);
            if (lang) syncLangLabel(lang);
        }
    }

    window.GhostBoot.push(function () { setTimeout(build, 60); });
})();
