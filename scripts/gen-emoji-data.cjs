/* Generates js/emoji-data.js from the official Unicode emoji-test.txt.
   Skin-tone variants are dropped so the palette stays browsable; every
   fully-qualified base emoji from the RGI set is kept (~2000 glyphs). */
const fs = require("fs");
const path = require("path");

const src = process.argv[2] || "/tmp/emoji-test.txt";
const lines = fs.readFileSync(src, "utf8").split(/\r?\n/);

const GROUP_META = {
  "Smileys & Emotion": { id: "smileys", icon: "😀", label: "Smileys", labelBn: "হাসিমুখ" },
  "People & Body": { id: "people", icon: "🧑", label: "People", labelBn: "মানুষ" },
  "Animals & Nature": { id: "nature", icon: "🌸", label: "Animals & Nature", labelBn: "প্রকৃতি" },
  "Food & Drink": { id: "food", icon: "🍔", label: "Food", labelBn: "খাবার" },
  "Travel & Places": { id: "travel", icon: "✈️", label: "Travel", labelBn: "ভ্রমণ" },
  Activities: { id: "activities", icon: "⚽", label: "Activities", labelBn: "খেলা" },
  Objects: { id: "objects", icon: "💡", label: "Objects", labelBn: "বস্তু" },
  Symbols: { id: "symbols", icon: "✅", label: "Symbols", labelBn: "প্রতীক" },
  Flags: { id: "flags", icon: "🏳️", label: "Flags", labelBn: "পতাকা" },
};

const groups = [];
const byId = new Map();
let current = null;

for (const line of lines) {
  const g = /^# group: (.+)$/.exec(line);
  if (g) {
    const meta = GROUP_META[g[1].trim()];
    current = meta || null;
    if (meta && !byId.has(meta.id)) {
      const entry = { ...meta, items: [], seen: new Set() };
      byId.set(meta.id, entry);
      groups.push(entry);
    }
    continue;
  }
  if (!current || line.startsWith("#") || !line.trim()) continue;
  const m = /^([0-9A-F ]+);\s*fully-qualified\s*#\s*(\S+)\s+E\d+\.\d+\s+(.+)$/.exec(line);
  if (!m) continue;
  const name = m[3].trim();
  if (/skin tone/.test(name)) continue; // tone variants explode the palette
  const glyph = m[2];
  const entry = byId.get(current.id);
  if (entry.seen.has(glyph)) continue;
  entry.seen.add(glyph);
  entry.items.push([glyph, name]);
}

const EXTRA = {
  symbols: [["★", "star"], ["☆", "star outline"], ["✦", "sparkle four"], ["❖", "diamond"], ["➜", "arrow"], ["∞", "infinity"], ["™", "trademark"], ["⌘", "command"]],
  flags: [["৳", "bangladeshi taka"]],
};
for (const [id, extra] of Object.entries(EXTRA)) {
  const entry = byId.get(id);
  if (!entry) continue;
  for (const item of extra) if (!entry.seen.has(item[0])) { entry.seen.add(item[0]); entry.items.push(item); }
}

const total = groups.reduce((n, g) => n + g.items.length, 0);
const payload = groups.map((g) => ({
  id: g.id, icon: g.icon, label: g.label, labelBn: g.labelBn,
  items: g.items.map((i) => i[0]),
  names: g.items.map((i) => i[1]),
}));

const out =
`/*!
 * GHOST TOOLKIT — full emoji dataset (generated).
 * Source: Unicode emoji-test.txt (RGI, fully-qualified, skin tones excluded).
 * Glyphs: ${total} across ${payload.length} groups.
 * Regenerate with: node scripts/gen-emoji-data.cjs
 */
window.GHOST_EMOJI_DATA = ${JSON.stringify(payload)};
window.GHOST_EMOJI_TOTAL = ${total};
`;
const target = path.join(__dirname, "..", "extension-src", "GHOST Creative System", "js", "emoji-data.js");
fs.writeFileSync(target, out);
console.log("emoji groups:", payload.length, "glyphs:", total, "→", target);
