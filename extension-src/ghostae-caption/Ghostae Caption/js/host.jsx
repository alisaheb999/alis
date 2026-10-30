/*
 * Ghostae Caption — ExtendScript host (v1.2.3)
 *
 * Fixes in this version:
 * 1. GRADIENT NOW REALLY APPLIES. A text layer cannot hold a gradient fill,
 *    and putting ADBE Ramp on the text layer paints the whole layer box.
 *    So each caption line gets ONE companion full-comp solid with a Ramp,
 *    placed directly above the text layer and set to Alpha Track Matte.
 *    The Ramp lives on a NON-animated, NON-parented solid, so its Start/End
 *    points can never drift — the gradient band is permanently locked.
 *    If track mattes fail (very old AE), it falls back to a flat template fill.
 * 2. REAL WORD-BY-WORD ANIMATION using a Text Animator + Range Selector with
 *    Units = Index, Based On = Words (supported since AE CS6), instead of
 *    animating the whole line's transform.
 * 3. Every scripting call that differs between AE versions is wrapped in
 *    try/catch with a safe fallback, so old builds still produce captions.
 */

var GHOST_HOST_FILE = $.fileName;
var GHOST_LAST_FFX_ERROR = "";

/** Resolves the extension folder. The panel's absolute path wins; $.fileName is the fallback. */
function ghostExtRoot(extRoot) {
    if (extRoot) {
        try {
            var r = new Folder(String(extRoot));
            if (r.exists) return r;
        } catch (e0) {}
    }
    try {
        var r2 = File(GHOST_HOST_FILE).parent.parent;
        if (r2 && r2.exists) return r2;
    } catch (e1) {}
    return null;
}

/** Absolute File of an asset bundled inside the extension folder. */
function ghostExtFile(relative, extRoot) {
    var root = ghostExtRoot(extRoot);
    if (!root) return null;
    var f = new File(root.fsName + "/" + String(relative));
    return f.exists ? f : null;
}

/** Recursively shifts every keyframe under `prop` by `delta` seconds. */
function ghostShiftKeys(prop, delta) {
    if (!prop || !delta) return;
    var pt = 0;
    try { pt = prop.propertyType; } catch (e0) { return; }
    if (pt === PropertyType.PROPERTY) {
        try {
            if (prop.numKeys > 0) {
                for (var k = prop.numKeys; k >= 1; k--) {
                    prop.setKeyTime(k, prop.keyTime(k) + delta);
                }
            }
        } catch (e1) {}
        return;
    }
    if (pt === PropertyType.INDEXED_GROUP || pt === PropertyType.NAMED_GROUP) {
        for (var i = 1; i <= prop.numProperties; i++) {
            ghostShiftKeys(prop.property(i), delta);
        }
    }
}

/** Applies a Studio Text Animation .ffx to a caption text layer. */
function ghostApplyFfx(layer, relative, extRoot) {
    GHOST_LAST_FFX_ERROR = "";
    var f = ghostExtFile(relative, extRoot);
    if (!f) {
        GHOST_LAST_FFX_ERROR = "FFX ফাইল পাওয়া যায়নি: " + String(relative);
        return false;
    }
    try {
        var comp = layer.containingComp;
        if (comp) {
            try { comp.openInViewer(); } catch (eo) {}
            var others = comp.selectedLayers;
            for (var i = others.length - 1; i >= 0; i--) others[i].selected = false;
        }
        layer.selected = true;
        // applyPreset can throw while dialogs are suppressed — lift suppression briefly.
        var resumed = false;
        try { app.endSuppressDialogs(false); resumed = true; } catch (es) {}
        try {
            layer.applyPreset(f);
        } finally {
            if (resumed) { try { app.beginSuppressDialogs(); } catch (es2) {} }
        }
        layer.selected = false;
        // Preset keyframes land at time 0 — move them to the layer's inPoint.
        try { ghostShiftKeys(layer, layer.inPoint); } catch (sh) {}
        return true;
    } catch (e) {
        GHOST_LAST_FFX_ERROR = e.toString();
        try { layer.selected = false; } catch (es3) {}
        return false;
    }
}

