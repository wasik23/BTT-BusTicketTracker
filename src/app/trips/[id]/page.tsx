import { notFound } from 'next/navigation';
import Image from 'next/image';
import { db } from '@/lib/db';
import { getPaymentConfig } from '@/lib/settings';
import BookingForm from './BookingForm';
import type { SeatLayout } from '@/lib/seat-layout';

export const dynamic = 'force-dynamic';

export default async function TripPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const trip = await db.trip.findUnique({
    where: { id },
    include: {
      bus: { include: { photos: { orderBy: { order: 'asc' } } } },
      route: true,
      bookings: {
        where: { paymentStatus: { in: ['PAID', 'HELD', 'PENDING'] } },
        include: { seats: true }
      }
    }
  });
  if (!trip) return notFound();

  const taken: string[] = [];
  const held: string[] = [];
  for (const b of trip.bookings) {
    for (const s of b.seats) {
      if (b.paymentStatus === 'PAID') taken.push(s.seatLabel);
      else held.push(s.seatLabel);
    }
  }

  const payment = await getPaymentConfig();
  const layout = JSON.parse(trip.bus.layoutJson) as SeatLayout;

  return (
    <div className="grid lg:grid-cols-3 gap-6">
      <section className="lg:col-span-2 space-y-6">
        <header>
          <h1 className="text-2xl font-bold">{trip.route.origin} → {trip.route.destination}</h1>
          <div className="text-slate-600 text-sm">
            {trip.bus.name} · {trip.bus.busType} ·{' '}
            {new Date(trip.departureAt).toLocaleString('en-GB', { dateStyle: 'full', timeStyle: 'short' })}
          </div>
        </header>

        {trip.bus.photos.length > 0 && (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
            {trip.bus.photos.map((p) => (
              <div key={p.id} className="relative aspect-video rounded overflow-hidden bg-slate-100">
                <Image src={p.url} alt={trip.bus.name} fill className="object-cover" />
              </div>
            ))}
          </div>
        )}

        <div className="rounded-lg border border-slate-200 p-4 grid sm:grid-cols-2 gap-4 text-sm">
          {trip.bus.driverName && (
            <div>
              <div className="text-slate-500">Driver</div>
              <div className="font-medium">{trip.bus.driverName}</div>
              {trip.bus.driverPhone && <div className="text-slate-600">{trip.bus.driverPhone}</div>}
            </div>
          )}
          {trip.bus.supervisorName && (
            <div>
              <div className="text-slate-500">Supervisor</div>
              <div className="font-medium">{trip.bus.supervisorName}</div>
              {trip.bus.supervisorPhone && <div className="text-slate-600">{trip.bus.supervisorPhone}</div>}
            </div>
          )}
        </div>

        <div>
          <h2 className="font-semibold mb-2">Choose your seats</h2>
          <BookingForm
            tripId={trip.id}
            fareBdt={trip.fareBdt}
            layout={layout}
            takenSeats={taken}
            heldSeats={held}
            payment={payment}
          />
        </div>
      </section>

      <aside className="space-y-4">
        <div className="rounded-lg bg-slate-50 border border-slate-200 p-4">
          <div className="text-sm text-slate-500">Fare per seat</div>
          <div className="text-2xl font-bold text-brand">৳{trip.fareBdt}</div>
        </div>
        {trip.bus.notes && (
          <div className="rounded-lg bg-amber-50 border border-amber-200 p-4 text-sm">
            {trip.bus.notes}
          </div>
        )}
      </aside>
    </div>
  );
}
