# OpenClaw-Vault Security Harness — Design Specification

**Date:** 2026-03-23
**Status:** Draft — Pending Roadmap & Implementation Planning
**Authors:** albertd + Claude

---

## 1. What OpenClaw Is

OpenClaw is a self-hosted Node.js gateway that connects 30+ messaging platforms (Telegram, WhatsApp, Signal, Discord, iMessage, Slack, etc.) to an AI agent that can execute real tasks on a user's computer. It is not a chatbot. It is a local autonomous AI agent with shell access, filesystem access, browser control, messaging capabilities, device control, and the ability to run any program the host user can run.

### 1.1 Architecture

OpenClaw runs as a single Gateway process that binds to `ws://127.0.0.1:18789`. All channels, CLI, web interfaces, and device nodes connect via WebSocket to this Gateway. The Gateway coordinates sessions, tools, events, and device access.

```
Channels (WhatsApp / Telegram / Slack / Discord / Signal / iMessage / 30+ more)
    |
Gateway (control plane, ws://127.0.0.1:18789)
    |-- Pi agent (RPC — the AI reasoning engine)
    |-- CLI (openclaw commands)
    |-- WebChat UI
    |-- macOS app
    |-- iOS / Android nodes
```

The Gateway is the single source of truth for sessions, routing, and channel connections. It runs on the user's machine and has access to everything the user has access to.

### 1.2 Installation

```bash
npm install -g openclaw@latest
openclaw onboard --install-daemon
```

Requires Node 22+ (Node 24 recommended). Works on macOS, Linux, and Windows (via WSL2). The onboarding wizard guides setup of the Gateway, workspace, channels, and skills.

### 1.3 LLM Integration

OpenClaw connects to external LLM providers for reasoning. It supports multiple providers with model selection and failover:

- OpenAI (ChatGPT/Codex via OAuth)
- Anthropic (Claude via API key)
- Google (Gemini), Groq, Ollama, and 40+ other providers

Configuration lives at `~/.openclaw/openclaw.json`. Example:
```json
{
  "agent": { "model": "anthropic/claude-opus-4-6" }
}
```

The LLM provides the intelligence. OpenClaw provides the tools and access. This separation is critical: the security risk is not the LLM itself, but the tools OpenClaw gives the LLM access to.

### 1.4 Communication Channels

Users interact with OpenClaw through messaging apps, not a terminal. Supported channels include:

- WhatsApp (Baileys), Telegram (grammY), Slack (Bolt), Discord (discord.js)
- Google Chat, Signal (signal-cli), BlueBubbles (iMessage)
- Microsoft Teams, Matrix, IRC, LINE, Mattermost, Nostr
- Nextcloud Talk, Synology Chat, Twitch, Zalo, WebChat

This is what makes OpenClaw accessible to non-technical users: you message it from your phone and it does things on your computer.

---

## 2. What OpenClaw Can Do On A User's Computer

This is the threat surface our vault must contain.

### 2.1 Complete Tool Inventory

| Tool | What It Does | System Access Required | Risk Level |
|------|-------------|----------------------|------------|
| `exec` / `process` | Run any shell command, manage background processes | Full shell / command execution | **Critical** — unrestricted code execution equivalent to user account |
| `read` / `write` / `edit` / `apply_patch` | Read, create, modify, delete any file | Full filesystem access | **Critical** — can access all user files, configs, credentials |
| `browser` | Control a Chromium browser (navigate, click, screenshot, fill forms) | Browser control, display, network | **High** — can access websites, fill forms, potentially steal session cookies |
| `web_search` / `web_fetch` | Search the web, fetch page content | Unrestricted internet access | **Medium** — information gathering, potential data exfiltration |
| `message` + channel tools | Send messages across all connected channels as the user | Communication channels (WhatsApp, Telegram, etc.) | **High** — can impersonate the user in conversations |
| `canvas` | Agent-driven visual workspace | Display / presentation | **Low-Medium** |
| `nodes` (iOS/Android) | Camera snap/clip, screen recording, location, contacts, calendar, SMS, photos | Device hardware access | **Critical** — full phone access |
| `cron` / `gateway` | Schedule persistent jobs, restart gateway | System scheduling, gateway control | **High** — persistent execution that survives restarts |
| `image` / `image_generate` | Analyze or generate images | Image processing, potentially network | **Medium** |
| `sessions_spawn` / `sessions_send` | Create sub-agents, delegate tasks | Process management, agent coordination | **High** — can create autonomous sub-agents |
| 1Password skill | Access password vault | Credential storage | **Critical** — "Once authorized, it has access to your entire vault" |

