# Handoff — Active Mission

**Last updated:** 2026-04-22 (end of session that landed E.2.0)
**Current mission:** UI/UX rebuild — Phase E.2 user-mode screens
**Branch:** `feat/phase-e-ui-rebuild`
**Last commit:** `dc1ec3d feat(ui): Phase E.2.0 — user layout, failure UX, diagnostic bundle`
**Pick up at:** **Phase E.2.1 — 4-step onboarding wizard** (spec 07)

---

## ⚠️ Read this whole file before touching code

This handoff is intentionally verbose. The new session has no prior context. Skipping ahead loses load-bearing detail and risks rebuilding things E.2.0 already shipped, missing established patterns, or misinterpreting the user's stated priorities. Total reading time: ~10 minutes. Worth it.

After this file, read in this order before opening any source file:

1. **The plan**: `~/.claude/plans/scalable-sprouting-creek.md` — full 7-day E.2 roadmap with progress table
2. **Project memory**: `~/.claude/projects/-home-albertd-Repositories-lobster-trapp/memory/MEMORY.md` and the files it indexes
3. **Phase E spec set**: `docs/specs/ui-rebuild-2026-04-21/00-HANDOFF.md` (the umbrella) plus the per-screen spec for whatever sub-phase you're working on
4. **The current sub-phase spec**: `docs/specs/ui-rebuild-2026-04-21/user-mode/07-onboarding.md` for E.2.1
5. **Top-level project context**: `CLAUDE.md` at the repo root and `~/.claude/CLAUDE.md` (user's global)

Only then start touching code.

---

## What this project is

Lobster-TrApp is a **desktop GUI** (Tauri 2 + React 18) that wraps the OpenClaw ecosystem in a 4-container security perimeter for **non-technical users**. The user (we call her "Karen" in specs) downloads an installer, enters an API key, connects Telegram, and gets a safe AI assistant she can chat with from her phone. The security is **invisible infrastructure** — she never sees containers, manifests, components, or shell levels.

This repo is the **parent**: it bundles three submodules (`openclaw-vault`, `clawhub-forge`, `moltbook-pioneer`), defines the manifest contract, and provides the GUI. The submodules are also independent public repos for tech-savvy users who want to run them standalone — but lobster-trapp is the main user-facing product.

**Status:** ~95% complete. Hetzner-hosted, landing page live at lobster-trapp.com. Preparing to ship v0.2.0. The remaining work is the UI/UX rebuild that splits the single mixed-audience interface into two modes (user / developer) inside the same Tauri app.

**Important user signal from this session:** The user has explicitly said the app is 95% done, has infinite time / tokens, wants methodical step-by-step execution across multiple sessions, **no compromises, no flattening of the plan, no simplification**. The goal is the full plan implemented and certified working. Treat this as a strict mandate.

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

  E.2.0 shared infrastructure    ✅ done — commit dc1ec3d (just landed)
  E.2.1 onboarding wizard        ⏭ next — start here
  E.2.2 home dashboard           pending  (backend + frontend)
  E.2.3 security monitor         pending  (backend + frontend)
  E.2.4 preferences              pending
  E.2.5 help & support           pending  (30 FAQ entries)
  E.2.6 discover gallery         pending  (15 use-case cards)
  E.2.7 dynamic tray status      pending
  E.2.8 verification + ship-gate pending

  E.3 developer mode (specs 13-14)  pending
  E.4 polish + visual assets        pending
```

---

## Scope decisions locked in by the user (do not re-litigate)

| Question | Decision |
|---|---|
| Backend scope | **Full backend as specified** — every Rust command in the specs gets built. Activity tracker (parses vault-proxy JSONL logs), incidents, spending calculator, alerts engine, validate_api_key, generate_diagnostic_bundle (already done), autostart commands, assistant_status aggregator. No stubs. |
| Discover gallery | **Ship in v0.2.0** (E.2.6). |
| FAQ depth | **Write all 30 answers** in E.2.5 — full content, not stubs. |
| Smoke-test E.1 first | Done 2026-04-22. Tray menu + ⌘⇧D toggle + welcome dialog + dev-mode placeholders all working. |

The user explicitly chose "Full backend as specified" over the recommended "Minimal real backend + graceful empty states." So if you find yourself reaching for a stub, **stop**. Build the real thing.

---

## What just landed in E.2.0 (commit `dc1ec3d`)

These are now load-bearing. **Do not rebuild them.** Read these files before writing anything that might overlap:

### New files

```
app/src/components/UserLayout.tsx           — 80px icon-rail shell, max-w-6xl centered main
app/src/components/UserSidebar.tsx          — 5 NavLinks: Home / Security / Discover / Preferences / Help
app/src/components/failure/FriendlyRetry.tsx    — Spec 06 Level 2 screen
app/src/components/failure/ContactSupport.tsx   — Spec 06 Level 3 screen (uses generate_diagnostic_bundle)
app/src/pages/user/UserPlaceholder.tsx      — Reusable "Coming in Phase E.2.X" card
app/src/pages/user/Home.tsx                 — Currently a UserPlaceholder; replaced in E.2.2
app/src/pages/user/SecurityMonitor.tsx      — Currently a UserPlaceholder; replaced in E.2.3
app/src/pages/user/Discover.tsx             — Currently a UserPlaceholder; replaced in E.2.6
app/src/pages/user/Preferences.tsx          — Currently a UserPlaceholder; replaced in E.2.4
app/src/pages/user/Help.tsx                 — Currently a UserPlaceholder; replaced in E.2.5
app/src/content/faqs.ts                     — Type defs + FAQ_CATEGORIES; FAQS=[] until E.2.5
app/src/content/use-cases.ts                — Type defs + USE_CASE_CATEGORIES; USE_CASES=[] until E.2.6
app/src-tauri/src/commands/diagnostics.rs   — generate_diagnostic_bundle() + redact() with 7 unit tests
```

### Modified files

```
app/src/App.tsx                  — UserLayout wraps the 5 user-mode routes; / falls through to Home placeholder; /settings redirects to /preferences for back-compat
app/src/components/ErrorBoundary.tsx — Refactored to classifyError() then route to FriendlyRetry (Level 2) or ContactSupport (Level 3); takes optional `forceContactSupport` prop
app/src/lib/errors.ts            — Extended with severity axis + userMessage/suggestedAction/technicalDetails; added 5 new patterns (connectivity, authentication, resource, permissions, generic-not-found fallback). Existing category enum + retryable preserved.
app/src/lib/errors.test.ts       — 20 tests (was 11), covering both legacy + new axes
app/src/lib/settings.ts          — New fields: setupProgress, favoriteUseCaseIds, dismissedAlerts, plus SetupStep + SetupProgress + DismissedAlerts types
app/src/lib/tauri.ts             — Added generateDiagnosticBundle() wrapper
app/src-tauri/Cargo.toml         — Added chrono = "0.4" (default-features = false, features = ["clock", "std"])
app/src-tauri/Cargo.lock         — chrono + transitive deps
app/src-tauri/src/commands/mod.rs — Added pub mod diagnostics
app/src-tauri/src/lib.rs         — Registered commands::diagnostics::generate_diagnostic_bundle in invoke_handler
```

### Old files NOT yet deleted (intentional — removed in later phases)

```
app/src/components/Layout.tsx          — orphaned (no imports), deleted in E.2.4 cleanup
app/src/components/Sidebar.tsx         — orphaned, deleted in E.2.4 cleanup
app/src/pages/Dashboard.tsx            — orphaned, replaced by user/Home.tsx in E.2.2
app/src/pages/ComponentDetail.tsx      — orphaned, replaced by dev/DevComponentDetail in E.3
app/src/pages/Settings.tsx             — orphaned, dev mode rebuilds in E.3 / user mode replaces in E.2.4
app/src/components/wizard/PrerequisitesStep.tsx  — used by Setup.tsx; deleted in E.2.1 (logic moves into InstallStep)
app/src/components/wizard/SubmodulesStep.tsx     — used by Setup.tsx; deleted in E.2.1 (logic moves into InstallStep)
```

Don't pre-delete these in E.2.1; the wizard refactor will need to read them while extracting their logic into InstallStep.

### What you'll see if you run `npm run tauri dev` right now

- App opens to `/setup` (if `wizardCompleted: false`) or `/` Home placeholder (if true).
- New 80px icon sidebar on the left with 5 rails. Each rail navigates to a styled placeholder card announcing which sub-phase will replace it.
- ⌘⇧D still toggles dev mode. Dev sidebar (240px wide) and placeholder pages still work.
- System tray menu still has "Assistant status — initializing" / Open Dashboard / Quit. (Dynamic status comes in E.2.7.)

---

## E.2.1 — Onboarding Wizard (spec 07): your job for the next session

### The target

Take a user from "just installed Lobster-TrApp" to "running assistant + Telegram open" in **under 3 minutes with 4 clicks**.

```
Step 1: Welcome    (1 click — Get Started)
Step 2: Connect    (2 inputs — Anthropic API key + Telegram bot token; Skip is allowed)
Step 3: Install    (0 inputs — runs prereq check + submodule init + container build + safety audit, all auto-retried)
Step 4: Ready      (1 click — Open Telegram via deep-link to the user's bot)
```

The current wizard at `app/src/pages/Setup.tsx` is **6 steps and ~25 clicks**. Your job is to collapse it to 4 steps and ~4 clicks while preserving all functional outcomes (prereqs verified, submodules initialised, components built, .env populated).

### Files to create

| File | Purpose |
|---|---|
| `app/src/components/wizard/WizardProgress.tsx` | Shared 4-dot progress bar (●──●──○──○ visual). Visible on steps 2–4. |
| `app/src/components/wizard/ConnectStep.tsx` | Replaces `ConfigStep.tsx`. Two key cards (Anthropic + Telegram), inline regex validation with green checkmark, paste-swap auto-detection, "Show me how to get one" link opening HowToModal, pre-population from existing `.env` (masked), Skip button to continue with empty keys. |
| `app/src/components/wizard/HowToModal.tsx` | Reusable modal with screenshots + numbered steps. Used in ConnectStep and (later in E.2.4) in Preferences key-change flow. Build it generic. |
| `app/src/components/wizard/InstallStep.tsx` | Merges `PrerequisitesStep.tsx` + `SubmodulesStep.tsx` + `SetupComponentsStep.tsx`. 4-item friendly checklist ("Checked your computer / Downloaded the AI parts / Building your assistant / Testing safety checks"). Auto-retry per spec 05 (max 2 retries, exponential-ish backoff). Show technical details collapsed by default. Live ETA. Parallelise where safe. |
| `app/src/components/wizard/ReadyStep.tsx` | Renamed from `CompleteStep.tsx` (or built fresh — your call). Celebration illustration, scale + fade-in spring entrance, "Open Telegram" deep-link, "Go to dashboard" secondary, 5-second auto-advance countdown. Respect `prefers-reduced-motion`. |

### Files to modify

| File | Change |
|---|---|
| `app/src/pages/Setup.tsx` | Rewrite `STEP_ORDER` to `["welcome", "connect", "install", "ready"]`. Replace step state with `setupProgress` from settings (already wired in E.2.0 — just consume it). On mount, resume at `setupProgress.step` if non-null. On step advance, `updateSettings({ setupProgress: { step, completedSteps, skippedKeys } })`. On completion, `updateSettings({ wizardCompleted: true, setupProgress: null })`. |
| `app/src/components/wizard/WelcomeStep.tsx` | Use new copy from spec 07 § Step 1. Add hero illustration placeholder (real SVG comes in E.4). Slide-up + fade-in entrance animation. |

### Files to delete

| File | After what |
|---|---|
| `app/src/components/wizard/PrerequisitesStep.tsx` | After InstallStep absorbs its logic |
| `app/src/components/wizard/SubmodulesStep.tsx` | After InstallStep absorbs its logic |
| `app/src/components/wizard/ConfigStep.tsx` | After ConnectStep replaces it |
| `app/src/components/wizard/SetupComponentsStep.tsx` | After InstallStep replaces it |
| `app/src/components/wizard/CompleteStep.tsx` | After ReadyStep replaces it |

Verify nothing else imports them (`grep -rn "from \"@/components/wizard/PrerequisitesStep\"" src/` etc.) before deleting.

### Settings infrastructure already in place — do not duplicate

`app/src/lib/settings.ts` already has these fields, added by E.2.0:

```ts
setupProgress: SetupProgress | null;   // SetupProgress = { step, completedSteps, skippedKeys? }
SetupStep = "welcome" | "connect" | "install" | "ready"
```

`useSettings` (`app/src/hooks/useSettings.ts`) already shallow-merges saved partials with `DEFAULT_SETTINGS`, so users on the old wizard who already had `wizardCompleted: false` will get `setupProgress: null` automatically. No migration needed.

### Auto-retry pattern (spec 05)

Wrap container builds and other transient-failure-prone operations:

```ts
async function withRetry<T>(op: () => Promise<T>, maxRetries = 2): Promise<T> {
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await op();
    } catch (err) {
      if (attempt === maxRetries) throw err;
      await new Promise((r) => setTimeout(r, 2000 * (attempt + 1)));
    }
  }
  throw new Error("unreachable");
}
```

User sees "Building your assistant…" the whole time — no indication of retry. Only after final failure surfaces a Level 2 (FriendlyRetry) screen via the existing `errors.ts` + `FriendlyRetry` component.

**Use the existing classifyError pipeline** — it now distinguishes severities. The catch block in InstallStep should `classifyError(err)`, render FriendlyRetry, and use its `onGetHelp` callback to escalate to Level 3 ContactSupport. Both components are at `app/src/components/failure/`.

### Paste-swap detection

In ConnectStep, listen for paste events on both key inputs. Detect:

- Anthropic key: starts with `sk-ant-`
- Telegram token: matches `/^\d{6,12}:[A-Za-z0-9_-]{30,}$/`

If user pastes an Anthropic key into the Telegram field (or vice versa), auto-move the value to the correct field and announce via `aria-live="polite"`: "That looks like an Anthropic key; moved to the right field."

### Telegram bot deep-link derivation (ReadyStep)

The Telegram bot token has format `{bot_id}:{secret}`. To get the bot's `@username` for deep-linking, call:

```
GET https://api.telegram.org/bot{TOKEN}/getMe
```

Response includes `result.username`. If username is "MyAssistantBot", deep-link is `https://t.me/MyAssistantBot?text=Hi`. The `text=` query param pre-fills a "Hi" message so when Telegram opens, the user just hits send.

