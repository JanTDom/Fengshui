create table if not exists public.audit_purchases (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete set null,
  email text,
  plan_id text not null check (plan_id in ('scan', 'full', 'compare', 'studio')),
  provider text,
  provider_session_id text,
  amount_grosz integer not null check (amount_grosz >= 0),
  currency text not null default 'PLN',
  status text not null default 'created' check (status in ('created', 'paid', 'failed', 'refunded')),
  credits_granted integer not null default 1 check (credits_granted >= 0),
  credits_used integer not null default 0 check (credits_used >= 0),
  created_at timestamptz not null default now()
);

create table if not exists public.audit_projects (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  purchase_id uuid references public.audit_purchases(id) on delete set null,
  title text not null default 'Nowy audyt',
  property_type text not null check (property_type in ('flat', 'multi', 'house', 'business')),
  levels_count integer not null default 1 check (levels_count between 1 and 12),
  usable_area_m2 numeric(8, 2),
  address_note text,
  status text not null default 'draft' check (status in ('draft', 'uploaded', 'confirmed', 'processing', 'ready', 'archived')),
  selected_methods text[] not null default array['Forma', 'Kompas', 'Bagua', 'Pięć elementów', 'Kua/Gua'],
  required_inputs jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.audit_files (
  id uuid primary key default gen_random_uuid(),
  audit_id uuid not null references public.audit_projects(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  level_label text not null default 'poziom 1',
  storage_path text not null,
  original_name text,
  mime_type text,
  created_at timestamptz not null default now()
);

create table if not exists public.audit_reports (
  id uuid primary key default gen_random_uuid(),
  audit_id uuid not null references public.audit_projects(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  score integer not null check (score between 0 and 100),
  confidence text not null check (confidence in ('low', 'medium', 'high')),
  method_scores jsonb not null default '{}'::jsonb,
  report_json jsonb not null default '{}'::jsonb,
  pdf_storage_path text,
  created_at timestamptz not null default now()
);

create table if not exists public.leads (
  id uuid primary key default gen_random_uuid(),
  email text not null,
  source text not null default 'landing',
  interest text,
  consent_marketing boolean not null default false,
  created_at timestamptz not null default now()
);

alter table public.audit_purchases enable row level security;
alter table public.audit_projects enable row level security;
alter table public.audit_files enable row level security;
alter table public.audit_reports enable row level security;
alter table public.leads enable row level security;

grant usage on schema public to anon, authenticated;
grant select, insert, update on public.audit_purchases to authenticated;
grant select, insert, update, delete on public.audit_projects to authenticated;
grant select, insert, update, delete on public.audit_files to authenticated;
grant select, insert, update, delete on public.audit_reports to authenticated;
grant insert on public.leads to anon, authenticated;
grant select on public.leads to authenticated;

create policy "Users can read their purchases"
on public.audit_purchases
for select
to authenticated
using ((select auth.uid()) = user_id);

create policy "Users can create their purchases"
on public.audit_purchases
for insert
to authenticated
with check ((select auth.uid()) = user_id);

create policy "Users can update their own purchase drafts"
on public.audit_purchases
for update
to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

create policy "Users can read their audits"
on public.audit_projects
for select
to authenticated
using ((select auth.uid()) = user_id);

create policy "Users can create their audits"
on public.audit_projects
for insert
to authenticated
with check ((select auth.uid()) = user_id);

create policy "Users can update their audits"
on public.audit_projects
for update
to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

create policy "Users can delete their draft audits"
on public.audit_projects
for delete
to authenticated
using ((select auth.uid()) = user_id and status in ('draft', 'archived'));

create policy "Users can read their audit files"
on public.audit_files
for select
to authenticated
using ((select auth.uid()) = user_id);

create policy "Users can create their audit files"
on public.audit_files
for insert
to authenticated
with check ((select auth.uid()) = user_id);

create policy "Users can update their audit files"
on public.audit_files
for update
to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

create policy "Users can delete their audit files"
on public.audit_files
for delete
to authenticated
using ((select auth.uid()) = user_id);

create policy "Users can read their reports"
on public.audit_reports
for select
to authenticated
using ((select auth.uid()) = user_id);

create policy "Users can create their reports"
on public.audit_reports
for insert
to authenticated
with check ((select auth.uid()) = user_id);

create policy "Users can update their reports"
on public.audit_reports
for update
to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

create policy "Anyone can submit a lead"
on public.leads
for insert
to anon, authenticated
with check (email ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$');

create index if not exists audit_projects_user_status_idx
  on public.audit_projects (user_id, status, created_at desc);

create index if not exists audit_files_audit_idx
  on public.audit_files (audit_id, created_at desc);

create index if not exists audit_reports_audit_idx
  on public.audit_reports (audit_id, created_at desc);

create index if not exists audit_purchases_user_status_idx
  on public.audit_purchases (user_id, status, created_at desc);
