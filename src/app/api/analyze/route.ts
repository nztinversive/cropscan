import { execSync } from 'child_process';
import { existsSync } from 'fs';
import { writeFile, unlink } from 'fs/promises';
import os from 'os';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { NextRequest, NextResponse } from 'next/server';
import { addAnalysisResult } from '@/lib/store';
import { Detection } from '@/lib/types';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const IMAGE_SIZE = 512;
const MOCK_CLASS_WEIGHTS: Record<string, number> = {
  cloud_shadow: 6,
  double_plant: 8,
  planter_skip: 10,
  standing_water: 14,
  waterway: 2,
  weed_cluster: 9,
  nutrient_deficiency: 12,
  storm_damage: 16,
};

const MOCK_CLASS_RANGES: Record<
  keyof typeof MOCK_CLASS_WEIGHTS,
  { minCount: number; maxCount: number; minConfidence: number; maxConfidence: number; maxSize: number }
> = {
  cloud_shadow: { minCount: 1, maxCount: 2, minConfidence: 0.48, maxConfidence: 0.83, maxSize: 240 },
  double_plant: { minCount: 0, maxCount: 2, minConfidence: 0.52, maxConfidence: 0.81, maxSize: 130 },
  planter_skip: { minCount: 0, maxCount: 1, minConfidence: 0.41, maxConfidence: 0.75, maxSize: 180 },
  standing_water: { minCount: 1, maxCount: 2, minConfidence: 0.55, maxConfidence: 0.89, maxSize: 220 },
  waterway: { minCount: 0, maxCount: 1, minConfidence: 0.45, maxConfidence: 0.76, maxSize: 300 },
  weed_cluster: { minCount: 1, maxCount: 3, minConfidence: 0.5, maxConfidence: 0.9, maxSize: 110 },
  nutrient_deficiency: { minCount: 1, maxCount: 3, minConfidence: 0.58, maxConfidence: 0.91, maxSize: 160 },
  storm_damage: { minCount: 0, maxCount: 2, minConfidence: 0.6, maxConfidence: 0.93, maxSize: 250 },
};

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

function createMockDetections(): Detection[] {
  const detections: Detection[] = [];

  (Object.keys(MOCK_CLASS_WEIGHTS) as Array<keyof typeof MOCK_CLASS_WEIGHTS>).forEach(
    (className) => {
      const config = MOCK_CLASS_RANGES[className];
      const count = randInt(config.minCount, config.maxCount);

      for (let i = 0; i < count; i += 1) {
        const confidence = randRange(config.minConfidence, config.maxConfidence);

        detections.push({
          class: className,
          confidence: Number(confidence.toFixed(4)),
          bbox: mockBBox(config.maxSize),
        });
      }
    }
  );

  return detections;
}

function calculateHealthScore(detections: Detection[]) {
  const issuePenalty = detections.reduce((acc, detection) => {
    const weight = MOCK_CLASS_WEIGHTS[detection.class] ?? 8;
    return acc + detection.confidence * weight;
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

    const modelPath = process.env.MODEL_PATH ?? './model/best.pt';
    const hasModel = existsSync(path.resolve(modelPath));

    const detections = hasModel
      ? parseDetectionsOutput(
          execSync(`py scripts/infer.py "${tempFilePath}"`, {
            encoding: 'utf8',
            env: process.env,
          })
        )
      : createMockDetections();

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
