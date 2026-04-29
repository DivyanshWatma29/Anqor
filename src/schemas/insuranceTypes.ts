export type ClaimCategory = "auto" | "health" | "travel" | "property" | "life" | "business" | "liability";

export interface FieldDefinition {
  name: string;
  label: string;
  type: "number" | "text" | "select";
  options?: string[];
  defaultValue?: string | number;
}

export interface FieldGroup {
  title: string;
  description: string;
  icon: "user" | "file" | "dollar" | "alert" | "clipboard" | "shield";
  fields: FieldDefinition[];
}

export interface InsuranceSchema {
  id: ClaimCategory;
  label: string;
  description: string;
  isAvailable: boolean;
  isBeta: boolean;
  requiredFields: string[];
  fieldGroups: FieldGroup[];
}

const healthFieldGroups: FieldGroup[] = [
  {
    title: "Patient Information",
    description: "Patient demographics and provider details",
    icon: "user",
    fields: [
      { name: "provider_id", label: "Provider ID", type: "number", defaultValue: 1000 },
      { name: "patient_age", label: "Patient Age", type: "number", defaultValue: 45 },
      { name: "patient_gender", label: "Patient Gender", type: "select", options: ["MALE", "FEMALE"] },
    ],
  },
  {
    title: "Medical Details",
    description: "Diagnosis and procedure information",
    icon: "file",
    fields: [
      { name: "diagnosis_code", label: "Diagnosis Code", type: "select", options: ["D01", "D02", "D03"] },
      { name: "procedure_code", label: "Procedure Code", type: "select", options: ["P01", "P02", "P03"] },
      { name: "hospital_stay_days", label: "Hospital Stay (Days)", type: "number", defaultValue: 3 },
    ],
  },
  {
    title: "Claim Financials",
    description: "Amounts and deductibles",
    icon: "dollar",
    fields: [
      { name: "claim_amount", label: "Claim Amount ($)", type: "number", defaultValue: 5000 },
      { name: "deductible_paid", label: "Deductible Paid ($)", type: "number", defaultValue: 500 },
    ],
  },
];

const travelFieldGroups: FieldGroup[] = [
  {
    title: "Agency & Distribution",
    description: "Booking source information",
    icon: "file",
    fields: [
      { name: "agency_type", label: "Agency Type", type: "select", options: ["Travel Agency", "Airlines"] },
      { name: "distribution_channel", label: "Distribution Channel", type: "select", options: ["Online", "Offline"] },
      { name: "product_name", label: "Product Name", type: "select", options: ["Cancellation Plan", "Comprehensive Plan"] },
    ],
  },
  {
    title: "Trip Details",
    description: "Destination and duration",
    icon: "alert",
    fields: [
      { name: "duration", label: "Duration (Days)", type: "number", defaultValue: 7 },
      { name: "destination", label: "Destination", type: "select", options: ["USA", "UK", "ASIA"] },
      { name: "age", label: "Traveler Age", type: "number", defaultValue: 30 },
    ],
  },
  {
    title: "Financial Details",
    description: "Sales and commission amounts",
    icon: "dollar",
    fields: [
      { name: "net_sales", label: "Net Sales ($)", type: "number", defaultValue: 100 },
      { name: "commission", label: "Commission ($)", type: "number", defaultValue: 20 },
    ],
  },
];

const propertyFieldGroups: FieldGroup[] = [
  {
    title: "Property Information",
    description: "Details about the insured property",
    icon: "file",
    fields: [
      { name: "property_type", label: "Property Type", type: "select", options: ["Residential", "Commercial", "Industrial"] },
      { name: "home_age", label: "Property Age (Years)", type: "number", defaultValue: 15 },
    ],
  },
  {
    title: "Claim Details",
    description: "Incident and damage information",
    icon: "alert",
    fields: [
      { name: "claim_type", label: "Claim Type", type: "select", options: ["Fire", "Water", "Burglary", "Structural"] },
      { name: "weather_conditions", label: "Weather Conditions", type: "select", options: ["Normal", "Storm", "Hurricane"] },
      { name: "police_report", label: "Police Report Filed", type: "select", options: ["YES", "NO"] },
      { name: "repair_estimate", label: "Repair Estimate ($)", type: "number", defaultValue: 10000 },
    ],
  },
];

