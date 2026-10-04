'use client';
import { CLUBS, FLIGHTS, HOLE, csv, evalMatch, fmtPts, holeStats, standings, val, type Scores } from '@/lib/model';
import ClubChart from './ClubChart';

/** Scorekaart van één partij: bruto per hole, slagen (•), wie de hole won en de lopende stand. */
function MatchCard({ scores, fl, m }: { scores: Scores; fl: any; m: any }) {
  const r = evalMatch(scores, fl, m);
  const bucket = m.kind === 'single' ? 'g' : 't';
  const side = (s: 'a' | 'b') => {
    const p = m[s], won = s === 'a' ? 1 : -1;
    return (
      <tr>
        <th className="who"><span className={`tag tag${p.team.letter}`}>{p.team.letter}</span>{p.label}</th>
        {m.holes.map((h: number, i: number) => {
          const v = val(scores, fl, bucket, p.id, h), st = m.recv === s ? m.map[h] : 0;
          const cls = i >= r.per.length ? 'out' : r.per[i] === won ? `win${p.team.letter}` : '';
          return <td key={h} className={cls}>{v === null ? '' : v < 0 ? '–' : v}{st > 0 && <sup>{'•'.repeat(st)}</sup>}</td>;
        })}
      </tr>
    );
  };
  let lead = 0;
  return (
    <div className="sc">
      <div className="sc-h"><span>{m.kind === 'single' ? `Singles ${m.pos}e` : 'Greensome'}</span>
        <span className={r.cls}>{r.text}</span></div>
      <div className="sc-scroll"><table className="sc-t">
        <thead>
          <tr><th>Hole</th>{m.holes.map((h: number) => <th key={h}>{h}</th>)}</tr>
          <tr className="par"><th>Par</th>{m.holes.map((h: number) => <td key={h}>{HOLE[h].par}</td>)}</tr>
        </thead>
        <tbody>
          {side('a')}{side('b')}
          <tr className="run"><th>Stand</th>{m.holes.map((h: number, i: number) => {
            if (i >= r.per.length) return <td key={h} className="out" />;
            lead += r.per[i];
            const t = lead > 0 ? m.a.team : lead < 0 ? m.b.team : null;
            return <td key={h} className={t ? `lead${t.letter}` : ''}>{lead === 0 ? 'AS' : `${Math.abs(lead)}↑`}</td>;
          })}</tr>
        </tbody>
      </table></div>
    </div>
  );
}

/** Per baanhole: par, SI, gemiddelde bruto (singles en greensome samen) en wie de hole won. */
function HoleTable({ scores }: { scores: Scores }) {
  const rows = holeStats(scores);
  if (!rows.some(o => o.H + o.A + o.half)) return null;
  return (
    <>
      <h2>Per hole</h2>
      <div className="tablewrap"><table className="ht">
        <thead><tr><th>Hole</th><th className="num">Par</th><th className="num">SI</th><th className="num">Gem. bruto</th>
          <th className="num">{CLUBS.H.name}</th><th className="num">Gelijk</th><th className="num">{CLUBS.A.name}</th></tr></thead>
        <tbody>{rows.map(o => {
          const n = o.H + o.A + o.half;
          return (
            <tr key={o.h}><td className="rank">{o.h}</td><td className="num">{o.par}</td><td className="num">{o.si}</td>
              <td className="num">{o.avg === null ? '' : <>{o.avg.toFixed(1).replace('.', ',')} <small className={o.avg - o.par > 1 ? 'hard' : ''}>({o.avg >= o.par ? '+' : ''}{(o.avg - o.par).toFixed(1).replace('.', ',')})</small></>}</td>
              <td className="num">{o.H}</td><td className="num">{o.half}</td><td className="num">{o.A}</td>
              <td className="htbar" aria-hidden="true">{n > 0 && <span>
                <i className="bH" style={{ flexGrow: o.H }} /><i className="bhalf" style={{ flexGrow: o.half }} /><i className="bA" style={{ flexGrow: o.A }} /></span>}</td></tr>
          );
        })}</tbody>
      </table></div>
      <p className="note">Gewonnen holes in partijen tussen de clubs (netto, met slagen). Gemiddelde bruto over alle gespeelde scores op die hole; opgepakte ballen tellen niet mee.</p>
    </>
  );
}

