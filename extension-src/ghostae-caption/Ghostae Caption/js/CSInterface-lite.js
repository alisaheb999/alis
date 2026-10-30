/* Minimal CEP bridge — avoids shipping the full Adobe CSInterface library. */
(function (global) {
  "use strict";
  function GhostCep() {}
  GhostCep.prototype.available = function () {
    return typeof global.__adobe_cep__ !== "undefined";
  };
  GhostCep.prototype.evalScript = function (script, callback) {
    if (!this.available()) { if (callback) callback(""); return; }
    global.__adobe_cep__.evalScript(script, callback || function () {});
  };
  global.GhostCep = new GhostCep();
})(window);
