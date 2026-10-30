if (typeof window !== "undefined" && window.__ghostStamp) {
  window.__ghostStamp(
    "ghost-feedback.js",
    /* @ghost-build */
    "3.40.2+20260829.ui-perfect"
  );
}
(function(global) {
  "use strict";
  var BUILD = global.GHOST_BUILD && global.GHOST_BUILD.buildId || "dev";
  if (global.__ghostStamp) global.__ghostStamp("js/ghost-feedback.js", BUILD);
  var panelName = global.GHOST_PANEL_ID || document.documentElement.getAttribute("data-ghost-panel") || "unknown";
  var root = null;
  var els = {};
  var busy = false;
  function el(tag, cls, text) {
    var n = document.createElement(tag);
    if (cls) n.className = cls;
    if (text != null) n.textContent = text;
    return n;
  }
  function build() {
    if (root) return root;
    root = el("div", "ghost-fb");
    els.dot = el("button", "ghost-fb-dot");
    els.dot.type = "button";
    els.dot.title = "সমস্যা জানান / Report a problem";
    els.dot.setAttribute("aria-label", "Report a problem");
    root.appendChild(els.dot);
    els.sheet = el("div", "ghost-fb-sheet");
    els.sheet.appendChild(el("div", "ghost-fb-title", "কী সমস্যা হচ্ছে?"));
    els.sheet.appendChild(el("div", "ghost-fb-sub", "আপনার মন্তব্য সোজা GHOST admin panel-এ যাবে।"));
    els.severity = document.createElement("select");
    els.severity.className = "ghost-fb-select";
    [["issue", "Issue / সমস্যা"], ["bug", "Bug"], ["crash", "Crash"], ["idea", "Idea / পরামর্শ"]].forEach(function(pair) {
      var o = document.createElement("option");
      o.value = pair[0];
      o.textContent = pair[1];
      els.severity.appendChild(o);
    });
    els.sheet.appendChild(els.severity);
    els.text = document.createElement("textarea");
    els.text.className = "ghost-fb-text";
    els.text.rows = 4;
    els.text.placeholder = "যেমন: Text animation apply হচ্ছে কিন্তু bounce দেখা যাচ্ছে না…";
    els.sheet.appendChild(els.text);
    els.contact = document.createElement("input");
    els.contact.className = "ghost-fb-input";
    els.contact.type = "text";
    els.contact.placeholder = "Email (optional)";
    els.sheet.appendChild(els.contact);
    var row = el("div", "ghost-fb-row");
    els.send = el("button", "ghost-fb-btn ghost-fb-primary", "Send");
    els.send.type = "button";
    els.close = el("button", "ghost-fb-btn", "Close");
    els.close.type = "button";
    row.appendChild(els.send);
    row.appendChild(els.close);
    els.sheet.appendChild(row);
    els.status = el("div", "ghost-fb-status");
    els.sheet.appendChild(els.status);
    root.appendChild(els.sheet);
    (document.body || document.documentElement).appendChild(root);
    els.dot.addEventListener("click", function() {
      root.classList.toggle("is-open");
    });
    els.close.addEventListener("click", function() {
      root.classList.remove("is-open");
    });
    els.send.addEventListener("click", send);
    return root;
  }
  function status(text, kind) {
    if (!els.status) return;
    els.status.textContent = text || "";
    els.status.setAttribute("data-kind", kind || "info");
  }
  function send() {
    if (busy) return;
    var message = (els.text.value || "").trim();
    if (message.length < 3) return status("আরেকটু বিস্তারিত লিখুন।", "error");
    if (!global.GhostCloud || !global.GhostCloud.report) return status("Cloud client পাওয়া যায়নি।", "error");
    busy = true;
    els.send.disabled = true;
    status("পাঠানো হচ্ছে…", "info");
    global.GhostCloud.report({
      panel: panelName,
      message,
      contact: (els.contact.value || "").trim(),
      severity: els.severity.value
    }).then(function() {
      busy = false;
      els.send.disabled = false;
      els.text.value = "";
      status("ধন্যবাদ! রিপোর্ট পাঠানো হয়েছে ✔", "ok");
      setTimeout(function() {
        root.classList.remove("is-open");
      }, 1200);
    }).catch(function() {
      busy = false;
      els.send.disabled = false;
      status("Offline — পরে নিজে থেকেই পাঠানো হবে।", "warn");
    });
  }
  function boot() {
    build();
  }
  global.GhostBoot.push(boot);
  global.GhostFeedback = {
    open: function() {
      build().classList.add("is-open");
    },
    close: function() {
      if (root) root.classList.remove("is-open");
    }
  };
})(typeof window !== "undefined" ? window : this);
