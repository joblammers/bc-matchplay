import Header from '@/components/Header';
import LiveStand from '@/components/LiveStand';
import { FROZEN } from '@/lib/model';

export const metadata = { title: 'Stand – Matchplay Business Club middag' };

export default function StandPage() {
  return (<><Header sub={FROZEN ? 'Einduitslag – 29 september 2026' : 'Live stand – 29 september 2026'} /><LiveStand /></>);
}
