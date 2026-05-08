export type ClaimCategory = "auto" | "health" | "travel" | "property" | "life" | "business" | "liability";

export interface FieldDefinition {
  name: string;
  label: string;
  type: "number" | "text" | "select";
  options?: (string | number)[];
  defaultValue?: string | number;
  placeholder?: string;
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
  requiredFields: string[];
  fieldGroups: FieldGroup[];
}

// All field definitions below are synced from ml-service/models/<type>/feature_config.json
// DO NOT modify options manually — they must match what the models were trained on.

// ─── Health Insurance (16 user fields) ───

const healthFieldGroups: FieldGroup[] = [
  {
    title: "Patient Information",
    description: "Patient demographics",
    icon: "user",
    fields: [
      { name: "Patient_Age", label: "Patient Age", type: "number", defaultValue: 45, placeholder: "e.g. 45" },
      { name: "Patient_Gender", label: "Patient Gender", type: "select", options: ["Male", "Female"] },
      { name: "Patient_State", label: "Patient State", type: "select", options: ["CA", "FL", "GA", "IL", "NY", "OH", "PA", "TX"] },
      { name: "Chronic_Condition_Flag", label: "Chronic Condition", type: "select", options: ["0", "1"] },
      { name: "Prior_Visits_12m", label: "Prior Visits (12 months)", type: "number", defaultValue: 2, placeholder: "e.g. 2" },
    ],
  },
  {
    title: "Provider Details",
    description: "Healthcare provider information",
    icon: "file",
    fields: [
      { name: "Provider_Specialty", label: "Provider Specialty", type: "select", options: ["Cardiology", "General Practice", "Internal Medicine", "Neurology", "Orthopedics", "Pulmonology"] },
      { name: "Number_of_Claims_Per_Provider_Monthly", label: "Provider Monthly Claims", type: "number", defaultValue: 30, placeholder: "e.g. 30" },
    ],
  },
  {
    title: "Medical Details",
    description: "Diagnosis, procedure, and stay information",
    icon: "clipboard",
    fields: [
      { name: "Diagnosis_Code", label: "Diagnosis Code (ICD-10)", type: "select", options: ["E11.9", "E78.5", "F41.9", "I10", "I25.10", "J06.9", "J18.9", "K21.9", "M54.5", "N39.0"] },
      { name: "Procedure_Code", label: "Procedure Code (CPT)", type: "select", options: [36415, 71046, 80053, 85025, 87086, 93000, 97110, 99213, 99214] },
      { name: "Insurance_Type", label: "Insurance Type", type: "select", options: ["Medicaid", "Medicare", "Private", "Self-Pay"] },
      { name: "Visit_Type", label: "Visit Type", type: "select", options: ["Emergency", "Inpatient", "Outpatient"] },
      { name: "Length_of_Stay", label: "Length of Stay (days)", type: "number", defaultValue: 3, placeholder: "e.g. 3" },
      { name: "Days_Between_Service_and_Claim", label: "Days Between Service & Claim", type: "number", defaultValue: 10, placeholder: "e.g. 10" },
    ],
  },
  {
    title: "Claim Financials",
    description: "Amounts and claim status",
    icon: "dollar",
    fields: [
      { name: "Claim_Amount", label: "Claim Amount ($)", type: "number", defaultValue: 5000, placeholder: "e.g. 5000" },
      { name: "Approved_Amount", label: "Approved Amount ($)", type: "number", defaultValue: 4500, placeholder: "e.g. 4500" },
      { name: "Claim_Status", label: "Claim Status", type: "select", options: ["Approved", "Pending", "Rejected"] },
    ],
  },
];

// ─── Travel Insurance (10 user fields) ───

