import { NextResponse } from 'next/server';
import { getFields } from '@/lib/store';
export const dynamic = 'force-dynamic';

export async function GET() {
  return NextResponse.json(getFields());
}
