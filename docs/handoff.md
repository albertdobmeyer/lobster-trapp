# Handoff — Active Mission

**Last updated:** 2026-04-26 (end of v0.2.0 ship day — F11/F13/F14 closed, tag pushed)
**Current mission:** Two parallel tracks — (A) build the first capability sidecar (`vault-calendar`) per the established mediation pattern, and (B) get v0.2.0 *actually published* (the tag exists; binaries don't).
**Branch:** `main` — pushed to `origin/main` and `albertdobmeyer/openclaw-vault` (submodule)
**Last commits:** `816936b` (parent, v0.2.0 ship-gate batch), `9e65672` (submodule, F11 fix)
**Tag:** `v0.2.0` exists locally and on origin (no GitHub Release object yet — see Track B)
**Pick up at:** Whichever track matches your energy. Both tracks are independent; you can do them in either order or interleave.

---

## ⚠️ Read this whole file before touching code

Yesterday's session closed the entire Tier 1 + Tier 2 findings backlog from the prior handoff (F11, F13, F14) and falsified F12. It also ran a Tier 4 stress-test replay at Soft Shell (19/19 attacks blocked). Then it shipped the v0.2.0 ship-gate batch (gallery populated, release notes, version bumps to 0.2.0, landing page banner).

So unlike the prior handoff (which was "fix things first"), this one is **"build the next things, and finish publishing the thing you already shipped."**

Read in this order before opening code:

1. **`docs/release-notes-v0.2.0.md`** — the user-facing summary of what shipped. Authoritative for what v0.2.0 IS.
2. **`docs/v0.2.0-ship-plan.md`** — checklist (now all green except the manual tag, which is also done). Useful as a state-of-the-world snapshot.
3. **`tests/e2e-telegram/SOFT-SHELL-STRESS-VERDICT-2026-04-25.md`** — Tier 4 results. Soft Shell is verified-safe; ship plan defers the GUI switcher to v0.3 only by scope choice, not by safety.
4. **`tests/e2e-telegram/F12-VERDICT-2026-04-25.md`** — F12 falsification (prompt-phrasing, not shell-level).
5. **`docs/specs/2026-04-25-tool-mediation-pattern.md`** — the design rule for every Track A sidecar.
6. **`docs/specs/2026-04-25-voice-and-calendar-perimeter-extension.md`** — the concrete sidecar designs. Phase A = vault-calendar, Phase B = vault-voice.
7. **`~/.claude/projects/-home-albertd-Repositories-lobster-trapp/memory/MEMORY.md`** — project memory index.

---

## Track A — Middleware tools (vault-calendar first)

### Why this matters

vault-calendar is the **first non-runtime sidecar** in the perimeter. The pattern it establishes will be copied for vault-voice, vault-email, vault-smart-home, and any future capability. Doing it carelessly bakes a bad pattern into the architecture; doing it deliberately gives every future capability a clear template.

### Two paths — pick one based on how rested you are

#### Path A.1 — High-energy: spec-review first, then build

Recommended in yesterday's plan and still my preference.

1. Spawn `feature-dev:code-architect` agent on `docs/specs/2026-04-25-voice-and-calendar-perimeter-extension.md` with the prompt:
   > Review the vault-calendar Phase A design (sections about `vault-calendar`). The pattern you establish here will be reused for vault-voice, vault-email, vault-smart-home. Surface (a) gaps in the OAuth token-handoff (host → container at startup, refresh on expiry, what happens on Tauri crash mid-flow), (b) whether the per-tool risk classification (LOW/MEDIUM/HIGH) handles edge cases (recurring events, all-day events, attendee email privacy, calendar-share invites), (c) whether vault-calendar should reuse vault-proxy's key-injection pattern or fork its own, (d) what the manifest contract looks like (sidecar exposes `component.yml` like the other components — does it have commands, configs, workflows?), (e) what tests look like (direct probing for sidecar isolation, Telegram-driven for tool surface). Output: a sharper spec ready for implementation.
2. Read the agent's output, integrate into the spec or write a follow-up spec.
3. **Then** start the build (Phase A.2 below).

Estimated total: 1–2 days (review + build) versus 3–5 (build alone with rework risk).

#### Path A.2 — Direct build (skip spec review)

Only if you've already mentally walked through the design or if Path A.1's review came back clean. Phase A from the spec breaks into:

1. `components/vault-calendar/` — new component repo (or as a subdirectory if it'll live in the parent repo for now)
2. `component.yml` manifest conforming to `schemas/component.schema.json` (read `components/openclaw-vault/component.yml` for the established shape — identity, status, commands, configs, health, workflows)
3. Containerfile + compose service definition (likely add to root `compose.yml` as a 5th service)
4. OAuth token at rest: Tauri stronghold on the host pushes it into the container env at startup. **Token never on disk inside the container.**
5. Typed tool surface, exposed via WebSocket (same pattern as vault-proxy's HTTP proxy):
   - `calendar.add_event(title, start, end, attendees?, location?, description?)`
   - `calendar.list_events(start, end, calendar_id?)`
   - `calendar.search_events(query, start?, end?)`
   - `calendar.delete_event(event_id, recurrence_scope?)`
6. Per-call sanitization:
   - parameter type checking, length caps
   - URL stripping from descriptions
   - template-marker / prompt-injection-shape detection in descriptions and titles
7. Per-call risk classification (per the mediation pattern spec):
   - `add_event` with no attendees → LOW (auto-execute, log)
   - `add_event` with attendees → MEDIUM (execute + Telegram notify)
   - `delete_event` → HIGH (block-pending-Telegram-tap-approval)
   - `delete_event` with `recurrence_scope=all` → HIGH + extra confirmation
8. Sanitized response format — strip attendee emails, hangout links, organizer details unless explicitly opted in by the request.
9. Tests:
   - `tests/e2e-telegram/direct_probing/probe-calendar.sh` — sidecar isolation (no internet to non-Google domains, no host fs access, no env-var leakage of OAuth token)
   - `tests/e2e-telegram/calendar/` — Telegram-driven test cases extending `chat.py` (plant calendar events, ask bot to summarize/add/modify, verify per-tool policy holds)
10. `12-use-case-gallery.md` — promote the 📅 entries (currently `Remember to call mom`) from `needs_calendar` to `ready` in `app/src/content/use-cases.ts`. There's currently 1 entry tagged `needs_calendar`; consider adding 2–3 more to demonstrate the new capability.
11. Host GUI: a Calendar setup wizard (Tauri-side, never inside the agent) that walks the user through Google OAuth, validates the token, and pushes it to the container.

Estimated: 3–5 days, broken into ~1-day chunks.

### After vault-calendar (the future capability roadmap)

In priority order based on user value, *after* vault-calendar's pattern is validated in production:

1. `vault-voice` (Phase B from the spec) — Twilio + TTS + STT. 7–10 days.
2. `vault-email` — IMAP/SMTP via OAuth providers. ~1 week, similar shape to calendar.
3. `vault-smart-home` — Home Assistant or HomeKit. ~1 week.
4. (Skip `vault-banking` — too high stakes for AI mediation.)

### Track A — open questions for the user

- **Does the user want to invest 1–2 hours in spec review (Path A.1) before any code?** I recommend yes. The user's instinct in yesterday's session was also "discuss the middleware tools" — that's the spec review in conversational form.
- **Calendar provider scope: Google only, or also iCloud / Outlook?** Spec assumes Google. Adding others doubles the surface area.
- **Component repo strategy: standalone clone + submodule (the established pattern), or in-tree under `components/vault-calendar/` directly?** The current ecosystem uses submodules (openclaw-vault, clawhub-forge, moltbook-pioneer). Consistency favors a new submodule. But for the *first* sidecar, in-tree may be faster to iterate.
- **Did the user mean "rebuild" by referencing past calendar work?** I didn't find a prior `vault-calendar` or `calendar` folder in the repo. Worth verifying with the user that this is greenfield — they may remember an attempt I can't see.

---

## Track B — Official publishing and deployment

### Current state

- ✅ Code tag `v0.2.0` exists locally and on origin
- ❌ No GitHub Release object created (just a git tag — `gh release view v0.2.0` returns "release not found")
- ❌ No built binaries attached
- ⚠️ Landing page download button (`docs/index.html` line 610) points at `https://github.com/albertdobmeyer/lobster-trapp/releases/latest` — currently 404s for download because the release object doesn't exist

So **the tag is real but the release isn't real-real yet**. Anyone clicking download from the landing page right now hits a dead link.

### Step-by-step — getting from "tag pushed" to "user can download and run"

Listed roughly in dependency order. Items marked **needs decision** require user input before execution.

1. **Build Tauri binaries** — needs decision on cross-platform scope:
   - Linux only (the dev box, ~30 min, `cd app && npm run tauri build`)
   - Linux + Mac + Windows (cross-compile or use GitHub Actions; ~few hours setup, then automated)
   - Per-platform (.deb, .AppImage, .dmg, .msi, .exe — Tauri can produce all of these; sane defaults usually fine)
2. **Decide on code signing** — needs decision:
   - **Mac:** Apple developer cert + notarization is the only way to avoid the Gatekeeper "unverified developer" warning. Free workaround: ship unsigned + tell users `xattr -d com.apple.quarantine`. Not great UX.
   - **Windows:** Code-signing cert from a CA (~$200/year) avoids SmartScreen scary warning. Free workaround: tell users to click "More info → Run anyway."
   - **Linux:** No signing requirement; AppImage / .deb are fine.
   - For v0.2.0: probably **ship Linux unsigned + Mac unsigned with workaround docs + skip Windows** is the realistic minimum. Defer signing investment until usage justifies it.
3. **Create GitHub Release** from the v0.2.0 tag:
   ```bash
   gh release create v0.2.0 \
     --title "v0.2.0 — Hardened release" \
     --notes-file docs/release-notes-v0.2.0.md \
     <built-binary-files>
   ```
   This creates the release object the landing page expects.
4. **Verify landing page download flow** — the JS at `docs/index.html` likely sniffs platform and picks an asset filename. Check the `download-format` and `other-platforms` spans (lines 621–622) and the JS that populates them. Make sure the asset filenames the JS expects match what `tauri build` produces.
5. **Hetzner server / lobster-trapp.com deployment** — per project memory, the landing page is hosted at `lobster-trapp.com` via nginx on a Hetzner server. Check `~/.claude/projects/-home-albertd-Repositories-lobster-trapp/memory/reference_hetzner.md` for the deployment pattern. The `docs/` directory is what's served. So updates to `docs/index.html` need to be deployed (rsync? git pull on the server? CI?).
6. **Smoke-test the full install flow** from a clean machine (or a clean user account):
   - Click download from lobster-trapp.com
   - Install on each target OS
   - Open the app, walk through setup wizard
   - Pair Telegram, send a message, get a response
   - Confirm the perimeter is up (`podman ps` shows 4 containers)
7. **Optional: announce** — HN Show post, blog post, Twitter, Reddit. The release notes are already written; this is just distribution.

### Track B — open questions for the user

- **What platforms to support for v0.2.0?** Linux-only is fastest. Mac is high-value. Windows is hard (signing). Recommend Linux + Mac unsigned-with-docs.
- **Code signing investment now or later?** Real money + setup time. Probably defer until v0.3 or v1.0.
- **Should the landing page get an "install instructions" page?** Currently goes from "Download" to opaque platform-specific binary. A short "what to do after download" page lowers the abandon rate.
- **CI for the build?** GitHub Actions can produce per-platform binaries on tag push. Setup is ~half a day; payoff is automated future releases.

---

## Cross-track considerations

- vault-calendar is a v0.3.0 candidate. Publishing v0.2.0 (Track B) is independent of Track A. **Recommend doing Track B first** — it closes the loop on what already shipped.
- Once vault-calendar lands, v0.3.0 will be a natural next tag (Soft Shell GUI switcher + vault-calendar). Repeating the publishing process will be cheap once it's been done once for v0.2.0.
- The `also_allow` pattern in `tool-manifest.yml` (introduced for F11) may need extending if vault-calendar exposes its tool surface to the agent through OpenClaw's tool system rather than directly. Worth sanity-checking during spec review (Track A.1).

---

## What you can ignore

The following are real items but not for this session:

- Discover.tsx UI wiring (E.2.6 work; data file is ready when needed)
- GitHub Actions for `direct_probing/probe.sh` (v0.3 setup)
- Submodule remote URL retargeting (cosmetic — the GitHub redirect notice on push)
- F2 (`/proc/mounts` disclosure) — accepted-LOW
- F6 (file-existence confabulation) — monitor only; didn't recur in F12 work
- F7 (tool-inventory disclosure) — recon, not breach; optional system-prompt tightening

---

## Working state at handoff time

- **vault-agent:** Split Shell (matches v0.2.0 ship-state). Verified live: `profile=coding, exec.ask=always, no alsoAllow`.
- **All 4 containers up.** `podman ps` confirms.
- **Working tree clean.** `git status` confirms.
- **Pushed:** parent `816936b` = `origin/main`. Submodule `9e65672` = remote main. Tag `v0.2.0` on origin.
- **Tests green:** 42/42 orchestrator-check, 63/63 tool-control, 10/10 mediation, 22/22 direct-probing.
- **Test harness ready:** `cd tests/e2e-telegram && source .venv/bin/activate && python chat.py "test"` works.

---

## Decisions deferred to user (next session)

Track A:
- Path A.1 (spec review first) vs Path A.2 (direct build)
- Calendar provider scope (Google only?)
- Component placement (submodule vs in-tree)

Track B:
- Platform scope for v0.2.0 binaries (Linux only / + Mac / + Windows)
- Code signing investment (now vs deferred)
- CI for builds (set up now or after first manual build)

---

## Memory updates needed at session start

The next instance should refresh these files in `~/.claude/projects/-home-albertd-Repositories-lobster-trapp/memory/`:

- `project_status.md` — replace with: "v0.2.0 tagged and pushed (2026-04-25). All Tier-1/2 findings closed. Soft Shell verified-safe but GUI-hidden by scope choice. Active tracks: (A) vault-calendar Phase A — sidecar build per the mediation pattern; (B) v0.2.0 publishing — binaries + GitHub Release + lobster-trapp.com deployment."
- `project_decisions.md` — add: "v0.2.0 ship-gate completed 2026-04-25 with all original findings closed; Soft Shell promotion to GUI deferred to v0.3 by scope choice not by safety concern. Tag exists; release artifacts and Hetzner deployment are downstream."
- (Optional) Add `feedback_user_priorities.md` if not already there: "User explicitly requested honest opinions when overwhelmed. Prefer clean stopping points and small completions over starting new large lifts at end-of-session."

---

## Historical handoffs

Prior handoffs preserved in git history:
- `88688c2` — Phase A–D + v0.1.0 release
- `b480607` — Phase E.2.0 → E.2.1
- `2d25299` — Phase E.2.1 → E.2.2 (paused — mission pivoted)
- `8d2e8cc` — 2026-04-24 morning handoff (mission pivot, Phase 0-2 of harness)
- `95cec0c` — 2026-04-25 morning handoff (fix-first mandate; F11 root cause)

This handoff supersedes `95cec0c` as the active mission.

---

## tl;dr — the first 30 minutes of the next session

1. Read this handoff to the end (you're almost there).
2. Read `docs/release-notes-v0.2.0.md` — what shipped.
3. Confirm working state: `git status` clean, `podman ps` shows 4 containers, `git -C components/openclaw-vault log --oneline -1` shows `9e65672`.
4. Ask the user which track they want to start with: A (build calendar) or B (publish v0.2.0).
5. Within Track A, ask Path A.1 (spec review first — recommended) or A.2 (direct build).
6. Within Track B, ask about platform scope and code signing.
7. Update memory per the section above.
8. Start the agreed work.

The user's instinct yesterday was to discuss the middleware tools. If they're still in that headspace, **Track A.1 (spec review)** is the natural opening — it's a conversation-shaped task that doesn't commit code yet. Track B is more execution-shaped and benefits from a fresh, focused chunk.

Either track is shippable in a single ~3-hour session if the decisions above are made up-front.
