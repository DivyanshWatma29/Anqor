import { insforge } from './insforge';
import type { ClaimData } from '@/components/ClaimForm';

// ─── Types ───────────────────────────────────────────────────────

export interface ClaimRecord {
  id: string;
  claim_id: string;
  input_data: ClaimData;
  prediction: 'Fraud' | 'Legitimate';
  risk_score: number;
  indicators: string[];
  incident_type: string;
  claim_amount: number;
  status: 'pending' | 'reviewed' | 'flagged';
  batch_id: string | null;
  created_at: string;
}

export interface BatchRecord {
  id: string;
  file_name: string;
  total_rows: number;
  processed_rows: number;
  status: 'processing' | 'completed' | 'failed';
  created_at: string;
}

export interface BatchResult {
  batch: BatchRecord;
  claims: ClaimRecord[];
  failedRows: number[];
}

export interface DashboardStats {
  totalClaims: number;
  fraudDetected: number;
  avgRiskScore: number;
  fraudRate: number;
  trendData: { month: string; fraud: number; legit: number }[];
  severityBreakdown: { severity: string; count: number }[];
  claimAmountDistribution: { range: string; count: number }[];
}

interface FlaskPrediction {
  prediction: 'Y' | 'N';
  probability: number;
  indicators: string[];
}

// ─── Constants ───────────────────────────────────────────────────

const MAX_GUEST_BATCH_ROWS = 50;

// ─── Helpers ─────────────────────────────────────────────────────

function generateClaimId(): string {
  const hex = crypto.randomUUID().replace(/-/g, '').slice(0, 8).toUpperCase();
  return `CLM-${hex}`;
}

async function getUserId(): Promise<string | null> {
  try {
    const { data } = await insforge.auth.getCurrentUser();
    return data?.user?.id ?? null;
  } catch {
    return null;
  }
}

function buildClaimRecord(
  claimData: ClaimData,
  mlResult: FlaskPrediction,
  overrides: Partial<ClaimRecord> = {},
): Omit<ClaimRecord, 'id'> {
  const totalClaim =
    claimData.injury_claim + claimData.property_claim + claimData.vehicle_claim;

  return {
    claim_id: generateClaimId(),
    input_data: claimData,
    prediction: mlResult.prediction === 'Y' ? 'Fraud' : 'Legitimate',
    risk_score: Math.round(mlResult.probability * 100),
    indicators: mlResult.indicators,
    incident_type: claimData.incident_type,
    claim_amount: totalClaim,
    status: 'pending',
    batch_id: null,
    created_at: new Date().toISOString(),
    ...overrides,
  };
}

// ─── ML Prediction ──────────────────────────────────────────────

async function callFlaskML(claimData: ClaimData): Promise<FlaskPrediction> {
  const mlUrl = import.meta.env.VITE_ML_SERVICE_URL || 'http://localhost:5000';
  const response = await fetch(`${mlUrl}/predict`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(claimData),
  });

  if (!response.ok) {
    const err: Record<string, string> = await response.json().catch(() => ({}));
    throw new Error(err.error || 'ML service error');
  }
  return response.json() as Promise<FlaskPrediction>;
}

// ─── Claims API ─────────────────────────────────────────────────

export async function predictClaim(claimData: ClaimData): Promise<ClaimRecord> {
  const userId = await getUserId();
  const mlResult = await callFlaskML(claimData);
  const record = buildClaimRecord(claimData, mlResult);

  if (!userId) {
    return { id: `guest-${Date.now()}`, ...record };
  }

  const { data, error } = await insforge.database
    .from('claims')
    .insert([{ ...record, user_id: userId }])
    .select();

  if (error) throw new Error(error.message || 'Failed to save claim');
  return (data as ClaimRecord[])[0];
}

