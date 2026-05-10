import { useState, useEffect } from 'react';
import { m } from 'framer-motion';
import { FileSpreadsheet, Loader2, LogIn, ChevronDown } from 'lucide-react';
import FileDropzone, { type ParsedFileResult } from '@/components/FileDropzone';
import BulkResultsTable from '@/components/BulkResultsTable';
import { createBatch, predictClaim, type ClaimRecord } from '@/lib/api';
import type { ClaimData } from '@/components/ClaimForm';
import { extractClaimFromFile, mapCSVHeaders } from '@/lib/documentAI';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import { Link } from 'react-router-dom';
import { INSURANCE_SCHEMAS, type ClaimCategory } from '@/schemas/insuranceTypes';
import { enqueueOfflineAction } from '@/lib/offlineQueue';
import { useNetworkStatus } from '@/lib/network';
import { analyticsTrack, ANALYTICS_EVENTS } from '@/lib/analytics';
import { saveDraft, loadDraft, clearDraft } from '@/lib/formDraft';

const BulkCheckPage = () => {
  // Load persisted state or use defaults
  const [claimCategory, setClaimCategory] = useState<ClaimCategory>(() => {
    const saved = loadDraft<ClaimCategory>('bulk_category');
    return saved && Object.keys(INSURANCE_SCHEMAS).includes(saved) ? saved : "auto";
  });
  const [processing, setProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [totalRows, setTotalRows] = useState(0);
  const [statusText, setStatusText] = useState('Processing claims...');
  const [results, setResults] = useState<ClaimRecord[]>(() => {
    return loadDraft<ClaimRecord[]>('bulk_results', 60 * 60 * 1000) || []; // 1 hour
  });
  const { user } = useAuth();
  const { isOnline, setQueueSize } = useNetworkStatus();

  // Persist category selection
  useEffect(() => {
    saveDraft('bulk_category', claimCategory);
  }, [claimCategory]);

  // Persist results
  useEffect(() => {
    if (results.length > 0) {
      saveDraft('bulk_results', results);
    }
  }, [results]);

  const handleFileReady = async (fileResult: ParsedFileResult) => {
    setProcessing(true);
    setResults([]);
    setProgress(0);

    const schema = INSURANCE_SCHEMAS[claimCategory];
    const EXPECTED_HEADERS = schema.requiredFields;

    try {
      analyticsTrack(ANALYTICS_EVENTS.BULK_PROCESSING_STARTED, { claimCategory, fileType: fileResult.type, userLoggedIn: Boolean(user) });
      if (fileResult.type === 'csv') {
        const rawRows = fileResult.rows;
        if (rawRows.length === 0) throw new Error("CSV file is empty");

        setTotalRows(rawRows.length);
        setStatusText(`Analyzing CSV headers for ${schema.label}...`);

        const headers = Object.keys(rawRows[0]);
        const mappingResult = await mapCSVHeaders(headers, claimCategory);

        if (!mappingResult.success || !mappingResult.is_valid_insurance_dataset) {
          throw new Error(mappingResult.rejection_reason || mappingResult.error || `Invalid ${schema.label} dataset`);
        }

        toast.success("Headers mapped successfully! Processing rows...");
        setStatusText('Transforming and processing claims...');
        const mapping = mappingResult.mapping || {};

        const transformedRows: unknown[] = [];
        const failedRowIndices: number[] = [];

        rawRows.forEach((row, index) => {
          const transformed: Record<string, string | number | boolean> = {};
          let isValid = true;

          for (const [userCol, ourCol] of Object.entries(mapping)) {
             if (ourCol && row[userCol] !== undefined) {
                transformed[ourCol] = row[userCol];
             }
          }

          if (Object.keys(transformed).length < Math.floor(EXPECTED_HEADERS.length * 0.2)) isValid = false;

          if (isValid) {
            const finalRow: Record<string, string | number | boolean> = {};
            for (const key of EXPECTED_HEADERS) {
              // Basic fallback for missing required fields (in a real app, numeric/string checking would be schema-driven)
              finalRow[key] = transformed[key] || 0;
            }
            finalRow['claim_type'] = claimCategory;
            transformedRows.push(finalRow);
          } else {
            failedRowIndices.push(index + 1);
          }
        });

        if (transformedRows.length === 0) {
          throw new Error("No valid rows found after mapping.");
        }

        const progressInterval = setInterval(() => {
          setProgress((prev) => Math.min(prev + 1, transformedRows.length - 1));
        }, 200);

        if (!isOnline) {
          enqueueOfflineAction('createBatch', { claims: transformedRows, claimCategory });
          analyticsTrack(ANALYTICS_EVENTS.OFFLINE_ACTION_QUEUED, { actionType: 'createBatch', claimCategory, itemCount: transformedRows.length });
          setQueueSize((size) => size + 1);
          toast.info('Offline: batch queued for processing when you reconnect.');
          setProcessing(false);
          return;
        }

        const batchResult = await createBatch(transformedRows as ClaimData[], claimCategory);
        analyticsTrack(ANALYTICS_EVENTS.BULK_PROCESSING_COMPLETED, { claimCategory, totalClaims: batchResult.total_claims, processedClaims: batchResult.processed_claims });
        clearInterval(progressInterval);
        setProgress(transformedRows.length);

        const claimResults: ClaimRecord[] = (batchResult.predictions || [])
          .filter((p: Record<string, unknown>) => p.status === 'success')
          .map((p: Record<string, unknown>, i: number) => ({
            id: `temp-${i}`,
            claim_id: `CLM-BATCH-${i}`,
            input_data: (p.claim_data || {}) as Record<string, string | number | boolean>,
            prediction: (p.prediction === 'Y' ? 'Fraud' : p.prediction === 'Fraud' ? 'Fraud' : 'Legitimate') as 'Fraud' | 'Legitimate',
            risk_score: (p.risk_score as number) || 0,
            risk_level: ((p.risk_score as number) || 0) >= 80 ? 'critical' : ((p.risk_score as number) || 0) >= 60 ? 'high' : ((p.risk_score as number) || 0) >= 40 ? 'medium' : 'low',
            indicators: (p.indicators || []) as string[],
            incident_type: String((p.claim_data as Record<string, unknown>)?.incident_type || (p.claim_data as Record<string, unknown>)?.claim_type || 'Unknown'),
            claim_amount: Number((p.claim_data as Record<string, unknown>)?.claim_amount || (p.claim_data as Record<string, unknown>)?.repair_estimate || 0),
            status: 'pending' as const,
            created_at: new Date().toISOString(),
          }));
        setResults(claimResults);

        const backendFailed = (batchResult.predictions || [])
          .map((p: Record<string, unknown>, i: number) => p.status === 'failed' ? i + 1 : -1)
          .filter((i: number) => i > 0);
        const allFailed = [...failedRowIndices, ...backendFailed];
        const msg = `Processed ${batchResult.processed_claims} of ${batchResult.total_claims} claims`;

        if (allFailed.length > 0) {
          toast.warning(`${msg} (${allFailed.length} skipped)`);
        } else {
          toast.success(msg);
        }
      } else {
        setTotalRows(1);
        setStatusText(`Extracting fields for ${schema.label}...`);

        const extraction = await extractClaimFromFile(fileResult.file, claimCategory);
        if (!extraction.success || !extraction.data) {
          toast.error(extraction.rejection_reason || extraction.error || 'Failed to extract fields from document');
          setProcessing(false);
          return;
        }

        setStatusText('Running fraud prediction...');
        setProgress(1);

        const payload = { ...extraction.data, claim_type: claimCategory } as ClaimData;
        if (!isOnline) {
          enqueueOfflineAction('predictClaim', payload);
          analyticsTrack(ANALYTICS_EVENTS.OFFLINE_ACTION_QUEUED, { actionType: 'predictClaim', claimCategory, source: 'bulk-document' });
          setQueueSize((size) => size + 1);
          toast.info('Offline: document prediction queued for submission when you reconnect.');
          setProcessing(false);
          return;
        }

        const claim = await predictClaim(payload);
        analyticsTrack(ANALYTICS_EVENTS.CLAIM_PREDICTION_COMPLETED, { claimCategory, prediction: claim.prediction, source: 'bulk-document' });
        setResults([claim]);
        toast.success('Document analyzed and prediction complete');
      }
    } catch (err: unknown) {
      analyticsTrack(ANALYTICS_EVENTS.BULK_PROCESSING_FAILED, { claimCategory, message: err instanceof Error ? err.message : 'unknown_error' });
      toast.error("Processing failed", {
        description: err instanceof Error ? err.message : "Unknown error"
      });
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="relative py-12 sm:py-20">
      <div className="absolute inset-0 dot-grid opacity-20" />
      <div className="glow-orb w-[400px] h-[400px] -top-32 -left-32 bg-[hsl(var(--glow-cyan))] opacity-[0.05]" />
      <div className="glow-orb w-[300px] h-[300px] bottom-0 -right-32 bg-[hsl(var(--glow-purple))] opacity-[0.04]" />

      <div className="relative max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        <m.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center"
        >
          <span className="section-label">Batch Processing</span>
          <h1 className="text-3xl sm:text-4xl font-bold text-foreground mt-4">Universal Bulk Fraud Check</h1>
          <p className="text-muted-foreground mt-3 max-w-xl mx-auto">
            Upload CSV, PDF, or image files to process claims through our multi-model AI engine.
          </p>
          {!user && (
            <Link
              to="/login"
              className="inline-flex items-center gap-2 mt-4 px-4 py-2 rounded-xl bg-primary/10 text-primary hover:bg-primary/20 text-sm font-medium transition-all"
            >
              <LogIn className="w-4 h-4" />
              Sign in to save your results
            </Link>
          )}
        </m.div>

        {/* Claim Type Selector */}
        <div className="flex justify-center">
          <div className="glass-card p-4 flex flex-col sm:flex-row items-center gap-4 w-full max-w-md">
            <span className="text-sm font-semibold text-foreground whitespace-nowrap">Dataset Category:</span>
            <div className="relative w-full">
              <select
                value={claimCategory}
                onChange={(e) => setClaimCategory(e.target.value as ClaimCategory)}
                className="input-premium appearance-none pr-10 w-full"
                disabled={processing}
              >
                {Object.values(INSURANCE_SCHEMAS).filter((s) => s.isAvailable).map((schema) => (
                  <option key={schema.id} value={schema.id} disabled={!schema.isAvailable}>
                    {schema.label}{!schema.isAvailable ? " (Coming Soon)" : ""}
                  </option>
                ))}
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
            </div>
          </div>
        </div>

        {/* Dropzone */}
        <FileDropzone onFileReady={handleFileReady} expectedHeaders={INSURANCE_SCHEMAS[claimCategory].requiredFields} disabled={processing} />

        {/* Progress */}
        {processing && (
          <m.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass-card p-6 space-y-3"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm text-foreground">
                <Loader2 className="w-4 h-4 animate-spin text-primary" />
                {statusText}
              </div>
              <span className="text-xs text-muted-foreground">
                {progress} / {totalRows}
              </span>
            </div>
            <div className="w-full h-2 rounded-full bg-secondary overflow-hidden">
              <m.div
                className="h-full rounded-full bg-gradient-to-r from-primary to-[hsl(var(--glow-purple))]"
                initial={{ width: 0 }}
                animate={{ width: `${totalRows > 0 ? (progress / totalRows) * 100 : 0}%` }}
                transition={{ duration: 0.3 }}
              />
            </div>
          </m.div>
        )}

        {/* Results */}
        {results.length > 0 && <BulkResultsTable claims={results} />}

        {/* Empty state */}
        {!processing && results.length === 0 && (
          <m.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="glass-card p-12 text-center"
          >
            <FileSpreadsheet className="w-12 h-12 mx-auto text-muted-foreground/30 mb-4" />
            <p className="text-sm text-muted-foreground">
              Select a category and upload your files to get started
            </p>
          </m.div>
        )}
      </div>
    </div>
  );
};

export default BulkCheckPage;
