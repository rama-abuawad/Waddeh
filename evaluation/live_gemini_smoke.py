from __future__ import annotations

import json
from pathlib import Path
import sys

if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8")
if hasattr(sys.stderr, "reconfigure"):
    sys.stderr.reconfigure(encoding="utf-8")

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "backend"))

from fastapi.testclient import TestClient  # noqa: E402

from app.main import app  # noqa: E402


SAMPLE_TEXT = (
    "يتعين على المتقدم استيفاء جميع المتطلبات المنصوص عليها قبل انقضاء "
    "المهلة المحددة، ولن تقبل الطلبات التي ترسل بعد تاريخ 30 أغسطس 2026. "
    "ويجب إرفاق 3 وثائق رسمية قبل الساعة الخامسة مساءً."
)


def main() -> int:
    client = TestClient(app)
    failures: list[str] = []

    health = client.get("/api/health")
    if health.status_code != 200:
        failures.append(f"health returned {health.status_code}")

    readability = client.post("/api/readability", json={"text": SAMPLE_TEXT})
    if readability.status_code != 200:
        failures.append(f"readability returned {readability.status_code}")
    else:
        readability_body = readability.json()
        if readability_body["heuristic_estimate"]["status"] != "heuristic":
            failures.append("readability estimate was not marked heuristic")
        if readability_body["deterministic"]["date_reference_count"] < 1:
            failures.append("readability did not detect the date reference")

    simplify = client.post(
        "/api/simplify",
        json={
            "text": SAMPLE_TEXT,
            "reader": "general_reader",
            "level": 2,
        },
    )
    if simplify.status_code != 200:
        failures.append(f"simplify returned {simplify.status_code}: {_safe_detail(simplify)}")
        result = None
    else:
        result = simplify.json()
        _validate_simplify_result(result, failures)

    if result:
        word = client.post(
            "/api/explain-word",
            json={
                "word": "المتقدم",
                "context": result["simplified_text"],
                "reader": "general_reader",
            },
        )
        if word.status_code != 200:
            failures.append(f"word lens returned {word.status_code}: {_safe_detail(word)}")
        else:
            word_body = word.json()
            for key in ("diacritized_word", "meaning", "root", "synonym", "english"):
                if not word_body.get(key):
                    failures.append(f"word lens missing {key}")

    pdf = client.post(
        "/api/upload/pdf?reader=general_reader&level=2",
        content=_sample_pdf_bytes(),
        headers={
            "Content-Type": "application/pdf",
            "X-File-Name": "waddeh-live-smoke.pdf",
        },
    )
    if pdf.status_code != 200:
        failures.append(f"pdf returned {pdf.status_code}: {_safe_detail(pdf)}")
    else:
        pdf_body = pdf.json()
        if pdf_body.get("source_name") != "waddeh-live-smoke.pdf":
            failures.append("pdf source_name was not preserved")
        _validate_simplify_result(pdf_body, failures, expect_original=False)

    if failures:
        print("Live Gemini smoke failed:")
        for failure in failures:
            print(f"- {failure}")
        return 1

    summary = {
        "health": "ok",
        "readability": "ok",
        "text_adaptation": "ok",
        "meaning_integrity": result["meaning_integrity"]["status"] if result else "not_run",
        "bridge_levels": len(result["bridge"]["levels"]) if result else 0,
        "word_lens": "ok",
        "pdf": "ok",
    }
    print(json.dumps(summary, ensure_ascii=False, sort_keys=True))
    return 0


def _validate_simplify_result(
    body: dict[str, object],
    failures: list[str],
    *,
    expect_original: bool = True,
) -> None:
    for key in (
        "simplified_text",
        "diacritized_text",
        "english_translation",
        "readability",
        "meaning_integrity",
        "bridge",
        "learning_cards",
        "change_map",
    ):
        if key not in body:
            failures.append(f"simplify response missing {key}")

    if expect_original and not body.get("original_text"):
        failures.append("text simplify response missing original_text")
    if not body.get("simplified_text"):
        failures.append("simplified_text was empty")
    if _has_encoding_artifact(body):
        failures.append("response included a visible PDF/text encoding artifact")

    integrity = body.get("meaning_integrity")
    if isinstance(integrity, dict):
        if integrity.get("status") not in {
            "no_issue_detected",
            "needs_attention",
            "unavailable",
        }:
            failures.append("meaning integrity status was invalid")
    else:
        failures.append("meaning_integrity was not an object")

    bridge = body.get("bridge")
    if isinstance(bridge, dict):
        levels = bridge.get("levels")
        if not isinstance(levels, list) or len(levels) < 3:
            failures.append("bridge did not include at least three levels")
        elif not all(isinstance(level, dict) and level.get("text") for level in levels):
            failures.append("one or more bridge levels were missing text")
    else:
        failures.append("bridge was not an object")


def _has_encoding_artifact(value: object) -> bool:
    if isinstance(value, str):
        return "þÿ" in value or "\ufffd" in value
    if isinstance(value, dict):
        return any(_has_encoding_artifact(item) for item in value.values())
    if isinstance(value, list):
        return any(_has_encoding_artifact(item) for item in value)
    return False


def _safe_detail(response: object) -> str:
    try:
        body = response.json()
    except Exception:
        return "no JSON body"
    detail = body.get("detail") if isinstance(body, dict) else None
    if isinstance(detail, str):
        return detail[:180]
    return "no safe detail"


def _sample_pdf_bytes() -> bytes:
    text = "يجب تقديم 3 وثائق قبل تاريخ 30 أغسطس 2026."
    utf16_hex = ("feff" + text.encode("utf-16-be").hex()).upper()
    objects = [
        b"1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n",
        b"2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n",
        b"3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] "
        b"/Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >>\nendobj\n",
        b"4 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>\nendobj\n",
    ]
    stream = f"BT /F1 18 Tf 72 700 Td <{utf16_hex}> Tj ET".encode("ascii")
    objects.append(
        b"5 0 obj\n<< /Length "
        + str(len(stream)).encode("ascii")
        + b" >>\nstream\n"
        + stream
        + b"\nendstream\nendobj\n"
    )
    pdf = bytearray(b"%PDF-1.4\n")
    offsets = [0]
    for item in objects:
        offsets.append(len(pdf))
        pdf.extend(item)
    xref_offset = len(pdf)
    pdf.extend(f"xref\n0 {len(objects) + 1}\n".encode("ascii"))
    pdf.extend(b"0000000000 65535 f \n")
    for offset in offsets[1:]:
        pdf.extend(f"{offset:010d} 00000 n \n".encode("ascii"))
    pdf.extend(
        f"trailer\n<< /Size {len(objects) + 1} /Root 1 0 R >>\n"
        f"startxref\n{xref_offset}\n%%EOF\n".encode("ascii")
    )
    return bytes(pdf)


if __name__ == "__main__":
    raise SystemExit(main())
