# Handoff — Active Mission

**Last updated:** 2026-04-29 (end of Delightful Sloth Pass 4 wrap-up)
**Current phase:** Week 1 of the 3-week "Delightful Sloth" UX-coherence polish phase (~2026-04-28 → ~2026-05-19) leading to first public deployment. **Passes 1, 1.5, 2, 3, and 4 complete.** Pass 5 (Wizard Polish) is next.
**Branch:** `main` — pushed to `origin/main`
**Last commits:**
- `22c1452` — Pass 4 wrap-up (RunGuard, signal handlers, watchdog, get_perimeter_state command)
- `62b7f4e` — Pass 4 sub-pass (compose restart policies + lifecycle hooks)
- `b768405` — Pass 3 (rubric +P11/P12/P13, 19 surfaces re-scored)
- `0416714` — Pass 2 (aspirational target-state UX spec)
- `7499ceb` — Pass 1 + Pass 1.5 (dogfood punch-list + live first-chat signals)

**Pick up at:** Pass 5 (Wizard Polish, ~3 days) — close the 3 wizard P0s named in Pass 1 + Pass 1.5. Specific files + frictions enumerated below.

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
| 4 — Lifecycle ownership | ✅ DONE (4 of 7 sub-items shipped; 3 explicitly deferred per scope cut — see below) | `app/src-tauri/src/lifecycle.rs` (NEW); `compose.yml`; `lib.rs`; `commands/lifecycle.rs` (NEW) |
| 5 — Wizard polish | ⏸ NEXT | (this handoff specifies the work) |
| 6 — Dev-tools-lite surface | ⏸ Locked: **Option B** (Home + Discover + Preferences real; Security + Help friendlier placeholders) | (per Pass 2 spec) |
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

## Pass 5 — Wizard Polish (the next code work)

**Estimate per master plan: ~3 days.** Push every wizard screen to ≥9/10 on the (now extended) 13-principle rubric.

The frictions to close — all named in Pass 1 + Pass 1.5 + Pass 3's "Anti-Patterns NOT YET FIXED" section. Listed P0 → P1 → P2.

### P0 — Must close

#### P0-1. MissingRuntimeCard Linux block exposes raw `sudo apt install`

**File:** `app/src/components/wizard/InstallStep.tsx:511-518`
**Current:** Karen sees `sudo apt install podman podman-compose` as primary install guidance.
**Target:** Walk Karen through guided install, OR offer one-click bundling of the runner. At minimum: hide the raw command behind a `Show technical command` disclosure and frame it as `If you're comfortable with the terminal, run this; otherwise click 'Open guide.'`
**Rubric anchor:** P1 (never expose plumbing). Pass 3 anti-pattern list line "sudo apt install podman podman-compose displayed as primary install guidance."

#### P0-2. Internal codenames in InstallStep technical log

**File:** `app/src/components/wizard/InstallStep.tsx:175, 192, 221, 223, 234`
**Current:** Lines like `→ openclaw-vault: setup`, `→ clawhub-forge: setup`, `Container runtime: podman`, `Fetching assistant modules…` appear when Karen clicks "Show technical details".
**Target:** Translate to user-facing labels even inside the technical-details disclosure. `→ Your Assistant: install` / `→ Skill Scanner: install` / `Sandbox runner: ready` / `Downloading the assistant…`
**Rubric anchor:** P1 + P6.

#### P0-3. `MissingRuntimeCard` rebrand: "Podman or Docker" → "sandbox runner"

**File:** `app/src/components/wizard/InstallStep.tsx:490-558`
**Current:** Card surfaces dev tool names directly.
**Target:** Replace primary copy with neutral "sandbox runner" framing. Keep the actual brand names only inside the per-platform install guidance, where they're necessary signposts.
**Rubric anchor:** P1 + P6.

### P1 — Should close

#### P1-1. Three thrown errors fall through to UNKNOWN_FALLBACK

**Files:** `app/src/components/wizard/InstallStep.tsx:140-145, 204, 260`
**Current:** Errors thrown as `Error("...exited with code ${event.payload.exit_code}")`, `throw new Error("Some assistant modules failed to download")`, and `throw new Error("Workflow ended with status: ${r.status}")` don't match any pattern in `app/src/lib/errors.ts:200-228`'s `classifyError()`. They fall through to `UNKNOWN_FALLBACK` which says "Something went wrong" — explicitly a rubric anti-pattern (line 311 of `2026-04-20-ux-principles-rubric.md`).
**Target:** Add specific patterns to `errors.ts` for each, OR pre-classify before throwing.

#### P1-2. UNKNOWN_FALLBACK itself is the named anti-pattern

**File:** `app/src/lib/errors.ts:191-198`
**Current:** Generic "Something went wrong" / "Something didn't work as expected." copy.
**Target:** Make context-aware based on which sub-step (`check`/`download`/`build`/`safety`) was running. E.g., `Your computer check didn't work as expected.`

#### P1-3. Telegram URL prefetch failure is silent

**File:** `app/src/components/wizard/InstallStep.tsx:630-646`
**Current:** If `deriveTelegramBotUrl()` returns null, Ready screen falls back to generic `https://telegram.org` — Karen has no idea which bot to talk to.
**Target:** When prefetch fails, surface the bot's username on the Ready screen as a fallback, with copy like `Find your bot in Telegram: search for @YourBotUsername`.

