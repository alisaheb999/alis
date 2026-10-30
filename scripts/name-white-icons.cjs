#!/usr/bin/env node
/**
 * One-off maintenance script: uses vision AI to give the raw `white-man-icon`
 * uploads human names + categories, moves them into
 * white-icons/<category>/<Name>.png and writes a JSON map for registration.
 */
const fs = require('fs');
const path = require('path');

const URL_BASE = process.env.SUPABASE_URL;
const KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const AI = process.env.LOVABLE_API_KEY;
const BUCKET = 'ghost-assets';
const SRC_PREFIX = 'white-man-icon';
const OUT = path.join(__dirname, 'white-icon-names.json');

const CATEGORIES = [
  'people', 'business', 'communication', 'media', 'technology', 'nature',
  'food', 'travel', 'sports', 'education', 'health', 'finance', 'objects',
  'interface', 'symbols',
];

const headers = {
  apikey: KEY,
  Authorization: `Bearer ${KEY}`,
  'Content-Type': 'application/json',
};

async function list(prefix) {
  const out = [];
  let offset = 0;
  for (;;) {
    const res = await fetch(`${URL_BASE}/storage/v1/object/list/${BUCKET}`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ prefix, limit: 1000, offset, sortBy: { column: 'name', order: 'asc' } }),
    });
    const rows = await res.json();
    if (!Array.isArray(rows)) throw new Error(JSON.stringify(rows));
    out.push(...rows);
    if (rows.length < 1000) break;
    offset += rows.length;
  }
  return out.filter((r) => r.id);
}

async function signed(names) {
  const res = await fetch(`${URL_BASE}/storage/v1/object/sign/${BUCKET}`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ expiresIn: 3600, paths: names }),
  });
  const rows = await res.json();
  if (!Array.isArray(rows)) throw new Error(JSON.stringify(rows));
  return rows;
}

async function describe(batch) {
  const content = [
    {
      type: 'text',
      text:
        'You are naming icon/sticker assets for a motion-design asset library. ' +
        `For each image (in order, ids: ${batch.map((b) => b.id).join(', ')}), return a short human title ` +
        '(2-4 words, Title Case, describing what is visually shown, e.g. "Business Man Pointing", "Group Of Friends"), ' +
        `one category from: ${CATEGORIES.join(', ')}, and 3-5 lowercase search tags. ` +
        'Return ONLY JSON: {"items":[{"id":"<id>","title":"...","category":"...","tags":["..."]}]}',
    },
    ...batch.map((b) => ({ type: 'image_url', image_url: { url: b.url } })),
  ];
  const res = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
    method: 'POST',
    headers: { Authorization: `Bearer ${AI}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: 'google/gemini-3-flash-preview',
      messages: [{ role: 'user', content }],
      response_format: { type: 'json_object' },
    }),
  });
  if (!res.ok) throw new Error(`${res.status} ${await res.text()}`);
  const json = await res.json();
  const text = json.choices?.[0]?.message?.content ?? '{}';
  return JSON.parse(text.replace(/^```json/i, '').replace(/```$/, '')).items ?? [];
}

const slugify = (s) =>
  s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

(async () => {
  const rows = await list(SRC_PREFIX);
  const files = rows
    .map((r) => r.name)
    .filter((n) => /\.(png|gif|jpe?g|webp|svg)$/i.test(n));
  console.log(`icons found: ${files.length}`);

  const existing = fs.existsSync(OUT) ? JSON.parse(fs.readFileSync(OUT, 'utf8')) : {};
  const todo = files.filter((f) => !existing[f]);
  console.log(`to name: ${todo.length}`);

  const SIZE = 6;
  for (let i = 0; i < todo.length; i += SIZE) {
    const chunk = todo.slice(i, i + SIZE);
    const urls = await signed(chunk.map((n) => `${SRC_PREFIX}/${n}`));
    const batch = chunk.map((n, k) => ({
      id: `img${k + 1}`,
      file: n,
      url: `${URL_BASE}/storage/v1${urls[k].signedURL}`,
    }));
    let items = [];
    for (let attempt = 0; attempt < 3; attempt += 1) {
      try {
        items = await describe(batch);
        break;
      } catch (err) {
        console.warn(`  retry ${attempt + 1}: ${err.message.slice(0, 120)}`);
        await new Promise((r) => setTimeout(r, 2500 * (attempt + 1)));
      }
    }
    items.forEach((it) => {
      const src = batch.find((b) => b.id === it.id);
      if (!src || !it.title) return;
      existing[src.file] = {
        title: it.title,
        category: CATEGORIES.includes((it.category || '').toLowerCase())
          ? it.category.toLowerCase()
          : 'objects',
        tags: Array.isArray(it.tags) ? it.tags.map((t) => String(t).toLowerCase()) : [],
      };
    });
    fs.writeFileSync(OUT, JSON.stringify(existing, null, 2));
    console.log(`named ${Object.keys(existing).length}/${files.length}`);
  }

  // De-duplicate titles so filenames stay unique.
  const used = new Set();
  const plan = [];
  for (const file of files) {
    const info = existing[file];
    if (!info) continue;
    const ext = path.extname(file).toLowerCase();
    let base = slugify(info.title) || 'white-icon';
    let name = base;
    let n = 2;
    while (used.has(`${info.category}/${name}`)) name = `${base}-${n++}`;
    used.add(`${info.category}/${name}`);
    plan.push({
      from: `${SRC_PREFIX}/${file}`,
      to: `white-icons/${info.category}/${name}${ext}`,
      title: info.title,
      category: info.category,
      tags: info.tags,
    });
  }
  fs.writeFileSync(path.join(__dirname, 'white-icon-plan.json'), JSON.stringify(plan, null, 2));
  console.log(`plan written: ${plan.length}`);
})();
