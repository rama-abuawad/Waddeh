import base64
import io
import logging
import wave
from unittest.mock import Mock, patch

import httpx
import pytest
from pydantic import BaseModel

from app.schemas import (
    PoetryOutput,
    PoetryRequest,
    ReaderType,
    ReadingMemorySnapshot,
    SimplificationLevel,
    SimplificationOutput,
    TransferChallengeOutput,
    TransferChallengeRequest,
)
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
    schema_text = str(schema)

    assert "adaptation_strategy" not in schema["properties"]
    assert "adaptation_strategy" not in schema["required"]
    assert "$defs" not in schema
    assert "$ref" not in schema_text
    assert "AdaptationStrategy" not in schema_text
    assert "enum" not in schema["properties"]["bridge"]["properties"]["current_level"]
    assert schema["properties"]["meaning_threads"]["items"]["properties"]["kind"][
        "enum"
    ] == [
        "pronoun",
        "actor",
        "connector",
        "negation",
        "condition",
        "reference",
    ]
    assert schema["properties"]["cultural_meanings"]["items"]["properties"]["kind"][
        "enum"
    ] == ["idiom", "proverb", "metaphor", "cultural_reference"]
    assert "title" not in schema
    assert "maxLength" not in schema_text
    assert "minLength" not in schema_text
    assert "pattern" not in schema_text
    assert "maxItems" not in schema_text
    assert "minItems" not in schema_text
    assert "maximum" not in schema_text
    assert "minimum" not in schema_text


def test_simplification_schema_preserves_v3_learning_fields() -> None:
    schema = GeminiService._response_schema(SimplificationOutput)

    assert "meaning_threads" in schema["properties"]
    assert schema["properties"]["meaning_threads"]["items"]["type"] == "object"
    assert "cultural_meanings" in schema["properties"]
    assert schema["properties"]["cultural_meanings"]["items"]["properties"][
        "english_equivalent"
    ]["type"] == "string"
    assert schema["properties"]["cultural_meanings"]["items"]["properties"][
        "literal_meaning_english"
    ]["type"] == "string"
    comprehension_check = schema["properties"]["comprehension_check"]
    assert comprehension_check["properties"]["choices"]["items"]["type"] == "string"
    assert comprehension_check["properties"]["correct_choice_index"]["type"] == "integer"
    assert schema["properties"]["bridge"]["properties"]["levels"]["items"]["type"] == "object"


def test_simplification_prompt_uses_reading_memory_and_meaning_threads() -> None:
    prompt = GeminiService._build_simplification_prompt(
        reader=ReaderType.general_reader,
        level=SimplificationLevel.easy,
        source_instruction="النص العربي: مثال للاختبار",
        reading_memory=ReadingMemorySnapshot(
            mastered_terms=["المتقدم"],
            learning_terms=["استيفاء"],
            difficulty_focus=["pronoun", "condition"],
        ),
    )

    assert "مفردات أتقنها: المتقدم" in prompt
    assert "مفردات ما زال يتعلّمها: استيفاء" in prompt
    assert "مرجع الضمير" in prompt
    assert "meaning_threads" in prompt
    assert "cultural_meanings" in prompt
    assert "انسخ العبارة من المصدر حرفياً" in prompt
    assert "english_equivalent" in prompt


def test_poetry_schema_and_prompt_include_cultural_meanings() -> None:
    schema = GeminiService._response_schema(PoetryOutput)
    service = GeminiService("test-key", "gemini-test")

    with patch.object(service, "_generate", return_value=Mock()) as generate:
        service.explain_poetry(
            PoetryRequest(
                text="على قدر أهل العزم تأتي العزائم",
                reader=ReaderType.general_reader,
                level=SimplificationLevel.easy,
            )
        )

    prompt = generate.call_args.kwargs["input_data"]
    assert "cultural_meanings" in schema["properties"]
    assert schema["properties"]["cultural_meanings"]["items"]["properties"]["kind"][
        "enum"
    ] == ["idiom", "proverb", "metaphor", "cultural_reference"]
    assert "cultural_meanings" in prompt
    assert "expression حرفياً من القصيدة" in prompt
    assert "english_equivalent" in prompt


