/*
 * GHOST Panel Preview shim (website only)
 * Loaded instead of the CEP runtime scripts so the real extension markup and
 * CSS render inside the landing-page preview with representative demo data.
 * The DOM/classes below mirror what js/main.js, js/command.js and js/tools.js
 * produce inside After Effects, so the preview matches the installed panels.
 */
(function () {
    "use strict";
    var doc = document;

    function el(tag, className, text) {
        var node = doc.createElement(tag);
        if (className) node.className = className;
        if (text != null) node.textContent = text;
        return node;
    }

    function thumb(hue, label) {
        var svg =
            '<svg xmlns="http://www.w3.org/2000/svg" width="320" height="200">' +
            '<defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1">' +
            '<stop offset="0" stop-color="hsl(' + hue + ',48%,42%)"/>' +
            '<stop offset="1" stop-color="hsl(' + ((hue + 40) % 360) + ',42%,22%)"/>' +
            "</linearGradient></defs>" +
            '<rect width="320" height="200" fill="url(#g)"/>' +
            '<text x="160" y="108" font-family="Segoe UI, sans-serif" font-size="22" fill="rgba(255,255,255,.85)" text-anchor="middle">' +
            label + "</text></svg>";
        return "data:image/svg+xml;charset=utf-8," + encodeURIComponent(svg);
    }

    var DEMO_ASSETS = [
        { name: "Logo_Reveal_Loop.mp4", type: "video", ext: "MP4", size: "18.4 MB", hue: 205, dur: "0:06" },
        { name: "Grain_Overlay_4K.mov", type: "video", ext: "MOV", size: "44.1 MB", hue: 268, dur: "0:12" },
        { name: "Share_Icon.svg", type: "vector", ext: "SVG", size: "12 KB", hue: 150 },
        { name: "Hero_Backdrop.png", type: "image", ext: "PNG", size: "3.2 MB", hue: 22 },
        { name: "Light_Leak_02.jpg", type: "image", ext: "JPG", size: "1.8 MB", hue: 340 },
        { name: "Whoosh_Transition.wav", type: "audio", ext: "WAV", size: "820 KB", hue: 190, dur: "0:02" },
        { name: "Paper_Texture.jpg", type: "image", ext: "JPG", size: "2.4 MB", hue: 42 },
        { name: "Arrow_Pack.ai", type: "vector", ext: "AI", size: "640 KB", hue: 96 },
        { name: "Cinematic_Riser.mp3", type: "audio", ext: "MP3", size: "1.1 MB", hue: 300, dur: "0:08" },
        { name: "Sky_Timelapse.mp4", type: "video", ext: "MP4", size: "62.7 MB", hue: 212, dur: "0:20" },
        { name: "Brush_Stroke_01.png", type: "image", ext: "PNG", size: "980 KB", hue: 8 },
        { name: "Inter_Display.otf", type: "font", ext: "OTF", size: "310 KB", hue: 60 }
    ];

    var DEMO_SOURCES = [
        { name: "01. Assets", count: 428 },
        { name: "Extension", count: 96 },
        { name: "Resource", count: 214 }
    ];

    /* ── GHOST CACHE ─────────────────────────────────────────────── */
    function bootCache() {
        var canvas = doc.getElementById("assetCanvas");
        var viewport = doc.getElementById("assetViewport");
        if (!canvas || !viewport) return;

        var empty = doc.getElementById("emptyState");
        if (empty) empty.hidden = true;

        var history = doc.getElementById("folderHistory");
        if (history) {
            history.innerHTML = "";
            var all = el("div", "history-item all-sources active");
            all.setAttribute("role", "listitem");
            all.appendChild(el("div", "history-name", "All Assets"));
            all.appendChild(el("span", "source-badge", String(DEMO_SOURCES.length)));
            history.appendChild(all);
            DEMO_SOURCES.forEach(function (source) {
                var row = el("div", "history-item");
                row.setAttribute("role", "listitem");
                row.appendChild(el("div", "history-name", source.name));
                row.appendChild(el("span", "source-badge", String(source.count)));
                row.addEventListener("click", function () {
                    Array.prototype.forEach.call(history.children, function (child) { child.classList.remove("active"); });
                    row.classList.add("active");
                });
                history.appendChild(row);
            });
        }
        var folderCount = doc.getElementById("folderCount");
        if (folderCount) folderCount.textContent = String(DEMO_SOURCES.length);
        var scanStatus = doc.getElementById("scanStatus");
        if (scanStatus) scanStatus.textContent = "Indexed 3 sources";
        var summary = doc.getElementById("librarySummary");
        if (summary) summary.textContent = "738 assets";

        var selected = -1;
        var cards = [];

        function card(asset, index) {
            var node = el("article", "asset-card");
            node.setAttribute("role", "gridcell");
            node.dataset.assetPath = "D:/GHOST/" + asset.name;
            node.dataset.index = String(index);

            var preview = el("div", "asset-preview");
            if (asset.type === "audio" || asset.type === "font") {
                var generic = el("div", "generic-preview");
                generic.appendChild(el("strong", null, asset.type.toUpperCase()));
                preview.appendChild(generic);
            } else {
                var image = doc.createElement("img");
                image.className = "asset-thumbnail loaded";
                image.alt = "";
                image.draggable = false;
                image.src = asset.url || thumb(asset.hue, asset.ext);
                preview.appendChild(image);
            }
            preview.appendChild(el("span", "type-pill", asset.ext));
            var duration = el("span", "duration-pill", asset.dur || "");
            duration.hidden = !asset.dur;
            preview.appendChild(duration);
            var favorite = el("button", "favorite-button", "☆");
            favorite.type = "button";
            favorite.addEventListener("click", function (event) {
                event.stopPropagation();
                var on = favorite.classList.toggle("active");
                favorite.textContent = on ? "★" : "☆";
            });
            preview.appendChild(favorite);

            var meta = el("div", "asset-meta");
            var name = el("div", "asset-name", asset.name);
            name.title = asset.name;
            var details = el("div", "asset-details");
            details.appendChild(el("span", "asset-ext", asset.type));
            details.appendChild(el("span", "asset-size", asset.size));
            meta.appendChild(name);
            meta.appendChild(details);

            node.appendChild(preview);
            node.appendChild(meta);
            node.addEventListener("click", function () {
                selected = index;
                layout();
                showBatchBar();
            });
            return node;
        }

        function replaceAssets(assets) {
            selected = -1;
            cards = [];
            canvas.innerHTML = "";
            assets.forEach(function (asset, index) {
                var node = card(asset, index);
                cards.push(node);
                canvas.appendChild(node);
            });
            if (summary) summary.textContent = assets.length + " Cloud assets";
            layout();
        }

        DEMO_ASSETS.forEach(function (asset, index) {
            var node = card(asset, index);
            cards.push(node);
            canvas.appendChild(node);
        });

        var sizes = { Compact: 180, Medium: 230, Large: 300 };
        var sizeLabel = doc.getElementById("gridSizeLabel");
        var cardWidth = 200;
        var gap = 12;

        function layout() {
            var width = viewport.clientWidth || 900;
            var columns = Math.max(1, Math.floor((width - gap) / (cardWidth + gap)));
            var previewHeight = Math.round(cardWidth * 0.72);
            var cardHeight = previewHeight + 62;
            var rowHeight = cardHeight + gap;
            var gridWidth = columns * cardWidth + (columns - 1) * gap;
            var left0 = Math.max(gap, Math.floor((width - gridWidth) / 2));
            cards.forEach(function (node, index) {
                var row = Math.floor(index / columns);
                var column = index % columns;
                node.style.width = cardWidth + "px";
                node.style.height = cardHeight + "px";
                node.style.transform = "translate(" + (left0 + column * (cardWidth + gap)) + "px," + (gap + row * rowHeight) + "px)";
                node.classList.toggle("selected", index === selected);
                var preview = node.querySelector(".asset-preview");
                if (preview) preview.style.height = previewHeight + "px";
            });
            canvas.style.height = (gap + Math.ceil(cards.length / columns) * rowHeight) + "px";
        }

        function setSize(delta) {
            var order = ["Compact", "Medium", "Large"];
            var current = order.indexOf(sizeLabel ? sizeLabel.textContent.trim() : "Compact");
            var next = Math.min(order.length - 1, Math.max(0, (current < 0 ? 0 : current) + delta));
            if (sizeLabel) sizeLabel.textContent = order[next];
            cardWidth = sizes[order[next]];
            layout();
        }

        var zoomIn = doc.getElementById("gridZoomInButton");
        var zoomOut = doc.getElementById("gridZoomOutButton");
        if (zoomIn) zoomIn.addEventListener("click", function () { setSize(1); });
        if (zoomOut) zoomOut.addEventListener("click", function () { setSize(-1); });

        var batchBar = doc.getElementById("batchBar");
        function showBatchBar() {
            if (!batchBar) return;
            batchBar.classList.add("visible");
            var count = batchBar.querySelector(".batch-count");
            if (count) count.textContent = "1 selected";
        }
        var clear = doc.getElementById("batchClearButton");
        if (clear) {
            clear.addEventListener("click", function () {
                selected = -1;
                if (batchBar) batchBar.classList.remove("visible");
                layout();
            });
        }

        bindGroup("#filterBar .filter-button", "active");
        bindGroup(".view-toggle .view-button", "active");

        var settingsButton = doc.getElementById("ghostSettingsButton");
        var settingsPopover = doc.getElementById("ghostSettingsPopover");
        if (settingsButton && settingsPopover) {
            settingsButton.addEventListener("click", function () { settingsPopover.classList.toggle("visible"); });
        }
        var moreButton = doc.getElementById("moreButton");
        var moreMenu = doc.getElementById("moreMenu");
        if (moreButton && moreMenu) {
            moreButton.addEventListener("click", function () { moreMenu.classList.toggle("visible"); });
        }

        window.addEventListener("resize", layout);
        layout();

        /* Use real uploaded assets in the website preview. The public showcase
           feed exposes thumbnails only; downloads remain licence-gated. */
        fetch("/api/public/v1/assets/showcase?limit=24")
            .then(function (response) {
                if (!response.ok) throw new Error("Showcase unavailable");
                return response.json();
            })
            .then(function (payload) {
                var assets = (payload.assets || []).map(function (asset) {
                    return {
                        name: asset.title || "Cloud asset",
                        type: asset.type || "image",
                        ext: String(asset.ext || "PNG").toUpperCase(),
                        size: asset.category || asset.pack || "Cloud",
                        url: asset.url
                    };
                }).filter(function (asset) { return !!asset.url; });
                if (assets.length) replaceAssets(assets);
            })
            .catch(function () { /* Demo cards remain as an offline fallback. */ });
        toast("Preview mode — this is the real GHOST CACHE interface.");
    }

    function bindGroup(selector, activeClass) {
        var nodes = doc.querySelectorAll(selector);
        Array.prototype.forEach.call(nodes, function (node) {
            node.addEventListener("click", function () {
                Array.prototype.forEach.call(nodes, function (other) { other.classList.remove(activeClass); });
                node.classList.add(activeClass);
            });
        });
    }

    function toast(message) {
        var region = doc.getElementById("toastRegion");
        if (!region) return;
        var node = el("div", "toast", message);
        region.appendChild(node);
        requestAnimationFrame(function () { node.classList.add("visible"); });
        setTimeout(function () {
            node.classList.remove("visible");
            setTimeout(function () { node.remove(); }, 250);
        }, 3200);
    }

    /* ── GHOST COMMAND ───────────────────────────────────────────── */
    function bootCommand() {
        var conversation = doc.getElementById("conversation");
        if (!conversation) return;

        var badge = doc.getElementById("connectionBadge");
        if (badge) {
            badge.classList.remove("pending", "error");
            badge.classList.add("online");
            var strong = badge.querySelector("b");
            if (strong) strong.textContent = "Online";
        }

        function append(label, text, kind) {
            var article = el("article", "message " + (kind || "assistant"));
            article.appendChild(el("div", "message-label", label));
            article.appendChild(el("p", null, text));
            conversation.appendChild(article);
            conversation.scrollTop = conversation.scrollHeight;
            return article;
        }

        conversation.innerHTML = "";
        append("You", "Make the selected logo layer pop in over 12 frames, then hold.", "user");
        append("GHOST", "Applied Pop-In to “Logo_Main”: scale 0 → 108 → 100 with eased Bezier keys across 12 frames, anchor centred. Undo group: GHOST · Pop In.", "assistant");
        append("You", "Remove the background of the selected footage.", "user");
        append("GHOST", "Cut-out generated and swapped into “Model_Shot.jpg” — transforms, masks and effects preserved. Saved to GHOST_NoBG/Model_Shot_nobg.png.", "assistant");

        var input = doc.getElementById("commandInput");
        var form = doc.getElementById("commandForm");
        Array.prototype.forEach.call(doc.querySelectorAll(".quick-actions [data-command]"), function (button) {
            button.addEventListener("click", function () {
                if (input) { input.value = button.getAttribute("data-command"); input.focus(); }
            });
        });
        if (form) {
            form.addEventListener("submit", function (event) {
                event.preventDefault();
                var value = input && input.value.trim();
                if (!value) return;
                append("You", value, "user");
                input.value = "";
                var thinking = append("GHOST", "Reading composition context…", "assistant thinking");
                setTimeout(function () {
                    thinking.remove();
                    append("GHOST", "Preview mode — in After Effects this runs on your live composition and reports every applied change here.", "assistant");
                }, 700);
            });
        }
        Array.prototype.forEach.call(doc.querySelectorAll("[data-ghost-removebg]"), function (button) {
            button.addEventListener("click", function () {
                append("GHOST", "Preview mode — Remove BG works on the layer selected in your After Effects timeline.", "assistant");
            });
        });
    }

    /* ── GHOST TOOLS ─────────────────────────────────────────────── */
    function bootTools() {
        var tabs = doc.querySelectorAll(".tools-tabs .tools-tab");
        if (!tabs.length) return;

        var toolsStatus = doc.getElementById("toolsStatus");
        if (toolsStatus) {
            toolsStatus.classList.remove("pending", "error");
            toolsStatus.classList.add("online");
            toolsStatus.textContent = "Connected";
        }
        Array.prototype.forEach.call(tabs, function (tab) {
            tab.addEventListener("click", function () {
                var key = tab.getAttribute("data-tab") || tab.getAttribute("data-tools-tab");
                Array.prototype.forEach.call(tabs, function (other) {
                    other.classList.remove("active");
                    other.setAttribute("aria-selected", "false");
                });
                tab.classList.add("active");
                tab.setAttribute("aria-selected", "true");
                var panels = doc.querySelectorAll(".tools-tab-panel");
                Array.prototype.forEach.call(panels, function (panel) {
                    var match = key && (panel.id === key || panel.id === "tab-" + key);
                    panel.hidden = !match;
                    panel.classList.toggle("active", !!match);
                });
            });
        });
        var status = doc.querySelectorAll(".tool-inline-status");
        Array.prototype.forEach.call(doc.querySelectorAll(".tool-card-actions button"), function (button) {
            button.addEventListener("click", function () {
                var card = button.closest(".tool-card");
                var line = card && card.querySelector(".tool-inline-status");
                if (line) line.textContent = "Preview mode — runs on your live After Effects project once installed.";
            });
        });
        if (status.length && status[0]) status[0].textContent = "Ready.";
    }

    function boot() {
        try { bootCache(); } catch (error) { /* preview only */ }
        try { bootCommand(); } catch (error) { /* preview only */ }
        try { bootTools(); } catch (error) { /* preview only */ }
        doc.body.classList.add("ghost-preview-mode");
    }

    if (doc.readyState === "loading") doc.addEventListener("DOMContentLoaded", boot);
    else boot();
}());
