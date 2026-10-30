#!/usr/bin/env node
/**
 * Applies scripts/white-icon-plan.json: moves the raw `white-man-icon` uploads
 * into white-icons/<category>/<clean-name>.<ext> and registers every icon in
 * public.assets so it is searchable from the panel + website preview.
 * Safe to re-run: already-moved objects are skipped.
 */
const plan = require('./white-icon-plan.json');

const URL_BASE = process.env.SUPABASE_URL;
const KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const BUCKET = 'ghost-assets';

const headers = {
  apikey: KEY,
  Authorization: `Bearer ${KEY}`,
  'Content-Type': 'application/json',
};

async function exists(key) {
  const res = await fetch(`${URL_BASE}/storage/v1/object/info/${BUCKET}/${encodeURI(key)}`, { headers });
  return res.ok;
}

async function move(from, to) {
  const res = await fetch(`${URL_BASE}/storage/v1/object/move`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ bucketId: BUCKET, sourceKey: from, destinationKey: to }),
  });
  if (!res.ok) throw new Error(`${from} -> ${to}: ${res.status} ${await res.text()}`);
}

async function upsert(rows) {
  const res = await fetch(`${URL_BASE}/rest/v1/assets?on_conflict=slug`, {
    method: 'POST',
    headers: { ...headers, Prefer: 'resolution=merge-duplicates' },
    body: JSON.stringify(rows),
  });
  if (!res.ok) throw new Error(`${res.status} ${await res.text()}`);
}

(async () => {
  let moved = 0;
  const rows = [];
  for (const item of plan) {
    if (await exists(item.from)) {
      await move(item.from, item.to);
      moved += 1;
      if (moved % 25 === 0) console.log(`  moved ${moved}...`);
    }
    const fileName = item.to.split('/').pop();
    const ext = fileName.split('.').pop().toLowerCase();
    rows.push({
      title: item.title,
      slug: `white-icon-${item.to.split('/').pop().replace(/\.[^.]+$/, '')}-${item.category}`,
      type: 'icon',
      file_path: item.to,
      bucket: BUCKET,
      access_level: 'licensed',
      published: true,
      meta_data: {
        mime: ext === 'gif' ? 'image/gif' : 'image/png',
        pack: 'white-icons',
        category: item.category,
        folder: item.to.split('/').slice(0, -1).join('/'),
        file_name: fileName,
        tags: Array.from(new Set(['icon', 'white', item.category, ...(item.tags || [])])),
      },
    });
  }
  console.log(`moved ${moved}, registering ${rows.length}`);
  for (let i = 0; i < rows.length; i += 50) await upsert(rows.slice(i, i + 50));
  console.log('done');
})();