def test_transfer_challenge_schema_and_prompt_require_grounded_new_context() -> None:
    schema = GeminiService._response_schema(TransferChallengeOutput)
    service = GeminiService("test-key", "gemini-test")

    with patch.object(service, "_generate", return_value=TransferChallengeOutput(
        word="استيفاء",
        prompt_arabic="يحتاج التسجيل إلى ____ البيانات كاملة.",
        prompt_english="Registration requires ____ all details.",
        choices_arabic=["حذف", "استيفاء", "نسيان"],
        choices_english=["deleting", "completing", "forgetting"],
        correct_choice_index=1,
        explanation_arabic="تعني استيفاء هنا إكمال المطلوب.",
        explanation_english="Here, the word means completing what is required.",
    )) as generate:
        result = service.create_transfer_challenge(
            TransferChallengeRequest(
                word="استيفاء",
                meaning="إكمال المتطلبات",
                english_meaning="meeting requirements",
                source_context="يجب استيفاء الشروط.",
                level=SimplificationLevel.easy,
            )
        )

    prompt = generate.call_args.kwargs["input_data"]
    assert result.word == "استيفاء"
    assert schema["properties"]["correct_choice_index"]["type"] == "integer"
    assert schema["properties"]["choices_arabic"]["items"]["type"] == "string"
    assert "تختلف بوضوح عن previous_context" in prompt
    assert "فراغاً واحداً فقط" in prompt
    assert "جواب صحيح واحد" in prompt


def test_transfer_challenge_rejects_a_correct_choice_for_another_word() -> None:
    service = GeminiService("test-key", "gemini-test")
    request = TransferChallengeRequest(
        word="استيفاء",
        meaning="إكمال المتطلبات",
        english_meaning="meeting requirements",
        source_context="يجب استيفاء الشروط.",
        level=SimplificationLevel.easy,
    )
    mismatched_output = TransferChallengeOutput(
        word="استيفاء",
        prompt_arabic="يحتاج التسجيل إلى ____ البيانات كاملة.",
        prompt_english="Registration requires ____ all details.",
        choices_arabic=["حذف", "إلغاء", "نسيان"],
        choices_english=["deleting", "cancelling", "forgetting"],
        correct_choice_index=1,
        explanation_arabic="شرح غير مطابق للكلمة المطلوبة.",
        explanation_english="The explanation does not match the requested word.",
    )

    with patch.object(service, "_generate", return_value=mismatched_output):
        with pytest.raises(GeminiServiceError, match="valid transfer challenge"):
            service.create_transfer_challenge(request)


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


def test_gemini_logs_safe_http_status_for_primary_failure(caplog: pytest.LogCaptureFixture) -> None:
    request = httpx.Request(
        "POST",
        "https://generativelanguage.googleapis.com/v1beta/interactions",
    )
    response = httpx.Response(
        403,
        request=request,
        json={"error": {"message": "provider body must not be logged"}},
    )

    client = Mock()
    client.post.return_value = response

    context_manager = Mock()
    context_manager.__enter__ = Mock(return_value=client)
    context_manager.__exit__ = Mock(return_value=False)

    caplog.set_level(logging.ERROR, logger="app.services.gemini")

    with patch("app.services.gemini.httpx.Client", return_value=context_manager):
        with pytest.raises(GeminiServiceError):
            GeminiService(
                "test-key",
                "gemini-primary",
                fallback_model="gemini-fallback",
            )._generate("test input", ExampleOutput)

    assert "upstream HTTP status 403" in caplog.text
    assert "model=gemini-primary" in caplog.text
    assert "fallback_attempted=False" in caplog.text
    assert "provider body must not be logged" not in caplog.text
    assert "test input" not in caplog.text
    assert "test-key" not in caplog.text
    assert "x-goog-api-key" not in caplog.text


def test_gemini_logs_safe_http_status_for_fallback_failure(caplog: pytest.LogCaptureFixture) -> None:
    request = httpx.Request(
        "POST",
        "https://generativelanguage.googleapis.com/v1beta/interactions",
    )
    rate_limited = httpx.Response(429, request=request)
    fallback_failed = httpx.Response(
        503,
        request=request,
        json={"error": {"message": "fallback body must not be logged"}},
    )

    client = Mock()
    client.post.side_effect = [rate_limited, fallback_failed]

    context_manager = Mock()
    context_manager.__enter__ = Mock(return_value=client)
    context_manager.__exit__ = Mock(return_value=False)

    caplog.set_level(logging.ERROR, logger="app.services.gemini")

    with patch("app.services.gemini.httpx.Client", return_value=context_manager):
        with pytest.raises(GeminiServiceError):
            GeminiService(
                "test-key",
                "gemini-primary",
                fallback_model="gemini-fallback",
            )._generate("test input", ExampleOutput)

    assert "upstream HTTP status 503" in caplog.text
    assert "model=gemini-fallback" in caplog.text
    assert "fallback_attempted=True" in caplog.text
    assert "fallback body must not be logged" not in caplog.text
    assert "test input" not in caplog.text
    assert "test-key" not in caplog.text
    assert "x-goog-api-key" not in caplog.text


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

