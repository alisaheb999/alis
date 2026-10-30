#!/usr/bin/env node
/* GHOST TOOLKIT — generates the large preset libraries (animations, text
 * styles, captions, expressions) into BOTH the panel UI (js/toolkit.js) and
 * the ExtendScript engine (js/host.jsx) so names always stay in sync.
 *
 *   node scripts/gen-toolkit-data.cjs
 */
const fs = require("fs");
const path = require("path");

const ROOT = path.join(__dirname, "..", "extension-src", "GHOST Creative System");
const TOOLKIT = path.join(ROOT, "js", "toolkit.js");
const HOST = path.join(ROOT, "js", "host.jsx");

/* ── helpers ─────────────────────────────────────────────── */
const hex2rgb = (h) => {
  const v = h.replace("#", "");
  return [0, 2, 4].map((i) => +(parseInt(v.substr(i, 2), 16) / 255).toFixed(3));
};
const J = (o) => JSON.stringify(o);

/* ══ 1. COLOURFUL ANIMATIONS ══════════════════════════════ */
/* every entry finishes (or starts) on a colour shift so the reveal itself
   carries colour, not just motion.  28 motions × 8 colour families = 224
   generated presets; together with the 76 built-in presets in toolkit.js the
   Animation tab ships exactly 300 entries. */
const ANIM_COLORS = [
  ["Neon Cyan", "#00f0ff"],
  ["Magenta", "#ff2bad"],
  ["Molten Gold", "#ffc728"],
  ["Fire Orange", "#ff4d00"],
  ["Ice Blue", "#8cdeff"],
  ["Toxic Lime", "#c7ff21"],
  ["Royal Violet", "#a659ff"],
  ["Mint Jade", "#3ce6a8"],
];
/* [motion label, sequence, css preview class, host config] */
const ANIM_MOTIONS = [
  ["Rise", "char", "tk-anim-slideup", { position: [0, 90], opacity: 0 }],
  ["Word Rise", "word", "tk-anim-slideup", { position: [0, 120], opacity: 0 }],
  ["Drop", "char", "tk-anim-drop", { position: [0, -110], opacity: 0 }],
  ["Word Drop", "word", "tk-anim-drop", { position: [0, -130], opacity: 0 }],
  ["Pop", "char", "tk-anim-pop", { scale: [0, 0], opacity: 0 }],
  ["Word Pop", "word", "tk-anim-pop", { scale: [0, 0], opacity: 0 }],
  ["Zoom Blast", "char", "tk-anim-zoom", { scale: [320, 320], opacity: 0, blur: [26, 26] }],
  ["Word Zoom", "word", "tk-anim-zoom", { scale: [280, 280], opacity: 0, blur: [20, 20] }],
  ["Soft Blur In", "char", "tk-anim-blur", { opacity: 0, blur: [30, 30], scale: [130, 130] }],
  ["Flash Reveal", "char", "tk-anim-fadein", { opacity: 0, blur: [22, 22] }],
  ["Tracking In", "char", "tk-anim-tracking", { tracking: 34, opacity: 0 }],
  ["Word Tracking", "word", "tk-anim-tracking", { tracking: 26, opacity: 0 }],
  ["Slide Left", "char", "tk-anim-slideleft", { position: [-120, 0], opacity: 0 }],
  ["Slide Right", "char", "tk-anim-slideright", { position: [120, 0], opacity: 0 }],
  ["Glitch In", "char", "tk-anim-glitch", { position: [26, -18], skew: 40, random: true, hard: true }],
  ["Wave Reveal", "char", "tk-anim-wave", { position: [0, -46], wave: true }],
  ["Bounce Up", "char", "tk-anim-bounceup", { position: [0, 120], scale: [70, 130], bounce: true }],
  ["Word Bounce", "word", "tk-anim-bounceup", { position: [0, 140], scale: [70, 130], bounce: true }],
  ["Jelly Squash", "char", "tk-anim-squash", { scale: [40, 180], rotation: -12, bounce: true }],
  ["Word Squash", "word", "tk-anim-squash", { scale: [150, 45], position: [0, 60], bounce: true }],
  ["3D Flip", "char", "tk-anim-vflip", { rotationX: -95, threeD: true, opacity: 0 }],
  ["Word Flip", "word", "tk-anim-vflip", { rotationX: -95, threeD: true, opacity: 0 }],
  ["Spin Pop", "char", "tk-anim-rotin", { rotation: 200, scale: [0, 0], opacity: 0 }],
  ["Roll In", "char", "tk-anim-rollin", { rotation: -120, position: [-70, 0], opacity: 0 }],
  ["Line Reveal", "line", "tk-anim-slideup", { position: [0, 80], opacity: 0, blur: [18, 18] }],
  ["Line Wipe", "line", "tk-anim-wipe", { opacity: 0, position: [-140, 0] }],
  ["Flicker In", "char", "tk-anim-flicker", { opacity: 0, hard: true, random: true }],
  ["Random Rise", "char", "tk-anim-cascade", { position: [0, 100], opacity: 0, random: true }],
];
const COLOR_ANIMS = [];
ANIM_COLORS.forEach(([cName, hex], ci) => {
  ANIM_MOTIONS.forEach(([mName, seq, css, cfg], mi) => {
    /* every 7th preset also cycles the hue for a rainbow finish */
    const hue = (ci * ANIM_MOTIONS.length + mi) % 7 === 6;
    COLOR_ANIMS.push([`${cName} ${mName}`, seq, hex, Object.assign({}, cfg, hue ? { hue: true } : {}), css]);
  });
});
const BASED = { char: 1, word: 3, line: 4 };

