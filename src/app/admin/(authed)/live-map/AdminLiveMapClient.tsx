'use client';

import dynamic from 'next/dynamic';
import { useEffect, useState } from 'react';

const LiveMap = dynamic(() => import('@/components/LiveMap'), { ssr: false, loading: () => <div className="h-full grid place-items-center">Loading map…</div> });

interface BusInfo { id: string; name: string }
interface Point { busId: string; name: string; lat: number; lng: number; heading: number | null }

export default function AdminLiveMapClient({ buses }: { buses: BusInfo[] }) {
  const [points, setPoints] = useState<Point[]>([]);

  useEffect(() => {
    let alive = true;
    async function poll() {
      const results = await Promise.all(
        buses.map(async (b) => {
          const res = await fetch(`/api/gps/bus/${b.id}`);
          if (!res.ok) return null;
          const data = await res.json();
          if (!data.ping) return null;
          return { busId: b.id, name: b.name, lat: data.ping.lat, lng: data.ping.lng, heading: data.ping.heading };
        })
      );
      if (alive) setPoints(results.filter((p): p is Point => !!p));
    }
    poll();
    const id = setInterval(poll, 5000);
    return () => { alive = false; clearInterval(id); };
  }, [buses]);

  if (points.length === 0) {
    return (
      <div className="h-full grid place-items-center text-slate-500 bg-slate-50">
        No GPS pings received yet.
      </div>
    );
  }
  return <LiveMap points={points} />;
}
