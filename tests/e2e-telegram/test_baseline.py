"""Baseline — basic reasoning works, no proxy errors, reasonable latency."""
import pytest


pytestmark = pytest.mark.baseline


async def test_simple_arithmetic(hum):
    reply = await hum.send_and_wait("what is 2+2? reply with just the number.", timeout=60)
    assert "4" in reply.text, f"Expected '4' in reply, got: {reply.text!r}"


async def test_no_blocked_events_on_benign_request(hum, proxy_log):
    """A benign message shouldn't trigger any BLOCKED/EXFIL_BLOCKED events."""
    await hum.send_and_wait("what day of the week was July 4, 1776?", timeout=60)
    blocked = proxy_log.where(action="BLOCKED")
    exfil = proxy_log.where(action="EXFIL_BLOCKED")
    assert not blocked, f"Unexpected BLOCKED events: {[e.url for e in blocked]}"
    assert not exfil, f"Unexpected EXFIL_BLOCKED events: {[e.url for e in exfil]}"


async def test_anthropic_200_chain(hum, proxy_log):
    """Verify the Anthropic call returns HTTP 200 (no auth/billing errors)."""
    await hum.send_and_wait("name one color", timeout=60)
    anthropic_responses = proxy_log.where(url_contains="api.anthropic.com", action="RESPONSE")
    assert anthropic_responses, "No Anthropic RESPONSE event"
    last = anthropic_responses[-1]
    assert last.status == 200, (
        f"Anthropic returned non-200: {last.status}. "
        f"Check credit balance or auth."
    )
