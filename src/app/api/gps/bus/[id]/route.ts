import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(_req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const ping = await db.gpsPing.findFirst({
    where: { busId: id },
    orderBy: { recordedAt: 'desc' }
  });
  return NextResponse.json({ ping });
}
