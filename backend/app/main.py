import uuid
from pathlib import Path
from typing import List, Optional
from fastapi import FastAPI, UploadFile, File, Form, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from app.config import (
    UPLOAD_DIR,
    SAMPLE_DIR,
    OLLAMA_MODEL,
    DEFAULT_EXPIRY_THRESHOLD_DAYS
)
from app.database import init_db
from app.schemas import (
    AnalysisResponse,
    CandidateMedicine,
    InventoryRecordCreate,
    InventoryRecordUpdate,
    InventoryRecordOut,
    VerifyCandidateRequest,
    ExpiryAlertsSummary,
    OllamaStatusResponse,
    EvaluationReport,
    RecordStatus
)
from app.vision_service import (
    validate_image_bytes,
    check_ollama_connection,
    analyze_image_with_model
)
from app.inventory_service import (
    get_all_records,
    get_record_by_id,
    create_manual_record,
    verify_and_save_candidate,
    update_record,
    delete_record,
    save_analysis_draft
)
from app.alerts_service import get_expiry_alerts
from app.evaluation_service import run_evaluation_benchmark

from contextlib import asynccontextmanager

@asynccontextmanager
async def lifespan(app: FastAPI):
    init_db()
    yield

# Initialize application
app = FastAPI(
    title="ClinicStock AI — VisionStock",
    description="AI-assisted medicine shelf auditing: AI drafts the inventory; authorized staff verify it.",
    version="1.0.0",
    lifespan=lifespan
)

# Enable CORS for local Vite frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount static file directories for uploads and sample images
app.mount("/static/uploads", StaticFiles(directory=str(UPLOAD_DIR)), name="uploads")
app.mount("/static/samples", StaticFiles(directory=str(SAMPLE_DIR)), name="samples")


@app.get("/")
def root():
    return {
        "app": "ClinicStock AI — VisionStock",
        "version": "1.0.0",
        "tagline": "Scan the shelf. Review the evidence. Verify the stock.",
        "status": "online"
    }


@app.get("/api/health")
async def health_check():
    ollama_info = await check_ollama_connection()
    return {
        "status": "healthy",
        "database": "connected",
        "ollama": ollama_info
    }


@app.get("/api/ollama/status", response_model=OllamaStatusResponse)
async def get_ollama_status():
    status = await check_ollama_connection()
    return OllamaStatusResponse(
        connected=status["connected"],
        base_url=status["base_url"],
        active_model=status["active_model"],
        available_models=status["available_models"],
        message=status["message"]
    )


@app.post("/api/analyze", response_model=AnalysisResponse)
async def analyze_image(
    file: Optional[UploadFile] = File(None),
    sample_name: Optional[str] = Form(None)
):
    """
    Analyze a medicine-shelf photograph (FR-01, FR-02).
    Accepts either an uploaded file or a pre-loaded sample photo name.
    """
    if file:
        file_bytes = await file.read()
        filename = file.filename or f"upload_{uuid.uuid4().hex[:8]}.jpg"
        try:
            pil_img, ext = validate_image_bytes(file_bytes, filename)
        except ValueError as e:
            raise HTTPException(status_code=400, detail=str(e))
            
        saved_filename = f"{uuid.uuid4().hex}{ext}"
        saved_path = UPLOAD_DIR / saved_filename
        with open(saved_path, "wb") as f:
            f.write(file_bytes)
            
        image_url = f"/static/uploads/{saved_filename}"
        analysis_hint = filename
        is_sample = False
    elif sample_name:
        sample_path = SAMPLE_DIR / sample_name
        if not sample_path.exists():
            raise HTTPException(status_code=404, detail=f"Sample image '{sample_name}' not found.")
        with open(sample_path, "rb") as f:
            file_bytes = f.read()
        saved_filename = sample_name
        image_url = f"/static/samples/{sample_name}"
        analysis_hint = sample_name
        is_sample = True
    else:
        raise HTTPException(status_code=400, detail="Either an image file or sample_name must be provided.")

    # Run AI inference with Gemma 4 (benchmark presets only used for curated sample shelf demos)
    candidates, model_used, is_fallback, latency_ms = await analyze_image_with_model(
        image_bytes=file_bytes,
        image_filename=analysis_hint,
        is_sample=is_sample
    )

    draft_id = str(uuid.uuid4())
    save_analysis_draft(
        draft_id=draft_id,
        image_filename=saved_filename,
        original_filename=analysis_hint,
        candidates=candidates,
        processing_time_ms=latency_ms
    )

    return AnalysisResponse(
        draft_id=draft_id,
        image_filename=saved_filename,
        image_url=image_url,
        candidates=candidates,
        total_detected=len(candidates),
        processing_time_ms=latency_ms,
        model_used=model_used,
        is_fallback=is_fallback,
        timestamp=str(Path().resolve())
    )


