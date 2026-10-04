'use client';
import { FROZEN } from '@/lib/model';
import { useScores } from '@/lib/useScores';
import ClubBar from './ClubBar';
import Stand from './Stand';

export default function LiveStand() {
  const { scores, loaded, offline } = useScores(8000);
  return (
    <>
    <ClubBar scores={scores} />
    <main className="wrap">
      {FROZEN && <div className="banner">De wedstrijd is afgelopen. Alle scores staan vast en kunnen niet meer worden gewijzigd.</div>}
      {offline && <div className="banner">Geen verbinding met de server – de stand wordt bijgewerkt zodra die terug is.</div>}
      {loaded ? <Stand scores={scores} /> : <p className="live">Stand laden…</p>}
      {!FROZEN && <p className="live">Wordt automatisch elke paar seconden bijgewerkt.</p>}
    </main>
    </>
  );
}
