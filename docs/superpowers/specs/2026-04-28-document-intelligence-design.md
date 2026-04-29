# Document Intelligence Pipeline Design

## Overview
A resilient, single-pass document extraction pipeline using GPT-4o-mini to process uploaded images and PDFs of insurance claims. The pipeline addresses data quality issues by validating document relevance/readability before extracting data, and intelligently maps varying insurance terminology to our strict 24-field schema.

## Architecture & Data Flow
1. **Input:** User uploads an image or PDF via the frontend `<ClaimForm />`.
2. **Validation (Pre-flight):** File size is checked against a 10MB limit.
3. **AI Processing (Single-Pass):** File is encoded to base64 and sent to InsForge AI Gateway (GPT-4o-mini) alongside a structured extraction prompt.
4. **AI Output:** The model returns a strictly formatted JSON object containing validation metadata and the extracted payload.
5. **Frontend Handling:**
   - **Hard Reject:** If `is_valid_claim_form` is `false`, the extraction halts and the UI displays the `rejection_reason` to the user (e.g., "The image is too blurry" or "This is a W-2 tax form, not an insurance claim").
   - **Success:** If `true`, the `extracted_data` is parsed, normalized, and injected into the `<ClaimForm />` state for user review prior to ML prediction.

## Prompt Engineering & Intelligent Mapping
The extraction prompt is designed to handle schema mismatch and semantic variations:
- Instructs the LLM to act as an expert adjuster capable of mapping synonymous terms (e.g., "Crash Type" -> "Collision Type").
- Mandates strict adherence to allowed categorical values.
- Instructs the LLM to evaluate readability and document context.

### Expected JSON Schema
```json
{
  "is_valid_claim_form": true/false,
  "rejection_reason": "string (if invalid) or null",
  "extracted_data": {
    // 24 strictly typed fields matching ClaimData interface
  }
}
```

## Error Handling & Normalization
- **Parsing Fallbacks:** The `parseExtractedJSON` function intercepts the `extracted_data` payload. If the LLM hallucinates a string in a numeric field, it forces a cast or defaults to `0`.
- **Missing Data:** If the LLM determines a field is completely missing from the document, it falls back to predefined reasonable defaults (e.g., `STRING_DEFAULTS`).
- **Malformed JSON:** Regex extraction is used to strip markdown code blocks (````json ... ````) before calling `JSON.parse`. If parsing fails entirely, a generic error is surfaced to the user.

## Implementation Steps
1. Update `EXTRACTION_PROMPT` in `src/lib/documentAI.ts` to enforce the new tripartite JSON schema and intelligent mapping rules.
2. Update the `ExtractionResult` interface to support `is_valid_claim_form` and `rejection_reason`.
3. Modify `parseExtractedJSON` to unwrap the new JSON structure and handle the validation flags.
4. Update `<ClaimForm />` to surface the `rejection_reason` using a toast or alert component when an invalid document is uploaded.