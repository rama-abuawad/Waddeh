from unittest.mock import Mock, patch

from pydantic import BaseModel

from app.schemas import SimplificationOutput
from app.services.gemini import GeminiService


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