Fallback if getMe fails or token is missing: open generic `https://telegram.org` and show toast "Set up Telegram first to chat with your assistant."

This call should be made **server-side** (new Tauri command) to avoid CSP / CORS issues — the existing CSP at `app/src-tauri/tauri.conf.json` only allows `connect-src ipc: http://ipc.localhost`. So either add a new Rust command `derive_telegram_bot_url(token)` that does the fetch, or relax the CSP. **Prefer the Rust command** — it's cleaner and the user's token shouldn't be in browser memory longer than necessary.

### What "Install" actually does

The InstallStep needs to run these in order (B and C can parallelise; D waits for C):

| Sub-step | What | Existing API |
|---|---|---|
| A — Check your computer | Podman/Docker detection, disk space, network | `checkPrerequisites()` already exists at `app/src/lib/tauri.ts` |
| B — Download the AI parts | `git submodule update --init --recursive` | `initSubmodules()` already exists |
| C — Build your assistant | `podman compose build` for vault + forge containers | Use existing `runCommand()` to invoke each component's `setup` command. **Skip pioneer** — see Pitfalls section below. |
| D — Test safety checks | Run the 24-point safety audit workflow | `executeWorkflow()` with workflow id from `config/orchestrator-workflows.yml` |

Wrap each in `withRetry()`. Surface combined progress to the friendly checklist. "Show technical details" expands to a scrolling pre with the raw stdout/stderr.

