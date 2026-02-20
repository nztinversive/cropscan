import { NextResponse } from 'next/server';
import { getField } from '@/lib/store';
export const dynamic = 'force-dynamic';

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  const field = getField(params.id);
  if (!field) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  return NextResponse.json(field);
}