const travelFieldGroups: FieldGroup[] = [
  {
    title: "Agency & Distribution",
    description: "Booking source information",
    icon: "file",
    fields: [
      { name: "agency_type", label: "Agency Type", type: "select", options: ["Airlines", "Travel Agency"] },
      { name: "distribution_channel", label: "Distribution Channel", type: "select", options: ["Offline", "Online"] },
      { name: "product_name", label: "Product Name", type: "select", options: ["1 way Comprehensive Plan", "2 way Comprehensive Plan", "24 Protect", "Annual Gold Plan", "Annual Silver Plan", "Annual Travel Protect Gold", "Annual Travel Protect Platinum", "Annual Travel Protect Silver", "Basic Plan", "Bronze Plan", "Cancellation Plan", "Child Comprehensive Plan", "Comprehensive Plan", "Gold Plan", "Individual Comprehensive Plan", "Premier Plan", "Rental Vehicle Excess Insurance", "Silver Plan", "Single Trip Travel Protect Gold", "Single Trip Travel Protect Platinum", "Single Trip Travel Protect Silver", "Spouse or Parents Comprehensive Plan", "Ticket Protector", "Travel Cruise Protect", "Travel Cruise Protect Family", "Value Plan"] },
      { name: "agency_name", label: "Agency Name", type: "select", options: ["ADM", "ART", "C2B", "CBH", "CCR", "CSR", "CWT", "EPX", "JWT", "JZI", "KML", "LWC", "RAB", "SSI", "TST", "TTW"] },
    ],
  },
  {
    title: "Trip Details",
    description: "Destination and duration",
    icon: "alert",
    fields: [
      { name: "duration", label: "Duration (Days)", type: "number", defaultValue: 7, placeholder: "e.g. 7" },
      { name: "destination", label: "Destination", type: "select", options: ["ALBANIA", "ANGOLA", "ARGENTINA", "ARMENIA", "AUSTRALIA", "AUSTRIA", "AZERBAIJAN", "BAHRAIN", "BANGLADESH", "BARBADOS", "BELARUS", "BELGIUM", "BENIN", "BERMUDA", "BHUTAN", "BOLIVIA", "BOSNIA AND HERZEGOVINA", "BOTSWANA", "BRAZIL", "BRUNEI DARUSSALAM", "BULGARIA", "CAMBODIA", "CAMEROON", "CANADA", "CAYMAN ISLANDS", "CHILE", "CHINA", "COLOMBIA", "COSTA RICA", "CROATIA"] },
      { name: "age", label: "Traveler Age", type: "number", defaultValue: 30, placeholder: "e.g. 30" },
      { name: "gender", label: "Gender", type: "select", options: ["M", "F"] },
    ],
  },
  {
    title: "Financial Details",
    description: "Sales and commission amounts",
    icon: "dollar",
    fields: [
      { name: "net_sales", label: "Net Sales ($)", type: "number", defaultValue: 100, placeholder: "e.g. 100" },
      { name: "commission", label: "Commission ($)", type: "number", defaultValue: 20, placeholder: "e.g. 20" },
    ],
  },
];

// ─── Property Insurance (6 user fields) ───

const propertyFieldGroups: FieldGroup[] = [
  {
    title: "Property Information",
    description: "Details about the insured property",
    icon: "file",
    fields: [
      { name: "property_type", label: "Property Type", type: "select", options: ["Commercial", "Industrial", "Residential"] },
      { name: "home_age", label: "Property Age (Years)", type: "number", defaultValue: 15, placeholder: "e.g. 15" },
    ],
  },
  {
    title: "Claim Details",
    description: "Incident and damage information",
    icon: "alert",
    fields: [
      { name: "claim_type", label: "Claim Type", type: "select", options: ["Burglary", "Fire", "Structural", "Water", "Weather"] },
      { name: "weather_conditions", label: "Weather Conditions", type: "select", options: ["Hurricane", "Normal", "Snow", "Storm"] },
      { name: "police_report", label: "Police Report Filed", type: "select", options: ["YES", "NO", "?"] },
      { name: "repair_estimate", label: "Repair Estimate ($)", type: "number", defaultValue: 10000, placeholder: "e.g. 10000" },
    ],
  },
];

// ─── Life Insurance (4 user fields) ───

const lifeFieldGroups: FieldGroup[] = [
  {
    title: "Policy Details",
    description: "Life insurance policy information",
    icon: "shield",
    fields: [
      { name: "policy_duration_months", label: "Policy Duration (Months)", type: "number", defaultValue: 24, placeholder: "e.g. 24" },
      { name: "medical_history_disclosed", label: "Medical History Disclosed", type: "select", options: ["YES", "NO"] },
    ],
  },
  {
    title: "Claim Information",
    description: "Details about the life claim",
    icon: "alert",
    fields: [
      { name: "cause_of_death", label: "Cause of Death", type: "select", options: ["Accident", "Homicide", "Natural", "Unknown"] },
      { name: "nominee_relationship", label: "Nominee Relationship", type: "select", options: ["Child", "Other", "Spouse", "Unknown"] },
    ],
  },
];

