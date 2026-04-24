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
    """Prove the request actually flowed through vault-proxy to Anthropic.

    Uses wait_for instead of where() so we poll briefly after send_and_wait
    returns — accommodates ~1s latency between vault-proxy writing the log
    line and the podman-logs tail subprocess delivering it to our reader.
    """
    await hum.send_and_wait("say hi in three words", timeout=45)
    anthropic_call = await proxy_log.wait_for(
        url_contains="api.anthropic.com", action="ALLOWED", timeout=10,
    )
    assert anthropic_call, "No api.anthropic.com call observed in proxy log"
    telegram_send = await proxy_log.wait_for(
        url_contains="/sendMessage", action="ALLOWED", timeout=10,
    )
    assert telegram_send, "No sendMessage observed — reply path broken"
