#!/usr/bin/env bash
# =============================================================================
# Lobster-TrApp Cross-Module Integration Tests
# =============================================================================
# Validates operational seams between vault, forge, and pioneer:
#   - Clearance report contract (forge -> vault)
#   - Pattern export contract (pioneer -> vault)
#   - Cross-reference integrity
#   - Submodule health
#   - Orchestrator passthrough
#
# Complements orchestrator-check.sh (manifest/structure validation) with
# data contract validation (actual cross-module data flows).
#
# Usage: bash tests/integration-test.sh
# Dependencies: bash, python3, jq
# =============================================================================

set -euo pipefail

REPO_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
PASS=0
FAIL=0
WARN=0

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
BLUE='\033[0;34m'
NC='\033[0m'

pass() { PASS=$((PASS+1)); echo -e "  ${GREEN}[PASS]${NC} $1"; }
fail() { FAIL=$((FAIL+1)); echo -e "  ${RED}[FAIL]${NC} $1"; }
warn() { WARN=$((WARN+1)); echo -e "  ${YELLOW}[WARN]${NC} $1"; }
section() { echo -e "\n${BLUE}=== $1 ===${NC}"; }

cd "$REPO_ROOT"

VAULT="components/openclaw-vault"
FORGE="components/clawhub-forge"
PIONEER="components/moltbook-pioneer"

# =============================================================================
section "5. Orchestrator Passthrough"
# =============================================================================

# 5.1: Run orchestrator-check.sh silently
if bash tests/orchestrator-check.sh > /dev/null 2>&1; then
  pass "5.1 orchestrator-check.sh passes"
else
  fail "5.1 orchestrator-check.sh failed (run it standalone for details)"
fi

# 5.2: Each component.yml declares the expected role
ROLE_OK=true
for pair in "openclaw-vault:runtime" "clawhub-forge:toolchain" "moltbook-pioneer:network"; do
  comp="${pair%%:*}"
  expected="${pair##*:}"
  actual=$(python3 -c "
import yaml, sys
with open('components/$comp/component.yml') as f:
    d = yaml.safe_load(f)
print(d['identity']['role'])
" 2>/dev/null) || actual=""
  if [[ "$actual" != "$expected" ]]; then
    fail "5.2 $comp role is '$actual', expected '$expected'"
    ROLE_OK=false
  fi
done
if [[ "$ROLE_OK" == true ]]; then
  pass "5.2 All component roles correct (runtime, toolchain, network)"
fi

# =============================================================================
# Results
# =============================================================================
echo ""
echo -e "Results: ${GREEN}${PASS} passed${NC}, ${RED}${FAIL} failed${NC}, ${YELLOW}${WARN} warnings${NC}"
if [ "$FAIL" -gt 0 ]; then
  exit 1
fi