### 2.2 Tool Groups

OpenClaw organizes tools into groups for policy configuration:

- `group:fs` — File system operations (read, write, edit, apply_patch)
- `group:runtime` — Interpreter access (exec, process)
- `group:automation` — Persistent scheduling (cron, webhooks)
- `group:sessions` — Sub-agent management (sessions_spawn, sessions_send)
- `group:web` — Internet access (web_search, web_fetch, browser)

### 2.3 The Default Security Posture

**Sandboxing is OFF by default.** Out of the box, OpenClaw:

- Can execute any shell command with no restrictions
- Has no command allowlist
- Has no approval requirements
- Has the same access as the user who installed it
- Uses tool profile `full` (all tools enabled)

As one security guide puts it: "the AI agent has roughly the same level of access that you have on your machine."

### 2.4 Workspace and Configuration Files

OpenClaw stores its state at `~/.openclaw/`:

```
~/.openclaw/
|-- openclaw.json              # Main configuration (contains tokens/auth)
|-- credentials/               # Channel credentials (WhatsApp, etc.)
|   |-- whatsapp/
|   |-- oauth.json
|-- agents/<agentId>/agent/
|   |-- auth-profiles.json     # API keys
|   |-- agent.json             # Agent config
|-- secrets.json               # Optional encrypted payload
|-- sessions/
|   |-- *.jsonl                # Session transcripts with user data
|-- workspace/                 # Agent working directory
|-- exec-approvals.json        # Approved command patterns
```

---

## 3. OpenClaw's Built-In Security Model

OpenClaw has a three-layer permission system. It is opt-in and designed for technical users who understand what they're configuring. Our vault's job is to configure these layers correctly and add enforcement layers the agent cannot modify.

### 3.1 Layer 1: Sandbox Mode (Where Tools Run)

Controls the execution environment. Set via `agents.defaults.sandbox.mode`:

| Mode | Behavior |
|------|----------|
| `off` | Tools run directly on the host machine (DEFAULT) |
| `non-main` | Only group/channel sessions are sandboxed; main sessions bypass |
| `all` | Every session runs in a containerized sandbox |

Sandbox scope options:
- `agent` — separate container per agent (recommended)
- `session` — separate container per session (stricter)
- `shared` — single container for all agents (risky)

Workspace access within sandbox:
- `none` — no agent workspace access (default when sandboxed)
- `ro` — read-only mount at `/agent`
- `rw` — read-write mount at `/workspace`

Dangerous Docker settings that must NEVER be enabled in the vault:
- `dangerouslyAllowReservedContainerTargets` — privileged container targeting
- `dangerouslyAllowExternalBindSources` — mounting external host volumes
- `dangerouslyAllowContainerNamespaceJoin` — namespace sharing

### 3.2 Layer 2: Tool Policy (What Tools Are Available)

Determines which tools the agent can use. Four built-in profiles:

| Profile | Tools Available |
|---------|----------------|
| `minimal` | Messaging + read-only tools |
| `messaging` | + channel tools (WhatsApp, Telegram, etc.) |
| `standard` | + file read + browser + web tools |
| `full` | All tools enabled (DEFAULT) |

Additional controls:
- `tools.allow` — explicit allowlist (everything else blocked)
- `tools.deny` — explicit denylist (always wins over allow)
- `tools.fs.workspaceOnly` — restricts file operations to workspace directory
- Per-agent overrides via `agents.list[].tools.allow/deny`

**Key rule: "deny always wins."** If a tool is in the deny list, it cannot be used regardless of the allow list or profile.

### 3.3 Layer 3: Exec Security (How Commands Run)

Controls shell command execution specifically:

| Security Level | Behavior |
|---------------|----------|
| `deny` | All gateway/node execution blocked (most restrictive) |
| `allowlist` | Only pre-approved commands work; unknown commands trigger approval |
| `full` | All commands permitted (dangerous) |

