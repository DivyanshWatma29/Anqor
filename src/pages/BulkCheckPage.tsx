import { useState } from 'react';
import { m } from 'framer-motion';
import { FileSpreadsheet, Loader2, LogIn } from 'lucide-react';
import FileDropzone, { type ParsedFileResult } from '@/components/FileDropzone';
import BulkResultsTable from '@/components/BulkResultsTable';
import { createBatch, predictClaim, type ClaimRecord } from '@/lib/api';
import type { ClaimData } from '@/components/ClaimForm';
import { extractClaimFromFile } from '@/lib/documentAI';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import { Link } from 'react-router-dom';

const EXPECTED_HEADERS: (keyof ClaimData)[] = [
  'months_as_customer', 'insured_sex', 'insured_education_level',
  'insured_occupation', 'insured_relationship', 'policy_deductable',
  'policy_annual_premium', 'umbrella_limit', 'policy_csl',
  'capital_gains', 'capital_loss', 'incident_hour_of_the_day',
  'incident_type', 'collision_type', 'incident_severity',
  'authorities_contacted', 'number_of_vehicles_involved',
  'bodily_injuries', 'witnesses', 'injury_claim', 'property_claim',
  'vehicle_claim', 'property_damage', 'police_report_available',
];

const NUMERIC_FIELDS = new Set<string>([
  'months_as_customer', 'policy_deductable', 'policy_annual_premium',
  'umbrella_limit', 'capital_gains', 'capital_loss',
  'incident_hour_of_the_day', 'number_of_vehicles_involved',
  'bodily_injuries', 'witnesses', 'injury_claim', 'property_claim',
  'vehicle_claim',
]);

function parseRow(raw: Record<string, string | number>): ClaimData {
  const parsed: Record<string, string | number> = {};
  for (const key of EXPECTED_HEADERS) {
    if (NUMERIC_FIELDS.has(key)) {
      parsed[key] = Number(raw[key]) || 0;
    } else {
      parsed[key] = String(raw[key] || '');
    }
  }
  return parsed as unknown as ClaimData;
}

const BulkCheckPage = () => {
  const [processing, setProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [totalRows, setTotalRows] = useState(0);
  const [statusText, setStatusText] = useState('Processing claims...');
  const [results, setResults] = useState<ClaimRecord[]>([]);
  const { user } = useAuth();

  const handleFileReady = async (fileResult: ParsedFileResult) => {
    setProcessing(true);
    setResults([]);
    setProgress(0);

    try {
      if (fileResult.type === 'csv') {
        const claimRows = fileResult.rows.map(parseRow);
        setTotalRows(claimRows.length);
        setStatusText('Processing CSV claims...');

        const progressInterval = setInterval(() => {
          setProgress((prev) => Math.min(prev + 1, claimRows.length - 1));
        }, 200);

        const { batch, claims, failedRows } = await createBatch(claimRows, fileResult.fileName);
        clearInterval(progressInterval);
        setProgress(claimRows.length);
        setResults(claims);

        const msg = `Processed ${batch.processed_rows} of ${batch.total_rows} claims`;
        if (failedRows.length > 0) {
          toast.warning(`${msg} (${failedRows.length} failed: rows ${failedRows.map(r => r + 1).join(', ')})`);
        } else {
          toast.success(msg);
        }
      } else {
        setTotalRows(1);
        setStatusText('Extracting fields with AI...');

        const extraction = await extractClaimFromFile(fileResult.file);
        if (!extraction.success || !extraction.data) {
          toast.error(extraction.error || 'Failed to extract fields from document');
          setProcessing(false);
          return;
        }

        setStatusText('Running fraud prediction...');
        setProgress(1);

        const claim = await predictClaim(extraction.data);
        setResults([claim]);
        toast.success('Document analyzed and prediction complete');
      }
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Processing failed');
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
          <h1 className="text-3xl sm:text-4xl font-bold text-foreground mt-4">Bulk Fraud Check</h1>
          <p className="text-muted-foreground mt-3 max-w-xl mx-auto">
            Upload CSV, PDF, or image files to process claims through the ML engine.
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

        {/* Dropzone */}
        <FileDropzone onFileReady={handleFileReady} expectedHeaders={EXPECTED_HEADERS} />

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
              Upload a CSV, PDF, or image file to get started
            </p>
          </m.div>
        )}
      </div>
    </div>
  );
};

export default BulkCheckPage;
