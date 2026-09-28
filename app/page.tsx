import Header from '@/components/Header';
import PinForm from '@/components/PinForm';

export default function Home() {
  return (
    <>
      <Header />
      <main className="wrap">
        <div className="card">
          <h2>Scores invoeren</h2>
          <p>Open de link van je flight, of kies hier je flight en vul de pincode in.</p>
          <PinForm />
        </div>
        <div className="card">
          <h2>Stand</h2>
          <p>Volg de tussenstand van alle partijen.</p>
          <a className="btn ghost" href="/stand">Naar de stand</a>
        </div>
      </main>
    </>
  );
}
