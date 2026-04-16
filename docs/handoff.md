# Handoff — Architecture v2 Perimeter Redesign

**Date:** 2026-04-15
**Author:** Albert + Claude Opus (session 2026-04-14/15)
**Status:** Phases 1-5 complete, Phases 6-7 pending

---

## What Happened This Session

We identified and resolved a fundamental architectural flaw: clawhub-forge and moltbook-pioneer were running as bare bash scripts on the user's unprotected host, processing untrusted content (SKILL files with 11.9% malware rate, Moltbook feeds with injection attacks) with zero isolation. The vault container air-gapped the agent, but two other attack vectors were wide open.

We redesigned the architecture so that **all components handling untrusted content run inside containers in one isolated perimeter.** Then we implemented the first three phases.

### The Security Model (The Prison Allegory)

Think of this as a prison labor system. The OpenClaw agents (clawbots) are the inmates — powerful, resourceful, and potentially dangerous, but they work cheap so people want to use them. The question is: how do you let prison workers do useful labor without giving them access to steal your belongings or destroy your property?

- **The Vault** is the prison fence and cell block. The agents run inside it, always contained.
- **The Forge** is the workshop inside the prison. Untrusted SKILL files (tools the agents use) are scanned and rebuilt here — never brought outside the fence for inspection.
- **Pioneer** is the monitoring station / visitor room. Untrusted social content from other agents is analyzed here before the agent sees it.
- **The Proxy** is the gate — the only door in the fence. It holds the real API keys, enforces the domain allowlist, and logs everything.
- **Claude Code** (or another trusted CLI agent) is the warden — an intelligent middleman between the non-technical human and the dangerous clawbot system. It makes contextual, per-action security decisions.
- **The Tauri GUI** is the warden's control panel.

The **USP** is the dynamic + intelligent shell. The shell (Hard/Split/Soft) adjusts how much freedom the agents get, and a large reasoning model (Opus) makes those adjustments intelligently based on context. This solves the "impossible" problem: either the agent is too restricted to be useful, or too free to be safe. The intelligent warden bridges both.

### Multi-Agent Trust Chain

```
TIER 1: TRUSTED — Human + Claude Code (warden, full host access)
TIER 2: INFRASTRUCTURE — Lobster-TrApp (enforces boundaries mechanically)
TIER 3: CONTAINED — OpenClaw agents (do the work, within boundaries)
```

## What Was Built (Phases 1-3)

### Phase 1: Containerized Forge and Pioneer
- `components/clawhub-forge/Containerfile` — forge container (233MB, python:3.10-slim, bash toolchain)
- `components/moltbook-pioneer/Containerfile` — pioneer container (153MB, python:3.10-slim)
- Both run as non-root users, all scanning pipelines verified inside containers
- Forge: 10/10 scanner self-test, certify pipeline, scan/verify/export all pass
- Pioneer: 48/48 tests pass, health check passes

### Phase 2: Unified 4-Container Compose with Network Isolation
- `compose.yml` at repo root — 4 services: vault-agent, vault-forge, vault-pioneer, vault-proxy
- 4 internal networks: agent-net, forge-net, pioneer-net, external-net
- **Verified isolation:**
  - Agent can only reach proxy (agent-net)
  - Forge can only reach proxy (forge-net)
  - Pioneer can only reach proxy (pioneer-net)
  - Forge/pioneer cannot reach each other or the agent
  - Direct TCP to external IPs: "Network is unreachable" (internal networks have no gateway)
  - Proxy correctly blocks non-allowed domains (403) and allows allowed domains (200)
- Forge delivers certified skills via shared volume (`forge-deliveries`, write in forge, read-only in agent)
- Proxy CA cert shared with forge/pioneer for HTTPS through the proxy
- Proxy needs CHOWN + DAC_OVERRIDE capabilities for mitmproxy entrypoint (rootless Podman)

