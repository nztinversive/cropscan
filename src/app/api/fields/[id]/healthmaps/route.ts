import { NextResponse } from 'next/server';
import { getHealthMaps } from '@/lib/store';
export const dynamic = 'force-dynamic';

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  return NextResponse.json(getHealthMaps(params.id));
}
