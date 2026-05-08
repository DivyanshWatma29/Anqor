import { m } from "framer-motion";
import { useState } from "react";
import {
  ShieldAlert, ShieldCheck, AlertTriangle, Download, TrendingUp,
  FileWarning, CheckCircle2, Info, ChevronDown, ChevronUp,
  DollarSign, Users, FileText, BarChart3, Clock, Zap,
} from "lucide-react";
import RiskMeter from "./RiskMeter";
import { generatePdfReport } from "@/lib/pdfGenerator";

interface FraudReason {
  title: string;
  detail: string;
  severity: "critical" | "high" | "medium" | "low";
  category: string;
  source: string;
  field: string;
}

export interface PredictionResultData {
  prediction: "Fraud" | "Legitimate";
  probability: number;
  indicators: string[];
  claimType?: string;
  risk_level?: string;
  fraud_explanation?: {
    verdict: string;
    summary: string;
    risk_score: number;
    confidence: string;
    reasons: FraudReason[];
    positive_factors: FraudReason[];
    recommendation: string;
    total_risk_factors: number;
    total_positive_factors: number;
  };
  model_confidence?: {
    reliability: string;
    margin_of_error: number;
    f1_score: number;
    auc_roc: number;
    training_samples: number;
  };
  shap_explanation?: {
    method?: string;
    features: { feature: string; impact: number; direction: string; magnitude: string }[];
  };
  confidence_interval?: {
    lower: number;
    upper: number;
    confidence_level: number;
  };
}

interface PredictionResultProps {
  result: PredictionResultData | null;
}

const SEVERITY_STYLES: Record<string, string> = {
  critical: "bg-red-500/10 text-red-400 border-red-500/20",
  high: "bg-orange-500/10 text-orange-400 border-orange-500/20",
  medium: "bg-yellow-500/10 text-yellow-400 border-yellow-500/20",
  low: "bg-blue-500/10 text-blue-400 border-blue-500/20",
};

const CATEGORY_ICONS: Record<string, typeof DollarSign> = {
  financial: DollarSign,
  behavioral: Users,
  documentation: FileText,
  statistical: BarChart3,
  temporal: Clock,
};

