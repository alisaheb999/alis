#!/usr/bin/env node
/**
 * GHOST patch packer.
 *
 *   node scripts/build-patch.cjs <fromVersion> <toVersion>
 *
 * Compares the previously released ZIP (public/GHOST_Creative_System_v<from>.zip)
 * against the current extension-src tree and emits a *delta* package:
 *
 *   public/patches/GHOST_patch_<from>_to_<to>.ghostupdate
 *     ghost-update.json          (schema ghost.patch.v1, per-file sha256)
 *     payload/<relative path>    (only the changed / new files)
 *
 * installer/stage-local-update.ps1 consumes this: it verifies every payload
 * hash, waits for After Effects to close, backs the install up and replaces
 * only the listed files — so the user never re-downloads the whole extension,
 * and their assets, presets and licence stay untouched.
 *
 * Run scripts/build-release.cjs <to> FIRST (it stamps the version + manifest).
 */
const fs = require("fs");
const path = require("path");
const os = require("os");
const crypto = require("crypto");
const { execFileSync } = require("child_process");

const args = process.argv.slice(2).filter((a) => !a.startsWith("--"));
const flag = (name) => {
  const hit = process.argv.find((a) => a.startsWith(`--${name}=`));
  return hit ? hit.slice(name.length + 3) : null;
};
const from = args[0];
const to = args[1];
if (!/^\d+\.\d+\.\d+$/.test(from || "") || !/^\d+\.\d+\.\d+$/.test(to || "")) {
  console.error("Usage: node scripts/build-patch.cjs <fromVersion> <toVersion>");
  process.exit(1);
}

const ROOT = path.resolve(__dirname, "..");
const PANEL = flag("panel") || path.join(ROOT, "extension-src", "GHOST Creative System");
const PUBLIC = path.join(ROOT, "public");
const PATCH_DIR = flag("out") || path.join(PUBLIC, "patches");
const BASE_ZIP =
  flag("baseline") ||
  [
    path.join(ROOT, ".release-baseline", `GHOST_Creative_System_v${from}.zip`),
    path.join(PUBLIC, `GHOST_Creative_System_v${from}.zip`),
  ].find((candidate) => fs.existsSync(candidate)) ||
  path.join(ROOT, ".release-baseline", `GHOST_Creative_System_v${from}.zip`);

const SKIP = new Set(["checksums.sha256", ".DS_Store"]);

function walk(dir, root = dir, out = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.name === ".DS_Store") continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full, root, out);
    else out.push(path.relative(root, full).split(path.sep).join("/"));
  }
  return out;
}

function sha256(file) {
  return crypto.createHash("sha256").update(fs.readFileSync(file)).digest("hex");
}

if (!fs.existsSync(BASE_ZIP)) {
  console.error(`Baseline ZIP not found: ${path.relative(ROOT, BASE_ZIP)}`);
  console.error("Keep the previous release ZIP in public/ to build a delta patch.");
  process.exit(1);
}

const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "ghost-patch-"));
const baseRoot = path.join(tmp, "base");
fs.mkdirSync(baseRoot, { recursive: true });
execFileSync("unzip", ["-q", BASE_ZIP, "-d", baseRoot]);

const baseCandidates = [
  path.join(baseRoot, "GHOST Creative System"),
  baseRoot,
];
const basePanel = baseCandidates.find((dir) =>
  fs.existsSync(path.join(dir, "CSXS", "manifest.xml")),
);
if (!basePanel) {
  console.error("Could not locate the panel folder inside the baseline ZIP.");
  process.exit(1);
}

const oldFiles = new Map();
for (const rel of walk(basePanel)) {
  if (SKIP.has(path.basename(rel))) continue;
  oldFiles.set(rel, sha256(path.join(basePanel, rel)));
}
const newFiles = new Map();
for (const rel of walk(PANEL)) {
  if (SKIP.has(path.basename(rel))) continue;
  newFiles.set(rel, sha256(path.join(PANEL, rel)));
}

const csxs = fs.readFileSync(path.join(PANEL, "CSXS", "manifest.xml"), "utf8");
const stampedVersion = /ExtensionBundleVersion="([^"]*)"/.exec(csxs)?.[1];
if (stampedVersion !== to) {
  console.error(
    `extension-src is stamped ${stampedVersion}, not ${to}. Run scripts/build-release.cjs ${to} first.`,
  );
  process.exit(1);
}

const operations = [];
for (const [rel, hash] of newFiles) {
  const old = oldFiles.get(rel);
  if (old === hash) continue;
  operations.push({ action: old ? "replace" : "add", path: rel, source: `payload/${rel}`, sha256: hash });
}
for (const rel of oldFiles.keys()) {
  if (!newFiles.has(rel)) operations.push({ action: "delete", path: rel });
}
operations.sort((a, b) => a.path.localeCompare(b.path));

if (!operations.length) {
  console.error(`No differences between ${from} and the current tree — nothing to patch.`);
  process.exit(1);
}

/* ---- assemble the package ---- */
const stage = path.join(tmp, "package");
fs.mkdirSync(stage, { recursive: true });
for (const op of operations) {
  if (op.action === "delete") continue;
  const dest = path.join(stage, "payload", op.path);
  fs.mkdirSync(path.dirname(dest), { recursive: true });
  fs.copyFileSync(path.join(PANEL, op.path), dest);
}

const patchId = `ghost-${from}-to-${to}-${crypto.randomBytes(3).toString("hex")}`;
const manifest = {
  schema: "ghost.patch.v1",
  product: "com.ghost.creativesystem",
  patchId,
  fromVersion: from,
  toVersion: to,
  compatibleVersions: [from],
  createdAt: new Date().toISOString(),
  operations,
};
fs.writeFileSync(path.join(stage, "ghost-update.json"), JSON.stringify(manifest, null, 2));

fs.mkdirSync(PATCH_DIR, { recursive: true });
const outFile = path.join(PATCH_DIR, `GHOST_patch_${from}_to_${to}.ghostupdate`);
fs.rmSync(outFile, { force: true });
execFileSync("zip", ["-r", "-q", "-X", outFile, "."], { cwd: stage });

const hash = sha256(outFile);
const bytes = fs.statSync(outFile).size;
fs.writeFileSync(
  path.join(PATCH_DIR, `GHOST_patch_${from}_to_${to}.json`),
  JSON.stringify(
    {
      patchId,
      version: to,
      fromVersion: from,
      url: `/patches/${path.basename(outFile)}`,
      sha256: hash,
      sizeBytes: bytes,
      mandatory: true,
      requiresRestart: true,
      publishedAt: new Date().toISOString(),
    },
    null,
    2,
  ) + "\n",
);

fs.rmSync(tmp, { recursive: true, force: true });

const changed = operations.filter((o) => o.action !== "delete").length;
const deleted = operations.length - changed;
console.log(`patchId   ${patchId}`);
console.log(`from → to ${from} → ${to}`);
console.log(`files     ${changed} changed/added, ${deleted} deleted`);
console.log(`package   ${path.relative(ROOT, outFile)} (${(bytes / 1024).toFixed(1)} KB)`);
console.log(`sha256    ${hash}`);
console.log(`feed json ${path.relative(ROOT, path.join(PATCH_DIR, path.basename(outFile).replace(".ghostupdate", ".json")))}`);
