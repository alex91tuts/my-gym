# My Gym

PWA pentru urmărirea antrenamentelor la sală. React 19 + Vite + TypeScript + Tailwind v4, date în Supabase.

- `src/lib/store.tsx`: toată starea aplicației (bibliotecă, programe, antrenamentul activ, coada de upload).
- `src/lib/backend.ts`: Supabase (proiectul `my-gym`, id `fwndjnbhkklrimcsthgs`) sau mod local (localStorage) cu `VITE_SUPABASE_URL=local`.
- `supabase/migrations/`: schema bazei de date.
- `src/lib/media.ts` + `src/components/Media.tsx`: poze și descrieri pentru exerciții, echipamente, grupe (bucket Storage `media`), afișate doar prin butonul de info.
- `public/catalog/` + `src/lib/catalog.ts`: catalogul free-exercise-db (870 exerciții, domeniu public), căutat din formularul de exercițiu. Schema corpului: `src/components/BodyMap.tsx` (react-body-highlighter), maparea mușchilor în `src/lib/muscles.ts`.
- `docs/COACH.md`: **cum analizează Claude antrenamentele și ajustează programele.** Citește-l când ți se cere analiza.

Comenzi: `npm run dev`, `npm run build`, `npm run typecheck`.

Interfața e în limba română.