Additional exec controls:
- `tools.exec.ask: "always"` — requires approval on each invocation
- `tools.exec.strictInlineEval: true` — forces reapproval for inline code eval
- `tools.exec.safeBins` — trusted binaries that bypass allowlist (cat, grep, ls, etc.)
- `tools.exec.safeBinProfiles` — per-binary restriction profiles
- Interpreters (Python, Node, Ruby, Bash) must NEVER be in safeBins

### 3.4 Elevated Access (The Escape Hatch)

Per-session override that lets exec bypass sandbox to run on the host:

- `/elevated on` — run exec on host (may still need approval)
- `/elevated full` — run exec on host AND skip approval
- Requires `tools.elevated.enabled: true` in config
- Can be restricted to specific users via `tools.elevated.allowFrom`

**This must be disabled in the vault. Period.**

### 3.5 Gateway Authentication

Controls who can connect to the OpenClaw gateway:

- `token` — shared bearer credential (recommended)
- `password` — credential via environment variable
- `trusted-proxy` — identity-aware reverse proxy

Gateway binding:
- `loopback` — localhost only (default, recommended)
- `lan` — local network (risky)
- `tailnet` — Tailscale network
- `custom` — explicit IP

### 3.6 DM Access Control

Controls who can message the agent:

| Policy | Behavior |
|--------|----------|
| `pairing` | Unknown senders get time-limited codes; must be approved (DEFAULT) |
| `allowlist` | Unknown senders blocked entirely |
| `open` | Anyone can message (HIGH RISK) |
| `disabled` | Ignore inbound DMs |

---

## 4. The Identified Problems

### 4.1 The Core Problem

OpenClaw is an extremely powerful agent with full user-level access to a computer, controlled via messaging apps that non-technical users already know how to use. Its default configuration has no sandboxing, no tool restrictions, and no command approval. This means:

1. **A non-technical user** who installs OpenClaw and connects it to Telegram has given an AI agent unrestricted access to their entire computer, their files, their messaging apps, their browser, and potentially their phone.

2. **The built-in security model** (sandbox + tool policy + exec controls) exists but is designed for technical users who understand Linux containers, shell security, and permission models. A non-technical user will never configure these correctly.

3. **The ecosystem itself is hostile.** 11.9% of ClawHub skills were malware. The database was breached. 21,639 instances were exposed on the public internet without authentication. CVE-2026-25253 allowed one-click RCE. This is not a theoretical risk.

### 4.2 What Non-Technical Users Don't Know

A non-technical user who installs OpenClaw doesn't know:

- That the agent can read all their files (photos, documents, tax returns, passwords)
- That the agent can send messages as them on WhatsApp, Signal, Telegram
- That the agent can run any command on their computer
- That the agent can schedule persistent background jobs
- That the agent's API key, if stolen, can run up their bill
- That skills downloaded from ClawHub might be malware
- That the agent's session transcripts contain their personal data
- How to configure sandboxing, tool policies, or exec controls
- How to audit what the agent did after a session

### 4.3 What Existing Hardening Guides Get Wrong

Every existing OpenClaw hardening guide:

1. **Assumes technical users** — "if you can't understand how to run a command line, this is far too dangerous for you"
2. **Puts the API key inside the container** — a compromised process reads it from `/proc/self/environ`
3. **Requires manual configuration** — editing JSON config files, understanding Docker networking, setting up seccomp profiles
4. **Provides no monitoring** — the user has no way to see what the agent did in plain language
5. **Is all-or-nothing** — either fully locked down (unusable) or fully open (dangerous)

### 4.4 What Our Current Vault Gets Right

The existing openclaw-vault implementation (as of 2026-03-23) correctly solves:

- **API key isolation** — proxy-side injection means the key never enters the container
- **Network isolation** — internal-only network with proxy allowlist enforcement
- **Container hardening** — read-only root, all caps dropped, custom seccomp, noexec tmpfs, PID/memory limits, non-root user
- **Kill switches** — three escalation levels (soft/hard/nuclear)
- **Verification** — 15-point security check that proves all controls are active
- **Honest documentation** — five residual risks are explicitly listed

### 4.5 What Our Current Vault Gets Wrong

