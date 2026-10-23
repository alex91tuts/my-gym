# Coach Claude: analiză săptămânală

Instrucțiuni pentru Claude când utilizatorul cere „analizează antrenamentele mele”.
Claude lucrează direct în Supabase prin MCP (`execute_sql`), fără API-uri.

## Tabele relevante

| Tabel | Ce conține |
|---|---|
| `programs` | Programele (ex. Push A). |
| `program_exercises` | Ținta per exercițiu: `target_sets`, `target_reps`, `target_weight` (kg), `rest_seconds`, `ai_note`. **Asta modifici.** |
| `exercises`, `muscle_groups`, `equipment` | Biblioteca. |
| `workouts` | Un antrenament terminat (Finish). `analyzed_at` e NULL până îl analizezi. `notes` = ce a scris omul. |
| `workout_sets` | Seturile făcute: `weight`, `reps`, plus ținta din momentul respectiv (`target_weight`, `target_reps`). |
| `coach_notes` | Notițele tale, afișate în aplicație. |

Toate rândurile au `user_id`. Identifică utilizatorul după email:

```sql
select id, email from auth.users;
```

## Pașii

### 1. Antrenamentele neanalizate

```sql
select w.id, w.program_id, w.program_name, w.started_at, w.finished_at, w.notes,
       s.exercise_id, s.exercise_name, s.set_index, s.weight, s.reps, s.target_weight, s.target_reps
from workouts w
join workout_sets s on s.workout_id = w.id
where w.user_id = '<USER_ID>' and w.analyzed_at is null
order by w.finished_at, s.exercise_position, s.set_index;
```

### 2. Contextul: ultimele 4–6 săptămâni pe aceleași exerciții

```sql
select s.exercise_name, w.finished_at::date as zi,
       max(s.weight) as max_kg, sum(s.weight * s.reps) as volum,
       string_agg(s.weight || 'x' || s.reps, ', ' order by s.set_index) as seturi
from workout_sets s join workouts w on w.id = s.workout_id
where w.user_id = '<USER_ID>' and w.finished_at > now() - interval '42 days'
group by s.exercise_name, w.finished_at::date
order by s.exercise_name, zi;
```

### 3. Țintele curente

```sql
select pe.id, p.name as program, e.name as exercitiu, pe.target_sets, pe.target_reps,
       pe.target_weight, pe.rest_seconds, pe.ai_note
from program_exercises pe
join programs p on p.id = pe.program_id
join exercises e on e.id = pe.exercise_id
where pe.user_id = '<USER_ID>'
order by p.name, pe.position;
```

### 4. Decide ajustările (dublă progresie)

Pentru fiecare exercițiu din program, uită-te la ultimele 1–2 sesiuni:

- **Toate seturile la țintă sau peste** (reps ≥ target_reps la target_weight):
  - crește greutatea: **+2.5 kg** la exerciții compuse cu bara (împins, genuflexiuni, îndreptări, ramat, presă), **+1–2 kg** sau +1 treaptă la gantere, cablu și izolări;
  - la greutate corporală (target_weight = 0): **+1–2 repetări**.
- **Ținta ratată ușor** (1–2 repetări lipsă în total): păstrează greutatea și ținta.
- **Ratat 2 sesiuni la rând** sau repetările scad clar: **scade 5–10%** (deload), rotunjit la 2.5 kg.
- **Notițele omului contează**: durere, oboseală sau somn prost înseamnă că nu crești. Durere articulară: scazi și o menționezi.
- Pauza: la exerciții grele, unde repetările scad mult între seturi, poți crește `rest_seconds` (max 180–240).
- Nu schimba mai mult de 1–2 parametri pe exercițiu odată. Fii conservator.

### 5. Aplică modificările

```sql
update program_exercises
set target_weight = 62.5,
    ai_note = '+2.5 kg: ai făcut 3×10 la 60 kg ușor',
    updated_at = now()
where id = '<PROGRAM_EXERCISE_ID>';
```

`ai_note` e scurt (max ~80 caractere), în română, apare sub exercițiu în aplicație.
Pentru exercițiile fără schimbare pune `ai_note = null` sau o încurajare scurtă, dacă e relevant.

### 6. Lasă o notiță

Câte o notiță per program analizat (sau una generală cu `program_id = null`):

```sql
insert into coach_notes (user_id, program_id, summary, changes)
values (
  '<USER_ID>',
  '<PROGRAM_ID>',
  'Săptămână bună! Împinsul a urcat constant. Presa militară a stagnat, așa că rămânem la aceeași greutate.',
  '[{"exercise":"Împins la piept cu bară","field":"greutate","from":60,"to":62.5,"reason":"3×10 complet de două ori"}]'::jsonb
);
```

`summary`: 2–4 propoziții, ton de antrenor prietenos, în română. `changes` e o listă, `field` poate fi `greutate`, `repetări`, `seturi` sau `pauză`.

### 7. Marchează antrenamentele ca analizate

```sql
update workouts set analyzed_at = now()
where user_id = '<USER_ID>' and analyzed_at is null;
```

### 8. Răspunde în chat

Un rezumat scurt: ce a mers bine, ce s-a schimbat pentru săptămâna viitoare și de ce.
