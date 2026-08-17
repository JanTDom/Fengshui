create table if not exists public.audit_intakes (
  id uuid primary key default gen_random_uuid(),
  email text not null,
  plan_id text not null check (plan_id in ('scan', 'full', 'compare', 'studio')),
  property_type text not null check (property_type in ('flat', 'multi', 'house', 'business')),
  levels_count integer not null default 1 check (levels_count between 1 and 12),
  usable_area_m2 numeric(8, 2),
  purpose text,
  address_note text,
  orientation_note text,
  entry_note text,
  constraints_note text,
  profile_note text,
  selected_methods text[] not null default array[
    'Forma',
    'Kompas',
    'Bagua',
    'Pięć elementów',
    'Kua / Gua',
    'Ergonomia i światło'
  ],
  files_summary jsonb not null default '[]'::jsonb,
  report_json jsonb not null default '{}'::jsonb,
  ai_provider text,
  ai_model text,
  ai_mode text not null default 'pending' check (ai_mode in ('pending', 'live', 'demo', 'error')),
  status text not null default 'submitted' check (status in ('submitted', 'processing', 'ready', 'failed')),
  consent_marketing boolean not null default false,
  created_at timestamptz not null default now()
);

alter table public.audit_intakes enable row level security;

grant insert on public.audit_intakes to anon, authenticated;

create policy "Anyone can submit an audit intake"
on public.audit_intakes
for insert
to anon, authenticated
with check (
  email ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$'
  and jsonb_typeof(files_summary) = 'array'
  and jsonb_typeof(report_json) = 'object'
);

create index if not exists audit_intakes_created_at_idx
  on public.audit_intakes (created_at desc);

create index if not exists audit_intakes_email_idx
  on public.audit_intakes (lower(email));

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'floor-plans',
  'floor-plans',
  false,
  10485760,
  array['application/pdf', 'image/png', 'image/jpeg', 'image/webp']
)
on conflict (id) do update
set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'report-pdfs',
  'report-pdfs',
  false,
  10485760,
  array['application/pdf']
)
on conflict (id) do update
set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "Users can upload own floor plans" on storage.objects;
drop policy if exists "Users can read own floor plans" on storage.objects;
drop policy if exists "Users can update own floor plans" on storage.objects;
drop policy if exists "Users can delete own floor plans" on storage.objects;
drop policy if exists "Users can upload own report pdfs" on storage.objects;
drop policy if exists "Users can read own report pdfs" on storage.objects;
drop policy if exists "Users can update own report pdfs" on storage.objects;
drop policy if exists "Users can delete own report pdfs" on storage.objects;

create policy "Users can upload own floor plans"
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'floor-plans'
  and (select auth.uid())::text = (storage.foldername(name))[1]
);

create policy "Users can read own floor plans"
on storage.objects
for select
to authenticated
using (
  bucket_id = 'floor-plans'
  and (select auth.uid())::text = (storage.foldername(name))[1]
);

create policy "Users can update own floor plans"
on storage.objects
for update
to authenticated
using (
  bucket_id = 'floor-plans'
  and (select auth.uid())::text = (storage.foldername(name))[1]
)
with check (
  bucket_id = 'floor-plans'
  and (select auth.uid())::text = (storage.foldername(name))[1]
);

create policy "Users can delete own floor plans"
on storage.objects
for delete
to authenticated
using (
  bucket_id = 'floor-plans'
  and (select auth.uid())::text = (storage.foldername(name))[1]
);

create policy "Users can upload own report pdfs"
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'report-pdfs'
  and (select auth.uid())::text = (storage.foldername(name))[1]
);

create policy "Users can read own report pdfs"
on storage.objects
for select
to authenticated
using (
  bucket_id = 'report-pdfs'
  and (select auth.uid())::text = (storage.foldername(name))[1]
);

create policy "Users can update own report pdfs"
on storage.objects
for update
to authenticated
using (
  bucket_id = 'report-pdfs'
  and (select auth.uid())::text = (storage.foldername(name))[1]
)
with check (
  bucket_id = 'report-pdfs'
  and (select auth.uid())::text = (storage.foldername(name))[1]
);

create policy "Users can delete own report pdfs"
on storage.objects
for delete
to authenticated
using (
  bucket_id = 'report-pdfs'
  and (select auth.uid())::text = (storage.foldername(name))[1]
);
