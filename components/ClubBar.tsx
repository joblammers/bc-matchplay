'use client';
import { CLUBS, FROZEN, clubScore, fmtPts, type Scores } from '@/lib/model';

export default function ClubBar({ scores }: { scores: Scores }) {
  const c = clubScore(scores);
  const f = (p: number) => fmtPts(p) || '0';
  const lead = c.proj.H > c.proj.A ? 'H' : c.proj.A > c.proj.H ? 'A' : null;
  return (
    <div className="clubbar" aria-live="polite">
      <div className="cb-in">
        <div className={`cb-club${lead === 'H' ? ' lead' : ''}`}><img src={CLUBS.H.logo} alt="" /><span>{CLUBS.H.name}</span></div>
        <div className="cb-score">
          <b>{f(c.proj.H)}<i>–</i>{f(c.proj.A)}</b>
          <small>{FROZEN && c.finished === c.total ? `einduitslag · ${c.total} partijen` : c.started ? `verwacht · afgerond ${f(c.done.H)}–${f(c.done.A)} · ${c.finished}/${c.total} klaar` : `nog geen partijen gestart · ${c.total} partijen`}</small>
        </div>
        <div className={`cb-club${lead === 'A' ? ' lead' : ''}`}><img src={CLUBS.A.logo} alt="" /><span>{CLUBS.A.name}</span></div>
      </div>
    </div>
  );
}
