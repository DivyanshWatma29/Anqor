# Bulk CSV Processing & UI Clarification Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Clarify the UI to specify "Auto Insurance" and implement a resilient bulk CSV processing pipeline that uses AI to dynamically map varying column schemas to our strict 24-field standard, skipping invalid rows gracefully.

**Architecture:** We will update the frontend text to clearly indicate this is for Auto Insurance. For bulk processing, the frontend will read the first row (headers) of the CSV, send it to GPT-4o-mini via a new `mapCSVHeaders` function, and use the returned mapping to transform the remaining CSV rows into our 24-field schema. Any row missing critical numeric data will be flagged and skipped.

**Tech Stack:** React, TypeScript, InsForge AI Gateway (OpenAI GPT-4o-mini), PapaParse.

---

### Task 1: Clarify UI messaging for Auto Insurance

**Files:**
- Modify: `src/pages/LandingPage.tsx` (or similar landing/predict page headers)
- Modify: `src/components/ClaimForm.tsx`

- [ ] **Step 1: Update PredictPage title**

Modify `src/pages/PredictPage.tsx` to explicitly state "Auto Insurance".

```typescript
// Around line 92 in src/pages/PredictPage.tsx
<h1 className="text-3xl sm:text-4xl font-bold text-foreground mt-4">Auto Insurance Fraud Detection</h1>
<p className="text-muted-foreground mt-3 max-w-xl mx-auto">
  Submit auto claim details or upload an auto insurance document for AI-powered fraud analysis.
</p>
```

- [ ] **Step 2: Check TypeScript compilation**
Run `npx tsc --noEmit` and expect it to pass.

- [ ] **Step 3: Commit**
```bash
git add src/pages/PredictPage.tsx
git commit -m "feat(ui): clarify app is specifically for auto insurance claims"
```

---

### Task 2: Implement CSV Header Mapping AI Logic

**Files:**
- Modify: `src/lib/documentAI.ts`

- [ ] **Step 1: Define Header Mapping Prompt & Interface**

In `src/lib/documentAI.ts`, add the new prompt and interface for CSV mapping.

```typescript
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
```

- [ ] **Step 2: Implement `mapCSVHeaders` function**

In `src/lib/documentAI.ts`, add the function to call the AI for mapping.

```typescript
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
```

- [ ] **Step 3: Check TypeScript compilation**
Run `npx tsc --noEmit` and expect it to pass.

- [ ] **Step 4: Commit**
```bash
git add src/lib/documentAI.ts
git commit -m "feat(ai): implement CSV header mapping via GPT-4o-mini"
```

---

### Task 3: Refactor BulkCheckPage to use AI Mapping and Chunking

**Files:**
- Modify: `src/pages/BulkCheckPage.tsx`

- [ ] **Step 1: Implement AI Pre-flight Check and Mapping in BulkCheckPage**

In `src/pages/BulkCheckPage.tsx`, update the CSV processing logic to read the headers, call `mapCSVHeaders`, map the rows, flag invalid rows, and chunk the requests.

```typescript
import { mapCSVHeaders } from "@/lib/documentAI";

// Inside BulkCheckPage.tsx component, replace the handleProcess function
  const handleProcess = async () => {
    if (!file) return;
    setIsProcessing(true);
    setResult(null);

    try {
      // 1. Read the CSV
      const text = await file.text();
      const parsed = Papa.parse(text, { header: true, skipEmptyLines: true });
      const rawRows = parsed.data as Record<string, any>[];
      
      if (rawRows.length === 0) throw new Error("CSV file is empty");

      // 2. Pre-flight: Map headers
      const headers = Object.keys(rawRows[0]);
      toast.info("Analyzing CSV headers with AI...");
      const mappingResult = await mapCSVHeaders(headers);

      if (!mappingResult.success || !mappingResult.is_valid_insurance_dataset) {
        throw new Error(mappingResult.rejection_reason || mappingResult.error || "Invalid dataset");
      }

      toast.success("Headers mapped successfully! Processing rows...");
      const mapping = mappingResult.mapping || {};

      // 3. Transform rows and filter
      const transformedRows: ClaimData[] = [];
      const failedRowIndices: number[] = [];

      rawRows.forEach((row, index) => {
        const transformed: Partial<ClaimData> = {};
        let isValid = true;
        
        // Map user columns to our schema
        for (const [userCol, ourCol] of Object.entries(mapping)) {
           if (ourCol && row[userCol] !== undefined) {
              transformed[ourCol as keyof ClaimData] = row[userCol] as never;
           }
        }
        
        // Basic validation: Skip if missing completely empty
        if (Object.keys(transformed).length < 5) isValid = false;
        
        if (isValid) {
          // Fill in defaults for missing fields
          const finalRow = {
             months_as_customer: Number(transformed.months_as_customer) || 12,
             insured_sex: String(transformed.insured_sex || 'MALE'),
             insured_education_level: String(transformed.insured_education_level || 'College'),
             insured_occupation: String(transformed.insured_occupation || 'other-service'),
             insured_relationship: String(transformed.insured_relationship || 'not-in-family'),
             policy_deductable: Number(transformed.policy_deductable) || 1000,
             policy_annual_premium: Number(transformed.policy_annual_premium) || 1200,
             umbrella_limit: Number(transformed.umbrella_limit) || 0,
             policy_csl: String(transformed.policy_csl || '250/500'),
             capital_gains: Number(transformed.capital_gains) || 0,
             capital_loss: Number(transformed.capital_loss) || 0,
             incident_hour_of_the_day: Number(transformed.incident_hour_of_the_day) || 12,
             incident_type: String(transformed.incident_type || 'Single Vehicle Collision'),
             collision_type: String(transformed.collision_type || '?'),
             incident_severity: String(transformed.incident_severity || 'Minor Damage'),
             authorities_contacted: String(transformed.authorities_contacted || 'Police'),
             number_of_vehicles_involved: Number(transformed.number_of_vehicles_involved) || 1,
             bodily_injuries: Number(transformed.bodily_injuries) || 0,
             witnesses: Number(transformed.witnesses) || 0,
             injury_claim: Number(transformed.injury_claim) || 0,
             property_claim: Number(transformed.property_claim) || 0,
             vehicle_claim: Number(transformed.vehicle_claim) || 0,
             property_damage: String(transformed.property_damage || '?'),
             police_report_available: String(transformed.police_report_available || '?')
          };
          transformedRows.push(finalRow);
        } else {
          failedRowIndices.push(index + 1); // 1-based index for UI
        }
      });

      if (transformedRows.length === 0) {
        throw new Error("No valid rows found after mapping.");
      }

      // 4. Process Batch via Backend
      const batchResult = await createBatch(transformedRows, file.name);
      
      // Merge our skipped rows with backend failed rows
      setResult({
        ...batchResult,
        failedRows: [...failedRowIndices, ...batchResult.failedRows]
      });
      
    } catch (err: unknown) {
      toast.error("Processing failed", {
        description: err instanceof Error ? err.message : "Unknown error"
      });
    } finally {
      setIsProcessing(false);
    }
  };
```

- [ ] **Step 2: Check TypeScript compilation**
Run `npx tsc --noEmit` and expect it to pass.

- [ ] **Step 3: Commit**
```bash
git add src/pages/BulkCheckPage.tsx
git commit -m "feat(bulk): implement AI header mapping and row transformation"
```