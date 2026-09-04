import io
import logging

from fastapi.testclient import TestClient
from pypdf import PdfWriter

from app.main import app
from app.schemas import (
    BridgeLevel,
    BridgeMode,
    BridgeTransition,
    ChangeItem,
    ConfidenceLevel,
    ComprehensionCheck,
    CulturalMeaningItem,
    LearningCard,
    MeaningThread,
    PdfSimplificationOutput,
    PoetryLineExplanation,
    PoetryOutput,
    PoetryVocabularyItem,
    SimplificationOutput,
    SimplificationLevel,
    TransferChallengeOutput,
    WordExplanation,
)
from app.services.gemini import GeminiService, get_gemini_service

client = TestClient(app)


def test_health() -> None:
    response = client.get("/api/health")

    assert response.status_code == 200
    assert response.json() == {"status": "ok", "service": "waddeh-api"}


class FakeGeminiService:
    def simplify(self, _request: object) -> SimplificationOutput:
        return SimplificationOutput(
            simplified_text="يجب على المتقدم إكمال الشروط قبل انتهاء الوقت المحدد.",
            diacritized_text="يَجِبُ على المُتَقَدِّم إكمال الشروط قبل انتهاء الوقت المحدد.",
            english_translation="The applicant must complete the requirements before the deadline.",
            preserved_details=["الموعد المحدد"],
            preserved_details_english=["the stated deadline"],
            learning_cards=[
                LearningCard(
                    term="المتقدم",
                    simple_meaning="الشخص الذي يقدم الطلب",
                    english_meaning="applicant",
                )
            ],
            visual_steps=["إكمال الشروط", "تقديم الطلب قبل الموعد"],
            visual_steps_english=["Complete the requirements", "Submit before the deadline"],
            change_map=[
                ChangeItem(
                    original="استيفاء جميع الشروط",
                    clear="إكمال الشروط",
                    reason="عبارة أقصر وأكثر شيوعاً.",
                    reason_english="A shorter, more familiar expression.",
                )
            ],
            meaning_threads=[
                MeaningThread(
                    kind="pronoun",
                    sentence="يجب على المتقدم إكمال الشروط قبل انتهاء الوقت المحدد.",
                    focus="المتقدم",
                    connects_to="هو",
                    relation="الضمير يعود إلى المتقدم.",
                    relation_english="The pronoun refers to the applicant.",
                    explanation="المتقدم هو الشخص المقصود بالفعل والشرط في هذه الجملة.",
                    explanation_english=(
                        "The applicant is the person connected to the action and condition."
                    ),
                )
            ],
            cultural_meanings=[
                CulturalMeaningItem(
                    expression="الوقت من ذهب",
                    kind="proverb",
                    literal_meaning="يشبّه الوقت بشيء ثمين كالذهب.",
                    literal_meaning_english="It compares time to something as precious as gold.",
                    intended_meaning="الوقت ثمين، فلا ينبغي إضاعته.",
                    cultural_context="يُقال للحث على استثمار الوقت وعدم تأجيل العمل.",
                    cultural_context_english=(
                        "It encourages people to use their time well and avoid delaying work."
                    ),
                    english_meaning="Time is valuable and should not be wasted.",
                    english_equivalent="Time is money.",
                    confidence=ConfidenceLevel.high,
                )
            ],
            bridge=BridgeMode(
                current_level=SimplificationLevel.easy,
                guidance="انتقل من النص السهل إلى صياغة أغنى عبر إعادة مفردة واحدة في كل خطوة.",
                guidance_english="Move from clear Arabic to the original by reintroducing one item at a time.",
                levels=[
                    BridgeLevel(
                        level=SimplificationLevel.easy,
                        label_ar="سهل",
                        label_en="Easy",
                        text="يجب على الشخص إكمال الشروط قبل انتهاء الموعد.",
                        reintroduced_items=[],
                    ),
                    BridgeLevel(
                        level=SimplificationLevel.standard,
                        label_ar="متوسط",
                        label_en="Standard",
                        text="يجب على المتقدم استيفاء الشروط قبل انتهاء الموعد.",
                        reintroduced_items=[
                            BridgeTransition(
                                simpler_phrase="الشخص",
                                richer_phrase="المتقدم",
                                explanation="أعيدت كلمة المتقدم لأنها أدق في سياق الطلبات.",
                                explanation_english="Applicant is more precise for application contexts.",
                            )
                        ],
                    ),
                    BridgeLevel(
                        level=SimplificationLevel.original,
                        label_ar="كما ورد",
                        label_en="Original",
                        text="يتعين على المتقدم استيفاء جميع الشروط قبل انقضاء الموعد المحدد.",
                        reintroduced_items=[],
                    ),
                ],
            ),
            comprehension_check=ComprehensionCheck(
                question="متى يجب إكمال الشروط؟",
                answer="قبل انتهاء الوقت المحدد.",
                question_english="When must the requirements be completed?",
                answer_english="Before the stated deadline.",
                choices=[
                    "بعد انتهاء الوقت المحدد.",
                    "قبل انتهاء الوقت المحدد.",
                    "في أي وقت.",
                ],
                choices_english=[
                    "After the stated deadline.",
                    "Before the stated deadline.",
                    "At any time.",
                ],
                correct_choice_index=1,
            ),
        )

    def simplify_pdf(self, *_args: object) -> PdfSimplificationOutput:
        result = self.simplify(object())
        return PdfSimplificationOutput(
            original_text=(
                "القسم الأول\n"
                "يتعين على المتقدم استيفاء جميع الشروط قبل انقضاء الموعد المحدد.\n\n"
                "القسم الثاني\n"
                "لن تُقبل الطلبات المتأخرة."
            ),
            **result.model_dump(),
        )

    def explain_word(self, _request: object) -> WordExplanation:
        return WordExplanation(
            word="المتقدم",
            diacritized_word="المُتَقَدِّم",
            meaning="الشخص الذي يقدم الطلب",
            root="ق د م",
            synonym="مقدم الطلب",
            english="applicant",
        )

    def create_transfer_challenge(self, request: object) -> TransferChallengeOutput:
        word = request.word  # type: ignore[attr-defined]
        english = request.english_meaning or "the target word"  # type: ignore[attr-defined]
        return TransferChallengeOutput(
            word=word,
            prompt_arabic="ظهرت ____ في موقف جديد يوضّح معناها.",
            prompt_english="____ appeared in a new situation that shows its meaning.",
            choices_arabic=["التردد", word, "التجاهل"],
            choices_english=["hesitation", english, "neglect"],
            correct_choice_index=1,
            explanation_arabic=f"تناسب «{word}» السياق لأنها تحمل المعنى الذي تعلّمته.",
            explanation_english="The target word fits because it carries the meaning you learned.",
        )

    def explain_poetry(self, _request: object) -> PoetryOutput:
        return PoetryOutput(
            overview="تأتي الأعمال الكبيرة بقدر عزيمة أصحابها.",
            overview_english="Great achievements reflect the determination of those who pursue them.",
            english_translation=(
                "Determination comes in measure with those of resolve,\n"
                "and noble deeds come in measure with the noble."
            ),
            lines=[
                PoetryLineExplanation(
                    verse="على قدر أهل العزم تأتي العزائم",
                    clear_meaning="تكون الأعمال الكبيرة بقدر قوة إرادة أصحابها.",
                    english_translation="Determination comes in measure with those of resolve.",
                ),
                PoetryLineExplanation(
                    verse="وتأتي على قدر الكرام المكارم",
                    clear_meaning="وتظهر الأعمال النبيلة بقدر نبل أصحابها.",
                    english_translation="Noble deeds come in measure with the noble.",
                ),
            ],
            vocabulary=[
                PoetryVocabularyItem(
                    word="العزم",
                    diacritized_word="العَزْم",
                    meaning="قوة الإرادة",
                    english="determination",
                    verse="على قدر أهل العزم تأتي العزائم",
                ),
                PoetryVocabularyItem(
                    word="المكارم",
                    diacritized_word="المَكارِم",
                    meaning="الأعمال النبيلة",
                    english="noble deeds",
                    verse="وتأتي على قدر الكرام المكارم",
                ),
            ],
            cultural_meanings=[
                CulturalMeaningItem(
                    expression="على قدر أهل العزم تأتي العزائم",
                    kind="metaphor",
                    literal_meaning="تأتي العزائم بمقدار أصحاب العزم.",
                    literal_meaning_english="Determination comes in proportion to people of resolve.",
                    intended_meaning="تكبر الإنجازات حين تقوى إرادة أصحابها.",
                    cultural_context="يبني البيت موازنةً بين قوة الإرادة وعظمة العمل ليجعل المعنى أكثر رسوخاً.",
                    cultural_context_english="The verse balances strength of will with greatness of action to make the idea memorable.",
                    english_meaning="Great achievements grow from strong determination.",
                    english_equivalent="Where there is a will, there is a way.",
                    confidence="high",
                )
            ],
        )


