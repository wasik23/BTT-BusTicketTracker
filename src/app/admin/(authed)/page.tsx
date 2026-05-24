import Link from 'next/link';
import { db } from '@/lib/db';

export const dynamic = 'force-dynamic';

export default async function AdminHome() {
  const [busCount, tripCount, bookingsToday, paidRevenue] = await Promise.all([
    db.bus.count(),
    db.trip.count({ where: { departureAt: { gte: new Date() } } }),
    db.booking.count({ where: { createdAt: { gte: startOfToday() } } }),
    db.booking.aggregate({
      _sum: { totalBdt: true },
      where: { paymentStatus: 'PAID', createdAt: { gte: startOfToday() } }
    })
  ]);

  const cards = [
    { label: 'Buses', value: busCount, href: '/admin/buses' },
    { label: 'Upcoming trips', value: tripCount, href: '/admin/routes' },
    { label: "Today's bookings", value: bookingsToday, href: '/admin/bookings' },
    { label: "Today's revenue (paid)", value: `৳${paidRevenue._sum.totalBdt ?? 0}`, href: '/admin/bookings' }
  ];

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Dashboard</h1>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {cards.map((c) => (
          <Link key={c.label} href={c.href} className="block bg-white border border-slate-200 rounded-lg p-4 hover:border-brand">
            <div className="text-xs text-slate-500">{c.label}</div>
            <div className="text-2xl font-bold mt-1">{c.value}</div>
          </Link>
        ))}
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <QuickLink href="/admin/buses" title="Manage buses" desc="Add buses, upload photos, set seat layouts and driver contacts." />
        <QuickLink href="/admin/payments" title="Payment methods" desc="Toggle bKash, Nagad, and Cash on Board. Enter merchant credentials." />
        <QuickLink href="/admin/settings" title="Site settings" desc="Edit company name, owner contact, support and complaint numbers." />
        <QuickLink href="/admin/live-map" title="Live map" desc="See where every bus is right now." />
      </div>
    </div>
  );
}

function QuickLink({ href, title, desc }: { href: string; title: string; desc: string }) {
  return (
    <Link href={href} className="block bg-white border border-slate-200 rounded-lg p-4 hover:border-brand">
      <div className="font-semibold">{title}</div>
      <div className="text-sm text-slate-600">{desc}</div>
    </Link>
  );
}

function startOfToday(): Date {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}
