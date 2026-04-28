import { m } from "framer-motion";
import { ArrowRight, Shield, Sparkles, Zap, BarChart3, Lock } from "lucide-react";
import { PrefetchLink as Link } from "../App";

const features = [
  { icon: Zap, title: "Real-time Detection", desc: "Sub-second fraud predictions" },
  { icon: BarChart3, title: "Deep Analytics", desc: "Comprehensive risk insights" },
  { icon: Lock, title: "Enterprise Security", desc: "Bank-grade data protection" },
];

const HeroSection = () => {
  return (
    <section className="relative overflow-hidden min-h-[90vh] flex items-center">
      {/* Background effects */}
      <div className="absolute inset-0 dot-grid opacity-30" />
      <div className="absolute inset-0 grain-overlay" />
      
      {/* Glowing orbs */}
      <div className="glow-orb w-[500px] h-[500px] -top-48 -right-48 bg-[hsl(var(--glow-primary))] opacity-[0.07] animate-pulse-glow" />
      <div className="glow-orb w-[600px] h-[600px] -bottom-64 -left-64 bg-[hsl(var(--glow-purple))] opacity-[0.05] animate-float" />
      <div className="glow-orb w-[300px] h-[300px] top-1/3 right-1/4 bg-[hsl(var(--glow-cyan))] opacity-[0.04] animate-float-delayed" />

      {/* Gradient lines */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-px h-32 bg-gradient-to-b from-transparent via-primary/30 to-transparent" />

      <div className="relative max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="text-center max-w-4xl mx-auto">
          {/* Badge */}
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

          {/* Title */}
          <m.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="text-5xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight leading-[1.1] mb-8"
          >
            <span className="text-foreground">AI Powered</span>
            <br />
            <span className="gradient-text">Insurance Fraud</span>
            <br />
            <span className="text-foreground">Detection</span>
          </m.h1>

          {/* Subtitle */}
          <m.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto mb-12 leading-relaxed"
          >
            Detect fraudulent insurance claims instantly with enterprise-grade
            machine learning. Protect your business with intelligent risk analysis.
          </m.p>

          {/* CTAs */}
          <m.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-20"
          >
            <Link to="/predict" className="btn-premium group">
              <Shield className="w-4 h-4" />
              Analyze Claim
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Link>
            <Link to="/analytics" className="btn-ghost-premium">
              <BarChart3 className="w-4 h-4" />
              View Analytics
            </Link>
          </m.div>

          {/* Stats bar */}
          <m.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.5 }}
            className="glass-card inline-flex items-center divide-x divide-border/50 mx-auto"
          >
            {[
              { value: "98.5%", label: "Model Accuracy" },
              { value: "< 2s", label: "Avg Response" },
              { value: "10K+", label: "Claims Analyzed" },
              { value: "24/7", label: "Monitoring" },
            ].map((stat) => (
              <div key={stat.label} className="px-6 sm:px-8 py-4 text-center">
                <div className="text-xl sm:text-2xl font-bold text-foreground">{stat.value}</div>
                <div className="text-[10px] sm:text-xs text-muted-foreground mt-0.5 uppercase tracking-wider">{stat.label}</div>
              </div>
            ))}
          </m.div>
        </div>

        {/* Feature cards */}
        <m.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.7 }}
          className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-20 max-w-3xl mx-auto"
        >
          {features.map((f, i) => (
            <m.div
              key={f.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.8 + i * 0.1 }}
              className="glass-card-hover p-6 text-center group"
            >
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary/10 to-[hsl(var(--glow-purple))]/10 flex items-center justify-center mx-auto mb-3 group-hover:from-primary/20 group-hover:to-[hsl(var(--glow-purple))]/20 transition-all duration-500">
                <f.icon className="w-5 h-5 text-primary" />
              </div>
              <h3 className="text-sm font-semibold text-foreground mb-1">{f.title}</h3>
              <p className="text-xs text-muted-foreground">{f.desc}</p>
            </m.div>
          ))}
        </m.div>
      </div>
    </section>
  );
};

export default HeroSection;
