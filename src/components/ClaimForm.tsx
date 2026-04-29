import { useState, useCallback, memo, useEffect } from "react";
import { m } from "framer-motion";
import { User, FileText, DollarSign, AlertTriangle, ClipboardList, ChevronDown, Shield } from "lucide-react";
import { INSURANCE_SCHEMAS, type ClaimCategory, type FieldGroup } from "@/schemas/insuranceTypes";

export interface ClaimData {
  [key: string]: unknown;
}

const defaultAutoClaim: ClaimData = {
  months_as_customer: 12, insured_sex: "MALE", insured_education_level: "MD",
  insured_occupation: "exec-managerial", insured_relationship: "husband",
  policy_deductable: 1000, policy_annual_premium: 1200, umbrella_limit: 0,
  policy_csl: "250/500", capital_gains: 0, capital_loss: 0,
  incident_hour_of_the_day: 12, incident_type: "Single Vehicle Collision",
  collision_type: "Side Collision", incident_severity: "Major Damage",
  authorities_contacted: "Police", number_of_vehicles_involved: 1,
  bodily_injuries: 0, witnesses: 1, injury_claim: 5000,
  property_claim: 10000, vehicle_claim: 15000, property_damage: "YES",
  police_report_available: "YES",
};

interface SelectFieldProps {
  label: string;
  name: string;
  value: string;
  onChange: (key: string, v: unknown) => void;
  options: string[];
}

const SelectField = memo(({ label, name, value, onChange, options }: SelectFieldProps) => (
  <div className="space-y-2">
    <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{label}</label>
    <div className="relative">
      <select
        value={value || ""}
        onChange={(e) => onChange(name, e.target.value)}
        className="input-premium appearance-none pr-10"
      >
        <option value="" disabled>Select…</option>
        {options.map((o) => (
          <option key={o} value={o}>{o}</option>
        ))}
      </select>
      <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
    </div>
  </div>
));
SelectField.displayName = "SelectField";

interface NumberFieldProps {
  label: string;
  name: string;
  value: number;
  onChange: (key: string, v: unknown) => void;
}

const NumberField = memo(({ label, name, value, onChange }: NumberFieldProps) => (
  <div className="space-y-2">
    <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{label}</label>
    <input
      type="number"
      name={name}
      autoComplete="off"
      value={value ?? 0}
      onChange={(e) => onChange(name, Number(e.target.value))}
      className="input-premium"
    />
  </div>
));
NumberField.displayName = "NumberField";

interface TextFieldProps {
  label: string;
  name: string;
  value: string;
  onChange: (key: string, v: unknown) => void;
}

const TextField = memo(({ label, name, value, onChange }: TextFieldProps) => (
  <div className="space-y-2">
    <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{label}</label>
    <input
      type="text"
      name={name}
      autoComplete="off"
      value={value || ""}
      onChange={(e) => onChange(name, e.target.value)}
      className="input-premium"
    />
  </div>
));
TextField.displayName = "TextField";

interface FormSectionProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  children: React.ReactNode;
  delay?: number;
}

const FormSection = memo(({ icon, title, description, children, delay = 0 }: FormSectionProps) => (
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
));
FormSection.displayName = "FormSection";

const ICON_MAP: Record<string, React.ReactNode> = {
  user: <User className="w-4 h-4 text-primary" />,
  file: <FileText className="w-4 h-4 text-primary" />,
  dollar: <DollarSign className="w-4 h-4 text-primary" />,
  alert: <AlertTriangle className="w-4 h-4 text-primary" />,
  clipboard: <ClipboardList className="w-4 h-4 text-primary" />,
  shield: <Shield className="w-4 h-4 text-primary" />,
};

interface ClaimFormProps {
  onSubmit: (data: ClaimData) => void;
  isLoading: boolean;
  category?: ClaimCategory;
}

