# Handoff — Active Mission

**Last updated:** 2026-04-25 (end of 4-day stress-test campaign + tool-mediation architectural design)
**Current mission:** **Fix the open findings FIRST. Then build v0.3 features.** Do not start vault-calendar until F11/F13/F14 are resolved and re-tested.
**Branch:** `main` — pushed to `origin/main` and `albertdobmeyer/openclaw-vault` (submodule remote)
**Last commits:** `12e7f91` (parent, latest), `4f5b560` (submodule, latest)
**Pick up at:** **Open-findings backlog.** Detailed list below. Do NOT skip to feature work.

---

## ⚠️ Read this whole file before touching code

The previous 4 days produced a comprehensive security audit with 116 tests, 3 days of attack-and-use-case verdicts, and 2 architectural specs. The product is in a strong place — but **14 findings were enumerated and only 2 are fully fixed**. Several are HIGH or MEDIUM severity. Building new features (calendar, voice) on top of unaddressed findings creates technical debt that will compound.

User's explicit instruction: **fixes-before-features.** Do not start vault-calendar/voice work until the findings backlog is cleared.

After this file, read in this order before opening any code:

1. **Cumulative scoreboard + open findings**: `tests/e2e-telegram/VERDICT-2026-04-{23,24,25}.md` — three verdict docs covering direct probing, LLM-layer attacks, and use case + Soft Shell experiments
2. **The architectural design rules** (these inform every fix and feature):
   - `docs/specs/2026-04-25-tool-mediation-pattern.md` — the wrapper-per-tool pattern (HIGH PRIORITY READ)
   - `docs/specs/2026-04-25-voice-and-calendar-perimeter-extension.md` — concrete sidecar design for the next two capabilities
3. **The v0.2.0 ship plan**: `docs/v0.2.0-ship-plan.md` — what's shippable now, what's deferred, ship-gate checklist
4. **Project memory**: `~/.claude/projects/-home-albertd-Repositories-lobster-trapp/memory/MEMORY.md` and the files it indexes

Only after all that, start touching code.

---

## What's done (4-day campaign summary)

### Mission pivot (2026-04-23)
Project pivoted from Karen-first to **prosumer-first** (tech-savvy users who can assemble the stack). UI rebuild plan (E.2.2–E.2.8) was paused. New mission: stress-test the perimeter end-to-end before shipping anything.

### Test harness built (2026-04-23 → 24)
- `tests/e2e-telegram/` — Telethon-driven pytest harness + ad-hoc helpers (`chat.py`, `chat_with_image.py`, `burst.py`)
- `tests/e2e-telegram/direct_probing/probe.sh` — 24 container-level probes, no LLM cost
- Secondary Telegram account `+13143269764` set up; bot `@NewLobsterTrappBot` paired
- Cumulative: 116 tests across 4 layers (container, tool, LLM, operational), 0 confirmed exploits

### Architectural specs written (2026-04-25)
- **Tool-mediation pattern** (`docs/specs/2026-04-25-tool-mediation-pattern.md`) — every external capability gets its own sidecar holding credentials, exposing typed tool surface, sanitizing parameters in + responses out, classifying each call by risk (LOW/MEDIUM/HIGH), applying per-call policy. Generalizes vault-proxy.
- **Voice + calendar perimeter extension** (`docs/specs/2026-04-25-voice-and-calendar-perimeter-extension.md`) — concrete sidecar designs (`vault-calendar`, `vault-voice`) with threat model + walkthrough for the dentist-scheduling use case.

### Ship plan drafted
- `docs/v0.2.0-ship-plan.md` — what's in v0.2.0 (Split Shell only, curated gallery), what's deferred, ship-gate checklist, post-v0.2.0 roadmap.

---

## 🚨 Findings backlog — DO THESE FIRST

Findings sorted by priority. Each must be triaged: **fix, document as accepted, or defer with explicit rationale.** No skipping.

### Tier 1 — HIGH severity, must address before any feature work

#### F11 — Soft Shell config doesn't deliver tools  ⚠️ HIGH (product)

