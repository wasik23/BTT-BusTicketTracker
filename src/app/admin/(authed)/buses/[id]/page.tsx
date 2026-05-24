import { notFound, redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { db } from '@/lib/db';

export const dynamic = 'force-dynamic';

async function updateBus(id: string, formData: FormData) {
  'use server';
  await db.bus.update({
    where: { id },
    data: {
      name: String(formData.get('name') || '').trim(),
      numberPlate: String(formData.get('numberPlate') || '').trim(),
      busType: String(formData.get('busType') || 'AC'),
      driverName: String(formData.get('driverName') || '').trim() || null,
      driverPhone: String(formData.get('driverPhone') || '').trim() || null,
      supervisorName: String(formData.get('supervisorName') || '').trim() || null,
      supervisorPhone: String(formData.get('supervisorPhone') || '').trim() || null,
      notes: String(formData.get('notes') || '').trim() || null,
      isActive: formData.get('isActive') === 'on'
    }
  });
  revalidatePath(`/admin/buses/${id}`);
}

async function deleteBus(id: string) {
  'use server';
  await db.bus.delete({ where: { id } });
  redirect('/admin/buses');
}

export default async function BusEditPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const bus = await db.bus.findUnique({
    where: { id },
    include: { photos: { orderBy: { order: 'asc' } } }
  });
  if (!bus) return notFound();

  return (
    <div className="max-w-2xl space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">{bus.name}</h1>
        <form action={deleteBus.bind(null, bus.id)}>
          <button className="text-red-600 text-sm hover:underline">Delete bus</button>
        </form>
      </div>

      <form action={updateBus.bind(null, bus.id)} className="space-y-3 bg-white border border-slate-200 rounded-lg p-4">
        <Field name="name" label="Name" defaultValue={bus.name} required />
        <Field name="numberPlate" label="Number plate" defaultValue={bus.numberPlate} required />
        <div>
          <label className="block text-sm font-medium mb-1">Type</label>
          <select name="busType" defaultValue={bus.busType} className="w-full rounded border border-slate-300 px-3 py-2">
            <option>AC</option><option>Non-AC</option><option>Sleeper</option>
          </select>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Field name="driverName" label="Driver name" defaultValue={bus.driverName ?? ''} />
          <Field name="driverPhone" label="Driver phone" defaultValue={bus.driverPhone ?? ''} />
          <Field name="supervisorName" label="Supervisor name" defaultValue={bus.supervisorName ?? ''} />
          <Field name="supervisorPhone" label="Supervisor phone" defaultValue={bus.supervisorPhone ?? ''} />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Notes (shown to passengers)</label>
          <textarea name="notes" defaultValue={bus.notes ?? ''} rows={3} className="w-full rounded border border-slate-300 px-3 py-2" />
        </div>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" name="isActive" defaultChecked={bus.isActive} />
          Bus is active (passengers can book trips on it)
        </label>
        <button className="bg-brand text-white px-4 py-2 rounded hover:bg-brand-dark">Save changes</button>
      </form>

      <section className="bg-white border border-slate-200 rounded-lg p-4 space-y-3">
        <h2 className="font-semibold">Photos</h2>
        <p className="text-xs text-slate-500">Photo upload coming soon. For now, you can add photo URLs directly to the database, or paste hosted image links here.</p>
        <PhotoForm busId={bus.id} />
        {bus.photos.length > 0 && (
          <ul className="text-sm space-y-1">
            {bus.photos.map((p) => (
              <li key={p.id} className="flex justify-between border-t pt-1">
                <span className="truncate">{p.url}</span>
                <form action={async () => { 'use server'; await db.busPhoto.delete({ where: { id: p.id } }); revalidatePath(`/admin/buses/${bus.id}`); }}>
                  <button className="text-red-600 text-xs hover:underline">Remove</button>
                </form>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="bg-white border border-slate-200 rounded-lg p-4">
        <h2 className="font-semibold mb-2">Seat layout</h2>
        <p className="text-xs text-slate-500 mb-2">Total seats: {bus.totalSeats}. Layout editing is read-only here for now — to change layout, recreate the bus.</p>
        <pre className="text-xs bg-slate-50 p-2 rounded overflow-x-auto">{JSON.stringify(JSON.parse(bus.layoutJson), null, 2)}</pre>
      </section>
    </div>
  );
}

function Field({ name, label, defaultValue, required }: { name: string; label: string; defaultValue?: string; required?: boolean }) {
  return (
    <div>
      <label className="block text-sm font-medium mb-1">{label}{required && ' *'}</label>
      <input name={name} defaultValue={defaultValue} required={required} className="w-full rounded border border-slate-300 px-3 py-2" />
    </div>
  );
}

function PhotoForm({ busId }: { busId: string }) {
  async function addPhoto(formData: FormData) {
    'use server';
    const url = String(formData.get('url') || '').trim();
    if (!url) return;
    const count = await db.busPhoto.count({ where: { busId } });
    await db.busPhoto.create({ data: { busId, url, order: count } });
    revalidatePath(`/admin/buses/${busId}`);
  }
  return (
    <form action={addPhoto} className="flex gap-2">
      <input name="url" placeholder="https://example.com/bus.jpg" className="flex-1 rounded border border-slate-300 px-3 py-2 text-sm" />
      <button className="bg-brand text-white px-3 py-2 rounded text-sm hover:bg-brand-dark">Add photo</button>
    </form>
  );
}
