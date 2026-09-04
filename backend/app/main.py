import logging
import re
from time import perf_counter
from urllib.parse import unquote

from fastapi import Depends, FastAPI, Header, HTTPException, Query, Request, Response, status
from fastapi.middleware.cors import CORSMiddleware
from pydantic import ValidationError
from starlette.concurrency import run_in_threadpool

from app.config import get_settings
from app.rate_limit import enforce_rate_limit
from app.schemas import (
    PoetryOutput,
    PoetryRequest,
    PoetryResponse,
    ReadingMemorySnapshot,
    ReadabilityAssessment,
    ReadabilityRequest,
    ReaderType,
    SimplificationLevel,
    SimplificationOutput,
    SimplifyRequest,
    SimplifyResponse,
    SpeechRequest,
    TransferChallengeOutput,
    TransferChallengeRequest,
    WordExplanation,
    WordExplanationRequest,
)
from app.services.gemini import (
    GeminiConfigurationError,
    GeminiService,
    GeminiServiceError,
    GeminiSpeechError,
    PdfContentError,
    get_gemini_service,
)
from app.services.integrity import build_deterministic_integrity_report
from app.services.pdf_documents import InvalidPdfError, inspect_pdf
from app.services.readability import assess_readability

settings = get_settings()
logger = logging.getLogger(__name__)

app = FastAPI(
    title=settings.app_name,
    description="Arabic-first reading companion API.",
    version="0.1.0",
    debug=False,
)

allowed_origins = {
    origin.strip().rstrip("/")
    for origin in (
        settings.frontend_origin,
        settings.frontend_url,
        *settings.frontend_origins.split(","),
    )
    if origin.strip()
}

app.add_middleware(
    CORSMiddleware,
    allow_origins=sorted(allowed_origins),
    allow_credentials=False,
    allow_methods=["GET", "POST", "OPTIONS"],
    allow_headers=["Content-Type", "X-File-Name", "X-Reading-Memory"],
)


@app.get("/api/health", tags=["system"])
async def health() -> dict[str, str]:
    return {"status": "ok", "service": "waddeh-api"}


@app.post(
    "/api/readability",
    response_model=ReadabilityAssessment,
    tags=["reading"],
    dependencies=[Depends(enforce_rate_limit("readability", 60, 60))],
)
async def readability(request: ReadabilityRequest) -> ReadabilityAssessment:
    return assess_readability(request.text)


@app.post(
    "/api/simplify",
    response_model=SimplifyResponse,
    tags=["reading"],
    dependencies=[
        Depends(enforce_rate_limit("ai:all", 20, 600)),
        Depends(enforce_rate_limit("ai:simplify", 8, 300)),
    ],
)
async def simplify(
    request: SimplifyRequest,
    service: GeminiService = Depends(get_gemini_service),
) -> SimplifyResponse:
    request_started_at = perf_counter()
    try:
        readability_result = assess_readability(request.text)
        generation_started_at = perf_counter()
        try:
            result: SimplificationOutput = await run_in_threadpool(service.simplify, request)
        except GeminiConfigurationError as exc:
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail="خدمة الذكاء الاصطناعي غير متاحة مؤقتاً.",
            ) from exc
        except GeminiServiceError as exc:
            raise HTTPException(
                status_code=status.HTTP_502_BAD_GATEWAY,
                detail="تعذر إكمال الطلب الآن. حاول مرة أخرى لاحقاً.",
            ) from exc
        finally:
            logger.info(
                "Simplify main Gemini generation duration_seconds=%.3f",
                perf_counter() - generation_started_at,
            )

        integrity_started_at = perf_counter()
        deterministic_integrity = build_deterministic_integrity_report(
            source_text=request.text,
            adapted_text=result.simplified_text,
        )
        logger.info(
            "Simplify deterministic integrity duration_seconds=%.3f",
            perf_counter() - integrity_started_at,
        )

        return SimplifyResponse(
            original_text=request.text,
            reader=request.reader,
            level=request.level,
            readability=readability_result,
            meaning_integrity=deterministic_integrity,
            **result.model_dump(),
        )
    finally:
        logger.info(
            "Simplify total processing duration_seconds=%.3f",
            perf_counter() - request_started_at,
        )


