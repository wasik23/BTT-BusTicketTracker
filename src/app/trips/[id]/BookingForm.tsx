'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import SeatPicker from '@/components/SeatPicker';
import type { SeatLayout } from '@/lib/seat-layout';

interface Props {
  tripId: string;
  fareBdt: number;
  layout: SeatLayout;
  takenSeats: string[];
  heldSeats: string[];
  payment: {
    bkashEnabled: boolean;
    nagadEnabled: boolean;
    cashEnabled: boolean;
    holdMinutes: number;
    serviceFee: number;
  };
}

type Method = 'BKASH' | 'NAGAD' | 'CASH_ON_BOARD';

export default function BookingForm({ tripId, fareBdt, layout, takenSeats, heldSeats, payment }: Props) {
  const router = useRouter();
  const [selected, setSelected] = useState<string[]>([]);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [method, setMethod] = useState<Method | ''>('');
  const [submitting, setSubmitting] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const subtotal = selected.length * fareBdt;
  const total = subtotal + (subtotal > 0 ? payment.serviceFee : 0);

  const availableMethods: Method[] = [];
  if (payment.bkashEnabled) availableMethods.push('BKASH');
  if (payment.nagadEnabled) availableMethods.push('NAGAD');
  if (payment.cashEnabled) availableMethods.push('CASH_ON_BOARD');

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    if (selected.length === 0) return setErr('Pick at least one seat.');
    if (!method) return setErr('Choose a payment method.');
    setSubmitting(true);
    try {
      const res = await fetch('/api/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tripId,
          seats: selected,
          passengerName: name,
          passengerPhone: phone,
          passengerEmail: email || undefined,
          paymentMethod: method
        })
      });
      const data = await res.json();
      if (!res.ok) {
        setErr(data.error || 'Booking failed. Try again.');
        setSubmitting(false);
        return;
      }
      if (data.redirectUrl) {
        window.location.href = data.redirectUrl;
      } else {
        router.push(`/bookings/${data.reference}`);
      }
    } catch (e) {
      setErr('Network error. Try again.');
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-6">
      <SeatPicker layout={layout} takenSeats={takenSeats} heldSeats={heldSeats} onChange={setSelected} />

      <div className="grid sm:grid-cols-2 gap-3">
        <div>
          <label className="block text-sm font-medium mb-1">Full name</label>
          <input value={name} onChange={(e) => setName(e.target.value)} required className="w-full rounded border border-slate-300 px-3 py-2" />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Phone</label>
          <input value={phone} onChange={(e) => setPhone(e.target.value)} required placeholder="+8801XXXXXXXXX" className="w-full rounded border border-slate-300 px-3 py-2" />
        </div>
        <div className="sm:col-span-2">
          <label className="block text-sm font-medium mb-1">Email (optional)</label>
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full rounded border border-slate-300 px-3 py-2" />
        </div>
      </div>

      <div>
        <div className="text-sm font-medium mb-2">Payment method</div>
        {availableMethods.length === 0 ? (
          <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded p-3">
            No payment methods are enabled. The admin must enable at least one method from the dashboard.
          </div>
        ) : (
          <div className="grid sm:grid-cols-3 gap-2">
            {availableMethods.map((m) => (
              <label key={m} className={`border rounded p-3 cursor-pointer ${method === m ? 'border-brand bg-brand/5' : 'border-slate-300'}`}>
                <input type="radio" name="method" value={m} checked={method === m} onChange={() => setMethod(m)} className="mr-2" />
                {m === 'BKASH' && 'bKash'}
                {m === 'NAGAD' && 'Nagad'}
                {m === 'CASH_ON_BOARD' && `Cash on Board (hold ${payment.holdMinutes} min)`}
              </label>
            ))}
          </div>
        )}
      </div>

      <div className="rounded-lg border border-slate-200 p-4 flex justify-between items-center">
        <div>
          <div className="text-slate-500 text-sm">{selected.length} seat(s) × ৳{fareBdt}</div>
          {payment.serviceFee > 0 && subtotal > 0 && (
            <div className="text-slate-500 text-xs">+ ৳{payment.serviceFee} service fee</div>
          )}
        </div>
        <div className="text-2xl font-bold text-brand">৳{total}</div>
      </div>

      {err && <div className="text-red-600 text-sm">{err}</div>}

      <button
        type="submit"
        disabled={submitting || availableMethods.length === 0}
        className="bg-brand text-white px-6 py-3 rounded-lg font-medium hover:bg-brand-dark disabled:opacity-50"
      >
        {submitting ? 'Booking…' : 'Confirm booking'}
      </button>
    </form>
  );
}
