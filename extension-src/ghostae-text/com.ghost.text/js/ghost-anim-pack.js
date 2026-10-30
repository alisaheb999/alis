/* ============================================================================
   Ghostae Text — Animation Pack (custom / AI-generated animations)
   ----------------------------------------------------------------------------
   One single description drives BOTH sides of the panel:

     • the card preview in the Animation tab (CSS keyframes built here), and
     • the real After Effects animator (the very same numbers are handed to
       GhostHost.toolkitApplyAdvancedAnimation).

   That is why a pasted animation cannot drift between preview and apply any
   more: there is no second, hand-written translation of the preset.

   The JSON below is intentionally flat and fully documented so an AI can be
   asked to "write a Ghostae animation pack" and produce something importable.
   Kept in ES5 for the legacy CEP (Chromium) engine that ships with older
   After Effects builds.
   ========================================================================= */
(function() {
  "use strict";

  var STORE_KEY = "ghostae.animationPacks.v1";
  /* v3.22.5 — the hand-added "Manual Extend" packs are retired. They were
     experiments and they shipped divergent motion, so they are cleared once
     per install instead of lingering in local storage. */
  var PURGE_KEY = "ghostae.animationPacks.purged.v3225";
  try {
    if (window.localStorage && !window.localStorage.getItem(PURGE_KEY)) {
      window.localStorage.removeItem(STORE_KEY);
      window.localStorage.setItem(PURGE_KEY, "1");
    }
  } catch (ePurge) {}

  /* v3.25.0 — the hand-added JSON pack badged MINE ("Soft Rise" / "Soft Res")
     is retired for good. The earlier one-off purge only matched "Soft Res",
     so the card survived under its real name. read() now filters these names
     on every load and rewrites storage, which also protects against the pack
     being re-imported from an old JSON file. */
  var RETIRED_PACKS = {
    "soft res": 1, "mine soft res": 1, "softres": 1,
    "soft rise": 1, "mine soft rise": 1, "softrise": 1
  };
  function isRetired(item) {
    var key = String(item && item.name || "").toLowerCase().replace(/\s+/g, " ").replace(/^\s+|\s+$/g, "");
    return Object.prototype.hasOwnProperty.call(RETIRED_PACKS, key);
  }


  var BASIS = { chars: 1, charsExcl: 1, words: 1, lines: 1 };
  var SHAPES = { square: 1, rampup: 1, rampdown: 1, triangle: 1, round: 1, smooth: 1 };

  var SPEC_TEXT = [
    "{",
    '  "format": "ghostae-animation-pack",',
    '  "version": 1,',
    '  "animations": [',
    "    {",
    '      "name": "Blur Rise",',
    '      "basis": "chars",          // chars | charsExcl | words | lines',
    '      "direction": "in",         // in = animate on, out = animate off',
    '      "duration": 1.2,           // seconds, 0.2 - 6',
    '      "stagger": 0.05,           // seconds between units, 0 - 0.4',
    '      "from": {                  // the offset state the text animates FROM',
    '        "opacity": 0,            // 0 - 100',
    '        "posX": 0,               // px',
    '        "posY": 60,              // px',
    '        "scale": 100,            // %, 100 = no scaling',
    '        "rotZ": 0,               // degrees',
    '        "rotX": 0,               // degrees (turns the layer 3D)',
    '        "rotY": 0,               // degrees (turns the layer 3D)',
    '        "blur": 20,              // px',
    '        "tracking": 0,           // letter spacing',
    '        "skew": 0,               // degrees',
    '        "useColor": false,',
    '        "color": "#ffffff"',
    "      },",
    '      "selector": {              // AE range selector, optional',
    '        "start": 0,',
    '        "end": 100,',
    '        "offset": 0,',
    '        "shape": "square",       // square | rampup | rampdown | triangle | round | smooth',
    '        "easeHigh": 40,          // -100 - 100',
    '        "easeLow": 0,',
    '        "randomize": false',
    "      }",
    "    }",
    "  ]",
    "}"
  ].join("\n");

  var PROMPT_TEXT = [
    "You are generating an animation pack for the Ghostae Text After Effects panel.",
    "Reply with JSON only — no prose, no markdown fence, no comments.",
    "",
    "Rules:",
    '- Top level: { "format": "ghostae-animation-pack", "version": 1, "animations": [ ... ] }',
    "- Every animation needs a unique short name (2-3 words).",
    '- basis: "chars" | "charsExcl" | "words" | "lines"',
    '- direction: "in" or "out"',
    "- duration: seconds (0.2 - 6) PER UNIT. stagger: seconds per unit (0 - 0.4).",
    '- easing: "linear" | "easeIn" | "easeOut" | "easeInOut" | "smooth" (default smooth).',
    "- from{} may ONLY contain: opacity, posX, posY, position, scale, scaleX, scaleY, rotZ, rotX, rotY,",
    "  blur, tracking, skew, useColor, color. Any other key is rejected, not ignored.",
    "- Values equal to the rest state (opacity 100, scale 100, everything else 0) are dropped: omit them.",
    '- Optional keyframes[]: { "property": "posY", "time": 0.2 | "6f", "value": -8,',
    '  "interpolation": "bezier" | "linear" | "hold", "easeIn": 85, "easeOut": 20 }.',
    "  Only use them for overshoot/hold curves, and only for properties present in from{}.",
    '- from: the state the text animates FROM — opacity 0-100, posX/posY px, scale % (100 = none),',
    "  rotZ/rotX/rotY degrees, blur px, tracking, skew degrees, useColor bool, color hex.",
    '- selector: start/end/offset 0-100, shape "square"|"rampup"|"rampdown"|"triangle"|"round"|"smooth",',
    "  easeHigh/easeLow -100..100, randomize bool.",
    "",
    "Example of one valid animation:",
    SPEC_TEXT
  ].join("\n");

  function num(value, fallback, min, max) {
    var out = Number(value);
    if (isNaN(out)) out = fallback;
    if (typeof min === "number" && out < min) out = min;
    if (typeof max === "number" && out > max) out = max;
    return out;
  }

  function slug(name) {
    return String(name).toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "") || "custom";
  }

  /* Accepts either the full pack object, a bare array, or a single animation.
     Also tolerates a ```json fence, which is what people usually paste. */
  function parse(text) {
    var raw = String(text || "").replace(/^\s*```(?:json)?/i, "").replace(/```\s*$/, "");
    raw = raw.replace(/\/\/[^\n\r]*/g, "");
    if (!raw.replace(/\s/g, "")) return { ok: false, error: "Paste the animation JSON first." };
    var data;
    try {
      data = JSON.parse(raw);
    } catch (e) {
      return { ok: false, error: "That is not valid JSON: " + (e.message || e) };
    }
    var list = [];
    if (data && data.animations && data.animations.length) list = data.animations;
    else if (data && data.length) list = data;
    else if (data && data.name) list = [data];
    if (!list.length) return { ok: false, error: 'No animations found — expected an "animations" array.' };
    var out = [];
    for (var i = 0; i < list.length; i += 1) {
      var one = normalize(list[i]);
      if (!one.ok) return one;
      out.push(one.spec);
    }
    return { ok: true, animations: out };
  }

  /* Reads the first alias present so pasted JSON may use posY / py / y etc.
     without silently losing the value before it reaches GhostMotion. */
  function pick(source, names) {
    for (var i = 0; i < names.length; i += 1) {
      if (source && Object.prototype.hasOwnProperty.call(source, names[i]) && source[names[i]] != null) {
        return source[names[i]];
      }
    }
    return undefined;
  }

  function normalize(input) {
    if (!input || typeof input !== "object") return { ok: false, error: "Each animation must be an object." };
    var name = String(input.name || "").replace(/^\s+|\s+$/g, "");
    if (!name) return { ok: false, error: 'Every animation needs a "name".' };
    var from = input.from || input.state || input.offsetState || {};
    var sel = input.selector || {};
    var basis = String(input.basis || input.basedOn || "chars");
    if (!BASIS[basis]) basis = "chars";
    var shape = String(sel.shape || input.shape || "square");
    if (!SHAPES[shape]) shape = "square";
    var colorRaw = String(pick(from, ["color", "fill", "fillColor"]) || "");
    return {
      ok: true,
      spec: {
        name: name.slice(0, 40),
        basis: basis,
        direction: String(input.direction || "in") === "out" ? "out" : "in",
        duration: num(input.duration, 1.2, 0.2, 6),
        stagger: num(input.stagger, 0.05, 0, 0.4),
        easing: input.easing || input.ease || null,
        keyframes: input.keyframes && input.keyframes.length ? input.keyframes : [],
        properties: input.properties || null,
        from: {
          opacity: num(pick(from, ["opacity", "alpha"]), 0, 0, 100),
          posX: num(pick(from, ["posX", "px", "positionX"]), 0, -2000, 2000),
          posY: num(pick(from, ["posY", "py", "positionY"]), 0, -2000, 2000),
          scale: num(pick(from, ["scale"]), 100, 0, 500),
          rotZ: num(pick(from, ["rotZ", "rotation", "rotationZ"]), 0, -720, 720),
          rotX: num(pick(from, ["rotX", "rotationX"]), 0, -720, 720),
          rotY: num(pick(from, ["rotY", "rotationY"]), 0, -720, 720),
          blur: num(pick(from, ["blur"]), 0, 0, 200),
          tracking: num(pick(from, ["tracking", "letterSpacing"]), 0, -100, 400),
          skew: num(pick(from, ["skew"]), 0, -80, 80),
          useColor: !!pick(from, ["useColor"]),
          color: /^#[0-9a-fA-F]{6}$/.test(colorRaw) ? colorRaw : "#ffffff"
        },

        selector: {
          start: num(sel.start, 0, 0, 100),
          end: num(sel.end, 100, 0, 100),
          offset: num(sel.offset, 0, -100, 100),
          shape: shape,
          easeHigh: num(sel.easeHigh, 0, -100, 100),
          easeLow: num(sel.easeLow, 0, -100, 100),
          randomize: !!sel.randomize
        }
      }
    };
  }

  /* ── persistence ─────────────────────────────────────────── */
  function read() {
    try {
      var raw = window.localStorage.getItem(STORE_KEY);
      var list = raw ? JSON.parse(raw) : [];
      if (!list || !list.length) return [];
      var kept = [];
      for (var i = 0; i < list.length; i += 1) {
        if (!isRetired(list[i])) kept.push(list[i]);
      }
      if (kept.length !== list.length) {
        try { window.localStorage.setItem(STORE_KEY, JSON.stringify(kept)); } catch (eW) {}
      }
      return kept;
    } catch (e) {
      return [];
    }
  }

  function write(list) {
    try {
      window.localStorage.setItem(STORE_KEY, JSON.stringify(list));
    } catch (e) {}
  }
  function list() {
    return read();
  }
  function add(specs) {
    var current = read();
    var byName = {};
    current.forEach(function(item, index) {
      byName[item.name.toLowerCase()] = index;
    });
    var added = 0, replaced = 0;
    specs.forEach(function(spec) {
      if (isRetired(spec)) return;
      var key = spec.name.toLowerCase();

      if (Object.prototype.hasOwnProperty.call(byName, key)) {
        current[byName[key]] = spec;
        replaced += 1;
      } else {
        byName[key] = current.length;
        current.push(spec);
        added += 1;
      }
    });
    write(current);
    return { added: added, replaced: replaced, total: current.length };
  }
  function remove(name) {
    var key = String(name).toLowerCase();
    write(read().filter(function(item) {
      return String(item.name).toLowerCase() !== key;
    }));
  }

  /* ── preview: CSS built from the exact same numbers as the apply call ── */
  function styleTag() {
    var tag = document.getElementById("ghostAnimPackStyles");
    if (!tag) {
      tag = document.createElement("style");
      tag.id = "ghostAnimPackStyles";
      document.head.appendChild(tag);
    }
    return tag;
  }

  var injected = {};
  /* The preview keyframes are generated from the SAME canonical model the
     After Effects adapter applies (GhostMotion.cssKeyframes). The legacy
     hand-written CSS below is only a fallback for a missing GhostMotion. */
  function keyframeName(spec, model) {
    var GM = window.GhostMotion;
    if (GM && model) {
      var css = GM.cssKeyframes(model);
      if (injected[css.name]) return css.name;
      styleTag().appendChild(document.createTextNode("@keyframes " + css.name + " { " + css.body + " }\n"));
      injected[css.name] = true;
      return css.name;
    }
    var key = "ghostPack-" + slug(spec.name);
    if (injected[key]) return key;
    var f = spec.from;
    var offset = "opacity: " + (f.opacity / 100) +
      "; transform: translate(" + f.posX + "px," + f.posY + "px) scale(" + (f.scale / 100) +
      ") rotateX(" + f.rotX + "deg) rotateY(" + f.rotY + "deg) rotate(" + f.rotZ + "deg) skewX(" + f.skew +
      "deg); filter: blur(" + f.blur + "px); letter-spacing: " + (f.tracking / 10) + "px;" +
      (f.useColor ? " color: " + f.color + ";" : "");
    var rest = "opacity: 1; transform: none; filter: blur(0); letter-spacing: normal;";
    var body = spec.direction === "out"
      ? "0% { " + rest + " } 100% { " + offset + " }"
      : "0% { " + offset + " } 100% { " + rest + " }";
    styleTag().appendChild(document.createTextNode("@keyframes " + key + " { " + body + " }\n"));
    injected[key] = true;
    return key;
  }


  function units(text, basis) {
    var source = String(text || "GHOST");
    if (basis === "words" || basis === "lines") {
      return source.split(/\s+/).filter(function(part) {
        return part !== "";
      });
    }
    try {
      return Array.from(source);
    } catch (e) {
      return source.split("");
    }
  }

  /* Returns a node ready to drop into a preset card. */
  /* Preview renders the SAME canonical model the Apply adapter consumes:
     timing, stagger order, direction and easing all come from GhostMotion. */
  function previewNode(spec, text) {
    var wrap = document.createElement("span");
    wrap.className = "tk-preview-text tk-seq tk-pack-preview";
    var GM = window.GhostMotion;
    var parts = GM ? GM.splitUnits(String(text || spec.name), spec.basis) : units(text, spec.basis);
    if (!parts.length) parts = ["G"];
    var model = null, plan = null, ease = "cubic-bezier(.16,1,.3,1)";
    if (GM) {
      var norm = GM.normalize(spec);
      if (norm.ok) {
        model = norm.model;
        plan = GM.timing(model, parts.length);
        ease = GM.cssEasing(model);
      }
    }
    var key = keyframeName(spec, model);
    for (var i = 0; i < parts.length; i += 1) {
      var unit = document.createElement("span");
      unit.className = "tk-seq-unit";
      unit.textContent = parts[i] === " " ? "\u00a0" : parts[i];
      var delay = plan ? plan.delayFor(i) : i * spec.stagger;
      var dur = plan ? plan.unitDuration : spec.duration;
      unit.style.animation = key + " " + dur + "s " + ease + " " + delay + "s infinite alternate both";
      if (spec.basis === "words" || spec.basis === "lines") unit.style.marginRight = "0.28em";
      wrap.appendChild(unit);
    }
    return wrap;
  }

  /* ── apply payload ─────────────────────────────────────────────────────
     The structured spec (from / selector / keyframes / properties) is sent
     verbatim so the host normalizer sees exactly the document the preview
     normalized. The flat legacy keys are kept for older host builds. */
  function payload(spec, options) {
    var opts = options || {};
    var f = spec.from;
    var body = {
      presetName: spec.name,
      name: spec.name,
      text: opts.text || spec.name,
      createLayer: !!opts.createLayer,
      from: f,
      selector: spec.selector,
      easing: spec.easing || null,
      keyframes: spec.keyframes || [],
      properties: spec.properties || null,
      opacity: f.opacity,
      posY: f.posY,
      posX: f.posX,
      scale: f.scale,
      rotZ: f.rotZ,
      rotX: f.rotX,
      rotY: f.rotY,
      blur: f.blur,
      tracking: f.tracking,
      skew: f.skew,
      color: f.color,
      useColor: f.useColor,
      start: spec.selector.start,
      end: spec.selector.end,
      offset: spec.selector.offset,
      basis: spec.basis,
      shape: spec.selector.shape,
      easeHigh: spec.selector.easeHigh,
      easeLow: spec.selector.easeLow,
      randomize: spec.selector.randomize,
      duration: opts.duration || spec.duration,
      stagger: spec.stagger,
      direction: spec.direction
    };
    if (opts.duration) body.from = f;
    return body;
  }


  window.GhostAnimPack = {
    SPEC_TEXT: SPEC_TEXT,
    PROMPT_TEXT: PROMPT_TEXT,
    parse: parse,
    list: list,
    add: add,
    remove: remove,
    previewNode: previewNode,
    payload: payload,
    slug: slug
  };
})();
