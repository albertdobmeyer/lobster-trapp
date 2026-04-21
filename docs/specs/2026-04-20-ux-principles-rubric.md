# UX Principles Rubric for Non-Technical Users

**Date:** 2026-04-20
**Scope:** The Lobster-TrApp desktop GUI
**Purpose:** A scoring tool, not a manifesto. Use this to audit screens and prioritize rebuilds.

---

## How to Use This Document

1. **When auditing a screen:** Walk through it as a non-technical user. For each principle, score 0–10 using the rubric below.
2. **When building a new screen:** Read the principles first. Run through the test questions before writing a single string.
3. **When prioritizing work:** Sort screens by aggregate score. Rebuild the lowest-scoring ones first.

**Don't treat every principle as equally weighted.** Principle 1 (no plumbing) is load-bearing — a 3/10 there is worse than a 3/10 on Principle 10.

---

## The Scoring Scale

| Score | Meaning |
|-------|---------|
| **10** | Exemplary. This screen could teach the principle to another team. |
| **7–9** | Good. Applies the principle with minor, easily-fixed gaps. |
| **4–6** | Partial. Applies the principle in places but has noticeable violations. |
| **1–3** | Fails. Violates the principle in a way that would confuse a real user. |
| **N/A** | Principle doesn't apply to this screen (e.g. no forms → Principle 8 is N/A). |

---

## The 10 Principles

### Principle 1: Never expose the plumbing

**The rule:** Internal architecture — containers, proxies, submodules, manifests, compose files, component IDs, seccomp, port numbers — never appears in user-facing text.

**Why:** Karen doesn't know what a container is and shouldn't need to. The product is an AI assistant, not a container orchestrator.

**Test question:** *If I stripped every sentence from this screen into a text file and showed it to my retired aunt, would she encounter a word she has to Google?*

**Exemplary (10/10):** Screen uses only words a Facebook user would recognize. No exceptions.
**Failing (1–3/10):** Screen shows container names, exit codes, file paths, or IDs.

---

### Principle 2: Outcomes over mechanisms

**The rule:** Describe what happened for the user, not what the system did internally.

**Why:** "24/24 checks passed" is a mechanism. "Your assistant is safe to use" is an outcome. The user cares about the latter.

**Test question:** *Does each status message answer "what does this mean for me?" rather than "what did the code do?"*

**Good examples:**
- "Your assistant is running safely" (outcome) — not "vault-agent container is up" (mechanism)
- "Ready to go" (outcome) — not "exit code 0" (mechanism)

**Failing:** Progress bars showing "Running cargo build...", status saying "exit 1".

---

### Principle 3: Every error tells the user what to do next

**The rule:** No error message is complete until it tells the user the next action to take.

**Why:** "Error: Tauri IPC not available" is a dead end. "This usually works on a second try — click Try Again" is a path forward.

**Test question:** *For every error message on this screen, can the user tell me, in one sentence, what they should do next?*

**Good:** "Didn't finish cleanly — this usually works on a second try."
**Bad:** "Error: ENOENT", "Something went wrong".

---

### Principle 4: Normalize transient failures

**The rule:** First-attempt failures that are commonly transient (timing, network blips) should be **reassuring**, not alarming.

**Why:** Red banners + "ERROR" screaming make Karen think she broke the app. Calm language + "this is normal" + Try Again keeps her going.

**Test question:** *If the first attempt fails with a race condition, does the UI make the user anxious or confident?*

**Good:** Amber icon + "Didn't finish cleanly — this usually works on a second try" + blue "Try Again" button.
**Bad:** Red X + "FAILED (exit 1)" + stack trace.

---

### Principle 5: Progressive disclosure

**The rule:** Show the minimum the user needs by default. Hide power-user details behind labeled toggles.

**Why:** 90% of users never need to see build logs, commands, or configs. The 10% who do should be able to find them — but not have them dumped on them by default.

**Test question:** *Can a first-time user complete the task without ever seeing developer details?*

**Good:** "Show details" toggle, "Developer Tools" collapsible section.
**Bad:** Terminal output shown by default, all configs visible on page load.

---

### Principle 6: Role-based labels, not component names

**The rule:** Users see what things DO, not what they're CALLED internally.

**Why:** "OpenClaw Vault" is a codename that means nothing. "My Assistant" describes the thing's role in the user's life.

**Test question:** *Is every label a word the user would use to describe the thing, not a word we invented?*

**Good:** "My Assistant", "Skills", "Network", "App Data Location".
**Bad:** "OpenClaw Vault", "ClawHub Forge", "Moltbook Pioneer", "Monorepo Path".

---

### Principle 7: Status text is a sentence, not a state token

**The rule:** Status text reads like a sentence fragment a human would say, not like a machine state.

**Why:** "success", "done", "failed" are state tokens. "Ready to go", "Something isn't connecting" are sentences.

**Test question:** *Could each status message end with a period and sound like something a friendly person would say?*

