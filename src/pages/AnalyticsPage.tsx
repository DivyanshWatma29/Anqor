import { m } from "framer-motion";
import AnalyticsSection from "@/components/AnalyticsSection";
import HistoryTable from "@/components/HistoryTable";

const AnalyticsPage = () => {
  return (
    <div className="relative py-12 sm:py-20">
      <div className="absolute inset-0 dot-grid opacity-20" />
      <div className="glow-orb w-[500px] h-[500px] -top-48 right-0 bg-[hsl(var(--glow-cyan))] opacity-[0.04]" />

      <div className="relative max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8">
        <m.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <span className="section-label">Analytics</span>
          <h1 className="text-3xl sm:text-4xl font-bold text-foreground mt-4">Claims Intelligence Dashboard</h1>
          <p className="text-muted-foreground mt-3 max-w-xl mx-auto">
            Comprehensive analytics on fraud detection performance, claim patterns, and risk distribution.
          </p>
        </m.div>

        <AnalyticsSection />

        <m.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mt-16"
        >
          <div className="text-center mb-10">
            <span className="section-label">History</span>
            <h2 className="text-2xl sm:text-3xl font-bold text-foreground mt-4">Prediction History</h2>
          </div>
          <HistoryTable />
        </m.div>
      </div>
    </div>
  );
};

export default AnalyticsPage;
