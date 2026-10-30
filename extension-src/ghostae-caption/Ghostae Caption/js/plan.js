/* Ghostae Caption — plan chip + usage sheet (main-server backed). */
(function () {
  "use strict";

  var BASE = "https://ghostae.com";
  var FALLBACK = { tag: "LOCKED", name: "লাইসেন্স প্রয়োজন", daily: {}, monthly: {} };

  function num(v) { return v == null ? "—" : v; }

  function render(p) {
    var tag = document.getElementById("planTag");
    if (tag) tag.textContent = p.tag || "LOCKED";
    var body = document.getElementById("planBody");
    if (!body) return;
    var d = p.daily || {}, m = p.monthly || {};
    body.innerHTML =
      '<div class="plan-name">' + (p.name || FALLBACK.name) + "</div>" +
      '<div class="plan-row"><span>আজ</span><b>' + num(d.used) + " / " + num(d.limit) + " মিনিট</b></div>" +
      '<div class="plan-row"><span>এই মাসে</span><b>' + num(m.used) + " / " + num(m.limit) + " মিনিট</b></div>" +
      '<div class="plan-row"><span>আপলোড সীমা</span><b>' + num(p.upload_max_mb) + " MB</b></div>" +
      (p.licensed ? "" : '<div class="plan-row"><span>স্ট্যাটাস</span><b>বন্ধ</b></div>') +
      '<div class="plan-hint">প্ল্যান আপগ্রেড: ghostae.com/products</div>' +
      '<div class="plan-hint" style="margin-top:4px">সাহায্য / কী নিতে: WhatsApp বা কল <b>+880 1345 407572</b></div>' +
      '<div style="display:flex;gap:6px;margin-top:8px">' +
      '<button type="button" id="planWa" style="flex:1;padding:7px;border:0;border-radius:8px;cursor:pointer;background:#25d366;color:#06280f;font-size:11px;font-weight:800">WhatsApp</button>' +
      '<button type="button" id="planBuy" style="flex:1;padding:7px;border:0;border-radius:8px;cursor:pointer;background:#7c5cff;color:#fff;font-size:11px;font-weight:800">আপগ্রেড</button>' +
      "</div>";
    open("planWa", "https://wa.me/8801345407572?text=" + encodeURIComponent("Ghostae Caption — লাইসেন্স কী / সাহায্য দরকার।"));
    open("planBuy", "https://ghostae.com/products/caption");
  }

  /** Opens a link in the system browser (CEP panels have no target=_blank). */
  function open(id, url) {
    var b = document.getElementById(id);
    if (!b) return;
    b.onclick = function () {
      try {
        if (window.cep && window.cep.util && window.cep.util.openURLInDefaultBrowser)
          return window.cep.util.openURLInDefaultBrowser(url);
      } catch (e) {}
      window.open(url, "_blank");
    };
  }

  function load() {
    var key = (window.ghostGateKey && window.ghostGateKey()) || "";
    var dev = (window.ghostGateDevice && window.ghostGateDevice()) || "";
    try {
      var x = new XMLHttpRequest();
      x.open("GET", BASE + "/api/public/v1/caption/plan?key=" + encodeURIComponent(key) + "&device=" + encodeURIComponent(dev), true);
      x.timeout = 9000;
      x.onload = function () {
        try { render(JSON.parse(x.responseText) || FALLBACK); } catch (e) { render(FALLBACK); }
      };
      x.onerror = x.ontimeout = function () { render(FALLBACK); };
      x.send();
    } catch (e) { render(FALLBACK); }
  }

  window.ghostRefreshPlan = load;

  window.ghostTogglePlan = function () {
    var s = document.getElementById("planSheet");
    if (!s) return;
    s.style.display = s.style.display === "block" ? "none" : "block";
    if (s.style.display === "block") load();
  };

  window.ghostInitPlan = function () {
    render(FALLBACK);
    load();
  };
})();
