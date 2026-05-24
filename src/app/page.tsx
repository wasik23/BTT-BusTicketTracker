import Link from 'next/link';
import { db } from '@/lib/db';

export const dynamic = 'force-dynamic';

export default async function HomePage() {
  let trips: Awaited<ReturnType<typeof loadTrips>> = [];
  try {
    trips = await loadTrips();
  } catch {
    // DB not configured yet
  }

  return (
    <div className="space-y-8">
      <section className="bg-gradient-to-br from-brand to-brand-dark text-white rounded-xl p-8">
        <h1 className="text-3xl font-bold">Book your bus ticket. Track your bus live.</h1>
        <p className="mt-2 opacity-90">Choose your seat, pay online or on board, and see where your bus is in real time.</p>
      </section>

      <section>
        <h2 className="text-xl font-semibold mb-4">Upcoming Trips</h2>
        {trips.length === 0 ? (
          <div className="bg-slate-50 border border-slate-200 rounded-lg p-6 text-center text-slate-600">
            No trips scheduled yet. The owner can add buses and trips from the{' '}
            <Link href="/admin" className="text-brand underline">admin dashboard</Link>.
          </div>
        ) : (
          <div className="grid md:grid-cols-2 gap-4">
            {trips.map((t) => {
              const taken = t.bookings.reduce((n, b) => n + b.seats.length, 0);
              const available = t.bus.totalSeats - taken;
              return (
                <Link
                  key={t.id}
                  href={`/trips/${t.id}`}
                  className="block rounded-lg border border-slate-200 hover:border-brand hover:shadow-md transition p-4"
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="font-semibold">{t.route.origin} → {t.route.destination}</div>
                      <div className="text-sm text-slate-500">{t.bus.name} · {t.bus.busType}</div>
                    </div>
                    <div className="text-right">
                      <div className="text-brand font-semibold">৳{t.fareBdt}</div>
                      <div className="text-xs text-slate-500">{available} seats left</div>
                    </div>
                  </div>
                  <div className="mt-2 text-sm text-slate-600">
                    Departs: {new Date(t.departureAt).toLocaleString('en-GB', { dateStyle: 'medium', timeStyle: 'short' })}
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}

async function loadTrips() {
  return db.trip.findMany({
    where: {
      departureAt: { gte: new Date() },
      status: { in: ['SCHEDULED', 'BOARDING'] }
    },
    orderBy: { departureAt: 'asc' },
    take: 20,
    include: {
      bus: { select: { name: true, busType: true, totalSeats: true } },
      route: { select: { origin: true, destination: true } },
      bookings: {
        where: { paymentStatus: { in: ['PAID', 'HELD', 'PENDING'] } },
        select: { seats: { select: { id: true } } }
      }
    }
  });
}
