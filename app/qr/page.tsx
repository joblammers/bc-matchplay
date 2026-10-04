import { headers } from 'next/headers';
import { notFound } from 'next/navigation';
import QrSheet from '@/components/QrSheet';
import { FROZEN } from '@/lib/model';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'QR-codes flights – Matchplay', robots: { index: false } };

// Openbaar pas na afloop: de pincodes geven dan geen schrijftoegang meer.
export default async function PublicQrPage() {
  if (!FROZEN) notFound();
  const hd = await headers();
  const base = process.env.PUBLIC_BASE_URL || `${hd.get('x-forwarded-proto') || 'http'}://${hd.get('host')}`;
  return <QrSheet base={base} back={{ href: '/stand', label: 'Naar de uitslag' }}
    note="ter illustratie: zo kreeg elke flight een kaart om de scores op de baan in te voeren. De wedstrijd is afgelopen; invoeren kan niet meer." />;
}
