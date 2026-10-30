#!/usr/bin/env node
/**
 * GHOST release packer.
 *
 *   node scripts/build-release.cjs 3.7.3
 *
 * 1. Stamps every panel script/stylesheet with a fresh build id (kills CEP caching).
 * 2. Rewrites the ?v= query on every asset reference in the panel HTML files.
 * 3. Zips extension-src/ into public/GHOST_Creative_System_v<version>.zip
 *    plus the stable public/ghost-creative-system.zip alias.
 * 4. Writes checksums.sha256 inside the payload and prints the ZIP SHA-256 so
 *    src/components/ghost/Shell.tsx (ZIP_SHA256) can be updated.
 */
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const { execFileSync } = require("child_process");

const version = process.argv[2];
if (!/^\d+\.\d+\.\d+$/.test(version || "")) {
  console.error("Usage: node scripts/build-release.cjs <x.y.z>");
  process.exit(1);
}

const ROOT = path.resolve(__dirname, "..");
const SRC = path.join(ROOT, "extension-src");
const PANEL = path.join(SRC, "GHOST Creative System");
const PUBLIC = path.join(ROOT, "public");

const stamp = `${version}+${new Date()
  .toISOString()
  .replace(/[-:T]/g, "")
  .slice(0, 14)}.${crypto.randomBytes(3).toString("hex")}`;

function walk(dir, out = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full, out);
    else out.push(full);
  }
  return out;
}

const files = walk(PANEL);

/* 1 + 2 — stamp scripts and refresh cache-busting query strings. */
let stamped = 0;
for (const file of files) {
  const ext = path.extname(file);
  if (![".js", ".jsx", ".html", ".css", ".json"].includes(ext)) continue;
  let text = fs.readFileSync(file, "utf8");
  const before = text;

  text = text.replace(
    /(\/\* @ghost-build \*\/\s*")[^"]*(")/g,
    (_m, a, b) => `${a}${stamp}${b}`,
  );
  if (ext === ".html") {
    text = text.replace(/(\?v=)[^"']*/g, `$1${stamp}`);
  }
  if (file.endsWith("manifest.json") || file.endsWith("build.json")) {
    text = text.replace(/"version"\s*:\s*"[^"]*"/g, `"version": "${version}"`);
  }
  if (text !== before) {
    fs.writeFileSync(file, text);
    stamped += 1;
  }
}

/* CSXS manifest + GHOST_BUILD version */
const csxs = path.join(PANEL, "CSXS", "manifest.xml");
if (fs.existsSync(csxs)) {
  let xml = fs.readFileSync(csxs, "utf8");
  xml = xml.replace(/ExtensionBundleVersion="[^"]*"/, `ExtensionBundleVersion="${version}"`);
  xml = xml.replace(/(<Extension Id="[^"]*" Version=")[^"]*(")/g, `$1${version}$2`);
  fs.writeFileSync(csxs, xml);
}
/* The runtime cache detector compares every file's @ghost-build marker against
   BUILD.buildId in js/build-version.js. If that file is not stamped, every
   panel shows a false "Stale CEP cache detected" banner. */
for (const name of ["build-version.js", "ghost-build.js"]) {
  const buildJs = path.join(PANEL, "js", name);
  if (!fs.existsSync(buildJs)) continue;
  let js = fs.readFileSync(buildJs, "utf8");
  js = js
    .replace(/version:\s*"[^"]*"/, `version: "${version}"`)
    .replace(/buildId:\s*"[^"]*"/, `buildId: "${stamp}"`)
    .replace(/builtAt:\s*"[^"]*"/, `builtAt: "${new Date().toISOString()}"`)
    .replace(/channel:\s*"[^"]*"/, `channel: "stable"`);
  fs.writeFileSync(buildJs, js);
}

/* host.jsx carries its own version banner used by verifyHostBuild(); if it is
   not stamped the panel keeps reporting the previous release even after the
   new ZIP is installed. */
const hostJsx = path.join(PANEL, "js", "host.jsx");
if (fs.existsSync(hostJsx)) {
  let host = fs.readFileSync(hostJsx, "utf8");
  host = host
    .replace(/(var EXTENSION_VERSION = ")[^"]*(")/, `$1${version}$2`)
    .replace(/(var HOST_BUILD = ")[^"]*(")/, `$1${stamp}$2`);
  fs.writeFileSync(hostJsx, host);
}

/* 3 — checksum manifest inside the payload */
const manifestLines = [];
for (const file of walk(PANEL)) {
  if (path.basename(file) === "checksums.sha256") continue;
  const hash = crypto.createHash("sha256").update(fs.readFileSync(file)).digest("hex");
  manifestLines.push(`${hash}  ${path.relative(PANEL, file).split(path.sep).join("/")}`);
}
manifestLines.sort();
fs.writeFileSync(path.join(PANEL, "checksums.sha256"), manifestLines.join("\n") + "\n");

/* 4 — zip */
const versioned = path.join(PUBLIC, `GHOST_Creative_System_v${version}.zip`);
const alias = path.join(PUBLIC, "ghost-creative-system.zip");
/* Archive the outgoing release so scripts/build-patch.cjs can diff against it.
   The archive lives outside public/ — it is a build input, not a download. */
const BASELINE = path.join(ROOT, ".release-baseline");
fs.mkdirSync(BASELINE, { recursive: true });
for (const old of fs.readdirSync(PUBLIC)) {
  if (!/^GHOST_Creative_System_v.*\.zip$/.test(old)) continue;
  const from = path.join(PUBLIC, old);
  try { fs.copyFileSync(from, path.join(BASELINE, old)); } catch { /* best effort */ }
  fs.rmSync(from);
}
fs.rmSync(alias, { force: true });
execFileSync("zip", ["-r", "-q", "-X", versioned, "."], { cwd: SRC });
fs.copyFileSync(versioned, alias);

const zipHash = crypto.createHash("sha256").update(fs.readFileSync(versioned)).digest("hex");
const size = (fs.statSync(versioned).size / 1024 / 1024).toFixed(2);

console.log(`version   ${version}`);
console.log(`buildId   ${stamp}`);
console.log(`stamped   ${stamped} files, ${manifestLines.length} hashed`);
console.log(`zip       ${path.relative(ROOT, versioned)} (${size} MB)`);
console.log(`sha256    ${zipHash}`);