const animUi = COLOR_ANIMS.map(([name, seq, color, cfg, css]) => ({
  name, group: "color", anim: css, seq: seq === "line" ? "word" : seq, tint: color, hue: !!cfg.hue,
}));
const animHost = COLOR_ANIMS.map(([name, seq, color, cfg]) =>
  `        ${J(name)}: ${J(Object.assign({ basedOn: BASED[seq] }, cfg, { fillColor: hex2rgb(color) }))}`
).join(",\n");


/* ══ 2. TEXT STYLES ══════════════════════════════════════ */
/* researched, widely-used gradient palettes (multicolour letters) */
const GRADIENTS = [
  ["সোনালি সূর্যাস্ত", "Sunset Fade", ["#ff512f", "#f09819", "#ffd452", "#ff8177"]],
  ["নীল আকাশ", "Sky Blue Fade", ["#2193b0", "#4fb6c9", "#6dd5ed", "#b6ecf7"]],
  ["গোলাপি স্বপ্ন", "Pink Dream", ["#ee9ca7", "#f6c5cd", "#ffdde1", "#ffb6c1"]],
  ["সবুজ প্রকৃতি", "Nature Green", ["#134e5e", "#2a7b6f", "#5aa17f", "#71b280"]],
  ["বেগুনি রাত", "Purple Night", ["#41295a", "#5c3a7e", "#8e44ad", "#2f0743"]],
  ["আগুন", "Flame", ["#f83600", "#fb6b00", "#fe8c00", "#f9d423"]],
  ["সমুদ্র", "Deep Sea", ["#000046", "#124a8c", "#1cb5e0", "#69dfff"]],
  ["ম্যাংগো", "Mango Pop", ["#ffe259", "#ffc93c", "#ffa751", "#ff8d3f"]],
  ["ময়ূরপঙ্খী", "Peacock", ["#00c9ff", "#28d7d0", "#68d8a8", "#92fe9d"]],
  ["চেরি ব্লসম", "Cherry Blossom", ["#fbd3e9", "#f7a8c4", "#e56b9f", "#bb377d"]],
  ["ল্যাভেন্ডার", "Lavender Mist", ["#c9d6ff", "#b9c4f7", "#a6b1e1", "#e2e2e2"]],
  ["নিয়ন পার্টি", "Neon Party", ["#12c2e9", "#5ba7ef", "#c471ed", "#f64f59"]],
  ["ভেপারওয়েভ", "Vaporwave", ["#ff6bd9", "#a17fe0", "#5f72bd", "#59e6ff"]],
  ["মরুভূমি", "Desert Sand", ["#c79081", "#d8a48f", "#dfa579", "#e6c9a8"]],
  ["মিন্ট", "Mint Fresh", ["#00b09b", "#3fc79a", "#7fd99b", "#96c93d"]],
  ["রক্তিম", "Blood Sunset", ["#870000", "#a4161a", "#c9184a", "#190a05"]],
  ["সোনা-রুপা", "Gold & Silver", ["#d4af37", "#e6c877", "#c0c0c0", "#f5f5f5"]],
  ["তারার আলো", "Starlight", ["#0f2027", "#203a43", "#2c5364", "#8ec5fc"]],
  ["ট্রপিক্যাল", "Tropical", ["#ff9966", "#ff8177", "#ff5e62", "#ffc371"]],
  ["বরফ", "Frozen Ice", ["#e0eafc", "#bdd4f0", "#a1c4fd", "#cfdef3"]],
  ["ইলেকট্রিক", "Electric Blue", ["#4776e6", "#5f7ce8", "#8e54e9", "#b06ab3"]],
  ["জাফরান", "Saffron", ["#f7971e", "#f9b23a", "#ffd200", "#fff07a"]],
  ["কফি", "Coffee Brown", ["#3e2723", "#5d4037", "#8d6e63", "#d7ccc8"]],
  ["সাইবার পাংক", "Cyber Punk", ["#f72585", "#b5179e", "#7209b7", "#4361ee"]],
  ["ধানক্ষেত", "Paddy Field", ["#a8e063", "#87c94a", "#56ab2f", "#c9f77f"]],
  ["বসন্ত", "Spring Bloom", ["#f857a6", "#f77aa8", "#ff9a8b", "#ffb199"]],
  ["শীতল রাত", "Cold Night", ["#232526", "#3a4b52", "#41598a", "#7f8c9c"]],
  ["সোনালি ধান", "Golden Grain", ["#e6b422", "#f0c674", "#d9a441", "#8a5a1c"]],
  ["পদ্মা", "River Padma", ["#1a2980", "#1f6fb2", "#26d0ce", "#a8ffed"]],
  ["শাপলা", "Water Lily", ["#ffffff", "#ffd7e8", "#ff8ec4", "#c2185b"]],
  ["ইলিশ রুপালি", "Silver Fish", ["#dfe9f3", "#c3cfe2", "#8fa3bf", "#5d6d85"]],
  ["রঙধনু", "Rainbow Pure", ["#ff0000", "#ff9a00", "#d0de21", "#4fdc4a", "#3fdad8", "#2fc9e2", "#1c7fee", "#5f15f2"]],
  ["কৃষ্ণচূড়া", "Flame Tree", ["#ff2d20", "#ff5e3a", "#ff9068", "#ffd194"]],
  ["মেঘলা আকাশ", "Monsoon Sky", ["#3a6073", "#4b7f95", "#6ba4b8", "#a7cbd9"]],
  ["সোনালি ধুলো", "Golden Dust", ["#b78628", "#d9a441", "#f5d76e", "#fff3c4"]],
  ["গভীর বন", "Deep Jungle", ["#0b3d2e", "#146b4a", "#2fa876", "#7fe0b0"]],
  ["ফায়ার আইস", "Fire & Ice", ["#ff512f", "#ff8a5c", "#6dd5ed", "#2193b0"]],
  ["গোধূলি", "Twilight Haze", ["#4b134f", "#7a2f6d", "#c94b8c", "#ffb3c6"]],
  ["সাইবার লাইম", "Cyber Lime", ["#003300", "#00802b", "#4dff4d", "#c7ff21"]],
  ["রুপালি চাঁদ", "Moon Silver", ["#1c1f26", "#4a5060", "#9aa4b8", "#eef2f7"]],
  ["ম্যাজেন্টা বার্স্ট", "Magenta Burst", ["#8e0e63", "#c2185b", "#ff2bad", "#ff9ad5"]],
  ["তামাটে সূর্য", "Copper Sun", ["#6b2c0f", "#b5541a", "#e8873a", "#ffc07a"]],
  ["সাগর সবুজ", "Ocean Jade", ["#023436", "#046a63", "#1fa896", "#8fe3cf"]],
  ["বিদ্যুৎ বেগুনি", "Electric Violet", ["#2b0a4d", "#5c1fb3", "#9d4edd", "#e0aaff"]],
  ["রক্তচন্দন", "Blood Amber", ["#4a0d0d", "#8c1c13", "#d94f04", "#f2a65a"]],
  ["শীতল ইস্পাত", "Cold Steel", ["#0f1c2e", "#27496d", "#4d7ea8", "#a9c9e8"]],
  ["মধুর গোলাপ", "Honey Rose", ["#7a2e46", "#c05b7d", "#f28ab2", "#ffd9e5"]],
  ["গ্যালাক্সি", "Galaxy Core", ["#0b0033", "#2d0a5e", "#7b2ff7", "#f107a3"]],

];
/* extrude / 3D block styles: fill, outline, shadow */
const EXTRUDES = [
  ["সাদা স্টিকার", "Sticker White Bold", "#ffffff", "#0d0d0f", "#0d0d0f"],
  ["কালো বোল্ড", "Ink Black Bold", "#101014", "#ffffff", "#5c5c66"],
  ["সোনালি রাজকীয়", "Royal Gold 3D", "#f0c74a", "#2e2108", "#7a5a12"],
  ["লাল ইমপ্যাক্ট", "Red Impact", "#e8192c", "#140505", "#5c0611"],
  ["নীল টাইটেল", "Blue Title 3D", "#5aa9ff", "#06183d", "#0f4799"],
  ["সবুজ পপ", "Green Pop 3D", "#7bed6b", "#08260a", "#1f8a2c"],
  ["গোলাপি ক্যান্ডি", "Pink Candy 3D", "#ffb3d1", "#3d0a1f", "#ff5f9e"],
  ["বেগুনি নিয়ন", "Purple Neon Edge", "#170f2e", "#a64dff", "#6626e6"],
  ["কমলা ব্লক", "Orange Block", "#ff8f2e", "#331402", "#a64a05"],
  ["আকাশি আউটলাইন", "Sky Outline", "#0b1220", "#59c7ff", "#59c7ff"],
  ["ক্রিম রেট্রো", "Cream Retro 3D", "#faedcc", "#592914", "#bf5929"],
  ["চকলেট", "Chocolate 3D", "#c98a52", "#301a0c", "#7a4a1e"],
  ["পান্না", "Emerald 3D", "#2ee6a8", "#04241a", "#0f7a5a"],
  ["রুপালি ক্রোম", "Silver Chrome 3D", "#ebeff7", "#404754", "#8c98ad"],
  ["তামা", "Copper 3D", "#d97333", "#331605", "#8a3f10"],
  ["নীলাভ কাঁচ", "Glass Blue", "#cfe9ff", "#0a2a4d", "#3f86c9"],
  ["হলুদ সতর্কতা", "Warning Yellow", "#ffd21f", "#1a1400", "#8a6d00"],
  ["গাঢ় সবুজ", "Deep Forest", "#1f7a3d", "#03170a", "#0c4020"],
  ["রক্তলাল ছায়া", "Crimson Shadow", "#b3122c", "#1a0207", "#4d0512"],
  ["ধূসর স্টিল", "Steel Grey 3D", "#b9c2cc", "#22262b", "#5c646e"],
  ["নিয়ন সবুজ", "Toxic Neon", "#b8ff29", "#0f2e05", "#3d800d"],
  ["ফিরোজা", "Turquoise 3D", "#31d6d6", "#042b2b", "#0f7a7a"],
  ["বালি", "Sand Stone", "#e6d2a8", "#3d2f14", "#a3854a"],
  ["গোলাপ সোনা", "Rose Gold 3D", "#f5c2b8", "#4d2624", "#9e5752"],
  ["মধ্যরাত", "Midnight Blue 3D", "#274690", "#050b1a", "#12245c"],
  ["ল্যাভেন্ডার ব্লক", "Lavender Block", "#d6cdf5", "#1f1440", "#6b4fd9"],
  ["পিচ", "Peach Soft", "#ffd1ab", "#4d2a10", "#c9793a"],
  ["বরফ নীল", "Frost Blue 3D", "#d9f7ff", "#062033", "#3fa3cc"],
  ["কমিক পাঞ্চ", "Comic Punch 2", "#ffe14d", "#050505", "#eb1f5a"],
  ["আলট্রা ভায়োলেট", "Ultra Violet", "#8f4dff", "#150533", "#4a12a3"],
  ["নিয়ন গোলাপি", "Neon Pink Edge", "#12060f", "#ff2bad", "#ff2bad"],
  ["সোনালি কালো", "Black Gold Luxe", "#111111", "#f0c74a", "#8a6a12"],
  ["মেঘ", "Cloud White", "#f5f8ff", "#26303d", "#9aa7ba"],
  ["আম্র", "Mango 3D", "#ffb42e", "#3d2101", "#b06405"],
  ["জাম", "Berry 3D", "#7a2e6b", "#1c0819", "#c458ab"],
  ["ইস্পাত নীল", "Steel Blue 3D", "#4f7fa8", "#08192b", "#1d4870"],
];
/* preview copy: short / medium / long so cards mirror real usage */
const BN_COPY = ["বাংলা", "স্বপ্ন", "ভালোবাসা", "আমার সোনার বাংলা", "জীবন মানে যুদ্ধ", "সাহসী হও", "শুভেচ্ছা", "নতুন দিন", "মন খারাপ নয়", "আজকের গল্প"];
const EN_COPY = ["POP", "DREAM BIG", "STAY WILD", "GO LIVE", "NEVER STOP", "BIG NEWS", "HYPE", "TODAY"];
const copyFor = (i, bn) => (bn ? BN_COPY[i % BN_COPY.length] : EN_COPY[i % EN_COPY.length]);