### Acceptance criteria (from spec 07)

- [ ] Total time from "Get Started" to "Your assistant is ready!": **under 3 minutes** with valid keys
- [ ] Clicks from Welcome to Ready: **4 total**
- [ ] Zero raw Podman output visible unless "Show technical details" toggled
- [ ] Zero developer terminology in any step ("container", "manifest", "submodule", "podman", "component" all banned)
- [ ] Wizard resumes from last step on app crash mid-wizard
- [ ] All failure states route through Level 2 FriendlyRetry before Level 3 ContactSupport
- [ ] UX rubric ≥ 9/10 on every applicable principle

### Verbatim copy (use these exact strings)

Spec 07 § "Copy / Text Bank (Final)" lists 30 strings. Use them verbatim. Do not paraphrase. Examples:
- `welcome.title` = "Welcome to Lobster-TrApp"
- `welcome.subtitle` = "Your personal AI assistant, safe on your computer. Let's get you set up — it takes about 3 minutes."
- `connect.subtitle` = "Your assistant needs two things to work. Enter them once and you're done. Nothing leaves your computer."
- `install.step.check` = "Check your computer"
- `install.step.download` = "Download the AI parts"
- `install.step.build` = "Build your assistant"
- `install.step.safety` = "Test safety checks"
- `ready.title` = "Your assistant is ready! 🎉"

