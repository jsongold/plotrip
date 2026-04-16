# Design Tone Manifest

## Vision

Plotrip's chrome should feel like **quiet glass floating over a living map**: restrained, tactile, and confident. Surfaces are semi-transparent and softly shadowed so the map and content stay the hero; controls recede until touched, then respond with small, precise motion. Think "dark-mode camera HUD over a colorful world" — never heavy, never decorative.

The canonical reference is the close button in `src/components/RecommendationCarousel.jsx` (`closeBtnStyle`): a 28×28 dark-glass circle with a thin white stroke-X, backdrop blur, soft ambient shadow, and 120ms transitions. When in doubt, match that button's energy.

## Core Principles

- **Restrained surfaces** — semi-transparent glass beats solid white when the element floats over the map.
- **Glass over scrim** — prefer `rgba(17,17,17,0.72) + blur(8px)` to flat black or opaque white for overlay chrome.
- **Thin, deliberate strokes** — 2–2.5px SVG strokes with rounded caps; no hairlines, no chunky 4px outlines.
- **Circular for secondary, rounded-rect for primary** — dismissive / auxiliary actions are circles; content-bearing buttons and chips use `--r-lg` / `--r-pill`.
- **Soft ambient shadows, never drop shadows** — elevation comes from `0 2px 8px rgba(0,0,0,0.18)` class shadows, not harsh offsets.
- **SVG icons, not emoji** — emoji are content (flags, reactions); chrome uses stroke SVG.
- **Motion is micro** — 120ms for hover/press, 220ms for sheet/overlay, always `var(--ease-out)`.
- **High-contrast icon on dark glass** — white (`#fff`) on dark glass reads over any map tile; avoid mid-grays on translucent surfaces.

## Tokens

### Glass Surfaces

| Role                     | Value                                            |
| ------------------------ | ------------------------------------------------ |
| `--glass-dark`           | `rgba(17, 17, 17, 0.72)`                         |
| `--glass-dark-strong`    | `rgba(17, 17, 17, 0.84)` (for denser overlays)   |
| `--glass-light`          | `rgba(255, 255, 255, 0.78)`                      |
| `--glass-blur`           | `blur(8px)` (pair with `-webkit-backdrop-filter`) |
| `--glass-blur-strong`    | `blur(14px)` (reserve for large sheets)          |

Always set both `backdropFilter` and `WebkitBackdropFilter`.

### Shadow Tiers

| Tier     | Token                | Value                                | Use                             |
| -------- | -------------------- | ------------------------------------ | ------------------------------- |
| Soft     | `--shadow-sm`        | `0 1px 2px rgba(0,0,0,0.06)`         | chips, inline badges            |
| Ambient  | `--shadow-glass`     | `0 2px 8px rgba(0,0,0,0.18)`         | glass buttons, pins (canonical) |
| Medium   | `--shadow-md`        | `0 2px 6px rgba(0,0,0,0.12)`         | toggle buttons, cards-on-white  |
| Lifted   | `--shadow-lg`        | `0 8px 24px rgba(0,0,0,0.16)`        | sheets, popups, rec-carousel cards |

`--shadow-glass` is the new canonical tier for floating chrome; add to `tokens.css` when adopting.

### Border Radii (from `tokens.css`)

| Token         | Value    | Use                               |
| ------------- | -------- | --------------------------------- |
| `--r-sm` 4px  | 4px      | tag/chip inner detail             |
| `--r-md` 8px  | 8px      | inline buttons, small cards       |
| `--r-lg` 12px | 12px     | cards, popup wrappers             |
| `--r-xl` 16px | 16px     | sheets, modals                    |
| `--r-pill`    | 9999px   | pill chips, status capsules       |
| `50%`         | —        | **circular secondary actions** (close, pin, recommend) |

### Stroke Widths (SVG)

| Weight  | Width  | Use                                          |
| ------- | ------ | -------------------------------------------- |
| Thin    | 1.75px | decorative rules, inactive map markers       |
| Regular | 2px    | most outline icons                           |
| Heavy   | 2.5px  | **chrome icons on glass** (close, nav, etc.) |

Always: `strokeLinecap="round"` + `strokeLinejoin="round"`.

### Motion

| Interaction              | Duration        | Easing              |
| ------------------------ | --------------- | ------------------- |
| Hover, press, icon swap  | `--dur-fast` 120ms | `ease` or `--ease-out` |
| Sheet / overlay open     | `--dur-med` 220ms  | `--ease-out`        |
| Page / theme transition  | `--dur-slow` 360ms | `--ease-in-out`     |
| Staggered expand (filter)| 220–260ms        | `cubic-bezier(0.2,0.9,0.3,1.1)` |

### Typography (from `tokens.css`)

| Token         | Size | Use                             |
| ------------- | ---- | ------------------------------- |
| `--font-xs`   | 11px | badge, chip, muted meta         |
| `--font-sm`   | 13px | secondary body, captions        |
| `--font-base` | 15px | default body                    |
| `--font-md`   | 17px | card titles                    |
| `--font-lg`   | 20px | section headings                |
| `--font-xl`   | 24px | sheet headers                   |

Weights: `--fw-regular 400` / `--fw-medium 500` / `--fw-semibold 600` / `--fw-bold 700`. Favor `500`/`600`; `700` only for numeric badges.

### Color Roles

| Role                          | Value                    |
| ----------------------------- | ------------------------ |
| Accent                        | `var(--accent)` `#2563eb` |
| Icon on dark glass            | `#fff`                   |
| Icon on light surface         | `var(--text)`            |
| Muted text on glass           | `rgba(255,255,255,0.72)` |
| Subtle text on light          | `var(--text-muted)`      |
| Danger (pin/add)              | `#dc2626`                |
| Discover/recommend accent     | `#0891b2`                |
| Border on light (when needed) | `rgba(0,0,0,0.08)`       |

