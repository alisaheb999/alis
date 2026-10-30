#!/usr/bin/env node
/**
 * Build public/downloads/Ghostae-Caption.zip
 *
 * ZIP layout the user sees after extracting:
 *   Install Ghostae Caption (Windows).cmd
 *   Uninstall Ghostae Caption (Windows).cmd
 *   Install Ghostae Caption (Mac).command
 *   Uninstall Ghostae Caption (Mac).command
 *   README - পড়ুন.txt
 *   Ghostae Caption/          <- source folder, auto-deleted by the installer
 *
 *   node scripts/build-caption-bundle.cjs
 */
const fs = require('node:fs')
const path = require('node:path')
const crypto = require('node:crypto')
const { execFileSync } = require('node:child_process')

const ROOT = path.resolve(__dirname, '..')
const SRC = path.join(ROOT, 'extension-src', 'ghostae-caption')
const STAGE = path.join(ROOT, '.tmp-caption')
const OUT = path.join(ROOT, 'public', 'downloads', 'Ghostae-Caption.zip')
const PANEL = 'Ghostae Caption'

const ROOT_FILES = [
  'Install Ghostae Caption (Windows).cmd',
  'Uninstall Ghostae Caption (Windows).cmd',
  'Install Ghostae Caption (Mac).command',
  'Uninstall Ghostae Caption (Mac).command',
  'README-FIRST.txt',
]

function copyTree(from, to) {
  fs.mkdirSync(to, { recursive: true })
  for (const e of fs.readdirSync(from, { withFileTypes: true })) {
    const s = path.join(from, e.name)
    const d = path.join(to, e.name)
    if (e.isDirectory()) copyTree(s, d)
    else if (e.isFile()) fs.copyFileSync(s, d)
  }
}

if (!fs.existsSync(path.join(SRC, PANEL, 'CSXS', 'manifest.xml'))) {
  throw new Error(`Panel source missing: ${path.join(SRC, PANEL)}`)
}

fs.rmSync(STAGE, { recursive: true, force: true })
fs.mkdirSync(STAGE, { recursive: true })

copyTree(path.join(SRC, PANEL), path.join(STAGE, PANEL))
for (const f of ROOT_FILES) {
  const from = path.join(SRC, f)
  if (!fs.existsSync(from)) throw new Error(`Missing installer file: ${f}`)
  fs.copyFileSync(from, path.join(STAGE, f))
}
// CRLF for the Windows scripts, executable bit for the macOS scripts
for (const f of ROOT_FILES) {
  const p = path.join(STAGE, f)
  if (f.endsWith('.cmd')) {
    fs.writeFileSync(p, fs.readFileSync(p, 'utf8').replace(/\r?\n/g, '\r\n'), 'utf8')
  } else if (f.endsWith('.command')) {
    fs.writeFileSync(p, fs.readFileSync(p, 'utf8').replace(/\r\n/g, '\n'), 'utf8')
    fs.chmodSync(p, 0o755)
  }
}

fs.mkdirSync(path.dirname(OUT), { recursive: true })
fs.rmSync(OUT, { force: true })
try {
  execFileSync('zip', ['-r', '-q', OUT, '.'], { cwd: STAGE, stdio: 'inherit' })
} catch {
  execFileSync('nix', ['run', 'nixpkgs#zip', '--', '-r', '-q', OUT, '.'], {
    cwd: STAGE,
    stdio: 'inherit',
  })
}

const digest = crypto.createHash('sha256').update(fs.readFileSync(OUT)).digest('hex')
fs.writeFileSync(`${OUT}.sha256`, `${digest}  public/downloads/Ghostae-Caption.zip\n`, 'utf8')
fs.rmSync(STAGE, { recursive: true, force: true })

console.log(`built ${path.relative(ROOT, OUT)} (${(fs.statSync(OUT).size / 1024 / 1024).toFixed(2)} MB)`)
console.log(`sha256 ${digest}`)
