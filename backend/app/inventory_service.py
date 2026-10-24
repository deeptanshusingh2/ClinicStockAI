import uuid
import json
from datetime import datetime
from typing import List, Optional, Dict, Any, Tuple
from app.database import get_db
from app.schemas import (
    InventoryRecordCreate,
    InventoryRecordUpdate,
    InventoryRecordOut,
    RecordStatus,
    RecordSource,
    CandidateMedicine,
    UrgencyLevel
)
from app.vision_service import validate_and_normalize_expiry_date

def _calc_urgency(expiry_date_str: Optional[str]) -> Tuple[Optional[int], Optional[UrgencyLevel]]:
    """Helper to calculate days until expiry and urgency rating."""
    if not expiry_date_str:
        return None, None
    try:
        exp_date = datetime.strptime(expiry_date_str, "%Y-%m-%d").date()
        today = datetime.now().date()
        days = (exp_date - today).days
        
        if days < 0:
            urgency = UrgencyLevel.EXPIRED
        elif days <= 30:
            urgency = UrgencyLevel.CRITICAL
        elif days <= 90:
            urgency = UrgencyLevel.WARNING
        else:
            urgency = UrgencyLevel.UPCOMING
            
        return days, urgency
    except Exception:
        return None, None


def row_to_record_out(row) -> InventoryRecordOut:
    """Transform SQLite Row to InventoryRecordOut schema."""
    uncertain_fields = []
    if row["uncertain_fields"]:
        try:
            uncertain_fields = json.loads(row["uncertain_fields"])
        except Exception:
            pass
            
    days, urgency = _calc_urgency(row["expiry_date"])
    
    return InventoryRecordOut(
        id=row["id"],
        medicine_name=row["medicine_name"],
        strength=row["strength"],
        batch_number=row["batch_number"],
        expiry_date=row["expiry_date"],
        verified_quantity=row["verified_quantity"],
        visible_package_count=row["visible_package_count"],
        status=RecordStatus(row["status"]),
        source=RecordSource(row["source"]),
        evidence_notes=row["evidence_notes"],
        uncertain_fields=uncertain_fields,
        image_filename=row["image_filename"],
        created_at=row["created_at"],
        updated_at=row["updated_at"],
        verified_at=row["verified_at"],
        days_until_expiry=days,
        urgency=urgency
    )


def get_all_records(
    status: Optional[str] = "verified",
    search: Optional[str] = None
) -> List[InventoryRecordOut]:
    """
    Retrieve inventory records.
    By default per PRD FR-04/05, only verified records form the active inventory.
    """
    with get_db() as conn:
        cursor = conn.cursor()
        query = "SELECT * FROM inventory_records WHERE 1=1"
        params = []
        
        if status and status != "all":
            query += " AND status = ?"
            params.append(status)
            
        if search:
            query += " AND (medicine_name LIKE ? OR batch_number LIKE ?)"
            term = f"%{search}%"
            params.extend([term, term])
            
        query += " ORDER BY created_at DESC"
        cursor.execute(query, params)
        rows = cursor.fetchall()
        return [row_to_record_out(r) for r in rows]


def get_record_by_id(record_id: str) -> Optional[InventoryRecordOut]:
    """Retrieve single record by UUID."""
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM inventory_records WHERE id = ?", (record_id,))
        row = cursor.fetchone()
        if row:
            return row_to_record_out(row)
    return None


