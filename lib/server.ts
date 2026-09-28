import 'server-only';
import crypto from 'crypto';
import { Redis } from '@upstash/redis';
import { EVENT_ID, FLIGHTS, type Bucket, type Scores } from './model';

// Opslag: per flight één Redis-hash, veld "g|<speler-id>|<hole>" of "t|<team-id>|<hole>" → bruto score (-1 = opgepakt).
// Zonder Redis-variabelen (lokaal ontwikkelen) valt dit terug op geheugen.
const hasRedis = !!(process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL);
const redis = hasRedis ? Redis.fromEnv() : null;
const mem: Map<string, Record<string, number>> = ((globalThis as any).__mpMem ??= new Map());
const key = (nr: number) => `bc_matchplay:${EVENT_ID}:f${nr}`;

function toDoc(hash: Record<string, unknown> | null) {
  const doc: { g: Record<string, Record<string, number>>; t: Record<string, Record<string, number>> } = { g: {}, t: {} };
  for (const [f, v] of Object.entries(hash || {})) {
    const [b, id, h] = f.split('|'); if (b !== 'g' && b !== 't') continue;
    (doc[b][id] ??= {})['h' + h] = Number(v);
  }
  return doc;
}

export async function readFlight(nr: number) {
  if (!redis) return toDoc(mem.get(key(nr)) || {});
  return toDoc(await redis.hgetall(key(nr)));
}

export async function readAll(): Promise<Scores> {
  const out: Scores = {};
  if (!redis) { FLIGHTS.forEach(f => (out['f' + f.nr] = toDoc(mem.get(key(f.nr)) || {}))); return out; }
  const p = redis.pipeline(); FLIGHTS.forEach(f => p.hgetall(key(f.nr)));
  const res = (await p.exec()) as (Record<string, unknown> | null)[];
  FLIGHTS.forEach((f, i) => (out['f' + f.nr] = toDoc(res[i])));
  return out;
}

export async function writeScore(nr: number, bucket: Bucket, id: string, h: number, v: number | null) {
  const field = `${bucket}|${id}|${h}`;
  if (!redis) { const m = mem.get(key(nr)) || {}; if (v === null) delete m[field]; else m[field] = v; mem.set(key(nr), m); return; }
  if (v === null) await redis.hdel(key(nr), field); else await redis.hset(key(nr), { [field]: v });
}

export async function resetAll() {
  if (!redis) { mem.clear(); return; }
  await redis.del(...FLIGHTS.map(f => key(f.nr)));
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
