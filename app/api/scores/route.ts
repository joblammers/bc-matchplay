import { NextResponse } from 'next/server';
import { flightByNr, validIds } from '@/lib/model';
import { pinOk, readAll, readFlight, writeScore } from '@/lib/server';

export const dynamic = 'force-dynamic';
const noStore = { 'Cache-Control': 'no-store' };

export async function GET() {
  return NextResponse.json({ scores: await readAll(), at: Date.now() }, { headers: noStore });
}

export async function POST(req: Request) {
  let b: any; try { b = await req.json(); } catch { return NextResponse.json({ error: 'bad_json' }, { status: 400 }); }
  const nr = Number(b?.nr), fl = flightByNr(nr);
  if (!fl) return NextResponse.json({ error: 'unknown_flight' }, { status: 400 });
  if (!pinOk(nr, b.pin)) return NextResponse.json({ error: 'bad_pin' }, { status: 403 });
  const { bucket, id } = b; const h = Number(b.h); const v = b.v === null ? null : Number(b.v);
  if ((bucket !== 'g' && bucket !== 't') || !validIds(fl, bucket).includes(id)) return NextResponse.json({ error: 'bad_id' }, { status: 400 });
  const inHalf = bucket === 'g' ? fl.front : fl.back;
  if (!inHalf.includes(h)) return NextResponse.json({ error: 'bad_hole' }, { status: 400 });
  if (v !== null && !(Number.isInteger(v) && (v === -1 || (v >= 1 && v <= 15)))) return NextResponse.json({ error: 'bad_value' }, { status: 400 });
  await writeScore(nr, bucket, id, h, v);
  return NextResponse.json({ nr, doc: await readFlight(nr) }, { headers: noStore });
}
