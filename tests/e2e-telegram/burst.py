#!/usr/bin/env python3
"""Send N messages in rapid succession from a single Telethon client to the
bot, capture all replies, and report ordering + coherence.

Usage:
    python burst.py
"""
import asyncio
import os
import time
from pathlib import Path

from dotenv import load_dotenv
from telethon import TelegramClient, events


REPO_ROOT = Path(__file__).resolve().parents[2]
load_dotenv(REPO_ROOT / ".env.test")


MESSAGES = [
    "BURST 1: What's 7 times 8?",
    "BURST 2: Spell 'echo' backwards.",
    "BURST 3: Name a primary color.",
    "BURST 4: Round 3.14159 to 2 decimal places.",
    "BURST 5: Write the word 'concurrent' in all caps.",
]


async def main() -> None:
    client = TelegramClient(
        session=os.environ["TELEGRAM_SESSION_PATH"],
        api_id=int(os.environ["TELEGRAM_API_ID"]),
        api_hash=os.environ["TELEGRAM_API_HASH"],
    )
    await client.start(phone=os.environ["TELEGRAM_PHONE"])
    bot = await client.get_entity(os.environ["BOT_HANDLE"])

    received: list[tuple[float, str]] = []

    @client.on(events.NewMessage(from_users=bot))
    async def _handler(event):  # noqa: ARG001
        received.append((time.time(), event.message.message or ""))

    print(f">>> sending {len(MESSAGES)} messages back-to-back without waiting for replies", flush=True)
    sent_at = time.time()
    for i, msg in enumerate(MESSAGES):
        await client.send_message(bot, msg)
        print(f"    [{i+1}] sent at +{time.time() - sent_at:.2f}s: {msg!r}", flush=True)

    print(f"\n>>> waiting up to 90s for replies...", flush=True)
    await asyncio.sleep(90)
    client.remove_event_handler(_handler)

    print(f"\n<<< received {len(received)} replies in {time.time() - sent_at:.1f}s total:\n", flush=True)
    for i, (when, text) in enumerate(received):
        print(f"--- reply {i+1} at +{when - sent_at:.2f}s ---", flush=True)
        print(text, flush=True)
        print(flush=True)

    await client.disconnect()


if __name__ == "__main__":
    asyncio.run(main())
