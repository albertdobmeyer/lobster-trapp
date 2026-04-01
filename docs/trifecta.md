# The Trifecta — Three-Layer Defense for the OpenClaw Ecosystem

**Updated:** 2026-03-27
**Scope:** How openclaw-vault, clawhub-forge, and moltbook-pioneer work together as a coordinated defense system.

---

## The Problem

OpenClaw is a powerful autonomous AI agent with unrestricted access to your machine by default. It can execute shell commands, read your files, control a browser, send messages as you, and install skills from a registry where 11.9% of packages were malware (ClawHavoc, 341/2,857 skills). Running it raw is like giving a stranger your laptop password.

No single defense layer is enough. A container can be misconfigured. A scanner can miss a pattern. A feed filter can be bypassed by encoding. The only reliable defense is **independent layers that fail independently** — so a bug in one doesn't cascade.

## The Three Modules

```
┌─────────────────────────────────────────────────────────────┐
│                     LOBSTER-TRAPP GUI                       │
│         (discovers, displays, controls via manifests)       │
└──────────┬──────────────────┬──────────────────┬────────────┘
           │                  │                  │
    ┌──────▼──────┐    ┌──────▼──────┐    ┌──────▼──────┐
    │  OPENCLAW   │    │  CLAWHUB    │    │  MOLTBOOK   │
    │   VAULT     │    │   FORGE     │    │  PIONEER    │
    │             │    │             │    │             │
    │  runtime    │    │  toolchain  │    │  network    │
    │  passive    │    │  active     │    │  situational│
    │  defense    │    │  defense    │    │  awareness  │
    └─────────────┘    └─────────────┘    └─────────────┘
```

### openclaw-vault — The Moat (Passive Defense)

**Role:** `runtime` — the hardened container that runs the agent.

**What it does:** Wraps OpenClaw in a six-layer defense-in-depth container. The agent runs inside; secrets stay outside. All traffic is logged and filtered. The user controls everything from Telegram.

**Key innovations:**
- API keys never enter the agent container (proxy-side injection)
- Domain allowlist enforced at the network layer
- Three shell levels (Hard/Split/Soft) for graduated trust
- 23-point security verification
- Three-level kill switch (soft/hard/nuclear)

**Analogy:** The castle walls. They don't know what's inside — they just contain it.

### clawhub-forge — The Forge (Active Defense)

**Role:** `toolchain` — the skill development workbench and security scanner.

**What it does:** Vets skills before they can enter the runtime. 87 malicious patterns across 13 MITRE ATT&CK categories. Zero-trust verifier that quarantines any skill with a single unrecognizable line. Gated publishing pipeline where every skill must pass lint, scan, verify, and test before release.

**Key innovations:**
- Offline scanner (no network required)
- Zero-trust verification (guilty until proven safe, line by line)
- SARIF output for GitHub code scanning integration
- Built from real incident analysis (ClawHavoc, moltbook-ay trojan)

**Analogy:** The blacksmith who inspects every weapon before it enters the castle.

### moltbook-pioneer — The Scout (Situational Awareness)

**Role:** `network` — safe reconnaissance and participation on the Moltbook agent social network.

**What it does:** Scans agent-generated social content for prompt injection, tracks platform statistics, validates agent identity before registration. Three engagement levels (Observer, Researcher, Participant) with increasing capability and risk.

