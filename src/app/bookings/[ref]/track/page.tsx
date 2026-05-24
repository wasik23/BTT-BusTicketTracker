import { notFound } from 'next/navigation';
import { db } from '@/lib/db';
import LiveTrackingClient from './LiveTrackingClient';

export const dynamic = 'force-dynamic';

export default async function TrackPage({ params }: { params: Promise<{ ref: string }> }) {
  const { ref } = await params;
  const booking = await db.booking.findUnique({
    where: { reference: ref.toUpperCase() },
    include: {
      trip: {
        include: {
          bus: { select: { id: true, name: true } },
          route: { select: { origin: true, destination: true } }
        }
      }
    }
  });
  if (!booking) return notFound();

  const lastPing = await db.gpsPing.findFirst({
    where: { busId: booking.trip.bus.id },
    orderBy: { recordedAt: 'desc' }
  });

  return (
    <div className="space-y-4">
      <header>
        <div className="text-sm text-slate-500">Tracking your bus</div>
        <div className="text-xl font-bold">{booking.trip.bus.name}</div>
        <div className="text-slate-600">{booking.trip.route.origin} → {booking.trip.route.destination}</div>
      </header>

      <div className="h-[500px] rounded-lg overflow-hidden border border-slate-200">
        <LiveTrackingClient busId={booking.trip.bus.id} initial={lastPing} />
      </div>

      <p className="text-xs text-slate-500">
        Location updates automatically every few seconds. If the bus has no GPS signal, the last known location is shown.
      </p>
    </div>
  );
}
