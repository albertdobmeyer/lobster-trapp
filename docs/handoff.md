# Handoff — Active Mission

**Last updated:** 2026-04-24 (overnight handoff, end of session that pivoted mission and landed the e2e harness scaffold)
**Current mission:** **Stress-test the clawbot perimeter end-to-end before building anything else.** Ship whatever it proves as the v0.2.0 audience.
**Branch:** `main` — commit-on-main workflow continues
**Last commits:** `943a08f` harness scaffold, `0ac3e9e` token-leak fix, `2d25299` previous E.2.2 handoff (stale — see below)
**Pick up at:** **Phase 3 of the plan at `~/.claude/plans/env-test-is-filled-out-silly-iverson.md`** — follow `tests/e2e-telegram/FIRST_RUN.md`, ~5 min of your attention

---

## 🛑 Read this before opening any file

The mission pivoted this session. The previous handoff (commit `2d25299`) was about Phase E.2.2 (Home Dashboard) in the UI-rebuild track. **That track is on pause.** Here's why and what to do.

### Why we pivoted

The conversation surfaced an uncomfortable truth: the UI-rebuild plan (E.2.2 through E.2.8) was polishing post-install screens for a non-technical user ("Karen") who can't get past the pre-install barriers (Anthropic API key, Telegram BotFather, Podman install, pay-per-token billing). No amount of Home-dashboard polish fixes that.

The honest fork we named: build for **K-local / prosumer** (tech-savvy users who can assemble the stack), or build for **K-cloud** (managed backend, SaaS pivot, different company). You chose **prosumer**.

But before more polish — even for the prosumer audience — we need to know: **does the perimeter actually work?** The whole product is sold on "safe on any computer." Months of building, never stress-tested end-to-end. Could be Swiss cheese, could be an empty prison cell (too restrictive to be useful), could be just right.

So the new immediate mission is: **build a harness that drives Hum from Telegram as a user, observe the perimeter under real traffic, document findings.** Whatever that reveals determines what gets built next.

### What's done this session

