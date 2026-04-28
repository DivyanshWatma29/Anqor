import { m } from "framer-motion";
import {
  PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip,
  ResponsiveContainer, CartesianGrid, AreaChart, Area
} from "recharts";
import { TrendingUp, PieChart as PieIcon, BarChart3, Activity, Loader2 } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { getClaimStats } from "@/lib/api";

const tooltipStyle = {
  backgroundColor: "hsl(var(--card))",
  border: "1px solid hsl(var(--border))",
  borderRadius: "8px",
  fontSize: "12px",
  padding: "8px 12px",
  boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)",
  color: "hsl(var(--foreground))",
};

interface ChartCardProps {
  title: string;
  icon: React.ReactNode;
  children: React.ReactNode;
  delay?: number;
}

const ChartCard = ({ title, icon, children, delay = 0 }: ChartCardProps) => (
  <m.div
    initial={{ opacity: 0, y: 20 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true }}
    transition={{ delay, duration: 0.5 }}
    className="glass-card-hover p-4 sm:p-6"
  >
    <div className="flex items-center gap-2 mb-4 sm:mb-6">
      <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center">
        {icon}
      </div>
      <h3 className="text-sm font-semibold text-foreground">{title}</h3>
    </div>
    {children}
  </m.div>
);

const fallbackStats = {
  totalClaims: 0,
  fraudDetected: 0,
  avgRiskScore: 0,
  fraudRate: 0,
  trendData: [],
  severityBreakdown: [],
  claimAmountDistribution: [],
};