---

## Critical context the new instance won't intuit

### Pitfalls discovered this session

1. **Pioneer is dead.** `moltbook-pioneer` was acquired by Meta and its API is deferred indefinitely. The submodule still exists in the repo for historical/structural reasons but **do not build the pioneer container** in InstallStep. Build only vault and forge. Pioneer-related UI (e.g. Installed Skills card in Security Monitor) will show static "All clean — 0 skills installed" placeholders until further notice.

2. **vault-proxy logs already exist.** E.2.3 will need to parse them. They live at `/var/log/vault-proxy/requests.jsonl` *inside the vault-proxy container*. Implementation file: `components/openclaw-vault/proxy/vault-proxy.py:52`. To consume from the host, mount the log file as a bind mount in `compose.yml`. Don't try to `podman exec tail -f` — it doesn't survive container restarts.

3. **Permission-denied trap in error patterns.** When extending `errors.ts`, the bare phrase `permission denied` appears in many higher-level wrappers (e.g. `Config write error: permission denied`). The permissions pattern uses `\bEACCES\b|\bEPERM\b` — match only the OS error tokens, not the bare phrase. Otherwise more-specific patterns lose to a greedy permissions match. (Bit me in E.2.0 — fixed by tightening the regex.)

4. **`cd` doesn't persist between Bash tool calls.** Each Bash invocation gets a fresh shell. Either chain commands with `&&`, or use absolute paths. The user's CLAUDE.md prefers absolute paths.

