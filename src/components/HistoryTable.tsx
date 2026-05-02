import { m } from "framer-motion";
import { ExternalLink, Loader2 } from "lucide-react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { getClaims, type ClaimRecord } from "@/lib/api";

const HistoryTable = () => {
  const { data, isLoading, error } = useQuery({
    queryKey: ['claims'],
    queryFn: () => getClaims({ limit: 10, sort: 'created_at', order: 'desc' }),
  });

  const claims = data?.data || [];

  if (isLoading) {
    return (
      <div className="glass-card p-12 flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="glass-card p-8 text-center text-sm text-muted-foreground">
        Failed to load claims history
      </div>
    );
  }

  if (claims.length === 0) {
    return (
      <div className="glass-card p-8 text-center text-sm text-muted-foreground">
        No claims yet. Submit a claim prediction to get started.
      </div>
    );
  }

  return (
    <div className="glass-card overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-border/50">
              {["Claim ID", "Date", "Incident Type", "Amount", "Prediction", "Risk Score", ""].map((h) => (
                <th key={h} className="text-left text-[10px] font-semibold text-muted-foreground uppercase tracking-widest px-6 py-4">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {claims.map((entry: ClaimRecord, i: number) => (
              <m.tr
                key={entry.id}
                initial={{ opacity: 0, y: 5 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.05 }}
                className="border-b border-border/30 last:border-0 hover:bg-primary/[0.02] transition-colors duration-300 group"
              >
                <td className="px-6 py-4">
                  <span className="text-sm font-semibold text-foreground font-mono">{entry.claim_id}</span>
                </td>
                <td className="px-6 py-4 text-xs text-muted-foreground">
                  {new Date(entry.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                </td>
                <td className="px-6 py-4 text-sm text-muted-foreground">{entry.incident_type}</td>
                <td className="px-6 py-4 text-sm font-semibold text-foreground">${entry.claim_amount.toLocaleString()}</td>
                <td className="px-6 py-4">
                  <span className={`badge-premium ${
                    entry.prediction === "Fraud"
                      ? "bg-danger/10 text-danger border border-danger/20"
                      : "bg-success/10 text-success border border-success/20"
                  }`}>
                    {entry.prediction}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <div className="w-20 h-1.5 rounded-full bg-secondary overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-700"
                        style={{
                          width: `${entry.risk_score}%`,
                          background: entry.risk_score < 40
                            ? "hsl(var(--success))"
                            : entry.risk_score < 70
                            ? "hsl(var(--warning))"
                            : "hsl(var(--danger))",
                        }}
                      />
                    </div>
                    <span className="text-xs font-mono text-muted-foreground w-8">{entry.risk_score}%</span>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <Link
                    to={`/claims/${entry.id}`}
                    aria-label="View claim details"
                    className="opacity-0 group-hover:opacity-100 focus-visible:opacity-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded-sm transition-opacity"
                  >
                    <ExternalLink className="w-3.5 h-3.5 text-muted-foreground hover:text-foreground transition-colors" />
                  </Link>
                </td>
              </m.tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default HistoryTable;
