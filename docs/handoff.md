# Handoff — Active Mission

**Last updated:** 2026-04-29 (end of Delightful Sloth Pass 5 + post-rotation validation)
**Current phase:** Week 1 of the 3-week "Delightful Sloth" UX-coherence polish phase (~2026-04-28 → ~2026-05-19) leading to first public deployment. **Passes 1, 1.5, 2, 3, 4, and 5 complete.** Pass 6 (Dev-tools-lite, Option B) is next.
**Branch:** `main` — pushed to `origin/main`
**Last commits:**
- `1f879d9` — Pass 5: Wizard Polish (3 P0s + 4 P1s closed)
- `3cc2b4e` — handoff supersedes 2026-04-26 (Pass 4 wrap-up doc)
- `22c1452` — Pass 4 wrap-up (RunGuard, signal handlers, watchdog, get_perimeter_state command)
- `62b7f4e` — Pass 4 sub-pass (compose restart policies + lifecycle hooks)
- `b768405` — Pass 3 (rubric +P11/P12/P13, 19 surfaces re-scored)

**Pick up at:** Pass 6 (Dev-tools-lite — Option B, ~5 days). Build Home + Discover + Preferences as real surfaces; Security + Help stay as friendlier placeholders. Wire `get_perimeter_state` + `perimeter-state-changed` event into the new Home dashboard's hero state machine (Pass 4 deferred this; the backend is ready). Spec lives in `docs/specs/2026-04-29-delightful-sloth-target-ux.md`.

---

## ⚠️ Read this whole file before touching code