5. **Cargo not on PATH by default.** Always prefix with `source ~/.cargo/env &&` or chain `cd app/src-tauri && source ~/.cargo/env && cargo ...`.

6. **Bash exit code 144 from `pkill`.** When killing tauri-dev process trees, the bash process itself can exit 144 due to SIGUSR1 propagation. Doesn't mean the kill failed. Re-check with `ps aux` to verify.

7. **Memory is tight.** User's machine has 7.2 GiB total RAM. After E.2.0 with no dev server: ~843 MiB free, swap at 3.2 GiB. Always kill `tauri dev` between iterations. CLAUDE.md (global) lists the cleanup commands.

8. **Lucide icon TypeScript quirk.** When typing nav config arrays with Lucide icons, import `type LucideIcon` from `lucide-react` rather than typing as `React.ComponentType<{size?: number}>`. The latter fails strict type-check because Lucide's actual type is `ForwardRefExoticComponent<...>`. See `app/src/components/UserSidebar.tsx` for the pattern.

9. **Tauri tray needs `tray-icon` Cargo feature.** Already enabled in E.1 (`tauri = { version = "2", features = ["tray-icon"] }`) — don't revert it if you bump tauri.

10. **The CSP locks down `connect-src` to ipc.** Any frontend code that needs to fetch from a real URL (like `api.telegram.org`) must do so via a Rust command, not from React directly. See the Telegram bot deep-link section above.

### Architectural invariants — do not violate

- The Tauri Rust backend stays **manifest-driven and generic**. It does not contain component-specific logic. (Read repo CLAUDE.md "The Generic Architecture Constraint" for full statement.)
- The user-facing UI **never exposes developer concepts**: no "container", "proxy", "manifest", "compose", "vault", "forge", "pioneer", "seccomp", "component.yml", "podman", "submodule", "shell level", "Rust", "invoke", "Tauri command". Map terms via `app/src/lib/labels.ts` (already exists) or just use friendly synonyms. Spec 02 has the canonical list.
- Manifest schema changes touch THREE alignment layers and break things if any one is missed: `schemas/component.schema.json`, `app/src-tauri/src/orchestrator/manifest.rs`, `app/src/lib/types.ts`. Don't change schemas in E.2 unless absolutely necessary.
- Per the user's CLAUDE.md: don't create PROGRESS.md / IMPLEMENTATION.md / SUMMARY.md files. (This `handoff.md` is allowed because it already exists in the repo and is the canonical "current state and next steps" doc, referenced from the repo CLAUDE.md.)

### Established patterns to follow

