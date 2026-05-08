import { useEffect, useMemo, useState } from "react";
import { m } from "framer-motion";
import { ArrowRight, Sparkles, Zap, BarChart3, FileUp, Upload, Users, Shield, BookOpen, Layers } from "lucide-react";
import { Link } from "react-router-dom";

const features = [
  { icon: Layers, title: "Universal Models", desc: "Native support for Auto, Health, Travel, Property, and Life insurance claims" },
  { icon: Upload, title: "Document AI", desc: "Upload PDF or image of claims — AI extracts fields automatically to schema" },
  { icon: FileUp, title: "Bulk Processing", desc: "Batch-process hundreds of claims from CSV files in seconds with AI header mapping" },
  { icon: Zap, title: "Real-time Detection", desc: "Sub-second fraud predictions powered by robust RandomForest & SVC ML models" },
  { icon: BarChart3, title: "Deep Analytics", desc: "Risk scoring, probability thresholds, severity analysis, and trend visualization" },
  { icon: Shield, title: "Secure Platform", desc: "Row-level security, encrypted data, and InsForge Auth for historical tracking" },
];

const LandingPage = () => {
  const [titleNumber, setTitleNumber] = useState(0);
  const titles = useMemo(() => ["Fraud", "Risk", "Threats", "Losses", "Claims"], []);

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (titleNumber === titles.length - 1) {
        setTitleNumber(0);
      } else {
        setTitleNumber(titleNumber + 1);
      }
    }, 2000);
    return () => clearTimeout(timeoutId);
  }, [titleNumber, titles]);

  return (
    <div>
      {/* Hero */}
      <section className="relative overflow-hidden min-h-[85vh] flex items-center">
        <div className="absolute inset-0 dot-grid opacity-30" />
        <div className="absolute inset-0 grain-overlay" />
        <div className="glow-orb w-[500px] h-[500px] -top-48 -right-48 bg-[hsl(var(--glow-primary))] opacity-[0.07] animate-pulse-glow" />
        <div className="glow-orb w-[600px] h-[600px] -bottom-64 -left-64 bg-[hsl(var(--glow-purple))] opacity-[0.05] animate-float" />
        <div className="glow-orb w-[300px] h-[300px] top-1/3 right-1/4 bg-[hsl(var(--glow-cyan))] opacity-[0.04] animate-float-delayed" />

        <div className="relative container mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <div className="flex gap-8 items-center justify-center flex-col">
            <m.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              <span className="section-label">
                <Sparkles className="w-3 h-3" />
                AI-Powered Detection Platform
              </span>
            </m.div>

            <div className="flex gap-4 flex-col">
              <m.h1
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2, duration: 0.6 }}
                className="text-5xl md:text-7xl max-w-3xl tracking-tighter text-center font-bold"
              >
                <span className="text-foreground">Detect Insurance</span>
                <span className="relative flex w-full justify-center overflow-hidden text-center md:pb-4 md:pt-1">
                  &nbsp;
                  {titles.map((title, index) => (
                    <m.span
                      key={index}
                      className="absolute font-bold gradient-text"
                      initial={{ opacity: 0, y: "-100" }}
                      transition={{ type: "spring", stiffness: 50 }}
                      animate={
                        titleNumber === index
                          ? { y: 0, opacity: 1 }
                          : { y: titleNumber > index ? -150 : 150, opacity: 0 }
                      }
                    >
                      {title}
                    </m.span>
                  ))}
                </span>
              </m.h1>

              <m.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4, duration: 0.6 }}
                className="text-lg leading-relaxed tracking-tight text-muted-foreground max-w-2xl text-center"
              >
                Universal fraud detection architecture supporting <strong>Auto, Health, Travel, Property, and Life</strong> insurance. 
                Upload single claims, batch CSVs, or raw claim documents for instant, explainable risk scoring.
              </m.p>
            </div>

            <m.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6, duration: 0.6 }}
              className="flex flex-col sm:flex-row items-center justify-center gap-4"
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
              className="text-xs text-muted-foreground"
            >
              No account needed for real-time predictions.
            </m.p>
          </div>
        </div>
      </section>

      {/* About Section */}
      <section className="py-20 relative bg-secondary/20 border-y border-border/40">
        <div className="absolute inset-0 grain-overlay opacity-30" />
        <div className="relative container mx-auto px-4 sm:px-6 lg:px-8">
          <m.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="max-w-4xl mx-auto"
          >
            <div className="text-center mb-10">
              <span className="section-label inline-flex items-center gap-2"><BookOpen className="w-4 h-4" /> About Anqor</span>
              <h2 className="text-3xl font-bold text-foreground mt-4">Pioneering the Universal Claims Pipeline</h2>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="glass-card p-8 space-y-4">
                <h3 className="text-lg font-semibold text-primary">The Vision</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Anqor was engineered as a comprehensive solution for modern insurance providers. Instead of building isolated tools for specific insurance types, we architected a universal registry that dynamically routes claims to domain-specific Machine Learning models—all through a single, elegant interface.
                </p>
              </div>
              <div className="glass-card p-8 space-y-4">
                <h3 className="text-lg font-semibold text-[hsl(var(--glow-purple))]">The Technology</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Powered by custom-trained Scikit-Learn Pipelines (RandomForest & SVC) and served via Hugging Face. We augmented traditional structured data entry with LLM-powered <strong>Document Intelligence</strong> and <strong>AI CSV Column Mapping</strong> to seamlessly bridge the gap between unstructured reality and strict ML schemas.
                </p>
              </div>
            </div>
          </m.div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20 relative">
        <div className="absolute inset-0 dot-grid opacity-20" />
        <div className="relative container mx-auto px-4 sm:px-6 lg:px-8">
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
              From single claim analysis to batch processing — built for speed, accuracy, and scale.
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
