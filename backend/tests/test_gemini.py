import base64
import io
import json
import logging
import wave
from unittest.mock import Mock, patch

import httpx
import pytest
from pydantic import BaseModel

from app.schemas import (
    PoetryOutput,
    PoetryRequest,
    PdfSimplificationOutput,
    ReaderType,
    ReadingMemorySnapshot,
    SimplificationLevel,
    SimplificationOutput,
    SimplifyRequest,
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


def test_text_simplification_uses_one_low_thinking_generation_request() -> None:
    service = GeminiService("test-key", "gemini-3.6-flash")
    generated = Mock()

    with patch.object(service, "_generate", return_value=generated) as generate:
        result = service.simplify(
            SimplifyRequest(
                text="يجب على المتقدم تقديم ثلاثة مستندات قبل الموعد المحدد.",
                reader=ReaderType.general_reader,
                level=SimplificationLevel.easy,
            )
        )

    assert result is generated
    generate.assert_called_once()
    assert generate.call_args.kwargs["output_model"] is SimplificationOutput
    assert generate.call_args.kwargs["thinking_level"] == "low"
    prompt = generate.call_args.kwargs["input_data"]
    assert "english_translation" in prompt
    assert "حافظ بدقة على جميع الأسماء والتواريخ والأرقام" in prompt
    assert "الشروط والمتطلبات والتحذيرات والاستثناءات والحقائق التقنية" in prompt


def test_interactions_payload_places_thinking_level_in_generation_config() -> None:
    client = Mock()
    service = GeminiService("test-key", "gemini-3.6-flash")

    service._post_interaction(
        client=client,
        model="gemini-3.6-flash",
        input_data="test input",
        response_schema={"type": "object"},
        thinking_level="low",
    )

    payload = client.post.call_args.kwargs["json"]
    assert payload["generation_config"] == {"thinking_level": "low"}


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
    assert schema["properties"]["learning_cards"]["maxItems"] == 3
    assert schema["properties"]["bridge"]["properties"]["levels"]["minItems"] == 3
    assert schema["properties"]["bridge"]["properties"]["levels"]["maxItems"] == 5
    comprehension = schema["properties"]["comprehension_check"]["properties"]
    assert comprehension["correct_choice_index"]["minimum"] == 0
    assert comprehension["correct_choice_index"]["maximum"] == 2


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


def test_pdf_schema_and_prompt_keep_source_translation_separate_from_simplification() -> None:
    schema = GeminiService._response_schema(PdfSimplificationOutput)
    service = GeminiService("test-key", "gemini-test")
    extracted = "العنوان\nالقسم الأول\nيجب تقديم ثلاثة مستندات قبل 30 أغسطس 2026."

    with patch.object(service, "_generate", side_effect=RuntimeError("captured")) as generate:
        with pytest.raises(RuntimeError, match="captured"):
            service.simplify_pdf(
                b"%PDF-1.7",
                ReaderType.general_reader,
                SimplificationLevel.easy,
                extracted_arabic=extracted,
            )

    input_data = generate.call_args.kwargs["input_data"]
    prompt = input_data[1]["text"]
    assert "original_text" in schema["properties"]
    assert "adaptation_strategy" not in schema["properties"]
    assert extracted in prompt
    assert "original_text هو نص المصدر" in prompt
    assert "english_translation ترجمة كاملة وأمينة لـ original_text" in prompt
    assert "ولا تلخّص أي قسم" in prompt
    assert "simplified_text وحده هو النسخة العربية المتكيفة" in prompt


def test_pdf_schema_preserves_pydantic_collection_and_numeric_constraints() -> None:
    schema = GeminiService._response_schema(PdfSimplificationOutput)
    properties = schema["properties"]

    assert properties["preserved_details"]["minItems"] == 0
    assert properties["preserved_details"]["maxItems"] == 8
    assert properties["preserved_details_english"]["maxItems"] == 8
    assert properties["learning_cards"]["maxItems"] == 3
    assert properties["visual_steps"]["maxItems"] == 6
    assert properties["change_map"]["maxItems"] == 5
    assert properties["meaning_threads"]["maxItems"] == 6
    assert properties["cultural_meanings"]["maxItems"] == 4

    bridge = properties["bridge"]["properties"]
    assert bridge["levels"]["minItems"] == 3
    assert bridge["levels"]["maxItems"] == 5
    assert bridge["levels"]["items"]["properties"]["reintroduced_items"]["maxItems"] == 5

    comprehension = properties["comprehension_check"]["properties"]
    assert comprehension["choices"]["minItems"] == 3
    assert comprehension["choices"]["maxItems"] == 3
    assert comprehension["choices_english"]["minItems"] == 3
    assert comprehension["choices_english"]["maxItems"] == 3
    assert comprehension["correct_choice_index"]["minimum"] == 0
    assert comprehension["correct_choice_index"]["maximum"] == 2


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


def test_gemini_logs_timeout_category_without_sensitive_data(
    caplog: pytest.LogCaptureFixture,
) -> None:
    request = httpx.Request(
        "POST",
        "https://generativelanguage.googleapis.com/v1beta/interactions",
    )
    client = Mock()
    client.post.side_effect = httpx.ReadTimeout("secret timeout detail", request=request)

    context_manager = Mock()
    context_manager.__enter__ = Mock(return_value=client)
    context_manager.__exit__ = Mock(return_value=False)

    caplog.set_level(logging.WARNING, logger="app.services.gemini")

    with patch("app.services.gemini.httpx.Client", return_value=context_manager):
        with pytest.raises(GeminiServiceError):
            GeminiService("test-key", "gemini-primary")._generate(
                "private source text",
                ExampleOutput,
            )

    assert "Gemini request timed out" in caplog.text
    assert "model=gemini-primary" in caplog.text
    assert "secret timeout detail" not in caplog.text
    assert "private source text" not in caplog.text
    assert "test-key" not in caplog.text


def test_gemini_logs_network_failure_category(caplog: pytest.LogCaptureFixture) -> None:
    request = httpx.Request(
        "POST",
        "https://generativelanguage.googleapis.com/v1beta/interactions",
    )
    client = Mock()
    client.post.side_effect = httpx.ConnectError("connection failed", request=request)

    context_manager = Mock()
    context_manager.__enter__ = Mock(return_value=client)
    context_manager.__exit__ = Mock(return_value=False)

    caplog.set_level(logging.WARNING, logger="app.services.gemini")

    with patch("app.services.gemini.httpx.Client", return_value=context_manager):
        with pytest.raises(GeminiServiceError):
            GeminiService("test-key", "gemini-primary")._generate(
                "private source text",
                ExampleOutput,
            )

    assert "Gemini network request failed (ConnectError)" in caplog.text
    assert "model=gemini-primary" in caplog.text
    assert "connection failed" not in caplog.text
    assert "private source text" not in caplog.text
    assert "test-key" not in caplog.text


def test_gemini_logs_malformed_response_category_without_response_body(
    caplog: pytest.LogCaptureFixture,
) -> None:
    response = Mock(status_code=200)
    response.json.return_value = {"output_text": "malformed response body"}

    client = Mock()
    client.post.return_value = response

    context_manager = Mock()
    context_manager.__enter__ = Mock(return_value=client)
    context_manager.__exit__ = Mock(return_value=False)

    caplog.set_level(logging.ERROR, logger="app.services.gemini")

    with patch("app.services.gemini.httpx.Client", return_value=context_manager):
        with pytest.raises(GeminiServiceError):
            GeminiService("test-key", "gemini-primary")._generate(
                "private source text",
                ExampleOutput,
            )

    assert "Gemini response validation failed" in caplog.text
    assert "model=gemini-primary" in caplog.text
    assert "output_schema=ExampleOutput" in caplog.text
    assert "malformed response body" not in caplog.text
    assert "private source text" not in caplog.text
    assert "test-key" not in caplog.text


def test_pdf_validation_logs_only_safe_error_locations_and_types(
    caplog: pytest.LogCaptureFixture,
) -> None:
    private_pdf_text = "نص خاص من ملف المستخدم"
    private_provider_detail = "تفصيل خاص من استجابة النموذج"
    payload = {
        "simplified_text": private_pdf_text,
        "diacritized_text": private_pdf_text,
        "english_translation": "Private translation",
        "preserved_details": [private_provider_detail] * 9,
        "preserved_details_english": ["Private detail"] * 9,
        "learning_cards": [],
        "visual_steps": [],
        "visual_steps_english": [],
        "change_map": [],
        "meaning_threads": [],
        "cultural_meanings": [],
        "bridge": {
            "current_level": 2,
            "guidance": "توجيه",
            "guidance_english": "Guidance",
            "levels": [
                {"level": level, "label_ar": "مرحلة", "label_en": "Level", "text": "نص"}
                for level in (2, 3, 5)
            ],
        },
        "comprehension_check": {
            "question": "ما الإجابة؟",
            "answer": "نعم",
            "question_english": "What is the answer?",
            "answer_english": "Yes",
            "choices": ["نعم", "لا", "ربما"],
            "choices_english": ["Yes", "No", "Maybe"],
            "correct_choice_index": 0,
        },
        "original_text": private_pdf_text,
    }
    response = Mock(status_code=200)
    response.json.return_value = {"output_text": json.dumps(payload, ensure_ascii=False)}
    client = Mock()
    client.post.return_value = response
    context_manager = Mock()
    context_manager.__enter__ = Mock(return_value=client)
    context_manager.__exit__ = Mock(return_value=False)
    caplog.set_level(logging.ERROR, logger="app.services.gemini")

    with patch("app.services.gemini.httpx.Client", return_value=context_manager):
        with pytest.raises(GeminiServiceError):
            GeminiService("test-key", "gemini-primary")._generate(
                "private request",
                PdfSimplificationOutput,
            )

    assert "location': 'preserved_details'" in caplog.text
    assert "location': 'preserved_details_english'" in caplog.text
    assert "type': 'too_long'" in caplog.text
    assert private_pdf_text not in caplog.text
    assert private_provider_detail not in caplog.text
    assert "Private translation" not in caplog.text
    assert "private request" not in caplog.text
    assert "test-key" not in caplog.text


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