**Key innovations:**
- 30 injection patterns tuned for social content (different from forge's skill patterns)
- Agent census with trend tracking
- Pre-flight identity checklist
- Threat model based on real incidents (1.5M API tokens exposed in breach)

**Analogy:** The scout who surveys the battlefield before the army moves.

---

## Ownership Matrix

Each capability has exactly one owner. No duplication, no ambiguity.

| Capability | Owner | Rationale |
|---|---|---|
| Container isolation (read-only, caps, seccomp) | vault | Runtime enforcement |
| API key injection via proxy | vault | Network-layer secret management |
| Domain allowlist enforcement | vault | Runtime network control |
| Shell level switching (Hard/Split/Soft) | vault | Runtime configuration |
| Kill switch (soft/hard/nuclear) | vault | Runtime lifecycle |
| Runtime monitoring (proxy logs, session audit) | vault | Observing what happens inside the moat |
| 23-point security verification | vault | Runtime integrity checking |
| Skill scanning (87 MITRE patterns) | forge | Pre-runtime supply chain defense |
| Skill linting and structure validation | forge | Development quality gate |
| Zero-trust skill verification | forge | Pre-publish security gate |
| Gated publishing pipeline | forge | Supply chain control |
| Skill development scaffolding | forge | Developer tooling |
| Feed injection scanning (30 patterns) | pioneer | Social content analysis |
| Platform census and trends | pioneer | Situational awareness |
| Agent identity safety checklist | pioneer | Pre-registration validation |
| Safe participation guidelines | pioneer | Operational guidance |

### What Does NOT Belong in Each Module

| Module | Must NOT contain |
|---|---|
| vault | Skill scanning logic, feed analysis, anything component-specific in the container |
| forge | Runtime isolation, network proxying, container orchestration |
| pioneer | Skill validation, container security, API key management |

---

## Cross-Module Workflows

### Workflow 1: Skill Installation Path (Forge → Vault)

**Status:** Not yet implemented. This is the most important integration gap.

```
Developer creates skill
    → forge: make lint (structure check)
    → forge: make scan (87-pattern security scan)
    → forge: make verify-skill (zero-trust line classification)
    → forge: make test (behavioral assertions)
    → forge: make publish (gated release)
    → Registry (ClawHub)
    → User reviews scan results
    → vault: skill file placed in workspace (manual transfer)
    → vault: agent loads skill
```

**Current workaround:** ClawHub domains are blocked in the vault's allowlist. Skills must be manually reviewed and transferred into the container workspace. This is intentional for Hard Shell and Split Shell — automated skill installation is a Soft Shell or later capability.

**What needs to happen:**
- Document the manual skill transfer workflow
- Define when (which shell level) automated installation becomes available
- Build a forge-to-vault bridge: forge scans → produces clearance report → vault accepts cleared skills

### Workflow 2: Feed Scanning Integration (Pioneer → Vault)

**Status:** Not yet implemented. Lower priority than Workflow 1.

```
Agent interacts with Moltbook (from inside vault)
    → Outbound: agent posts/comments via Moltbook API
    → Inbound: agent reads feed content
    → pioneer: feed scanner should analyze inbound content
    → Flag injections before agent processes them
```

**Current state:** Pioneer's feed scanner runs as a standalone host-side tool. When Hum interacts with Moltbook from inside the vault, pioneer's scanner is not consulted. They operate independently.

**What needs to happen:**
- Define whether feed scanning happens inside or outside the container
- If outside: proxy-level content inspection (vault-proxy.py could call pioneer's patterns)
- If inside: pioneer's patterns loaded into the agent's workspace
- This is a Soft Shell concern — Moltbook interaction requires domains not yet in the allowlist

### Workflow 3: Monitoring Chain (Vault → User/Claude Code)

**Status:** Partially implemented.

```
Agent acts inside vault
    → vault-proxy logs every request (requests.jsonl)
    → Session transcripts capture every message (.jsonl)
    → Host-side tools read these artifacts:
        → read-chat.sh    (conversation history)
        → vault-audit.sh  (workspace files, memory, injection scan)
        → verify.sh       (security integrity)
    → [NOT YET] network-log-parser.py (anomaly detection)
    → [NOT YET] session-report.sh (post-session summary)
```

**What needs to happen:**
- Implement network log parser (anomaly detection on proxy logs)
- Implement session report generator (human-readable post-session summary)
- Remove redundant skill-scanner.sh stub (this is forge's job)

---

## Defense-in-Depth: How the Layers Stack

An attack must defeat ALL relevant layers to succeed. Each layer is independent.

### Against a compromised agent (runtime threat):

| Layer | Module | What stops it |
|---|---|---|
| 1. Container exoskeleton | vault | Read-only root, caps dropped, seccomp, noexec, PID/mem limits |
| 2. Network proxy | vault | Domain allowlist, payload size limits, request logging |
| 3. Tool policy | vault (config) | Denied tools never sent to LLM — agent can't call what it can't see |
| 4. Exec controls | vault (config) | safeBins allowlist + human approval for every command |
| 5. Workspace restriction | vault (config) | workspaceOnly: true — can't access files outside workspace |
| 6. Kill switch | vault | Soft stop, hard kill, nuclear eject — always available |

### Against a malicious skill (supply chain threat):

| Layer | Module | What stops it |
|---|---|---|
| 1. Skill scanner | forge | 87 patterns detect known malicious constructs |
| 2. Zero-trust verifier | forge | Every line classified — one suspicious line quarantines the skill |
| 3. Gated publisher | forge | Lint + scan + test must all pass before publish |
| 4. Domain allowlist | vault | ClawHub domains blocked by default — no auto-install |
| 5. Tool policy | vault | Even if skill loads, denied tools remain invisible to LLM |
| 6. Container exoskeleton | vault | Even if tool policy fails, container limits blast radius |

### Against hostile feed content (social threat):

| Layer | Module | What stops it |
|---|---|---|
| 1. Feed scanner | pioneer | 30 injection patterns tuned for social content |
| 2. DM pairing policy | vault (config) | Each Telegram user must be individually approved |
| 3. Tool policy | vault (config) | Even if injection succeeds, denied tools stay invisible |
| 4. Human approval | vault (config) | ask: "always" — user sees every command before execution |
| 5. Container exoskeleton | vault | Final containment layer |

---

## Current Status

| Module | Maturity | Shell Levels | Tests | Key Gap |
|---|---|---|---|---|
| **openclaw-vault** | 90% | Hard Shell done, Split Shell done, Soft Shell designed (spec ready) | 14 test scripts + 24-point verify (47 tool control + 21 attack surface tests) | Soft Shell implementation |
| **clawhub-forge** | 85% | N/A | 168 behavioral assertions | No .trust files generated, devcontainer setup missing |
| **moltbook-pioneer** | 70% | N/A | Zero automated tests | No test coverage, safe_patterns not wired |

### Integration Status

| Integration | Status | Blocking? |
|---|---|---|
| Skill installation path (forge → vault) | Not implemented | Blocks Soft Shell |
| Feed scanning integration (pioneer → vault) | Not implemented | Not blocking (Moltbook domains not in allowlist yet) |
| Monitoring chain (vault → user) | Partially implemented | Blocks confident autonomy escalation |
| GUI discovery (all → lobster-trapp) | Implemented via component.yml | Not blocking |

---

## Execution Order

The modules are developed inside-out: secure the inner ring first, then expand.

1. **openclaw-vault** — The core runtime must be solid before anything else matters
2. **clawhub-forge** — The supply chain gate must work before skills enter the vault
3. **moltbook-pioneer** — Social interaction is highest-risk and depends on both others

Each module has its own roadmap in its `docs/roadmap.md`. The per-module roadmaps reference this document for cross-cutting concerns.

---

## Terminology

See `GLOSSARY.md` in the lobster-trapp root for authoritative definitions. Key terms:

- **Shell levels:** Hard Shell (maximum lockdown), Split Shell (controlled exec + file I/O), Soft Shell (broader autonomy)
- **Molt:** Reconfiguring the agent's shell level (switching between Hard/Split/Soft)
- **Exoskeleton:** The container itself — the outer wall that always exists regardless of shell level
- **Driver Seat:** Resources that are never accessible to the agent (SSH keys, host filesystem, passwords)

*Note: Older documents may use "Gear 1/2/3" instead of "Hard/Split/Soft Shell." The Shell terminology is authoritative; Gear is deprecated.*

---

*This document is the single source of truth for how the three modules relate. Per-module details live in each module's own docs.*