@app.post(
    "/api/upload/pdf",
    response_model=SimplifyResponse,
    tags=["reading"],
    dependencies=[
        Depends(enforce_rate_limit("ai:all", 20, 600)),
        Depends(enforce_rate_limit("ai:pdf", 3, 600)),
    ],
)
async def simplify_pdf(
    request: Request,
    reader: ReaderType = Query(default=ReaderType.general_reader),
    level: SimplificationLevel = Query(default=SimplificationLevel.easy),
    reading_memory: str = Header(default="", alias="X-Reading-Memory"),
    encoded_filename: str = Header(default="document.pdf", alias="X-File-Name"),
    service: GeminiService = Depends(get_gemini_service),
) -> SimplifyResponse:
    content_type = request.headers.get("content-type", "").split(";", 1)[0].lower()
    if content_type != "application/pdf":
        raise HTTPException(
            status_code=status.HTTP_415_UNSUPPORTED_MEDIA_TYPE,
            detail="Only PDF files are allowed. / يُسمح بملفات PDF فقط.",
        )

    chunks: list[bytes] = []
    total_size = 0
    async for chunk in request.stream():
        total_size += len(chunk)
        if total_size > 4 * 1024 * 1024:
            raise HTTPException(
                status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
                detail=(
                    "The PDF must be 4 MB or smaller. / "
                    "يجب ألا يتجاوز حجم ملف PDF أربعة ميغابايت."
                ),
            )
        chunks.append(chunk)
    pdf_bytes = b"".join(chunks)
    if not pdf_bytes:
        raise HTTPException(
            status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
            detail="The PDF is empty. / ملف PDF فارغ.",
        )
    if b"%PDF-" not in pdf_bytes[:1024]:
        raise HTTPException(
            status_code=status.HTTP_415_UNSUPPORTED_MEDIA_TYPE,
            detail="The uploaded file is not a valid PDF. / الملف المرفوع ليس ملف PDF صالحاً.",
        )

    try:
        inspection = await run_in_threadpool(inspect_pdf, pdf_bytes)
    except InvalidPdfError as exc:
        raise HTTPException(
            status_code=status.HTTP_415_UNSUPPORTED_MEDIA_TYPE,
            detail=(
                "The uploaded file is not a readable PDF. / "
                "الملف المرفوع ليس ملف PDF صالحاً يمكن قراءته."
            ),
        ) from exc
    if inspection.page_count > 5:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=(
                "For this prototype, PDF documents are limited to 5 pages. / "
                "في النسخة التجريبية، يقتصر ملف PDF على 5 صفحات كحد أقصى."
            ),
        )

    try:
        memory = (
            ReadingMemorySnapshot.model_validate_json(unquote(reading_memory))
            if reading_memory
            else ReadingMemorySnapshot()
        )
    except ValidationError as exc:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="تعذر قراءة ذاكرة التعلّم المرسلة.",
        ) from exc

    decoded_name = unquote(encoded_filename).replace("\\", "/").split("/")[-1]
    safe_name = re.sub(r"[^\w.\-\u0600-\u06ff ]", "_", decoded_name)[:120]
    if not safe_name.lower().endswith(".pdf"):
        safe_name = f"{safe_name or 'document'}.pdf"

    try:
        result = await run_in_threadpool(
            service.simplify_pdf,
            pdf_bytes,
            reader,
            level,
            memory,
            inspection.extracted_arabic,
        )
    except GeminiConfigurationError as exc:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=(
                "The AI provider is temporarily unavailable. / "
                "خدمة الذكاء الاصطناعي غير متاحة مؤقتاً."
            ),
        ) from exc
    except PdfContentError as exc:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=(
                "The Arabic text or content in this PDF could not be read. / "
                "تعذر قراءة النص العربي أو محتوى ملف PDF."
            ),
        ) from exc
    except GeminiServiceError as exc:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=(
                "The PDF could not be processed because the AI provider is unavailable. "
                "Please try again later. / تعذر تجهيز ملف PDF لأن خدمة الذكاء الاصطناعي "
                "غير متاحة. حاول مرة أخرى لاحقاً."
            ),
        ) from exc

    readability_result = assess_readability(result.simplified_text)
    deterministic_integrity = build_deterministic_integrity_report(
        source_text=result.original_text,
        adapted_text=result.simplified_text,
    )

    return SimplifyResponse(
        original_text=result.original_text,
        source_name=safe_name,
        reader=reader,
        level=level,
        readability=readability_result,
        meaning_integrity=deterministic_integrity,
        **result.model_dump(exclude={"original_text"}),
    )


