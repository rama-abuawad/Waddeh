import io
import re
from dataclasses import dataclass

from pypdf import PdfReader
from pypdf.errors import PdfReadError


class InvalidPdfError(ValueError):
    """Raised when PDF structure cannot be parsed safely."""


@dataclass(frozen=True)
class PdfInspection:
    page_count: int
    extracted_arabic: str | None


_CORRUPT_MARKERS = ("\x00", "\ufffd", "þÿ", "ÿþ")
_ARABIC_CHARACTER = re.compile(r"[\u0600-\u06ff]")
_LETTER = re.compile(r"[^\W\d_]", re.UNICODE)
_PAGE_NUMBER = re.compile(r"^\s*(?:صفحة\s*)?[\d٠-٩]+\s*$", re.IGNORECASE)


def _clean_extracted_page(text: str) -> str:
    normalized = text.replace("\r\n", "\n").replace("\r", "\n")
    lines = [line.rstrip() for line in normalized.split("\n")]
    meaningful = [line for line in lines if not _PAGE_NUMBER.fullmatch(line)]
    cleaned = "\n".join(meaningful)
    cleaned = re.sub(r"[ \t]+\n", "\n", cleaned)
    cleaned = re.sub(r"\n{3,}", "\n\n", cleaned)
    return cleaned.strip()


def _is_readable_arabic(text: str) -> bool:
    if any(marker in text for marker in _CORRUPT_MARKERS):
        return False
    arabic_count = len(_ARABIC_CHARACTER.findall(text))
    letter_count = len(_LETTER.findall(text))
    return arabic_count >= 8 and letter_count > 0 and arabic_count / letter_count >= 0.35


def inspect_pdf(pdf_bytes: bytes) -> PdfInspection:
    try:
        reader = PdfReader(io.BytesIO(pdf_bytes), strict=False)
        if reader.is_encrypted and reader.decrypt("") == 0:
            raise InvalidPdfError("Encrypted PDF cannot be read.")
        page_count = len(reader.pages)
        if page_count < 1:
            raise InvalidPdfError("PDF has no pages.")

        pages: list[str] = []
        for page in reader.pages:
            extracted = page.extract_text() or ""
            cleaned = _clean_extracted_page(extracted)
            if cleaned:
                pages.append(cleaned)
    except (PdfReadError, OSError, ValueError, TypeError, KeyError) as exc:
        if isinstance(exc, InvalidPdfError):
            raise
        raise InvalidPdfError("PDF structure could not be read.") from exc

    combined = "\n\n".join(pages)
    return PdfInspection(
        page_count=page_count,
        extracted_arabic=combined if _is_readable_arabic(combined) else None,
    )
