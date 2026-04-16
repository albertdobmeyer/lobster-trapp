# Handoff — Architecture v2 Perimeter Redesign

**Date:** 2026-04-15
**Author:** Albert + Claude Opus (session 2026-04-14/15)
**Status:** Phases 1-3 complete, Phases 4-7 pending

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

## What Needs to Be Done (Phases 4-7)

### Phase 4: Backend Workflow Executor (Rust)

The Tauri backend needs to parse and execute workflow definitions. Currently it only knows about individual commands.

**Key files to modify:**
- `app/src-tauri/src/orchestrator/manifest.rs` — add `Workflow`, `WorkflowStep`, `WorkflowInput` structs (mirror the schema)
- `app/src-tauri/src/orchestrator/` — new module `workflow.rs` for the executor
- `app/src-tauri/src/commands/` — new Tauri commands: `list_workflows`, `execute_workflow`, `get_workflow_status`
- `app/src/lib/types.ts` — add TypeScript types for workflows
- `app/src/lib/tauri.ts` — add invoke wrappers for workflow commands

**Workflow executor design:**
1. Parse workflow from manifest (already done by serde if structs are added)
2. Resolve inputs (from GUI form submission)
3. Execute steps sequentially, respecting `depends_on` order
4. Interpolate `{{input.x}}` and `{{steps.prev.output}}` templates in args
5. Check `success_condition` after each step (default: exit code 0)
6. Abort on failure if `abort_on_failure: true`
7. Emit progress events so the GUI can show step-by-step progress
8. Return final result with per-step outcomes

**For orchestrator workflows** (cross-component): the executor needs to map `component` + `command`/`workflow` to the correct component's working directory and run there. The existing `run_command` infrastructure already supports `component_id` — extend it.

### Phase 5: Frontend Workflow UI (React)

The GUI currently shows individual commands as buttons. Workflows should be presented as single user-facing actions with progress tracking.

**Key files to modify:**
- `app/src/components/` — new: `WorkflowButton.tsx`, `WorkflowProgress.tsx`, `WorkflowResult.tsx`
- `app/src/hooks/` — new: `useWorkflow.ts` (execute workflow, track step progress)
- `app/src/pages/ComponentDetail.tsx` — add workflows section above or alongside commands
- `app/src/pages/Setup.tsx` — rebuild wizard as workflow-driven (use `first-run-setup` orchestrator workflow)
- `app/src/pages/Dashboard.tsx` — show orchestrator workflows as top-level actions

**UI design principles:**
- Workflows render as buttons with `user_description` as tooltip/subtitle
- On click: show input form (if workflow has `inputs`), then progress checklist
- Progress shows each step with pass/fail/running status
- `danger` level determines button color (same as current command danger levels)
- Shell level indicator uses plain language ("Chat only" / "Supervised" / "Full autonomy"), not Hard/Split/Soft

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

CI is green as of 2026-04-14 (pre-session commits). The changes in this session are uncommitted. Before committing:
1. Run `bash tests/orchestrator-check.sh` — should pass (41 checks)
2. Run `cd app/src-tauri && cargo test` — should still pass (manifest structs unchanged yet)
3. Run `cd app && npm test` — should still pass (no frontend changes yet)

The Rust and TypeScript types have NOT been updated to include workflows — that's Phase 4 work. The schema and manifests are ahead of the code.

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

**Not committed yet.** The next session should review and commit these changes.
