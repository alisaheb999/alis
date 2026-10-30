#!/usr/bin/env node
/**
 * Imports the extracted icon/emoji packs into the `ghost-assets` storage bucket
 * and registers every file in `public.assets` so the panel + web preview can
 * search and download them. Safe to re-run (upsert + upsert-on-conflict).
 *
 * Usage: node scripts/import-icon-packs.cjs <extracted-root>
 */
const fs = require('fs');
const path = require('path');

const ROOT = process.argv[2];
const URL_BASE = process.env.SUPABASE_URL;
const KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const BUCKET = 'ghost-assets';

if (!ROOT || !URL_BASE || !KEY) {
  console.error('Usage: SUPABASE_URL=… SUPABASE_SERVICE_ROLE_KEY=… node scripts/import-icon-packs.cjs <root>');
  process.exit(1);
}

/** pack folder name -> { prefix, type, pack, flat } */
const PACKS = {
  Black: { prefix: 'icons/black', type: 'icon', pack: 'black-icons', flat: false },
  White: { prefix: 'icons/white', type: 'icon', pack: 'white-line-icons', flat: false },
  'Business Man Faceless icon': { prefix: 'icons/business-man', type: 'icon', pack: 'business-man', flat: true },
  'glass icon': { prefix: 'icons/glass', type: 'icon', pack: 'glass-icons', flat: true },
  'apple icon emoji png': { prefix: 'emoji/apple', type: 'emoji', pack: 'apple-emoji', flat: true },
};

const MIME = { png: 'image/png', jpg: 'image/jpeg', jpeg: 'image/jpeg', webp: 'image/webp', gif: 'image/gif' };

const slugify = (s) =>
  s.toLowerCase().replace(/\.[^.]+$/, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

const titleize = (file) =>
  file
    .replace(/\.[^.]+$/, '')
    .replace(/^\d+\.\s*/, '')
    .replace(/[_-]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/\b\w/g, (c) => c.toUpperCase());

function walk(dir) {
  const out = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) out.push(...walk(full));
    else if (/\.(png|jpe?g|webp|gif)$/i.test(entry.name)) out.push(full);
  }
  return out;
}

const headers = { apikey: KEY, Authorization: `Bearer ${KEY}` };

async function upload(key, file, mime) {
  const body = fs.readFileSync(file);
  const res = await fetch(`${URL_BASE}/storage/v1/object/${BUCKET}/${encodeURI(key)}`, {
    method: 'POST',
    headers: { ...headers, 'Content-Type': mime, 'x-upsert': 'true' },
    body,
  });
  if (!res.ok) throw new Error(`upload ${key}: ${res.status} ${await res.text()}`);
  return body.length;
}

async function upsertAssets(rows) {
  const res = await fetch(`${URL_BASE}/rest/v1/assets?on_conflict=slug`, {
    method: 'POST',
    headers: { ...headers, 'Content-Type': 'application/json', Prefer: 'resolution=merge-duplicates' },
    body: JSON.stringify(rows),
  });
  if (!res.ok) throw new Error(`assets upsert: ${res.status} ${await res.text()}`);
}

async function pool(items, limit, fn) {
  let i = 0;
  let done = 0;
  await Promise.all(
    Array.from({ length: limit }, async () => {
      while (i < items.length) {
        const item = items[i++];
        await fn(item);
        done += 1;
        if (done % 100 === 0) console.log(`  ${done}/${items.length}`);
      }
    }),
  );
}

(async () => {
  const rows = [];

  for (const [folder, cfg] of Object.entries(PACKS)) {
    // Archives extract as <folder>/<folder>/... — find the deepest single wrapper.
    let base = path.join(ROOT, folder);
    if (!fs.existsSync(base)) {
      console.warn(`skip missing pack: ${folder}`);
      continue;
    }
    const inner = path.join(base, folder);
    if (fs.existsSync(inner)) base = inner;

    const files = walk(base);
    console.log(`${folder}: ${files.length} files`);

    const jobs = files.map((file) => {
      const rel = path.relative(base, file).split(path.sep);
      const fileName = rel[rel.length - 1];
      const category = cfg.flat ? cfg.pack : slugify(rel[0] || 'misc');
      const ext = fileName.split('.').pop().toLowerCase();
      const key = `${cfg.prefix}/${cfg.flat ? '' : slugify(rel[0]) + '/'}${fileName}`.replace('//', '/');
      const title = titleize(fileName);
      return { file, key, ext, fileName, category, title, cfg };
    });

    await pool(jobs, 8, async (j) => {
      const size = await upload(j.key, j.file, MIME[j.ext] ?? 'application/octet-stream');
      rows.push({
        title: j.title,
        slug: `${j.cfg.pack}-${slugify(j.category)}-${slugify(j.fileName)}`,
        type: j.cfg.type,
        file_path: j.key,
        bucket: BUCKET,
        access_level: 'licensed',
        published: true,
        size_bytes: size,
        meta_data: {
          mime: MIME[j.ext] ?? 'application/octet-stream',
          pack: j.cfg.pack,
          category: j.category,
          folder: j.key.split('/').slice(0, -1).join('/'),
          file_name: j.fileName,
          tags: Array.from(
            new Set([j.cfg.type, j.cfg.pack, j.category, ...j.title.toLowerCase().split(' ')].filter(Boolean)),
          ),
        },
      });
    });
  }

  console.log(`registering ${rows.length} assets`);
  for (let i = 0; i < rows.length; i += 100) await upsertAssets(rows.slice(i, i + 100));
  console.log('done');
})();
