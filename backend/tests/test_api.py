import pytest
import re
from datetime import datetime, timedelta
from fastapi.testclient import TestClient
from app.main import app
from app.database import init_db
from app.config import SAMPLE_DIR

client = TestClient(app)

@pytest.fixture(autouse=True)
def setup_database():
    init_db()

def test_health_and_root():
    response = client.get("/")
    assert response.status_code == 200
    assert response.json()["app"] == "ClinicStock AI — VisionStock"

    health = client.get("/api/health")
    assert health.status_code == 200
    assert health.json()["status"] == "healthy"

def test_sample_images_endpoint():
    response = client.get("/api/sample-images")
    assert response.status_code == 200
    samples = response.json()
    assert len(samples) == 3
    assert any(s["id"] == "shelf_01_clear.jpg" for s in samples)

def test_analyze_sample_image():
    response = client.post("/api/analyze", data={"sample_name": "shelf_01_clear.jpg"})
    assert response.status_code == 200
    data = response.json()
    assert "draft_id" in data
    assert "candidates" in data
    assert len(data["candidates"]) >= 3
    
    # Check first candidate fields
    cand = data["candidates"][0]
    assert "medicine_name" in cand
    assert "visible_package_count" in cand
    assert "evidence_notes" in cand
    assert cand["verified_quantity"] is None  # Must remain unverified until staff confirms!

def test_analyze_obscured_sample_has_uncertain_fields():
    response = client.post("/api/analyze", data={"sample_name": "shelf_02_obscured.jpg"})
    assert response.status_code == 200
    data = response.json()
    candidates = data["candidates"]
    
    # Check that at least one candidate has uncertain_fields flagged per PRD FR-02
    has_uncertain = any(len(c["uncertain_fields"]) > 0 for c in candidates)
    assert has_uncertain, "Obscured shelf test should flag uncertain fields"

def test_verify_candidate_to_inventory():
    # 1. Analyze sample shelf
    analysis = client.post("/api/analyze", data={"sample_name": "shelf_01_clear.jpg"}).json()
    cand = analysis["candidates"][0]
    
    # 2. Staff verifies candidate with explicit confirmed physical count = 12
    cand["verified_quantity"] = 12
    verify_resp = client.post(
        f"/api/inventory/verify-candidate?verified_quantity=12&image_filename={analysis['image_filename']}",
        json=cand
    )
    assert verify_resp.status_code == 200
    verified_record = verify_resp.json()
    
    assert verified_record["medicine_name"] == cand["medicine_name"]
    assert verified_record["verified_quantity"] == 12
    assert verified_record["status"] == "verified"
    assert verified_record["source"] == "photo_assisted"
    assert verified_record["verified_at"] is not None
    
    # 3. Retrieve verified inventory and ensure it is listed
    inv_resp = client.get("/api/inventory")
    assert inv_resp.status_code == 200
    items = inv_resp.json()
    assert any(i["id"] == verified_record["id"] for i in items)

def test_manual_record_creation_and_expiry_alert():
    # Expiring in 20 days (Critical alert)
    exp_date = (datetime.now().date() + timedelta(days=20)).strftime("%Y-%m-%d")
    
    create_resp = client.post("/api/inventory", json={
        "medicine_name": "Amoxicillin Test Batch",
        "strength": "250mg",
        "batch_number": "TEST-EXP-01",
        "expiry_date": exp_date,
        "verified_quantity": 25,
        "evidence_notes": "Unit test manual entry"
    })
    assert create_resp.status_code == 200
    created = create_resp.json()
    
    # Check expiry alerts
    alert_resp = client.get("/api/alerts/expiry?threshold_days=90")
    assert alert_resp.status_code == 200
    alerts_data = alert_resp.json()
    
    matching = [a for a in alerts_data["alerts"] if a["id"] == created["id"]]
    assert len(matching) == 1
    assert matching[0]["urgency"] == "critical"
    assert matching[0]["days_until_expiry"] <= 20

