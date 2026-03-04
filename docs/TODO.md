# Lobster-TrApp (App) — TODO

Tracked gaps from the 2026-03-03 audit. This covers the Tauri app's own issues, not submodule internals. See `docs/vision-and-status.md` for the high-level roadmap.

---

## Test Framework Not Configured (Phase 2 Blocker) — RESOLVED

- [x] `vitest`, `@testing-library/react`, `@testing-library/jest-dom`, `jsdom`, and `@playwright/test` added to `package.json` devDependencies
- [x] `vitest.config.ts` created with jsdom environment, globals, path aliases, and setup file
- [x] `test`, `test:watch`, and `test:e2e` scripts added to `package.json`
- [x] 29 unit tests across 5 test files all passing
- [ ] 4 Playwright E2E tests exist in `tests/` — runnable but need a dev server (Phase 4)

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

## YAML Validation (Phase 4) — RESOLVED

- [x] `YamlEditor` validates YAML syntax with `js-yaml` before saving
- [x] Parse errors shown inline with line number
- [x] Error clears on edit, save is blocked until syntax is valid

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

## CSP Headers (Phase 6) — RESOLVED

- [x] Restrictive CSP set in `tauri.conf.json`: `default-src 'self'`, `script-src 'self'`, `style-src 'self' 'unsafe-inline'` (Tailwind), `connect-src ipc: http://ipc.localhost` (Tauri IPC)
- [x] No `unsafe-eval`, no external script sources

---

## Deep-Link Race Condition (Phase 6) — RESOLVED

- [x] `get_component` now falls back to `discover_components()` on cache miss
- [x] Cache is populated as a side effect, so subsequent calls are fast
- [x] Direct navigation to `/component/:id` works without visiting the dashboard first
