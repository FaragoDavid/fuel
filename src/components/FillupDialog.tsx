import { format } from 'date-fns';
import { useEffect, useState } from 'react';

import type { Fillup } from '../types';
import { formatNum } from '../utils/format';

interface Props {
  initial?: Fillup;
  onSave: (f: Fillup) => void;
  onCancel: () => void;
}

function emptyForm() {
  return { date: format(new Date(), 'yyyy-MM-dd'), totalCost: '', liters: '', tripKm: '', odometer: '' };
}

function fillupToForm(f: Fillup) {
  const month = String(f.month).padStart(2, '0');
  const day = String(f.day).padStart(2, '0');
  return {
    date: `${f.year}-${month}-${day}`,
    totalCost: f.totalCost != null ? formatNum(f.totalCost) : '',
    liters: f.liters?.toString().replace('.', ',') ?? '',
    tripKm: f.tripKm?.toString().replace('.', ',') ?? '',
    odometer: f.odometer != null ? formatNum(f.odometer) : '',
  };
}

function parseHu(s: string): number {
  return parseFloat(s.replace(/\s/g, '').replace(',', '.'));
}

export default function FillupDialog({ initial, onSave, onCancel }: Props) {
  const [form, setForm] = useState(() => (initial ? fillupToForm(initial) : emptyForm()));

  const set = (key: string, value: string) => setForm((prev) => ({ ...prev, [key]: value }));

  function blurInt(key: string, value: string) {
    const n = parseHu(value);
    if (!isNaN(n) && value !== '') set(key, formatNum(Math.round(n)));
  }

  function blurDecimal(key: string, value: string) {
    const n = parseHu(value);
    if (!isNaN(n) && value !== '') set(key, formatNum(n, 0, 10));
  }

  function focusNum(key: string, value: string) {
    set(key, value.replace(/\s/g, ''));
  }

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onCancel();
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [onCancel]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.date) return;

    const [year, month, day] = form.date.split('-').map(Number);
    const f: Fillup = { id: initial?.id ?? '', year, month, day };
    const cost = parseHu(form.totalCost);
    const liters = parseHu(form.liters);
    const tripKm = parseHu(form.tripKm);
    const odometer = parseHu(form.odometer);

    if (!isNaN(cost)) f.totalCost = cost;
    if (!isNaN(liters)) f.liters = liters;
    if (!isNaN(tripKm)) f.tripKm = tripKm;
    if (!isNaN(odometer)) f.odometer = odometer;

    onSave(f);
  };

  return (
    <div className="overlay" onClick={onCancel}>
      <div className="modal max-w-sm p-6" onClick={(e) => e.stopPropagation()}>
        <h2 className="modal-title">{initial ? 'Tankolás szerkesztése' : 'Új tankolás'}</h2>
        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          <Field label="Dátum" type="date" value={form.date} onChange={(v) => set('date', v)} required />
          <Field
            label="Összeg (Ft)"
            type="text"
            inputMode="numeric"
            value={form.totalCost}
            onChange={(v) => set('totalCost', v)}
            onFocus={() => focusNum('totalCost', form.totalCost)}
            onBlur={(v) => blurInt('totalCost', v)}
          />
          <Field
            label="Liter"
            type="text"
            inputMode="decimal"
            value={form.liters}
            onChange={(v) => set('liters', v)}
            onFocus={() => focusNum('liters', form.liters)}
            onBlur={(v) => blurDecimal('liters', v)}
          />
          <Field
            label="Trip km"
            type="text"
            inputMode="decimal"
            value={form.tripKm}
            onChange={(v) => set('tripKm', v)}
            onFocus={() => focusNum('tripKm', form.tripKm)}
            onBlur={(v) => blurDecimal('tripKm', v)}
          />
          <Field
            label="Kmóraállás"
            type="text"
            inputMode="numeric"
            value={form.odometer}
            onChange={(v) => set('odometer', v)}
            onFocus={() => focusNum('odometer', form.odometer)}
            onBlur={(v) => blurInt('odometer', v)}
          />
          <div className="flex gap-2 justify-end mt-2">
            <button type="button" onClick={onCancel} className="btn-secondary">
              Mégse
            </button>
            <button type="submit" className="btn-primary">
              Mentés
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

interface FieldProps {
  label: string;
  type: string;
  inputMode?: React.HTMLAttributes<HTMLInputElement>['inputMode'];
  value: string;
  onChange: (v: string) => void;
  onFocus?: () => void;
  onBlur?: (v: string) => void;
  required?: boolean;
}

function Field({ label, type, value, onChange, onFocus, onBlur, ...rest }: FieldProps) {
  return (
    <div className="form-field">
      <label className="form-label">{label}</label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onFocus={onFocus}
        onBlur={onBlur ? (e) => onBlur(e.target.value) : undefined}
        className="form-input"
        {...rest}
      />
    </div>
  );
}