**Good:** "Ready to go", "Setting up...", "Waiting for Telegram."
**Bad:** "SUCCESS", "STATE: RUNNING", "status=ok".

---

### Principle 8: Forms guide, don't interrogate

**The rule:** Every input field has (a) a plain-language label, (b) a short hint about *why* it's needed, and (c) either an example or a link to create the thing.

**Why:** "Anthropic API Key: ___" is interrogation. "Anthropic API Key: ___ Powers your AI assistant. Get one at console.anthropic.com" is guidance.

**Test question:** *For every input, could the user answer "why is this being asked?" and "where do I get this?" without leaving the screen?*

**Good:** Every field has a one-line purpose + a "Get one at…" link.
**Bad:** Labels alone, no placeholders, no hints, no links.

---

### Principle 9: Loading states have context

**The rule:** Every spinner has a sentence explaining what the app is doing, not just "Loading...".

**Why:** A spinner with no text is anxiety. A spinner with "Checking your computer..." tells the user the app is working for them.

**Test question:** *For every loading state, can the user tell a friend what the app is currently doing?*

**Good:** "Checking your computer...", "Setting up your assistant...".
**Bad:** Bare spinner, "Loading...", "Please wait...".

---

### Principle 10: Safe by default

**The rule:** Destructive actions (delete, reset, stop) require extra effort. The default path is always non-destructive.

**Why:** A user who clicks the wrong button by accident should be able to recover. Destructive actions should be amber or red and behind a confirmation if they can't be undone.

**Test question:** *If the user clicks every visible button in random order, can they destroy their setup?*

**Good:** "Stop Assistant" in caution-yellow, "Reset" behind a toggle.
**Bad:** "Delete All" as the primary blue button.

---

## Score Matrix (13 Screens × 10 Principles)

Scored 2026-04-20 after the Phase B/C frontend reframe.

| # | Screen | P1 | P2 | P3 | P4 | P5 | P6 | P7 | P8 | P9 | P10 | Avg |
|---|--------|----|----|----|----|----|----|----|----|----|----|-----|
| 1 | Setup: Welcome | 10 | 10 | N/A | N/A | N/A | 10 | 10 | N/A | N/A | 10 | **10.0** |
| 2 | Setup: System Check | 7 | 7 | 8 | 8 | 7 | 8 | 8 | N/A | 9 | 10 | **8.0** |
| 3 | Setup: Assistant Modules | 8 | 8 | 7 | 7 | 9 | 8 | 9 | N/A | N/A | 10 | **8.3** |
| 4 | Setup: Configuration | 7 | 8 | 7 | 6 | 9 | 6 | 8 | 9 | N/A | 9 | **7.7** |
| 5 | Setup: Setting Up Your Assistant | 6 | 6 | 8 | 9 | 8 | 9 | 8 | N/A | 9 | 10 | **8.1** |
| 6 | Setup: Complete | 10 | 10 | N/A | N/A | N/A | 10 | 10 | N/A | N/A | 10 | **10.0** |
| 7 | Dashboard | 10 | 9 | N/A | N/A | 8 | 10 | 9 | N/A | 8 | 10 | **9.1** |
| 8 | Component Detail (Assistant) | 8 | 7 | 6 | N/A | 9 | 9 | 8 | N/A | 7 | 8 | **7.8** |
| 9 | Component Detail (Skills) | 7 | 6 | N/A | N/A | 8 | 9 | 8 | N/A | 7 | 10 | **7.6** |
| 10 | Component Detail (Network) | 9 | 9 | N/A | N/A | 10 | 10 | 10 | N/A | N/A | 10 | **9.7** |
| 11 | Settings | 8 | 7 | N/A | N/A | 9 | 9 | 8 | 6 | N/A | 9 | **8.0** |
| 12 | 404 Page | 10 | 10 | 10 | N/A | N/A | N/A | 10 | N/A | N/A | 10 | **10.0** |
| 13 | ErrorBoundary | 7 | 5 | 7 | 6 | 4 | N/A | 8 | N/A | N/A | 9 | **6.6** |

**N/A means the principle doesn't apply** (no forms on a 404 page, no loading on the complete step, etc.).

---

## Priority Ranking (Lowest Score = Rebuild First)

### Tier 1 — Rebuild soon (score < 7.5)

**#13 ErrorBoundary — 6.6**
Issues:
- Shows raw `error.message` to the user (developer jargon leak)
- "Something went wrong" doesn't say what broke or what to do
- Hard to recover — only offers "Try again" and "Dashboard" without explaining when each applies

Concrete fixes:
- Map common error types (network, Tauri IPC, permission) to friendly sentences
- Hide `error.message` behind a "Show technical details" toggle
- Add contextual advice: "If this keeps happening, try restarting the app."

---

### Tier 2 — Polish pass (score 7.5 – 8.5)

**#9 Skills detail page — 7.6**
Issues:
- Shows raw "skill count" and pattern counts without explaining significance
- "Developer Tools" label is good but the content inside is entirely developer-facing
- No clear action for the user beyond "scan" — what does scanning DO for them?