@app.get("/api/inventory", response_model=List[InventoryRecordOut])
def get_inventory(
    search: Optional[str] = Query(None, description="Search medicine name or batch"),
    status: Optional[str] = Query("verified", description="Filter by status (default 'verified')")
):
    """
    Retrieve confirmed inventory records (FR-05).
    Excludes unverified drafts by default to maintain inventory integrity.
    """
    return get_all_records(status=status, search=search)


@app.post("/api/inventory", response_model=InventoryRecordOut)
def create_inventory_item(item: InventoryRecordCreate):
    """Manually add a confirmed inventory record."""
    try:
        return create_manual_record(item)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@app.get("/api/inventory/{record_id}", response_model=InventoryRecordOut)
def get_inventory_item(record_id: str):
    record = get_record_by_id(record_id)
    if not record:
        raise HTTPException(status_code=404, detail="Inventory record not found.")
    return record


@app.patch("/api/inventory/{record_id}", response_model=InventoryRecordOut)
def update_inventory_item(record_id: str, update_data: InventoryRecordUpdate):
    try:
        updated = update_record(record_id, update_data)
        if not updated:
            raise HTTPException(status_code=404, detail="Inventory record not found.")
        return updated
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@app.delete("/api/inventory/{record_id}")
def delete_inventory_item(record_id: str):
    success = delete_record(record_id)
    if not success:
        raise HTTPException(status_code=404, detail="Inventory record not found.")
    return {"message": "Record deleted successfully.", "id": record_id}


@app.post("/api/inventory/verify-candidate", response_model=InventoryRecordOut)
def verify_candidate(
    candidate: CandidateMedicine,
    verified_quantity: int = Query(..., ge=0, description="Actual physical count verified by staff"),
    image_filename: Optional[str] = Query(None)
):
    """
    Transform an AI draft candidate into confirmed inventory (FR-04).
    Enforces human-in-the-loop verification and records verification timestamp.
    """
    if not candidate.medicine_name.strip():
        raise HTTPException(status_code=400, detail="Medicine name is required for verification.")
        
    try:
        return verify_and_save_candidate(
            candidate=candidate,
            verified_quantity=verified_quantity,
            image_filename=image_filename
        )
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@app.get("/api/alerts/expiry", response_model=ExpiryAlertsSummary)
def get_expiry_risks(
    threshold_days: int = Query(
        DEFAULT_EXPIRY_THRESHOLD_DAYS,
        ge=1,
        le=730,
        description="Threshold in days to flag upcoming expiry (default 90)"
    )
):
    """
    Retrieve expiry alerts for verified inventory records (FR-06).
    Deterministic date proximity calculations without clinical claims.
    """
    return get_expiry_alerts(threshold_days=threshold_days)


@app.get("/api/sample-images")
def list_sample_images():
    """List sample shelf images with pre-configured scenarios for instant demonstration."""
    samples = [
        {
            "id": "shelf_01_clear.jpg",
            "title": "Shelf A: Unobstructed Primary Stock",
            "description": "Standard dispensary shelf with clear front-facing antibiotic and analgesic cartons.",
            "url": "/static/samples/shelf_01_clear.jpg",
            "features": ["High contrast print", "Full batch numbers", "Embroidery expiry dates"]
        },
        {
            "id": "shelf_02_obscured.jpg",
            "title": "Shelf B: Obscured Dates & Reflection",
            "description": "Challenging real-world conditions: overhead glare on expiry dates and side-turned bottles.",
            "url": "/static/samples/shelf_02_obscured.jpg",
            "features": ["Glare wash", "Partial obscuration", "Uncertainty flags triggered"]
        },
        {
            "id": "shelf_03_mixed.jpg",
            "title": "Shelf C: Mixed Formulations & Trays",
            "description": "High-density clinic shelf with blister boxes, oral medications, and emergency tray vials.",
            "url": "/static/samples/shelf_03_mixed.jpg",
            "features": ["Multiple packaging formats", "Vial tray lots", "Variable batch legibility"]
        }
    ]
    return samples


@app.get("/api/evaluation", response_model=EvaluationReport)
def get_evaluation_metrics():
    """
    Evaluation benchmark metrics report per PRD Section 13.
    """
    return run_evaluation_benchmark()