The existing vault is a **single-mode static sandbox** for security researchers. It fails the non-technical user thesis because:

1. **No granular control** — it's fully locked or nothing. No way to say "allow messaging but not filesystem"
2. **No mode switching** — can't adjust the agent's access level without rebuilding the container
3. **No user-friendly interface** — requires terminal commands, editing config files, understanding Docker
4. **No monitoring in plain language** — proxy logs are JSON lines, not human-readable summaries
5. **Claims to be "not an agentic workstation"** — the README explicitly says the vault prevents the features that make OpenClaw useful (email, files, browser, messaging)
6. **Target audience is wrong** — says "not for you if you've never used a terminal"
7. **Monitoring scripts are stubs** — network-log-parser.py, session-report.sh, skill-scanner.sh print "not yet implemented"
8. **One broken test** — test-network-isolation.sh uses wget which was stripped from the image

---

## 5. Our Solution: The Security Harness

### 5.1 The Thesis

**Any non-technical user can safely run OpenClaw on their personal computer, maintaining full control over what the agent can and cannot access, without needing technical knowledge or a second machine.**

### 5.2 The Metaphor

The user's computer is a car. OpenClaw is an AI driver being installed. The OpenClaw-Vault is the security harness that:

- **Keeps the user in the driver seat** — the user always has ultimate control (root, admin, passwords, system resources are never accessible to the agent)
- **Provides a gear selector** — the user can switch between:
  - **Manual (stick-shift)**: The agent can do nothing without per-action approval. Maximum safety, minimum autonomy.
  - **Semi-auto**: The agent has access to specific tools the user has granted (e.g., messaging yes, filesystem no). Moderate safety, moderate autonomy.
  - **Full-auto**: The agent has broad autonomy — EXCEPT it can never touch the driver seat (root, admin, passwords, system identity). Lower safety, maximum autonomy.
- **Never lets the AI driver take the steering wheel** — regardless of gear, the user can always:
  - See what the agent is doing (monitoring)
  - Stop the agent immediately (kill switch)
  - Change the agent's access level (gear shifting)
  - Review what the agent did (audit trail)

### 5.3 The Six-Layer Defense Architecture

Our vault wraps OpenClaw in six layers of defense. Even if one layer fails, the others hold. The outer layers (1-2) are enforced at the infrastructure level and cannot be modified by the agent. The inner layers (3-6) configure OpenClaw's own security model.

```
Layer 1: Container Isolation (kernel-level wall)
  |
  |  The agent runs inside a hardened Podman/Docker container with:
  |  - Read-only root filesystem
  |  - All Linux capabilities dropped
  |  - Custom seccomp profiles (~100 allowed syscalls, deny-by-default)
  |  - no-new-privileges flag
  |  - Non-root user (uid 1000)
  |  - PID limit (256), memory limit (4GB), CPU limit (2 cores)
  |  - noexec on all tmpfs mounts
  |  - No Docker socket mounted
  |  - No host volume mounts (by default — semi/full-auto may grant specific mounts)
  |
Layer 2: Network Proxy (domain allowlist + API key isolation)
  |
  |  All network traffic routes through a mitmproxy sidecar that:
  |  - Blocks all domains not on the allowlist (returns 403)
  |  - Blocks raw IP addresses
  |  - Injects API keys at the network layer (key never enters agent container)
  |  - Blocks outbound payloads > 1 MB (exfiltration prevention)
  |  - Blocks inbound responses > 10 MB
  |  - Redacts API keys if reflected in responses
  |  - Logs every request/response as structured JSON
  |  - Supports hot-reload of allowlist via SIGHUP
  |
Layer 3: OpenClaw Tool Policy (what tools are available)
  |
  |  Configured via openclaw.json inside the container:
  |  - Manual mode: profile "minimal", deny all exec/fs/automation
  |  - Semi-auto mode: profile "messaging" or "standard" with explicit allow/deny lists
  |  - Full-auto mode: profile "full" with deny list for critical tools
  |  - In ALL modes: deny sessions_spawn, gateway (agent cannot create sub-agents or modify its own gateway)
  |
Layer 4: OpenClaw Sandbox Mode (where tools execute)
  |
  |  The agent already runs inside our container (Layer 1), but OpenClaw's
  |  own sandbox adds defense-in-depth:
  |  - mode: "all" (every session sandboxed)
  |  - scope: "session" (separate container per session)
  |  - workspaceAccess controlled per gear
  |  - ALL dangerous Docker settings disabled permanently
  |  - elevated access DISABLED permanently
  |
Layer 5: OpenClaw Exec Controls (how commands run)
  |
  |  Configured per gear:
  |  - Manual mode: security "deny" (all exec blocked)
  |  - Semi-auto mode: security "allowlist" with ask "always" + strictInlineEval
  |  - Full-auto mode: security "allowlist" with curated safeBins list
  |  - In ALL modes: elevated access disabled, no interpreter in safeBins
  |
Layer 6: Hardening Config (agent behavior lockdown)
  |
  |  Applied to OpenClaw's own configuration:
  |  - mode: "always" or per-gear approval mode
  |  - persistence: false (no state across restarts) — or per-gear
  |  - telemetry: disabled
  |  - mDNS: disabled
  |  - pairing: allowlist mode with empty list (no agent-to-agent communication)
  |  - memory: non-persistent (or per-gear)
```

