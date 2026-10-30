import fs from 'node:fs'
import path from 'node:path'
import { transformSync } from 'esbuild'

const panel = process.argv[2]
if (!panel) throw new Error('Panel directory is required')

function walk(dir, files = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name)
    if (entry.isDirectory()) walk(full, files)
    else files.push(full)
  }
  return files
}

// AE 2019/2020 use Chromium 74. Async functions are native there; syntax
// introduced after Chrome 74 (optional chaining, nullish coalescing, etc.) is
// lowered while preserving browser APIs and global panel functions.
const target = ['chrome74']
for (const file of walk(panel)) {
  if (!file.endsWith('.js')) continue
  const rel = path.relative(panel, file).replaceAll('\\', '/')
  // Node-only MCP/local bridge processes never execute inside CEP. They use
  // top-level await and must retain their server module format.
  if (rel.startsWith('mcp/') || rel.startsWith('server/')) continue
  const source = fs.readFileSync(file, 'utf8')
  if (!source.trim() || source.includes('disabled in the lite')) continue
  const result = transformSync(source, {
    loader: 'js',
    target,
    charset: 'utf8',
    legalComments: 'none',
  })
  fs.writeFileSync(file, result.code)
}

const inlinePattern = /<script(?![^>]*\bsrc\s*=)([^>]*)>([\s\S]*?)<\/script>/gi
for (const file of walk(panel)) {
  if (!file.endsWith('.html')) continue
  const html = fs.readFileSync(file, 'utf8')
  const compiled = html.replace(inlinePattern, (whole, attrs, source) => {
    if (!source.trim() || /type\s*=\s*["']application\/ld\+json/i.test(attrs)) return whole
    const result = transformSync(source, {
      loader: 'js',
      target,
      charset: 'utf8',
      legalComments: 'none',
    })
    return `<script${attrs}>\n${result.code}</script>`
  })
  fs.writeFileSync(file, compiled)
}