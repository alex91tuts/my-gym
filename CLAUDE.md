# My Gym

PWA pentru urmărirea antrenamentelor la sală. React 19 + Vite + TypeScript + Tailwind v4, date în Supabase.

- `src/lib/store.tsx`: toată starea aplicației (bibliotecă, programe, antrenamentul activ, coada de upload).
- `src/lib/backend.ts`: Supabase sau mod local (localStorage), dacă lipsesc variabilele `VITE_SUPABASE_*`.
- `supabase/migrations/`: schema bazei de date.
- `docs/COACH.md`: **cum analizează Claude antrenamentele și ajustează programele.** Citește-l când ți se cere analiza.

Comenzi: `npm run dev`, `npm run build`, `npm run typecheck`.

Interfața e în limba română.
