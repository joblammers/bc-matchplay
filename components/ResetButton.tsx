'use client';
export default function ResetButton({ k }: { k: string }) {
  const go = async () => {
    if (!confirm('Alle scores van alle flights wissen? Dit kan niet ongedaan worden gemaakt.')) return;
    const r = await fetch('/api/admin/reset', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ key: k }) });
    alert(r.ok ? 'Alle scores zijn gewist.' : 'Wissen mislukt.');
  };
  return <button className="btn ghost" onClick={go}>Alle scores wissen (na het testen)</button>;
}
