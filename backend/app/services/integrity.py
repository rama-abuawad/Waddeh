from collections import Counter
import re

from app.schemas import (
    ConfidenceLevel,
    DeterministicIntegrityCheck,
    IntegrityItemStatus,
    IntegrityStatus,
    MeaningIntegrityReport,
    SemanticIntegrityAssessment,
)

ARABIC_DIGITS = str.maketrans("٠١٢٣٤٥٦٧٨٩", "0123456789")

NUMBER_RE = re.compile(r"(?<![\w])[\d\u0660-\u0669]+(?:[.,٫][\d\u0660-\u0669]+)?(?![\w])")
PERCENT_RE = re.compile(r"[\d\u0660-\u0669]+(?:[.,٫][\d\u0660-\u0669]+)?\s*(?:%|٪|بالمئة|في المئة)")
CURRENCY_RE = re.compile(
    r"[\d\u0660-\u0669]+(?:[.,٫][\d\u0660-\u0669]+)?\s*"
    r"(?:درهم|دراهم|ريال|ريالات|دينار|دنانير|دولار|دولارات|يورو|جنيه|جنيهات)"
)
TIME_RE = re.compile(
    r"[\d\u0660-\u0669]{1,2}\s*(?::|٫)\s*[\d\u0660-\u0669]{2}|"
    r"[\d\u0660-\u0669]{1,2}\s*(?:صباحاً|مساءً|صباحا|مساء|ظهراً|ظهرا)"
)
DATE_RE = re.compile(
    r"[\d\u0660-\u0669]{1,2}\s+"
    r"(?:يناير|فبراير|مارس|أبريل|ابريل|مايو|يونيو|يوليو|أغسطس|اغسطس|سبتمبر|"
    r"أكتوبر|اكتوبر|نوفمبر|ديسمبر|رمضان|شوال|ذو\s+القعدة|ذو\s+الحجة)"
    r"(?:\s+[\d\u0660-\u0669]{2,4})?"
    r"|[\d\u0660-\u0669]{1,2}[/-][\d\u0660-\u0669]{1,2}[/-][\d\u0660-\u0669]{2,4}"
)
LIST_ITEM_RE = re.compile(r"(?m)^\s*(?:[-*•]|[\d\u0660-\u0669]+[.)])\s+")


def build_deterministic_integrity_report(
    source_text: str,
    adapted_text: str,
) -> MeaningIntegrityReport:
    if not source_text.strip():
        return MeaningIntegrityReport(
            status=IntegrityStatus.unavailable,
            confidence=ConfidenceLevel.low,
            warnings=[
                "لا يتوفر نص المصدر الكامل للفحص الحتمي؛ يمكن استخدام التحقق الدلالي فقط."
            ],
        )

    checks: list[DeterministicIntegrityCheck] = []
    for kind, pattern in (
        ("percentage", PERCENT_RE),
        ("currency", CURRENCY_RE),
        ("date", DATE_RE),
        ("time", TIME_RE),
        ("number", NUMBER_RE),
    ):
        checks.extend(_compare_matches(kind, pattern, source_text, adapted_text))

    checks.extend(_compare_list_count(source_text, adapted_text))
    missing = [check for check in checks if check.status == IntegrityItemStatus.missing]
    preserved = [check for check in checks if check.status == IntegrityItemStatus.preserved]

    if missing:
        status = IntegrityStatus.needs_attention
        confidence = ConfidenceLevel.medium
    elif checks:
        status = IntegrityStatus.no_issue_detected
        confidence = ConfidenceLevel.medium
    else:
        status = IntegrityStatus.no_issue_detected
        confidence = ConfidenceLevel.low

    warnings = [
        f"قد يكون العنصر '{check.value}' مفقوداً من النص المتكيف."
        for check in missing[:6]
    ]
    if not checks:
        warnings.append("لم يجد الفحص الحتمي أرقاماً أو تواريخ أو قوائم واضحة للمقارنة.")

    return MeaningIntegrityReport(
        status=status,
        confidence=confidence,
        deterministic_checks=checks,
        preserved_items=[_item_label(check) for check in preserved[:16]],
        missing_items=[_item_label(check) for check in missing[:16]],
        warnings=warnings,
    )


