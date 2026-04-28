export type ClaimCategory = "auto" | "health" | "travel" | "property";

export interface InsuranceSchema {
  id: ClaimCategory;
  label: string;
  description: string;
  isAvailable: boolean; // Tells the UI if we actually have the ML model ready
  requiredFields: string[];
}

export const INSURANCE_SCHEMAS: Record<ClaimCategory, InsuranceSchema> = {
  auto: {
    id: "auto",
    label: "Auto Insurance",
    description: "Detect fraud in vehicle collisions, theft, and property damage.",
    isAvailable: true,
    requiredFields: [
      "months_as_customer", "insured_sex", "insured_education_level",
      "insured_occupation", "insured_relationship", "policy_deductable",
      "policy_annual_premium", "umbrella_limit", "policy_csl",
      "capital_gains", "capital_loss", "incident_hour_of_the_day",
      "incident_type", "collision_type", "incident_severity",
      "authorities_contacted", "number_of_vehicles_involved",
      "bodily_injuries", "witnesses", "injury_claim", "property_claim",
      "vehicle_claim", "property_damage", "police_report_available"
    ]
  },
  health: {
    id: "health",
    label: "Health Insurance",
    description: "Detect Medicare and healthcare provider billing fraud.",
    isAvailable: false, // Set to false until we train the health_model.joblib
    requiredFields: [
      "provider_id", "patient_age", "patient_gender",
      "diagnosis_code", "procedure_code", "claim_amount",
      "deductible_paid", "hospital_stay_days"
    ] // Placeholder fields for when the Kaggle dataset is found
  },
  travel: {
    id: "travel",
    label: "Travel Insurance",
    description: "Detect fraudulent trip cancellation and delay claims.",
    isAvailable: false,
    requiredFields: [
      "agency_type", "distribution_channel", "product_name",
      "duration", "destination", "net_sales", "commission", "age"
    ]
  },
  property: {
    id: "property",
    label: "Property / Home Insurance",
    description: "Detect fraud in homeowners and commercial property claims.",
    isAvailable: false,
    requiredFields: [
      "property_type", "home_age", "claim_type",
      "weather_conditions", "police_report", "repair_estimate"
    ]
  }
};