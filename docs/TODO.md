# Lobster-TrApp (App) — TODO

Tracked gaps from the 2026-03-03 audit. This covers the Tauri app's own issues, not submodule internals. See `docs/vision-and-status.md` for the high-level roadmap.

---

## Test Framework Not Configured (Phase 2 Blocker)

- [ ] `vitest`, `@testing-library/react`, `jsdom`, and `@playwright/test` are installed in `node_modules` but NOT listed in `package.json` devDependencies
- [ ] No `vitest.config.ts` exists
- [ ] No `test` script in `package.json`
- [ ] 22 unit tests exist in `app/src/` but cannot run
- [ ] 4 Playwright E2E tests exist in `tests/` but cannot run

**Fix**: Add deps to package.json, create vitest.config.ts, add `"test"` and `"test:e2e"` scripts.

---

## ANSI Color Rendering (Phase 4)

- [ ] `app/src/lib/ansi.ts` is 7 lines — it only strips ANSI escape codes
- [ ] All terminal output from docker/make/colored scripts renders as plain text
- [ ] Need actual ANSI-to-HTML or ANSI-to-spans rendering (consider `ansi-to-html` npm package)

---

## Streaming Not Wired to UI (Phase 4)

- [ ] `app/src/hooks/useCommandStream.ts` is fully implemented (Tauri event listeners, line buffering)
- [ ] `app/src/components/CommandPanel.tsx` only uses `useCommand` (blocking execution)
- [ ] Commands with `type: stream` (logs, proxy-logs) are run as blocking calls instead of streaming
- [ ] Fix: detect `type: stream` in CommandPanel and use `useCommandStream` instead

---

## Settings Page Stub (Phase 4)

- [ ] Settings page has a monorepo path override text input
- [ ] The input is UI-only — never calls a Tauri backend command
- [ ] No backend command exists to persist or apply the path override

---

## YAML Validation (Phase 4)

- [ ] `YamlEditor` component saves content without syntax validation
- [ ] Invalid YAML silently corrupts config files (e.g., `openclaw-hardening.yml`)
- [ ] Fix: parse with `js-yaml` before saving, show error if invalid

---

## Setup Wizard (Phase 3 — Not Started)

- [ ] 0% implemented — the #1 feature for non-technical users
- [ ] Needs: prerequisite detection (Podman/Docker), submodule health, guided first-run, progress indicators, error recovery
- [ ] See Phase 3 in `vision-and-status.md` for full requirements

---

## card-grid Renderer (Phase 6)

- [ ] `card-grid` output display is aliased to `ReportRenderer` instead of having its own implementation
- [ ] Should render structured data as a grid of cards (e.g., skill scan results, census data)

---

## CSP Headers (Phase 6)

- [ ] Content Security Policy is `null` (disabled) in `tauri.conf.json`
- [ ] Production builds should have a restrictive CSP

---

## Deep-Link Race Condition (Phase 6)

- [ ] `get_component` reads from a cache populated by `list_components`
- [ ] Direct navigation to `/component/:id` before the dashboard loads returns an error
- [ ] Fix: `get_component` should fall back to filesystem discovery if cache is empty