def test_evaluation_benchmark_endpoint():
    response = client.get("/api/evaluation")
    assert response.status_code == 200
    report = response.json()
    assert report["total_test_cases"] == 3
    assert report["mean_medicine_accuracy"] >= 90.0
    assert "cases" in report

def test_real_paracip_500_recognition():
    """
    Test real custom-photo inference pipeline using the supplied PARACIP-500 blister pack image.
    Validates:
    - Real Gemma 4 inference (no mock fallback, no hardcoded Amoxicillin)
    - Name contains Paracetamol or PARACIP
    - Strength contains 500
    - Bounding box is None (not invented)
    - Expiry date is either None or valid YYYY-MM-DD
    - Staff verification workflow successfully converts candidate to verified inventory
    """
    img_path = SAMPLE_DIR / "paracip_500.jpg"
    assert img_path.exists(), f"Supplied PARACIP test image not found at {img_path}"
    
    with open(img_path, "rb") as f:
        file_bytes = f.read()
        
    response = client.post(
        "/api/analyze",
        files={"file": ("paracip_500.jpg", file_bytes, "image/jpeg")}
    )
    assert response.status_code == 200
    data = response.json()
    
    assert data["is_fallback"] is False
    assert len(data["candidates"]) >= 1
    
    cand = data["candidates"][0]
    name = cand["medicine_name"].lower()
    
    # Assert name matches visible packaging
    assert "paracip" in name or "paracetamol" in name, f"Expected Paracetamol/PARACIP but got: {cand['medicine_name']}"
    assert "amoxicillin" not in name, "Error: Hardcoded mock candidate Amoxicillin Trihydrate was returned!"
    
    # Assert strength matches visible packaging (500 mg)
    assert cand["strength"] is not None
    assert "500" in cand["strength"], f"Expected strength 500 but got: {cand['strength']}"
    
    # Assert bounding box is not invented
    assert cand["bounding_box"] is None, "Bounding box coordinates must not be invented"
    
    # Assert expiry date is either None or valid ISO format
    if cand["expiry_date"]:
        assert re.match(r"^\d{4}-\d{2}-\d{2}$", cand["expiry_date"]), f"Invalid expiry date format: {cand['expiry_date']}"
        
    # Verify staff verification workflow
    verify_resp = client.post(
        f"/api/inventory/verify-candidate?verified_quantity=15&image_filename={data['image_filename']}",
        json=cand
    )
    assert verify_resp.status_code == 200
    verified = verify_resp.json()
    assert verified["verified_quantity"] == 15
    assert verified["status"] == "verified"
    assert "paracip" in verified["medicine_name"].lower() or "paracetamol" in verified["medicine_name"].lower()

def test_expiry_date_validation_and_rejection():
    """
    Test requirement 5:
    - Reject invalid dates before saving
    - Normalize flexible formats into strict YYYY-MM-DD internally
    """
    # 1. Invalid date rejection
    resp_invalid = client.post("/api/inventory", json={
        "medicine_name": "Test Medicine",
        "strength": "100mg",
        "expiry_date": "not-a-valid-date",
        "verified_quantity": 5
    })
    assert resp_invalid.status_code == 400
    assert "Invalid expiry date" in resp_invalid.json()["detail"]
    
    # 2. Valid normalization from MM/YYYY to last day of month in YYYY-MM-DD
    resp_valid = client.post("/api/inventory", json={
        "medicine_name": "Normalized Date Med",
        "strength": "100mg",
        "expiry_date": "11/2026",
        "verified_quantity": 10
    })
    assert resp_valid.status_code == 200
    created = resp_valid.json()
    assert created["expiry_date"] == "2026-11-30"
    
    # 3. None/empty expiry date is accepted (for medicines where date is obscured/absent)
    resp_none = client.post("/api/inventory", json={
        "medicine_name": "No Date Med",
        "strength": "10mg",
        "expiry_date": None,
        "verified_quantity": 20
    })
    assert resp_none.status_code == 200
    assert resp_none.json()["expiry_date"] is None