- **Toast feedback** for any user-initiated action that succeeds or fails: `useToast()` hook → `addToast({ type, title, message })`. See `app/src/components/failure/ContactSupport.tsx` for an example with success + error branches.
- **Tauri invoke pattern**: add new Rust commands to `app/src-tauri/src/commands/{name}.rs`, register in `commands/mod.rs` and `lib.rs::run()` invoke_handler, add a typed wrapper to `app/src/lib/tauri.ts`. See `diagnostics.rs` + `tauri.ts` `generateDiagnosticBundle` as reference.
- **Clipboard writes**: use `writeText` from `@tauri-apps/plugin-clipboard-manager` (the plugin is wired). Don't use `navigator.clipboard.writeText` — it requires HTTPS and Tauri's CSP doesn't allow it cleanly.
- **Error display**: catch errors from any async backend call, run `classifyError(err)`, render `<FriendlyRetry>` (Level 2) for retryable, `<ContactSupport>` (Level 3) for non-retryable. The `ErrorBoundary` does this automatically for thrown errors during render.
- **Settings persistence**: `useSettings().update(partial)` does optimistic in-memory update + async store write. Forward-compat is automatic via shallow merge with `DEFAULT_SETTINGS`.
- **Animation**: use the existing utility classes `animate-slide-in`, `animate-fade-in`, etc. defined in `app/src/styles/globals.css`. They auto-respect `prefers-reduced-motion`.
- **Cards**: use the design-system classes `card`, `card-raised`, `card-hero`, `card-interactive`, `card-dev` (defined in `globals.css`). Don't roll your own.

### What's available that wasn't last session

- `chrono = "0.4"` is now a Cargo dependency. Use `chrono::Utc::now()` for any timestamp work.
- `generate_diagnostic_bundle` Rust command + `generateDiagnosticBundle()` TS wrapper are wired and tested.
- `FriendlyRetry` and `ContactSupport` components ready for any new error surface.
- `errors.ts` `ClassifiedError` now has `severity`, `userMessage`, `suggestedAction`, `technicalDetails` in addition to legacy `category`/`title`/`message`/`retryable`.
- Settings has `setupProgress`, `favoriteUseCaseIds`, `dismissedAlerts` ready to consume.
- Five user-mode placeholder pages with `UserPlaceholder` component for any quick wireframing of new screens.

---

## Verification matrix — run before committing E.2.1

```bash
# From repo root
bash tests/orchestrator-check.sh              # expect: 42 passed

# From app/
cd app
npx tsc --noEmit                              # expect: no output (clean)
npx vitest run                                # expect: 154+ pass (E.2.0 baseline; add tests for new wizard logic)

# From app/src-tauri/
cd src-tauri
source ~/.cargo/env
cargo test                                    # expect: 7+ pass (diagnostics baseline)
cargo build                                   # expect: clean except 2 pre-existing workflow.rs dead-code warnings

# Manual smoke test
cd ../..  # back to app/
source ~/.cargo/env
npm run tauri dev
# Verify in the running window:
#   - Setup wizard now shows 4 progress dots (was 6 steps)
#   - Step 1 Welcome → click Get Started → Step 2 Connect
#   - Step 2 Connect → paste an Anthropic key into Telegram field, watch auto-swap → "How to get one" link opens HowToModal
#   - Step 2 → Continue → Step 3 Install with friendly checklist
#   - Step 3 → all 4 sub-steps complete (or auto-retry on transient failure)
#   - Step 4 Ready → "Open Telegram" deep-links to t.me/{bot_username}?text=Hi
#   - Close app mid-Step 3, reopen → wizard resumes at Step 3 (setupProgress persisted)
```

If anything in the smoke test fails, fix before committing. Don't commit and "fix in next sub-phase" — that compounds.

---

## Commit format for E.2.1

The plan says one commit per sub-phase on `feat/phase-e-ui-rebuild`. Use this template (fill in the XX/XX numbers from your verification run):

