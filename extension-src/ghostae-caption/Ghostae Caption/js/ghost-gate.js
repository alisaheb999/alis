/*
 * Ghostae Caption — licence gate + plan control (added by the main server build).
 * No existing panel file is modified; this script only locks the UI and counts usage.
 *
 * - No valid key  -> full-screen activation overlay, panel unusable (free/lite/pro all need a key).
 * - Admin control -> /api/public/v1/control can suspend a key or force an update.
 * - Quota         -> /api/public/v1/caption/plan enforces daily + monthly minutes.
 */
(function () {
  "use strict";

  var BASE = "https://ghostae.com";
  var KEY_STORE = "ghost.license.key";
  var DEV_STORE = "ghost.device.fingerprint";

  function get(k) { try { return window.localStorage.getItem(k) || ""; } catch (e) { return ""; } }
  function set(k, v) { try { if (v) window.localStorage.setItem(k, v); else window.localStorage.removeItem(k); } catch (e) {} }

  function device() {
    var id = get(DEV_STORE);
    if (id) return id;
    var seed = "";
    try { seed = (window.navigator && window.navigator.userAgent) || ""; } catch (e) {}
    var h = 0;
    for (var i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) | 0;
    id = "dev-" + Math.abs(h).toString(16) + "-" + Math.floor(Math.random() * 0xffffffff).toString(16);
    set(DEV_STORE, id);
    return id;
  }

  function req(method, path, body) {
    return new Promise(function (resolve) {
      try {
        var x = new XMLHttpRequest();
        x.open(method, BASE + path, true);
        x.setRequestHeader("Content-Type", "application/json");
        x.timeout = 15000;
        x.onload = function () {
          var d = null;
          try { d = JSON.parse(x.responseText || "null"); } catch (e) {}
          resolve({ status: x.status, data: d });
        };
        x.onerror = x.ontimeout = function () { resolve({ status: 0, data: null }); };
        x.send(body ? JSON.stringify(body) : null);
      } catch (e) { resolve({ status: 0, data: null }); }
    });
  }

  /* ------------------------------ overlay ------------------------------ */

  var STYLE =
    "position:fixed;inset:0;z-index:2147483000;display:flex;align-items:center;justify-content:center;" +
    "padding:22px;background:rgba(5,7,14,.97);backdrop-filter:blur(8px);color:#e2e8f0;" +
    'font:13px "Hind Siliguri","Noto Sans Bengali",sans-serif;text-align:center';

  function box() {
    var el = document.getElementById("ghostGate");
    if (!el) {
      el = document.createElement("div");
      el.id = "ghostGate";
      el.setAttribute("style", STYLE);
      document.body.appendChild(el);
    }
    el.style.display = "flex";
    return el;
  }

  function hide() {
    var el = document.getElementById("ghostGate");
    if (el) el.style.display = "none";
  }

  function activationScreen(message) {
    var el = box();
    el.innerHTML =
      '<div style="max-width:330px;width:100%">' +
      '<div style="font-size:10.5px;letter-spacing:.2em;text-transform:uppercase;color:#7c5cff;font-weight:800">Ghostae Caption</div>' +
      '<h2 style="margin:10px 0 6px;font-size:18px;color:#fff">লাইসেন্স কী দিয়ে চালু করুন</h2>' +
      '<p style="margin:0 0 14px;font-size:12px;line-height:1.6;color:#9aa4b8">ফ্রি, লাইট বা প্রো — সব প্ল্যানেই কী প্রয়োজন। ghostae.com/products থেকে কী নিন।</p>' +
      '<input id="ghostGateKey" placeholder="GHST-XXXX-XXXX" autocomplete="off" ' +
      'style="width:100%;padding:11px 12px;border-radius:10px;border:1px solid #26304a;background:#0a1020;color:#fff;' +
      'font-size:13px;text-align:center;letter-spacing:.08em">' +
      '<button id="ghostGateGo" style="margin-top:10px;width:100%;padding:11px;border:0;border-radius:10px;cursor:pointer;' +
      'background:#7c5cff;color:#fff;font-size:12.5px;font-weight:700">অ্যাক্টিভেট করুন</button>' +
      '<div id="ghostGateMsg" style="margin-top:10px;min-height:16px;font-size:11.5px;color:#ff8a8a">' +
      (message || "") +
      "</div></div>";
    var input = document.getElementById("ghostGateKey");
    var btn = document.getElementById("ghostGateGo");
    input.value = get(KEY_STORE);
    btn.onclick = function () {
      var key = (input.value || "").trim().toUpperCase();
      if (!key) return;
      document.getElementById("ghostGateMsg").textContent = "যাচাই করা হচ্ছে…";
      verify(key, true);
    };
    input.onkeydown = function (e) { if (e.keyCode === 13) btn.click(); };
  }

  function lockScreen(title, body, url) {
    var el = box();
    el.innerHTML =
      '<div style="max-width:330px">' +
      '<h2 style="margin:0 0 6px;font-size:18px;color:#fff">' + title + "</h2>" +
      '<p style="margin:0;font-size:12px;line-height:1.6;color:#9aa4b8">' + body + "</p>" +
      (url
        ? '<button id="ghostGateDl" style="margin-top:14px;padding:10px 22px;border:0;border-radius:999px;cursor:pointer;' +
          'background:#7c5cff;color:#fff;font-size:12px;font-weight:700">আপডেট ডাউনলোড</button>'
        : "") +
      "</div>";
    var b = document.getElementById("ghostGateDl");
    if (b)
      b.onclick = function () {
        try {
          if (window.cep && window.cep.util && window.cep.util.openURLInDefaultBrowser)
            return window.cep.util.openURLInDefaultBrowser(url);
        } catch (e) {}
        window.open(url, "_blank");
      };
  }

  /* ------------------------------ licence ------------------------------ */

  window.GHOST_LICENSED = false;

  function verify(key, interactive) {
    var licenseKey = (key || get(KEY_STORE) || "").trim().toUpperCase();
    if (!licenseKey) { activationScreen(""); return Promise.resolve(false); }

    return req("POST", "/api/public/v1/license/verify", {
      license_key: licenseKey,
      device_fingerprint: device(),
    }).then(function (res) {
      var lic = res.data && res.data.license;
      if (lic && lic.valid) {
        set(KEY_STORE, licenseKey);
        window.GHOST_LICENSED = true;
        window.GHOST_PLAN = lic.plan || "free";
        hide();
        if (window.ghostRefreshPlan) window.ghostRefreshPlan();
        return true;
      }
      window.GHOST_LICENSED = false;
      if (!res.data && !interactive && get(KEY_STORE)) {
        // Offline with a previously accepted key: stay locked but explain why.
        lockScreen("সার্ভারে সংযোগ নেই", "ইন্টারনেট সংযোগ দিয়ে আবার চেষ্টা করুন।");
        return false;
      }
      var reason = (lic && lic.reason) || "invalid";
      var msg =
        reason === "seat_limit"
          ? "এই কী-র ডিভাইস লিমিট শেষ।"
          : reason === "expired"
          ? "কী-র মেয়াদ শেষ হয়েছে।"
          : reason === "device_revoked" || reason === "revoked" || reason === "suspended"
          ? "এই কী বন্ধ করা হয়েছে। সাপোর্টে যোগাযোগ করুন: +880 1345 407572"
          : "কী সঠিক নয়। আবার চেষ্টা করুন।";
      activationScreen(msg);
      return false;
    });
  }

  function control() {
    return req(
      "GET",
      "/api/public/v1/control?panel=caption&key=" + encodeURIComponent(get(KEY_STORE)),
      null,
    ).then(function (res) {
      var d = res.data;
      if (!d || !d.ok) return false;
      var up = d.update || {};
      if (up.blocked && up.url) {
        lockScreen(
          "নতুন ভার্সন প্রয়োজন",
          up.message || "এই ভার্সনটি আর সাপোর্টেড নয়। সর্বশেষ Ghostae Caption ডাউনলোড করুন।",
          up.url,
        );
        return false;
      }
      var lic = d.license || {};
      if (lic.status === "suspended" || lic.status === "revoked" || lic.status === "expired") {
        window.GHOST_LICENSED = false;
        lockScreen(
          "লাইসেন্স বন্ধ",
          "এই অ্যাক্টিভেশন কী বন্ধ করা হয়েছে। WhatsApp +880 1345 407572 এ যোগাযোগ করুন।",
        );
        return false;
      }
      return true;
    });
  }

  /* ------------------------------- quota ------------------------------- */

  function audioMinutes() {
    return new Promise(function (resolve) {
      try {
        var input = document.getElementById("file");
        var f = input && input.files && input.files[0];
        if (!f) return resolve(1);
        var a = document.createElement("audio");
        a.preload = "metadata";
        a.onloadedmetadata = function () {
          resolve(Math.max(1, Math.ceil((a.duration || 60) / 60)));
          try { URL.revokeObjectURL(a.src); } catch (e) {}
        };
        a.onerror = function () { resolve(Math.max(1, Math.ceil(f.size / (1024 * 1024)))); };
        a.src = URL.createObjectURL(f);
      } catch (e) { resolve(1); }
    });
  }

  function toast(text) {
    var t = document.createElement("div");
    t.setAttribute(
      "style",
      "position:fixed;left:50%;bottom:22px;transform:translateX(-50%);z-index:2147483001;" +
        "padding:11px 16px;border-radius:10px;background:#1a1030;border:1px solid #4b2fa8;color:#f4f0ff;" +
        'font:12.5px "Hind Siliguri",sans-serif;max-width:80%;text-align:center',
    );
    t.textContent = text;
    document.body.appendChild(t);
    setTimeout(function () { if (t.parentNode) t.parentNode.removeChild(t); }, 5200);
  }

  /* ---- real usage: billed from the finished SRT, never per click ---- */

  var BILL_STORE = "ghost.caption.billed";

  /** Last cue end time in the SRT -> whole minutes (rounded up). */
  function srtMinutes(srt) {
    var re = /-->\s*(\d{1,2}):(\d{2}):(\d{2})[,.](\d{1,3})/g;
    var m, sec = 0;
    while ((m = re.exec(srt))) {
      var s = (+m[1]) * 3600 + (+m[2]) * 60 + (+m[3]) + (+m[4]) / 1000;
      if (s > sec) sec = s;
    }
    if (!sec) return 0;
    return Math.max(1, Math.ceil(sec / 60));
  }

  function billed(sig) {
    var list = (get(BILL_STORE) || "").split(",");
    if (list.indexOf(sig) !== -1) return true;
    list.push(sig);
    set(BILL_STORE, list.slice(-30).join(","));
    return false;
  }

  function sign(srt) {
    var h = 0;
    for (var i = 0; i < srt.length; i++) h = (h * 33 + srt.charCodeAt(i)) | 0;
    return srt.length + "x" + Math.abs(h).toString(16);
  }

  /** Reports the true duration once per generated caption result. */
  function reportSrt(srt) {
    var text = (srt || "").trim();
    if (!text || text.indexOf("-->") === -1) return;
    var minutes = srtMinutes(text);
    if (!minutes) return;
    if (billed(sign(text))) return;
    req("POST", "/api/public/v1/caption/plan", {
      key: get(KEY_STORE),
      device: device(),
      minutes: minutes,
    }).then(function () {
      if (window.ghostRefreshPlan) window.ghostRefreshPlan();
    });
  }

  function watchSrt() {
    var boxEl = document.getElementById("srt");
    if (!boxEl || !window.MutationObserver) return;
    new MutationObserver(function () {
      reportSrt(boxEl.textContent || "");
    }).observe(boxEl, { childList: true, characterData: true, subtree: true });
  }

  /** Pre-flight check only — no minute is consumed here. */
  window.ghostCaptionGuard = function () {
    return audioMinutes().then(function (minutes) {
      return req("POST", "/api/public/v1/caption/plan", {
        key: get(KEY_STORE),
        device: device(),
        minutes: minutes,
        dry_run: true,
      }).then(function (res) {
        var d = res.data || {};
        if (window.ghostRefreshPlan) window.ghostRefreshPlan();
        if (res.status === 0) {
          toast("সার্ভারে সংযোগ নেই। ইন্টারনেট সংযোগ দিয়ে আবার চেষ্টা করুন।");
          return false;
        }
        if (d.ok) return true;
        if (!d.licensed) { window.GHOST_LICENSED = false; activationScreen("লাইসেন্স যাচাই করা যায়নি।"); return false; }
        var used = (d.daily && d.daily.used) || 0;
        var limit = (d.daily && d.daily.limit) || 0;
        toast("আজকের ক্যাপশন লিমিট শেষ (" + used + "/" + limit + " মিনিট)। প্ল্যান আপগ্রেড করুন।");
        return false;
      });
    });
  };


  /* ------------------------------- wiring ------------------------------ */

  function guardGenerate() {
    var btn = document.getElementById("generate");
    if (!btn) return;
    btn.addEventListener(
      "click",
      function (e) {
        if (btn.dataset.ghostOk === "1") { btn.dataset.ghostOk = ""; return; }
        e.preventDefault();
        e.stopImmediatePropagation();
        if (!window.GHOST_LICENSED) { activationScreen("প্রথমে লাইসেন্স কী দিন।"); return; }
        window.ghostCaptionGuard().then(function (ok) {
          if (!ok) return;
          btn.dataset.ghostOk = "1";
          btn.click();
        });
      },
      true,
    );
  }

  function boot() {
    activationScreen("");
    verify(null, false).then(function (ok) {
      if (ok) control();
    });
    guardGenerate();
    watchSrt();

    setInterval(function () {
      verify(null, false).then(function (ok) { if (ok) control(); });
    }, 3600000);
  }

  window.ghostGateDevice = device;
  window.ghostGateKey = function () { return get(KEY_STORE); };

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot);
  else boot();
})();