This session moved through 4½ master-plan passes in one stretch. The artifact trail is dense but well-organized — read the spec trio in order before the rubric. The lifecycle code is already shipped; resist the urge to second-guess the architectural decisions (they're justified in the commits).

Read in this order before opening code:

1. **Master plan: `~/.claude/plans/yes-we-are-building-delightful-sloth.md`** — the 8-pass workflow + locked out-of-scope. Everything else is a sub-document.
2. **`docs/specs/2026-04-28-dogfood-walkthrough-findings.md`** (Pass 1) — the friction punch-list across all 8 user moments. Source of every Pass 5–7 P0 enumerated below.
3. **`docs/specs/2026-04-29-live-signal-first-chat.md`** (Pass 1.5) — live evidence revising Moment 3 from 5.5 → 8.0 and surfacing new banned-term gaps.
4. **`docs/specs/2026-04-29-delightful-sloth-target-ux.md`** (Pass 2) — what good looks like for each of the 8 user moments + the four cross-cutting target behaviors. Pass 5–8 implement against this.
5. **`docs/specs/2026-04-20-ux-principles-rubric.md`** (extended in Pass 3) — 13 principles, 19 surfaces re-scored, Tier 0 placeholder pages, "anti-patterns NOT YET FIXED" catalogue.
6. **`~/.claude/projects/-home-albertd-Repositories-lobster-trapp/memory/MEMORY.md`** — project memory index. `project_status.md` and `project_decisions.md` are most relevant.

---

## Where we are in the master plan

| Pass | Status | Artifacts |
|---|---|---|
| 1 — Dogfood walkthrough | ✅ DONE | `2026-04-28-dogfood-walkthrough-findings.md` |
| 1.5 — Live first-chat signals | ✅ DONE | `2026-04-29-live-signal-first-chat.md`; `tests/e2e-telegram/test_ux_first_chat.py` |
| 2 — Aspirational UX spec | ✅ DONE | `2026-04-29-delightful-sloth-target-ux.md` |
| 3 — Rubric extension | ✅ DONE | `2026-04-20-ux-principles-rubric.md` (extended) |
| 4 — Lifecycle ownership | ✅ DONE (4 of 7 sub-items shipped; 3 explicitly deferred per scope cut) | `app/src-tauri/src/lifecycle.rs` (NEW); `compose.yml`; `lib.rs`; `commands/lifecycle.rs` (NEW) |
| 5 — Wizard polish | ✅ DONE (3 P0s + 4 P1s closed; 4 P2s deferred to Pass 7) | commit `1f879d9`; rubric matrix re-scored rows 2–5 |
| 6 — Dev-tools-lite surface | ⏸ NEXT — Locked: **Option B** (Home + Discover + Preferences real; Security + Help friendlier placeholders) | (per Pass 2 spec) |
| 7 — Notifications + recovery + cleanup | ⏸ | (per Pass 2 spec + the named anti-patterns from Pass 3) |
| 8 — Pre-ship full re-walk | ⏸ | (re-score against extended rubric; ship/no-ship recommendation) |

---

## What Pass 4 shipped vs what's deferred

**SHIPPED:**
- `compose.yml`: `restart: unless-stopped` on all 4 services (vault-agent + vault-proxy added; forge + pioneer already had it).
- `app/src-tauri/src/lifecycle.rs` (NEW, ~330 lines):
  - `bring_perimeter_up_async` / `bring_perimeter_down_sync` — try podman first, fall back to docker, both wrapped with `timeout(1)` for hard ceilings (90s for up, 30s for down).
  - `redact_secrets` — defensive layer on stderr logging (`TELEGRAM_BOT_TOKEN`, `ANTHROPIC_API_KEY`, `OPENAI_API_KEY`).
  - `establish_runguard` / `clear_runguard` — PID-based orphan reap on next launch (closes the SIGKILL leak gap; SIGKILL itself can't be caught).
  - `install_signal_handlers` (Unix) — SIGTERM/SIGINT → `app.exit(0)` → existing `RunEvent::Exit` → graceful compose down.
  - `spawn_watchdog` — 30s `tokio::time::interval` task, polls container status, updates the Tauri-managed `PerimeterStateStore`, emits `perimeter-state-changed` events on transitions, refreshes tray tooltip.
  - `PerimeterState` enum (`NotSetup` / `Starting` / `RunningSafely` / `Recovering` / `Stopped`), `PerimeterStatus`, `ContainerStatus`. Snake-case JSON for the frontend.
- `app/src-tauri/src/commands/lifecycle.rs` (NEW): `get_perimeter_state` Tauri command — frontend reads cached state. Pass 6's Home rebuild will consume this.
- `app/src-tauri/src/lib.rs`: rewired to use the lifecycle module. RunGuard runs BEFORE compose up. Watchdog + signal handlers spawned in `.setup`. `RunEvent::Exit` calls `bring_perimeter_down_sync` then `clear_runguard`.
- 5 unit tests in `lifecycle.rs` (3 redactor, 1 JSON shape, 1 tray-label coverage). All green. Full lib test suite: 33/33 passing.

**DEFERRED FROM PASS 4 (intentionally, per scope cut):**
1. **Hero status surfacing in the main window.** The 6-state hero machine from Pass 2's spec lives on the Home dashboard. Home is currently a placeholder; Pass 6 (Option B) makes it real. Wiring hero on the placeholder is throwaway work. The backend is ready (`get_perimeter_state` + `perimeter-state-changed` event); Pass 6 just wires the frontend.
2. **Updating the tray menu's "status" item TEXT** (vs the tooltip, which IS live-updated). Requires storing the `MenuItem` handle in Tauri state. Code-hygiene tradeoff over feature-creep; defer to a quick follow-up if a user notices.
3. **The Pass 6 hero state machine itself.** This is in Pass 6's lap, not a Pass-4 deferral. Listed for clarity.

**NOT MEANT TO BE IN PASS 4 BUT WORTH NAMING:**
- Auto-restart of dead containers is delegated to `restart: unless-stopped`. The watchdog REPORTS state; it does not act. This was a deliberate choice to avoid competing supervisors. If Pass 7 finds the policy doesn't react fast enough in practice, add an active-restart layer there.

---

## What Pass 5 shipped vs what's deferred

**SHIPPED (commit `1f879d9`):**

P0 (all closed):
- **P0-1 + P0-3.** `MissingRuntimeCard` rebranded "Podman or Docker" → "sandbox runner" in primary copy. Raw `sudo apt install podman podman-compose` is now hidden behind a "Show terminal command" disclosure with explicit "If you're comfortable with the terminal, run this; otherwise click 'Open guide'" framing. `InstallStep.tsx:498-583`.
- **P0-2.** Technical-log codenames translated. `Container runtime: podman` → `Sandbox runner: ready`. `→ openclaw-vault: setup` → `→ Your assistant: install`. `→ clawhub-forge: setup` → `→ Skill scanner: install`. `Fetching assistant modules…` → `Downloading your assistant…`. Plus the safety lines now say "assistant security audit" and "skill scanner pipeline check".

P1 (all closed):
- **P1-1.** Three patterns added to `errors.ts`: `Some assistant modules failed to download`, `Workflow ended with status:`, `exited with code`. Each maps to a specific user-facing title + suggestedAction.
- **P1-2.** `classifyError(err, context?)` gains an optional `ErrorContext` (`"check"|"download"|"build"|"safety"`). When a fallthrough happens, copy is now `"Building didn't finish — let's try again"` instead of generic. `InstallStep` tracks the current sub-step in a ref and threads it in.
- **P1-3.** `derive_telegram_bot_url` (Rust) now returns `TelegramBot { url, username }` instead of just URL. Frontend caches both in `AppSettings.telegramBotUsername`. Ready screen subtitle becomes "Say hi on Telegram — search for @{username} if it doesn't open the right chat" when username is known. If URL is null but username exists, Ready constructs the deep-link from username.
- **P1-4.** `ConnectStep.handleContinue` errors now route through `classifyError()` so raw `err.message` strings (e.g. `openclaw-vault not found`) can no longer leak into the toast.

Banned-term net widened: `app/e2e/wizard.spec.ts` adds `openclaw/clawhub/moltbook` (and capitalized variants) as regression guards.

Rubric re-scored: rows 2–5 in the score matrix updated. Wizard avg 8.0/8.3/7.7/7.9 → 8.4/8.8/8.0/8.7. Row #4 (Configuration / ConnectStep) didn't reach the ≥9 target — its P4 transparency holdout and the deferred "Anthropic API key" → "AI account key" rename keep it at 8.0. Acceptable for polish.

**DEFERRED FROM PASS 5 (intentionally — slip to Pass 7 cleanup):**
1. **Save-confirmation toast** on Continue when Karen had pre-existing keys (P2-1).
2. **Inline screenshots in `HowToModal`** (P2-2, currently `TODO E.4`).
3. **"Anthropic API key" → "AI account key" rename** (P2-3, P6 holdout on row #4).
4. **"Fetching assistant modules" copy parity** (P2-4) — actually this string was killed in P0-2; mark closed.

**Pass 5 verification ran (live + static):**
- 33/33 cargo lib tests pass.
- 4/4 wizard E2E pass with the extended banned-term list.
- Frontend `tsc --noEmit` clean.
- 41/41 orchestrator-check.sh checks pass (1 pre-existing warning: `get_perimeter_state` no frontend invoke — Pass 6 wires it).
- **Live perimeter validation post-token-rotation:** all 4 containers down + recreated cleanly with new env (using a token-leak filter pipe on `compose up`). vault-agent log confirms `[telegram] [default] starting provider (@NewLobsterTrappBot)`. vault-proxy log shows full request chain: `getUpdates` 351 bytes → `sendChatAction` → `api.anthropic.com/v1/messages` 200 OK 2543 bytes → `sendMessage` 200 OK 299 bytes. End-to-end pipeline healthy with the rotated token. **No real bot tokens have ever been committed to git history** (scan ran across `--all --full-history`; only synthetic `1234567890:ABCdef…` test fixtures matched).
- **`.env` permissions tightened** during validation: top-level `.env` and `pioneer/config/.env` were 0664; both now 0600 (matching vault `.env`).

---

## Pass 6 — Dev-tools-lite Surface (the next code work)

**Full Pass 6 roadmap is in its own spec doc: `docs/specs/2026-04-30-pass-6-roadmap.md`.** Read that before code. This handoff section is a one-screen summary so the next instance has orientation without flipping documents.

**Estimate per master plan: ~5 days. Locked: Option B.** Build Home + Discover + Preferences as real, native-feeling user surfaces. Security + Help stay as friendlier placeholders.

### Key scope cut (recorded in the roadmap doc)

The page-level specs (`08/10/12.md`) assume four backend subsystems: activity tracking, spending aggregation from vault-proxy logs, alerts evaluator, status aggregator. **Only the perimeter-state half (Pass 4) is shipped.** Writing the other three subsystems would consume Pass 6's entire budget before any pixel reaches Karen.

Pass 6 ships the frontend with **honest stub copy** for Activity ("None yet") and Spending ("$0.00 this month — we're still wiring this up"); Security tile derives from `PerimeterState`. The actual tracking subsystems slip to Pass 7. Mapping from the spec's 6-state hero to the backend's 5-state perimeter is documented in the roadmap doc (`paused_by_user` and `error_key` are NOT YET REACHABLE — they slip to Pass 7).

### Per-day shape

| Day | Surface | Key files |
|---|---|---|
| 1 (today, 2026-04-30) | Home hero + 3 tiles (real perimeter, stub Activity/Spending) | `Home.tsx`, `HeroStatusCard.tsx`, `StatTile.tsx`, `useHero.ts` |
| 2 | Preferences | `Preferences.tsx` + 6 small Card components |
| 3 | Discover | `Discover.tsx`, `UseCaseCard.tsx`, `data/useCases.ts` |
| 4 | Tip-of-the-day + alerts banner | `TipOfTheDay.tsx`, `ProactiveAlertsBanner.tsx`, `useAlerts.ts` (frontend-only evaluator) |
| 5 | Security/Help friendlier placeholders + rubric re-score | `SecurityMonitor.tsx`, `Help.tsx`, score matrix update |

### Rubric targets

- Rows 14, 16, 17 (Home / Discover / Preferences): from 3.8/4.9/4.9 → ≥8.5.
- Rows 15, 18 (Security / Help placeholders): from 4.9/4.9 → ≥6.5.

### Done-criteria (full list in roadmap doc)

- All 5 user-mode pages no longer render `UserPlaceholder`. The phrase `Coming in Phase E.2.` is gone.
- Hero reflects perimeter health within 30s of a container state change.
- Banned-term sweeps clean across all 5 surfaces.
- Pre-existing baseline-failing tests in navigation/smoke/user-facing resolved or `.skip`-ed.
- Wizard E2E (4/4) + cargo lib (33/33) + orchestrator-check (41/41) still pass.

---

## Locked decisions

- **Pass 6 = Option B.** Ship Home + Discover + Preferences real; Security + Help friendlier placeholders ("We're still building this section. In the meantime, talk to your assistant on Telegram while we finish."). ~5 days. Decided 2026-04-29 with Pass 1.5 live evidence + Pass 3 rubric. Recorded in `project_decisions.md`.
- **External-AI-as-warden via MCP is OUT OF SCOPE for this phase** (deferred to v0.3+).
- **No new sidecars** (vault-calendar / voice / email) this phase. Reopen for v0.3+.
- **Backend orchestrator architecture changes** are out — engine is solid. Pass 4 added lifecycle hooks but did not restructure.
- **Pioneer code** is frozen (target API acquired by Meta).
- **Watchdog reports state; auto-restart is owned by `restart: unless-stopped`.** Don't add a competing supervisor unless Pass 7 finds the policy is too slow in practice.

---

## Open decisions for the next session

- **Pass 6 budget.** Master plan said ~5 days. Five pages (3 real + 2 friendlier-placeholder). The Home hero is the largest piece — it depends on a new `useHero()` hook. Discover + Preferences are mostly form/list rebuilds. Security + Help are copy-only. Recommend tackling Home first (largest, gates the hero pattern), then Preferences (most user-touched after Home), then Discover (data-driven, can lean on existing `useCases` fixtures), then the two placeholders.
- **Live-run validation sub-pass.** Pass 5 already ran one (post-token-rotation perimeter restart + end-to-end Telegram round-trip confirmed). Pass 8's full re-walk will re-validate. No additional live-run needed mid-Pass-6 unless something visibly regresses.
- **Stale playwright tests.** `app/e2e/navigation.spec.ts:12,20`, `app/e2e/smoke.spec.ts:21`, `app/e2e/user-facing.spec.ts:114,136` are baseline-failing on `main` because they assume Home / Settings rebuild that hasn't shipped yet. Pass 6 should clear these as a side effect; if not, mark them `.skip` until the rebuild lands and re-enable once green.
- **Old bot cleanup.** The token rotation invalidates the previously-leaked token. The user may also want to run `/revoke` in BotFather to confirm the old token is permanently dead (BotFather's /token already does this implicitly, but explicit /revoke makes auditing cleaner).

---

## Working state at handoff time

- **All 4 containers up** with the rotated token loaded. Verified end-to-end: `getUpdates` → `sendChatAction` → `anthropic.com/v1/messages` → `sendMessage` round-trip working in vault-proxy log.
- **Working tree clean.** `git status` clean as of `1f879d9`.
- **Cargo build clean.** Same 2 pre-existing dead-code warnings on unused `WorkflowStatus`/`StepStatus` variants.
- **Cargo test green.** 33/33 passing.
- **Wizard E2E green.** 4/4 passing with extended banned-term list.
- **Pushed:** `origin/main` at `1f879d9`.
- **Phase memory current.** `project_status.md` and `project_decisions.md` reflect Pass 5 done.
- **Token rotation:** ✅ done. New token in `components/openclaw-vault/.env` and top-level `.env`, both at mode 0600.
- **No tokens in git history.** Verified via `git log --all --full-history -p | grep <token-shape>`.

---

## Memory updates needed at session start

The next instance should read these BEFORE opening code:

- `project_status.md` — already current through Pass 4.
- `project_decisions.md` — already current with Pass 6 Option B lock-in.
- `project_three_week_polish_phase.md` — index of the 8 passes (current as written).

If anything looks stale, refresh it before assuming.

---

## Quick verification commands at session start

```bash
# Confirm working state
git log --oneline -5
git status --short
podman ps --format "table {{.Names}}\t{{.Status}}"
podman inspect vault-agent vault-proxy vault-forge vault-pioneer \
  --format "{{.Name}}: {{.HostConfig.RestartPolicy.Name}}"

# Confirm Rust still builds
cd app/src-tauri && cargo build && cargo test --lib

# Confirm Telethon harness still works (optional, costs ~$0.01)
cd tests/e2e-telegram && source .venv/bin/activate && \
  python chat.py "ping (Pass 5 session start)"
```

Expected:
- `git status` clean.
- 4 containers up with `unless-stopped` policy.
- Cargo build clean (only pre-existing workflow warnings).
- 33/33 tests pass.
- Bot replies (or, if user hasn't rotated the token yet, we get an auth error — confirm with user).

---

## Historical handoffs (preserved in git history)

- `3cc2b4e` — 2026-04-29 (afternoon): Pass 4 wrap-up + Pass 5 spec. **Superseded** by this commit (Pass 5 done; Pass 6 spec).
- `d55bdbd` — 2026-04-26: v0.2.0 ship + two-track v0.3 mission. Superseded by the Delightful Sloth phase pivot 2026-04-26 → 2026-04-28.
- `95cec0c` — 2026-04-25: morning, fix-first mandate (F11 root cause).
- `8d2e8cc` — 2026-04-24: morning, mission pivot (Karen → prosumer, harness Phase 0-2).
- `2d25299` — Phase E.2.1 → E.2.2 (paused).
- `b480607` — Phase E.2.0 → E.2.1.
- `88688c2` — Phases A–D + v0.1.0 release.

This handoff supersedes `3cc2b4e` as the active mission.

---

## tl;dr — the first 30 minutes of the next session

1. Read this handoff to the end (you're almost there).
2. Read `~/.claude/plans/yes-we-are-building-delightful-sloth.md` (master plan).
3. Skim `2026-04-29-delightful-sloth-target-ux.md` for the target voice — Pass 6 implements directly against it. Pay special attention to the hero state machine (Pass 6's load-bearing pattern).
4. Run the verification commands above. Confirm: clean working state + 4 containers up + bot replying.
5. **Start Pass 6 with the Home hero.** Files: `app/src/pages/Home.tsx` (rebuild) + new `useHero()` hook listening to `perimeter-state-changed` + reading `get_perimeter_state` for the initial value. The backend is already shipped (Pass 4); you're wiring frontend.
6. After Home, do Preferences (most user-touched after Home). Then Discover (data-driven, can lean on existing fixtures). Then replace Security + Help placeholder copy.
7. Re-score rows 14–18 against the rubric. Update the score matrix in `2026-04-20-ux-principles-rubric.md`.
8. Commit-and-push at sensible points (one per surface is sane). Update `project_status.md` at end-of-session.

Pass 6 is a rebuild, not a polish — these surfaces are at Tier 0 (avg 3.8–4.9/10). Don't over-engineer; the goal is "feels native, looks like the rest of the app, gets the hero state machine live." Polish lives in Pass 7.
