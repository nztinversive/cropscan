# Task: Build GPT-5 Vision Prescription Pipeline

Add a new API route `/api/prescribe` and update the analyze route to include prescriptions.

## What to build:

### 1. New file: `src/lib/prescribe.ts`
- Export `generatePrescription(imageBase64: string, detections: Detection[]): Promise<Prescription>`
- Uses OpenAI GPT-5 vision (`gpt-5-mini`) to analyze the drone image + YOLO detections
- System prompt: "You are an expert agronomist analyzing aerial drone imagery of crop fields. Given YOLO detection results and the original image, provide actionable prescriptions."
- Returns structured JSON with:
  - `summary`: 1-2 sentence overview
  - `issues`: array of `{ class, severity (low/medium/high/critical), affectedArea (acres estimate), description }`
  - `prescriptions`: array of `{ action, product, rate, timing, estimatedCost, priority (1-5) }`
  - `yieldImpact`: `{ riskLevel, estimatedLossPerAcre, preventionWindow }`
  - `overallHealthGrade`: A/B/C/D/F
- Use `max_completion_tokens` (NOT `max_tokens`), do NOT set temperature
- OpenAI key from `process.env.OPENAI_API_KEY`

### 2. New API route: `src/app/api/prescribe/route.ts`
- POST endpoint accepting `{ imageBase64: string, detections: Detection[], fieldInfo?: { crop, acres, location } }`
- Calls `generatePrescription()`
- Returns the prescription JSON
- Add proper error handling

### 3. Update `src/lib/types.ts`
- Add `Prescription`, `PrescriptionIssue`, `PrescriptionAction`, `YieldImpact` types

### 4. New component: `src/components/PrescriptionReport.tsx`
- Displays the prescription as a professional report card
- Sections: Health Grade (big letter), Issues Found (severity badges), Recommended Actions (table with product/rate/cost), Yield Risk Assessment, Total Estimated Cost
- Use Tailwind, match existing CropScan dark theme
- Green/yellow/orange/red color coding by severity

### 5. Update the analyze page to show prescriptions
- After YOLO analysis completes, add a "Generate Prescription" button
- When clicked, sends image + detections to `/api/prescribe`
- Shows PrescriptionReport component with results
- Loading state while GPT processes

## Important:
- Use `gpt-5-mini` model (NOT gpt-4o)
- Use `max_completion_tokens` (NOT `max_tokens`)
- Do NOT set temperature parameter
- OpenAI npm package: `openai` (add to dependencies if not present)
- Image goes as base64 data URL in the vision message
- Keep the response_format as json_object for structured output
