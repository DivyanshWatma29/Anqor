import { insforge } from './insforge';
import type { ClaimData } from '@/components/ClaimForm';

const EXTRACTION_PROMPT = `You are an expert insurance claim adjuster. Analyze this document (image or PDF) and determine if it is a readable, valid auto insurance claim or related incident report.

If the document is too blurry, completely illegible, or is NOT related to an auto insurance claim (e.g. a restaurant receipt, a random selfie, etc.), you MUST reject it.

If it IS a valid auto claim, intelligently extract the data. Map synonymous terms (e.g. "Crash Type" -> "Collision Type") to fit exactly into our schema. If a field is completely missing, use a reasonable default or 0.

You MUST return ONLY valid JSON with no markdown formatting, no code blocks, and no explanations. Use this exact schema:

{
  "is_valid_claim_form": boolean,
  "rejection_reason": "string explaining why it was rejected, or null if valid",
  "extracted_data": {
    "months_as_customer": <number>,
    "insured_sex": "<MALE or FEMALE>",
    "insured_education_level": "<JD, MD, PhD, Masters, Associate, College, High School>",
    "insured_occupation": "<e.g. exec-managerial, prof-specialty, sales, tech-support, craft-repair, etc.>",
    "insured_relationship": "<husband, wife, own-child, unmarried, not-in-family, other-relative>",
    "policy_deductable": <number>,
    "policy_annual_premium": <number>,
    "umbrella_limit": <number>,
    "policy_csl": "<100/300, 250/500, 500/1000>",
    "capital_gains": <number>,
    "capital_loss": <number>,
    "incident_hour_of_the_day": <0-23>,
    "incident_type": "<Single Vehicle Collision, Multi-vehicle Collision, Vehicle Theft, Parked Car>",
    "collision_type": "<Side Collision, Rear Collision, Front Collision, ?>",
    "incident_severity": "<Minor Damage, Major Damage, Total Loss, Trivial Damage>",
    "authorities_contacted": "<Police, Fire, Ambulance, Other, None>",
    "number_of_vehicles_involved": <number>,
    "bodily_injuries": <number>,
    "witnesses": <number>,
    "injury_claim": <number>,
    "property_claim": <number>,
    "vehicle_claim": <number>,
    "property_damage": "<YES, NO, ?>",
    "police_report_available": "<YES, NO, ?>"
  }
}

Return ONLY the JSON object.`;

export interface ExtractionResult {
  success: boolean;
  is_valid_claim_form?: boolean;
  rejection_reason?: string | null;
  data?: ClaimData;
  raw?: string;
  error?: string;
  model: string;
}

export interface HeaderMappingResult {
  success: boolean;
  is_valid_insurance_dataset?: boolean;
  rejection_reason?: string | null;
  mapping?: Record<string, string>;
  error?: string;
}

const HEADER_MAPPING_PROMPT = `You are a data engineer for an auto insurance fraud detection system.
Analyze this list of CSV headers and determine if it represents an auto insurance claim dataset.

If the dataset is NOT related to auto insurance (e.g. employee salaries, grocery items, medical bills), you MUST reject it.

If it IS a valid auto insurance dataset, figure out how to map the provided CSV headers to our strict 24-field schema.

Our required 24 fields:
[months_as_customer, insured_sex, insured_education_level, insured_occupation, insured_relationship, policy_deductable, policy_annual_premium, umbrella_limit, policy_csl, capital_gains, capital_loss, incident_hour_of_the_day, incident_type, collision_type, incident_severity, authorities_contacted, number_of_vehicles_involved, bodily_injuries, witnesses, injury_claim, property_claim, vehicle_claim, property_damage, police_report_available]

Return ONLY valid JSON using this exact schema:
{
  "is_valid_insurance_dataset": boolean,
  "rejection_reason": "string explaining why it was rejected, or null if valid",
  "column_mapping": {
    "user_csv_column_name": "our_strict_24_field_name"
  }
}`;

const NUMERIC_FIELDS = new Set([
  'months_as_customer', 'policy_deductable', 'policy_annual_premium',
  'umbrella_limit', 'capital_gains', 'capital_loss',
  'incident_hour_of_the_day', 'number_of_vehicles_involved',
  'bodily_injuries', 'witnesses', 'injury_claim', 'property_claim',
  'vehicle_claim',
]);

