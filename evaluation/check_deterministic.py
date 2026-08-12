from __future__ import annotations

import json
from pathlib import Path
import sys

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "backend"))

from app.schemas import IntegrityStatus  # noqa: E402
from app.services.integrity import build_deterministic_integrity_report  # noqa: E402
from app.services.readability import assess_readability  # noqa: E402


def main() -> int:
    samples_path = Path(__file__).with_name("arabic_samples.json")
    samples = json.loads(samples_path.read_text(encoding="utf-8"))
    failures: list[str] = []

    for sample in samples:
        text = sample["text"]
        assessment = assess_readability(text)
        if assessment.deterministic.sentence_count < sample["expected_min_sentences"]:
            failures.append(f"{sample['id']}: sentence count lower than expected")

        report = build_deterministic_integrity_report(text, text)
        if report.status not in {
            IntegrityStatus.no_issue_detected,
            IntegrityStatus.unavailable,
        }:
            failures.append(f"{sample['id']}: identical text should not lose deterministic facts")

    if failures:
        print("Deterministic evaluation failed:")
        for failure in failures:
            print(f"- {failure}")
        return 1

    print(f"Deterministic evaluation passed for {len(samples)} Arabic samples.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
