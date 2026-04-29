import { insforge } from './insforge';
import type { ClaimData } from '@/components/ClaimForm';

export interface ClaimRecord {
  id: string;
  claim_id: string;
  input_data: Record<string, string | number | boolean>;
  prediction: 'Fraud' | 'Legitimate';
  risk_score: number;
  indicators: string[];
  incident_type: string;
  claim_amount: number;
  status: 'pending' | 'reviewed' | 'flagged';
  created_at: string;
}

export interface DashboardStats {
  totalClaims: number;
  fraudDetected: number;
  avgRiskScore: number;
  trendData: { month: string; fraud: number; legit: number }[];
  severityBreakdown: { severity: string; count: number }[];
  claimAmountDistribution: { range: string; count: number }[];
}

interface FlaskPrediction {
  prediction: 'Y' | 'N';
  probability: number;
  indicators: string[];
}

// ─── Helpers ─────────────────────────────────────────────────────

function generateClaimId(): string {
  return 'CLM-' + Math.random().toString(36).substring(2, 10).toUpperCase();
}

async function getUserId(): Promise<string | null> {
  const { data: { user } } = await insforge.auth.getCurrentUser();
  return user?.id || null;
}

function calculateTotalClaim(claimData: Record<string, string | number | boolean>): number {
  // Try to find the total claim amount based on the category fields
  if (claimData.claim_amount) return Number(claimData.claim_amount);
  if (claimData.repair_estimate) return Number(claimData.repair_estimate);
  if (claimData.net_sales) return Number(claimData.net_sales);
  
  // Auto insurance fallback
  const injury = Number(claimData.injury_claim) || 0;
  const property = Number(claimData.property_claim) || 0;
  const vehicle = Number(claimData.vehicle_claim) || 0;
  return injury + property + vehicle;
}

function buildClaimRecord(claimData: Record<string, string | number | boolean>, mlResult: FlaskPrediction): Omit<ClaimRecord, 'id' | 'created_at'> {
  const totalClaim = calculateTotalClaim(claimData);
  const incidentType = String(claimData.incident_type || claimData.claim_type || claimData.product_name || claimData.cause_of_death || 'Unknown');

  return {
    claim_id: generateClaimId(),
    input_data: claimData,
    prediction: mlResult.prediction === 'Y' ? 'Fraud' : 'Legitimate',
    risk_score: Math.round(mlResult.probability * 100),
    indicators: mlResult.indicators || ["No specific indicators returned"],
    incident_type: incidentType,
    claim_amount: totalClaim,
    status: 'pending',
  };
}

// ─── ML Prediction ──────────────────────────────────────────────

async function callFlaskML(claimData: Record<string, string | number | boolean>): Promise<FlaskPrediction> {
  const mlUrl = import.meta.env.VITE_ML_SERVICE_URL || 'http://localhost:5000';
  const response = await fetch(`${mlUrl}/predict`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(claimData),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => null);
    throw new Error(errorData?.error || `Failed to analyze claim: ${response.statusText}`);
  }

  return response.json() as Promise<FlaskPrediction>;
}

// ─── Claims API ─────────────────────────────────────────────────