export async function getClaims(params?: {
  page?: number;
  limit?: number;
  prediction?: string;
  sort?: string;
  order?: 'asc' | 'desc';
}): Promise<{ data: ClaimRecord[]; total: number }> {
  const page = params?.page || 1;
  const limit = params?.limit || 20;
  const from = (page - 1) * limit;
  const to = from + limit - 1;

  let query = insforge.database
    .from('claims')
    .select('*', { count: 'exact' })
    .range(from, to)
    .order(params?.sort || 'created_at', {
      ascending: params?.order === 'asc',
    });

  if (params?.prediction) {
    query = query.eq('prediction', params.prediction);
  }

  const { data, error, count } = await query;
  if (error) throw new Error(error.message || 'Failed to fetch claims');
  return { data: (data as ClaimRecord[]) || [], total: (count as number) || 0 };
}

export async function getClaimById(id: string): Promise<ClaimRecord> {
  const { data, error } = await insforge.database
    .from('claims')
    .select('*')
    .eq('id', id)
    .single();

  if (error) throw new Error(error.message || 'Claim not found');
  return data as ClaimRecord;
}

// ─── Stats API ──────────────────────────────────────────────────

export async function getClaimStats(): Promise<DashboardStats> {
  const { data: claims, error } = await insforge.database
    .from('claims')
    .select('prediction, risk_score, claim_amount, input_data, created_at')
    .order('created_at', { ascending: false })
    .limit(500);

  if (error) throw new Error(error.message || 'Failed to fetch stats');
  const allClaims = (claims as ClaimRecord[]) || [];

  const totalClaims = allClaims.length;
  const fraudClaims = allClaims.filter((c) => c.prediction === 'Fraud');
  const fraudDetected = fraudClaims.length;

  const avgRiskScore = totalClaims > 0
    ? Math.round((allClaims.reduce((sum, c) => sum + c.risk_score, 0) / totalClaims) * 10) / 10
    : 0;

  const fraudRate = totalClaims > 0
    ? Math.round((fraudDetected / totalClaims) * 1000) / 10
    : 0;

  const recent10 = allClaims.slice(0, 10).reverse();
  const trendData = recent10.map((claim, i) => ({
    month: `#${i + 1}`,
    fraud: claim.prediction === 'Fraud' ? claim.risk_score : 0,
    legit: claim.prediction === 'Legitimate' ? 100 - claim.risk_score : 0,
  }));

  const severityMap = new Map<string, number>();
  for (const claim of allClaims) {
    const severity = (claim.input_data as ClaimData)?.incident_severity || 'Unknown';
    severityMap.set(severity, (severityMap.get(severity) || 0) + 1);
  }
  const severityBreakdown = Array.from(severityMap.entries()).map(
    ([severity, count]) => ({ severity, count })
  );

  const ranges = [
    { range: '0-5K', min: 0, max: 5000 },
    { range: '5-15K', min: 5000, max: 15000 },
    { range: '15-30K', min: 15000, max: 30000 },
    { range: '30-50K', min: 30000, max: 50000 },
    { range: '50-75K', min: 50000, max: 75000 },
    { range: '75K+', min: 75000, max: Infinity },
  ];
  const claimAmountDistribution = ranges.map(({ range, min, max }) => ({
    range,
    count: allClaims.filter((c) => c.claim_amount >= min && c.claim_amount < max).length,
  }));

  return {
    totalClaims,
    fraudDetected,
    avgRiskScore,
    fraudRate,
    trendData,
    severityBreakdown,
    claimAmountDistribution,
  };
}

// ─── Batches API ────────────────────────────────────────────────

export async function createBatch(rows: ClaimData[], fileName: string): Promise<BatchResult> {
  const userId = await getUserId();

  if (!userId) {
    return _createGuestBatch(rows, fileName);
  }

  return _createAuthenticatedBatch(rows, fileName, userId);
}

