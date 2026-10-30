if (typeof window !== "undefined" && window.__ghostStamp) {
  window.__ghostStamp(
    "ghost-connect.js",
    /* @ghost-build */
    "3.40.2+20260829.ui-perfect"
  );
}
(function(global) {
  "use strict";
  var SERVICES = ["cache", "assistant", "command"];
  var LABEL = {
    cache: "GHOST Cache",
    assistant: "GHOST AI Assistant",
    command: "GHOST Command"
  };
  var state = {
    online: false,
    mode: "offline",
    // "online" | "offline"
    checkedAt: 0,
    providers: {},
    services: {}
  };
  SERVICES.forEach(function(id) {
    state.services[id] = { id, label: LABEL[id], connected: true, mode: "offline" };
  });
  var listeners = [];
  function emit() {
    var snapshot = Connect.snapshot();
    listeners.forEach(function(fn) {
      try {
        fn(snapshot);
      } catch (e) {
      }
    });
    try {
      var evt = document.createEvent("Event");
      evt.initEvent("ghost-connection", true, false);
      evt.detail = snapshot;
      document.dispatchEvent(evt);
    } catch (e) {
    }
    paint();
  }
  function apply(online) {
    state.online = !!online;
    state.mode = online ? "online" : "offline";
    state.checkedAt = Date.now();
    SERVICES.forEach(function(id) {
      state.services[id].connected = true;
      state.services[id].mode = state.mode;
    });
    emit();
  }
  function chip() {
    var el = document.getElementById("ghostConnectChip");
    if (el) return el;
    var host = document.querySelector(".header-control-capsule") || document.querySelector(".brand-row") || document.querySelector(".sidebar-topbar");
    if (!host) return null;
    el = document.createElement("div");
    el.id = "ghostConnectChip";
    el.className = "ghost-connect-chip is-checking";
    el.setAttribute("role", "status");
    el.innerHTML = '<span class="gcc-dot" aria-hidden="true"></span><span class="gcc-text">Connecting…</span>';
    el.title = "GHOST Cache · AI Assistant · Command";
    if (host.firstChild) {
      host.insertBefore(el, host.firstChild);
    } else {
      host.appendChild(el);
    }
    return el;
  }
  function paint() {
    var el = chip();
    if (!el) return;
    var text = el.querySelector(".gcc-text");
    el.classList.remove("is-checking", "is-online", "is-offline");
    el.classList.add(state.online ? "is-online" : "is-offline");
    if (text) text.textContent = state.online ? "Connected" : "Connected (Offline Mode)";
    el.title = SERVICES.map(function(id) {
      return LABEL[id] + ": connected" + (state.online ? "" : " (offline)");
    }).join("\n");
  }
  var timer = null;
  function probe() {
    if (!global.GhostCloud || !global.GhostCloud.request) {
      apply(false);
      return Promise.resolve(state);
    }
    return global.GhostCloud.request("GET", "/api/public/v1/providers/status").then(function(res) {
      state.providers = res && (res.providers || res.availability) || {};
      apply(true);
      return state;
    }).catch(function() {
      apply(false);
      return state;
    });
  }
  var Connect = {
    services: SERVICES,
    snapshot: function() {
      return {
        online: state.online,
        mode: state.mode,
        label: state.online ? "Connected" : "Connected (Offline Mode)",
        checkedAt: state.checkedAt,
        providers: state.providers,
        services: state.services
      };
    },
    isOnline: function() {
      return state.online;
    },
    /** Every core service is always "connected"; only its mode changes. */
    isConnected: function(id) {
      return !id || !!state.services[id];
    },
    providerReady: function(name) {
      return !!state.providers[String(name || "").toLowerCase()];
    },
    on: function(fn) {
      if (typeof fn === "function") {
        listeners.push(fn);
        fn(Connect.snapshot());
      }
    },
    refresh: probe,
    start: function() {
      chip();
      paint();
      probe();
      if (timer) global.clearInterval(timer);
      timer = global.setInterval(probe, 5 * 60 * 1e3);
      try {
        global.addEventListener("online", probe);
        global.addEventListener("focus", function() {
          if (Date.now() - state.checkedAt > 6e4) probe();
        });
      } catch (e) {
      }
      return Connect;
    }
  };
  global.GhostConnect = Connect;
  function boot() {
    Connect.start();
  }
  window.GhostBoot.push(boot);
})(typeof window !== "undefined" ? window : this);
