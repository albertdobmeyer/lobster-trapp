"""Thin wrapper over a Telethon client that sends to @LobsterTrappBot and
waits for Hum's reply. Every test message is prefixed with `[TEST]` so the
real Telegram chat stays legible and filterable.
"""
from __future__ import annotations

import asyncio
import time
from dataclasses import dataclass
from typing import AsyncIterator

from telethon import TelegramClient, events


@dataclass
class HumReply:
    text: str
    received_at: float
    latency_s: float


class HumClient:
    """One instance per test session. Bound to a fixed bot handle."""

    def __init__(self, telegram_client: TelegramClient, bot_handle: str) -> None:
        self.client = telegram_client
        self.bot_handle = bot_handle
        self._bot_entity = None

    async def _resolve_bot(self):
        if self._bot_entity is None:
            self._bot_entity = await self.client.get_entity(self.bot_handle)
        return self._bot_entity

    async def send_and_wait(
        self,
        message: str,
        *,
        timeout: float = 60.0,
        prefix: str = "[TEST] ",
        settle_ms: int = 500,
    ) -> HumReply:
        """Send a message to Hum and return its reply.

        timeout: overall deadline. Hum may take 2-10s to respond for simple
            questions, longer if it does multi-tool reasoning. Default 60s
            is safe for Haiku at default Claude speeds.
        prefix: prepended to the message. `[TEST] ` by default so chat history
            remains filterable. Set to "" to send a pristine message (useful
            for tests that need to simulate non-test traffic).
        settle_ms: after the first reply arrives, wait this long for follow-up
            messages (Hum sometimes sends a second bubble with continuation).
            If another message arrives in that window, it's concatenated.
        """
        bot = await self._resolve_bot()
        full = f"{prefix}{message}" if prefix else message

        received: list[tuple[str, float]] = []
        fut: asyncio.Future = asyncio.Future()

        @self.client.on(events.NewMessage(from_users=bot))
        async def _handler(event):  # noqa: ARG001
            received.append((event.message.message or "", time.time()))
            if not fut.done():
                fut.set_result(None)

        sent_at = time.time()
        await self.client.send_message(bot, full)
        try:
            await asyncio.wait_for(fut, timeout=timeout)
        except asyncio.TimeoutError:
            self.client.remove_event_handler(_handler)
            raise TimeoutError(
                f"Hum did not reply within {timeout}s to: {full!r}"
            ) from None

        # Settle window: collect continuation messages.
        await asyncio.sleep(settle_ms / 1000)
        self.client.remove_event_handler(_handler)

        combined = "\n".join(msg for msg, _ in received)
        first_received_at = received[0][1]
        return HumReply(
            text=combined,
            received_at=first_received_at,
            latency_s=first_received_at - sent_at,
        )

    async def send_many_collect(
        self,
        messages: list[str],
        *,
        per_msg_timeout: float = 60.0,
        between_s: float = 1.0,
    ) -> list[HumReply]:
        """Send a sequence of messages, return Hum's reply to each in order.
        Applies rate-limit spacing between sends.
        """
        results: list[HumReply] = []
        for i, msg in enumerate(messages):
            if i > 0:
                await asyncio.sleep(between_s)
            results.append(await self.send_and_wait(msg, timeout=per_msg_timeout))
        return results
