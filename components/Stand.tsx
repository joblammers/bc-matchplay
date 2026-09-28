'use client';
import { FLIGHTS, csv, evalMatch, fmtPts, standings, type Scores } from '@/lib/model';

export default function Stand({ scores, onEdit, editable }: { scores: Scores; onEdit?: (nr: number) => void; editable?: number }) {
  const rows = standings(scores);
  const download = () => {
    const blob = new Blob([csv(scores)], { type: 'text/csv;charset=utf-8' });
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = 'uitslag-matchplay-29-09-2026.csv'; a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 1000);
  };
  return (
    <>
      <h2>Klassement teams</h2>
      <div className="tablewrap"><table>
        <thead><tr><th></th><th>Team</th><th>Flight</th><th className="num">Punten</th><th className="num">Saldo</th><th className="num">Klaar</th></tr></thead>
        <tbody>{rows.map((r, i) => (
          <tr key={r.t.id}><td className="rank">{i + 1}</td><td className="team">{r.t.players.map((p: any) => p.name).join(' & ')}</td><td>{r.fl.nr}</td>
            <td className="num"><b>{fmtPts(r.pts) || '0'}</b></td><td className="num">{r.diff > 0 ? '+' : ''}{r.diff}</td><td className="num">{r.done}/{r.total}</td></tr>
        ))}</tbody>
      </table></div>
      <p className="note">Gewonnen partij = 1 punt, gelijk = ½. Alleen afgeronde partijen tellen mee; bij gelijke punten beslist het saldo gewonnen holes. Flight 18 speelt met drie teams: daar tellen alle drie de onderlinge partijen, maar flight 18 telt niet mee voor de clubscore Heelsum – Anderstein.</p>
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
                <span className="k">{m.kind === 'single' ? `Voor 9 · ${m.pos}e` : 'Achter 9'}{fl.teams.length > 2 ? ` ${m.teamA.letter}–${m.teamB.letter}` : ''}</span>
                <span>{m.a.label} – {m.b.label}</span>
                <span className={`r ${r.cls}`} style={{ color: r.cls === 'lead-a' ? 'var(--green)' : r.cls === 'lead-b' ? 'var(--purple)' : 'inherit' }}>{r.text}</span>
              </div>
            ))}
            <div className="score">{fl.teams.map((t: any, i: number) => <span key={t.id}>Team {t.letter} {t.label}: <b>{fmtPts(pts[i]) || '0'}</b></span>)}</div>
          </div>
        );
      })}
      <div className="tools"><button onClick={download}>Download uitslag (CSV)</button></div>
    </>
  );
}