def test_simplify() -> None:
    app.dependency_overrides[get_gemini_service] = lambda: FakeGeminiService()
    try:
        response = client.post(
            "/api/simplify",
            json={
                "text": "يتعين على المتقدم استيفاء جميع الشروط قبل انقضاء الموعد المحدد.",
                "reader": "general_reader",
                "level": 2,
            },
        )
    finally:
        app.dependency_overrides.clear()

    assert response.status_code == 200
    assert response.json()["level"] == 2
    assert response.json()["readability"]["heuristic_estimate"]["status"] == "heuristic"
    assert response.json()["meaning_integrity"]["status"] == "no_issue_detected"
    assert response.json()["bridge"]["levels"][-1]["level"] == 5
    assert "إكمال الشروط" in response.json()["simplified_text"]
    assert "applicant" in response.json()["english_translation"]
    assert response.json()["learning_cards"][0]["term"] == "المتقدم"
    assert response.json()["meaning_threads"][0]["kind"] == "pronoun"
    assert response.json()["cultural_meanings"][0]["expression"] == "الوقت من ذهب"
    assert response.json()["cultural_meanings"][0]["english_equivalent"] == "Time is money."


def test_simplify_uses_one_generation_and_deterministic_integrity(caplog) -> None:
    class CountingGeminiService(FakeGeminiService):
        simplify_calls = 0
        verify_integrity_calls = 0

        def simplify(self, request: object) -> SimplificationOutput:
            self.simplify_calls += 1
            return super().simplify(request)

        def verify_integrity(self, *_args: object) -> None:
            self.verify_integrity_calls += 1
            raise AssertionError("Semantic verification must not run on /api/simplify.")

    service = CountingGeminiService()
    app.dependency_overrides[get_gemini_service] = lambda: service
    caplog.set_level(logging.INFO, logger="app.main")
    try:
        response = client.post(
            "/api/simplify",
            json={
                "text": "يجب تقديم 3 مستندات قبل 30 أغسطس 2026 لإكمال الطلب.",
                "reader": "general_reader",
                "level": 2,
            },
        )
    finally:
        app.dependency_overrides.clear()

    assert response.status_code == 200
    assert service.simplify_calls == 1
    assert service.verify_integrity_calls == 0
    integrity = response.json()["meaning_integrity"]
    assert integrity["semantic_verification"] is None
    assert integrity["deterministic_checks"]
    assert integrity["status"] == "needs_attention"
    assert "Simplify main Gemini generation duration_seconds=" in caplog.text
    assert "Simplify deterministic integrity duration_seconds=" in caplog.text
    assert "Simplify total processing duration_seconds=" in caplog.text