const ClaimForm = ({ onSubmit, isLoading, category = "auto" }: ClaimFormProps) => {
  const [form, setForm] = useState<ClaimData>(defaultAutoClaim);

  useEffect(() => {
    if (category === "auto") {
      setForm(defaultAutoClaim);
      return;
    }
    const schema = INSURANCE_SCHEMAS[category];
    const initial: Record<string, string | number | boolean> = {};
    for (const group of schema.fieldGroups) {
      for (const field of group.fields) {
        initial[field.name] = field.defaultValue ?? (field.type === "number" ? 0 : "");
      }
    }
    setForm(initial);
  }, [category]);

  const update = useCallback((key: string, value: unknown) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  }, []);

  const renderGroupedFields = (groups: FieldGroup[]) =>
    groups.map((group, gi) => (
      <div key={group.title}>
        {gi > 0 && <div className="h-px bg-gradient-to-r from-transparent via-border to-transparent my-2" />}
        <FormSection
          icon={ICON_MAP[group.icon]}
          title={group.title}
          description={group.description}
          delay={0.1 * (gi + 1)}
        >
          {group.fields.map((field) => {
            if (field.type === "select" && field.options) {
              return (
                <SelectField
                  key={field.name}
                  label={field.label}
                  name={field.name}
                  value={form[field.name] as string}
                  onChange={update}
                  options={field.options}
                />
              );
            }
            if (field.type === "number") {
              return (
                <NumberField
                  key={field.name}
                  label={field.label}
                  name={field.name}
                  value={form[field.name] as number}
                  onChange={update}
                />
              );
            }
            return (
              <TextField
                key={field.name}
                label={field.label}
                name={field.name}
                value={form[field.name] as string}
                onChange={update}
              />
            );
          })}
        </FormSection>
      </div>
    ));

  return (
    <div className="glass-card p-6 sm:p-8 space-y-8">
      <div>
        <h2 className="text-xl font-bold text-foreground">Claim Analysis</h2>
        <p className="text-sm text-muted-foreground mt-1">Fill in the claim details below for AI-powered fraud detection</p>
      </div>

      {!INSURANCE_SCHEMAS[category].isAvailable ? (
        <div className="p-8 text-center bg-secondary/50 rounded-xl border border-border/50">
          <AlertTriangle className="w-8 h-8 text-muted-foreground mx-auto mb-3" />
          <h3 className="text-lg font-semibold text-foreground">Model Not Available</h3>
          <p className="text-sm text-muted-foreground mt-2">
            The machine learning model for {category} claims is currently under construction.
          </p>
        </div>
      ) : category === "auto" ? (
        <>
          <FormSection icon={<User className="w-4 h-4 text-primary" />} title="Customer Profile" description="Insured person information" delay={0.1}>
            <NumberField label="Months as Customer" name="months_as_customer" value={form.months_as_customer as number} onChange={update} />
            <SelectField label="Sex" name="insured_sex" value={form.insured_sex as string} onChange={update} options={["MALE", "FEMALE"]} />
            <SelectField label="Education Level" name="insured_education_level" value={form.insured_education_level as string} onChange={update} options={["MD", "PhD", "Associate", "Masters", "High School", "College", "JD"]} />
            <SelectField label="Occupation" name="insured_occupation" value={form.insured_occupation as string} onChange={update} options={["exec-managerial", "prof-specialty", "sales", "craft-repair", "machine-op-inspct", "tech-support", "other-service", "adm-clerical", "transport-moving", "handlers-cleaners", "farming-fishing", "protective-serv"]} />
            <SelectField label="Relationship" name="insured_relationship" value={form.insured_relationship as string} onChange={update} options={["husband", "wife", "own-child", "not-in-family", "unmarried", "other-relative"]} />
          </FormSection>

          <div className="h-px bg-gradient-to-r from-transparent via-border to-transparent" />

          <FormSection icon={<FileText className="w-4 h-4 text-primary" />} title="Policy Details" description="Insurance policy configuration" delay={0.2}>
            <NumberField label="Deductible ($)" name="policy_deductable" value={form.policy_deductable as number} onChange={update} />
            <NumberField label="Annual Premium ($)" name="policy_annual_premium" value={form.policy_annual_premium as number} onChange={update} />
            <NumberField label="Umbrella Limit" name="umbrella_limit" value={form.umbrella_limit as number} onChange={update} />
            <SelectField label="Policy CSL" name="policy_csl" value={form.policy_csl as string} onChange={update} options={["100/300", "250/500", "500/1000"]} />
          </FormSection>

          <div className="h-px bg-gradient-to-r from-transparent via-border to-transparent" />

          <FormSection icon={<DollarSign className="w-4 h-4 text-primary" />} title="Financial Indicators" description="Capital gains and losses" delay={0.3}>
            <NumberField label="Capital Gains ($)" name="capital_gains" value={form.capital_gains as number} onChange={update} />
            <NumberField label="Capital Loss ($)" name="capital_loss" value={form.capital_loss as number} onChange={update} />
          </FormSection>

          <div className="h-px bg-gradient-to-r from-transparent via-border to-transparent" />

          <FormSection icon={<AlertTriangle className="w-4 h-4 text-primary" />} title="Incident Information" description="Details about the reported incident" delay={0.4}>
            <NumberField label="Incident Hour (0-23)" name="incident_hour_of_the_day" value={form.incident_hour_of_the_day as number} onChange={update} />
            <SelectField label="Incident Type" name="incident_type" value={form.incident_type as string} onChange={update} options={["Single Vehicle Collision", "Vehicle Theft", "Multi-vehicle Collision", "Parked Car"]} />
            <SelectField label="Collision Type" name="collision_type" value={form.collision_type as string} onChange={update} options={["Side Collision", "Rear Collision", "Front Collision", "?"]} />
            <SelectField label="Severity" name="incident_severity" value={form.incident_severity as string} onChange={update} options={["Major Damage", "Minor Damage", "Total Loss", "Trivial Damage"]} />
            <SelectField label="Authorities Contacted" name="authorities_contacted" value={form.authorities_contacted as string} onChange={update} options={["Police", "Fire", "Ambulance", "Other", "None"]} />
            <NumberField label="Vehicles Involved" name="number_of_vehicles_involved" value={form.number_of_vehicles_involved as number} onChange={update} />
            <NumberField label="Bodily Injuries" name="bodily_injuries" value={form.bodily_injuries as number} onChange={update} />
            <NumberField label="Witnesses" name="witnesses" value={form.witnesses as number} onChange={update} />
          </FormSection>

          <div className="h-px bg-gradient-to-r from-transparent via-border to-transparent" />

          <FormSection icon={<ClipboardList className="w-4 h-4 text-primary" />} title="Claim Details" description="Claim amounts and documentation" delay={0.5}>
            <NumberField label="Injury Claim ($)" name="injury_claim" value={form.injury_claim as number} onChange={update} />
            <NumberField label="Property Claim ($)" name="property_claim" value={form.property_claim as number} onChange={update} />
            <NumberField label="Vehicle Claim ($)" name="vehicle_claim" value={form.vehicle_claim as number} onChange={update} />
            <SelectField label="Property Damage" name="property_damage" value={form.property_damage as string} onChange={update} options={["YES", "NO", "?"]} />
            <SelectField label="Police Report" name="police_report_available" value={form.police_report_available as string} onChange={update} options={["YES", "NO", "?"]} />
          </FormSection>
        </>
      ) : (
        renderGroupedFields(INSURANCE_SCHEMAS[category].fieldGroups)
      )}

      <m.button
        whileHover={{ scale: 1.01 }}
        whileTap={{ scale: 0.99 }}
        onClick={() => onSubmit(form)}
        disabled={isLoading || !INSURANCE_SCHEMAS[category].isAvailable}
        className="w-full btn-premium py-4 text-base disabled:opacity-50 disabled:cursor-not-allowed mt-8"
      >
        <Shield className="w-5 h-5" />
        {isLoading ? "Running Analysis…" : "Analyze Claim"}
      </m.button>
    </div>
  );
};

export default ClaimForm;
