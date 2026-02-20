import { NextResponse } from 'next/server';
import { getDashboardStats } from '@/lib/store';
export const dynamic = 'force-dynamic';

export async function GET() {
  return NextResponse.json(getDashboardStats());
}
