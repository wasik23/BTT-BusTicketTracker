'use client';

import { useState } from 'react';
import type { SeatLayout } from '@/lib/seat-layout';

interface Props {
  layout: SeatLayout;
  takenSeats: string[];
  heldSeats: string[];
  maxSelectable?: number;
  onChange?: (selected: string[]) => void;
}

export default function SeatPicker({ layout, takenSeats, heldSeats, maxSelectable = 6, onChange }: Props) {
  const [selected, setSelected] = useState<string[]>([]);
  const taken = new Set(takenSeats);
  const held = new Set(heldSeats);

  function toggle(label: string) {
    if (taken.has(label) || held.has(label)) return;
    let next: string[];
    if (selected.includes(label)) {
      next = selected.filter((s) => s !== label);
    } else {
      if (selected.length >= maxSelectable) return;
      next = [...selected, label];
    }
    setSelected(next);
    onChange?.(next);
  }

  return (
    <div>
      <div className="flex gap-4 text-xs mb-4">
        <Legend className="seat-available" label="Available" />
        <Legend className="seat-selected" label="Selected" />
        <Legend className="seat-held" label="Reserved" />
        <Legend className="seat-taken" label="Booked" />
      </div>
      <div className="inline-block bg-slate-50 border border-slate-200 rounded-lg p-4">
        <div className="text-center text-xs text-slate-500 mb-2">Front of bus →</div>
        <div className="space-y-1">
          {layout.map((row, ri) => (
            <div key={ri} className="flex gap-1">
              {row.map((cell, ci) => {
                if (!cell) return <div key={ci} className="seat-aisle" />;
                let cls = 'seat seat-available';
                if (taken.has(cell)) cls = 'seat seat-taken';
                else if (held.has(cell)) cls = 'seat seat-held';
                else if (selected.includes(cell)) cls = 'seat seat-selected';
                return (
                  <button
                    type="button"
                    key={ci}
                    className={cls}
                    onClick={() => toggle(cell)}
                    aria-label={`Seat ${cell}`}
                  >
                    {cell}
                  </button>
                );
              })}
            </div>
          ))}
        </div>
      </div>
      <input type="hidden" name="seats" value={selected.join(',')} />
    </div>
  );
}

function Legend({ className, label }: { className: string; label: string }) {
  return (
    <div className="flex items-center gap-1">
      <div className={`${className} w-4 h-4 rounded`} />
      <span>{label}</span>
    </div>
  );
}
