import { redirect } from 'next/navigation';
import { db } from '@/lib/db';
import { generate2Plus2Layout, generate2Plus1Layout, countSeats } from '@/lib/seat-layout';

async function createBus(formData: FormData) {
  'use server';
  const name = String(formData.get('name') || '').trim();
  const numberPlate = String(formData.get('numberPlate') || '').trim();
  const busType = String(formData.get('busType') || 'AC');
  const layoutKind = String(formData.get('layoutKind') || '2+2');
  const rows = parseInt(String(formData.get('rows') || '10'), 10);
  const driverName = String(formData.get('driverName') || '').trim() || null;
  const driverPhone = String(formData.get('driverPhone') || '').trim() || null;
  const supervisorName = String(formData.get('supervisorName') || '').trim() || null;
  const supervisorPhone = String(formData.get('supervisorPhone') || '').trim() || null;

  if (!name || !numberPlate) throw new Error('name and numberPlate are required');

  const layout = layoutKind === '2+1' ? generate2Plus1Layout(rows) : generate2Plus2Layout(rows);
  const totalSeats = countSeats(layout);

  const bus = await db.bus.create({
    data: {
      name, numberPlate, busType, totalSeats,
      layoutJson: JSON.stringify(layout),
      driverName, driverPhone, supervisorName, supervisorPhone
    }
  });
  redirect(`/admin/buses/${bus.id}`);
}

export default function NewBusPage() {
  return (
    <div className="max-w-xl space-y-4">
      <h1 className="text-2xl font-bold">Add a bus</h1>
      <form action={createBus} className="space-y-3">
        <Field name="name" label="Bus name" placeholder="BTT Express 1" required />
        <Field name="numberPlate" label="Number plate" placeholder="Dhaka Metro Ba 11-2345" required />
        <div>
          <label className="block text-sm font-medium mb-1">Type</label>
          <select name="busType" className="w-full rounded border border-slate-300 px-3 py-2">
            <option>AC</option><option>Non-AC</option><option>Sleeper</option>
          </select>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium mb-1">Layout</label>
            <select name="layoutKind" className="w-full rounded border border-slate-300 px-3 py-2">
              <option value="2+2">2+2 (4 per row)</option>
              <option value="2+1">2+1 (3 per row)</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Number of rows</label>
            <input name="rows" type="number" defaultValue={10} min={1} max={20} className="w-full rounded border border-slate-300 px-3 py-2" />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3 pt-2">
          <Field name="driverName" label="Driver name" />
          <Field name="driverPhone" label="Driver phone" />
          <Field name="supervisorName" label="Supervisor name" />
          <Field name="supervisorPhone" label="Supervisor phone" />
        </div>
        <button className="bg-brand text-white px-4 py-2 rounded hover:bg-brand-dark">Create bus</button>
      </form>
    </div>
  );
}

function Field({ name, label, placeholder, required }: { name: string; label: string; placeholder?: string; required?: boolean }) {
  return (
    <div>
      <label className="block text-sm font-medium mb-1">{label}{required && ' *'}</label>
      <input name={name} placeholder={placeholder} required={required} className="w-full rounded border border-slate-300 px-3 py-2" />
    </div>
  );
}
