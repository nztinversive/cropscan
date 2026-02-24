import { NextRequest, NextResponse } from 'next/server';
import { generatePrescription } from '@/lib/prescribe';
import { Detection } from '@/lib/types';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
export const maxDuration = 60; // GPT vision can take a while

export async function POST(request: NextRequest) {
  try {
    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json(
        { success: false, error: 'OPENAI_API_KEY not configured' },
        { status: 500 }
      );
    }

    const body = await request.json();
    const { imageBase64, detections, fieldInfo } = body as {
      imageBase64?: string;
      detections: Detection[];
      fieldInfo?: { crop?: string; acres?: number; location?: string };
    };

    if (!detections || !Array.isArray(detections)) {
      return NextResponse.json(
        { success: false, error: 'detections array is required' },
        { status: 400 }
      );
    }

    const prescription = await generatePrescription({
      imageBase64,
      detections,
      fieldInfo,
    });

    return NextResponse.json(prescription);
  } catch (error) {
    console.error('Prescription generation failed:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { success: false, error: `Prescription generation failed: ${message}` },
      { status: 500 }
    );
  }
}
