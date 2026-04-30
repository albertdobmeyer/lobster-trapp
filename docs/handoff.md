# Handoff — Active Mission

**Last updated:** 2026-04-30 (end of Delightful Sloth Pass 6 — Dev-tools-lite shipped)
**Current phase:** Week 2 of the 3-week "Delightful Sloth" UX-coherence polish phase (~2026-04-28 → ~2026-05-19) leading to first public deployment. **Passes 1, 1.5, 2, 3, 4, 5, and 6 complete.** Pass 7 (Notifications + recovery + cleanup) is next.
**Branch:** `main` — pushed to `origin/main`
**Last commits:**
- `2ea0631` — Pass 6 Day 5: friendlier placeholders + dead-code cleanup + rubric re-score
- `368ef94` — Pass 6 Day 4: tip-of-the-day + alerts banner + useAlerts hook
- `f320ec0` — Pass 6 Day 3: Discover use-case gallery
- `977ef52` — Pass 6 Day 2: real Preferences page (6 sections)
- `9e5ba11` — Pass 6 Day 1: Home hero state machine + stat tiles
- `1c3c71d` — Pass 6 roadmap doc + handoff scaffold
- `1f879d9` — Pass 5: Wizard Polish (3 P0s + 4 P1s closed)

**Pick up at:** Pass 7 (Notifications + recovery + cleanup, ~2 days per master plan). The full backlog is in this handoff under "What Pass 6 shipped vs what's deferred" — but the headline items: spending aggregation from vault-proxy logs, activity persistence, the 60s backend alerts evaluator, automatic vault-agent restart on key change, OS-level autostart wiring (`tauri-plugin-autostart`), bespoke `status-{state}.svg` illustrations.

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
| 6 — Dev-tools-lite surface | ✅ DONE (Option B; 5 days, 5 commits, 5 surfaces) | commits `9e5ba11`/`977ef52`/`f320ec0`/`368ef94`/`2ea0631`; rubric rows 14–18 re-scored |
| 7 — Notifications + recovery + cleanup | ⏸ NEXT | (per Pass 2 spec + the deferred items in this handoff) |
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

## What Pass 6 shipped vs what's deferred to Pass 7

**SHIPPED across 5 commits (`9e5ba11` → `2ea0631`):**

| Day | Commit | Surface |
|---|---|---|
| 1 | `9e5ba11` | Home hero state machine + 3 stat tiles. New `useHero` hook (subscribes to `perimeter-state-changed`, derives 5 reachable states). New `HeroStatusCard` + `StatTile` components. Closed the orchestrator-check warning by adding `getPerimeterState()` frontend wrapper. |
| 2 | `977ef52` | Real `Preferences` page with 6 sections per spec 10. Inline key-edit (modal slipped to Pass 7), preset spending limit + alert-threshold slider, 3 notification toggles, 2 startup toggles, re-run setup confirm, Advanced Mode toggle. Auto-saves via `useSettings`; errors route through `classifyError`. Footer with version + tagline. **Side-effect win:** the 5 baseline-failing playwright tests cleared because they referenced the old `Settings` heading and `Back to Dashboard` link — both renamed in this pass. |
| 3 | `f320ec0` | Real `Discover` page rendering the existing 19-card `USE_CASES` fixture. Search + category tabs + favorites (persisted to `settings.favoriteUseCaseIds`) + "Try this" CTAs that open Telegram with the prompt URL-encoded into `?text=`. Capability-based de-emphasis for `needs_calendar` / `needs_voice` cards. |
| 4 | `368ef94` | `TipOfTheDay` card on Home (deterministic day-of-year pick from ready use-cases) + `ProactiveAlertsBanner` (renders nothing when no alerts — honours P12). New `useAlerts` hook with 3 frontend-only rules: missing Anthropic key (danger), missing Telegram token (warning), perimeter in error state (danger). Dismissals persist via `settings.dismissedAlerts`. |
| 5 | `2ea0631` | Friendlier placeholders for Security + Help via the new `StillBuildingCard` component (honest plain-language copy + Open-Telegram CTA — replaces "Coming in Phase E.2.X" + spec-path leak). Dead-code cleanup: removed `Layout.tsx`, old `Sidebar.tsx`, `UserPlaceholder.tsx`. Rubric matrix re-scored rows 14–18. |

**Rubric outcome (all Day-5 targets met):**

| Row | Surface | Before | After | Target |
|---|---|---|---|---|
| 14 | Home | 3.8 | **8.8** | ≥8.5 ✓ |
| 15 | Security (placeholder) | 4.9 | **8.5** | ≥6.5 ✓ |
| 16 | Discover | 4.9 | **9.0** | ≥8.5 ✓ |
| 17 | Preferences | 4.9 | **8.6** | ≥8.5 ✓ |
| 18 | Help (placeholder) | 4.9 | **8.5** | ≥6.5 ✓ |

The Tier-0 cliff Pass 1 flagged is closed. Karen's curve: Wizard 9.5 → Telegram 8.0 → Home 8.8 → Discover 9.0 / Preferences 8.6.

**DEFERRED FROM PASS 6 TO PASS 7 (intentionally — recorded in `2026-04-30-pass-6-roadmap.md` and `project_decisions.md`):**