def test_simplify_receives_personal_reading_memory() -> None:
    class CapturingGeminiService(FakeGeminiService):
        received_memory = None

        def simplify(self, request: object) -> SimplificationOutput:
            self.received_memory = request.reading_memory  # type: ignore[attr-defined]
            return super().simplify(request)

    service = CapturingGeminiService()
    app.dependency_overrides[get_gemini_service] = lambda: service
    try:
        response = client.post(
            "/api/simplify",
            json={
                "text": "يتعين على المتقدم استيفاء جميع الشروط قبل انقضاء الموعد المحدد.",
                "reader": "general_reader",
                "level": 2,
                "reading_memory": {
                    "mastered_terms": ["المتقدم"],
                    "learning_terms": ["استيفاء الشروط"],
                    "difficulty_focus": ["pronoun", "condition"],
                },
            },
        )
    finally:
        app.dependency_overrides.clear()

    assert response.status_code == 200
    assert service.received_memory is not None
    assert service.received_memory.mastered_terms == ["المتقدم"]
    assert service.received_memory.difficulty_focus[0].value == "pronoun"


def test_simplify_rejects_non_arabic_text() -> None:
    response = client.post(
        "/api/simplify",
        json={"text": "This text contains no Arabic letters at all.", "level": 2},
    )

    assert response.status_code == 422


def make_pdf(page_count: int) -> bytes:
    writer = PdfWriter()
    for _ in range(page_count):
        writer.add_blank_page(width=595, height=842)
    output = io.BytesIO()
    writer.write(output)
    return output.getvalue()


def test_pdf_understanding_accepts_valid_pdf_bytes() -> None:
    app.dependency_overrides[get_gemini_service] = lambda: FakeGeminiService()
    try:
        response = client.post(
            "/api/upload/pdf?reader=general_reader&level=2",
            content=make_pdf(1),
            headers={
                "Content-Type": "application/pdf",
                "X-File-Name": "sample-arabic.pdf",
            },
        )
    finally:
        app.dependency_overrides.clear()

    assert response.status_code == 200
    assert response.json()["source_name"] == "sample-arabic.pdf"
    assert response.json()["original_text"].startswith("القسم الأول")
    assert response.json()["original_text"] != response.json()["simplified_text"]


