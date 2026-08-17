import base64
import io
import wave
from unittest.mock import Mock, patch

import pytest
from pydantic import BaseModel

from app.schemas import SimplificationOutput
from app.services.gemini import GeminiService, GeminiServiceError


class ExampleOutput(BaseModel):
    result: str


def test_gemini_client_ignores_unavailable_environment_proxy() -> None:
    response = Mock()
    response.json.return_value = {"output_text": '{"result":"ok"}'}

    client = Mock()
    client.post.return_value = response

    context_manager = Mock()
    context_manager.__enter__ = Mock(return_value=client)
    context_manager.__exit__ = Mock(return_value=False)

    with patch("app.services.gemini.httpx.Client", return_value=context_manager) as client_class:
        result = GeminiService("test-key", "gemini-3.6-flash")._generate(
            "test input",
            ExampleOutput,
        )

    assert result == ExampleOutput(result="ok")
    client_class.assert_called_once_with(timeout=90.0, trust_env=False)
    response.raise_for_status.assert_called_once_with()


def test_simplification_schema_is_gemini_compatible() -> None:
    schema = GeminiService._response_schema(SimplificationOutput)

    assert "adaptation_strategy" not in schema["properties"]
    assert "adaptation_strategy" not in schema["required"]
    assert "enum" not in schema["$defs"]["SimplificationLevel"]
    assert "title" not in schema


def test_gemini_retries_configured_fallback_after_rate_limit() -> None:
    rate_limited = Mock(status_code=429)
    fallback_response = Mock(status_code=200)
    fallback_response.json.return_value = {"output_text": '{"result":"ok"}'}

    client = Mock()
    client.post.side_effect = [rate_limited, fallback_response]

    context_manager = Mock()
    context_manager.__enter__ = Mock(return_value=client)
    context_manager.__exit__ = Mock(return_value=False)

    with patch("app.services.gemini.httpx.Client", return_value=context_manager):
        result = GeminiService(
            "test-key",
            "gemini-primary",
            fallback_model="gemini-fallback",
        )._generate("test input", ExampleOutput)

    assert result == ExampleOutput(result="ok")
    assert [call.kwargs["json"]["model"] for call in client.post.call_args_list] == [
        "gemini-primary",
        "gemini-fallback",
    ]
    fallback_response.raise_for_status.assert_called_once_with()


def test_gemini_tts_extracts_documented_output_audio_first() -> None:
    expected_audio = base64.b64encode(b"\x01\x00").decode("ascii")
    older_audio = base64.b64encode(b"\x02\x00").decode("ascii")

    audio_data = GeminiService._extract_tts_audio_data(
        {
            "output_audio": {"data": expected_audio},
            "interaction": {"outputAudio": {"data": older_audio}},
        }
    )

    assert audio_data == expected_audio


def test_gemini_tts_extracts_legacy_interaction_audio() -> None:
    expected_audio = base64.b64encode(b"\x01\x00").decode("ascii")

    audio_data = GeminiService._extract_tts_audio_data(
        {"interaction": {"outputAudio": {"data": expected_audio}}}
    )

    assert audio_data == expected_audio


def test_gemini_tts_generates_valid_wav_and_payload() -> None:
    pcm_bytes = b"\x01\x00\x02\x00"
    response = Mock(status_code=200, text="")
    response.json.return_value = {
        "output_audio": {"data": base64.b64encode(pcm_bytes).decode("ascii")}
    }

    client = Mock()
    client.post.return_value = response

    context_manager = Mock()
    context_manager.__enter__ = Mock(return_value=client)
    context_manager.__exit__ = Mock(return_value=False)

    with patch("app.services.gemini.httpx.Client", return_value=context_manager) as client_class:
        wav_bytes = GeminiService(
            "test-key",
            "gemini-primary",
            tts_model="gemini-tts-test",
            tts_arabic_voice="Sulafat",
            tts_english_voice="Kore",
        ).generate_speech("Hello", "en")

    client_class.assert_called_once()
    timeout = client_class.call_args.kwargs["timeout"]
    assert timeout.connect == 5.0
    assert timeout.read == 25.0
    request_payload = client.post.call_args.kwargs["json"]
    assert request_payload["model"] == "gemini-tts-test"
    assert "### TRANSCRIPT START" in request_payload["input"]
    assert "Hello" in request_payload["input"]
    assert request_payload["response_format"] == {"type": "audio"}
    assert request_payload["generation_config"]["speech_config"] == [{"voice": "Kore"}]
    with wave.open(io.BytesIO(wav_bytes), "rb") as wav_file:
        assert wav_file.getnchannels() == 1
        assert wav_file.getsampwidth() == 2
        assert wav_file.getframerate() == 24_000
        assert wav_file.readframes(wav_file.getnframes()) == pcm_bytes


def test_gemini_tts_raises_when_audio_missing() -> None:
    response = Mock(status_code=200, text="")
    response.json.return_value = {"output_text": "no audio here"}

    client = Mock()
    client.post.return_value = response

    context_manager = Mock()
    context_manager.__enter__ = Mock(return_value=client)
    context_manager.__exit__ = Mock(return_value=False)

    with patch("app.services.gemini.httpx.Client", return_value=context_manager):
        with pytest.raises(GeminiServiceError, match="no playable audio"):
            GeminiService("test-key", "gemini-primary").generate_speech("مرحبا", "ar")


def test_gemini_tts_classifies_rate_limit() -> None:
    response = Mock(status_code=429, text="")
    response.json.return_value = {"error": {"message": "quota exceeded"}}

    client = Mock()
    client.post.return_value = response

    context_manager = Mock()
    context_manager.__enter__ = Mock(return_value=client)
    context_manager.__exit__ = Mock(return_value=False)

    from app.services.gemini import GeminiSpeechError

    with patch("app.services.gemini.httpx.Client", return_value=context_manager):
        with pytest.raises(GeminiSpeechError) as error:
            GeminiService("test-key", "gemini-primary").generate_speech("مرحبا", "ar")

    assert error.value.code == "rate_limited"
    assert error.value.http_status == 429

