import base64
import copy
import logging
from functools import lru_cache
from typing import Any, TypeVar

import httpx
from pydantic import BaseModel

from app.config import get_settings
from app.schemas import (
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
    3: "قياسي: عربية فصحى طبيعية مع الحفاظ على المصطلحات المهمة.",
    4: "متقدم: حافظ على الأسلوب الرسمي والمصطلحات، ووضّح التراكيب المعقدة فقط.",
    5: "أصلي: لا تعِد كتابة النص؛ أعده كما هو وقدّم الأدوات التعليمية فقط.",
}


class GeminiService:
    def __init__(self, api_key: str, model: str, fallback_model: str = "") -> None:
        self.api_key = api_key
        self.model = model
        self.fallback_model = fallback_model.strip()

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
                "واجعل جميع مستويات bridge عربية مقروءة. إذا تعذر الجزم بالصياغة الأصلية، فاجعل آخر "
                "مستوى نسخة عربية قياسية محافظة بدلاً من عرض نص مشوه."
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
أنت مرحلة تحقق مستقلة في منصة «وضّح». قارن النص الأصلي بالنص المتكيف.

النص الأصلي:
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
- إذا كان المستوى «أصلي»، أعد النص من دون تغيير في simplified_text.
- أنشئ diacritized_text من simplified_text نفسه، وأضف التشكيل للكلمات الصعبة أو الملتبسة فقط، لا لكل النص.
- ترجم النص الواضح كاملاً إلى إنجليزية طبيعية ودقيقة في english_translation.
- لا تجعل الترجمة حرفية إذا كان ذلك سيشوّه المعنى، ولا تحذف أي شرط أو حقيقة.
- ضع في preserved_details أهم الأسماء والتواريخ والأرقام والشروط والتحذيرات التي حافظت عليها. يمكن أن تكون القائمة فارغة.
- ترجم عناصر preserved_details بدقة وبالترتيب نفسه إلى preserved_details_english.
- أنشئ بطاقتين أو ثلاثاً في learning_cards من المفردات العربية المفيدة، وتجنب الكلمات السهلة جداً.
- إذا كان المحتوى يصف عملية أو تسلسلاً، ضع مراحله في visual_steps؛ وإلا أعد قائمة فارغة.
- ترجم visual_steps بدقة وبالترتيب نفسه إلى visual_steps_english، أو أعد قائمة فارغة إذا كانت visual_steps فارغة.
- في change_map، اربط ما يصل إلى خمس عبارات أصلية بما يقابلها في النص الواضح، واشرح سبب التغيير بالعربية في reason وبالإنجليزية في reason_english.
- أنشئ bridge يوجه القارئ من المستوى الحالي نحو النص الأصلي عبر 3 إلى 5 مستويات مرتبة.
- يجب أن يحتوي bridge.levels على المستوى الحالي، ومستوى أو مستويين أغنى، ثم المستوى الأصلي إن أمكن.
- لا تجعل مستويات bridge نسخاً متطابقة إلا إذا كان مستوى الهدف أصلياً.
- في كل انتقال، اشرح كلمة أو تركيباً أُعيد إدخاله ولماذا يساعد القارئ على الاقتراب من الأصل.
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
    )
