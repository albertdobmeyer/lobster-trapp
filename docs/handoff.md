# Handoff — Frontend Reframe & v0.1.0 Release

**Date:** 2026-04-19
**Author:** Albert + Claude Opus (sessions 2026-04-14 through 2026-04-19)
**Status:** Architecture complete, E2E verified, documentation aligned, frontend reframe spec ready to implement

---

## Read These First

| Document | What It Is | Why You Need It |
|----------|-----------|-----------------|
| `docs/specs/2026-04-19-product-identity-spec.md` | **THE NORTHSTAR** — what this product actually is | Without this, you'll build a security dashboard instead of a personal assistant app |
| `docs/specs/2026-04-19-frontend-reframe-spec.md` | **THE TASK** — exact per-file implementation plan for the UI rewrite | Every string change, every structural change, every new component |
| `docs/specs/2026-04-19-alignment-roadmap.md` | The path from current state to v0.1.0 release | Phase A (docs) is done. Phase B (frontend) is next. Then C (deploy) and D (release). |
| `docs/specs/2026-04-18-ux-redesign.md` | Feature inventory + user story mapping | 38 commands, 10 workflows, 17 user stories — the research behind the reframe |
| `CLAUDE.md` | Project instructions with product identity section at top | Explains the architecture, manifest contract, and the northstar |
| `GLOSSARY.md` | User-facing terms mapping table | Developer term → user term mapping (openclaw-vault → My Assistant, etc.) |

---

## The One-Sentence Summary

**Lobster-TrApp is a personal AI assistant app for non-technical users, not a security dashboard for developers.** The backend security infrastructure is built and verified (24/24 checks, containers on 7.2GB laptop, Telegram bot responds). The frontend needs to stop showing the plumbing and start showing the product.

---

## What's Been Done (This Multi-Session Arc)

