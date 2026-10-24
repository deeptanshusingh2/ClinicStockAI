import sqlite3
import json
from contextlib import contextmanager
from app.config import DATABASE_PATH

def get_db_connection():
    """Create and configure a SQLite connection."""
    conn = sqlite3.connect(DATABASE_PATH)
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA foreign_keys = ON;")
    conn.execute("PRAGMA journal_mode = WAL;")
    return conn

@contextmanager
def get_db():
    """Context manager for SQLite database sessions."""
    conn = get_db_connection()
    try:
        yield conn
        conn.commit()
    except Exception:
        conn.rollback()
        raise
    finally:
        conn.close()

def init_db():
    """Initialize database tables with indexes."""
    with get_db() as conn:
        cursor = conn.cursor()
        
        # Table 1: Inventory Records (PRD Section 12)
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS inventory_records (
                id TEXT PRIMARY KEY,
                medicine_name TEXT NOT NULL,
                strength TEXT,
                batch_number TEXT,
                expiry_date TEXT,
                verified_quantity INTEGER,
                visible_package_count INTEGER,
                status TEXT NOT NULL CHECK(status IN ('draft', 'verified', 'rejected')),
                source TEXT NOT NULL CHECK(source IN ('photo_assisted', 'manual_entry')),
                evidence_notes TEXT,
                uncertain_fields TEXT,
                image_filename TEXT,
                created_at TEXT NOT NULL,
                updated_at TEXT NOT NULL,
                verified_at TEXT
            );
        """)

        # Table 2: Analysis Drafts for preserving visual audit history
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS analysis_drafts (
                id TEXT PRIMARY KEY,
                image_filename TEXT NOT NULL,
                original_filename TEXT,
                raw_model_response TEXT,
                candidates_json TEXT NOT NULL,
                status TEXT NOT NULL DEFAULT 'pending',
                processing_time_ms INTEGER,
                created_at TEXT NOT NULL
            );
        """)

        # Indexes for fast querying & filtering
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_inventory_status ON inventory_records(status);")
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_inventory_expiry ON inventory_records(expiry_date);")
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_inventory_name ON inventory_records(medicine_name);")
