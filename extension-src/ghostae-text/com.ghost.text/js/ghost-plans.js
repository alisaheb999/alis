(function() {
  "use strict";
  var PLANS = [
    { id: "free", name: "Free", bn: "ফ্রি", price: 0, year: 0, tokens: "100K", accent: "#8c8c8c" },
    { id: "basic", name: "Basic", bn: "বেসিক", price: 149, year: 1290, tokens: "1M", accent: "#34d399" },
    { id: "pro", name: "Premium", bn: "প্রিমিয়াম", price: 399, year: 3990, tokens: "5M", accent: "#2680eb", popular: true },
    { id: "ultra", name: "Ultra", bn: "আল্ট্রা", price: 999, year: 9990, tokens: "20M", accent: "#a855f7" }
  ];
  var MATRIX = [
    { panel: "Ghost Cache", icon: "◈", note: "Asset library — local + cloud vault", rows: [
      ["Local asset indexing", "1 folder", "5 folders", "Unlimited", "Unlimited"],
      ["Cloud vault downloads", "25 / month", "500 / month", "5,000 / month", "Unlimited"],
      ["Cloud categories", "Icons + Emoji", "Icons, Emoji, Audio, LUTs", "All categories", "All + early drops"],
      ["Premium asset packs", "no", "Limited (5 packs)", "yes", "yes"],
      ["Bookmarks & smart folders", "20 items", "500 items", "Unlimited", "Unlimited"],
      ["AI auto-tagging", "no", "no", "yes", "yes"],
      ["Team shared library", "no", "no", "no", "yes (5 seats)"]
    ] },
    { panel: "Ghost Command", icon: "◇", note: "AI assistant — token হিসেবে খরচ হয়", rows: [
      ["Monthly AI tokens", "100K", "1M", "5M", "20M"],
      ["Fast models (Flash / Groq)", "yes", "yes", "yes", "yes"],
      ["Reasoning models (Pro / Claude / GPT)", "no", "500K tokens", "yes", "yes"],
      ["Expression generator + auto-apply", "5 / day", "50 / day", "Unlimited", "Unlimited"],
      ["Layer-level project access", "Read only", "Read + basic edit", "Full control", "Full control"],
      ["Voice input & transcription", "no", "15 min / month", "3 hours / month", "12 hours / month"],
      ["Chat history & sessions", "3 sessions", "50 sessions", "Unlimited", "Unlimited + export"],
      ["Token top-up purchase", "no", "yes", "yes", "yes (bulk rate)"]
    ] },
    { panel: "Ghostae Text / TOOLKIT", icon: "⌁", note: "Text animation, FFX style, colour plate", rows: [
      ["Text animation presets", "30 of 300+", "150 of 300+", "All 300+", "All + monthly new"],
      ["FFX text styles", "15 styles", "120 styles", "All 305", "All 305"],
      ["Save custom FFX preset", "no", "10 presets", "Unlimited", "Unlimited + share"],
      ["Colour plates", "50 plates", "300 plates", "All 1,000", "All 1,000"],
      ["Gradient rig & colour plates", "no", "Limited", "yes", "yes"],
      ["One-click combos", "3 combos", "20 combos", "All combos", "All + custom"],
      ["Emoji & icon library", "200 items", "1,000 items", "All 1,900+", "All 1,900+"]
    ] },
    { panel: "Ghost Tools", icon: "⚒", note: "Workflow utility, Project Manager, Editor Board", rows: [
      ["Layer Hider, Workspace, Notes", "yes", "yes", "yes", "yes"],
      ["Auto-save & recovery", "5 min only", "Custom interval", "Custom + versions", "Custom + versions"],
      ["Project Manager", "Scan only", "Scan + report", "Scan + backup", "Scan + backup + restore"],
      ["Project backup / collect files", "no", "no", "yes", "yes (batch)"],
      ["Editor Board", "1 board", "10 boards", "Unlimited", "Unlimited"],
      ["SRT import & Caption AI", "SRT import", "SRT + 10 AI captions", "Unlimited AI captions", "Unlimited + storyboard"],
      ["Remove background", "3 / month", "50 / month", "500 / month", "2,000 / month"]
    ] },
    { panel: "SYSTEM & LICENSE", icon: "⇪", note: "Update, device, support, license", rows: [
      ["Activation devices", "1 device", "1 device", "2 devices", "5 devices"],
      ["Patch & version updates", "yes", "yes", "yes", "yes (early access)"],
      ["Cloud sync of settings", "no", "no", "yes", "yes"],
      ["Commercial licence", "no", "no", "yes", "yes (studio-wide)"],
      ["Support", "Community", "Email (72h)", "Priority (24h)", "Priority + call"]
    ] }
  ];
  var TOKEN_PACKS = [
    ["500K tokens", "~150 chat replies", 79],
    ["1.5M tokens", "Most popular top-up", 199],
    ["4M tokens", "Heavy expression + caption work", 449],
    ["10M tokens", "Studio batch jobs", 899]
  ];
  var TOKEN_COSTS = [
    ["Short chat reply (Flash)", "~700 tokens"],
    ["Expression generate + apply", "~1,500 tokens"],
    ["Reasoning answer (Pro / Claude)", "~6,000 tokens"],
    ["1 min audio → caption", "~4,000 tokens"],
    ["Storyboard (10 shots)", "~15,000 tokens"]
  ];
  function esc(s) {
    return String(s).replace(/[&<>"]/g, function(c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c];
    });
  }
  function cell(v) {
    if (v === "yes") return '<span class="gp-yes">✔</span>';
    if (v === "no") return '<span class="gp-no">🔒 Locked</span>';
    var limited = /Limited|only|of \d|\/ (day|month)|^\d/.test(v);
    return '<span class="' + (limited ? "gp-limit" : "gp-ok") + '">' + esc(v) + "</span>";
  }
  function currentPlan() {
    try {
      var s = JSON.parse(localStorage.getItem("ghost.licenseState") || "null");
      if (s && s.plan) return String(s.plan).toLowerCase();
    } catch (e) {
    }
    return localStorage.getItem("ghost.plan") || "free";
  }
  function planCards(cycle) {
    var cur = currentPlan();
    return PLANS.map(function(p) {
      var price = cycle === "yearly" ? p.year : p.price;
      var unlocked = MATRIX.map(function(g) {
        var i = ["free", "basic", "pro", "ultra"].indexOf(p.id) + 1;
        var n = g.rows.filter(function(r) {
          return r[i] !== "no";
        }).length;
        return '<li><span class="gp-pl">' + g.icon + " " + esc(g.panel) + '</span><b style="color:' + (n === g.rows.length ? "#34d399" : "#e0b070") + '">' + n + "/" + g.rows.length + "</b></li>";
      }).join("");
      return '<div class="gp-card' + (p.popular ? " gp-pop" : "") + (cur === p.id ? " gp-current" : "") + '" style="--gp-accent:' + p.accent + '">' + (p.popular ? '<span class="gp-badge">POPULAR</span>' : "") + (cur === p.id ? '<span class="gp-badge gp-badge-cur">YOUR PLAN</span>' : "") + '<div class="gp-name"><i></i>' + p.name + " <em>" + p.bn + '</em></div><div class="gp-price">৳' + price + "<small>/" + (cycle === "yearly" ? "yr" : "mo") + '</small></div><div class="gp-tokens">AI tokens <b>' + p.tokens + ' / mo</b></div><ul class="gp-list">' + unlocked + "</ul></div>";
    }).join("");
  }
  function matrixHtml(active) {
    var tabs = MATRIX.map(function(g2, i) {
      return '<button class="gp-tab' + (i === active ? " is-on" : "") + '" data-tab="' + i + '">' + g2.icon + " " + esc(g2.panel) + "</button>";
    }).join("");
    var g = MATRIX[active];
    var rows = g.rows.map(function(r) {
      return "<tr><td>" + esc(r[0]) + "</td><td>" + cell(r[1]) + "</td><td>" + cell(r[2]) + "</td><td>" + cell(r[3]) + "</td><td>" + cell(r[4]) + "</td></tr>";
    }).join("");
    return '<div class="gp-tabs">' + tabs + '</div><div class="gp-note">' + esc(g.note) + '</div><div class="gp-tablewrap"><table class="gp-table"><thead><tr><th>Feature</th>' + PLANS.map(function(p) {
      return '<th><span style="color:' + p.accent + '">●</span> ' + p.name + "</th>";
    }).join("") + "</tr></thead><tbody>" + rows + '</tbody></table></div><div class="gp-legend"><span class="gp-yes">✔</span> included · <span class="gp-limit">quota limited</span> · <span class="gp-no">🔒 locked</span></div>';
  }
  function tokensHtml() {
    return '<div class="gp-two"><div class="gp-box"><h4>AI token top-up</h4><p>Token শেষ হলে যেকোনো সময় top-up — expire হয় না।</p><table class="gp-table">' + TOKEN_PACKS.map(function(t) {
      return "<tr><td><b>" + t[0] + "</b></td><td>" + esc(t[1]) + '</td><td class="gp-r">৳' + t[2] + "</td></tr>";
    }).join("") + '</table></div><div class="gp-box"><h4>What a token buys</h4><p>গড় খরচ (model অনুযায়ী কম-বেশি হতে পারে)।</p><table class="gp-table">' + TOKEN_COSTS.map(function(t) {
      return "<tr><td>" + esc(t[0]) + '</td><td class="gp-r">' + t[1] + "</td></tr>";
    }).join("") + "</table></div></div>";
  }
  var state = { cycle: "monthly", tab: 0 };
  function render(root) {
    root.querySelector(".gp-cards").innerHTML = planCards(state.cycle);
    root.querySelector(".gp-matrix").innerHTML = matrixHtml(state.tab);
  }
  var PLAN_INFO = {
    free: { name: "Free", price: "৳0", tokens: "100K tokens / month" },
    basic: { name: "Basic", price: "৳149", tokens: "1M tokens / month" },
    pro: { name: "Premium", price: "৳399", tokens: "5M tokens / month" },
    ultra: { name: "Ultra", price: "৳999", tokens: "20M tokens / month" },
    team: { name: "Team", price: "৳1,999", tokens: "Pooled team tokens" }
  };
  function siteUrl(path) {
    var base = window.GhostConfig && window.GhostConfig.baseUrl() || "https://ghostae.com";
    return base + (path || "");
  }
  function openSite(url) {
    try {
      if (window.GhostSystem && window.GhostSystem.openURL) return window.GhostSystem.openURL(url);
      if (typeof CSInterface !== "undefined") return new CSInterface().openURLInDefaultBrowser(url);
    } catch (e) {
    }
    try {
      window.open(url, "_blank");
    } catch (e2) {
    }
  }
  function open() {
    var old = document.getElementById("ghostPlansModal");
    if (old) old.remove();
    var id = currentPlan();
    if (id === "premium") id = "pro";
    var info = PLAN_INFO[id] || PLAN_INFO.free;
    var wrap = document.createElement("div");
    wrap.id = "ghostPlansModal";
    wrap.className = "gp-overlay gp-overlay-mini";
    wrap.innerHTML = '<div class="gp-mini" role="dialog" aria-label="Your plan"><button class="gp-close" aria-label="Close">✕</button><div class="gp-mini-label">Your plan</div><div class="gp-mini-name">' + esc(info.name) + '</div><div class="gp-mini-price">' + esc(info.price) + '<small>/mo</small></div><div class="gp-mini-tokens">' + esc(info.tokens) + '</div><button class="gp-mini-cta" type="button">See pricing</button><button class="gp-mini-support" type="button">Support</button></div>';
    document.body.appendChild(wrap);
    wrap.addEventListener("click", function(e) {
      var t = e.target;
      if (t === wrap || t.classList.contains("gp-close")) {
        wrap.remove();
        return;
      }
      if (t.classList.contains("gp-mini-cta")) {
        openSite(siteUrl("/pricing"));
        wrap.remove();
      }
      if (t.classList.contains("gp-mini-support")) {
        openSite(siteUrl("/support"));
        wrap.remove();
      }
    });
  }
  function bindUpgradeButtons() {
    var btns = document.querySelectorAll(".plan-upgrade-button");
    for (var i = 0; i < btns.length; i++) {
      btns[i].addEventListener("click", open);
    }
  }
  window.GhostPlans = { open, plans: PLANS, matrix: MATRIX, currentPlan };
  window.GhostBoot.push(bindUpgradeButtons);
})();
