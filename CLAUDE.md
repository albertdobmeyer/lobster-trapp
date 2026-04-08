# Lobster-TrApp — Monorepo Orchestrator

## What This Is

Lobster-TrApp is the **monorepo orchestrator** for the OpenClaw ecosystem. It bundles three independent component repos under a unified Tauri desktop GUI that discovers and renders dashboards generically from manifest files.

**You are working in the parent orchestrator.** Changes here affect how all components are discovered, displayed, and controlled.

## What the App Does (Exactly Three Things)

1. **Detect and bootstrap prerequisites** — setup wizard (Podman/Docker present? Submodules cloned? Containers built?)
2. **Start/stop/monitor via manifest-driven commands** — the dashboard (reads `component.yml`, runs declared commands, displays output)
3. **Surface security state** — verify results, proxy logs, scan findings (the reason a non-technical user needs this instead of a terminal)

## The Hard Constraint

The Tauri backend must contain **zero knowledge** of what's inside any submodule. If you deleted openclaw-vault and dropped in a completely different component with a valid `component.yml`, the app must render it correctly. The moment vault-specific or forge-specific code appears in the Rust backend, the manifest-driven architecture is compromised.

## Architecture

```
lobster-trapp/                    (this repo — public)
├── components/
│   ├── openclaw-vault/           git submodule → albertdobmeyer/openclaw-vault
│   ├── clawhub-forge/            git submodule → albertdobmeyer/clawhub-forge
│   └── moltbook-pioneer/         git submodule → albertdobmeyer/moltbook-pioneer
├── app/                          Tauri 2 + React 18 desktop GUI
│   ├── src/                      React frontend
│   └── src-tauri/                Rust backend
├── schemas/
│   └── component.schema.json     THE CONTRACT — all manifests must conform
├── tests/
│   └── orchestrator-check.sh     39-check validation suite
├── docker-compose.example.yml    Example only (NOT used at runtime)
└── config/                       Shared configuration
```


### Component Roles
| Component | Role | Status |
|-----------|------|--------|
| openclaw-vault | `runtime` — hardened container sandbox for OpenClaw agent | Active submodule |
| clawhub-forge | `toolchain` — skill development workbench + security pipeline | Active submodule |
| moltbook-pioneer | `network` — safe Moltbook reconnaissance + participation tools | Active submodule |

## The Manifest Contract

**This is the most important concept.** Each component self-describes via `component.yml` in its root. The GUI discovers these files and renders dashboards generically — no hardcoded component knowledge.

The contract is defined in `schemas/component.schema.json` with 5 sections:

1. **identity** — id, name, version, role, icon, color
2. **status** — declared states + probe commands to determine current state
3. **commands** — user-actionable operations with args, danger levels, output formats
4. **configs** — editable config files with format metadata
5. **health** — lightweight probes for dashboard badges

### Rules for the Contract
- **Never change enum values** in the schema without updating all manifests AND the Rust `manifest.rs` AND the TypeScript `types.ts`
- **Enum alignment is tested** by `tests/orchestrator-check.sh` section 7
- **Cross-references are validated**: `available_when` must reference declared states, `restart_command` must reference declared commands

## Key Files

| Purpose | File |
|---------|------|
| Manifest schema (contract) | `schemas/component.schema.json` |
| Rust manifest structs | `app/src-tauri/src/orchestrator/manifest.rs` |
| TypeScript types | `app/src/lib/types.ts` |
| Tauri command handlers | `app/src-tauri/src/commands/*.rs` |
| Tauri invoke wrappers | `app/src/lib/tauri.ts` |
| React hooks | `app/src/hooks/*.ts` |
| Orchestration tests | `tests/orchestrator-check.sh` |
| Rust unit tests | `app/src-tauri/src/orchestrator/tests.rs` |

## Commands

### Build & Test
```bash
# Rust backend
cd app/src-tauri && cargo build
cd app/src-tauri && cargo test          # 14 unit tests

# Frontend
cd app && npm install
cd app && npm run dev                   # Dev server (Vite)

# Full orchestration validation (39 checks)
bash tests/orchestrator-check.sh
bash tests/orchestrator-check.sh --fix  # Auto-fix submodule issues
```

### What the Tests Validate
1. Repository structure (directories, essential files)
2. JSON Schema validity
3. All component manifests parse, have valid identity, valid cross-references, valid enum values
4. Submodule synchronization status
5. Build artifacts (Cargo.toml, tauri.conf.json, package.json deps, tsconfig)
6. Frontend-backend contract (Rust handlers match frontend invoke calls)
7. Manifest enum values match what Rust serde expects

## Submodule Discipline

### The Dual-Copy Problem
Each component exists in TWO places:
- **Standalone clone**: `~/<component>/` (for focused development)
- **Submodule copy**: `~/lobster-trapp/components/<component>/` (for orchestrator integration)

These are independent git checkouts. Changes in one do NOT automatically appear in the other.

### Sync Workflow
After making changes in a standalone clone:
```bash
cd components/<component>
git pull                              # Fetch latest from remote
cd ../..
git add components/<component>        # Update submodule reference
git commit -m "Update <component> submodule reference"
```

After making changes in a submodule:
```bash
cd components/<component>
git push                              # Push submodule changes to remote
cd ../..
git add components/<component>        # Update parent's reference
git commit -m "Update <component> submodule reference"
# Then in standalone clone: git pull
```

## Security Considerations

- **Command injection prevention**: `runner.rs` wraps all interpolated args in single quotes with escaping
- **Path traversal protection**: `config.rs` validates canonical paths stay within component directory
- **Regex in probes**: `status.rs` uses the `regex` crate for `stdout_regex` rules (not string contains)
- **Stream deduplication**: `stream.rs` kills old processes before starting new streams

## What the App Must NEVER Do

- Contain component-specific logic in Rust or React (the hard constraint)
- Duplicate domain logic that belongs in a submodule
- Run AI models or agent code directly
- Expose network services (no remote access, no mobile browser mode)

## What NOT to Do

- Do not add component-specific logic to the Tauri backend — it must remain generic
- Do not modify `component.yml` files in submodules without also pushing to the component's own remote
- Do not change the schema without updating all three alignment layers (schema JSON, Rust structs, TS types)
- Do not commit `node_modules/`, `target/`, or `app/src-tauri/gen/` (covered by .gitignore)
- Do not force-push submodule references — this breaks other clones
