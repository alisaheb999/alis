DELETE FROM public.prompt_templates WHERE title LIKE 'GHOST Design Core%';

INSERT INTO public.prompt_templates (category, kind, title, body, weight, enabled) VALUES
('ui-design','rule','GHOST Design Core — Direction',
'VISUAL DIRECTION: commit to ONE distinctive art direction per answer and name it in 3-6 words (e.g. "graphite glass, electric cyan accent"). Never output generic AI aesthetics: no Inter/Poppins default stacks, no purple-to-indigo gradient on white, no interchangeable hero/card/footer boilerplate. Pick a real reference class (Linear, Stripe, Vercel, Arc, Apple, Rareblocks, Framer templates) and state which one the direction leans on.',
120,true),
('ui-design','rule','GHOST Design Core — Tokens',
'ALWAYS emit a token block before layout: background, surface, surface-raised, border, text-primary, text-muted, accent, accent-foreground, success, danger — each as an exact hex (or oklch) with a one-word role. Add radii (sm/md/lg/pill), shadow ramp (2 levels, real values), and a 4px-based spacing scale. Type scale: display / h1 / h2 / body / caption with px size, weight and line-height. Name a real font pairing (display + text) available on Google Fonts. Verify body text contrast >= 4.5:1 and state the measured ratio.',
118,true),
('ui-design','rule','GHOST Design Core — Premium craft',
'PREMIUM CRAFT CHECKLIST, apply all: clear hierarchy (one primary action per view); generous whitespace (section padding >= 64px desktop, 24px mobile); optical alignment and consistent 1px hairline borders; one focal accent, everything else neutral; depth via layered surfaces + soft shadow, not heavy strokes; micro-detail (hover lift 2px, 150-200ms ease-out, focus ring 2px accent at 40% alpha); responsive rules stated for >=1024, 768, <=480. Avoid: pure #000 or #FFF text on saturated fills, more than 2 accent colours, centre-aligned long paragraphs, drop shadows on text.',
116,true),
('ui-design','rule','GHOST Design Core — Pricing & data UI',
'PRICING / PLAN / TABLE UI: 3-4 tiers max, one visually elevated "recommended" tier (accent border + badge + subtle glow, never a bigger font soup). Price = large tabular-nums display size, currency and period in muted caption beside it. Feature rows aligned in one column with consistent tick icons; group by outcome not by feature name; put differentiators at the top of each list. Include a monthly/yearly toggle with a savings pill. Comparison tables: sticky header row, zebra-free but 1px row dividers, first column left-aligned sticky, values centred, mobile = horizontal snap-scroll panes one plan per pane. Always finish with a single clear CTA per tier and one trust line beneath the grid.',
114,true),
('ui-design','rule','GHOST Design Core — Output format',
'OUTPUT FORMAT for any design request: 1) Direction (one line). 2) Tokens (compact list). 3) Layout (structure in short bullets with px/grid). 4) Component specs (states: default / hover / active / disabled / empty / error). 5) Ready-to-paste code — Tailwind + semantic tokens if a web stack is implied, or exact AE layer/shape/text specs with sizes and colours if the target is After Effects. Keep prose minimal; specs and code carry the answer. Never say the design "looks modern" — prove it with values.',
112,true),
('graphic-design','rule','GHOST Design Core — Palette discipline',
'Deliver palettes as 5-7 hex swatches with an explicit role each (background, surface, accent, accent-2, text, muted, border) plus one dark and one light variant. State the harmony used (analogous, complementary, split) and the mood in two words. Give font pairing with weights and px sizes, plus a real-world reference for the look.',
110,true);