-- Mușchii lucrați de un exercițiu (pentru schema corpului din info).
-- Valori din vocabularul react-body-highlighter: chest, upper-back, front-deltoids, quadriceps, gluteal…
alter table public.exercises add column if not exists primary_muscles text[];
alter table public.exercises add column if not exists secondary_muscles text[];
