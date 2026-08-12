from app.schemas import IntegrityStatus, SimplificationLevel
from app.services.integrity import build_deterministic_integrity_report
from app.services.readability import assess_readability


def test_readability_assessment_reports_deterministic_signals() -> None:
    text = (
        "يتعين على المتقدم استيفاء جميع المتطلبات المنصوص عليها قبل انقضاء "
        "المهلة المحددة في 30 أغسطس 2026. ويجب تقديم 3 وثائق رسمية."
    )

    assessment = assess_readability(text)

    assert assessment.deterministic.sentence_count == 2
    assert assessment.deterministic.word_count > 10
    assert assessment.deterministic.date_reference_count == 1
    assert assessment.deterministic.numeric_item_count >= 2
    assert "يتعين" in assessment.deterministic.formal_vocabulary_indicators
    assert assessment.heuristic_estimate.status == "heuristic"
    assert assessment.heuristic_estimate.recommended_level in {
        SimplificationLevel.easy,
        SimplificationLevel.very_easy,
    }


def test_integrity_preserves_numbers_and_dates() -> None:
    source = "يجب تقديم 3 وثائق قبل تاريخ 30 أغسطس 2026."
    adapted = "يجب أن تقدم 3 وثائق قبل 30 أغسطس 2026."

    report = build_deterministic_integrity_report(source, adapted)

    assert report.status == IntegrityStatus.no_issue_detected
    assert any(check.value == "3" and check.status == "preserved" for check in report.deterministic_checks)
    assert any("30 أغسطس 2026" in check.value for check in report.deterministic_checks)


def test_integrity_flags_missing_number() -> None:
    source = "يجب تقديم 3 وثائق قبل تاريخ 30 أغسطس 2026."
    adapted = "يجب تقديم الوثائق قبل تاريخ 30 أغسطس 2026."

    report = build_deterministic_integrity_report(source, adapted)

    assert report.status == IntegrityStatus.needs_attention
    assert any(check.value == "3" and check.status == "missing" for check in report.deterministic_checks)
