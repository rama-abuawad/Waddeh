import base64
import logging
from functools import lru_cache
from typing import TypeVar

import httpx
from pydantic import BaseModel

from app.config import get_settings
from app.schemas import (
    ReaderType,
    SimplificationLevel,
    SimplificationOutput,
    SimplifyRequest,
    WordExplanation,
    WordExplanationRequest,
)

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
    def __init__(self, api_key: str, model: str) -> None:
        self.api_key = api_key
        self.model = model

    def simplify(self, request: SimplifyRequest) -> SimplificationOutput:
        prompt = self._build_simplification_prompt(
            reader=request.reader,
            level=request.level,
            source_instruction=f"""النص العربي:
---
{request.text}
---""",
        )
        return self._generate(input_data=prompt, output_model=SimplificationOutput)

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
                "الصفحات المتكررة، ثم وضّح محتواه كوحدة مترابطة. لا تخترع نصاً غير ظاهر في المستند."
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
        return self._generate(input_data=input_data, output_model=SimplificationOutput)

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
            response = httpx.post(
                "https://generativelanguage.googleapis.com/v1beta/interactions",
                headers={
                    "x-goog-api-key": self.api_key,
                    "Content-Type": "application/json",
                },
                json={
                    "model": self.model,
                    "input": input_data,
                    "store": False,
                    "response_format": {
                        "type": "text",
                        "mime_type": "application/json",
                        "schema": output_model.model_json_schema(),
                    },
                },
                timeout=90.0,
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

    @staticmethod
    def _build_simplification_prompt(
        reader: ReaderType,
        level: SimplificationLevel,
        source_instruction: str,
    ) -> str:
        reader_description = READER_DESCRIPTIONS[reader.value]
        level_description = LEVEL_DESCRIPTIONS[int(level)]

        return f"""
أنت المساعد اللغوي لمنصة «وضّح»، وهي منصة عربية تساعد القارئ على فهم العربية والتقدم فيها.

المهمة: وضّح المحتوى وفق مستوى القارئ من دون تغيير المعنى أو حذف معلومات مهمة.

القارئ المستهدف:
{reader_description}

مستوى التوضيح:
{level_description}

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
- أنشئ سؤال فهم واحداً وإجابة موجزة بالاعتماد على المصدر فقط، ثم أضف نسختهما الإنجليزية في question_english وanswer_english.

{source_instruction}
""".strip()


@lru_cache
def get_gemini_service() -> GeminiService:
    settings = get_settings()
    return GeminiService(api_key=settings.gemini_api_key, model=settings.ai_model)
