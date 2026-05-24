import Link from 'next/link';
import { db } from '@/lib/db';

export const dynamic = 'force-dynamic';

export default async function BusesListPage() {
  const buses = await db.bus.findMany({
    orderBy: { createdAt: 'desc' },
    include: { _count: { select: { photos: true, trips: true } } }
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Buses</h1>
        <Link href="/admin/buses/new" className="bg-brand text-white px-3 py-1.5 rounded hover:bg-brand-dark text-sm">+ Add bus</Link>
      </div>

      {buses.length === 0 ? (
        <div className="bg-slate-50 border border-slate-200 rounded p-6 text-center text-slate-600">
          No buses yet. Click <strong>Add bus</strong> to add your first one.
        </div>
      ) : (
        <div className="bg-white border border-slate-200 rounded-lg overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-slate-50">
              <tr>
                <th className="text-left p-3">Name</th>
                <th className="text-left p-3">Number plate</th>
                <th className="text-left p-3">Type</th>
                <th className="text-right p-3">Seats</th>
                <th className="text-right p-3">Trips</th>
                <th className="text-right p-3">Status</th>
              </tr>
            </thead>
            <tbody>
              {buses.map((b) => (
                <tr key={b.id} className="border-t">
                  <td className="p-3"><Link href={`/admin/buses/${b.id}`} className="text-brand font-medium hover:underline">{b.name}</Link></td>
                  <td className="p-3">{b.numberPlate}</td>
                  <td className="p-3">{b.busType}</td>
                  <td className="p-3 text-right">{b.totalSeats}</td>
                  <td className="p-3 text-right">{b._count.trips}</td>
                  <td className="p-3 text-right">
                    {b.isActive
                      ? <span className="px-2 py-0.5 rounded text-xs bg-green-100 text-green-800">Active</span>
                      : <span className="px-2 py-0.5 rounded text-xs bg-slate-200 text-slate-700">Disabled</span>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
