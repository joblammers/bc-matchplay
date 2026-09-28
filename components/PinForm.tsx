'use client';
import { useState } from 'react';
import { FLIGHTS } from '@/lib/model';

export default function PinForm({ nr, error }: { nr?: number; error?: boolean }) {
  const [f, setF] = useState(String(nr ?? FLIGHTS[0].nr));
  const [pin, setPin] = useState('');
  const submit = (e: React.FormEvent) => { e.preventDefault(); location.href = `/f/${f}?pin=${encodeURIComponent(pin.trim())}`; };
  return (
    <form className="form" onSubmit={submit}>
      {nr === undefined && <select value={f} onChange={e => setF(e.target.value)} aria-label="Flight">
        {FLIGHTS.map(x => <option key={x.nr} value={x.nr}>Flight {x.nr} – start {x.start}</option>)}</select>}
      <input inputMode="numeric" pattern="[0-9]*" maxLength={4} placeholder="Pincode" aria-label="Pincode" value={pin} onChange={e => setPin(e.target.value)} />
      <button className="btn" type="submit">Scores invoeren</button>
      {error && <div className="err" style={{ flexBasis: '100%' }}>Deze pincode hoort niet bij flight {nr}. Kijk op de scorekaart of vraag de wedstrijdleiding.</div>}
    </form>
  );
}
