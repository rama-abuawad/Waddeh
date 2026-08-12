import re

from app.schemas import (
    AnalysisStatus,
    ConfidenceLevel,
    DeterministicReadabilitySignals,
    ReadabilityAssessment,
    ReadabilityEstimate,
    ReadabilityLevel,
    SimplificationLevel,
)

ARABIC_WORD_RE = re.compile(r"[\u0621-\u064a\u066e-\u06d3\u06fa-\u06ff]+", re.UNICODE)
SENTENCE_RE = re.compile(r"[^.!؟?؛;\n]+", re.UNICODE)
NUMBER_RE = re.compile(r"[\d\u0660-\u0669]+(?:[.,٫]\d+)?", re.UNICODE)

FORMAL_TERMS = {
    "يتعين",
    "استيفاء",
    "المنصوص",
    "انقضاء",
    "المهلة",
    "المحدد",
    "المحددة",
    "وفقاً",
    "بموجب",
    "إخطار",
    "المتقدم",
    "المتطلبات",
    "الشروط",
    "الإجراءات",
    "اللائحة",
    "الاعتماد",
}

TECHNICAL_TERMS = {
    "النظام",
    "البيانات",
    "الخوارزمية",
    "الذكاء",
    "الاصطناعي",
    "المنصة",
    "واجهة",
    "البرمجة",
    "الخادم",
    "التشفير",
    "المصادقة",
    "النموذج",
    "الملف",
    "قاعدة",
}

DATE_TERMS = {
    "يناير",
    "فبراير",
    "مارس",
    "أبريل",
    "ابريل",
    "مايو",
    "يونيو",
    "يوليو",
    "أغسطس",
    "اغسطس",
    "سبتمبر",
    "أكتوبر",
    "اكتوبر",
    "نوفمبر",
    "ديسمبر",
    "رمضان",
    "شوال",
    "ذو",
}


def assess_readability(text: str) -> ReadabilityAssessment:
    sentences = _split_sentences(text)
    words = _arabic_words(text)
    word_count = len(words)
    sentence_count = len(sentences)
    average_sentence_length = round(word_count / sentence_count, 1) if sentence_count else 0

    long_sentences = [
        sentence for sentence in sentences if len(_arabic_words(sentence)) >= 22
    ]
    difficult_words = _unique_in_order(
        word for word in words if len(word) >= 8 and word not in FORMAL_TERMS
    )[:12]
    formal_terms = _unique_in_order(word for word in words if word in FORMAL_TERMS)[:12]
    technical_terms = _unique_in_order(word for word in words if word in TECHNICAL_TERMS)[:12]
    date_count = sum(1 for word in words if word in DATE_TERMS)
    numeric_count = len(NUMBER_RE.findall(text))

    reasons = _build_reasons(
        average_sentence_length=average_sentence_length,
        long_sentence_count=len(long_sentences),
        difficult_words=difficult_words,
        formal_terms=formal_terms,
        technical_terms=technical_terms,
        numeric_count=numeric_count,
        date_count=date_count,
    )
    estimated_level, recommended_level, confidence = _estimate_level(
        average_sentence_length=average_sentence_length,
        long_sentence_count=len(long_sentences),
        difficult_words=difficult_words,
        formal_terms=formal_terms,
        technical_terms=technical_terms,
        numeric_count=numeric_count,
        date_count=date_count,
    )

    deterministic = DeterministicReadabilitySignals(
        sentence_count=sentence_count,
        word_count=word_count,
        average_sentence_length=average_sentence_length,
        long_sentence_count=len(long_sentences),
        long_sentence_examples=long_sentences[:3],
        difficult_vocabulary_indicators=difficult_words,
        formal_vocabulary_indicators=formal_terms,
        technical_vocabulary_indicators=technical_terms,
        numeric_item_count=numeric_count,
        date_reference_count=date_count,
        reasons=reasons,
    )

    heuristic = ReadabilityEstimate(
        status=AnalysisStatus.heuristic,
        estimated_level=estimated_level,
        recommended_level=recommended_level,
        confidence=confidence,
        reasons=reasons,
    )

    return ReadabilityAssessment(deterministic=deterministic, heuristic_estimate=heuristic)


def _split_sentences(text: str) -> list[str]:
    return [match.group(0).strip() for match in SENTENCE_RE.finditer(text) if match.group(0).strip()]


def _arabic_words(text: str) -> list[str]:
    return [match.group(0) for match in ARABIC_WORD_RE.finditer(text)]


def _unique_in_order(values: object) -> list[str]:
    seen: set[str] = set()
    result: list[str] = []
    for value in values:
        if not isinstance(value, str) or value in seen:
            continue
        seen.add(value)
        result.append(value)
    return result


def _build_reasons(
    *,
    average_sentence_length: float,
    long_sentence_count: int,
    difficult_words: list[str],
    formal_terms: list[str],
    technical_terms: list[str],
    numeric_count: int,
    date_count: int,
) -> list[str]:
    reasons: list[str] = []
    if average_sentence_length >= 22:
        reasons.append("متوسط طول الجملة مرتفع.")
    elif average_sentence_length >= 15:
        reasons.append("توجد جمل متوسطة الطول تحتاج متابعة دقيقة.")
    if long_sentence_count == 1:
        reasons.append("توجد جملة طويلة أو مركبة.")
    elif long_sentence_count == 2:
        reasons.append("توجد جملتان طويلتان أو مركبتان.")
    elif long_sentence_count:
        reasons.append(f"توجد {long_sentence_count} جمل طويلة أو مركبة.")
    if formal_terms:
        reasons.append("يظهر في النص أسلوب رسمي أو إداري.")
    if technical_terms:
        reasons.append("يحتوي النص على مفردات تقنية أو تخصصية.")
    if difficult_words:
        reasons.append("توجد مفردات طويلة أو غير مألوفة قد تحتاج شرحاً.")
    if numeric_count or date_count:
        reasons.append("يتضمن النص أرقاماً أو تواريخ يجب الحفاظ عليها بدقة.")
    if not reasons:
        reasons.append("النص قصير نسبياً ومباشر.")
    return reasons[:8]


def _estimate_level(
    *,
    average_sentence_length: float,
    long_sentence_count: int,
    difficult_words: list[str],
    formal_terms: list[str],
    technical_terms: list[str],
    numeric_count: int,
    date_count: int,
) -> tuple[ReadabilityLevel, SimplificationLevel, ConfidenceLevel]:
    score = 0
    if average_sentence_length >= 22:
        score += 3
    elif average_sentence_length >= 15:
        score += 2
    elif average_sentence_length >= 9:
        score += 1

    score += min(long_sentence_count, 3)
    score += 2 if len(formal_terms) >= 3 else 1 if formal_terms else 0
    score += 2 if len(technical_terms) >= 3 else 1 if technical_terms else 0
    score += 1 if len(difficult_words) >= 4 else 0
    score += 1 if numeric_count + date_count >= 3 else 0

    if score >= 7:
        return ReadabilityLevel.advanced, SimplificationLevel.easy, ConfidenceLevel.medium
    if score >= 4:
        return ReadabilityLevel.standard, SimplificationLevel.easy, ConfidenceLevel.medium
    if score >= 2:
        return ReadabilityLevel.easy, SimplificationLevel.easy, ConfidenceLevel.medium
    return ReadabilityLevel.beginner, SimplificationLevel.very_easy, ConfidenceLevel.high
