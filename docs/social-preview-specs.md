# Social Preview Image Specs

GitHub social preview images for all 4 repos in the OpenClaw ecosystem.

## Dimensions

- **Size**: 1280 x 640 pixels
- **Format**: PNG (final) or SVG (placeholder)
- **Safe area**: Keep text within 960 x 480 centered region (GitHub crops edges on some views)

## Per-Repo Specs

| Repo | Background | Accent | Tagline |
|------|-----------|--------|---------|
| lobster-trapp | `#0f172a` (slate-900) | `#f8fafc` (slate-50) | Manifest-driven desktop GUI for the OpenClaw ecosystem |
| openclaw-vault | `#dc2626` (red-600) | `#fef2f2` (red-50) | API keys never enter the container |
| clawhub-forge | `#3b82f6` (blue-500) | `#eff6ff` (blue-50) | 87-pattern offline security scanner |
| moltbook-pioneer | `#a855f7` (purple-500) | `#faf5ff` (purple-50) | Safe reconnaissance for the Moltbook agent network |

## Layout

Each image follows the same structure:
1. Full-bleed background color
2. Repo name in monospace font (large, centered)
3. Tagline below in regular weight
4. `gitgoodordietrying` footer at bottom

## Current Status

| Repo | Status | Path |
|------|--------|------|
| lobster-trapp | SVG placeholder | `docs/social-preview/lobster-trapp.svg` |
| openclaw-vault | **Production PNG** | `docs/social-preview.png` (in vault repo) |
| clawhub-forge | SVG placeholder | `docs/social-preview/clawhub-forge.svg` |
| moltbook-pioneer | SVG placeholder | `docs/social-preview/moltbook-pioneer.svg` |

## Uploading

Go to each repo's Settings > General > Social preview > Edit > Upload an image.
