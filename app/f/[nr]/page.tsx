import { notFound } from 'next/navigation';
import Header from '@/components/Header';
import LiveStand from '@/components/LiveStand';
import PinForm from '@/components/PinForm';
import Scorer from '@/components/Scorer';
import { FROZEN, flightByNr } from '@/lib/model';
import { pinOk } from '@/lib/server';

export const dynamic = 'force-dynamic';

export default async function FlightPage({ params, searchParams }: { params: Promise<{ nr: string }>; searchParams: Promise<{ pin?: string }> }) {
  const nr = Number((await params).nr); const { pin } = await searchParams;
  const fl = flightByNr(nr); if (!fl) notFound();
  if (FROZEN) return (<><Header sub="Einduitslag – 29 september 2026" /><LiveStand /></>);
  if (!pinOk(nr, pin)) return (
    <>
      <Header sub={`Flight ${nr} – start ${fl.start}`} />
      <main className="wrap"><div className="card"><h2>Pincode flight {nr}</h2><p>Vul de pincode van je flight in.</p><PinForm nr={nr} error={pin !== undefined} /></div></main>
    </>
  );
  return (<><Header sub={`Flight ${nr} – start ${fl.start} – 29 september 2026`} /><Scorer nr={nr} pin={pin!} /></>);
}
