import { NextResponse } from 'next/server';
import { adminOk, resetAll } from '@/lib/server';

export async function POST(req: Request) {
  const b = await req.json().catch(() => ({}));
  if (!adminOk(b?.key)) return NextResponse.json({ error: 'forbidden' }, { status: 403 });
  await resetAll();
  return NextResponse.json({ ok: true });
}