const AnalyticsSection = () => {
  const { data: stats, isLoading } = useQuery({
    queryKey: ['claimStats'],
    queryFn: getClaimStats,
  });

  const s = stats || fallbackStats;
  const hasData = s.totalClaims > 0;

  const fraudDistribution = hasData
    ? [
        { name: "Legitimate", value: s.totalClaims - s.fraudDetected, color: "hsl(160, 84%, 39%)" },
        { name: "Fraudulent", value: s.fraudDetected, color: "hsl(347, 77%, 50%)" },
      ]
    : [
        { name: "Legitimate", value: 72, color: "hsl(160, 84%, 39%)" },
        { name: "Fraudulent", value: 28, color: "hsl(347, 77%, 50%)" },
      ];

  const severityData = hasData
    ? s.severityBreakdown.map((d: { severity: string; count: number }, i: number) => ({
        name: d.severity,
        claims: d.count,
        fill: `hsl(var(--primary) / ${0.4 + i * 0.2})`,
      }))
    : [
        { name: "Trivial", claims: 0, fill: "hsl(var(--primary) / 0.4)" },
        { name: "Minor", claims: 0, fill: "hsl(var(--primary) / 0.6)" },
        { name: "Major", claims: 0, fill: "hsl(var(--primary) / 0.8)" },
        { name: "Total Loss", claims: 0, fill: "hsl(var(--primary))" },
      ];

  const claimAmountData = hasData
    ? s.claimAmountDistribution
    : [
        { range: "0-5K", count: 0 },
        { range: "5-15K", count: 0 },
        { range: "15-30K", count: 0 },
        { range: "30-50K", count: 0 },
        { range: "50-75K", count: 0 },
        { range: "75K+", count: 0 },
      ];

  const trendData = hasData ? s.trendData : [];

  const fraudPct = hasData
    ? Math.round((s.fraudDetected / s.totalClaims) * 100)
    : 0;
  const legitPct = hasData ? 100 - fraudPct : 0;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Summary cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {[
          { label: "Total Claims", value: s.totalClaims.toLocaleString(), sub: hasData ? `${s.totalClaims} analyzed` : "No data", positive: true },
          { label: "Fraud Detected", value: s.fraudDetected.toLocaleString(), sub: hasData ? `${fraudPct}% of total` : "No data", negative: true },
          { label: "Avg Risk Score", value: s.avgRiskScore.toFixed(1), sub: hasData ? "out of 100" : "No data", positive: true },
          { label: "Fraud Rate", value: hasData ? `${s.fraudRate}%` : "--", sub: hasData ? "detected rate" : "No data", positive: true },
        ].map((stat, i) => (
          <m.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.1 }}
            className="glass-card-hover p-5"
          >
            <p className="text-xs text-muted-foreground uppercase tracking-wider">{stat.label}</p>
            <div className="flex items-end gap-2 mt-2">
              <span className="text-2xl font-bold text-foreground">{stat.value}</span>
              <span className={`text-xs font-medium pb-0.5 ${stat.negative ? "text-danger" : "text-muted-foreground"}`}>
                {stat.sub}
              </span>
            </div>
          </m.div>
        ))}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* Trend */}
        <ChartCard title="Recent 10 Predictions" icon={<Activity className="w-4 h-4 text-primary" />} delay={0.1}>
          {trendData.length > 0 ? (
            <>
              <div className="h-[240px] sm:h-[300px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={trendData} margin={{ top: 5, right: 0, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="fraudGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="hsl(347, 77%, 50%)" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="hsl(347, 77%, 50%)" stopOpacity={0} />
                      </linearGradient>
                      <linearGradient id="legitGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="hsl(160, 84%, 39%)" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="hsl(160, 84%, 39%)" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.5} vertical={false} />
                    <XAxis dataKey="month" tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} />
                    <Tooltip contentStyle={tooltipStyle} itemStyle={{ color: 'hsl(var(--foreground))' }} />
                    <Area type="monotone" dataKey="legit" stroke="hsl(160, 84%, 39%)" fill="url(#legitGrad)" strokeWidth={2} />
                    <Area type="monotone" dataKey="fraud" stroke="hsl(347, 77%, 50%)" fill="url(#fraudGrad)" strokeWidth={2} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
              <div className="flex items-center justify-center sm:justify-start gap-6 mt-4">
                <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <div className="w-2 h-2 rounded-full bg-success" /> Legitimate
                </span>
                <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <div className="w-2 h-2 rounded-full bg-danger" /> Fraudulent
                </span>
              </div>
            </>
          ) : (
            <div className="h-[240px] flex items-center justify-center text-sm text-muted-foreground">
              Submit claims to see trends
            </div>
          )}
        </ChartCard>

        {/* Fraud Distribution */}
        <ChartCard title="Fraud Distribution" icon={<PieIcon className="w-4 h-4 text-primary" />} delay={0.2}>
          <div className="h-[240px] sm:h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={fraudDistribution}
                  cx="50%"
                  cy="50%"
                  innerRadius="60%"
                  outerRadius="85%"
                  paddingAngle={4}
                  dataKey="value"
                  strokeWidth={0}
                >
                  {fraudDistribution.map((entry, i) => (
                    <Cell key={i} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip contentStyle={tooltipStyle} itemStyle={{ color: 'hsl(var(--foreground))' }} labelStyle={{ color: 'hsl(var(--foreground))' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="flex justify-center gap-6 mt-4">
            {fraudDistribution.map((d) => (
              <div key={d.name} className="flex items-center gap-2 text-xs text-muted-foreground">
                <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: d.color }} />
                <span>{d.name}</span>
                <span className="font-semibold text-foreground">
                  {hasData ? `${d.name === 'Fraudulent' ? fraudPct : legitPct}%` : `${d.value}%`}
                </span>
              </div>
            ))}
          </div>
        </ChartCard>

        {/* Claim Amounts */}
        <ChartCard title="Claim Amount Distribution" icon={<BarChart3 className="w-4 h-4 text-primary" />} delay={0.3}>
          <div className="h-[240px] sm:h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={claimAmountData} margin={{ top: 5, right: 0, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.5} vertical={false} />
                <XAxis dataKey="range" tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={tooltipStyle} cursor={{ fill: 'hsl(var(--muted))', opacity: 0.4 }} itemStyle={{ color: 'hsl(var(--foreground))' }} labelStyle={{ color: 'hsl(var(--foreground))' }} />
                <Bar dataKey="count" radius={[4, 4, 0, 0]} maxBarSize={60}>
                  {claimAmountData.map((_: { range: string; count: number }, i: number) => (
                    <Cell key={i} fill={`hsl(var(--primary) / ${0.5 + i * 0.1})`} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>

        {/* Severity */}
        <ChartCard title="Incident Severity Analysis" icon={<TrendingUp className="w-4 h-4 text-primary" />} delay={0.4}>
          <div className="h-[240px] sm:h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={severityData} layout="vertical" margin={{ top: 5, right: 10, left: 10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.5} horizontal={false} />
                <XAxis type="number" tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} />
                <YAxis dataKey="name" type="category" tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} width={80} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={tooltipStyle} cursor={{ fill: 'hsl(var(--muted))', opacity: 0.4 }} itemStyle={{ color: 'hsl(var(--foreground))' }} labelStyle={{ color: 'hsl(var(--foreground))' }} />
                <Bar dataKey="claims" radius={[0, 4, 4, 0]} maxBarSize={40}>
                  {severityData.map((entry: { name: string; claims: number; fill: string }, i: number) => (
                    <Cell key={i} fill={entry.fill} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>
      </div>
    </div>
  );
};

export default AnalyticsSection;