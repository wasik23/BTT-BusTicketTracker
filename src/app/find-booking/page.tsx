import Link from 'next/link';
import { db } from '@/lib/db';

export const dynamic = 'force-dynamic';

interface Props {
  searchParams: Promise<{ q?: string }>;
}

type SearchResult = Awaited<ReturnType<typeof search>>[number];

export default async function FindBookingPage({ searchParams }: Props) {
  const { q } = await searchParams;
  const query = (q || '').trim();

  const results: SearchResult[] = query.length >= 3 ? await search(query) : [];

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Find Your Booking</h1>
        <p className="text-slate-600 text-sm mt-1">Enter your phone number or your name. You can also enter a booking reference like BTT-XXXXX.</p>
      </div>

      <form method="GET" className="flex gap-2">
        <input
          name="q"
          defaultValue={query}
          placeholder="Phone number, name, or booking reference"
          className="flex-1 rounded border border-slate-300 px-3 py-2"
          required
          minLength={3}
        />
        <button className="bg-brand text-white px-4 py-2 rounded hover:bg-brand-dark">Search</button>
      </form>

      {query.length >= 3 && (
        <section>
          <h2 className="text-sm font-medium text-slate-500 mb-2">
            {results.length === 0
              ? `No bookings found for "${query}".`
              : `${results.length} booking${results.length === 1 ? '' : 's'} found`}
          </h2>
          {results.length > 0 && (
            <div className="space-y-2">
              {results.map((b: SearchResult) => (
                <Link
                  key={b.id}
                  href={`/bookings/${b.reference}`}
                  className="block bg-white border border-slate-200 rounded-lg p-4 hover:border-brand hover:shadow-sm transition"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="font-mono text-brand font-semibold">{b.reference}</div>
                      <div className="text-sm text-slate-700 mt-1">{b.passengerName} · {b.passengerPhone}</div>
                      <div className="text-sm text-slate-500">
                        {b.trip.route.origin} → {b.trip.route.destination} · {b.trip.bus.name}
                      </div>
                      <div className="text-xs text-slate-500 mt-1">
                        Departs {new Date(b.trip.departureAt).toLocaleString('en-GB', { dateStyle: 'medium', timeStyle: 'short' })}
                      </div>
                    </div>
                    <div className="text-right">
                      <StatusBadge s={b.paymentStatus} />
                      <div className="text-xs text-slate-500 mt-1">৳{b.totalBdt}</div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </section>
      )}

      {query.length === 0 && (
        <div className="text-xs text-slate-500">
          Tip: if you've lost your booking reference, search by the phone number you used when booking.
        </div>
      )}
    </div>
  );
}

async function search(q: string) {
  const upper = q.toUpperCase();
  return db.booking.findMany({
    where: {
      OR: [
        { reference: { contains: upper } },
        { passengerPhone: { contains: q } },
        { passengerName: { contains: q } }
      ]
    },
    orderBy: { createdAt: 'desc' },
    take: 20,
    include: {
      trip: {
        select: {
          departureAt: true,
          bus: { select: { name: true } },
          route: { select: { origin: true, destination: true } }
        }
      }
    }
  });
}

function StatusBadge({ s }: { s: string }) {
  const color =
    s === 'PAID' ? 'bg-green-100 text-green-800' :
    s === 'HELD' ? 'bg-amber-100 text-amber-800' :
    s === 'PENDING' ? 'bg-blue-100 text-blue-800' :
    s === 'REFUNDED' ? 'bg-purple-100 text-purple-800' :
    'bg-red-100 text-red-800';
  return <span className={`px-2 py-0.5 rounded text-xs ${color}`}>{s}</span>;
}