```
feat(ui): Phase E.2.1 — 4-step onboarding wizard

Condenses the 6-step Setup wizard to 4 (Welcome → Connect → Install → Ready) per spec 07. Reduces clicks from ~25 to 4 and ships paste-swap key detection, parallel install with auto-retry, and Telegram bot deep-link derivation.

- Setup.tsx: STEP_ORDER rewritten to 4-step; consumes new setupProgress from settings for crash-resume per spec 05
- WizardProgress: shared 4-dot progress bar
- ConnectStep (replaces ConfigStep): two key cards with regex validation, paste-swap auto-detection between Anthropic / Telegram fields with aria-live announcement, pre-population from existing .env (masked)
- HowToModal: reusable screenshot+steps modal, will be reused in E.2.4 Preferences key-change flow
- InstallStep (merges Prerequisites + Submodules + SetupComponents): 4-item friendly checklist, withRetry() wrapper for transient failures (max 2 retries, exponential-ish backoff per spec 05), parallelised vault+forge build (pioneer skipped — Meta acquisition), "Show technical details" collapsed by default
- ReadyStep (renamed from CompleteStep): celebration entrance with prefers-reduced-motion respect, Telegram deep-link via new derive_telegram_bot_url Rust command, 5-second auto-advance countdown
- New Rust command: derive_telegram_bot_url(token) calls Telegram getMe API server-side to keep token out of webview memory and dodge CSP

Verification: tsc clean, vitest XX/XX, cargo build clean, cargo test XX/XX, orchestrator-check 42/42.

Manual smoke: 4-step happy path under 3 minutes ✓, mid-wizard crash resumes at Install ✓, paste-swap auto-corrects ✓, Telegram deep-link opens correct bot chat ✓, Level 2 FriendlyRetry appears on simulated network drop ✓.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
```

After the commit lands, update the plan progress table at `~/.claude/plans/scalable-sprouting-creek.md` — change E.2.1 status to ✅ done with the new commit hash. Also update `~/.claude/projects/-home-albertd-Repositories-lobster-trapp/memory/project_status.md` with a one-liner if anything substantively new emerged.

---

## Practical environment notes

- **OS**: Ubuntu 24.04.2, kernel 6.17, x86_64
- **Hardware**: Lenovo IdeaPad 320, AMD A12-9720P (4 cores), 7.2 GiB RAM (tight!)
- **Rust**: 1.95.0 via rustup
- **Podman**: 4.9.3 (Docker also installable but Podman is what `compose.yml` targets)
- **Node**: managed by Vite — current `npm` is fine
- **SSH key for Hetzner**: `hetzner_linuxlaptop` (only needed if inspecting the deployed copy at lobster-trapp.com)
- **Sudo via Bash tool: don't.** It needs interactive password. If a step requires sudo, present the command for the user to run themselves.

### Memory hygiene — do this every session

```bash
# Session start
free -h
ps aux | grep -E "(vite|playwright|tauri|lobster-trapp)" | grep -v grep
ollama ps

# Mid-session, after killing dev servers
free -h    # confirm recovery

# Session end (or before launching tauri dev again)
pkill -f "target/debug/lobster-trapp" 2>/dev/null
pkill -f "tauri dev" 2>/dev/null
pkill -f "lobster-trapp.*vite" 2>/dev/null
```

The user's CLAUDE.md (global, at `~/.claude/CLAUDE.md`) has the full rules. Read it.

---

## After E.2.1: a glance at E.2.2

Just so you know what shape it'll take and don't paint yourself into a corner during E.2.1:

E.2.2 is the **Home Dashboard** (spec 08, ~1.5 days). It needs:

- **6 new Rust commands**: `get_assistant_status`, `get_spending_summary`, `get_activity_timeline`, `get_active_alerts`, `pause_assistant`, `resume_assistant`. Plus `app/src-tauri/src/activity_tracker.rs` (background task tailing vault-proxy logs) and `pricing.rs` (Anthropic model price constants).
- **5 new React components**: `HeroStatusCard` (6 state variants), `StatTile`, `TipOfTheDay`, `ProactiveAlertsBanner`, plus the new `Home.tsx` page itself.
- **4 new hooks**: `useAssistantStatus`, `useSpendingSummary`, `useActivitySummary`, `useAlerts`.

The `TipOfTheDay` component depends on the use-case data being non-empty. E.2.6 will populate it. So E.2.2's TipOfTheDay needs to render gracefully when `USE_CASES.length === 0` — show a generic "Try sending your first message" tip instead.

`Home.tsx` already exists as a UserPlaceholder; replace it in E.2.2.

---

## How the user collaborates (style notes)

