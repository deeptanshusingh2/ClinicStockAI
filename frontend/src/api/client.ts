import {
  AnalysisResponse,
  CandidateMedicine,
  InventoryRecord,
  ExpiryAlertsSummary,
  OllamaStatus,
  SampleImage,
  EvaluationReport
} from '../types';

const API_BASE = '/api';

export const api = {
  async getHealth(): Promise<{ status: string; database: string; ollama: any }> {
    const res = await fetch(`${API_BASE}/health`);
    if (!res.ok) throw new Error('Health check failed');
    return res.json();
  },

  async getOllamaStatus(): Promise<OllamaStatus> {
    const res = await fetch(`${API_BASE}/ollama/status`);
    if (!res.ok) throw new Error('Failed to retrieve Ollama status');
    return res.json();
  },

  async getSampleImages(): Promise<SampleImage[]> {
    const res = await fetch(`${API_BASE}/sample-images`);
    if (!res.ok) throw new Error('Failed to retrieve sample shelf images');
    return res.json();
  },

  async analyzeShelf(
    file?: File,
    sampleName?: string
  ): Promise<AnalysisResponse> {
    const formData = new FormData();
    if (file) {
      formData.append('file', file);
    } else if (sampleName) {
      formData.append('sample_name', sampleName);
    } else {
      throw new Error('Must provide either a file or a sample shelf name');
    }

    const res = await fetch(`${API_BASE}/analyze`, {
      method: 'POST',
      body: formData,
    });

    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      throw new Error(errData.detail || 'Visual analysis failed');
    }
    return res.json();
  },

  async getInventory(
    search?: string,
    status: string = 'verified'
  ): Promise<InventoryRecord[]> {
    const params = new URLSearchParams();
    if (status) params.append('status', status);
    if (search) params.append('search', search);

    const res = await fetch(`${API_BASE}/inventory?${params.toString()}`);
    if (!res.ok) throw new Error('Failed to retrieve inventory records');
    return res.json();
  },

  async createInventoryItem(data: {
    medicine_name: string;
    strength?: string | null;
    batch_number?: string | null;
    expiry_date?: string | null;
    verified_quantity: number;
    evidence_notes?: string;
  }): Promise<InventoryRecord> {
    const res = await fetch(`${API_BASE}/inventory`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.detail || 'Failed to create inventory item');
    }
    return res.json();
  },

  async updateInventoryItem(
    id: string,
    data: Partial<{
      medicine_name: string;
      strength: string;
      batch_number: string;
      expiry_date: string;
      verified_quantity: number;
      status: string;
      evidence_notes: string;
    }>
  ): Promise<InventoryRecord> {
    const res = await fetch(`${API_BASE}/inventory/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error('Failed to update inventory record');
    return res.json();
  },

  async deleteInventoryItem(id: string): Promise<void> {
    const res = await fetch(`${API_BASE}/inventory/${id}`, {
      method: 'DELETE',
    });
    if (!res.ok) throw new Error('Failed to delete inventory record');
  },

  async verifyCandidate(
    candidate: CandidateMedicine,
    verifiedQuantity: number,
    imageFilename?: string
  ): Promise<InventoryRecord> {
    const params = new URLSearchParams();
    params.append('verified_quantity', verifiedQuantity.toString());
    if (imageFilename) params.append('image_filename', imageFilename);

    const res = await fetch(`${API_BASE}/inventory/verify-candidate?${params.toString()}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(candidate),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.detail || 'Failed to verify candidate into inventory');
    }
    return res.json();
  },

  async getExpiryAlerts(thresholdDays: number = 90): Promise<ExpiryAlertsSummary> {
    const res = await fetch(`${API_BASE}/alerts/expiry?threshold_days=${thresholdDays}`);
    if (!res.ok) throw new Error('Failed to retrieve expiry alerts');
    return res.json();
  },

  async getEvaluationMetrics(): Promise<EvaluationReport> {
    const res = await fetch(`${API_BASE}/evaluation`);
    if (!res.ok) throw new Error('Failed to fetch benchmark evaluation metrics');
    return res.json();
  }
};
