export interface BlogPost {
  slug: string
  title: string
  tag: string
  date: string
  readingTime: string
  excerpt: string
  body: string[]
}

export const POSTS: BlogPost[] = [
  {
    slug: 'animation-composer-what-it-does-and-alternative',
    title: 'Animation Composer explained: what it does, and a text-focused alternative',
    tag: 'Compare',
    date: 'Oct 2026',
    readingTime: '6 min read',
    excerpt:
      'What Mister Horse Animation Composer does inside After Effects and Premiere Pro, how editors use it, and where Ghostae Text adds 300+ text animations, Bangla support and auto captions.',
    body: [
      'Animation Composer by Mister Horse is one of the most popular free plugins for After Effects, also available for Premiere Pro. It gives editors a single panel to browse presets, transitions, MOGRTs, footage and audio, and drop them onto the timeline.',
      'Beyond the library, Animation Composer includes motion helpers such as keyframe easing and anchor point tools, which speed up everyday animation tasks. Extra preset packs can be added to the library as a project grows.',
      'Most editors use it for quick transitions and general motion elements. Where many users look for more is typography: large sets of kinetic text, word-by-word reveals, caption styles, and titles in scripts beyond Latin.',
      'That is the gap Ghostae Text is built for. It ships 300+ text animations inside the panel, handles Bangla and other non-Latin scripts natively, imports SRT files into styled caption layers, and lets you save your own looks as FFX presets.',
      'Ghostae Text runs on a single lifetime licence, and support happens directly through our WhatsApp community of editors. If Animation Composer covers your transitions, Ghostae Text can sit next to it as your dedicated text and caption tool.',
      'Animation Composer is a trademark of Mister Horse. Ghostae is not affiliated with Mister Horse; this overview is based on public information.',
    ],
  },
  {
    slug: 'best-after-effects-text-animation-plugins',
    title: 'Best After Effects text animation tools in 2026: Animation Composer, Motion Bro, AEJuice and Ghostae',
    tag: 'Compare',
    date: 'Oct 2026',
    readingTime: '5 min read',
    excerpt:
      'A short guide to popular After Effects preset tools — Animation Composer, Motion Bro, AEJuice — and when Ghostae Text is the better fit for kinetic typography and captions.',
    body: [
      'Animation Composer (Mister Horse) is a free asset and preset browser for After Effects and Premiere Pro with transitions, text presets and motion helpers.',
      'Motion Bro is a preset manager that organises and imports preset packs into After Effects and Premiere Pro.',
      'AEJuice provides plugins and animation packs managed through its Pack Manager panel.',
      'Ghostae Text is focused on typography: 300+ text animations, native Bangla and multilingual text, SRT and auto caption workflows, and custom FFX saving — on one lifetime licence.',
      'Pick a general preset browser for transitions and elements; pick Ghostae Text when titles, captions and multilingual text are the core of your edits. Many editors run both side by side.',
    ],
  },
  {
    slug: 'after-effects-expressions-cheat-sheet',
    title: 'After Effects expressions cheat sheet: 12 lines you will reuse forever',
    tag: 'Expressions',
    date: 'Aug 2026',
    readingTime: '7 min read',
    excerpt:
      'A practical After Effects expressions reference — loopOut, wiggle, time remapping, inertial bounce and value linking — with plain-English notes on when each one belongs in a shot.',
    body: [
      'Expressions in After Effects are not maths homework; they are shortcuts that replace keyframes you would otherwise set by hand a hundred times. This cheat sheet collects the twelve expressions we type most often, and the reason each one exists.',
      'Start with looping. `loopOut("cycle")` repeats an animation forever from the last two keyframes, which is how most background loops, ticker bars and idle icon motion get built. Swap in `loopOut("pingpong")` when the motion should breathe rather than restart.',
      'Next, controlled randomness. `wiggle(2, 12)` gives two shakes a second at twelve pixels of travel — enough to sell handheld camera drift without making the frame unreadable. Lower the frequency for a heavy camera, raise the amplitude for a nervous one.',
      'Linking beats duplicating. Pick-whipping a scale property to a single slider control means one adjustment updates an entire lower third. Combine that with `thisComp.layer("CTRL").effect("Slider Control")("Slider")` and your comp becomes a rig other artists can drive without opening every layer.',
      'For overshoot, an inertial bounce expression reads the velocity at the last keyframe and lets the property spring past its target before settling. It is the difference between motion that stops and motion that arrives.',
      'Time-based tricks close the list: `time * 30` for constant rotation, `posterizeTime(12)` for stepped animation, and `valueAtTime(time - 0.1)` for follow-through on trailing layers.',
      'In Ghostae Command you can describe the motion in a sentence instead of remembering syntax — the panel reads the selected layer and property, writes the expression, and applies it. But knowing these twelve patterns still makes you faster, because you can judge whether the generated expression is actually the right one.',
    ],
  },
  {
    slug: 'after-effects-text-animation-presets-guide',
    title: 'After Effects text animation presets: how to build a set you actually use',
    tag: 'TEXT',
    date: 'Aug 2026',
    readingTime: '6 min read',
    excerpt:
      'Most After Effects text animation presets get installed and forgotten. Here is how to design, name and save FFX presets so kinetic typography stops being a from-scratch job.',
    body: [
      'A preset library only pays off when you can find the right entry in under ten seconds. That means fewer presets, better names, and a consistent structure — not a folder with four hundred FFX files.',
      'Group by intent, not by effect. "Headline in", "Word by word", "Caption pop", "Outro credit" are searchable. "Text Animation 12 Final v3" is not.',
      'Build every preset on the same skeleton: a text animator for opacity and position, one range selector, and an ease you like. Once the skeleton is fixed, variations take a minute each and behave predictably when you drop them on someone else\'s comp.',
      'Keep timing relative. Presets that rely on absolute keyframe positions break on a 12-second title but work on a 2-second one. Range-selector offsets and expression-driven stagger survive both.',
      'Ghostae Text ships around 300 animations and lets you save your own as FFX from the panel, so a look you invented on a client job becomes a one-click preset on the next one. Language chips cover scripts beyond Latin, which matters if you deliver Bangla, Hindi or Arabic titles.',
      'Finally, audit twice a year. Delete anything you have not used, and promote the five you always reach for into a Favourites folder. A small library you trust beats a big one you scroll past.',
    ],
  },
  {
    slug: 'auto-captions-after-effects-workflow',
    title: 'Auto captions in After Effects: a repeatable subtitle workflow',
    tag: 'Captions',
    date: 'Jul 2026',
    readingTime: '6 min read',
    excerpt:
      'Transcribe, split, style and time captions for After Effects without hand-keying every line — plus how to fix the three mistakes that make subtitles look amateur.',
    body: [
      'Captions decide whether a social edit is watched on mute or skipped. They are also the most repetitive job in the timeline, which is exactly why they should be automated.',
      'The workflow: transcribe the audio, review the transcript as text, split it into readable lines, then let the panel build timed text layers with one style applied to all of them. Editing the style once updates the track.',
      'Mistake one is line length. Two lines, roughly 40 characters each, is the ceiling before viewers stop reading. Mistake two is timing padded too tightly to the waveform — add a few frames of lead so words appear just before they are spoken. Mistake three is placement: keep captions above the platform UI safe area, or half your text is hidden behind a username.',
      'If you already captioned elsewhere, import the SRT instead of re-transcribing. Ghostae Text builds the layers from the file and applies your preset, which keeps a series visually consistent across editors.',
      'For multilingual delivery, transcribe once and translate the text layer contents, keeping timings intact. It is far faster than restarting the caption pass per language.',
    ],
  },
  {
    slug: 'organise-motion-graphics-assets',
    title: 'How to organise motion graphics assets so you never search twice',
    tag: 'CACHE',
    date: 'Jul 2026',
    readingTime: '5 min read',
    excerpt:
      'A folder structure, tagging rules and preview habits that turn a messy overlay and SFX collection into an asset library you can query mid-edit.',
    body: [
      'Every motion designer collects faster than they organise. Light leaks, film grain, transitions, whooshes, LUTs — spread across an external drive, a downloads folder and two old project archives.',
      'Fix the structure first. One top-level folder per asset class, one level of subfolders at most, and delivery-format separation only where it changes usage (vertical vs horizontal). Deeper trees are where assets go to die.',
      'Then tag on import. A tag you add while the download is fresh costs three seconds; reconstructing it six months later costs three minutes and often fails. Use tags for mood and use-case ("gritty", "wedding", "tech") and folders for type.',
      'Preview before you place. Scrubbing a clip on hover tells you in half a second whether the transition matches your cut, which saves the import-place-undo loop that quietly eats an afternoon.',
      'Ghostae Cache indexes the folders you point it at, keeps thumbnails warm, and adds favourites, tags and bulk download so a search returns the shortlist rather than the whole drive. The habits matter more than the tool, but the tool is what keeps the habits alive under deadline.',
    ],
  },
  {
    slug: 'ai-in-after-effects-what-actually-helps',
    title: 'AI in After Effects: what actually saves time, and what does not',
    tag: 'COMMAND',
    date: 'Jun 2026',
    readingTime: '7 min read',
    excerpt:
      'An honest look at where AI helps a motion designer inside After Effects — expressions, captions, rig setup, cleanup — and the tasks where it is still slower than doing it yourself.',
    body: [
      'AI is genuinely useful in After Effects for tasks with a clear text description and a verifiable result. It is a poor fit for taste-driven decisions, which is most of the interesting work.',
      'Where it wins: expression writing, because you can describe motion in words and instantly see whether the curve is right. Caption transcription, because reading a transcript is faster than typing one. Rig scaffolding, because sliders and controllers are boilerplate. Naming and cleanup passes across dozens of layers, because it is mechanical.',
      'Where it loses: composition, colour and timing judgement. A model can produce a plausible animation, but you still have to decide whether it feels right — and iterating through generated options is often slower than nudging two keyframes.',
      'Model choice matters less than context. An assistant that knows your composition dimensions, frame rate, selected layer and property type will beat a smarter model that knows none of it.',
      'Ghostae Command runs a multi-model setup with automatic fallback, so a provider outage does not stop your session, and every request carries composition context. Tokens are spent on work that returns something you can inspect: an expression, a transcript, a rig — never a vague answer.',
      'The practical rule: automate the parts you can verify in one glance, and keep the parts you would defend in a review meeting for yourself.',
    ],
  },
  {
    slug: 'install-after-effects-extensions-safely',
    title: 'How to install After Effects extensions safely (CEP, ZXP and manual)',
    tag: 'Guide',
    date: 'Jun 2026',
    readingTime: '6 min read',
    excerpt:
      'Where CEP extensions live on Windows and macOS, why a panel shows up blank, and how checksum verification plus rollback keeps an update from wrecking a deadline.',
    body: [
      'An After Effects extension is a CEP panel: HTML and JavaScript in a folder, plus an ExtendScript host that talks to the app. Installing one means putting that folder in the right place and restarting After Effects.',
      'On Windows the shared location is %APPDATA%\\Adobe\\CEP\\extensions; on macOS it is ~/Library/Application Support/Adobe/CEP/extensions. Anything installed there appears under Window > Extensions once After Effects restarts.',
      'Blank panels are almost always one of three things: an unsigned extension without debug mode enabled, a stale CEP cache from a previous version, or a runtime mismatch — older After Effects builds ship an old Chromium that cannot parse modern CSS and JavaScript.',
      'That is why fresh-install matters. Clearing the CEP cache before copying new files prevents a half-old, half-new panel, which is the most confusing failure state there is.',
      'Verify before you trust. A published SHA-256 checksum lets you confirm the archive you downloaded is the archive that was built. And keep a rollback path: a script that restores the previous version turns a bad update from a lost evening into a thirty-second fix.',
      'Ghostae ships with a silent install flag for multi-machine setups, checksum files for every archive, and a rollback command — because updates land mid-deadline whether you planned for it or not.',
    ],
  },
  {
    slug: 'after-effects-workflow-speed',
    title: 'Ten After Effects workflow habits that shave an hour off every project',
    tag: 'Workflow',
    date: 'May 2026',
    readingTime: '6 min read',
    excerpt:
      'Comp naming, proxies, adjustment-layer discipline, preset reuse and shortcut boards — small process changes that compound across a project.',
    body: [
      'Speed in After Effects rarely comes from a faster machine. It comes from removing decisions you have already made once.',
      'Name comps as you create them, with the delivery in the name. Pre-compose to isolate, not to hide. Keep one adjustment layer per purpose — grade, grain, vignette — so a client note changes one layer instead of eight.',
      'Work on proxies for anything above 4K, and switch back only for the final render. Set the resolution and quality presets you actually use as workspace defaults so you stop clicking through menus.',
      'Save selection-based utilities to a shortcut board: rename layers in sequence, sequence layers by a fixed offset, align to comp centre, toggle guides, split at playhead. Individually each saves seconds; across a project it is a working hour.',
      'Reuse aggressively. Yesterday\'s lower third is today\'s preset. Yesterday\'s expression rig is today\'s template. The projects that take longest are the ones that start from an empty comp for no reason.',
      'Ghostae Tools collects around 34 of these utilities in one shortcut board, plus autosave and project notes, so the routine parts stay one click away.',
    ],
  },
  {
    slug: 'after-effects-templates-that-scale',
    title: 'Building After Effects templates that survive handoff',
    tag: 'TEMPLATE',
    date: 'May 2026',
    readingTime: '5 min read',
    excerpt:
      'Essential Graphics controls, expression rigs, naming and render presets — what separates a template someone else can use from a project file only you understand.',
    body: [
      'A template is a promise that someone else can change the text, swap the logo and render without asking you questions. Most project files break that promise.',
      'Expose only what should change. Put text, colour and duration controls in Essential Graphics; leave the rig itself locked away in nested comps. A template with forty exposed properties is not a template, it is a maze.',
      'Drive everything from control layers. One null with sliders for accent colour, animation speed and safe-area padding means a brand refresh is a two-minute edit rather than a rebuild.',
      'Name for strangers. "TXT_headline", "CTRL_master", "BG_gradient" tell a new artist what a layer does. Numbered duplicates do not.',
      'Ship render settings with the file, and include a one-page note: fonts used, expected footage length, and what to avoid touching. It is the least glamorous part of templating and the reason your file gets reused.',
      'Ghostae Presets lets you add local .aep files to a searchable grid with recently-used tracking and auto-render, so a well-built template stays one double-click from delivery.',
    ],
  },
  {
    slug: 'stop-hunting-for-assets',
    title: 'Stop hunting for assets: how CACHE indexes your drives',
    tag: 'Workflow',
    date: 'Mar 2026',
    readingTime: '4 min read',
    excerpt:
      'A folder-by-folder scan, hover previews and tags mean your overlays, SFX and LUTs are one keystroke away instead of five Explorer windows deep.',
    body: [
      'Most motion projects do not slow down in After Effects — they slow down in the file browser. You know the light leak exists somewhere on the D: drive, but finding it costs three minutes and all of your momentum.',
      'CACHE indexes the folders you point it at, keeps thumbnails warm, and lets you filter by type, tag or favourite. Hovering a clip scrubs it inline, so you judge a transition before it ever touches your timeline.',
      'Two habits make the biggest difference: tag on import, not later, and keep one folder per delivery format. After that, the panel does the remembering for you.',
    ],
  },
  {
    slug: 'ai-expressions-that-survive-review',
    title: 'AI expressions that survive client review',
    tag: 'COMMAND',
    date: 'Feb 2026',
    readingTime: '5 min read',
    excerpt:
      'Prompting for expressions works best when you describe the motion, not the maths. Here is the pattern we use inside Ghostae Command.',
    body: [
      'Ask for "wiggle" and you get wiggle. Ask for "a handheld camera drift that settles after two seconds" and you get an expression you can actually hand to a client.',
      'COMMAND reads the selected layer and composition, so it already knows your frame rate, dimensions and property type. Your prompt only needs to carry intent and timing.',
      'Keep a shortlist of prompts that worked. Reuse beats re-invention, and reviewed expressions are the ones that ship.',
    ],
  },
  {
    slug: 'captions-in-one-pass',
    title: 'Captions in one pass with Ghostae Text',
    tag: 'TEXT',
    date: 'Feb 2026',
    readingTime: '3 min read',
    excerpt:
      'Transcribe, style and stagger a full subtitle track without leaving After Effects — including SRT import for footage you already captioned elsewhere.',
    body: [
      'Captioning is repetitive work that punishes small mistakes. TEXT keeps the loop tight: transcribe, pick a preset, adjust one style, and the whole track inherits it.',
      'If a caption file already exists, import the SRT and the panel builds timed text layers with your chosen preset applied.',
      'For vertical delivery, set a safe-area preset once and reuse it. Consistency is what makes a channel look produced.',
    ],
  },
  {
    slug: 'shipping-a-cep-extension',
    title: 'What we learned shipping a CEP extension to real studios',
    tag: 'Engineering',
    date: 'Jan 2026',
    readingTime: '6 min read',
    excerpt:
      'Silent installs, SHA-256 verification and one-click rollback are not nice-to-haves when an update lands mid-deadline.',
    body: [
      'A creative tool update should never be a gamble. Every Ghostae release ships with a published checksum, an unattended install flag and a rollback script that restores the previous build.',
      'Studios asked for the boring things first: predictable paths, no admin prompts mid-render, and logs they can read.',
      'The result is an update process an assistant editor can run on ten machines before lunch.',
    ],
  },
]

export function getPost(slug: string) {
  return POSTS.find((p) => p.slug === slug)
}
