# Handoff — Active Mission

**Last updated:** 2026-04-23 (end of session that landed E.2.1 and FF-merged to main)
**Current mission:** UI/UX rebuild — Phase E.2 user-mode screens
**Branch:** **`main`** — see "Workflow change" below, this is new
**Last commit:** `4ac2aa6 feat(ui): Phase E.2.1 — 4-step onboarding wizard`
**Pick up at:** **Phase E.2.2 — Home Dashboard** (spec 08)

---

## ⚠️ Read this whole file before touching code

This handoff is intentionally verbose. The new session has no prior context. Skipping ahead loses load-bearing detail and risks rebuilding things E.2.1 already shipped, duplicating patterns that are already established, or misinterpreting the user's stated priorities. Reading time: ~10 minutes. Worth it.

After this file, read in this order before opening any source file:

1. **The plan**: `~/.claude/plans/scalable-sprouting-creek.md` — full E.2 roadmap with progress table
2. **Project memory**: `~/.claude/projects/-home-albertd-Repositories-lobster-trapp/memory/MEMORY.md` and the files it indexes
3. **Phase E spec set**: `docs/specs/ui-rebuild-2026-04-21/00-HANDOFF.md` (umbrella) plus spec 08 for E.2.2
4. **Automation strategy spec**: `docs/specs/ui-rebuild-2026-04-21/05-automation-strategy.md` — relevant because E.2.2 adds a background task (activity tracker)
5. **The current sub-phase spec**: `docs/specs/ui-rebuild-2026-04-21/user-mode/08-home-dashboard.md`
6. **Top-level project context**: `CLAUDE.md` at the repo root and `~/.claude/CLAUDE.md` (user's global)

Only then start touching code.

---

## What this project is

Lobster-TrApp is a **desktop GUI** (Tauri 2 + React 18) that wraps the OpenClaw ecosystem in a 4-container security perimeter for **non-technical users**. The user (specs call her "Karen") downloads an installer, enters an API key, connects Telegram, and gets a safe AI assistant she can chat with from her phone. The security is **invisible infrastructure** — she never sees containers, manifests, components, or shell levels.

This repo is the **parent**: it bundles three submodules (`openclaw-vault`, `clawhub-forge`, `moltbook-pioneer`), defines the manifest contract, and provides the GUI. The submodules are independent public repos for tech-savvy users; lobster-trapp is the main user-facing product.

**Status:** ~95% complete. Hetzner-hosted, landing page live at lobster-trapp.com. Preparing to ship v0.2.0. The remaining work is the UI/UX rebuild that splits the single mixed-audience interface into two modes (user / developer) inside the same Tauri app.

**User signal (reconfirmed this session):** Full scope, no compromises, no flattening of the plan. Methodical step-by-step execution across multiple sessions. "Infinite time, as many tokens as it needs." Treat as a strict mandate.

---

## Workflow change — IMPORTANT, new this session

**`feat/phase-e-ui-rebuild` was FF-merged into `main` on 2026-04-23.** The feature branch has been deleted. All E.2.2–E.2.8 commits land **directly on `main`**. Reasoning the user agreed to:

- Solo development; no external reviewer gating on one big PR
- Release is tag-gated not HEAD-gated — v0.1.0 is tagged, v0.2.0 isn't cut until we're ready, so partial / placeholder screens sitting on main HEAD are fine
- Long-lived feature branches create drift; commit-on-main keeps diff size small and easy to revert

**What this means for you:**
- Don't create `feat/*` branches as a reflex. Spin one up only if a specific sub-phase needs isolation for a truly risky refactor (and discuss it first).
- Each sub-phase is one commit (or 2–3 when split per the plan — E.2.2 is split into `a` backend + `b` frontend).
- Don't push to `origin/main` unless the user explicitly asks. Local `main` is ahead of `origin/main` by 8 commits (E.1.1 through E.2.1); user pushes when ready.
- No PR is planned. When E.2.8 is green, user tags `v0.2.0` from main.

Previous handoffs still reference the feat branch. That's stale — ignore it. This handoff is authoritative.

---

## Where we are on the timeline

```
Phase A (docs alignment)         ✅ done
Phase B (frontend reframe)       ✅ done
Phase C (landing page reframe)   ✅ done
Phase D (v0.1.0 release)         ✅ done

Phase E — UI rebuild (split modes):
  E.1.1 design tokens            ✅ done — commit f29478f
  E.1.2 settings + AppContext    ✅ done — commit 080806b
  E.1.3 dual-mode routing        ✅ done — commit 6b86bd4
  E.1.4 ⌘⇧D mode toggle          ✅ done — commit 6b86bd4
  E.1.5 Tauri plugins            ✅ done — commit fa7285a
  E.1.6 system tray              ✅ done — commit fa7285a

  E.2.0 shared infrastructure    ✅ done — commit dc1ec3d
  E.2.1 onboarding wizard        ✅ done — commit 4ac2aa6 ← LATEST
  E.2.2 home dashboard           ⏭ next — start here
  E.2.3 security monitor         pending  (backend + frontend)
  E.2.4 preferences              pending  (unblocks /settings e2e fixes)
  E.2.5 help & support           pending  (30 FAQ entries)
  E.2.6 discover gallery         pending  (15 use-case cards)
  E.2.7 dynamic tray status      pending
  E.2.8 verification + ship-gate pending

  E.3 developer mode (specs 13-14)  pending
  E.4 polish + visual assets        pending
```

---

## Scope decisions locked in — do not re-litigate

| Question | Decision |
|---|---|
| Backend scope | **Full backend as specified** — every Rust command in the specs gets built. Activity tracker (parses vault-proxy JSONL logs), incidents, spending calculator, alerts engine, validate_api_key, generate_diagnostic_bundle (done), derive_telegram_bot_url (done), autostart commands, assistant_status aggregator, pause/resume. No stubs. |
| Discover gallery | **Ship in v0.2.0** (E.2.6). |
| FAQ depth | **Write all 30 answers** in E.2.5 — full content, not stubs. |
| Merge strategy | **Commit-on-main directly** after E.2.1 landed. No feature branch. |
| Smoke-testing | Each sub-phase runs automated verification before committing. Manual smoke runs when memory permits (see memory note below). |

---

## What just landed in E.2.1 (commit `4ac2aa6`)

These are now load-bearing. **Do not rebuild them.** Read these files before writing anything that might overlap.

### New files

```
Frontend
app/src/components/wizard/ConnectStep.tsx       — replaces ConfigStep; two key cards, paste-swap, masked pre-populate
app/src/components/wizard/HowToModal.tsx        — generic text-only walkthrough modal (reused in E.2.4)
app/src/components/wizard/InstallStep.tsx       — merges Prereq+Submodules+SetupComponents; 4-item checklist, withRetry, streaming, Telegram prefetch
app/src/components/wizard/ReadyStep.tsx         — replaces CompleteStep; celebration SVG, auto-advance, Telegram deep-link
app/src/components/wizard/WizardProgress.tsx    — shared 4-dot progress bar for steps 2–4
app/src/lib/wizardUtils.ts                      — withRetry, parseEnvKeys, maskKey, identifyPastedKey, isAnthropicKeyLike, isTelegramTokenLike, upsertEnvVar
app/src/lib/wizardUtils.test.ts                 — 21 unit tests for the above
app/src/hooks/useWizardProgress.ts              — wraps useSettings for setupProgress read/write
app/e2e/wizard.spec.ts                          — 4 Playwright tests (Welcome render, Welcome→Connect, paste-swap, no-jargon)

Backend
app/src-tauri/src/commands/telegram.rs          — derive_telegram_bot_url(token) + 4 unit tests
```

### Modified files

```
app/src/pages/Setup.tsx                         — 4-step STEP_ORDER; consumes setupProgress for crash-resume
app/src/components/wizard/WelcomeStep.tsx       — verbatim spec copy, inline hero SVG, slide-up entrance
app/src/lib/tauri.ts                            — added deriveTelegramBotUrl wrapper
app/src/lib/settings.ts                         — added telegramBotUrl: string | null field + default
app/src/styles/globals.css                      — added missing fade-in / slide-up / celebrate / pulse-ring keyframes

app/src-tauri/Cargo.toml                        — added reqwest = "0.11" with default-features=false, features=["json", "rustls-tls"]
app/src-tauri/Cargo.lock                        — reqwest + transitive deps
app/src-tauri/src/commands/mod.rs               — pub mod telegram
app/src-tauri/src/lib.rs                        — registered derive_telegram_bot_url in invoke_handler
```

### Deleted files

```
app/src/components/wizard/PrerequisitesStep.tsx    — logic merged into InstallStep sub-step A
app/src/components/wizard/SubmodulesStep.tsx       — logic merged into InstallStep sub-step B
app/src/components/wizard/ConfigStep.tsx           — replaced by ConnectStep (redesigned UX)
app/src/components/wizard/SetupComponentsStep.tsx  — logic merged into InstallStep sub-step C (streaming)
app/src/components/wizard/CompleteStep.tsx         — replaced by ReadyStep (celebration entrance)
```

### What the wizard does now (mental model)

1. Welcome: one click → Get Started.
2. Connect: Anthropic key + Telegram token, paste-swap auto-corrects mis-targeted pastes, masked pre-populate from existing `.env`, Skip allowed.
3. Install: 4-item checklist (Check / Download / Build / Safety). Sub-step A is prereq check (missing runtime → tailored per-OS install card, not FriendlyRetry). Sub-steps B/C/D wrapped in `withRetry(2)`. Sub-step C streams `vault.setup` → `vault.start` → `forge.setup` sequentially (pioneer skipped — Meta). Sub-step D runs `vault.full-verify` + `forge.full-check` in parallel (this is the "24-point" audit). Post-Safety prefetches Telegram bot URL into `settings.telegramBotUrl`.
4. Ready: celebration SVG, Open Telegram uses cached URL, 5-second auto-advance with Stay-here cancel.

### What was NOT verified in E.2.1

**Manual smoke test was skipped.** When E.2.1 committed, memory was at 855 MiB free / 3.4 GiB swap. The user's `~/.claude/CLAUDE.md` forbids starting dev servers (Tauri dev, heavy builds) when swap > 500 MB, and the container-build portion of InstallStep needs real Podman + real secure-start to exercise. Automated verification (tsc clean, vitest 175/175, cargo test 28/28, cargo build clean, orchestrator 42/42, wizard playwright 4/4) all passed.

**What this means for you:** before going deep into E.2.2, it's worth running a manual smoke on E.2.1 if memory permits. The path E.2.2 builds on (containers running, `.env` populated, vault-proxy logging) is exactly what InstallStep sets up. Finding a bug there now is cheaper than finding it while debugging Home. An 11-step smoke matrix appears in the E.2.1 commit body (`git show 4ac2aa6`) — or just run `npm run tauri dev` fresh, wipe settings, walk through welcome → connect → install → ready.

---

## Pre-existing Playwright regressions on main — DO NOT try to fix in E.2.2

5 e2e specs fail on main. Confirmed pre-existing (from E.2.0's UserLayout refactor, NOT from E.2.1 — verified this session by stashing E.2.1 and running the suite against b480607):

| Spec | Test | Fails because |
|---|---|---|
| `e2e/navigation.spec.ts:12` | settings page has controls | expects old sidebar structure |
| `e2e/navigation.spec.ts:20` | unknown route shows 404 page with navigation | expects old sidebar |
| `e2e/smoke.spec.ts:21` | navigation to /settings works | expects old `<h1>Settings</h1>` |
| `e2e/user-facing.spec.ts:114` | settings page has no developer jargon | expects old sidebar text |
| `e2e/user-facing.spec.ts:136` | sidebar shows role-based labels | expects old `<h1>Lobster-TrApp</h1>` in sidebar |

These all target the `/settings` route and the old `Layout`/`Sidebar.tsx` structure. E.2.0 replaced that with `UserLayout` + icon rail. The fix lives in **E.2.4** when Preferences replaces the user-mode Settings page. Updating the tests earlier would create dead-code (they'd test placeholders). **Leave them alone in E.2.2.**

If you run `npx playwright test` during E.2.2 verification, expect 20 passed / 5 failed. Your new tests should be added to the passed count, not replace the failing ones.

---

## E.2.2 — Home Dashboard (spec 08): your job for the next session

### The target

Karen's landing page after setup. Shows: assistant status, spending so far this month, recent activity, proactive alerts, tip of the day. Every piece is live data from real Rust commands — no stubs.

Per the plan's commit strategy E.2.2 splits into two commits:
- `feat(backend): Phase E.2.2a — assistant status + spending + activity + alerts commands`
- `feat(ui): Phase E.2.2b — home dashboard with hero card + stat tiles + tip + alerts`

Doing backend first means cargo errors surface before they can block UI work.

### Prereq: compose.yml bind mount for vault-proxy logs

The activity tracker needs to tail `/var/log/vault-proxy/requests.jsonl`, which lives **inside** the `vault-proxy` container. Plan's risk note (ll.289–291) evaluated three options:

- **(a) Bind mount in `compose.yml`** — recommended
- (b) `podman exec tail -f` — brittle, doesn't survive container restarts (the E.2.1 handoff warned about this explicitly)
- (c) Subscribe to container stdout via podman API — cleanest in theory, most code

Use (a). Add to `compose.yml`:

```yaml
services:
  vault-proxy:
    volumes:
      - ./logs/vault-proxy:/var/log/vault-proxy
```

Also:
- Create `logs/.gitkeep` and add `logs/` to `.gitignore` (the directory itself needs to exist so the bind mount works)
- Verify `components/openclaw-vault/proxy/vault-proxy.py:52` writes to `/var/log/vault-proxy/requests.jsonl` — if it's a different path, update the mount target to match, don't change the submodule
- After the mount is added, `podman compose down && podman compose up -d` to get the volume mounted (do NOT destroy data by mistake — the existing containers have been running 2+ days)
- This is a user-triggered step (podman may need sudo in some setups); present the exact commands to the user rather than trying to execute via Bash tool

### Files to create — Backend (E.2.2a)

| File | Purpose |
|---|---|
| `app/src-tauri/src/commands/assistant_status.rs` | `get_assistant_status()` returns `running \| paused \| error \| not_setup \| offline \| api_key_invalid` by composing vault-agent container state + vault-proxy readiness + API key validity. Read container state via `podman ps --filter name=vault-` (same pattern as `diagnostics.rs::collect_container_status`). Cache key-validity for 1 hour in the store to avoid paid API calls per poll. |
| `app/src-tauri/src/commands/spending.rs` | `get_spending_summary() -> SpendingSummary { month_cents, month_limit_cents, day_avg_cents }`. Reads day entries from Tauri store keyed `spending:{YYYY-MM}:{DD}` each `{ tokens_in, tokens_out, cost_cents, calls }`. Aggregates for the current month. |
| `app/src-tauri/src/pricing.rs` | Anthropic model price constants. Prices are per-million-tokens — hold them as `u64` millicents (sub-cent precision), NOT f64. Include a `// TODO: fetch from API when available` comment. Cover: claude-opus-4-6, claude-sonnet-4-6, claude-haiku-4-5 (the three in the repo CLAUDE.md). Unknown-model fallback: use most-expensive rate + log warning (conservative — never under-report). |
| `app/src-tauri/src/commands/activity.rs` | `get_activity_timeline(start_date, end_date) -> Vec<ActivityEvent>` reads from store key `activity_log:{YYYY-MM-DD}`. Also `append_activity_event(event)` (called by `activity_tracker.rs`). Event shape per spec 08 — `{ id, timestamp, type: "telegram.message.received" \| "agent.tool.web_fetch" \| "agent.reasoning.start" \| ..., summary, conversation_id? }`. |
| `app/src-tauri/src/activity_tracker.rs` | **Background task** started from `lib.rs::run()`. Tails `./logs/vault-proxy/requests.jsonl` (after the bind mount). Parses each JSON line, classifies into one of the event types per spec, calls `append_activity_event`. Emits `activity:appended` Tauri event for live UI updates. Use `tokio::fs::File` + `BufReader::lines()`. Handle file-not-yet-created by retrying with backoff. Handle log rotation by re-opening on EOF after a delay. |
| `app/src-tauri/src/commands/alerts.rs` | `get_active_alerts() -> Vec<Alert>` evaluated every 60s (separate background task). Conditions: spending over threshold, api key invalid, container crashed. Returns active alerts from an in-memory `Mutex<Vec<Alert>>`. Reads `dismissedAlerts` from settings to filter per-session dismissals. |
| `app/src-tauri/src/commands/assistant_control.rs` | `pause_assistant()`, `resume_assistant()`, `retry_assistant_start()`. Wraps `podman compose stop vault-agent` / `start` / `restart`. Use the `run_shell` helper in `runner.rs` — don't shell out directly. |

### Registration chores (E.2.2a)

- `app/src-tauri/src/commands/mod.rs` — add `pub mod assistant_status; pub mod spending; pub mod activity; pub mod alerts; pub mod assistant_control; pub mod pricing;`
- `app/src-tauri/src/lib.rs` —
  - Add `mod activity_tracker;`
  - In `run()`, before `.invoke_handler`, start two background tasks using `tauri::async_runtime::spawn`: the activity tracker and the alerts evaluator
  - Register all 8 new commands (get_assistant_status, get_spending_summary, get_activity_timeline, get_active_alerts, pause_assistant, resume_assistant, retry_assistant_start — plus any helpers) in `invoke_handler![]`
- `app/src/lib/tauri.ts` — add typed wrappers for each

### Files to create — Frontend (E.2.2b)

| File | Purpose |
|---|---|
| `app/src/pages/user/Home.tsx` | Replaces the current `UserPlaceholder`. Layout per spec 08: ProactiveAlertsBanner (conditional) → HeroStatusCard → three StatTiles → TipOfTheDay/ActionCard. |
| `app/src/components/user/HeroStatusCard.tsx` | 6 state variants: running / paused / warning / error / not_setup / api_key_invalid. Illustration + title + subline + two action buttons. api_key_invalid state links to /preferences (back-compat route, will become native in E.2.4). |
| `app/src/components/user/StatTile.tsx` | Reusable 3×: Security, Activity, Spending. Title + big value + sub-line, optional progress bar, optional colored accent border when concerning. |
| `app/src/components/user/TipOfTheDay.tsx` | Deterministic pick: `dayOfYear % USE_CASES.length`. "Try this" opens Telegram with prefilled prompt. **Gracefully handle `USE_CASES.length === 0`** — show "Try sending your first message" fallback (use-cases don't populate until E.2.6). |
| `app/src/components/user/ProactiveAlertsBanner.tsx` | Stacks multiple alerts, dismiss-per-session writes to `settings.dismissedAlerts` (already wired). |
| `app/src/hooks/useAssistantStatus.ts` | Polls `get_assistant_status()` every 10s. Also listens to a `status-changed` Tauri event (emit from backend on container state transitions). |
| `app/src/hooks/useSpendingSummary.ts` | Polls every 30s. |
| `app/src/hooks/useActivitySummary.ts` | Listens to `activity:appended` event for live updates. |
| `app/src/hooks/useAlerts.ts` | Polls every 60s. |

### Routing update

`app/src/App.tsx` — the `/` index route currently renders `UserPlaceholder` (pending Home). Point it at the new `Home.tsx`. Verify via the existing tests that dev-mode redirect (`/` → `/dev` when `mode === "developer"`) still works.

### Event types for the activity tracker

From spec 08 § "Activity Event Types" — implement at minimum:

- `telegram.message.received`
- `telegram.message.sent`
- `agent.reasoning.start`
- `agent.reasoning.complete`
- `agent.tool.web_fetch`
- `agent.tool.skill.{skill_id}`
- `security.request.blocked` (route to incidents in E.2.3)
- `api.call.completed` (used to update spending)

Classify by inspecting the JSON line's `event_type` or `action` field (check `components/openclaw-vault/proxy/vault-proxy.py:52` to see the actual schema — don't guess).

### Pricing calculation

When classifying `api.call.completed`, multiply tokens × rate. Store sub-cent precision internally (e.g. `cost_millicents: u64`) and only display rounded cents. Model → rate map goes in `pricing.rs`; if the model isn't recognized, fall back to the most expensive rate and log a warning (conservative — prevents under-reporting).

### Acceptance criteria (spec 08)

- [ ] HeroStatusCard renders all 6 state variants cleanly
- [ ] Status changes within 3s of a backend container state change (tested manually with `podman stop vault-agent`)
- [ ] Sending a Telegram message populates ActivityTimeline within 3s
- [ ] Spending calculation matches Anthropic console to within 1 cent (spot-check with one real conversation)
- [ ] Triggering 80% threshold surfaces a ProactiveAlertsBanner AND emits a system notification
- [ ] Pause/Resume from HeroStatusCard works end-to-end
- [ ] No developer terminology anywhere on the screen (no container, proxy, manifest, podman, vault, forge)
- [ ] UX rubric ≥ 9/10 on every applicable principle

---

## Critical context the new instance won't intuit

### Patterns established in E.2.1 that E.2.2 should reuse

- **Rust HTTP calls**: `reqwest = "0.11"` with `default-features = false, features = ["json", "rustls-tls"]` is now a Cargo dep. See `app/src-tauri/src/commands/telegram.rs` for the recipe: `#[tauri::command] pub async fn foo() -> Result<T, String>`, `reqwest::Client::builder().timeout(...).build()`, parse with `.json::<MyResponse>()`. No CSP changes needed because Rust-side HTTP isn't governed by webview `connect-src`.
- **withRetry pattern**: `app/src/lib/wizardUtils.ts::withRetry(op, maxRetries=2, onRetry?)`. Linear backoff (2s, 4s). Use for any transient-failure-prone op you call from the UI (network, container commands). Don't wrap user-action-required failures (missing runtime, invalid input).
- **Error cascade**: classifyError → FriendlyRetry (Level 2, retryable) → ContactSupport (Level 3, unretryable or post-retry). Both components at `app/src/components/failure/`. Example wiring in `InstallStep.tsx` lines ~270–310.
- **Inline SVG illustrations**: hand-rolled using design tokens is the current convention. See `WelcomeStep.tsx` (lobster + shield) and `ReadyStep.tsx` (confetti + waving lobster). E.4 will swap these for unDraw assets. For E.2.2 HeroStatusCard illustrations you can (a) hand-roll more lobster moods or (b) reuse Lucide icons at 2× scale with colored accent circles. (b) is faster and still distinctive enough.
- **Animations**: `globals.css` now has `animate-fade-in`, `animate-slide-up`, `animate-celebrate`, `animate-pulse-ring`, `animate-slide-in` — all auto-respect `prefers-reduced-motion`. Don't define more unless you really need them.
- **Settings persistence**: `useSettings().update(partial)` does optimistic in-memory + async store write. `telegramBotUrl: string | null` field exists (E.2.1 added it); `favoriteUseCaseIds`, `dismissedAlerts`, `setupProgress` already wired.
- **Tauri invoke wrapper pattern**: add Rust command → register in `commands/mod.rs` + `lib.rs::run()` invoke_handler → add typed wrapper in `app/src/lib/tauri.ts`. The `telegram.rs` + `deriveTelegramBotUrl` pair is the canonical E.2.1 reference.
- **Toast feedback**: `useToast().addToast({ type, title, message, duration })` for any user-initiated action that succeeds or fails.
- **Clipboard writes**: use `writeText` from `@tauri-apps/plugin-clipboard-manager`. The `navigator.clipboard.writeText` path is blocked by CSP.
- **Card classes**: `.card`, `.card-raised`, `.card-hero`, `.card-interactive`, `.card-dev` — all in `globals.css`.

### Pitfalls specific to E.2.2

1. **Background task lifecycle.** The activity tracker and alerts evaluator are long-running loops. Start them from `lib.rs::run()` via `tauri::async_runtime::spawn`. Use a `tokio::sync::watch` or `tokio::sync::oneshot` channel to signal shutdown so `app.on_window_event` can cleanly stop them on close. Don't busy-loop — use `tokio::time::sleep(Duration::from_secs(n))`.

2. **Log file doesn't exist at first startup.** The bind mount `./logs/vault-proxy/requests.jsonl` won't exist until vault-proxy has served at least one request. Activity tracker must handle this: `match File::open(path).await { Ok(f) => tail(f), Err(_) => sleep(5s).then(retry) }`.

3. **Log rotation / truncation.** If vault-proxy rotates the log (deletes and recreates), `BufReader` holds the old inode. Handle by checking `file.metadata().len() < last_known_len` → re-open. Rare but possible over long sessions.

4. **Pricing precision.** Anthropic quotes like "$3.00 per million input tokens, $15.00 per million output tokens". Store as `u64` millicents (1/1000 of a cent). For Haiku 4.5 the cost of a 1-token reply is ~0.001 cents — integer cents would round everything to $0.00. Millicents give 3 decimal precision which is plenty. Only round when displaying.

5. **Activity store key sharding.** `activity_log:{YYYY-MM-DD}` keys. Don't store all events in one giant key — 30 days × 100 events/day = 3000-element Vec rewriting on every append. Per-day keys cap it at ~100 events rewritten per append. If spec 08 says otherwise, follow the spec.

6. **HeroStatusCard variant for `api_key_invalid`.** The primary CTA should open `/preferences`. Today `/preferences` is a `UserPlaceholder` (E.2.4 replaces it). That's fine — tapping it still navigates and the placeholder says "Coming in Phase E.2.4". Don't stub a working key-change flow inside the placeholder just to satisfy this link.

7. **TipOfTheDay when use-cases list is empty.** `app/src/content/use-cases.ts` currently exports `USE_CASES = []` (stubbed in E.2.0, populated in E.2.6). TipOfTheDay must render a fallback — don't throw or render nothing. Fallback copy: "Try sending your first message to your assistant."

8. **Assistant status aggregation has race conditions.** Container state, proxy readiness, and key validity are three async reads. If you poll each, you get partial pictures. Two options: (a) poll them in parallel with `tokio::join!` and synthesize the enum from the combined result; (b) run a single `podman-compose ps` call and parse all at once. (a) is more code but gives better error granularity (you can tell the user "API key invalid" separately from "container crashed"). Recommend (a).

9. **`api_key_invalid` state needs a cheap test.** Don't run models.list on every poll — that's a paid API call. Cache validity for 1 hour in the store. Only revalidate on: app startup, settings write, user-triggered retry. Invalid → cache for 10 minutes then recheck.

10. **Spending calc should come from activity log, not from Anthropic.** Don't try to hit the Anthropic billing API (not a real endpoint). Instead: every `api.call.completed` event from vault-proxy's log includes `tokens_in`, `tokens_out`, `model`. Multiply by rate, sum per-day, aggregate per-month. This is also why the activity tracker needs to be robust — spending depends on it.

### Architectural invariants — do not violate

- Tauri Rust backend stays **manifest-driven and generic**. The commands you're adding in E.2.2 are generic in that they operate on the perimeter as a whole, not on specific component internals. Good.
- User-facing UI **never exposes developer concepts**: container, proxy, manifest, compose, vault, forge, pioneer, seccomp, component.yml, podman, submodule, shell level, Rust, invoke, Tauri command. Map terms via friendly synonyms. Spec 02 has the canonical list.
- Manifest schema changes touch THREE alignment layers: `schemas/component.schema.json`, `app/src-tauri/src/orchestrator/manifest.rs`, `app/src/lib/types.ts`. E.2.2 shouldn't need schema changes — flag if you think you do.
- Per user's `~/.claude/CLAUDE.md`: don't create PROGRESS.md / IMPLEMENTATION.md / SUMMARY.md files. Update `docs/handoff.md` in place at end of session (already the convention).

### Things to reuse (do NOT rebuild)

- `StatusBadge`, `HealthBadge`, `DynamicIcon`, `Skeleton`, `ConfirmDialog`, `CommandButton` — all at `app/src/components/`.
- All existing hooks: `useManifests`, `useSettings`, `useComponentStatus`, `useHealth`, `useCommand`, `useCommandStream`, `useConfig`, `useWorkflow`, `usePrerequisites`. They continue to power dev mode and will be referenced by E.2.3+ too.
- `ToastContext` — universal feedback.
- `AppContext` — `mode/setMode/toggleMode`, `hasSeenAdvancedModeIntro` helpers.
- `classifyError` → extend it if you add new error patterns (currently 13 patterns; see `app/src/lib/errors.ts`). Keep existing patterns order sensitive (more-specific before more-generic).
- Tauri invoke wrapper at `app/src/lib/tauri.ts`.

---

## Verification matrix — run before committing E.2.2a / E.2.2b

```bash
# From repo root
bash tests/orchestrator-check.sh                  # expect: 42 passed

# From app/
cd app
npx tsc --noEmit                                  # expect: no output (clean)
npx vitest run                                    # expect: 175+ pass (baseline; E.2.2 may add more)

# From app/src-tauri/
cd src-tauri
source ~/.cargo/env
cargo test                                        # expect: 28+ pass (baseline; add tests for pricing + activity classification)
cargo build                                       # expect: clean except the 2 pre-existing workflow.rs dead-code warnings

# Playwright (full suite)
cd ../..
cd app
npx playwright test                               # expect: 20+ pass, 5 known-fail (the /settings ones)
```

**Manual smoke test** (against `npm run tauri dev` from `app/` after `source ~/.cargo/env`):

Only if memory permits — target ≥ 1 GB free, swap < 1 GB. If not, explicitly document deferral in the commit message (see E.2.1 for template).

1. App opens to `/` (wizardCompleted) or `/setup` (fresh install).
2. If fresh: complete wizard so containers start and `.env` is populated.
3. Send a Telegram message to your bot → Home ActivityTimeline shows event within 3s (watch browser devtools console for the `activity:appended` event).
4. HeroStatusCard shows "Running" state, progress bar/spending renders, tip renders.
5. `podman stop vault-agent` from a terminal → HeroStatusCard transitions to "Paused" within 10s, Pause button becomes Resume.
6. Click Resume → container starts, state transitions back to "Running".
7. Manually set `settings.spendingLimit.monthly = 100` (via devtools) and fire a $1+ API call → alerts banner appears + system notification fires.
8. Grep Home screen for banned developer terms — expect zero matches.

If any automated check fails, fix before committing. If manual smoke fails, fix before committing.

---

## Commit format for E.2.2

Two commits:

**E.2.2a — backend:**

```
feat(backend): Phase E.2.2a — assistant status + spending + activity + alerts commands

Lands the Rust backend the Home dashboard consumes. 8 new Tauri commands,
an activity tracker that tails the vault-proxy JSONL log for live updates,
pricing constants for Anthropic models, and an alerts evaluator running in
a background task. No UI yet — commit E.2.2b wires it.

- compose.yml: vault-proxy bind mount for /var/log/vault-proxy so the host
  can tail requests.jsonl. logs/ added to .gitignore.
- assistant_status.rs: get_assistant_status() aggregates vault-agent
  container state + vault-proxy readiness + API key validity (1-hour
  cached) into single enum.
- spending.rs + pricing.rs: get_spending_summary() reads per-day entries
  from Tauri store, multiplies by per-million-token rates held as u64
  millicents for sub-cent precision. Covers Opus 4.6, Sonnet 4.6, Haiku 4.5.
- activity.rs: get_activity_timeline + append_activity_event on
  activity_log:{YYYY-MM-DD} store keys (sharded by day to keep each append
  O(events-per-day) not O(all-events)).
- activity_tracker.rs: background tokio task tailing requests.jsonl with
  retry on file-not-yet-created + re-open on rotation. Classifies each
  JSON line into an activity-event type, calls append_activity_event,
  emits activity:appended Tauri event.
- alerts.rs: 60s-interval evaluator checking spending threshold, api key
  validity, container crash. In-memory Vec behind a Mutex; reads
  dismissedAlerts from settings to filter per-session dismissals.
- assistant_control.rs: pause/resume/retry wrapping podman-compose via
  the existing run_shell helper.

Verification: tsc clean, vitest XX/XX, cargo build clean, cargo test XX/XX
(+N for pricing + classification tests), orchestrator-check 42/42.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
```

**E.2.2b — frontend:**

```
feat(ui): Phase E.2.2b — home dashboard with hero card + stat tiles + tip + alerts

Replaces the user-mode Home placeholder with the live dashboard per spec 08.
Every data source is wired to the real Rust commands landed in E.2.2a.

- Home.tsx: replaces UserPlaceholder. Layout per spec: alerts → hero →
  3×StatTile → tip.
- HeroStatusCard: 6 state variants (running / paused / warning / error /
  not_setup / api_key_invalid). Primary + secondary CTAs per variant.
- StatTile: reused 3× for Security, Activity, Spending. Optional progress
  bar and accent border.
- TipOfTheDay: deterministic day-of-year pick, falls back to generic tip
  when USE_CASES is empty (populated in E.2.6).
- ProactiveAlertsBanner: stacked alerts with per-session dismiss.
- 4 new hooks: useAssistantStatus (10s poll + status-changed event),
  useSpendingSummary (30s poll), useActivitySummary (activity:appended
  event listener), useAlerts (60s poll).
- App.tsx: / now renders Home (was UserPlaceholder).

Verification: tsc clean, vitest XX/XX, cargo build clean, orchestrator 42/42,
playwright 20/25 (5 pre-existing /settings failures, unchanged).

Manual smoke: [describe what you ran, or note deferral with reason]

UX rubric scores: Hero X/10, StatTile X/10, TipOfTheDay X/10, AlertsBanner X/10,
Home composition X/10. [fill in]

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
```

After the commits land, update the plan progress table at `~/.claude/plans/scalable-sprouting-creek.md` — change E.2.2 status to ✅ done with the commit hashes. Also update `~/.claude/projects/-home-albertd-Repositories-lobster-trapp/memory/project_status.md` with a one-liner about anything non-obvious.

---

## Practical environment notes

- **OS**: Ubuntu 24.04.2, kernel 6.17, x86_64
- **Hardware**: Lenovo IdeaPad 320, AMD A12-9720P (4 cores), 7.2 GiB RAM (tight!)
- **Rust**: 1.95.0 via rustup
- **Podman**: 4.9.3; compose syntax is docker-compose v1 compatible
- **Node**: bundled with Vite
- **SSH key for Hetzner**: `hetzner_linuxlaptop` (only needed if inspecting lobster-trapp.com deployment)
- **Sudo via Bash tool: don't.** Needs interactive password. Present commands for user to run.

### Memory state at end of last session

- 142 MiB free, 3.0 GiB swap — very tight
- Podman containers (`vault-proxy`, `openclaw-vault`) have been up 2+ days at ~325 MB total
- Telegram desktop holding ~350 MiB swap — biggest single lever if user needs headroom
- Cursor's tsserver holding ~120 MiB swap — restartable via command palette
- No stray vite/tauri/cargo processes (confirmed this session)

### Memory hygiene — do this every session

```bash
# Session start
free -h
ps aux | grep -E "(vite|playwright|tauri|lobster-trapp|target/debug)" | grep -v grep
ollama ps

# Before running heavy cargo/tauri tasks
# Ask the user to close Telegram desktop if swap > 1 GB — single biggest lever

# Mid-session, after killing dev servers
free -h

# Session end (or before launching tauri dev again)
pkill -f "target/debug/lobster-trapp" 2>/dev/null
pkill -f "tauri dev" 2>/dev/null
pkill -f "lobster-trapp.*vite" 2>/dev/null
```

### New dep landed in E.2.1

`reqwest = { version = "0.11", default-features = false, features = ["json", "rustls-tls"] }`

Transitive cost: ~900 KB. No system OpenSSL dependency. Already in `Cargo.lock`.

If E.2.2 needs another HTTP call, reuse the same `reqwest::Client` pattern — don't add `ureq` or another HTTP crate.

### Bash tool quirks to remember

- `cd` doesn't persist between calls. Chain with `&&` or use absolute paths.
- Cargo not on PATH by default. Prefix with `source ~/.cargo/env &&`.
- `pkill` can make bash return exit 144 due to SIGUSR1 propagation — doesn't mean the kill failed, verify with `ps`.
- Long leading `sleep` commands are blocked by the harness.
- `git stash -u` with new files + modified tracked files can be a mess to pop if tests alter any files in between. Prefer `git checkout stash@{0} -- <specific files>` over blind `git stash pop`.

### CSP reminder

`app/src-tauri/tauri.conf.json` locks `connect-src` to `ipc: http://ipc.localhost`. Any HTTP call the frontend wants to make has to be a Tauri command (Rust-side). E.2.2 shouldn't need new webview network calls — activity events come via Tauri event bus, not HTTP.

---

## After E.2.2: a glance at E.2.3

So you don't paint yourself into a corner:

E.2.3 is the **Security Monitor** (spec 09, ~1 day). It needs:

- **~5 new Rust commands**: `get_incidents`, `dismiss_incident`, `get_allowlist`, `add_to_allowlist`, `remove_from_allowlist`, `run_safety_audit`. Plus extending `activity_tracker.rs` to also emit `incidents:appended` when parsing blocked requests.
- **Activity tracker re-use**: E.2.3 consumes the timeline E.2.2 builds. Don't duplicate the tailer. If your activity-event schema in E.2.2 is cramped (e.g. no `severity` field), fix it now before E.2.3 cements consumers.
- **~4–6 new React components**: `SafetyCard`, `ActivityTimeline`, `ActivityRow`, `IncidentsCard`, `AllowlistChips`, `AllowlistModal`.
- **Allowlist reads `components/openclaw-vault/proxy/allowlist.txt`** (confirmed present). Reading is fine; writing needs care to not clobber the submodule during a `git pull` — consider keeping user additions in a separate file.

If E.2.2 gets the activity-event schema right the first time, E.2.3 is mostly UI work on top.

---

## How the user collaborates (style notes)

- **Methodical, not fast.** "Infinite time, as many tokens as needed." Don't rush. Don't simplify. Don't flatten the plan.
- **Concrete progress over speculation.** Each commit should ship visible change. Pure backend commits (E.2.2a) are OK but the following frontend commit (E.2.2b) should always land something Karen can see.
- **Honest acknowledgement when wrong.** If something can't be verified (manual smoke, full happy-path), say so in the commit message. Don't claim passing when you didn't run it.
- **AskUserQuestion when scoping, not for routine choices.** Library picks, refactor-vs-new-file decisions, implementation details — make the call, document in the commit. Scope expansions, API design decisions, user-visible UX trade-offs — ask.
- **Auto mode toggles.** When auto mode is on, execute. When off, ask before significant decisions. Adapt.
- **No TodoWrite.** This project doesn't use it. Ignore the system reminders.
- **Update memory at session end** if anything non-obvious changed. Key files: `project_status.md`, `project_decisions.md` (for load-bearing decisions).
- **`docs/handoff.md` is THE handoff doc.** Update in place at session end. Don't create parallel handoff files.

---

## Success criteria for the entire UI rebuild (north star)

The rebuild is done when:

1. **Karen can install and connect to her assistant in < 3 minutes with ≤ 4 clicks** (E.2.1 shipped; needs manual smoke)
2. **Zero developer terminology** leaks into user mode (enforced by expanded banned-terms list in E.2.8)
3. **Every user-mode screen scores ≥ 9/10** on the UX rubric at `docs/specs/2026-04-20-ux-principles-rubric.md`
4. **Developers can toggle into Advanced Mode** (Cmd/Ctrl+Shift+D — shipped in E.1)
5. **Advanced Mode provides all technical controls** (E.3)
6. **App runs from system tray** with status indicator — shipped static in E.1, dynamic in E.2.7
7. **Failures route through contact-support flow** — infrastructure shipped in E.2.0; consume in every sub-phase
8. **All tests pass**: 175+ unit (E.2.1 baseline; growing), 21+ E2E, 42+ orchestration

---

## Historical handoffs

Prior handoffs preserved in git history:
- Phase A–D handoff: commit `88688c2` — frontend reframe + v0.1.0 release
- Phase E.1 → E.2 planning handoff: pre-2026-04-22
- Phase E.2.0 → E.2.1 handoff: commit `b480607` — the version before this one, with full E.2.1 implementation brief

This handoff replaces `b480607`'s content as the active mission.

---

## tl;dr — the first 30 minutes of the next session

1. Read this handoff to the end (you're almost there).
2. Read the plan: `~/.claude/plans/scalable-sprouting-creek.md`.
3. Read project memory: `~/.claude/projects/-home-albertd-Repositories-lobster-trapp/memory/MEMORY.md`.
4. Read spec 08 in full: `docs/specs/ui-rebuild-2026-04-21/user-mode/08-home-dashboard.md`.
5. Read spec 05: `docs/specs/ui-rebuild-2026-04-21/05-automation-strategy.md` (background task lifecycle).
6. Glance at:
   - `app/src-tauri/src/commands/telegram.rs` (E.2.1's command pattern — you'll mirror it 8× for E.2.2)
   - `app/src-tauri/src/commands/diagnostics.rs` (container-status pattern you'll reuse for assistant_status)
   - `app/src/lib/wizardUtils.ts::withRetry` (the retry helper — reuse for flaky container commands)
   - `components/openclaw-vault/proxy/vault-proxy.py:52` (to confirm the log path + schema)
   - `compose.yml` (the file you'll modify for the bind mount)
7. `git log --oneline -10` to confirm you're on main at `4ac2aa6`; `git status` to confirm clean tree.
8. `free -h` and `ps aux | grep -E "(tauri|vite|target/debug)"` — kill any orphans. If swap > 1 GB, ask the user to close Telegram.
9. Decide: do the E.2.1 manual smoke first (validates the path E.2.2 builds on), or dive straight into E.2.2a. The user's call.
10. Begin E.2.2a. When something gives you pause, AskUserQuestion. When you commit, follow the template above and update the plan progress table.

The user has made it easy: spec 08 is detailed, E.2.1's patterns are established, the merge simplifies git. Your job is backend-heavy Rust work + disciplined UI polish. Don't rush. Don't stub.

Good luck.

---

## Contact

If specs contradict reality, **update the spec first**, then implement. Do not silently deviate. Future instances will re-learn whatever mistake gets baked in.

If anything is unclear or you find a contradiction between this handoff and the codebase, AskUserQuestion before guessing. The user is responsive and patient.
