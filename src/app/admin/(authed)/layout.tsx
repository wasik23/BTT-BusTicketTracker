import Link from 'next/link';
import { getCurrentAdmin } from '@/lib/auth';

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const admin = await getCurrentAdmin();

  const links = [
    { href: '/admin', label: 'Dashboard' },
    { href: '/admin/buses', label: 'Buses' },
    { href: '/admin/routes', label: 'Routes & Trips' },
    { href: '/admin/bookings', label: 'Bookings' },
    { href: '/admin/live-map', label: 'Live Map' },
    { href: '/admin/payments', label: 'Payments' },
    { href: '/admin/settings', label: 'Settings' },
    { href: '/admin/users', label: 'Admin Users' }
  ];

  return (
    <div className="grid md:grid-cols-[220px_1fr] gap-6">
      <aside className="bg-slate-900 text-slate-200 rounded-lg p-4 h-fit">
        <div className="font-bold text-white mb-3">BTT Admin</div>
        {admin && <div className="text-xs text-slate-400 mb-3">Signed in as {admin.username}</div>}
        <nav className="flex flex-col gap-1 text-sm">
          {links.map((l) => (
            <Link key={l.href} href={l.href} className="px-2 py-1.5 rounded hover:bg-slate-800">{l.label}</Link>
          ))}
        </nav>
        <form action="/api/admin/logout" method="POST" className="mt-4">
          <button className="text-xs text-slate-400 hover:text-white">Sign out</button>
        </form>
      </aside>
      <main>{children}</main>
    </div>
  );
}
