import { db } from '@/lib/db';
import SimulatorClient from './SimulatorClient';

export const dynamic = 'force-dynamic';

export default async function GpsSimulatorPage() {
  const buses = await db.bus.findMany({ select: { id: true, name: true } });
  return (
    <div className="max-w-xl space-y-4">
      <h1 className="text-2xl font-bold">GPS simulator</h1>
      <p className="text-sm text-slate-600">For testing only — push fake GPS pings so you can verify the live map works before installing real trackers.</p>
      <SimulatorClient buses={buses} />
    </div>
  );
}
