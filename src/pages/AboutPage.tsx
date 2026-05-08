import { m } from "framer-motion";
import {
  Sparkles,
  Zap,
  Target,
  Lock,
  BarChart3,
  Globe,
  Users,
  Brain,
  ShieldCheck,
  FileSearch,
  Layers,
  MessageSquareWarning,
} from "lucide-react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const features = [
  { icon: Brain, title: "5 XGBoost Models", desc: "Specialized fraud detection for Auto, Health, Travel, Life & Property insurance — each trained on real-world labeled data." },
  { icon: Zap, title: "Real-time Predictions", desc: "Sub-second fraud detection with optimized ML pipelines and instant risk scoring." },
  { icon: MessageSquareWarning, title: "Explainable AI", desc: "Every prediction comes with a plain-English explanation of WHY the claim was flagged, categorised by financial, behavioral, documentation & temporal factors." },
  { icon: Target, title: "High Accuracy", desc: "Up to 99.4% F1 score (Health model). All models trained on real investigator-labeled claims, not synthetic data." },
  { icon: FileSearch, title: "Document AI", desc: "Upload PDFs or images — GPT-4o-mini extracts structured fields automatically, eliminating manual data entry." },
  { icon: Layers, title: "Batch Processing", desc: "Upload CSV/Excel files with thousands of claims for bulk fraud analysis with exportable results." },
  { icon: Lock, title: "Secure by Design", desc: "Row-level security, encrypted data handling, rate limiting, and full audit trails." },
  { icon: BarChart3, title: "Rich Analytics", desc: "Interactive dashboards for fraud patterns, claim distributions, and risk trend analysis." },
  { icon: Globe, title: "RESTful API", desc: "20+ API endpoints for easy integration with existing insurance platforms and workflows." },
  { icon: Users, title: "Guest Mode", desc: "Use all prediction features without creating an account. Auth unlocks saved history & dashboards." },
  { icon: ShieldCheck, title: "SHAP Feature Importance", desc: "ML-powered feature analysis shows which input fields most influenced the fraud decision." },
];

const modelData = [
  { name: "Health", f1: "99.4%", data: "10K claims", auc: "0.999" },
  { name: "Property", f1: "93.6%", data: "5K claims", auc: "0.906" },
  { name: "Life", f1: "88.2%", data: "5K claims", auc: "0.721" },
  { name: "Travel", f1: "86.4%", data: "63K claims", auc: "0.813" },
  { name: "Auto", f1: "80.9%", data: "1K claims", auc: "0.833" },
];

const faqItems = [
  {
    question: "What ML model does Anqor use?",
    answer:
      "Anqor uses 5 specialised XGBoost classifier pipelines — one each for Auto, Health, Travel, Life, and Property insurance. Each pipeline includes automated feature engineering (imputation, encoding, scaling) and was trained on real-world investigator-labeled claims datasets, not synthetic data. The models analyse 7–30 input features depending on the insurance type.",
  },
  {
    question: "How does Anqor explain its predictions?",
    answer:
      "Every prediction includes a 'fraud explanation' section that tells you exactly WHY a claim was flagged. This combines rule-based indicators (e.g., 'No police report filed') with ML-driven feature importance analysis (SHAP). Each reason is categorized as financial, behavioral, documentation, statistical, or temporal, ranked by severity, and includes a plain-English explanation with your actual claim values. You also get a recommendation — from 'Proceed with standard approval' to 'Escalate to the Special Investigation Unit.'",
  },
  {
    question: "What technologies power the platform?",
    answer:
      "The frontend is built with React 18, TypeScript, Vite, and Tailwind CSS with shadcn/ui components. The ML backend runs on Python with Flask, scikit-learn, and XGBoost. We use InsForge (Supabase-compatible BaaS) for database, authentication, and AI gateway. Document AI uses GPT-4o-mini for PDF/image field extraction. The backend is deployed on Hugging Face Spaces and the frontend on Vercel.",
  },
  {
    question: "How does Document AI work?",
    answer:
      "Upload a PDF or image of a claim form, and our Document AI (powered by GPT-4o-mini via InsForge AI Gateway) automatically extracts structured fields like policy number, incident type, claim amount, and more. It auto-detects which insurance category the document belongs to and pre-fills the prediction form for instant analysis.",
  },
  {
    question: "Do I need an account to use predictions?",
    answer:
      "No. All prediction features — single claim analysis for all 5 models, bulk CSV upload, Document AI extraction, and fraud explanations — work without an account in Guest Mode. Creating an account lets you save claim history, access the analytics dashboard, and view detailed claim reports.",
  },
  {
    question: "How does bulk processing work?",
    answer:
      "Upload a CSV or Excel file with up to 5,000 rows of claim data. The system auto-detects the insurance category, suggests column mappings with fuzzy matching, and processes each row through the appropriate ML model. You get per-row predictions with fraud probability, risk scores, and indicators — exportable as CSV or a consolidated PDF report.",
  },
  {
    question: "How accurate are the predictions?",
    answer:
      "Accuracy varies by model: Health reaches 99.4% F1 score, Property 93.6%, Life 88.2%, Travel 86.4%, and Auto 80.9%. Each prediction includes a confidence interval and model reliability rating so you know how much to trust it. The models are meant to assist human reviewers, not replace them — high-risk claims should always be investigated manually.",
  },
  {
    question: "Who built this project?",
    answer:
      "Anqor was built as a capstone project by a team of students, combining machine learning, full-stack web development, and AI integration. The project demonstrates real-world application of XGBoost classification pipelines for multi-category insurance fraud detection with explainable AI.",
  },
];

