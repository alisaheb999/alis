# GHOST UI Skill — Studio Dark / Emerald v1.1

## Purpose
A reusable visual system for the GHOST Text CEP panel. The UI should feel like a focused creative tool rather than a generic dashboard: dark, calm, compact, premium, and easy to scan while previews are moving.

## Core principles
1. **Deep background, raised surfaces** — the panel background is near-black with a subtle green/teal ambient glow. Cards are only one or two levels lighter.
2. **One accent family** — use emerald/teal for active states, focus, playback, and primary actions. Avoid unrelated accent colors in the same surface.
3. **Hierarchy before decoration** — section titles, controls, previews, and metadata must remain visually distinct without heavy borders.
4. **Animation is the hero** — motion cards should have enough contrast for previews, but the chrome must stay quiet so movement is readable.
5. **Emoji stays expressive** — emoji tiles get a soft neutral surface and a restrained emerald interaction ring; do not tint the emoji glyphs.
6. **Expressions are utility cards** — clear target badge, readable name, compact actions, and a stronger selected/hover state.
7. **Style tab empty state** — if no styles exist, the empty state should look intentional, not broken.
8. **Performance-safe visuals** — no large blur filters, no continuous background animation, and no expensive box-shadow animation. Ambient glow is static.
9. **Accessibility** — keep text contrast high, focus rings visible, hit targets at least 30px where practical, and respect `prefers-reduced-motion`.

## Tokens
- Background: `#0C1110`
- Header: `#101715`
- Surface: `#141B18`
- Card: `#18211D`
- Card hover: `#1D2924`
- Border: `rgba(166, 255, 221, .10)`
- Border strong: `rgba(166, 255, 221, .20)`
- Accent: `#48D6A4`
- Accent hover: `#69E4B8`
- Accent soft: `rgba(72, 214, 164, .12)`
- Primary text: `#F3F7F5`
- Secondary text: `#AAB8B2`
- Muted text: `#6E7C76`

## Component rules
### Animation
- Perfect Presets get the strongest surface treatment.
- Preview media should sit inside a clean stage with a subtle top highlight.
- Web Presets remain visually secondary and keep their testing badge.
- Playback controls use the same accent family as the active tab.

### Emoji
- Category rail uses compact pills.
- Emoji tiles are square, slightly raised, and use a soft hover lift.
- Never apply grayscale, opacity, or hue filters to the emoji glyph itself.

### Expressions
- Toolbar is a single quiet utility strip.
- Cards use two-column responsive layout where possible.
- Target badges use the accent-soft background.
- Apply/Copy controls use low-contrast secondary buttons with emerald hover/focus.

### Main background
- Body/background uses a static multi-stop dark gradient with two faint emerald radial highlights.
- No moving background effects.
- Content remains above the ambient layer.

## Motion
- Hover: 120–160ms.
- Panel state: 180–240ms.
- Use `transform: translateY(-1px)` at most for tiles.
- Reduced motion disables decorative transforms/transitions.


## Rich UI Audit Checklist
Before adding or restyling any control, check:
- **Purpose:** every visible item must have one obvious job; remove duplicate or decorative controls.
- **Hierarchy:** primary action > content > metadata > utility; do not give equal visual weight to all four.
- **One-line labels:** atomic navigation labels and control labels must not wrap at supported panel widths; use ellipsis only when truncation is unavoidable.
- **Typography:** keep a small type scale; avoid sub-9px UI text except secondary metadata.
- **Spacing:** use a consistent 4/6/8/10/12px rhythm; avoid stacked borders and redundant containers.
- **Color:** one accent family only; semantic colors are reserved for actual status states.
- **Navigation:** tabs should scan left-to-right as one rail; zero-value counters are hidden; active state is obvious without glow overload.
- **Density:** every screen should show the useful content first; empty sections should collapse or become a single intentional empty state.
- **Eye comfort:** no continuous background motion, excessive glow, repeated pills, or high-contrast decorations competing with previews.
- **Responsive fit:** verify narrow panels, long labels, and mixed-language text before shipping.
- **Final pass:** inspect Animation, Advanced, Style, Emoji, Expressions, modals, popovers, and status/toast surfaces independently.