Backend subsystems (the page specs assumed these existed; we shipped the frontend with honest stubs instead):
1. **Activity tracking subsystem** — persist agent task events. Activity tile on Home will then say "12 tasks today / Most recent: planned a trip" instead of the current "None yet" stub.
2. **Spending aggregation subsystem** — read vault-proxy `Anthropic API call` log entries, compute `tokens × price_per_token`, persist daily/monthly totals. Spending tile + spending alert + spending limit display all depend on this.
3. **60-second backend alerts evaluator** — replaces the frontend-only `useAlerts` evaluator. Adds rules for: spending limit reached, container crashed, security audit failed, threat-blocked notice.
4. **Status aggregator** — combines container health + API key validity + proxy readiness into a single `assistant_status` enum. Unblocks the `error_key` hero state.

Hero state machine completion:
5. **`paused_by_user` hero state** — needs a backend "Pause" command (stop containers without recreating + flag the pause as user-initiated) and a "Pause" affordance on the hero CTA when state is `running_safely`.
6. **`error_key` hero state** — needs the alerts evaluator to detect Anthropic 401 responses and the status aggregator to surface the result.

Preferences gaps:
7. **Auto-restart vault-agent on key rotation** — currently the toast says "Restart your assistant for the change to take effect"; should be automatic. Needs a new `restart_perimeter` Tauri command.
8. **OS-level autostart wiring** — the `settings.autostart` toggle persists; `tauri-plugin-autostart` to register/unregister at OS level slips to Pass 7.
9. **OS-permission gate for notifications** — the toggles persist; the Tauri notification permission prompt slips to Pass 7.
10. **KeyChangeModal** — Pass 6 used inline edit (simpler, equally usable); the modal pattern from spec 10 slips if it earns its keep.

Visual polish:
11. **Bespoke `status-{state}.svg` illustrations** — Pass 6 reuses the wizard's pulsing-rings stand-in. Six illustrations (safe / paused / warning / error / offline / not-setup) are still TODO E.4.
12. **Inline use-case illustrations** — `app/src/assets/illustrations/use-cases/` is empty; Discover cards render text-only.
13. **`<SkeletonCard>` / `<SkeletonText>` polish** — Pass 6 uses a brief animate-pulse skeleton in `HeroStatusCard`; richer skeletons across the app slip.

Wizard P2s also slipped from Pass 5 (still open):
14. **"Anthropic API key" → "AI account key" rename** — the P6 holdout that kept Configuration row at 8.0.
15. **Inline screenshots in `HowToModal`**.
16. **Save-confirmation toast on Continue with pre-existing keys**.

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

- **Pass 7 budget.** Master plan said ~2 days; the deferred-from-Pass-6 backlog above is closer to 4. Recommend prioritising the items that *unlock* user-visible features (spending aggregation → real Spending tile, status aggregator → `error_key` hero state, alerts evaluator → real notification value) over polish items (skeletons, illustrations, modal pattern). The polish items can slip to Pass 8's pre-ship pass if they earn it.
- **Pass 8 ship/no-ship gate.** The 3-week window ends ~2026-05-19. After Pass 7, Pass 8 is the full re-walk + ship recommendation. The current trajectory (1 day per pass on average since 2026-04-28) suggests we'll arrive at Pass 8 with budget to spare.
- **Stale baseline tests:** ✅ resolved as a Day-2 side effect — 25/25 E2E now pass.
- **Old bot cleanup.** The token rotation invalidates the previously-leaked token. The user may also want to run `/revoke` in BotFather to confirm the old token is permanently dead (BotFather's /token already does this implicitly, but explicit /revoke makes auditing cleaner).

---

## Working state at handoff time

- **All 4 containers up** with the rotated token loaded.
- **Working tree clean.** `git status` clean as of `2ea0631`.
- **Cargo build clean.** Same 2 pre-existing dead-code warnings on unused `WorkflowStatus`/`StepStatus` variants.
- **Cargo test green.** 33/33 passing.
- **E2E green.** 25/25 passing (was 20/25 before Pass 6 Day 2 cleared the baseline).
- **Orchestrator-check.** 42/42 with **0 warnings**.
- **Pushed:** `origin/main` at `2ea0631`.
- **Phase memory current.** `project_status.md` and `project_decisions.md` reflect Pass 6 done.
- **Token rotation:** ✅ done (twice today). New token in `components/openclaw-vault/.env` and top-level `.env`, both at mode 0600.

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

This handoff supersedes the prior end-of-Pass-5 doc (the previous superseded link was `3cc2b4e`; the handoff committed at the end of Pass 5 was `a8fb18e`).

---

## tl;dr — the first 30 minutes of the next session

1. Read this handoff to the end (you're almost there).
2. Read `~/.claude/plans/yes-we-are-building-delightful-sloth.md` (master plan).
3. Skim the **deferred-from-Pass-6** list above. Pass 7's job is to convert as many of those as the budget allows into shipped value.
4. Run the verification commands above. Confirm: clean working state + 4 containers up + bot replying.
5. **Highest-leverage Pass 7 starting points**, in priority order:
   - **Spending aggregation subsystem** (item #2): unlocks the real Spending tile on Home. Read vault-proxy logs, compute cost per Anthropic call, persist daily/monthly. ~1 day.
   - **Status aggregator + alerts evaluator** (items #3 + #4): unlock the `error_key` hero state and richer notification rules. ~1 day combined.
   - **Auto-restart on key change** (item #7): big UX win for `Preferences`'s key-rotation flow. ~half-day.
6. Polish items (skeletons, illustrations, modal pattern) only if Pass 7 finishes early. Otherwise let them slip to Pass 8's pre-ship pass.
7. Commit-and-push per logical chunk. Update `project_status.md` and `project_decisions.md` at end-of-session.

Pass 7 closes the polish gap. Pass 8 ships. The 3-week window stays comfortable.
