alter table public.audit_intakes
  add column if not exists orientation_data jsonb not null default '{}'::jsonb,
  add column if not exists plan_annotations jsonb not null default '{}'::jsonb,
  add column if not exists furniture_annotations jsonb not null default '{}'::jsonb,
  add column if not exists building_profile jsonb not null default '{}'::jsonb,
  add column if not exists resident_profiles jsonb not null default '[]'::jsonb;

create index if not exists audit_intakes_orientation_data_gin_idx
  on public.audit_intakes using gin (orientation_data);

create index if not exists audit_intakes_plan_annotations_gin_idx
  on public.audit_intakes using gin (plan_annotations);

create index if not exists audit_intakes_furniture_annotations_gin_idx
  on public.audit_intakes using gin (furniture_annotations);

create index if not exists audit_intakes_building_profile_gin_idx
  on public.audit_intakes using gin (building_profile);
