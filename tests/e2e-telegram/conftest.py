"""Pytest fixtures for the Telegram-driven e2e harness.

Run from `tests/e2e-telegram/`:
    source .venv/bin/activate
    pytest -xvs test_smoke.py

First run triggers interactive Telethon login (Telegram sends a code to the
user's Telegram app as a message from "Telegram"; paste it at the pytest
prompt). Session is cached at $TELEGRAM_SESSION_PATH for all subsequent
runs. See FIRST_RUN.md for the full one-time sequence.
"""
from __future__ import annotations

import os
from pathlib import Path

import pytest
import pytest_asyncio
from dotenv import load_dotenv
from telethon import TelegramClient

from helpers.budget import BudgetTracker
from helpers.bot_client import BotClient
from helpers.log_tail import ProxyLogTail


# Load .env.test from the repo root — not .env (that holds container
# credentials, not harness credentials). The session_scope fixture reads
# these via os.environ after load_dotenv.
_REPO_ROOT = Path(__file__).resolve().parents[2]
load_dotenv(_REPO_ROOT / ".env.test", override=True)


REQUIRED_ENV = [
    "TELEGRAM_API_ID",
    "TELEGRAM_API_HASH",
    "TELEGRAM_PHONE",
    "BOT_HANDLE",
    "TELEGRAM_SESSION_PATH",
]


@pytest.fixture(scope="session")
def env() -> dict[str, str]:
    missing = [k for k in REQUIRED_ENV if not os.environ.get(k)]
    if missing:
        pytest.fail(
            f".env.test missing required keys: {missing}. "
            f"Expected at {_REPO_ROOT / '.env.test'}"
        )
    return {k: os.environ[k] for k in REQUIRED_ENV}


@pytest_asyncio.fixture(scope="session", loop_scope="session")
async def telegram_client(env) -> TelegramClient:
    session_path = env["TELEGRAM_SESSION_PATH"]
    # Ensure parent dir exists with restrictive perms.
    Path(session_path).expanduser().parent.mkdir(mode=0o700, parents=True, exist_ok=True)
    client = TelegramClient(
        session=session_path,
        api_id=int(env["TELEGRAM_API_ID"]),
        api_hash=env["TELEGRAM_API_HASH"],
    )
    # start() prompts for the login code on first run; no-op on subsequent
    # runs when the session file exists.
    await client.start(phone=env["TELEGRAM_PHONE"])
    try:
        yield client
    finally:
        await client.disconnect()


@pytest_asyncio.fixture(scope="session", loop_scope="session")
async def bot(telegram_client, env) -> BotClient:
    return BotClient(telegram_client, env["BOT_HANDLE"])


@pytest.fixture(scope="session")
def budget() -> BudgetTracker:
    return BudgetTracker()


@pytest_asyncio.fixture(scope="session", loop_scope="session")
async def _session_proxy_tail():
    """Session-scoped raw tail. Runs throughout the pytest session so no
    events are missed to per-test subprocess spin-up latency.
    """
    async with ProxyLogTail() as tail:
        yield tail


@pytest_asyncio.fixture
async def proxy_log(_session_proxy_tail):
    """Per-test view over the session-scoped tail. Only surfaces events
    that appear AFTER the test starts, so negative assertions (e.g. "no
    BLOCKED events during this test") are meaningful regardless of what
    earlier tests triggered.

    Usage:
        async def test_x(bot, proxy_log):
            reply = await bot.send_and_wait("...")
            ev = await proxy_log.wait_for(url_contains="api.anthropic.com",
                                          action="ALLOWED", timeout=10)
            assert ev
    """
    view = _session_proxy_tail.view_from_now()
    yield view
    # Let the subprocess reader drain any in-flight events before the next
    # test marks its boundary.
    import asyncio
    await asyncio.sleep(0.5)


def pytest_sessionfinish(session, exitstatus) -> None:
    # Print budget + send-count summaries after every run.
    tracker = None
    bot_client = None
    for item in getattr(session, "_fixture_values", {}).values() or []:
        if isinstance(item, BudgetTracker):
            tracker = item
        if isinstance(item, BotClient):
            bot_client = item
    parts: list[str] = []
    if tracker:
        parts.append(tracker.summary())
    if bot_client:
        parts.append(
            f"Telegram sends: {bot_client.send_count}/{bot_client.daily_send_budget}"
        )
    if parts:
        print("\n" + "\n".join(parts))
