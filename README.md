# Matchplay – Business Club middag (29-09-2026)

Next.js-versie van de scorepagina. Opslag in Upstash Redis (Vercel Marketplace), keys met prefix `bc_matchplay:`.

- `/f/<nr>?pin=<pin>` – invoer voor één flight (link per flight)
- `/stand` – alleen-lezen live stand (clubhuisscherm)
- `/admin?key=<ADMIN_KEY>` – alle flightlinks en pincodes + scores wissen na testen

## Omgevingsvariabelen
- `KV_REST_API_URL`, `KV_REST_API_TOKEN` – zet Vercel automatisch bij het koppelen van Upstash Redis
- `ADMIN_KEY` – zelf kiezen; hieruit worden ook de pincodes afgeleid (wijzigen = nieuwe pincodes)
- `PUBLIC_BASE_URL` (optioneel) – bv. `https://scores.bcgolfbaanheelsum.nl`, zodat de links op de beheerpagina dat adres gebruiken

## Deploy
```
npx vercel link
# Vercel dashboard → Storage → Upstash Redis → koppelen aan dit project
npx vercel env add ADMIN_KEY production
npx vercel env add PUBLIC_BASE_URL production
npx vercel --prod
```
Domein: Vercel → Settings → Domains → `scores.bcgolfbaanheelsum.nl`, en bij de DNS-beheerder een CNAME naar `cname.vercel-dns.com`.

Lokaal: `ADMIN_KEY=test npm run dev` (zonder Redis worden scores in het geheugen bewaard).
