# StreamAiX Design System — "The AI trading ledger"

This document is the **contract** for all UI work. Dark ink surfaces, violet
intelligence accent, editorial serif display type — visually matched to the
shipped email newsletter (`server/services/newsletterTemplate.ts`).

Enforced by `npm run design:lint` (see Enforcement below).

## Tokens

| Token | Hex | Tailwind class(es) | Usage |
|---|---|---|---|
| `--ink-page` | `#080B14` | `bg-ink-page` | App/page background. The only page background. |
| `--ink-surface` | `#10162A` | `bg-ink-surface` | Cards, panels (via `<Surface>`). |
| `--ink-raised` | `#181F38` | `bg-ink-raised` | Hover states, nested surfaces (`<Surface variant="raised">`). |
| `--ink-edge` | `#232B45` | `border-ink-edge` | Borders. |
| `--ink-divider` | `#1A2138` | `border-ink-divider` | Row separators. |
| `--text-primary` | `#F2F4FA` | `text-primary` | Headings, key values. |
| `--text-body` | `#C9CEDC` | `text-body` | Body copy. |
| `--text-secondary` | `#9BA3B7` | `text-secondary` | Supporting copy, secondary values. |
| `--text-muted` | `#7A8299` | `text-muted` | Labels, captions, de-emphasized text. |
| `--accent-core` | `#8B7CF6` | `bg-accent-core`, `border-accent-core` | Buttons, active states. |
| `--accent-bright` | `#A99DF8` | `text-accent-bright` | Links, highlights on dark. |
| `--accent-deep` | `#6D5BE0` | `bg-accent-deep` | Pressed states. |
| `--gain` | `#3DD68C` | `text-gain` | Positive numbers, gains, success. |
| `--loss` | `#FF7B7B` | `text-loss` | Negative numbers, losses, errors. |
| `--warn` | `#FFB454` | `text-warn` | Warnings, caution states. |
| `--live` | `#FF6B81` | `text-live` | Live/broadcast status indicators (LIVE badges, pulse dots, stream counters). Not for errors — that is `loss`. |

Note: the token CSS vars are additive; the legacy shadcn vars (`--primary`,
`--accent`, …) still power the shadcn/ui components. The `text-primary`,
`text-body`, `text-secondary`, `text-muted` classes are overridden in
`client/src/index.css` to resolve to the text tokens above.

## Type rules

- `font-display` (Georgia + serif fallbacks) is for **page titles and section
  headings ONLY** — use `<SectionTitle>` / `<PageHeader>`. All UI and data
  stays on the existing sans (Inter).
- Numbers in data contexts always get `.tabular` (tabular-nums).
- Percentages are always **signed** and `toFixed(2)`: `+3.40%`, `-1.25%`.

## Shape rules (radii)

- `rounded-xl` — cards, inputs, buttons.
- `rounded-2xl` — modals and sheets.
- **Nothing else.** `rounded-lg`, `rounded-3xl`, etc. are banned.

## Gradient & glow rules

Exactly TWO sanctioned gradients (utilities in `index.css`):

- `.grad-accent` — violet `#8B7CF6 → #6D5BE0`. Primary CTAs and the onboarding tour only.
- `.grad-surface` — barely-there `#10162A → #0C1122`. Hero panels only.

No other gradients anywhere (`from-*` / `to-*` classes are banned).

One glow token: `.glow-accent` (`0 0 24px rgba(139,124,246,.25)`), used only
on primary CTAs and active states.

## Primitives (`client/src/components/ds/`)

```tsx
import Surface from "@/components/ds/Surface";
import StatValue from "@/components/ds/StatValue";
import SectionTitle from "@/components/ds/SectionTitle";
import LedgerRow from "@/components/ds/LedgerRow";

// Card / panel — ALL cards are a Surface
<Surface className="p-4">…</Surface>
<Surface variant="raised" className="p-3">nested</Surface>

// Section heading with optional eyebrow
<SectionTitle eyebrow="Markets">Hot this week</SectionTitle>

// The ONE way numbers are displayed
<StatValue label="BTC Price" value="$97,412.55" delta={2.31} />

// Numeric list rows (label / tabular value / signed delta)
<LedgerRow label="NVDA" value="$1,204.11" delta={-1.25} />
```