def combine_integrity_reports(
    deterministic: MeaningIntegrityReport,
    semantic: SemanticIntegrityAssessment | None,
) -> MeaningIntegrityReport:
    if semantic is None:
        return deterministic

    status = deterministic.status
    if (
        deterministic.status == IntegrityStatus.needs_attention
        or semantic.status == IntegrityStatus.needs_attention
    ):
        status = IntegrityStatus.needs_attention
    elif deterministic.status == IntegrityStatus.unavailable:
        status = semantic.status

    confidence = semantic.confidence
    if deterministic.status == IntegrityStatus.needs_attention:
        confidence = ConfidenceLevel.medium
    elif deterministic.confidence == ConfidenceLevel.low and semantic.confidence == ConfidenceLevel.low:
        confidence = ConfidenceLevel.low

    return MeaningIntegrityReport(
        status=status,
        confidence=confidence,
        deterministic_checks=deterministic.deterministic_checks,
        preserved_items=_dedupe(deterministic.preserved_items + semantic.preserved_items)[:16],
        changed_items=_dedupe(deterministic.changed_items + semantic.changed_items)[:16],
        missing_items=_dedupe(deterministic.missing_items + semantic.missing_items)[:16],
        warnings=_dedupe(deterministic.warnings + semantic.warnings)[:12],
        semantic_verification=semantic,
    )


def _compare_matches(
    kind: str,
    pattern: re.Pattern[str],
    source_text: str,
    adapted_text: str,
) -> list[DeterministicIntegrityCheck]:
    source_values = _match_values(pattern, source_text)
    adapted_values = Counter(value.normalized for value in _match_values(pattern, adapted_text))
    source_counts = Counter(value.normalized for value in source_values)
    display_by_value = {value.normalized: value.display for value in source_values}
    checks: list[DeterministicIntegrityCheck] = []

    for normalized, source_count in source_counts.items():
        adapted_count = adapted_values.get(normalized, 0)
        checks.append(
            DeterministicIntegrityCheck(
                kind=kind,
                value=display_by_value[normalized],
                source_count=source_count,
                adapted_count=adapted_count,
                status=(
                    IntegrityItemStatus.preserved
                    if adapted_count >= source_count
                    else IntegrityItemStatus.missing
                ),
            )
        )
    return checks


def _compare_list_count(source_text: str, adapted_text: str) -> list[DeterministicIntegrityCheck]:
    source_count = len(LIST_ITEM_RE.findall(source_text))
    adapted_count = len(LIST_ITEM_RE.findall(adapted_text))
    if source_count == 0:
        return []
    return [
        DeterministicIntegrityCheck(
            kind="list_count",
            value=str(source_count),
            source_count=source_count,
            adapted_count=adapted_count,
            status=(
                IntegrityItemStatus.preserved
                if adapted_count == source_count
                else IntegrityItemStatus.changed
            ),
            note="يقارن عدد عناصر القائمة الظاهرة فقط.",
        )
    ]


class _MatchValue:
    def __init__(self, display: str) -> None:
        self.display = display.strip()
        self.normalized = _normalize_fact(display)


def _match_values(pattern: re.Pattern[str], text: str) -> list[_MatchValue]:
    return [_MatchValue(match.group(0)) for match in pattern.finditer(text)]


def _normalize_fact(value: str) -> str:
    return (
        value.translate(ARABIC_DIGITS)
        .replace("٫", ".")
        .replace("،", ",")
        .replace("  ", " ")
        .strip()
    )


def _item_label(check: DeterministicIntegrityCheck) -> str:
    return f"{check.kind}: {check.value}"


def _dedupe(items: list[str]) -> list[str]:
    seen: set[str] = set()
    result: list[str] = []
    for item in items:
        if item in seen:
            continue
        seen.add(item)
        result.append(item)
    return result
