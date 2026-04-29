import { insforge } from './insforge';
import type { ClaimData } from '@/components/ClaimForm';
import { INSURANCE_SCHEMAS, type ClaimCategory } from '@/schemas/insuranceTypes';

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

function buildExtractionPrompt(category: ClaimCategory): string {
  const schema = INSURANCE_SCHEMAS[category];
  return `You are an expert insurance claim adjuster. Analyze this document (image or PDF) and determine if it is a readable, valid ${schema.label} claim or related incident report.

If the document is too blurry, completely illegible, or is NOT related to a ${schema.label} claim (e.g. a restaurant receipt, a random selfie, etc.), you MUST reject it.

If it IS a valid ${schema.label} claim, intelligently extract the data. Map synonymous terms to fit exactly into our schema. If a field is completely missing, use a reasonable default or 0.

You MUST return ONLY valid JSON with no markdown formatting, no code blocks, and no explanations. Use this exact schema:

{
  "is_valid_claim_form": boolean,
  "rejection_reason": "string explaining why it was rejected, or null if valid",
  "extracted_data": {
    // Exact fields based on ${schema.label}:
    ${schema.requiredFields.map(f => `"${f}": <value>`).join(',\n    ')}
  }
}

Return ONLY the JSON object.`;
}

function buildHeaderMappingPrompt(category: ClaimCategory): string {
  const schema = INSURANCE_SCHEMAS[category];
  return `You are a data engineer for an insurance fraud detection system.
Analyze this list of CSV headers and determine if it represents a ${schema.label} dataset.

If the dataset is NOT related to ${schema.label} (e.g. employee salaries, grocery items, medical bills), you MUST reject it.

If it IS a valid ${schema.label} dataset, figure out how to map the provided CSV headers to our strict field schema.

Our required fields:
[${schema.requiredFields.join(', ')}]

Return ONLY valid JSON using this exact schema:
{
  "is_valid_insurance_dataset": boolean,
  "rejection_reason": "string explaining why it was rejected, or null if valid",
  "column_mapping": {
    "user_csv_column_name": "our_strict_field_name"
  }
}`;
}

export async function extractClaimFromFile(file: File, category: ClaimCategory = 'auto'): Promise<ExtractionResult> {
  const modelId = 'openai/gpt-4o-mini';

  if (file.size > MAX_EXTRACTION_SIZE) {
    return { success: false, error: 'File must be under 10MB', model: modelId };
  }

  const base64 = await fileToBase64(file);
  const isPDF = file.type === 'application/pdf';

  const content: ChatContentPart[] = [
    { type: 'text', text: buildExtractionPrompt(category) },
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

    let jsonStr = raw.trim();
    const codeBlockMatch = jsonStr.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (codeBlockMatch) jsonStr = codeBlockMatch[1].trim();

    const parsed = JSON.parse(jsonStr) as Record<string, unknown>;

    if (parsed.is_valid_claim_form === false) {
      return {
        success: false,
        is_valid_claim_form: false,
        rejection_reason: parsed.rejection_reason as string || `The uploaded document is not a valid or readable ${INSURANCE_SCHEMAS[category].label} claim.`,
        error: parsed.rejection_reason as string || 'Invalid document',
        model: modelId,
        raw
      };
    }

    return {
      success: true,
      is_valid_claim_form: true,
      data: (parsed.extracted_data || parsed) as ClaimData,
      raw,
      model: modelId
    };
  } catch (err: unknown) {
    return { success: false, error: err instanceof Error ? err.message : 'AI extraction failed', model: modelId };
  }
}

export async function mapCSVHeaders(headers: string[], category: ClaimCategory = 'auto'): Promise<HeaderMappingResult> {
  const modelId = 'openai/gpt-4o-mini';

  const content = [
    { type: 'text', text: buildHeaderMappingPrompt(category) },
    { type: 'text', text: "CSV Headers to analyze: " + JSON.stringify(headers) }
  ];

  try {
    const completion = await insforge.ai.chat.completions.create({
      model: modelId,
      messages: [{ role: 'user', content: content as string }],
      temperature: 0.1,
    });

    const raw = completion.choices[0]?.message?.content || '';
    let jsonStr = raw.trim();
    const codeBlockMatch = jsonStr.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (codeBlockMatch) jsonStr = codeBlockMatch[1].trim();

    const parsed = JSON.parse(jsonStr) as Record<string, unknown>;

    if (parsed.is_valid_insurance_dataset === false) {
      return {
        success: false,
        is_valid_insurance_dataset: false,
        rejection_reason: (parsed.rejection_reason as string) || `Not a valid ${INSURANCE_SCHEMAS[category].label} dataset`,
      };
    }

    return {
      success: true,
      is_valid_insurance_dataset: true,
      mapping: (parsed.column_mapping as Record<string, string>) || {}
    };
  } catch (err: unknown) {
    return { success: false, error: err instanceof Error ? err.message : 'AI mapping failed' };
  }
}
