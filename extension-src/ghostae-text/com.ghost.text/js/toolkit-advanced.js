(function() {
  "use strict";
  var cs = null;
  try {
    cs = new CSInterface();
  } catch (e) {
    cs = null;
  }
  var PRESETS = [
    { key: "drop-fade", name: "Drop Fade", state: { opacity: 0, posY: 60, scale: 100, rotZ: 0, rotX: 0, rotY: 0, blur: 0, tracking: 0, skew: 0, shape: "square", easeHigh: 40, easeLow: 0, duration: 18, stagger: 4 } },
    { key: "blur-in", name: "Blur In", state: { opacity: 0, posY: 0, scale: 100, rotZ: 0, rotX: 0, rotY: 0, blur: 24, tracking: 12, skew: 0, shape: "rampup", easeHigh: 70, easeLow: 0, duration: 22, stagger: 5 } },
    { key: "scale-pop", name: "Scale Pop", state: { opacity: 0, posY: 0, scale: 0, rotZ: 0, rotX: 0, rotY: 0, blur: 0, tracking: 0, skew: 0, shape: "triangle", easeHigh: 85, easeLow: -40, duration: 14, stagger: 3 } },
    { key: "rotate-3d", name: "3D Flip", state: { opacity: 0, posY: 0, scale: 100, rotZ: 0, rotX: 90, rotY: 0, blur: 0, tracking: 0, skew: 0, shape: "square", easeHigh: 60, easeLow: 0, duration: 20, stagger: 5 } },
    { key: "swing-in", name: "Swing In", state: { opacity: 0, posY: 30, scale: 120, rotZ: -25, rotX: 0, rotY: 0, blur: 0, tracking: 0, skew: 20, shape: "round", easeHigh: 75, easeLow: -25, duration: 24, stagger: 6 } },
    { key: "tracking-slide", name: "Tracking Slide", state: { opacity: 0, posY: 0, scale: 100, rotZ: 0, rotX: 0, rotY: 0, blur: 6, tracking: 60, skew: 0, shape: "smooth", easeHigh: 90, easeLow: 0, duration: 26, stagger: 3 } }
  ];
  var state = {
    presetKey: "drop-fade",
    presetName: "Drop Fade",
    text: "GHOST KINETIC TEXT",
    opacity: 0,
    posY: 60,
    scale: 80,
    rotZ: 0,
    rotX: 0,
    rotY: 0,
    blur: 10,
    tracking: 0,
    skew: 0,
    color: "#1473e6",
    useColor: false,
    start: 0,
    end: 100,
    offset: 0,
    basis: "chars",
    shape: "square",
    easeHigh: 0,
    easeLow: 0,
    randomize: false,
    duration: 18,
    stagger: 4,
    direction: "in"
  };
  function byId(id) {
    return document.getElementById(id);
  }
  function toast(text, cls) {
    var region = byId("toolkitToastRegion") || byId("toolsToastRegion");
    if (!region) return;
    var node = document.createElement("div");
    node.className = "toast " + (cls || "");
    node.textContent = text;
    region.appendChild(node);
    setTimeout(function() {
      node.style.transition = "opacity .3s";
      node.style.opacity = "0";
      setTimeout(function() {
        if (node.parentNode) node.parentNode.removeChild(node);
      }, 300);
    }, 2400);
  }
  function setStatus(text, cls) {
    var el = byId("advStatus");
    if (!el) return;
    el.textContent = text || "";
    el.className = "tool-inline-status " + (cls || "");
    el.hidden = !text;
  }
  function evalScript(script) {
    return new Promise(function(resolve, reject) {
      if (!cs) return reject(new Error("CEP bridge unavailable"));
      try {
        cs.evalScript(script, function(result) {
          var raw = result == null ? "" : String(result);
          if (raw === "" || raw === "undefined" || raw === "null") {
            return reject(new Error("GHOST host script is not loaded — restart After Effects."));
          }
          if (raw.indexOf("EvalScript error") === 0) return reject(new Error(raw));
          try {
            resolve(JSON.parse(raw));
          } catch (e) {
            reject(new Error("Unexpected host reply: " + raw.slice(0, 160)));
          }
        });
      } catch (err) {
        reject(err);
      }
    });
  }
  function esc(value) {
    return String(value).replace(/\\/g, "\\\\").replace(/"/g, '\\"');
  }
  function keyframes() {
    var tag = byId("advKeyframes");
    if (!tag) {
      tag = document.createElement("style");
      tag.id = "advKeyframes";
      document.head.appendChild(tag);
    }
    tag.innerHTML = "@keyframes ghostAdvAnim {\n  0% { opacity: " + state.opacity / 100 + "; transform: translateY(" + state.posY + "px) scale(" + state.scale / 100 + ") rotateX(" + state.rotX + "deg) rotateY(" + state.rotY + "deg) rotate(" + state.rotZ + "deg) skewX(" + state.skew + "deg); filter: blur(" + state.blur + "px); letter-spacing: " + state.tracking / 10 + "px;" + (state.useColor ? " color: " + state.color + ";" : "") + " }\n  100% { opacity: 1; transform: none; filter: blur(0); letter-spacing: normal; }\n}";
  }
  function renderStage() {
    var stage = byId("advStage");
    if (!stage) return;
    stage.innerHTML = "";
    var chars = String(state.text || " ").split("");
    var total = chars.length;
    var duration = state.duration / 10;
    var stagger = state.stagger / 100;
    chars.forEach(function(char, index) {
      var span = document.createElement("span");
      span.className = "adv-char";
      span.textContent = char === " " ? " " : char;
      var order = state.randomize ? Math.abs(Math.round(Math.sin(index * 777) * total)) % Math.max(total, 1) : index;
      var delay = state.direction === "out" ? (total - order) * stagger : order * stagger;
      span.style.animation = "ghostAdvAnim " + duration + "s cubic-bezier(.16,1,.3,1) " + delay + "s infinite alternate";
      stage.appendChild(span);
    });
    keyframes();
  }
  function replay() {
    keyframes();
    renderStage();
  }
  var SLIDERS = [
    ["advOpacity", "opacity", "advOpacityVal", function(v) {
      return v;
    }],
    ["advPosY", "posY", "advPosYVal", function(v) {
      return v;
    }],
    ["advScale", "scale", "advScaleVal", function(v) {
      return v;
    }],
    ["advRotZ", "rotZ", "advRotZVal", function(v) {
      return v;
    }],
    ["advRotX", "rotX", "advRotXVal", function(v) {
      return v;
    }],
    ["advRotY", "rotY", "advRotYVal", function(v) {
      return v;
    }],
    ["advBlur", "blur", "advBlurVal", function(v) {
      return v;
    }],
    ["advTracking", "tracking", "advTrackingVal", function(v) {
      return v;
    }],
    ["advSkew", "skew", "advSkewVal", function(v) {
      return v;
    }],
    ["advStart", "start", "advStartVal", function(v) {
      return v;
    }],
    ["advEnd", "end", "advEndVal", function(v) {
      return v;
    }],
    ["advOffset", "offset", "advOffsetVal", function(v) {
      return v;
    }],
    ["advEaseHigh", "easeHigh", "advEaseHighVal", function(v) {
      return v;
    }],
    ["advEaseLow", "easeLow", "advEaseLowVal", function(v) {
      return v;
    }],
    ["advDuration", "duration", "advDurationVal", function(v) {
      return (v / 10).toFixed(1) + "s";
    }],
    ["advStagger", "stagger", "advStaggerVal", function(v) {
      return (v / 100).toFixed(2) + "s";
    }]
  ];
  function syncControls() {
    SLIDERS.forEach(function(entry) {
      var input = byId(entry[0]);
      var label = byId(entry[2]);
      if (input) input.value = state[entry[1]];
      if (label) label.textContent = entry[3](Number(state[entry[1]]));
    });
    var shape = byId("advShape");
    if (shape) shape.value = state.shape;
    var basis = byId("advBasis");
    if (basis) basis.value = state.basis;
    var dir = byId("advDirection");
    if (dir) dir.value = state.direction;
    var rand = byId("advRandomize");
    if (rand) rand.checked = !!state.randomize;
    var useColor = byId("advUseColor");
    if (useColor) useColor.checked = !!state.useColor;
    var color = byId("advColor");
    if (color) color.value = state.color;
    var preset = byId("advPreset");
    if (preset) preset.value = state.presetKey;
  }
  function applyPreset(key) {
    var preset = null;
    for (var i = 0; i < PRESETS.length; i += 1) if (PRESETS[i].key === key) preset = PRESETS[i];
    if (!preset) return;
    state.presetKey = preset.key;
    state.presetName = preset.name;
    Object.keys(preset.state).forEach(function(prop) {
      state[prop] = preset.state[prop];
    });
    syncControls();
    replay();
    setStatus("Preset loaded: " + preset.name + " — tweak and apply.", "ok");
  }
  function applyToAe(createLayer) {
    var payload = JSON.stringify({
      presetName: state.presetName,
      text: state.text,
      createLayer: !!createLayer,
      opacity: state.opacity,
      posY: state.posY,
      scale: state.scale,
      rotZ: state.rotZ,
      rotX: state.rotX,
      rotY: state.rotY,
      blur: state.blur,
      tracking: state.tracking,
      skew: state.skew,
      color: state.color,
      useColor: state.useColor,
      start: state.start,
      end: state.end,
      offset: state.offset,
      basis: state.basis,
      shape: state.shape,
      easeHigh: state.easeHigh,
      easeLow: state.easeLow,
      randomize: state.randomize,
      duration: state.duration / 10,
      stagger: state.stagger / 100,
      direction: state.direction
    });
    if (!cs) {
      setStatus("Preview mode — open Ghostae Text inside After Effects to apply.", "warn");
      toast("Preview only: Advance Animation", "warn");
      return;
    }
    setStatus("Applying editable animator…", "pending");
    evalScript('GhostHost.toolkitApplyAdvancedAnimation("' + esc(payload) + '")').then(function(res) {
      if (res && res.ok) {
        var msg = (res.animator || "Animator") + " applied to " + res.applied + " layer(s) — editable in AE.";
        setStatus(msg, "ok");
        toast(msg, "ok");
      } else {
        var err = res && res.error ? res.error : "Failed to apply animation.";
        setStatus(err, "error");
        toast(err, "error");
      }
    }).catch(function(error) {
      setStatus(error.message || String(error), "error");
      toast("Apply failed.", "error");
    });
  }
  function bind() {
    var preset = byId("advPreset");
    if (preset) {
      preset.innerHTML = PRESETS.map(function(p) {
        return '<option value="' + p.key + '">' + p.name + "</option>";
      }).join("");
      preset.addEventListener("change", function(event) {
        applyPreset(event.target.value);
      });
    }
    SLIDERS.forEach(function(entry) {
      var input = byId(entry[0]);
      if (!input) return;
      input.addEventListener("input", function(event) {
        state[entry[1]] = Number(event.target.value);
        var label = byId(entry[2]);
        if (label) label.textContent = entry[3](Number(event.target.value));
        replay();
      });
    });
    [["advShape", "shape"], ["advBasis", "basis"], ["advDirection", "direction"]].forEach(function(pair) {
      var el = byId(pair[0]);
      if (!el) return;
      el.addEventListener("change", function(event) {
        state[pair[1]] = event.target.value;
        replay();
      });
    });
    var rand = byId("advRandomize");
    if (rand) rand.addEventListener("change", function(e) {
      state.randomize = e.target.checked;
      replay();
    });
    var useColor = byId("advUseColor");
    if (useColor) useColor.addEventListener("change", function(e) {
      state.useColor = e.target.checked;
      replay();
    });
    var color = byId("advColor");
    if (color) color.addEventListener("input", function(e) {
      state.color = e.target.value;
      state.useColor = true;
      syncControls();
      replay();
    });
    var text = byId("advText");
    if (text) text.addEventListener("input", function(e) {
      state.text = e.target.value;
      renderStage();
    });
    var replayBtn = byId("advReplay");
    if (replayBtn) replayBtn.addEventListener("click", replay);
    var apply = byId("advApply");
    if (apply) apply.addEventListener("click", function() {
      applyToAe(false);
    });
    var applyNew = byId("advApplyNew");
    if (applyNew) applyNew.addEventListener("click", function() {
      applyToAe(true);
    });
    var reset = byId("advReset");
    if (reset) reset.addEventListener("click", function() {
      applyPreset("drop-fade");
    });
  }
  function boot() {
    if (!byId("advStage")) return;
    bind();
    var text = byId("advText");
    if (text && text.value) state.text = text.value;
    syncControls();
    replay();
  }
  window.GhostBoot.push(boot);
})();
