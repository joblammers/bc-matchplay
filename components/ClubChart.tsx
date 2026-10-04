'use client';
import { useEffect, useRef, useState } from 'react';
import { CLUBS, clubProgress, fmtPts, type Club, type Scores } from '@/lib/model';

const SERIES: { c: Club; color: string }[] = [{ c: 'H', color: 'var(--green)' }, { c: 'A', color: 'var(--purple)' }];
const f = (p: number) => fmtPts(p) || '0';

/** Lijngrafiek: verwachte clubpunten na elke gespeelde hole (shotgun: alle flights tegelijk op hole 1..18 van hun ronde). */
export default function ClubChart({ scores }: { scores: Scores }) {
  const box = useRef<HTMLDivElement>(null);
  const [w, setW] = useState(700);
  const [hover, setHover] = useState<number | null>(null);
  useEffect(() => {
    const el = box.current; if (!el) return;
    const ro = new ResizeObserver(([e]) => setW(Math.round(e.contentRect.width)));
    ro.observe(el); return () => ro.disconnect();
  }, []);

  const data = clubProgress(scores);
  if (!data[18].started) return null;
  const total = data[18].total;
  const yMax = Math.max(4, Math.ceil(Math.max(...data.map(d => Math.max(d.proj.H, d.proj.A))) / 4) * 4);
  const h = 240, m = { t: 26, r: w < 480 ? 98 : 110, b: 30, l: 30 };
  const x = (s: number) => m.l + (s / 18) * (w - m.l - m.r);
  const y = (v: number) => h - m.b - (v / yMax) * (h - m.t - m.b);
  const ticks = Array.from({ length: yMax / 4 + 1 }, (_, i) => i * 4);
  const path = (c: Club) => data.map((d, i) => `${i ? 'L' : 'M'}${x(d.step).toFixed(1)},${y(d.proj[c]).toFixed(1)}`).join('');
  const last = data[18];
  // eindlabels uit elkaar houden als de lijnen dicht bij elkaar eindigen
  let yH = y(last.proj.H), yA = y(last.proj.A);
  if (Math.abs(yH - yA) < 16) { const mid = (yH + yA) / 2, up = last.proj.H >= last.proj.A ? -8 : 8; yH = mid + up; yA = mid - up; }

  const move = (e: React.PointerEvent<SVGSVGElement>) => {
    const r = e.currentTarget.getBoundingClientRect();
    const s = Math.round(((e.clientX - r.left - m.l) / (w - m.l - m.r)) * 18);
    setHover(Math.max(0, Math.min(18, s)));
  };
  const hd = hover !== null ? data[hover] : null;
  const tipLeft = hover !== null && x(hover) > w / 2;

  return (
    <div className="chart">
      <div className="chart-legend">
        {SERIES.map(s => <span key={s.c}><i style={{ background: s.color }} />{CLUBS[s.c].name}</span>)}
      </div>
      <div className="chart-box" ref={box}>
        <svg width={w} height={h} role="img" aria-label={`Verloop clubpunten: eindstand ${CLUBS.H.name} ${f(last.proj.H)}, ${CLUBS.A.name} ${f(last.proj.A)}`}
          onPointerMove={move} onPointerDown={move} onPointerLeave={() => setHover(null)}>
          {ticks.map(t => <g key={t}>
            <line x1={m.l} x2={w - m.r} y1={y(t)} y2={y(t)} className="grid" />
            <text x={m.l - 8} y={y(t)} dy="0.32em" textAnchor="end" className="ax">{t}</text>
          </g>)}
          <line x1={x(9)} x2={x(9)} y1={m.t - 14} y2={h - m.b} className="divider" />
          <text x={(x(0) + x(9)) / 2} y={m.t - 12} textAnchor="middle" className="ax">1e 9 · Singles</text>
          <text x={(x(9) + x(18)) / 2} y={m.t - 12} textAnchor="middle" className="ax">2e 9 · Greensome</text>
          {Array.from({ length: 19 }, (_, s) => s).filter(s => s && (w >= 480 || s % 3 === 0)).map(s =>
            <text key={s} x={x(s)} y={h - m.b + 18} textAnchor="middle" className="ax">{s}</text>)}
          {hover !== null && <line x1={x(hover)} x2={x(hover)} y1={m.t} y2={h - m.b} className="cross" />}
          {SERIES.map(s => <path key={s.c} d={path(s.c)} fill="none" stroke={s.color} strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" />)}
          {SERIES.map(s => <circle key={s.c} cx={x(18)} cy={y(last.proj[s.c])} r={4} fill={s.color} className="dot" />)}
          {hd && SERIES.map(s => <circle key={s.c} cx={x(hd.step)} cy={y(hd.proj[s.c])} r={4.5} fill={s.color} className="dot" />)}
          <text x={x(18) + 10} y={yH} dy="0.32em" className="end"><tspan className="endv">{f(last.proj.H)}</tspan> {CLUBS.H.name}</text>
          <text x={x(18) + 10} y={yA} dy="0.32em" className="end"><tspan className="endv">{f(last.proj.A)}</tspan> {CLUBS.A.name}</text>
        </svg>
        {hd && <div className="chart-tip" style={tipLeft ? { right: w - x(hd.step) + 10 } : { left: x(hd.step) + 10 }}>
          <b>{hd.step === 0 ? 'Start' : `Na hole ${hd.step}`}</b>
          {SERIES.map(s => <div key={s.c}><i style={{ background: s.color }} />{CLUBS[s.c].name}<span>{f(hd.proj[s.c])}</span></div>)}
          <small>{hd.finished}/{total} partijen beslist</small>
        </div>}
      </div>
      <p className="note">Horizontaal: hole 1 t/m 18 van de ronde (shotgun, alle flights tegelijk). Afgeronde partijen tellen met hun uitslag, lopende partijen met de stand op dat moment (voor = 1, all square = ½).</p>
      <details className="chart-table"><summary>Als tabel</summary>
        <div className="tablewrap"><table>
          <thead><tr><th>Na hole</th>{SERIES.map(s => <th key={s.c} className="num">{CLUBS[s.c].name}</th>)}<th className="num">Beslist</th></tr></thead>
          <tbody>{data.slice(1).map(d => <tr key={d.step}><td>{d.step}</td>{SERIES.map(s => <td key={s.c} className="num">{f(d.proj[s.c])}</td>)}<td className="num">{d.finished}/{total}</td></tr>)}</tbody>
        </table></div>
      </details>
    </div>
  );
}
