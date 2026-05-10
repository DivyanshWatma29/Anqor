import { useState, useEffect } from "react";
import { m } from "framer-motion";
import { ShieldCheck, Activity, FileSpreadsheet, PlusCircle, ArrowRight, Clock, X, Lightbulb } from "lucide-react";
import { Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery } from "@tanstack/react-query";
import { getClaims } from "@/lib/api";

const DashboardPage = () => {
  const { user } = useAuth();
  const [showWelcome, setShowWelcome] = useState(() => {
    // Check if this is the user's first visit
    const hasVisited = localStorage.getItem('anqor_dashboard_visited');
    if (!hasVisited) {
      localStorage.setItem('anqor_dashboard_visited', 'true');
      return true;
    }
    return false;
  });

  // Fetch recent claims for the user
  const { data: claimsData } = useQuery({
    queryKey: ['recentClaims'],
    queryFn: () => getClaims({ limit: 5, order: 'desc' }),
  });

  const recentClaims = claimsData?.data || [];

    return (
      <div className="relative py-12 sm:py-20">
        <div className="absolute inset-0 dot-grid opacity-20" />
        <div className="glow-orb w-[500px] h-[500px] -top-32 -left-32 bg-[hsl(var(--glow-primary))] opacity-[0.05] animate-pulse-glow" />

        <div className="relative container mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
          {/* Welcome Banner for First-Time Users */}
          {showWelcome && (
            <m.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              className="glass-card p-6 sm:p-8 border-l-4 border-l-[hsl(var(--glow-purple))] relative"
            >
              <button
                onClick={() => setShowWelcome(false)}
                className="absolute top-4 right-4 p-1 rounded-lg hover:bg-secondary/50 transition-colors"
                aria-label="Dismiss welcome message"
              >
                <X className="w-4 h-4 text-muted-foreground" />
              </button>
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-xl bg-[hsl(var(--glow-purple))]/10 flex items-center justify-center flex-shrink-0">
                  <Lightbulb className="w-6 h-6 text-[hsl(var(--glow-purple))]" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-foreground mb-2">Welcome to Anqor!</h2>
                  <p className="text-muted-foreground mb-4">
                    Get started by analyzing your first insurance claim for fraud detection. Here's what you can do:
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="p-4 rounded-lg bg-card/50 border border-border/50">
                      <h3 className="font-semibold text-foreground text-sm mb-1">Analyze Claims</h3>
                      <p className="text-xs text-muted-foreground">Submit claim details or upload documents for instant fraud prediction.</p>
                    </div>
                    <div className="p-4 rounded-lg bg-card/50 border border-border/50">
                      <h3 className="font-semibold text-foreground text-sm mb-1">Bulk Processing</h3>
                      <p className="text-xs text-muted-foreground">Upload CSV files to process hundreds of claims simultaneously.</p>
                    </div>
                    <div className="p-4 rounded-lg bg-card/50 border border-border/50">
                      <h3 className="font-semibold text-foreground text-sm mb-1">View Analytics</h3>
                      <p className="text-xs text-muted-foreground">Track fraud trends and model performance over time.</p>
                    </div>
                  </div>
                </div>
              </div>
            </m.div>
          )}
        {/* Welcome Header */}
        <m.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-card p-8 sm:p-10 border-l-4 border-l-primary"
        >
          <h1 className="text-3xl sm:text-4xl font-bold text-foreground">
            Welcome back, <span className="gradient-text">{user?.name?.split(' ')[0] || 'User'}</span>
          </h1>
          <p className="text-muted-foreground mt-2 max-w-2xl text-lg">
            Your fraud detection control center. Analyze new claims, process bulk datasets, and review your history.
          </p>
        </m.div>

        {/* Quick Actions */}
        <div>
          <h2 className="text-lg font-bold text-foreground mb-6 flex items-center gap-2">
            <Activity className="w-5 h-5 text-primary" />
            Quick Actions
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            <m.div whileHover={{ translateY: -4 }} transition={{ duration: 0.3 }}>
              <Link to="/predict" className="block h-full gradient-border-card group">
                <div className="p-8 h-full flex flex-col items-start bg-card/80 backdrop-blur-xl">
                  <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-6 group-hover:bg-primary/20 transition-colors">
                    <PlusCircle className="w-6 h-6 text-primary" />
                  </div>
                  <h3 className="text-xl font-bold text-foreground mb-2">Analyze Claim</h3>
                  <p className="text-sm text-muted-foreground mb-6 flex-1">
                    Upload a document or fill out a form to instantly predict fraud probability.
                  </p>
                  <span className="inline-flex items-center text-sm font-semibold text-primary">
                    Start Analysis <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                  </span>
                </div>
              </Link>
            </m.div>

            <m.div whileHover={{ translateY: -4 }} transition={{ duration: 0.3 }}>
              <Link to="/bulk-check" className="block h-full gradient-border-card group">
                <div className="p-8 h-full flex flex-col items-start bg-card/80 backdrop-blur-xl">
                  <div className="w-12 h-12 rounded-xl bg-[hsl(var(--glow-purple))]/10 flex items-center justify-center mb-6 group-hover:bg-[hsl(var(--glow-purple))]/20 transition-colors">
                    <FileSpreadsheet className="w-6 h-6 text-[hsl(var(--glow-purple))]" />
                  </div>
                  <h3 className="text-xl font-bold text-foreground mb-2">Bulk Processing</h3>
                  <p className="text-sm text-muted-foreground mb-6 flex-1">
                    Upload a CSV to batch process hundreds of claims simultaneously.
                  </p>
                  <span className="inline-flex items-center text-sm font-semibold text-[hsl(var(--glow-purple))]">
                    Upload Dataset <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                  </span>
                </div>
              </Link>
            </m.div>

            <m.div whileHover={{ translateY: -4 }} transition={{ duration: 0.3 }} className="sm:col-span-2 lg:col-span-1">
              <Link to="/analytics" className="block h-full gradient-border-card group">
                <div className="p-8 h-full flex flex-col items-start bg-card/80 backdrop-blur-xl">
                  <div className="w-12 h-12 rounded-xl bg-[hsl(var(--glow-cyan))]/10 flex items-center justify-center mb-6 group-hover:bg-[hsl(var(--glow-cyan))]/20 transition-colors">
                    <Activity className="w-6 h-6 text-[hsl(var(--glow-cyan))]" />
                  </div>
                  <h3 className="text-xl font-bold text-foreground mb-2">Platform Analytics</h3>
                  <p className="text-sm text-muted-foreground mb-6 flex-1">
                    Review overarching trends, model accuracy, and fraud distribution stats.
                  </p>
                  <span className="inline-flex items-center text-sm font-semibold text-[hsl(var(--glow-cyan))]">
                    View Analytics <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                  </span>
                </div>
              </Link>
            </m.div>
          </div>
        </div>

        {/* Recent Activity */}
        <div>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
              <Clock className="w-5 h-5 text-primary" />
              Recent Scans
            </h2>
            <Link to="/analytics" className="text-sm font-medium text-primary hover:underline">
              View all history
            </Link>
          </div>

          <div className="glass-card overflow-hidden">
            {recentClaims.length > 0 ? (
              <div className="divide-y divide-border/50">
                {recentClaims.map((claim) => (
                  <div key={claim.id} className="p-4 sm:p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-secondary/30 transition-colors">
                    <div>
                      <div className="flex items-center gap-3 mb-1">
                        <span className="font-mono text-sm font-semibold text-foreground">{claim.claim_id}</span>
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                          claim.prediction === 'Fraud' ? 'bg-danger/10 text-danger' : 'bg-success/10 text-success'
                        }`}>
                          {claim.prediction}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {claim.incident_type} • ${claim.claim_amount.toLocaleString()} • {new Date(claim.created_at).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="flex flex-col items-end">
                        <span className="text-xs text-muted-foreground mb-1">Risk Score</span>
                        <div className="flex items-center gap-2">
                          <div className="w-16 h-1.5 rounded-full bg-secondary overflow-hidden">
                            <div
                              className={`h-full rounded-full ${claim.risk_score > 70 ? 'bg-danger' : claim.risk_score > 40 ? 'bg-warning' : 'bg-success'}`}
                              style={{ width: `${claim.risk_score}%` }}
                            />
                          </div>
                          <span className="text-xs font-medium text-foreground">{claim.risk_score}%</span>
                        </div>
                      </div>
                      <Link to={`/claims/${claim.id}`} className="p-2 rounded-lg bg-secondary text-muted-foreground hover:text-foreground transition-colors">
                        <ArrowRight className="w-4 h-4" />
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-12 text-center flex flex-col items-center justify-center">
                <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-gradient-to-br from-primary/10 to-[hsl(var(--glow-purple))]/10 flex items-center justify-center">
                  <ShieldCheck className="w-10 h-10 text-primary/40" />
                </div>
                <h3 className="text-lg font-semibold text-foreground mb-2">No claims analyzed yet</h3>
                <p className="text-sm text-muted-foreground mb-8 max-w-md">
                  Start by analyzing your first insurance claim. Our AI will instantly detect potential fraud patterns.
                </p>
                <div className="flex items-center gap-4">
                  <Link to="/predict" className="btn-premium py-2.5 px-6 inline-flex items-center gap-2">
                    <PlusCircle className="w-4 h-4" />
                    Analyze a Claim
                  </Link>
                  <Link to="/bulk-check" className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
                    <FileSpreadsheet className="w-4 h-4" />
                    Bulk Upload
                  </Link>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;
