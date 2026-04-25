#!/usr/bin/env python3
"""Ad-hoc chat with the bot via Telegram Client API — no pytest.

Usage:
    cd tests/e2e-telegram
    source .venv/bin/activate
    python chat.py "your message here"

Uses the cached Telethon session to send the message to $BOT_HANDLE, wait
for the reply(s), and print them. Great for exploratory "what can the bot
actually do" sessions without the pytest overhead.

Counts toward the shared Telegram account's daily send budget (50/day).
No [TEST] prefix — looks like a real user message in chat history.
"""
from __future__ import annotations

import asyncio
import os
import sys
import time
from pathlib import Path

from dotenv import load_dotenv
from telethon import TelegramClient, events


REPO_ROOT = Path(__file__).resolve().parents[2]
load_dotenv(REPO_ROOT / ".env.test")


async def chat(message: str, timeout: float = 180.0, settle_s: float = 2.5) -> None:
    client = TelegramClient(
        session=os.environ["TELEGRAM_SESSION_PATH"],
        api_id=int(os.environ["TELEGRAM_API_ID"]),
        api_hash=os.environ["TELEGRAM_API_HASH"],
    )
    await client.start(phone=os.environ["TELEGRAM_PHONE"])
    bot = await client.get_entity(os.environ["BOT_HANDLE"])

    received: list[tuple[str, float]] = []
    first_reply = asyncio.Event()

    @client.on(events.NewMessage(from_users=bot))
    async def _handler(event):  # noqa: ARG001
        received.append((event.message.message or "", time.time()))
        first_reply.set()

    print(f">>> USER: {message}", flush=True)
    sent_at = time.time()
    await client.send_message(bot, message)

    try:
        await asyncio.wait_for(first_reply.wait(), timeout=timeout)
    except asyncio.TimeoutError:
        print(f"(timeout: no reply within {timeout}s)", flush=True)
        await client.disconnect()
        return

    # Let any continuation messages arrive in a settle window.
    await asyncio.sleep(settle_s)
    client.remove_event_handler(_handler)

    print(f"\n<<< BOT ({len(received)} message{'s' if len(received) > 1 else ''}, "
          f"first reply in {received[0][1] - sent_at:.1f}s):\n", flush=True)
    for i, (msg, _) in enumerate(received):
        if i > 0:
            print("\n--- (continuation) ---\n", flush=True)
        print(msg, flush=True)

    await client.disconnect()


def main() -> None:
    if len(sys.argv) < 2:
        print("usage: python chat.py \"your message\"", file=sys.stderr)
        sys.exit(2)
    message = " ".join(sys.argv[1:])
    asyncio.run(chat(message))


if __name__ == "__main__":
    main()