## Sizing Rules

| Button role                | Size    | Shape        | Example                                   |
| -------------------------- | ------- | ------------ | ----------------------------------------- |
| Primary action             | 44×44   | `--r-md` / circle | FilterBar toggle, Pin/Add, Recommend |
| Primary CTA in sheet       | full-width / 44 tall | `--r-md` | "Save trip", "Apply"              |
| Secondary / dismissive     | **28×28** | circle       | **Close rec carousel (canonical)**       |
| Status badge / counter     | 20×20 (min-width) | `--r-pill` | Active-filter count on toggle          |
| Chip / tag                 | auto × ~20 | `--r-pill` | City tags in popup                      |

Tap-target rule: anything the user must hit precisely → 44×44. Only drop to 28×28 when the button is **informational or dismissive** and lives next to plenty of empty space (like the carousel close button above the card row).

## Iconography

- **SVG > emoji** for every chrome control. Emoji stay for user-facing content (flags, mood reactions).
- **Stroke icons** for outline affordances: `fill="none"` + `stroke="currentColor"` + `strokeWidth={2.5}` + `strokeLinecap="round"` + `strokeLinejoin="round"`.
- **Filled icons** are allowed for map pins and brand-weight moments (e.g. `PinIcon` in `CityPinPopup`) — use a single weight per view; don't mix filled and stroked in the same button cluster.
- **Icon size:** 14px inside a 28px circle, 20–22px inside a 44px circle. Icon ≈ 50–55% of container.
- Color the icon via `color:` on the button and `stroke="currentColor"` / `fill="currentColor"` on the SVG — never hard-code.

## Interaction

- **Hover:** `transform: scale(1.04)` on circular buttons; bump shadow one tier (`--shadow-glass` → `--shadow-lg`).
- **Active / press:** `transform: scale(0.96)`; shorten transition to 80ms so the button feels mechanical.
- **Focus-visible:** 2px outline in `var(--accent)` offset by 2px — never remove outline silently.
- **Transitions:** enumerate the properties you animate (`background 120ms ease, transform 120ms ease`) — avoid `transition: all` except where already established (e.g. FilterBar toggle).
- **Haptics:** call `bump()` from `src/lib/haptics.js` on primary taps; skip on dismissive/close.
- **Escape key:** every overlay must dismiss on `Escape` (see `RecommendationCarousel` useEffect).

## Do / Don't

**Do**

- Use `rgba(17,17,17,0.72)` + `blur(8px)` for floating chrome over the map.
- Keep secondary/close buttons at 28×28 circles.
- Use 2.5px rounded strokes for chrome SVGs.
- Match the canonical close button when adding a new "dismiss" affordance.
- Define explicit transition properties.

**Don't**

- Don't stack heavy drop shadows (`0 8px 24px` on a 28px button looks inflated).
- Don't mix 1.5px and 2.5px strokes in the same view — pick one weight per cluster.
- Don't use solid `#fff` surfaces when glass would read better against map tiles.
- Don't use emoji for close/back/menu — emoji render inconsistently and shift baseline.
- Don't animate `width` / `height` — animate `transform` and `opacity`.
- Don't drop the 44×44 tap target for a primary action just because it looks tidier.

## Snippets

### Canonical dismiss button (28×28 dark glass)

```js
const closeBtnStyle = {
  width: 28,
  height: 28,
  borderRadius: '50%',
  background: 'rgba(17, 17, 17, 0.72)',
  backdropFilter: 'blur(8px)',
  WebkitBackdropFilter: 'blur(8px)',
  color: '#fff',
  border: 'none',
  cursor: 'pointer',
  boxShadow: '0 2px 8px rgba(0, 0, 0, 0.18)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  padding: 0,
  transition: 'background 120ms ease, transform 120ms ease',
};

// icon
<svg
  width={14} height={14} viewBox="0 0 24 24"
  fill="none" stroke="currentColor"
  strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round"
  aria-hidden="true"
>
  <line x1="6" y1="6" x2="18" y2="18" />
  <line x1="18" y1="6" x2="6" y2="18" />
</svg>
```

### Primary circular action (44×44, branded)

```js
const primaryCircleStyle = {
  width: 44,
  height: 44,
  borderRadius: '50%',
  background: '#dc2626',           // or var(--accent)
  color: '#fff',
  border: 'none',
  cursor: 'pointer',
  boxShadow: '0 4px 12px rgba(220, 38, 38, 0.4)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  padding: 0,
  transition: 'transform 120ms ease, box-shadow 120ms ease',
};

// hover: transform scale(1.08) + deepen shadow; press: scale(0.96)
```

### Light-glass pill chip (tag / status)

```js
const chipStyle = {
  fontSize: 11,
  padding: '2px 8px',
  borderRadius: 999,
  background: 'rgba(255, 255, 255, 0.78)',
  backdropFilter: 'blur(8px)',
  WebkitBackdropFilter: 'blur(8px)',
  color: 'var(--text)',
  boxShadow: '0 1px 2px rgba(0, 0, 0, 0.06)',
};
```

## Open Tensions (acknowledge, then resolve)

- `CityPinPopup` action buttons use **solid-color** 44×44 circles (red for Add, teal for Recommend) with colored shadows — this is intentional brand-weight, but verify new buttons don't drift halfway between "glass" and "solid accent". Pick one per button.
- `FilterBar` toggle uses a `--r-md` rounded-rect, **not** a circle, because it's a persistent chrome anchor, not a dismiss. Keep it that way; don't circularize it for consistency.
- Emoji still appear in orbit satellites (`.orbit-satellite` in `tokens.css`) — that's content, not chrome, so it's fine.
