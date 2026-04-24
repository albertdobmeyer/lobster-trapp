"""Smoke test — prove the full Telegram → OpenClaw → Anthropic → Telegram
chain works end-to-end. Run this first; if it fails, nothing else will.
"""
import pytest


pytestmark = pytest.mark.smoke


async def test_hum_responds_to_ping(hum):
    """Send a minimal message, assert a non-empty reply arrives."""
    reply = await hum.send_and_wait("ping", timeout=45)
    assert reply.text, "Hum returned empty reply"
    assert reply.latency_s < 45, f"Reply latency {reply.latency_s:.1f}s > 45s"


async def test_hum_round_trip_touches_proxy(hum, proxy_log):
    """Prove the request actually flowed through vault-proxy to Anthropic."""
    await hum.send_and_wait("say hi in three words", timeout=45)
    anthropic_calls = proxy_log.where(url_contains="api.anthropic.com", action="ALLOWED")
    assert anthropic_calls, "No api.anthropic.com call observed in proxy log"
    telegram_sends = proxy_log.where(url_contains="/sendMessage", action="ALLOWED")
    assert telegram_sends, "Hum did not call sendMessage — reply path broken"
