import RAW from './data.json';

// Wedstrijdmodel: overgenomen uit de oorspronkelijke pagina (slagen, partijen, stand).
export const EVENT_ID = '2026-09-29';
export const PARAM = { singles: 1.0, team: 0.5, nine: 0.5 };

export type Scores = Record<string, { g?: Record<string, Record<string, number>>; t?: Record<string, Record<string, number>> }>;
export type Bucket = 'g' | 't';

const DATA: any = JSON.parse(JSON.stringify(RAW));
export const HOLE: Record<number, { h: number; loop: string; par: number; si: number }> = {};
DATA.holes.forEach((h: any) => (HOLE[h.h] = h));

const round = (x: number) => Math.floor(x + 0.5 + 1e-9);
export const first = (n: string) => n.split(' ')[0];
export const holeName = (h: number) => (h <= 9 ? 'Helsum ' + h : 'Sandr ' + (h - 9));

function playOrder(fl: any) { const o: number[] = []; for (let k = 0; k < 18; k++) o.push(((fl.hole - 1 + k) % 18) + 1); return o; }
function strokeMap(holes: number[], n: number) {
  const s = [...holes].sort((a, b) => HOLE[a].si - HOLE[b].si); const m: Record<number, number> = {};
  holes.forEach(h => (m[h] = 0)); for (let i = 0; i < n; i++) m[s[i % s.length]]++; return m;
}
function pairs(n: number) { return n === 2 ? [[0, 1]] : [[0, 1], [0, 2], [1, 2]]; }
const LETTER = 'ABC';

DATA.flights.forEach((fl: any) => {
  fl.order = playOrder(fl);
  fl.front = fl.order.slice(0, 9); fl.back = fl.order.slice(9);
  fl.teams.forEach((t: any, i: number) => { t.letter = LETTER[i]; t.label = t.players.map((p: any) => first(p.name)).join(' & '); t.sum = t.players.reduce((a: number, p: any) => a + p.phcp, 0); });
  fl.matches = [];
  pairs(fl.teams.length).forEach(([a, b]) => {
    const A = fl.teams[a], B = fl.teams[b];
    [0, 1].forEach(pi => {
      const pa = A.players[pi], pb = B.players[pi];
      const n = round(Math.abs(pa.phcp - pb.phcp) * PARAM.singles * PARAM.nine);
      fl.matches.push({ kind: 'single', pos: pi + 1, a: { id: pa.id, label: first(pa.name), full: pa.name, team: A }, b: { id: pb.id, label: first(pb.name), full: pb.name, team: B },
        n, recv: n === 0 ? null : (pa.phcp > pb.phcp ? 'a' : 'b'), holes: fl.front, map: strokeMap(fl.front, n), teamA: A, teamB: B });
    });
    const d = Math.abs(A.sum * PARAM.team - B.sum * PARAM.team);
    const n = round(d * PARAM.nine);
    fl.matches.push({ kind: 'team', a: { id: A.id, label: A.label, team: A }, b: { id: B.id, label: B.label, team: B },
      n, recv: n === 0 ? null : (A.sum > B.sum ? 'a' : 'b'), holes: fl.back, map: strokeMap(fl.back, n), teamA: A, teamB: B });
  });
});

export const FLIGHTS: any[] = DATA.flights;
export const flightByNr = (nr: number) => FLIGHTS.find(f => f.nr === nr);

/** Alle geldige ids per flight, voor validatie op de server. */
export function validIds(fl: any, bucket: Bucket): string[] {
  return bucket === 'g' ? fl.teams.flatMap((t: any) => t.players.map((p: any) => p.id)) : fl.teams.map((t: any) => t.id);
}

export function val(S: Scores, fl: any, bucket: Bucket, id: string, h: number): number | null {
  const d = S['f' + fl.nr]; const v = d && d[bucket] && d[bucket][id] && d[bucket][id]['h' + h];
  return v === undefined || v === null ? null : v;
}

