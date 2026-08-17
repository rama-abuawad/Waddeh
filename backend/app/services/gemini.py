import base64
import copy
import io
import logging
import wave
from functools import lru_cache
from typing import Any, TypeVar

import httpx
from pydantic import BaseModel

from app.config import get_settings
from app.schemas import (
    PoetryOutput,
    PoetryRequest,
    ReaderType,
    SemanticIntegrityAssessment,
    SimplificationLevel,
    SimplificationOutput,
    SimplifyRequest,
    WordExplanation,
    WordExplanationRequest,
)
from app.services.adaptation import build_adaptation_strategy

logger = logging.getLogger(__name__)
OutputModel = TypeVar("OutputModel", bound=BaseModel)


class GeminiConfigurationError(RuntimeError):
    """Raised when Gemini is not configured."""


class GeminiServiceError(RuntimeError):
    """Raised when Gemini cannot return a valid response."""


class GeminiSpeechError(GeminiServiceError):
    """Raised when cloud speech generation fails with a safe client-facing reason."""

    def __init__(self, message: str, *, code: str, http_status: int = 502) -> None:
        super().__init__(message)
        self.code = code
        self.http_status = http_status


READER_DESCRIPTIONS = {
    "child": "طفل: استخدم كلمات شائعة وجملاً قصيرة جداً مع فكرة واحدة في كل جملة.",
    "general_reader": "قارئ عام: استخدم عربية فصحى طبيعية وواضحة.",
    "non_arabic_speaker": (
        "شخص غير ناطق بالعربية: استخدم أبسط عربية فصحى ممكنة، ثم قدّم ترجمة "
        "إنجليزية طبيعية وكاملة تساعده على فهم المعنى."
    ),
}

LEVEL_DESCRIPTIONS = {
    1: "سهل جداً: جمل قصيرة جداً، مفردات شائعة، وفكرة واحدة في كل جملة.",
    2: "سهل: جمل قصيرة إلى متوسطة واستبدال أو شرح المفردات الصعبة.",
    3: "متوسط: عربية فصحى واضحة مع الحفاظ على المصطلحات المهمة.",
    4: "متقدم: حافظ على الأسلوب الرسمي والمصطلحات، ووضّح التراكيب المعقدة فقط.",
    5: "كما ورد: لا تعِد كتابة النص؛ أعده كما هو وقدّم الأدوات التعليمية فقط.",
}


