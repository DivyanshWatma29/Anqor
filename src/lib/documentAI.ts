import { apiFetch } from './http';
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

export async function extractClaimFromFile(file: File, category: ClaimCategory = 'auto'): Promise<ExtractionResult> {
  const modelId = 'openai/gpt-4o-mini';
  const schema = INSURANCE_SCHEMAS[category];

  if (file.size > MAX_EXTRACTION_SIZE) {
    return { success: false, error: 'File must be under 10MB', model: modelId };
  }

  try {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('category', category);
    formData.append('schemaLabel', schema.label);
    formData.append('requiredFields', JSON.stringify(schema.requiredFields));

    return await apiFetch<ExtractionResult>('/api/v1/document/extract', {
      method: 'POST',
      body: formData,
    });
  } catch (err: unknown) {
    return { success: false, error: err instanceof Error ? err.message : 'AI extraction failed', model: modelId };
  }
}

export async function mapCSVHeaders(headers: string[], category: ClaimCategory = 'auto'): Promise<HeaderMappingResult> {
  const modelId = 'openai/gpt-4o-mini';
  const schema = INSURANCE_SCHEMAS[category];

  try {
    return await apiFetch<HeaderMappingResult>('/api/v1/document/map-headers', {
      method: 'POST',
      body: JSON.stringify({
        headers,
        category,
        schemaLabel: schema.label,
        requiredFields: schema.requiredFields,
      }),
    });
  } catch (err: unknown) {
    return { success: false, error: err instanceof Error ? err.message : 'AI mapping failed' };
  }
}
