import { useState } from "react";
import { m } from "framer-motion";
import { User, FileText, DollarSign, AlertTriangle, ClipboardList, ChevronDown, Shield } from "lucide-react";

export interface ClaimData {
  months_as_customer: number;
  insured_sex: string;
  insured_education_level: string;
  insured_occupation: string;
  insured_relationship: string;
  policy_deductable: number;
  policy_annual_premium: number;
  umbrella_limit: number;
  policy_csl: string;
  capital_gains: number;
  capital_loss: number;
  incident_hour_of_the_day: number;
  incident_type: string;
  collision_type: string;
  incident_severity: string;
  authorities_contacted: string;
  number_of_vehicles_involved: number;
  bodily_injuries: number;
  witnesses: number;
  injury_claim: number;
  property_claim: number;
  vehicle_claim: number;
  property_damage: string;
  police_report_available: string;
}

const defaultClaim: ClaimData = {
  months_as_customer: 12,
  insured_sex: "MALE",
  insured_education_level: "MD",
  insured_occupation: "exec-managerial",
  insured_relationship: "husband",
  policy_deductable: 1000,
  policy_annual_premium: 1200,
  umbrella_limit: 0,
  policy_csl: "250/500",
  capital_gains: 0,
  capital_loss: 0,
  incident_hour_of_the_day: 12,
  incident_type: "Single Vehicle Collision",
  collision_type: "Side Collision",
  incident_severity: "Major Damage",
  authorities_contacted: "Police",
  number_of_vehicles_involved: 1,
  bodily_injuries: 0,
  witnesses: 1,
  injury_claim: 5000,
  property_claim: 10000,
  vehicle_claim: 15000,
  property_damage: "YES",
  police_report_available: "YES",
};

interface SelectFieldProps {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: string[];
}

const SelectField = ({ label, value, onChange, options }: SelectFieldProps) => (
  <div className="space-y-2">
    <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{label}</label>
    <div className="relative">
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="input-premium appearance-none pr-10"
      >
        {options.map((o) => (
          <option key={o} value={o}>{o}</option>
        ))}
      </select>
      <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
    </div>
  </div>
);

interface NumberFieldProps {
  label: string;
  value: number;
  onChange: (v: number) => void;
}

const NumberField = ({ label, value, onChange }: NumberFieldProps) => (
  <div className="space-y-2">
    <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{label}</label>
    <input
      type="number"
      value={value}
      onChange={(e) => onChange(Number(e.target.value))}
      min={0}
      className="input-premium"
    />
  </div>
);

interface FormSectionProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  children: React.ReactNode;
  delay?: number;
}

const FormSection = ({ icon, title, description, children, delay = 0 }: FormSectionProps) => (
  <m.div
    initial={{ opacity: 0, y: 15 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.4, delay }}
    className="space-y-4"
  >
    <div className="flex items-center gap-3">
      <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary/10 to-[hsl(var(--glow-purple))]/10 flex items-center justify-center">
        {icon}
      </div>
      <div>
        <h3 className="text-sm font-semibold text-foreground">{title}</h3>
        <p className="text-[10px] text-muted-foreground">{description}</p>
      </div>
    </div>
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pl-11">
      {children}
    </div>
  </m.div>
);

interface ClaimFormProps {
  onSubmit: (data: ClaimData) => void;
  isLoading: boolean;
}

