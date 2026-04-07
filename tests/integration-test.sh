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
section "1. Clearance Report Contract (forge -> vault)"
# =============================================================================

TEST_SKILL="api-dev"
SKILL_DIR="$FORGE/skills/$TEST_SKILL"
REPORT="$SKILL_DIR/clearance-report.json"

# 1.1: Certify produces a clearance report
if make -C "$FORGE" certify SKILL="$TEST_SKILL" > /dev/null 2>&1; then
  if [[ -f "$REPORT" ]]; then
    pass "1.1 make certify produces clearance-report.json"
  else
    fail "1.1 make certify succeeded but clearance-report.json missing"
  fi
else
  fail "1.1 make certify failed for $TEST_SKILL"
fi

# 1.2: Report has required fields
if [[ -f "$REPORT" ]]; then
  FIELDS_OK=$(python3 -c "
import json, sys
with open('$REPORT') as f:
    r = json.load(f)
required = ['skill', 'version', 'checksum']
nested = [('scan','status'), ('scan','critical'), ('verify','verdict')]
ok = True
for k in required:
    if k not in r:
        print(f'missing top-level: {k}', file=sys.stderr)
        ok = False
for section, key in nested:
    if section not in r or key not in r[section]:
        print(f'missing {section}.{key}', file=sys.stderr)
        ok = False
print('OK' if ok else 'FAIL')
" 2>/dev/null)
  if [[ "$FIELDS_OK" == "OK" ]]; then
    pass "1.2 Report has all required fields"
  else
    fail "1.2 Report missing required fields"
  fi
else
  fail "1.2 Report file not available (skipped)"
fi

# 1.3: Report field types are correct
if [[ -f "$REPORT" ]]; then
  TYPES_OK=$(python3 -c "
import json, sys
with open('$REPORT') as f:
    r = json.load(f)
ok = True
if not isinstance(r['scan']['status'], str):
    print('scan.status not string', file=sys.stderr); ok = False
if not isinstance(r['scan']['critical'], int):
    print('scan.critical not int', file=sys.stderr); ok = False
if not isinstance(r['checksum'], str) or not r['checksum'].startswith('sha256:'):
    print('checksum not sha256: prefixed', file=sys.stderr); ok = False
print('OK' if ok else 'FAIL')
" 2>/dev/null)
  if [[ "$TYPES_OK" == "OK" ]]; then
    pass "1.3 Report field types correct (string, int, sha256: prefix)"
  else
    fail "1.3 Report field types incorrect"
  fi
else
  fail "1.3 Report file not available (skipped)"
fi

# 1.4: Checksum matches actual SKILL.md hash
if [[ -f "$REPORT" ]]; then
  CHECKSUM_OK=$(python3 -c "
import json, hashlib
with open('$REPORT') as f:
    r = json.load(f)
stored = r['checksum'].replace('sha256:', '')
with open('$SKILL_DIR/SKILL.md', 'rb') as f:
    actual = hashlib.sha256(f.read()).hexdigest()
print('OK' if stored == actual else 'FAIL')
" 2>/dev/null)
  if [[ "$CHECKSUM_OK" == "OK" ]]; then
    pass "1.4 Checksum matches SKILL.md content"
  else
    fail "1.4 Checksum mismatch (report stale or tampered)"
  fi
else
  fail "1.4 Report file not available (skipped)"
fi

# 1.5: Pattern count matches actual patterns.sh
if [[ -f "$REPORT" ]]; then
  report_count=$(jq '.scan.pattern_count' "$REPORT" 2>/dev/null)
  actual_count="$(grep -v '^#' "$FORGE/tools/lib/patterns.sh" | grep -v '^\s*$' | grep -c '|')"
  if [[ "$report_count" == "$actual_count" ]]; then
    pass "1.5 Pattern count matches ($actual_count patterns)"
  else
    fail "1.5 Pattern count mismatch: report=$report_count, actual=$actual_count"
  fi
else
  fail "1.5 Report file not available (skipped)"
fi

# 1.6: Export packages required files
EXPORT_DIR="$FORGE/exports/$TEST_SKILL"
if make -C "$FORGE" export SKILL="$TEST_SKILL" > /dev/null 2>&1; then
  EXPORT_OK=true
  for f in "$EXPORT_DIR/SKILL.md" "$EXPORT_DIR/clearance-report.json" "$EXPORT_DIR/.trust"; do
    if [[ ! -f "$f" ]]; then
      EXPORT_OK=false
      break
    fi
  done
  if [[ "$EXPORT_OK" == true ]]; then
    pass "1.6 Export contains SKILL.md + clearance-report.json + .trust"
  else
    fail "1.6 Export missing required files"
  fi
  # Clean up
  rm -rf "$EXPORT_DIR"
else
  fail "1.6 make export failed for $TEST_SKILL"
fi

# Clean up certify artifacts
rm -f "$REPORT"

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