def test_pdf_understanding_accepts_five_pages() -> None:
    app.dependency_overrides[get_gemini_service] = lambda: FakeGeminiService()
    try:
        response = client.post(
            "/api/upload/pdf?reader=general_reader&level=2",
            content=make_pdf(5),
            headers={"Content-Type": "application/pdf"},
        )
    finally:
        app.dependency_overrides.clear()

    assert response.status_code == 200
    assert response.json()["original_text"].startswith("القسم الأول")


def test_pdf_understanding_accepts_four_pages() -> None:
    app.dependency_overrides[get_gemini_service] = lambda: FakeGeminiService()
    try:
        response = client.post(
            "/api/upload/pdf?reader=general_reader&level=2",
            content=make_pdf(4),
            headers={"Content-Type": "application/pdf"},
        )
    finally:
        app.dependency_overrides.clear()

    assert response.status_code == 200


def test_pdf_understanding_rejects_six_pages_before_ai_processing() -> None:
    class UnexpectedGeminiService(FakeGeminiService):
        def simplify_pdf(self, *_args: object) -> PdfSimplificationOutput:
            raise AssertionError("Six-page PDFs must be rejected before AI processing.")

    app.dependency_overrides[get_gemini_service] = lambda: UnexpectedGeminiService()
    try:
        response = client.post(
            "/api/upload/pdf",
            content=make_pdf(6),
            headers={"Content-Type": "application/pdf"},
        )
    finally:
        app.dependency_overrides.clear()

    assert response.status_code == 422
    assert "limited to 5 pages" in response.text


def test_pdf_understanding_rejects_invalid_file() -> None:
    response = client.post(
        "/api/upload/pdf",
        content=b"not a pdf",
        headers={"Content-Type": "application/pdf"},
    )

    assert response.status_code == 415


def test_word_lens() -> None:
    app.dependency_overrides[get_gemini_service] = lambda: FakeGeminiService()
    try:
        response = client.post(
            "/api/explain-word",
            json={
                "word": "المتقدم",
                "context": "يجب على المتقدم إكمال الشروط قبل الموعد.",
                "reader": "general_reader",
            },
        )
    finally:
        app.dependency_overrides.clear()

    assert response.status_code == 200
    assert response.json()["root"] == "ق د م"


def test_transfer_challenge_uses_a_new_context() -> None:
    app.dependency_overrides[get_gemini_service] = lambda: FakeGeminiService()
    try:
        response = client.post(
            "/api/learning/transfer-challenge",
            json={
                "word": "استيفاء",
                "meaning": "إكمال المتطلبات",
                "english_meaning": "meeting the requirements",
                "source_context": "يجب استيفاء الشروط قبل الموعد.",
                "reader": "general_reader",
                "level": 2,
            },
        )
    finally:
        app.dependency_overrides.clear()

    assert response.status_code == 200
    body = response.json()
    assert body["word"] == "استيفاء"
    assert body["prompt_arabic"].count("____") == 1
    assert body["choices_arabic"][body["correct_choice_index"]] == "استيفاء"
    assert len(body["choices_english"]) == 3


def test_transfer_challenge_rejects_non_arabic_word() -> None:
    response = client.post(
        "/api/learning/transfer-challenge",
        json={"word": "application", "meaning": "طلب", "level": 2},
    )

    assert response.status_code == 422


def test_poetry_explanation() -> None:
    app.dependency_overrides[get_gemini_service] = lambda: FakeGeminiService()
    try:
        response = client.post(
            "/api/poetry/explain",
            json={
                "text": "على قدر أهل العزم تأتي العزائم\nوتأتي على قدر الكرام المكارم",
                "reader": "general_reader",
                "level": 2,
            },
        )
    finally:
        app.dependency_overrides.clear()

    assert response.status_code == 200
    assert response.json()["lines"][0]["clear_meaning"]
    assert response.json()["vocabulary"][0]["english"] == "determination"
    assert "Determination" in response.json()["english_translation"]
    assert response.json()["cultural_meanings"][0]["kind"] == "metaphor"
    assert response.json()["cultural_meanings"][0]["expression"] in response.json()["original_text"]


def test_poetry_explanation_rejects_non_arabic_text() -> None:
    response = client.post(
        "/api/poetry/explain",
        json={"text": "This is not an Arabic poem.", "reader": "general_reader", "level": 2},
    )

    assert response.status_code == 422


def test_extracts_structured_text_from_interaction_steps() -> None:
    output = GeminiService._extract_output_text(
        {
            "steps": [
                {
                    "type": "model_output",
                    "content": [{"type": "text", "text": '{"simplified_text":"واضح"}'}],
                }
            ]
        }
    )

    assert output == '{"simplified_text":"واضح"}'
