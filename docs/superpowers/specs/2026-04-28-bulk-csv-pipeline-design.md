# Bulk CSV Processing Pipeline Design

## Overview
A resilient bulk CSV processing pipeline that uses AI to dynamically map varying column schemas to our strict 24-field standard, skips invalid rows gracefully, and processes large datasets via frontend chunking to prevent server overloads.

## Architecture & Data Flow
1. **Input:** User uploads a CSV file via the frontend `BulkCheckPage.tsx`.
2. **Pre-flight & AI Header Mapping:**
   - The frontend reads only the first row (the headers) of the CSV.
   - These headers are sent to the InsForge AI Gateway (GPT-4o-mini).
   - The AI evaluates if the headers represent an insurance claim dataset. If not, the file is **Hard Rejected**.
   - If valid, the AI returns a JSON mapping object (e.g., `{"car_damage": "vehicle_claim", "gender": "insured_sex"}`).
3. **Data Transformation:**
   - The frontend parses the rest of the CSV.
   - It uses the AI's mapping object to transform the user's data into our strict 24-field `ClaimData` objects.
4. **Chunked Processing:**
   - The frontend slices the transformed rows into chunks of 50.
   - It sends these chunks sequentially to the backend (via `createBatch`), updating a progress bar in the UI.
5. **Validation (Flag and Skip):**
   - As rows are processed, any row missing critical numeric/categorical data after transformation is flagged as a "Failed Row" and skipped.
   - Valid rows are sent to the ML service for prediction.
6. **Result Delivery:**
   - The UI displays the aggregate results (Total Processed, Fraud Detected).
   - It also provides a distinct list of "Failed Rows" (e.g., "Row 14, Row 89 skipped due to missing data") so the adjuster can review them manually.

## Prompt Engineering for Schema Mapping
The AI mapping prompt will request a JSON output:
```json
{
  "is_valid_insurance_dataset": true,
  "rejection_reason": null,
  "column_mapping": {
    "user_csv_column_name": "our_strict_24_field_name"
  }
}
```

## Error Handling
- **Non-Insurance CSVs:** Immediately halted at step 2 with a UI toast explaining the rejection.
- **Network Interruptions:** Because processing is chunked, if a network error occurs mid-batch, the UI will halt and allow the user to "Resume" or explicitly show which rows succeeded before the crash.
- **Missing Data:** Caught at the row level; triggers the Flag and Skip mechanism.

## Implementation Steps
1. Create a new AI mapping function `mapCSVHeaders` in `src/lib/documentAI.ts`.
2. Refactor `BulkCheckPage.tsx` to include the pre-flight header mapping step.
3. Implement the chunking logic (e.g., `for (let i = 0; i < rows.length; i += 50)`) within the upload handler.
4. Update `api.ts` `createBatch` to properly track and return `failedRows` based on data validation before hitting the Flask API.