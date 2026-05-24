import { revalidatePath } from 'next/cache';
import { db } from '@/lib/db';

export const dynamic = 'force-dynamic';

async function createRoute(formData: FormData) {
  'use server';
  const origin = String(formData.get('origin') || '').trim();
  const destination = String(formData.get('destination') || '').trim();
  const baseFareBdt = parseInt(String(formData.get('fare') || '0'), 10);
  if (!origin || !destination || !baseFareBdt) return;
  await db.route.create({ data: { origin, destination, baseFareBdt } });
  revalidatePath('/admin/routes');
}

async function updateRoute(id: string, formData: FormData) {
  'use server';
  await db.route.update({
    where: { id },
    data: {
      origin: String(formData.get('origin') || '').trim(),
      destination: String(formData.get('destination') || '').trim(),
      baseFareBdt: parseInt(String(formData.get('fare') || '0'), 10),
      isActive: formData.get('isActive') === 'on'
    }
  });
  revalidatePath('/admin/routes');
}

async function deleteRoute(id: string) {
  'use server';
  const tripCount = await db.trip.count({ where: { routeId: id } });
  if (tripCount > 0) {
    await db.route.update({ where: { id }, data: { isActive: false } });
  } else {
    await db.route.delete({ where: { id } });
  }
  revalidatePath('/admin/routes');
}

async function createTrip(formData: FormData) {
  'use server';
  const busId = String(formData.get('busId') || '');
  const routeId = String(formData.get('routeId') || '');
  const departureAt = new Date(String(formData.get('departureAt') || ''));
  const fareBdt = parseInt(String(formData.get('fareBdt') || '0'), 10);
  if (!busId || !routeId || !fareBdt || isNaN(departureAt.getTime())) return;
  await db.trip.create({ data: { busId, routeId, departureAt, fareBdt } });
  revalidatePath('/admin/routes');
}

async function updateTrip(id: string, formData: FormData) {
  'use server';
  await db.trip.update({
    where: { id },
    data: {
      departureAt: new Date(String(formData.get('departureAt') || '')),
      fareBdt: parseInt(String(formData.get('fareBdt') || '0'), 10),
      status: String(formData.get('status') || 'SCHEDULED')
    }
  });
  revalidatePath('/admin/routes');
}

async function deleteTrip(id: string) {
  'use server';
  const bookingCount = await db.booking.count({
    where: { tripId: id, paymentStatus: { in: ['PAID', 'HELD', 'PENDING'] } }
  });
  if (bookingCount > 0) {
    await db.trip.update({ where: { id }, data: { status: 'CANCELLED' } });
  } else {
    await db.trip.delete({ where: { id } });
  }
  revalidatePath('/admin/routes');
}

