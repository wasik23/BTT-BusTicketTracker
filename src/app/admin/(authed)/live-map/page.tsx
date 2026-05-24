import { db } from '@/lib/db';
import AdminLiveMapClient from './AdminLiveMapClient';

export const dynamic = 'force-dynamic';

export default async function AdminLiveMap() {
  const buses = await db.bus.findMany({
    where: { isActive: true },
    select: { id: true, name: true }
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Live map — all buses</h1>
        <div className="text-xs text-slate-500">Updates every 5 seconds</div>
      </div>
      <div className="h-[600px] rounded-lg overflow-hidden border border-slate-200">
        <AdminLiveMapClient buses={buses} />
      </div>
      <div className="bg-amber-50 border border-amber-200 rounded p-3 text-sm">
        <strong>No GPS data?</strong> Configure your GPS tracker to POST to <code className="bg-white px-1 rounded">/api/gps/ingest</code> with header <code className="bg-white px-1 rounded">X-GPS-Secret</code>. For testing, use the simulator at <a href="/admin/gps-sim" className="text-brand underline">/admin/gps-sim</a>.
      </div>
    </div>
  );
}