/** Diagnostic: root path, ffx existence, and the real applyPreset error. */
function ghostDiagFfx(extRoot, relative) {
    var root = ghostExtRoot(extRoot);
    var f = root ? new File(root.fsName + "/" + String(relative)) : null;
    var lines = [];
    lines.push("ROOT: " + (root ? root.fsName : "(পাওয়া যায়নি)"));
    lines.push("FFX: " + (f ? f.fsName : "(n/a)") + " — exists=" + (f && f.exists ? "true" : "false"));
    lines.push("$.fileName: " + String(GHOST_HOST_FILE));
    lines.push("LAST ERROR: " + (GHOST_LAST_FFX_ERROR || "(কোনো error রেকর্ড নেই)"));
    return lines.join("\n");
}

function ghostJsonEscape(text) {
    return String(text).replace(/\\/g, "\\\\").replace(/"/g, '\\"').replace(/[\r\n]/g, " ");
}

function ghostResult(ok, message, extra) {
    var out = '{"ok":' + (ok ? "true" : "false") + ',"message":"' + ghostJsonEscape(message) + '"';
    if (extra) out += "," + extra;
    return out + "}";
}

function ghostActiveComp() {
    var project = app.project;
    if (!project) return null;
    var item = project.activeItem;
    if (item && item instanceof CompItem) return item;
    for (var i = 1; i <= project.numItems; i++) {
        if (project.item(i) instanceof CompItem) return project.item(i);
    }
    return null;
}

function ghostPing() {
    var comp = ghostActiveComp();
    return ghostResult(
        true,
        comp ? "সক্রিয় কম্পোজিশন: " + comp.name : "কোনো কম্পোজিশন পাওয়া যায়নি",
        '"comp":"' + ghostJsonEscape(comp ? comp.name : "") + '"'
    );
}

/* ---------------------------------------------------------------------- *
 * 4 premium templates: locked 2-stop gradient + per-word motion style.
 * ---------------------------------------------------------------------- */
function ghostTemplates() {
    return {
        royal_gold: {
            label: "Royal Gold",
            gradStart: [1.0, 0.97, 0.85],
            gradEnd: [1.0, 0.62, 0.05],
            motion: "pop",
            entrance: 0.26
        },
        cyan_rise: {
            label: "Cyan Rise",
            gradStart: [0.90, 0.99, 1.0],
            gradEnd: [0.0, 0.55, 0.85],
            motion: "rise",
            entrance: 0.32
        },
        sunset_glow: {
            label: "Sunset Glow",
            gradStart: [1.0, 0.95, 0.93],
            gradEnd: [0.95, 0.35, 0.28],
            motion: "tilt",
            entrance: 0.36
        },
        platinum_elite: {
            label: "Platinum Elite",
            gradStart: [1.0, 1.0, 1.0],
            gradEnd: [0.72, 0.76, 0.83],
            motion: "elegant",
            entrance: 0.38
        }
    };
}

/**
 * cuesJson: [{"start":0,"end":1.5,"text":"..."}]
 * optionsJson: { template, position, fontSizeScale, fontFamily }
 */
function ghostApplyCaptions(cuesJson, optionsJson) {
    var comp = ghostActiveComp();
    if (!comp) return ghostResult(false, "প্রথমে আফটার ইফেক্টসে একটি কম্পোজিশন ওপেন করুন (Open a composition in AE first).");

    var cues;
    try {
        cues = eval("(" + cuesJson + ")");
    } catch (parseError) {
        return ghostResult(false, "ক্যাপশন ডেটা রিড করা সম্ভব হয়নি।");
    }
    if (!cues || !cues.length) return ghostResult(false, "কোনো ক্যাপশন কিউ পাওয়া যায়নি।");

    var templates = ghostTemplates();
    var opts = {
        template: "royal_gold",
        position: "lower",
        fontSizeScale: 1.0,
        fontFamily: "Hind Siliguri",
        animPreset: "",
        extRoot: ""
    };
    if (optionsJson) {
        try {
            var parsedOpts = eval("(" + optionsJson + ")");
            if (parsedOpts) {
                if (parsedOpts.template && templates[parsedOpts.template]) opts.template = parsedOpts.template;
                if (parsedOpts.position) opts.position = parsedOpts.position;
                if (parsedOpts.fontSizeScale) opts.fontSizeScale = Number(parsedOpts.fontSizeScale) || 1.0;
                if (parsedOpts.fontFamily) opts.fontFamily = parsedOpts.fontFamily;
                if (parsedOpts.animPreset) opts.animPreset = String(parsedOpts.animPreset);
                if (parsedOpts.extRoot) opts.extRoot = String(parsedOpts.extRoot);
            }
        } catch (e) {
            // Keep defaults
        }
    }
    var tpl = templates[opts.template] || templates.royal_gold;

    var yRatio = 0.78;
    if (opts.position === "bottom") yRatio = 0.88;
    else if (opts.position === "lower") yRatio = 0.78;
    else if (opts.position === "center") yRatio = 0.50;
    else if (opts.position === "top") yRatio = 0.16;

    var baseFontSize = Math.max(22, Math.round(comp.height * 0.058 * opts.fontSizeScale));
    var strokeWidth = Math.max(4, Math.round(comp.height * 0.008));
    var strokeColor = [0.02, 0.02, 0.03];
    var maxLineWidth = comp.width * 0.86;
    var targetCenterX = comp.width / 2;
    var targetCenterY = comp.height * yRatio;
    var riseOffset = baseFontSize * 1.1;

    // Freeze UI/render feedback while building: this is what keeps AE (and the
    // whole machine) responsive when hundreds of caption layers are created.
    var prevMB = false, prevMFR = false, suppressed = false;
    try { prevMB = comp.motionBlur; comp.motionBlur = false; } catch (mbE) {}
    try { app.beginSuppressDialogs(); suppressed = true; } catch (sdE) {}

    app.beginUndoGroup("Ghostae Captions");
    var created = 0;
    var gradientOk = 0;
    var presetApplied = 0;
    try {

        for (var i = 0; i < cues.length; i++) {
            var cue = cues[i];
            var start = Number(cue.start) || 0;
            var end = Number(cue.end);
            if (!(end > start)) end = start + 1.2;
            end = Math.min(end, comp.duration);
            start = Math.max(0, start);
            if (end <= start) continue;

            var rawText = String(cue.text || "").replace(/^\s+|\s+$/g, "");
            if (!rawText) continue;

            // ONE text layer per caption line.
            var built = ghostBuildCueLayer(comp, rawText, baseFontSize, strokeColor, strokeWidth, tpl, opts.fontFamily, start, end, maxLineWidth);
            if (!built || !built.layer) continue;
            var layer = built.layer;

            layer.name = "Caption " + (i + 1);
            try { layer.preserveTransparency = false; } catch (preserveErr) {}
            try { layer.motionBlur = false; } catch (mbErr) {}

            // Center the line at the target position.
            try {
                layer.property("Transform").property("Position").setValue([targetCenterX, targetCenterY]);
            } catch (posErr) {}

            // Animation: a bundled Studio Text Animation .ffx when one is
            // selected in the panel, otherwise the built-in word reveal.
            var presetOk = false;
            if (opts.animPreset) {
                presetOk = ghostApplyFfx(layer, opts.animPreset, opts.extRoot);
                if (presetOk) presetApplied++;
            }
            if (!presetOk) {
                ghostAnimateWords(layer, built.wordCount, start, end, tpl, riseOffset, baseFontSize);
            } else {
                // Keep the tail fade so captions still exit cleanly.
                try {
                    var opX = layer.property("Transform").property("Opacity");
                    var fadeStart = end - 0.14;
                    if (fadeStart > start) { opX.setValueAtTime(fadeStart, 100); opX.setValueAtTime(end, 0); }
                } catch (fadeE) {}
            }

            // Locked gradient using a matte solid above this text layer.
            if (ghostAttachGradient(comp, layer, tpl, targetCenterX, targetCenterY, built.width, built.height, baseFontSize, i + 1)) {
                gradientOk++;
            }

            created++;
        }


        app.endUndoGroup();
        ghostRestoreUI(comp, prevMB, suppressed);
        if (created === 0) {
            return ghostResult(false, "কোনো বৈধ ক্যাপশন কিউ যুক্ত করা যায়নি।");
        }
        var note = gradientOk === created
            ? " গ্রেডিয়েন্ট লক করা হয়েছে।"
            : (gradientOk === 0 ? " (এই AE ভার্সনে গ্রেডিয়েন্ট সাপোর্ট নেই, সলিড কালার ব্যবহার হয়েছে।)" : "");
        if (opts.animPreset) {
            note += presetApplied === created
                ? " অ্যানিমেশন প্রিসেট প্রয়োগ হয়েছে।"
                : (presetApplied === 0
                    ? " (অ্যানিমেশন প্রিসেট প্রয়োগ করা যায়নি, ডিফল্ট মোশন ব্যবহার হয়েছে।" + (GHOST_LAST_FFX_ERROR ? " কারণ: " + GHOST_LAST_FFX_ERROR + ")" : ")")
                    : " " + presetApplied + "টি লেয়ারে প্রিসেট প্রয়োগ হয়েছে।");
        }
        return ghostResult(true, created + "টি ক্যাপশন লাইন " + tpl.label + " স্টাইলে যুক্ত হয়েছে।" + note, '"created":' + created);
    } catch (buildError) {
        try { app.endUndoGroup(); } catch (e2) {}
        ghostRestoreUI(comp, prevMB, suppressed);
        return ghostResult(false, "লেয়ার তৈরি করতে ত্রুটি হয়েছে: " + buildError.toString());
    }
}

/** Restores comp/app state and frees caches so AE stays responsive. */
function ghostRestoreUI(comp, prevMB, suppressed) {
    if (suppressed) { try { app.endSuppressDialogs(false); } catch (e1) {} }
    try { comp.motionBlur = prevMB; } catch (e2) {}
    try { app.purge(PurgeTarget.ALL_CACHES); } catch (e3) {}
}


/** Creates ONE styled text layer holding a whole caption line, word-wrapped. */
function ghostBuildCueLayer(comp, text, baseFontSize, strokeColor, strokeWidth, tpl, fontFamily, start, end, maxLineWidth) {
    var layer;
    try {
        layer = comp.layers.addText(text);
    } catch (addErr) {
        return null;
    }
    layer.startTime = 0;
    layer.inPoint = start;
    layer.outPoint = end;

    function styleWith(value) {
        var doc = layer.property("Source Text").value;
        try { doc.resizeText = false; } catch (e0) {}
        doc.fontSize = baseFontSize;
        doc.justification = ParagraphJustification.CENTER_JUSTIFY;
        try {
            doc.font = "HindSiliguri-Bold";
        } catch (fontErr) {
            try { doc.font = fontFamily; } catch (fontErr2) {}
        }
        doc.applyFill = true;
        // White base fill: the gradient solid mattes through this alpha, so a
        // neutral white keeps the gradient colours pure. If the gradient step
        // fails we recolour the fill to the template colour afterwards.
        doc.fillColor = [1, 1, 1];
        doc.applyStroke = false; // Stroke OFF by default (user request)
        doc.strokeColor = strokeColor;
        doc.strokeWidth = strokeWidth;
        try { doc.strokeOverFill = false; } catch (strokeOrderErr) {}
        doc.text = value;
        layer.property("Source Text").setValue(doc);
    }

    styleWith(text);

    // Word-wrap by measuring the real rendered width of the growing line.
    var words = text.split(/\s+/);
    var wordCount = words.length;
    // Only run the (expensive) per-word measuring loop when the single line
    // actually overflows. Most captions fit, so this skips it entirely.
    var fullRect = layer.sourceRectAtTime(start, false);
    if (wordCount > 1 && fullRect.width > maxLineWidth) {

        var lines = [];
        var current = words[0];
        for (var w = 1; w < wordCount; w++) {
            var candidate = current + " " + words[w];
            styleWith(candidate);
            var probe = layer.sourceRectAtTime(start, false);
            if (probe.width > maxLineWidth) {
                lines.push(current);
                current = words[w];
            } else {
                current = candidate;
            }
        }
        lines.push(current);
        styleWith(lines.join("\r"));
    }

    var rect = layer.sourceRectAtTime(start, false);
    try {
        layer.property("Transform").property("Anchor Point").setValue([
            rect.left + rect.width / 2,
            rect.top + rect.height / 2
        ]);
    } catch (anchorErr) {}

    return { layer: layer, wordCount: wordCount, width: rect.width, height: rect.height };
}

/**
 * Real word-by-word entrance. Uses a Text Animator whose Range Selector is set
 * to Units = Index and Based On = Words; animating the selector Start from the
 * first to the last word reveals the words one by one.
 */
function ghostAnimateWords(layer, wordCount, start, end, tpl, riseOffset, baseFontSize) {
    var duration = Math.max(0.1, end - start);
    var animEnd = Math.min(start + Math.max(tpl.entrance, duration * 0.62), end - 0.02);
    if (animEnd <= start) animEnd = Math.min(start + 0.12, end);

    var ok = false;
    try {
        var textProps = layer.property("ADBE Text Properties");
        var animators = textProps.property("ADBE Text Animators");
        var animator = animators.addProperty("ADBE Text Animator");
        try { animator.name = "Ghost Word Reveal"; } catch (nameErr) {}

        var selector = animator.property("ADBE Text Selectors").addProperty("ADBE Text Selector");
        // Units: 1 = Percentage, 2 = Index
        try { selector.property("ADBE Text Range Units").setValue(2); } catch (unitsErr) {}
        // Based On: 1 Characters, 2 Characters excl. spaces, 3 Words, 4 Lines
        try { selector.property("ADBE Text Range Type2").setValue(3); } catch (basedErr) {}

        var startProp = selector.property("ADBE Text Index Start");
        var endProp = selector.property("ADBE Text Index End");
        try { endProp.setValue(wordCount); } catch (endErr) {}

        // Selected words are affected (hidden / offset). Sliding Start from 0
        // to wordCount progressively releases each word, left to right.
        startProp.setValueAtTime(start, 0);
        startProp.setValueAtTime(animEnd, wordCount);
        try {
            var easeIn = new KeyframeEase(0, 60);
            var easeOut = new KeyframeEase(0, 60);
            startProp.setTemporalEaseAtKey(1, [easeIn], [easeOut]);
            startProp.setTemporalEaseAtKey(2, [easeIn], [easeOut]);
        } catch (easeErr) {}

        var animProps = animator.property("ADBE Text Animator Properties");
        try { animProps.addProperty("ADBE Text Opacity").setValue(0); } catch (opErr) {}

        if (tpl.motion === "pop") {
            try { animProps.addProperty("ADBE Text Scale 3D").setValue([40, 40, 100]); } catch (e1) {}
        } else if (tpl.motion === "rise") {
            try { animProps.addProperty("ADBE Text Position 3D").setValue([0, riseOffset, 0]); } catch (e2) {}
            try { animProps.addProperty("ADBE Text Scale 3D").setValue([88, 88, 100]); } catch (e3) {}
        } else if (tpl.motion === "tilt") {
            try { animProps.addProperty("ADBE Text Rotation").setValue(-14); } catch (e4) {}
            try { animProps.addProperty("ADBE Text Position 3D").setValue([0, riseOffset * 0.5, 0]); } catch (e5) {}
        } else {
            // Blur animators are extremely expensive per character, so the
            // "glow" style uses a scale pop instead — same look, no lag.
            try { animProps.addProperty("ADBE Text Scale 3D").setValue([92, 92, 100]); } catch (e6) {}
        }

        ok = true;
    } catch (animatorErr) {
        ok = false;
    }

    // Fallback for AE builds where text animators are unavailable: fade the
    // whole line in so captions are never invisible or unanimated.
    if (!ok) {
        try {
            var opacity = layer.property("Transform").property("Opacity");
            opacity.setValueAtTime(start, 0);
            opacity.setValueAtTime(animEnd, 100);
        } catch (fadeErr) {}
    }

    // Gentle fade-out at the tail of the cue.
    try {
        var fadeOutStart = end - 0.14;
        if (fadeOutStart > animEnd) {
            var op2 = layer.property("Transform").property("Opacity");
            op2.setValueAtTime(fadeOutStart, 100);
            op2.setValueAtTime(end, 0);
        }
    } catch (tailErr) {}
}

/**
 * Links the matte layer to the text layer below it. AE 23+ (2023) requires the
 * setTrackMatte() API — plain `trackMatteType = ...` silently does nothing
 * there, which is why gradients used to detach from the text. Older builds
 * still use the property, so both paths are attempted and the result verified.
 */
function ghostSetAlphaMatte(matteLayer, textLayer) {
    try {
        if (typeof matteLayer.setTrackMatte === "function") {
            matteLayer.setTrackMatte(textLayer, TrackMatteType.ALPHA);
            try { if (matteLayer.trackMatteType === TrackMatteType.ALPHA) return true; } catch (chk) { return true; }
        }
    } catch (apiErr) {}
    try {
        matteLayer.trackMatteType = TrackMatteType.ALPHA;
        return matteLayer.trackMatteType === TrackMatteType.ALPHA;
    } catch (propErr) {}
    return false;
}

/**
 * Locked gradient: a solid holding a Ramp sits directly above the text layer
 * and is alpha-matted by it, so the gradient shows only inside the glyphs.
 * The solid is only as large as the caption line (never full comp) — a full
 * frame solid per caption is what made playback and the whole PC crawl.
 */
function ghostAttachGradient(comp, layer, tpl, centerX, centerY, textWidth, textHeight, baseFontSize, index) {
    var solid = null;
    try {
        var padX = Math.round(baseFontSize * 1.2);
        var padY = Math.round(baseFontSize * 1.6);
        var solidW = Math.min(comp.width, Math.max(64, Math.round((textWidth || comp.width * 0.6) + padX * 2)));
        var solidH = Math.min(comp.height, Math.max(48, Math.round((textHeight || baseFontSize * 1.4) + padY * 2)));

        solid = comp.layers.addSolid([1, 1, 1], "Caption " + index + " Gradient", solidW, solidH, 1);
        solid.startTime = 0;
        solid.inPoint = layer.inPoint;
        solid.outPoint = layer.outPoint;
        solid.moveBefore(layer);
        try { solid.motionBlur = false; } catch (mb) {}
        try { solid.property("Transform").property("Position").setValue([centerX, centerY]); } catch (posErr) {}

        var ramp = solid.property("ADBE Effect Parade").addProperty("ADBE Ramp");
        // Ramp points are in LAYER space, so they stay locked to the caption.
        try { ramp.property("ADBE Ramp-0001").setValue([solidW / 2, padY]); } catch (r1) {}
        try { ramp.property("ADBE Ramp-0002").setValue(tpl.gradStart); } catch (r2) {}
        try { ramp.property("ADBE Ramp-0003").setValue([solidW / 2, solidH - padY]); } catch (r3) {}
        try { ramp.property("ADBE Ramp-0004").setValue(tpl.gradEnd); } catch (r4) {}
        try { ramp.property("ADBE Ramp-0005").setValue(1); } catch (r5) {} // 1 = Linear Ramp
        try { ramp.property("ADBE Ramp-0007").setValue(0); } catch (r7) {} // Blend With Original

        if (!ghostSetAlphaMatte(solid, layer)) throw new Error("track matte unavailable");
        try { solid.preserveTransparency = false; } catch (pt) {}
        try { solid.locked = false; } catch (lk) {}
        return true;
    } catch (gradientErr) {
        // Old AE / no track matte support: remove the solid and recolour the
        // text fill with the template's primary colour instead.
        if (solid) { try { solid.remove(); } catch (rmErr) {} }
        try {
            var doc = layer.property("Source Text").value;
            doc.applyFill = true;
            doc.fillColor = tpl.gradStart;
            layer.property("Source Text").setValue(doc);
        } catch (fillErr) {}
        return false;
    }
}


/* ---------------------------------------------------------------------- *
 * Returns the media file path of the layer selected in the AE timeline,
 * so the panel can upload that layer's audio without a manual file pick.
 * ---------------------------------------------------------------------- */
function ghostSelectedLayerMedia() {
    var comp = ghostActiveComp();
    if (!comp) return ghostResult(false, "প্রথমে একটি কম্পোজিশন ওপেন করুন।");
    var sel = [];
    try { sel = comp.selectedLayers; } catch (e) { sel = []; }
    if (!sel || !sel.length) return ghostResult(false, "টাইমলাইনে একটি অডিও/ভিডিও লেয়ার সিলেক্ট করুন।");

    for (var i = 0; i < sel.length; i++) {
        var layer = sel[i];
        var src = null;
        try { src = layer.source; } catch (e1) { src = null; }
        if (!src) continue;
        var f = null;
        try { f = src.file; } catch (e2) { f = null; }
        if (!f) continue;
        var hasAudio = true;
        try { hasAudio = src.hasAudio; } catch (e3) { hasAudio = true; }
        if (!hasAudio) continue;
        var path = "";
        try { path = f.fsName; } catch (e4) { try { path = f.fullName; } catch (e5) { path = ""; } }
        if (!path) continue;
        return ghostResult(true, "লেয়ার নির্বাচিত: " + layer.name,
            '"path":"' + ghostJsonEscape(path) + '","name":"' + ghostJsonEscape(src.name || layer.name) + '"');
    }
    return ghostResult(false, "নির্বাচিত লেয়ারে কোনো অডিও ফাইল পাওয়া যায়নি।");
}

/* ---------------------------------------------------------------------- *
 * Renders ONLY the audio of a media file (video or audio) to a small
 * WAV/AIFF in the temp folder via the Render Queue, and returns the real
 * output path. The panel reads that file and uploads it — the original
 * video is never uploaded. Throws/cleans up properly on failure.
 * ---------------------------------------------------------------------- */
function ghostPickAudioTemplate(om) {
    // Find an installed audio-only output template on this AE install.
    var wanted = ["WAV", "Wave", "Audio Only", "AIFF"];
    var list = [];
    try { list = om.templates; } catch (e) { list = []; }
    var i, j;
    for (i = 0; i < wanted.length; i++) {
        for (j = 0; j < list.length; j++) {
            if (String(list[j]).toLowerCase() === String(wanted[i]).toLowerCase()) {
                try { om.applyTemplate(list[j]); return list[j]; } catch (e1) {}
            }
        }
    }
    for (j = 0; j < list.length; j++) {
        var nm = String(list[j]).toLowerCase();
        if (nm.indexOf("wav") >= 0 || nm.indexOf("audio") >= 0 || nm.indexOf("aif") >= 0) {
            try { om.applyTemplate(list[j]); return list[j]; } catch (e2) {}
        }
    }
    return "";
}

function ghostForceAudioOnly(om) {
    // AE 2020+ : set format/switches directly when no template matched.
    try {
        om.setSettings({ "Format": "WAV", "Output Audio": "Audio Only", "Video Output": false });
        return "wav";
    } catch (e) {}
    try {
        om.setSettings({ "Format": "AIFF", "Output Audio": "Audio Only", "Video Output": false });
        return "aif";
    } catch (e2) {}
    try { om.setSettings({ "Output Audio": "Audio Only" }); } catch (e3) {}
    return "";
}

function ghostFindRendered(folderPath, baseName) {
    var folder = new Folder(folderPath);
    var files = [];
    try { files = folder.getFiles(); } catch (e) { files = []; }
    for (var i = 0; i < files.length; i++) {
        var f = files[i];
        var nm = "";
        try { nm = f.name; } catch (e1) { continue; }
        if (nm.indexOf(baseName) !== 0) continue;
        try { if (f.length > 100) return f; } catch (e2) {}
    }
    return null;
}

function ghostExtractAudio(sourcePath) {
    var tempComp = null;
    var footage = null;
    var rqItem = null;
    try {
        if (!sourcePath) return ghostResult(false, "ফাইলের পাথ পাওয়া যায়নি।");
        var srcFile = new File(sourcePath);
        if (!srcFile.exists) return ghostResult(false, "ফাইলটি খুঁজে পাওয়া যায়নি: " + sourcePath);

        footage = app.project.importFile(new ImportOptions(srcFile));
        var hasAudio = true;
        try { hasAudio = footage.hasAudio; } catch (hErr) { hasAudio = true; }
        if (!hasAudio) return ghostResult(false, "এই ফাইলে কোনো অডিও ট্র্যাক নেই।");

        var dur = 60;
        try { dur = Math.max(1, footage.duration || 60); } catch (dErr) { dur = 60; }

        // 4x4 @ 1 fps keeps the video side of the render nearly free (no PC lag).
        tempComp = app.project.items.addComp("GhostAudioTemp", 4, 4, 1, dur, 1);
        try { tempComp.motionBlur = false; } catch (mbErr) {}
        try { app.beginSuppressDialogs(); } catch (bsErr) {}
        var avLayer = tempComp.layers.add(footage);
        // Keep the layer ON — disabling it can mute the audio as well.
        try { avLayer.audioEnabled = true; } catch (aeErr) {}

        var baseName = "ghost_audio_" + (new Date().getTime());
        var tempDir = Folder.temp.fsName;

        rqItem = app.project.renderQueue.items.add(tempComp);
        rqItem.render = true;
        var om = rqItem.outputModule(1);

        var tplUsed = ghostPickAudioTemplate(om);
        var ext = "wav";
        if (tplUsed) {
            var t = String(tplUsed).toLowerCase();
            if (t.indexOf("aif") >= 0) ext = "aif";
            else if (t.indexOf("mp3") >= 0) ext = "mp3";
            else ext = "wav";
        } else {
            var forced = ghostForceAudioOnly(om);
            if (forced) ext = forced;
        }
        try { om.setSettings({ "Output Audio": "Audio Only", "Video Output": false }); } catch (soErr) {}
        // Small, server-friendly audio: mono 16-bit 22.05 kHz (~2.6 MB/min).
        try { om.setSettings({ "Audio Bit Depth": "16", "Audio Channels": "Mono", "Audio Sample Rate": "22.050" }); } catch (asErr) {}

        om.file = new File(tempDir + "/" + baseName + "." + ext);

        var prevMFR = null;
        try { prevMFR = app.preferences.getPrefAsLong("Multi Frame Rendering", "MFR_ENABLED"); } catch (pfErr) { prevMFR = null; }
        try { if (prevMFR !== null) app.preferences.savePrefAsLong("Multi Frame Rendering", "MFR_ENABLED", 0); } catch (pf2Err) {}

        app.project.renderQueue.render();

        try { if (prevMFR !== null) app.preferences.savePrefAsLong("Multi Frame Rendering", "MFR_ENABLED", prevMFR); } catch (pf3Err) {}
        try { app.endSuppressDialogs(false); } catch (esErr) {}

        var status = "";
        try { status = String(rqItem.status); } catch (stErr) { status = ""; }

        // Locate the file AE actually produced (extension may differ).
        var found = null;
        var direct = new File(tempDir + "/" + baseName + "." + ext);
        if (direct.exists && direct.length > 100) found = direct;
        if (!found) { try { var of = om.file; if (of && of.exists && of.length > 100) found = of; } catch (ofErr) {} }
        if (!found) found = ghostFindRendered(tempDir, baseName);

        if (!found) {
            var hint = tplUsed ? ("টেমপ্লেট: " + tplUsed) : "কোনো অডিও আউটপুট টেমপ্লেট পাওয়া যায়নি";
            throw new Error("রেন্ডার শেষে অডিও ফাইল তৈরি হয়নি (" + hint + ", স্ট্যাটাস: " + status + ")। After Effects এর Output Module এ WAV/AIFF সাপোর্ট আছে কিনা দেখুন।");
        }

        var finalPath = found.fsName;
        var finalName = found.name;

        try { if (rqItem) rqItem.remove(); } catch (rErr1) {}
        try { if (tempComp) tempComp.remove(); } catch (rErr2) {}
        try { if (footage && footage.usedIn.length === 0) footage.remove(); } catch (rErr3) {}
        try { app.purge(PurgeTarget.ALL_CACHES); } catch (pErr) {}

        return ghostResult(true, "অডিও এক্সপোর্ট সম্পন্ন।",
            '"path":"' + ghostJsonEscape(finalPath) + '","name":"' + ghostJsonEscape(finalName) + '"');
    } catch (err) {
        try { app.endSuppressDialogs(false); } catch (esErr2) {}
        try { if (rqItem) rqItem.remove(); } catch (cErr1) {}
        try { if (tempComp) tempComp.remove(); } catch (cErr2) {}
        try { if (footage && footage.usedIn.length === 0) footage.remove(); } catch (cErr3) {}
        return ghostResult(false, "অডিও এক্সপোর্ট ব্যর্থ হয়েছে: " + (err && err.message ? err.message : String(err)));
    }
}
