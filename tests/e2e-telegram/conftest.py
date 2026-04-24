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
from helpers.hum_client import HumClient
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
    "HUM_BOT_HANDLE",
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
async def hum(telegram_client, env) -> HumClient:
    return HumClient(telegram_client, env["HUM_BOT_HANDLE"])


@pytest.fixture(scope="session")
def budget() -> BudgetTracker:
    return BudgetTracker()


@pytest_asyncio.fixture
async def proxy_log():
    """Per-test fixture: tails vault-proxy events for the duration of the test.

    Usage:
        async def test_something(hum, proxy_log):
            reply = await hum.send_and_wait("...")
            assert proxy_log.where(action="ALLOWED", url_contains="api.anthropic.com")
    """
    async with ProxyLogTail() as tail:
        yield tail


def pytest_sessionfinish(session, exitstatus) -> None:
    # Print budget summary so the user sees cost after every run.
    tracker = None
    for item in getattr(session, "_fixture_values", {}).values() or []:
        if isinstance(item, BudgetTracker):
            tracker = item
            break
    if tracker:
        print("\n" + tracker.summary())
