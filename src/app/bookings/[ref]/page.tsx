import { notFound } from 'next/navigation';
import Link from 'next/link';
import { db } from '@/lib/db';

export const dynamic = 'force-dynamic';

export default async function BookingDetailPage({ params }: { params: Promise<{ ref: string }> }) {
  const { ref } = await params;
  const booking = await db.booking.findUnique({
    where: { reference: ref.toUpperCase() },
    include: {
      seats: true,
      trip: {
        include: {
          bus: { select: { id: true, name: true, busType: true, driverPhone: true, supervisorPhone: true } },
          route: true
        }
      }
    }
  });
  if (!booking) return notFound();

  const statusColor =
    booking.paymentStatus === 'PAID' ? 'bg-green-100 text-green-800' :
    booking.paymentStatus === 'HELD' ? 'bg-amber-100 text-amber-800' :
    booking.paymentStatus === 'PENDING' ? 'bg-blue-100 text-blue-800' :
    'bg-red-100 text-red-800';

  return (
    <div className="max-w-2xl space-y-6">
      <header>
        <div className="text-sm text-slate-500">Booking reference</div>
        <div className="text-3xl font-bold tracking-wider text-brand">{booking.reference}</div>
        <span className={`inline-block mt-2 px-2 py-0.5 rounded text-xs font-medium ${statusColor}`}>
          {booking.paymentStatus}
        </span>
      </header>

      <section className="rounded-lg border border-slate-200 p-4 space-y-3">
        <div className="flex justify-between"><span className="text-slate-500">Trip</span><span className="font-medium">{booking.trip.route.origin} → {booking.trip.route.destination}</span></div>
        <div className="flex justify-between"><span className="text-slate-500">Bus</span><span className="font-medium">{booking.trip.bus.name}</span></div>
        <div className="flex justify-between"><span className="text-slate-500">Departure</span><span className="font-medium">{new Date(booking.trip.departureAt).toLocaleString('en-GB', { dateStyle: 'medium', timeStyle: 'short' })}</span></div>
        <div className="flex justify-between"><span className="text-slate-500">Seats</span><span className="font-medium">{booking.seats.map((s) => s.seatLabel).join(', ')}</span></div>
        <div className="flex justify-between"><span className="text-slate-500">Passenger</span><span className="font-medium">{booking.passengerName}</span></div>
        <div className="flex justify-between"><span className="text-slate-500">Phone</span><span className="font-medium">{booking.passengerPhone}</span></div>
        <div className="flex justify-between"><span className="text-slate-500">Payment</span><span className="font-medium">{booking.paymentMethod.replace(/_/g, ' ')}</span></div>
        <div className="flex justify-between border-t pt-3"><span className="text-slate-500">Total</span><span className="font-bold text-lg">৳{booking.totalBdt}</span></div>
        {booking.holdExpiresAt && booking.paymentStatus === 'HELD' && (
          <div className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded p-2">
            Seat held until {new Date(booking.holdExpiresAt).toLocaleString('en-GB')}. Board the bus before this time or your seat will be released.
          </div>
        )}
      </section>

      <Link href={`/bookings/${booking.reference}/track`} className="inline-block bg-brand text-white px-4 py-2 rounded hover:bg-brand-dark">
        Track this bus live →
      </Link>

      <div className="text-sm text-slate-600">
        Save this page. Show the reference number when boarding.
      </div>
    </div>
  );
}
