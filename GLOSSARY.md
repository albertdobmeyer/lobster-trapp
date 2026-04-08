# Lobster-TrApp Glossary

Official terminology for the Lobster-TrApp ecosystem. Use these terms consistently across all repos, documentation, UI, and conversation.

---

## Shell System (Security Levels)

The shell is the security boundary around the OpenClaw agent. Inspired by lobster biology — a harder shell means more protection but less flexibility. The user chooses their shell level based on how much freedom they want to give their agent.

| Term | What It Means | Analogy | Agent Can... | Agent Cannot... |
|------|--------------|---------|-------------|----------------|
| **Hard Shell** | Maximum protection. Conversation only. | The cage | Chat via Telegram. That's it. | Run commands, read files, browse web, schedule tasks, install skills. |
| **Split Shell** | Selective openings. Every action requires approval. | The arena | Read/write files, exec with safeBins (user approves each command via Telegram). | Access anything not explicitly approved. Protected resources always blocked. |
| **Soft Shell** | Broad autonomy. SafeBins auto-approve. Core protections enforced. | The safari | Search web, schedule tasks, process files, run safeBins commands autonomously. | Touch the driver seat: root, SSH keys, passwords, keyrings, admin accounts. Ever. |

**Shell Up** — Increase protection (e.g., Soft Shell → Hard Shell). Always instant, no confirmation needed. You can always pull the reins.

**Shell Down** — Increase capability (e.g., Hard Shell → Split Shell). Requires explicit user confirmation. You're granting more freedom — be sure.

**Molt** — Reconfigure the shell. Internally, this means swapping config files, adjusting the proxy allowlist, and restarting the container with new permissions. Named after the lobster molting process where the old shell is shed and a new one forms.

---

## Architecture Terms

| Term | What It Means |
|------|--------------|
| **Exoskeleton** | The container itself — the outer wall that always exists regardless of shell level. Read-only filesystem, dropped capabilities, seccomp profile, noexec mounts. The exoskeleton never comes off. |
| **Vault** | The complete security harness: exoskeleton (container) + proxy (network filter) + tool policy (OpenClaw config) + hardening. "The vault" = the whole package. |
| **Proxy Sidecar** | The mitmproxy container that sits between the agent and the internet. Filters domains, injects API keys, logs everything. The agent's only window to the outside world. |
| **Driver Seat** | The resources that are NEVER accessible to the agent in any shell level: root access, SSH keys, GPG keys, passwords, keyrings, admin accounts, Docker socket, the vault's own config. The user always keeps the steering wheel. |
| **Protected Resources** | Technical term for the driver seat. The list of files, sockets, and capabilities that are excluded from every shell level. |
| **Allowlist** | The list of domains the proxy permits. Everything not on the list is blocked and logged. Each shell level has its own allowlist template. |
| **Placeholder Key** | The dummy API key inside the agent container (`sk-ant-api03-placeholder-...`). The agent uses this to construct API requests, but the proxy replaces it with the real key before forwarding. The agent never sees the real key. |

---

## Product Terms

| Term | What It Means |
|------|--------------|
| **Lobster-TrApp** | The complete product — desktop app + security harness + skill scanner + ecosystem tools. The name. Pronounced "lobster trap." |
| **Hum** | The agent's persona during our development and testing. Named by the agent itself (short for "Hummer" = lobster in German). Not a product name — each user's agent will develop its own identity. |
| **The Trifecta** | The three component repos working together: openclaw-vault (containment) + clawhub-forge (skill security) + moltbook-pioneer (ecosystem tools). |
| **OpenClaw** | The upstream open-source AI agent runtime we're securing. Not our project — we wrap it. Think of it as the engine; we build the safety cage around it. |
| **ClawHub** | The upstream skill registry for OpenClaw. 11.9% malware rate during the ClawHavoc incident. Our clawhub-forge scans skills from here before allowing execution. |
| **Moltbook** | The upstream agent social network where AI agents post, follow, and interact. Our moltbook-pioneer provides safe exploration and research tools. |
| **The Pitbull Analogy** | "Think of the OpenClaw agent as a pitbull in a lobster costume: you think it's harmless and funny until it shreds the root and sends emails to everybody." Our vault is the secure enclosure. |

---

## Component Repos

