"""Async tail of vault-proxy events — captures the JSONL stream from
`podman logs -f vault-proxy` during a test, returns the parsed events that
landed while the test ran. Used for test assertions ("did the blocked fetch
log a BLOCKED event?") and forensic attachment to failed tests.

We tail `podman logs` rather than reading /var/log/vault-proxy/requests.jsonl
because that file lives on a named volume not directly readable from the
host (per our container audit) and the stdout stream is the same data.
"""
from __future__ import annotations

import asyncio
import contextlib
import json
import time
from dataclasses import dataclass, field
from typing import AsyncIterator


@dataclass
class ProxyEvent:
    action: str  # ALLOWED / BLOCKED / EXFIL_BLOCKED / RESPONSE / KEY_REFLECTED / LARGE_RESPONSE_BLOCKED
    url: str = ""
    method: str = ""
    host: str = ""
    status: int | None = None
    request_bytes: int = 0
    response_bytes: int = 0
    reason: str = ""
    timestamp: str = ""
    raw: dict = field(default_factory=dict)

    @classmethod
    def from_json(cls, obj: dict) -> "ProxyEvent":
        return cls(
            action=obj.get("action", ""),
            url=obj.get("url", ""),
            method=obj.get("method", ""),
            host=obj.get("host", ""),
            status=obj.get("status"),
            request_bytes=obj.get("request_bytes", 0),
            response_bytes=obj.get("response_bytes", 0),
            reason=obj.get("reason", ""),
            timestamp=obj.get("timestamp", ""),
            raw=obj,
        )


class ProxyLogTail:
    """Streams events from `podman logs -f vault-proxy` starting at attach time.

    Usage:
        async with ProxyLogTail() as tail:
            # ... do test work ...
            events = tail.events  # all ProxyEvents captured in the window
    """

    def __init__(self, container: str = "vault-proxy") -> None:
        self.container = container
        self.events: list[ProxyEvent] = []
        self._proc: asyncio.subprocess.Process | None = None
        self._reader_task: asyncio.Task | None = None
        self._started_at: float = 0.0

    async def __aenter__(self) -> "ProxyLogTail":
        # `--since=0s --tail=0` skips backlog, stream only new lines.
        # Some podman builds reject --since in that position; fall back to
        # just --tail 0 which also streams only new content.
        self._proc = await asyncio.create_subprocess_exec(
            "podman", "logs", "-f", "--tail", "0", self.container,
            stdout=asyncio.subprocess.PIPE,
            stderr=asyncio.subprocess.DEVNULL,
        )
        self._started_at = time.time()
        self._reader_task = asyncio.create_task(self._consume(self._proc.stdout))
        # Give the reader a tick to spin up before the test starts writing traffic.
        await asyncio.sleep(0.1)
        return self

    async def __aexit__(self, exc_type, exc, tb) -> None:
        if self._proc and self._proc.returncode is None:
            self._proc.terminate()
            with contextlib.suppress(asyncio.TimeoutError):
                await asyncio.wait_for(self._proc.wait(), timeout=2.0)
        if self._reader_task:
            self._reader_task.cancel()
            with contextlib.suppress(asyncio.CancelledError, Exception):
                await self._reader_task

    async def _consume(self, stream: asyncio.StreamReader | None) -> None:
        if stream is None:
            return
        async for raw in stream:
            try:
                line = raw.decode("utf-8", errors="replace").strip()
            except Exception:
                continue
            # Our addon emits either:
            #   "[vault-proxy] {...json...}"   (via stdout handler)
            #   "{...json...}"                  (mitmproxy's stream prefix form)
            # Strip the bracket prefix if present and try to parse JSON.
            if line.startswith("[vault-proxy] "):
                line = line[len("[vault-proxy] "):]
            if not line.startswith("{"):
                continue
            try:
                obj = json.loads(line)
            except json.JSONDecodeError:
                continue
            if "action" not in obj:
                continue
            self.events.append(ProxyEvent.from_json(obj))

    def where(self, **filters) -> list[ProxyEvent]:
        """Filter events by any combination of fields. `url_contains=str` is
        supported as a convenience; all other keys are equality checks on the
        event field.
        """
        out = []
        url_contains = filters.pop("url_contains", None)
        for ev in self.events:
            if url_contains and url_contains not in ev.url:
                continue
            if all(getattr(ev, k, None) == v for k, v in filters.items()):
                out.append(ev)
        return out

    async def wait_for(self, *, url_contains: str | None = None, action: str | None = None,
                       timeout: float = 15.0) -> ProxyEvent | None:
        """Poll for an event matching criteria. Returns None if timeout."""
        deadline = time.time() + timeout
        while time.time() < deadline:
            matches = self.where(**{k: v for k, v in (("action", action),) if v})
            if url_contains:
                matches = [e for e in matches if url_contains in e.url]
            if matches:
                return matches[-1]
            await asyncio.sleep(0.25)
        return None
