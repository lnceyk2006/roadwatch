-- Run this in Supabase Dashboard > SQL Editor.
create table if not exists public.reports (
  id text primary key,
  title text not null,
  type text not null,
  description text not null,
  location text not null,
  latitude double precision,
  longitude double precision,
  photo_url text,
  status text not null default 'Submitted',
  priority text default 'Unassigned',
  assigned_to text,
  reporter text,
  created_at timestamptz not null default now()
);

alter table public.reports enable row level security;
-- Demo-project policies. For a public production deployment, add authentication,
-- rate limiting, validation, and stricter role-based policies before launch.
create policy "Public can read reports" on public.reports for select using (true);
create policy "Public can submit reports" on public.reports for insert with check (true);
create policy "Public can update reports" on public.reports for update using (true) with check (true);
create policy "Public can delete reports" on public.reports for delete using (true);

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('report-photos', 'report-photos', true, 5242880, array['image/jpeg','image/png','image/webp'])
on conflict (id) do nothing;
create policy "Public can upload report photos" on storage.objects for insert with check (bucket_id = 'report-photos');
create policy "Public can view report photos" on storage.objects for select using (bucket_id = 'report-photos');
