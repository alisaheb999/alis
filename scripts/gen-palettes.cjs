#!/usr/bin/env node
/**
 * GHOST TOOLKIT — Colour Palette generator.
 * Produces 1000 palettes (2..6 colours) into js/toolkit-palettes.js.
 * Seeds: curated named sets + deterministic algorithmic families.
 */
const fs = require("fs");
const path = require("path");

const OUT = path.join(
  __dirname,
  "..",
  "extension-src",
  "GHOST Creative System",
  "js",
  "toolkit-palettes.js"
);

function hslToHex(h, s, l) {
  l /= 100;
  const a = (s * Math.min(l, 1 - l)) / 100;
  const f = (n) => {
    const k = (n + h / 30) % 12;
    const c = l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
    return Math.round(255 * c).toString(16).padStart(2, "0");
  };
  return `#${f(0)}${f(8)}${f(4)}`.toUpperCase();
}

const CURATED = [
  ["Cyan Horizon", ["#00F2FE", "#4FACFE"]],
  ["Ocean Tide", ["#00C6FF", "#0072FF"]],
  ["Sunset Flame", ["#FF512F", "#DD2476"]],
  ["Neon Cyber", ["#F80759", "#BC4E9C"]],
  ["Emerald Forest", ["#0BA360", "#3CBA92"]],
  ["Royal Amethyst", ["#654EA3", "#EAAFC8"]],
  ["Luxury Gold", ["#BF953F", "#FCF6BA"]],
  ["Dark Carbon", ["#232526", "#414345"]],
  ["Pastel Dream", ["#FF9A9E", "#FECFEF"]],
  ["Volcanic Magma", ["#FF4E50", "#F9D423"]],
  ["Cosmic Glow", ["#DA22FF", "#9733EE"]],
  ["Mint Fresh", ["#11998E", "#38EF7D"]],
  ["Solar Orange", ["#F12711", "#F5AF19"]],
  ["Electric Laser", ["#4A00E0", "#8E2DE2"]],
  ["Deep Atlantic", ["#141E30", "#243B55"]],
  ["Crimson Blaze", ["#F85032", "#E73827"]],
  ["Arctic Frost", ["#00D2FF", "#3A7BD5"]],
  ["Lavender Dust", ["#EECDA3", "#EF629F"]],
  ["Titanium Metal", ["#283048", "#859398"]],
  ["Peach Sunset", ["#FFB347", "#FFCC33"]],
  ["Deep Cyan", ["#015C92", "#2D82B5", "#53A7D8"]],
  ["Cyberpunk Dusk", ["#FF007F", "#7928CA", "#00DFD8"]],
  ["Tropical Sunset", ["#F12711", "#F5AF19", "#00F2FE"]],
  ["Fire & Ice", ["#FF4E50", "#F9D423", "#FF0844"]],
  ["Purple Haze", ["#3A1C71", "#D76D77", "#FFAF7B"]],
  ["Teal Breeze", ["#11998E", "#38EF7D", "#0575E6"]],
  ["Golden Amber", ["#805215", "#E8B87D", "#3F2503"]],
  ["Soft Coral", ["#FFECD2", "#FCB69F", "#FF9A9E"]],
  ["Midnight Steel", ["#0F0C29", "#24243E", "#302B63"]],
  ["Arctic Ice", ["#00D2FF", "#3A7BD5", "#00C6FF"]],
  ["Sunkissed Oasis", ["#FF7E5F", "#FEB47B", "#FFE066"]],
  ["Neon Emerald", ["#00F2FE", "#00C9A7", "#845EC2"]],
  ["Royal Magenta", ["#2C003E", "#512D6D", "#F8485E"]],
  ["Dark Shadow", ["#141E30", "#243B55", "#3A6073"]],
  ["Prism Chrome", ["#FFFFFF", "#D7E1EC", "#8FA5BD", "#39435A"]],
  ["Retro Outrun", ["#FCF14C", "#FF2E7E", "#7B2FF7", "#22D3EE"]],
  ["Candy Pop", ["#FF6FD8", "#3813C2", "#21D4FD", "#B721FF"]],
  ["Molten Bronze", ["#FFE29F", "#FFA99F", "#FF719A", "#7A3E00"]],
  ["Jungle Neon", ["#00FFA3", "#03E1FF", "#DC1FFF", "#0A5C36"]],
  ["Cinematic Teal Orange", ["#0B3C49", "#1E6F79", "#F4A259", "#F25C05"]],
  ["Vaporwave Grid", ["#22D3EE", "#F43F5E", "#A855F7", "#FDE68A"]],
  ["Aurora Borealis", ["#00C9FF", "#92FE9D", "#7F5AF0", "#0F172A"]],
  ["Galaxy Nebula", ["#C084FC", "#2563EB", "#0F172A", "#F472B6"]],
  ["Blood Moon", ["#450A0A", "#B91C1C", "#F87171", "#FDE68A"]],
  ["Sahara Dune", ["#F7E7CE", "#E2B857", "#B07D2B", "#5C3A0F"]],
  ["Frozen Lagoon", ["#E0FBFC", "#98C1D9", "#3D5A80", "#293241"]],
  ["Rose Gold Lux", ["#F9D8D6", "#E8B4B8", "#C98A96", "#8A5A66"]],
  ["Toxic Slime", ["#D9F99D", "#84CC16", "#3F6212", "#111827"]],
  ["Cotton Sky", ["#FDE2E4", "#E2ECE9", "#BEE1E6", "#CDDAFD"]],
  ["Steel Chrome", ["#F8FAFC", "#CBD5E1", "#64748B", "#1E293B"]],
  ["Sunrise Bloom", ["#FFF1AD", "#FFB4A2", "#E5989B", "#6D6875"]],
  ["Cyber Lime", ["#CCFF00", "#00FFC6", "#0A0A0A", "#1B4332"]],
  ["Ultraviolet", ["#2E1065", "#6D28D9", "#C4B5FD", "#F5F3FF"]],
  ["Deep Ember", ["#1A0B0B", "#7C2D12", "#EA580C", "#FDBA74"]],
  ["Mono Ink", ["#000000", "#3F3F46", "#A1A1AA", "#FAFAFA"]],
  ["Bengali Festival", ["#E11D48", "#F59E0B", "#065F46", "#FEF3C7"]],
  ["Monsoon Blue", ["#0C4A6E", "#0EA5E9", "#7DD3FC", "#F0F9FF"]],
  ["Rickshaw Art", ["#DC2626", "#FACC15", "#16A34A", "#1D4ED8", "#FFFFFF"]],
  ["Spice Market", ["#7C2D12", "#C2410C", "#F59E0B", "#FDE68A", "#166534"]],
  ["Neon Tokyo", ["#FF2A6D", "#05D9E8", "#D1F7FF", "#005678", "#01012B"]],
  ["Miami Night", ["#FF6B6B", "#F8E71C", "#4ECDC4", "#1A535C", "#FF9F1C"]],
  ["Pastel Rainbow", ["#FFADAD", "#FFD6A5", "#FDFFB6", "#CAFFBF", "#9BF6FF", "#BDB2FF"]],
  ["Prismatic Six", ["#F94144", "#F8961E", "#F9C74F", "#90BE6D", "#43AA8B", "#577590"]],
];

