import { insforge } from './insforge';
import type { ClaimData } from '@/components/ClaimForm';

const EXTRACTION_PROMPT = `You are an insurance claim data extractor. Analyze this document (image or PDF of an insurance claim form) and extract exactly these 24 fields. Return ONLY valid JSON with no markdown formatting, no code blocks, no explanation.

Required fields (use exact keys):
{
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

Rules:
- If a field is not found in the document, use a reasonable default
- For numeric fields, extract the number only (no $ or commas)
- For categorical fields, use EXACTLY one of the allowed values listed above
- Return ONLY the JSON object, nothing else`;

export interface ExtractionResult {
  success: boolean;
  data?: ClaimData;
  raw?: string;
  error?: string;
  model: string;
}

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

function parseExtractedJSON(raw: string): ClaimData {
  let jsonStr = raw.trim();
  const codeBlockMatch = jsonStr.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (codeBlockMatch) jsonStr = codeBlockMatch[1].trim();

  const parsed: Record<string, unknown> = JSON.parse(jsonStr);

  const result: Record<string, string | number> = {};
  for (const key of ALL_FIELDS) {
    if (NUMERIC_FIELDS.has(key)) {
      result[key] = Number(parsed[key]) || 0;
    } else {
      result[key] = String(parsed[key] || STRING_DEFAULTS[key] || '');
    }
  }
  return result as unknown as ClaimData;
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
    const data = parseExtractedJSON(raw);

    return { success: true, data, raw, model: modelId };
  } catch (err: unknown) {
    return { success: false, error: err instanceof Error ? err.message : 'AI extraction failed', model: modelId };
  }
}