### 5.4 The Three Gears — Detailed

#### Gear 1: Manual (Stick-Shift)

*"The agent can think, but it cannot act without your explicit approval for every single action."*

| Layer | Configuration |
|-------|--------------|
| Container | Fully isolated. No host mounts. No network except LLM APIs. |
| Network proxy | Allowlist: LLM API providers only (api.anthropic.com, api.openai.com) |
| Tool policy | Profile: `minimal`. Deny: everything except read + messaging to user |
| Sandbox | mode: `all`, scope: `session`, workspaceAccess: `none` |
| Exec | security: `deny` (all shell commands blocked) |
| Hardening | mode: `always` (every action requires Telegram/WhatsApp approval) |

**Use case:** First-time setup, security evaluation, learning what OpenClaw does.

#### Gear 2: Semi-Auto

*"The agent can use specific tools you've granted, within boundaries you've set."*

The user selects which capabilities to enable via the Lobster-TrApp GUI. Each capability maps to a set of tool policy changes, network allowlist additions, and container mount configurations.

| Capability | What It Enables | What It Requires |
|-----------|----------------|-----------------|
| Messaging (Telegram) | `message`, Telegram channel tools | Telegram credentials in container, Telegram API domains on allowlist |
| Messaging (WhatsApp) | `message`, WhatsApp channel tools | WhatsApp credentials, WhatsApp domains on allowlist |
| Web browsing (sandboxed) | `browser`, `web_search`, `web_fetch` | Broader domain allowlist or configurable domains |
| File workspace (sandboxed) | `read`, `write`, `edit` with workspaceOnly | Container tmpfs workspace, user-initiated file transfer in/out |
| File access (specific folders) | `read`, `write`, `edit` on mounted paths | Specific host directory mounted read-only or read-write into container |
| Scheduling | `cron` | Persistent container (survives restarts) |

| Layer | Configuration |
|-------|--------------|
| Container | Selective host mounts (user-chosen directories, read-only by default). Additional domains on allowlist. |
| Network proxy | Allowlist: LLM APIs + user-selected service domains |
| Tool policy | Profile: `messaging` or `standard`. Explicit allow list for granted tools. Deny: `exec`, `group:runtime`, `sessions_spawn`, `gateway` |
| Sandbox | mode: `all`, scope: `agent`, workspaceAccess: per-capability |
| Exec | security: `allowlist`, ask: `always`, strictInlineEval: true |
| Hardening | Approval mode configurable per capability |

**Use case:** Everyday AI assistant use — messaging, web research, file management in specific folders, scheduling.

#### Gear 3: Full-Auto

*"The agent can operate broadly, but it can never touch the driver seat."*

| Layer | Configuration |
|-------|--------------|
| Container | Broader host mounts (user home minus sensitive directories). Most domains allowed. |
| Network proxy | Allowlist: broad (but still blocks known malicious domains, internal network ranges) |
| Tool policy | Profile: `full`. Deny: `gateway`, `sessions_spawn` (cannot modify itself or create sub-agents) |
| Sandbox | mode: `all`, scope: `agent`, workspaceAccess: `rw` |
| Exec | security: `allowlist`, safeBins: curated list, strictInlineEval: true |
| Hardening | Approval mode for destructive actions only |

