#!/usr/bin/env node
/**
 * Build the single public download: Ghostae-Ecosystem.zip
 *
 * Stages every launch panel + the shared Windows/macOS installer into one
 * package. No panel code is modified — this is a file-moving step only.
 *
 *   node scripts/build-ecosystem.cjs
 */
const fs = require('node:fs')
const path = require('node:path')
const crypto = require('node:crypto')
const { execFileSync } = require('node:child_process')

const ROOT = path.resolve(__dirname, '..')
const STAGE = path.join(ROOT, '.tmp-ecosystem')
const OUT_DIR = path.join(ROOT, 'public', 'downloads')
const TARGETS = [
  { os: 'windows', out: 'Ghostae-Ecosystem-Windows.zip', files: ['Install-Ghostae-Ecosystem.cmd', 'Uninstall-Ghostae-Ecosystem.cmd', 'README.txt'] },
  { os: 'macos', out: 'Ghostae-Ecosystem-macOS.zip', files: ['Install-Ghostae-Ecosystem.command', 'README.txt'] },
]

/** Panel id -> source folder (must contain CSXS/manifest.xml). */
const PANELS = {
  // Launch scope (Aug 2026): ONE panel only — Ghostae Text (animations, style,
  // captions, expressions). The other panels stay in extension-src/ as backup
  // and are re-added here when the next phase launches.
  'com.ghost.text': 'extension-src/ghostae-text/com.ghost.text',
}

const SKIP = new Set([
  'node_modules',
  '_attic',
  'tools',
  'install.bat',
  'install.ps1',
  'uninstall.bat',
  'ghost-install.cmd',
  'INSTALL.md',
  'CMD_INSTALL.md',
  'INSTALL_GHOSTAE_PRESETS.cmd',
  'UNINSTALL_GHOSTAE_PRESETS.cmd',
])

const CAPTION_WORKER_ZIP = path.join(OUT_DIR, 'Ghost-Caption-Worker.zip')
const VPS_AGENT_ZIP = path.join(OUT_DIR, 'Ghostae-VPS-Agent.zip')

function copyTree(from, to) {
  fs.mkdirSync(to, { recursive: true })
  for (const entry of fs.readdirSync(from, { withFileTypes: true })) {
    if (SKIP.has(entry.name)) continue
    const src = path.join(from, entry.name)
    const dst = path.join(to, entry.name)
    if (entry.isDirectory()) copyTree(src, dst)
    else if (entry.isFile()) fs.copyFileSync(src, dst)
  }
}

fs.rmSync(STAGE, { recursive: true, force: true })
fs.mkdirSync(path.join(STAGE, 'panels'), { recursive: true })

const included = []
for (const [id, rel] of Object.entries(PANELS)) {
  const src = path.join(ROOT, rel)
  if (!fs.existsSync(path.join(src, 'CSXS', 'manifest.xml'))) {
    console.log(`skip  ${id} (no source at ${rel})`)
    continue
  }
  copyTree(src, path.join(STAGE, 'panels', id))
  included.push(id)
  console.log(`stage ${id}`)
}

if (fs.existsSync(CAPTION_WORKER_ZIP)) {
  fs.mkdirSync(path.join(STAGE, 'tools'), { recursive: true })
  fs.copyFileSync(CAPTION_WORKER_ZIP, path.join(STAGE, 'tools', 'Ghost-Caption-Worker.zip'))
  console.log('stage Ghost-Caption-Worker.zip')
}

if (fs.existsSync(VPS_AGENT_ZIP)) {
  fs.mkdirSync(path.join(STAGE, 'tools'), { recursive: true })
  fs.copyFileSync(VPS_AGENT_ZIP, path.join(STAGE, 'tools', 'Ghostae-VPS-Agent.zip'))
  console.log('stage Ghostae-VPS-Agent.zip')
}

if (included.length === 0) throw new Error('No panel sources found.')

fs.mkdirSync(OUT_DIR, { recursive: true })

function zip(out) {
  try {
    execFileSync('zip', ['-r', '-q', out, '.'], { cwd: STAGE, stdio: 'inherit' })
  } catch {
    execFileSync('nix', ['run', 'nixpkgs#zip', '--', '-r', '-q', out, '.'], {
      cwd: STAGE,
      stdio: 'inherit',
    })
  }
}

function writeSha256(file) {
  const digest = crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex')
  const rel = path.relative(ROOT, file).replace(/\\/g, '/')
  fs.writeFileSync(file + '.sha256', `${digest}  ${rel}\n`, 'utf8')
}

for (const target of TARGETS) {
  for (const f of target.files) {
    fs.copyFileSync(path.join(ROOT, 'installer-ecosystem', f), path.join(STAGE, f))
  }
  const mac = path.join(STAGE, 'Install-Ghostae-Ecosystem.command')
  if (fs.existsSync(mac)) fs.chmodSync(mac, 0o755)
  const out = path.join(OUT_DIR, target.out)
  fs.rmSync(out, { force: true })
  zip(out)
  writeSha256(out)
  for (const f of target.files) fs.rmSync(path.join(STAGE, f), { force: true })
  const mb = (fs.statSync(out).size / 1024 / 1024).toFixed(2)
  console.log(`built ${target.out}  (${mb} MB)`)
}

fs.rmSync(STAGE, { recursive: true, force: true })
console.log(`panels: ${included.join(', ')}`)
