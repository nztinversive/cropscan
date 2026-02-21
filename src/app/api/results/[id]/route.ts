import { NextResponse } from 'next/server';
import { getAnalysisResult } from '@/lib/store';

export const dynamic = 'force-dynamic';

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  const result = getAnalysisResult(params.id);
  
  if (!result) {
    return NextResponse.json({ error: 'Result not found' }, { status: 404 });
  }
  
  return NextResponse.json(result);
}