export async function predictClaim(claimData: Record<string, string | number | boolean>): Promise<ClaimRecord> {
  const userId = await getUserId();
  const mlResult = await callFlaskML(claimData);
  const record = buildClaimRecord(claimData, mlResult);

  if (!userId) {
    return { ...record, id: 'temp-id', created_at: new Date().toISOString() };
  }

  const { data, error } = await insforge.database
    .from('claims')
    .insert([{ ...record, user_id: userId }])
    .select()
    .single();

  if (error) {
    console.error('Error saving claim:', error);
    // Still return prediction even if save fails
    return { ...record, id: 'temp-id', created_at: new Date().toISOString() };
  }

  return data as ClaimRecord;
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

// ─── Batch Claims API ───────────────────────────────────────────

export async function _createGuestBatch(claims: Record<string, string | number | boolean>[], claimCategory: string) {
  const predictions = await Promise.all(
    claims.map(async (claim) => {
      try {
        const payload = { ...claim, claim_type: claimCategory };
        const mlResult = await callFlaskML(payload);
        return {
          claim_data: claim,
          prediction: mlResult.prediction === 'Y' ? 'Fraud' : 'Legitimate',
          risk_score: Math.round(mlResult.probability * 100),
          indicators: mlResult.indicators || [],
          status: 'success'
        };
      } catch (err: unknown) {
        return {
          claim_data: claim,
          prediction: 'Unknown',
          risk_score: 0,
          indicators: [],
          status: 'failed',
          error: err.message
        };
      }
    })
  );

  return {
    id: `batch_temp_${Date.now()}`,
    status: 'completed',
    total_claims: claims.length,
    processed_claims: predictions.filter(p => p.status === 'success').length,
    predictions,
    created_at: new Date().toISOString()
  };
}

export async function _createAuthenticatedBatch(userId: string, claims: Record<string, string | number | boolean>[], claimCategory: string) {
  const { data: batch, error: batchError } = await insforge.database
    .from('claim_batches')
    .insert([{
      user_id: userId,
      total_claims: claims.length,
      status: 'processing'
    }])
    .select()
    .single();

  if (batchError) throw new Error('Failed to create batch record: ' + batchError.message);

  let processedCount = 0;
  const results = [];

  for (const claim of claims) {
    try {
      const payload = { ...claim, claim_type: claimCategory };
      const mlResult = await callFlaskML(payload);
      const record = buildClaimRecord(payload, mlResult);
      
      const { data: savedClaim, error: saveError } = await insforge.database
        .from('claims')
        .insert([{ ...record, user_id: userId, batch_id: batch.id }])
        .select()
        .single();
        
      if (!saveError && savedClaim) {
        processedCount++;
        results.push({
          claim_data: claim,
          prediction: record.prediction,
          risk_score: record.risk_score,
          indicators: record.indicators,
          status: 'success'
        });
      } else {
        throw new Error(saveError?.message || 'Save failed');
      }
    } catch (err: unknown) {
      results.push({
        claim_data: claim,
        prediction: 'Unknown',
        risk_score: 0,
        indicators: [],
        status: 'failed',
        error: err.message
      });
    }
  }

  const { error: updateError } = await insforge.database
    .from('claim_batches')
    .update({ 
      status: processedCount === claims.length ? 'completed' : 'completed_with_errors',
      processed_claims: processedCount 
    })
    .eq('id', batch.id);

  if (updateError) console.error("Failed to update batch status:", updateError);

  return {
    ...batch,
    status: processedCount === claims.length ? 'completed' : 'completed_with_errors',
    processed_claims: processedCount,
    predictions: results
  };
}

export async function createBatch(claims: Record<string, string | number | boolean>[], claimCategory: string = 'auto') {
  const userId = await getUserId();
  
  if (!userId) {
    return _createGuestBatch(claims, claimCategory);
  }
  
  return _createAuthenticatedBatch(userId, claims, claimCategory);
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

  const recent10 = allClaims.slice(0, 10).reverse();
  const trendData = recent10.map((claim, i) => ({
    month: `#${i + 1}`,
    fraud: claim.prediction === 'Fraud' ? claim.risk_score : 0,
    legit: claim.prediction === 'Legitimate' ? 100 - claim.risk_score : 0,
  }));

  const severityMap = new Map<string, number>();
  for (const claim of allClaims) {
    const data = claim.input_data as Record<string, string | number | boolean>;
    const severity = data?.incident_severity || data?.weather_conditions || 'Unknown';
    severityMap.set(severity, (severityMap.get(severity) || 0) + 1);
  }
  const severityBreakdown = Array.from(severityMap.entries()).map(([severity, count]) => ({
    severity,
    count,
  }));

  const amountMap = new Map<string, number>();
  for (const claim of allClaims) {
    const amt = claim.claim_amount || 0;
    let range = '0 - 5k';
    if (amt > 5000 && amt <= 20000) range = '5k - 20k';
    else if (amt > 20000 && amt <= 50000) range = '20k - 50k';
    else if (amt > 50000) range = '50k+';

    amountMap.set(range, (amountMap.get(range) || 0) + 1);
  }
  const claimAmountDistribution = Array.from(amountMap.entries()).map(([range, count]) => ({
    range,
    count,
  }));

  return {
    totalClaims,
    fraudDetected,
    avgRiskScore,
    trendData,
    severityBreakdown,
    claimAmountDistribution,
  };
}

export async function getClaimById(id: string): Promise<ClaimRecord> {
  const { data, error } = await insforge.database
    .from('claims')
    .select('*')
    .eq('id', id)
    .single();

  if (error) throw new Error(error.message || 'Failed to fetch claim');
  return data as ClaimRecord;
}