export function evalMatch(S: Scores, fl: any, m: any) {
  const bucket: Bucket = m.kind === 'single' ? 'g' : 't';
  let lead = 0, played = 0, decided = false, endAt: number | null = null; const per: number[] = [];
  for (let i = 0; i < 9; i++) {
    const h = m.holes[i];
    const ga = val(S, fl, bucket, m.a.id, h), gb = val(S, fl, bucket, m.b.id, h);
    if (ga === null || gb === null) break;
    const sa = m.recv === 'a' ? m.map[h] : 0, sb = m.recv === 'b' ? m.map[h] : 0;
    const na = ga < 0 ? Infinity : ga - sa, nb = gb < 0 ? Infinity : gb - sb;
    let r = 0; if (na < nb) r = 1; else if (nb < na) r = -1;
    lead += r; played = i + 1; per.push(r);
    if (Math.abs(lead) > 9 - played) { decided = true; endAt = played; break; }
  }
  const contiguous = played;
  const done = decided || contiguous === 9;
  const rem = 9 - (decided ? endAt! : contiguous);
  const leader = lead > 0 ? m.a.label : m.b.label;
  let text: string, cls = '';
  if (contiguous === 0 && !decided) text = 'Nog niet gestart';
  else if (decided && rem > 0) { text = `${leader} wint ${Math.abs(lead)}&${rem}`; cls = lead > 0 ? 'lead-a' : 'lead-b'; }
  else if (done) { text = lead === 0 ? 'Gelijk gespeeld' : `${leader} wint ${Math.abs(lead)} up`; cls = lead > 0 ? 'lead-a' : lead < 0 ? 'lead-b' : ''; }
  else { text = lead === 0 ? `All square na ${contiguous}` : `${leader} ${Math.abs(lead)} up na ${contiguous}${Math.abs(lead) === rem ? ' (dormie)' : ''}`; cls = lead > 0 ? 'lead-a' : lead < 0 ? 'lead-b' : ''; }
  const pa = done ? (lead > 0 ? 1 : lead === 0 ? 0.5 : 0) : null;
  const holesWonA = per.filter(r => r === 1).length, holesWonB = per.filter(r => r === -1).length;
  return { lead, contiguous, done, text, cls, pa, pb: done ? 1 - pa! : null, diff: holesWonA - holesWonB };
}

export function holeEntries(fl: any, idx: number) {
  const h = fl.order[idx];
  if (idx < 9) return fl.teams.flatMap((t: any) => t.players.map((p: any) => ({ bucket: 'g' as Bucket, id: p.id, name: p.name, team: t, h })));
  return fl.teams.map((t: any) => ({ bucket: 't' as Bucket, id: t.id, name: t.label, team: t, h }));
}
export function holeState(S: Scores, fl: any, idx: number) {
  const e = holeEntries(fl, idx); const f = e.filter((x: any) => val(S, fl, x.bucket, x.id, x.h) !== null).length;
  return f === 0 ? '' : f === e.length ? 'done' : 'part';
}
export function firstOpen(S: Scores, fl: any) { for (let i = 0; i < 18; i++) if (holeState(S, fl, i) !== 'done') return i; return 17; }

export function strokesFor(fl: any, entry: any, idx: number) {
  // slagen die deze speler/dit team op deze hole krijgt (max over partijen)
  let s = 0; fl.matches.forEach((m: any) => {
    if ((idx < 9) !== (m.kind === 'single')) return;
    const side = m.a.id === entry.id ? 'a' : m.b.id === entry.id ? 'b' : null;
    if (side && m.recv === side) s = Math.max(s, m.map[entry.h]);
  });
  return s;
}

export function standings(S: Scores) {
  const rows: any[] = [];
  FLIGHTS.forEach(fl => {
    const res = fl.matches.map((m: any) => ({ m, r: evalMatch(S, fl, m) }));
    fl.teams.forEach((t: any) => {
      let pts = 0, diff = 0, done = 0, total = 0;
      res.forEach(({ m, r }: any) => {
        const side = m.teamA === t ? 'a' : m.teamB === t ? 'b' : null; if (!side) return; total++;
        if (r.done) { done++; pts += side === 'a' ? r.pa : r.pb; } diff += side === 'a' ? r.diff : -r.diff;
      });
      rows.push({ fl, t, pts, diff, done, total });
    });
  });
  rows.sort((x, y) => y.pts - x.pts || y.diff - x.diff || x.fl.nr - y.fl.nr);
  return rows;
}
export const fmtPts = (p: number) => (Math.floor(p) === p ? String(p) : (Math.floor(p) || '') + '½');

export function csv(S: Scores) {
  const q = (s: any) => '"' + String(s).replace(/"/g, '""') + '"';
  const lines = [['Flight', 'Start', 'Partij', 'Kant A', 'Kant B', 'Slagen', 'Ontvanger', 'Stand', 'Punten A', 'Punten B'].map(q).join(';')];
  FLIGHTS.forEach(fl => fl.matches.forEach((m: any) => {
    const r = evalMatch(S, fl, m);
    lines.push([fl.nr, fl.start, m.kind === 'single' ? `Voor 9 ${m.pos}e` : 'Achter 9 team', m.a.full || m.a.team.players.map((p: any) => p.name).join(' & '), m.b.full || m.b.team.players.map((p: any) => p.name).join(' & '),
      m.n, m.recv ? (m.recv === 'a' ? m.a.label : m.b.label) : '-', r.text, r.pa ?? '', r.pb ?? ''].map(q).join(';'));
  }));
  lines.push(''); lines.push(['Positie', 'Team', 'Flight', 'Punten', 'Saldo'].map(q).join(';'));
  standings(S).forEach((r, i) => lines.push([i + 1, r.t.players.map((p: any) => p.name).join(' & '), r.fl.nr, String(r.pts).replace('.', ','), r.diff].map(q).join(';')));
  return '﻿' + lines.join('\r\n');
}
