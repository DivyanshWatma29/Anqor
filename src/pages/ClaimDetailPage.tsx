import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { m } from 'framer-motion';
import { ArrowLeft, ShieldAlert, ShieldCheck, AlertTriangle, FileWarning, Download, Loader2 } from 'lucide-react';
import { getClaimById } from '@/lib/api';
import RiskMeter from '@/components/RiskMeter';
import type { ClaimData } from '@/components/ClaimForm';

const ClaimDetailPage = () => {
  const { id } = useParams<{ id: string }>();

  const { data: claim, isLoading, error } = useQuery({
    queryKey: ['claim', id],
    queryFn: () => getClaimById(id!),
    enabled: !!id,
  });

  if (isLoading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error || !claim) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center gap-4">
        <p className="text-muted-foreground">Claim not found</p>
        <Link to="/analytics" className="text-primary text-sm hover:underline">Back to Analytics</Link>
      </div>
    );
  }

  const isFraud = claim.prediction === 'Fraud';
  const riskLevel = claim.risk_score < 40 ? 'Low Risk' : claim.risk_score < 70 ? 'Medium Risk' : 'High Risk';
  const inputData = claim.input_data as ClaimData;

  const sections = [
    {
      title: 'Customer Profile',
      fields: [
        ['Months as Customer', inputData.months_as_customer],
        ['Sex', inputData.insured_sex],
        ['Education', inputData.insured_education_level],
        ['Occupation', inputData.insured_occupation],
        ['Relationship', inputData.insured_relationship],
      ],
    },
    {
      title: 'Policy Details',
      fields: [
        ['Deductible', `$${inputData.policy_deductable?.toLocaleString()}`],
        ['Annual Premium', `$${inputData.policy_annual_premium?.toLocaleString()}`],
        ['Umbrella Limit', inputData.umbrella_limit],
        ['CSL', inputData.policy_csl],
      ],
    },
    {
      title: 'Financial',
      fields: [
        ['Capital Gains', `$${inputData.capital_gains?.toLocaleString()}`],
        ['Capital Loss', `$${inputData.capital_loss?.toLocaleString()}`],
      ],
    },
    {
      title: 'Incident',
      fields: [
        ['Hour', `${inputData.incident_hour_of_the_day}:00`],
        ['Type', inputData.incident_type],
        ['Collision', inputData.collision_type],
        ['Severity', inputData.incident_severity],
        ['Authorities', inputData.authorities_contacted],
        ['Vehicles', inputData.number_of_vehicles_involved],
        ['Bodily Injuries', inputData.bodily_injuries],
        ['Witnesses', inputData.witnesses],
      ],
    },
    {
      title: 'Claim Amounts',
      fields: [
        ['Injury Claim', `$${inputData.injury_claim?.toLocaleString()}`],
        ['Property Claim', `$${inputData.property_claim?.toLocaleString()}`],
        ['Vehicle Claim', `$${inputData.vehicle_claim?.toLocaleString()}`],
        ['Total', `$${claim.claim_amount?.toLocaleString()}`],
        ['Property Damage', inputData.property_damage],
        ['Police Report', inputData.police_report_available],
      ],
    },
  ];

  return (
    <div className="relative py-12 sm:py-20">
      <div className="absolute inset-0 dot-grid opacity-20" />
      <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        {/* Back link */}
        <Link
          to="/analytics"
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Analytics
        </Link>

        {/* Header */}
        <m.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-card p-6 sm:p-8 space-y-6"
        >
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <h1 className="text-2xl font-bold text-foreground font-mono">{claim.claim_id}</h1>
              <p className="text-xs text-muted-foreground mt-1">
                Submitted {new Date(claim.created_at).toLocaleString()}
              </p>
            </div>
            <div className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-bold ${
              isFraud
                ? 'bg-danger/10 text-danger border border-danger/20'
                : 'bg-success/10 text-success border border-success/20'
            }`}>
              {isFraud ? <ShieldAlert className="w-5 h-5" /> : <ShieldCheck className="w-5 h-5" />}
              {claim.prediction}
            </div>
          </div>

          {/* Risk Meter */}
          <RiskMeter score={claim.risk_score} />

          <div className="text-center">
            <span className={`badge-premium ${
              claim.risk_score < 40
                ? 'bg-success/10 text-success border border-success/20'
                : claim.risk_score < 70
                ? 'bg-warning/10 text-warning border border-warning/20'
                : 'bg-danger/10 text-danger border border-danger/20'
            }`}>
              <AlertTriangle className="w-3 h-3" />
              {riskLevel}
            </span>
          </div>
        </m.div>

        {/* Indicators */}
        <m.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="glass-card p-6 sm:p-8 space-y-4"
        >
          <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
            <FileWarning className="w-4 h-4 text-primary" />
            Fraud Indicators
          </h3>
          <div className="space-y-2">
            {claim.indicators.map((indicator, i) => (
              <div key={i} className="glass-card-hover p-3.5 flex items-start gap-3">
                <div className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${isFraud ? 'bg-danger shadow-lg shadow-danger/30' : 'bg-success shadow-lg shadow-success/30'}`} />
                <span className="text-sm text-muted-foreground leading-relaxed">{indicator}</span>
              </div>
            ))}
          </div>
        </m.div>

        {/* Input Data Sections */}
        <m.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="glass-card p-6 sm:p-8 space-y-6"
        >
          <h3 className="text-sm font-bold text-foreground">Claim Input Data</h3>
          {sections.map((section) => (
            <div key={section.title}>
              <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">{section.title}</h4>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {section.fields.map(([label, value]) => (
                  <div key={String(label)} className="glass-card-hover p-3">
                    <p className="text-[10px] text-muted-foreground uppercase tracking-wider">{String(label)}</p>
                    <p className="text-sm font-medium text-foreground mt-0.5">{String(value)}</p>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </m.div>
      </div>
    </div>
  );
};

export default ClaimDetailPage;