export default function Stand({ scores, onEdit, editable }: { scores: Scores; onEdit?: (nr: number) => void; editable?: number }) {
  const rows = standings(scores);
  const download = () => {
    const blob = new Blob([csv(scores)], { type: 'text/csv;charset=utf-8' });
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = 'uitslag-matchplay-29-09-2026.csv'; a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 1000);
  };
  return (
    <>
      <ClubChart scores={scores} />
      <h2>Klassement teams</h2>
      <div className="tablewrap"><table>
        <thead><tr><th></th><th>Team</th><th>Flight</th><th className="num">Punten</th><th className="num">Saldo</th><th className="num">Klaar</th></tr></thead>
        <tbody>{rows.map((r, i) => (
          <tr key={r.t.id}><td className="rank">{i + 1}</td><td className="team">{r.t.players.map((p: any) => p.name).join(' & ')}</td><td>{r.fl.nr}</td>
            <td className="num"><b>{fmtPts(r.pts) || '0'}</b></td><td className="num">{r.diff > 0 ? '+' : ''}{r.diff}</td><td className="num">{r.done}/{r.total}</td></tr>
        ))}</tbody>
      </table></div>
      <p className="note">Gewonnen partij = 1 punt, gelijk = ½. Alleen afgeronde partijen tellen mee; bij gelijke punten beslist het saldo gewonnen holes.</p>
      <HoleTable scores={scores} />
      <h2>Per flight</h2>
      {FLIGHTS.map(fl => {
        const res = fl.matches.map((m: any) => ({ m, r: evalMatch(scores, fl, m) }));
        const pts = fl.teams.map((t: any) => res.reduce((a: number, { m, r }: any) => a + (r.done ? (m.teamA === t ? r.pa : m.teamB === t ? r.pb : 0) : 0), 0));
        return (
          <div className="fcard" key={fl.nr}>
            <div className="fh"><b>Flight {fl.nr} – start {fl.start}</b>
              {onEdit && editable === fl.nr && <button onClick={() => onEdit(fl.nr)}>Scores invoeren</button>}</div>
            {res.map(({ m, r }: any, i: number) => (
              <div className="ml" key={i}>
                <span className="k">{m.kind === 'single' ? `1e 9 · Singles ${m.pos}e` : '2e 9 · Greensome'}{fl.teams.length > 2 ? ` ${m.teamA.letter}–${m.teamB.letter}` : ''}</span>
                <span>{m.a.label} – {m.b.label}</span>
                <span className={`r ${r.cls}`} style={{ color: r.cls === 'lead-a' ? 'var(--green)' : r.cls === 'lead-b' ? 'var(--purple)' : 'inherit' }}>{r.text}</span>
              </div>
            ))}
            <div className="score">{fl.teams.map((t: any, i: number) => <span key={t.id}>Team {t.letter} {t.label}: <b>{fmtPts(pts[i]) || '0'}</b></span>)}</div>
            {res.some(({ r }: any) => r.contiguous > 0) && <details className="perhole"><summary>Scores per hole</summary>
              {res.map(({ m }: any, i: number) => <MatchCard key={i} scores={scores} fl={fl} m={m} />)}
              <p className="note">Bruto scores; • = slag(en) op die hole. Gekleurd vak = hole gewonnen (netto). – = opgepakt.</p>
            </details>}
          </div>
        );
      })}
      <div className="tools"><button onClick={download}>Download uitslag (CSV)</button></div>
    </>
  );
}