- **Methodical, not fast.** They've explicitly said "we have infinite time and as many tokens as it needs." Don't rush. Don't simplify. Don't flatten the plan.
- **Concrete progress over speculation.** They notice when a session ships visible UX change vs. just scaffolding. E.1 produced almost no visible change and they (correctly) called this out. E.2.0 ships visible change (new sidebar, placeholder cards). Try to ensure each commit has *something* a human can see.
- **Honest acknowledgement when frustrated.** When they pushed back on E.1's invisibility, the right move was to acknowledge they were right, not defend. Same applies if you encounter pushback.
- **They use the AskUserQuestion tool well.** When you need to make a real scoping call (not a routine implementation choice), ask. They'll answer with structured options. Don't over-ask.
- **Auto mode often on.** The user has been toggling auto mode. When auto mode is on, execute. When off, they want you to ask before significant decisions. Adapt.
- **No TodoWrite.** This project doesn't use the TodoWrite/TodoList tool ecosystem. Just commit per sub-phase and update the plan progress table. (If you see a system reminder suggesting TodoWrite — and you will — ignore it. The user has not adopted that tool here.)
- **Update memory at session end** if anything non-obvious about the project changed: `~/.claude/projects/-home-albertd-Repositories-lobster-trapp/memory/` directory. Especially `project_status.md` should be kept current (it was just updated 2026-04-22 to reflect Phase E.2 progress).

---

## Success criteria for the entire UI rebuild (north star)

The rebuild is done when:

1. **Karen can install and connect to her assistant in < 3 minutes with ≤ 4 clicks** (E.2.1 acceptance)
2. **Zero developer terminology** leaks into user mode (enforced by expanded Playwright banned-terms list in E.2.8)
3. **Every user-mode screen scores ≥ 9/10** on the UX rubric at `docs/specs/2026-04-20-ux-principles-rubric.md`
4. **Developers can toggle into Advanced Mode** (Cmd/Ctrl+Shift+D — already works in E.1)
5. **Advanced Mode provides all technical controls** (commands, configs, workflows, logs, manifests, security audit, allowlist, shell levels — landing in E.3)
6. **App runs from system tray** with status indicator (green/amber/red/gray — E.2.7)
7. **Failures route through contact-support flow** with diagnostic export; no stack traces in user view (infrastructure done in E.2.0; consume in every sub-phase)
8. **All tests pass:** 154+ unit (E.2.0 baseline; growing), 21+ E2E with new banned-terms in E.2.8, 42+ orchestration

---

## Historical handoffs

Prior handoffs preserved in git history:
- Phase A–D handoff (commit `88688c2`): `docs: handoff for frontend reframe + v0.1.0 release`
- Phase E.1 → E.2 planning handoff (this file's previous version, before 2026-04-22)

This handoff replaces the previous one as the active mission.

---

## tl;dr — the first 30 minutes of the next session

1. Read this handoff to the end (you're almost there).
2. Read the plan: `~/.claude/plans/scalable-sprouting-creek.md`.
3. Read project memory: `~/.claude/projects/-home-albertd-Repositories-lobster-trapp/memory/MEMORY.md`.
4. Read spec 07 in full: `docs/specs/ui-rebuild-2026-04-21/user-mode/07-onboarding.md`.
5. Glance at:
   - `app/src/lib/settings.ts` (see new `setupProgress` field)
   - `app/src/lib/errors.ts` (see new severity axis + how patterns are ordered)
   - `app/src/components/failure/FriendlyRetry.tsx` and `ContactSupport.tsx` (the Level 2 / 3 components you'll consume)
   - `app/src/pages/Setup.tsx` and `app/src/components/wizard/*` (what you're refactoring)
6. `git log --oneline -10` to see commit history; `git status` to confirm clean working tree.
7. `free -h` and `ps aux | grep -E "(tauri|vite)"` — kill any orphans.
8. Begin E.2.1. When something gives you pause, AskUserQuestion. When you commit, follow the template above and update the plan progress table.

You've got this. The user has built an incredible foundation — your job is just to honour the specs and ship the screens.

---

## Contact

If specs contradict reality, **update the spec first**, then implement. Do not silently deviate. Future instances will read the specs and re-learn whatever mistake you bake in.

If anything is unclear or you find a contradiction between this handoff and the codebase, AskUserQuestion before guessing. The user is responsive and patient.

Good luck.
