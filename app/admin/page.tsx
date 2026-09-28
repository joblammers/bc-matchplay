import { headers } from 'next/headers';
import Header from '@/components/Header';
import ResetButton from '@/components/ResetButton';
import { FLIGHTS } from '@/lib/model';
import { adminOk, pinFor, usingRedis } from '@/lib/server';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Beheer – Matchplay', robots: { index: false } };

export default async function Admin({ searchParams }: { searchParams: Promise<{ key?: string }> }) {
  const { key } = await searchParams;
  if (!adminOk(key)) return (<><Header /><main className="wrap"><div className="card"><h2>Geen toegang</h2><p>Open deze pagina met de beheerlink.</p></div></main></>);
  const hd = await headers();
  const base = process.env.PUBLIC_BASE_URL || `${hd.get('x-forwarded-proto') || 'http'}://${hd.get('host')}`;
  return (
    <>
      <Header sub="Beheer – links en pincodes" />
      <main className="wrap">
        {!usingRedis && <div className="banner">Let op: er is geen Redis-database gekoppeld; scores staan nu alleen in het geheugen van de server.</div>}
        <h2>Links per flight</h2>
        <div className="tablewrap"><table>
          <thead><tr><th>Flight</th><th>Start</th><th>Teams</th><th className="num">Pincode</th><th>Link</th></tr></thead>
          <tbody>{FLIGHTS.map(fl => {
            const pin = pinFor(fl.nr), url = `${base}/f/${fl.nr}?pin=${pin}`;
            return (<tr key={fl.nr}><td className="rank">{fl.nr}</td><td>{fl.start}</td><td className="team">{fl.teams.map((t: any) => t.label).join(' / ')}</td>
              <td className="num"><b>{pin}</b></td><td><a href={url} target="_blank">{url}</a></td></tr>);
          })}</tbody>
        </table></div>
        <p className="note">Stand (alleen lezen): <a href={`${base}/stand`} target="_blank">{base}/stand</a></p>
        <div className="tools"><a className="btn" href={`/admin/qr?key=${encodeURIComponent(key!)}`}>QR-codes afdrukken (A4)</a><ResetButton k={key!} /></div>
      </main>
    </>
  );
}
