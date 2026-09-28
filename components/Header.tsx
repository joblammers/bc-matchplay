export default function Header({ sub }: { sub?: string }) {
  return (
    <header className="top"><div className="wrap">
      <img alt="Ryder Cup" src="/rydercup.jpg" />
      <div><h1>Matchplay – Business Club middag</h1><p>{sub || '29 september 2026, shotgun 13:00, Helsum/Sandr'}</p></div>
    </div></header>
  );
}
