import { m } from "framer-motion";
import { ShieldAlert, ShieldCheck, AlertTriangle, Download, TrendingUp, FileWarning } from "lucide-react";
import RiskMeter from "./RiskMeter";
import { generatePdfReport } from "@/lib/pdfGenerator";

export interface PredictionResultData {
  prediction: "Fraud" | "Legitimate";
  probability: number;
  indicators: string[];
}

interface PredictionResultProps {
  result: PredictionResultData | null;
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
  const riskLevel = result.probability < 40 ? "Low Risk" : result.probability < 70 ? "Medium Risk" : "High Risk";

  const handleDownload = () => {
    generatePdfReport(result);
  };

  return (
    <m.div
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5 }}
      className="glass-card p-6 sm:p-8 space-y-8"
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

      {/* Result badge */}
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
          {result.prediction === "Fraud" ? "Fraudulent Claim Detected" : "Legitimate Claim"}
        </div>
      </m.div>

      {/* Risk Meter */}
      <RiskMeter score={result.probability} />

      {/* Risk Level */}
      <div className="text-center">
        <span className={`badge-premium ${
          result.probability < 40
            ? "bg-success/10 text-success border border-success/20"
            : result.probability < 70
            ? "bg-warning/10 text-warning border border-warning/20"
            : "bg-danger/10 text-danger border border-danger/20"
        }`}>
          <AlertTriangle className="w-3 h-3" />
          {riskLevel}
        </span>
      </div>

      {/* Separator */}
      <div className="h-px bg-gradient-to-r from-transparent via-border to-transparent" />

      {/* Indicators */}
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
    </m.div>
  );
};

export default PredictionResult;
