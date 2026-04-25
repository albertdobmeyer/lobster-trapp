# Spec: Tool Mediation Pattern (the wrapper-per-tool generalization)

**Date:** 2026-04-25
**Status:** Design pattern, applies to all current + future external-capability sidecars
**Prompted by:** User insight that "every tool is an attack surface" + "we need a parser/wrapper for each individual tool and use case"

## TL;DR

Every external capability the agent needs (calendar, email, smart home, banking, ...) gets a **dedicated sidecar container** that:
1. Holds the credentials (OAuth, API keys, account identifiers) — never exposed to the agent
2. Exposes a **narrow typed tool surface** to the agent — operations only, no raw API access
3. **Sanitizes every parameter** the agent passes in (defense against compromised agent)
4. **Classifies every action** by risk level (LOW/MEDIUM/HIGH)
5. **Applies per-action policy** — auto-execute, notify-and-execute, or block-pending-user-approval
6. **Sanitizes every response** before returning to the agent (defense against malicious external data)

This is the **vault-proxy pattern, generalized**. The proxy already does this for Anthropic / OpenAI / Telegram (API key injection + URL allowlist + response redaction). Calendar, voice, and any future capability follow the same shape.

## Why the user's "fake calendar" intuition is right but doesn't need a fake calendar

You proposed: bot writes to a fake calendar, we scan the writes for attacks, then insert sanitized output into the real calendar.

The intuition is correct — **the agent should never directly touch the real Google Calendar**. But the abstraction layer doesn't need to mimic Google's API. It needs to be a typed function call with sanitization on both ends.

```
WRONG:                                        RIGHT:

Bot                                           Bot
 │ uses Google API directly                    │ calls calendar.add_event(...)
 │ with OAuth token                            │ — typed args, narrow surface
 ▼                                             ▼
Google Calendar                               vault-calendar (sidecar)
                                               │ — holds OAuth
                                               │ — sanitizes args
                                               │ — risk classifies
                                               │ — applies policy
                                               │ — calls Google API
                                               │ — sanitizes response
                                               ▼
                                              Bot ← sanitized result
                                              
                                              Google Calendar (mediated)
```

The "fake calendar" version would add another hop (bot → fake → mediator → real) without buying anything that the typed tool surface + mediator doesn't already provide.

## What sanitization actually means at the tool boundary

### Inbound (agent → external service)

For any string the agent passes to a tool, the sidecar applies:

- **Length cap** (e.g. event summary max 200 chars, description max 4000)
- **ASCII / Unicode normalization** — reject zero-width, RTL override, homoglyph attacks
- **URL stripping** (or allowlist) — most calendar fields shouldn't contain URLs
- **Template-marker removal** — strip `{{...}}`, `${...}`, `<%...%>` patterns
- **HTML / Markdown stripping** — convert to plain text
- **Injection-pattern detection** — flag strings containing "ignore previous", "system override", role markers, etc. (same patterns vault-proxy could log on outbound traffic)
- **Whole-string injection scanning** — pass through a small classifier (or a Claude Haiku call) for sanity check on long-form content

For numeric / structured args:

- Type checking + range checking (date ranges, count limits, enum validation)
- Cross-reference checking (does this event_id exist? does this delete target belong to this user?)

### Outbound (external service → agent)

For any data returned to the agent from an external service:

- **All the inbound rules apply in reverse** — the response data could be attacker-controlled (e.g. you queried Calendar for events; one event's description was added by an attacker who has your email; that description now reaches the agent as an injection)
- **Strip URLs from response by default** — agents don't need to follow URLs from external content
- **Strip rich metadata** the agent doesn't need (attendee emails, attachment URLs, organizer details — abstract these to {summary, start, end})
- **Embed provenance markers** — wrap external content as `<external-data source="google-calendar">{content}</external-data>` so the agent's training-time injection-defense recognizes the source

This last point is the **real Moltbook + ClawHub design challenge**: feed content + skill descriptions are inherently attacker-controlled. They MUST be sanitized before reaching the agent. vault-pioneer (for Moltbook) and vault-forge (for ClawHub) already do this in shape; the patterns documented here apply to extend their sanitization rules.

## Risk classification — the heart of the dynamic shell

Per-tool, per-call risk scoring determines policy:

| Risk | Examples | Default policy |
|---|---|---|
| **LOW** | Read-only queries, single-event creation in expected format, queries for own data | Auto-execute, log to security monitor |
| **MEDIUM** | Modifications to existing data, bulk operations within reasonable bounds, recurring events, calls with unusual but plausible params | Execute + send Telegram notification ("I just added X to your calendar — tap if this wasn't you") |
| **HIGH** | Destructive operations (delete event, cancel meeting), bulk operations beyond bounds, calls with suspicious patterns (URLs in unusual fields, unicode tricks, very long strings), confidential-content disclosure | Block pending explicit user approval via Telegram tap or app-level confirmation |

Risk score is computed from:

- The tool being called (delete = baseline higher than read)
- Parameter shape (URL in summary field = +risk; very long description = +risk)
- Frequency / recency (5 events in 1 minute = +risk)
- User's pre-set trust level for this tool (configurable in the host app's Preferences)
- Static rules (specific protected event_ids; specific blocked recipients for email)

This IS the "dynamic shell" the project's USP describes — but applied at the per-tool-call layer, not as a discrete shell-level switch.

## What this means for the existing perimeter

The current 4-container perimeter (`vault-agent`, `vault-proxy`, `vault-forge`, `vault-pioneer`) already implements parts of this:

