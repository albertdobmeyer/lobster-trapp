# Lobster-TrApp

[![CI](https://github.com/albertdobmeyer/lobster-trapp/actions/workflows/ci.yml/badge.svg)](https://github.com/albertdobmeyer/lobster-trapp/actions/workflows/ci.yml) [![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

A security-first desktop GUI that lets non-technical users safely run AI agents, scan skills for malware, and monitor an agentic social network — without touching a terminal. Everything is driven by manifest files; the app has zero knowledge of what's inside each component.

**Author**: [@albertdobmeyer](https://github.com/albertdobmeyer)

## What It Does

- **Detect and bootstrap prerequisites** — setup wizard checks for Podman/Docker, cloned submodules, and built containers
- **Start/stop/monitor via manifest-driven commands** — reads `component.yml` from each component, renders dashboards generically
- **Surface security state** — verification results, proxy logs, scan findings displayed in a GUI instead of raw terminal output

## Prerequisites

- [Node.js](https://nodejs.org/) 20+
- [Rust](https://rustup.rs/) stable toolchain
- [Podman](https://podman.io/) or [Docker](https://www.docker.com/) (for running components)

## Getting Started

```bash
# Clone with all components
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

## Components

All four repos are public — no authentication needed to clone or contribute.

| Component | Role | Description |
|-----------|------|-------------|
| [openclaw-vault](https://github.com/albertdobmeyer/openclaw-vault) | Runtime | Hardened container sandbox — API keys never enter the container |
| [clawhub-forge](https://github.com/albertdobmeyer/clawhub-forge) | Toolchain | Offline-first skill workbench with 87-pattern security scanner |
| [moltbook-pioneer](https://github.com/albertdobmeyer/moltbook-pioneer) | Network | Safe reconnaissance and participation for the Moltbook agent social network |

## Architecture

```
lobster-trapp/
├── components/
│   ├── openclaw-vault/      git submodule → runtime
│   ├── clawhub-forge/       git submodule → toolchain
│   └── moltbook-pioneer/    git submodule → network
├── app/                     Tauri 2 + React 18 desktop GUI
│   ├── src/                 React frontend
│   └── src-tauri/           Rust backend
├── schemas/
│   └── component.schema.json   THE CONTRACT — all manifests conform to this
└── tests/
    └── orchestrator-check.sh    39-check validation suite
```

The GUI discovers components via their `component.yml` manifests and renders dashboards generically — **no hardcoded component knowledge** in the Rust backend or React frontend. If you replaced any component with a different project that has a valid `component.yml`, the app would render it correctly.

See [CLAUDE.md](CLAUDE.md) for the full architecture specification, manifest contract details, and contribution rules.

## Testing

```bash
# Rust backend (14 unit tests)
cd app/src-tauri && cargo test

# Frontend (52 unit tests)
cd app && npm test

# Full orchestration validation (39 checks)
bash tests/orchestrator-check.sh
```

## License

[MIT](LICENSE)
