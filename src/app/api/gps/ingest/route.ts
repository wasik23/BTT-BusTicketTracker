import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { db } from '@/lib/db';

// Generic GPS ingest endpoint. Configure your GPS tracker (or simulator)
// to POST JSON here. Most consumer trackers can be wrapped in a small
// adapter (e.g. Traccar) that translates to this format.
//
// curl -X POST http://YOUR_HOST/api/gps/ingest \
//   -H "Content-Type: application/json" \
//   -H "X-GPS-Secret: $GPS_INGEST_SECRET" \
//   -d '{"busId":"...", "lat":23.81, "lng":90.41, "speedKmh":45, "heading":270}'

const PingSchema = z.object({
  busId: z.string().min(1),
  lat: z.number().gte(-90).lte(90),
  lng: z.number().gte(-180).lte(180),
  speedKmh: z.number().nonnegative().optional(),
  heading: z.number().gte(0).lte(360).optional(),
  recordedAt: z.string().datetime().optional()
});

export async function POST(req: NextRequest) {
  const secret = process.env.GPS_INGEST_SECRET;
  if (!secret) return NextResponse.json({ error: 'GPS ingest not configured' }, { status: 503 });
  const provided = req.headers.get('x-gps-secret');
  if (provided !== secret) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const json = await req.json().catch(() => null);
  const parsed = PingSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid payload', details: parsed.error.flatten() }, { status: 400 });
  }
  const p = parsed.data;

  const bus = await db.bus.findUnique({ where: { id: p.busId }, select: { id: true } });
  if (!bus) return NextResponse.json({ error: 'Unknown bus' }, { status: 404 });

  await db.gpsPing.create({
    data: {
      busId: p.busId,
      lat: p.lat,
      lng: p.lng,
      speedKmh: p.speedKmh,
      heading: p.heading,
      recordedAt: p.recordedAt ? new Date(p.recordedAt) : new Date()
    }
  });

  return NextResponse.json({ ok: true });
}
