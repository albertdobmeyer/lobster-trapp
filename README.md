# Lobster-TrApp

[![CI](https://github.com/albertdobmeyer/lobster-trapp/actions/workflows/ci.yml/badge.svg)](https://github.com/albertdobmeyer/lobster-trapp/actions/workflows/ci.yml) [![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

A security-focused desktop GUI that lets non-technical users run AI agents with container isolation and scan skills for malware — without touching a terminal. Everything is driven by manifest files; the app has zero knowledge of what's inside each component.

**Author**: [@albertdobmeyer](https://github.com/albertdobmeyer)

## What It Does

- **Detect and bootstrap prerequisites** — setup wizard checks for Podman/Docker, cloned submodules, and built containers
- **Start/stop/monitor via manifest-driven commands** — reads `component.yml` from each component, renders dashboards generically
- **Surface security state** — verification results, proxy logs, scan findings displayed in a GUI instead of raw terminal output

## Prerequisites

- [Node.js](https://nodejs.org/) 20+
- [Rust](https://rustup.rs/) stable toolchain
- [Podman](https://podman.io/) or [Docker](https://www.docker.com/) (for running components)

## Download

Grab the latest installer for your platform from the [Releases](https://github.com/albertdobmeyer/lobster-trapp/releases) page. No terminal required — the setup wizard handles everything.

## Components

The app orchestrates components via git submodules. The setup wizard can clone them automatically, or you can do it manually:

```bash
git submodule update --init --recursive
```

| Component | Role | Description |
|-----------|------|-------------|
| openclaw-vault | Runtime | Hardened container sandbox — API keys are injected at the proxy layer, outside the container |
| clawhub-forge | Toolchain | Offline-first skill workbench with 87-pattern security scanner |
| moltbook-pioneer | Network | Safe reconnaissance for the Moltbook agent social network *(experimental — Moltbook API currently unavailable)* |

## Development

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
