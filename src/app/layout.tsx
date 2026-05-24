import type { Metadata } from 'next';
import Link from 'next/link';
import './globals.css';
import { getCompanyInfo } from '@/lib/settings';

export const metadata: Metadata = {
  title: 'BTT — Bus Ticket Tracker',
  description: 'Book bus tickets online and track your bus live.'
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  let company = { name: 'BTT — Bus Ticket Tracker', supportPhone: '', complaintPhone: '' };
  try {
    company = await getCompanyInfo();
  } catch {
    // DB not ready yet — fall back to defaults
  }

  return (
    <html lang="en">
      <body className="min-h-screen flex flex-col">
        <header className="bg-brand text-white shadow">
          <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
            <Link href="/" className="text-xl font-bold tracking-wide">
              BTT
              <span className="ml-2 text-sm font-normal opacity-80">Bus Ticket Tracker</span>
            </Link>
            <nav className="flex gap-4 text-sm">
              <Link href="/" className="hover:underline">Home</Link>
              <Link href="/find-booking" className="hover:underline">Find Booking</Link>
              <Link href="/support" className="hover:underline">Support</Link>
              <Link href="/admin" className="hover:underline opacity-75">Admin</Link>
            </nav>
          </div>
        </header>

        <main className="flex-1 max-w-6xl w-full mx-auto px-4 py-6">{children}</main>

        <footer className="bg-slate-900 text-slate-300 text-sm">
          <div className="max-w-6xl mx-auto px-4 py-6 flex flex-col md:flex-row gap-4 justify-between">
            <div>
              <div className="font-semibold text-white">{company.name}</div>
              <div className="text-slate-400 text-xs mt-1">Bus Ticket Tracker</div>
            </div>
            <div className="text-xs">
              {company.supportPhone && <div>Support: {company.supportPhone}</div>}
              {company.complaintPhone && <div>Complaints: {company.complaintPhone}</div>}
            </div>
          </div>
        </footer>
      </body>
    </html>
  );
}