// ─── Auto Insurance (27 user fields — synced from feature_config.json) ───

const autoFieldGroups: FieldGroup[] = [
  {
    title: "Customer Profile",
    description: "Insured person information",
    icon: "user",
    fields: [
      { name: "months_as_customer", label: "Months as Customer", type: "number", defaultValue: 12, placeholder: "e.g. 12" },
      { name: "insured_sex", label: "Sex", type: "select", options: ["FEMALE", "MALE"] },
      { name: "insured_education_level", label: "Education Level", type: "select", options: ["Associate", "College", "High School", "JD", "MD", "Masters", "PhD"] },
      { name: "insured_occupation", label: "Occupation", type: "select", options: ["adm-clerical", "armed-forces", "craft-repair", "exec-managerial", "farming-fishing", "handlers-cleaners", "machine-op-inspct", "other-service", "priv-house-serv", "prof-specialty", "protective-serv", "sales", "tech-support", "transport-moving"] },
      { name: "insured_hobbies", label: "Hobbies", type: "select", options: ["base-jumping", "basketball", "board-games", "bungie-jumping", "camping", "chess", "cross-fit", "dancing", "exercise", "golf", "hiking", "kayaking", "movies", "paintball", "polo", "reading", "skydiving", "sleeping", "video-games", "yachting"] },
      { name: "insured_relationship", label: "Relationship", type: "select", options: ["husband", "not-in-family", "other-relative", "own-child", "unmarried", "wife"] },
    ],
  },
  {
    title: "Policy Details",
    description: "Insurance policy configuration",
    icon: "file",
    fields: [
      { name: "policy_csl", label: "Policy CSL", type: "select", options: ["100/300", "250/500", "500/1000"] },
      { name: "policy_deductable", label: "Deductible ($)", type: "number", defaultValue: 1000, placeholder: "e.g. 1000" },
      { name: "policy_annual_premium", label: "Annual Premium ($)", type: "number", defaultValue: 1200, placeholder: "e.g. 1200" },
      { name: "umbrella_limit", label: "Umbrella Limit", type: "number", placeholder: "e.g. 0" },
    ],
  },
  {
    title: "Financial Indicators",
    description: "Capital gains and losses",
    icon: "dollar",
    fields: [
      { name: "capital_gains", label: "Capital Gains ($)", type: "number", placeholder: "e.g. 0" },
      { name: "capital_loss", label: "Capital Loss ($)", type: "number", placeholder: "e.g. 0" },
    ],
  },
  {
    title: "Incident Information",
    description: "Details about the reported incident",
    icon: "alert",
    fields: [
      { name: "incident_hour_of_the_day", label: "Incident Hour (0-23)", type: "number", defaultValue: 12, placeholder: "0-23" },
      { name: "incident_type", label: "Incident Type", type: "select", options: ["Multi-vehicle Collision", "Parked Car", "Single Vehicle Collision", "Vehicle Theft"] },
      { name: "collision_type", label: "Collision Type", type: "select", options: ["Front Collision", "Rear Collision", "Side Collision"] },
      { name: "incident_severity", label: "Severity", type: "select", options: ["Major Damage", "Minor Damage", "Total Loss", "Trivial Damage"] },
      { name: "authorities_contacted", label: "Authorities Contacted", type: "select", options: ["Ambulance", "Fire", "Other", "Police"] },
      { name: "number_of_vehicles_involved", label: "Vehicles Involved", type: "number", defaultValue: 1, placeholder: "e.g. 1" },
      { name: "bodily_injuries", label: "Bodily Injuries", type: "number", placeholder: "e.g. 0" },
      { name: "witnesses", label: "Witnesses", type: "number", defaultValue: 1, placeholder: "e.g. 1" },
    ],
  },
  {
    title: "Vehicle Details",
    description: "Vehicle information",
    icon: "clipboard",
    fields: [
      { name: "auto_make", label: "Auto Make", type: "select", options: ["Accura", "Audi", "BMW", "Chevrolet", "Dodge", "Ford", "Honda", "Jeep", "Mercedes", "Nissan", "Saab", "Suburu", "Toyota", "Volkswagen"] },
      { name: "auto_year", label: "Auto Year", type: "number", defaultValue: 2015, placeholder: "e.g. 2015" },
    ],
  },
  {
    title: "Claim Details",
    description: "Claim amounts and documentation",
    icon: "dollar",
    fields: [
      { name: "injury_claim", label: "Injury Claim ($)", type: "number", defaultValue: 5000, placeholder: "e.g. 5000" },
      { name: "property_claim", label: "Property Claim ($)", type: "number", defaultValue: 10000, placeholder: "e.g. 10000" },
      { name: "vehicle_claim", label: "Vehicle Claim ($)", type: "number", defaultValue: 15000, placeholder: "e.g. 15000" },
      { name: "property_damage", label: "Property Damage", type: "select", options: ["NO", "YES"] },
      { name: "police_report_available", label: "Police Report", type: "select", options: ["NO", "YES"] },
    ],
  },
];

