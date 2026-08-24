from __future__ import annotations

import hashlib
import math
import time
from collections import deque
from collections.abc import Awaitable, Callable
from threading import Lock

from fastapi import HTTPException, Request, status

from app.config import get_settings


class SlidingWindowRateLimiter:
    """Small per-instance safeguard; Vercel WAF remains the global production limit."""

    def __init__(self, max_buckets: int = 10_000) -> None:
        self._events: dict[tuple[str, str], deque[float]] = {}
        self._windows: dict[tuple[str, str], int] = {}
        self._lock = Lock()
        self._max_buckets = max_buckets

    def check(
        self,
        identity: str,
        bucket: str,
        max_requests: int,
        window_seconds: int,
        now: float | None = None,
    ) -> int | None:
        timestamp = time.monotonic() if now is None else now
        cutoff = timestamp - window_seconds
        key = (identity, bucket)

        with self._lock:
            events = self._events.setdefault(key, deque())
            self._windows[key] = max(window_seconds, self._windows.get(key, 0))
            while events and events[0] <= cutoff:
                events.popleft()

            if len(events) >= max_requests:
                return max(1, math.ceil(events[0] + window_seconds - timestamp))

            events.append(timestamp)
            if len(self._events) > self._max_buckets:
                self._remove_stale_buckets(timestamp)
            return None

    def _remove_stale_buckets(self, timestamp: float) -> None:
        for key, events in list(self._events.items()):
            cutoff = timestamp - self._windows.get(key, 0)
            while events and events[0] <= cutoff:
                events.popleft()
            if not events:
                self._events.pop(key, None)
                self._windows.pop(key, None)
            if len(self._events) <= self._max_buckets:
                break


_limiter = SlidingWindowRateLimiter()


def _request_identity(request: Request) -> str:
    settings = get_settings()
    address = "unknown"
    if settings.vercel:
        address = (
            request.headers.get("x-vercel-forwarded-for")
            or request.headers.get("x-forwarded-for")
            or address
        ).split(",", 1)[0].strip()
    elif request.client:
        address = request.client.host
    return hashlib.sha256(address.encode("utf-8")).hexdigest()[:24]


def enforce_rate_limit(
    bucket: str,
    max_requests: int,
    window_seconds: int,
) -> Callable[[Request], Awaitable[None]]:
    async def dependency(request: Request) -> None:
        if not get_settings().rate_limit_enabled:
            return

        retry_after = _limiter.check(
            identity=_request_identity(request),
            bucket=bucket,
            max_requests=max_requests,
            window_seconds=window_seconds,
        )
        if retry_after is not None:
            raise HTTPException(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                detail={
                    "code": "rate_limited",
                    "message": "Too many requests. Please wait and try again.",
                },
                headers={"Retry-After": str(retry_after)},
            )

    dependency.__name__ = f"rate_limit_{bucket.replace(':', '_')}"
    return dependency
