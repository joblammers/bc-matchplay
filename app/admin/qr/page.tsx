import { headers } from 'next/headers';
import QRCode from 'qrcode';
import { CLUBS, FLIGHTS } from '@/lib/model';
import { adminOk, pinFor } from '@/lib/server';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'QR-codes flights – Matchplay', robots: { index: false } };

export default async function QrPage({ searchParams }: { searchParams: Promise<{ key?: string }> }) {
  const { key } = await searchParams;
  if (!adminOk(key)) return <main className="wrap"><div className="card"><h2>Geen toegang</h2><p>Open deze pagina via de beheerlink.</p></div></main>;
  const hd = await headers();
  const base = process.env.PUBLIC_BASE_URL || `${hd.get('x-forwarded-proto') || 'http'}://${hd.get('host')}`;
  const cards = await Promise.all(FLIGHTS.map(async fl => {
    const pin = pinFor(fl.nr), url = `${base}/f/${fl.nr}?pin=${pin}`;
    const svg = await QRCode.toString(url, { type: 'svg', margin: 0, errorCorrectionLevel: 'M', color: { dark: '#014E36', light: '#FFFFFF' } });
    return { fl, pin, url, svg };
  }));
  return (
    <div className="qrsheet">
      <div className="qrbar noprint">
        <b>QR-codes per flight</b> – print op A4 (staand, 100%, zonder kop- en voetteksten). 6 kaarten per vel, 2 kolommen.
        <a className="btn" href={`/admin?key=${encodeURIComponent(key!)}`}>Terug naar beheer</a>
      </div>
      <div className="qrgrid">
        {cards.map(c => (
          <div className="qrc" key={c.fl.nr}>
            <div className="qrc-top">
              <img src="/rydercup.jpg" alt="" />
              <div><div className="qrc-fn">Flight {c.fl.nr}</div><div className="qrc-st">Start hole {c.fl.order[0]} ({c.fl.start})</div></div>
            </div>
            <div className="qrc-body">
              <div className="qrc-qr" dangerouslySetInnerHTML={{ __html: c.svg }} />
              <div className="qrc-teams">
                {c.fl.teams.map((t: any) => (
                  <div key={t.id} className="qrc-team">
                    {t.club && <img src={CLUBS[t.club as keyof typeof CLUBS].logo} alt="" />}
                    <div>{t.club && <small>{CLUBS[t.club as keyof typeof CLUBS].name}</small>}{t.players.map((p: any) => <div key={p.id}>{p.name}</div>)}</div>
                  </div>
                ))}
                <div className="qrc-pin">Pincode <b>{c.pin}</b></div>
              </div>
            </div>
            <div className="qrc-foot">Scan om de scores van deze flight in te voeren · {c.url.replace(/^https?:\/\//, '')}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
