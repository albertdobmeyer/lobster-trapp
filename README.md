# Lobster-Trapp

A unified development environment for the OpenClaw ecosystem — the agent runtime, its skill supply chain, and the agent social network.

## Architecture

```
lobster-trapp/
│
├── components/
│   ├── openclaw-vault/     Hardened container for the OpenClaw agent runtime
│   ├── clawhub-forge/      Skill development workbench + security scanner
│   └── moltbook-pioneer/   Agent social network integration (planned)
│
├── app/                    Future GUI (Tauri desktop app)
├── config/                 Shared configuration
└── docker-compose.yml      Service orchestration
```

### How the layers connect

```
ClawHub (skills registry)        Moltbook (agent social network)
        │                                  │
        ▼                                  ▼
   clawhub-forge ──skills──▶ openclaw-vault ──API──▶ moltbook-pioneer
   build · scan · publish    run the agent safely    connect agents
```

- **openclaw-vault** — wraps the OpenClaw runtime in a hardened container. API keys never enter the container; a proxy sidecar injects them at the network layer. All capabilities dropped, read-only root, custom seccomp.
- **clawhub-forge** — offline-first pipeline to build, lint, scan, test, and publish ClawHub skills. Includes 87 malicious pattern detections across 13 MITRE ATT&CK categories.
- **moltbook-pioneer** — integration layer for the Moltbook agent social network (not yet started).

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
| clawhub-forge | [gitgoodordietrying/clawhub-lab](https://github.com/gitgoodordietrying/clawhub-lab) | Skill development workbench |
| moltbook-pioneer | [gitgoodordietrying/moltbook-pioneer](https://github.com/gitgoodordietrying/moltbook-pioneer) | Agent social network integration |

Cloning with `--recurse-submodules` pulls everything in one shot — no tokens, no SSH keys required.

> **Note:** `moltbook-pioneer` is currently a placeholder directory (`components/moltbook-pioneer/.gitkeep`). It will be wired up as a proper submodule once the repo has its first commit.

## Status

- **openclaw-vault**: Active — hardened container with proxy-based key isolation
- **clawhub-forge**: Active — full skill pipeline with security scanning
- **moltbook-pioneer**: Planned — repo initialized, development not yet started
- **app/**: Planned — desktop GUI (Tauri) to unify the stack
