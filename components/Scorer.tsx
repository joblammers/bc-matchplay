'use client';
import { useEffect, useState } from 'react';
import { HOLE, evalMatch, firstOpen, flightByNr, holeEntries, holeName, holeState, strokesFor, val } from '@/lib/model';
import { useScores } from '@/lib/useScores';
import ClubBar from './ClubBar';
import Stand from './Stand';

export default function Scorer({ nr, pin }: { nr: number; pin: string }) {
  const fl = flightByNr(nr);
  const { scores, loaded, offline, pending, message, save } = useScores(10000);
  const [tab, setTab] = useState<'in' | 'st'>('in');
  const [idx, setIdx] = useState<number | null>(null);
  useEffect(() => { if (loaded && idx === null) setIdx(firstOpen(scores, fl)); }, [loaded, idx, scores, fl]);
  const cur = idx ?? 0;

  const go = (i: number) => { setIdx(i); window.scrollTo({ top: 0 }); };
  const showTab = (t: 'in' | 'st') => { setTab(t); window.scrollTo({ top: 0 }); };

  const h = fl.order[cur], H = HOLE[h], front = cur < 9;
  const entries = holeEntries(fl, cur);

  return (
    <>
      <ClubBar scores={scores} />
      <div className="tabbar"><nav className="tabs" role="tablist">
        <button role="tab" aria-selected={tab === 'in'} onClick={() => showTab('in')}>Scores invoeren</button>
        <button role="tab" aria-selected={tab === 'st'} onClick={() => showTab('st')}>Stand</button>
      </nav></div>
      <main className="wrap">
        {(offline || pending > 0) && <div className="banner">
          {offline ? 'Geen verbinding met de server. ' : ''}{pending > 0 ? `${pending} score${pending > 1 ? 's' : ''} wacht${pending > 1 ? 'en' : ''} op verzending – ze blijven op dit toestel bewaard tot het lukt.` : 'Scores worden bijgewerkt zodra de verbinding terug is.'}
        </div>}
        {tab === 'in' ? (
          <section>
            <div className="flightpick"><label>Flight</label>
              <div className="flightname">Flight {fl.nr} – start {fl.start} – {fl.teams.map((t: any) => t.label).join(' / ')}</div></div>
            <div className="stripwrap">
              {(['V', 'A'] as const).map((part, pi) => (
                <div key={part}>
                  <div className="lbl"><span>{part === 'V' ? 'Voor 9 – singles' : 'Achter 9 – teambal'}</span>
                    <span>holes {(pi ? fl.back : fl.front)[0]}–{(pi ? fl.back : fl.front)[8]}</span></div>
                  <div className="strip">
                    {Array.from({ length: 9 }, (_, k) => {
                      const i = pi * 9 + k, hh = fl.order[i];
                      return <button key={i} className={holeState(scores, fl, i)} aria-current={i === cur ? 'true' : undefined}
                        aria-label={`Hole ${hh}, ${k + 1}e hole van de ${part === 'V' ? 'voor' : 'achter'} 9`} onClick={() => setIdx(i)}>{hh}</button>;
                    })}
                  </div>
                </div>
              ))}
            </div>

            <div className="hole">
              <div className="holehead"><div className="holenum"><b>{h}</b><span>{holeName(h)}</span></div>
                <div className="holemeta"><div className="fmt">{front ? 'Voor 9 – singles' : 'Achter 9 – teambal'}</div>
                  <div className="facts"><span>Par <strong>{H.par}</strong></span><span>SI <strong>{H.si}</strong></span></div>
                  <div className="seq">{(cur % 9) + 1}e hole van de {front ? 'voor' : 'achter'} 9</div></div></div>
              <div className="rows">
                {entries.map((e: any) => {
                  const v = val(scores, fl, e.bucket, e.id, h), s = strokesFor(fl, e, cur);
                  const lo = Math.max(1, H.par - 2), vals: number[] = []; for (let x = lo; x <= H.par + 4 && vals.length < 7; x++) vals.push(x);
                  const set = (x: number) => save({ nr: fl.nr, pin, bucket: e.bucket, id: e.id, h, v: v === x ? null : x });
                  return (
                    <div className="row" key={e.id}>
                      <div className="who"><span className={`tag tag${e.team.letter}`}>{e.team.letter}</span><span className="name">{e.name}</span>
                        {s > 0 && <span className="dots" title={`${s} slag${s > 1 ? 'en' : ''} op deze hole`}>{Array.from({ length: s }, (_, j) => <i key={j} />)} {s} slag{s > 1 ? 'en' : ''}</span>}</div>
                      <div className="chips" role="group" aria-label={`Bruto score ${e.name}`}>
                        {vals.map(x => <button key={x} className={x === H.par ? 'par' : ''} aria-pressed={v === x} onClick={() => set(x)}>{x}</button>)}
                        <button className="x" aria-pressed={v === -1} aria-label="Opgepakt" onClick={() => set(-1)}>Weg</button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="matches">
              {fl.matches.filter((m: any) => (m.kind === 'single') === front).map((m: any, i: number) => {
                const r = evalMatch(scores, fl, m);
                const recv = m.recv ? (m.recv === 'a' ? m.a.label : m.b.label) : 'niemand';
                const here = m.recv && m.map[h] ? `${recv} krijgt hier ${m.map[h]} slag${m.map[h] > 1 ? 'en' : ''}` : '';
                const strokes = m.n === 0 ? 'geen slagen' : `totaal ${m.n} slag${m.n === 1 ? '' : 'en'} voor ${recv}`;
                const title = m.kind === 'single'
                  ? `${m.pos}e speler${fl.teams.length > 2 ? ` – team ${m.teamA.letter} tegen ${m.teamB.letter}` : ''} – ${strokes}`
                  : `Team ${m.teamA.letter} tegen ${m.teamB.letter} – ${strokes}`;
                return (
                  <div className="match" key={i}><div className="t">{title}</div><div className={`st ${r.cls}`}>{r.text}</div>
                    <div className="vs">{m.a.label} – {m.b.label}</div>{here && <div className="here">{here}</div>}</div>
                );
              })}
            </div>

            <div className="nav">
              <button disabled={cur === 0} onClick={() => go(cur - 1)}>Vorige hole</button>
              <button className="primary" onClick={() => (cur < 17 ? go(cur + 1) : showTab('st'))}>{cur === 17 ? 'Naar de stand' : 'Volgende hole'}</button>
            </div>
            <div className="saved" aria-live="polite">{message}</div>
          </section>
        ) : (
          <section><Stand scores={scores} editable={fl.nr} onEdit={() => showTab('in')} /></section>
        )}
      </main>
    </>
  );
}
