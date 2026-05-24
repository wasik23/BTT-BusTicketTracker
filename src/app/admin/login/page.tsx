'use client';

import { useState } from 'react';

export default function AdminLogin() {
  const [username, setU] = useState('');
  const [password, setP] = useState('');
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setErr(null);
    const res = await fetch('/api/admin/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password })
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setErr(data.error || 'Login failed');
      setBusy(false);
      return;
    }
    const params = new URLSearchParams(window.location.search);
    window.location.href = params.get('from') || '/admin';
  }

  return (
    <div className="min-h-[60vh] grid place-items-center">
      <form onSubmit={onSubmit} className="w-full max-w-sm space-y-4 bg-white border border-slate-200 rounded-lg p-6 shadow-sm">
        <h1 className="text-xl font-bold">Admin sign in</h1>
        <div>
          <label className="block text-sm font-medium mb-1">Username</label>
          <input value={username} onChange={(e) => setU(e.target.value)} required autoFocus className="w-full rounded border border-slate-300 px-3 py-2" />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Password</label>
          <input type="password" value={password} onChange={(e) => setP(e.target.value)} required className="w-full rounded border border-slate-300 px-3 py-2" />
        </div>
        {err && <div className="text-red-600 text-sm">{err}</div>}
        <button type="submit" disabled={busy} className="w-full bg-brand text-white py-2 rounded hover:bg-brand-dark disabled:opacity-50">
          {busy ? 'Signing in…' : 'Sign in'}
        </button>
      </form>
    </div>
  );
}
