# Lobster-TrApp

[![CI](https://github.com/albertdobmeyer/lobster-trapp/actions/workflows/ci.yml/badge.svg)](https://github.com/albertdobmeyer/lobster-trapp/actions/workflows/ci.yml) [![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

**Your own personal AI assistant, safe on any computer.**

Lobster-TrApp lets you run [OpenClaw](https://www.getopenclaw.ai) — a powerful AI agent you control from your phone — without risking your files, accounts, or digital life. Just download, install, and start chatting with your assistant on Telegram.

**Author**: [@albertdobmeyer](https://github.com/albertdobmeyer)

## What You Get

- **A personal AI assistant** you talk to from Telegram on your phone
- **That can search the web**, manage files, schedule tasks, and automate workflows
- **Running locally on your computer** — no cloud subscription, your data stays yours
- **In an invisible security sandbox** — it can't access your personal files, passwords, or SSH keys
- **With malware protection** — every skill is scanned before it reaches your assistant

## Download

Grab the latest installer for your platform from the [Releases](https://github.com/albertdobmeyer/lobster-trapp/releases) page. No terminal required — the setup wizard handles everything.

**Requires [Podman](https://podman.io/) or [Docker](https://www.docker.com/).** The setup wizard will check for this and guide you through installation if needed.

<details>
<summary>How It Works (for the curious)</summary>

Your assistant runs inside a 4-container security perimeter:

| Container | What It Does |
|-----------|-------------|
| **vault-agent** | Where your assistant runs — read-only filesystem, all capabilities dropped, custom seccomp |
| **vault-forge** | Where skills are scanned for malware (87 patterns) and rebuilt safely |
| **vault-pioneer** | Where social feeds are analyzed for injection attacks |
| **vault-proxy** | The only internet connection — holds API keys, enforces domain allowlist, logs everything |

Your API keys never enter the assistant's container. Network traffic is filtered and logged. 24 security checks verify every layer on startup. See [docs/trifecta.md](docs/trifecta.md) for the full architecture.

</details>

<details>
<summary>For Developers</summary>

### Building from Source

Requires submodule access (private repos).

```bash
git clone --recurse-submodules https://github.com/albertdobmeyer/lobster-trapp.git
cd lobster-trapp
cd app && npm install
npm run dev                             # Frontend dev server
cd src-tauri && cargo build             # Rust backend
```

### Testing

```bash
cd app/src-tauri && cargo test          # Rust backend
cd app && npm test                      # Frontend (147 tests)
bash tests/orchestrator-check.sh        # Orchestration (42 checks)
podman compose up -d && podman compose down  # Container perimeter
```

### Architecture

```
lobster-trapp/                    (this repo — GUI + perimeter orchestrator)
├── components/
│   ├── openclaw-vault/           runtime (vault-agent + vault-proxy)
│   ├── clawhub-forge/            toolchain (vault-forge)
│   └── moltbook-pioneer/         network (vault-pioneer)
├── app/                          Tauri 2 + React 18 desktop GUI
├── compose.yml                   4-service perimeter with network isolation
├── schemas/component.schema.json THE CONTRACT — all manifests conform to this
└── config/orchestrator-workflows.yml  Cross-component workflow definitions
```

See [CLAUDE.md](CLAUDE.md) for the full architecture specification and contribution rules.

</details>

## License

[MIT](LICENSE)