#### P1-4. ConnectStep read-config error path doesn't route through classifyError

**File:** `app/src/components/wizard/ConnectStep.tsx:163-169`
**Current:** Toast shows raw `err.message` — could leak strings like "openclaw-vault not found".
**Target:** Route through `classifyError()` like InstallStep does.

### P2 — Nice to have

- Save-confirmation toast on Continue when Karen had pre-existing keys (Pass 1 line 199).
- Inline screenshots in `HowToModal` (currently `TODO E.4` at `app/src/components/wizard/HowToModal.tsx:94`).
- "Anthropic API key" → "Anthropic key" or "AI account key" (Pass 1 line 198).
- "Fetching assistant modules" → "Downloading your assistant" (Pass 1 line 252).

### Pass 5 verification (per Pass 8 acceptance signals)

- All four wizard E2E tests in `app/e2e/wizard.spec.ts` pass with the extended banned-term list.
- Three thrown errors route through `classifyError` to specific patterns, not `UNKNOWN_FALLBACK`.
- Telegram URL prefetch failure shows bot username fallback (manual test: temporarily break the prefetch and verify Ready screen).
- Re-score wizard screens (#1–#5 in the rubric) against the extended 13-principle rubric. Target: every screen ≥9/10.
- Ideally a brief live-running validation (~30 min) confirms dynamic friction is closed.

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

- **Token rotation status.** During Pass 4 sub-pass verification, `podman compose up -d` echoed `TELEGRAM_BOT_TOKEN=...` to stdout (pre-existing podman-compose CLI behavior; not anything our code does). The user said they'd rotate it. **Confirm with user that the new token is in `.env` before running anything that uses Telegram.** The Telethon harness (`tests/e2e-telegram/test_ux_first_chat.py`) doesn't need the bot token — it uses Telethon's user API — but the perimeter does.
- **Pass 5 budget.** Master plan said ~3 days. Pass 1's 4 P0s + 4 P1s should fit. Do all P0+P1, defer P2s if running long.
- **Live-run validation sub-pass during Pass 5 or Pass 8?** Pass 1's doc recommended "a brief live-run validation sub-pass" for dynamic friction (~2 hours). Decide whether to slot this into Pass 5 (live-run the wizard install on a clean VM) or Pass 8 (full re-walk). Recommend Pass 5, since the wizard frictions are exactly what live-running surfaces.

---

## Working state at handoff time

- **All 4 containers up.** `podman ps` confirms; restart policies are `unless-stopped` on all 4 (verified earlier this session).
- **Working tree clean.** `git status` clean as of last commit.
- **Cargo build clean.** Only the 2 pre-existing dead-code warnings on unused `WorkflowStatus`/`StepStatus` variants (unrelated to lifecycle work).
- **Cargo test green.** 33/33 passing including 5 lifecycle tests.
- **Pushed:** `origin/main` at `22c1452`.
- **Phase memory current.** `project_status.md` updated through Pass 4. `project_decisions.md` records Pass 6 Option B lock-in.
- **Token rotation:** pending user action. Will be done out-of-band by the user before next code work.

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

- `d55bdbd` — 2026-04-26: v0.2.0 ship + two-track v0.3 mission (calendar + publishing). **Superseded** by the Delightful Sloth phase pivot 2026-04-26 → 2026-04-28.
- `95cec0c` — 2026-04-25: morning, fix-first mandate (F11 root cause).
- `8d2e8cc` — 2026-04-24: morning, mission pivot (Karen → prosumer, harness Phase 0-2).
- `2d25299` — Phase E.2.1 → E.2.2 (paused).
- `b480607` — Phase E.2.0 → E.2.1.
- `88688c2` — Phases A–D + v0.1.0 release.

This handoff supersedes `d55bdbd` as the active mission.

---

## tl;dr — the first 30 minutes of the next session

1. Read this handoff to the end (you're almost there).
2. Read `~/.claude/plans/yes-we-are-building-delightful-sloth.md` (master plan).
3. Skim `2026-04-29-delightful-sloth-target-ux.md` for the target voice; `2026-04-28-dogfood-walkthrough-findings.md` for the friction punch-list (especially Moment 2 — wizard).
4. Run the verification commands above. Confirm: clean working state + 4 containers up + token rotated by user.
5. **Start Pass 5 P0-1**: `app/src/components/wizard/InstallStep.tsx:490-558` (MissingRuntimeCard). The 3 P0s in Pass 5 are independent; if one snags, move to the next.
6. After P0s ship, do P1s. If running long, P2s slip to Pass 7 cleanup.
7. Re-score wizard screens against the rubric. Update the score matrix in `2026-04-20-ux-principles-rubric.md` if the rebuild moves anything ≥9.
8. Commit-and-push at sensible points (one per P0/P1 cluster is sane). Update `project_status.md` at end-of-session.

The wizard is already at 9.5/10 — Pass 5 is **polishing**, not rebuilding. Resist the urge to redesign anything; the design has earned its score. Just close the named P0s.
