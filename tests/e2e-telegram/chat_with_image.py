#!/usr/bin/env python3
"""Send an image + caption to the bot via Telegram, capture the reply.

Usage:
    python chat_with_image.py <image_path> <caption>
"""
import asyncio
import os
import sys
import time
from pathlib import Path

from dotenv import load_dotenv
from telethon import TelegramClient, events


REPO_ROOT = Path(__file__).resolve().parents[2]
load_dotenv(REPO_ROOT / ".env.test")


async def chat_with_image(image_path: str, caption: str, timeout: float = 240.0,
                          settle_s: float = 3.0) -> None:
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

    print(f">>> USER (image: {image_path}): {caption}", flush=True)
    sent_at = time.time()
    await client.send_file(bot, image_path, caption=caption)

    try:
        await asyncio.wait_for(first_reply.wait(), timeout=timeout)
    except asyncio.TimeoutError:
        print(f"(timeout: no reply within {timeout}s)", flush=True)
        await client.disconnect()
        return

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
    if len(sys.argv) < 3:
        print("usage: python chat_with_image.py <image_path> <caption>", file=sys.stderr)
        sys.exit(2)
    asyncio.run(chat_with_image(sys.argv[1], " ".join(sys.argv[2:])))


if __name__ == "__main__":
    main()