const AboutPage = () => {
  return (
    <div className="relative">
      <div className="absolute inset-0 dot-grid opacity-20" />
      <div className="glow-orb w-[600px] h-[600px] -top-48 left-1/2 -translate-x-1/2 bg-[hsl(var(--glow-primary))] opacity-[0.05]" />

      {/* Hero */}
      <section className="relative py-20 sm:py-28 text-center">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <m.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <span className="section-label">
              <Sparkles className="w-3 h-3" />
              About the Project
            </span>
          </m.div>
          <m.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-foreground mt-6 leading-tight"
          >
            Smarter Insurance with
            <span className="gradient-text"> Explainable AI</span>
          </m.h1>
          <m.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-lg text-muted-foreground mt-6 max-w-2xl mx-auto leading-relaxed"
          >
            Anqor uses 5 specialised XGBoost models to detect fraudulent
            insurance claims in real-time — and tells you exactly <strong>why</strong> each
            claim was flagged, so adjusters can make informed decisions faster.
          </m.p>
        </div>
      </section>

      {/* Mission + Stats */}
      <section className="relative py-16">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <m.div
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
            >
              <span className="section-label">Our Mission</span>
              <h2 className="text-3xl font-bold text-foreground mt-4">Fighting Fraud with Explainable Data Science</h2>
              <p className="text-muted-foreground mt-4 leading-relaxed">
                Insurance fraud costs the industry over <strong>$80 billion annually</strong>.
                Our platform uses 5 XGBoost classifiers — each trained on real-world,
                investigator-labeled claims — to identify fraud patterns that human
                reviewers often miss.
              </p>
              <p className="text-muted-foreground mt-4 leading-relaxed">
                But detection isn't enough. Every prediction comes with a
                <strong> plain-English explanation</strong> of what triggered the flag:
                suspicious financial patterns, missing documentation, unusual timing,
                behavioral red flags, and ML-identified statistical anomalies.
              </p>
              <p className="text-muted-foreground mt-4 leading-relaxed">
                Combined with Document AI for automatic field extraction from PDFs and images,
                batch CSV processing, and a modern React dashboard — Anqor provides
                an end-to-end, explainable fraud detection solution.
              </p>
            </m.div>
            <m.div
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="grid grid-cols-2 gap-4"
            >
              {[
                { value: "5", label: "ML Models" },
                { value: "99.4%", label: "Best F1 Score" },
                { value: "84K+", label: "Training Claims" },
                { value: "<1s", label: "Prediction Time" },
                { value: "20+", label: "API Endpoints" },
                { value: "GPT-4o", label: "Document AI" },
              ].map((stat, i) => (
                <m.div
                  key={stat.label}
                  initial={{ opacity: 0, scale: 0.95 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1 }}
                  className="glass-card-hover p-6 text-center"
                >
                  <div className="text-2xl font-bold gradient-text">{stat.value}</div>
                  <div className="text-xs text-muted-foreground mt-1 uppercase tracking-wider">{stat.label}</div>
                </m.div>
              ))}
            </m.div>
          </div>
        </div>
      </section>

      {/* Model Performance */}
      <section className="relative py-20">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <m.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <span className="section-label">Model Performance</span>
            <h2 className="text-3xl font-bold text-foreground mt-4">5 Specialised XGBoost Pipelines</h2>
            <p className="text-muted-foreground mt-3 max-w-xl mx-auto">
              Each model is trained on real investigator-labeled claims data with automated feature engineering.
            </p>
          </m.div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 max-w-5xl mx-auto">
            {modelData.map((model, i) => (
              <m.div
                key={model.name}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.08 }}
                className="glass-card-hover p-5 text-center"
              >
                <div className="text-xs text-muted-foreground uppercase tracking-wider mb-2">{model.name}</div>
                <div className="text-2xl font-bold gradient-text">{model.f1}</div>
                <div className="text-[10px] text-muted-foreground mt-1">F1 Score</div>
                <div className="h-px bg-border/30 my-3" />
                <div className="text-xs text-muted-foreground">
                  <span className="font-medium text-foreground">{model.auc}</span> AUC-ROC
                </div>
                <div className="text-xs text-muted-foreground mt-1">{model.data}</div>
              </m.div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="relative py-20">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <m.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <span className="section-label">Features</span>
            <h2 className="text-3xl font-bold text-foreground mt-4">Key Capabilities</h2>
          </m.div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {features.map((f, i) => (
              <m.div
                key={f.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.06 }}
                className="glass-card-hover p-6 group"
              >
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary/10 to-[hsl(var(--glow-purple))]/10 flex items-center justify-center mb-4 group-hover:from-primary/20 group-hover:to-[hsl(var(--glow-purple))]/20 transition-all duration-500">
                  <f.icon className="w-5 h-5 text-primary" />
                </div>
                <h3 className="text-sm font-bold text-foreground mb-1">{f.title}</h3>
                <p className="text-xs text-muted-foreground leading-relaxed">{f.desc}</p>
              </m.div>
            ))}
          </div>
        </div>
      </section>

      {/* How Fraud Explanations Work */}
      <section className="relative py-20">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-4xl">
          <m.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <span className="section-label">
              <MessageSquareWarning className="w-3 h-3" />
              Explainable AI
            </span>
            <h2 className="text-3xl font-bold text-foreground mt-4">"Why Was My Claim Flagged?"</h2>
            <p className="text-muted-foreground mt-3 max-w-2xl mx-auto">
              Every prediction comes with a structured explanation — not just a score.
            </p>
          </m.div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {[
              {
                category: "Financial",
                color: "text-yellow-400",
                examples: [
                  "Very high total claim amount ($45,000)",
                  "Low approval ratio — large discrepancy between claimed and approved",
                ],
              },
              {
                category: "Behavioral",
                color: "text-red-400",
                examples: [
                  "No witnesses reported at the scene",
                  "Incident reported as total loss — highest payout category",
                ],
              },
              {
                category: "Documentation",
                color: "text-orange-400",
                examples: [
                  "No police report available despite significant damage",
                  "Medical history was not disclosed at policy inception",
                ],
              },
              {
                category: "Temporal",
                color: "text-blue-400",
                examples: [
                  "Very new customer — policy only 3 months old",
                  "Incident occurred during late/early hours (2:00 AM)",
                ],
              },
            ].map((cat, i) => (
              <m.div
                key={cat.category}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="glass-card p-5"
              >
                <h3 className={`text-sm font-bold ${cat.color} mb-3`}>{cat.category} Factors</h3>
                <ul className="space-y-2">
                  {cat.examples.map((ex) => (
                    <li key={ex} className="flex items-start gap-2 text-xs text-muted-foreground leading-relaxed">
                      <div className={`w-1.5 h-1.5 rounded-full mt-1.5 flex-shrink-0 ${cat.color.replace("text-", "bg-")}`} />
                      {ex}
                    </li>
                  ))}
                </ul>
              </m.div>
            ))}
          </div>

          <m.div
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mt-8"
          >
            <p className="text-xs text-muted-foreground">
              Plus ML-identified <strong>statistical</strong> factors from SHAP feature importance analysis,
              and a clear <strong>recommendation</strong> for next steps.
            </p>
          </m.div>
        </div>
      </section>

      {/* FAQ Accordion */}
      <section className="relative py-20">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <m.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <span className="section-label">FAQ</span>
            <h2 className="text-3xl font-bold text-foreground mt-4">Frequently Asked Questions</h2>
            <p className="text-muted-foreground mt-3">
              Everything you need to know about Anqor
            </p>
          </m.div>

          <m.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
          >
            <Accordion type="single" collapsible className="glass-card px-6">
              {faqItems.map((item, i) => (
                <AccordionItem
                  key={i}
                  value={`item-${i}`}
                  className="border-border/50"
                >
                  <AccordionTrigger className="text-sm font-semibold text-foreground hover:no-underline hover:text-primary transition-colors py-5">
                    {item.question}
                  </AccordionTrigger>
                  <AccordionContent className="text-sm text-muted-foreground leading-relaxed">
                    {item.answer}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </m.div>
        </div>
      </section>
    </div>
  );
};

export default AboutPage;
