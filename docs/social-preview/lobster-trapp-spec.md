# Lobster-TrApp — Social Preview Image Spec

Design brief for the GitHub social preview image (the card shown when the repo link is shared on social media, Slack, Discord, etc.).

---

## Dimensions & Format

- **Size**: 1280 x 640 px
- **Format**: PNG (final output)
- **Safe area**: Keep all critical content within a 960 x 480 centered region (GitHub crops edges on mobile and embed views)

---

## What This Image Must Communicate

In 2 seconds of glance time, a viewer should understand three things:

1. **This is a desktop app** — not a CLI tool, not a library, not a SaaS product
2. **It orchestrates multiple things** — it's a hub that ties components together
3. **Security is the point** — the shield motif signals that this isn't just a dashboard, it's a *trust boundary*

---

## Composition

### Layout: Left-weighted logo with right-aligned text

```
┌──────────────────────────────────────────────┐
│                                              │
│                                              │
│     ┌──────────┐                             │
│     │          │   Lobster-TrApp             │
│     │  SHIELD  │                             │
│     │  + CLAW  │   Security-first desktop    │
│     │   LOGO   │   GUI for AI agents you     │
│     │          │   can actually trust         │
│     └──────────┘                             │
│                                              │
│              albertdobmeyer              │
│                                              │
└──────────────────────────────────────────────┘
```

- **Left third**: The official logo — golden shield with emerald trim and red lobster claws — rendered at roughly 300x360 px, vertically centered
- **Right two-thirds**: Text block, vertically centered, left-aligned
- **Footer**: `albertdobmeyer` in muted monospace, centered at the bottom

### Why this layout

The submodule previews (vault, forge, pioneer) are centered text-only designs on solid color backgrounds. Lobster-trapp is the *parent* — it should feel visually distinct and more "premium" than the components it orchestrates. The logo gives it visual weight and brand recognition that pure-text cards lack.

---

## Color Palette

| Element | Color | Hex |
|---------|-------|-----|
| Background (primary) | Slate 900 | `#0f172a` |
| Background (gradient end) | Slate 800 | `#1e293b` |
| Title text | Slate 50 | `#f8fafc` |
| Tagline text | Slate 400 | `#94a3b8` |
| Footer text | Slate 600 | `#475569` |
| Shield face | Amber 400 → 700 | `#fbbf24` → `#b45309` |
| Shield trim | Emerald | as in logo |
| Claw fill | Red 500 → 800 | `#ef4444` → `#991b1b` |

Background should be a subtle diagonal gradient from slate-900 to slate-800, matching the app's dark theme. Do **not** use a flat solid — the gradient adds depth at social-card size.

---

## Typography

| Element | Font | Size (approx at 1280px) | Weight |
|---------|------|-------------------------|--------|
| Title: "Lobster-TrApp" | Monospace (Courier New, JetBrains Mono, or SF Mono) | 64–72 px | Bold |
| Tagline | System sans-serif (SF Pro, Segoe UI, Inter) | 24–28 px | Regular |
| Footer | Monospace | 18–20 px | Regular |

The title must use a monospace font to match the developer/terminal aesthetic of the project. The hyphen and capital T in "TrApp" should be preserved exactly.

---

## Tagline Options (pick one)

**Primary recommendation:**
> Security-first desktop GUI for AI agents you can actually trust

**Alternatives:**
> Manifest-driven desktop GUI for the OpenClaw ecosystem

> One GUI. Three components. Zero blind trust.

> The desktop app that lets non-technical users safely run AI agents

The first option leads with the security value proposition and speaks to end users. The second is more technically precise. Choose based on target audience — if the preview is mostly seen by developers, option 2; if it's for a broader audience, option 1.

---

## Visual Details

- **Logo rendering**: Use the official `lobster-trapp-logo.png` as the source. The logo features a golden shield with green emerald border trim and gold rivets, containing three red lobster claws (two open pincers at top, one smaller at bottom), all on a dark navy rounded-square background. Render it crisp at the card size — no blurring or heavy drop shadows.
- **Subtle texture** (optional): A very faint grid or dot pattern in the background at 2–3% opacity adds visual interest without distracting. The submodule previews don't have this, so it further distinguishes the parent repo.
- **No feature pills or badges**: Keep it clean. The social preview is not a feature list — that's what the README is for.
- **No screenshots**: The app doesn't have a polished UI yet (Phase 3/4). Don't include anything that will look dated in 2 months.

---

## What NOT to Include

- Component names or submodule details (too much information for a card)
- Version numbers (goes stale)
- GitHub stars/badges (redundant — they're already on the repo page)
- QR codes or URLs
- More than 2 lines of text below the title

---

## Relationship to Other Previews

| Repo | Background | Style |
|------|-----------|-------|
| openclaw-vault | Red | Centered text, solid bg |
| clawhub-forge | Blue | Centered text, solid bg |
| moltbook-pioneer | Purple | Centered text, solid bg |
| **lobster-trapp** | **Dark slate gradient** | **Logo + text, asymmetric layout** |

The parent repo intentionally breaks the pattern of the submodules. The dark background and asymmetric layout signal hierarchy — this is the orchestrator, not a component.

---

## Delivery

- Export as PNG at exactly 1280 x 640 px
- Save to `docs/social-preview/lobster-trapp.png`
- Upload via: GitHub repo Settings > General > Social preview > Edit > Upload
