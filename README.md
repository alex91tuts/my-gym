# My Gym 🏋️

Aplicație de sală (PWA) pentru Android: programe, antrenament live cu timer de pauză, istoric, progres. Claude o folosește ca antrenor prin Supabase.

## Cum funcționează

1. Îți faci **programe** (ex. Push A), cu ținte per exercițiu: seturi × repetări @ greutate și pauză.
2. Deschizi programul și apeși **Start**. Bifezi seturile, iar timerul de pauză pornește singur.
3. La **Finish**, antrenamentul se trimite în Supabase. Dacă nu ai net, se trimite automat mai târziu.
4. Într-o conversație cu Claude (cu Supabase conectat) scrii „analizează antrenamentele mele”. Claude urmează [`docs/COACH.md`](docs/COACH.md), ajustează țintele pentru săptămâna viitoare și îți lasă o notiță în aplicație.

## Setup

1. **Supabase**: proiectul `my-gym` (Frankfurt) e deja creat, cu migrările din `supabase/migrations/` aplicate, iar adresa și cheia publică sunt implicite în `src/lib/supabase.ts`.
   Pentru un proiect nou: rulează migrările în ordine (0001, 0002…) în SQL Editor (sau le aplică Claude prin MCP).
   În Authentication → Providers → Email poți dezactiva „Confirm email”, ca să intri direct după crearea contului.
2. **Variabile** (în `.env.local` sau în setările hostingului):
   ```
   VITE_SUPABASE_URL=https://<proiect>.supabase.co
   VITE_SUPABASE_ANON_KEY=<publishable/anon key>
   ```
   Fără ele se folosește proiectul implicit. Cu `VITE_SUPABASE_URL=local`, aplicația rulează în **mod local**: datele stau doar în browser.
3. **Hosting**: conectează repo-ul la Vercel sau Cloudflare Pages (build `npm run build`, output `dist`) și adaugă variabilele de mai sus.
4. **Pe telefon**: deschide linkul în Chrome, apoi ⋮ → „Adaugă pe ecranul de pornire”.

## Dezvoltare

```
npm install
npm run dev
```
