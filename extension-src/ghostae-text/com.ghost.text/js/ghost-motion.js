/* ============================================================================
   Ghostae Text — Canonical Motion Model  (ONE source of truth)
   ----------------------------------------------------------------------------
   Ghost Motion JSON
     -> validate()          strict, never silently drops properties
     -> normalize()         Canonical Motion Model (units resolved, clamped)
     -> timing()            the single timing/selector solver
     -> Preview renderer    (ghost-anim-pack.js, CSS keyframes)
     -> AE Apply adapter    (host.jsx, native After Effects properties)

   This file is loaded by BOTH sides:
     • the CEP panel loads it as a normal <script>  (attaches to window)
     • host.jsx $.evalFile's it into ExtendScript   (attaches to $.global)

   Because Preview and Apply read the same model and the same solver, the panel
   can no longer show something After Effects will not build. Any property the
   Apply adapter cannot map is reported as a validation error — never ignored.

   ES5 only: the legacy CEP engine and ExtendScript both have to parse this.
   ========================================================================= */
(function (root) {
  "use strict";

  var VERSION = 3;

  /* ── property table: canonical name -> native AE text-animator property ──
     dim      expected dimension (1 = number, 2/3/4 = array length)
     unit     px | percent | degrees | color  (documentation + validation)
     rest     the value AE shows when the animation is finished (no effect) */
  var PROPERTY_TABLE = {
    opacity:    { matchName: "ADBE Text Opacity",          dim: 1, unit: "percent", rest: 100,        min: 0,     max: 100 },
    position:   { matchName: "ADBE Text Position",         dim: 2, unit: "px",      rest: [0, 0],     min: -12000, max: 12000 },
    scale:      { matchName: "ADBE Text Scale",            dim: 2, unit: "percent", rest: [100, 100], min: -1000, max: 1000 },
    rotation:   { matchName: "ADBE Text Rotation",         dim: 1, unit: "degrees", rest: 0,          min: -3600, max: 3600 },
    rotationX:  { matchName: "ADBE Text Rotation X",       dim: 1, unit: "degrees", rest: 0,          min: -3600, max: 3600, needs3D: true },
    rotationY:  { matchName: "ADBE Text Rotation Y",       dim: 1, unit: "degrees", rest: 0,          min: -3600, max: 3600, needs3D: true },
    blur:       { matchName: "ADBE Text Blur",             dim: 2, unit: "px",      rest: [0, 0],     min: 0,     max: 500 },
    tracking:   { matchName: "ADBE Text Tracking Amount",  dim: 1, unit: "px",      rest: 0,          min: -500,  max: 1000 },
    skew:       { matchName: "ADBE Text Skew",             dim: 1, unit: "degrees", rest: 0,          min: -85,   max: 85 },
    fillColor:  { matchName: "ADBE Text Fill Color",       dim: 4, unit: "color",   rest: null }
  };

  /* Accepted JSON aliases -> canonical property name. A JSON key is NEVER
     assumed to be an AE property name. */
  var PROPERTY_ALIASES = {
    opacity: "opacity", alpha: "opacity",
    position: "position", pos: "position",
    posx: "position.x", px: "position.x",
    posy: "position.y", py: "position.y",
    posz: "position.z",
    scale: "scale", scalex: "scale.x", scaley: "scale.y",
    rotation: "rotation", rotz: "rotation", rotationz: "rotation",
    rotx: "rotationX", rotationx: "rotationX",
    roty: "rotationY", rotationy: "rotationY",
    blur: "blur", blurx: "blur.x", blury: "blur.y",
    tracking: "tracking", letterspacing: "tracking",
    skew: "skew",
    color: "fillColor", fill: "fillColor", fillcolor: "fillColor",
    usecolor: "@useColor"
  };

  var BASIS = { chars: 1, charsExcl: 2, words: 3, lines: 4 };
  var SHAPES = { square: 1, rampup: 2, rampdown: 3, triangle: 4, round: 5, smooth: 6 };

  /* ── easing: one table, two representations of the same curve ───────────
     bezier  = CSS cubic-bezier control points (preview)
     ae      = KeyframeEase(speed, influence) pairs (After Effects)      */
  var EASINGS = {
    linear:    { bezier: [0, 0, 1, 1],           ae: { inInfluence: 0.1,  outInfluence: 0.1 } },
    easeIn:    { bezier: [0.42, 0, 1, 1],        ae: { inInfluence: 0.1,  outInfluence: 75 } },
    easeOut:   { bezier: [0, 0, 0.3, 1],         ae: { inInfluence: 75,   outInfluence: 0.1 } },
    easeInOut: { bezier: [0.45, 0, 0.55, 1],     ae: { inInfluence: 60,   outInfluence: 60 } },
    smooth:    { bezier: [0.16, 1, 0.3, 1],      ae: { inInfluence: 85,   outInfluence: 20 } }
  };
  var EASING_ALIASES = {
    linear: "linear", none: "linear",
    "ease-in": "easeIn", easein: "easeIn", in: "easeIn",
    "ease-out": "easeOut", easeout: "easeOut", out: "easeOut",
    "ease-in-out": "easeInOut", easeinout: "easeInOut", inout: "easeInOut",
    smooth: "smooth", expo: "smooth", "default": "smooth"
  };

  function has(obj, key) { return obj && Object.prototype.hasOwnProperty.call(obj, key); }
  function low(value) { return String(value == null ? "" : value).toLowerCase().replace(/[\s_]+/g, ""); }
  function isNum(value) { return typeof value === "number" && isFinite(value); }

  function clamp(value, min, max) {
    if (isNum(min) && value < min) return min;
    if (isNum(max) && value > max) return max;
    return value;
  }

  /* ── time: ONE conversion function for the whole system ─────────────────
     value may be a number (seconds by default) or { frames: n } / "12f".  */
  function toSeconds(value, fps, unitHint) {
    var rate = isNum(fps) && fps > 0 ? fps : 25;
    if (value == null) return null;
    if (typeof value === "object") {
      if (isNum(value.frames)) return value.frames / rate;
      if (isNum(value.seconds)) return value.seconds;
      if (isNum(value.value)) return toSeconds(value.value, rate, value.unit || unitHint);
      return null;
    }
    var text = String(value).replace(/\s+/g, "");
    var frameMatch = /^(-?[0-9.]+)f$/i.exec(text);
    if (frameMatch) return Number(frameMatch[1]) / rate;
    var seconds = Number(text);
    if (!isFinite(seconds)) return null;
    if (low(unitHint) === "frames") return seconds / rate;
    return seconds;
  }

  function toFrames(seconds, fps) {
    var rate = isNum(fps) && fps > 0 ? fps : 25;
    return Math.round(Number(seconds) * rate);
  }

  /* ── colour: hex / array / object -> AE [r,g,b,a] 0..1 ── */
  function toRgba(value) {
    if (value == null) return null;
    if (value instanceof Array || (typeof value === "object" && isNum(value.length))) {
      var arr = [];
      for (var i = 0; i < 4; i += 1) {
        var part = Number(value[i]);
        if (!isFinite(part)) part = i === 3 ? 1 : 0;
        if (part > 1) part = part / 255;
        arr.push(clamp(part, 0, 1));
      }
      return arr;
    }
    if (typeof value === "object") {
      if (isNum(value.r)) return toRgba([value.r, value.g, value.b, has(value, "a") ? value.a : 1]);
      return null;
    }
    var hex = String(value).replace(/^#/, "");
    if (hex.length === 3) hex = hex[0] + hex[0] + hex[1] + hex[1] + hex[2] + hex[2];
    if (!/^[0-9a-fA-F]{6}$/.test(hex)) return null;
    return [
      parseInt(hex.slice(0, 2), 16) / 255,
      parseInt(hex.slice(2, 4), 16) / 255,
      parseInt(hex.slice(4, 6), 16) / 255,
      1
    ];
  }

  function toHex(rgba) {
    function part(n) {
      var v = Math.round(clamp(Number(n) || 0, 0, 1) * 255).toString(16);
      return v.length < 2 ? "0" + v : v;
    }
    if (!rgba) return "#ffffff";
    return "#" + part(rgba[0]) + part(rgba[1]) + part(rgba[2]);
  }

  /* ── normalize ─────────────────────────────────────────────────────────
     Accepts:
       • an animation-pack entry  { name, basis, direction, duration, stagger,
                                    from:{...}, selector:{...} }
       • the flat legacy apply payload { presetName, opacity, posY, start... }
     Returns { ok:true, model } or { ok:false, errors:[...] }.            */
  function normalize(input, options) {
    var opts = options || {};
    var errors = [];
    var warnings = [];

    if (!input || typeof input !== "object") {
      return { ok: false, errors: ["Motion document must be an object."] };
    }

    var fps = isNum(opts.fps) ? opts.fps : (isNum(input.fps) ? input.fps : 25);
    var name = String(input.name || input.presetName || "").replace(/^\s+|\s+$/g, "");
    if (!name) errors.push('Missing "name".');

    var basisRaw = low(input.basis || input.basedOn || "chars");
    var basisKey = null;
    if (basisRaw === "chars" || basisRaw === "characters" || basisRaw === "char") basisKey = "chars";
    else if (basisRaw === "charsexcl" || basisRaw === "charactersexcludingspaces") basisKey = "charsExcl";
    else if (basisRaw === "words" || basisRaw === "word") basisKey = "words";
    else if (basisRaw === "lines" || basisRaw === "line") basisKey = "lines";
    if (!basisKey) { basisKey = "chars"; warnings.push('Unknown basis "' + input.basis + '" — using chars.'); }

    var direction = low(input.direction) === "out" ? "out" : "in";

    var duration = toSeconds(has(input, "duration") ? input.duration : 1.2, fps, input.timeUnit);
    if (duration == null) { errors.push('"duration" is not a valid time value.'); duration = 1.2; }
    duration = clamp(duration, 0.05, 30);

    var stagger = toSeconds(has(input, "stagger") ? input.stagger : 0.05, fps, input.timeUnit);
    if (stagger == null) { errors.push('"stagger" is not a valid time value.'); stagger = 0; }
    stagger = clamp(stagger, 0, 2);

    var easingName = EASING_ALIASES[low(input.easing || input.ease || "smooth")];
    if (!easingName) {
      warnings.push('Unknown easing "' + input.easing + '" — using smooth.');
      easingName = "smooth";
    }

    /* ---- offset state (the state the text animates FROM) ---- */
    var source = input.from || input.state || input.offsetState || input;
    /* When the document supplies an explicit offset-state object, every key in
       it must map to a real After Effects animator property: silently ignoring
       one is exactly how Preview and Apply used to drift apart. */
    var strictSource = !!(input.from || input.state || input.offsetState);
    var META_KEYS = { usecolor: 1, color: 1, name: 1, comment: 1, notes: 1 };
    var offsetState = {};
    var pending = { position: null, scale: null, blur: null };
    var useColor = has(source, "useColor") ? !!source.useColor : (has(input, "useColor") ? !!input.useColor : false);

    function ensureVec(key, restValue) {
      if (!pending[key]) pending[key] = [restValue[0], restValue[1]];
      return pending[key];
    }

    for (var rawKey in source) {
      if (!has(source, rawKey)) continue;
      var value = source[rawKey];
      if (typeof value === "function" || value == null) continue;
      var canonical = PROPERTY_ALIASES[low(rawKey)];
      if (!canonical) {
        if (strictSource && !META_KEYS[low(rawKey)]) {
          errors.push('Property "' + rawKey + '" is not a supported Ghost Motion property.');
        }
        continue; /* container/meta keys are handled elsewhere */
      }
      if (canonical === "@useColor") continue;

      var dot = canonical.indexOf(".");
      if (dot > 0) {
        var base = canonical.slice(0, dot);
        var axis = canonical.slice(dot + 1);
        var spec = PROPERTY_TABLE[base];
        var num = Number(value);
        if (!isFinite(num)) { errors.push('Property "' + rawKey + '" must be a number.'); continue; }
        var vec = ensureVec(base, spec.rest);
        var index = axis === "y" ? 1 : (axis === "z" ? 2 : 0);
        if (index === 2 && spec.dim < 3) { warnings.push("position.z ignored: animator position is 2D."); continue; }
        vec[index] = clamp(num, spec.min, spec.max);
        continue;
      }

      var propSpec = PROPERTY_TABLE[canonical];
      if (!propSpec) { errors.push('Property "' + rawKey + '" cannot be applied in After Effects.'); continue; }

      if (canonical === "fillColor") {
        var rgba = toRgba(value);
        if (!rgba) { errors.push('Property "' + rawKey + '" is not a valid colour.'); continue; }
        offsetState.fillColor = { value: rgba, hex: toHex(rgba) };
        continue;
      }

      if (propSpec.dim === 1) {
        var single = Number(value);
        if (!isFinite(single)) { errors.push('Property "' + rawKey + '" must be a number.'); continue; }
        offsetState[canonical] = { value: clamp(single, propSpec.min, propSpec.max) };
        continue;
      }

      /* dim 2 property given as a number (uniform) or as an array */
      if (value instanceof Array || (typeof value === "object" && isNum(value.length))) {
        var out = [];
        for (var d = 0; d < propSpec.dim; d += 1) {
          var comp = Number(value[d]);
          if (!isFinite(comp)) comp = propSpec.rest[d];
          out.push(clamp(comp, propSpec.min, propSpec.max));
        }
        pending[canonical] = out;
      } else {
        var uni = Number(value);
        if (!isFinite(uni)) { errors.push('Property "' + rawKey + '" must be a number or array.'); continue; }
        pending[canonical] = [clamp(uni, propSpec.min, propSpec.max), clamp(uni, propSpec.min, propSpec.max)];
      }
    }

    for (var vecKey in pending) {
      if (!has(pending, vecKey) || !pending[vecKey]) continue;
      offsetState[vecKey] = { value: pending[vecKey] };
    }

    if (offsetState.fillColor && !useColor) delete offsetState.fillColor;
    if (useColor && !offsetState.fillColor) {
      var fallback = toRgba(source.color || input.color || "#ffffff");
      offsetState.fillColor = { value: fallback, hex: toHex(fallback) };
    }

    /* Drop properties whose offset value equals the rest value: they would be
       written to AE as a no-op and would also do nothing in the preview. */
    var active = {};
    for (var key in offsetState) {
      if (!has(offsetState, key)) continue;
      var table = PROPERTY_TABLE[key];
      var entry = offsetState[key];
      if (key !== "fillColor" && isRest(entry.value, table.rest)) {
        warnings.push('Property "' + key + '" equals its rest value — no keyframes needed.');
        continue;
      }
      active[key] = {
        canonical: key,
        matchName: table.matchName,
        dim: table.dim,
        unit: table.unit,
        needs3D: !!table.needs3D,
        offsetValue: entry.value,
        restValue: table.rest,
        hex: entry.hex || null
      };
    }

    /* ---- range selector ---- */
    var sel = input.selector || {};
    var shapeKey = low(sel.shape || input.shape || "square");
    if (shapeKey === "ramp-up") shapeKey = "rampup";
    if (shapeKey === "ramp-down") shapeKey = "rampdown";
    if (!SHAPES[shapeKey]) {
      if (sel.shape || input.shape) warnings.push('Unknown selector shape "' + (sel.shape || input.shape) + '" — using square.');
      shapeKey = "square";
    }

    function selNum(key, fallbackValue, min, max) {
      var raw = has(sel, key) ? sel[key] : (has(input, key) ? input[key] : fallbackValue);
      var out = Number(raw);
      if (!isFinite(out)) {
        if (raw != null && raw !== "") errors.push('selector.' + key + ' must be a number.');
        out = fallbackValue;
      }
      return clamp(out, min, max);
    }

    var model = {
      version: VERSION,
      name: name || "Custom",
      basis: basisKey,
      basedOn: BASIS[basisKey],
      direction: direction,
      fps: fps,
      timing: { duration: duration, stagger: stagger, unit: "seconds" },
      easing: {
        name: easingName,
        bezier: EASINGS[easingName].bezier,
        ae: EASINGS[easingName].ae
      },
      selector: {
        start: selNum("start", 0, 0, 100),
        end: selNum("end", 100, 0, 100),
        offset: selNum("offset", 0, -100, 100),
        shape: shapeKey,
        shapeCode: SHAPES[shapeKey],
        easeHigh: selNum("easeHigh", 0, -100, 100),
        easeLow: selNum("easeLow", 0, -100, 100),
        randomize: !!(sel.randomize || input.randomize)
      },
      properties: active,
      text: input.text != null ? String(input.text) : null,
      createLayer: !!input.createLayer,
      warnings: warnings
    };

    if (!countKeys(active)) errors.push("No animatable properties found — the text would not move.");
    if (errors.length) return { ok: false, errors: errors, warnings: warnings };
    return { ok: true, model: model };
  }

  function isRest(value, rest) {
    if (rest == null) return false;
    if (value instanceof Array) {
      for (var i = 0; i < value.length; i += 1) {
        if (Number(value[i]) !== Number(rest[i])) return false;
      }
      return true;
    }
    return Number(value) === Number(rest);
  }

  function countKeys(obj) {
    var n = 0;
    for (var k in obj) { if (has(obj, k)) n += 1; }
    return n;
  }

  function propertyList(model) {
    var out = [];
    for (var key in model.properties) {
      if (has(model.properties, key)) out.push(model.properties[key]);
    }
    return out;
  }

  /* ── timing solver — the single place stagger/duration is interpreted ──
     Preview: unit i animates for `unitDuration` starting at `delayFor(i)`.
     After Effects: one Range Selector Offset sweep. The selector window is
     solved so a single unit spends exactly `unitDuration` in transition:

        r = unitDuration / total
        unitWidth = 100 / unitCount
        window = 100 * (r - unitWidth/100) / (1 - r)

     Both descriptions therefore encode the same motion.               */
  function timing(model, unitCount) {
    var n = Math.max(1, Math.round(Number(unitCount) || 1));
    var unitDuration = model.timing.duration;
    var stagger = model.timing.stagger;
    var total = unitDuration + stagger * Math.max(0, n - 1);
    var unitWidth = 100 / n;
    var ratio = total > 0 ? unitDuration / total : 1;

    var window = 100;
    if (ratio < 1) window = 100 * (ratio - unitWidth / 100) / (1 - ratio);
    if (!isFinite(window) || window < unitWidth) window = unitWidth;
    if (window > 100) window = 100;

    var out = model.direction === "out";
    /* Offset sweeps the window across the text. IN ends with the window
       pushed past the text (no effect left); OUT starts there. */
    var offsetFrom = out ? -window : model.selector.offset - window;
    var offsetTo = out ? 100 : 100;
    if (out) { offsetFrom = -window; offsetTo = 100; }

    return {
      unitCount: n,
      unitDuration: unitDuration,
      stagger: stagger,
      total: total,
      unitWidth: unitWidth,
      delayFor: function (index) {
        var order = index;
        if (model.selector.randomize) {
          order = Math.abs(Math.round(Math.sin((index + 1) * 777.7) * n)) % n;
        }
        if (out) order = n - 1 - order;
        return order * stagger;
      },
      /* the AE Apply adapter reads only this block */
      ae: {
        basedOn: model.basedOn,
        shapeCode: model.selector.shapeCode,
        randomize: model.selector.randomize,
        easeHigh: model.selector.easeHigh,
        easeLow: model.selector.easeLow,
        rangeStart: 0,
        rangeEnd: window,
        offsetFrom: offsetFrom,
        offsetTo: offsetTo,
        /* the offset property is keyframed at exactly these relative times */
        keyTimes: [0, total],
        keyValues: out ? [offsetTo, offsetFrom] : [offsetFrom, offsetTo],
        influenceIn: model.easing.ae.inInfluence,
        influenceOut: model.easing.ae.outInfluence
      }
    };
  }

  /* -- preview CSS built from the SAME normalized properties Apply writes --
     Anything the AE adapter cannot express is not in model.properties, so it
     cannot appear in the preview either. */
  function cssKeyframes(model) {
    var props = propertyList(model);
    var decls = [];
    var tx = 0, ty = 0, sx = 1, sy = 1, rz = 0, rx = 0, ry = 0, sk = 0, blur = 0;
    var useTransform = false, useBlur = false;
    for (var i = 0; i < props.length; i += 1) {
      var p = props[i], v = p.offsetValue;
      if (p.canonical === "opacity") { decls.push("opacity: " + (Number(v) / 100)); continue; }
      if (p.canonical === "tracking") { decls.push("letter-spacing: " + (Number(v) / 10) + "px"); continue; }
      if (p.canonical === "fillColor") { decls.push("color: " + (p.hex || toHex(v))); continue; }
      if (p.canonical === "blur") { blur = Number(v[0]); useBlur = true; continue; }
      useTransform = true;
      if (p.canonical === "position") { tx = Number(v[0]); ty = Number(v[1]); }
      else if (p.canonical === "scale") { sx = Number(v[0]) / 100; sy = Number(v[1]) / 100; }
      else if (p.canonical === "rotation") rz = Number(v);
      else if (p.canonical === "rotationX") rx = Number(v);
      else if (p.canonical === "rotationY") ry = Number(v);
      else if (p.canonical === "skew") sk = Number(v);
    }
    if (useTransform) {
      decls.push("transform: translate(" + tx + "px," + ty + "px) scale(" + sx + "," + sy +
        ") rotateX(" + rx + "deg) rotateY(" + ry + "deg) rotate(" + rz + "deg) skewX(" + sk + "deg)");
    }
    if (useBlur) decls.push("filter: blur(" + blur + "px)");

    var restDecls = [];
    for (var d = 0; d < decls.length; d += 1) {
      var name = decls[d].split(":")[0];
      if (name === "opacity") restDecls.push("opacity: 1");
      else if (name === "letter-spacing") restDecls.push("letter-spacing: normal");
      else if (name === "transform") restDecls.push("transform: none");
      else if (name === "filter") restDecls.push("filter: blur(0px)");
      else if (name === "color") restDecls.push("color: inherit");
    }
    var offset = decls.join("; ") + (decls.length ? ";" : "");
    var rest = restDecls.join("; ") + (restDecls.length ? ";" : "");
    var body = model.direction === "out"
      ? "0% { " + rest + " } 100% { " + offset + " }"
      : "0% { " + offset + " } 100% { " + rest + " }";
    return { offset: offset, rest: rest, body: body, name: cssKeyframeName(model) };
  }

  function cssKeyframeName(model) {
    return "ghostMotion-" + stableSignature(model).replace(/[^a-zA-Z0-9_-]+/g, "-");
  }

  function cssEasing(model) {
    var b = model.easing.bezier;
    return "cubic-bezier(" + b[0] + "," + b[1] + "," + b[2] + "," + b[3] + ")";
  }

  /* Unit splitting — shared so Preview and Apply agree on unit counts. */
  function splitUnits(text, basis) {
    var source = String(text == null ? "" : text);
    if (basis === "lines") return source.split(/\r\n|\r|\n/);
    if (basis === "words") {
      var words = source.split(/\s+/), keep = [];
      for (var i = 0; i < words.length; i += 1) { if (words[i] !== "") keep.push(words[i]); }
      return keep;
    }
    var chars = [];
    for (var c = 0; c < source.length; c += 1) {
      if (basis === "charsExcl" && /\s/.test(source.charAt(c))) continue;
      chars.push(source.charAt(c));
    }
    return chars;
  }

  function unitCount(text, basis) {
    var list = splitUnits(text, basis);
    return list.length ? list.length : 1;
  }

  /* The expected result the Apply verifier compares against. */
  function expectation(model, unitCountValue, startTime) {
    var plan = timing(model, unitCountValue);
    var t0 = Number(startTime) || 0;
    var props = propertyList(model);
    var expected = [];
    for (var i = 0; i < props.length; i += 1) {
      expected.push({
        property: props[i].canonical,
        matchName: props[i].matchName,
        dim: props[i].dim,
        value: props[i].offsetValue,
        keyframes: 0
      });
    }
    expected.push({
      property: "selector.offset",
      matchName: "ADBE Text Percent Offset",
      dim: 1,
      keyframes: 2,
      keyTimes: [t0 + plan.ae.keyTimes[0], t0 + plan.ae.keyTimes[1]],
      keyValues: plan.ae.keyValues
    });
    return { plan: plan, expected: expected };
  }

  function snapTime(seconds, fps) {
    var rate = isNum(fps) && fps > 0 ? fps : 25;
    return Math.round(Number(seconds) * rate) / rate;
  }

  function cloneValue(value) {
    if (!(value instanceof Array)) return value;
    var out = [];
    for (var i = 0; i < value.length; i += 1) out.push(value[i]);
    return out;
  }

  function normalizeInterpolation(value) {
    var key = low(value || "bezier");
    if (key === "hold" || key === "step") return "hold";
    if (key === "linear") return "linear";
    return "bezier";
  }

  function explicitKeyframes(input, model, property) {
    var source = input.keyframes || [];
    var nested = input.properties && input.properties[property.canonical];
    if (nested && nested.keyframes) source = source.concat(nested.keyframes);
    var out = [];
    for (var i = 0; i < source.length; i += 1) {
      var raw = source[i] || {};
      var rawName = raw.property || raw.name || raw.target;
      var canonical = PROPERTY_ALIASES[low(rawName)] || rawName;
      if (canonical !== property.canonical) continue;
      var time = toSeconds(has(raw, "time") ? raw.time : raw.at, model.fps, raw.timeUnit || input.timeUnit);
      if (time == null || time < 0) continue;
      var value = raw.value;
      if (property.dim === 1) value = Number(value);
      else if (!(value instanceof Array)) value = [Number(value), Number(value)];
      if (property.dim === 1 && !isFinite(value)) continue;
      out.push({
        time: snapTime(time, model.fps),
        value: cloneValue(value),
        interpolation: normalizeInterpolation(raw.interpolation || raw.type),
        easeIn: Number(raw.easeIn != null ? raw.easeIn : model.easing.ae.inInfluence),
        easeOut: Number(raw.easeOut != null ? raw.easeOut : model.easing.ae.outInfluence)
      });
    }
    out.sort(function (a, b) { return a.time - b.time; });
    return out;
  }

  function stableSignature(model) {
    var names = [], props = propertyList(model);
    for (var i = 0; i < props.length; i += 1) names.push(props[i].canonical);
    names.sort();
    return "GM3|" + String(model.name).replace(/[^a-zA-Z0-9_-]+/g, "_").slice(0, 36) + "|" + names.join("+");
  }

  /* Immutable, fully validated contract consumed by both Preview and Apply. */
  function plan(input, options) {
    var opts = options || {};
    var normalized = normalize(input, opts);
    if (!normalized.ok) return normalized;
    var model = normalized.model;
    var text = opts.text != null ? String(opts.text) : String(model.text != null ? model.text : input.text || model.name);
    var count = unitCount(text, model.basis);
    var solved = timing(model, count);
    var start = snapTime(Number(opts.startTime) || 0, model.fps);
    var operations = [], props = propertyList(model), maxRelative = solved.total;
    for (var i = 0; i < props.length; i += 1) {
      var frames = explicitKeyframes(input, model, props[i]);
      if (frames.length) maxRelative = Math.max(maxRelative, frames[frames.length - 1].time);
      for (var f = 0; f < frames.length; f += 1) frames[f].time = start + frames[f].time;
      operations.push({
        kind: "animatorProperty",
        canonical: props[i].canonical,
        matchName: props[i].matchName,
        dim: props[i].dim,
        needs3D: props[i].needs3D,
        value: cloneValue(props[i].offsetValue),
        keyframes: frames
      });
    }
    operations.push({
      kind: "rangeSelector",
      matchName: "ADBE Text Selector",
      start: solved.ae.rangeStart,
      end: solved.ae.rangeEnd,
      basedOn: solved.ae.basedOn,
      shapeCode: solved.ae.shapeCode,
      randomize: solved.ae.randomize,
      easeHigh: solved.ae.easeHigh,
      easeLow: solved.ae.easeLow,
      keyframes: [
        { property: "ADBE Text Percent Offset", time: start + snapTime(solved.ae.keyTimes[0], model.fps), value: solved.ae.keyValues[0], interpolation: normalizeInterpolation(model.easing.name), easeIn: solved.ae.influenceIn, easeOut: solved.ae.influenceOut },
        { property: "ADBE Text Percent Offset", time: start + snapTime(solved.ae.keyTimes[1], model.fps), value: solved.ae.keyValues[1], interpolation: normalizeInterpolation(model.easing.name), easeIn: solved.ae.influenceIn, easeOut: solved.ae.influenceOut }
      ]
    });
    return {
      ok: true,
      plan: {
        version: VERSION,
        signature: stableSignature(model),
        animatorName: "GHOST MOTION — " + model.name,
        model: model,
        text: text,
        unitCount: count,
        startTime: start,
        endTime: start + snapTime(maxRelative, model.fps),
        operations: operations,
        warnings: normalized.warnings || []
      }
    };
  }

  root.GhostMotion = {
    VERSION: VERSION,
    PROPERTY_TABLE: PROPERTY_TABLE,
    EASINGS: EASINGS,
    BASIS: BASIS,
    SHAPES: SHAPES,
    normalize: normalize,
    propertyList: propertyList,
    timing: timing,
    cssEasing: cssEasing,
    cssKeyframes: cssKeyframes,
    cssKeyframeName: cssKeyframeName,
    splitUnits: splitUnits,
    unitCount: unitCount,
    expectation: expectation,
    plan: plan,
    snapTime: snapTime,
    stableSignature: stableSignature,
    toSeconds: toSeconds,
    toFrames: toFrames,
    toRgba: toRgba,
    toHex: toHex
  };
})(typeof window !== "undefined" ? window : (typeof $ !== "undefined" && $.global ? $.global : this));
