# Handoff — Active Mission

**Last updated:** 2026-04-21
**Current mission:** UI/UX rebuild — detangle non-technical user and developer user interfaces

---

## The Active Mission

👉 **Read this first:** [`docs/specs/ui-rebuild-2026-04-21/00-HANDOFF.md`](specs/ui-rebuild-2026-04-21/00-HANDOFF.md)

The current session established a plan to split the Lobster-TrApp UI into two distinct modes (non-technical user + developer) inside the same Tauri app. 14 detailed specs are in `docs/specs/ui-rebuild-2026-04-21/`. Implementation is the next step.

**Why:** The UI has been mixing two user stories and every polish pass has been sluggish. Detangling is the fix.

---

## What's Been Done So Far

### Phases A–D (v0.1.0 release)

| Phase | Status | Result |
|-------|--------|--------|
| A — Documentation alignment | ✅ | `docs/specs/2026-04-19-product-identity-spec.md`, CLAUDE.md, GLOSSARY.md, README reframed |
| B — Frontend reframe | ✅ | `app/src/lib/labels.ts`, role-based labels across all screens |
| C — Landing page reframe | ✅ | `docs/index.html` reframed (not yet deployed to prod) |
| D — v0.1.0 tagged | ✅ | CI green, 9 binaries on GitHub releases (draft) |
| UX rubric | ✅ | `docs/specs/2026-04-20-ux-principles-rubric.md` — 10 principles, 13 screens scored |

### Phase E — UI Rebuild (next)

- ✅ Planning (this spec folder)
- 🔜 Implementation
- 🔜 Verification
- 🔜 Release v0.2.0

---

## Current State of the Code

- **End-to-end works:** Setup wizard completes, containers build and run, Telegram pairing works
- **UI is still mixed-audience:** Some screens use non-technical vocabulary (Phase B), others still have developer terminology (current dev dashboard)
- **No dev mode toggle yet:** All screens try to serve both audiences at once
- **Test coverage:** 145 unit tests, 21 Playwright E2E tests (all passing), 42 orchestration checks (all passing)

---

## Where to Start (Next Instance)

1. Read [`docs/specs/ui-rebuild-2026-04-21/00-HANDOFF.md`](specs/ui-rebuild-2026-04-21/00-HANDOFF.md) — mission brief
2. Read [`docs/specs/2026-04-19-product-identity-spec.md`](specs/2026-04-19-product-identity-spec.md) — product identity
3. Read [`docs/specs/2026-04-20-ux-principles-rubric.md`](specs/2026-04-20-ux-principles-rubric.md) — scoring tool
4. Read specs 01–06 in `ui-rebuild-2026-04-21/` — foundations (vision, design system, IA, assets, automation, failure)
5. Start implementation per the order in 00-HANDOFF.md:
   - Phase E.1: Cross-cutting foundations (~1 day)
   - Phase E.2: User mode screens (~2–3 days)
   - Phase E.3: Developer mode (~1 day)
   - Phase E.4: Polish + verification (~0.5 day)

---

## Key Reference Files

| Purpose | File |
|---------|------|
| **Active mission brief** | `docs/specs/ui-rebuild-2026-04-21/00-HANDOFF.md` |
| Product identity | `docs/specs/2026-04-19-product-identity-spec.md` |
| UX rubric | `docs/specs/2026-04-20-ux-principles-rubric.md` |
| Architecture | `docs/specs/2026-04-15-architecture-v2-perimeter-redesign.md` |
| Trifecta overview | `docs/trifecta.md` |
| Project instructions | `CLAUDE.md` |
| Glossary | `GLOSSARY.md` |

---

## Success Criteria

The rebuild is done when:

1. **Karen can install and connect to her assistant in < 3 minutes with ≤ 4 clicks**
2. **Zero developer terminology** leaks into user mode (enforced by expanded Playwright banned-terms list)
3. **Every user-mode screen scores ≥ 9/10** on the UX rubric
4. **Developers can toggle into Advanced Mode** (Cmd/Ctrl+Shift+D or Settings toggle)
5. **Advanced Mode provides all technical controls** (commands, configs, workflows, logs, manifests, security audit, allowlist, shell levels)
6. **App runs from system tray** with status indicator (green/amber/red/gray)
7. **Failures route through contact-support flow** with diagnostic export; no stack traces in user view
8. **All tests pass:** 145+ unit, 21+ E2E (with new tests added per spec), 42+ orchestration

---

## Historical Handoffs

Prior handoffs preserved in git history:
- Phase A–D handoff (commit `88688c2`): `docs: handoff for frontend reframe + v0.1.0 release`
- This handoff replaces the previous one as the active mission.

---

## Contact

If specs contradict reality, **update the spec first**, then implement. Do not silently deviate.
