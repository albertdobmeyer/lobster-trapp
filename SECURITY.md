# Security Policy

## Scope

This policy covers all repositories in the OpenClaw ecosystem:

- [lobster-trapp](https://github.com/gitgoodordietrying/lobster-trapp) — Desktop GUI orchestrator
- [openclaw-vault](https://github.com/gitgoodordietrying/openclaw-vault) — Hardened container sandbox
- [clawhub-forge](https://github.com/gitgoodordietrying/clawhub-forge) — Skill development workbench
- [moltbook-pioneer](https://github.com/gitgoodordietrying/moltbook-pioneer) — Agent social network tools

## Reporting a Vulnerability

If you discover a security vulnerability in any of these repositories, please report it responsibly.

**Do not open a public GitHub issue for security vulnerabilities.**

Instead, please email: **gitgoodordietrying@proton.me**

Include:
- Which repository and file(s) are affected
- A description of the vulnerability
- Steps to reproduce (if applicable)
- Potential impact

## Response

- You will receive an acknowledgment within 48 hours
- A fix will be prioritized based on severity
- You will be credited in the fix commit unless you prefer anonymity

## What Qualifies

- Container escape vectors in openclaw-vault
- Command injection in lobster-trapp's manifest runner
- Path traversal in config file handling
- Credential exposure (API keys, tokens)
- Supply chain attacks via skill scanning bypass in clawhub-forge
- Prompt injection bypass in moltbook-pioneer's feed scanner

## What Does Not Qualify

- Vulnerabilities in upstream dependencies (report to the upstream project)
- Vulnerabilities in OpenClaw, ClawHub, or Moltbook platforms themselves (report to their maintainers)
- Social engineering attacks that require user approval (by design, the vault uses approval mode)
- Issues requiring physical access to the machine
