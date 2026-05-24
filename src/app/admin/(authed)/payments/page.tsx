import { revalidatePath } from 'next/cache';
import { getSetting, setSetting } from '@/lib/settings';

export const dynamic = 'force-dynamic';

async function savePayments(formData: FormData) {
  'use server';

  const bkashEnabled = formData.get('bkashEnabled') === 'on';
  const nagadEnabled = formData.get('nagadEnabled') === 'on';
  const cashEnabled  = formData.get('cashEnabled')  === 'on';
  const holdMinutes  = Math.max(5, Math.min(1440, parseInt(String(formData.get('holdMinutes') || '120'), 10) || 120));
  const serviceFee   = Math.max(0, parseInt(String(formData.get('serviceFee') || '0'), 10) || 0);

  await Promise.all([
    setSetting('payment.bkash.enabled', bkashEnabled),
    setSetting('payment.nagad.enabled', nagadEnabled),
    setSetting('payment.cashOnBoard.enabled', cashEnabled),
    setSetting('payment.cashOnBoard.holdMinutes', holdMinutes),
    setSetting('payment.serviceFeeBdt', serviceFee)
  ]);

  // Save credentials only if non-empty (so leaving fields blank doesn't wipe them)
  const secrets: Array<[string, FormDataEntryValue | null]> = [
    ['payment.bkash.appKey', formData.get('bkashAppKey')],
    ['payment.bkash.appSecret', formData.get('bkashAppSecret')],
    ['payment.bkash.username', formData.get('bkashUsername')],
    ['payment.bkash.password', formData.get('bkashPassword')],
    ['payment.nagad.merchantId', formData.get('nagadMerchantId')],
    ['payment.nagad.merchantNumber', formData.get('nagadMerchantNumber')]
  ];
  for (const [key, val] of secrets) {
    const v = String(val ?? '').trim();
    if (v) await setSetting(key, v, true);
  }
  await Promise.all([
    setSetting('payment.bkash.sandbox', formData.get('bkashSandbox') === 'on'),
    setSetting('payment.nagad.sandbox', formData.get('nagadSandbox') === 'on')
  ]);

  revalidatePath('/admin/payments');
}

export default async function PaymentsAdminPage() {
  const [bkashEnabled, nagadEnabled, cashEnabled, holdMinutes, serviceFee, bkashSandbox, nagadSandbox] = await Promise.all([
    getSetting<boolean>('payment.bkash.enabled', false),
    getSetting<boolean>('payment.nagad.enabled', false),
    getSetting<boolean>('payment.cashOnBoard.enabled', true),
    getSetting<number>('payment.cashOnBoard.holdMinutes', 120),
    getSetting<number>('payment.serviceFeeBdt', 0),
    getSetting<boolean>('payment.bkash.sandbox', true),
    getSetting<boolean>('payment.nagad.sandbox', true)
  ]);

  return (
    <div className="max-w-2xl space-y-6">
      <h1 className="text-2xl font-bold">Payment methods</h1>
      <p className="text-sm text-slate-600">Toggle which payment methods are available to customers, and enter your merchant credentials when you have them.</p>

      <form action={savePayments} className="space-y-6">
        <Section title="bKash">
          <Toggle name="bkashEnabled" defaultChecked={bkashEnabled} label="Enable bKash payments" />
          <Field name="bkashAppKey" label="App Key" placeholder="leave blank to keep existing" />
          <Field name="bkashAppSecret" label="App Secret" type="password" placeholder="leave blank to keep existing" />
          <Field name="bkashUsername" label="Username" placeholder="leave blank to keep existing" />
          <Field name="bkashPassword" label="Password" type="password" placeholder="leave blank to keep existing" />
          <Toggle name="bkashSandbox" defaultChecked={bkashSandbox} label="Sandbox mode (testing)" />
        </Section>

        <Section title="Nagad">
          <Toggle name="nagadEnabled" defaultChecked={nagadEnabled} label="Enable Nagad payments" />
          <Field name="nagadMerchantId" label="Merchant ID" placeholder="leave blank to keep existing" />
          <Field name="nagadMerchantNumber" label="Merchant Number" placeholder="leave blank to keep existing" />
          <Toggle name="nagadSandbox" defaultChecked={nagadSandbox} label="Sandbox mode (testing)" />
        </Section>

        <Section title="Cash on Board">
          <Toggle name="cashEnabled" defaultChecked={cashEnabled} label="Enable Cash on Board (pay at bus)" />
          <Field name="holdMinutes" label="Hold seat for (minutes)" type="number" defaultValue={String(holdMinutes)} />
          <p className="text-xs text-slate-500">If the passenger doesn&apos;t board within this time, the seat is auto-released for sale to others.</p>
        </Section>

        <Section title="Other">
          <Field name="serviceFee" label="Service fee per booking (BDT)" type="number" defaultValue={String(serviceFee)} />
        </Section>

        <button className="bg-brand text-white px-4 py-2 rounded hover:bg-brand-dark">Save payment settings</button>
      </form>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <fieldset className="bg-white border border-slate-200 rounded-lg p-4 space-y-3">
      <legend className="px-1 font-semibold">{title}</legend>
      {children}
    </fieldset>
  );
}

function Field({ name, label, type = 'text', defaultValue, placeholder }: { name: string; label: string; type?: string; defaultValue?: string; placeholder?: string }) {
  return (
    <div>
      <label className="block text-sm font-medium mb-1">{label}</label>
      <input name={name} type={type} defaultValue={defaultValue} placeholder={placeholder} className="w-full rounded border border-slate-300 px-3 py-2" />
    </div>
  );
}

function Toggle({ name, defaultChecked, label }: { name: string; defaultChecked?: boolean; label: string }) {
  return (
    <label className="flex items-center gap-2 text-sm">
      <input type="checkbox" name={name} defaultChecked={defaultChecked} /> {label}
    </label>
  );
}