const FAMILIES = [
  { key: "vibrant", label: "Vibrant", sat: [82, 92], light: [46, 62], spread: 38 },
  { key: "pastel", label: "Pastel", sat: [55, 70], light: [72, 84], spread: 26 },
  { key: "neon", label: "Neon", sat: [95, 100], light: [52, 60], spread: 52 },
  { key: "deep", label: "Deep", sat: [70, 88], light: [26, 38], spread: 30 },
  { key: "muted", label: "Muted", sat: [26, 40], light: [48, 62], spread: 22 },
  { key: "cinematic", label: "Cinematic", sat: [58, 78], light: [34, 66], spread: 168 },
  { key: "duotone", label: "Duotone", sat: [72, 90], light: [40, 70], spread: 12 },
  { key: "sunset", label: "Sunset", sat: [80, 95], light: [50, 68], spread: 24, baseHue: 8 },
  { key: "ocean", label: "Ocean", sat: [70, 92], light: [38, 62], spread: 30, baseHue: 190 },
  { key: "forest", label: "Forest", sat: [58, 82], light: [30, 56], spread: 26, baseHue: 120 },
  { key: "royal", label: "Royal", sat: [66, 88], light: [32, 60], spread: 28, baseHue: 268 },
  { key: "metal", label: "Metallic", sat: [18, 46], light: [40, 78], spread: 18, baseHue: 40 },
];

const palettes = [];
const seen = Object.create(null);

function push(name, colors, family) {
  const key = colors.join("-").toUpperCase() + "|" + colors.length;
  if (seen[key]) return false;
  seen[key] = 1;
  palettes.push({
    id: "pal_" + (palettes.length + 1),
    name: name,
    count: colors.length,
    family: family,
    colors: colors.map((c) => c.toUpperCase()),
  });
  return true;
}

// 1) curated seeds + rotations
CURATED.forEach(([name, colors]) => {
  push(name, colors, "curated");
  push(name + " · Reverse", colors.slice().reverse(), "curated");
  if (colors.length > 2) {
    push(name + " · Shift", colors.slice(1).concat(colors[0]), "curated");
  }
});

// 2) algorithmic families, colour counts 2..6
let seed = 0;
const TARGET = 1000;
outer: for (let round = 0; round < 400; round += 1) {
  for (const fam of FAMILIES) {
    for (let count = 2; count <= 6; count += 1) {
      seed += 1;
      const baseHue = (fam.baseHue != null ? fam.baseHue + round * 11 : seed * 137.508) % 360;
      const colors = [];
      for (let i = 0; i < count; i += 1) {
        const ratio = count === 1 ? 0 : i / (count - 1);
        const h = (baseHue + fam.spread * ratio + (round % 3) * 4) % 360;
        const s = fam.sat[0] + (fam.sat[1] - fam.sat[0]) * ((i + round) % (count + 1)) / (count + 1);
        const l = fam.light[0] + (fam.light[1] - fam.light[0]) * ratio;
        colors.push(hslToHex(h, s, l));
      }
      push(fam.label + " " + fam.key.charAt(0).toUpperCase() + (round + 1) + " · " + count + " Colour", colors, fam.key);
      if (palettes.length >= TARGET) break outer;
    }
  }
}

const banner = `/*!
 * GHOST TOOLKIT — Colour Palette library (auto-generated)
 * Generated by scripts/gen-palettes.cjs — do not edit by hand.
 * Palettes: ${palettes.length}
 */
`;

const body =
  banner +
  "(function (global) {\n    \"use strict\";\n    global.GHOST_PALETTES = " +
  JSON.stringify(palettes) +
  ";\n}(typeof window !== \"undefined\" ? window : this));\n";

fs.writeFileSync(OUT, body, "utf8");
const counts = palettes.reduce((acc, p) => ((acc[p.count] = (acc[p.count] || 0) + 1), acc), {});
console.log("wrote", palettes.length, "palettes ->", OUT, counts);
