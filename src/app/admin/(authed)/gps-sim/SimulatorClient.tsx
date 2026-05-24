'use client';

import { useState } from 'react';

interface Bus { id: string; name: string }

export default function SimulatorClient({ buses }: { buses: Bus[] }) {
  const [busId, setBusId] = useState(buses[0]?.id || '');
  const [lat, setLat] = useState('23.81');
  const [lng, setLng] = useState('90.41');
  const [speed, setSpeed] = useState('40');
  const [secret, setSecret] = useState('');
  const [status, setStatus] = useState<string | null>(null);

  async function ping() {
    setStatus('Sending…');
    const res = await fetch('/api/gps/ingest', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-GPS-Secret': secret },
      body: JSON.stringify({ busId, lat: parseFloat(lat), lng: parseFloat(lng), speedKmh: parseFloat(speed) })
    });
    if (res.ok) setStatus('Ping accepted. Check the live map.');
    else { const j = await res.json().catch(() => ({})); setStatus(`Error: ${j.error || res.status}`); }
  }

  if (buses.length === 0) {
    return <div className="bg-slate-50 border border-slate-200 rounded p-4">Add a bus first.</div>;
  }

  return (
    <div className="space-y-3 bg-white border border-slate-200 rounded-lg p-4">
      <div>
        <label className="block text-sm font-medium mb-1">Bus</label>
        <select value={busId} onChange={(e) => setBusId(e.target.value)} className="w-full rounded border border-slate-300 px-3 py-2">
          {buses.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
        </select>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-sm font-medium mb-1">Latitude</label>
          <input value={lat} onChange={(e) => setLat(e.target.value)} className="w-full rounded border border-slate-300 px-3 py-2" />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Longitude</label>
          <input value={lng} onChange={(e) => setLng(e.target.value)} className="w-full rounded border border-slate-300 px-3 py-2" />
        </div>
      </div>
      <div>
        <label className="block text-sm font-medium mb-1">Speed km/h</label>
        <input value={speed} onChange={(e) => setSpeed(e.target.value)} className="w-full rounded border border-slate-300 px-3 py-2" />
      </div>
      <div>
        <label className="block text-sm font-medium mb-1">GPS_INGEST_SECRET (from your .env)</label>
        <input value={secret} onChange={(e) => setSecret(e.target.value)} type="password" className="w-full rounded border border-slate-300 px-3 py-2" />
      </div>
      <button onClick={ping} className="bg-brand text-white px-4 py-2 rounded hover:bg-brand-dark">Send ping</button>
      {status && <div className="text-sm text-slate-700">{status}</div>}
    </div>
  );
}
