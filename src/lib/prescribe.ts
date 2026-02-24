import OpenAI from 'openai';
import { Detection, Prescription, PrescriptionIssue, PrescriptionAction, YieldImpact } from './types';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const SYSTEM_PROMPT = `You are an expert agronomist analyzing aerial drone imagery of crop fields.
You receive YOLO object detection results (class, confidence, bounding box) along with the original drone image.

Your job is to translate raw detections into actionable, dollar-value prescriptions that farmers can act on immediately.

Respond with a JSON object matching this exact schema:
{
  "summary": "1-2 sentence plain-English overview of field health",
  "overallHealthGrade": "A|B|C|D|F",
  "issues": [
    {
      "class": "detection class name",
      "severity": "low|medium|high|critical",
      "affectedAcres": number,
      "description": "What this means in plain English",
      "detectionCount": number,
      "avgConfidence": number
    }
  ],
  "prescriptions": [
    {
      "action": "What to do",
      "product": "Specific product/chemical name",
      "rate": "Application rate (e.g. '29 oz/acre')",
      "timing": "When to apply (e.g. 'Within 7 days')",
      "estimatedCostPerAcre": number,
      "priority": 1-5,
      "zone": "Which zone/area"
    }
  ],
  "yieldImpact": {
    "riskLevel": "low|moderate|high|severe",
    "estimatedLossPerAcre": number,
    "preventionWindow": "How long before irreversible damage",
    "totalEstimatedLoss": number
  },
  "totalEstimatedCost": number
}

Key principles:
- Be specific about products, rates, and timing (farmers need actionable info, not vague advice)
- Estimate costs using current market prices for herbicides, fungicides, fertilizers
- Translate detection classes to real agronomic conditions
- Consider the image context (crop type, growth stage, field conditions visible)
- Prioritize by economic impact — address the most expensive problems first
- If field info (crop type, acreage) is provided, use it for more accurate estimates`;

interface PrescribeOptions {
  imageBase64?: string;
  detections: Detection[];
  fieldInfo?: {
    crop?: string;
    acres?: number;
    location?: string;
  };
}

export async function generatePrescription(options: PrescribeOptions): Promise<Prescription> {
  const { imageBase64, detections, fieldInfo } = options;

  // Summarize detections for the prompt
  const detectionSummary = summarizeDetections(detections);

  const userMessage = `Analyze this drone image and the following YOLO detection results:

**Detection Summary:**
${detectionSummary}

**Raw Detections:**
${JSON.stringify(detections, null, 2)}

${fieldInfo ? `**Field Info:**
- Crop: ${fieldInfo.crop || 'Unknown'}
- Acreage: ${fieldInfo.acres || 'Unknown'}
- Location: ${fieldInfo.location || 'Unknown'}` : ''}

Generate a complete prescription report with specific products, rates, costs, and timing.`;

  // Build message content — include image if available
  const content: Array<{ type: string; text?: string; image_url?: { url: string; detail: string } }> = [
    { type: 'text', text: userMessage },
  ];
  if (imageBase64) {
    content.push({
      type: 'image_url',
      image_url: {
        url: imageBase64.startsWith('data:')
          ? imageBase64
          : `data:image/jpeg;base64,${imageBase64}`,
        detail: 'high',
      },
    });
  }

  const response = await openai.chat.completions.create({
    model: 'gpt-5-mini',
    max_completion_tokens: 4096,
    response_format: { type: 'json_object' },
    messages: [
      { role: 'system', content: SYSTEM_PROMPT },
      { role: 'user', content: content as any },
    ],
  });

  const content = response.choices[0]?.message?.content;
  if (!content) {
    throw new Error('No response from GPT-5 vision');
  }

  const parsed = JSON.parse(content);

  return {
    summary: parsed.summary || 'Analysis complete',
    overallHealthGrade: parsed.overallHealthGrade || 'C',
    issues: (parsed.issues || []) as PrescriptionIssue[],
    prescriptions: (parsed.prescriptions || []) as PrescriptionAction[],
    yieldImpact: (parsed.yieldImpact || {
      riskLevel: 'moderate',
      estimatedLossPerAcre: 0,
      preventionWindow: 'Unknown',
      totalEstimatedLoss: 0,
    }) as YieldImpact,
    totalEstimatedCost: parsed.totalEstimatedCost || 0,
    generatedAt: new Date().toISOString(),
  };
}

function summarizeDetections(detections: Detection[]): string {
  const byClass: Record<string, { count: number; totalConf: number }> = {};
  for (const d of detections) {
    if (!byClass[d.class]) byClass[d.class] = { count: 0, totalConf: 0 };
    byClass[d.class].count++;
    byClass[d.class].totalConf += d.confidence;
  }

  const lines = Object.entries(byClass).map(([cls, info]) => {
    const avgConf = (info.totalConf / info.count * 100).toFixed(1);
    return `- ${cls}: ${info.count} detections (avg confidence: ${avgConf}%)`;
  });

  return lines.length > 0
    ? lines.join('\n')
    : 'No stress detections found — field appears healthy.';
}
