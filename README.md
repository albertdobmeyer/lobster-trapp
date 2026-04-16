# Lobster-TrApp

[![CI](https://github.com/albertdobmeyer/lobster-trapp/actions/workflows/ci.yml/badge.svg)](https://github.com/albertdobmeyer/lobster-trapp/actions/workflows/ci.yml) [![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

Your own AI assistant, safe on your computer. A desktop app that runs OpenClaw inside a 4-container security perimeter — so you get the power of an autonomous AI agent without risking your files, accounts, or API keys.

**Author**: [@albertdobmeyer](https://github.com/albertdobmeyer)

## The Problem

OpenClaw is a powerful AI agent you control from your phone via Telegram. It can manage files, browse the web, schedule tasks, and send messages — but it runs with full access to your system. 11.9% of skills in its registry were malware ([ClawHavoc](https://github.com/albertdobmeyer/clawhub-forge)). 21,639 instances are exposed on the internet without authentication.

Lobster-TrApp wraps OpenClaw in a prison: the agent works inside, your system stays outside. An intelligent warden (Claude Code) makes security decisions so you don't have to.

## How It Works

Think of it as a prison labor system — the agent is a powerful inmate that works for you, inside the fence:

| Container | Role | What It Does |
|-----------|------|-------------|
| **vault-agent** | The cell block | Where the agent runs, heavily restricted — read-only root, all caps dropped, custom seccomp |
| **vault-forge** | The workshop | Where skills are scanned (87 malware patterns) and rebuilt inside the fence, never on your machine |
| **vault-pioneer** | The monitoring station | Where social feeds are analyzed for injection attacks inside the fence |
| **vault-proxy** | The gate | The only door in/out — holds API keys, enforces domain allowlist, logs everything |

Nothing untrusted ever touches your computer. The **dynamic shell** (Hard/Split/Soft) adjusts how much freedom the agent gets, and the intelligent warden adjusts it based on context. See [docs/trifecta.md](docs/trifecta.md) for the full architecture.

## Download

Grab the latest installer for your platform from the [Releases](https://github.com/albertdobmeyer/lobster-trapp/releases) page. No terminal required — the setup wizard handles everything.

## Prerequisites

- [Node.js](https://nodejs.org/) 20+
- [Rust](https://rustup.rs/) stable toolchain
- [Podman](https://podman.io/) or [Docker](https://www.docker.com/) (for the container perimeter)

## Components

The app orchestrates three components via git submodules. The setup wizard can clone them automatically, or you can do it manually:

```bash
git submodule update --init --recursive
```

| Component | Role | Container | Description |
|-----------|------|-----------|-------------|
| openclaw-vault | Runtime | vault-agent + vault-proxy | Hardened sandbox — API keys injected at proxy layer, 6-layer defense, 3 shell levels |
| clawhub-forge | Toolchain | vault-forge | 87-pattern malware scanner + CDR pipeline, downloads and scans inside the perimeter |
| moltbook-pioneer | Network | vault-pioneer | Feed injection scanner, 25 patterns *(Moltbook API currently unavailable)* |

## Architecture

```
lobster-trapp/                    (this repo — the GUI + perimeter orchestrator)
├── components/
│   ├── openclaw-vault/           git submodule → runtime (vault-agent + vault-proxy)
│   ├── clawhub-forge/            git submodule → toolchain (vault-forge)
│   └── moltbook-pioneer/         git submodule → network (vault-pioneer)
├── app/                          Tauri 2 + React 18 desktop GUI
│   ├── src/                      React frontend
│   └── src-tauri/                Rust backend
├── compose.yml                   4-service perimeter with network isolation
├── schemas/
│   └── component.schema.json     THE CONTRACT — all manifests conform to this
├── config/
│   └── orchestrator-workflows.yml  Cross-component workflow definitions
└── tests/
    └── orchestrator-check.sh     41-check validation suite
```

The GUI discovers components via their `component.yml` manifests and renders dashboards generically — **no hardcoded component knowledge** in the Rust backend or React frontend.

See [CLAUDE.md](CLAUDE.md) for the full architecture specification, manifest contract details, and contribution rules.

<details>
<summary>Building from source (contributors only — requires submodule access)</summary>

```bash
# Clone with all components (requires access to private submodule repos)
git clone --recurse-submodules https://github.com/albertdobmeyer/lobster-trapp.git
cd lobster-trapp

# If you already cloned without --recurse-submodules:
git submodule update --init --recursive

# Install frontend dependencies
cd app && npm install

# Run the dev server
npm run dev

# In another terminal — build the Rust backend
cd app/src-tauri && cargo build
```

</details>

## Testing

```bash
# Rust backend
cd app/src-tauri && cargo test

# Frontend unit tests
cd app && npm test

# Full orchestration validation (41 checks)
bash tests/orchestrator-check.sh

# Container perimeter
podman compose up -d                    # Start all 4 containers
podman compose down                     # Stop perimeter
```

## License

[MIT](LICENSE)