const lifeFieldGroups: FieldGroup[] = [
  {
    title: "Policy Details",
    description: "Life insurance policy information",
    icon: "shield",
    fields: [
      { name: "policy_duration_months", label: "Policy Duration (Months)", type: "number", defaultValue: 24 },
      { name: "medical_history_disclosed", label: "Medical History Disclosed", type: "select", options: ["YES", "NO"] },
    ],
  },
  {
    title: "Claim Information",
    description: "Details about the life claim",
    icon: "alert",
    fields: [
      { name: "cause_of_death", label: "Cause of Death", type: "select", options: ["Natural", "Accident", "Homicide", "Unknown"] },
      { name: "nominee_relationship", label: "Nominee Relationship", type: "select", options: ["Spouse", "Child", "Other", "None"] },
    ],
  },
];

export const INSURANCE_SCHEMAS: Record<ClaimCategory, InsuranceSchema> = {
  auto: {
    id: "auto",
    label: "Auto Insurance",
    description: "Detect fraud in vehicle collisions, theft, and property damage.",
    isAvailable: true,
    isBeta: false,
    requiredFields: [
      "months_as_customer", "insured_sex", "insured_education_level", "insured_occupation", "insured_relationship", "policy_deductable", "policy_annual_premium", "umbrella_limit", "policy_csl", "capital_gains", "capital_loss", "incident_hour_of_the_day", "incident_type", "collision_type", "incident_severity", "authorities_contacted", "number_of_vehicles_involved", "bodily_injuries", "witnesses", "injury_claim", "property_claim", "vehicle_claim", "property_damage", "police_report_available"
    ],
    fieldGroups: [],
  },
  health: {
    id: "health",
    label: "Health Insurance",
    description: "Detect Medicare and healthcare provider billing fraud.",
    isAvailable: true,
    isBeta: true,
    requiredFields: [
      "provider_id", "patient_age", "patient_gender", "diagnosis_code", "procedure_code", "claim_amount", "deductible_paid", "hospital_stay_days"
    ],
    fieldGroups: healthFieldGroups,
  },
  travel: {
    id: "travel",
    label: "Travel Insurance",
    description: "Detect fraudulent trip cancellation and delay claims.",
    isAvailable: true,
    isBeta: true,
    requiredFields: [
      "agency_type", "distribution_channel", "product_name", "duration", "destination", "net_sales", "commission", "age"
    ],
    fieldGroups: travelFieldGroups,
  },
  property: {
    id: "property",
    label: "Property / Home Insurance",
    description: "Detect fraud in homeowners and commercial property claims.",
    isAvailable: true,
    isBeta: true,
    requiredFields: [
      "property_type", "home_age", "claim_type", "weather_conditions", "police_report", "repair_estimate"
    ],
    fieldGroups: propertyFieldGroups,
  },
  life: {
    id: "life",
    label: "Life Insurance",
    description: "Detect fake deaths and contestable period fraud.",
    isAvailable: true,
    isBeta: true,
    requiredFields: [
      "policy_duration_months", "cause_of_death", "nominee_relationship", "medical_history_disclosed"
    ],
    fieldGroups: lifeFieldGroups,
  },
  business: {
    id: "business",
    label: "Business Interruption",
    description: "Detect exaggerated revenue loss and commercial claims.",
    isAvailable: false,
    isBeta: false,
    requiredFields: [],
    fieldGroups: [],
  },
  liability: {
    id: "liability",
    label: "Liability Insurance",
    description: "Detect fraudulent injury or property damage claims.",
    isAvailable: false,
    isBeta: false,
    requiredFields: [],
    fieldGroups: [],
  },
};
