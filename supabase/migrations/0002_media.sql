-- Poze și descrieri pentru exerciții, echipamente și grupe musculare.
-- Pozele stau în Storage, bucket-ul „media”, în folderul fiecărui utilizator: <user_id>/<uuid>.jpg

alter table public.muscle_groups add column if not exists description text;
alter table public.muscle_groups add column if not exists image_url text;
alter table public.equipment add column if not exists description text;
alter table public.equipment add column if not exists image_url text;
alter table public.exercises add column if not exists description text;
alter table public.exercises add column if not exists image_url text;

-- Bucket public la citire (căile au uuid, nu se pot ghici), ca pozele să meargă și offline din cache.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('media', 'media', true, 5242880, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do nothing;

-- Fiecare scrie și șterge doar în folderul lui.
create policy "media own select" on storage.objects for select to authenticated
  using (bucket_id = 'media' and (storage.foldername(name))[1] = (select auth.uid())::text);
create policy "media own insert" on storage.objects for insert to authenticated
  with check (bucket_id = 'media' and (storage.foldername(name))[1] = (select auth.uid())::text);
create policy "media own update" on storage.objects for update to authenticated
  using (bucket_id = 'media' and (storage.foldername(name))[1] = (select auth.uid())::text);
create policy "media own delete" on storage.objects for delete to authenticated
  using (bucket_id = 'media' and (storage.foldername(name))[1] = (select auth.uid())::text);