**The driver seat — NEVER accessible in any gear:**

| Protected Resource | How It's Protected |
|-------------------|-------------------|
| Root / sudo access | Container runs as non-root (uid 1000), sudo stripped, no-new-privileges, capabilities dropped |
| System admin (systemd, services) | Seccomp blocks mount, unshare, setns; no host access to systemd socket |
| User passwords / keyring | ~/.local/share/keyrings never mounted; GNOME keyring socket not mapped |
| SSH keys | ~/.ssh never mounted |
| GPG keys | ~/.gnupg never mounted |
| Browser saved passwords | Real browser profile never used; vault browser is a fresh profile |
| API keys / tokens | Proxy-side injection; ~/.openclaw/credentials controlled by vault, not agent |
| Other user accounts | Container user namespace isolation; only uid 1000 mapped |
| Docker / Podman socket | Never mounted |
| /etc, /boot, /sys, /proc (host) | Never mounted; container has its own isolated /proc |
| The vault itself | Vault config files are read-only mounts; agent cannot modify its own restrictions |

### 5.5 Gear Switching

The user switches gears via the Lobster-TrApp GUI. This requires:

1. **Stopping the current session** — active agent session is saved or terminated
2. **Reconfiguring layers 3-6** — openclaw.json, allowlist.txt, hardening config updated
3. **Optionally reconfiguring layers 1-2** — container mounts and network may change (requires container restart)
4. **Restarting the container** — new configuration takes effect
5. **Running verification** — 15-point check confirms new configuration is correct

Switching from a more permissive gear to a less permissive gear (e.g., Full-Auto to Manual) always works immediately. Switching to a more permissive gear requires explicit user confirmation via the GUI.

**The user never edits JSON files, YAML configs, or Docker compose files.** The GUI handles all of this.

### 5.6 Monitoring and Audit Trail

Every gear provides the user with visibility into what the agent is doing:

1. **Real-time activity feed** — human-readable log of agent actions (not raw JSON)
2. **Network traffic summary** — which domains were contacted, how much data was sent/received
3. **Tool usage report** — which tools the agent used, what files it accessed, what commands it ran
4. **Session transcript** — full conversation history between user and agent
5. **Security alerts** — flagged when the agent attempts something blocked (domain, tool, command)
6. **Session summary** — when the session ends, a plain-language summary of what the agent did

This replaces the current stub monitoring scripts (network-log-parser.py, session-report.sh, skill-scanner.sh) with real implementations that render in the Lobster-TrApp GUI.

### 5.7 The Kill Switch

Available in every gear, always accessible, cannot be disabled:

| Level | Action | When to Use |
|-------|--------|-------------|
| **Pause** | Suspend agent session, keep container running | "Wait, what are you doing?" |
| **Soft stop** | Stop agent session, preserve workspace for review | "Stop, I want to check what you did" |
| **Hard kill** | Remove containers, volumes, networks | "I don't trust this session, destroy everything" |
| **Nuclear** | Hard kill + purge all container artifacts + rotate API key reminder | "Something went wrong, clean slate" |

---

## 6. What Changes From The Current Vault

### 6.1 What We Keep

Everything in the current vault that works:

- Two-container architecture (vault + proxy sidecar)
- Proxy-side API key injection
- Domain allowlist enforcement with hot-reload
- Container hardening (read-only root, caps dropped, seccomp, noexec, PID/mem limits)
- Kill switch (soft/hard/nuclear)
- 15-point verification
- Structured JSON logging
- Exfiltration detection (payload size limits, key redaction)

### 6.2 What We Add

| Addition | Purpose |
|----------|---------|
| **Gear system** (Manual / Semi-Auto / Full-Auto) | Dynamically adjustable access levels |
| **OpenClaw configuration profiles** | Pre-built openclaw.json configs per gear + per-capability |
| **Selective host mounts** | Allow specific directories into container for Semi/Full-Auto |
| **Driver seat protection** | Explicit exclusion list of resources that are never accessible |
| **Monitoring implementations** | Real network-log-parser, session-report, skill-scanner |
| **Audit trail renderer** | Human-readable activity feed for Lobster-TrApp GUI |
| **Gear-switching mechanism** | Safe reconfiguration without manual config editing |
| **Verification per gear** | Gear-specific security checks beyond the current 15 |

