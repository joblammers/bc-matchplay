'use client';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { EVENT_ID, type Bucket, type Scores } from './model';

type Write = { k: string; nr: number; pin: string; bucket: Bucket; id: string; h: number; v: number | null };
const QKEY = `mp-queue-${EVENT_ID}`;
const lsGet = (k: string) => { try { return localStorage.getItem(k); } catch { return null; } };
const lsSet = (k: string, v: string) => { try { localStorage.setItem(k, v); } catch { /* ignore */ } };

function apply(server: Scores, queue: Write[]): Scores {
  if (!queue.length) return server;
  const S: Scores = JSON.parse(JSON.stringify(server));
  for (const w of queue) {
    const d = (S['f' + w.nr] ??= { g: {}, t: {} }); const b = (d[w.bucket] ??= {}); const r = (b[w.id] ??= {});
    if (w.v === null) delete r['h' + w.h]; else r['h' + w.h] = w.v;
  }
  return S;
}

/**
 * Scores van de server, met polling. Invoer gaat eerst in een wachtrij (ook in localStorage),
 * zodat een score bij slecht bereik op de baan niet verloren gaat en later alsnog wordt verstuurd.
 */
export function useScores(interval = 8000) {
  const [server, setServer] = useState<Scores>({});
  const [queue, setQueue] = useState<Write[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [offline, setOffline] = useState(false);
  const [message, setMessage] = useState('');
  const writeSeq = useRef(0); const busy = useRef(false); const qRef = useRef<Write[]>([]);
  qRef.current = queue;

  useEffect(() => { try { const q = JSON.parse(lsGet(QKEY) || '[]'); if (Array.isArray(q)) setQueue(q); } catch { /* ignore */ } }, []);
  useEffect(() => { lsSet(QKEY, JSON.stringify(queue)); }, [queue]);

  const poll = useCallback(async () => {
    const seq = writeSeq.current;
    try {
      const r = await fetch('/api/scores', { cache: 'no-store' }); if (!r.ok) throw new Error();
      const j = await r.json();
      if (seq === writeSeq.current) setServer(j.scores); // negeer antwoorden die ouder zijn dan een net gelukte opslag
      setLoaded(true); setOffline(false);
    } catch { setOffline(true); }
  }, []);

  useEffect(() => {
    poll(); const t = setInterval(poll, interval);
    const vis = () => { if (document.visibilityState === 'visible') poll(); };
    document.addEventListener('visibilitychange', vis);
    return () => { clearInterval(t); document.removeEventListener('visibilitychange', vis); };
  }, [poll, interval]);

  const flush = useCallback(async () => {
    if (busy.current) return; busy.current = true;
    try {
      while (qRef.current.length) {
        const w = qRef.current[0];
        let res: Response;
        try { res = await fetch('/api/scores', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(w) }); }
        catch { setOffline(true); setMessage('Geen verbinding – scores worden bewaard en straks verstuurd'); break; }
        if (res.status >= 500) { setOffline(true); setMessage('Server tijdelijk niet bereikbaar – opnieuw proberen…'); break; }
        const j = await res.json().catch(() => ({}));
        if (res.ok) { writeSeq.current++; setServer(s => ({ ...s, ['f' + j.nr]: j.doc })); setOffline(false); setMessage('Opgeslagen'); }
        else setMessage(j.error === 'bad_pin' ? 'Pincode klopt niet – score niet opgeslagen' : 'Score niet opgeslagen (ongeldig)');
        qRef.current = qRef.current.filter(x => x.k !== w.k);
        setQueue(q => q.filter(x => x.k !== w.k));
      }
    } finally { busy.current = false; }
  }, []);

  useEffect(() => {
    if (!queue.length) return;
    flush(); const t = setInterval(flush, 4000);
    window.addEventListener('online', flush);
    return () => { clearInterval(t); window.removeEventListener('online', flush); };
  }, [queue.length, flush]);

  const save = useCallback((w: Omit<Write, 'k'>) => {
    const item = { ...w, k: Date.now() + '-' + Math.random().toString(36).slice(2) };
    qRef.current = [...qRef.current, item];
    setQueue(q => [...q, item]);
    setTimeout(flush, 0);
  }, [flush]);

  const scores = useMemo(() => apply(server, queue), [server, queue]);
  useEffect(() => { if (!message) return; const t = setTimeout(() => setMessage(''), 2500); return () => clearTimeout(t); }, [message]);

  return { scores, loaded, offline, pending: queue.length, message, save };
}
