import { execSync } from 'child_process';
import { existsSync } from 'fs';
import { writeFile, unlink, readFile } from 'fs/promises';
import os from 'os';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { NextRequest, NextResponse } from 'next/server';
import { addAnalysisResult } from '@/lib/store';
import { Detection } from '@/lib/types';
import Replicate from 'replicate';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const IMAGE_SIZE = 512;

// CropScan v3 classes: healthy, bacterial, fungal, viral, nutrient_stress, other_disease
const HEALTHY_CLASSES = new Set(['healthy']);

// Weight per disease detection (higher = more severe)
const DISEASE_WEIGHT = 8;

function randRange(min: number, max: number) {
  return min + Math.random() * (max - min);
}

function randInt(min: number, max: number) {
  return Math.floor(randRange(min, max + 1));
}

function mockBBox(maxDimension: number): [number, number, number, number] {
  const width = randRange(24, Math.min(maxDimension, IMAGE_SIZE - 24));
  const height = randRange(24, Math.min(maxDimension, IMAGE_SIZE - 24));
  const x1 = randRange(0, IMAGE_SIZE - width);
  const y1 = randRange(0, IMAGE_SIZE - height);
  const x2 = x1 + width;
  const y2 = y1 + height;

  return [
    Number(x1.toFixed(1)),
    Number(y1.toFixed(1)),
    Number(Math.min(x2, IMAGE_SIZE - 0.1).toFixed(1)),
    Number(Math.min(y2, IMAGE_SIZE - 0.1).toFixed(1)),
  ];
}

function summarizeDetections(detections: Detection[]) {
  const byClass = detections.reduce<Record<string, number>>((acc, detection) => {
    acc[detection.class] = (acc[detection.class] ?? 0) + 1;
    return acc;
  }, {});

  return {
    total: detections.length,
    byClass,
  };
}

const MOCK_CLASSES = [
  'healthy', 'bacterial', 'fungal', 'viral', 'nutrient_stress', 'other_disease',
];

function createMockDetections(): Detection[] {
  const detections: Detection[] = [];
  const count = randInt(2, 6);

  for (let i = 0; i < count; i += 1) {
    detections.push({
      class: MOCK_CLASSES[randInt(0, MOCK_CLASSES.length - 1)],
      confidence: Number(randRange(0.4, 0.9).toFixed(4)),
      bbox: mockBBox(180),
    });
  }

  return detections;
}

function calculateHealthScore(detections: Detection[]) {
  const diseaseDetections = detections.filter(d => !HEALTHY_CLASSES.has(d.class));
  const issuePenalty = diseaseDetections.reduce((acc, detection) => {
    return acc + detection.confidence * DISEASE_WEIGHT;
  }, 0);

  const score = 100 - issuePenalty;
  return Number(Math.max(0, Math.min(100, score)).toFixed(2));
}

function parseDetectionsOutput(stdout: string): Detection[] {
  const parsed = JSON.parse(stdout) as unknown;
  if (!Array.isArray(parsed)) {
    throw new Error('Inference output was not a detections array');
  }

  return parsed.map((item): Detection => {
    if (
      typeof item !== 'object' ||
      item === null ||
      typeof (item as { class?: unknown }).class !== 'string' ||
      typeof (item as { confidence?: unknown }).confidence !== 'number' ||
      !Array.isArray((item as { bbox?: unknown }).bbox) ||
      (item as { bbox: unknown[] }).bbox.length !== 4
    ) {
      throw new Error('Inference output had an invalid detection shape');
    }

    const bbox = (item as { bbox: unknown[] }).bbox.map((coord) => Number(coord));
    if (bbox.some((coord) => Number.isNaN(coord))) {
      throw new Error('Inference output had invalid bbox coordinates');
    }

    return {
      class: (item as { class: string }).class,
      confidence: Number((item as { confidence: number }).confidence.toFixed(4)),
      bbox: [
        Number(bbox[0].toFixed(1)),
        Number(bbox[1].toFixed(1)),
        Number(bbox[2].toFixed(1)),
        Number(bbox[3].toFixed(1)),
      ],
    };
  });
}

export async function POST(request: NextRequest) {
  let tempFilePath: string | null = null;

  try {
    const formData = await request.formData();
    const image = formData.get('image');
    const fieldId = formData.get('fieldId');

    if (!(image instanceof File)) {
      return NextResponse.json(
        { success: false, error: 'Expected multipart form data with an image file' },
        { status: 400 }
      );
    }

    if (fieldId !== null && typeof fieldId !== 'string') {
      return NextResponse.json(
        { success: false, error: 'fieldId must be a string when provided' },
        { status: 400 }
      );
    }

    const imageExtension = path.extname(image.name) || '.jpg';
    tempFilePath = path.join(os.tmpdir(), `${uuidv4()}${imageExtension}`);
    const imageBuffer = Buffer.from(await image.arrayBuffer());
    await writeFile(tempFilePath, imageBuffer);

    let detections: Detection[];

    const replicateToken = process.env.REPLICATE_API_TOKEN;
    const modelPath = process.env.MODEL_PATH ?? './model/best.pt';
    const hasLocalModel = existsSync(path.resolve(modelPath));

    if (replicateToken) {
      // Replicate inference (production on Render)
      try {
        const replicate = new Replicate({ auth: replicateToken });
        const imageData = await readFile(tempFilePath);
        const base64 = `data:image/jpeg;base64,${imageData.toString('base64')}`;

        const output = await replicate.run(
          'nztinversive/cropscan-v3' as `${string}/${string}`,
          { input: { image: base64, conf: 0.25, imgsz: 640, return_json: true } }
        ) as { json_str?: string };

        const parsed = JSON.parse(output.json_str ?? '{"detections":[]}');
        detections = (parsed.detections ?? []).map((d: { class: string; confidence: number; bbox: number[] }) => ({
          class: d.class,
          confidence: Number(d.confidence.toFixed(4)),
          bbox: d.bbox.map((v: number) => Number(v.toFixed(1))) as [number, number, number, number],
        }));
      } catch (err) {
        console.error('Replicate inference failed, falling back:', err);
        detections = createMockDetections();
      }
    } else if (hasLocalModel) {
      // Local Python inference (development)
      detections = parseDetectionsOutput(
        execSync(`${process.platform === 'win32' ? 'py' : 'python3'} scripts/infer.py "${tempFilePath}"`, {
          encoding: 'utf8',
          env: process.env,
        })
      );
    } else {
      detections = createMockDetections();
    }

    const healthScore = calculateHealthScore(detections);
    const resultId = uuidv4();
    const ext = imageExtension || '.jpg';
    const resultImageUrl = `analysis-${resultId}${ext}`;
    const timestamp = new Date().toISOString();

    addAnalysisResult({
      id: resultId,
      imageUrl: resultImageUrl,
      detections,
      healthScore,
      timestamp,
    });

    return NextResponse.json({
      success: true,
      resultId,
      detections,
      healthScore,
      summary: summarizeDetections(detections),
      imageUrl: resultImageUrl,
      timestamp,
    });
  } catch (error) {
    console.error('Failed to analyze image', error);
    return NextResponse.json(
      { success: false, error: 'Failed to analyze image' },
      { status: 500 }
    );
  } finally {
    if (tempFilePath) {
      await unlink(tempFilePath).catch(() => undefined);
    }
  }
}