### Architecture (Phases 1-5, commits c89c7ca → 9a5cd78)
- 4-container perimeter: vault-agent, vault-forge, vault-pioneer, vault-proxy
- Network isolation verified (containers can't reach each other except through proxy)
- Rust workflow executor with interpolation, sequencing, success conditions
- React workflow UI with progress tracking, input forms, danger-level styling
- Schema + manifest evolution (workflows section, 42 orchestration checks)

### E2E Verification (commits 36f8a44 → f305f5a)
- Full user journey tested on dev laptop (7.2GB RAM, AMD A12-9720P, Podman rootless, no virtualization)
- Setup wizard: all 6 steps work, all 3 components set up, 24/24 security checks pass
- Telegram bot (Hum): responds, creates files in sandboxed workspace, pairing works
- **Bugs fixed:** forge missing `setup` Makefile target, vault proxy timing, config integrity hash

### Blocker Fixes (commit 88edf4f)
- Prerequisites step: Podman install guidance with platform-specific links
- Config step: API key entry form (Anthropic + Telegram) with guidance links and validation
- Telegram pairing: `approve-pairing` command added to vault manifest for GUI access

### UX Foundation (commits ea27736 → 27c9c2f)
- Agent hallucination mitigation: CONSTRAINTS.md injected via entrypoint
- Build output sanitization: API keys redacted from setup wizard stream
- Dashboard onboarding banner with vault link
- ErrorBoundary component (created + wired into App.tsx)
- Two-tier command system: `tier: user|advanced` field in schema/Rust/TypeScript
- Vault commands tagged: Start, Stop Assistant, Security Check, Connect Telegram → user tier
- CommandPanel: user commands visible, advanced collapsed behind toggle
- Landing page: simplified language throughout (removed MITRE ATT&CK, seccomp, etc.)

### Documentation Alignment (commits a0e4804 → faf878b)
- Product identity spec written (the fundamental reframe)
- Alignment roadmap (Phase A-D to v0.1.0)
- UX redesign spec (feature inventory + user stories)
- Frontend reframe spec (exact per-file implementation plan)
- README.md: assistant-first framing
- CLAUDE.md: product identity section at top
- GLOSSARY.md: user-facing terms mapping table

---

## What Needs to Be Done Next

### Phase B: Frontend Reframe (THE IMMEDIATE TASK)

The spec is at `docs/specs/2026-04-19-frontend-reframe-spec.md`. It details exact changes for 8 files:

| File | Key Change |
|------|-----------|
| `app/src/components/Sidebar.tsx` | "Components" header → remove. Component names → role-based labels (My Assistant, Skills, Network) |
| `app/src/pages/Dashboard.tsx` | Component grid → assistant-centric layout. Prominent status card for runtime component. Telegram guidance. |
| `app/src/components/wizard/WelcomeStep.tsx` | "security-first desktop GUI for the OpenClaw ecosystem" → "Let's set up your personal AI assistant" |
| `app/src/components/wizard/SetupComponentsStep.tsx` | "Set Up Components" → "Setting Up Your Assistant". Hide raw build output behind toggle. |
| `app/src/components/wizard/CompleteStep.tsx` | "All Set!" → "Your Assistant is Ready!" + Telegram link |
| `app/src/pages/ComponentDetail.tsx` | Role-based headers. Simplified security badge. Developer tools collapsed. |
| `app/src/components/ComponentCard.tsx` | Role-based names. Remove version/description/role noise. |
| New: `app/src/lib/labels.ts` | Shared role→label mapping functions |

**No backend changes needed.** This is purely a presentation layer change.

### Phase C: Landing Page Go-Live (~30 min after Phase B)
1. Update `docs/index.html` meta tags (title, description, OG tags)
2. Deploy to Hetzner: `scp docs/index.html docs/bg-hero.png root@hetzner:/var/www/lobster-trapp.com/html/`
3. This replaces the "coming soon" page with the real landing page

### Phase D: Tag v0.1.0 (~30 min after Phase C)
1. Full test suite: `bash tests/orchestrator-check.sh` + `cargo test` + `npm test`
2. `git tag v0.1.0 && git push --tags`
3. Verify CI builds binaries for all platforms
4. Verify release artifacts on GitHub Releases

---

## Dev Environment

The dev laptop is fully set up for testing:

- **Rust 1.95.0** via rustup (`source ~/.cargo/env` needed in new shells)
- **Podman 4.9.3** + podman-compose 1.0.6 (rootless, no virtualization needed on Linux)
- **Tauri system deps:** libwebkit2gtk-4.1-dev, libayatana-appindicator3-dev, librsvg2-dev, patchelf, libgtk-3-dev
- **Note:** Use `libayatana-appindicator3-dev` NOT `libappindicator3-dev` on Ubuntu 24.04

**Build commands:**
```bash
source ~/.cargo/env
cd app/src-tauri && cargo build          # First build: ~6 min. Incremental: ~3 sec.
cd app && npm run tauri dev              # Full app (Rust backend + React frontend)
cd app && npm run dev                    # Frontend only (no Tauri backend — IPC errors expected)
```

**Container commands:**
```bash
podman compose up -d                     # Start 4-container perimeter
podman compose down                      # Stop perimeter
podman exec openclaw-vault sh            # Shell into agent container
```

**The Tauri app may still be running** from the last session. Check with `pgrep -f lobster-trapp`. Kill with `pkill -f lobster-trapp` before rebuilding.

**Containers may still be running.** Check with `podman ps`. The vault containers (openclaw-vault, vault-proxy) persist across app restarts.

---

## Key Architecture Concepts

### The Four Repos
| Repo | Audience | Purpose |
|------|----------|---------|
| **lobster-trapp** (this repo) | Non-technical end users | The GUI — everything the user sees and touches |
| **openclaw-vault** (submodule) | Developers | The runtime containment (vault-agent + vault-proxy) |
| **clawhub-forge** (submodule) | Developers | The skill security scanner |
| **moltbook-pioneer** (submodule) | Developers | The social network monitor (API currently down) |

### The Manifest-Driven Architecture
Each submodule has a `component.yml` that declares its commands, workflows, health probes, configs, and status states. The Rust backend reads these manifests generically. The React frontend renders them. **This architecture stays.** We're adding a presentation layer on top, not replacing the engine.

### The Two-Tier Command System (already implemented)
Commands have a `tier` field: `user` (visible by default) or `advanced` (collapsed behind toggle). The vault has 4 user-tier commands: Start, Stop Assistant, Security Check, Connect Telegram. Everything else is advanced.

### User-Facing Term Mapping (GLOSSARY.md)
| Developer | User |
|-----------|------|
| openclaw-vault | My Assistant |
| clawhub-forge | Skills |
| moltbook-pioneer | Network |
| container | secure sandbox |
| Hard/Split/Soft Shell | deferred for v0.1.0 |

---

## Test Suites

```bash
bash tests/orchestrator-check.sh         # 42 checks (manifest validation, cross-refs)
cd app/src-tauri && cargo test            # Rust unit tests
cd app && npm test                        # 147 frontend tests
cd app && npx tsc --noEmit                # TypeScript type checking
cd app && npx playwright test             # 2 E2E smoke tests
```

All should pass. If frontend tests fail after the reframe, it's likely mock data that needs the `tier` field or updated string expectations.

---

## What NOT to Do

- Don't change the Rust backend — the manifest-driven architecture is correct
- Don't change component.yml manifests — tier tags are already set
- Don't change compose.yml — the perimeter is proven
- Don't expose developer concepts in user-facing UI (see GLOSSARY.md mapping)
- Don't create new documentation files (PROGRESS.md, SUMMARY.md, etc.)
- Don't add features — this is a presentation reframe, not a feature sprint

---

## Current CI Status

CI builds for Linux x64, macOS ARM, macOS Intel, Windows x64. Updater is configured with signing keys in GitHub Secrets. All test jobs pass. The `build-and-release` job produces draft releases on tag push.

---

## Landing Page

- **Live:** lobster-trapp.com currently shows `docs/coming-soon.html`
- **Ready:** `docs/index.html` is the full landing page with download links
- **Deploy:** `scp docs/index.html docs/bg-hero.png root@hetzner:/var/www/lobster-trapp.com/html/`
- **SSH:** `ssh hetzner` (root@46.225.175.242, key at ~/.ssh/hetzner_linuxlaptop)

---

## Success Criteria for v0.1.0

A non-technical user who has never heard of OpenClaw, containers, or security hardening should be able to:

1. Visit lobster-trapp.com and understand: "This gives me a personal AI assistant"
2. Download and install in under 5 minutes
3. Complete the setup wizard without confusion
4. Send their first Telegram message to their assistant within 10 minutes
5. Never see the words: container, seccomp, proxy, manifest, compose, vault, forge, pioneer, or component.yml

---

*"The security harness is not the product. It's the ENABLER. The product is: an always-on AI assistant accessible from any messaging app, that runs locally, and that you can trust."*
