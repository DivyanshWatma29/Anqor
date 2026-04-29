# Document Intelligence Pipeline Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement a resilient, single-pass document extraction pipeline that validates images/PDFs before extraction and intelligently maps data to our strict 24-field schema, rejecting invalid documents gracefully.

**Architecture:** We are updating the `documentAI.ts` pipeline to prompt GPT-4o-mini for a unified JSON object containing `is_valid_claim_form`, `rejection_reason`, and `extracted_data`. The frontend `PredictPage.tsx` will catch rejections and display them to the user via toast notifications.

**Tech Stack:** React, TypeScript, InsForge AI Gateway (OpenAI GPT-4o-mini).

---

### Task 1: Update Document AI Interfaces and Prompt

**Files:**
- Modify: `src/lib/documentAI.ts`

- [ ] **Step 1: Update the ExtractionResult Interface**

Modify `ExtractionResult` in `src/lib/documentAI.ts` to include validation flags.

```typescript
export interface ExtractionResult {
  success: boolean;
  is_valid_claim_form?: boolean;
  rejection_reason?: string | null;
  data?: ClaimData;
  raw?: string;
  error?: string;
  model: string;
}
```

- [ ] **Step 2: Update the EXTRACTION_PROMPT**

Completely rewrite the `EXTRACTION_PROMPT` in `src/lib/documentAI.ts` to enforce the tripartite JSON format and intelligent mapping.

```typescript
const EXTRACTION_PROMPT = `You are an expert insurance claim adjuster. Analyze this document (image or PDF) and determine if it is a readable, valid insurance claim or related incident report.

If the document is too blurry, completely illegible, or is NOT related to an insurance claim (e.g. a restaurant receipt, a random selfie, etc.), you MUST reject it.

If it IS a valid claim, intelligently extract the data. Map synonymous terms (e.g. "Crash Type" -> "Collision Type") to fit exactly into our schema. If a field is completely missing, use a reasonable default or 0.

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
```

- [ ] **Step 3: Commit**
```bash
git add src/lib/documentAI.ts
git commit -m "feat(ai): update extraction prompt schema for hard rejects"
```

---

### Task 2: Implement JSON Parsing for Tripartite Schema

**Files:**
- Modify: `src/lib/documentAI.ts`

- [ ] **Step 1: Rewrite `parseExtractedJSON`**

Modify `parseExtractedJSON` in `src/lib/documentAI.ts` to unwrap `extracted_data` and return the new structured result.

```typescript
function parseExtractedJSON(raw: string): { isValid: boolean; reason: string | null; data: ClaimData | null } {
  let jsonStr = raw.trim();
  const codeBlockMatch = jsonStr.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (codeBlockMatch) jsonStr = codeBlockMatch[1].trim();

  const parsed: any = JSON.parse(jsonStr);
  
  if (parsed.is_valid_claim_form === false) {
    return {
      isValid: false,
      reason: parsed.rejection_reason || "The uploaded document is not a valid or readable insurance claim.",
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
```

- [ ] **Step 2: Update `extractClaimFromFile` Returns**

In `src/lib/documentAI.ts`, update `extractClaimFromFile` to map the new parser output into the `ExtractionResult`.

```typescript
// Replace the completion block in extractClaimFromFile:
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
```

- [ ] **Step 3: Check TypeScript compilation**
Run `npx tsc --noEmit` and expect it to pass.

- [ ] **Step 4: Commit**
```bash
git add src/lib/documentAI.ts
git commit -m "feat(ai): implement validation parsing for document intelligence"
```

---

### Task 3: Update PredictPage to Handle Rejections

**Files:**
- Modify: `src/pages/PredictPage.tsx`

- [ ] **Step 1: Check `PredictPage.tsx` imports**
Verify `import { toast } from 'sonner';` exists in `src/pages/PredictPage.tsx` (it usually does in shadcn projects).

- [ ] **Step 2: Surface the Rejection Reason in PredictPage**
Inside `PredictPage.tsx`, locate the `handleFileUpload` function. When `extraction.success === false`, specifically check for `is_valid_claim_form === false` and show a distinct toast message.

```typescript
// Example target inside handleFileUpload:
      const extraction = await extractClaimFromFile(file);
      if (extraction.success && extraction.data) {
        setClaimData(extraction.data);
        toast.success("Document processed successfully!");
      } else {
        // NEW CODE: Handle the hard reject properly
        if (extraction.is_valid_claim_form === false) {
           toast.error("Document Rejected", {
             description: extraction.rejection_reason || extraction.error
           });
        } else {
           toast.error("Failed to extract data", {
             description: extraction.error || "An unexpected error occurred"
           });
        }
      }
```

- [ ] **Step 3: Check TypeScript compilation**
Run `npx tsc --noEmit` to ensure `PredictPage.tsx` compiles with the updated `ExtractionResult`.

- [ ] **Step 4: Commit**
```bash
git add src/pages/PredictPage.tsx
git commit -m "feat(ui): display hard rejection reasons on Predict page"
```