**Phase 0 — Perimeter brought up live** ✅
- Containers restarted with real credentials (previously `.env` had dummy `sk-ant-test-dummy-key`  and `123456:ABC-DEF-test-token` placeholders — that's why Hum was silent)
- Anthropic key funded ($5 credits; note: you originally set a workspace **spend limit** without actually **purchasing credits**; distinct things)
- Bot token rotated after **Finding #1** (see below)
- User paired to `@LobsterTrappBot` (Telegram user id `8585044562`)
- Verified end-to-end: Telegram → Anthropic → Telegram roundtrip in ~3s, HTTP 200 both hops, Claude Haiku 4.5 replied
- Cleaned up orphan containers from the pre-v2-perimeter `openclaw-vault` compose project that were masquerading with the same names

**Finding #1 — Telegram bot token leaking in proxy logs** ✅ FIXED (submodule `4f5b560`, parent `0ac3e9e`)
- `vault-proxy` was logging full URLs including the `bot<id>:<hash>` path token
- Leaked to `podman logs vault-proxy` stdout AND to `/var/log/vault-proxy/requests.jsonl` (persistent volume)
- mitmproxy's own per-flow-summary printer was a second leak path, bypassing our addon's log hook
- Fix: regex-redact `/bot<id>:<hash>` → `/bot<REDACTED_BOT_TOKEN>` at all 6 `_log_event` sites in `vault-proxy.py`, plus `ctx.options.flow_detail = 0` in a `running()` hook to silence mitmproxy's built-in prints
- Old leaked token revoked via BotFather; old requests.jsonl volume purged; new token verified redacted under live traffic (`grep -c "$TELEGRAM_BOT_TOKEN"` in full proxy logs returns 0)
- **Severity before fix: HIGH** (bot-identity compromise for anyone holding the token)
- **This was caught during manual smoke-testing, before the automated harness existed.** The point of building the harness is to surface more of these.

**Phase 1 — Housekeeping** ✅
- `.env.test`, `*.session`, session dir, pytest caches added to `.gitignore` (previously a gap — `.env.test` was sitting un-gitignored)
- `~/.lobster-trapp/test-sessions/` created with mode 700 (holds Telethon session file, credential-equivalent to Telegram account access)

**Phase 2 — Harness scaffold** ✅ (commit `943a08f`)
- `tests/e2e-telegram/` — Python + Telethon + pytest scaffold
- 9 test files covering network, filesystem read/write, exec/escape, credentials, spending, dynamic shell
- Helpers: `HumClient` (send-and-wait with `[TEST]` prefix), `ProxyLogTail` (async subprocess tail of `podman logs vault-proxy` parsing JSON events), `BudgetTracker` (Decimal-math cost accounting, hard-stops at $4.00)
- Bonus: `direct_probing/probe.sh` — 24 `podman exec` probes that run without Telegram or Anthropic cost. Actually ran tonight.

**Direct probing results** (`tests/e2e-telegram/direct_probing/findings-2026-04-23.md`): 22 PASS, 0 FAIL, 2 INCONCLUSIVE.
- The two INCONCLUSIVE: `/proc/mounts` discloses `/dev/sda2` host device name (info leak, LOW severity — see `VERDICT-2026-04-23.md` Finding #2); PID-limit probe didn't trigger (probe design issue, not a security finding)
- 22 PASSes include: all host paths (including `.env.test`) unreachable, mount/unshare/ptrace blocked, no docker socket, `/tmp` nosuid confirmed, allowlist blocks non-allowlisted domains, internal network blocks raw IPs + host loopback, real Anthropic key NOT in vault-agent env (only vault-proxy — architecture matches design), bot-token redaction holds under live traffic

### What's blocked

**Phase 3 — Telethon interactive login.** First-run of the pytest suite sends a login code to your Telegram app; you paste it back at the pytest prompt. I could not do this autonomously. Takes you ~2 minutes.

**Phase 4 — Probing tests via Telegram.** Nine test files are written and ready; they need Phase 3 to run.

**Phase 5 — Auto-generated verdict update.** Appended after Phase 4 runs.

---

## What to do right now

1. Open `tests/e2e-telegram/FIRST_RUN.md`.
2. Run the 3 commands there. First two cost about 3 minutes of your time; the third runs automatically for 5–10 minutes and costs ~$0.15–0.40 of Anthropic credit.
3. When the suite finishes, read `tests/e2e-telegram/VERDICT-<date>.md`.

After that:

4. **Decide next move based on findings.** The harness output is the forcing function for what to build next:
   - Swiss cheese (FAILs in Phase 4): **stop, fix findings, re-run.** Don't build more product on a leaky foundation.
   - Empty cell (Hum too restricted to do anything useful): **loosen policy at the right shell level**, then re-run.
   - Just right: proceed with the **prosumer** v0.2.0 plan. This doesn't mean going back to the Karen-focused UI polish; it means scoping E.2.2–E.2.8 to what a tech-savvy user actually needs. Different plan, needs re-thinking.

5. **Push the submodule fix** (`components/openclaw-vault` commit `4f5b560`) to `github.com/gitgoodordietrying/openclaw-vault`. I did not push — shared-systems change, your call.
6. **Push `origin main`** if you want the parent-repo commits (`0ac3e9e`, `943a08f`, and whatever I add this morning) on the remote. Currently 10 commits ahead of `origin/main`.

---

## Pre-existing state worth knowing

- The `.env.test` file at repo root has: `TELEGRAM_API_ID=32860258`, API hash, your phone `+19179726291`, bot handle `@LobsterTrappBot`, session path `/home/albertd/.lobster-trapp/test-sessions/harness`. Gitignored.
- `.env` at repo root has real (not dummy) `ANTHROPIC_API_KEY`, `TELEGRAM_BOT_TOKEN`, `OPENAI_API_KEY` (mine is unset, which is fine). Gitignored.
- Containers are up and running as of commit time. They should stay up overnight — the bot polls Telegram every 30s, each poll is ~449 bytes (negligible cost: $0 while idle).
- `components/openclaw-vault/component.yml:169` has a stale reference to container name `openclaw-vault` when the actual container is `vault-agent`. Latent bug; not blocking.

---

## Verification matrix (for after you run the suite)

```bash
# Sanity before running the harness
podman ps                                            # expect 4 rows UP
bash tests/e2e-telegram/direct_probing/probe.sh     # expect PASS=22 FAIL=0 INCONCLUSIVE=2

# Run the harness (from FIRST_RUN.md)
cd tests/e2e-telegram && source .venv/bin/activate
pytest -xvs test_smoke.py                            # one-time interactive code paste
pytest -v                                            # full suite

# After: inspect
cat tests/e2e-telegram/VERDICT-*.md                  # narrative verdict
ls tests/e2e-telegram/direct_probing/findings-*.md   # probe history
```

---

## Decisions deferred to you

- **Next mission** depends on Phase 4 findings. See "What to do right now" step 4.
- **Push submodule + parent** — your call, I stopped short of `git push`.
- **Revisit the UI-rebuild plan at `~/.claude/plans/scalable-sprouting-creek.md`** once the perimeter is cleared. The E.2.2–E.2.8 scope was Karen-focused; for a prosumer audience, several screens (Discover, onboarding polish, Help) need re-scoping or outright cutting.

---

## Historical handoffs

- `88688c2` — Phase A–D + v0.1.0 release
- `b480607` — Phase E.2.0 → E.2.1
- `2d25299` — Phase E.2.1 → E.2.2 (replaced by this one; the plan it referenced is paused pending harness findings)
