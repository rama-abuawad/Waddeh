from fastapi.testclient import TestClient

from app.main import app
from app.schemas import (
    BridgeLevel,
    BridgeMode,
    BridgeTransition,
    ChangeItem,
    ConfidenceLevel,
    ComprehensionCheck,
    LearningCard,
    MeaningThread,
    PoetryLineExplanation,
    PoetryOutput,
    PoetryVocabularyItem,
    SemanticIntegrityAssessment,
    SimplificationOutput,
    SimplificationLevel,
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

    def simplify_pdf(self, *_args: object) -> SimplificationOutput:
        return self.simplify(object())

    def verify_integrity(self, *_args: object) -> SemanticIntegrityAssessment:
        return SemanticIntegrityAssessment(
            status="no_issue_detected",
            confidence=ConfidenceLevel.medium,
            preserved_items=["الموعد المحدد محفوظ"],
            changed_items=[],
            missing_items=[],
            warnings=[],
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


def test_pdf_understanding_accepts_valid_pdf_bytes() -> None:
    app.dependency_overrides[get_gemini_service] = lambda: FakeGeminiService()
    try:
        response = client.post(
            "/api/upload/pdf?reader=general_reader&level=2",
            content=b"%PDF-1.7\n% test document",
            headers={
                "Content-Type": "application/pdf",
                "X-File-Name": "sample-arabic.pdf",
            },
        )
    finally:
        app.dependency_overrides.clear()

    assert response.status_code == 200
    assert response.json()["source_name"] == "sample-arabic.pdf"
    assert response.json()["original_text"] == ""


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