| Term | Repo | Role |
|------|------|------|
| **openclaw-vault** | `gitgoodordietrying/openclaw-vault` | Runtime containment — the security harness that wraps OpenClaw |
| **clawhub-forge** | `gitgoodordietrying/clawhub-forge` | Toolchain security — security gatekeeper (Shield/Anvil/Stamp), CDR, skill scanner |
| **moltbook-pioneer** | `gitgoodordietrying/moltbook-pioneer` | Network safety — Moltbook research tools, feed scanner, identity management |
| **lobster-trapp** | `gitgoodordietrying/lobster-trapp` | Parent app — Tauri desktop GUI, bundles all three components via submodules |

---

## Security Terms

| Term | What It Means |
|------|--------------|
| **Six-Layer Defense** | The vault's defense-in-depth architecture: (1) Container isolation, (2) Network proxy, (3) Tool policy, (4) Application restrictions, (5) Exec controls, (6) Hardening config. Each layer works independently — if one fails, the others hold. |
| **Tool Policy** | OpenClaw's built-in mechanism that filters which tools the LLM can see. Verified in source code: denied tools are removed from the function definitions BEFORE the LLM receives them. The agent literally cannot call a tool it doesn't know exists. |
| **Proxy Key Injection** | The core security innovation: the real API key lives only in the proxy container. The agent has a placeholder. The proxy swaps the placeholder for the real key at the network layer. Even full container compromise reveals nothing. |
| **Kill Switch** | Three-level emergency stop: Soft (stop, preserve data), Hard (destroy containers and volumes), Nuclear (purge everything + remind to rotate API key). Always accessible, works in any shell level. |
| **Pairing** | The process where a Telegram user proves their identity to the bot. Required after every container restart in Hard Shell (no persistence). The user sends a message, gets a code, and approves it via terminal. |
| **ClawHavoc** | The incident where 11.9% of ClawHub skills (341 of 2,857) were found to be malware delivering Atomic Stealer. This is why ClawHub domains are blocked by default and why clawhub-forge exists. |
| **CDR (Content Disarm & Reconstruction)** | The forge's core innovation: downloaded skills are never used directly. They are quarantined, pre-filtered, semantically understood by an isolated LLM, then rebuilt from scratch. The original is deleted immediately. Binary: clean rebuild or discard. Borrowed from enterprise email security, applied to AI agent instruction files. |
| **Quarantine** | The temporary directory where downloaded skills are held during CDR processing. Files in quarantine never reach the user's workspace or the vault agent. Deleted immediately after CDR completes. |
| **Clearance Report** | A JSON security certificate generated by the forge after a skill passes the full pipeline (lint + scan + verify + test). Contains scan results, verification verdict, SHA-256 checksum, and optional GPG signature. Required by the vault's `install-skill.sh` for skill acceptance. |
| **Security Certificate** | Synonym for clearance report. The machine-readable proof that a skill was scanned and verified clean by clawhub-forge. Travels with the skill when published to ClawHub or exported to the vault. |

---

## Development Terms

| Term | What It Means |
|------|--------------|
| **Phase** | A stage in the master roadmap. Each phase has its own implementation plan and exit criteria. Phases are sequential — each builds on the previous. |
| **Spec** | A design specification document. The foundational spec is at `docs/superpowers/specs/2026-03-23-openclaw-vault-security-harness-design.md`. |
| **Verified Knowledge** | Information confirmed by reading actual source code — not documentation, not blog posts, not assumptions. Our `docs/openclaw-internals.md` contains only verified knowledge. |
| **The Hallucination Problem** | When the LLM (especially Haiku) fabricates tool execution results instead of admitting it can't use denied tools. Discovered during Gear 1 testing. A critical UX issue for non-technical users who can't distinguish real output from fabricated output. |

---

## Mapping: Old Terms → New Terms

| Old Term | New Term | Notes |
|----------|----------|-------|
| Gear 1: Manual | **Hard Shell** | Maximum lockdown |
| Gear 2: Semi-Auto | **Split Shell** | Selective capabilities |
| Gear 3: Full-Auto | **Soft Shell** | Broad autonomy |
| Gear switching | **Molting** | Reconfiguring the shell |
| Container isolation | **Exoskeleton** | The outer wall |
| Protected resources | **Driver Seat** | What the agent can never touch |

**Important:** Update all specs, plans, code comments, and documentation to use the new Shell terminology. The old Gear terminology may still appear in older documents — treat it as deprecated.

---

*Last updated: 2026-04-02*