// ─── Schema Registry ───

export const INSURANCE_SCHEMAS: Record<ClaimCategory, InsuranceSchema> = {
  auto: {
    id: "auto",
    label: "Auto Insurance",
    description: "Detect fraud in vehicle collisions, theft, and property damage. Trained on 1,000 real claims with 30 features.",
    isAvailable: true,
    requiredFields: [
      "months_as_customer", "insured_sex", "insured_education_level", "insured_occupation",
      "insured_hobbies", "insured_relationship", "policy_csl", "policy_deductable",
      "policy_annual_premium", "umbrella_limit", "capital_gains", "capital_loss",
      "incident_hour_of_the_day", "incident_type", "collision_type", "incident_severity",
      "authorities_contacted", "number_of_vehicles_involved", "bodily_injuries", "witnesses",
      "auto_make", "auto_year", "injury_claim", "property_claim", "vehicle_claim",
      "property_damage", "police_report_available"
    ],
    fieldGroups: autoFieldGroups,
  },
  health: {
    id: "health",
    label: "Health Insurance",
    description: "Detect Medicare/healthcare billing fraud. Trained on 10,000 real claims with 21 features.",
    isAvailable: true,
    requiredFields: [
      "Patient_Age", "Patient_Gender", "Patient_State", "Chronic_Condition_Flag",
      "Prior_Visits_12m", "Provider_Specialty", "Number_of_Claims_Per_Provider_Monthly",
      "Diagnosis_Code", "Procedure_Code", "Insurance_Type", "Visit_Type",
      "Length_of_Stay", "Days_Between_Service_and_Claim",
      "Claim_Amount", "Approved_Amount", "Claim_Status"
    ],
    fieldGroups: healthFieldGroups,
  },
  travel: {
    id: "travel",
    label: "Travel Insurance",
    description: "Detect fraudulent trip cancellation and delay claims. Trained on 63,000 real claims with 15 features.",
    isAvailable: true,
    requiredFields: [
      "agency_type", "distribution_channel", "product_name", "agency_name",
      "duration", "destination", "age", "gender", "net_sales", "commission"
    ],
    fieldGroups: travelFieldGroups,
  },
  property: {
    id: "property",
    label: "Property / Home Insurance",
    description: "Detect fraud in homeowners and commercial property claims. Trained on 5,000 claims with 10 features.",
    isAvailable: true,
    requiredFields: [
      "property_type", "home_age", "claim_type", "weather_conditions",
      "police_report", "repair_estimate"
    ],
    fieldGroups: propertyFieldGroups,
  },
  life: {
    id: "life",
    label: "Life Insurance",
    description: "Detect fake deaths and contestable period fraud. Trained on 5,000 claims with 7 features.",
    isAvailable: true,
    requiredFields: [
      "policy_duration_months", "cause_of_death", "nominee_relationship",
      "medical_history_disclosed"
    ],
    fieldGroups: lifeFieldGroups,
  },
  business: {
    id: "business",
    label: "Business Interruption",
    description: "Detect exaggerated revenue loss and commercial claims.",
    isAvailable: false,
    requiredFields: [],
    fieldGroups: [],
  },
  liability: {
    id: "liability",
    label: "Liability Insurance",
    description: "Detect fraudulent injury or property damage claims.",
    isAvailable: false,
    requiredFields: [],
    fieldGroups: [],
  },
};
