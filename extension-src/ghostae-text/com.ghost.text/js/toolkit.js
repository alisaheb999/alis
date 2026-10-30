if (typeof window !== "undefined" && window.__ghostStamp) {
  window.__ghostStamp(
    "toolkit.js",
    /* @ghost-build */
    "3.40.7+20260901.style-lock-menu"
  );
}
(function() {
  "use strict";
  /* Hot-path helpers: CEP's Chromium repaints slowly, so keystroke-driven
     grid filtering is debounced and batched instead of running per keypress. */
  var tkDebounce = (typeof window !== "undefined" && window.GhostPerf)
    ? window.GhostPerf.debounce
    : function(fn) { return fn; };

  var cs = null;
  try {
    cs = new CSInterface();
  } catch (e) {
    cs = null;
  }
  var statusEl = null;
  var toastRegion = null;
  /* v3.23.0 — the two FFX animation cards ("Kinetic Rise" / "Elastic Drop")
     were removed from the Animations tab on request. FFX_COLOR (Text tab)
     is untouched. */
  var FFX_COLOR = [
    { label: "Neon Ghost Look", file: "GHOST_Neon_Look.ffx", fallback: "Ghost Cyan", color: "#2680eb" },
    { label: "Gold Cinematic", file: "GHOST_Gold_Cinematic.ffx", fallback: "Molten Gold", color: "#f0c74a" }
  ];
  /* ══════════════════════════════════════════════════════════════
     50 built-in presets. Every one of them is built with the Pop In
     recipe from docs/GHOST-MOTION-RULES.md (JOB B): GHOST-prefixed
     sliders + text animators, an Expressible Selector (Range Type2 = 3)
     driven by textIndex, start time from the layer "IN" marker, plus a
     dedicated opacity animator. `group` feeds the category menu next to
     the play button; `anim` is the matching preview class in
     css/toolkit.css, generated from the SAME offset table as the After
     Effects values, so the card and the layer stay identical.
     ══════════════════════════════════════════════════════════════ */
  var ANIMATIONS = [
    /* ── pop family ── */
    { name: "Pop In Up", group: "pop", anim: "tk-anim-popin-up", seq: "char" },
    { name: "Pop In Down", group: "pop", anim: "tk-anim-popin-down", seq: "char" },
    { name: "Pop In Left", group: "pop", anim: "tk-anim-popin-left", seq: "char" },
    { name: "Pop In Right", group: "pop", anim: "tk-anim-popin-right", seq: "char" },
    { name: "Pop In Scale", group: "pop", anim: "tk-anim-popin-scale", seq: "char" },
    { name: "Pop In Spin", group: "pop", anim: "tk-anim-popin-spin", seq: "char" },
    { name: "Pop In Blur", group: "pop", anim: "tk-anim-popin-blur", seq: "char" },
    { name: "Pop In Track", group: "pop", anim: "tk-anim-popin-track", seq: "char" },
    /* ── bounce family ── */
    { name: "Bounce Drop", group: "bounce", anim: "tk-anim-bounce-drop", seq: "char" },
    { name: "Bounce Rise", group: "bounce", anim: "tk-anim-bounce-rise", seq: "char" },
    { name: "Bounce Squash", group: "bounce", anim: "tk-anim-bounce-squash", seq: "char" },
    { name: "Bounce Swing", group: "bounce", anim: "tk-anim-bounce-swing", seq: "char" },
    { name: "Bounce Spread", group: "bounce", anim: "tk-anim-bounce-spread", seq: "char" },
    { name: "Bounce Skew", group: "bounce", anim: "tk-anim-bounce-skew", seq: "char" },
    /* ── wave 4 (v3.23.0): premium market presets, same build rules ── */
    { name: "Bounce Side", group: "bounce", anim: "tk-anim-bounce-side", seq: "char" },
    { name: "Bounce Tilt", group: "bounce", anim: "tk-anim-bounce-tilt", seq: "char" },
    { name: "Bounce Pop", group: "bounce", anim: "tk-anim-bounce-pop", seq: "char" },
    { name: "Bounce Roll", group: "bounce", anim: "tk-anim-bounce-roll", seq: "char" },
    { name: "Elastic Rise", group: "elastic", anim: "tk-anim-elastic-rise", seq: "char" },
    { name: "Elastic Snap", group: "elastic", anim: "tk-anim-elastic-snap", seq: "char" },
    { name: "Elastic Wobble", group: "elastic", anim: "tk-anim-elastic-wobble", seq: "char" },
    { name: "Elastic Stretch", group: "elastic", anim: "tk-anim-elastic-stretch", seq: "char" },
    { name: "Fade Soft", group: "fade", anim: "tk-anim-fade-soft", seq: "char" },
    { name: "Fade Up", group: "fade", anim: "tk-anim-fade-up", seq: "char" },
    { name: "Fade Down", group: "fade", anim: "tk-anim-fade-down", seq: "char" },
    { name: "Fade Scale", group: "fade", anim: "tk-anim-fade-scale", seq: "char" },
    { name: "Fade Track", group: "fade", anim: "tk-anim-fade-track", seq: "char" },
    { name: "Slide Soft In", group: "slide", anim: "tk-anim-slide-soft-in", seq: "char" },
    { name: "Slide Soft Out", group: "slide", anim: "tk-anim-slide-soft-out", seq: "char" },
    { name: "Slide Rise", group: "slide", anim: "tk-anim-slide-rise", seq: "char" },
    { name: "Slide Fall", group: "slide", anim: "tk-anim-slide-fall", seq: "char" },
    { name: "Slide Diagonal", group: "slide", anim: "tk-anim-slide-diagonal", seq: "char" },
    { name: "Scale Burst", group: "scale", anim: "tk-anim-scale-burst", seq: "char" },
    { name: "Scale Shrink", group: "scale", anim: "tk-anim-scale-shrink", seq: "char" },
    { name: "Scale Wide", group: "scale", anim: "tk-anim-scale-wide", seq: "char" },
    { name: "Scale Tall", group: "scale", anim: "tk-anim-scale-tall", seq: "char" },
    { name: "Rotate Sweep", group: "rotate", anim: "tk-anim-rotate-sweep", seq: "char" },
    { name: "Rotate Flip Up", group: "rotate", anim: "tk-anim-rotate-flip-up", seq: "char" },
    { name: "Rotate Flip Side", group: "rotate", anim: "tk-anim-rotate-flip-side", seq: "char" },
    { name: "Rotate Tumble", group: "rotate", anim: "tk-anim-rotate-tumble", seq: "char" },
    { name: "Blur Rise", group: "blur", anim: "tk-anim-blur-rise", seq: "char" },
    { name: "Blur Zoom", group: "blur", anim: "tk-anim-blur-zoom", seq: "char" },
    { name: "Blur Drift", group: "blur", anim: "tk-anim-blur-drift", seq: "char" },
    { name: "Blur Focus", group: "blur", anim: "tk-anim-blur-focus", seq: "char" },
    { name: "Track Wide", group: "track", anim: "tk-anim-track-wide", seq: "char" },
    { name: "Track Tight", group: "track", anim: "tk-anim-track-tight", seq: "char" },
    { name: "Track Glow", group: "track", anim: "tk-anim-track-glow", seq: "char" },
    { name: "Skew Slice", group: "skew", anim: "tk-anim-skew-slice", seq: "char" },
    { name: "Skew Snap", group: "skew", anim: "tk-anim-skew-snap", seq: "char" },
    { name: "Skew Rise", group: "skew", anim: "tk-anim-skew-rise", seq: "char" },
    /* ── wave 5 (v3.25.0): new premium families ── */
    { name: "Wave Flow", group: "wave", anim: "tk-anim-wave-flow", seq: "char" },
    { name: "Wave Ripple", group: "wave", anim: "tk-anim-wave-ripple", seq: "char" },
    { name: "Wave Drift", group: "wave", anim: "tk-anim-wave-drift", seq: "char" },
    { name: "Glitch Slice", group: "glitch", anim: "tk-anim-glitch-slice", seq: "char" },
    { name: "Glitch Jitter", group: "glitch", anim: "tk-anim-glitch-jitter", seq: "char" },
    { name: "Glitch Blur", group: "glitch", anim: "tk-anim-glitch-blur", seq: "char" },
    { name: "Cinema Reveal", group: "cinema", anim: "tk-anim-cinema-reveal", seq: "char" },
    { name: "Cinema Push", group: "cinema", anim: "tk-anim-cinema-push", seq: "char" },
    { name: "Cinema Drift", group: "cinema", anim: "tk-anim-cinema-drift", seq: "char" },
    { name: "Kinetic Snap", group: "kinetic", anim: "tk-anim-kinetic-snap", seq: "char" },
    { name: "Kinetic Punch", group: "kinetic", anim: "tk-anim-kinetic-punch", seq: "char" },
    { name: "Kinetic Swing", group: "kinetic", anim: "tk-anim-kinetic-swing", seq: "char" },
    { name: "Reveal Rise", group: "reveal", anim: "tk-anim-reveal-rise", seq: "char" },
    { name: "Reveal Stretch", group: "reveal", anim: "tk-anim-reveal-stretch", seq: "char" },
    { name: "Reveal Spread", group: "reveal", anim: "tk-anim-reveal-spread", seq: "char" }
  ];
  /* Category menu (play-button neighbour). "all" is always first. */
  var ANIM_CATEGORIES = [
    { id: "all", label: "All animations", labelBn: "সব animation" },
    { id: "pop", label: "Pop In", labelBn: "Pop In" },
    { id: "bounce", label: "Bounce", labelBn: "Bounce" },
    { id: "elastic", label: "Elastic", labelBn: "Elastic" },
    { id: "fade", label: "Fade", labelBn: "Fade" },
    { id: "slide", label: "Slide", labelBn: "Slide" },
    { id: "scale", label: "Scale", labelBn: "Scale" },
    { id: "rotate", label: "Rotate", labelBn: "Rotate" },
    { id: "blur", label: "Blur", labelBn: "Blur" },
    { id: "track", label: "Tracking", labelBn: "Tracking" },
    { id: "skew", label: "Skew", labelBn: "Skew" },
    { id: "wave", label: "Wave", labelBn: "Wave" },
    { id: "glitch", label: "Glitch", labelBn: "Glitch" },
    { id: "cinema", label: "Cinematic", labelBn: "Cinematic" },
    { id: "kinetic", label: "Kinetic", labelBn: "Kinetic" },
    { id: "reveal", label: "Reveal", labelBn: "Reveal" }
  ];
  var COLORS = [
    { name: "Ghost Cyan", css: "#00f0ff", glow: true },
    { name: "Neon Magenta", css: "#ff2bad", glow: true },
    { name: "Acid Green", css: "#74ff3d", glow: true },
    { name: "Molten Gold", css: "#ffc728", glow: true },
    { name: "Ice Blue", css: "#9ed9ff", glow: false },
    { name: "Blood Red", css: "#eb1f29", glow: true },
    { name: "Pure White", css: "#ffffff", glow: false },
    { name: "Deep Void", css: "#111114", glow: false, stroke: "#6b6b6b" },
    { name: "Sunset Pink", css: "#ff6b99", glow: true },
    { name: "Electric Purple", css: "#a659ff", glow: true },
    { name: "Solar Blaze", css: "#ff730d", glow: true },
    { name: "Holo Silver", css: "#e6eef5", glow: true, stroke: "#00f0ff" },
    { name: "Lavender Dream", css: "#b8bfff", glow: true },
    { name: "Radioactive Yellow", css: "#fce647", glow: true, stroke: "#854d0e" },
    { name: "Cyber Teal", css: "#2ed4bf", glow: true },
    { name: "Ember Orange", css: "#ff5921", glow: true },
    { name: "Deep Ocean", css: "#0d59bf", glow: true },
    { name: "Sky Cyan", css: "#59c7ff", glow: true },
    { name: "Mint Fresh", css: "#66f2bf", glow: true },
    { name: "Forest Green", css: "#218042", glow: false },
    { name: "Lime Punch", css: "#c7ff21", glow: true },
    { name: "Royal Blue", css: "#2680eb", glow: true },
    { name: "Indigo Night", css: "#4a38d9", glow: true },
    { name: "Violet Haze", css: "#8c4ce6", glow: true },
    { name: "Rose Gold", css: "#e8ad99", glow: false },
    { name: "Champagne", css: "#f5e6c2", glow: false },
    { name: "Bronze", css: "#a66e33", glow: false },
    { name: "Copper Glow", css: "#d97333", glow: true },
    { name: "Steel Grey", css: "#8c949e", glow: false },
    { name: "Graphite", css: "#33363b", glow: false, stroke: "#999999" },
    { name: "Charcoal Ink", css: "#1a1a1c", glow: false, stroke: "#ffffff" },
    { name: "Coral Reef", css: "#ff7061", glow: true },
    { name: "Peach Cream", css: "#ffd1ab", glow: false },
    { name: "Bubblegum", css: "#ff87cc", glow: true },
    { name: "Hot Crimson", css: "#db143d", glow: true },
    { name: "Wine Red", css: "#730f24", glow: false, stroke: "#e6808c" },
    { name: "Aqua Marine", css: "#00d9b3", glow: true },
    { name: "Sea Foam", css: "#a1edd9", glow: false },
    { name: "Sand Dune", css: "#d9bf8c", glow: false },
    { name: "Toxic Slime", css: "#9ef200", glow: true, stroke: "#1a4d00" },
    { name: "Plasma Pink", css: "#ff008c", glow: true },
    { name: "UV Purple", css: "#6b00ff", glow: true },
    { name: "Arctic White", css: "#f2faff", glow: true, stroke: "#59c7ff" },
    { name: "Matte Black", css: "#050505", glow: false, stroke: "#555555" },
    { name: "Gold Foil", css: "#d4b038", glow: true, stroke: "#66500d" },
    { name: "Chrome Blue", css: "#bfd9f2", glow: true, stroke: "#2666b3" },
    { name: "Retro Amber", css: "#ffb84d", glow: true },
    { name: "Cosmic Teal", css: "#0099a6", glow: true },
    { name: "Midnight Blue", css: "#17215c", glow: false, stroke: "#6699ff" }
  ];
  var EMOJI_GROUPS = [
    {
      id: "smileys",
      icon: "😀",
      label: "Smileys",
      labelBn: "হাসিমুখ",
      items: ["😀", "😃", "😄", "😁", "😆", "😅", "🤣", "😂", "🙂", "🙃", "🫠", "😉", "😊", "😇", "🥰", "😍", "🤩", "😘", "😗", "😚", "😙", "🥲", "😋", "😛", "😜", "🤪", "😝", "🤑", "🤗", "🤭", "🫢", "🤫", "🤔", "🫡", "🤐", "🤨", "😐", "😑", "😶", "🫥", "😏", "😒", "🙄", "😬", "🤥", "😌", "😔", "😪", "🤤", "😴", "😷", "🤒", "🤕", "🤢", "🤮", "🤧", "🥵", "🥶", "🥴", "😵", "🤯", "🤠", "🥳", "🥸", "😎", "🤓", "🧐", "😕", "🫤", "😟", "🙁", "😮", "😯", "😲", "😳", "🥺", "🥹", "😦", "😧", "😨", "😰", "😥", "😢", "😭", "😱", "😖", "😣", "😞", "😓", "😩", "😫", "🥱", "😤", "😡", "😠", "🤬", "😈", "👿", "💀", "☠️", "💩", "🤡", "👹", "👺", "👻", "👽", "👾", "🤖", "😺", "😸", "😹", "😻", "😼", "😽", "🙀", "😿", "😾"]
    },
    {
      id: "gestures",
      icon: "👍",
      label: "Gestures",
      labelBn: "অঙ্গভঙ্গি",
      items: ["👋", "🤚", "🖐️", "✋", "🖖", "🫱", "🫲", "🫳", "🫴", "👌", "🤌", "🤏", "✌️", "🤞", "🫰", "🤟", "🤘", "🤙", "👈", "👉", "👆", "🖕", "👇", "☝️", "🫵", "👍", "👎", "✊", "👊", "🤛", "🤜", "👏", "🙌", "🫶", "👐", "🤲", "🤝", "🙏", "✍️", "💅", "🤳", "💪", "🦾", "🦵", "🦿", "🦶", "👂", "🦻", "👃", "🧠", "🫀", "🫁", "🦷", "🦴", "👀", "👁️", "👅", "👄", "🫦"]
    },
    {
      id: "hearts",
      icon: "❤️",
      label: "Hearts",
      labelBn: "হৃদয়",
      items: ["❤️", "🧡", "💛", "💚", "💙", "💜", "🖤", "🤍", "🤎", "💔", "❤️‍🔥", "❤️‍🩹", "❣️", "💕", "💞", "💓", "💗", "💖", "💘", "💝", "💟", "♥️", "💌", "💋", "😻", "🥰", "😍", "😘"]
    },
    {
      id: "fx",
      icon: "✨",
      label: "FX & Motion",
      labelBn: "ইফেক্ট",
      items: ["⚡", "🔥", "✨", "💥", "💫", "🌟", "⭐", "🌠", "☄️", "💢", "💦", "💨", "🕳️", "💣", "🧨", "🎆", "🎇", "🪄", "🔮", "🧿", "🌀", "🌪️", "🌈", "☀️", "🌙", "🌡️", "❄️", "🫧", "🩸", "🌫️"]
    },
    {
      id: "ui",
      icon: "✅",
      label: "UI & Signs",
      labelBn: "সাইন",
      items: ["✅", "☑️", "✔️", "❌", "❎", "⭕", "🚫", "⚠️", "❓", "❔", "❗", "❕", "‼️", "⁉️", "➕", "➖", "✖️", "➗", "🟰", "♾️", "🔴", "🟠", "🟡", "🟢", "🔵", "🟣", "⚫", "⚪", "🟤", "🔺", "🔻", "🔸", "🔹", "🔶", "🔷", "🔳", "🔲", "▶️", "⏸️", "⏹️", "⏺️", "⏭️", "⏮️", "⏩", "⏪", "🔀", "🔁", "🔂", "🔄", "🔃", "🔔", "🔕", "🔒", "🔓", "🔑", "🗝️", "🔗", "📍", "📌", "🏷️"]
    },
    {
      id: "tech",
      icon: "💻",
      label: "Tech",
      labelBn: "টেক",
      items: ["💻", "🖥️", "🖨️", "⌨️", "🖱️", "💽", "💾", "💿", "📀", "🧮", "📱", "📲", "☎️", "📞", "📟", "📠", "🔌", "🔋", "🪫", "📡", "🛰️", "🌐", "🖲️", "🕹️", "🎮", "👾", "🤖", "⚙️", "🛠️", "🔧", "🔨", "⛏️", "🪛", "🔩", "🧰", "🧲", "🔬", "🔭", "🧪", "⚗️", "🧬", "💡", "🔦", "🪪", "🗜️"]
    },
    {
      id: "media",
      icon: "🎬",
      label: "Media",
      labelBn: "মিডিয়া",
      items: ["🎬", "🎥", "📽️", "🎞️", "📺", "📷", "📸", "📹", "📼", "🎙️", "🎚️", "🎛️", "🎤", "🎧", "🔊", "🔉", "🔈", "🔇", "📢", "📣", "🎵", "🎶", "🎼", "🎹", "🥁", "🎸", "🎺", "🎻", "🪕", "🎷", "🪗", "🎨", "🖌️", "🖍️", "✏️", "🖊️", "🖋️", "✂️", "📐", "📏"]
    },
    {
      id: "business",
      icon: "📈",
      label: "Business",
      labelBn: "ব্যবসা",
      items: ["📈", "📉", "📊", "💹", "💰", "💵", "💴", "💶", "💷", "💸", "💳", "🪙", "🧾", "🏦", "🏧", "💼", "📁", "📂", "🗂️", "📄", "📃", "📑", "📋", "📝", "🗒️", "🗓️", "📅", "📆", "⏳", "⌛", "⏰", "⏱️", "⏲️", "🕰️", "📬", "📮", "📦", "🔖", "📎", "🖇️"]
    },
    {
      id: "awards",
      icon: "🏆",
      label: "Awards",
      labelBn: "পুরস্কার",
      items: ["🏆", "🥇", "🥈", "🥉", "🏅", "🎖️", "👑", "💎", "🎯", "🎖", "🎗️", "🎫", "🎟️", "🎁", "🎉", "🎊", "🎈", "🪅", "🧧", "🕶️", "👔", "💍", "🔱", "⚜️", "🚀", "🛸", "🎪"]
    },
    {
      id: "nature",
      icon: "🌸",
      label: "Nature",
      labelBn: "প্রকৃতি",
      items: ["🌸", "💮", "🏵️", "🌹", "🥀", "🌺", "🌻", "🌼", "🌷", "🌱", "🪴", "🌲", "🌳", "🌴", "🌵", "🌾", "🌿", "☘️", "🍀", "🍁", "🍂", "🍃", "🪺", "🍄", "🌊", "🌋", "🏔️", "⛰️", "🏕️", "🏝️", "🌅", "🌄", "🌇", "🌆", "🌃", "🌌", "☁️", "⛅", "🌧️", "⛈️", "🌩️", "🌨️", "🌬️"]
    },
    {
      id: "animals",
      icon: "🐶",
      label: "Animals",
      labelBn: "প্রাণী",
      items: ["🐶", "🐱", "🐭", "🐹", "🐰", "🦊", "🐻", "🐼", "🐨", "🐯", "🦁", "🐮", "🐷", "🐸", "🐵", "🙈", "🙉", "🙊", "🐔", "🐧", "🐦", "🦅", "🦉", "🦇", "🐺", "🐗", "🐴", "🦄", "🐝", "🪲", "🦋", "🐌", "🐞", "🐢", "🐍", "🦕", "🐙", "🦑", "🦐", "🦀", "🐠", "🐟", "🐬", "🐳", "🦈", "🐊", "🐘", "🦒", "🦓", "🐫"]
    },
    {
      id: "food",
      icon: "🍔",
      label: "Food",
      labelBn: "খাবার",
      items: ["🍎", "🍏", "🍊", "🍋", "🍌", "🍉", "🍇", "🍓", "🫐", "🍒", "🍑", "🥭", "🍍", "🥥", "🥝", "🍅", "🥑", "🌽", "🌶️", "🥕", "🥔", "🍞", "🥐", "🥖", "🧀", "🥚", "🍳", "🥞", "🧇", "🥓", "🍔", "🍟", "🍕", "🌭", "🥪", "🌮", "🌯", "🥙", "🍜", "🍲", "🍛", "🍣", "🍱", "🍤", "🍚", "🍙", "🍢", "🍡", "🍧", "🍨", "🍦", "🍰", "🎂", "🧁", "🍩", "🍪", "🍫", "🍬", "🍭", "🍯", "🍿", "☕", "🍵", "🧃", "🥤", "🍺", "🍻", "🥂", "🍷", "🥃"]
    },
    {
      id: "travel",
      icon: "✈️",
      label: "Travel",
      labelBn: "ভ্রমণ",
      items: ["🚗", "🚕", "🚙", "🚌", "🚎", "🏎️", "🚓", "🚑", "🚒", "🚐", "🛻", "🚚", "🚛", "🚜", "🏍️", "🛵", "🚲", "🛴", "🚨", "🚔", "🚍", "🚝", "🚄", "🚅", "🚈", "🚂", "🚆", "✈️", "🛫", "🛬", "🛩️", "🚁", "🛸", "🚀", "🛰️", "⛵", "🚤", "🛥️", "🚢", "⚓", "🗺️", "🧭", "🏁", "🚦", "🚧", "🗽", "🗼", "🏰", "🕌", "🕍", "⛩️", "🏯"]
    },
    {
      id: "sports",
      icon: "⚽",
      label: "Sports",
      labelBn: "খেলা",
      items: ["⚽", "🏀", "🏈", "⚾", "🥎", "🎾", "🏐", "🏉", "🥏", "🎱", "🪀", "🏓", "🏸", "🏒", "🏑", "🥍", "🏏", "🪃", "🥅", "⛳", "🪁", "🏹", "🎣", "🤿", "🥊", "🥋", "🎽", "🛹", "🛼", "🛷", "⛸️", "🥌", "🎿", "⛷️", "🏂", "🏋️", "🤸", "🤺", "🤾", "🏌️", "🏇", "🧘", "🏄", "🏊", "🚴", "🚵", "🎖️", "🎲", "🧩", "♟️"]
    },
    {
      id: "flags",
      icon: "🏳️",
      label: "Flags",
      labelBn: "পতাকা",
      items: ["🏳️", "🏴", "🏁", "🚩", "🏳️‍🌈", "🇧🇩", "🇮🇳", "🇵🇰", "🇳🇵", "🇱🇰", "🇺🇸", "🇬🇧", "🇨🇦", "🇦🇺", "🇩🇪", "🇫🇷", "🇮🇹", "🇪🇸", "🇳🇱", "🇸🇪", "🇳🇴", "🇩🇰", "🇫🇮", "🇵🇱", "🇷🇺", "🇺🇦", "🇹🇷", "🇸🇦", "🇦🇪", "🇶🇦", "🇪🇬", "🇿🇦", "🇳🇬", "🇰🇪", "🇧🇷", "🇦🇷", "🇲🇽", "🇨🇳", "🇯🇵", "🇰🇷", "🇮🇩", "🇲🇾", "🇸🇬", "🇹🇭", "🇻🇳", "🇵🇭"]
    },
    {
      id: "symbols",
      icon: "★",
      label: "Symbols",
      labelBn: "প্রতীক",
      items: ["★", "☆", "✦", "✧", "❖", "◆", "◇", "●", "○", "■", "□", "▲", "▼", "◀", "▶", "➜", "➤", "➔", "⇒", "⇔", "«", "»", "†", "‡", "§", "¶", "©", "®", "™", "∞", "≠", "≈", "±", "÷", "×", "√", "∑", "∆", "π", "Ω", "µ", "λ", "α", "β", "γ", "θ", "°", "‰", "№", "℮", "⌘", "⌥", "⇧", "⌫", "⏎", "☑", "☒", "☯", "☮", "⚛", "⚜", "⚕", "⚖", "⚔", "⚑", "⌁", "⌬"]
    },
    {
      id: "bangla",
      icon: "৳",
      label: "Bangla",
      labelBn: "বাংলা",
      items: ["৳", "০", "১", "২", "৩", "৪", "৫", "৬", "৭", "৮", "৯", "।", "॥", "ঁ", "ঃ", "৺", "৻", "ৎ", "‍", "★", "✦", "❖"]
    }
  ];
  (function mergeEmojiData() {
    var data = window.GHOST_EMOJI_DATA;
    if (!data || !data.length) return;
    var generatedIds = {};
    data.forEach(function(g) {
      generatedIds[g.id] = 1;
    });
    var curated = EMOJI_GROUPS.filter(function(g) {
      return !generatedIds[g.id];
    });
    var merged = curated.concat(data);
    EMOJI_GROUPS.length = 0;
    merged.forEach(function(g) {
      EMOJI_GROUPS.push(g);
    });
  })();
  /* Curated "Premium" set — hand-picked, high-impact glyphs editors reach for
     first in title cards, reactions and thumbnails. Kept as the default folder. */
  EMOJI_GROUPS.unshift({
    id: "premium",
    icon: "\u2728",
    label: "Premium",
    labelBn: "প্রিমিয়াম",
    items: ["\u2728", "\uD83D\uDD25", "\uD83D\uDCAB", "\u2B50", "\uD83C\uDF1F", "\uD83D\uDC8E", "\uD83D\uDC51", "\uD83C\uDFC6", "\uD83E\uDD47", "\uD83C\uDF96\uFE0F", "\uD83D\uDCAF", "\u26A1", "\uD83D\uDE80", "\uD83C\uDFAF", "\uD83D\uDD1D", "\uD83D\uDCC8", "\uD83D\uDCB0", "\uD83D\uDCB8", "\uD83E\uDD11", "\uD83D\uDECD\uFE0F", "\uD83C\uDF89", "\uD83C\uDF8A", "\uD83E\uDD73", "\uD83C\uDF88", "\uD83C\uDF81", "\u2764\uFE0F", "\uD83E\uDDE1", "\uD83D\uDC9C", "\uD83D\uDC99", "\uD83D\uDDA4", "\uD83E\uDD0D", "\uD83D\uDC96", "\uD83D\uDC95", "\uD83D\uDC98", "\uD83D\uDE0D", "\uD83E\uDD70", "\uD83E\uDD29", "\uD83D\uDE0E", "\uD83E\uDD2F", "\uD83D\uDE31", "\uD83D\uDE02", "\uD83E\uDD23", "\uD83D\uDE0F", "\uD83E\uDD14", "\uD83D\uDC40", "\uD83D\uDC4D", "\uD83D\uDC4E", "\uD83D\uDC4F", "\uD83D\uDE4C", "\uD83D\uDCAA", "\uD83E\uDD1D", "\uD83D\uDC4C", "\u270C\uFE0F", "\uD83E\uDD1F", "\uD83D\uDC4B", "\uD83D\uDD14", "\uD83D\uDCE3", "\uD83D\uDCA1", "\uD83D\uDD0D", "\uD83D\uDD12", "\uD83E\uDDE9", "\uD83C\uDFAC", "\uD83C\uDFA5", "\uD83C\uDFA8", "\uD83C\uDFB5", "\uD83C\uDFA7", "\uD83C\uDFA4", "\uD83D\uDCF1", "\uD83D\uDCBB", "\uD83D\uDDA5\uFE0F", "\uD83D\uDCF8", "\uD83D\uDCBE", "\uD83E\uDDE0", "\uD83E\uDD16", "\uD83D\uDEE1\uFE0F", "\u2705", "\u274C", "\u2757", "\u2753", "\u27A1\uFE0F", "\u2B06\uFE0F", "\u2B07\uFE0F", "\uD83D\uDD25", "\uD83C\uDF08", "\u2600\uFE0F", "\uD83C\uDF19", "\u26A0\uFE0F", "\u267B\uFE0F", "\uD83D\uDD34", "\uD83D\uDFE1", "\uD83D\uDFE2", "\uD83D\uDD35", "\uD83D\uDFE3", "\u26AB", "\u26AA"],
    names: ["sparkles", "fire", "dizzy", "star", "glowing star", "gem", "crown", "trophy", "gold medal", "medal", "hundred", "high voltage", "rocket", "target", "top", "chart up", "money bag", "money wings", "money face", "shopping", "party popper", "confetti", "partying face", "balloon", "gift", "red heart", "orange heart", "purple heart", "blue heart", "black heart", "white heart", "sparkling heart", "two hearts", "heart with arrow", "heart eyes", "smiling with hearts", "star struck", "cool", "mind blown", "screaming", "tears of joy", "rofl", "smirk", "thinking", "eyes", "thumbs up", "thumbs down", "clap", "raised hands", "muscle", "handshake", "ok hand", "victory", "love you", "wave", "bell", "megaphone", "bulb", "search", "lock", "puzzle", "clapper", "camera movie", "art", "music", "headphone", "mic", "phone", "laptop", "desktop", "camera", "floppy", "brain", "robot", "shield", "check", "cross", "exclamation", "question", "right arrow", "up arrow", "down arrow", "flame", "rainbow", "sun", "moon", "warning", "recycle", "red circle", "yellow circle", "green circle", "blue circle", "purple circle", "black circle", "white circle"]
  });

  var EMOJIS = (function() {
    var out = [], seen = {};
    for (var g = 0; g < EMOJI_GROUPS.length; g += 1) {
      var it = EMOJI_GROUPS[g].items;
      for (var i = 0; i < it.length; i += 1) {
        if (!seen[it[i]]) {
          seen[it[i]] = 1;
          out.push(it[i]);
        }
      }
    }
    return out;
  })();
  var EXPRESSIONS = [
    { name: "Bounce", desc: "Impact effect.", target: "Position", code: "amp=.12; freq=2.6; decay=5.0;\nn=0;\nif (numKeys>0){ n=nearestKey(time).index; if (key(n).time>time) n--; }\nif (n>0){ t=time-key(n).time; v=velocityAtTime(key(n).time-.001); value+v*amp*Math.sin(freq*t*2*Math.PI)/Math.exp(decay*t); } else value;" },
    { name: "Wiggle", desc: "Organic oscillation.", target: "Position", code: "wiggle(2,15);" },
    { name: "Rotation", desc: "Smooth rotation.", target: "Rotation", code: "time * 60;" },
    { name: "Pulse", desc: "Scaling heartbeat.", target: "Scale", code: "amp=8; freq=1;\nvalue + [amp,amp]*Math.sin(time*freq*2*Math.PI);" },
    { name: "Loop Out", target: "Position", code: 'loopOut("cycle");' },
    { name: "Auto Fade", target: "Opacity", code: "fadeIn=0.5; fadeOut=0.5;\nlinear(time, inPoint, inPoint+fadeIn, 0, 100) - linear(time, outPoint-fadeOut, outPoint, 0, 100);" },
    { name: "Pendulum Rotate", target: "Rotation", code: "amp=15; freq=1.2; decay=1.5;\namp*Math.sin(freq*time*2*Math.PI)/Math.exp(decay*time*0.2);" },
    { name: "Breathing Scale", target: "Scale", code: "amp=4; freq=0.8;\nvalue + amp*Math.sin(freq*time*2*Math.PI);" },
    { name: "Typewriter", target: "Text", code: 'speed=25;\ncursor="|";\nnumChars=Math.floor(time*speed);\ntext.sourceText.substr(0,numChars)+cursor;' },
    { name: "Counter $", target: "Text", code: 'val = effect("Slider Control")("Slider");\n"$" + val.toFixed(0).replace(/\\B(?=(\\d{3})+(?!\\d))/g, ",");' },
    { name: "Counter %", target: "Text", code: 'v = effect("Slider Control")("Slider");\nMath.round(v) + "%";' },
    { name: "Hacker Decrypt", target: "Text", code: 'chars="ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";\nsrc=text.sourceText;\nshown=Math.floor(time*18);\nres="";\nfor(i=0;i<src.length;i++){ res += (i<shown) ? src[i] : chars[Math.floor(random(0,chars.length))]; }\nres;' },
    { name: "Word Reveal", target: "Text", code: 'words = text.sourceText.split(" ");\ncount = Math.floor(time*3);\nwords.slice(0,count).join(" ");' },
    { name: "Random Flicker", target: "Opacity", code: "seedRandom(index,true);\nrandom(40,100);" }
  ];
  EXPRESSIONS.push.apply(EXPRESSIONS, [
    {
      "name": "Wiggle 2/10",
      "target": "Position",
      "code": "wiggle(2,10);"
    },
    {
      "name": "Wiggle 2/20",
      "target": "Position",
      "code": "wiggle(2,20);"
    },
    {
      "name": "Wiggle 3/30",
      "target": "Position",
      "code": "wiggle(3,30);"
    },
    {
      "name": "Wiggle 1/8",
      "target": "Position",
      "code": "wiggle(1,8);"
    },
    {
      "name": "Wiggle 5/40",
      "target": "Position",
      "code": "wiggle(5,40);"
    },
    {
      "name": "Wiggle 0.5/6",
      "target": "Position",
      "code": "wiggle(0.5,6);"
    },
    {
      "name": "Wiggle 4/60",
      "target": "Position",
      "code": "wiggle(4,60);"
    },
    {
      "name": "Wiggle 1.5/14",
      "target": "Position",
      "code": "wiggle(1.5,14);"
    },
    {
      "name": "Scale Wiggle 1/4",
      "target": "Scale",
      "code": "wiggle(1,4);"
    },
    {
      "name": "Scale Wiggle 2/8",
      "target": "Scale",
      "code": "wiggle(2,8);"
    },
    {
      "name": "Scale Wiggle 3/12",
      "target": "Scale",
      "code": "wiggle(3,12);"
    },
    {
      "name": "Scale Wiggle 0.5/3",
      "target": "Scale",
      "code": "wiggle(0.5,3);"
    },
    {
      "name": "Rotate Wiggle 1/5",
      "target": "Rotation",
      "code": "wiggle(1,5);"
    },
    {
      "name": "Rotate Wiggle 2/12",
      "target": "Rotation",
      "code": "wiggle(2,12);"
    },
    {
      "name": "Rotate Wiggle 4/25",
      "target": "Rotation",
      "code": "wiggle(4,25);"
    },
    {
      "name": "Loop Out cycle",
      "target": "Position",
      "code": 'loopOut("cycle");'
    },
    {
      "name": "Loop In cycle",
      "target": "Position",
      "code": 'loopIn("cycle");'
    },
    {
      "name": "Scale Loop cycle",
      "target": "Scale",
      "code": 'loopOut("cycle");'
    },
    {
      "name": "Rotate Loop cycle",
      "target": "Rotation",
      "code": 'loopOut("cycle");'
    },
    {
      "name": "Loop Out pingpong",
      "target": "Position",
      "code": 'loopOut("pingpong");'
    },
    {
      "name": "Loop In pingpong",
      "target": "Position",
      "code": 'loopIn("pingpong");'
    },
    {
      "name": "Scale Loop pingpong",
      "target": "Scale",
      "code": 'loopOut("pingpong");'
    },
    {
      "name": "Rotate Loop pingpong",
      "target": "Rotation",
      "code": 'loopOut("pingpong");'
    },
    {
      "name": "Loop Out offset",
      "target": "Position",
      "code": 'loopOut("offset");'
    },
    {
      "name": "Loop In offset",
      "target": "Position",
      "code": 'loopIn("offset");'
    },
    {
      "name": "Scale Loop offset",
      "target": "Scale",
      "code": 'loopOut("offset");'
    },
    {
      "name": "Rotate Loop offset",
      "target": "Rotation",
      "code": 'loopOut("offset");'
    },
    {
      "name": "Loop Out continue",
      "target": "Position",
      "code": 'loopOut("continue");'
    },
    {
      "name": "Loop In continue",
      "target": "Position",
      "code": 'loopIn("continue");'
    },
    {
      "name": "Scale Loop continue",
      "target": "Scale",
      "code": 'loopOut("continue");'
    },
    {
      "name": "Rotate Loop continue",
      "target": "Rotation",
      "code": 'loopOut("continue");'
    },
    {
      "name": "Auto Fade 0.2s/0.2s",
      "target": "Opacity",
      "code": "fi=0.2; fo=0.2;\nlinear(time, inPoint, inPoint+fi, 0, 100) - linear(time, outPoint-fo, outPoint, 0, 100);"
    },
    {
      "name": "Auto Fade 0.5s/0.5s",
      "target": "Opacity",
      "code": "fi=0.5; fo=0.5;\nlinear(time, inPoint, inPoint+fi, 0, 100) - linear(time, outPoint-fo, outPoint, 0, 100);"
    },
    {
      "name": "Auto Fade 1s/1s",
      "target": "Opacity",
      "code": "fi=1; fo=1;\nlinear(time, inPoint, inPoint+fi, 0, 100) - linear(time, outPoint-fo, outPoint, 0, 100);"
    },
    {
      "name": "Auto Fade 0.3s/1.2s",
      "target": "Opacity",
      "code": "fi=0.3; fo=1.2;\nlinear(time, inPoint, inPoint+fi, 0, 100) - linear(time, outPoint-fo, outPoint, 0, 100);"
    },
    {
      "name": "Bounce Key 0.08",
      "target": "Position",
      "code": "amp=0.08; freq=2; decay=4;\nn=0;\nif (numKeys>0){ n=nearestKey(time).index; if (key(n).time>time) n--; }\nif (n>0){ t=time-key(n).time; v=velocityAtTime(key(n).time-.001); value+v*amp*Math.sin(freq*t*2*Math.PI)/Math.exp(decay*t); } else value;"
    },
    {
      "name": "Bounce Key 0.12",
      "target": "Position",
      "code": "amp=0.12; freq=2.6; decay=5;\nn=0;\nif (numKeys>0){ n=nearestKey(time).index; if (key(n).time>time) n--; }\nif (n>0){ t=time-key(n).time; v=velocityAtTime(key(n).time-.001); value+v*amp*Math.sin(freq*t*2*Math.PI)/Math.exp(decay*t); } else value;"
    },
    {
      "name": "Bounce Key 0.2",
      "target": "Position",
      "code": "amp=0.2; freq=3.2; decay=6;\nn=0;\nif (numKeys>0){ n=nearestKey(time).index; if (key(n).time>time) n--; }\nif (n>0){ t=time-key(n).time; v=velocityAtTime(key(n).time-.001); value+v*amp*Math.sin(freq*t*2*Math.PI)/Math.exp(decay*t); } else value;"
    },
    {
      "name": "Bounce Key 0.3",
      "target": "Position",
      "code": "amp=0.3; freq=1.8; decay=3;\nn=0;\nif (numKeys>0){ n=nearestKey(time).index; if (key(n).time>time) n--; }\nif (n>0){ t=time-key(n).time; v=velocityAtTime(key(n).time-.001); value+v*amp*Math.sin(freq*t*2*Math.PI)/Math.exp(decay*t); } else value;"
    },
    {
      "name": "Breathe 3/0.8",
      "target": "Scale",
      "code": "amp=3; freq=0.8;\nvalue + amp*Math.sin(freq*time*2*Math.PI);"
    },
    {
      "name": "Breathe 6/1.2",
      "target": "Scale",
      "code": "amp=6; freq=1.2;\nvalue + amp*Math.sin(freq*time*2*Math.PI);"
    },
    {
      "name": "Breathe 10/0.5",
      "target": "Scale",
      "code": "amp=10; freq=0.5;\nvalue + amp*Math.sin(freq*time*2*Math.PI);"
    },
    {
      "name": "Breathe 2/2",
      "target": "Scale",
      "code": "amp=2; freq=2;\nvalue + amp*Math.sin(freq*time*2*Math.PI);"
    },
    {
      "name": "Pendulum 8deg",
      "target": "Rotation",
      "code": "amp=8; freq=1; decay=1.5;\namp*Math.sin(freq*time*2*Math.PI)/Math.exp(decay*time*0.2);"
    },
    {
      "name": "Pendulum 15deg",
      "target": "Rotation",
      "code": "amp=15; freq=1.2; decay=1.5;\namp*Math.sin(freq*time*2*Math.PI)/Math.exp(decay*time*0.2);"
    },
    {
      "name": "Pendulum 25deg",
      "target": "Rotation",
      "code": "amp=25; freq=0.6; decay=1.5;\namp*Math.sin(freq*time*2*Math.PI)/Math.exp(decay*time*0.2);"
    },
    {
      "name": "Spin 10/sec",
      "target": "Rotation",
      "code": "time*10;"
    },
    {
      "name": "Spin 30/sec",
      "target": "Rotation",
      "code": "time*30;"
    },
    {
      "name": "Spin 60/sec",
      "target": "Rotation",
      "code": "time*60;"
    },
    {
      "name": "Spin 120/sec",
      "target": "Rotation",
      "code": "time*120;"
    },
    {
      "name": "Spin 360/sec",
      "target": "Rotation",
      "code": "time*360;"
    },
    {
      "name": "Float Y 6px",
      "target": "Position",
      "code": "amp=6; freq=0.4;\n[value[0], value[1] + amp*Math.sin(freq*time*2*Math.PI)];"
    },
    {
      "name": "Float Y 20px",
      "target": "Position",
      "code": "amp=20; freq=0.7;\n[value[0], value[1] + amp*Math.sin(freq*time*2*Math.PI)];"
    },
    {
      "name": "Float Y 45px",
      "target": "Position",
      "code": "amp=45; freq=1;\n[value[0], value[1] + amp*Math.sin(freq*time*2*Math.PI)];"
    },
    {
      "name": "Float X 6px",
      "target": "Position",
      "code": "amp=6; freq=0.5;\n[value[0] + amp*Math.sin(freq*time*2*Math.PI), value[1]];"
    },
    {
      "name": "Float X 20px",
      "target": "Position",
      "code": "amp=20; freq=1;\n[value[0] + amp*Math.sin(freq*time*2*Math.PI), value[1]];"
    },
    {
      "name": "Float X 40px",
      "target": "Position",
      "code": "amp=40; freq=2;\n[value[0] + amp*Math.sin(freq*time*2*Math.PI), value[1]];"
    },
    {
      "name": "Shake 10",
      "target": "Position",
      "code": "seedRandom(index,true);\nwiggle(24,10);"
    },
    {
      "name": "Shake 25",
      "target": "Position",
      "code": "seedRandom(index,true);\nwiggle(24,25);"
    },
    {
      "name": "Shake 50",
      "target": "Position",
      "code": "seedRandom(index,true);\nwiggle(24,50);"
    },
    {
      "name": "Flicker 40-100",
      "target": "Opacity",
      "code": "seedRandom(index,true);\nrandom(40,100);"
    },
    {
      "name": "Flicker 0-100",
      "target": "Opacity",
      "code": "seedRandom(index,true);\nrandom(0,100);"
    },
    {
      "name": "Flicker 70-100",
      "target": "Opacity",
      "code": "seedRandom(index,true);\nrandom(70,100);"
    },
    {
      "name": "Typewriter 15cps",
      "target": "Text",
      "code": "speed=15;\nnumChars=Math.floor(time*speed);\ntext.sourceText.substr(0,numChars);"
    },
    {
      "name": "Typewriter 25cps",
      "target": "Text",
      "code": "speed=25;\nnumChars=Math.floor(time*speed);\ntext.sourceText.substr(0,numChars);"
    },
    {
      "name": "Typewriter 40cps",
      "target": "Text",
      "code": "speed=40;\nnumChars=Math.floor(time*speed);\ntext.sourceText.substr(0,numChars);"
    },
    {
      "name": "Typewriter 60cps",
      "target": "Text",
      "code": "speed=60;\nnumChars=Math.floor(time*speed);\ntext.sourceText.substr(0,numChars);"
    },
    {
      "name": "Typewriter Cursor 15",
      "target": "Text",
      "code": 'speed=15;\nn=Math.floor(time*speed);\ntext.sourceText.substr(0,n)+((Math.floor(time*4)%2)?"|":"");'
    },
    {
      "name": "Typewriter Cursor 30",
      "target": "Text",
      "code": 'speed=30;\nn=Math.floor(time*speed);\ntext.sourceText.substr(0,n)+((Math.floor(time*4)%2)?"|":"");'
    },
    {
      "name": "Word Reveal 2/sec",
      "target": "Text",
      "code": 'w = text.sourceText.split(" ");\nc = Math.floor(time*2);\nw.slice(0,c).join(" ");'
    },
    {
      "name": "Word Reveal 4/sec",
      "target": "Text",
      "code": 'w = text.sourceText.split(" ");\nc = Math.floor(time*4);\nw.slice(0,c).join(" ");'
    },
    {
      "name": "Word Reveal 6/sec",
      "target": "Text",
      "code": 'w = text.sourceText.split(" ");\nc = Math.floor(time*6);\nw.slice(0,c).join(" ");'
    },
    {
      "name": "Counter Integer",
      "target": "Text",
      "code": 'v = effect("Slider Control")("Slider");\nv.toFixed(0);'
    },
    {
      "name": "Counter 1 decimal",
      "target": "Text",
      "code": 'v = effect("Slider Control")("Slider");\nv.toFixed(1);'
    },
    {
      "name": "Counter 2 decimals",
      "target": "Text",
      "code": 'v = effect("Slider Control")("Slider");\nv.toFixed(2);'
    },
    {
      "name": "Counter Comma",
      "target": "Text",
      "code": 'v = effect("Slider Control")("Slider");\nv.toFixed(0).replace(/\\B(?=(\\d{3})+(?!\\d))/g, ",");'
    },
    {
      "name": "Counter Percent",
      "target": "Text",
      "code": 'v = effect("Slider Control")("Slider");\nMath.round(v) + "%";'
    },
    {
      "name": "Counter Taka",
      "target": "Text",
      "code": 'v = effect("Slider Control")("Slider");\n"৳ " + v.toFixed(0).replace(/\\B(?=(\\d{3})+(?!\\d))/g, ",");'
    },
    {
      "name": "Counter Dollar",
      "target": "Text",
      "code": 'v = effect("Slider Control")("Slider");\n"$" + v.toFixed(0).replace(/\\B(?=(\\d{3})+(?!\\d))/g, ",");'
    },
    {
      "name": "Counter K/M",
      "target": "Text",
      "code": 'v = effect("Slider Control")("Slider");\nv>=1000000 ? (v/1000000).toFixed(1)+"M" : v>=1000 ? (v/1000).toFixed(1)+"K" : Math.round(v)+"";'
    },
    {
      "name": "Timecode mm:ss",
      "target": "Text",
      "code": 't=Math.max(0,time);\nm=Math.floor(t/60); s=Math.floor(t%60);\n(m<10?"0":"")+m+":"+(s<10?"0":"")+s;'
    },
    {
      "name": "Countdown 10s",
      "target": "Text",
      "code": 't=Math.max(0, 10-(time-inPoint));\nMath.ceil(t)+"";'
    },
    {
      "name": "Uppercase Source",
      "target": "Text",
      "code": "text.sourceText.toUpperCase();"
    },
    {
      "name": "Layer Name Text",
      "target": "Text",
      "code": "thisLayer.name;"
    },
    {
      "name": "Comp Name Text",
      "target": "Text",
      "code": "thisComp.name;"
    },
    {
      "name": "Today Date",
      "target": "Text",
      "code": 'd = new Date();\nd.getDate()+"/"+(d.getMonth()+1)+"/"+d.getFullYear();'
    },
    {
      "name": "Hacker Decrypt",
      "target": "Text",
      "code": 'chars="ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%";\nsrc=text.sourceText;\nshown=Math.floor(time*18);\nres="";\nfor(i=0;i<src.length;i++){ res += (i<shown) ? src[i] : chars[Math.floor(random(0,chars.length))]; }\nres;'
    },
    {
      "name": "Bangla Digits",
      "target": "Text",
      "code": 'en="0123456789"; bn="০১২৩৪৫৬৭৮৯";\ns=text.sourceText; r="";\nfor(i=0;i<s.length;i++){ k=en.indexOf(s[i]); r += (k>-1)? bn[k] : s[i]; }\nr;'
    },
    {
      "name": "Inertia Smooth",
      "target": "Position",
      "code": "amp=0.05; freq=3; decay=6;\nn=0;\nif (numKeys>0){ n=nearestKey(time).index; if (key(n).time>time) n--; }\nif (n>0){ t=time-key(n).time; v=velocityAtTime(key(n).time-.001); value+v*amp*Math.sin(freq*t*2*Math.PI)/Math.exp(decay*t); } else value;"
    },
    {
      "name": "Inertia Heavy",
      "target": "Position",
      "code": "amp=0.25; freq=3; decay=3;\nn=0;\nif (numKeys>0){ n=nearestKey(time).index; if (key(n).time>time) n--; }\nif (n>0){ t=time-key(n).time; v=velocityAtTime(key(n).time-.001); value+v*amp*Math.sin(freq*t*2*Math.PI)/Math.exp(decay*t); } else value;"
    },
    {
      "name": "Smooth Position",
      "target": "Position",
      "code": "smooth(0.4, 8);"
    },
    {
      "name": "Smooth Scale",
      "target": "Scale",
      "code": "smooth(0.4, 8);"
    },
    {
      "name": "Smooth Rotation",
      "target": "Rotation",
      "code": "smooth(0.4, 8);"
    },
    {
      "name": "Time Remap Loop",
      "target": "Opacity",
      "code": 'loopOut("cycle");'
    },
    {
      "name": "Blink 2/sec",
      "target": "Opacity",
      "code": "(Math.floor(time*2)%2)*100;"
    },
    {
      "name": "Blink 5/sec",
      "target": "Opacity",
      "code": "(Math.floor(time*5)%2)*100;"
    },
    {
      "name": "Pulse Opacity",
      "target": "Opacity",
      "code": "50 + 50*Math.sin(time*2*Math.PI);"
    },
    {
      "name": "Fade On Screen",
      "target": "Opacity",
      "code": "linear(time, inPoint, inPoint+0.4, 0, 100);"
    },
    {
      "name": "Pop Scale In",
      "target": "Scale",
      "code": "s=linear(time, inPoint, inPoint+0.3, 0, 100);\n[s,s];"
    },
    {
      "name": "Elastic Scale In",
      "target": "Scale",
      "code": "t=time-inPoint;\nk = t<0 ? 0 : 100 - 100*Math.cos(t*14)/Math.exp(t*6);\n[k,k];"
    },
    {
      "name": "Random Position Grid",
      "target": "Position",
      "code": "seedRandom(index,true);\n[value[0]+random(-40,40), value[1]+random(-40,40)];"
    },
    {
      "name": "Stagger By Index",
      "target": "Position",
      "code": "d = index*0.06;\nt = time - d;\ny = value[1] + linear(t, inPoint, inPoint+0.5, 80, 0);\n[value[0], y];"
    },
    {
      "name": "Anchor To Centre",
      "target": "Position",
      "code": "[thisComp.width/2, thisComp.height/2];"
    },
    {
      "name": "Follow Mouse-less Null",
      "target": "Position",
      "code": 'try{ thisComp.layer("CONTROL").transform.position }catch(e){ value }'
    }
  ]);
  (function addDistinctExpressionPack() {
    var levels = ["Soft", "Light", "Medium", "Strong", "Extreme"];
    var families = [
      { name: "Orbit Position", target: "Position", desc: "Circular position orbit.", code: function(v2) {
        return "r=" + 12 * v2 + "; s=" + 0.25 * v2 + ";\\nvalue+[Math.cos(time*s*6.283)*r,Math.sin(time*s*6.283)*r];";
      } },
      { name: "Figure Eight", target: "Position", desc: "Figure-eight travel path.", code: function(v2) {
        return "r=" + 10 * v2 + "; s=" + 0.18 * v2 + ";\\nvalue+[Math.sin(time*s*6.283)*r,Math.sin(time*s*12.566)*r/2];";
      } },
      { name: "Horizontal Wave", target: "Position", desc: "Side-to-side movement.", code: function(v2) {
        return "a=" + 8 * v2 + "; f=" + 0.35 * v2 + ";\\nvalue+[Math.sin(time*f*6.283)*a,0];";
      } },
      { name: "Vertical Wave", target: "Position", desc: "Up-and-down movement.", code: function(v2) {
        return "a=" + 8 * v2 + "; f=" + 0.35 * v2 + ";\\nvalue+[0,Math.sin(time*f*6.283)*a];";
      } },
      { name: "Noise Drift", target: "Position", desc: "Slow organic drifting.", code: function(v2) {
        return "seedRandom(index,true);\\na=" + 4 * v2 + "; f=" + 0.12 * v2 + ";\\nvalue+[noise(time*f)*a,noise((time+10)*f)*a];";
      } },
      { name: "Breathing Scale", target: "Scale", desc: "Even scale breathing.", code: function(v2) {
        return "a=" + 1.5 * v2 + "; f=" + 0.3 * v2 + ";\\nvalue+[a,a]*Math.sin(time*f*6.283);";
      } },
      { name: "Scale Pop", target: "Scale", desc: "Quick repeating scale pop.", code: function(v2) {
        return "a=" + 2 * v2 + "; f=" + 0.6 * v2 + ";\\np=Math.pow(Math.max(0,Math.sin(time*f*6.283)),3)*a;\\nvalue+[p,p];";
      } },
      { name: "Scale Ping", target: "Scale", desc: "Sharp scale ping.", code: function(v2) {
        return "a=" + 2 * v2 + "; f=" + 0.45 * v2 + ";\\np=(Math.sin(time*f*6.283)+1)*a;\\nvalue+[p,p];";
      } },
      { name: "Vertical Scale Wave", target: "Scale", desc: "Height-only scale wave.", code: function(v2) {
        return "a=" + 2 * v2 + "; f=" + 0.4 * v2 + ";\\nvalue+[0,Math.sin(time*f*6.283)*a];";
      } },
      { name: "Constant Spin", target: "Rotation", desc: "Continuous rotation.", code: function(v2) {
        return "time*" + 12 * v2 + ";";
      } },
      { name: "Rotation Swing", target: "Rotation", desc: "Smooth swinging rotation.", code: function(v2) {
        return "a=" + 3 * v2 + "; f=" + 0.3 * v2 + ";\\nvalue+a*Math.sin(time*f*6.283);";
      } },
      { name: "Rotation Tick", target: "Rotation", desc: "Stepped clock-like rotation.", code: function(v2) {
        return "step=" + 3 * v2 + "; rate=" + v2 + ";\\nvalue+Math.floor(time*rate)*step;";
      } },
      { name: "Rotation Jitter", target: "Rotation", desc: "Organic rotation jitter.", code: function(v2) {
        return "seedRandom(Math.floor(time*" + v2 + "),true);\\nvalue+random(-" + 2 * v2 + "," + 2 * v2 + ");";
      } },
      { name: "Opacity Pulse", target: "Opacity", desc: "Smooth opacity pulse.", code: function(v2) {
        return "low=" + (50 - v2 * 5) + "; f=" + 0.25 * v2 + ";\\nlinear(Math.sin(time*f*6.283),-1,1,low,100);";
      } },
      { name: "Opacity Blink", target: "Opacity", desc: "Rhythmic hard blink.", code: function(v2) {
        return "f=" + 0.35 * v2 + ";\\nMath.sin(time*f*6.283)>0 ? 100 : " + 15 * v2 + ";";
      } },
      { name: "Opacity Flicker", target: "Opacity", desc: "Random held flicker.", code: function(v2) {
        return "seedRandom(Math.floor(time*" + 2 * v2 + "),true);\\nrandom(" + 20 * v2 + ",100);";
      } },
      { name: "Opacity Ramp", target: "Opacity", desc: "Repeating opacity ramp.", code: function(v2) {
        return "f=" + 0.2 * v2 + ";\\nlinear((time*f)%1,0,1," + 10 * v2 + ",100);";
      } },
      { name: "Timecode Text", target: "Text", desc: "Live composition timecode.", code: function(v2) {
        return "t=Math.max(0,time*" + v2 + ');\\nm=Math.floor(t/60); s=Math.floor(t%60);\\n(m<10?\\"0\\":\\"\\")+m+\\":\\"+(s<10?\\"0\\":\\"\\")+s;';
      } },
      { name: "Frame Counter", target: "Text", desc: "Live frame-number counter.", code: function(v2) {
        return "Math.floor(time/thisComp.frameDuration*" + v2 + ");";
      } },
      { name: "Text Reveal Random", target: "Text", desc: "Random-order text reveal.", code: function(v2) {
        return "seedRandom(index,true);\\nsrc=text.sourceText.toString(); n=Math.floor(time*" + 4 * v2 + ');\\nout=\\"\\"; for(i=0;i<src.length;i++){out+=(random()*src.length<n)?src[i]:\\" \\";} out;';
      } }
    ];
    var f, v;
    for (f = 0; f < families.length; f += 1) {
      for (v = 1; v <= 5; v += 1) {
        EXPRESSIONS.push({
          name: families[f].name + " — " + levels[v - 1],
          desc: families[f].desc,
          target: families[f].target,
          code: families[f].code(v)
        });
      }
    }
  })();
  function byId(id) {
    return document.getElementById(id);
  }
  function setStatus(text, cls) {
    if (!statusEl) return;
    statusEl.textContent = text;
    statusEl.className = "tools-status " + (cls || "");
  }
  function setInline(id, text, cls) {
    var el = byId(id);
    if (!el) return;
    el.textContent = text || "";
    el.className = "tool-inline-status " + (cls || "");
    el.hidden = !text;
  }
  function toast(text, cls) {
    if (!toastRegion) return;
    var node = document.createElement("div");
    node.className = "toast " + (cls || "");
    node.textContent = text;
    toastRegion.appendChild(node);
    setTimeout(function() {
      node.style.transition = "opacity .3s";
      node.style.opacity = "0";
      setTimeout(function() {
        if (node.parentNode) node.parentNode.removeChild(node);
      }, 300);
    }, 2400);
  }
  function evalScript(script) {
    return new Promise(function(resolve, reject) {
      if (!cs) return reject(new Error("CEP bridge unavailable"));
      try {
        cs.evalScript(script, function(result) {
          var raw = result == null ? "" : String(result);
          if (raw === "" || raw === "undefined" || raw === "null") {
            return reject(new Error("GHOST host script is not loaded — restart After Effects."));
          }
          if (raw.indexOf("EvalScript error") === 0) return reject(new Error(raw));
          try {
            resolve(JSON.parse(raw));
          } catch (e) {
            reject(new Error("Unexpected host reply: " + raw.slice(0, 160)));
          }
        });
      } catch (err) {
        reject(err);
      }
    });
  }
  var hostReloadPromise = null;
  function hostScriptPath() {
    if (!cs || !cs.getSystemPath) return "";
    try {
      var root = cs.getSystemPath("extension");
      return root ? String(root).replace(/\\/g, "/") + "/js/host.jsx" : "";
    } catch (e) {
      return "";
    }
  }
  function ensureHostScript() {
    var path = hostScriptPath();
    if (!path) return Promise.reject(new Error("Ghostae Text must be opened inside After Effects."));
    if (hostReloadPromise) return hostReloadPromise;
    var expected = window.GHOST_BUILD && window.GHOST_BUILD.version ? String(window.GHOST_BUILD.version) : "";
    hostReloadPromise = new Promise(function(resolve, reject) {
      var probe = 'typeof GhostHost !== "undefined" && GhostHost.toolkitHostBuild ? GhostHost.toolkitHostBuild() : "__GHOST_MISSING__"';
      cs.evalScript(probe, function(result) {
        var rawProbe = String(result == null ? "" : result);
        var usable = rawProbe !== "__GHOST_MISSING__" && rawProbe.indexOf("EvalScript error") !== 0;
        var stale = expected && usable && rawProbe.indexOf('"version":"' + expected + '"') === -1;
        if (usable && !stale) {
          hostReloadPromise = null;
          return resolve();
        }
        var load = '$.evalFile(new File("' + esc(path) + '")); typeof GhostHost !== "undefined" && GhostHost.toolkitHostBuild ? GhostHost.toolkitHostBuild() : "__GHOST_LOAD_FAILED__"';
        cs.evalScript(load, function(loaded) {
          hostReloadPromise = null;
          var raw = String(loaded == null ? "" : loaded);
          if (raw === "__GHOST_LOAD_FAILED__" || raw.indexOf("EvalScript error") === 0) {
            return reject(new Error("Ghostae Text host script could not load: " + raw));
          }
          if (expected && raw.indexOf('"version":"' + expected + '"') === -1) {
            return reject(new Error("Ghostae Text host build is incompatible with this panel."));
          }
          resolve();
        });
      });
    });
    return hostReloadPromise;
  }
  function esc(value) {
    return String(value).replace(/\\/g, "\\\\").replace(/"/g, '\\"');
  }
  function call(fn, args) {
    var parts = (args || []).map(function(a) {
      return '"' + esc(a) + '"';
    });
    var expression = "GhostHost." + fn + "(" + parts.join(",") + ")";
    return ensureHostScript().then(function() {
      return evalScript(expression);
    });
  }
  function reportResult(statusId, result, okText) {
    if (result && result.ok) {
      setInline(statusId, okText, "ok");
      toast(okText, "ok");
    } else {
      var message = result && result.error ? result.error : "Failed.";
      setInline(statusId, message, "error");
      toast(message, "error");
    }
  }
  var LANGUAGES = [
    {
      id: "en",
      flag: "🇺🇸",
      label: "English",
      word: "TEXT",
      words: ["MAKE", "IT", "POP"],
      phrases: ["MAKE IT POP", "BOLD MOVE", "GO BIG", "STAY SHARP", "NEW DROP", "PURE VIBE", "LOUD & CLEAR", "NEXT LEVEL", "SHINE ON", "HEADLINE", "STUDIO", "PRIME TIME"],
      font: "'SF Pro Display','Segoe UI',Inter,Arial,sans-serif"
    },
    {
      id: "bn",
      flag: "🇧🇩",
      label: "বাংলা",
      word: "বাংলা",
      words: ["দারুণ", "লেখা"],
      phrases: ["দারুণ লেখা", "নতুন শুরু", "সাহসী মন", "আলো ছড়াও", "স্বপ্ন বড়", "চলো এগিয়ে", "রঙিন দিন", "মন খুলে", "গল্প বলো", "শিরোনাম", "সেরা কাজ", "ভালোবাসা"],
      font: "'Li Ador Noirrit','Noto Sans Bengali','Nirmala UI','Vrinda',sans-serif"
    },
    {
      id: "hi",
      flag: "🇮🇳",
      label: "हिन्दी",
      word: "नमस्ते",
      words: ["शानदार", "लेख"],
      phrases: ["शानदार लेख", "नई शुरुआत", "बड़ा सोचो", "रोशनी फैलाओ", "कहानी कहो", "रंगीन दिन", "आगे बढ़ो", "दिल से", "सुर्खियाँ", "बेहतरीन", "चमक उठो", "सपने बड़े"],
      font: "'Noto Sans Devanagari','Nirmala UI','Mangal',sans-serif"
    },
    {
      id: "zh",
      flag: "🇨🇳",
      label: "中文",
      word: "文字",
      words: ["创作", "标题"],
      phrases: ["创意标题", "全新开始", "大胆一点", "光芒四射", "讲个故事", "多彩一天", "继续前行", "用心制作", "头条新闻", "精彩作品", "闪耀登场", "梦想更大"],
      font: "'Noto Sans SC','Microsoft YaHei','PingFang SC',sans-serif"
    },
    {
      id: "ar",
      flag: "🇸🇦",
      label: "العربية",
      word: "نص",
      words: ["اصنع", "رائعا"],
      phrases: ["نص رائع", "بداية جديدة", "فكر بجرأة", "انشر النور", "احك قصة", "يوم ملون", "إلى الأمام", "من القلب", "عنوان بارز", "عمل مميز", "تألق الآن", "حلم كبير"],
      font: "'Noto Naskh Arabic','Segoe UI',Tahoma,sans-serif",
      rtl: true
    },
    {
      id: "es",
      flag: "🇪🇸",
      label: "Español",
      word: "TEXTO",
      words: ["HAZLO", "BRILLAR"],
      phrases: ["HAZLO BRILLAR", "NUEVO INICIO", "PIENSA EN GRANDE", "PURA ENERGÍA", "CUENTA TU HISTORIA", "DÍA DE COLOR", "SIGUE ADELANTE", "HECHO CON AMOR", "TITULAR", "GRAN TRABAJO", "A ESCENA", "SUEÑA MÁS"],
      font: "'SF Pro Display','Segoe UI',Inter,Arial,sans-serif"
    },
    {
      id: "id",
      flag: "🇮🇩",
      label: "Indonesia",
      word: "TEKS",
      words: ["BUAT", "MENARIK"],
      phrases: ["BUAT MENARIK", "AWAL BARU", "BERANI BEDA", "SEBAR CAHAYA", "CERITAKAN", "HARI WARNA", "TERUS MAJU", "DARI HATI", "JUDUL UTAMA", "KARYA TERBAIK", "TAMPIL BEDA", "MIMPI BESAR"],
      font: "'SF Pro Display','Segoe UI',Inter,Arial,sans-serif"
    },
    {
      id: "pt",
      flag: "🇧🇷",
      label: "Português",
      word: "TEXTO",
      words: ["FAÇA", "BRILHAR"],
      phrases: ["FAÇA BRILHAR", "NOVO COMEÇO", "PENSE GRANDE", "ESPALHE LUZ", "CONTE A HISTÓRIA", "DIA COLORIDO", "SIGA EM FRENTE", "FEITO COM AMOR", "MANCHETE", "GRANDE OBRA", "ENTRE EM CENA", "SONHE MAIS"],
      font: "'SF Pro Display','Segoe UI',Inter,Arial,sans-serif"
    },
    {
      id: "ru",
      flag: "🇷🇺",
      label: "Русский",
      word: "ТЕКСТ",
      words: ["СДЕЛАЙ", "ЯРЧЕ"],
      phrases: ["СДЕЛАЙ ЯРЧЕ", "НОВЫЙ СТАРТ", "МЫСЛИ ШИРЕ", "ДАРИ СВЕТ", "РАССКАЖИ", "ЯРКИЙ ДЕНЬ", "ТОЛЬКО ВПЕРЁД", "ОТ ДУШИ", "ЗАГОЛОВОК", "ЛУЧШЕЕ", "СИЯЙ", "БОЛЬШАЯ МЕЧТА"],
      font: "'Noto Sans','Segoe UI',Arial,sans-serif"
    },
    {
      id: "ja",
      flag: "🇯🇵",
      label: "日本語",
      word: "テキスト",
      words: ["文字を", "飾る"],
      phrases: ["文字を飾る", "新しい始まり", "大胆にいこう", "光を放て", "物語を語る", "彩りの一日", "前へ進もう", "心を込めて", "見出し", "最高の作品", "輝く瞬間", "大きな夢"],
      font: "'Noto Sans JP','Yu Gothic','Hiragino Sans',sans-serif"
    }
  ];
  /* Animation names translated token-by-token so every preview card shows
     what it does in the language the user picked. Order of each array:
     bn, hi, zh, ar, es, id, pt, ru, ja — English is the dictionary key. */
  var ANIM_LANG_ORDER = ["bn", "hi", "zh", "ar", "es", "id", "pt", "ru", "ja"];
  var ANIM_WORDS = {
    "3d": ["থ্রিডি", "3D", "3D", "ثلاثي", "3D", "3D", "3D", "3D", "3D"],
    "blur": ["ব্লার", "धुंधला", "模糊", "ضباب", "Desenfoque", "Buram", "Desfoque", "Размытие", "ぼかし"],
    "bounce": ["বাউন্স", "उछाल", "弹跳", "ارتداد", "Rebote", "Pantul", "Salto", "Отскок", "バウンス"],
    "by": ["করে", "दर", "逐", "تلو", "por", "per", "por", "за", "ごと"],
    "cascade": ["ক্যাসকেড", "झरना", "层叠", "تتابع", "Cascada", "Kaskade", "Cascata", "Каскад", "カスケード"],
    "char": ["অক্ষর", "अक्षर", "字符", "حرف", "Letra", "Huruf", "Letra", "Символ", "文字"],
    "chars": ["অক্ষর", "अक्षर", "字符", "حروف", "Letras", "Huruf", "Letras", "Символы", "文字"],
    "letter": ["অক্ষর", "अक्षर", "字符", "حرف", "Letra", "Huruf", "Letra", "Символ", "文字"],
    "crop": ["ক্রপ", "क्रॉप", "裁切", "قص", "Recorte", "Potong", "Corte", "Кроп", "クロップ"],
    "down": ["নিচে", "नीचे", "向下", "لأسفل", "Abajo", "Bawah", "Baixo", "Вниз", "ダウン"],
    "drop": ["ড্রপ", "गिरना", "落下", "سقوط", "Caída", "Jatuh", "Queda", "Падение", "ドロップ"],
    "elastic": ["ইলাস্টিক", "लचीला", "弹性", "مرن", "Elástico", "Elastis", "Elástico", "Упругий", "エラスティック"],
    "exit": ["প্রস্থান", "निकास", "退出", "خروج", "Salida", "Keluar", "Saída", "Выход", "エグジット"],
    "expand": ["প্রসারণ", "विस्तार", "扩展", "توسيع", "Expandir", "Melebar", "Expandir", "Расширение", "エクスパンド"],
    "fade": ["ফেড", "फ़ेड", "淡化", "تلاشي", "Fundido", "Pudar", "Fusão", "Затухание", "フェード"],
    "flicker": ["ঝিলিক", "टिमटिमाहट", "闪烁", "وميض", "Parpadeo", "Kedip", "Cintilar", "Мерцание", "フリッカー"],
    "flip": ["ফ্লিপ", "पलट", "翻转", "قلب", "Giro", "Balik", "Virar", "Переворот", "フリップ"],
    "glitch": ["গ্লিচ", "ग्लिच", "故障", "خلل", "Glitch", "Glitch", "Glitch", "Глитч", "グリッチ"],
    "in": ["ইন", "इन", "进入", "دخول", "Entrada", "Masuk", "Entrada", "Вход", "イン"],
    "jelly": ["জেলি", "जेली", "果冻", "هلام", "Gelatina", "Jeli", "Gelatina", "Желе", "ゼリー"],
    "left": ["বামে", "बाएँ", "向左", "لليسار", "Izquierda", "Kiri", "Esquerda", "Влево", "レフト"],
    "line": ["লাইন", "पंक्ति", "行", "سطر", "Línea", "Baris", "Linha", "Строка", "ライン"],
    "neon": ["নিয়ন", "नियॉन", "霓虹", "نيون", "Neón", "Neon", "Néon", "Неон", "ネオン"],
    "out": ["আউট", "आउट", "退出", "خروج", "Salida", "Keluar", "Saída", "Выход", "アウト"],
    "overshoot": ["ওভারশুট", "ओवरशूट", "过冲", "تجاوز", "Sobrepaso", "Overshoot", "Excesso", "Перелёт", "オーバーシュート"],
    "pop": ["পপ", "पॉप", "弹出", "ظهور", "Pop", "Pop", "Pop", "Поп", "ポップ"],
    "premium": ["প্রিমিয়াম", "प्रीमियम", "高级", "مميز", "Premium", "Premium", "Premium", "Премиум", "プレミアム"],
    "pulse": ["পালস", "स्पंदन", "脉冲", "نبض", "Pulso", "Denyut", "Pulso", "Пульс", "パルス"],
    "random": ["এলোমেলো", "यादृच्छिक", "随机", "عشوائي", "Aleatorio", "Acak", "Aleatório", "Случайно", "ランダム"],
    "reveal": ["প্রকাশ", "प्रकट", "显现", "كشف", "Revelar", "Ungkap", "Revelar", "Проявление", "リビール"],
    "rgb": ["RGB", "RGB", "RGB", "RGB", "RGB", "RGB", "RGB", "RGB", "RGB"],
    "right": ["ডানে", "दाएँ", "向右", "لليمين", "Derecha", "Kanan", "Direita", "Вправо", "ライト"],
    "rise": ["উত্থান", "उठान", "上升", "صعود", "Ascenso", "Naik", "Subida", "Подъём", "ライズ"],
    "roll": ["রোল", "रोल", "滚动", "تدحرج", "Rodar", "Gulung", "Rolar", "Ролл", "ロール"],
    "rotate": ["ঘূর্ণন", "घुमाव", "旋转", "دوران", "Rotar", "Putar", "Rotação", "Поворот", "回転"],
    "rotation": ["ঘূর্ণন", "घुमाव", "旋转", "دوران", "Rotación", "Rotasi", "Rotação", "Вращение", "回転"],
    "scale": ["স্কেল", "स्केल", "缩放", "تحجيم", "Escala", "Skala", "Escala", "Масштаб", "スケール"],
    "shake": ["কাঁপুনি", "हिलना", "抖动", "اهتزاز", "Sacudida", "Getar", "Tremor", "Тряска", "シェイク"],
    "shift": ["শিফট", "शिफ्ट", "偏移", "إزاحة", "Desplazar", "Geser", "Deslocar", "Сдвиг", "シフト"],
    "sine": ["সাইন", "साइन", "正弦", "جيبي", "Seno", "Sinus", "Seno", "Синус", "サイン"],
    "skew": ["স্কিউ", "तिरछा", "倾斜", "إمالة", "Sesgo", "Miring", "Inclinar", "Наклон", "スキュー"],
    "slide": ["স্লাইড", "स्लाइड", "滑动", "انزلاق", "Deslizar", "Geser", "Deslizar", "Слайд", "スライド"],
    "smooth": ["মসৃণ", "चिकना", "平滑", "سلس", "Suave", "Halus", "Suave", "Плавно", "スムーズ"],
    "soft": ["নরম", "मुलायम", "柔和", "ناعم", "Suave", "Lembut", "Suave", "Мягкий", "ソフト"],
    "spin": ["স্পিন", "चक्कर", "旋转", "دوران", "Giro", "Berputar", "Giro", "Вращение", "スピン"],
    "squash": ["স্কোয়াশ", "दबाव", "压扁", "سحق", "Aplastar", "Pipih", "Achatar", "Сжатие", "スカッシュ"],
    "stagger": ["স্ট্যাগার", "क्रमिक", "错开", "تدرج", "Escalonado", "Bertahap", "Escalonado", "Каскадно", "ずらし"],
    "stretch": ["টান", "खिंचाव", "拉伸", "تمدد", "Estirar", "Regang", "Esticar", "Растяжение", "ストレッチ"],
    "style": ["স্টাইল", "शैली", "样式", "نمط", "Estilo", "Gaya", "Estilo", "Стиль", "スタイル"],
    "swing": ["দোলা", "झूला", "摆动", "تأرجح", "Balanceo", "Ayun", "Balanço", "Качание", "スイング"],
    "tracking": ["ট্র্যাকিং", "अक्षर-अंतर", "字距", "تباعد", "Interletra", "Spasi", "Espaçamento", "Трекинг", "トラッキング"],
    "typewriter": ["টাইপরাইটার", "टाइपराइटर", "打字机", "آلة كاتبة", "Máquina", "Mesin Ketik", "Máquina", "Печать", "タイプライター"],
    "up": ["উপরে", "ऊपर", "向上", "لأعلى", "Arriba", "Atas", "Cima", "Вверх", "アップ"],
    "vertical": ["উল্লম্ব", "लंबवत", "垂直", "عمودي", "Vertical", "Vertikal", "Vertical", "Вертикально", "バーティカル"],
    "wave": ["ঢেউ", "लहर", "波浪", "موجة", "Onda", "Gelombang", "Onda", "Волна", "ウェーブ"],
    "wipe": ["ওয়াইপ", "वाइप", "擦除", "مسح", "Barrido", "Sapu", "Varredura", "Вайп", "ワイプ"],
    "word": ["শব্দ", "शब्द", "单词", "كلمة", "Palabra", "Kata", "Palavra", "Слово", "単語"],
    "zoom": ["জুম", "ज़ूम", "缩放", "تكبير", "Zoom", "Zoom", "Zoom", "Зум", "ズーム"]
  };
  var lang = "en";
  /* v3.34.0 — the Style tab keeps its own preview language: changing the
     animation language must never touch the style grid, and vice versa. */
  var styleLang = "en";
  try {
    var storedLang = window.localStorage.getItem("ghost.previewLang");
    if (storedLang) lang = storedLang;
    var storedStyleLang = window.localStorage.getItem("ghost.styleLang");
    styleLang = storedStyleLang || lang;
  } catch (eLang) {
  }
  function langById(id) {
    for (var i = 0; i < LANGUAGES.length; i += 1) if (LANGUAGES[i].id === id) return LANGUAGES[i];
    return LANGUAGES[0];
  }
  function langInfo() {
    return langById(lang);
  }
  function styleLangInfo() {
    return langById(styleLang);
  }

  /* Translate a preset name like "Pop In Up" into the active language. */
  function localizedName(name) {
    var text = String(name || "");
    if (lang === "en") return text;
    var slot = ANIM_LANG_ORDER.indexOf(lang);
    if (slot === -1) return text;
    var parts = text.split(/\s+/);
    var out = [];
    for (var i = 0; i < parts.length; i += 1) {
      var raw = parts[i];
      var key = raw.toLowerCase().replace(/[^a-z0-9&]/g, "");
      var hit = ANIM_WORDS[key];
      out.push(hit && hit[slot] ? hit[slot] : raw);
    }
    return out.join(lang === "zh" || lang === "ja" ? "" : " ");
  }
  /* Rotating sample lines so a wall of cards never repeats one word. */
  function phrase(index) {
    var info = langInfo();
    var list = info.phrases && info.phrases.length ? info.phrases : [info.word];
    return list[Math.abs(index || 0) % list.length];
  }
  /* Style previews rotate through the Style tab language only. */
  function stylePhrase(index) {
    var info = styleLangInfo();
    var list = info.phrases && info.phrases.length ? info.phrases : [info.word];
    return list[Math.abs(index || 0) % list.length];
  }

  function sample() {
    var info = langInfo();
    return { word: info.word, words: info.words || [info.word], line: info.word };
  }
  function styleLabel(item) {
    var name = String(item && item.name || "");
    if (name.indexOf("—") !== -1) {
      var parts = name.split("—");
      var tail = parts[parts.length - 1].replace(/^\s+|\s+$/g, "");
      if (tail) return tail;
    }
    return name;
  }
  function pickColors(list, count) {
    var out = [];
    if (!list || !list.length) return out;
    if (list.length <= count) return list.slice(0);
    for (var i = 0; i < count; i += 1) {
      out.push(list[Math.round(i * (list.length - 1) / (count - 1))]);
    }
    return out;
  }
  function styleSpec(item) {
    var chars = item.chars && item.chars.length ? item.chars.slice(0) : null;
    var spec = {
      v: 2,
      name: styleLabel(item),
      tracking: item.overlap ? -30 : 0,
      fill: null,
      stroke: null,
      glow: null,
      shadow: null,
      extrude: null
    };
    if (chars && chars.length >= 2) {
      var stops = pickColors(chars, chars.length >= 3 ? 4 : 2);
      spec.fill = { type: stops.length >= 3 ? "ramp4" : "ramp", colors: stops, angle: 0 };
    } else if (chars && chars.length === 1) {
      spec.fill = { type: "solid", colors: [chars[0]] };
    } else {
      spec.fill = { type: "solid", colors: [item.solid || "#ffffff"] };
    }
    if (item.outline) spec.stroke = { color: item.outline, em: 0.05 };
    if (item.shadow) {
      spec.extrude = { color: item.shadow, steps: 3, stepEm: 0.03, angle: 135 };
    }
    if (item.glow) {
      spec.glow = {
        em: 0.12,
        intensity: 1,
        /* the halo takes the accent colour, never the light letter core */
        color: item.shadow || item.glowColor || (chars && chars[0]) || item.solid || "#ffffff"
      };
    }

    return spec;
  }
  var previewIdleObserver = null;
  function previewObserver() {
    if (previewIdleObserver !== null) return previewIdleObserver;
    if (typeof window.IntersectionObserver !== "function") {
      previewIdleObserver = false;
      return false;
    }
    previewIdleObserver = new window.IntersectionObserver(function(entries) {
      for (var i = 0; i < entries.length; i += 1) {
        var el = entries[i].target;
        if (entries[i].isIntersecting) el.classList.remove("tk-card-idle");
        else el.classList.add("tk-card-idle");
      }
    }, { rootMargin: "80px 0px" });
    return previewIdleObserver;
  }
  function watchPreview(card) {
    var obs = previewObserver();
    if (!obs) return;
    card.classList.add("tk-card-idle");
    try {
      obs.observe(card);
    } catch (e) {
    }
  }
  function voteBar(kind, name) {
    var bar = document.createElement("span");
    bar.className = "tk-vote";
    var stored = window.GhostCloud && window.GhostCloud.votes && window.GhostCloud.votes() || {};
    var mine = stored[kind + "::" + name];
    function button(choice, glyph, tip) {
      var b = document.createElement("button");
      b.type = "button";
      b.className = "tk-vote-btn tk-vote-" + choice;
      b.innerHTML = glyph;
      b.title = tip;
      b.setAttribute("aria-label", tip);
      if (mine && mine.vote === choice) b.classList.add("is-on");
      b.addEventListener("click", function(event) {
        event.stopPropagation();
        event.preventDefault();
        var siblings = bar.querySelectorAll(".tk-vote-btn");
        for (var i = 0; i < siblings.length; i++) siblings[i].classList.remove("is-on");
        b.classList.add("is-on");
        bar.classList.add("has-vote");
        bar.setAttribute("data-sent", "1");
        if (!window.GhostCloud || !window.GhostCloud.vote) return;
        window.GhostCloud.vote({ kind, name, vote: choice, panel: "ghost-toolkit" }).then(function() {
          bar.setAttribute("title", "Thanks — feedback sent.");
        }).catch(function() {
          bar.setAttribute("title", "Saved offline — will send later.");
        });
      });
      b.addEventListener("keydown", function(event) {
        event.stopPropagation();
      });
      return b;
    }
    /* Heroicons (heroicons.com) — hand-thumb-up / hand-thumb-down */
    var heroSvg = function(name, size) {
      if (window.GhostHero && window.GhostHero.has(name)) {
        return window.GhostHero.svg(name, "gi", 'width="' + size + '" height="' + size + '"');
      }
      return "";
    };
    var thumbsUpSvg = heroSvg("hand-thumb-up", 10);
    var thumbsDownSvg = heroSvg("hand-thumb-down", 10);
    bar.appendChild(button("up", thumbsUpSvg, lang === "bn" ? "কাজ করছে — like দিন" : "If working, give me a like"));
    var div = document.createElement("span");
    div.className = "tk-vote-divider";
    bar.appendChild(div);
    bar.appendChild(button("down", thumbsDownSvg, lang === "bn" ? "কাজ করছে না" : "Not working"));
    return bar;
  }
  var BM_KEY = "ghost.toolkit.bookmarks";
  var bookmarks = null;
  function bmLoad() {
    if (bookmarks) return bookmarks;
    bookmarks = {};
    try {
      var raw = window.localStorage.getItem(BM_KEY);
      var parsed = raw ? JSON.parse(raw) : null;
      if (parsed && typeof parsed === "object") bookmarks = parsed;
    } catch (e) {
      bookmarks = {};
    }
    return bookmarks;
  }
  function bmSave() {
    try {
      window.localStorage.setItem(BM_KEY, JSON.stringify(bmLoad()));
    } catch (e) {
    }
  }
  function bmHas(key) {
    return !!bmLoad()[key];
  }
  function bmToggle(key) {
    var map = bmLoad();
    if (map[key]) delete map[key];
    else map[key] = 1;
    bmSave();
    return !!map[key];
  }
  function bmCount() {
    var map = bmLoad(), n = 0, k;
    for (k in map) {
      if (Object.prototype.hasOwnProperty.call(map, k)) n += 1;
    }
    return n;
  }
  function bmStar(card, key) {
    var star = document.createElement("button");
    star.type = "button";
    star.className = "tk-bm-star";
    if (window.GhostHero && window.GhostHero.has("star")) {
      star.innerHTML = window.GhostHero.svg("star", "gi", 'width="9" height="9"');
    } else {
      star.textContent = "★";
    }

    star.title = lang === "bn" ? "Bookmark — shortcut হিসেবে রাখুন" : "Bookmark this preset";
    star.setAttribute("aria-label", star.title);
    var paint = function() {
      var on = bmHas(key);
      star.classList.toggle("is-on", on);
      card.classList.toggle("is-bookmarked", on);
      card.setAttribute("data-bookmarked", on ? "1" : "0");
    };
    paint();
    star.addEventListener("click", function(event) {
      event.stopPropagation();
      event.preventDefault();
      bmToggle(key);
      paint();
      if (typeof applyFilter === "function") applyFilter();
    });
    star.addEventListener("keydown", function(event) {
      event.stopPropagation();
    });
    card.appendChild(star);
  }
  function previewCard(labelText, badgeText, badgeClass, inner, opts) {
    var options = opts || {};
    var card = document.createElement("div");
    card.className = "tk-card" + (options.compact ? " tk-card-compact" : "");
    card.setAttribute("role", "button");
    card.setAttribute("tabindex", "0");
    card.title = labelText;
    card.setAttribute("data-search", String(labelText).toLowerCase());
    if (options.group) card.setAttribute("data-group", options.group);
    if (badgeText) {
      var badge = document.createElement("span");
      badge.className = "tk-card-badge " + (badgeClass || "");
      badge.textContent = badgeText;
      card.appendChild(badge);
    }
    card.appendChild(inner);
    if (!options.noLabel) {
      var label = document.createElement("span");
      label.className = "tk-card-label";
      label.textContent = labelText;
      card.appendChild(label);
    }
    /* v3.23.0 — the vote bar is ALWAYS a floating overlay. It used to sit
       inside .tk-card-label, which is pointer-events:none, so like/dislike
       could not be clicked at all. As an overlay it owns its own hit area. */
    if (options.voteKind) {
      var floating = voteBar(options.voteKind, labelText);
      floating.classList.add("tk-vote-float");
      if (floating.querySelector(".tk-vote-btn.is-on")) floating.classList.add("has-vote");
      card.appendChild(floating);
    }
    if (options.bookmark !== false) {
      bmStar(card, (options.voteKind || options.group || "preset") + "|" + labelText);
    }
    watchPreview(card);
    return card;
  }
  function activate(card, handler) {
    card.addEventListener("click", handler);
    card.addEventListener("keydown", function(event) {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        handler();
      }
    });
  }
  function animPreviewNode(animClass, text, color) {
    var span = document.createElement("span");
    span.className = "tk-preview-text " + animClass;
    span.textContent = text || sample().word;
    if (color) span.style.color = color;
    span.style.fontFamily = langInfo().font;
    if (langInfo().rtl) span.setAttribute("dir", "rtl");
    if (lang === "bn") span.classList.add("tk-bn");
    return span;
  }
  /* popDelay in host.jsx is 0.15s per unit — the preview uses the same
     number so the card and the applied layer stagger identically. */
  var TK_SEQ_DELAY = { word: 0.22, char: 0.15 };
  function seqPreviewNode(animClass, mode, tint, hue, text, delay) {
    var wrap = document.createElement("span");
    wrap.className = "tk-preview-text tk-seq" + (lang === "bn" ? " tk-bn" : "");
    wrap.style.fontFamily = langInfo().font;
    if (langInfo().rtl) wrap.setAttribute("dir", "rtl");
    if (tint) {
      wrap.classList.add(hue ? "tk-color-hue" : "tk-color-seq");
      wrap.style.setProperty("--tk-c1", tint);
    }
    var source = text || (mode === "word" ? sample().words.join(" ") : sample().word);
    var parts;
    if (mode === "word") {
      parts = String(source).split(/\s+/);
    } else {
      try {
        if (typeof Intl !== "undefined" && Intl.Segmenter) {
          parts = [];
          var iter = new Intl.Segmenter("en", { granularity: "grapheme" }).segment(String(source));
          for (var seg of iter) parts.push(seg.segment);
        } else {
          parts = Array.from(String(source));
        }
      } catch (e) {
        parts = Array.from(String(source));
      }
    }
    for (var i = 0; i < parts.length; i += 1) {
      var unit = document.createElement("span");
      unit.className = "tk-seq-unit " + animClass;
      unit.textContent = parts[i] === " " ? "\u00a0" : parts[i];
      var step = delay || TK_SEQ_DELAY[mode] || 0.15;
      unit.style.animationDelay = i * step + "s";
      if (mode === "word") unit.style.marginRight = "0.28em";
      wrap.appendChild(unit);
    }
    return wrap;
  }
  /* ── Perfect Presets (real .ffx animation pack) ─────────────────────
     Cards are built from <extension>/presets/animffx/<Name>/ — image + clip
     for the preview, the .ffx itself for the apply. Preview == result. */
  var animFfxAll = [], animFfxCat = "All", animFfxAuto = false, animFfxClips = [];
  /* Perfect Preset preview policy. Keep the number of simultaneously decoding
     videos small, but never destroy a preview's source just to save memory. */
  /* Autoplay owns every visible preview. There is no arbitrary four-card cap. */
  var FFX_PLAY_FRAMES = 20;
  var FFX_POSTPLAY_FRAMES = 5;
  var FFX_FALLBACK_FPS = 18;
  var FFX_RETRY_BASE_MS = 700;
  var FFX_RETRY_MAX_MS = 5000;
  var FFX_PLAYING_CLASS = "is-clip-on";
  function animFfxCard(preset) {
    var media = document.createElement("span");
    media.className = "tk-ffx-media";
    if (preset.preview || preset.previewUrl) {
      var shot = document.createElement("img");
      shot.className = "tk-ffx-card-shot";
      shot.alt = preset.name;
      shot.addEventListener("error", function() {
        /* Most bundled previews are PNGs. Older manifests incorrectly said
           JPG, so retry the sibling PNG once before giving up. */
        var current = String(shot.getAttribute("src") || "");
        if (!shot.getAttribute("data-ghost-preview-fallback")) {
          var alt = current.replace(/\.(jpe?g|webp)$/i, ".png");
          if (alt !== current) {
            shot.setAttribute("data-ghost-preview-fallback", "1");
            shot.src = alt;
            return;
          }
        }
        if (shot.parentNode) shot.parentNode.removeChild(shot);
      });
      shot.src = preset.previewUrl || ffxFileUrl(preset.preview);
      media.appendChild(shot);
    }
    var card = previewCard(preset.name, null, null, media, {
      voteKind: "ffx",
      group: "ffx"
    });
    card.classList.add("tk-ffx-card");
    card.title = preset.name + (preset.category ? " — " + preset.category : "");
    card.setAttribute("data-search", (preset.name + " " + (preset.category || "") + " ffx animation preset").toLowerCase());
    card.setAttribute("data-cat", preset.category || "Presets");
    var clipUrl = preset.videoUrl || (preset.video ? ffxFileUrl(preset.video) : "");
    if (clipUrl) card.setAttribute("data-clip", clipUrl);
    card.addEventListener("mouseenter", function() {
      /* Autoplay ON: the rotation governs playback, hover doesn't interfere.
         Autoplay OFF: the still image is the resting state, and hovering is
         what plays the one-shot preview. */
      if (animFfxAuto) return;
      ffxPlayCard(card, "hover");
    });
    card.addEventListener("mouseleave", function() {
      if (!animFfxAuto && !card.ghostManualPreview) ffxStopCard(card);
    });
    activate(card, function() {
      restartCardPreview(card);
      setInline("animFfxStatus", "Applying " + preset.name + "…", "");
      call("toolkitApplyFFX", [preset.path, ""]).then(function(res) {
        reportResult("animFfxStatus", res, preset.name + " applied.");
      }).catch(function(err) {
        reportResult("animFfxStatus", { ok: false, error: err.message }, "");
      });
    });
    return card;
  }
  /* Lazy preview clips. The source is attached only when a card needs to
     play. A failed play never hides the still image, so a blocked/unsupported
     codec cannot turn the card black. */
  function ffxVisible(card) {
    if (!card || !card.isConnected) return false;
    if (document.hidden) return false;
    if (card.classList.contains("tk-hidden")) return false;
    if (card.closest && card.closest(".tk-hidden")) return false;
    var grid = byId("animFfxGrid");
    if (!grid || !grid.contains(card) || grid.classList.contains("tk-hidden")) return false;
    try {
      var cs = window.getComputedStyle(card);
      if (cs.display === "none" || cs.visibility === "hidden") return false;
    } catch (e) {}
    var r = card.getBoundingClientRect();
    var vh = window.innerHeight || 800;
    return r.width > 0 && r.height > 0 && r.bottom > 0 && r.top < vh;
  }
  function ffxPostPlayDelay(clip) {
    var fps = FFX_FALLBACK_FPS;
    try {
      var duration = Number(clip && clip.duration);
      if (isFinite(duration) && duration > 0) {
        var measured = FFX_PLAY_FRAMES / duration;
        if (isFinite(measured) && measured > 1 && measured < 120) fps = measured;
      }
    } catch (e) {}
    return Math.max(100, Math.round((FFX_POSTPLAY_FRAMES / fps) * 1000));
  }
  function ffxEnsureClip(card) {
    if (!card || card.ghostClipDead) return null;
    var clip = card.querySelector(".tk-ffx-card-clip");
    if (clip) return clip;
    var url = card.getAttribute("data-clip");
    if (!url) return null;
    var media = card.querySelector(".tk-ffx-media") || card;
    clip = document.createElement("video");
    clip.className = "tk-ffx-card-clip";
    clip.muted = true;
    clip.defaultMuted = true;
    /* Autoplay is a true continuous loop. Manual preview remains one-shot. */
    clip.loop = false;
    clip.setAttribute("muted", "");
    clip.setAttribute("playsinline", "");
    clip.setAttribute("webkit-playsinline", "");
    clip.setAttribute("preload", "metadata");
    clip.setAttribute("data-ghost-preserve-media", "1");
    clip.addEventListener("loadeddata", function() { card.classList.add("is-clip-ready"); });
    clip.addEventListener("playing", function() {
      card.classList.add("is-clip-ready");
      card.classList.add(FFX_PLAYING_CLASS);
      if (window.GhostStability && window.GhostStability.registerMedia) window.GhostStability.registerMedia(clip);
    });
    clip.addEventListener("pause", function() {
      card.classList.remove(FFX_PLAYING_CLASS);
      if (window.GhostStability && window.GhostStability.forgetMedia) window.GhostStability.forgetMedia(clip);
    });
    clip.addEventListener("ended", function() {
      card.ghostPlayPending = null;
      if (animFfxAuto && card.getAttribute("data-ghost-autoplay") === "1" && ffxVisible(card)) {
        try { clip.currentTime = 0; } catch (e) {}
        ffxPlayCard(card, "autoplay");
        return;
      }
      card.classList.remove(FFX_PLAYING_CLASS, "is-clip-ready");
      card.ghostManualPreview = false;
    });
    clip.addEventListener("canplay", function() {
      if (animFfxAuto && card.getAttribute("data-ghost-autoplay") === "1" && ffxVisible(card) && clip.paused && !card.ghostPlayPending) {
        ffxPlayCard(card, "autoplay");
      }
    });
    clip.addEventListener("stalled", function() { card.ghostLastMediaEvent = Date.now(); });
    clip.addEventListener("waiting", function() { card.ghostLastMediaEvent = Date.now(); });
    clip.addEventListener("error", function() {
      card.ghostClipDead = true;
      card.ghostPlayPending = null;
      card.ghostManualPreview = false;
      card.classList.remove(FFX_PLAYING_CLASS, "is-clip-ready");
      if (window.GhostStability && window.GhostStability.forgetMedia) window.GhostStability.forgetMedia(clip);
      if (clip.parentNode) clip.parentNode.removeChild(clip);
    });
    clip.src = url;
    media.appendChild(clip);
    animFfxClips.push(clip);
    if (window.GhostStability && window.GhostStability.registerMedia) window.GhostStability.registerMedia(clip);
    return clip;
  }
  function ffxPlayingCards() {
    var grid = byId("animFfxGrid"), out = [];
    if (!grid) return out;
    var cards = grid.querySelectorAll(".tk-ffx-card.is-clip-on");
    for (var i = 0; i < cards.length; i += 1) out.push(cards[i]);
    return out;
  }
  function ffxStopCard(card) {
    if (!card) return;
    /* Invalidate any in-flight play() promise. CEP can resolve play() after a
       stop, and without a generation token that stale promise can turn the
       card back on and create the visible stop/start flicker. */
    card.ghostPlayGeneration = (card.ghostPlayGeneration || 0) + 1;
    card.ghostPlayPending = false;
    card.removeAttribute("data-ghost-autoplay");
    if (card.ghostPreviewTimer) {
      window.clearTimeout(card.ghostPreviewTimer);
      card.ghostPreviewTimer = null;
    }
    if (card.ghostRetryTimer) {
      window.clearTimeout(card.ghostRetryTimer);
      card.ghostRetryTimer = null;
    }
    card.ghostPreviewHoldUntil = 0;
    card.ghostManualPreview = false;
    card.ghostRetryCount = 0;
    card.ghostRetryAt = 0;
    card.classList.remove(FFX_PLAYING_CLASS, "is-clip-ready");
    var clip = card.querySelector(".tk-ffx-card-clip");
    if (!clip) return;
    try { clip.loop = false; clip.pause(); clip.currentTime = 0; } catch (e) {}
    if (window.GhostStability && window.GhostStability.forgetMedia) window.GhostStability.forgetMedia(clip);
  }
  function ffxScheduleRetry(card) {
    if (!card || !animFfxAuto || card.getAttribute("data-ghost-autoplay") !== "1") return;
    card.ghostRetryCount = Math.min((card.ghostRetryCount || 0) + 1, 6);
    var delay = Math.min(FFX_RETRY_MAX_MS, FFX_RETRY_BASE_MS * Math.pow(2, card.ghostRetryCount - 1));
    card.ghostRetryAt = Date.now() + delay;
    if (card.ghostRetryTimer) window.clearTimeout(card.ghostRetryTimer);
    card.ghostRetryTimer = window.setTimeout(function() {
      card.ghostRetryTimer = null;
      if (animFfxAuto && card.getAttribute("data-ghost-autoplay") === "1" && ffxVisible(card)) ffxPlayCard(card, "autoplay");
    }, delay);
  }
  function ffxPlayCard(card, reason) {
    var clip = ffxEnsureClip(card);
    if (!clip) return Promise.resolve(false);
    /* Autoplay previews are continuous loops. Manual/hover previews remain
       one-shot. This removes the end → delay → replay gap that made cards
       appear to stop/start repeatedly. */
    clip.loop = reason === "autoplay";
    /* Never stack play() calls while one is still resolving. The 1.5s
       watchdog otherwise races slow CEP media startup and can restart the same
       clip repeatedly. */
    if (card.ghostPlayPending) return card.ghostPlayPending;
    var generation = (card.ghostPlayGeneration || 0) + 1;
    card.ghostPlayGeneration = generation;
    if (reason === "click" || reason === "manual") {
      card.ghostManualPreview = true;
      card.ghostPreviewHoldUntil = 0;
      if (card.ghostPreviewTimer) {
        window.clearTimeout(card.ghostPreviewTimer);
        card.ghostPreviewTimer = null;
      }
    }
    if (clip.readyState >= 1 && (clip.paused || reason !== "autoplay")) {
      try { clip.currentTime = 0; } catch (eSeek) {}
    }
    try { clip.muted = true; clip.defaultMuted = true; } catch (eMute) {}
    var p;
    try { p = clip.play(); }
    catch (ePlay) {
      card.ghostManualPreview = false;
      card.classList.remove(FFX_PLAYING_CLASS);
      return Promise.resolve(false);
    }
    var onSuccess = function() {
      if (card.ghostPlayGeneration !== generation) return false;
      if (animFfxAuto && card.getAttribute("data-ghost-autoplay") !== "1") return false;
      card.classList.add("is-clip-ready");
      card.classList.add(FFX_PLAYING_CLASS);
      card.ghostRetryCount = 0;
      card.ghostRetryAt = 0;
      return true;
    };
    if (p && typeof p.then === "function") {
      var pending = p.then(onSuccess).catch(function() {
        if (card.ghostPlayGeneration === generation) {
          card.ghostManualPreview = false;
          card.classList.remove(FFX_PLAYING_CLASS);
          if (reason === "autoplay") ffxScheduleRetry(card);
        }
        if (window.GhostStability && window.GhostStability.forgetMedia) window.GhostStability.forgetMedia(clip);
        return false;
      });
      card.ghostPlayPending = pending;
      pending.then(function() {
        if (card.ghostPlayGeneration === generation) card.ghostPlayPending = null;
      });
      return pending;
    }
    /* Older CEP builds return undefined from HTMLMediaElement.play(). */
    if (card.ghostPlayGeneration !== generation) return Promise.resolve(false);
    card.classList.add(FFX_PLAYING_CLASS);
    return Promise.resolve(true);
  }
  function ffxCardDistance(card) {
    var r = card.getBoundingClientRect();
    var vh = window.innerHeight || 800;
    var center = (r.top + r.bottom) / 2;
    return Math.abs(center - vh / 2);
  }
  function ffxSyncAutoplay() {
    var grid = byId("animFfxGrid");
    if (!grid) return;
    var all = grid.querySelectorAll(".tk-ffx-card"), wanted = [];
    for (var i = 0; i < all.length; i += 1) {
      var card = all[i];
      if (animFfxAuto && ffxVisible(card)) wanted.push(card);
    }
    for (var j = 0; j < all.length; j += 1) {
      var item = all[j];
      if (wanted.indexOf(item) !== -1) {
        item.setAttribute("data-ghost-autoplay", "1");
        if (item.ghostRetryAt && Date.now() < item.ghostRetryAt) continue;
        var clip = item.querySelector(".tk-ffx-card-clip");
        if (!clip || (!clip.paused && !item.ghostPlayPending)) {
          if (clip && !clip.paused) item.classList.add(FFX_PLAYING_CLASS);
          continue;
        }
        if (!item.ghostPlayPending) ffxPlayCard(item, "autoplay");
      } else {
        ffxStopCard(item);
      }
    }
  }
  var ffxScrollTimer = null;
  function ffxWatchScroll() {
    if (ffxWatchScroll.bound) return;
    ffxWatchScroll.bound = true;
    var handler = function() {
      if (!animFfxAuto || ffxScrollTimer) return;
      ffxScrollTimer = window.setTimeout(function() { ffxScrollTimer = null; ffxSyncAutoplay(); }, 180);
    };
    window.addEventListener("scroll", handler, true);
    window.addEventListener("resize", handler);
  }
  /* Scroll/resize and each clip's own "ended" event are what normally
     drive ffxSyncAutoplay(). That leaves a gap: if a clip's play()
     promise is silently rejected (a stalled file load, a stability
     eviction, a CEP quirk on first paint) it never fires "ended" and
     never resyncs, so the card just sits dark until the user happens to
     scroll. A slow watchdog closes that gap by re-checking on a timer
     instead of relying only on those triggers. */
  var ffxWatchdogTimer = null;
  var ffxWatchdogTick = null;
  function ffxStartWatchdog() {
    if (ffxWatchdogTimer || !animFfxAuto) return;
    ffxWatchdogTick = function () {
      ffxWatchdogTimer = null;
      if (!animFfxAuto || (window.GhostIdle && window.GhostIdle.isSuspended && window.GhostIdle.isSuspended())) return;
      ffxSyncAutoplay();
      ffxWatchdogTimer = window.setTimeout(ffxWatchdogTick, 1500);
    };
    ffxWatchdogTimer = window.setTimeout(ffxWatchdogTick, 1500);
  }
  function ffxStopWatchdog() {
    if (ffxWatchdogTimer) window.clearTimeout(ffxWatchdogTimer);
    ffxWatchdogTimer = null;
    ffxWatchdogTick = null;
  }
  /* Visibility changes can make CEP pause media without emitting the same
     sequence of events as a normal user pause. Resync immediately on return
     instead of waiting for the 1.5s watchdog tick. */
  var ffxVisibilityBound = false;
  if (!ffxVisibilityBound) {
    ffxVisibilityBound = true;
    document.addEventListener("visibilitychange", function() {
      if (animFfxAuto && !document.hidden) window.setTimeout(ffxSyncAutoplay, 50);
    });
    document.addEventListener("ghost:resume", function() {
      if (animFfxAuto) window.setTimeout(ffxSyncAutoplay, 50);
    });
  }
  /* ── preview autoplay controller ────────────────────────────────────
     One play/pause button per section (Perfect Presets, Web Presets).
     Each section remembers its own state. While a section is paused,
     hovering a card replays just that card from the start. */
  var AUTOPLAY_KEYS = { ffx: "ghost.toolkit.autoplay.ffx", web: "ghost.toolkit.autoplay.web" };
  var animWebAuto = false;
  function autoplayRead(section, fallback) {
    try {
      var raw = window.localStorage.getItem(AUTOPLAY_KEYS[section]);
      return raw == null ? fallback : raw === "1";
    } catch (e) { return fallback; }
  }
  function autoplayWrite(section, on) {
    try { window.localStorage.setItem(AUTOPLAY_KEYS[section], on ? "1" : "0"); } catch (e) {}
  }
  function syncPlayButton(id, on, label) {
    var btn = byId(id);
    if (!btn) return;
    var text = (on ? "Pause " : "Play ") + label + " previews";
    btn.setAttribute("aria-pressed", on ? "true" : "false");
    btn.title = text;
    btn.setAttribute("aria-label", text);
  }
  var MANUAL_PREVIEW_MS = 5200;
  function restartCardPreview(card) {
    if (!card) return;
    /* Explicit preview must work with autoplay OFF, parked cards, and
       keyboard activation — not only while the pointer happens to hover. */
    if (card.getAttribute && card.getAttribute("data-clip")) {
      ffxPlayCard(card, "click");
      return;
    }
    if (card.ghostManualPreviewTimer) {
      window.clearTimeout(card.ghostManualPreviewTimer);
      card.ghostManualPreviewTimer = null;
    }
    card.classList.remove("tk-manual-preview");
    card.classList.add("tk-anim-restart");
    void card.offsetWidth;
    card.classList.remove("tk-anim-restart");
    void card.offsetWidth;
    card.classList.add("tk-manual-preview");
    card.ghostManualPreviewTimer = window.setTimeout(function() {
      card.ghostManualPreviewTimer = null;
      card.classList.remove("tk-manual-preview");
    }, MANUAL_PREVIEW_MS);
  }
  function wireHoverReplay(grid) {
    if (!grid || grid.getAttribute("data-hover-replay")) return;
    grid.setAttribute("data-hover-replay", "1");
    grid.addEventListener("mouseover", function(event) {
      if (grid.classList.contains("is-autoplay")) return;
      var card = event.target && event.target.closest ? event.target.closest(".tk-card") : null;
      if (!card || card === event.relatedTarget) return;
      if (event.relatedTarget && card.contains(event.relatedTarget)) return;
      if (card.classList.contains("tk-ffx-card")) return;
      restartCardPreview(card);
    });
  }
  function animFfxSetAuto(on, persist) {
    animFfxAuto = !!on;
    var grid = byId("animFfxGrid");
    if (grid) {
      grid.classList.toggle("is-autoplay", animFfxAuto);
      grid.classList.toggle("is-paused", !animFfxAuto);
      wireHoverReplay(grid);
    }
    ffxWatchScroll();
    ffxSyncAutoplay();
    if (animFfxAuto) ffxStartWatchdog(); else ffxStopWatchdog();
    syncPlayButton("animFfxPlayBtn", animFfxAuto, "Perfect Preset");
    if (persist !== false) autoplayWrite("ffx", animFfxAuto);
  }
  function animWebSetAuto(on, persist) {
    animWebAuto = !!on;
    var grid = byId("animGrid");
    if (grid) {
      grid.classList.toggle("is-autoplay", animWebAuto);
      grid.classList.toggle("is-paused", !animWebAuto);
      grid.classList.toggle("tk-anim-paused", !animWebAuto);
      wireHoverReplay(grid);
    }
    syncPlayButton("animWebPlayBtn", animWebAuto, "Web Preset");
    if (persist !== false) autoplayWrite("web", animWebAuto);
  }
  function bindSectionPlayButtons() {
    if (document.body) document.body.classList.remove("disable-auto-animate");
    var ffxBtn = byId("animFfxPlayBtn");
    if (ffxBtn && !ffxBtn.getAttribute("data-bound")) {
      ffxBtn.setAttribute("data-bound", "1");
      ffxBtn.addEventListener("click", function() { animFfxSetAuto(!animFfxAuto); });
      /* Autoplay is enabled by default for Perfect Presets. An explicit
         user choice in localStorage still wins. */
      animFfxSetAuto(autoplayRead("ffx", true), false);
    }
    var webBtn = byId("animWebPlayBtn");
    if (webBtn && !webBtn.getAttribute("data-bound")) {
      webBtn.setAttribute("data-bound", "1");
      webBtn.addEventListener("click", function() { animWebSetAuto(!animWebAuto); });
      animWebSetAuto(autoplayRead("web", true), false);
    }
    wireHoverReplay(byId("animFfxGrid"));
    wireHoverReplay(byId("animGrid"));
  }
  window.GhostToolkitAutoplay = {
    set: function(on) { animFfxSetAuto(!!on); animWebSetAuto(!!on); },
    setFfx: function(on) { animFfxSetAuto(!!on); },
    setWeb: function(on) { animWebSetAuto(!!on); },
    get: function() { return { ffx: animFfxAuto, web: animWebAuto }; }
  };
  function animFfxPaint() {
    var grid = byId("animFfxGrid");
    var empty = byId("animFfxEmpty");
    if (!grid) return;
    animFfxClips = [];
    var frag = document.createDocumentFragment(), shown = 0;
    animFfxAll.forEach(function(preset) {
      if (animFfxCat !== "All" && (preset.category || "Presets") !== animFfxCat) return;
      frag.appendChild(animFfxCard(preset));
      shown += 1;
    });
    /* Dispose old preview media before replacing the grid. This invalidates
       stale play() promises and prevents detached videos from surviving a
       category/filter rebuild. */
    var oldCards = grid.querySelectorAll(".tk-ffx-card");
    for (var oi = 0; oi < oldCards.length; oi += 1) ffxStopCard(oldCards[oi]);
    grid.innerHTML = "";
    grid.appendChild(frag);
    if (empty) empty.hidden = shown > 0;
    var label = byId("animFfxCatLabel");
    if (label) label.textContent = animFfxCat;
    bindSectionPlayButtons();
    animFfxSetAuto(animFfxAuto, false);
    if (typeof applyFilter === "function") applyFilter();
  }
  function animFfxBuildMenu() {
    var btn = byId("animFfxCatBtn"), menu = byId("animFfxCatMenu");
    if (!btn || !menu) return;
    var cats = ["All"], seen = {};
    animFfxAll.forEach(function(preset) {
      var c = preset.category || "Presets";
      if (!seen[c]) { seen[c] = 1; cats.push(c); }
    });
    menu.innerHTML = "";
    cats.forEach(function(cat) {
      var item = document.createElement("button");
      item.type = "button";
      item.className = "tk-catmenu-item" + (cat === animFfxCat ? " active" : "");
      item.setAttribute("role", "menuitem");
      item.textContent = cat;
      item.addEventListener("click", function() {
        animFfxCat = cat;
        menu.hidden = true;
        btn.setAttribute("aria-expanded", "false");
        animFfxBuildMenu();
        animFfxPaint();
      });
      menu.appendChild(item);
    });
    if (!btn.getAttribute("data-bound")) {
      btn.setAttribute("data-bound", "1");
      btn.addEventListener("click", function() {
        menu.hidden = !menu.hidden;
        btn.setAttribute("aria-expanded", menu.hidden ? "false" : "true");
      });
      document.addEventListener("click", function(event) {
        if (menu.hidden) return;
        if (btn.contains(event.target) || menu.contains(event.target)) return;
        menu.hidden = true;
        btn.setAttribute("aria-expanded", "false");
      });
    }
  }
  /* Manifest fallback: read presets/animffx/pack.json straight from the panel
     folder. Works even when the host folder scan comes back empty (path or
     permission quirks in some AE installs). Files are <Folder>/<Folder>.ext. */
  function animFfxFromPack() {
    if (window.GHOST_BUNDLED_ANIM_CATALOG && Array.isArray(window.GHOST_BUNDLED_ANIM_CATALOG)) {
      var embeddedRoot = extensionRoot();
      return Promise.resolve(window.GHOST_BUNDLED_ANIM_CATALOG.map(function(entry) {
        var folder = String(entry.folder || entry.name || "");
        var dir = "presets/animffx/" + folder + "/" + folder;
        return {name:entry.name||folder,category:entry.category||"Presets",path:(embeddedRoot?embeddedRoot+"/":"")+dir+".ffx",preview:embeddedRoot?embeddedRoot+"/"+dir+".png":null,previewUrl:embeddedRoot?null:encodeURI(dir+".png"),video:embeddedRoot?embeddedRoot+"/"+dir+".mp4":null,videoUrl:embeddedRoot?null:encodeURI(dir+".mp4"),perfect:true,kind:"ffx"};
      }));
    }
    return fetchText("presets/animffx/pack.json").then(function(text) {
      if (!text) return [];
      var data;
      try { data = JSON.parse(text); } catch (eJson) { return []; }
      var list = data && data.presets ? data.presets : [];
      var root = extensionRoot();
      var out = [];
      for (var i = 0; i < list.length; i += 1) {
        var entry = list[i];
        if (!entry || !entry.folder) continue;
        var dir = "presets/animffx/" + entry.folder + "/" + entry.folder;
        out.push({
          name: entry.name || entry.folder,
          category: entry.category || "Presets",
          path: (root ? root + "/" : "") + dir + ".ffx",
          preview: root ? root + "/" + dir + ".png" : null,
          previewUrl: root ? null : encodeURI(dir + ".png"),
          video: root ? root + "/" + dir + ".mp4" : null,
          videoUrl: root ? null : encodeURI(dir + ".mp4"),
          perfect: true,
          kind: "ffx"
        });
      }
      return out;
    }).catch(function() { return []; });
  }
  function renderFfxAnim() {
    var grid = byId("animFfxGrid");
    if (!grid) return;
    function mergeCatalog(hostList, fallbackList) {
      var out = [], seen = {};
      (hostList || []).concat(fallbackList || []).forEach(function(item) {
        if (!item || !item.name) return;
        var key = String(item.name).toLowerCase();
        if (seen[key]) return;
        seen[key] = true;
        out.push(item);
      });
      return out;
    }
    function paint(list) { animFfxAll = list || []; animFfxBuildMenu(); animFfxPaint(); }
    animFfxFromPack().then(function(fallbackList) {
      paint(fallbackList);
      call("toolkitListAnimFfx", [extensionRoot()]).then(function(res) {
        var hostList = res && res.ok && res.presets ? res.presets : [];
        var merged = mergeCatalog(hostList, fallbackList);
        if (merged.length) paint(merged);
      }).catch(function() {});
    }).catch(function() {
      call("toolkitListAnimFfx", [extensionRoot()]).then(function(res) {
        paint(res && res.ok && res.presets ? res.presets : []);
      }).catch(function() { paint([]); });
    });
  }


  function renderFfxColor(installed) {
    var grid = byId("ffxColorGrid");
    if (!grid) return;
    grid.innerHTML = "";
    FFX_COLOR.forEach(function(item) {
      var has = installed.indexOf(item.file) !== -1;
      var node = animPreviewNode("", "GHOST", item.color);
      node.style.textShadow = "0 0 10px " + item.color;
      var card = previewCard(item.label, has ? "FFX" : "FFX*", has ? "" : "missing", node);
      activate(card, function() {
        setInline("ffxColorStatus", "Applying " + item.label + "…", "");
        call("toolkitApplyFFX", [item.file, ""]).then(function(res) {
          if (res && res.ok) return reportResult("ffxColorStatus", res, item.label + " applied.");
          return call("toolkitApplyColor", [item.fallback]).then(function(fb) {
            reportResult("ffxColorStatus", fb, item.label + " applied (built-in look).");
          });
        }).catch(function(err) {
          reportResult("ffxColorStatus", { ok: false, error: err.message }, "");
        });
      });
      grid.appendChild(card);
    });
  }
  var TK_DEFAULT_DURATION = 1;
  function currentDuration() {
    var slider = byId("animDuration");
    return slider ? parseInt(slider.value, 10) / 10 : TK_DEFAULT_DURATION;
  }
  /* v3.23.0 — the per-card .ffx download button was removed on request.
     Duration is fixed at 1.0s now that the bottom timing slider is gone. */
  function renderAnimations() {
    var grid = byId("animGrid");
    if (!grid) return;
    /* build off-document so a language switch costs one layout, not fifty */
    var frag = document.createDocumentFragment();
    ANIMATIONS.forEach(function(item) {
      /* the card shows what it does, written in the chosen language */
      var caption = localizedName(item.name);
      var node = item.seq
        ? seqPreviewNode(item.anim, item.seq, item.tint, item.hue, caption, item.delay)
        : animPreviewNode(item.anim, caption, item.tint);
      node.classList.add("tk-preview-name");
      if (caption.length > 12) node.classList.add("tk-preview-long");
      var card = previewCard(item.name, null, null, node, { group: item.group, voteKind: "animation" });
      activate(card, function() {
        restartCardPreview(card);
        setInline("animStatus", "Applying " + item.name + "…", "");
        call("toolkitApplyAnimation", [item.name, String(currentDuration())]).then(function(res) {
          reportResult("animStatus", res, item.name + " applied.");
        }).catch(function(err) {
          reportResult("animStatus", { ok: false, error: err.message }, "");
        });
      });
      frag.appendChild(card);
    });
    grid.innerHTML = "";
    grid.appendChild(frag);
    applyGroup();
  }

  /* ── custom / AI-generated animation packs ───────────────────
     The card preview and the After Effects apply call are built from the very
     same spec object (js/ghost-anim-pack.js), which is what keeps an imported
     animation from looking different once it lands on the layer. */
  /* ── Ghost Motion engine handshake ────────────────────────────────
     Apply used to fail with "execution engine could not be loaded" because
     ExtendScript could not derive the extension folder on its own. The panel
     knows exactly where it lives, so it hands the path over and — if the host
     still cannot read the files — streams the module sources across. Same
     files the preview uses, so there is still one source of truth. */
  var motionRoot = null, motionReady = null;
  function extensionRoot() {
    if (motionRoot !== null) return motionRoot;
    motionRoot = "";
    try { if (cs && cs.getSystemPath) motionRoot = String(cs.getSystemPath("extension")).replace(/\\/g, "/"); } catch (e) { motionRoot = ""; }
    return motionRoot;
  }
  /* Register the exact CEP extension root with ExtendScript before any
     bundled FFX catalog is queried. Older builds referenced this helper
     without defining it, which aborted the Style boot sequence. */
  function ffxRegisterRoot() {
    var root = extensionRoot();
    if (!root) return Promise.resolve({ ok: false, error: "Extension root unavailable." });
    return call("toolkitFfxSetRoot", [root]).then(function(res) {
      if (!res || !res.ok) throw new Error((res && res.error) || "Could not register the FFX extension root.");
      return res;
    });
  }
  function fetchText(url) {
    return new Promise(function(resolve) {
      try {
        var xhr = new XMLHttpRequest();
        xhr.open("GET", url, true);
        xhr.onload = function() { resolve(xhr.status === 0 || (xhr.status >= 200 && xhr.status < 300) ? xhr.responseText : ""); };
        xhr.onerror = function() { resolve(""); };
        xhr.send(null);
      } catch (e) { resolve(""); }
    });
  }
  function ensureMotionEngine() {
    if (motionReady) return motionReady;
    motionReady = Promise.all([fetchText("js/ghost-motion.js"), fetchText("js/ghost-apply-engine.js")])
      .then(function(sources) {
        if (!sources[0] || !sources[1]) return null;
        return call("toolkitInstallMotionEngine", [sources[0], sources[1]]).catch(function() { return null; });
      })
      .catch(function() { return null; });
    return motionReady;
  }
  function motionBody(spec) {
    var body = window.GhostAnimPack.payload(spec, { duration: currentDuration() });
    body.extensionRoot = extensionRoot();
    return body;
  }

  function applyAnimationPack(spec) {
    if (!window.GhostAnimPack) return;
    var body = motionBody(spec);
    setInline("animStatus", "Applying " + spec.name + "…", "");
    ensureMotionEngine().then(function() {
      return call("toolkitApplyAdvancedAnimation", [JSON.stringify(body)]);
    }).then(function(res) {
      reportResult("animStatus", res, spec.name + " applied — editable in After Effects.");
    }).catch(function(err) {
      reportResult("animStatus", { ok: false, error: err.message }, "");
    });
  }
  /* Automated Preview/Apply consistency check. Run from the panel console:
        GhostText.diagnoseMotion("Blur Rise")        // probe, then clean up
        GhostText.diagnoseMotion("Blur Rise", true)  // probe and keep it
     Compares the plan the preview rendered with the structure After Effects
     actually built and prints every resolution step. */
  function diagnoseMotion(name, keep) {
    if (!window.GhostAnimPack) return Promise.reject(new Error("Animation pack module missing."));
    var specs = window.GhostAnimPack.list(), spec = null;
    for (var i = 0; i < specs.length; i += 1) {
      if (String(specs[i].name).toLowerCase() === String(name).toLowerCase()) { spec = specs[i]; break; }
    }
    if (!spec) return Promise.reject(new Error('No saved animation called "' + name + '".'));
    var body = motionBody(spec);
    body.keep = !!keep;
    setInline("animStatus", "Diagnosing " + spec.name + "…", "");
    return ensureMotionEngine().then(function() {
      return call("toolkitDiagnoseMotion", [JSON.stringify(body)]);
    }).then(function(res) {
      /* eslint-disable no-console */
      console.log("[Ghost Motion] " + (res.parity || (res.ok ? "OK" : "FAILED")));
      (res.steps || []).forEach(function(step) { console.log("  " + step); });
      (res.warnings || []).forEach(function(warn) { console.warn("  warning: " + warn); });
      if (!res.ok) console.error("  " + (res.error || "unknown divergence"));
      setInline("animStatus", res.ok ? spec.name + ": preview matches apply." : spec.name + ": " + (res.error || "divergence"), res.ok ? "ok" : "err");
      return res;
    });
  }

  function renderCustomAnimations(grid) {
    if (!window.GhostAnimPack) return;
    window.GhostAnimPack.list().forEach(function(spec) {
      var node = window.GhostAnimPack.previewNode(spec, spec.name);
      node.classList.add("tk-preview-name");
      if (spec.name.length > 12) node.classList.add("tk-preview-long");
      var card = previewCard(spec.name, "MINE", "tk-badge-custom", node, {
        group: spec.basis === "words" ? "word" : "char",
        voteKind: "animation"
      });
      activate(card, function() {
        applyAnimationPack(spec);
      });
      var del = document.createElement("button");
      del.type = "button";
      del.className = "tk-card-del";
      del.title = "Remove " + spec.name;
      del.setAttribute("aria-label", del.title);
      del.innerHTML = window.GhostHero ? window.GhostHero.svg("trash", "gi", 'width="12" height="12"') : "×";
      del.addEventListener("click", function(event) {
        event.stopPropagation();
        event.preventDefault();
        window.GhostAnimPack.remove(spec.name);
        renderAnimations();
        setInline("animStatus", spec.name + " removed.", "ok");
      });
      card.appendChild(del);
      grid.appendChild(card);
    });
  }
  function bindAnimPackModal() {
    var modal = byId("animPackModal");
    if (!modal) return;
    var input = byId("animPackInput");
    var previewBar = byId("animPackPreview");
    var openBtn = byId("animAddBtn");
    function close() {
      modal.hidden = true;
    }
    function open() {
      modal.hidden = false;
      setInline("animPackStatus", "", "");
      if (input) input.focus();
    }
    /* Live preview inside the modal: the user sees the animation before it is
       ever added, using the exact renderer the library cards use. */
    function refreshPreview() {
      if (!previewBar || !input) return;
      previewBar.innerHTML = "";
      var parsed = window.GhostAnimPack.parse(input.value);
      if (!parsed.ok) {
        if (input.value.replace(/\s/g, "")) setInline("animPackStatus", parsed.error, "warn");
        else setInline("animPackStatus", "", "");
        return;
      }
      setInline("animPackStatus", parsed.animations.length + " animation(s) ready to add.", "ok");
      parsed.animations.forEach(function(spec) {
        var cell = document.createElement("div");
        cell.className = "tk-pack-previewcell";
        cell.appendChild(window.GhostAnimPack.previewNode(spec, spec.name));
        var label = document.createElement("span");
        label.className = "tk-card-label";
        label.textContent = spec.name;
        cell.appendChild(label);
        previewBar.appendChild(cell);
      });
    }
    if (openBtn) openBtn.addEventListener("click", open);
    var closeBtn = byId("animPackClose");
    if (closeBtn) closeBtn.addEventListener("click", close);
    modal.addEventListener("click", function(event) {
      if (event.target === modal) close();
    });
    if (input) input.addEventListener("input", tkDebounce(refreshPreview, 220));
    var promptBtn = byId("animPackPrompt");
    if (promptBtn) promptBtn.addEventListener("click", function() {
      copyText(window.GhostAnimPack.PROMPT_TEXT);
      setInline("animPackStatus", "AI prompt copied — paste it into any AI, then paste the JSON back here.", "ok");
    });
    var formatBtn = byId("animPackFormat");
    if (formatBtn) formatBtn.addEventListener("click", function() {
      copyText(window.GhostAnimPack.SPEC_TEXT);
      setInline("animPackStatus", "Format copied.", "ok");
    });
    var fileBtn = byId("animPackFile");
    if (fileBtn) fileBtn.addEventListener("click", function() {
      var picker = document.createElement("input");
      picker.type = "file";
      picker.accept = ".json,application/json,text/plain";
      picker.addEventListener("change", function() {
        var file = picker.files && picker.files[0];
        if (!file) return;
        var reader = new FileReader();
        reader.onload = function() {
          if (input) input.value = String(reader.result || "");
          refreshPreview();
        };
        reader.readAsText(file);
      });
      picker.click();
    });
    var addBtn = byId("animPackAdd");
    if (addBtn) addBtn.addEventListener("click", function() {
      var parsed = window.GhostAnimPack.parse(input ? input.value : "");
      if (!parsed.ok) return setInline("animPackStatus", parsed.error, "error");
      var out = window.GhostAnimPack.add(parsed.animations);
      renderAnimations();
      if (input) input.value = "";
      if (previewBar) previewBar.innerHTML = "";
      var msg = out.added + " added" + (out.replaced ? ", " + out.replaced + " updated" : "") + " — find them in the Animation tab.";
      setInline("animPackStatus", msg, "ok");
      toast(msg, "ok");
      close();
    });
    document.addEventListener("keydown", function(event) {
      if (event.key === "Escape" && !modal.hidden) close();
    });
  }
  /* Style catalog intentionally empty. */
  var TEXT_STYLES = [];
  function textStylePreviewNode(item, spec, index) {
    var info = styleLangInfo();
    var wrap = document.createElement("span");
    wrap.className = "tk-preview-text";
    wrap.style.fontWeight = "800";
    wrap.style.letterSpacing = item.overlap ? "-0.03em" : "0.02em";
    wrap.style.fontFamily = info.font;
    if (info.rtl) wrap.setAttribute("dir", "rtl");
    var word = stylePhrase(index);
    if (word.length > 10) wrap.classList.add("tk-preview-long");
    wrap.textContent = word;

    var fill = spec && spec.fill || { type: "solid", colors: ["#ffffff"] };
    if (fill.type === "solid" || fill.colors.length < 2) {
      wrap.style.color = fill.colors[0];
    } else {
      var stopList = [];
      for (var g = 0; g < fill.colors.length; g += 1) {
        stopList.push(fill.colors[g] + " " + Math.round(g * 100 / (fill.colors.length - 1)) + "%");
      }
      wrap.style.backgroundImage = "linear-gradient(90deg," + stopList.join(",") + ")";
      wrap.style.webkitBackgroundClip = "text";
      wrap.style.backgroundClip = "text";
      wrap.style.webkitTextFillColor = "transparent";
      wrap.style.color = "transparent";
    }
    var isRamp = wrap.style.webkitTextFillColor === "transparent";
    if (spec && spec.stroke) {
      /* gradient fills only get a whisper of edge so the ramp stays readable */
      var strokeEm = isRamp ? Math.min(spec.stroke.em, 0.022) : spec.stroke.em;
      wrap.style.webkitTextStroke = strokeEm + "em " + spec.stroke.color;
      wrap.style.paintOrder = "stroke fill";
    }
    var layers = [];
    if (spec && spec.extrude) {
      /* solid fills keep the hard 3-step extrude; ramps get one soft lift so
         the preview never turns into a muddy stack of offset copies */
      var steps = isRamp ? 1 : spec.extrude.steps;
      for (var s = 1; s <= steps; s += 1) {
        var off = (spec.extrude.stepEm * s).toFixed(4) + "em";
        layers.push(off + " " + off + " " + (isRamp ? "0.04em " : "0 ") + spec.extrude.color);
      }
    }
    if (spec && spec.shadow) {
      layers.push(spec.shadow.em + "em " + spec.shadow.em + "em " + (spec.shadow.softEm || 0) + "em " + spec.shadow.color);
    }
    if (spec && spec.glow && !isRamp) {
      /* one tight pass only — a stacked glow eats the letter shapes */
      layers.push("0 0 " + (spec.glow.em * 0.6).toFixed(3) + "em " + spec.glow.color);
    }
    if (layers.length) {
      if (isRamp) {
        var filters = [];
        for (var f = 0; f < layers.length; f += 1) filters.push("drop-shadow(" + layers[f] + ")");
        wrap.style.filter = filters.join(" ");
      } else {
        wrap.style.textShadow = layers.join(", ");
      }
    }

    return wrap;
  }
  var TEXT_STYLE_PAGE = 30;
  var textStylePage = 1;
  function textStyleCard(item, index) {
    var spec = styleSpec(item);
    var label = spec.name;
    var card = previewCard(label, null, null, textStylePreviewNode(item, spec, index), { noLabel: true, voteKind: "text-style" });
    card.title = label + " — " + item.desc;
    card.setAttribute("data-search", (label + " " + item.desc).toLowerCase());
    card.setAttribute("data-cat", item.cat || "other");
    activate(card, function() {
      setInline("textStyleStatus", "Applying " + label + "…", "");
      var payload = item;
      try {
        payload = JSON.parse(JSON.stringify(item));
        payload.spec = spec;
      } catch (eClone) {
      }
      call("toolkitApplyTextStyle", [label, JSON.stringify(payload)]).then(function(res) {
        reportResult("textStyleStatus", res, label + " applied.");
        if (res && res.ok && res.fontOk === false) {
          setInline("textStyleStatus", res.warning || "Font missing.", "warn");
        }
      }).catch(function(err) {
        reportResult("textStyleStatus", { ok: false, error: err.message }, "");
      });
    });
    return card;
  }
  function renderTextStyles(page) {
    var grid = byId("textStyleGrid");
    if (!grid) return;
    textStylePage = page || 1;
    /* one reflow per render: build off-document, swap in once */
    var frag = document.createDocumentFragment();
    var limit = Math.min(TEXT_STYLE_PAGE * textStylePage, TEXT_STYLES.length);
    for (var i = 0; i < limit; i += 1) frag.appendChild(textStyleCard(TEXT_STYLES[i], i));
    if (limit < TEXT_STYLES.length) {
      var more = document.createElement("button");
      more.type = "button";
      more.className = "tk-load-more";
      more.textContent = "Load more (" + (TEXT_STYLES.length - limit) + " left)";
      more.addEventListener("click", function() {
        renderTextStyles(textStylePage + 1);
      });
      frag.appendChild(more);
    }
    grid.innerHTML = "";
    grid.appendChild(frag);
  }

  function expandTextStyles() {
    var total = Math.ceil(TEXT_STYLES.length / TEXT_STYLE_PAGE);
    if (textStylePage < total) renderTextStyles(total);
  }
  function renderCloudTextStyles(force) {
    /* Do not inject remote styles into the intentionally empty Style tab. */
    var grid = byId("cloudStyleGrid");
    var empty = byId("cloudStyleEmpty");
    if (grid) grid.innerHTML = "";
    if (empty) {
      empty.hidden = false;
      empty.textContent = "No built-in styles available.";
    }
  }
  function cloudStyleCard(style) {
    var card = document.createElement("div");
    card.className = "tk-card tk-ffx-card tk-cloud-style";
    card.setAttribute("tabindex", "0");
    card.title = style.name;
    card.setAttribute("data-search", (style.name + " ffx cloud text style " + (style.tags || []).join(" ")).toLowerCase());
    if (style.preview) {
      var shot = document.createElement("img");
      shot.className = "tk-ffx-card-shot";
      shot.alt = style.name;
      shot.loading = "lazy";
      shot.src = style.preview;
      card.appendChild(shot);
    } else {
      var fallback = document.createElement("span");
      fallback.className = "tk-preview-text";
      fallback.textContent = sample().word;
      card.appendChild(fallback);
    }
    var tag = document.createElement("span");
    tag.className = "tk-ffx-card-tag";
    tag.textContent = "FFX";
    card.appendChild(tag);
    var name = document.createElement("span");
    name.className = "tk-ffx-card-name";
    name.textContent = style.name;
    card.appendChild(name);
    activate(card, function() {
      if (!style.url) {
        setInline("cloudStyleStatus", "This style has no download link yet.", "warn");
        return;
      }
      setInline("cloudStyleStatus", "Installing " + style.name + "…", "");
      fetchBase64(style.url).then(function(b64) {
        return call("toolkitFfxInstallCloud", [style.slug || style.name, style.name, b64]);
      }).then(function(res) {
        if (!res || !res.ok) {
          reportResult("cloudStyleStatus", res || { ok: false, error: "Install failed." }, "");
          return null;
        }
        setInline("cloudStyleStatus", "Applying " + style.name + "…", "");
        return call("toolkitFfxApplyStyle", [res.file]);
      }).then(function(applied) {
        if (applied) reportResult("cloudStyleStatus", applied, style.name + " applied.");
      }).catch(function(err) {
        reportResult("cloudStyleStatus", { ok: false, error: err.message }, "");
      });
    });
    return card;
  }
  function fetchBase64(url) {
    return fetch(url).then(function(res) {
      if (!res.ok) throw new Error("Download failed (" + res.status + ")");
      return res.blob();
    }).then(function(blob) {
      return new Promise(function(resolve, reject) {
        var reader = new FileReader();
        reader.onload = function() {
          var out = String(reader.result || "");
          var at = out.indexOf(",");
          resolve(at === -1 ? out : out.slice(at + 1));
        };
        reader.onerror = function() {
          reject(new Error("Could not read the preset."));
        };
        reader.readAsDataURL(blob);
      });
    });
  }
  /* Animation-side language. It drives the animation grid, captions and
     combos only — the Style tab owns its own language (setStyleLang). */
  function setLang(id) {
    if (!id || id === lang) return;
    lang = id;
    try {
      window.localStorage.setItem("ghost.previewLang", id);
    } catch (eStore) {
    }
    syncAnimLangButton();
    renderAnimations();
    renderCombos();
    applyFilter();
  }
  /* Style-side language: nothing but the Style grid re-renders. */
  function setStyleLang(id) {
    if (!id || id === styleLang) return;
    styleLang = id;
    try {
      window.localStorage.setItem("ghost.styleLang", id);
    } catch (eStore2) {
    }
    renderTextStyles(textStylePage);
    applyFilter();
  }
  /* Small surface the 2028 presentation layer talks to for the language
     sheets, so neither side has to reach into private state. */
  window.GhostToolkitLang = {
    languages: function() {
      return LANGUAGES.map(function(l) {
        return { id: l.id, flag: l.flag, label: l.label, font: l.font };
      });
    },
    animLang: function() { return lang; },
    styleLang: function() { return styleLang; },
    setAnimLang: setLang,
    setStyleLang: setStyleLang,
    labelOf: function(id) { return langById(id).label; }
  };

  function syncAnimLangButton() {
    var btn = byId("animLangBtn");
    if (!btn) return;
    var info = langInfo();
    var flag = btn.querySelector(".tk-langbtn-flag");
    if (flag) flag.textContent = info.flag;
    btn.title = "Preview language — " + info.label;
    var menu = byId("animLangMenu");
    if (!menu) return;
    var items = menu.querySelectorAll(".tk-langmenu-item");
    Array.prototype.forEach.call(items, function(el) {
      el.classList.toggle("active", el.getAttribute("data-lang") === lang);
    });
  }
  /* Compact language picker that lives beside the play/pause button. */
  function buildAnimLangMenu() {
    var btn = byId("animLangBtn");
    var menu = byId("animLangMenu");
    if (!btn || !menu || menu.getAttribute("data-built")) return;
    menu.setAttribute("data-built", "1");
    LANGUAGES.forEach(function(info) {
      var item = document.createElement("button");
      item.type = "button";
      item.className = "tk-langmenu-item" + (info.id === lang ? " active" : "");
      item.setAttribute("data-lang", info.id);
      item.innerHTML = '<span class="tk-langmenu-flag"></span><span class="tk-langmenu-name"></span>';
      item.querySelector(".tk-langmenu-flag").textContent = info.flag;
      var name = item.querySelector(".tk-langmenu-name");
      name.textContent = info.label;
      name.style.fontFamily = info.font;
      item.addEventListener("click", function() {
        setLang(info.id);
        menu.hidden = true;
        btn.setAttribute("aria-expanded", "false");
      });
      menu.appendChild(item);
    });
    btn.addEventListener("click", function(event) {
      event.stopPropagation();
      menu.hidden = !menu.hidden;
      btn.setAttribute("aria-expanded", menu.hidden ? "false" : "true");
    });
    document.addEventListener("click", function(event) {
      if (menu.hidden) return;
      if (menu.contains(event.target) || btn.contains(event.target)) return;
      menu.hidden = true;
      btn.setAttribute("aria-expanded", "false");
    });
    document.addEventListener("keydown", function(event) {
      if (event.key === "Escape" && !menu.hidden) {
        menu.hidden = true;
        btn.setAttribute("aria-expanded", "false");
      }
    });
    syncAnimLangButton();
  }
  /* v3.34.0 — the old chip row is gone: language is picked from the panel
     menu sheet, so the Style tab keeps its full width for presets. */
  function renderLangChips() {
    var bar = byId("langGroups");
    if (bar) {
      bar.innerHTML = "";
      bar.hidden = true;
    }
    buildAnimLangMenu();

  }
  function renderColors() {
    var grid = byId("colorGrid");
    if (!grid) return;
    grid.innerHTML = "";
    COLORS.forEach(function(item) {
      var swatch = document.createElement("div");
      swatch.className = "tk-swatch";
      swatch.setAttribute("role", "button");
      swatch.setAttribute("tabindex", "0");
      swatch.title = item.name;
      swatch.setAttribute("aria-label", item.name);
      swatch.setAttribute("data-search", item.name.toLowerCase());
      swatch.style.background = item.css;
      if (item.glow) swatch.style.boxShadow = "0 0 10px " + item.css;
      if (item.stroke) swatch.style.border = "2px solid " + item.stroke;
      activate(swatch, function() {
        setInline("colorStatus", "Applying " + item.name + "…", "");
        call("toolkitApplyColor", [item.name]).then(function(res) {
          reportResult("colorStatus", res, item.name + " applied.");
        }).catch(function(err) {
          reportResult("colorStatus", { ok: false, error: err.message }, "");
        });
      });
      grid.appendChild(swatch);
    });
  }
  var COMBOS = [
    { name: "Viral Pop", icon: "⚡", color: "Radioactive Yellow", anim: "Char Pop", desc: "Yellow + char pop" },
    { name: "Cinematic Title", icon: "🎬", color: "Gold Foil", anim: "Char Tracking In", desc: "Gold + tracking in" },
    { name: "Social Caption", icon: "📱", color: "Pure White", anim: "Word by Word", desc: "White + word reveal" },
    { name: "Neon Glitch", icon: "👾", color: "Ghost Cyan", anim: "RGB Glitch", desc: "Cyan + glitch" },
    { name: "Soft Intro", icon: "🌙", color: "Lavender Dream", anim: "Char Blur", desc: "Lavender + blur in" },
    { name: "Bold Impact", icon: "💥", color: "Hot Crimson", anim: "Char Overshoot", desc: "Red + overshoot" },
    { name: "Typewriter Story", icon: "⌨", color: "Pure White", anim: "Typewriter Chars", desc: "Classic typewriter" },
    { name: "Rainbow Party", icon: "🌈", style: "Rainbow Pop", anim: "Char Wave", desc: "Rainbow + wave" },
    { name: "3D Candy", icon: "🍬", style: "Candy 3D Outline", anim: "Char Pop", desc: "Candy extrude + pop" },
    { name: "বাংলা টাইটেল", icon: "🇧🇩", style: "Bangla Blue Title", anim: "Word Rise", desc: "নীল টাইটেল + রাইজ" }
  ];
  function runChain(steps, statusId, label) {
    setInline(statusId, "Applying " + label + "…", "");
    var index = 0;
    function next() {
      if (index >= steps.length) {
        setInline(statusId, label + " applied.", "ok");
        return;
      }
      var step = steps[index];
      index += 1;
      call(step.fn, step.args).then(function(res) {
        if (res && res.ok === false && index === 1) {
          setInline(statusId, res.error || "Failed.", "error");
          return;
        }
        next();
      }).catch(function(err) {
        setInline(statusId, err.message, "error");
      });
    }
    next();
  }
  function renderCombos() {
    var grid = byId("comboGrid");
    if (!grid) return;
    grid.innerHTML = "";
    COMBOS.forEach(function(item) {
      var node = document.createElement("span");
      node.className = "tk-combo-preview";
      var glyph = document.createElement("span");
      glyph.className = "tk-combo-icon";
      glyph.textContent = item.icon;
      var text = document.createElement("span");
      text.className = "tk-preview-text " + (item.anim ? animClassFor(item.anim) : "");
      text.textContent = item.name;
      node.appendChild(glyph);
      node.appendChild(text);
      var card = previewCard(item.name, null, null, node, { noLabel: true });
      card.title = item.name + " — " + item.desc;
      card.setAttribute("data-search", (item.name + " " + item.desc).toLowerCase());
      activate(card, function() {
        var steps = [];
        if (item.style) steps.push({ fn: "toolkitApplyTextStyle", args: [item.style] });
        if (item.color) steps.push({ fn: "toolkitApplyColor", args: [item.color] });
        if (item.anim) steps.push({ fn: "toolkitApplyAnimation", args: [item.anim, String(currentDuration())] });
        runChain(steps, "comboStatus", item.name);
      });
      grid.appendChild(card);
    });
  }
  function animClassFor(name) {
    for (var i = 0; i < ANIMATIONS.length; i += 1) {
      if (ANIMATIONS[i].name === name) return ANIMATIONS[i].anim;
    }
    return "";
  }
  var TYPO = [
    { icon: "A+", action: "sizeUp", label: "Font size +" },
    { icon: "A-", action: "sizeDown", label: "Font size −" },
    { icon: "A↔", action: "trackUp", label: "Tracking +" },
    { icon: "A↔-", action: "trackDown", label: "Tracking −" },
    { icon: "↕+", action: "leadUp", label: "Leading +" },
    { icon: "↕-", action: "leadDown", label: "Leading −" },
    { icon: "↕A", action: "autoLeading", label: "Auto leading" },
    { icon: "⇤", action: "alignLeft", label: "Align left" },
    { icon: "≡", action: "alignCenter", label: "Align centre" },
    { icon: "⇥", action: "alignRight", label: "Align right" },
    { icon: "AA", action: "upper", label: "UPPERCASE" },
    { icon: "aa", action: "lower", label: "lowercase" },
    { icon: "Aa", action: "title", label: "Title Case" },
    { icon: "B", action: "faux", label: "Faux bold toggle" },
    { icon: "I", action: "italic", label: "Faux italic toggle" },
    { icon: "◍", action: "strokeOn", label: "Add outline" },
    { icon: "◌", action: "strokeOff", label: "Remove outline" },
    { icon: "⤢", action: "fitComp", label: "Fit width to comp" },
    { icon: "✛", action: "anchorCenter", label: "Anchor to centre" },
    { icon: "◉", action: "centerComp", label: "Centre in comp" }
  ];
  function renderTypography() {
    var grid = byId("typeGrid");
    if (!grid) return;
    grid.innerHTML = "";
    TYPO.forEach(function(item) {
      var button = document.createElement("button");
      button.type = "button";
      button.className = "tk-action";
      button.title = item.label;
      button.setAttribute("data-search", item.label.toLowerCase());
      button.innerHTML = '<span class="tk-action-icon"></span>';
      button.firstChild.textContent = item.icon;
      button.addEventListener("click", function() {
        setInline("typeStatus", item.label + "…", "");
        call("toolkitApplyTypography", [item.action, ""]).then(function(res) {
          reportResult("typeStatus", res, item.label + " ✓");
        }).catch(function(err) {
          reportResult("typeStatus", { ok: false, error: err.message }, "");
        });
      });
      grid.appendChild(button);
    });
  }
  var selectedEmoji = "";
  var emojiFolder = "premium";
  /* Older CEF builds ship an incomplete emoji font, so newer glyphs render as
     an empty "tofu" box. Measuring the glyph against a guaranteed-missing
     codepoint tells us whether this After Effects build can draw it; anything
     unsupported is left out instead of showing a blank tile. */
  var emojiSupportCache = {};
  var emojiSupportCtx = null;
  var emojiFilterOn = null;
  function emojiRenders(glyph) {
    /* If the runtime cannot even draw the most basic emoji it has no emoji font
       at all — in that case filtering would empty the grid, so we show
       everything and let After Effects deal with the glyphs. */
    if (emojiFilterOn === null) {
      emojiFilterOn = true;
      emojiFilterOn = emojiRendersRaw("\uD83D\uDE00");
    }
    if (!emojiFilterOn) return true;
    return emojiRendersRaw(glyph);
  }
  function emojiRendersRaw(glyph) {
    if (Object.prototype.hasOwnProperty.call(emojiSupportCache, glyph)) return emojiSupportCache[glyph];
    var ok = true;
    try {
      if (!emojiSupportCtx) {
        var canvas = document.createElement("canvas");
        canvas.width = 40;
        canvas.height = 40;
        emojiSupportCtx = canvas.getContext("2d");
        if (emojiSupportCtx) emojiSupportCtx.font = "28px sans-serif";
      }
      if (emojiSupportCtx) {
        emojiSupportCtx.font = "28px sans-serif";
        var tofu = emojiSupportCtx.measureText("\uDBFF\uDFFF").width;
        var w = emojiSupportCtx.measureText(glyph).width;
        ok = w > 0 && Math.abs(w - tofu) > 0.5;
      }
    } catch (e) { ok = true; }
    emojiSupportCache[glyph] = ok;
    return ok;
  }
  function emojiSearchIndex() {
    var out = [];
    EMOJI_GROUPS.forEach(function(group) {
      group.items.forEach(function(glyph, gi) {
        out.push({
          glyph: glyph,
          name: (group.names && group.names[gi]) || "",
          group: group
        });
      });
    });
    return out;
  }
  function renderEmojis() {
    var host = byId("emojiGrid");
    if (!host) return;
    host.className = "tk-emoji-host ge-emoji-host ge-emoji-lean";
    host.innerHTML = "";
    var heroIcon = function(name, cls) {
      return window.GhostHero && window.GhostHero.has(name) ? window.GhostHero.svg(name, cls || "gi gi-action") : "";
    };

    /* ── header: title · hairline · search icon · category icon ── */
    var head = document.createElement("div");
    head.className = "ge-head";
    head.innerHTML = '<span class="ge-head-title">Text based emoji</span><span class="ge-head-rule"></span>';

    var searchBtn = document.createElement("button");
    searchBtn.type = "button";
    searchBtn.className = "ge-head-ico";
    searchBtn.title = "Search emoji";
    searchBtn.setAttribute("aria-label", "Search emoji");
    searchBtn.innerHTML = heroIcon("magnifying-glass", "gi") ||
      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><circle cx="11" cy="11" r="6"/><path d="M16 16l4 4"/></svg>';

    var search = document.createElement("input");
    search.type = "search";
    search.className = "ge-head-search";
    search.placeholder = "Search…";
    search.hidden = true;
    search.setAttribute("aria-label", "Search emoji");

    var catBtn = document.createElement("button");
    catBtn.type = "button";
    catBtn.className = "ge-head-ico";
    catBtn.title = "Categories";
    catBtn.setAttribute("aria-expanded", "false");
    catBtn.innerHTML = heroIcon("squares-2x2", "gi") ||
      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><rect x="4" y="4" width="6" height="6" rx="1.4"/><rect x="14" y="4" width="6" height="6" rx="1.4"/><rect x="4" y="14" width="6" height="6" rx="1.4"/><rect x="14" y="14" width="6" height="6" rx="1.4"/></svg>';

    head.appendChild(search);
    head.appendChild(searchBtn);
    head.appendChild(catBtn);
    host.appendChild(head);

    var rail = document.createElement("div");
    rail.className = "tk-emoji-rail ge-cat-bar";
    host.appendChild(rail);

    var categoryMenu = document.createElement("div");
    categoryMenu.className = "ge-category-menu";
    categoryMenu.hidden = true;
    host.appendChild(categoryMenu);

    var gridWrap = document.createElement("div");
    gridWrap.className = "ge-grid-wrap";
    host.appendChild(gridWrap);
    var grid = document.createElement("div");
    grid.className = "tk-emoji-grid ge-asset-grid";
    gridWrap.appendChild(grid);

    function emojiTile(glyph, emojiName, group) {
      var button = document.createElement("button");
      button.type = "button";
      button.className = "tk-emoji-button ge-asset-tile";
      var glyphSpan = document.createElement("span");
      glyphSpan.className = "ge-tile-glyph";
      glyphSpan.textContent = glyph;
      button.appendChild(glyphSpan);
      button.setAttribute("aria-label", group.label + " emoji " + glyph);
      button.title = emojiName || group.label;
      return button;
    }

    /* One delegated listener for the whole grid instead of one per tile. */
    grid.addEventListener("click", function(ev) {
      var tile = ev.target && ev.target.closest ? ev.target.closest(".ge-asset-tile") : null;
      if (!tile) return;
      var glyph = tile.getAttribute("data-glyph");
      if (glyph) openEmojiModal(glyph);
    });

    function paint(groupId) {
      emojiFolder = groupId;
      Array.prototype.forEach.call(rail.children, function(tab) {
        var on = tab.getAttribute("data-folder") === groupId;
        tab.classList.toggle("is-active", on);
        tab.classList.toggle("active", on);
        tab.setAttribute("aria-selected", on ? "true" : "false");
      });
      var group2 = null;
      for (var i = 0; i < EMOJI_GROUPS.length; i += 1) {
        if (EMOJI_GROUPS[i].id === groupId) { group2 = EMOJI_GROUPS[i]; break; }
      }
      if (!group2) return;
      categoryMenu.hidden = true;
      catBtn.setAttribute("aria-expanded", "false");
      /* Single reflow: build off-document, swap once. */
      var frag = document.createDocumentFragment();
      group2.items.forEach(function(glyph, gi) {
        if (!emojiRenders(glyph)) return;
        var tile = emojiTile(glyph, group2.names && group2.names[gi] || "", group2);
        tile.setAttribute("data-glyph", glyph);
        frag.appendChild(tile);
      });
      grid.textContent = "";
      grid.appendChild(frag);
    }

    search.addEventListener("input", tkDebounce(function() {
      var query = search.value.toLowerCase().replace(/^\s+|\s+$/g, "");
      if (!query) { paint(emojiFolder); return; }
      var frag = document.createDocumentFragment();
      var shown = 0;
      emojiSearchIndex().forEach(function(entry) {
        if (shown >= 300) return;
        var hay = (entry.glyph + " " + entry.name + " " + entry.group.label).toLowerCase();
        if (hay.indexOf(query) === -1) return;
        if (!emojiRenders(entry.glyph)) return;
        var tile = emojiTile(entry.glyph, entry.name, entry.group);
        tile.setAttribute("data-glyph", entry.glyph);
        frag.appendChild(tile);
        shown += 1;
      });
      grid.textContent = "";
      grid.appendChild(frag);
    }, 90));

    searchBtn.addEventListener("click", function() {
      search.hidden = !search.hidden;
      if (!search.hidden) { search.focus(); }
      else if (search.value) { search.value = ""; paint(emojiFolder); }
    });

    var railFrag = document.createDocumentFragment();
    var menuFrag = document.createDocumentFragment();
    EMOJI_GROUPS.forEach(function(group2) {
      var tab = document.createElement("button");
      tab.type = "button";
      tab.className = "tk-emoji-folder ge-cat-pill";
      tab.setAttribute("data-folder", group2.id);
      tab.setAttribute("role", "tab");
      tab.title = group2.label + " (" + group2.items.length + ")";
      tab.textContent = group2.label;
      railFrag.appendChild(tab);

      var category = document.createElement("button");
      category.type = "button";
      category.className = "ge-category-option";
      category.setAttribute("data-folder", group2.id);
      var ico = document.createElement("span");
      ico.className = "ge-category-option-icon";
      ico.textContent = group2.icon;
      var copy = document.createElement("span");
      copy.className = "ge-category-option-copy";
      var b = document.createElement("b");
      b.textContent = group2.label;
      var s = document.createElement("small");
      s.textContent = group2.items.length + " emoji";
      copy.appendChild(b);
      copy.appendChild(s);
      category.appendChild(ico);
      category.appendChild(copy);
      menuFrag.appendChild(category);
    });
    rail.appendChild(railFrag);
    categoryMenu.appendChild(menuFrag);

    function pickFolder(ev) {
      var btn = ev.target && ev.target.closest ? ev.target.closest("[data-folder]") : null;
      if (!btn) return;
      if (search.value) { search.value = ""; }
      paint(btn.getAttribute("data-folder"));
    }
    rail.addEventListener("click", pickFolder);
    categoryMenu.addEventListener("click", pickFolder);
    catBtn.addEventListener("click", function() {
      categoryMenu.hidden = !categoryMenu.hidden;
      catBtn.setAttribute("aria-expanded", categoryMenu.hidden ? "false" : "true");
    });

    paint(emojiFolder);
  }

  function openEmojiModal(glyph) {
    selectedEmoji = glyph;
    var modal = byId("emojiModal");
    if (!modal) return;
    byId("modalEmojiIcon").textContent = glyph;
    byId("modalEmojiName").textContent = "Selected: " + glyph;
    modal.hidden = false;
  }
  function closeEmojiModal() {
    var modal = byId("emojiModal");
    if (modal) modal.hidden = true;
  }
  function copyText(value) {
    try {
      var ta = document.createElement("textarea");
      ta.value = value;
      ta.style.position = "fixed";
      ta.style.opacity = "0";
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      document.body.removeChild(ta);
      return true;
    } catch (e) {
      return false;
    }
  }
  var EXPR_ICONS = {
    wiggle: { fx: "fx-wiggle", d: "M2 12h3l2-5 3 10 3-8 2 3h5" },
    rotat: { fx: "fx-spin", d: "M21 12a9 9 0 1 1-3-6.7M21 3v5h-5" },
    spin: { fx: "fx-spin", d: "M21 12a9 9 0 1 1-3-6.7M21 3v5h-5" },
    bounce: { fx: "fx-bounce", d: "M12 3v10M12 21a5 5 0 0 0 0-10 5 5 0 0 0 0 10Z" },
    pulse: { fx: "fx-pulse", d: "M20.8 5.6a5 5 0 0 0-7.1 0L12 7.3l-1.7-1.7a5 5 0 1 0-7.1 7.1l8.8 8.8 8.8-8.8a5 5 0 0 0 0-7.1Z" },
    scale: { fx: "fx-pulse", d: "M4 9V4h5M20 15v5h-5M4 4l6 6M20 20l-6-6" },
    loop: { fx: "fx-spin", d: "M17 2l4 4-4 4M3 11v-1a4 4 0 0 1 4-4h14M7 22l-4-4 4-4M21 13v1a4 4 0 0 1-4 4H3" },
    time: { fx: "fx-spin", d: "M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18ZM12 7v5l3 2" },
    random: { fx: "fx-wiggle", d: "M16 3h5v5M4 20 21 3M21 16v5h-5M15 15l6 6M4 4l5 5" },
    inertia: { fx: "fx-slide", d: "M3 17c4 0 4-10 8-10s4 10 8 10" },
    bezier: { fx: "fx-slide", d: "M3 18c6 0 12-12 18-12" },
    position: { fx: "fx-slide", d: "M5 12h14M12 5l7 7-7 7" },
    opacity: { fx: "fx-pulse", d: "M12 3v18M12 3a9 9 0 0 1 0 18Z" },
    blur: { fx: "fx-pulse", d: "M12 3c-3 4-5 6.5-5 9a5 5 0 0 0 10 0c0-2.5-2-5-5-9Z" },
    text: { fx: "fx-wiggle", d: "M4 6h16M9 6v13M4 6V4h16v2" },
    audio: { fx: "fx-bounce", d: "M4 12v2M8 8v10M12 5v14M16 9v6M20 11v2" },
    shake: { fx: "fx-wiggle", d: "M3 12h4l2-6 3 12 3-9 2 3h4" },
    flicker: { fx: "fx-pulse", d: "M13 2 4 14h6l-1 8 9-12h-6l1-8Z" },
    color: { fx: "fx-pulse", d: "M12 21a9 9 0 1 1 9-9c0 2-1.5 3-3 3h-2a2 2 0 0 0-2 2c0 1.5-1 4-2 4Z" }
  };
  var EXPR_ICON_FALLBACK = { fx: "fx-slide", d: "M4 7h16M4 12h10M4 17h7" };
  function exprIconFor(name) {
    var key = String(name || "").toLowerCase();
    for (var k in EXPR_ICONS) {
      if (EXPR_ICONS.hasOwnProperty(k) && key.indexOf(k) !== -1) return EXPR_ICONS[k];
    }
    return EXPR_ICON_FALLBACK;
  }
  function exprDescFor(item) {
    if (item.desc) return item.desc;
    var code = String(item.code || "").split("\n")[0];
    return code ? code.slice(0, 90) : "Expression for " + item.target + ".";
  }
  var expressionAutoplay = false;
  function setExpressionAutoplay(enabled) {
    expressionAutoplay = !!enabled;
    document.body.classList.toggle("expr-autoplay", expressionAutoplay);
    document.body.classList.toggle("expr-motion-paused", !expressionAutoplay);
    var button = document.querySelector("#exprAutoplay");
    if (button) {
      button.textContent = expressionAutoplay ? "Ⅱ" : "▶";
      button.title = expressionAutoplay ? "Turn expression autoplay off" : "Turn expression autoplay on";
      button.setAttribute("aria-label", button.title);
      button.setAttribute("aria-pressed", expressionAutoplay ? "true" : "false");
    }
    var cards = document.querySelectorAll("#exprGrid .tk-expr-card");
    for (var i = 0; i < cards.length; i += 1) cards[i].classList.toggle("expr-preview-active", expressionAutoplay);
  }
  /* v3.41.0 — expression category chips. The category is derived from the
     preset target, so no data file has to be touched when new expressions are
     pushed into EXPRESSIONS. Filtering is pure DOM class work (no re-render),
     which keeps the panel snappy on the legacy CEP engine. */
  var EXPR_CATS = [
    { id: "all", label: "All" },
    { id: "position", label: "Position", match: ["position", "anchor"] },
    { id: "scale", label: "Scale", match: ["scale"] },
    { id: "rotation", label: "Rotation", match: ["rotation", "orientation"] },
    { id: "opacity", label: "Opacity", match: ["opacity"] },
    { id: "text", label: "Text", match: ["text", "source text"] }
  ];
  var exprActiveCat = "all";
  function exprCatOf(item) {
    var target = String(item && item.target || "").toLowerCase();
    for (var i = 1; i < EXPR_CATS.length; i += 1) {
      var m = EXPR_CATS[i].match;
      for (var j = 0; j < m.length; j += 1) {
        if (target.indexOf(m[j]) !== -1) return EXPR_CATS[i].id;
      }
    }
    return "other";
  }
  function exprApplyFilter() {
    var query = "";
    var search = document.querySelector(".tk-expr-reference-search");
    if (search) query = String(search.value || "").toLowerCase().replace(/^\s+|\s+$/g, "");
    var cards = document.querySelectorAll("#exprGrid .tk-expr-card");
    for (var i = 0; i < cards.length; i += 1) {
      var okText = !query || (cards[i].getAttribute("data-search") || "").indexOf(query) !== -1;
      var okCat = exprActiveCat === "all" || cards[i].getAttribute("data-cat") === exprActiveCat;
      cards[i].style.display = okText && okCat ? "flex" : "none";
    }
  }
  function ensureExpressionReferenceControls() {
    var toolbar = document.querySelector(".tk-expr-toolbar");
    if (!toolbar || toolbar.querySelector(".tk-expr-reference-actions")) return;

    var cats = document.createElement("div");
    cats.className = "tk-expr-cats";
    EXPR_CATS.forEach(function(cat) {
      var chip = document.createElement("button");
      chip.type = "button";
      chip.className = "tk-expr-cat" + (cat.id === exprActiveCat ? " active" : "");
      chip.textContent = cat.label;
      chip.setAttribute("data-cat", cat.id);
      chip.addEventListener("click", function() {
        exprActiveCat = cat.id;
        var all = cats.querySelectorAll(".tk-expr-cat");
        for (var i = 0; i < all.length; i += 1) {
          all[i].classList.toggle("active", all[i].getAttribute("data-cat") === exprActiveCat);
        }
        exprApplyFilter();
      });
      cats.appendChild(chip);
    });
    toolbar.appendChild(cats);

    var actions = document.createElement("div");
    actions.className = "tk-expr-reference-actions";

    var search = document.createElement("input");
    search.type = "search";
    search.className = "tk-expr-reference-search";
    search.placeholder = "Search";
    search.setAttribute("aria-label", "Search expressions");
    search.addEventListener("input", tkDebounce(exprApplyFilter, 90));
    actions.appendChild(search);


    var refreshButton = document.createElement("button");
    refreshButton.type = "button";
    refreshButton.className = "tk-expr-reference-icon";
    refreshButton.textContent = "↻";
    refreshButton.title = "Reset expression search";
    refreshButton.setAttribute("aria-label", "Reset expression search");
    refreshButton.addEventListener("click", function() {
      search.value = "";
      search.dispatchEvent(new Event("input"));
      search.focus();
    });
    actions.appendChild(refreshButton);

    var autoplayButton = document.createElement("button");
    autoplayButton.type = "button";
    autoplayButton.id = "exprAutoplay";
    autoplayButton.className = "tk-expr-reference-icon";
    autoplayButton.textContent = "▶";
    autoplayButton.title = "Turn expression autoplay on";
    autoplayButton.setAttribute("aria-label", "Turn expression autoplay on");
    autoplayButton.setAttribute("aria-pressed", "false");
    autoplayButton.addEventListener("click", function() { setExpressionAutoplay(!expressionAutoplay); });
    actions.appendChild(autoplayButton);

    toolbar.appendChild(actions);
    setExpressionAutoplay(false);
  }
  function renderExpressions() {
    var grid = byId("exprGrid");
    if (!grid) return;
    ensureExpressionReferenceControls();
    grid.innerHTML = "";
    grid.classList.add("tk-expr-grid");
    var exprPreviewObserver = null;
    var expressionFragment = document.createDocumentFragment();
    EXPRESSIONS.forEach(function(item) {
      var card = document.createElement("article");
      card.className = "tk-expr-card";
      card.tabIndex = 0;
      card.title = item.name;
      card.setAttribute("data-search", (item.name + " " + item.target + " " + (item.desc || "")).toLowerCase());
      card.setAttribute("data-cat", exprCatOf(item));

      var meta = exprIconFor(item.name);
      var icon = document.createElement("div");
      icon.className = "tk-expr-icon " + meta.fx;
      icon.innerHTML = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="' + meta.d + '"/></svg>';
      card.appendChild(icon);
      var pop = document.createElement("div");
      pop.className = "tk-expr-pop";
      var title = document.createElement("h3");
      title.textContent = item.name;
      pop.appendChild(title);
      var desc = document.createElement("p");
      desc.className = "tk-expr-desc";
      desc.textContent = exprDescFor(item);
      pop.appendChild(desc);
      if (item.code) {
        var code = document.createElement("code");
        code.className = "tk-expr-code";
        code.textContent = item.code;
        pop.appendChild(code);
      }
      var metaRow = document.createElement("div");
      metaRow.className = "tk-expr-meta";
      var target = document.createElement("span");
      target.className = "tk-expr-target";
      target.textContent = item.target;
      metaRow.appendChild(target);
      metaRow.appendChild(voteBar("expression", item.name));
      pop.appendChild(metaRow);
      var actions = document.createElement("div");
      actions.className = "tk-expr-actions";
      var apply = document.createElement("button");
      apply.type = "button";
      apply.className = "primary-button";
      apply.textContent = "Apply";
      apply.addEventListener("click", function(ev) {
        ev.stopPropagation();
        var sel = byId("exprTarget");
        var mode = sel && sel.value ? sel.value : "selected";
        setInline("exprStatus", "Applying " + item.name + " → " + mode + "…", "");
        call("toolkitApplyExpression", [item.name, mode]).then(function(res) {
          reportResult(
            "exprStatus",
            res,
            item.name + " applied on " + (res && res.target || mode) + (res && res.fromSelection ? " (" + res.fromSelection + " selected propert" + (res.fromSelection === 1 ? "y" : "ies") + ")" : "") + "."
          );
        }).catch(function(err) {
          reportResult("exprStatus", { ok: false, error: err.message }, "");
        });
      });
      actions.appendChild(apply);
      var copy = document.createElement("button");
      copy.type = "button";
      copy.className = "ghost-button";
      copy.textContent = "Copy";
      copy.title = item.code;
      copy.addEventListener("click", function(ev) {
        ev.stopPropagation();
        var done = copyText(item.code);
        setInline("exprStatus", done ? item.name + " copied." : "Copy failed.", done ? "ok" : "error");
      });
      actions.appendChild(copy);
      pop.appendChild(actions);
      card.appendChild(pop);
      card.addEventListener("dblclick", function() {
        apply.click();
      });
      card.addEventListener("mouseenter", function() {
        var r = card.getBoundingClientRect();
        var vw = window.innerWidth || document.documentElement.clientWidth;
        var vh = window.innerHeight || document.documentElement.clientHeight;
        var edge = 8;
        var gap = 10;
        var popWidth = Math.min(250, Math.max(180, vw - edge * 2));
        var left;
        var top;
        pop.style.width = popWidth + "px";
        pop.style.right = "auto";
        pop.style.bottom = "auto";
        pop.style.margin = "0";
        left = r.right + gap;
        if (left + popWidth > vw - edge) left = r.left - gap - popWidth;
        left = Math.max(edge, Math.min(left, vw - popWidth - edge));
        top = r.top;
        top = Math.max(edge, Math.min(top, vh - pop.offsetHeight - edge));
        pop.style.left = left - r.left + "px";
        pop.style.top = top - r.top + "px";
      });
      expressionFragment.appendChild(card);
    });
    grid.appendChild(expressionFragment);
    var expressionCards = grid.querySelectorAll(".tk-expr-card");
    for (var staticIndex = 0; staticIndex < expressionCards.length; staticIndex += 1) {
      expressionCards[staticIndex].classList.toggle("expr-preview-active", expressionAutoplay);
    }
    if (typeof window.IntersectionObserver === "function") {
      exprPreviewObserver = new window.IntersectionObserver(function(entries) {
        if (!expressionAutoplay) return;
        for (var ei = 0; ei < entries.length; ei += 1) {
          entries[ei].target.classList.toggle("expr-preview-active", entries[ei].isIntersecting);
        }
      }, { root: grid.parentNode, rootMargin: "80px 0px", threshold: 0.01 });
      for (var ci = 0; ci < expressionCards.length; ci += 1) exprPreviewObserver.observe(expressionCards[ci]);
    }
  }
  var SEARCHABLE = ".tk-card, .tk-emoji-button, .tk-expr-card, .tk-swatch, .tk-action";
  function panelGrids(panel) {
    return panel.querySelectorAll(".tk-grid, .tk-emoji-grid, .tk-expr-grid, .tk-action-grid");
  }
  function ensureEmptyNode(grid) {
    var node = grid.querySelector(".tk-empty");
    if (!node) {
      node = document.createElement("div");
      node.className = "tk-empty";
      node.textContent = "No match in this section.";
      grid.appendChild(node);
    }
    return node;
  }
  var bmOnly = false;
  function applyFilter() {
    var input = byId("tkSearch");
    var term = input ? input.value.trim().toLowerCase() : "";
    var clear = byId("tkSearchClear");
    if (clear) clear.hidden = term.length === 0;
    if (term) {
      try {
        expandTextStyles();
      } catch (eX) {
      }
    }
    var countEl = byId("tkBookmarkCount");
    if (countEl) countEl.textContent = String(bmCount());
    var panels = document.querySelectorAll(".tools-tab-panel");
    var totalVisible = 0;
    Array.prototype.forEach.call(panels, function(panel) {
      var panelVisible = 0;
      Array.prototype.forEach.call(panelGrids(panel), function(grid) {
        var items = grid.querySelectorAll(SEARCHABLE);
        var shown = 0;
        Array.prototype.forEach.call(items, function(item) {
          var hay = (item.getAttribute("data-search") || item.textContent || "").toLowerCase();
          var match = !term || hay.indexOf(term) !== -1;
          if (match && bmOnly) match = item.getAttribute("data-bookmarked") === "1";
          item.classList.toggle("tk-hidden", !match);
          if (match) shown++;
        });
        if (items.length) {
          var empty = ensureEmptyNode(grid);
          empty.classList.toggle("tk-hidden", shown > 0);
        }
        panelVisible += shown;
      });
      var key = panel.id.replace("tab-", "");
      var counter = document.querySelector('.tk-tab-count[data-count="' + key + '"]');
      if (counter) {
        if (key === "emoji") {
          counter.textContent = "1915";
        } else {
          counter.textContent = String(panelVisible);
        }
      }
      totalVisible += panelVisible;
    });
    var meta = byId("tkResultCount");
    if (meta) meta.textContent = term ? totalVisible + " match" + (totalVisible === 1 ? "" : "es") : "All presets";
    if (animFfxAuto) window.setTimeout(ffxSyncAutoplay, 0);
  }
  function bindSearch() {
    var star = byId("tkBookmarkFilter");
    if (star) {
      star.addEventListener("click", function() {
        bmOnly = !bmOnly;
        star.classList.toggle("is-on", bmOnly);
        star.setAttribute("aria-pressed", bmOnly ? "true" : "false");
        applyFilter();
      });
    }
    var input = byId("tkSearch");
    if (input) {
      input.addEventListener("input", tkDebounce(applyFilter, 90));
      input.addEventListener("keydown", function(event) {
        if (event.key === "Escape") {
          input.value = "";
          applyFilter();
        }
      });
    }
    var clear = byId("tkSearchClear");
    if (clear) {
      clear.addEventListener("click", function() {
        if (input) {
          input.value = "";
          input.focus();
        }
        applyFilter();
      });
    }
    document.addEventListener("keydown", function(event) {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "f") {
        event.preventDefault();
        if (input) {
          input.focus();
          input.select();
        }
      }
    });
  }
  function bindTabs() {
    var tabs = document.querySelectorAll(".tools-tab");
    Array.prototype.forEach.call(tabs, function(tab) {
      tab.addEventListener("click", function() {
        Array.prototype.forEach.call(tabs, function(other) {
          other.classList.remove("active");
          other.setAttribute("aria-selected", "false");
        });
        tab.classList.add("active");
        tab.setAttribute("aria-selected", "true");
        var panels = document.querySelectorAll(".tools-tab-panel");
        Array.prototype.forEach.call(panels, function(panel) {
          panel.classList.remove("active");
        });
        var active = byId("tab-" + tab.getAttribute("data-tab"));
        if (active) active.classList.add("active");
      });
    });
  }
  var group = "all";
  function categoryLabel(id) {
    for (var i = 0; i < ANIM_CATEGORIES.length; i += 1) {
      if (ANIM_CATEGORIES[i].id === id) {
        return lang === "bn" ? ANIM_CATEGORIES[i].labelBn : ANIM_CATEGORIES[i].label;
      }
    }
    return "All animations";
  }
  function applyGroup() {
    var grid = byId("animGrid");
    if (!grid) return;
    var shown = 0;
    Array.prototype.forEach.call(grid.querySelectorAll(".tk-card"), function(card) {
      var g = card.getAttribute("data-group");
      var off = group !== "all" && g !== group;
      card.classList.toggle("tk-group-off", off);
      if (!off) shown += 1;
    });
    var badge = byId("animCatLabel");
    if (badge) badge.textContent = categoryLabel(group);
    var count = byId("animCatCount");
    if (count) count.textContent = String(shown);
    var btn = byId("animCatBtn");
    if (btn) btn.classList.toggle("is-filtered", group !== "all");
    var menu = byId("animCatMenu");
    if (menu) {
      Array.prototype.forEach.call(menu.querySelectorAll(".tk-catmenu-item"), function(item) {
        item.classList.toggle("active", item.getAttribute("data-group") === group);
      });
    }
    var chips = document.querySelectorAll("#animGroups .tk-chip");
    Array.prototype.forEach.call(chips, function(chip) {
      chip.classList.toggle("active", chip.getAttribute("data-group") === group);
    });
  }
  /* Category picker next to the play button. Nothing selected = "all". */
  function renderCategoryMenu() {
    var menu = byId("animCatMenu");
    var btn = byId("animCatBtn");
    if (!menu || !btn) return;
    menu.innerHTML = "";
    ANIM_CATEGORIES.forEach(function(cat) {
      var total = 0;
      for (var i = 0; i < ANIMATIONS.length; i += 1) {
        if (cat.id === "all" || ANIMATIONS[i].group === cat.id) total += 1;
      }
      if (!total) return;
      var item = document.createElement("button");
      item.type = "button";
      item.className = "tk-catmenu-item" + (cat.id === group ? " active" : "");
      item.setAttribute("data-group", cat.id);
      item.setAttribute("role", "menuitem");
      var name = document.createElement("span");
      name.className = "tk-catmenu-name";
      name.textContent = lang === "bn" ? cat.labelBn : cat.label;
      var num = document.createElement("span");
      num.className = "tk-catmenu-count";
      num.textContent = String(total);
      item.appendChild(name);
      item.appendChild(num);
      item.addEventListener("click", function() {
        group = cat.id;
        closeCategoryMenu();
        applyGroup();
      });
      menu.appendChild(item);
    });
  }
  function closeCategoryMenu() {
    var menu = byId("animCatMenu");
    var btn = byId("animCatBtn");
    if (menu) menu.hidden = true;
    if (btn) btn.setAttribute("aria-expanded", "false");
  }
  function bindCategoryMenu() {
    var btn = byId("animCatBtn");
    var menu = byId("animCatMenu");
    if (!btn || !menu) return;
    btn.addEventListener("click", function(event) {
      event.stopPropagation();
      var open = menu.hidden;
      if (open) renderCategoryMenu();
      menu.hidden = !open;
      btn.setAttribute("aria-expanded", open ? "true" : "false");
    });
    document.addEventListener("click", function(event) {
      if (menu.hidden) return;
      if (menu.contains(event.target) || btn.contains(event.target)) return;
      closeCategoryMenu();
    });
    document.addEventListener("keydown", function(event) {
      if (event.key === "Escape") closeCategoryMenu();
    });
    renderCategoryMenu();
  }
  function bindGroups() {
    var chips = document.querySelectorAll("#animGroups .tk-chip");
    Array.prototype.forEach.call(chips, function(chip) {
      chip.addEventListener("click", function() {
        Array.prototype.forEach.call(chips, function(c) {
          c.classList.remove("active");
        });
        chip.classList.add("active");
        group = chip.getAttribute("data-group");
        applyGroup();
      });
    });
    bindCategoryMenu();
    renderLangChips();
    var cloudRefresh = byId("cloudStyleRefresh");
    if (cloudRefresh) {
      cloudRefresh.addEventListener("click", function() {
        renderCloudTextStyles(true);
      });
    }
    var toggle = byId("tkSearchToggle");
    var box = byId("tkSearchBox");
    if (toggle && box) {
      toggle.addEventListener("click", function() {
        box.classList.toggle("open");
        if (box.classList.contains("open")) byId("tkSearch").focus();
      });
    }
  }
  function bindControls() {
    var slider = byId("animDuration");
    if (slider) {
      slider.addEventListener("input", function() {
        var value = currentDuration().toFixed(1) + "s";
        var lbl = byId("animDurationLabel");
        if (lbl) lbl.textContent = value;
        var curve = byId("curveEaseLabel");
        if (curve) curve.textContent = "Duration: " + value;
      });
    }
    var copyButton = byId("emojiCopyButton");
    if (copyButton) {
      copyButton.addEventListener("click", function() {
        try {
          var area = document.createElement("textarea");
          area.value = selectedEmoji;
          document.body.appendChild(area);
          area.select();
          document.execCommand("copy");
          document.body.removeChild(area);
          setInline("emojiStatus", "Copied " + selectedEmoji, "ok");
          toast("Copied " + selectedEmoji, "ok");
        } catch (e) {
          setInline("emojiStatus", "Copy failed.", "error");
        }
        closeEmojiModal();
      });
    }
    var insertButton = byId("emojiInsertButton");
    if (insertButton) {
      insertButton.addEventListener("click", function() {
        closeEmojiModal();
        setInline("emojiStatus", "Inserting " + selectedEmoji + "…", "");
        call("toolkitInsertEmoji", [selectedEmoji]).then(function(res) {
          reportResult("emojiStatus", res, "Inserted " + selectedEmoji);
        }).catch(function(err) {
          reportResult("emojiStatus", { ok: false, error: err.message }, "");
        });
      });
    }
    var cancelButton = byId("emojiCancelButton");
    if (cancelButton) cancelButton.addEventListener("click", closeEmojiModal);
    var modal = byId("emojiModal");
    if (modal) {
      modal.addEventListener("click", function(event) {
        if (event.target === modal) closeEmojiModal();
      });
    }
    document.addEventListener("keydown", function(event) {
      if (event.key === "Escape") closeEmojiModal();
    });
  }
  function refreshContext() {
    if (!cs) {
      setStatus("Preview mode", "ok");
      return;
    }
    call("toolkitGetContext", []).then(function(res) {
      if (!res || !res.ok) return setStatus("Host not ready", "error");
      // Keep the FFX live previews scaled against the font size AE will
      // actually render at (px-based strokeWidth / leading / baselineShift).
      if (typeof res.fontSize === "number" && res.fontSize > 0 && res.fontSize !== ffxRefFontSize) {
        ffxRefFontSize = res.fontSize;
        if (typeof loadFfxStyles === "function") loadFfxStyles();
      }
      if (!res.comp) return setStatus("No active comp", "pending");
      setStatus(res.selected + " layer(s) selected", "ok");
    }).catch(function() {
      setStatus("Host unavailable", "error");
    });

  }
  function loadFfx() {
    if (!cs) {
      renderFfxAnim([]);
      renderFfxColor([]);
      applyFilter();
      return;
    }
    call("toolkitListFFX", []).then(function(res) {
      var installed = [];
      if (res && res.ok && res.presets) {
        installed = res.presets.map(function(p) {
          return p.name;
        });
      }
      renderFfxAnim(installed);
      renderFfxColor(installed);
      applyFilter();
    }).catch(function() {
      renderFfxAnim([]);
      renderFfxColor([]);
      applyFilter();
    });
  }
  function reloadHostScript() {
    return ensureHostScript().catch(function(error) {
      setStatus(error.message || String(error), "error");
    });
  }
  function verifyHostBuild() {
    if (!cs) return;
    call("toolkitHostBuild", []).then(function(res) {
      var expected = window.GHOST_BUILD && window.GHOST_BUILD.version || "";
      if (!res || !res.ok) return setStatus("Host script not loaded — restart After Effects", "error");
      if (expected && res.version && res.version !== expected) {
        setStatus("Old host script running (" + res.version + ") — restart After Effects", "error");
        toast("Stale host script " + res.version + " vs panel " + expected, "error");
      }
    }).catch(function() {
    });
  }
  var FFX_GROUPS = [
    { key: "fill", label: "Fill Colour", on: true },
    { key: "stroke", label: "Stroke", on: true },
    { key: "font", label: "Font / Typeface", on: true },
    { key: "size", label: "Font Size", on: true },
    { key: "tracking", label: "Tracking", on: true },
    { key: "leading", label: "Leading", on: true },
    { key: "justification", label: "Justification", on: false },
    { key: "baseline", label: "Baseline Shift", on: false },
    { key: "effects", label: "Effects", on: true },
    { key: "layerStyles", label: "Layer Styles", on: true },
    { key: "animators", label: "Text Animators", on: false },
    { key: "moreOptions", label: "More Options", on: false },
    { key: "pathOptions", label: "Path Options", on: false },
    { key: "transform", label: "Transform", on: false },
    { key: "masks", label: "Masks", on: false },
    { key: "blend", label: "Blend Mode", on: false }
  ];
  function ffxFileUrl(path) {
    var clean = String(path).replace(/\\/g, "/");
    if (clean.charAt(0) !== "/") clean = "/" + clean;
    return "file://" + encodeURI(clean);
  }
  function renderFfxCheckList() {
    var box = byId("ffxCheckList");
    if (!box || box.childNodes.length) return;
    FFX_GROUPS.forEach(function(group2) {
      var row = document.createElement("label");
      row.className = "tk-ffx-row";
      var input = document.createElement("input");
      input.type = "checkbox";
      input.value = group2.key;
      input.checked = !!group2.on;
      input.setAttribute("data-ffx-group", group2.key);
      var text = document.createElement("span");
      text.textContent = group2.label;
      row.appendChild(input);
      row.appendChild(text);
      box.appendChild(row);
    });
  }
  function ffxSelectedGroups() {
    var out = {};
    var inputs = document.querySelectorAll("#ffxCheckList input[type=checkbox]");
    for (var i = 0; i < inputs.length; i += 1) {
      if (inputs[i].checked) out[inputs[i].value] = true;
    }
    var toggle = byId("ffxPreviewToggle");
    out.preview = !toggle || toggle.checked;
    var lock = byId("ffxRampLockToggle");
    out.rampLock = !lock || lock.checked;
    return out;
  }
  function openFfxModal() {
    renderFfxCheckList();
    var modal = byId("ffxModal");
    if (!modal) return;
    setInline("ffxModalStatus", "", "");
    modal.hidden = false;
    var input = byId("ffxNameInput");
    if (input) {
      if (!input.value) input.value = "My Text Style";
      input.focus();
      input.select();
    }
  }
  function closeFfxModal() {
    var modal = byId("ffxModal");
    if (modal) modal.hidden = true;
  }
  /* ── FFX live preview ──────────────────────────────────────────────────
   * After Effects TextDocument units (AE scripting guide), and how each one
   * maps to CSS in this preview:
   *   fillColor / strokeColor : [r,g,b] floats 0..1  -> rgb() 0..255
   *   fontSize                : PIXELS (comp pixels, NOT points, NOT fps or
   *                             pixel-aspect dependent) -> preview reference
   *   strokeWidth             : PIXELS at the layer font size, stroke is
   *                             centred on the glyph outline, exactly like
   *                             CSS -webkit-text-stroke -> scale by
   *                             previewPx / referenceFontSizePx
   *   tracking                : THOUSANDTHS OF AN EM (1/1000 em) -> em/1000
   *   tsume                   : fraction 0..1 of an em removed each side ->
   *                             subtract (tsume * 2 / 2) em from letterSpacing
   *   leading                 : PIXELS (absolute), only meaningful when
   *                             autoLeading is false -> unitless line-height
   *                             = leading / referenceFontSizePx
   *   baselineShift           : PIXELS -> em = px / referenceFontSizePx
   *   allCaps / smallCaps / fauxBold / fauxItalic / justification : booleans
   *                             / enum -> text-transform, weight, style, align
   * A .ghostffx preset only carries fontSize when the "size" group was saved.
   * When it is absent, the AE layer keeps its own size, so the preview scales
   * against the live selected text layer's fontSize (reported by
   * toolkitGetContext) and falls back to AE's 72 px default.
   * ---------------------------------------------------------------------- */
  var FFX_PREVIEW_FONT_PX = 20;
  var FFX_DEFAULT_REF_FONT_PX = 72;
  var ffxRefFontSize = FFX_DEFAULT_REF_FONT_PX;
  function ffxReferenceFontSize(doc) {
    var size = doc && typeof doc.fontSize === "number" ? doc.fontSize : ffxRefFontSize;
    if (!size || isNaN(size) || size <= 0) size = FFX_DEFAULT_REF_FONT_PX;
    return size;
  }
  function ffxStyledPreview(preset) {
    var doc = preset && preset.doc ? preset.doc : null;
    var span = document.createElement("span");
    span.className = "tk-preview-text tk-ffx-live";
    span.textContent = preset.sample || preset.name || "Aa";
    if (!doc) return span;
    var rgb = function(c) {
      if (!c || c.length < 3) return null;
      return "rgb(" + c.slice(0, 3).map(function(v) {
        return Math.max(0, Math.min(255, Math.round(v * 255)));
      }).join(",") + ")";
    };
    // Reference size the AE composition will actually render this style at.
    var refSize = ffxReferenceFontSize(doc);
    var pxToPreview = FFX_PREVIEW_FONT_PX / refSize;

    var fill = doc.applyFill === false ? null : rgb(doc.fillColor);
    var stroke = doc.applyStroke ? rgb(doc.strokeColor) : null;
    if (fill) span.style.color = fill;
    if (stroke) {
      // AE strokeWidth is pixels at the layer font size — scale it into the
      // preview instead of clamping to a fixed 1–4 px CSS width.
      var w = Number(doc.strokeWidth);
      if (isNaN(w) || w < 0) w = 0;
      w = w * pxToPreview;
      span.style.webkitTextStroke = (Math.round(w * 100) / 100) + "px " + stroke;
      // CSS paints the text stroke OVER the fill by default, which is AE's
      // strokeOverFill = true. paint-order:"stroke fill" draws the stroke
      // first and the fill on top = strokeOverFill false. (Was inverted.)
      span.style.paintOrder = doc.strokeOverFill ? "fill stroke" : "stroke fill";
    }
    // AE tracking is thousandths of an em, so /1000 (not /100).
    var trackEm = typeof doc.tracking === "number" ? doc.tracking / 1e3 : 0;
    // tsume tightens each side by a fraction of an em; net one-side effect.
    if (typeof doc.tsume === "number" && doc.tsume) trackEm -= doc.tsume;
    if (trackEm) span.style.letterSpacing = trackEm.toFixed(4) + "em";
    if (doc.autoLeading === false && typeof doc.leading === "number" && doc.leading > 0) {
      span.style.lineHeight = String(Math.round(doc.leading / refSize * 1e3) / 1e3);
    }
    if (typeof doc.baselineShift === "number" && doc.baselineShift) {
      span.style.position = "relative";
      span.style.bottom = (Math.round(doc.baselineShift / refSize * 1e3) / 1e3) + "em";
    }
    if (typeof doc.justification === "string") {
      if (/LEFT/i.test(doc.justification)) span.style.textAlign = "left";
      else if (/RIGHT/i.test(doc.justification)) span.style.textAlign = "right";
      else if (/CENTER/i.test(doc.justification)) span.style.textAlign = "center";
    }
    if (doc.fontFamily) span.style.fontFamily = '"' + String(doc.fontFamily).replace(/"/g, "") + '", inherit';
    if (doc.allCaps) span.style.textTransform = "uppercase";
    else if (doc.smallCaps) span.style.fontVariant = "small-caps";
    if (doc.fauxBold) span.style.fontWeight = "800";
    if (doc.fauxItalic) span.style.fontStyle = "italic";
    return span;
  }

  function ffxCard(preset) {
    var card = document.createElement("div");
    card.className = "tk-card tk-ffx-card tk-ffx-style-card";
    card.setAttribute("role", "button");
    card.setAttribute("tabindex", "0");
    card.setAttribute("data-search", (preset.name + " ffx text style " + (preset.groups || []).join(" ")).toLowerCase());

    /* Style cards are intentionally visual-only: the bundled/user PNG is the
       source of truth. No preset name, badge, duplicate/copy control or live
       CSS reconstruction is shown in the card. */
    var media = document.createElement("div");
    media.className = "tk-ffx-media";

    if (preset.preview) {
      var shot = document.createElement("img");
      shot.className = "tk-ffx-card-shot";
      shot.alt = "";
      shot.draggable = false;
      shot.addEventListener("error", function() {
        if (shot.parentNode) shot.parentNode.removeChild(shot);
        card.classList.add("is-preview-missing");
      });
      shot.src = ffxFileUrl(preset.preview);
      media.appendChild(shot);
    } else {
      card.classList.add("is-preview-missing");
    }

    /* Optional motion preview is retained for folders that already ship one;
       it never adds text or controls to the card. */
    if (preset.video) {
      var clip = document.createElement("video");
      clip.className = "tk-ffx-card-clip";
      clip.muted = true;
      clip.defaultMuted = true;
      clip.loop = true;
      clip.setAttribute("muted", "");
      clip.setAttribute("playsinline", "");
      clip.preload = "metadata";
      clip.addEventListener("loadeddata", function() { card.classList.add("is-clip-ready"); });
      clip.addEventListener("playing", function() { card.classList.add("is-clip-ready", "is-clip-on"); });
      clip.addEventListener("pause", function() { card.classList.remove("is-clip-on"); });
      clip.addEventListener("error", function() {
        card.classList.remove("is-clip-on", "is-clip-ready");
        if (clip.parentNode) clip.parentNode.removeChild(clip);
      });
      clip.src = ffxFileUrl(preset.video);
      media.appendChild(clip);
      card.addEventListener("mouseenter", function() {
        try { clip.currentTime = 0; } catch (e) {}
        var play = clip.play();
        if (play && play.catch) play.catch(function() {});
      });
      card.addEventListener("mouseleave", function() {
        try { clip.pause(); clip.currentTime = 0; } catch (e) {}
        card.classList.remove("is-clip-on");
      });
    }
    card.appendChild(media);

    /* Gradient lock is controlled from the Style header Filter menu only.
       Cards intentionally have no per-card lock control. */
    activate(card, function() {
      setInline("ffxStyleStatus", "Applying style…", "");
      /* The Filter-menu lock is the single source of truth. Read it before
         applying the FFX so the preset cannot silently change the user's
         chosen lock state. */
      call("toolkitFfxGetGradientLock", []).then(function(state) {
        var lockGradient = !!(state && state.ok && state.locked);
        return call("toolkitFfxApplyStyle", [preset.file, lockGradient ? "true" : "false"]);
      }).then(function(res) {
        if (!res || !res.ok) reportResult("ffxStyleStatus", res, "Style could not be applied.");
        else reportResult("ffxStyleStatus", res, "Style applied.");
        return res;
      }).catch(function(err) {
        reportResult("ffxStyleStatus", { ok: false, error: err.message }, "");
      });
    });
    return card;
  }

  function styleFfxFromPack() {
    if (window.GHOST_BUNDLED_STYLE_CATALOG && Array.isArray(window.GHOST_BUNDLED_STYLE_CATALOG)) {
      var root = extensionRoot();
      return Promise.resolve(window.GHOST_BUNDLED_STYLE_CATALOG.map(function(entry) {
        var file = String(entry.file || ""), base = file.replace(/\.ffx$/i, "");
        var rel = "presets/style ffx/" + file;
        var previewRel = "presets/style ffx/" + (entry.preview || (base + ".png"));
        return { name:entry.name||base, file:root?root+"/"+rel:rel, path:root?root+"/"+rel:rel, preview:root?root+"/"+previewRel:null, previewUrl:root?null:encodeURI(previewRel), groups:["style"], sample:"", savedAt:"", doc:null, bundled:true, perfect:true, rampLock:true, kind:"style-ffx", category:entry.category||"Color" };
      }));
    }
    return fetchText("presets/style ffx/pack.json").then(function(text) {
      if (!text) return [];
      var data; try { data=JSON.parse(text); } catch(e) { return []; }
      var list=data&&data.presets?data.presets:[], root=extensionRoot(), out=[];
      for(var i=0;i<list.length;i+=1){var entry=list[i];if(!entry||!entry.file)continue;var file=String(entry.file),base=file.replace(/\.ffx$/i,"");var rel="presets/style ffx/"+file;var previewRel="presets/style ffx/"+(entry.preview||(base+".png"));out.push({name:entry.name||base,file:root?root+"/"+rel:rel,path:root?root+"/"+rel:rel,preview:root?root+"/"+previewRel:null,previewUrl:root?null:encodeURI(previewRel),groups:["style"],sample:"",savedAt:"",doc:null,bundled:true,perfect:true,rampLock:true,kind:"style-ffx",category:entry.category||"Color"});}
      return out;
    }).catch(function(){return [];});
  }

  function loadFfxStyles() {
    var grid=byId("ffxStyleGrid"), empty=byId("ffxStyleEmpty");
    if(!grid)return;
    grid.innerHTML="";
    if(empty){empty.hidden=true;empty.textContent="";}
    function merge(hostList,fallbackList){var out=[],seen={};(hostList||[]).concat(fallbackList||[]).forEach(function(item){if(!item||!item.name)return;var key=String(item.name).toLowerCase();if(seen[key])return;seen[key]=1;out.push(item);});return out;}
    function paint(list){grid.innerHTML="";var styles=(list||[]).filter(function(p){return p&&(p.kind==="style-ffx"||p.kind==="style-ghostffx"||p.scope==="textStyle"||(p.groups||[]).indexOf("style")!==-1);});styles.forEach(function(p){grid.appendChild(ffxCard(p));});if(empty){empty.hidden=styles.length>0;empty.textContent=styles.length?"":"No FFX style presets available.";}applyFilter();}
    styleFfxFromPack().then(function(fallbackList){
      paint(fallbackList);
      call("toolkitFfxListStyles",[]).then(function(res){var hostList=res&&res.ok&&Array.isArray(res.presets)?res.presets:[];var merged=merge(hostList,fallbackList);if(merged.length)paint(merged);}).catch(function(){});
    }).catch(function(){call("toolkitFfxListStyles",[]).then(function(res){paint(res&&res.ok&&res.presets?res.presets:[]);}).catch(function(){paint([]);});});
  }
  function saveFfxStyle() {
    var input = byId("ffxNameInput");
    var name = input ? String(input.value || "").replace(/^\s+|\s+$/g, "") : "";
    if (!name) {
      setInline("ffxModalStatus", "Give the preset a name first.", "warn");
      return;
    }
    var groups = ffxSelectedGroups();
    var picked = 0;
    for (var key in groups) {
      if (groups.hasOwnProperty(key) && key !== "preview" && groups[key]) picked += 1;
    }
    if (!picked) {
      setInline("ffxModalStatus", "Select at least one property group.", "warn");
      return;
    }
    setInline("ffxModalStatus", "Saving preset…", "");
    call("toolkitFfxSaveStyle", [name, JSON.stringify(groups)]).then(function(res) {
      if (res && res.ok) {
        setInline("ffxModalStatus", "", "");
        closeFfxModal();
        setInline("ffxStyleStatus", name + " saved → " + res.folder, "ok");
        toast(name + " saved as FFX text style.", "ok");
        loadFfxStyles();
      } else {
        setInline("ffxModalStatus", res && res.error || "Could not save the preset.", "error");
      }
    }).catch(function(err) {
      setInline("ffxModalStatus", err.message, "error");
    });
  }
  function bindFfxStyles() {
    var importButton = byId("ffxImportButton");
    if (importButton) {
      importButton.addEventListener("click", function() {
        setInline("ffxStyleStatus", "Choose a .ffx / .ghostffx file…", "");
        call("toolkitFfxImportStyle", []).then(function(res) {
          if (res && res.cancelled) return setInline("ffxStyleStatus", "", "");
          if (res && res.ok) {
            setInline("ffxStyleStatus", res.imported.join(", ") + " imported.", "ok");
            loadFfxStyles();
          } else {
            setInline("ffxStyleStatus", res && res.error || "Import failed.", "error");
          }
        }).catch(function(err) {
          setInline("ffxStyleStatus", err.message, "error");
        });
      });
    }
    var folderButton = byId("ffxFolderButton");
    if (folderButton) {
      folderButton.addEventListener("click", function() {
        call("toolkitFfxRevealFolder", []).then(function(res) {
          reportResult("ffxStyleStatus", res, "Preset folder opened.");
        }).catch(function(err) {
          setInline("ffxStyleStatus", err.message, "error");
        });
      });
    }
    var save = byId("ffxSaveButton");
    if (save) save.addEventListener("click", saveFfxStyle);
    var native = byId("ffxNativeButton");
    if (native) {
      native.addEventListener("click", function() {
        setInline("ffxModalStatus", "Opening the After Effects preset dialog…", "");
        call("toolkitFfxNativeSave", []).then(function(res) {
          if (res && res.ok) {
            setInline("ffxModalStatus", "Save it into: " + res.folder, "ok");
          } else {
            setInline("ffxModalStatus", res && res.error || "AE dialog unavailable.", "error");
          }
        }).catch(function(err) {
          setInline("ffxModalStatus", err.message, "error");
        });
      });
    }
    var all = byId("ffxSelectAll");
    var none = byId("ffxSelectNone");
    function setAll(state) {
      var inputs = document.querySelectorAll("#ffxCheckList input[type=checkbox]");
      for (var i = 0; i < inputs.length; i += 1) inputs[i].checked = state;
    }
    if (all) all.addEventListener("click", function() {
      renderFfxCheckList();
      setAll(true);
    });
    if (none) none.addEventListener("click", function() {
      renderFfxCheckList();
      setAll(false);
    });
    var cancel = byId("ffxCancelButton");
    if (cancel) cancel.addEventListener("click", closeFfxModal);
    var modal = byId("ffxModal");
    if (modal) {
      modal.addEventListener("click", function(event) {
        if (event.target === modal) closeFfxModal();
      });
    }
    document.addEventListener("keydown", function(event) {
      if (event.key === "Escape") closeFfxModal();
    });
  }
  function boot() {
    statusEl = byId("toolkitStatus");
    toastRegion = byId("toolkitToastRegion");
    bindTabs();
    bindControls();
    bindGroups();
    bindSearch();
    bindAnimPackModal();
    renderAnimations();
    renderFfxAnim();
    renderColors();
    renderTextStyles();
    renderCloudTextStyles(false);
    renderEmojis();
    renderExpressions();
    renderCombos();
    renderTypography();
    applyFilter();
    ffxRegisterRoot();
    loadFfx();
    bindFfxStyles();
    loadFfxStyles();
    reloadHostScript().then(function() {
      verifyHostBuild();
      refreshContext();
    });
    scheduleContextRefresh();
  }
  /* Context polling used to hit the ExtendScript host every 4s forever, even
     with the panel hidden or untouched. Now it only runs while the panel is
     visible, never overlaps an in-flight call, and backs off to 20s while the
     user is working inside AE (no panel focus / no interaction). */
  var ctxTimer = 0;
  var ctxBusy = false;
  var ctxLastTouch = Date.now();
  function contextIdleDelay() {
    var idleFor = Date.now() - ctxLastTouch;
    var focused = !window.GhostIdle || window.GhostIdle.isFocused();
    if (focused && idleFor < 3e4) return 4e3;
    return 2e4;
  }
  function scheduleContextRefresh(delay) {
    if (ctxTimer) clearTimeout(ctxTimer);
    ctxTimer = setTimeout(runContextRefresh, typeof delay === "number" ? delay : contextIdleDelay());
  }
  function runContextRefresh() {
    ctxTimer = 0;
    if (window.GhostIdle && !window.GhostIdle.isVisible()) return; /* resumed by ghost:resume */
    if (ctxBusy) return scheduleContextRefresh(1e3);
    ctxBusy = true;
    try {
      refreshContext();
    } catch (e) {
    }
    ctxBusy = false;
    scheduleContextRefresh();
  }
  document.addEventListener("ghost:resume", function() {
    ctxLastTouch = Date.now();
    scheduleContextRefresh(0);
  });
  ["pointerdown", "keydown", "focusin"].forEach(function(evt) {
    document.addEventListener(evt, function() {
      var wasIdle = Date.now() - ctxLastTouch > 3e4;
      ctxLastTouch = Date.now();
      if (wasIdle) scheduleContextRefresh(0);
    }, true);
  });
  window.GhostBoot.push(boot);

  /* Public bridge used only by the bundled Web Style Presets module.
     The core call/applyFilter functions remain private to toolkit.js. */
  window.GhostWebStyleAPI = {
    call: call,
    reportResult: reportResult,
    applyFilter: applyFilter
  };

  /* Public, stable UI bridge for the Style header.  Menu actions call these
     real handlers instead of proxying clicks through hidden DOM nodes. */
  window.GhostFfxStyleUI = {
    create: function () { openFfxModal(); },
    importPreset: function () {
      var importButton = byId("ffxImportButton");
      if (importButton) { importButton.click(); return; }
      setInline("ffxStyleStatus", "Import control unavailable.", "error");
    },
    revealFolder: function () {
      call("toolkitFfxRevealFolder", []).then(function (res) {
        reportResult("ffxStyleStatus", res, "Preset folder opened.");
      }).catch(function (err) {
        setInline("ffxStyleStatus", err.message, "error");
      });
    },
    setGradientLock: function (locked) {
      return call("toolkitFfxSetGradientLock", [locked ? "true" : "false"]);
    },
    getGradientLock: function () {
      return call("toolkitFfxGetGradientLock", []);
    },
    exportPack: function () {
      return call("toolkitFfxExportStylePack", []).then(function (res) {
        if (res && res.ok) {
          setInline("ffxStyleStatus", "Preset pack exported.", "ok");
          toast("Style preset pack exported.", "ok");
        } else if (!(res && res.cancelled)) {
          setInline("ffxStyleStatus", (res && res.error) || "Export failed.", "error");
        }
        return res;
      }).catch(function (err) {
        setInline("ffxStyleStatus", err.message, "error");
        return { ok: false, error: err.message };
      });
    }
  };

  /* Diagnostic surface for the Preview/Apply consistency self-test. */
  window.GhostText = window.GhostText || {};
  window.GhostText.diagnoseMotion = diagnoseMotion;
})();
