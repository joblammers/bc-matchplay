'use client';
import { useScores } from '@/lib/useScores';
import Stand from './Stand';

export default function LiveStand() {
  const { scores, loaded, offline } = useScores(8000);
  return (
    <main className="wrap">
      {offline && <div className="banner">Geen verbinding met de server – de stand wordt bijgewerkt zodra die terug is.</div>}
      {loaded ? <Stand scores={scores} /> : <p className="live">Stand laden…</p>}
      <p className="live">Wordt automatisch elke paar seconden bijgewerkt.</p>
    </main>
  );
}
