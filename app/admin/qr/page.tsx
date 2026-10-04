import { headers } from 'next/headers';
import QrSheet from '@/components/QrSheet';
import { adminOk } from '@/lib/server';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'QR-codes flights – Matchplay', robots: { index: false } };

export default async function QrPage({ searchParams }: { searchParams: Promise<{ key?: string }> }) {
  const { key } = await searchParams;
  if (!adminOk(key)) return <main className="wrap"><div className="card"><h2>Geen toegang</h2><p>Open deze pagina via de beheerlink.</p></div></main>;
  const hd = await headers();
  const base = process.env.PUBLIC_BASE_URL || `${hd.get('x-forwarded-proto') || 'http'}://${hd.get('host')}`;
  return <QrSheet base={base} back={{ href: `/admin?key=${encodeURIComponent(key!)}`, label: 'Terug naar beheer' }} />;
}
