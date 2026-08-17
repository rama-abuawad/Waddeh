import pytest
from fastapi.testclient import TestClient

from app.main import app
from app.services.gemini import (
    GeminiService,
    GeminiServiceError,
    GeminiSpeechError,
    get_gemini_service,
)


class MockGeminiService:
    def generate_speech(self, text: str, language: str) -> bytes:
        if "error" in text:
            raise GeminiServiceError("Mock TTS error")
        return b"MOCK_WAV_BYTES"

@pytest.fixture
def override_gemini():
    app.dependency_overrides[get_gemini_service] = MockGeminiService
    yield
    app.dependency_overrides.clear()

def test_generate_speech_success(override_gemini):
    client = TestClient(app)
    response = client.post("/api/speech", json={"text": "مرحبا", "language": "ar"})
    assert response.status_code == 200
    assert response.headers["content-type"] == "audio/wav"
    assert response.content == b"MOCK_WAV_BYTES"

def test_generate_speech_error(override_gemini):
    client = TestClient(app)
    response = client.post("/api/speech", json={"text": "trigger error", "language": "en"})
    assert response.status_code == 502
    assert response.json()["detail"]["code"] == "provider_unavailable"


def test_generate_speech_exposes_safe_rate_limit_reason():
    class RateLimitedGeminiService:
        def generate_speech(self, text: str, language: str) -> bytes:
            raise GeminiSpeechError(
                "Cloud voice usage limit reached. Try again later.",
                code="rate_limited",
                http_status=429,
            )

    app.dependency_overrides[get_gemini_service] = RateLimitedGeminiService
    try:
        client = TestClient(app)
        response = client.post("/api/speech", json={"text": "مرحبا", "language": "ar"})
    finally:
        app.dependency_overrides.clear()

    assert response.status_code == 429
    assert response.json()["detail"] == {
        "code": "rate_limited",
        "message": "Cloud voice usage limit reached. Try again later.",
    }

def test_generate_speech_rejects_blank_text(override_gemini):
    client = TestClient(app)
    response = client.post("/api/speech", json={"text": "   ", "language": "ar"})
    assert response.status_code == 422


def test_tts_prompt_labels_transcript_and_preserves_arabic():
    text = "هٰذَا نَصٌّ عَرَبِيٌّ."
    prompt = GeminiService._build_tts_prompt(text, "ar")
    assert "Synthesize speech" in prompt
    assert "### TRANSCRIPT START" in prompt
    assert text in prompt
    assert "Do not translate" in prompt

