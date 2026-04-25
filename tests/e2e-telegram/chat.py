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


async def chat(
    message: str,
    timeout: float = 180.0,
    idle_s: float = 4.0,
    max_idle_wait: float = 240.0,
) -> None:
    """
    Send a message to the bot and capture the full streamed reply.

    Replaces the old fixed-settle approach with an idle-timer: after the first
    reply, keep listening until `idle_s` elapse with no new messages, OR until
    `max_idle_wait` total seconds have elapsed since the first reply
    (safety upper bound). This handles long-form responses that stream as
    many Telegram messages over minutes (per F10 from VERDICT-2026-04-25.md).

    Args:
        message: text to send (no [TEST] prefix; chat.py is for ad-hoc
                 user-impersonation, not test-prefixed messages)
        timeout: max seconds to wait for the FIRST reply
        idle_s: required silence after last message to declare "stream done"
        max_idle_wait: hard upper bound on total wait after first reply
    """
    client = TelegramClient(
        session=os.environ["TELEGRAM_SESSION_PATH"],
        api_id=int(os.environ["TELEGRAM_API_ID"]),
        api_hash=os.environ["TELEGRAM_API_HASH"],
    )
    await client.start(phone=os.environ["TELEGRAM_PHONE"])
    bot = await client.get_entity(os.environ["BOT_HANDLE"])

    received: list[tuple[str, float]] = []
    first_reply = asyncio.Event()
    last_message_at: list[float] = [0.0]  # mutable container so handler can update

    @client.on(events.NewMessage(from_users=bot))
    async def _handler(event):  # noqa: ARG001
        now = time.time()
        received.append((event.message.message or "", now))
        last_message_at[0] = now
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

    # Idle-timer drain: keep waiting until idle_s of silence, capped by max_idle_wait.
    first_reply_at = received[0][1]
    while True:
        now = time.time()
        time_since_last = now - last_message_at[0]
        time_since_first = now - first_reply_at
        if time_since_last >= idle_s:
            break
        if time_since_first >= max_idle_wait:
            print(f"(hit max_idle_wait {max_idle_wait}s — closing stream)", flush=True)
            break
        # Sleep just long enough to re-check after the next likely message
        await asyncio.sleep(min(idle_s - time_since_last + 0.1, 1.0))

    client.remove_event_handler(_handler)

    print(
        f"\n<<< BOT ({len(received)} message{'s' if len(received) > 1 else ''}, "
        f"first reply in {first_reply_at - sent_at:.1f}s, "
        f"stream ended after {time.time() - sent_at:.1f}s):\n",
        flush=True,
    )
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
