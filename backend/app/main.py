import re
from urllib.parse import unquote

from fastapi import Depends, FastAPI, Header, HTTPException, Query, Request, status
from fastapi.middleware.cors import CORSMiddleware
from pydantic import ValidationError
from starlette.concurrency import run_in_threadpool

from app.config import get_settings
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
    WordExplanation,
    WordExplanationRequest,
)
from app.services.gemini import (
    GeminiConfigurationError,
    GeminiService,
    GeminiServiceError,
    get_gemini_service,
)
from app.services.integrity import build_deterministic_integrity_report, combine_integrity_reports
from app.services.readability import assess_readability

settings = get_settings()

app = FastAPI(
    title=settings.app_name,
    description="Arabic-first reading companion API.",
    version="0.1.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[settings.frontend_origin],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/api/health", tags=["system"])
async def health() -> dict[str, str]:
    return {"status": "ok", "service": "waddeh-api"}


@app.post("/api/readability", response_model=ReadabilityAssessment, tags=["reading"])
async def readability(request: ReadabilityRequest) -> ReadabilityAssessment:
    return assess_readability(request.text)


@app.post("/api/simplify", response_model=SimplifyResponse, tags=["reading"])
async def simplify(
    request: SimplifyRequest,
    service: GeminiService = Depends(get_gemini_service),
) -> SimplifyResponse:
    readability_result = assess_readability(request.text)
    try:
        result: SimplificationOutput = await run_in_threadpool(service.simplify, request)
    except GeminiConfigurationError as exc:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=str(exc),
        ) from exc
    except GeminiServiceError as exc:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=str(exc),
        ) from exc

    deterministic_integrity = build_deterministic_integrity_report(
        source_text=request.text,
        adapted_text=result.simplified_text,
    )
    semantic_integrity = None
    try:
        semantic_integrity = await run_in_threadpool(
            service.verify_integrity,
            request.text,
            result.simplified_text,
        )
    except GeminiServiceError:
        deterministic_integrity.warnings.append(
            "تعذر إجراء المراجعة الإضافية؛ ما زالت مراجعة الأرقام والتواريخ متاحة."
        )
    meaning_integrity = combine_integrity_reports(
        deterministic=deterministic_integrity,
        semantic=semantic_integrity,
    )

    return SimplifyResponse(
        original_text=request.text,
        reader=request.reader,
        level=request.level,
        readability=readability_result,
        meaning_integrity=meaning_integrity,
        **result.model_dump(),
    )


@app.post("/api/upload/pdf", response_model=SimplifyResponse, tags=["reading"])
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
            detail="يُسمح بملفات PDF فقط.",
        )

    pdf_bytes = await request.body()
    if not pdf_bytes or len(pdf_bytes) > 10 * 1024 * 1024:
        raise HTTPException(
            status_code=status.HTTP_413_CONTENT_TOO_LARGE,
            detail="يجب ألا يتجاوز حجم ملف PDF عشرة ميغابايت.",
        )
    if b"%PDF-" not in pdf_bytes[:1024]:
        raise HTTPException(
            status_code=status.HTTP_415_UNSUPPORTED_MEDIA_TYPE,
            detail="الملف المرفوع ليس ملف PDF صالحاً.",
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
        )
    except GeminiConfigurationError as exc:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=str(exc),
        ) from exc
    except GeminiServiceError as exc:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=str(exc),
        ) from exc

    readability_result = assess_readability(result.simplified_text)
    deterministic_integrity = build_deterministic_integrity_report(
        source_text="",
        adapted_text=result.simplified_text,
    )

    return SimplifyResponse(
        original_text="",
        source_name=safe_name,
        reader=reader,
        level=level,
        readability=readability_result,
        meaning_integrity=deterministic_integrity,
        **result.model_dump(),
    )


@app.post("/api/explain-word", response_model=WordExplanation, tags=["learning"])
async def explain_word(
    request: WordExplanationRequest,
    service: GeminiService = Depends(get_gemini_service),
) -> WordExplanation:
    try:
        return await run_in_threadpool(service.explain_word, request)
    except GeminiConfigurationError as exc:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=str(exc),
        ) from exc
    except GeminiServiceError as exc:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=str(exc),
        ) from exc


@app.post("/api/poetry/explain", response_model=PoetryResponse, tags=["reading", "learning"])
async def explain_poetry(
    request: PoetryRequest,
    service: GeminiService = Depends(get_gemini_service),
) -> PoetryResponse:
    try:
        result: PoetryOutput = await run_in_threadpool(service.explain_poetry, request)
    except GeminiConfigurationError as exc:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=str(exc),
        ) from exc
    except GeminiServiceError as exc:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=str(exc),
        ) from exc

    return PoetryResponse(
        original_text=request.text,
        reader=request.reader,
        level=request.level,
        **result.model_dump(),
    )