`PageHeader` (`client/src/components/PageHeader.tsx`) is the standard page
header, already restyled with the tokens.

## BANNED

The following must not appear anywhere in `client/src`:

- legacy neutrals/accents: `bg-slate-*`, `bg-gray-*`, `bg-zinc-*`, `bg-purple-*`, `bg-violet-*`, `bg-indigo-*`, `bg-blue-*`, `text-gray-*`, `text-slate-*`, `text-zinc-*`, `text-purple-*`, `border-slate-*`, `border-gray-*`, `border-purple-*`
- raw semantic colors — use the tokens instead: `text/bg/border-red-*`, `-rose-*` → `loss`; `-green-*`, `-emerald-*`, `-lime-*` → `gain`; `-amber-*`, `-yellow-*`, `-orange-*` → `warn`; `-cyan-*`, `-blue-*`, `-sky-*`, `-teal-*` → `accent-bright` (text) / `accent-core` (bg/border)
- `rounded-lg`, `rounded-3xl`
- any `from-*` / `to-*` gradient class outside the two sanctioned utilities

## Expressive layer

Aurora tokens and expressive utilities restore energy to brand surfaces
without loosening the app contract:

- Tokens: `--aurora-cyan` (`#22D3EE`), `--aurora-magenta` (`#E879F9`) —
  mapped as `aurora-cyan` / `aurora-magenta` in Tailwind. Together with the
  existing violet accents these are the ONLY chromatic accents beyond ink
  and semantic tokens.
- Utilities: `.text-grad-signal` (animated violet→magenta gradient text),
  `.text-grad-stream` (static cyan gradient text), `.orb` +
  `.orb-violet/.orb-cyan/.orb-magenta` (drifting blurred orbs),
  `.glow-cyan` / `.glow-magenta`. All motion is wrapped in
  `@media (prefers-reduced-motion: no-preference)`.
- `AmbientBackground` (`client/src/components/ds/AmbientBackground.tsx`)
  is the standard ambient backdrop for landing and auth.

**Continuous backdrop:** marketing pages (landing, auth) use ONE page-level
fixed `AmbientBackground` (plus the particle network on landing) behind a
`relative z-10` content wrapper; section shells are TRANSPARENT — opaque
section backgrounds (`bg-ink-page`, `bg-ink-surface`, solid gradients on
section shells) are banned on landing/auth. Sections needing emphasis may
use `grad-surface` WITH fade masks, never an unmasked opaque block. If text
needs extra contrast over the backdrop, use the `.scrim` utility
(ink-page/70 + backdrop-blur), not an opaque background. Interior
cards/panels keep their Surface styling.

**Scope:** these tokens/utilities are allowed ONLY in
`client/src/components/landing/`, `pages/landing.tsx`, `pages/auth.tsx`,
and single hero moments approved case-by-case — never on data or trading
surfaces. `design:lint` enforces this scope. Raw cyan/fuchsia/pink Tailwind
utilities remain banned everywhere; the tokens are the only path.

## Enforcement

`npm run design:lint` (`scripts/design-lint.sh`) greps **all of `client/src`**
for the banned classes and fails on any violation. Enforcement is global —
there is no allowlist; every file must comply.

The ban covers every color-bearing utility prefix, not just the common ones:
`text- / bg- / border- / ring- / shadow-` **and** `via- / fill- / stroke- /
divide- / outline- / decoration- / caret- / placeholder- / ring-offset- /
accent-` with any raw Tailwind hue (red, rose, green, emerald, lime, amber,
yellow, orange, cyan, sky, teal, blue, indigo, violet, purple, fuchsia, pink,
slate, gray, zinc). Semantic states map to tokens: loss/danger → `loss`,
gain/success → `gain`, caution → `warn`, emphasis/links → `accent-core` /
`accent-bright`, structure → `ink-*`. The lint script is fixture-tested in
both directions by `scripts/design-lint.test.ts`.