class GeminiService:
    def __init__(
        self,
        api_key: str,
        model: str,
        fallback_model: str = "",
        tts_model: str = "gemini-3.1-flash-tts-preview",
        tts_arabic_voice: str = "Sulafat",
        tts_english_voice: str = "Sulafat",
    ) -> None:
        self.api_key = api_key
        self.model = model
        self.fallback_model = fallback_model.strip()
        self.tts_model = tts_model
        self.tts_arabic_voice = tts_arabic_voice
        self.tts_english_voice = tts_english_voice

    def simplify(self, request: SimplifyRequest) -> SimplificationOutput:
        prompt = self._build_simplification_prompt(
            reader=request.reader,
            level=request.level,
            source_instruction=f"""النص العربي:
---
{request.text}
---""",
        )
        result = self._generate(input_data=prompt, output_model=SimplificationOutput)
        result.adaptation_strategy = build_adaptation_strategy(request.level)
        return result

    def simplify_pdf(
        self,
        pdf_bytes: bytes,
        reader: ReaderType,
        level: SimplificationLevel,
    ) -> SimplificationOutput:
        prompt = self._build_simplification_prompt(
            reader=reader,
            level=level,
            source_instruction=(
                "اقرأ المستند العربي المرفق كاملاً بالترتيب. تجاهل رؤوس الصفحات وأرقام "
                "الصفحات المتكررة، ثم وضّح محتواه كوحدة مترابطة. لا تخترع نصاً غير ظاهر في المستند. "
                "إذا ظهرت لك علامات ترميز تالفة مثل þÿ أو أحرف مفككة لا تكوّن نصاً عربياً مقروءاً، "
                "فلا تعرض النص التالف في أي حقل موجه للمستخدم. استخلص العربية المقصودة قدر الإمكان، "
                "واجعل جميع مستويات bridge عربية مقروءة. إذا تعذر الجزم بصياغة المصدر، فاجعل آخر "
                "مستوى صياغة عربية سليمة تحافظ على المعنى بدلاً من عرض نص مشوه."
            ),
        )
        input_data = [
            {
                "type": "document",
                "data": base64.b64encode(pdf_bytes).decode("ascii"),
                "mime_type": "application/pdf",
            },
            {"type": "text", "text": prompt},
        ]
        result = self._generate(input_data=input_data, output_model=SimplificationOutput)
        result.adaptation_strategy = build_adaptation_strategy(level)
        return result

    def verify_integrity(
        self,
        source_text: str,
        adapted_text: str,
    ) -> SemanticIntegrityAssessment:
        prompt = f"""
أنت مرحلة تحقق مستقلة في منصة «وضّح». قارن النص المرسل بالنص المتكيف.

النص المرسل:
---
{source_text}
---

النص المتكيف:
---
{adapted_text}
---

المطلوب:
- لا تعيد تبسيط النص.
- ابحث فقط عن حفظ المعنى أو تغييره أو حذف معلومات مهمة.
- ركز على المتطلبات والشروط والتحذيرات والاستثناءات والالتزامات والحقائق المهمة.
- اذكر العناصر المحفوظة بوضوح في preserved_items.
- اذكر أي تغيير محتمل في changed_items.
- اذكر أي حذف محتمل في missing_items.
- ضع تحذيرات صادقة عند عدم القدرة على الجزم.
- استخدم status = no_issue_detected إذا لم تظهر مشكلة، أو needs_attention إذا ظهرت مشكلة محتملة.
- استخدم confidence = low أو medium أو high ولا تدّع اليقين المطلق.
""".strip()
        return self._generate(input_data=prompt, output_model=SemanticIntegrityAssessment)

    def explain_word(self, request: WordExplanationRequest) -> WordExplanation:
        reader_description = READER_DESCRIPTIONS[request.reader.value]
        prompt = f"""
أنت «عدسة الكلمات» في منصة وضّح. اشرح الكلمة العربية المختارة اعتماداً على سياقها فقط.

القارئ: {reader_description}
الكلمة: {request.word}
السياق:
---
{request.context}
---

قواعد:
- اشرح المعنى المقصود في هذا السياق، لا جميع معاني القاموس.
- أضف التشكيل المفيد إلى الكلمة في diacritized_word.
- أعط الجذر العربي عندما تكون واثقاً؛ اكتب «غير معروف» إذا لم تكن واثقاً.
- أعط مرادفاً عربياً واحداً مناسباً للسياق وترجمة إنجليزية موجزة.
- أضف example قصيراً بالعربية عندما يساعد السياق.
- استخدم confidence = low إذا كان الجذر أو المعنى غير مؤكد، وإلا medium أو high.
- اجعل الإجابة قصيرة وواضحة ولا تضف معلومات غير مدعومة بالسياق.
""".strip()
        return self._generate(input_data=prompt, output_model=WordExplanation)

    def explain_poetry(self, request: PoetryRequest) -> PoetryOutput:
        reader_description = READER_DESCRIPTIONS[request.reader.value]
        level_description = LEVEL_DESCRIPTIONS[int(request.level)]
        prompt = f"""
أنت رفيق قراءة الشعر في منصة «وضّح». ساعد القارئ على الاقتراب من معنى الأبيات من دون أن تحوّل الشعر إلى تحليل طويل أو تضيف تفسيراً لا يسنده النص.

القارئ:
{reader_description}

مستوى الشرح:
{level_description}

النص الشعري:
---
{request.text}
---

قواعد إلزامية:
- اكتب overview بالعربية الفصحى الطبيعية في فقرة قصيرة توضّح الفكرة العامة.
- اكتب overview_english بالإنجليزية الطبيعية، لا بترجمة حرفية جامدة.
- حافظ في lines على ترتيب الأبيات، واجمع الشطرين المتصلين في عنصر واحد عند الحاجة.
- انسخ البيت نفسه في verse، ثم قرّب معناه في clear_meaning بجملة أو جملتين فقط.
- ترجم كل بيت في english_translation ترجمة دقيقة تحافظ على صورته ومعناه قدر الإمكان.
- أنشئ english_translation كاملاً للقصيدة بالترتيب نفسه، مع فواصل أسطر واضحة.
- إذا احتمل البيت أكثر من معنى، اختر القراءة الأقرب للسياق وعبّر عنها بحذر من دون ادعاء اليقين.
- لا تذكر بحور الشعر أو البلاغة أو الإعراب إلا إذا كان ذلك ضرورياً لفهم المعنى.
- اختر من 3 إلى 6 كلمات أو تعبيرات مفيدة من النص في vocabulary.
- لكل كلمة، أضف التشكيل المفيد، ومعناها في السياق بالعربية والإنجليزية، والبيت الذي وردت فيه.
- اجعل العربية والإنجليزية موجزتين وطبيعيتين، وتجنب التكرار والصياغة المتكلفة.
""".strip()
        return self._generate(input_data=prompt, output_model=PoetryOutput)

    def generate_speech(self, text: str, language: str) -> bytes:
        if not self.api_key:
            raise GeminiConfigurationError("GEMINI_API_KEY is missing.")

        voice = self.tts_arabic_voice if language == "ar" else self.tts_english_voice
        prompt = self._build_tts_prompt(text=text, language=language)

        try:
            with httpx.Client(timeout=httpx.Timeout(25.0, connect=5.0), trust_env=False) as client:
                response = self._post_tts_interaction(client=client, prompt=prompt, voice=voice)

                # The preview TTS model can occasionally return a transient 500.
                # Retry that specific provider failure once, but do not retry limits/timeouts.
                if response.status_code == httpx.codes.INTERNAL_SERVER_ERROR:
                    logger.warning("Gemini TTS returned 500; retrying once.")
                    response = self._post_tts_interaction(client=client, prompt=prompt, voice=voice)

                self._raise_for_tts_status(response)
                data = response.json()
                audio_base64 = self._extract_tts_audio_data(data)

                if not audio_base64:
                    logger.warning("Gemini TTS returned no audio; retrying once.")
                    response = self._post_tts_interaction(client=client, prompt=prompt, voice=voice)
                    self._raise_for_tts_status(response)
                    data = response.json()
                    audio_base64 = self._extract_tts_audio_data(data)

                if not audio_base64:
                    logger.error("Gemini TTS returned no usable audio block.")
                    raise GeminiSpeechError(
                        "Cloud voice returned no playable audio.",
                        code="no_audio",
                    )

                try:
                    pcm_bytes = base64.b64decode(audio_base64, validate=True)
                except (ValueError, base64.binascii.Error) as exc:
                    raise GeminiSpeechError(
                        "Cloud voice returned invalid audio.",
                        code="invalid_audio",
                    ) from exc

                if not pcm_bytes or len(pcm_bytes) % 2 != 0:
                    raise GeminiSpeechError(
                        "Cloud voice returned invalid audio.",
                        code="invalid_audio",
                    )

                wav_buffer = io.BytesIO()
                with wave.open(wav_buffer, "wb") as wav_file:
                    wav_file.setnchannels(1)
                    wav_file.setsampwidth(2)
                    wav_file.setframerate(24000)
                    wav_file.writeframes(pcm_bytes)

                return wav_buffer.getvalue()
        except GeminiSpeechError:
            raise
        except GeminiConfigurationError:
            raise
        except httpx.TimeoutException as exc:
            logger.warning("Gemini TTS request timed out.")
            raise GeminiSpeechError(
                "Cloud voice timed out.",
                code="timeout",
                http_status=504,
            ) from exc
        except httpx.RequestError as exc:
            logger.warning("Gemini TTS network request failed (%s).", type(exc).__name__)
            raise GeminiSpeechError(
                "Cloud voice could not be reached.",
                code="network_error",
                http_status=502,
            ) from exc
        except Exception as exc:
            logger.error("Gemini TTS request failed (%s).", type(exc).__name__)
            raise GeminiSpeechError(
                "Cloud voice is temporarily unavailable.",
                code="provider_unavailable",
                http_status=502,
            ) from exc

    def _raise_for_tts_status(self, response: httpx.Response) -> None:
        if response.status_code < 400:
            return

        try:
            safe_body: Any = self._sanitize_tts_response(response.json())
        except Exception:
            safe_body = "<non-json response>"

        logger.error(
            "Gemini TTS HTTP error %s response=%s",
            response.status_code,
            safe_body,
        )

        if response.status_code == httpx.codes.TOO_MANY_REQUESTS:
            raise GeminiSpeechError(
                "Cloud voice usage limit reached. Try again later.",
                code="rate_limited",
                http_status=429,
            )
        if response.status_code >= 500:
            raise GeminiSpeechError(
                "Cloud voice provider is temporarily unavailable.",
                code="provider_unavailable",
                http_status=502,
            )

        raise GeminiSpeechError(
            "Cloud voice request was rejected.",
            code="provider_rejected",
            http_status=502,
        )

    def _post_tts_interaction(
        self,
        *,
        client: httpx.Client,
        prompt: str,
        voice: str,
    ) -> httpx.Response:
        return client.post(
            "https://generativelanguage.googleapis.com/v1beta/interactions",
            headers={
                "x-goog-api-key": self.api_key,
                "Content-Type": "application/json",
                "Api-Revision": "2026-05-20",
            },
            json={
                "model": self.tts_model,
                "input": prompt,
                "store": False,
                "response_format": {"type": "audio"},
                "generation_config": {
                    "speech_config": [{"voice": voice}],
                },
            },
        )

    @staticmethod
    def _build_tts_prompt(text: str, language: str) -> str:
        if language == "ar":
            directions = (
                "Synthesize speech from the Arabic transcript below. "
                "Read only the transcript, exactly as written. "
                "Use clear, natural Modern Standard Arabic with careful pronunciation, "
                "natural pauses, and a calm learner-friendly pace. "
                "Preserve Arabic diacritics when they are present. "
                "Do not translate, summarize, explain, paraphrase, add, or omit words. "
                "Do not read these instructions or the transcript labels aloud."
            )
        else:
            directions = (
                "Synthesize speech from the English transcript below. "
                "Read only the transcript, exactly as written. "
                "Use clear, warm, natural English at a calm learner-friendly pace. "
                "Do not translate, summarize, explain, paraphrase, add, or omit words. "
                "Do not read these instructions or the transcript labels aloud."
            )

        return f"{directions}\n\n### TRANSCRIPT START\n{text}\n### TRANSCRIPT END"

    @staticmethod
    def _extract_tts_audio_data(data: dict[str, Any]) -> str | None:
        for key in ("output_audio", "outputAudio"):
            output_audio = data.get(key)
            if isinstance(output_audio, dict):
                audio_data = output_audio.get("data")
                if isinstance(audio_data, str) and audio_data:
                    return audio_data

        interaction = data.get("interaction")
        if isinstance(interaction, dict):
            for key in ("output_audio", "outputAudio"):
                output_audio = interaction.get(key)
                if isinstance(output_audio, dict):
                    audio_data = output_audio.get("data")
                    if isinstance(audio_data, str) and audio_data:
                        return audio_data

        steps = data.get("steps")
        if isinstance(steps, list):
            for step in steps:
                if not isinstance(step, dict) or step.get("type") != "model_output":
                    continue
                content_blocks = step.get("content")
                if not isinstance(content_blocks, list):
                    continue
                for block in content_blocks:
                    if not isinstance(block, dict):
                        continue
                    audio_data = block.get("data")
                    mime_type = block.get("mimeType") or block.get("mime_type") or ""
                    if (
                        isinstance(audio_data, str)
                        and audio_data
                        and (block.get("type") == "audio" or str(mime_type).startswith("audio/"))
                    ):
                        return audio_data

        return None

    @staticmethod
    def _sanitize_tts_response(data: dict[str, Any]) -> dict[str, Any]:
        safe_data = copy.deepcopy(data)

        def sanitize(value: Any) -> None:
            if isinstance(value, dict):
                for key, item in value.items():
                    if key == "data" and isinstance(item, str) and len(item) > 100:
                        value[key] = f"<base64 len={len(item)}>"
                    else:
                        sanitize(item)
            elif isinstance(value, list):
                for item in value:
                    sanitize(item)

        sanitize(safe_data)
        return safe_data

    def _generate(
        self,
        input_data: str | list[dict[str, str]],
        output_model: type[OutputModel],
    ) -> OutputModel:
        if not self.api_key:
            raise GeminiConfigurationError(
                "GEMINI_API_KEY is missing. Add it to the root .env file."
            )

        try:
            # Connect directly to Gemini. Local development tools can inject a
            # loopback proxy that is not available to the running API process.
            with httpx.Client(timeout=90.0, trust_env=False) as client:
                response_schema = self._response_schema(output_model)
                response = self._post_interaction(
                    client=client,
                    model=self.model,
                    input_data=input_data,
                    response_schema=response_schema,
                )

                if (
                    response.status_code == httpx.codes.TOO_MANY_REQUESTS
                    and self.fallback_model
                    and self.fallback_model != self.model
                ):
                    logger.warning(
                        "Gemini primary model rate limited; retrying configured fallback."
                    )
                    response = self._post_interaction(
                        client=client,
                        model=self.fallback_model,
                        input_data=input_data,
                        response_schema=response_schema,
                    )
            response.raise_for_status()
            output_text = self._extract_output_text(response.json())
            return output_model.model_validate_json(output_text)
        except GeminiConfigurationError:
            raise
        except Exception as exc:
            logger.error("Gemini request failed (%s).", type(exc).__name__)
            raise GeminiServiceError(
                "تعذر الحصول على نتيجة من خدمة الذكاء الاصطناعي."
            ) from exc

    def _post_interaction(
        self,
        *,
        client: httpx.Client,
        model: str,
        input_data: str | list[dict[str, str]],
        response_schema: dict[str, Any],
    ) -> httpx.Response:
        return client.post(
            "https://generativelanguage.googleapis.com/v1beta/interactions",
            headers={
                "x-goog-api-key": self.api_key,
                "Content-Type": "application/json",
            },
            json={
                "model": model,
                "input": input_data,
                "store": False,
                "response_format": {
                    "type": "text",
                    "mime_type": "application/json",
                    "schema": response_schema,
                },
            },
        )

    @staticmethod
    def _extract_output_text(interaction: dict[str, object]) -> str:
        direct_output = interaction.get("output_text")
        if isinstance(direct_output, str) and direct_output:
            return direct_output

        steps = interaction.get("steps")
        if isinstance(steps, list):
            for step in reversed(steps):
                if not isinstance(step, dict):
                    continue
                content = step.get("content")
                if isinstance(content, list):
                    for item in content:
                        if isinstance(item, dict) and isinstance(item.get("text"), str):
                            return item["text"]

        outputs = interaction.get("outputs")
        if isinstance(outputs, list):
            for item in reversed(outputs):
                if isinstance(item, dict) and isinstance(item.get("text"), str):
                    return item["text"]

        raise GeminiServiceError("لم تُرجع خدمة الذكاء الاصطناعي نصاً صالحاً.")

    @classmethod
    def _response_schema(cls, output_model: type[OutputModel]) -> dict[str, Any]:
        schema = copy.deepcopy(output_model.model_json_schema())

        if output_model is SimplificationOutput:
            properties = schema.get("properties")
            if isinstance(properties, dict):
                properties.pop("adaptation_strategy", None)
            required = schema.get("required")
            if isinstance(required, list):
                schema["required"] = [
                    field for field in required if field != "adaptation_strategy"
                ]

        return cls._sanitize_response_schema(schema)

    @classmethod
    def _sanitize_response_schema(cls, node: Any) -> Any:
        if isinstance(node, list):
            return [cls._sanitize_response_schema(item) for item in node]
        if not isinstance(node, dict):
            return node

        sanitized: dict[str, Any] = {}
        for key, value in node.items():
            if key in {"title", "description", "default", "examples"}:
                continue
            sanitized[key] = cls._sanitize_response_schema(value)

        if sanitized.get("type") == "integer" and "enum" in sanitized:
            sanitized.pop("enum", None)

        return sanitized

    @staticmethod
    def _build_simplification_prompt(
        reader: ReaderType,
        level: SimplificationLevel,
        source_instruction: str,
    ) -> str:
        reader_description = READER_DESCRIPTIONS[reader.value]
        level_description = LEVEL_DESCRIPTIONS[int(level)]
        strategy = build_adaptation_strategy(level)

        return f"""
أنت المساعد اللغوي لمنصة «وضّح»، وهي منصة عربية تساعد القارئ على فهم العربية والتقدم فيها.

المهمة: وضّح المحتوى وفق مستوى القارئ من دون تغيير المعنى أو حذف معلومات مهمة.

القارئ المستهدف:
{reader_description}

مستوى التوضيح:
{level_description}

استراتيجية التحكم في العربية:
- مستوى الهدف: {strategy.target_level_label}
- المفردات: {strategy.vocabulary_control}
- طول الجمل وبنيتها: {strategy.sentence_control}
- مقدار الشرح: {strategy.explanation_control}
- المصطلحات: {strategy.terminology_policy}

قواعد إلزامية:
- حافظ بدقة على جميع الأسماء والتواريخ والأرقام والمبالغ والمواعيد النهائية.
- حافظ على الشروط والمتطلبات والتحذيرات والاستثناءات والحقائق التقنية.
- لا تضف أي معلومة أو تفسير غير مدعوم بالمصدر.
- لا تختصر إذا كان الاختصار سيحذف معنى أو قيداً مهماً.
- استخدم العربية الفصحى الواضحة، ولا تستخدم اللهجة العامية.
- اجعل العبارات التعليمية قصيرة وطبيعية ومباشرة، وتجنب الصياغة المتكلفة وتكرار الفكرة نفسها.
- في النصوص العربية الموجهة للقارئ، سمِّ bridge «مسار التدرّج»، وقل «النص كما ورد» أو «صياغة المصدر». لا تستخدم الاسم الإنجليزي للميزة، ولا تستخدم مشتقات الجذر «أ ص ل» في وصف النص.
- إذا كان المستوى «كما ورد»، أعد النص من دون تغيير في simplified_text.
- أنشئ diacritized_text من simplified_text نفسه، وأضف التشكيل للكلمات الصعبة أو الملتبسة فقط، لا لكل النص.
- ترجم النص الواضح كاملاً إلى إنجليزية طبيعية ودقيقة في english_translation.
- لا تجعل الترجمة حرفية إذا كان ذلك سيشوّه المعنى، ولا تحذف أي شرط أو حقيقة.
- ضع في preserved_details أهم الأسماء والتواريخ والأرقام والشروط والتحذيرات التي حافظت عليها. يمكن أن تكون القائمة فارغة.
- ترجم عناصر preserved_details بدقة وبالترتيب نفسه إلى preserved_details_english.
- أنشئ بطاقتين أو ثلاثاً في learning_cards من المفردات العربية المفيدة، وتجنب الكلمات السهلة جداً.
- إذا كان المحتوى يصف عملية أو تسلسلاً، ضع مراحله في visual_steps؛ وإلا أعد قائمة فارغة.
- ترجم visual_steps بدقة وبالترتيب نفسه إلى visual_steps_english، أو أعد قائمة فارغة إذا كانت visual_steps فارغة.
- في change_map، اربط ما يصل إلى خمس عبارات من المصدر بما يقابلها في النص الواضح، واشرح سبب التغيير بالعربية في reason وبالإنجليزية في reason_english.
- أنشئ bridge يوجه القارئ من المستوى الحالي نحو صياغة المصدر عبر 3 إلى 5 مستويات مرتبة.
- يجب أن يحتوي bridge.levels على المستوى الحالي، ومستوى أو مستويين أغنى، ثم النص كما ورد إن أمكن.
- لا تجعل مستويات bridge نسخاً متطابقة إلا إذا كان مستوى الهدف «كما ورد».
- في كل انتقال، اشرح كلمة أو تركيباً أُعيد تقديمه ولماذا يساعد القارئ على فهم صياغة أغنى.
- أنشئ سؤال فهم واحداً وإجابة موجزة بالاعتماد على المصدر فقط، ثم أضف نسختهما الإنجليزية في question_english وanswer_english.

{source_instruction}
""".strip()


@lru_cache
def get_gemini_service() -> GeminiService:
    settings = get_settings()
    return GeminiService(
        api_key=settings.gemini_api_key,
        model=settings.ai_model,
        fallback_model=settings.ai_fallback_model,
        tts_model=settings.ai_tts_model,
        tts_arabic_voice=settings.ai_tts_arabic_voice,
        tts_english_voice=settings.ai_tts_english_voice,
    )
