import os
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent.parent

# Ollama Model & Host Settings - Configured for gemma4:e2b per user specification
OLLAMA_BASE_URL = os.getenv("OLLAMA_BASE_URL", "http://127.0.0.1:11434")
OLLAMA_MODEL = os.getenv("OLLAMA_MODEL", "gemma4:e2b")

# Upload Limits per PRD FR-01
MAX_UPLOAD_SIZE_BYTES = 8 * 1024 * 1024  # 8 MB
ALLOWED_EXTENSIONS = {".jpg", ".jpeg", ".png", ".webp"}
ALLOWED_MIME_TYPES = {"image/jpeg", "image/png", "image/webp"}

# Business Rules
DEFAULT_EXPIRY_THRESHOLD_DAYS = int(os.getenv("EXPIRY_THRESHOLD_DAYS", "90"))

# File Paths
DATABASE_PATH = BASE_DIR / "clinicstock.db"
UPLOAD_DIR = BASE_DIR / "uploads"
SAMPLE_DIR = BASE_DIR / "sample_data"

# Ensure directories exist
UPLOAD_DIR.mkdir(parents=True, exist_ok=True)
SAMPLE_DIR.mkdir(parents=True, exist_ok=True)
