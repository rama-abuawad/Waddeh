from enum import Enum, IntEnum

from pydantic import BaseModel, Field, field_validator


class ReaderType(str, Enum):
    child = "child"
    general_reader = "general_reader"
    non_arabic_speaker = "non_arabic_speaker"


class SimplificationLevel(IntEnum):
    very_easy = 1
    easy = 2
    standard = 3
    advanced = 4
    original = 5


class SimplifyRequest(BaseModel):
    text: str = Field(min_length=20, max_length=15_000)
    reader: ReaderType = ReaderType.general_reader
    level: SimplificationLevel = SimplificationLevel.easy

    @field_validator("text")
    @classmethod
    def text_must_contain_arabic(cls, value: str) -> str:
        cleaned = value.strip()
        if not any("\u0600" <= character <= "\u06ff" for character in cleaned):
            raise ValueError("يجب أن يحتوي النص على حروف عربية.")
        return cleaned


class LearningCard(BaseModel):
    term: str = Field(description="An important Arabic word or expression from the text.")
    simple_meaning: str = Field(description="Its short, contextual meaning in simple Arabic.")
    english_meaning: str = Field(description="Its concise contextual meaning in English.")


class ComprehensionCheck(BaseModel):
    question: str = Field(description="One short Arabic comprehension question grounded in the text.")
    answer: str = Field(description="A concise answer supported only by the text.")
    question_english: str = Field(description="An accurate English version of the question.")
    answer_english: str = Field(description="An accurate English version of the answer.")


class ChangeItem(BaseModel):
    original: str = Field(description="A short original Arabic phrase that was changed.")
    clear: str = Field(description="The corresponding phrase in clear Arabic.")
    reason: str = Field(description="A short, natural Arabic explanation of why the change helps.")
    reason_english: str = Field(description="A short English version of the explanation.")


class SimplificationOutput(BaseModel):
    simplified_text: str = Field(
        description="The complete simplified Arabic text, preserving every important fact."
    )
    diacritized_text: str = Field(
        description="The same clear Arabic, adding diacritics only to difficult or ambiguous words."
    )
    english_translation: str = Field(
        description="A natural, accurate English translation of the complete clear Arabic text."
    )
    preserved_details: list[str] = Field(
        min_length=0,
        max_length=8,
        description="Critical names, dates, numbers, requirements, or warnings preserved verbatim.",
    )
    preserved_details_english: list[str] = Field(
        min_length=0,
        max_length=8,
        description="Accurate English versions of the preserved critical details.",
    )
    learning_cards: list[LearningCard] = Field(
        min_length=0,
        max_length=3,
        description="Up to three useful Arabic words that help the reader progress toward the original.",
    )
    visual_steps: list[str] = Field(
        min_length=0,
        max_length=6,
        description="Ordered Arabic steps only when the text describes a process; otherwise empty.",
    )
    visual_steps_english: list[str] = Field(
        min_length=0,
        max_length=6,
        description="English versions of the ordered process steps; empty when visual_steps is empty.",
    )
    change_map: list[ChangeItem] = Field(
        min_length=0,
        max_length=5,
        description="Up to five meaningful phrase-level simplification changes.",
    )
    comprehension_check: ComprehensionCheck


class SimplifyResponse(SimplificationOutput):
    original_text: str
    reader: ReaderType
    level: SimplificationLevel
    source_name: str | None = None


class WordExplanationRequest(BaseModel):
    word: str = Field(min_length=1, max_length=80)
    context: str = Field(min_length=5, max_length=4_000)
    reader: ReaderType = ReaderType.general_reader

    @field_validator("word")
    @classmethod
    def word_must_contain_arabic(cls, value: str) -> str:
        cleaned = value.strip()
        if not any("\u0600" <= character <= "\u06ff" for character in cleaned):
            raise ValueError("اختر كلمة عربية.")
        return cleaned


class WordExplanation(BaseModel):
    word: str
    diacritized_word: str = Field(description="The word with helpful Arabic diacritics.")
    meaning: str = Field(description="A short contextual meaning in clear Arabic.")
    root: str = Field(description="The Arabic root letters, or غير معروف when uncertain.")
    synonym: str = Field(description="One simple Arabic synonym in this context.")
    english: str = Field(description="A concise contextual English meaning.")