function ReasonCard({ reason, index, isFraud }: { reason: FraudReason; index: number; isFraud: boolean }) {
  const [expanded, setExpanded] = useState(false);
  const CategoryIcon = CATEGORY_ICONS[reason.category] || Zap;
  const severityStyle = SEVERITY_STYLES[reason.severity] || SEVERITY_STYLES.medium;

  return (
    <m.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: 0.3 + index * 0.08 }}
      className="glass-card-hover p-4 cursor-pointer"
      onClick={() => setExpanded(!expanded)}
    >
      <div className="flex items-start gap-3">
        <div className={`w-2 h-2 rounded-full mt-2 flex-shrink-0 ${isFraud ? "bg-danger shadow-lg shadow-danger/30" : "bg-success shadow-lg shadow-success/30"}`} />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border ${severityStyle}`}>
              {reason.severity}
            </span>
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] text-muted-foreground bg-secondary/50">
              <CategoryIcon className="w-3 h-3" />
              {reason.category}
            </span>
            {reason.source !== "rule" && (
              <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] text-primary/80 bg-primary/5">
                {reason.source === "ml" ? "ML" : "Combined"}
              </span>
            )}
          </div>
          <p className="text-sm font-medium text-foreground">{reason.title}</p>
          {expanded && reason.detail && (
            <m.p
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              className="text-xs text-muted-foreground mt-2 leading-relaxed"
            >
              {reason.detail}
            </m.p>
          )}
        </div>
        <div className="flex-shrink-0 text-muted-foreground/50">
          {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </div>
      </div>
    </m.div>
  );
}

function ShapChart({ features }: { features: { feature: string; impact: number; direction: string; magnitude: string }[] }) {
  const sorted = [...features].sort((a, b) => Math.abs(b.impact) - Math.abs(a.impact)).slice(0, 8);
  const maxImpact = Math.max(...sorted.map(f => Math.abs(f.impact)), 0.01);

  return (
    <div className="space-y-2">
      {sorted.map((f, i) => (
        <m.div
          key={f.feature}
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.5 + i * 0.05 }}
          className="flex items-center gap-3"
        >
          <span className="text-xs text-muted-foreground w-36 truncate text-right font-mono" title={f.feature}>
            {f.feature.replace(/_/g, " ")}
          </span>
          <div className="flex-1 h-5 bg-secondary/30 rounded overflow-hidden">
            <div
              className={`h-full rounded transition-all ${f.direction === "increases_fraud_risk" ? "bg-danger/60" : "bg-success/60"}`}
              style={{ width: `${Math.min((Math.abs(f.impact) / maxImpact) * 100, 100)}%` }}
            />
          </div>
          <span className={`text-[10px] w-12 text-right font-mono ${f.direction === "increases_fraud_risk" ? "text-danger" : "text-success"}`}>
            {f.impact >= 0 ? "+" : ""}{f.impact.toFixed(3)}
          </span>
        </m.div>
      ))}
    </div>
  );
}

const PredictionResult = ({ result }: PredictionResultProps) => {
  if (!result) {
    return (
      <div className="glass-card p-8 flex flex-col items-center justify-center min-h-[500px] text-center">
        <div className="relative mb-6">
          <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-primary/10 to-[hsl(var(--glow-purple))]/10 flex items-center justify-center">
            <ShieldCheck className="w-10 h-10 text-primary/50" />
          </div>
          <div className="absolute inset-0 rounded-2xl bg-primary/5 blur-xl" />
        </div>
        <h3 className="text-lg font-bold text-foreground mb-2">Fraud Analysis Panel</h3>
        <p className="text-sm text-muted-foreground max-w-xs leading-relaxed">
          Submit a claim to see AI prediction results, risk score, and detailed fraud indicators.
        </p>
        <div className="mt-8 flex items-center gap-6 text-muted-foreground">
          {[
            { icon: TrendingUp, label: "Risk Score" },
            { icon: FileWarning, label: "Indicators" },
            { icon: Download, label: "Export" },
          ].map((f) => (
            <div key={f.label} className="flex flex-col items-center gap-1.5 opacity-40">
              <f.icon className="w-4 h-4" />
              <span className="text-[10px]">{f.label}</span>
            </div>
          ))}
        </div>
      </div>
    );
  }

  const isFraud = result.prediction === "Fraud";
  const riskLevel = result.risk_level || (result.probability < 40 ? "low" : result.probability < 70 ? "medium" : "high");
  const explanation = result.fraud_explanation;

  const handleDownload = () => {
    generatePdfReport(result);
  };

  return (
    <m.div
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5 }}
      className="glass-card p-6 sm:p-8 space-y-6"
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-foreground">Analysis Results</h2>
          <p className="text-xs text-muted-foreground mt-1">AI-generated fraud assessment</p>
        </div>
        <m.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={handleDownload}
          className="btn-ghost-premium !px-4 !py-2 !text-xs"
        >
          <Download className="w-3.5 h-3.5" />
          Download Report
        </m.button>
      </div>

      {/* Verdict badge */}
      <m.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 0.2, type: "spring", bounce: 0.4 }}
        className="text-center"
      >
        <div className={`inline-flex items-center gap-2.5 px-5 py-2.5 rounded-full text-sm font-bold ${
          isFraud
            ? "bg-danger/10 text-danger border border-danger/20"
            : "bg-success/10 text-success border border-success/20"
        }`}>
          {isFraud ? <ShieldAlert className="w-5 h-5" /> : <ShieldCheck className="w-5 h-5" />}
          {isFraud ? "Fraudulent Claim Detected" : "Legitimate Claim"}
        </div>
      </m.div>

      {/* Risk Meter */}
      <RiskMeter score={result.probability} />

      {/* Risk Level + Confidence badges */}
      <div className="flex items-center justify-center gap-2 flex-wrap">
        <span className={`badge-premium ${
          result.probability < 40
            ? "bg-success/10 text-success border border-success/20"
            : result.probability < 70
            ? "bg-warning/10 text-warning border border-warning/20"
            : "bg-danger/10 text-danger border border-danger/20"
        }`}>
          <AlertTriangle className="w-3 h-3" />
          {riskLevel.charAt(0).toUpperCase() + riskLevel.slice(1)} Risk
        </span>
        {result.model_confidence && (
          <span className="badge-premium bg-primary/10 text-primary border border-primary/20">
            <Info className="w-3 h-3" />
            {result.model_confidence.reliability.replace('_', ' ')} confidence
            <span className="text-[10px] opacity-70 ml-1">(F1: {(result.model_confidence.f1_score * 100).toFixed(0)}%)</span>
          </span>
        )}
        {result.confidence_interval && (
          <span className="badge-premium bg-secondary text-muted-foreground border border-border/50">
            CI: {Math.round(result.confidence_interval.lower * 100)}%–{Math.round(result.confidence_interval.upper * 100)}%
          </span>
        )}
      </div>

      <div className="h-px bg-gradient-to-r from-transparent via-border to-transparent" />

      {/* Fraud Explanation (structured) or flat indicators fallback */}
      {explanation ? (
        <>
          {/* Summary */}
          <m.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="glass-card-hover p-4"
          >
            <p className="text-sm text-muted-foreground leading-relaxed">{explanation.summary}</p>
          </m.div>

          {/* Risk Factors */}
          {explanation.reasons.length > 0 && (
            <div className="space-y-3">
              <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
                <FileWarning className="w-4 h-4 text-danger" />
                Risk Factors
                <span className="text-xs font-normal text-muted-foreground">({explanation.total_risk_factors})</span>
              </h3>
              <div className="space-y-2">
                {explanation.reasons.map((reason, i) => (
                  <ReasonCard key={i} reason={reason} index={i} isFraud={true} />
                ))}
              </div>
            </div>
          )}

          {/* Positive Factors */}
          {explanation.positive_factors.length > 0 && (
            <div className="space-y-3">
              <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-success" />
                Positive Factors
                <span className="text-xs font-normal text-muted-foreground">({explanation.total_positive_factors})</span>
              </h3>
              <div className="space-y-2">
                {explanation.positive_factors.map((factor, i) => (
                  <ReasonCard key={i} reason={factor} index={i} isFraud={false} />
                ))}
              </div>
            </div>
          )}

          {/* SHAP Feature Importance */}
          {result.shap_explanation?.features && result.shap_explanation.features.length > 0 && (
            <>
              <div className="h-px bg-gradient-to-r from-transparent via-border to-transparent" />
              <div className="space-y-3">
                <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
                  <BarChart3 className="w-4 h-4 text-primary" />
                  Feature Importance
                  <span className="text-xs font-normal text-muted-foreground">(SHAP)</span>
                </h3>
                <ShapChart features={result.shap_explanation.features} />
              </div>
            </>
          )}

          {/* Recommendation */}
          {explanation.recommendation && (
            <>
              <div className="h-px bg-gradient-to-r from-transparent via-border to-transparent" />
              <m.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.6 }}
                className={`p-4 rounded-xl border ${isFraud ? "bg-danger/5 border-danger/15" : "bg-success/5 border-success/15"}`}
              >
                <h4 className="text-xs font-bold text-foreground mb-1.5 flex items-center gap-1.5">
                  <Zap className="w-3.5 h-3.5" />
                  Recommendation
                </h4>
                <p className="text-sm text-muted-foreground leading-relaxed">{explanation.recommendation}</p>
              </m.div>
            </>
          )}
        </>
      ) : (
        /* Flat indicators fallback */
        <div className="space-y-4">
          <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
            <FileWarning className="w-4 h-4 text-primary" />
            Fraud Indicators Detected
          </h3>
          <div className="space-y-2">
            {result.indicators.map((indicator, i) => (
              <m.div
                key={i}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.4 + i * 0.1 }}
                className="glass-card-hover p-3.5 flex items-start gap-3"
              >
                <div className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${isFraud ? "bg-danger shadow-lg shadow-danger/30" : "bg-success shadow-lg shadow-success/30"}`} />
                <span className="text-sm text-muted-foreground leading-relaxed">{indicator}</span>
              </m.div>
            ))}
          </div>
        </div>
      )}
    </m.div>
  );
};

export default PredictionResult;