- `vault-proxy`: outbound API mediation. Already does URL allowlist, key injection, response redaction (after the bot-token redaction patch). Could grow risk-classification + per-call rate limiting.
- `vault-forge`: inbound skill mediation. Scans skills before delivery. Already implements the sanitization-before-agent-sees pattern.
- `vault-pioneer`: inbound social-feed mediation. Filters Moltbook content. Same pattern.

What's missing for the v1.0+ feature surface:

- `vault-calendar` (planned) — Google Calendar mediator
- `vault-voice` (planned) — Twilio + TTS + STT mediator
- `vault-email` (future) — IMAP/SMTP mediator
- `vault-smart-home` (future) — Home Assistant or HomeKit mediator
- `vault-banking` (probably never — too high stakes for AI mediation)

Each follows the same pattern. Each is a few-day project once the first one is shipped.

## Specifically: how the contained bot schedules an appointment

User asks: *"How would this contained bot now be able to schedule appointments?"*

Concrete path:

1. **Bot has `calendar.add_event` tool** in its toolset (added when vault-calendar is brought up). Tool description tells the bot what args to pass.
2. **User sends Telegram message**: "Schedule dentist for Tuesday 4pm."
3. **Bot reasons**: "I should call calendar.add_event with summary='Dentist', start='2026-04-28T16:00...', duration=60min."
4. **Bot calls the tool** through OpenClaw's tool dispatch.
5. **vault-calendar receives the request** via agent-net (HTTP, locally in the perimeter).
6. **vault-calendar sanitizes**:
   - Summary: "Dentist" (3 chars, ASCII, no URL, no template) — passes
   - Start: parses to valid future ISO datetime — passes
   - Duration: 60 minutes (within max-event-length policy) — passes
7. **vault-calendar classifies risk**:
   - Single event in normal format = LOW risk
   - User has pre-approved "auto-create up to 5 events/day" policy
   - Today's quota: 0/5 used
   - Verdict: AUTO-EXECUTE
8. **vault-calendar calls Google Calendar API** using the OAuth token it holds. Token never leaves vault-calendar.
9. **Google returns** event_id, status, possibly other data.
10. **vault-calendar sanitizes response**:
    - Returns `{event_id: "abc123", status: "added"}` to the bot
    - Strips: organizer email, hangout link, htmlLink, attendee emails, attachment URLs
11. **Bot tells user via Telegram**: "Done — added Dentist for Tuesday at 4 PM."
12. **(In parallel) host app's security monitor** logs the event creation; user can review the activity feed on the home dashboard.

Now imagine instead: user asks the bot to delete all events in the next 30 days. Same flow but step 7 hits HIGH risk:

- Tool: delete (high baseline)
- Bulk: 30 days = many events (very high)
- Verdict: BLOCK-PENDING-APPROVAL
- vault-calendar sends Telegram message: "Bot wants to delete all 23 events in your calendar through May 25. Tap YES to allow, NO to refuse."
- User sees the request out-of-band, taps NO
- vault-calendar refuses the operation, returns `{denied: true, reason: "user did not approve"}` to the bot
- Bot reports to user: "I tried to delete those events but you didn't approve. Anything I should do differently?"

This is the **dynamic intelligent shell** functioning end-to-end.

## What's the cost (latency, complexity, money)?

You raised this — "tasks may take longer and need an extra API token to pay for our wrapper's parsing and reasoning work."

Yes:

- **Latency**: each tool call adds ~50-200ms for the sidecar mediation (parameter sanitize, risk classify, policy apply). For HIGH-risk operations requiring user approval, latency is bounded by user response time (could be minutes).
- **Money**: classification and sanitization can be heuristic for most cases (no LLM needed). For ambiguous content, optional Claude Haiku call to classify ($0.0001 per call typical). Voice operations carry Twilio + TTS/STT vendor costs (~$0.05-0.20 per call). Calendar operations are free (Google API has generous free tier).
- **Complexity**: each new sidecar is ~500-1500 LOC plus a Containerfile. Mediator policy is a few hundred lines per capability. One person can build a sidecar in a week.

The cost is **proportional to the value of the security guarantee**. For a non-technical user who could lose their calendar, contacts, or money to a single prompt-injection, the mediation overhead is invisible compared to the loss. For developers who'd find the mediation annoying, the same architecture lets them disable specific risk policies (auto-approve everything in their workspace).

## Open questions to resolve before building vault-calendar

1. **Where do user policies live?** Tauri stronghold? Per-sidecar config file? Centralized policy service?
2. **Approval UI for HIGH-risk operations**: Telegram inline keyboard (works but limited UX), or push to host app's GUI (richer UX, requires app foreground)?
3. **Audit log destination**: vault-proxy's existing JSONL stream (single source of truth), or per-sidecar logs aggregated by the host?
4. **Sanitizer rules — declarative or imperative?** YAML-driven rules with a generic engine, or per-sidecar Python code? Declarative is more reviewable; imperative is more flexible.
5. **What happens during sidecar downtime?** Bot's tool call gets `{error: "calendar service unavailable"}` and reports gracefully; or queues until the sidecar comes back? Latter is more user-friendly but adds state.

These are tractable. None block the design pattern itself.

## Summary

You're correct that every tool is an attack surface and that the wrapper architecture needs to scale across all of them. The good news:

- The **pattern already exists** (vault-proxy, vault-forge, vault-pioneer); generalize it.
- The **right abstraction is typed tools + per-call mediation**, not fake mirrors of external services.
- The **dynamic shell** is realized through risk classification + per-call policy, not as a discrete on/off switch.
- The cost is bounded and proportional to safety value.

This spec is the design rule: **every external capability = its own sidecar with the mediation pattern**. Apply it to vault-calendar (next), vault-voice (after), and every future capability.
