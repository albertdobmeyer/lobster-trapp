# Lobster-TrApp

A security-first desktop GUI for the OpenClaw ecosystem — the agent runtime, its skill supply chain, and the agent social network.

## Architecture

```
lobster-trapp/
│
├── components/
│   ├── openclaw-vault/     Hardened container for the OpenClaw agent runtime
│   ├── clawhub-forge/      Skill development workbench + security scanner
│   └── moltbook-pioneer/   Safe reconnaissance of the Moltbook agent social network
│
├── app/                    Tauri 2 + React 18 desktop GUI
├── schemas/                Manifest contract (JSON Schema)
├── tests/                  Orchestration validation suite
├── config/                 Shared configuration
└── docker-compose.example.yml  Example compose (not used at runtime)
```

### How the layers connect

```
ClawHub (skills registry)        Moltbook (agent social network)
        │                                  │
        ▼                                  ▼
   clawhub-forge ──skills──▶ openclaw-vault ──API──▶ moltbook-pioneer
   build · scan · publish    run the agent safely    research · participate
```

- **openclaw-vault** — wraps the OpenClaw runtime in a hardened container. API keys never enter the container; a proxy sidecar injects them at the network layer. All capabilities dropped, read-only root, custom seccomp.
- **clawhub-forge** — offline-first pipeline to build, lint, scan, test, and publish ClawHub skills. Includes 87 malicious pattern detections across 13 MITRE ATT&CK categories.
- **moltbook-pioneer** — safe reconnaissance and participation tools for the Moltbook agentic social network. Feed scanner, agent census, identity safety checklist.

## Getting Started

```bash
# Clone with all components
git clone --recurse-submodules https://github.com/gitgoodordietrying/lobster-trapp.git
cd lobster-trapp

# If you already cloned without --recurse-submodules:
git submodule update --init --recursive

# Check component status
git submodule status
```

Each component can be developed independently:

```bash
cd components/openclaw-vault   # work on the vault
cd components/clawhub-forge    # work on the skill workbench
cd components/moltbook-pioneer # work on the social network tools
```

Or work on the standalone repos directly and pull updates:

```bash
git submodule update --remote components/openclaw-vault
```

## Component Repos

All four repos are **public** — no authentication needed to clone or contribute.

| Component | Repo | Description |
|-----------|------|-------------|
| openclaw-vault | [gitgoodordietrying/openclaw-vault](https://github.com/gitgoodordietrying/openclaw-vault) | Hardened container for OpenClaw |
| clawhub-forge | [gitgoodordietrying/clawhub-forge](https://github.com/gitgoodordietrying/clawhub-forge) | Skill development workbench |
| moltbook-pioneer | [gitgoodordietrying/moltbook-pioneer](https://github.com/gitgoodordietrying/moltbook-pioneer) | Agent social network tools |

## The Tauri App

The desktop GUI discovers components via their `component.yml` manifests and renders dashboards generically — no hardcoded component knowledge.

```bash
# Build & run
cd app && npm install
cd app && npm run dev           # Dev server (Vite on port 1420)
cd app/src-tauri && cargo build # Rust backend

# Tests
cd app/src-tauri && cargo test          # 14 Rust unit tests
cd app && npm test                      # Frontend tests
bash tests/orchestrator-check.sh        # 38-check validation suite
```

## Status

- **openclaw-vault**: Active — hardened container with proxy-based key isolation
- **clawhub-forge**: Active — full skill pipeline with security scanning
- **moltbook-pioneer**: Active — feed scanner, agent census, identity checklist
- **app/**: Alpha (v0.1.0) — manifest-driven GUI framework complete
