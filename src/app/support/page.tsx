import { getCompanyInfo } from '@/lib/settings';

export const dynamic = 'force-dynamic';

export default async function SupportPage() {
  let c = { name: 'BTT', address: '', ownerName: '', ownerPhone: '', supportPhone: '', complaintPhone: '', email: '', about: '' };
  try { c = await getCompanyInfo(); } catch {}

  const rows: Array<[string, string]> = [
    ['Owner', c.ownerName ? `${c.ownerName} — ${c.ownerPhone}` : c.ownerPhone],
    ['Support', c.supportPhone],
    ['Complaints', c.complaintPhone],
    ['Email', c.email],
    ['Address', c.address]
  ].filter(([, v]) => v && v.trim().length > 0) as Array<[string, string]>;

  return (
    <div className="max-w-2xl space-y-6">
      <h1 className="text-2xl font-bold">Contact & Support</h1>
      {c.about && <p className="text-slate-700">{c.about}</p>}

      {rows.length === 0 ? (
        <div className="bg-slate-50 border border-slate-200 rounded p-4 text-slate-600">
          Contact information has not been set up yet. The owner can add it from the admin dashboard.
        </div>
      ) : (
        <div className="rounded-lg border border-slate-200 divide-y">
          {rows.map(([label, value]) => (
            <div key={label} className="flex justify-between p-4">
              <div className="text-slate-500">{label}</div>
              <div className="font-medium text-right">{value}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
