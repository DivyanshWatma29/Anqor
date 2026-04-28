import { m } from "framer-motion";
import { Shield, Brain, Cpu, Database, Code, Users, Zap, Target, Lock, BarChart3, Globe, Layers } from "lucide-react";

const team = [
  { role: "ML Engineer", desc: "Model development and training" },
  { role: "Data Scientist", desc: "Feature engineering and analysis" },
  { role: "Backend Developer", desc: "Flask API and deployment" },
  { role: "Frontend Developer", desc: "React dashboard and UX" },
];

const techStack = [
  { icon: Brain, name: "Machine Learning", desc: "XGBoost & Random Forest ensemble models" },
  { icon: Database, name: "Python & Flask", desc: "Robust API with RESTful endpoints" },
  { icon: Code, name: "React & TypeScript", desc: "Modern, type-safe frontend architecture" },
  { icon: Layers, name: "Tailwind CSS", desc: "Utility-first responsive design system" },
];

const features = [
  { icon: Zap, title: "Real-time Predictions", desc: "Sub-second fraud detection with optimized ML pipeline" },
  { icon: Target, title: "98.5% Accuracy", desc: "Industry-leading model accuracy trained on 100K+ claims" },
  { icon: Lock, title: "Secure by Design", desc: "Enterprise-grade security with encrypted data handling" },
  { icon: BarChart3, title: "Rich Analytics", desc: "Comprehensive dashboards for fraud pattern analysis" },
  { icon: Globe, title: "RESTful API", desc: "Easy integration with existing insurance platforms" },
  { icon: Users, title: "Team Collaboration", desc: "Multi-user access with role-based permissions" },
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
            <span className="section-label">About the Project</span>
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
            FraudShield.ai leverages cutting-edge machine learning to identify fraudulent
            insurance claims in real-time, saving companies millions and protecting honest policyholders.
          </m.p>
        </div>
      </section>

      {/* Mission */}
      <section className="relative py-16">
        <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8">
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
                advanced ensemble machine learning models trained on hundreds of thousands of claims
                to identify patterns that human reviewers often miss.
              </p>
              <p className="text-muted-foreground mt-4 leading-relaxed">
                By combining XGBoost and Random Forest classifiers with deep feature engineering,
                we achieve industry-leading accuracy while maintaining explainability through
                detailed fraud indicator analysis.
              </p>
            </m.div>
            <m.div
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="grid grid-cols-2 gap-4"
            >
              {[
                { value: "100K+", label: "Training Samples" },
                { value: "98.5%", label: "Model Accuracy" },
                { value: "< 2s", label: "Prediction Time" },
                { value: "24", label: "Input Features" },
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
        <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8">
          <m.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <span className="section-label">Features</span>
            <h2 className="text-3xl font-bold text-foreground mt-4">Built for Enterprise</h2>
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

      {/* Tech Stack */}
      <section className="relative py-20">
        <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8">
          <m.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <span className="section-label">Technology</span>
            <h2 className="text-3xl font-bold text-foreground mt-4">Powered By</h2>
          </m.div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {techStack.map((t, i) => (
              <m.div
                key={t.name}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="glass-card-hover p-6 text-center"
              >
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary/10 to-[hsl(var(--glow-cyan))]/10 flex items-center justify-center mx-auto mb-3">
                  <t.icon className="w-6 h-6 text-primary" />
                </div>
                <h3 className="text-sm font-bold text-foreground mb-1">{t.name}</h3>
                <p className="text-[11px] text-muted-foreground">{t.desc}</p>
              </m.div>
            ))}
          </div>
        </div>
      </section>

      {/* Team */}
      <section className="relative py-20">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <m.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <span className="section-label">Core Team</span>
            <h2 className="text-3xl font-bold text-foreground mt-4">The Team Behind It</h2>
          </m.div>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {team.map((member, i) => (
              <m.div
                key={member.role}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="glass-card-hover p-5 text-center"
              >
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary/20 to-[hsl(var(--glow-purple))]/20 flex items-center justify-center mx-auto mb-3">
                  <Users className="w-5 h-5 text-primary" />
                </div>
                <h3 className="text-xs font-bold text-foreground">{member.role}</h3>
                <p className="text-[10px] text-muted-foreground mt-1">{member.desc}</p>
              </m.div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
};

export default AboutPage;
