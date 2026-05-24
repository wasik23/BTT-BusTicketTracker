import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const ref = url.searchParams.get('ref');
  const phone = url.searchParams.get('phone');
  if (!ref || !phone) return NextResponse.json({ error: 'Missing ref or phone' }, { status: 400 });
  const booking = await db.booking.findUnique({
    where: { reference: ref.toUpperCase() }
  });
  if (!booking || booking.passengerPhone !== phone) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }
  return NextResponse.json({ reference: booking.reference });
}