### Phase 3: Schema and Manifest Evolution
- `schemas/component.schema.json` — new `workflows` section added (steps, inputs, triggers, shell requirements, success conditions, output rendering)
- `components/clawhub-forge/component.yml` — 3 workflows: vet-skill, safe-download, full-check
- `components/moltbook-pioneer/component.yml` — 3 workflows + new `export-patterns` command: scan-recent-feed, export-patterns, safety-check
- `components/openclaw-vault/component.yml` — 4 workflows + new `install-skill` command: secure-start, switch-to-hard, switch-to-split, full-verify
- `config/orchestrator-workflows.yml` — 4 cross-component workflows: install-skill, first-run-setup, full-audit, enable-feeds
- `tests/orchestrator-check.sh` — section 9 added (2 new checks), now 41 total checks, all passing

## What Was Built (Phases 4-5)

### Phase 4: Backend Workflow Executor (c670e9a)

- `app/src-tauri/src/orchestrator/manifest.rs` — 8 new structs: `Workflow`, `WorkflowStep`, `WorkflowInput`, `WorkflowOutput`, `SuccessCondition`, `WorkflowTrigger`, `ShellRequirement`, `WorkflowDisplayMode`
- `app/src-tauri/src/orchestrator/workflow.rs` — full executor: step sequencing with `depends_on`, `{{input.x}}` and `{{steps.prev.output}}` interpolation, success condition checking, abort-on-failure
- `app/src-tauri/src/commands/workflow_cmds.rs` — Tauri commands: `list_workflows`, `execute_workflow`
- `app/src/lib/types.ts` — TypeScript types mirroring all Rust workflow structs
- `app/src/lib/tauri.ts` — invoke wrappers: `listWorkflows`, `executeWorkflow`

### Phase 5: Frontend Workflow UI (9a5cd78)

- `app/src/hooks/useWorkflow.ts` — React hook for execution with state management and toast notifications
- `app/src/components/WorkflowPanel.tsx` — full UI: workflow buttons, input forms, confirmation dialogs, step-by-step progress with pass/fail/running icons
- `app/src/pages/ComponentDetail.tsx` — workflows section rendered above commands
- Danger-level button styling, shell requirement display, collapsible step details

All tests passing: 147/147 frontend, 41/41 orchestrator checks, 0 TypeScript errors.

## What Was Done (Phase 6) — Doc Cleanup (dbadc53)

All documentation aligned with architecture v2:

- `README.md` — rewritten: product pitch, prison allegory table, 4-container architecture, updated counts
- `docs/index.html` — Pioneer card added, hero subtitle updated, ecosystem grid 2→3 cols, flow SVG widened with Pioneer
- `docs/trifecta.md` — status section updated (Phases 4/5 now implemented)
- `docs/product-assessment.md` — dated v2 addendum, Gear→Shell terminology note
- `docs/roadmap-v4-finalization.md` — v2 cross-reference blockquote, test count fix
- All 3 component `CLAUDE.md` files — containerization/perimeter context added (submodule commits pushed)

## E2E User Journey Audit (2026-04-16)

We attempted a full end-to-end walkthrough of the non-technical user journey. This audit revealed that while the **architecture is sound** (Phases 1-5), the **user-facing experience has critical gaps** that block a v0.1.0 release.

### Dev Machine State
- No Rust toolchain installed → cannot build the Tauri desktop app
- No Podman or Docker installed → cannot run the 4-container perimeter
- 7.2GB RAM, no hardware virtualization (AMD A12-9720P)
- Podman CAN run on this machine (Linux containers use kernel namespaces, not VMs) but RAM is tight for 4 containers
- **Implication**: Even the developer can't run the full stack locally. A non-technical user faces even more friction.

### What We Tested
- **Landing page** (`docs/index.html`): Structure is solid, visual design polished. All 3 components shown. Download button auto-detects platform.
- **Setup wizard** (browser-only via `npm run dev`): Welcome step renders correctly. Prerequisites step shows spinner then fails with Tauri IPC errors (expected without Rust backend).

### Landing Page Findings (Step 0)
**Works:**
- Clean visual design, all 3 ecosystem cards (Vault, Forge, Pioneer)
- Download button detects platform, per-platform installer links
- Flow diagram shows You → Forge → Pioneer → Vault → Lobster-TrApp
- Honest disclaimer: "Security tool, not a security guarantee"