const ClaimForm = ({ onSubmit, isLoading }: ClaimFormProps) => {
  const [form, setForm] = useState<ClaimData>(defaultClaim);

  const update = <K extends keyof ClaimData>(key: K, value: ClaimData[K]) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  return (
    <div className="glass-card p-6 sm:p-8 space-y-8">
      <div>
        <h2 className="text-xl font-bold text-foreground">Claim Analysis</h2>
        <p className="text-sm text-muted-foreground mt-1">Fill in the claim details below for AI-powered fraud detection</p>
      </div>

      <FormSection icon={<User className="w-4 h-4 text-primary" />} title="Customer Profile" description="Insured person information" delay={0.1}>
        <NumberField label="Months as Customer" value={form.months_as_customer} onChange={(v) => update("months_as_customer", v)} />
        <SelectField label="Sex" value={form.insured_sex} onChange={(v) => update("insured_sex", v)} options={["MALE", "FEMALE"]} />
        <SelectField label="Education Level" value={form.insured_education_level} onChange={(v) => update("insured_education_level", v)} options={["MD", "PhD", "Associate", "Masters", "High School", "College", "JD"]} />
        <SelectField label="Occupation" value={form.insured_occupation} onChange={(v) => update("insured_occupation", v)} options={["exec-managerial", "prof-specialty", "sales", "craft-repair", "machine-op-inspct", "tech-support", "other-service", "adm-clerical", "transport-moving", "handlers-cleaners", "farming-fishing", "protective-serv"]} />
        <SelectField label="Relationship" value={form.insured_relationship} onChange={(v) => update("insured_relationship", v)} options={["husband", "wife", "own-child", "not-in-family", "unmarried", "other-relative"]} />
      </FormSection>

      <div className="h-px bg-gradient-to-r from-transparent via-border to-transparent" />

      <FormSection icon={<FileText className="w-4 h-4 text-primary" />} title="Policy Details" description="Insurance policy configuration" delay={0.2}>
        <NumberField label="Deductible ($)" value={form.policy_deductable} onChange={(v) => update("policy_deductable", v)} />
        <NumberField label="Annual Premium ($)" value={form.policy_annual_premium} onChange={(v) => update("policy_annual_premium", v)} />
        <NumberField label="Umbrella Limit" value={form.umbrella_limit} onChange={(v) => update("umbrella_limit", v)} />
        <SelectField label="Policy CSL" value={form.policy_csl} onChange={(v) => update("policy_csl", v)} options={["100/300", "250/500", "500/1000"]} />
      </FormSection>

      <div className="h-px bg-gradient-to-r from-transparent via-border to-transparent" />

      <FormSection icon={<DollarSign className="w-4 h-4 text-primary" />} title="Financial Indicators" description="Capital gains and losses" delay={0.3}>
        <NumberField label="Capital Gains ($)" value={form.capital_gains} onChange={(v) => update("capital_gains", v)} />
        <NumberField label="Capital Loss ($)" value={form.capital_loss} onChange={(v) => update("capital_loss", v)} />
      </FormSection>

      <div className="h-px bg-gradient-to-r from-transparent via-border to-transparent" />

      <FormSection icon={<AlertTriangle className="w-4 h-4 text-primary" />} title="Incident Information" description="Details about the reported incident" delay={0.4}>
        <NumberField label="Incident Hour (0-23)" value={form.incident_hour_of_the_day} onChange={(v) => update("incident_hour_of_the_day", v)} />
        <SelectField label="Incident Type" value={form.incident_type} onChange={(v) => update("incident_type", v)} options={["Single Vehicle Collision", "Vehicle Theft", "Multi-vehicle Collision", "Parked Car"]} />
        <SelectField label="Collision Type" value={form.collision_type} onChange={(v) => update("collision_type", v)} options={["Side Collision", "Rear Collision", "Front Collision", "?"]} />
        <SelectField label="Severity" value={form.incident_severity} onChange={(v) => update("incident_severity", v)} options={["Major Damage", "Minor Damage", "Total Loss", "Trivial Damage"]} />
        <SelectField label="Authorities Contacted" value={form.authorities_contacted} onChange={(v) => update("authorities_contacted", v)} options={["Police", "Fire", "Ambulance", "Other", "None"]} />
        <NumberField label="Vehicles Involved" value={form.number_of_vehicles_involved} onChange={(v) => update("number_of_vehicles_involved", v)} />
        <NumberField label="Bodily Injuries" value={form.bodily_injuries} onChange={(v) => update("bodily_injuries", v)} />
        <NumberField label="Witnesses" value={form.witnesses} onChange={(v) => update("witnesses", v)} />
      </FormSection>

      <div className="h-px bg-gradient-to-r from-transparent via-border to-transparent" />

      <FormSection icon={<ClipboardList className="w-4 h-4 text-primary" />} title="Claim Details" description="Claim amounts and documentation" delay={0.5}>
        <NumberField label="Injury Claim ($)" value={form.injury_claim} onChange={(v) => update("injury_claim", v)} />
        <NumberField label="Property Claim ($)" value={form.property_claim} onChange={(v) => update("property_claim", v)} />
        <NumberField label="Vehicle Claim ($)" value={form.vehicle_claim} onChange={(v) => update("vehicle_claim", v)} />
        <SelectField label="Property Damage" value={form.property_damage} onChange={(v) => update("property_damage", v)} options={["YES", "NO", "?"]} />
        <SelectField label="Police Report" value={form.police_report_available} onChange={(v) => update("police_report_available", v)} options={["YES", "NO", "?"]} />
      </FormSection>

      <m.button
        whileHover={{ scale: 1.01 }}
        whileTap={{ scale: 0.99 }}
        onClick={() => onSubmit(form)}
        disabled={isLoading}
        className="w-full btn-premium py-4 text-base disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <Shield className="w-5 h-5" />
        {isLoading ? "Running Analysis..." : "Analyze Claim"}
      </m.button>
    </div>
  );
};

export default ClaimForm;
