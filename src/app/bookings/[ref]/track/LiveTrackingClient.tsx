'use client';

import dynamic from 'next/dynamic';
import { useEffect, useState } from 'react';

const LiveMap = dynamic(() => import('@/components/LiveMap'), { ssr: false, loading: () => <div className="h-full grid place-items-center">Loading map…</div> });

interface Ping { lat: number; lng: number; speedKmh: number | null; heading: number | null; recordedAt: Date | string }

export default function LiveTrackingClient({ busId, initial }: { busId: string; initial: Ping | null }) {
  const [ping, setPing] = useState<Ping | null>(initial);

  useEffect(() => {
    let alive = true;
    async function poll() {
      try {
        const res = await fetch(`/api/gps/bus/${busId}`);
        if (!res.ok) return;
        const data = await res.json();
        if (alive && data.ping) setPing(data.ping);
      } catch {}
    }
    const id = setInterval(poll, 5000);
    return () => { alive = false; clearInterval(id); };
  }, [busId]);

  if (!ping) {
    return (
      <div className="h-full grid place-items-center text-slate-500 bg-slate-50">
        No GPS data yet for this bus.
      </div>
    );
  }
  return <LiveMap points={[{ busId, name: 'Your bus', lat: ping.lat, lng: ping.lng, heading: ping.heading }]} />;
}
