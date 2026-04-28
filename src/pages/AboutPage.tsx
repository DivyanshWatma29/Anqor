import { m } from "framer-motion";
import { Sparkles, Zap, Target, Lock, BarChart3, Globe, Users } from "lucide-react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const features = [
  { icon: Zap, title: "Real-time Predictions", desc: "Sub-second fraud detection with optimized ML pipeline" },
  { icon: Target, title: "High Accuracy", desc: "SVM model trained on labeled insurance claims dataset" },
  { icon: Lock, title: "Secure by Design", desc: "Row-level security with encrypted data handling" },
  { icon: BarChart3, title: "Rich Analytics", desc: "Comprehensive dashboards for fraud pattern analysis" },
  { icon: Globe, title: "RESTful API", desc: "Easy integration with existing insurance platforms" },
  { icon: Users, title: "Guest Mode", desc: "Use all prediction features without creating an account" },
];

const faqItems = [
  {
    question: "What ML model does FraudShield use?",
    answer:
      "FraudShield uses a Support Vector Machine (SVM) classifier trained on labeled insurance claims data. The model analyzes 24 input features including policy details, incident characteristics, and claim amounts to predict fraud probability with a confidence score.",
  },
  {
    question: "What technologies power the platform?",
    answer:
      "The frontend is built with React 18, TypeScript, Vite, and Tailwind CSS. The ML backend runs on Python with Flask and scikit-learn. We use InsForge (Supabase-compatible BaaS) for database, authentication, and AI gateway. Document AI uses GPT-4o-mini for PDF/image field extraction.",
  },
  {
    question: "How does Document AI work?",
    answer:
      "Upload a PDF or image of a claim form, and our Document AI (powered by GPT-4o-mini via InsForge AI Gateway) automatically extracts structured fields like policy number, incident type, claim amount, and more. Extracted data is pre-filled into the prediction form for instant analysis.",
  },
  {
    question: "Do I need an account to use predictions?",
    answer:
      "No. All prediction features — single claim analysis, bulk CSV upload, and Document AI extraction — work without an account in Guest Mode. Creating an account lets you save claim history, access the analytics dashboard, and view detailed claim reports.",
  },
  {
    question: "How does bulk processing work?",
    answer:
      "Upload a CSV file with up to 50 rows of claim data. Each row is validated and processed through the ML model individually. You get per-row predictions with fraud probability and risk scores, plus a downloadable summary of all results.",
  },
  {
    question: "Who built this project?",
    answer:
      "FraudShield.ai was built as a capstone project by a team of students, combining machine learning, full-stack web development, and AI integration. The project demonstrates real-world application of SVM classification for insurance fraud detection.",
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
            <span className="gradient-text"> AI Intelligence</span>
          </m.h1>
          <m.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-lg text-muted-foreground mt-6 max-w-2xl mx-auto leading-relaxed"
          >
            FraudShield.ai leverages machine learning to identify fraudulent
            insurance claims in real-time, helping reduce losses and protecting honest policyholders.
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
              <h2 className="text-3xl font-bold text-foreground mt-4">Fighting Fraud with Data</h2>
              <p className="text-muted-foreground mt-4 leading-relaxed">
                Insurance fraud costs the industry over $80 billion annually. Our platform uses
                a Support Vector Machine (SVM) classifier trained on labeled insurance claims data
                to identify patterns that human reviewers often miss.
              </p>
              <p className="text-muted-foreground mt-4 leading-relaxed">
                Combined with Document AI for automatic field extraction from PDFs and images,
                and a modern React dashboard for visualization, FraudShield.ai provides
                an end-to-end fraud detection solution.
              </p>
            </m.div>
            <m.div
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="grid grid-cols-2 gap-4"
            >
              {[
                { value: "SVM", label: "ML Model" },
                { value: "24", label: "Input Features" },
                { value: "< 2s", label: "Prediction Time" },
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
                transition={{ delay: i * 0.08 }}
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
              Everything you need to know about FraudShield.ai
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
