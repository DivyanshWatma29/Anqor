import { m } from "framer-motion";
import { ArrowRight, Shield, Sparkles, Zap, BarChart3, FileUp, Upload, Users } from "lucide-react";
import { Link } from "react-router-dom";

const features = [
  { icon: Zap, title: "Real-time Detection", desc: "Sub-second fraud predictions powered by ensemble ML models" },
  { icon: BarChart3, title: "Deep Analytics", desc: "Risk scoring, severity analysis, and trend visualization" },
  { icon: Upload, title: "Document AI", desc: "Upload PDF or image of claims — AI extracts fields automatically" },
  { icon: FileUp, title: "Bulk Processing", desc: "Batch-process hundreds of claims from CSV files in seconds" },
  { icon: Users, title: "No Login Required", desc: "Use all prediction features instantly — sign in only to save history" },
  { icon: Shield, title: "Enterprise Security", desc: "Row-level security, encrypted data, and InsForge Auth" },
];

const LandingPage = () => {
  return (
    <div>
      {/* Hero */}
      <section className="relative overflow-hidden min-h-[85vh] flex items-center">
        <div className="absolute inset-0 dot-grid opacity-30" />
        <div className="absolute inset-0 grain-overlay" />
        <div className="glow-orb w-[500px] h-[500px] -top-48 -right-48 bg-[hsl(var(--glow-primary))] opacity-[0.07] animate-pulse-glow" />
        <div className="glow-orb w-[600px] h-[600px] -bottom-64 -left-64 bg-[hsl(var(--glow-purple))] opacity-[0.05] animate-float" />
        <div className="glow-orb w-[300px] h-[300px] top-1/3 right-1/4 bg-[hsl(var(--glow-cyan))] opacity-[0.04] animate-float-delayed" />

        <div className="relative max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <div className="text-center max-w-4xl mx-auto">
            <m.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="mb-8"
            >
              <span className="section-label">
                <Sparkles className="w-3 h-3" />
                Powered by Machine Learning
              </span>
            </m.div>

            <m.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.6 }}
              className="text-4xl sm:text-5xl lg:text-6xl font-bold text-foreground leading-tight"
            >
              Detect Insurance Fraud
              <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary via-[hsl(var(--glow-purple))] to-[hsl(var(--glow-cyan))]">
                Before It Costs You
              </span>
            </m.h1>

            <m.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4, duration: 0.6 }}
              className="text-lg text-muted-foreground mt-6 max-w-2xl mx-auto"
            >
              AI-powered fraud detection for insurance claims. Upload a single claim, a CSV batch,
              or even a photo of a claim form — get instant risk scoring with explainable indicators.
            </m.p>

            <m.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6, duration: 0.6 }}
              className="flex flex-col sm:flex-row items-center justify-center gap-4 mt-10"
            >
              <Link
                to="/predict"
                className="group inline-flex items-center gap-2 px-8 py-3.5 rounded-2xl bg-gradient-to-r from-primary to-[hsl(var(--glow-purple))] text-primary-foreground font-semibold text-sm shadow-xl shadow-primary/20 hover:shadow-primary/40 transition-all duration-300 hover:scale-[1.02]"
              >
                Analyze a Claim
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </Link>
              <Link
                to="/bulk-check"
                className="inline-flex items-center gap-2 px-8 py-3.5 rounded-2xl bg-secondary/80 text-foreground font-semibold text-sm border border-border/50 hover:bg-secondary transition-all duration-300"
              >
                <FileUp className="w-4 h-4" />
                Bulk Upload
              </Link>
            </m.div>

            <m.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.8 }}
              className="text-xs text-muted-foreground mt-4"
            >
              No account needed — start analyzing instantly
            </m.p>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20 relative">
        <div className="absolute inset-0 dot-grid opacity-20" />
        <div className="relative max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8">
          <m.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <span className="section-label">Capabilities</span>
            <h2 className="text-3xl sm:text-4xl font-bold text-foreground mt-4">
              Everything You Need
            </h2>
            <p className="text-muted-foreground mt-3 max-w-lg mx-auto">
              From single claim analysis to batch processing — built for individuals and agencies alike.
            </p>
          </m.div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, i) => (
              <m.div
                key={feature.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="glass-card-hover p-6 group"
              >
                <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors">
                  <feature.icon className="w-5 h-5 text-primary" />
                </div>
                <h3 className="text-sm font-semibold text-foreground mb-1">{feature.title}</h3>
                <p className="text-xs text-muted-foreground leading-relaxed">{feature.desc}</p>
              </m.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 relative">
        <div className="relative max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <m.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="glass-card p-12"
          >
            <h2 className="text-2xl sm:text-3xl font-bold text-foreground">
              Ready to detect fraud?
            </h2>
            <p className="text-muted-foreground mt-3 max-w-md mx-auto">
              Start with a single claim or upload your entire dataset.
              No signup required for predictions.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mt-8">
              <Link
                to="/predict"
                className="inline-flex items-center gap-2 px-8 py-3 rounded-2xl bg-gradient-to-r from-primary to-[hsl(var(--glow-purple))] text-primary-foreground font-semibold text-sm"
              >
                Start Analyzing
                <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                to="/register"
                className="inline-flex items-center gap-2 px-8 py-3 rounded-2xl text-foreground font-medium text-sm border border-border/50 hover:bg-secondary/50 transition-all"
              >
                Create Free Account
              </Link>
            </div>
          </m.div>
        </div>
      </section>
    </div>
  );
};

export default LandingPage;
