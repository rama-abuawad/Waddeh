from unittest.mock import Mock, patch

from pydantic import BaseModel

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