const STRING_DEFAULTS: Record<string, string> = {
  insured_sex: 'MALE',
  insured_education_level: 'College',
  insured_occupation: 'other-service',
  insured_relationship: 'not-in-family',
  policy_csl: '250/500',
  incident_type: 'Single Vehicle Collision',
  collision_type: '?',
  incident_severity: 'Minor Damage',
  authorities_contacted: 'Police',
  property_damage: '?',
  police_report_available: '?',
};

const ALL_FIELDS = [...NUMERIC_FIELDS, ...Object.keys(STRING_DEFAULTS)];

const MAX_EXTRACTION_SIZE = 10 * 1024 * 1024;

type ChatContentPart =
  | { type: 'text'; text: string }
  | { type: 'image_url'; image_url: { url: string } }
  | { type: 'file'; file: { filename: string; file_data: string } };

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

function parseExtractedJSON(raw: string): { isValid: boolean; reason: string | null; data: ClaimData | null } {
  let jsonStr = raw.trim();
  const codeBlockMatch = jsonStr.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (codeBlockMatch) jsonStr = codeBlockMatch[1].trim();

  const parsed: any = JSON.parse(jsonStr);

  if (parsed.is_valid_claim_form === false) {
    return {
      isValid: false,
      reason: parsed.rejection_reason || "The uploaded document is not a valid or readable auto insurance claim.",
      data: null
    };
  }

  const rawData = parsed.extracted_data || parsed;
  const result: Record<string, string | number> = {};

  for (const key of ALL_FIELDS) {
    if (NUMERIC_FIELDS.has(key)) {
      result[key] = Number(rawData[key]) || 0;
    } else {
      result[key] = String(rawData[key] || STRING_DEFAULTS[key] || '');
    }
  }

  return {
    isValid: true,
    reason: null,
    data: result as unknown as ClaimData
  };
}

export async function extractClaimFromFile(file: File): Promise<ExtractionResult> {
  const modelId = 'openai/gpt-4o-mini';

  if (file.size > MAX_EXTRACTION_SIZE) {
    return { success: false, error: 'File must be under 10MB', model: modelId };
  }

  const base64 = await fileToBase64(file);
  const isPDF = file.type === 'application/pdf';

  const content: ChatContentPart[] = [
    { type: 'text', text: EXTRACTION_PROMPT },
  ];

  if (isPDF) {
    content.push({
      type: 'file',
      file: { filename: file.name, file_data: base64 },
    });
  } else {
    content.push({
      type: 'image_url',
      image_url: { url: base64 },
    });
  }

  try {
    const completion = await insforge.ai.chat.completions.create({
      model: modelId,
      messages: [{ role: 'user', content }],
      temperature: 0.1,
      maxTokens: 2000,
      ...(isPDF ? { fileParser: { enabled: true } } : {}),
    });

    const raw = completion.choices[0]?.message?.content || '';
    const parsedResult = parseExtractedJSON(raw);

    if (!parsedResult.isValid) {
      return {
        success: false,
        is_valid_claim_form: false,
        rejection_reason: parsedResult.reason,
        error: parsedResult.reason || 'Invalid document',
        model: modelId,
        raw
      };
    }

    return {
      success: true,
      is_valid_claim_form: true,
      data: parsedResult.data!,
      raw,
      model: modelId
    };
  } catch (err: unknown) {
    return { success: false, error: err instanceof Error ? err.message : 'AI extraction failed', model: modelId };
  }
}

export async function mapCSVHeaders(headers: string[]): Promise<HeaderMappingResult> {
  const modelId = 'openai/gpt-4o-mini';

  const content = [
    { type: 'text', text: HEADER_MAPPING_PROMPT },
    { type: 'text', text: "CSV Headers to analyze: " + JSON.stringify(headers) }
  ];

  try {
    const completion = await insforge.ai.chat.completions.create({
      model: modelId,
      messages: [{ role: 'user', content: content as any }],
      temperature: 0.1,
    });

    const raw = completion.choices[0]?.message?.content || '';
    let jsonStr = raw.trim();
    const codeBlockMatch = jsonStr.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (codeBlockMatch) jsonStr = codeBlockMatch[1].trim();

    const parsed = JSON.parse(jsonStr);

    if (parsed.is_valid_insurance_dataset === false) {
      return {
        success: false,
        is_valid_insurance_dataset: false,
        rejection_reason: parsed.rejection_reason || "Not a valid auto insurance dataset",
      };
    }

    return {
      success: true,
      is_valid_insurance_dataset: true,
      mapping: parsed.column_mapping || {}
    };
  } catch (err: unknown) {
    return { success: false, error: err instanceof Error ? err.message : 'AI mapping failed' };
  }
}