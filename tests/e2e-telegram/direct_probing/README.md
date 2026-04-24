# Direct-container probing

Complementary suite to the Telegram-driven pytest harness. Runs commands
**inside** each container via `podman exec` and observes whether the
security boundary holds — from the attacker's perspective, not the
user's.

## When to use this instead of the pytest harness

- You want security signal **without** paying for Anthropic tokens
- You changed `compose.yml`, the Containerfile, or seccomp/apparmor configs
  and want a fast sanity check before a full run
- You want to test what's reachable from **inside the container** without
  needing the LLM to emit the test command (covers surfaces the LLM's
  tool policy would refuse before even trying)
- CI on a fresh clone where Telegram credentials aren't available

## Limitations

- Can't exercise the prompt-injection attack surface (that needs the LLM)
- Can't observe how the LLM's tool policy interacts with the network policy
- `podman exec` runs as the container user — it doesn't test what a
  compromised-but-non-root process can do *after* privilege escalation.
  It tests what the starting-position non-root user can do.

## Running

```bash
bash tests/e2e-telegram/direct_probing/probe.sh
```

Writes `findings-<YYYY-MM-DD>.md` alongside the script. Exit code is
non-zero if any probe fails.

## Probe categories

| Category | What it tests |
|---|---|
| `fs-read` | Can the container reach sensitive host paths? |
| `escape` | Can the container break out (mount, unshare, ptrace, socket, setuid)? |
| `network` | Does the allowlist hold at the proxy layer? Can raw IPs reach out? Is the host loopback reachable? |
| `creds` | Does the agent container have the real Anthropic key? (It shouldn't; vault-proxy does.) |
| `compose-sanity` | Does the kernel report match compose.yml promises? |
| `redaction` | Does our vault-proxy patch continue to redact bot tokens in logs? |

## Interpreting results

Outcomes are `PASS` (security enforced), `FAIL` (breach observed), or
`INCONCLUSIVE` (probe tool missing or output ambiguous). FAIL is a real
finding worth investigating; INCONCLUSIVE usually means the probe needs
a tool not installed in the target container (e.g., `curl` isn't in
vault-agent — we use `node` instead).

## Adding new probes

Each probe is 3–10 lines of bash in `probe.sh` that:
1. Runs a test command via `podman exec <container>`
2. Pattern-matches the output against expected signals
3. Calls `log_probe <category> <outcome> <title> <detail>`

Keep probes narrow, deterministic, and fast (<5s each). If a probe needs
state to persist or complex assertions, graduate it to the pytest harness
instead.
