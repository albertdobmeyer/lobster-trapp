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

## What Needs to Be Done (Phases 6-7)

### Phase 6: Documentation Updates

The docs currently describe the old architecture (separate host-side components). They need to reflect the perimeter model.

**Already updated this session:**
- `docs/trifecta.md` — rewritten for perimeter model
- `CLAUDE.md` — reframed from orchestrator to security infrastructure
- `GLOSSARY.md` — new terms added (perimeter, warden, trust tier, workflow)

**Still needs updating:**
- `README.md` — reframe for non-technical audience + new architecture
- Component `CLAUDE.md` files — mention containerized deployment
- `docs/product-assessment.md` — update "Honest Cons" section (setup is simpler now, architecture is unified)
- `docs/roadmap-v4-finalization.md` — mark Phases F-J as superseded by architecture v2
- Landing page content (`docs/index.html`) — if architecture story is told there

### Phase 7: Claude Code Integration (Future)

This is separable and can ship after v0.1.0.

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