@app.post(
    "/api/explain-word",
    response_model=WordExplanation,
    tags=["learning"],
    dependencies=[
        Depends(enforce_rate_limit("ai:all", 20, 600)),
        Depends(enforce_rate_limit("ai:word", 15, 300)),
    ],
)
async def explain_word(
    request: WordExplanationRequest,
    service: GeminiService = Depends(get_gemini_service),
) -> WordExplanation:
    try:
        return await run_in_threadpool(service.explain_word, request)
    except GeminiConfigurationError as exc:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="خدمة الذكاء الاصطناعي غير متاحة مؤقتاً.",
        ) from exc
    except GeminiServiceError as exc:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail="تعذر شرح الكلمة الآن. حاول مرة أخرى لاحقاً.",
        ) from exc


@app.post(
    "/api/learning/transfer-challenge",
    response_model=TransferChallengeOutput,
    tags=["learning"],
    dependencies=[
        Depends(enforce_rate_limit("ai:all", 20, 600)),
        Depends(enforce_rate_limit("ai:transfer", 8, 600)),
    ],
)
async def create_transfer_challenge(
    request: TransferChallengeRequest,
    service: GeminiService = Depends(get_gemini_service),
) -> TransferChallengeOutput:
    try:
        return await run_in_threadpool(service.create_transfer_challenge, request)
    except GeminiConfigurationError as exc:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="خدمة الذكاء الاصطناعي غير متاحة مؤقتاً.",
        ) from exc
    except GeminiServiceError as exc:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail="تعذر إنشاء التحدي الآن. حاول مرة أخرى لاحقاً.",
        ) from exc


@app.post(
    "/api/speech",
    tags=["reading"],
    dependencies=[
        Depends(enforce_rate_limit("ai:all", 20, 600)),
        Depends(enforce_rate_limit("ai:speech", 10, 300)),
    ],
)
async def generate_speech(
    request: SpeechRequest,
    service: GeminiService = Depends(get_gemini_service),
) -> Response:
    try:
        audio_bytes = await run_in_threadpool(
            service.generate_speech,
            request.text,
            request.language,
        )
        return Response(content=audio_bytes, media_type="audio/wav")
    except GeminiConfigurationError as exc:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail={
                "code": "not_configured",
                "message": "Cloud voice is not configured.",
            },
        ) from exc
    except GeminiSpeechError as exc:
        raise HTTPException(
            status_code=exc.http_status,
            detail={"code": exc.code, "message": str(exc)},
        ) from exc
    except GeminiServiceError as exc:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail={
                "code": "provider_unavailable",
                "message": "Cloud voice is temporarily unavailable.",
            },
        ) from exc


@app.post(
    "/api/poetry/explain",
    response_model=PoetryResponse,
    tags=["reading", "learning"],
    dependencies=[
        Depends(enforce_rate_limit("ai:all", 20, 600)),
        Depends(enforce_rate_limit("ai:poetry", 6, 600)),
    ],
)
async def explain_poetry(
    request: PoetryRequest,
    service: GeminiService = Depends(get_gemini_service),
) -> PoetryResponse:
    try:
        result: PoetryOutput = await run_in_threadpool(service.explain_poetry, request)
    except GeminiConfigurationError as exc:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="خدمة الذكاء الاصطناعي غير متاحة مؤقتاً.",
        ) from exc
    except GeminiServiceError as exc:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail="تعذر شرح النص الشعري الآن. حاول مرة أخرى لاحقاً.",
        ) from exc

    return PoetryResponse(
        original_text=request.text,
        reader=request.reader,
        level=request.level,
        **result.model_dump(),
    )
