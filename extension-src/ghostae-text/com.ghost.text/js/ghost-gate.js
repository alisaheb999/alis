if (typeof window !== "undefined" && window.__ghostStamp) {
  window.__ghostStamp(
    "ghost-gate.js",
    /* @ghost-build */
    "3.40.2+20260829.ui-perfect"
  );
}
(function(global) {
  "use strict";
  var Cloud = global.GhostCloud;
  if (!Cloud) {
    (function hardLock() {
      function paint() {
        try {
          var root = document.documentElement;
          root.className += " ghost-gated";
          var box = document.createElement("div");
          box.className = "ghost-gate-overlay is-open";
          box.style.cssText = "position:fixed;inset:0;z-index:99999;display:flex;align-items:center;justify-content:center;padding:24px;background:#f8fafc;color:#0f172a;text-align:center;font:12px/1.6 -apple-system,'Segoe UI',sans-serif";
          box.innerHTML = '<div><div style="font-size:14px;font-weight:600;margin-bottom:6px">Activation required</div><div style="opacity:.7;max-width:320px;margin:0 auto">The licence service did not load in this After Effects build. Close and reopen the panel, or reinstall GHOST from ghostae.com.</div></div>';
          (document.body || root).appendChild(box);
          if (document.body) document.body.setAttribute("data-ghost-licensed", "0");
        } catch (e) {
        }
      }
      global.GhostBoot.push(paint);
    })();
    global.GhostGate = {
      lock: function() {
      },
      unlock: function() {
      },
      open: function() {
      },
      isLicensed: function() {
        return false;
      },
      guard: function() {
        return function() {
        };
      }
    };
    return;
  }
  var overlay = null;
  var busy = false;
  var isAudioMuted = false;
  var audioCtx = null;
  document.documentElement.className += " ghost-tw-off";
  function playSound(freq, type, duration) {
    if (isAudioMuted) return;
    freq = freq || 440;
    type = type || "sine";
    duration = duration || 0.08;
    try {
      if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      if (audioCtx.state === "suspended") audioCtx.resume();
      var osc = audioCtx.createOscillator();
      var gain = audioCtx.createGain();
      osc.type = type;
      osc.frequency.value = freq;
      gain.gain.setValueAtTime(0.04, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(1e-3, audioCtx.currentTime + duration);
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start();
      osc.stop(audioCtx.currentTime + duration);
    } catch (e) {
    }
  }
  function formatKeyInput(input) {
    var val = String(input.value || "").toUpperCase().replace(/[^A-Z0-9]/g, "");
    var groups = [];
    var prefix;
    var body;
    var i;
    if (val.indexOf("GHOST") === 0) {
      prefix = "GHOST";
      body = val.slice(5, 21);
    } else if (val.length >= 16) {
      prefix = "GHOST";
      body = val.slice(0, 16);
    } else {
      prefix = "";
      body = val.slice(0, 16);
    }
    for (i = 0; i < body.length; i += 4) groups.push(body.slice(i, i + 4));
    input.value = (prefix ? prefix + (groups.length ? "-" : "") : "") + groups.join("-");
  }
  function switchTab(tabId) {
    playSound(520, "sine", 0.05);
    document.querySelectorAll(".tab-panel").forEach(function(p) {
      p.classList.add("hidden");
      p.classList.remove("active");
    });
    var activePanel = document.getElementById(tabId);
    if (activePanel) {
      activePanel.classList.remove("hidden");
      setTimeout(function() {
        activePanel.classList.add("active");
      }, 10);
    }
    var btnActivate = document.getElementById("btn-tab-activate");
    var btnStatus = document.getElementById("btn-tab-status");
    if (btnActivate) {
      btnActivate.className = tabId === "tab-activate" ? "flex-1 py-1.5 rounded-lg text-slate-900 bg-white shadow-sm transition-all focus-ring" : "flex-1 py-1.5 rounded-lg text-slate-500 hover:text-slate-900 transition-all focus-ring";
    }
    if (btnStatus) {
      btnStatus.className = tabId === "tab-status" ? "flex-1 py-1.5 rounded-lg text-slate-900 bg-white shadow-sm transition-all focus-ring" : "flex-1 py-1.5 rounded-lg text-slate-500 hover:text-slate-900 transition-all focus-ring";
    }
  }
  function toggleAudio() {
    isAudioMuted = !isAudioMuted;
    var btn = document.getElementById("soundBtn");
    if (btn) {
      btn.classList.toggle("text-slate-300", isAudioMuted);
      btn.classList.toggle("text-slate-500", !isAudioMuted);
    }
    showToast(isAudioMuted ? "Muted" : "Unmuted");
  }
  function showToast(message, isSuccess) {
    var toast = document.getElementById("toast");
    var toastMsg = document.getElementById("toastMsg");
    var toastDot = document.getElementById("toastDot");
    if (!toast || !toastMsg || !toastDot) return;
    toastMsg.textContent = message;
    toastDot.className = "w-2 h-2 rounded-full " + (isSuccess ? "bg-emerald-400" : "bg-blue-400");
    toast.classList.remove("opacity-0", "pointer-events-none", "translate-y-3");
    toast.classList.add("opacity-100", "translate-y-0");
    setTimeout(function() {
      toast.classList.remove("opacity-100", "translate-y-0");
      toast.classList.add("opacity-0", "pointer-events-none", "translate-y-3");
    }, 2500);
  }
  function openSupportDrawer() {
    playSound(480, "sine", 0.05);
    var drawer = document.getElementById("supportDrawer");
    if (!drawer) return;
    drawer.classList.remove("opacity-0", "pointer-events-none");
    drawer.firstElementChild.classList.remove("translate-y-full", "sm:translate-y-4");
  }
  function closeSupportDrawer() {
    var drawer = document.getElementById("supportDrawer");
    if (!drawer) return;
    drawer.firstElementChild.classList.add("translate-y-full", "sm:translate-y-4");
    setTimeout(function() {
      drawer.classList.add("opacity-0", "pointer-events-none");
    }, 150);
  }
  function pulseLogoEffect() {
    playSound(700, "sine", 0.06);
    var logo = document.getElementById("appLogo");
    if (!logo) return;
    logo.classList.add("scale-110");
    setTimeout(function() {
      logo.classList.remove("scale-110");
    }, 200);
  }
  function reasonText(reason) {
    if (reason && reason.indexOf("license_") === 0) reason = reason.slice(8);
    switch (reason) {
      case "not_found":
        return "Invalid key.";
      case "revoked":
        return "Key revoked.";
      case "suspended":
        return "Key suspended.";
      case "expired":
        return "Key expired.";
      case "seat_limit":
        return "Seat limit reached.";
      case "device_revoked":
        return "Device revoked.";
      case "offline_grace_expired":
        return "Offline grace expired.";
      case "no_key":
        return "Key required.";
      case "device_not_activated":
        return "This device is not activated yet — press Activate.";
      case "bad_request":
        return "Request rejected. Check the key format (GHOST-XXXX-XXXX-XXXX-XXXX).";
      case "bad_signature":
        return "Security check failed. Reinstall the extension.";
      case "rate_limited":
        return "Too many attempts. Wait a minute and retry.";
      case "network_unreachable":
      case "network_error":
        return "No internet connection to GHOST Cloud.";
      case "network_timeout":
        return "GHOST Cloud timed out. Retry in a moment.";
      case "server_error":
        return "GHOST Cloud is unavailable. Try again shortly.";
      case "inactive":
        return "Key inactive. Contact support.";
      case "unknown":
        return "";
      default:
        return reason ? "Error: " + reason : "License verification failed.";
    }
  }
  function updateMeta() {
    var stateText = document.getElementById("licenseStateText");
    var deviceText = document.getElementById("deviceText");
    if (stateText) {
      if (Cloud.isLicensed()) {
        stateText.textContent = "Active";
        stateText.className = "font-bold text-emerald-600";
      } else {
        stateText.textContent = "Inactive";
        stateText.className = "font-bold text-slate-700";
      }
    }
    if (deviceText) {
      deviceText.textContent = Cloud.deviceId() || "#UNKNOWN";
    }
  }
  function showCompatibilityNotice() {
    var KEY = "ghost.compatibility.notice.v1";
    try { if (sessionStorage.getItem(KEY) === "1") return; } catch (e) {}
    var major = null, full = "";
    try {
      if (window.CSInterface) {
        var env = new window.CSInterface().getHostEnvironment();
        if (env && env.appVersion) {
          full = String(env.appVersion);
          var m = /^(\d+)/.exec(full);
          if (m) major = parseInt(m[1], 10);
        }
      }
    } catch (e2) {}
    var wrap = document.getElementById("ghostCompatibilityNotice");
    if (wrap) return;
    wrap = document.createElement("div");
    wrap.id = "ghostCompatibilityNotice";
    wrap.className = "gp2-sheet-wrap";
    var current = full ? "<small>Detected After Effects: <b>" + full.replace(/</g, "&lt;").replace(/>/g, "&gt;") + "</b></small>" : "";
    wrap.innerHTML =
      '<div class="gp2-sheet" role="alertdialog" aria-modal="true" aria-label="After Effects compatibility notice">' +
      "<h3>After Effects compatibility</h3>" +
      '<div class="gp2-row"><div class="gp2-row-main">' +
      "GHOST works best on After Effects 2025 (25.x) and 2026 (26.x), and on later 25+ releases." +
      "<small><b>Perfect Color Presets</b> require After Effects 2025 (25.x) or newer. On supported versions before 25.x, the other sections may work, but some features or results may vary.</small>" +
      current +
      "</div></div>" +
      '<div class="gp2-sheet-foot"><button type="button" class="gp2-btn gp2-btn-primary" data-act="ok">Got it</button></div>' +
      "</div>";
    document.body.appendChild(wrap);
    function close() {
      if (wrap && wrap.parentNode) wrap.parentNode.removeChild(wrap);
      try { sessionStorage.setItem(KEY, "1"); } catch (e) {}
    }
    wrap.addEventListener("click", function(e) {
      var t = e.target && e.target.closest ? e.target.closest('[data-act="ok"]') : null;
      if (t || e.target === wrap) close();
    });
    document.addEventListener("keydown", function esc(e) {
      if (e.key === "Escape") { close(); document.removeEventListener("keydown", esc); }
    });
    var btn = wrap.querySelector('[data-act="ok"]');
    if (btn && btn.focus) btn.focus();
  }

  function activate() {
    var input = document.getElementById("licenseKey");
    var btn = document.getElementById("activateBtn");
    if (!input || !btn) return;
    formatKeyInput(input);
    var key = (input.value || "").replace(/^\s+|\s+$/g, "").toUpperCase();
    if (!key) {
      playSound(220, "sawtooth", 0.15);
      showToast("Enter your licence key.", false);
      input.focus();
      return;
    }
    if (!/^GHOST-[A-Z0-9]{4}-[A-Z0-9]{4}-[A-Z0-9]{4}-[A-Z0-9]{4}$/.test(key)) {
      playSound(220, "sawtooth", 0.15);
      showToast("Incomplete key — needs GHOST-XXXX-XXXX-XXXX-XXXX (4 groups).", false);
      input.focus();
      return;
    }
    if (busy) return;
    busy = true;
    btn.disabled = true;
    btn.innerHTML = "<span>Validating...</span>";
    playSound(880, "sine", 0.1);
    Cloud.activate(key).then(function() {
      busy = false;
      btn.disabled = false;
      if (Cloud.isLicensed()) {
        btn.innerHTML = "<span>Activated</span>";
        btn.className = "flex-1 min-h-[40px] py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-md interactive-scale focus-ring spring-transition flex items-center justify-center gap-1.5";
        updateMeta();
        showToast("Activated", true);
        playSound(1200, "sine", 0.2);
        setTimeout(unlock, 800);
        setTimeout(showCompatibilityNotice, 900);
      } else {
        btn.innerHTML = "<span>Activate</span>";
        btn.className = "flex-1 min-h-[40px] py-2.5 px-4 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-md interactive-scale focus-ring spring-transition flex items-center justify-center gap-1.5";
        lock(reasonText(Cloud.state().reason) || "Activation failed.");
        showToast(reasonText(Cloud.state().reason) || "Activation failed.", false);
      }
    }).catch(function(err) {
      busy = false;
      btn.disabled = false;
      btn.innerHTML = "<span>Activate</span>";
      var code = err && (err.code || err.message);
      var msg = err && err.message;
      // Server-side validation errors carry the precise reason — show it verbatim.
      if (code === "bad_request" || code === "not_found") showToast(msg || reasonText(code), false);
      else showToast(reasonText(code) || msg || "Activation failed.", false);
      lock("");
    });
  }
  function recheck() {
    if (busy) return;
    busy = true;
    showToast("Verifying...", false);
    Cloud.verify().then(function(s) {
      busy = false;
      if (Cloud.isLicensed()) {
        updateMeta();
        setTimeout(unlock, 400);
      } else {
        showToast(reasonText(s.reason) || "License invalid.", false);
      }
    }).catch(function() {
      busy = false;
      showToast("Cloud unreachable.", false);
    });
  }
  function build() {
    if (overlay) return overlay;
    overlay = document.createElement("div");
    overlay.className = "ghost-gate-overlay select-none";
    overlay.setAttribute("role", "dialog");
    overlay.setAttribute("aria-modal", "true");
    if (!document.getElementById("ghostGateCleanStyle")) {
      var gateStyle = document.createElement("style");
      gateStyle.id = "ghostGateCleanStyle";
      gateStyle.textContent = ".ghost-gate-overlay{position:fixed!important;inset:0!important;z-index:99999!important;display:flex;align-items:center;justify-content:center;padding:18px;background:#111318;color:#e8e9ed;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif}.ghost-gate-overlay>div:first-child,.ghost-gate-overlay #soundBtn,.ghost-gate-overlay #helpBtn,.ghost-gate-overlay #supportDrawer{display:none!important}.ghost-gate-overlay #ghost-gate-main-container{position:relative;width:100%;max-width:360px;margin:auto;z-index:1}.ghost-gate-overlay .glass-chrome{overflow:hidden;border:1px solid #323640;border-radius:12px;background:#1b1e24;box-shadow:0 20px 50px rgba(0,0,0,.45)}.ghost-gate-overlay header{padding:16px 16px 12px!important;border-bottom:1px solid #2d313a!important;background:#1b1e24!important}.ghost-gate-overlay header>div:first-child,.ghost-gate-overlay header>div:nth-child(2){display:none!important}.ghost-gate-overlay #logoBox{width:36px;height:36px}.ghost-gate-overlay #logoBox>div{width:36px;height:36px;padding:7px;border:1px solid #343946;border-radius:9px;background:#111318}.ghost-gate-overlay h1{font-size:14px;color:#f5f6f8}.ghost-gate-overlay nav{display:flex;margin-top:12px;padding:3px;border:1px solid #30343e;border-radius:8px;background:#14171c}.ghost-gate-overlay nav button{flex:1;padding:7px;border:0;border-radius:6px;background:transparent;color:#8f96a3;font-size:11px;font-weight:600}.ghost-gate-overlay #btn-tab-activate,.ghost-gate-overlay #btn-tab-status{box-shadow:none!important}.ghost-gate-overlay .tab-panel{padding:16px!important}.ghost-gate-overlay .tab-panel.hidden{display:none!important}.ghost-gate-overlay #tab-activate>div:first-child>div{position:relative;display:flex;align-items:center}.ghost-gate-overlay #licenseKey{box-sizing:border-box;width:100%;height:44px;padding:0 76px 0 12px;border:1px solid #373c47;border-radius:8px;outline:0;background:#111318;color:#f5f6f8;font:11px/1 ui-monospace,SFMono-Regular,Consolas,monospace;letter-spacing:.04em}.ghost-gate-overlay #licenseKey:focus{border-color:#2979ff;box-shadow:0 0 0 2px rgba(41,121,255,.16)}.ghost-gate-overlay #licenseKey+button{position:absolute!important;right:6px!important;top:7px!important;bottom:auto!important;display:flex!important;align-items:center!important;height:30px!important;margin:0!important;padding:0 9px!important;border:1px solid #373c47!important;border-radius:6px!important;background:#262a32!important;color:#d7dae0!important;font-size:10px!important}.ghost-gate-overlay #licenseKey~span,.ghost-gate-overlay #tab-activate>div:first-child span.absolute{display:none!important}.ghost-gate-overlay #tab-activate>div:nth-child(2){display:flex!important;gap:8px!important;padding-top:10px!important}.ghost-gate-overlay #activateBtn{box-sizing:border-box;width:100%;min-height:40px;border:0;border-radius:8px;background:#286fe8;color:#fff;font-size:11px;font-weight:700}.ghost-gate-overlay #tab-status{color:#d8dbe1}.ghost-gate-overlay #toast{position:fixed!important;left:50%!important;right:auto!important;bottom:16px!important;transform:translateX(-50%)!important;max-width:calc(100% - 24px)}";
      document.head.appendChild(gateStyle);
    }
    overlay.innerHTML = `
    <!-- Background Light Ambience -->
    <div class="fixed inset-0 pointer-events-none overflow-hidden z-[-1]">
        <div class="absolute -top-40 -left-40 w-96 h-96 bg-blue-100/60 rounded-full blur-3xl"></div>
        <div class="absolute -bottom-40 -right-40 w-96 h-96 bg-slate-200/50 rounded-full blur-3xl"></div>
    </div>

    <main class="relative w-full max-w-sm mx-auto z-10" id="ghost-gate-main-container">
        <div class="glass-chrome rounded-[28px] overflow-hidden spring-transition">
            
            <!-- Header Bar -->
            <header class="relative px-5 pt-4 pb-3 border-b border-slate-200/60 bg-white/60">
                <div class="w-10 h-1 bg-slate-200 rounded-full mx-auto mb-3" aria-hidden="true"></div>

                <!-- Control Bar -->
                <div class="flex items-center justify-end mb-2">
                    <button id="soundBtn" class="w-8 h-8 rounded-full text-slate-500 hover:text-slate-900 hover:bg-slate-100 focus-ring spring-transition flex items-center justify-center" aria-label="Toggle Audio">
                        <svg id="soundIcon" class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2">
                            <path stroke-linecap="round" stroke-linejoin="round" d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z"></path>
                        </svg>
                    </button>
                </div>

                <!-- Branding Badge -->
                <div class="flex items-center gap-3 pt-1">
                    <div class="relative cursor-pointer shrink-0" id="logoBox">
                        <div class="w-11 h-11 bg-slate-900 rounded-xl border border-slate-200 flex items-center justify-center p-2 shadow-sm">
                            <img id="appLogo" 
                                 src="assets/app-mark.svg" 
                                 alt="GhostAE" 
                                 class="w-full h-full object-contain filter brightness-110"
                                 onerror="this.onerror=null; this.src='assets/app-mark.svg';">
                        </div>
                    </div>

                    <div>
                        <h1 class="text-base font-bold tracking-tight text-slate-900">GhostAE</h1>
                    </div>
                </div>

                <!-- Navigation Tabs -->
                <nav class="flex items-center gap-1 bg-slate-100 p-1 rounded-xl border border-slate-200/60 mt-4 text-xs font-semibold">
                    <button id="btn-tab-activate" class="flex-1 py-1.5 rounded-lg text-slate-900 bg-white shadow-sm transition-all focus-ring">Activate</button>
                    <button id="btn-tab-status" class="flex-1 py-1.5 rounded-lg text-slate-500 hover:text-slate-900 transition-all focus-ring">Status</button>
                </nav>
            </header>

            <!-- Activate Tab -->
            <section id="tab-activate" class="tab-panel active p-5 space-y-4" role="tabpanel">
                <div class="space-y-1.5">
                    <div class="relative flex items-center">
                        <span class="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2">
                                <path stroke-linecap="round" stroke-linejoin="round" d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z"></path>
                            </svg>
                        </span>
                        <input type="text" id="licenseKey" placeholder="XXXX-XXXX-XXXX-XXXX" autocomplete="off" spellcheck="false"
                               class="w-full pl-10 pr-20 py-3 bg-white text-slate-900 placeholder-slate-400 text-xs font-mono tracking-wider rounded-xl border border-slate-200 focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600 spring-transition shadow-sm">
                        <button type="button" id="pasteBtn" aria-label="Paste key from clipboard"
                                class="absolute inset-y-0 right-1.5 my-auto h-7 px-2.5 bg-slate-100 hover:bg-slate-200 text-slate-600 hover:text-slate-900 text-[11px] font-semibold rounded-lg border border-slate-200/80 spring-transition focus-ring flex items-center gap-1 active:scale-95">
                            <svg class="w-3.5 h-3.5 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2">
                                <path stroke-linecap="round" stroke-linejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 012-2h2a2 2 0 012 2M9 5a2 2 0 012-2h2a2 2 0 012 2"></path>
                            </svg>
                            <span>Paste</span>
                        </button>
                    </div>
                </div>

                <div class="flex items-center gap-2 pt-1">
                    <button type="button" id="helpBtn" class="w-24 min-h-[40px] py-2.5 px-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs rounded-xl border border-slate-200/80 interactive-scale focus-ring spring-transition flex items-center justify-center">
                        Help
                    </button>
                    <button type="button" id="activateBtn" class="flex-1 min-h-[40px] py-2.5 px-4 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-md interactive-scale focus-ring spring-transition flex items-center justify-center gap-1.5">
                        <span>Activate</span>
                        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2.5">
                            <path stroke-linecap="round" stroke-linejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6"></path>
                        </svg>
                    </button>
                </div>
            </section>

            <!-- Status Tab -->
            <section id="tab-status" class="tab-panel hidden p-5 space-y-3" role="tabpanel">
                <div class="content-card p-4 rounded-xl space-y-3 text-xs">
                    <div class="flex items-center justify-between border-b border-slate-100 pb-2">
                        <span class="text-slate-500">License</span>
                        <span id="licenseStateText" class="font-bold text-slate-700">Inactive</span>
                    </div>
                    <div class="flex items-center justify-between border-b border-slate-100 pb-2">
                        <span class="text-slate-500">Type</span>
                        <span class="font-semibold text-slate-900">GhostAE Engine</span>
                    </div>
                    <div class="flex items-center justify-between">
                        <span class="text-slate-500">Device</span>
                        <span id="deviceText" class="font-mono text-[10px] text-slate-500">#UNKNOWN</span>
                    </div>
                </div>
            </section>

            <!-- Footer -->
            <footer class="px-5 py-3 bg-slate-50 border-t border-slate-200/60 flex items-center justify-center text-xs">
                <a href="https://ghostae.com" target="_blank" rel="noopener noreferrer" class="inline-flex items-center gap-1 text-slate-600 font-semibold hover:text-slate-900 transition-colors text-[11px] focus-ring">
                    <span>ghostae.com</span>
                    <svg class="w-3 h-3 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2">
                        <path stroke-linecap="round" stroke-linejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"></path>
                    </svg>
                </a>
            </footer>
        </div>
    </main>

    <div id="supportDrawer" class="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-slate-900/30 backdrop-blur-xs opacity-0 pointer-events-none spring-transition p-0 sm:p-4">
        <div class="w-full max-w-sm glass-chrome rounded-t-[24px] sm:rounded-[24px] p-5 space-y-4 transform translate-y-full sm:translate-y-4 spring-transition" id="supportDrawerInner">
            
            <div class="w-10 h-1 bg-slate-300 rounded-full mx-auto" aria-hidden="true"></div>

            <div class="flex items-center justify-between border-b border-slate-200/60 pb-2">
                <h2 class="text-sm font-bold text-slate-900">Help</h2>
                <button id="closeDrawerBtn" class="text-slate-400 hover:text-slate-700 p-1 rounded-lg hover:bg-slate-100">
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2">
                        <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12"></path>
                    </svg>
                </button>
            </div>

            <div class="space-y-2 text-xs text-slate-600">
                <div class="content-card p-3 rounded-xl space-y-1">
                    <p class="font-bold text-slate-900">Key retrieval</p>
                    <p class="text-slate-500 text-[11px]">Check purchase receipt email.</p>
                </div>
                <div class="content-card p-3 rounded-xl space-y-1">
                    <p class="font-bold text-slate-900">Activation limit</p>
                    <p class="text-slate-500 text-[11px]">Single machine license.</p>
                </div>
            </div>

            <a href="https://ghostae.com" target="_blank" id="supportLinkBtn" class="w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs rounded-xl flex items-center justify-center gap-1 spring-transition">
                <span>Support Center</span>
                <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M14 5l7 7m0 0l-7 7m7-7H3"></path>
                </svg>
            </a>
        </div>
    </div>

    <!-- Toast Notification -->
    <div id="toast" class="fixed bottom-5 left-1/2 -translate-x-1/2 bg-slate-900 text-white border border-slate-800 px-4 py-2.5 rounded-xl shadow-xl text-xs font-medium opacity-0 pointer-events-none spring-transition transform translate-y-3 z-[100000] flex items-center gap-2">
        <span id="toastDot" class="w-2 h-2 rounded-full bg-blue-400"></span>
        <span id="toastMsg">Ready</span>
    </div>
        `;
    (document.body || document.documentElement).appendChild(overlay);
    var doc = document;
    function bind(id, ev, fn) {
      try {
        var el = doc.getElementById(id);
        if (el) el.addEventListener(ev, fn, false);
        return el;
      } catch (e) {
        return null;
      }
    }
    bind("btn-tab-activate", "click", function() {
      switchTab("tab-activate");
    });
    bind("btn-tab-status", "click", function() {
      switchTab("tab-status");
    });
    bind("soundBtn", "click", toggleAudio);
    bind("logoBox", "click", pulseLogoEffect);
    bind("helpBtn", "click", openSupportDrawer);
    bind("closeDrawerBtn", "click", closeSupportDrawer);
    bind("supportLinkBtn", "click", closeSupportDrawer);
    bind("supportDrawer", "click", closeSupportDrawer);
    bind("supportDrawerInner", "click", function(e) {
      e.stopPropagation();
    });
    bind("activateBtn", "click", function(e) {
      if (e && e.preventDefault) e.preventDefault();
      activate();
    });
    bind("recheckBtn", "click", recheck);
    var input = doc.getElementById("licenseKey");
    if (input) {
      input.addEventListener("input", function() {
        formatKeyInput(this);
      });
      input.addEventListener("keydown", function(e) {
        var key = e.key || e.keyIdentifier;
        if (key === "Enter" || e.keyCode === 13) {
          e.preventDefault();
          activate();
        }
      });
    }
    function pasteInto(text) {
      if (!text || !input) return;
      input.value = text;
      formatKeyInput(input);
      showToast("Pasted", false);
      playSound(700, "sine", 0.08);
    }
    bind("pasteBtn", "click", function() {
      playSound(500, "sine", 0.05);
      var nav = window.navigator;
      try {
        if (nav && nav.clipboard && nav.clipboard.readText) {
          var pending = nav.clipboard.readText();
          if (pending && pending.then) pending.then(pasteInto).catch(function() {
            pasteInto(window.prompt("Paste your key here:"));
          });
          else pasteInto(window.prompt("Paste your key here:"));
        } else {
          pasteInto(window.prompt("Paste your key here:"));
        }
      } catch (e) {
        pasteInto(window.prompt("Paste your key here:"));
      }
    });
    doc.addEventListener("keydown", function(e) {
      if (e.key === "Escape" || e.keyCode === 27) closeSupportDrawer();
    });
    return overlay;
  }
  function detectUtilityCss() {
    function setFallback(on) {
      var root = document.documentElement;
      var cls = (" " + root.className + " ").replace(/\sghost-tw-off\s/g, " ");
      root.className = (on ? cls + " ghost-tw-off" : cls).replace(/\s+/g, " ").replace(/^\s|\s$/g, "");
    }
    function probe() {
      try {
        var el = document.createElement("div");
        el.className = "hidden";
        el.setAttribute("aria-hidden", "true");
        (document.body || document.documentElement).appendChild(el);
        var display = "";
        if (window.getComputedStyle) display = window.getComputedStyle(el).display;
        else if (el.currentStyle) display = el.currentStyle.display;
        if (el.parentNode) el.parentNode.removeChild(el);
        setFallback(display !== "none");
      } catch (e) {
        setFallback(true);
      }
    }
    setTimeout(probe, 120);
    setTimeout(probe, 900);
    setTimeout(probe, 2500);
  }
  function lock(reasonMsg) {
    build();
    overlay.style.display = "";
    overlay.setAttribute("aria-hidden", "false");
    overlay.classList.add("is-open");
    document.documentElement.classList.add("ghost-gated");
    try {
      document.body.setAttribute("data-ghost-licensed", "0");
    } catch (e) {
    }
    if (reasonMsg && reasonMsg.trim() !== "") showToast(reasonMsg, false);
    updateMeta();
    var input = document.getElementById("licenseKey");
    if (input && !input.value) {
      input.value = Cloud.licenseKey() || "";
      formatKeyInput(input);
    }
    setTimeout(function() {
      try {
        if (input) input.focus();
      } catch (e) {
      }
    }, 60);
  }
  function unlock() {
    if (overlay) {
      overlay.classList.remove("is-open");
      overlay.setAttribute("aria-hidden", "true");
      overlay.style.display = "none";
    }
    document.documentElement.classList.remove("ghost-gated");
    try {
      document.body.setAttribute("data-ghost-licensed", "1");
    } catch (e) {
    }
  }
  var HARD_REASONS = { not_found: true, revoked: true, suspended: true, expired: true, device_revoked: true, no_key: true };
  function evaluate() {
    if (Cloud.isLicensed()) return unlock();
    var current = Cloud.state();
    lock(current.reason === "unknown" ? "" : reasonText(current.reason));
  }
  var Gate = {
    lock,
    unlock,
    open: function() {
      lock("");
    },
    isLicensed: function() {
      return Cloud.isLicensed();
    },
    guard: function(fn) {
      return function() {
        if (!Cloud.isLicensed()) {
          lock(reasonText(Cloud.state().reason));
          return;
        }
        return fn.apply(this, arguments);
      };
    }
  };
  function boot() {
    build();
    // Always begin locked. Only this panel's server verification may unlock it.
    lock(Cloud.licenseKey() ? "Verifying license…" : "");
    if (Cloud.licenseKey()) {
      showToast("Verifying license…", false);
    }
    Cloud.on("revoked", function() {
      lock("License revoked by cloud.");
    });
    Cloud.on("attention", function() {
      showToast("Re-syncing your license…", false);
    });
    Cloud.on("deactivated", function() {
      lock("");
    });
    Cloud.on("lockchange", function() {
      evaluate();
    });
    Cloud.on("shared", function() {
      showToast("Key found in another panel...", false);
    });
    Cloud.start();
    // Only judge after the first server round-trip settles.
    try {
      Cloud.verify().then(evaluate, evaluate);
    } catch (e) {
      setTimeout(evaluate, 400);
    }
  }
  global.GhostBoot.push(boot);
  global.GhostGate = Gate;
})(typeof window !== "undefined" ? window : this);
