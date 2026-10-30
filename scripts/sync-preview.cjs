#!/usr/bin/env node
/*
 * Copies the real GHOST extension panels (HTML + CSS + assets) into
 * public/panel-preview/ so the website preview renders the exact same UI the
 * user gets in After Effects. CEP-only scripts are swapped for preview-shim.js.
 */
const fs = require("fs");
const path = require("path");

const ROOT = path.resolve(__dirname, "..");
const SRC = path.join(ROOT, "extension-src", "GHOST Creative System");
const OUT = path.join(ROOT, "public", "panel-preview");
const PAGES = ["command.html", "tools.html", "toolkit.html"];

function copyDir(from, to) {
  if (!fs.existsSync(from)) return;
  fs.mkdirSync(to, { recursive: true });
  for (const entry of fs.readdirSync(from, { withFileTypes: true })) {
    const src = path.join(from, entry.name);
    const dst = path.join(to, entry.name);
    if (entry.isDirectory()) copyDir(src, dst);
    else fs.copyFileSync(src, dst);
  }
}

fs.rmSync(OUT, { recursive: true, force: true });
fs.mkdirSync(OUT, { recursive: true });
copyDir(path.join(SRC, "css"), path.join(OUT, "css"));
copyDir(path.join(SRC, "assets"), path.join(OUT, "assets"));
fs.copyFileSync(path.join(__dirname, "preview-shim.js"), path.join(OUT, "preview-shim.js"));
// GHOST TOOLKIT renders its whole UI client-side and degrades gracefully
// without the CEP bridge, so ship its real script into the preview folder.
fs.mkdirSync(path.join(OUT, "js"), { recursive: true });
for (const file of ["toolkit.js", "toolkit-advanced.js", "toolkit-palettes.js", "palette-studio.js", "tools.js", "ghost-project-manager.js"]) {
  const source = path.join(SRC, "js", file);
  if (fs.existsSync(source)) fs.copyFileSync(source, path.join(OUT, "js", file));
}
// Project Manager services degrade to a read-only preview without Node/CEP.
fs.mkdirSync(path.join(OUT, "js", "pm"), { recursive: true });
for (const file of ["scannerService.js", "reportService.js", "backupService.js", "restoreService.js"]) {
  fs.copyFileSync(path.join(SRC, "js", "pm", file), path.join(OUT, "js", "pm", file));
}


const PREVIEW_CSS = `
/* Website preview only — keeps the panel usable inside an iframe. */
html, body { height: 100%; overflow: hidden; }
body.ghost-preview-mode ::-webkit-scrollbar { width: 10px; height: 10px; }
body.ghost-preview-mode .dev-reload-button,
body.ghost-preview-mode .local-update-button { display: none; }
`;

for (const page of PAGES) {
  let html = fs.readFileSync(path.join(SRC, page), "utf8");
  // toolkit.js runs fine without CEP (falls back to preview mode), keep it.
  const keep = page === "toolkit.html"
    ? ["js/toolkit.js", "js/toolkit-advanced.js"]
    : page === "tools.html"
      ? [
          "js/tools.js", "js/toolkit-palettes.js", "js/palette-studio.js",
          "js/pm/scannerService.js", "js/pm/reportService.js", "js/pm/backupService.js",
          "js/pm/restoreService.js", "js/ghost-project-manager.js",
        ]
      : [];

  html = html.replace(/[ \t]*<script src="(js\/[^"]+)"><\/script>\r?\n?/g, (m, src) =>
    // Source pages carry cache-busting ?v=... suffixes; compare on the bare path.
    keep.includes(src.split("?")[0]) ? m : ""
  );
  html = html.replace("</head>", `    <style>${PREVIEW_CSS}</style>\n</head>`);
  html = html.replace("</body>", '    <script src="preview-shim.js"></script>\n</body>');
  fs.writeFileSync(path.join(OUT, page), html);
}

console.log("panel preview synced →", path.relative(ROOT, OUT));
