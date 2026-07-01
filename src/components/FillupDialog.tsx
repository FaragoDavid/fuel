import { useState } from 'react';
import type { Fillup } from '../types/fillup';

interface Props {
  initial?: Fillup;
  onSave: (f: Fillup) => void;
  onCancel: () => void;
}

function emptyForm() {
  return { date: '', totalCost: '', liters: '', tripKm: '', odometer: '' };
}

function fillupToForm(f: Fillup) {
  const month = String(f.month).padStart(2, '0');
  const day = String(f.day).padStart(2, '0');
  return {
    date: `${f.year}-${month}-${day}`,
    totalCost: f.totalCost?.toString() ?? '',
    liters: f.liters?.toString() ?? '',
    tripKm: f.tripKm?.toString() ?? '',
    odometer: f.odometer?.toString() ?? '',
  };
}

export default function FillupDialog({ initial, onSave, onCancel }: Props) {
  const [form, setForm] = useState(() => (initial ? fillupToForm(initial) : emptyForm()));

  const set = (key: string, value: string) => setForm((prev) => ({ ...prev, [key]: value }));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.date) return;

    const [year, month, day] = form.date.split('-').map(Number);
    const f: Fillup = { id: initial?.id ?? '', year, month, day };
    const cost = parseFloat(form.totalCost);
    const liters = parseFloat(form.liters);
    const tripKm = parseFloat(form.tripKm);
    const odometer = parseFloat(form.odometer);

    if (!isNaN(cost)) f.totalCost = cost;
    if (!isNaN(liters)) f.liters = liters;
    if (!isNaN(tripKm)) f.tripKm = tripKm;
    if (!isNaN(odometer)) f.odometer = odometer;

    onSave(f);
  };

  return (
    <div className="overlay">
      <div className="modal max-w-sm p-6">
        <h2 className="modal-title">{initial ? 'Tankolás szerkesztése' : 'Új tankolás'}</h2>
        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          <Field label="Dátum" type="date" value={form.date} onChange={(v) => set('date', v)} required />
          <Field label="Összeg (Ft)" type="number" value={form.totalCost} onChange={(v) => set('totalCost', v)} min="1" step="1" />
          <Field label="Liter" type="number" value={form.liters} onChange={(v) => set('liters', v)} step="0.01" min="0.01" />
          <Field label="Trip km" type="number" value={form.tripKm} onChange={(v) => set('tripKm', v)} step="0.1" min="0.1" />
          <Field label="Kmóraállás" type="number" value={form.odometer} onChange={(v) => set('odometer', v)} min="1" step="1" />
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
  value: string;
  onChange: (v: string) => void;
  required?: boolean;
  step?: string;
  min?: string;
}

function Field({ label, type, value, onChange, ...rest }: FieldProps) {
  return (
    <div className="form-field">
      <label className="form-label">{label}</label>
      <input type={type} value={value} onChange={(e) => onChange(e.target.value)} className="form-input" {...rest} />
    </div>
  );
}
