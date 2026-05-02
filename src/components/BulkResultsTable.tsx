import { m } from 'framer-motion';
import { ShieldAlert, ShieldCheck, ExternalLink } from 'lucide-react';
import { Link } from 'react-router-dom';
import type { ClaimRecord } from '@/lib/api';

interface BulkResultsTableProps {
  claims: ClaimRecord[];
}

const BulkResultsTable = ({ claims }: BulkResultsTableProps) => {
  if (claims.length === 0) return null;

  const fraudCount = claims.filter((c) => c.prediction === 'Fraud').length;

  return (
    <m.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass-card p-6 space-y-4"
    >
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-bold text-foreground">
          Batch Results ({claims.length} claims)
        </h3>
        <div className="flex items-center gap-3 text-xs">
          <span className="flex items-center gap-1 text-danger">
            <ShieldAlert className="w-3.5 h-3.5" />
            {fraudCount} Fraud
          </span>
          <span className="flex items-center gap-1 text-success">
            <ShieldCheck className="w-3.5 h-3.5" />
            {claims.length - fraudCount} Legit
          </span>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border/50">
              <th className="text-left py-3 px-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Claim ID</th>
              <th className="text-left py-3 px-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Type</th>
              <th className="text-left py-3 px-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Amount</th>
              <th className="text-left py-3 px-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Prediction</th>
              <th className="text-left py-3 px-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Risk</th>
              <th className="text-right py-3 px-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider"></th>
            </tr>
          </thead>
          <tbody>
            {claims.map((claim, i) => (
              <m.tr
                key={claim.id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: i * 0.03 }}
                className="border-b border-border/30 hover:bg-secondary/30 transition-colors"
              >
                <td className="py-3 px-3 font-mono text-xs text-foreground">{claim.claim_id}</td>
                <td className="py-3 px-3 text-muted-foreground">{claim.incident_type}</td>
                <td className="py-3 px-3 text-foreground">${claim.claim_amount.toLocaleString()}</td>
                <td className="py-3 px-3">
                  <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${
                    claim.prediction === 'Fraud'
                      ? 'bg-danger/10 text-danger'
                      : 'bg-success/10 text-success'
                  }`}>
                    {claim.prediction === 'Fraud' ? (
                      <ShieldAlert className="w-3 h-3" />
                    ) : (
                      <ShieldCheck className="w-3 h-3" />
                    )}
                    {claim.prediction}
                  </span>
                </td>
                <td className="py-3 px-3">
                  <div className="flex items-center gap-2">
                    <div className="w-16 h-1.5 rounded-full bg-secondary overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all ${
                          claim.risk_score < 40 ? 'bg-success' : claim.risk_score < 70 ? 'bg-warning' : 'bg-danger'
                        }`}
                        style={{ width: `${claim.risk_score}%` }}
                      />
                    </div>
                    <span className="text-xs text-muted-foreground w-8">{claim.risk_score}%</span>
                  </div>
                </td>
                <td className="py-3 px-3 text-right">
                  {!claim.id.startsWith('guest-') && (
                    <Link
                      to={`/claims/${claim.id}`}
                      aria-label="View claim details"
                      className="text-muted-foreground hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded-sm transition-colors"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                    </Link>
                  )}
                </td>
              </m.tr>
            ))}
          </tbody>
        </table>
      </div>
    </m.div>
  );
};

export default BulkResultsTable;
