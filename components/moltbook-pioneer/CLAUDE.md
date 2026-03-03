# MoltBook Pioneer — Agent Social Network (Placeholder)

## What This Is

MoltBook Pioneer will be the **agent social network integration** for the OpenClaw ecosystem — enabling agents to post, follow, and interact on the Moltbook platform. It is currently a **placeholder** with no functionality.

**Role in ecosystem**: `placeholder` — the GUI renders a "Coming Soon" card automatically.

## Current State

This component has no code yet. The standalone repo at `B:\REPOS\local-llm\moltbook-pioneer\` is empty (no commits). In the lobster-trapp monorepo, it exists as a plain directory with `.gitkeep` and `component.yml` — it is NOT yet a git submodule.

## This Repo Is a Lobster-TrApp Component

The file `component.yml` defines the minimal placeholder manifest:
```yaml
identity:
  id: moltbook-pioneer
  name: Moltbook Pioneer
  version: "0.0.1"
  description: Agent social network integration (coming soon)
  role: placeholder
  icon: users
  color: "#a855f7"
```

### Manifest Contract Rules
- `identity.role` must be `placeholder` until real functionality exists
- Placeholder components must have NO commands, configs, or health probes
- The GUI renders placeholder components as muted "Coming Soon" cards

## When This Repo Gets Real Code

### Step 1: First Commit
Create initial files in the standalone repo (`B:\REPOS\local-llm\moltbook-pioneer\`), commit, and push.

### Step 2: Convert to Submodule
In the lobster-trapp root:
```bash
rm -rf components/moltbook-pioneer
git submodule add https://github.com/gitgoodordietrying/moltbook-pioneer.git components/moltbook-pioneer
```

### Step 3: Upgrade the Manifest
Change `role` from `placeholder` to the appropriate role and add sections:
```yaml
identity:
  role: network          # Changed from placeholder
status:
  states: [...]          # Define component states
  probes: [...]          # How to detect current state
commands: [...]          # What users can do
configs: [...]           # Editable config files
health: [...]            # Dashboard badges
```

### Step 4: Validate
```bash
bash tests/orchestrator-check.sh    # Must still pass with new manifest
cargo test -p lobster-trapp          # Rust parser must handle new manifest
```

## Manifest Template

When you're ready to add real functionality, use this as a starting point:

```yaml
identity:
  id: moltbook-pioneer
  name: Moltbook Pioneer
  version: "0.1.0"
  description: Agent social network integration
  role: network
  icon: users
  color: "#a855f7"
  repo: https://github.com/gitgoodordietrying/moltbook-pioneer.git

status:
  states:
    - id: connected
      label: Connected
      icon: wifi
      color: "#22c55e"
    - id: disconnected
      label: Disconnected
      icon: wifi-off
      color: "#6b7280"
  probes:
    - command: echo disconnected
      interval_seconds: 30
      timeout_seconds: 5
      rules:
        - stdout_contains: connected
          state: connected
  default_state: disconnected

commands:
  - id: setup
    name: Setup
    description: Configure Moltbook connection
    group: lifecycle
    type: action
    danger: safe
    command: make setup

configs: []
health: []
```

## What NOT to Do

- Do not change `identity.id` from `moltbook-pioneer`
- Do not add commands while `role` is still `placeholder` (the orchestrator test validates this)
- Do not create the submodule link until the repo has at least one commit
