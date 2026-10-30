(function(global) {
  "use strict";
  var build = {
    version: "3.41.0",
    edition: "Premium",
    buildDate: "2026-09-01",
    buildId: "3.41.0+20260901.strict-gradient-unlock",
    codename: "Neon Fresh",
    isStable: true
  };
  // Canonical name is GHOST_BUILD; GhostBuild is kept as a compatibility alias.
  global.GHOST_BUILD = build;
  global.GhostBuild = build;
})(typeof window !== "undefined" ? window : this);