Fix: Add a user-facing summary ("25 skills installed, all clean. Last checked 2 minutes ago") and an "Install new skill" flow for when ClawHub is integrated.

---

**#4 Configuration step — 7.7**
Issues:
- Heading is "Configuration" — clinical. Should be "Connect Your Accounts" or "Add Your Keys".
- Shows missing config files as raw paths (`.env`) — violates P1
- Uses raw `component_name` field which could surface "OpenClaw Vault" if mapping is missing
- When keys are loaded from existing file, no confirmation toast

Fix: Rename heading, route `component_name` through the role-based label function, hide file paths behind a "Show file details" toggle.

---

**#8 Component Detail (Assistant) — 7.8**
Issues:
- "Actions" header is clinical — could be "What you can do"
- When not_setup, no breadcrumb back to the wizard
- Security badge shows on-hover detail that's technical

Fix: Rename section headers in a conversational voice, add a "Set up now" button when in not_setup state.

---

**#2 System Check — 8.0**
Issues:
- When Podman is missing, shows `sudo apt install podman podman-compose` — terminal jargon leak (P1)
- "Continue anyway" is ambiguous — continue to what? With what risks?
- Install guidance for macOS/Windows is a download link but no friendly wording

Fix: Replace terminal commands with "We'll help you install the missing piece — click here" and open platform-appropriate guidance. Reword "Continue anyway" to "Skip this for now (not recommended)".

---

**#11 Settings — 8.0**
Issues:
- "App Data Location" field is good but no user would know when they'd need to change it. Needs context: "Advanced — leave empty unless your admin told you otherwise."
- Form doesn't have a save confirmation for simple changes
- "Re-run Setup Wizard" is fine but no warning that this will take you through configuration again

Fix: Add "Advanced" tag to App Data Location, hide it behind a toggle, improve feedback on save.

---

**#5 Setting Up Your Assistant — 8.1**
Issues:
- The row status text only shows one line — when setup is actually running, the user has no sense of progress (no "Step 3 of 12" or time estimate)
- The "Something went wrong" messaging was improved (Fix 2) but still no specific guidance for KNOWN failure modes (e.g. "proxy not ready yet — common on slow machines")

Fix: Add step-based progress ("Building container... Installing dependencies... Running security checks..."), detect common failure patterns from stream output and show targeted guidance.

---

**#3 Assistant Modules — 8.3**
Issues:
- "Installed" / "Partially installed" / "Not installed" is good but doesn't explain the difference
- "Install Missing Modules" button is fine but doesn't say how long it'll take

Fix: Add hover tooltips or inline explanations for partial install state, show an estimated time on install button.

---

### Tier 3 — Already strong (score 8.5+)

#7 Dashboard (9.1), #10 Network placeholder (9.7), #1 Welcome (10), #6 Complete (10), #12 404 (10).

These don't need rebuilds. If we touch them, it should be for feature additions (e.g. real-time status on the dashboard), not UX fixes.

---

## Recommended Next Pass

**If we have 2 hours:** Rebuild ErrorBoundary (Tier 1). That's the one thing a non-technical user will encounter when something breaks, and it's our weakest screen.

**If we have 4 hours:** Tier 1 + Configuration step (#4). Configuration is in the critical path — every new user goes through it, and it has three fixable issues.

**If we have a day:** All of Tier 1 + Tier 2. That would bring every screen above 8.5/10.

**If we have a week:** Add Principle 11 — "Every screen has a clear primary action" — and audit against that. We'd find more work.

---

## Anti-Patterns Observed But Already Fixed

Keeping this as a reference for what NOT to do:

- ❌ "OpenClaw Orchestrator" subtitle in sidebar → Removed
- ❌ "COMPONENTS" section header → Removed
- ❌ "Monorepo Path" in Settings → "App Data Location"
- ❌ "Checking prerequisites..." → "Checking your computer..."
- ❌ "Container runtime" → "Secure sandbox"
- ❌ "Component submodules" → "Assistant modules"
- ❌ "Cloned but missing component.yml" → "Partially installed"
- ❌ "Clone All Submodules" → "Install Missing Modules"
- ❌ "Something went wrong — click Retry" → "Didn't finish cleanly — this usually works on a second try"
- ❌ "Retry" (amber) → "Try Again" (blue, primary action color)

These were caught in three ways: walkthrough audits with the Karen persona, the 19-term banned list in `app/e2e/user-facing.spec.ts`, and reviewing screenshots after each change. Future work should use all three techniques.

---

## How to Use This Rubric for New Work

Before shipping any new screen:

1. **Read the 10 principles** — don't skim, read.
2. **Score the screen** against each principle. Write the score in a PR comment.
3. **Any score below 7 blocks shipping.** Fix or justify.
4. **Add new banned terms** to `app/e2e/user-facing.spec.ts` if you find any during the audit.
5. **If a new principle emerges** from the audit, add it here as Principle 11, 12, etc.
