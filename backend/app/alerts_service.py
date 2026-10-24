from datetime import datetime
from typing import List, Optional
from app.database import get_db
from app.schemas import (
    ExpiryAlertItem,
    ExpiryAlertsSummary,
    UrgencyLevel
)

def get_expiry_alerts(threshold_days: int = 90) -> ExpiryAlertsSummary:
    """
    Compute expiry alerts for all verified inventory records.
    Strictly excludes missing, invalid, or unverified records per PRD FR-06.
    Avoids clinical or dispensing recommendations.
    """
    today = datetime.now().date()
    
    with get_db() as conn:
        cursor = conn.cursor()
        # Only select verified records with non-null expiry dates
        cursor.execute("""
            SELECT id, medicine_name, strength, batch_number, expiry_date, verified_quantity
            FROM inventory_records
            WHERE status = 'verified' AND expiry_date IS NOT NULL AND expiry_date != ''
            ORDER BY expiry_date ASC
        """)
        rows = cursor.fetchall()

    alerts: List[ExpiryAlertItem] = []
    expired_count = 0
    critical_count = 0
    warning_count = 0
    upcoming_count = 0

    for r in rows:
        try:
            exp_date = datetime.strptime(r["expiry_date"], "%Y-%m-%d").date()
        except ValueError:
            continue
            
        days = (exp_date - today).days
        
        # Only include if expired or within configurable threshold
        if days > threshold_days:
            continue

        if days < 0:
            urgency = UrgencyLevel.EXPIRED
            alert_message = f"Expired {abs(days)} day(s) ago ({r['expiry_date']}). Quarantine and inspect per facility protocol."
            expired_count += 1
        elif days <= 30:
            urgency = UrgencyLevel.CRITICAL
            alert_message = f"Urgent: Approaching expiry in {days} day(s) ({r['expiry_date']})."
            critical_count += 1
        elif days <= 90:
            urgency = UrgencyLevel.WARNING
            alert_message = f"Expiring in {days} days ({r['expiry_date']}). Monitor stock rotation."
            warning_count += 1
        else:
            urgency = UrgencyLevel.UPCOMING
            alert_message = f"Approaching expiry in {days} days ({r['expiry_date']})."
            upcoming_count += 1

        alerts.append(ExpiryAlertItem(
            id=r["id"],
            medicine_name=r["medicine_name"],
            strength=r["strength"],
            batch_number=r["batch_number"],
            expiry_date=r["expiry_date"],
            verified_quantity=r["verified_quantity"] or 0,
            days_until_expiry=days,
            urgency=urgency,
            alert_message=alert_message
        ))

    return ExpiryAlertsSummary(
        threshold_days=threshold_days,
        total_alerts=len(alerts),
        expired_count=expired_count,
        critical_count=critical_count,
        warning_count=warning_count,
        upcoming_count=upcoming_count,
        alerts=alerts
    )
