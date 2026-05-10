import { apiFetch } from './http';

export interface ClaimRecord {
  id: string;
  claim_id: string;
  input_data: Record<string, string | number | boolean>;
  prediction: 'Fraud' | 'Legitimate';
  risk_score: number;
  risk_level: string;
  indicators: string[];
  incident_type: string;
  claim_amount: number;
  status: 'pending' | 'reviewed' | 'flagged';
  created_at: string;
  fraud_explanation?: FraudExplanation;
  shap_explanation?: ShapExplanation;
  model_confidence?: ModelConfidence;
  confidence_interval?: ConfidenceInterval;
}

export interface DashboardStats {
  totalClaims: number;
  fraudDetected: number;
  avgRiskScore: number;
  trendData: { month: string; fraud: number; legit: number }[];
  severityBreakdown: { severity: string; count: number }[];
  claimAmountDistribution: { range: string; count: number }[];
}

interface FraudReason {
  title: string;
  detail: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  category: 'financial' | 'behavioral' | 'documentation' | 'statistical' | 'temporal';
  source: 'rule' | 'ml' | 'combined';
  field: string;
}

interface FraudExplanation {
  verdict: string;
  summary: string;
  risk_score: number;
  confidence: string;
  reasons: FraudReason[];
  positive_factors: FraudReason[];
  recommendation: string;
  total_risk_factors: number;
  total_positive_factors: number;
}

interface ShapExplanation {
  method?: string;
  features: {
    feature: string;
    impact: number;
    direction: string;
    magnitude: string;
  }[];
}

interface ModelConfidence {
  reliability: string;
  margin_of_error: number;
  f1_score: number;
  auc_roc: number;
  training_samples: number;
}

interface ConfidenceInterval {
  lower: number;
  upper: number;
  confidence_level: number;
}

export async function predictClaim(claimData: Record<string, string | number | boolean>): Promise<ClaimRecord> {
  return apiFetch<ClaimRecord>('/api/v1/claims/predict', {
    method: 'POST',
    body: JSON.stringify(claimData),
  });
}

export async function getClaims(params?: {
  page?: number;
  limit?: number;
  prediction?: string;
  sort?: string;
  order?: 'asc' | 'desc';
}): Promise<{ data: ClaimRecord[]; total: number }> {
  const search = new URLSearchParams();
  if (params?.page) search.set('page', String(params.page));
  if (params?.limit) search.set('limit', String(params.limit));
  if (params?.prediction) search.set('prediction', params.prediction);
  if (params?.sort) search.set('sort', params.sort);
  if (params?.order) search.set('order', params.order);
  return apiFetch<{ data: ClaimRecord[]; total: number }>(`/api/v1/claims?${search.toString()}`);
}

export async function createBatch(claims: Record<string, string | number | boolean>[], claimCategory: string = 'auto') {
  return apiFetch('/api/v1/batches', {
    method: 'POST',
    body: JSON.stringify({ claims, claimCategory }),
  });
}

export async function getClaimStats(): Promise<DashboardStats> {
  return apiFetch<DashboardStats>('/api/v1/stats');
}

export async function getClaimById(id: string): Promise<ClaimRecord> {
  return apiFetch<ClaimRecord>(`/api/v1/claims/${id}`);
}
