from fastapi.testclient import TestClient

from app.main import app
from app.rate_limit import SlidingWindowRateLimiter
from app.services.gemini import GeminiConfigurationError, get_gemini_service


client = TestClient(app)


def test_sliding_window_rate_limiter_returns_retry_after() -> None:
    limiter = SlidingWindowRateLimiter()

    assert limiter.check("visitor", "ai", 2, 60, now=100) is None
    assert limiter.check("visitor", "ai", 2, 60, now=110) is None
    assert limiter.check("visitor", "ai", 2, 60, now=120) == 40
    assert limiter.check("visitor", "ai", 2, 60, now=161) is None


def test_cors_allows_local_frontend_but_not_arbitrary_origins() -> None:
    allowed = client.options(
        "/api/simplify",
        headers={
            "Origin": "http://localhost:3000",
            "Access-Control-Request-Method": "POST",
        },
    )
    denied = client.options(
        "/api/simplify",
        headers={
            "Origin": "https://untrusted.example",
            "Access-Control-Request-Method": "POST",
        },
    )

    assert allowed.headers["access-control-allow-origin"] == "http://localhost:3000"
    assert "access-control-allow-origin" not in denied.headers


def test_configuration_error_does_not_expose_environment_name() -> None:
    class MissingConfigurationService:
        def simplify(self, _request: object) -> None:
            raise GeminiConfigurationError("GEMINI_API_KEY is missing from /internal/path")

    app.dependency_overrides[get_gemini_service] = MissingConfigurationService
    try:
        response = client.post(
            "/api/simplify",
            json={
                "text": "هذا نص عربي صالح للاختبار ولا يقل عن عشرين حرفاً.",
                "reader": "general_reader",
                "level": 2,
            },
        )
    finally:
        app.dependency_overrides.clear()

    assert response.status_code == 503
    assert "GEMINI" not in response.text
    assert "internal" not in response.text


def test_pdf_larger_than_vercel_payload_budget_is_rejected() -> None:
    response = client.post(
        "/api/upload/pdf",
        content=b"%PDF-1.7\n" + b"0" * (4 * 1024 * 1024),
        headers={"Content-Type": "application/pdf"},
    )

    assert response.status_code == 413


def test_cloud_speech_request_is_bounded() -> None:
    response = client.post(
        "/api/speech",
        json={"text": "ا" * 601, "language": "ar"},
    )

    assert response.status_code == 422
