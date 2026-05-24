import { revalidatePath } from 'next/cache';
import { getSetting, setSetting } from '@/lib/settings';

export const dynamic = 'force-dynamic';

async function saveSettings(formData: FormData) {
  'use server';
  const fields: Array<[string, string]> = [
    ['company.name', String(formData.get('name') || '')],
    ['company.address', String(formData.get('address') || '')],
    ['company.ownerName', String(formData.get('ownerName') || '')],
    ['company.ownerPhone', String(formData.get('ownerPhone') || '')],
    ['company.supportPhone', String(formData.get('supportPhone') || '')],
    ['company.complaintPhone', String(formData.get('complaintPhone') || '')],
    ['company.email', String(formData.get('email') || '')],
    ['company.aboutText', String(formData.get('about') || '')],
    ['company.termsText', String(formData.get('terms') || '')]
  ];
  for (const [k, v] of fields) await setSetting(k, v);
  revalidatePath('/admin/settings');
}

export default async function SettingsPage() {
  const get = async <T,>(k: string, fb: T) => getSetting<T>(k, fb);
  const [name, address, ownerName, ownerPhone, supportPhone, complaintPhone, email, about, terms] = await Promise.all([
    get('company.name', 'BTT - Bus Ticket Tracker'),
    get('company.address', ''),
    get('company.ownerName', ''),
    get('company.ownerPhone', ''),
    get('company.supportPhone', ''),
    get('company.complaintPhone', ''),
    get('company.email', ''),
    get('company.aboutText', ''),
    get('company.termsText', '')
  ]);

  return (
    <div className="max-w-2xl space-y-4">
      <h1 className="text-2xl font-bold">Company settings</h1>
      <p className="text-sm text-slate-600">This information is shown on the homepage, footer, and support page.</p>
      <form action={saveSettings} className="space-y-3 bg-white border border-slate-200 rounded-lg p-4">
        <Field name="name" label="Company name" defaultValue={name as string} />
        <Field name="address" label="Office address" defaultValue={address as string} />
        <div className="grid grid-cols-2 gap-3">
          <Field name="ownerName" label="Owner name" defaultValue={ownerName as string} />
          <Field name="ownerPhone" label="Owner phone" defaultValue={ownerPhone as string} />
          <Field name="supportPhone" label="Support phone" defaultValue={supportPhone as string} />
          <Field name="complaintPhone" label="Complaint phone" defaultValue={complaintPhone as string} />
        </div>
        <Field name="email" label="Email" type="email" defaultValue={email as string} />
        <div>
          <label className="block text-sm font-medium mb-1">About text</label>
          <textarea name="about" rows={3} defaultValue={about as string} className="w-full rounded border border-slate-300 px-3 py-2" />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Terms & conditions</label>
          <textarea name="terms" rows={5} defaultValue={terms as string} className="w-full rounded border border-slate-300 px-3 py-2" />
        </div>
        <button className="bg-brand text-white px-4 py-2 rounded hover:bg-brand-dark">Save</button>
      </form>
    </div>
  );
}

function Field({ name, label, type = 'text', defaultValue }: { name: string; label: string; type?: string; defaultValue?: string }) {
  return (
    <div>
      <label className="block text-sm font-medium mb-1">{label}</label>
      <input name={name} type={type} defaultValue={defaultValue} className="w-full rounded border border-slate-300 px-3 py-2" />
    </div>
  );
}
