import { execSync } from 'child_process';
import { existsSync } from 'fs';
import { writeFile, unlink } from 'fs/promises';
import os from 'os';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

type Detection = {
  class: string;
  confidence: number;
  bbox: [number, number, number, number];
};

const IMAGE_SIZE = 512;

function randomBBox(): [number, number, number, number] {
  const x1 = Math.random() * (IMAGE_SIZE - 80);
  const y1 = Math.random() * (IMAGE_SIZE - 80);
  const width = 40 + Math.random() * (IMAGE_SIZE - x1 - 40);
  const height = 40 + Math.random() * (IMAGE_SIZE - y1 - 40);

  const x2 = x1 + width;
  const y2 = y1 + height;

  return [
    Number(x1.toFixed(1)),
    Number(y1.toFixed(1)),
    Number(Math.min(x2, IMAGE_SIZE).toFixed(1)),
    Number(Math.min(y2, IMAGE_SIZE).toFixed(1)),
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
  return [
    {
      class: 'nutrient_deficiency',
      confidence: 0.87,
      bbox: randomBBox(),
    },
    {
      class: 'weed_cluster',
      confidence: 0.73,
      bbox: randomBBox(),
    },
    {
      class: 'water',
      confidence: 0.65,
      bbox: randomBBox(),
    },
  ];
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

    return NextResponse.json({
      success: true,
      detections,
      summary: summarizeDetections(detections),
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