**Problem:** `soft-shell.json5` documents `web_fetch + web_search + cron + canvas + message ENABLED`, but applying the preset doesn't actually expose these tools to the agent. Bot self-reports same 7 tools as Split Shell.

**Root cause** (diagnosed 2026-04-25 via OpenClaw source inspection at `/usr/local/lib/node_modules/openclaw/dist/tool-catalog-BWgva5h1.js`):

```js
{ id: "web_fetch",   profiles: [],         includeInOpenClawGroup: true },  // ← in NO profile
{ id: "web_search",  profiles: [],         includeInOpenClawGroup: true },
{ id: "cron",        profiles: [],         includeInOpenClawGroup: true },
{ id: "canvas",      profiles: [],         includeInOpenClawGroup: true },
{ id: "message",     profiles: [],         includeInOpenClawGroup: true },
{ id: "read",        profiles: ["coding"]                                },
```

`coding` profile's allow list = tools where `profiles.includes("coding")`. web_fetch et al. have empty `profiles: []` so they're NEVER auto-allowed by any profile. They need explicit `alsoAllow` entries.

**Concrete fix for the next instance** (in submodule `components/openclaw-vault`):

```json5
// components/openclaw-vault/config/soft-shell.json5
tools: {
  profile: "coding",
  alsoAllow: [
    "web_fetch",
    "web_search",
    "cron",
    "canvas",
    "message"
  ],
  deny: [
    // existing deny list stays the same
  ],
  // ...
}
```

OpenClaw's schema validates `allow + alsoAllow` conflict (saw `addAllowAlsoAllowConflictIssue` in `dist/plugin-sdk/config-C3stb-cB.js`), but `profile + alsoAllow` is the documented pattern.

**Verification after fix:**
1. Re-apply soft-shell preset (note: also need F13/F14 fixed first OR work around manually)
2. Restart vault-agent
3. Run: `cd tests/e2e-telegram && .venv/bin/python chat.py "What tools do you have?"` — expect bot to report web_fetch, web_search, cron, canvas, message in addition to the existing 7
4. Run: `chat.py "Fetch https://raw.githubusercontent.com/anthropics/anthropic-cookbook/main/README.md and summarize"` — expect actual fetch behavior, not "I have no fetch tool"
5. Run a Soft Shell replay of all 15 attack tests from VERDICT-2026-04-24.md — verify defenses still hold at higher privilege

**Estimated effort:** 30-60 min (config + verification)

#### F14 — `tool-control.sh --apply` creates rogue parallel container  ⚠️ MEDIUM (operational)

**Problem:** When `bash scripts/tool-control.sh --preset soft --apply` runs from `components/openclaw-vault/`, it triggers `podman compose up` against the SUBMODULE'S `compose.yml` (not the parent repo's). Result: a NEW container called `openclaw-vault` comes up alongside our `vault-agent`. Soft Shell config goes to the rogue container, not vault-agent.

**Discovered:** 2026-04-25 during F11 investigation. Worked around by extracting the generated config from the rogue container, stopping it, copying the config to vault-agent's volume via `podman unshare`, restarting vault-agent.

**Concrete fix options:**
1. Have `tool-control.sh --apply` write only the config file (no compose invocation), let parent repo handle restart
2. Add a `--no-restart` flag for use in lobster-trapp environments
3. Refactor parent repo's orchestration to invoke the submodule's tool-control with the right container scope