### 6.3 What We Change

| Current State | New State |
|--------------|-----------|
| README says "not an agentic workstation" | README says "a secure agentic workstation with granular control" |
| README says "not for you if you've never used a terminal" | README says "designed for everyone, including non-technical users" |
| Single static configuration | Three gear profiles + per-capability toggles |
| Terminal-only operation | GUI-driven via Lobster-TrApp |
| Hardcoded allowlist | Per-gear allowlist templates with user customization |
| Stub monitoring scripts | Real monitoring with GUI rendering |
| One test suite | Gear-specific test suites |

### 6.4 What We Remove

| Removal | Reason |
|---------|--------|
| "Path B: Docker Desktop Sandbox Plugin" | Confusing; weaker security; contradicts our thesis |
| Phase 2 VM isolation stubs | Out of scope for now; can be added later as Gear 0 |
| The disclaimer "This tool is not for you" | Our whole thesis is that it IS for everyone |

---

## 7. Open Questions For Roadmap Planning

These questions need to be answered during implementation planning:

1. **Gear switching: restart or hot-reload?** — Can we reconfigure OpenClaw's tool policy via the Gateway API without restarting the container, or does it require a restart? This affects UX significantly.

2. **Host mount granularity** — What is the right default set of mountable directories for Semi-Auto and Full-Auto? How do we present this to a non-technical user?

3. **Channel credential management** — Telegram/WhatsApp credentials need to be set up once and persist. How does this interact with the container lifecycle? Do we need a persistent volume for credentials?

4. **OpenClaw version pinning** — The Containerfile pins `@anthropic-ai/openclaw@2026.2.17`. How do we handle updates? Auto-update is a security risk; never updating leaves known vulnerabilities.

5. **Testing the thesis** — We plan to install OpenClaw on our own laptop using this repo. What's the minimum viable test plan to verify all three gears work correctly?

6. **Scope of monitoring** — The current proxy logs capture network traffic. But OpenClaw also logs session transcripts. Do we parse both? How much monitoring is enough without being overwhelming?

7. **Cross-platform support** — The current setup.sh supports Linux and macOS. setup.ps1 supports Windows. The Lobster-TrApp GUI targets all three. Are there platform-specific security considerations for each gear?

---

## 8. References

### OpenClaw Documentation
- [OpenClaw GitHub README](https://github.com/openclaw/openclaw/blob/main/README.md)
- [OpenClaw Official Docs](https://docs.openclaw.ai/)
- [OpenClaw Security Documentation](https://docs.openclaw.ai/gateway/security)
- [OpenClaw Tools & Plugins](https://docs.openclaw.ai/tools)
- [OpenClaw Exec Tool](https://docs.openclaw.ai/tools/exec)

### Security References
- [Permissions, Sandbox & Security — OpenClaw Help](https://www.getopenclaw.ai/en/help/permissions-sandbox-security)
- [Sandbox vs Tool Policy vs Elevated — OpenClaw Docs](https://open-claw.bot/docs/gateway/sandbox-vs-tool-policy-vs-elevated/)
- [Security-First OpenClaw Setup — Roberto Capodieci](https://capodieci.medium.com/ai-agents-016-security-first-openclaw-setup-sandboxing-dm-pairing-and-what-not-to-share-fb0003f685b4)
- [OpenClaw Security Architecture and Hardening — Nebius](https://nebius.com/blog/posts/openclaw-security)

### Ecosystem Context
- [What is OpenClaw — DigitalOcean](https://www.digitalocean.com/resources/articles/what-is-openclaw)
- [OpenClaw Explained — KDnuggets](https://www.kdnuggets.com/openclaw-explained-the-free-ai-agent-tool-going-viral-already-in-2026)
- [OpenClaw Complete Guide — Milvus Blog](https://milvus.io/blog/openclaw-formerly-clawdbot-moltbot-explained-a-complete-guide-to-the-autonomous-ai-agent.md)
- [Don't Run OpenClaw on Your Main Machine — SkyPilot Blog](https://blog.skypilot.co/openclaw-on-skypilot/)
