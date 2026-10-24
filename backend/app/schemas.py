from pydantic import BaseModel, Field, field_validator
from typing import Optional, List, Dict, Any
from enum import Enum

class RecordStatus(str, Enum):
    DRAFT = "draft"
    VERIFIED = "verified"
    REJECTED = "rejected"

class RecordSource(str, Enum):
    PHOTO_ASSISTED = "photo_assisted"
    MANUAL_ENTRY = "manual_entry"

class UrgencyLevel(str, Enum):
    EXPIRED = "expired"
    CRITICAL = "critical"   # <= 30 days
    WARNING = "warning"     # 31 - 90 days
    UPCOMING = "upcoming"   # 91 - threshold days

class CandidateMedicine(BaseModel):
    id: str
    medicine_name: str = Field(..., description="Trade name or generic name identified on packaging")
    strength: Optional[str] = Field(None, description="Strength or concentration (e.g., 500mg, 100ml)")
    batch_number: Optional[str] = Field(None, description="Batch/Lot number when legible; null if unreadable")
    expiry_date: Optional[str] = Field(None, description="Expiry date in YYYY-MM-DD when legible; null if unreadable")
    visible_package_count: int = Field(1, ge=1, description="Count of visible packages in photo (NOT total stock)")
    verified_quantity: Optional[int] = Field(None, description="Physical verified quantity confirmed by staff")
    evidence_notes: str = Field("", description="Visual evidence notes explaining packaging cues, lighting, legibility")
    uncertain_fields: List[str] = Field(default_factory=list, description="Fields with low confidence or visual obstruction")
    bounding_box: Optional[Dict[str, float]] = Field(None, description="Normalized coordinates [x, y, w, h] on shelf photo")
    confidence: Optional[float] = Field(None, description="Advisory model confidence (0.0 to 1.0)")

class AnalysisResponse(BaseModel):
    draft_id: str
    image_filename: str
    image_url: str
    candidates: List[CandidateMedicine]
    total_detected: int
    processing_time_ms: int
    model_used: str
    is_fallback: bool
    timestamp: str

class InventoryRecordCreate(BaseModel):
    medicine_name: str
    strength: Optional[str] = None
    batch_number: Optional[str] = None
    expiry_date: Optional[str] = None
    verified_quantity: int = Field(..., ge=0, description="Confirmed physical quantity")
    visible_package_count: Optional[int] = None
    source: RecordSource = RecordSource.MANUAL_ENTRY
    evidence_notes: Optional[str] = ""
    image_filename: Optional[str] = None

class InventoryRecordUpdate(BaseModel):
    medicine_name: Optional[str] = None
    strength: Optional[str] = None
    batch_number: Optional[str] = None
    expiry_date: Optional[str] = None
    verified_quantity: Optional[int] = Field(None, ge=0)
    status: Optional[RecordStatus] = None
    evidence_notes: Optional[str] = None

class VerifyCandidateRequest(BaseModel):
    verified_quantity: int = Field(..., ge=0, description="Actual physical count verified by clinic staff")
    medicine_name: Optional[str] = None
    strength: Optional[str] = None
    batch_number: Optional[str] = None
    expiry_date: Optional[str] = None
    evidence_notes: Optional[str] = None

class InventoryRecordOut(BaseModel):
    id: str
    medicine_name: str
    strength: Optional[str]
    batch_number: Optional[str]
    expiry_date: Optional[str]
    verified_quantity: Optional[int]
    visible_package_count: Optional[int]
    status: RecordStatus
    source: RecordSource
    evidence_notes: Optional[str]
    uncertain_fields: List[str] = []
    image_filename: Optional[str]
    created_at: str
    updated_at: str
    verified_at: Optional[str]
    days_until_expiry: Optional[int] = None
    urgency: Optional[UrgencyLevel] = None

class ExpiryAlertItem(BaseModel):
    id: str
    medicine_name: str
    strength: Optional[str]
    batch_number: Optional[str]
    expiry_date: str
    verified_quantity: int
    days_until_expiry: int
    urgency: UrgencyLevel
    alert_message: str

class ExpiryAlertsSummary(BaseModel):
    threshold_days: int
    total_alerts: int
    expired_count: int
    critical_count: int
    warning_count: int
    upcoming_count: int
    alerts: List[ExpiryAlertItem]

class OllamaStatusResponse(BaseModel):
    connected: bool
    base_url: str
    active_model: str
    available_models: List[str]
    message: str

class EvaluationSampleResult(BaseModel):
    case_name: str
    description: str
    image_name: str
    ground_truth_count: int
    detected_count: int
    medicine_name_accuracy: float
    strength_accuracy: float
    batch_accuracy: float
    expiry_accuracy: float
    overall_precision: float
    overall_completeness: float
    inference_latency_ms: int

class EvaluationReport(BaseModel):
    total_test_cases: int
    mean_medicine_accuracy: float
    mean_strength_accuracy: float
    mean_batch_accuracy: float
    mean_expiry_accuracy: float
    mean_precision: float
    mean_completeness: float
    mean_latency_ms: float
    cases: List[EvaluationSampleResult]