def create_manual_record(data: InventoryRecordCreate) -> InventoryRecordOut:
    """Manually add an inventory item (status=verified, source=manual_entry)."""
    now = datetime.utcnow().isoformat()
    record_id = str(uuid.uuid4())
    
    norm_exp = None
    if data.expiry_date and str(data.expiry_date).strip():
        norm_exp, _ = validate_and_normalize_expiry_date(data.expiry_date)
        if not norm_exp:
            raise ValueError(f"Invalid expiry date '{data.expiry_date}'. Must be a valid date formatted as YYYY-MM-DD or MM/YYYY.")

    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute("""
            INSERT INTO inventory_records (
                id, medicine_name, strength, batch_number, expiry_date,
                verified_quantity, visible_package_count, status, source,
                evidence_notes, uncertain_fields, image_filename,
                created_at, updated_at, verified_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (
            record_id,
            data.medicine_name.strip(),
            data.strength.strip() if data.strength else None,
            data.batch_number.strip() if data.batch_number else None,
            norm_exp,
            data.verified_quantity,
            data.visible_package_count,
            RecordStatus.VERIFIED.value,
            RecordSource.MANUAL_ENTRY.value,
            data.evidence_notes or "Manually entered by clinic staff",
            json.dumps([]),
            data.image_filename,
            now,
            now,
            now
        ))
        
    return get_record_by_id(record_id)


def verify_and_save_candidate(
    candidate: CandidateMedicine,
    verified_quantity: int,
    image_filename: Optional[str] = None
) -> InventoryRecordOut:
    """
    Verify an AI candidate into a persistent confirmed inventory record (PRD FR-04 & FR-05).
    Requires staff-confirmed quantity and validates expiry date.
    """
    now = datetime.utcnow().isoformat()
    record_id = str(uuid.uuid4())
    
    norm_exp = None
    if candidate.expiry_date and str(candidate.expiry_date).strip():
        norm_exp, _ = validate_and_normalize_expiry_date(candidate.expiry_date)
        if not norm_exp:
            raise ValueError(f"Invalid expiry date '{candidate.expiry_date}'. Must be a valid date formatted as YYYY-MM-DD or MM/YYYY.")

    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute("""
            INSERT INTO inventory_records (
                id, medicine_name, strength, batch_number, expiry_date,
                verified_quantity, visible_package_count, status, source,
                evidence_notes, uncertain_fields, image_filename,
                created_at, updated_at, verified_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (
            record_id,
            candidate.medicine_name.strip(),
            candidate.strength.strip() if candidate.strength else None,
            candidate.batch_number.strip() if candidate.batch_number else None,
            norm_exp,
            verified_quantity,
            candidate.visible_package_count,
            RecordStatus.VERIFIED.value,
            RecordSource.PHOTO_ASSISTED.value,
            candidate.evidence_notes,
            json.dumps(candidate.uncertain_fields or []),
            image_filename,
            now,
            now,
            now
        ))
        
    return get_record_by_id(record_id)


def update_record(record_id: str, data: InventoryRecordUpdate) -> Optional[InventoryRecordOut]:
    """Update fields of an existing inventory record."""
    existing = get_record_by_id(record_id)
    if not existing:
        return None
        
    now = datetime.utcnow().isoformat()
    with get_db() as conn:
        cursor = conn.cursor()
        
        fields = []
        params = []
        
        if data.medicine_name is not None:
            fields.append("medicine_name = ?")
            params.append(data.medicine_name.strip())
        if data.strength is not None:
            fields.append("strength = ?")
            params.append(data.strength.strip())
        if data.batch_number is not None:
            fields.append("batch_number = ?")
            params.append(data.batch_number.strip())
        if data.expiry_date is not None:
            if str(data.expiry_date).strip():
                norm_exp, _ = validate_and_normalize_expiry_date(data.expiry_date)
                if not norm_exp:
                    raise ValueError(f"Invalid expiry date '{data.expiry_date}'. Must be a valid date formatted as YYYY-MM-DD or MM/YYYY.")
                fields.append("expiry_date = ?")
                params.append(norm_exp)
            else:
                fields.append("expiry_date = ?")
                params.append(None)
        if data.verified_quantity is not None:
            fields.append("verified_quantity = ?")
            params.append(data.verified_quantity)
        if data.status is not None:
            fields.append("status = ?")
            params.append(data.status.value)
        if data.evidence_notes is not None:
            fields.append("evidence_notes = ?")
            params.append(data.evidence_notes)
            
        fields.append("updated_at = ?")
        params.append(now)
        
        params.append(record_id)
        query = f"UPDATE inventory_records SET {', '.join(fields)} WHERE id = ?"
        cursor.execute(query, params)
        
    return get_record_by_id(record_id)


def delete_record(record_id: str) -> bool:
    """Delete an inventory record."""
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute("DELETE FROM inventory_records WHERE id = ?", (record_id,))
        return cursor.rowcount > 0


def save_analysis_draft(
    draft_id: str,
    image_filename: str,
    original_filename: str,
    candidates: List[CandidateMedicine],
    processing_time_ms: int
) -> None:
    """Save raw AI draft for historical auditability."""
    now = datetime.utcnow().isoformat()
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute("""
            INSERT INTO analysis_drafts (
                id, image_filename, original_filename, raw_model_response,
                candidates_json, status, processing_time_ms, created_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        """, (
            draft_id,
            image_filename,
            original_filename,
            "",
            json.dumps([c.model_dump() for c in candidates]),
            "reviewed",
            processing_time_ms,
            now
        ))
