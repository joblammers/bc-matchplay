import 'server-only';
import crypto from 'crypto';
import { createClient } from 'redis';
import { EVENT_ID, FLIGHTS, type Bucket, type Scores } from './model';

// Opslag: per flight één Redis-hash, veld "g|<speler-id>|<hole>" of "t|<team-id>|<hole>" → bruto score (-1 = opgepakt).
// Zonder REDIS_URL (lokaal ontwikkelen) valt dit terug op geheugen.
const hasRedis = !!process.env.REDIS_URL;
type Client = ReturnType<typeof createClient>;
function client(): Promise<Client> {
  const g = globalThis as any; // één verbinding per serverless-instance hergebruiken
  if (!g.__mpRedis) {
    const c = createClient({ url: process.env.REDIS_URL });
    c.on('error', () => { /* herverbindt zelf */ });
    g.__mpRedis = c.connect().then(() => c).catch((e: unknown) => { g.__mpRedis = null; throw e; });
  }
  return g.__mpRedis;
}
const mem: Map<string, Record<string, number>> = ((globalThis as any).__mpMem ??= new Map());
const key = (nr: number) => `bc_matchplay:${EVENT_ID}:f${nr}`;

function toDoc(hash: any) {
  const doc: { g: Record<string, Record<string, number>>; t: Record<string, Record<string, number>> } = { g: {}, t: {} };
  for (const [f, v] of Object.entries(hash || {})) {
    const [b, id, h] = f.split('|'); if (b !== 'g' && b !== 't') continue;
    (doc[b][id] ??= {})['h' + h] = Number(v);
  }
  return doc;
}

export async function readFlight(nr: number) {
  if (!hasRedis) return toDoc(mem.get(key(nr)) || {});
  return toDoc(await (await client()).hGetAll(key(nr)));
}

export async function readAll(): Promise<Scores> {
  const out: Scores = {};
  if (!hasRedis) { FLIGHTS.forEach(f => (out['f' + f.nr] = toDoc(mem.get(key(f.nr)) || {}))); return out; }
  const c = await client();
  const res = await Promise.all(FLIGHTS.map(f => c.hGetAll(key(f.nr)))); // wordt automatisch gepipelined
  FLIGHTS.forEach((f, i) => (out['f' + f.nr] = toDoc(res[i])));
  return out;
}

export async function writeScore(nr: number, bucket: Bucket, id: string, h: number, v: number | null) {
  const field = `${bucket}|${id}|${h}`;
  if (!hasRedis) { const m = mem.get(key(nr)) || {}; if (v === null) delete m[field]; else m[field] = v; mem.set(key(nr), m); return; }
  const c = await client();
  if (v === null) await c.hDel(key(nr), field); else await c.hSet(key(nr), field, String(v));
}

export async function resetAll() {
  if (!hasRedis) { mem.clear(); return; }
  await (await client()).del(FLIGHTS.map(f => key(f.nr)));
}

// Pincode per flight: afgeleid van ADMIN_KEY, dus nergens opgeslagen en per evenement anders.
const secret = () => process.env.ADMIN_KEY || 'dev-key';
export function pinFor(nr: number) {
  const h = crypto.createHmac('sha256', secret()).update(`${EVENT_ID}:flight:${nr}`).digest();
  return String(h.readUInt32BE(0) % 10000).padStart(4, '0');
}
const eq = (a: string, b: string) => a.length === b.length && crypto.timingSafeEqual(Buffer.from(a), Buffer.from(b));
export const pinOk = (nr: number, pin: unknown) => typeof pin === 'string' && eq(pin, pinFor(nr));
export const adminOk = (k: unknown) => typeof k === 'string' && eq(k, secret());
export const usingRedis = hasRedis;
