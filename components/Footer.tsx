import { FROZEN } from '@/lib/model';

export default function Footer() {
  return (
    <footer className="foot noprint"><div className="wrap">
      <a href="/">Start</a><a href="/stand">{FROZEN ? 'Uitslag' : 'Stand'}</a>
      {FROZEN && <a href="/qr">QR-codes per flight (ter illustratie)</a>}
    </div></footer>
  );
}
