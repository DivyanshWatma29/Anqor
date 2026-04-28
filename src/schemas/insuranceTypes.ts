export type ClaimCategory = "auto" | "health" | "travel" | "property" | "life" | "business" | "liability";

export interface InsuranceSchema {
  id: ClaimCategory;
  label: string;
  description: string;
  isAvailable: boolean; 
  requiredFields: string[];
}

export const INSURANCE_SCHEMAS: Record<ClaimCategory, InsuranceSchema> = {
  auto: {
    id: "auto",
    label: "Auto Insurance",
    description: "Detect fraud in vehicle collisions, theft, and property damage.",
    isAvailable: true,
    requiredFields: [
      "months_as_customer", "insured_sex", "insured_education_level", "insured_occupation", "insured_relationship", "policy_deductable", "policy_annual_premium", "umbrella_limit", "policy_csl", "capital_gains", "capital_loss", "incident_hour_of_the_day", "incident_type", "collision_type", "incident_severity", "authorities_contacted", "number_of_vehicles_involved", "bodily_injuries", "witnesses", "injury_claim", "property_claim", "vehicle_claim", "property_damage", "police_report_available"
    ]
  },
  health: {
    id: "health",
    label: "Health Insurance",
    description: "Detect Medicare and healthcare provider billing fraud.",
    isAvailable: true,
    requiredFields: [
      "provider_id", "patient_age", "patient_gender", "diagnosis_code", "procedure_code", "claim_amount", "deductible_paid", "hospital_stay_days"
    ]
  },
  travel: {
    id: "travel",
    label: "Travel Insurance",
    description: "Detect fraudulent trip cancellation and delay claims.",
    isAvailable: true,
    requiredFields: [
      "agency_type", "distribution_channel", "product_name", "duration", "destination", "net_sales", "commission", "age"
    ]
  },
  property: {
    id: "property",
    label: "Property / Home Insurance",
    description: "Detect fraud in homeowners and commercial property claims.",
    isAvailable: true,
    requiredFields: [
      "property_type", "home_age", "claim_type", "weather_conditions", "police_report", "repair_estimate"
    ]
  },
  life: {
    id: "life",
    label: "Life Insurance",
    description: "Detect fake deaths and contestable period fraud.",
    isAvailable: true,
    requiredFields: [
      "policy_duration_months", "cause_of_death", "nominee_relationship", "medical_history_disclosed"
    ]
  },
  business: {
    id: "business",
    label: "Business Interruption",
    description: "Detect exaggerated revenue loss and commercial claims.",
    isAvailable: false,
    requiredFields: []
  },
  liability: {
    id: "liability",
    label: "Liability Insurance",
    description: "Detect fraudulent injury or property damage claims.",
    isAvailable: false,
    requiredFields: []
  }
};