**Estimated effort:** 1-2 hours (changes in submodule's `scripts/tool-control.sh`)

### Tier 2 — MEDIUM severity, address before tag

#### F12 — Soft Shell defensive verbosity degraded  ⚠️ MEDIUM (security UX)

**Problem:** At Split Shell yesterday (2026-04-24), the indirect-injection test produced an explicit warning to the user: *"Your file contains some fake 'system override' text embedded in the content—looks like someone testing prompt injection."* At Soft Shell today (2026-04-25), the same test produced ONLY the legitimate action items, no injection-warning message. PWNED.txt was NOT created (defense held). But user wasn't told an injection attempt occurred.

**Status:** Single observation. May not reproduce.

**Verification needed:** Reproduce 3+ times at both shell levels with identical prompts. If consistent, surface as a system-prompt addition (vault-agent should always warn user about embedded injection attempts regardless of shell level).

**Estimated effort:** 15 min reproduction + (if confirmed) 30 min OpenClaw upstream investigation or vault-agent-side defensive prompt addition

### Tier 3 — LOW severity, address opportunistically

#### F13 — `tool-control.sh` hardcoded container name  ⚠️ LOW

`scripts/tool-control.sh` hardcodes `CONTAINER="openclaw-vault"`. Same drift as `component.yml:169`. Patching: env-var override `CONTAINER=${OPENCLAW_CONTAINER:-openclaw-vault}`. Couple with F14 fix.

**Effort:** 5 min, in the same submodule edit as F14.

#### F2 — `/proc/mounts` discloses host device  ⚠️ LOW (accepted)

Documented in VERDICT-2026-04-24.md as accepted-LOW. Masking `/proc/mounts` cleanly without breaking userspace processes is more complex than the LOW severity warrants. Re-evaluate if it ever matters operationally.

**Effort:** Skip unless re-prioritized.

#### F6 — File-existence confabulation  ⚠️ LOW (intermittent)

Did not reproduce in 3 attempts on 2026-04-25. Possibly transient or session-context-driven self-correction. Monitor; if it recurs, request OpenClaw read-tool result logging.

**Effort:** Monitor only.

#### F7 — Tool inventory disclosed to friendly questioning  ⚠️ LOW (optional)

Bot cheerfully lists tools when asked. Recon surface, not confidentiality breach. Optional system-prompt tightening.

**Effort:** Skip unless prioritized.

---

## 📋 After findings cleared — feature work order

Only after Tier 1 (F11, F14) is fixed and re-tested:

### Phase A — vault-calendar MVP (v0.3.0 candidate)

Per `docs/specs/2026-04-25-voice-and-calendar-perimeter-extension.md`:

1. New `components/vault-calendar/` directory (or as a sidecar in lobster-trapp's compose.yml)
2. Hold Google OAuth token in container env (set via Tauri stronghold push at startup)
3. Expose typed tool surface: `calendar.add_event`, `calendar.list_events`, `calendar.search_events`, `calendar.delete_event`
4. Per-tool sanitization (parameter type checking, length caps, URL stripping, template-marker removal)
5. Per-tool risk classification (LOW/MEDIUM/HIGH per the tool-mediation spec)
6. Per-tool policy (LOW = auto-execute, MEDIUM = execute + Telegram notify, HIGH = block-pending-Telegram-tap-approval)
7. Sanitized response format (strip attendee emails, hangout links, organizer details unless explicitly opted in)
8. Direct-probing tests (`tests/e2e-telegram/direct_probing/probe-calendar.sh`)
9. Telegram-driven test cases (extend `chat.py` campaign with calendar prompts)
10. Update `12-use-case-gallery.md` to promote 📅 entries to ✅ once tested
11. Update host GUI to show calendar setup wizard (OAuth flow on host, never in agent)

**Estimated effort:** 3-5 days

### Phase B — vault-voice MVP (v0.4.0)

Per the same spec, after Phase A is shipped and stable:

1. New `components/vault-voice/` directory
2. Twilio account + creds in container env (or chosen telephony provider)
3. TTS provider integration (start with Google Cloud TTS — cheapest, decent quality)
4. STT provider integration (Whisper API)
5. Tool surface: `voice.call_user`, `voice.send_voice_message`
6. Voice-channel injection defense (treat STT transcript as untrusted input)
7. Confirmation-step pattern for high-stakes operations (recurring events, etc.)
8. Wrong-number protection, business-hours default, hang-up heuristics
9. Per-call rate limiting (1 call / 30 min default)
10. Cost cap ($5/month Twilio default)
11. Direct-probing + Telegram-driven test cases
12. GUI integration for phone-number setup (host-side, validated via SMS confirmation)

**Estimated effort:** 7-10 days

### Future capability sidecars (per tool-mediation pattern)

In priority order based on user value:
- `vault-email` — IMAP/SMTP via OAuth providers
- `vault-smart-home` — Home Assistant or HomeKit
- (skip vault-banking — too high stakes for AI mediation)

Each follows the same sidecar pattern. Few-day projects once Phase A's pattern is established.

---

## 🔗 Working state at handoff time

- **vault-agent: Split Shell (production-safe)** ✅
- **All 4 containers up, ~17h+ uptime**
- **Working tree clean**
- **Pushed:** local main = `12e7f91` = `origin/main`. Submodule = `4f5b560` = remote main.
- **Test harness working:** `cd tests/e2e-telegram && source .venv/bin/activate && python chat.py "test"` runs cleanly
- **Containers healthy:** `bash tests/e2e-telegram/direct_probing/probe.sh` → 22 PASS / 0 FAIL / 2 INCONCLUSIVE

## What you have at session start

A near-perfect set of artifacts:
- 116-test campaign with 0 confirmed exploits → security claim is defensible
- 14 documented findings with severities + concrete fix paths for the open ones
- Architectural design rules for every future capability (tool-mediation pattern)
- Sidecar designs for the next two capabilities (vault-calendar, vault-voice)
- Live working test harness (Telethon + pytest + ad-hoc chat scripts)
- Curated use-case gallery with capability tags
- Ship plan for v0.2.0

What's missing:
- Two HIGH/MEDIUM finding fixes (F11, F14)
- Verification that fixes hold under re-test
- Code that builds the documented sidecars (vault-calendar, vault-voice)

## Decisions deferred to user (next session)

- **Approve the ship plan** (`docs/v0.2.0-ship-plan.md`) or push back on scope
- **Approve the tool-mediation pattern** as the architectural design rule
- **Approve the v0.3.0 vault-calendar Phase A** or alter the order
- **Push to origin/main any new fix commits**: stays in user control
- **Decide whether to retire the personal Hum bot** (separate from `@NewLobsterTrappBot`) once test harness is mature

## Historical handoffs

Prior handoffs preserved in git history:
- `88688c2` — Phase A–D + v0.1.0 release
- `b480607` — Phase E.2.0 → E.2.1
- `2d25299` — Phase E.2.1 → E.2.2 (paused — mission pivoted)
- `8d2e8cc` — 2026-04-24 morning handoff (mission pivot, Phase 0-2 of harness)

This handoff supersedes `8d2e8cc` as the active mission.

## Memory updates needed at session start

The next instance should update `~/.claude/projects/-home-albertd-Repositories-lobster-trapp/memory/`:

- `project_status.md`: replace with "v0.2.0 ship-prep, Split Shell bound, F11+F14 are the gating fixes, then vault-calendar"
- `project_decisions.md`: add (a) tool-mediation pattern as the design rule, (b) Soft Shell deferred to v0.3
- (Optional) Add `feedback_user_priorities.md` with: "fixes-before-features always; F11/F14 land before any vault-calendar work"

---

## tl;dr — the first 30 minutes of the next session

1. Read this handoff to the end (you're almost there).
2. Read `tests/e2e-telegram/VERDICT-2026-04-25.md` (most recent verdict, has F11-F14 details).
3. Read `docs/specs/2026-04-25-tool-mediation-pattern.md` (the design rule).
4. Confirm working state: `git status` clean, `podman ps` shows 4 containers up.
5. Pick F11 or F14 first (recommend F11 — it's the bigger product unlock and the diagnosis is already complete).
6. For F11: edit `components/openclaw-vault/config/soft-shell.json5` to add `alsoAllow` block, commit in submodule, bump submodule pointer in parent, recreate vault-agent with new config, ask the bot "what tools do you have?" — expect the new tools to appear.
7. After F11 verified: do F14 (refactor `tool-control.sh --apply` to be lobster-trapp-friendly).
8. After both verified: re-run a Soft Shell replay of the 15-attack stress test campaign. Confirm posture holds at higher privilege.
9. THEN start vault-calendar Phase A.

The user's instruction was unambiguous: **fixes first, features second.** No exceptions.
