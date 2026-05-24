import Link from 'next/link';
import { revalidatePath } from 'next/cache';
import { db } from '@/lib/db';

export const dynamic = 'force-dynamic';

async function markPaid(id: string) {
  'use server';
  await db.booking.update({
    where: { id },
    data: { paymentStatus: 'PAID', holdExpiresAt: null }
  });
  revalidatePath('/admin/bookings');
}

async function cancel(id: string) {
  'use server';
  await db.booking.update({ where: { id }, data: { paymentStatus: 'CANCELLED' } });
  revalidatePath('/admin/bookings');
}

export default async function AdminBookingsPage() {
  const bookings = await db.booking.findMany({
    orderBy: { createdAt: 'desc' },
    take: 100,
    include: {
      seats: true,
      trip: { include: { route: true, bus: { select: { name: true } } } }
    }
  });

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Recent bookings</h1>
      <div className="bg-white border border-slate-200 rounded-lg overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-slate-50">
            <tr>
              <th className="text-left p-3">Ref</th>
              <th className="text-left p-3">Passenger</th>
              <th className="text-left p-3">Trip</th>
              <th className="text-left p-3">Seats</th>
              <th className="text-right p-3">Total</th>
              <th className="text-left p-3">Method</th>
              <th className="text-left p-3">Status</th>
              <th className="text-right p-3">Action</th>
            </tr>
          </thead>
          <tbody>
            {bookings.map((b) => (
              <tr key={b.id} className="border-t">
                <td className="p-3 font-mono"><Link href={`/bookings/${b.reference}`} className="text-brand hover:underline">{b.reference}</Link></td>
                <td className="p-3">{b.passengerName}<br /><span className="text-xs text-slate-500">{b.passengerPhone}</span></td>
                <td className="p-3">{b.trip.route.origin} → {b.trip.route.destination}<br /><span className="text-xs text-slate-500">{b.trip.bus.name}</span></td>
                <td className="p-3">{b.seats.map((s) => s.seatLabel).join(', ')}</td>
                <td className="p-3 text-right">৳{b.totalBdt}</td>
                <td className="p-3">{b.paymentMethod.replace(/_/g, ' ')}</td>
                <td className="p-3"><StatusBadge s={b.paymentStatus} /></td>
                <td className="p-3 text-right space-x-2">
                  {(b.paymentStatus === 'HELD' || b.paymentStatus === 'PENDING') && (
                    <form action={markPaid.bind(null, b.id)} className="inline">
                      <button className="text-green-700 text-xs hover:underline">Mark paid</button>
                    </form>
                  )}
                  {b.paymentStatus !== 'CANCELLED' && (
                    <form action={cancel.bind(null, b.id)} className="inline">
                      <button className="text-red-600 text-xs hover:underline">Cancel</button>
                    </form>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
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