const styleUi = [];
const styleHost = [];
GRADIENTS.forEach(([bnName, enName, cols], i) => {
  const bn = i % 3 !== 2; /* বাংলা majority */
  const name = bn ? `${bnName} — ${enName}` : enName;
  styleUi.push({ name, desc: enName, chars: cols, overlap: i % 5 === 0, preview: copyFor(i, bn), bn });
  styleHost.push(`        ${J(name)}: { kind: "multicolor", colors: ${J(cols.map(hex2rgb))}, tracking: ${i % 5 === 0 ? -55 : 0}, blend: ${i % 5 === 0} }`);
});
EXTRUDES.forEach(([bnName, enName, fill, stroke, shadow], i) => {
  const bn = i % 3 !== 2;
  const name = bn ? `${bnName} — ${enName}` : enName;
  styleUi.push({ name, desc: enName, solid: fill, outline: stroke, shadow, preview: copyFor(i + 3, bn), bn });
  styleHost.push(`        ${J(name)}: { kind: "extrude", fill: ${J(hex2rgb(fill))}, stroke: ${J(hex2rgb(stroke))}, strokeWidth: ${6 + (i % 5)}, depth: ${8 + (i % 7)}, angle: 135, shadow: ${J(hex2rgb(shadow))} }`);
});

