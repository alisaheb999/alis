#!/usr/bin/env node
/**
 * One-off maintenance script: reorganizes the flat `ghost-assets` storage
 * bucket into category folders (flags/<region>/<Name>.png).
 * Safe to re-run: already-foldered objects are skipped.
 */
const CATEGORIES = require('./flag-categories.cjs');

const URL = process.env.SUPABASE_URL;
const KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const BUCKET = 'ghost-assets';

if (!URL || !KEY) {
  console.error('Missing SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const headers = {
  apikey: KEY,
  Authorization: `Bearer ${KEY}`,
  'Content-Type': 'application/json',
};

async function list() {
  const out = [];
  let offset = 0;
  for (;;) {
    const res = await fetch(`${URL}/storage/v1/object/list/${BUCKET}`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ prefix: '', limit: 1000, offset, sortBy: { column: 'name', order: 'asc' } }),
    });
    const rows = await res.json();
    if (!Array.isArray(rows)) throw new Error(JSON.stringify(rows));
    out.push(...rows);
    if (rows.length < 1000) break;
    offset += rows.length;
  }
  return out.filter((r) => r.id).map((r) => r.name);
}

async function move(from, to) {
  const res = await fetch(`${URL}/storage/v1/object/move`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ bucketId: BUCKET, sourceKey: from, destinationKey: to }),
  });
  if (!res.ok) throw new Error(`${from} -> ${to}: ${res.status} ${await res.text()}`);
}

(async () => {
  const names = await list();
  const flat = names.filter((n) => !n.includes('/') && n.toLowerCase().endsWith('.png'));
  console.log(`found ${names.length} objects, ${flat.length} at bucket root`);

  let moved = 0;
  const unknown = [];
  for (const name of flat) {
    const base = name.replace(/\.png$/i, '');
    const region = CATEGORIES[base];
    if (!region) {
      unknown.push(base);
      continue;
    }
    await move(name, `flags/${region}/${name}`);
    moved += 1;
    if (moved % 25 === 0) console.log(`  moved ${moved}...`);
  }
  console.log(`done: moved ${moved}`);
  if (unknown.length) console.log('uncategorized:', unknown.join(', '));
})();
