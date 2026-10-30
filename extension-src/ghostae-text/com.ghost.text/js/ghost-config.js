(function(global) {
  "use strict";
  var KEY = "ghost.cloud.baseUrl";
  var DEFAULT_BASE = "https://ghostae.com";
  var LEGACY_BASES = ["hi-there-buddy-4063.lovable.app", "lovableproject.com", "id-preview--"];
  function isLegacy(url) {
    for (var i = 0; i < LEGACY_BASES.length; i++) {
      if (url.indexOf(LEGACY_BASES[i]) !== -1) return true;
    }
    return false;
  }
  function normalise(value) {
    var text = String(value || "").trim();
    if (!text) return "";
    if (!/^https?:\/\//i.test(text)) return "";
    return text.replace(/\/+$/, "");
  }
  function baseUrl() {
    var stored = "";
    try {
      var raw = global.localStorage.getItem(KEY);
      if (raw) {
        try {
          raw = JSON.parse(raw);
        } catch (e) {
        }
        stored = normalise(raw);
        if (stored && isLegacy(stored)) {
          stored = "";
          try {
            global.localStorage.removeItem(KEY);
          } catch (e2) {
          }
        }
      }
    } catch (error) {
    }
    return stored || DEFAULT_BASE;
  }
  function setBaseUrl(value) {
    var next = normalise(value);
    try {
      if (next) global.localStorage.setItem(KEY, JSON.stringify(next));
      else global.localStorage.removeItem(KEY);
    } catch (error) {
    }
    return baseUrl();
  }
  function api(path) {
    var suffix = String(path || "");
    if (suffix && suffix.charAt(0) !== "/") suffix = "/" + suffix;
    return baseUrl() + suffix;
  }
  var CAPTION_TRANSCRIBE_PATH = "/api/public/v1/stt/transcribe";
  function captionTranscribeUrl() {
    return api(CAPTION_TRANSCRIBE_PATH);
  }
  global.GhostConfig = {
    DEFAULT_BASE,
    storageKey: KEY,
    baseUrl,
    setBaseUrl,
    api,
    CAPTION_TRANSCRIBE_PATH: CAPTION_TRANSCRIBE_PATH,
    captionTranscribeUrl: captionTranscribeUrl
  };
})(typeof window !== "undefined" ? window : this);
