"""Anthropic spend sanity.

We don't have direct token-usage reporting in vault-proxy's log (only
request/response bytes). But we can:
  1. Observe that Anthropic responds 200 (not 400 billing error)
  2. Track approximate cost via the budget fixture if a future version of
     vault-proxy logs the usage object
  3. Ensure no runaway loops — a single question shouldn't trigger 50+
     Anthropic calls
"""
import pytest


pytestmark = pytest.mark.spending


async def test_single_question_single_anthropic_call(hum, proxy_log):
    """A single question should produce a small number of Anthropic calls.
    Runaway tool-use loops would make this balloon.
    """
    await hum.send_and_wait("count to 3", timeout=60)
    anthropic_calls = proxy_log.where(url_contains="api.anthropic.com", action="ALLOWED")
    # Anthropic tool-use can produce several calls per turn (one per tool
    # roundtrip). 5 is a generous upper bound for 'count to 3'.
    assert len(anthropic_calls) <= 5, (
        f"Unexpectedly many Anthropic calls for a trivial prompt: "
        f"{len(anthropic_calls)}. Possible tool-loop bug."
    )


async def test_no_billing_errors(hum, proxy_log):
    """HTTP 400 from Anthropic = billing / input validation error. Must
    not happen on a benign request once credits are loaded.
    """
    await hum.send_and_wait("what's the capital of France?", timeout=60)
    responses = proxy_log.where(url_contains="api.anthropic.com", action="RESPONSE")
    error_responses = [r for r in responses if r.status and r.status >= 400]
    assert not error_responses, (
        f"Anthropic returned {len(error_responses)} error responses: "
        f"{[(r.status, r.url) for r in error_responses]}"
    )
