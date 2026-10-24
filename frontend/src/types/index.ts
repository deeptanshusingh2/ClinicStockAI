export type RecordStatus = 'draft' | 'verified' | 'rejected';
export type RecordSource = 'photo_assisted' | 'manual_entry';
export type UrgencyLevel = 'expired' | 'critical' | 'warning' | 'upcoming';

export interface BoundingBox {
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface CandidateMedicine {
  id: string;
  medicine_name: string;
  strength: string | null;
  batch_number: string | null;
  expiry_date: string | null;
  visible_package_count: number;
  verified_quantity: number | null;
  evidence_notes: string;
  uncertain_fields: string[];
  bounding_box?: BoundingBox | null;
  confidence?: number | null;
  
  // UI tracking states
  is_verified?: boolean;
  is_rejected?: boolean;
  verified_record_id?: string;
}

export interface AnalysisResponse {
  draft_id: string;
  image_filename: string;
  image_url: string;
  candidates: CandidateMedicine[];
  total_detected: number;
  processing_time_ms: number;
  model_used: string;
  is_fallback: boolean;
  timestamp: string;
}

export interface InventoryRecord {
  id: string;
  medicine_name: string;
  strength: string | null;
  batch_number: string | null;
  expiry_date: string | null;
  verified_quantity: number;
  visible_package_count: number | null;
  status: RecordStatus;
  source: RecordSource;
  evidence_notes: string | null;
  uncertain_fields: string[];
  image_filename: string | null;
  created_at: string;
  updated_at: string;
  verified_at: string | null;
  days_until_expiry?: number | null;
  urgency?: UrgencyLevel | null;
}

export interface ExpiryAlertItem {
  id: string;
  medicine_name: string;
  strength: string | null;
  batch_number: string | null;
  expiry_date: string;
  verified_quantity: number;
  days_until_expiry: number;
  urgency: UrgencyLevel;
  alert_message: string;
}

export interface ExpiryAlertsSummary {
  threshold_days: number;
  total_alerts: number;
  expired_count: number;
  critical_count: number;
  warning_count: number;
  upcoming_count: number;
  alerts: ExpiryAlertItem[];
}

export interface OllamaStatus {
  connected: boolean;
  base_url: string;
  active_model: string;
  available_models: string[];
  message: string;
}

export interface SampleImage {
  id: string;
  title: string;
  description: string;
  url: string;
  features: string[];
}

export interface EvaluationSampleResult {
  case_name: string;
  description: string;
  image_name: string;
  ground_truth_count: number;
  detected_count: number;
  medicine_name_accuracy: number;
  strength_accuracy: number;
  batch_accuracy: number;
  expiry_accuracy: number;
  overall_precision: number;
  overall_completeness: number;
  inference_latency_ms: number;
}

export interface EvaluationReport {
  total_test_cases: number;
  mean_medicine_accuracy: number;
  mean_strength_accuracy: number;
  mean_batch_accuracy: number;
  mean_expiry_accuracy: number;
  mean_precision: number;
  mean_completeness: number;
  mean_latency_ms: number;
  cases: EvaluationSampleResult[];
}