**Friction for non-technical users:**
- Language is too technical ("MITRE ATT&CK", "seccomp profiles", "read-only filesystem")
- No explanation of what OpenClaw IS — assumes user already knows
- Step 2 says "Discover Components" and "manifest files" — meaningless to non-technical users
- "Requires Podman or Docker" — user doesn't know what these are
- All download links go to the same GitHub Releases page (not direct file links)
- Hero visual shows developer jargon ("seccomp + PID limits + non-root")

### Setup Wizard Findings (Steps 2a-2f)
Based on code review of all wizard step components:

**Step 2a (Welcome):** Clean, no issues. Auto-redirects first-time users here.

**Step 2b (Prerequisites) — BLOCKER #1:**
- Checks for Podman/Docker, submodules, component manifests
- If Podman/Docker not found: shows red X + "Docker or Podman required"
- **NO install button, NO instructions, NO link to Podman docs**
- User is completely stuck. This breaks the "no terminal required" promise.
- Need: platform-specific install guidance or bundled installer

**Step 2c (Submodules):**
- Detects/clones git submodules. "Clone All Submodules" button works.
- But: binary installer from GitHub Releases doesn't include submodules
- Cloning requires git (non-technical users may not have git)
- SSH clone failures show cryptic "Permission denied (publickey)" errors

**Step 2d (Config) — BLOCKER #2:**
- Shows missing config files, offers "Create" button to copy `.env.example` → `.env`
- But `.env` contains PLACEHOLDER values — user must manually edit them
- **Does NOT prompt for API key or Telegram bot token**
- **No guidance on WHERE to get an Anthropic API key or HOW to create a Telegram bot**
- User creates configs with dummy values → agent won't work → no error explanation

**Step 2e (Setup Components):**
- Runs `make setup` for each component (builds container images)
- Shows raw Podman/Docker build output (very verbose, confusing for non-technical users)
- No progress percentage — user doesn't know if it's stuck or working
- Build failures show "Failed (exit N)" with no explanation or remediation

**Step 2f (Complete):**
- Offers "Start" buttons for each component + "Go to Dashboard"
- "Start" button runs command silently — no feedback if it fails
- User might skip starting and go to dashboard without running anything

### Dashboard Findings (Step 3)
Based on code review:
- Shows grid of 3 component cards with status badges
- **No "what's next?" onboarding guidance** after setup
- **No "Start All" button** — user must navigate to each component individually
- Component descriptions are technical ("Skill development workbench and security scanner")
- If containers aren't running: shows "Not Set Up" with no actionable guidance
- Empty state: "No components detected yet — Run the setup wizard" (confusing if wizard already ran)

### Agent Capabilities Findings (Steps 4-5)
Based on code review of shell configs and tool manifest:

| Shell Level | Practical Use | Tools | Web? | Files? | Scheduling? |
|------------|--------------|-------|------|--------|-------------|
| **Hard** | Chat only | 0 | No | No | No |
| **Split** | File ops with per-action approval | 11 | No | Yes (approved) | No |
| **Soft** | Autonomous assistant | 17 | Search only | Yes (auto) | Yes (approved) |

- Agent is controlled via **Telegram only** — no in-app chat
- GUI doesn't explain how to talk to the agent after setup
- Soft Shell (the useful one) is not fully exposed as a GUI command
- Only 3-4 domains in allowlist by default (Anthropic, OpenAI, Telegram, GitHub)
- No email integration, no browser tool, no host file access
- **The agent works INSIDE the container** — user needs to understand this mental model

### Hard Constraints (Things the Agent Can NEVER Do)
- Access SSH keys, passwords, keyrings
- Delete files (rm stripped from image)
- Run interpreters (Python, Node, Bash, Ruby stripped)
- Modify its own security config
- Spawn sub-agents
- Reach unapproved domains
- Break out of container

## What Needs to Be Done

### Blockers (must fix before v0.1.0)

1. **Prerequisites step: Podman/Docker install guidance**
   - Add platform-specific instructions or "Install Podman" button
   - At minimum: link to podman.io with simple instructions
   - Files: `app/src/components/wizard/PrerequisitesStep.tsx`

