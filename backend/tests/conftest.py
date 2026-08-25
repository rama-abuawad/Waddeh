import pytest

from app.rate_limit import _limiter


@pytest.fixture(autouse=True)
def reset_rate_limit_state() -> None:
    _limiter.reset()
