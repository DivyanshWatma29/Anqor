import { useState, useCallback, memo, useEffect } from "react";
import { m } from "framer-motion";
import { User, FileText, DollarSign, AlertTriangle, ClipboardList, ChevronDown, Shield, Loader2 } from "lucide-react";
import { INSURANCE_SCHEMAS, type ClaimCategory, type FieldGroup } from "@/schemas/insuranceTypes";

export interface ClaimData {
  [key: string]: unknown;
}

interface SelectFieldProps {
  label: string;
  name: string;
  value: string;
  onChange: (key: string, v: unknown) => void;
  options: string[];
}

const SelectField = memo(({ label, name, value, onChange, options }: SelectFieldProps) => (
  <div className="space-y-2">
    <label htmlFor={name} className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{label}</label>
    <div className="relative">
      <select
        id={name}
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
  value: number | string;
  onChange: (key: string, v: unknown) => void;
  placeholder?: string;
}

const NumberField = memo(({ label, name, value, onChange, placeholder }: NumberFieldProps) => (
  <div className="space-y-2">
    <label htmlFor={name} className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{label}</label>
    <input
      id={name}
      type="number"
      name={name}
      autoComplete="off"
      value={value ?? ""}
      onChange={(e) => onChange(name, e.target.value === "" ? "" : Number(e.target.value))}
      placeholder={placeholder}
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
    <label htmlFor={name} className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{label}</label>
    <input
      id={name}
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
  const [form, setForm] = useState<ClaimData>({});

  useEffect(() => {
    const schema = INSURANCE_SCHEMAS[category];
    const initial: Record<string, string | number | boolean> = {};
    for (const group of schema.fieldGroups) {
      for (const field of group.fields) {
        initial[field.name] = field.defaultValue ?? "";
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
                  options={field.options.map(String)}
                />
              );
            }
            if (field.type === "number") {
              return (
                <NumberField
                  key={field.name}
                  label={field.label}
                  name={field.name}
                  value={form[field.name] as number | string}
                  onChange={update}
                  placeholder={field.placeholder}
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
        {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Shield className="w-5 h-5" />}
        {isLoading ? "Running Analysis…" : "Analyze Claim"}
      </m.button>
    </div>
  );
};

export default ClaimForm;
