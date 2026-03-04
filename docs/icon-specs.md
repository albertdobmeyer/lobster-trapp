# App Icon Specifications

## Current State

`app/src-tauri/icons/icon.svg` is a placeholder — "LT" monogram inside a shield on a dark slate background with orange accent. Suitable for development but should be replaced with a polished design before v1.0.

## Required Formats

Tauri expects these files in `app/src-tauri/icons/`:

| File | Size | Platform |
|------|------|----------|
| `icon.ico` | Multi-size (16, 32, 48, 256) | Windows |
| `icon.icns` | Multi-size | macOS |
| `32x32.png` | 32x32 | Linux / fallback |
| `128x128.png` | 128x128 | Linux / macOS |
| `128x128@2x.png` | 256x256 | macOS Retina |

Additional recommended sizes for app stores: 512x512, 1024x1024.

## Generating from SVG

```bash
# Using Tauri CLI (generates all required sizes from a source image)
cd app && npx tauri icon src-tauri/icons/icon.svg

# Or manually with ImageMagick
magick convert -background none icons/icon.svg -resize 32x32 icons/32x32.png
magick convert -background none icons/icon.svg -resize 128x128 icons/128x128.png
magick convert -background none icons/icon.svg -resize 256x256 icons/128x128@2x.png
```

## Design Guidelines

- **Background**: slate-900 (`#0f172a`) to slate-800 (`#1e293b`) gradient
- **Accent**: orange-500 (`#f97316`)
- **Text/icons**: slate-50 (`#f8fafc`) white
- **Shape**: Rounded square with shield motif
- **Concept**: Security + orchestration — shield represents the security-first mission

## Bundle Config

Declared in `app/src-tauri/tauri.conf.json` under `bundle.icon`:
```json
"icon": [
  "icons/32x32.png",
  "icons/128x128.png",
  "icons/128x128@2x.png",
  "icons/icon.icns",
  "icons/icon.ico"
]
```