2. **Config step: API key and Telegram bot entry**
   - Add form fields for Anthropic API key and Telegram bot token
   - Guide user through getting these (links to console.anthropic.com, BotFather)
   - Validate keys before proceeding
   - Files: `app/src/components/wizard/ConfigStep.tsx`

3. **Dev environment: Install Rust + Podman on dev machine**
   - Need Rust to build Tauri app for testing
   - Need Podman to test 4-container perimeter
   - Podman works without virtualization on Linux (kernel namespaces)

### Friction (should fix before v0.1.0)

4. **Setup component step: Better progress indication**
   - Replace raw build output with progress bar or phase indicators
   - Human-readable error messages when builds fail

5. **Dashboard: Post-setup onboarding**
   - "Your setup is complete! Click a component to get started" guidance
   - "Start All" button or orchestrator workflow trigger

6. **Landing page: Simplify language**
   - Replace technical jargon with plain language
   - Explain what OpenClaw IS before explaining how we secure it

7. **Error handling: Actionable messages**
   - Replace "Failed (exit N)" with "Container build failed — check your internet connection and try again"
   - Add ErrorBoundary component (created but not wired in: `app/src/components/ErrorBoundary.tsx`)

### Post-v0.1.0

8. **Claude Code CLI/MCP integration (Phase 7)**
   - CLI interface: `lobster-trapp status/shell/install-skill/logs`
   - MCP server: expose tools for Claude Code to manage containers and workflows
   - Warden logic: contextual approval/denial, anomaly detection, plain-language reporting

## Key Design Documents

| Document | Purpose |
|----------|---------|
| `docs/superpowers/specs/2026-04-15-architecture-v2-perimeter-redesign.md` | The full v2 design spec |
| `.claude/plans/quirky-mixing-sunbeam.md` | The implementation plan (Phases 1-7) |
| `docs/trifecta.md` | Updated three-module relationship doc |
| `CLAUDE.md` | Updated project instructions for AI assistants |
| `GLOSSARY.md` | Updated terminology |
| `config/orchestrator-workflows.yml` | Cross-component workflow definitions |

## Current CI Status

All phases through 5 are committed (latest: 9a5cd78). Rust and TypeScript types now include full workflow structs (updated in Phase 4). All tests pass:
- `bash tests/orchestrator-check.sh` — 41 checks passing
- `cd app/src-tauri && cargo test` — passing (manifest structs include workflows)
- `cd app && npm test` — 147 tests passing (mock manifests updated with `workflows: []`)

## Files Changed This Session

**New files:**
- `components/clawhub-forge/Containerfile`
- `components/moltbook-pioneer/Containerfile`
- `compose.yml`
- `config/orchestrator-workflows.yml`
- `docs/superpowers/specs/2026-04-15-architecture-v2-perimeter-redesign.md`
- `docs/handoff.md` (this file)

**Modified files:**
- `schemas/component.schema.json` — added workflows section
- `components/clawhub-forge/component.yml` — added workflows
- `components/moltbook-pioneer/component.yml` — added workflows + export-patterns command
- `components/openclaw-vault/component.yml` — added workflows + install-skill command
- `tests/orchestrator-check.sh` — added section 9 (workflow validation)
- `docs/trifecta.md` — rewritten for perimeter model
- `CLAUDE.md` — reframed
- `GLOSSARY.md` — new terms

**Phase 4 new files (c670e9a):**
- `app/src-tauri/src/orchestrator/workflow.rs`
- `app/src-tauri/src/commands/workflow_cmds.rs`

**Phase 4 modified files (c670e9a):**
- `app/src-tauri/src/orchestrator/manifest.rs` — workflow structs added
- `app/src-tauri/src/orchestrator/error.rs` — workflow error variants
- `app/src/lib/types.ts` — TypeScript workflow types
- `app/src/lib/tauri.ts` — invoke wrappers

**Phase 5 new files (9a5cd78):**
- `app/src/hooks/useWorkflow.ts`
- `app/src/components/WorkflowPanel.tsx`

**Phase 5 modified files (9a5cd78):**
- `app/src/pages/ComponentDetail.tsx` — workflow panel integration

All changes committed.