async function _createGuestBatch(rows: ClaimData[], fileName: string): Promise<BatchResult> {
  if (rows.length > MAX_GUEST_BATCH_ROWS) {
    throw new Error(`Guest mode supports up to ${MAX_GUEST_BATCH_ROWS} rows. Sign in to process larger batches.`);
  }

  const processedClaims: ClaimRecord[] = [];
  const failedRows: number[] = [];

  for (let i = 0; i < rows.length; i++) {
    try {
      const mlResult = await callFlaskML(rows[i]);
      const record = buildClaimRecord(rows[i], mlResult);
      processedClaims.push({
        id: `guest-${Date.now()}-${processedClaims.length}`,
        ...record,
      });
    } catch {
      failedRows.push(i);
    }
  }

  return {
    batch: {
      id: `guest-batch-${Date.now()}`,
      file_name: fileName,
      total_rows: rows.length,
      processed_rows: processedClaims.length,
      status: 'completed',
      created_at: new Date().toISOString(),
    },
    claims: processedClaims,
    failedRows,
  };
}

async function _createAuthenticatedBatch(rows: ClaimData[], fileName: string, userId: string): Promise<BatchResult> {
  const batch = await _initializeBatchRecord(rows.length, fileName, userId);
  const { processedClaims, failedRows } = await _processBatchRows(rows, batch.id, userId);

  const finalStatus = failedRows.length === rows.length ? 'failed' : 'completed';
  const updatedBatch = await _finalizeBatchRecord(batch.id, finalStatus, processedClaims.length);
  const batchClaims = await _fetchBatchClaims(batch.id);

  return {
    batch: updatedBatch,
    claims: batchClaims,
    failedRows,
  };
}

async function _initializeBatchRecord(totalRows: number, fileName: string, userId: string): Promise<BatchRecord> {
  const { data, error } = await insforge.database
    .from('batches')
    .insert([{
      user_id: userId,
      file_name: fileName,
      total_rows: totalRows,
      processed_rows: 0,
      status: 'processing',
    }])
    .select();

  if (error) throw new Error(error.message || 'Failed to create batch');
  return (data as BatchRecord[])[0];
}

async function _processBatchRows(rows: ClaimData[], batchId: string, userId: string) {
  const processedClaims: ClaimRecord[] = [];
  const failedRows: number[] = [];

  for (let i = 0; i < rows.length; i++) {
    try {
      const mlResult = await callFlaskML(rows[i]);
      const record = buildClaimRecord(rows[i], mlResult, { batch_id: batchId });

      await insforge.database.from('claims').insert([{
        ...record,
        user_id: userId,
      }]);

      processedClaims.push({ id: `pending-${i}`, ...record });
    } catch {
      failedRows.push(i);
    }
  }

  return { processedClaims, failedRows };
}

async function _finalizeBatchRecord(batchId: string, status: string, processedCount: number): Promise<BatchRecord> {
  const { data, error } = await insforge.database
    .from('batches')
    .update({ status, processed_rows: processedCount })
    .eq('id', batchId)
    .select();

  if (error) throw new Error(error.message);
  return (data as BatchRecord[])[0];
}

async function _fetchBatchClaims(batchId: string): Promise<ClaimRecord[]> {
  const { data } = await insforge.database
    .from('claims')
    .select('*')
    .eq('batch_id', batchId)
    .order('created_at', { ascending: false });

  return (data as ClaimRecord[]) || [];
}

export async function getBatches(): Promise<BatchRecord[]> {
  const { data, error } = await insforge.database
    .from('batches')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) throw new Error(error.message || 'Failed to fetch batches');
  return (data as BatchRecord[]) || [];
}

export async function getBatchById(
  id: string
): Promise<{ batch: BatchRecord; claims: ClaimRecord[] }> {
  const { data: batchData, error: batchError } = await insforge.database
    .from('batches')
    .select('*')
    .eq('id', id)
    .single();

  if (batchError) throw new Error(batchError.message || 'Batch not found');

  const { data: claimsData, error: claimsError } = await insforge.database
    .from('claims')
    .select('*')
    .eq('batch_id', id)
    .order('created_at', { ascending: false });

  if (claimsError) throw new Error(claimsError.message);

  return {
    batch: batchData as BatchRecord,
    claims: (claimsData as ClaimRecord[]) || [],
  };
}