/* ── 100 premium Bengali text-FX colour presets (imported studio pack) ── */
const FX_PRESETS = JSON.parse(fs.readFileSync(path.join(__dirname, "fx-text-presets.json"), "utf8"));
const FX_CAT_BN = {
  steel: "স্টিল ও ক্রোম", gold: "গোল্ড ও কপার", neon: "নিয়ন গ্লো", gradient: "গ্রেডিয়েন্ট",
  jewel: "জুয়েল টোন", pastel: "প্যাস্টেল", synthwave: "সিন্থওয়েভ", cosmic: "কসমিক", duotone: "ডুওটোন",
};
FX_PRESETS.forEach((p, i) => {
  const name = `${p.nameBn} — ${p.nameEn}`;
  const stops = (p.textColor.match(/#[0-9a-fA-F]{6}/g) || p.swatches).slice(0, 8);
  styleUi.push({
    name,
    desc: `${p.nameEn} · ${FX_CAT_BN[p.category] || p.category}`,
    gradient: p.textColor,
    glow: p.dropShadow,
    cat: p.category,
    chars: stops,
    preview: copyFor(i, true),
    bn: true,
  });
  styleHost.push(`        ${J(name)}: { kind: "multicolor", colors: ${J(stops.map(hex2rgb))}, tracking: 0, blend: false }`);
});

const CAP_BASE = [
  ["ইউটিউব বক্স", "YouTube Box Dark", "#000000", "#ffffff", 6, 78],
  ["সাদা বোল্ড", "White Bold Plate", "#ffffff", "#0a0a0a", 8, 100],
  ["টিকটক ব্ল্যাক", "TikTok Black", "#0a0a0a", "#ffffff", 8, 100],
  ["নীল বার", "Blue Bar", "#2480f0", "#ffffff", 30, 100],
  ["লাল বার", "Red Bar", "#e01b32", "#ffffff", 30, 100],
  ["সবুজ বার", "Green Bar", "#1f9e4f", "#ffffff", 30, 100],
  ["হলুদ হাইলাইট", "Yellow Highlight", "#fcd935", "#101010", 2, 100],
  ["গোলাপি প্লেট", "Pink Plate", "#ff5f9e", "#ffffff", 12, 100],
  ["বেগুনি প্লেট", "Purple Plate", "#8f4dff", "#ffffff", 12, 100],
  ["কমলা প্লেট", "Orange Plate", "#ff7a1a", "#141414", 12, 100],
  ["ফিরোজা প্লেট", "Teal Plate", "#12b5b0", "#ffffff", 12, 100],
  ["ক্রিম কোট", "Cream Quote", "#faf8f2", "#15151a", 4, 100],
  ["নিয়ন সাইন", "Neon Sign", "#0a0a10", "#59f2ff", 10, 90],
  ["নিয়ন গোলাপি", "Neon Pink Sign", "#0a0a10", "#ff5fc8", 10, 90],
  ["সোনালি প্লেট", "Gold Plate", "#f0c74a", "#1a1200", 6, 100],
  ["গাঢ় কাঁচ", "Dark Glass", "#101018", "#e8f0ff", 14, 60],
  ["হালকা কাঁচ", "Light Glass", "#ffffff", "#111111", 14, 55],
  ["লোয়ার থার্ড", "Lower Third Blue", "#0d0d12", "#ffffff", 0, 92, "#2680eb"],
  ["লোয়ার থার্ড লাল", "Lower Third Red", "#0d0d12", "#ffffff", 0, 92, "#e01b32"],
  ["লোয়ার থার্ড সোনালি", "Lower Third Gold", "#0d0d12", "#ffffff", 0, 92, "#f0c74a"],
  ["সংবাদ প্লেট", "News Ticker", "#12203d", "#ffffff", 0, 100, "#ff9f1a"],
  ["মিনিমাল কালো", "Minimal Black", "#000000", "#ffffff", 0, 100],
  ["মিনিমাল সাদা", "Minimal White", "#ffffff", "#000000", 0, 100],
];
const CAP_OUTLINE = [
  ["সাদা আউটলাইন", "White Outline", "#ffffff", "#000000"],
  ["হলুদ আউটলাইন", "Yellow Outline", "#ffe14d", "#1a1400"],
  ["সবুজ আউটলাইন", "Green Outline", "#7bed6b", "#04240a"],
  ["গোলাপি আউটলাইন", "Pink Outline", "#ff87cc", "#33051f"],
  ["নীল আউটলাইন", "Blue Outline", "#59c7ff", "#04172e"],
  ["কমলা আউটলাইন", "Orange Outline", "#ff9f1a", "#2e1400"],
  ["ফিরোজা আউটলাইন", "Teal Outline", "#2ed4bf", "#03211e"],
  ["বেগুনি আউটলাইন", "Violet Outline", "#b98cff", "#150533"],
];
const capUi = [], capHost = [];
const pushCap = (name, ui, host) => { capUi.push(Object.assign({ name }, ui)); capHost.push(`        ${J(name)}: ${host}`); };
const CAP_ANIMS = ["tk-cap-pop", "tk-cap-rise", "tk-cap-slide", "tk-cap-glowpulse"];
CAP_BASE.forEach(([bnName, enName, bg, fg, radius, op, accent], i) => {
  const bn = i % 3 !== 2;
  const base = bn ? `${bnName} — ${enName}` : enName;
  ["", " Wide", " Tight", " Pill"].forEach((variant, v) => {
    const name = base + variant;
    const padX = [22, 40, 10, 26][v], padY = [12, 18, 4, 14][v], rad = v === 3 ? 40 : radius;
    pushCap(name,
      {
        bg: `rgba(${hex2rgb(bg).map((c) => Math.round(c * 255)).join(",")},${op / 100})`,
        color: fg, radius: rad + "px", accent, glow: /Neon/.test(enName), bn,
        shadow: "0 6px 18px rgba(0,0,0,.45)",
        anim: CAP_ANIMS[(i + v) % CAP_ANIMS.length],
      },
      `{ bg: ${J(hex2rgb(bg))}, bgOpacity: ${op}, padX: ${padX}, padY: ${padY}, radius: ${rad}, fill: ${J(hex2rgb(fg))}, caps: ${v === 2}, stroke: 0${accent ? `, accent: ${J(hex2rgb(accent))}` : ""}${/Neon/.test(enName) ? ", glow: true" : ""} }`);
  });
});
CAP_OUTLINE.forEach(([bnName, enName, fg, stroke], i) => {
  const bn = i % 2 === 0;
  const name = bn ? `${bnName} — ${enName}` : enName;
  pushCap(name, {
    bg: "transparent", color: fg, stroke, bn,
    anim: CAP_ANIMS[i % CAP_ANIMS.length],
  }, `{ bg: null, fill: ${J(hex2rgb(fg))}, stroke: ${5 + (i % 4)}, strokeColor: ${J(hex2rgb(stroke))}, caps: false }`);
});

/* ── premium gradient plates, palette-matched to the Text Styles tab ── */
const CAP_PREMIUM = GRADIENTS.slice(0, 24).map(([bnName, enName, cols]) => [bnName, enName, cols]);
CAP_PREMIUM.forEach(([bnName, enName, cols], i) => {
  const a = cols[0], b = cols[cols.length - 1], mid = cols[Math.floor(cols.length / 2)];
  const light = i % 2 === 0;
  const fg = light ? "#ffffff" : "#0b0b10";
  ["", " Pill"].forEach((variant, v) => {
    const name = `${bnName} প্লেট — ${enName} Plate${variant}`;
    const rad = v === 1 ? 40 : 14;
    pushCap(name, {
      bg: "transparent",
      grad: `linear-gradient(100deg, ${a}, ${mid}, ${b})`,
      color: fg,
      radius: rad + "px",
      bn: true,
      premium: true,
      shadow: `0 8px 22px ${a}55, inset 0 1px 0 rgba(255,255,255,.28)`,
      border: "1px solid rgba(255,255,255,.22)",
      anim: CAP_ANIMS[(i + v) % CAP_ANIMS.length],
    },
      `{ bg: ${J(hex2rgb(a))}, bg2: ${J(hex2rgb(b))}, bgOpacity: 100, padX: ${v === 1 ? 30 : 24}, padY: ${v === 1 ? 16 : 14}, radius: ${rad}, fill: ${J(hex2rgb(fg))}, caps: false, stroke: 0, plateStroke: ${J(hex2rgb(mid))}, glow: true }`);
  });
});


/* ══ 4. EXPRESSIONS ══════════════════════════════════════ */
const exprUi = [], exprHost = [];
const pushExpr = (name, target, code) => {
  exprUi.push({ name, target, code });
  exprHost.push(`        ${J(name)}: { target: ${J(target.toLowerCase() === "text" ? "sourceText" : target.toLowerCase())}, code: ${J(code)} }`);
};
[[2, 10], [2, 20], [3, 30], [1, 8], [5, 40], [0.5, 6], [4, 60], [1.5, 14]].forEach(([f, a]) =>
  pushExpr(`Wiggle ${f}/${a}`, "Position", `wiggle(${f},${a});`));
[[1, 4], [2, 8], [3, 12], [0.5, 3]].forEach(([f, a]) =>
  pushExpr(`Scale Wiggle ${f}/${a}`, "Scale", `wiggle(${f},${a});`));
[[1, 5], [2, 12], [4, 25]].forEach(([f, a]) =>
  pushExpr(`Rotate Wiggle ${f}/${a}`, "Rotation", `wiggle(${f},${a});`));
["cycle", "pingpong", "offset", "continue"].forEach((t) => {
  pushExpr(`Loop Out ${t}`, "Position", `loopOut("${t}");`);
  pushExpr(`Loop In ${t}`, "Position", `loopIn("${t}");`);
  pushExpr(`Scale Loop ${t}`, "Scale", `loopOut("${t}");`);
  pushExpr(`Rotate Loop ${t}`, "Rotation", `loopOut("${t}");`);
});
[[0.2, 0.2], [0.5, 0.5], [1, 1], [0.3, 1.2]].forEach(([i2, o]) =>
  pushExpr(`Auto Fade ${i2}s/${o}s`, "Opacity", `fi=${i2}; fo=${o};\nlinear(time, inPoint, inPoint+fi, 0, 100) - linear(time, outPoint-fo, outPoint, 0, 100);`));
[[0.08, 2, 4], [0.12, 2.6, 5], [0.2, 3.2, 6], [0.3, 1.8, 3]].forEach(([amp, freq, decay]) =>
  pushExpr(`Bounce Key ${amp}`, "Position", `amp=${amp}; freq=${freq}; decay=${decay};\nn=0;\nif (numKeys>0){ n=nearestKey(time).index; if (key(n).time>time) n--; }\nif (n>0){ t=time-key(n).time; v=velocityAtTime(key(n).time-.001); value+v*amp*Math.sin(freq*t*2*Math.PI)/Math.exp(decay*t); } else value;`));
[[3, 0.8], [6, 1.2], [10, 0.5], [2, 2]].forEach(([amp, freq]) =>
  pushExpr(`Breathe ${amp}/${freq}`, "Scale", `amp=${amp}; freq=${freq};\nvalue + amp*Math.sin(freq*time*2*Math.PI);`));
[[8, 1], [15, 1.2], [25, 0.6]].forEach(([amp, freq]) =>
  pushExpr(`Pendulum ${amp}deg`, "Rotation", `amp=${amp}; freq=${freq}; decay=1.5;\namp*Math.sin(freq*time*2*Math.PI)/Math.exp(decay*time*0.2);`));
[10, 30, 60, 120, 360].forEach((s) => pushExpr(`Spin ${s}/sec`, "Rotation", `time*${s};`));
[[0, 6], [0, 20], [0, 45]].forEach(([, amp], i) =>
  pushExpr(`Float Y ${amp}px`, "Position", `amp=${amp}; freq=${0.4 + i * 0.3};\n[value[0], value[1] + amp*Math.sin(freq*time*2*Math.PI)];`));
[[6, 0.5], [20, 1], [40, 2]].forEach(([amp, freq]) =>
  pushExpr(`Float X ${amp}px`, "Position", `amp=${amp}; freq=${freq};\n[value[0] + amp*Math.sin(freq*time*2*Math.PI), value[1]];`));
[10, 25, 50].forEach((a) => pushExpr(`Shake ${a}`, "Position", `seedRandom(index,true);\nwiggle(24,${a});`));
[[40, 100], [0, 100], [70, 100]].forEach(([lo, hi]) =>
  pushExpr(`Flicker ${lo}-${hi}`, "Opacity", `seedRandom(index,true);\nrandom(${lo},${hi});`));
[15, 25, 40, 60].forEach((sp) =>
  pushExpr(`Typewriter ${sp}cps`, "Text", `speed=${sp};\nnumChars=Math.floor(time*speed);\ntext.sourceText.substr(0,numChars);`));
[15, 30].forEach((sp) =>
  pushExpr(`Typewriter Cursor ${sp}`, "Text", `speed=${sp};\nn=Math.floor(time*speed);\ntext.sourceText.substr(0,n)+((Math.floor(time*4)%2)?"|":"");`));
[2, 4, 6].forEach((sp) =>
  pushExpr(`Word Reveal ${sp}/sec`, "Text", `w = text.sourceText.split(" ");\nc = Math.floor(time*${sp});\nw.slice(0,c).join(" ");`));
[["0", "Integer"], ["1", "1 decimal"], ["2", "2 decimals"]].forEach(([d, label]) =>
  pushExpr(`Counter ${label}`, "Text", `v = effect("Slider Control")("Slider");\nv.toFixed(${d});`));
pushExpr("Counter Comma", "Text", `v = effect("Slider Control")("Slider");\nv.toFixed(0).replace(/\\B(?=(\\d{3})+(?!\\d))/g, ",");`);
pushExpr("Counter Percent", "Text", `v = effect("Slider Control")("Slider");\nMath.round(v) + "%";`);
pushExpr("Counter Taka", "Text", `v = effect("Slider Control")("Slider");\n"\u09f3 " + v.toFixed(0).replace(/\\B(?=(\\d{3})+(?!\\d))/g, ",");`);
pushExpr("Counter Dollar", "Text", `v = effect("Slider Control")("Slider");\n"$" + v.toFixed(0).replace(/\\B(?=(\\d{3})+(?!\\d))/g, ",");`);
pushExpr("Counter K/M", "Text", `v = effect("Slider Control")("Slider");\nv>=1000000 ? (v/1000000).toFixed(1)+"M" : v>=1000 ? (v/1000).toFixed(1)+"K" : Math.round(v)+"";`);
pushExpr("Timecode mm:ss", "Text", `t=Math.max(0,time);\nm=Math.floor(t/60); s=Math.floor(t%60);\n(m<10?"0":"")+m+":"+(s<10?"0":"")+s;`);
pushExpr("Countdown 10s", "Text", `t=Math.max(0, 10-(time-inPoint));\nMath.ceil(t)+"";`);
pushExpr("Uppercase Source", "Text", `text.sourceText.toUpperCase();`);
pushExpr("Layer Name Text", "Text", `thisLayer.name;`);
pushExpr("Comp Name Text", "Text", `thisComp.name;`);
pushExpr("Today Date", "Text", `d = new Date();\nd.getDate()+"/"+(d.getMonth()+1)+"/"+d.getFullYear();`);
pushExpr("Hacker Decrypt", "Text", `chars="ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%";\nsrc=text.sourceText;\nshown=Math.floor(time*18);\nres="";\nfor(i=0;i<src.length;i++){ res += (i<shown) ? src[i] : chars[Math.floor(random(0,chars.length))]; }\nres;`);
pushExpr("Bangla Digits", "Text", `en="0123456789"; bn="\u09e6\u09e7\u09e8\u09e9\u09ea\u09eb\u09ec\u09ed\u09ee\u09ef";\ns=text.sourceText; r="";\nfor(i=0;i<s.length;i++){ k=en.indexOf(s[i]); r += (k>-1)? bn[k] : s[i]; }\nr;`);
[["Inertia Smooth", 0.05, 6.0], ["Inertia Heavy", 0.25, 3.0]].forEach(([n, amp, decay]) =>
  pushExpr(n, "Position", `amp=${amp}; freq=3; decay=${decay};\nn=0;\nif (numKeys>0){ n=nearestKey(time).index; if (key(n).time>time) n--; }\nif (n>0){ t=time-key(n).time; v=velocityAtTime(key(n).time-.001); value+v*amp*Math.sin(freq*t*2*Math.PI)/Math.exp(decay*t); } else value;`));
[["Smooth Position", "Position"], ["Smooth Scale", "Scale"], ["Smooth Rotation", "Rotation"]].forEach(([n, t]) =>
  pushExpr(n, t, `smooth(0.4, 8);`));
pushExpr("Time Remap Loop", "Opacity", `loopOut("cycle");`);
pushExpr("Blink 2/sec", "Opacity", `(Math.floor(time*2)%2)*100;`);
pushExpr("Blink 5/sec", "Opacity", `(Math.floor(time*5)%2)*100;`);
pushExpr("Pulse Opacity", "Opacity", `50 + 50*Math.sin(time*2*Math.PI);`);
pushExpr("Fade On Screen", "Opacity", `linear(time, inPoint, inPoint+0.4, 0, 100);`);
pushExpr("Pop Scale In", "Scale", `s=linear(time, inPoint, inPoint+0.3, 0, 100);\n[s,s];`);
pushExpr("Elastic Scale In", "Scale", `t=time-inPoint;\nk = t<0 ? 0 : 100 - 100*Math.cos(t*14)/Math.exp(t*6);\n[k,k];`);
pushExpr("Random Position Grid", "Position", `seedRandom(index,true);\n[value[0]+random(-40,40), value[1]+random(-40,40)];`);
pushExpr("Stagger By Index", "Position", `d = index*0.06;\nt = time - d;\ny = value[1] + linear(t, inPoint, inPoint+0.5, 80, 0);\n[value[0], y];`);
pushExpr("Anchor To Centre", "Position", `[thisComp.width/2, thisComp.height/2];`);
pushExpr("Follow Mouse-less Null", "Position", `try{ thisComp.layer("CONTROL").transform.position }catch(e){ value }`);
while (exprUi.length < 100) {
  const i = exprUi.length;
  pushExpr(`Wiggle Fine ${i}`, "Position", `wiggle(${(1 + (i % 9) * 0.5).toFixed(1)},${5 + (i % 11) * 3});`);
}

/* ══ write blocks ════════════════════════════════════════ */
const block = (tag, body) => `    /* @ghost-generated:${tag} */\n${body}\n    /* @ghost-generated-end:${tag} */\n`;

function insert(file, tag, body, anchor) {
  let src = fs.readFileSync(file, "utf8");
  const re = new RegExp(`[ \\t]*\\/\\* @ghost-generated:${tag} \\*\\/[\\s\\S]*?\\/\\* @ghost-generated-end:${tag} \\*\\/\\n`);
  const chunk = block(tag, body);
  if (re.test(src)) src = src.replace(re, chunk);
  else {
    const idx = src.indexOf(anchor);
    if (idx === -1) throw new Error(`anchor not found for ${tag}: ${anchor}`);
    src = src.slice(0, idx) + chunk + "\n" + src.slice(idx);
  }
  fs.writeFileSync(file, src);
}

/* -- toolkit.js -- */
insert(TOOLKIT, "animations",
  `    ANIMATIONS.push.apply(ANIMATIONS, ${JSON.stringify(animUi, null, 8).replace(/\n/g, "\n    ")});`,
  "    var COLORS = [");
insert(TOOLKIT, "textstyles",
  `    TEXT_STYLES.push.apply(TEXT_STYLES, ${JSON.stringify(styleUi, null, 8).replace(/\n/g, "\n    ")});`,
  "    function textStylePreviewNode(item) {");
insert(TOOLKIT, "captions",
  `    CAPTIONS.push.apply(CAPTIONS, ${JSON.stringify(capUi, null, 8).replace(/\n/g, "\n    ")});`,
  "    function renderCaptions() {");
insert(TOOLKIT, "expressions",
  `    EXPRESSIONS.push.apply(EXPRESSIONS, ${JSON.stringify(exprUi, null, 8).replace(/\n/g, "\n    ")});`,
  "    /* ── helpers ─");

/* -- host.jsx -- */
insert(HOST, "seq",
  `    var TK_SEQ_EXTRA = {\n${animHost}\n    };\n    for (var tkSeqKey in TK_SEQ_EXTRA) { if (TK_SEQ_EXTRA.hasOwnProperty(tkSeqKey)) TK_SEQ[tkSeqKey] = TK_SEQ_EXTRA[tkSeqKey]; }`,
  "    function tkSeqProp(group, matchName, value) {");
insert(HOST, "styles",
  `    var TK_TEXT_STYLES_EXTRA = {\n${styleHost.join(",\n")}\n    };\n    for (var tkStyleKey in TK_TEXT_STYLES_EXTRA) { if (TK_TEXT_STYLES_EXTRA.hasOwnProperty(tkStyleKey)) TK_TEXT_STYLES[tkStyleKey] = TK_TEXT_STYLES_EXTRA[tkStyleKey]; }`,
  "    function toolkitApplyTextStyle(name) {");
insert(HOST, "captions",
  `    var TK_CAPTIONS_EXTRA = {\n${capHost.join(",\n")}\n    };\n    for (var tkCapKey in TK_CAPTIONS_EXTRA) { if (TK_CAPTIONS_EXTRA.hasOwnProperty(tkCapKey)) TK_CAPTIONS[tkCapKey] = TK_CAPTIONS_EXTRA[tkCapKey]; }`,
  "    function tkBuildPlate(comp, layer, cfg, name) {");
insert(HOST, "expressions",
  `    var TK_EXPRESSIONS_EXTRA = {\n${exprHost.join(",\n")}\n    };\n    for (var tkExprKey in TK_EXPRESSIONS_EXTRA) { if (TK_EXPRESSIONS_EXTRA.hasOwnProperty(tkExprKey)) TK_EXPRESSIONS[tkExprKey] = TK_EXPRESSIONS_EXTRA[tkExprKey]; }`,
  "    function tkExpressionProperty(layer, target) {");

console.log(`animations +${animUi.length}, styles +${styleUi.length}, captions +${capUi.length}, expressions +${exprUi.length}`);
