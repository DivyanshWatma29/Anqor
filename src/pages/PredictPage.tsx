import { useState } from "react";
import { AnimatePresence, m } from "framer-motion";
import ClaimForm, { type ClaimData } from "@/components/ClaimForm";
import PredictionResult, { type PredictionResultData } from "@/components/PredictionResult";
import LoadingAnimation from "@/components/LoadingAnimation";
import DocumentUploader from "@/components/DocumentUploader";
import { predictClaim } from "@/lib/api";
import { extractClaimFromFile, type ExtractionResult } from "@/lib/documentAI";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { Link } from "react-router-dom";
import { LogIn, ClipboardList, FileUp, ChevronDown } from "lucide-react";
import { INSURANCE_SCHEMAS, type ClaimCategory } from "@/schemas/insuranceTypes";

type Tab = "form" | "document";

const PredictPage = () => {
  const [activeTab, setActiveTab] = useState<Tab>("form");
  const [claimCategory, setClaimCategory] = useState<ClaimCategory>("auto");
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<PredictionResultData | null>(null);
  const { user } = useAuth();

  const [isExtracting, setIsExtracting] = useState(false);
  const [extractionResult, setExtractionResult] = useState<ExtractionResult | null>(null);
  const [extractedData, setExtractedData] = useState<ClaimData | null>(null);

  const handleSubmit = async (data: ClaimData) => {
    setIsLoading(true);
    setResult(null);

    try {
      const payload = { ...data, claim_type: claimCategory } as ClaimData;
      const claim = await predictClaim(payload);
      setResult({
        prediction: claim.prediction,
        probability: claim.risk_score,
        indicators: claim.indicators,
        claimType: claimCategory,
        risk_level: claim.risk_level,
        fraud_explanation: claim.fraud_explanation,
        model_confidence: claim.model_confidence,
        shap_explanation: claim.shap_explanation,
        confidence_interval: claim.confidence_interval,
      });
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed to analyze claim. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileSelected = async (file: File) => {
    setIsExtracting(true);
    setExtractionResult(null);
    setExtractedData(null);
    setResult(null);

    try {
      const extraction = await extractClaimFromFile(file, claimCategory);
      setExtractionResult(extraction);

      if (extraction.success && extraction.data) {
        setExtractedData(extraction.data);
        toast.success("Fields extracted successfully! Review and submit.");
      } else {
        if (extraction.is_valid_claim_form === false) {
          toast.error("Document Rejected", {
            description: extraction.rejection_reason || extraction.error
          });
        } else {
          toast.error("Failed to extract data", {
            description: extraction.error || "An unexpected error occurred"
          });
        }
      }
    } catch (err: unknown) {
      setExtractionResult({ success: false, error: err instanceof Error ? err.message : 'Unknown error', model: '' });
      toast.error("Document analysis failed");
    } finally {
      setIsExtracting(false);
    }
  };

  const handleExtractedSubmit = async () => {
    if (!extractedData) return;
    await handleSubmit(extractedData);
  };

  const visibleSchemas = Object.values(INSURANCE_SCHEMAS).filter((schema) => schema.isAvailable);

  const tabs: { id: Tab; label: string; icon: React.ReactNode }[] = [
    { id: "form", label: "Manual Form", icon: <ClipboardList className="w-4 h-4" /> },
    { id: "document", label: "Upload Document", icon: <FileUp className="w-4 h-4" /> },
  ];

  return (
    <div className="relative py-12 sm:py-20">
      <div className="absolute inset-0 dot-grid opacity-20" />
      <div className="glow-orb w-[400px] h-[400px] -top-32 -right-32 bg-[hsl(var(--glow-primary))] opacity-[0.05]" />
      <div className="glow-orb w-[300px] h-[300px] bottom-0 -left-32 bg-[hsl(var(--glow-purple))] opacity-[0.04]" />

      <div className="relative container mx-auto px-4 sm:px-6 lg:px-8">
        <m.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <span className="section-label">Prediction Engine</span>
          <h1 className="text-3xl sm:text-4xl font-bold text-foreground mt-4">Fraud Detection</h1>
          <p className="text-muted-foreground mt-3 max-w-xl mx-auto">
            Submit claim details or upload a document for AI-powered fraud analysis.
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
        <div className="flex justify-center mb-6">
          <div className="glass-card p-4 flex flex-col sm:flex-row items-center gap-4 w-full max-w-md">
            <span className="text-sm font-semibold text-foreground whitespace-nowrap">Claim Type:</span>
            <div className="relative w-full">
              <select
                value={claimCategory}
                onChange={(e) => {
                  setClaimCategory(e.target.value as ClaimCategory);
                  setResult(null);
                  setExtractedData(null);
                  setExtractionResult(null);
                }}
                className="input-premium appearance-none pr-10 w-full"
              >
                {visibleSchemas.map((schema) => (
                  <option key={schema.id} value={schema.id} disabled={!schema.isAvailable}>
                    {schema.label}{!schema.isAvailable ? " (Coming Soon)" : ""}
                  </option>
                ))}
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
            </div>
          </div>
        </div>

        {/* Tab switcher */}
        <div className="flex justify-center mb-8">
          <div className="inline-flex items-center gap-1 p-1 rounded-xl bg-secondary/50">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => { setActiveTab(tab.id); setResult(null); }}
                className={`relative flex items-center gap-2 px-5 py-2 rounded-lg text-sm font-medium transition-colors duration-300 ${
                  activeTab === tab.id
                    ? "text-foreground"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {activeTab === tab.id && (
                  <m.div
                    layoutId="activeTab"
                    className="absolute inset-0 rounded-lg bg-card shadow-sm border border-border/50"
                    transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                  />
                )}
                <span className="relative z-10 flex items-center gap-2">
                  {tab.icon}
                  {tab.label}
                </span>
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div>
            <AnimatePresence mode="wait">
              {activeTab === "form" ? (
                <m.div key="form" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                  <ClaimForm onSubmit={handleSubmit} isLoading={isLoading} category={claimCategory} />
                </m.div>
              ) : (
                <m.div key="document" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} className="space-y-6">
                  <div className="glass-card p-6">
                    <h3 className="text-sm font-semibold text-foreground mb-4">Upload {INSURANCE_SCHEMAS[claimCategory].label} Document</h3>
                    <DocumentUploader
                      onFileSelected={handleFileSelected}
                      isProcessing={isExtracting}
                      result={extractionResult}
                    />
                  </div>

                  {extractedData && (
                    <m.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="glass-card p-6 space-y-4"
                    >
                      <div className="flex items-center justify-between">
                        <h3 className="text-sm font-semibold text-foreground">Extracted Fields <span className="text-xs text-muted-foreground font-normal ml-1">(click to edit)</span></h3>
                        <span className="text-xs text-muted-foreground">
                          Powered by {extractionResult?.model}
                        </span>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {Object.entries(extractedData).map(([key, value]) => (
                          <div key={key} className="space-y-1">
                            <label className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">{key.replace(/_/g, ' ')}</label>
                            <input
                              type={typeof value === 'number' ? 'number' : 'text'}
                              value={String(value ?? '')}
                              onChange={(e) => {
                                const newVal = typeof value === 'number' ? Number(e.target.value) : e.target.value;
                                setExtractedData(prev => prev ? { ...prev, [key]: newVal } : prev);
                              }}
                              className="input-premium text-xs"
                            />
                          </div>
                        ))}
                      </div>
                      <button
                        onClick={handleExtractedSubmit}
                        disabled={isLoading}
                        className="w-full py-3 rounded-xl bg-gradient-to-r from-primary to-[hsl(var(--glow-purple))] text-primary-foreground font-medium text-sm hover:opacity-90 transition-opacity disabled:opacity-50"
                      >
                        {isLoading ? "Analyzing…" : "Analyze Extracted Claim"}
                      </button>
                    </m.div>
                  )}
                </m.div>
              )}
            </AnimatePresence>
          </div>

          <div className="lg:sticky lg:top-24 lg:self-start">
            <AnimatePresence mode="wait">
              {isLoading ? (
                <div className="glass-card min-h-[500px] flex items-center justify-center">
                  <LoadingAnimation />
                </div>
              ) : (
                <PredictionResult result={result} />
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PredictPage;