function toLocalInput(d: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export default async function RoutesPage() {
  const [routes, buses, trips] = await Promise.all([
    db.route.findMany({ orderBy: { createdAt: 'desc' } }),
    db.bus.findMany({ where: { isActive: true }, select: { id: true, name: true } }),
    db.trip.findMany({
      where: { departureAt: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) } },
      orderBy: { departureAt: 'asc' },
      include: {
        bus: { select: { name: true } },
        route: { select: { origin: true, destination: true } },
        _count: { select: { bookings: true } }
      },
      take: 50
    })
  ]);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Routes & Trips</h1>

      <section className="bg-white border border-slate-200 rounded-lg p-4 space-y-3">
        <h2 className="font-semibold">Add a route</h2>
        <form action={createRoute} className="grid grid-cols-1 md:grid-cols-4 gap-2 items-end">
          <Field name="origin" label="From" placeholder="Dhaka" />
          <Field name="destination" label="To" placeholder="Cox's Bazar" />
          <Field name="fare" label="Base fare (BDT)" type="number" />
          <button className="bg-brand text-white py-2 rounded hover:bg-brand-dark">Add route</button>
        </form>

        {routes.length > 0 && (
          <div className="space-y-2 mt-3">
            {routes.map((r) => (
              <details key={r.id} className="border rounded">
                <summary className="px-3 py-2 cursor-pointer flex items-center justify-between gap-3">
                  <span>{r.origin} → {r.destination}</span>
                  <span className="flex items-center gap-3 text-sm">
                    <span className="text-slate-500">৳{r.baseFareBdt}</span>
                    {!r.isActive && <span className="text-xs px-2 py-0.5 rounded bg-slate-200 text-slate-700">Inactive</span>}
                    <span className="text-brand text-xs">Edit ▾</span>
                  </span>
                </summary>
                <div className="px-3 pb-3 grid grid-cols-1 md:grid-cols-[1fr_1fr_1fr_auto_auto] gap-2 items-end">
                  <form action={updateRoute.bind(null, r.id)} className="contents">
                    <Field name="origin" label="From" defaultValue={r.origin} />
                    <Field name="destination" label="To" defaultValue={r.destination} />
                    <Field name="fare" label="Base fare" type="number" defaultValue={String(r.baseFareBdt)} />
                    <label className="flex items-center gap-2 text-sm pb-2">
                      <input type="checkbox" name="isActive" defaultChecked={r.isActive} /> Active
                    </label>
                    <button className="bg-brand text-white px-3 py-2 rounded text-sm hover:bg-brand-dark">Save</button>
                  </form>
                  <form action={deleteRoute.bind(null, r.id)} className="md:col-start-5">
                    <button className="bg-red-600 text-white px-3 py-2 rounded text-sm hover:bg-red-700 w-full">Delete</button>
                  </form>
                </div>
              </details>
            ))}
          </div>
        )}
      </section>

      <section className="bg-white border border-slate-200 rounded-lg p-4 space-y-3">
        <h2 className="font-semibold">Schedule a trip</h2>
        {buses.length === 0 || routes.length === 0 ? (
          <p className="text-sm text-slate-500">Add at least one bus and one route first.</p>
        ) : (
          <form action={createTrip} className="grid grid-cols-1 md:grid-cols-5 gap-2 items-end">
            <div>
              <label className="block text-sm font-medium mb-1">Bus</label>
              <select name="busId" className="w-full rounded border border-slate-300 px-3 py-2">
                {buses.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Route</label>
              <select name="routeId" className="w-full rounded border border-slate-300 px-3 py-2">
                {routes.filter((r) => r.isActive).map((r) => <option key={r.id} value={r.id}>{r.origin} → {r.destination}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Departure</label>
              <input type="datetime-local" name="departureAt" required className="w-full rounded border border-slate-300 px-3 py-2" />
            </div>
            <Field name="fareBdt" label="Fare (BDT)" type="number" />
            <button className="bg-brand text-white py-2 rounded hover:bg-brand-dark">Add trip</button>
          </form>
        )}
      </section>

      <section className="bg-white border border-slate-200 rounded-lg">
        <div className="p-4 border-b font-semibold">Upcoming & recent trips</div>
        <div className="divide-y">
          {trips.map((t) => (
            <details key={t.id} className="group">
              <summary className="px-4 py-3 cursor-pointer flex items-center justify-between gap-3 text-sm hover:bg-slate-50 flex-wrap">
                <span className="font-medium">{new Date(t.departureAt).toLocaleString('en-GB')}</span>
                <span className="text-slate-600">{t.route.origin} → {t.route.destination}</span>
                <span className="text-slate-600">{t.bus.name}</span>
                <span>৳{t.fareBdt}</span>
                <StatusBadge s={t.status} />
                <span className="text-xs text-slate-500">{t._count.bookings} bookings</span>
                <span className="text-brand text-xs">Edit ▾</span>
              </summary>
              <div className="px-4 pb-4 grid grid-cols-1 md:grid-cols-[1fr_1fr_1fr_auto_auto] gap-2 items-end">
                <form action={updateTrip.bind(null, t.id)} className="contents">
                  <div>
                    <label className="block text-sm font-medium mb-1">Departure</label>
                    <input type="datetime-local" name="departureAt" defaultValue={toLocalInput(new Date(t.departureAt))} className="w-full rounded border border-slate-300 px-3 py-2" />
                  </div>
                  <Field name="fareBdt" label="Fare" type="number" defaultValue={String(t.fareBdt)} />
                  <div>
                    <label className="block text-sm font-medium mb-1">Status</label>
                    <select name="status" defaultValue={t.status} className="w-full rounded border border-slate-300 px-3 py-2">
                      <option>SCHEDULED</option><option>BOARDING</option><option>IN_TRANSIT</option><option>COMPLETED</option><option>CANCELLED</option>
                    </select>
                  </div>
                  <button className="bg-brand text-white px-3 py-2 rounded text-sm hover:bg-brand-dark">Save</button>
                </form>
                <form action={deleteTrip.bind(null, t.id)} className="md:col-start-5">
                  <button className="bg-red-600 text-white px-3 py-2 rounded text-sm hover:bg-red-700 w-full">Delete</button>
                </form>
              </div>
            </details>
          ))}
          {trips.length === 0 && <div className="p-4 text-slate-500 text-sm">No trips yet.</div>}
        </div>
      </section>
    </div>
  );
}

function Field({ name, label, type = 'text', placeholder, defaultValue }: { name: string; label: string; type?: string; placeholder?: string; defaultValue?: string }) {
  return (
    <div>
      <label className="block text-sm font-medium mb-1">{label}</label>
      <input name={name} type={type} placeholder={placeholder} defaultValue={defaultValue} required className="w-full rounded border border-slate-300 px-3 py-2" />
    </div>
  );
}

function StatusBadge({ s }: { s: string }) {
  const color =
    s === 'SCHEDULED' ? 'bg-blue-100 text-blue-800' :
    s === 'BOARDING' ? 'bg-amber-100 text-amber-800' :
    s === 'IN_TRANSIT' ? 'bg-green-100 text-green-800' :
    s === 'COMPLETED' ? 'bg-slate-200 text-slate-700' :
    'bg-red-100 text-red-800';
  return <span className={`px-2 py-0.5 rounded text-xs ${color}`}>{s}</span>;
}
