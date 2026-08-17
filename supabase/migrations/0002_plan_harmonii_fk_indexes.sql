create index if not exists audit_projects_purchase_idx
  on public.audit_projects (purchase_id);

create index if not exists audit_files_user_idx
  on public.audit_files (user_id, created_at desc);

create index if not exists audit_reports_user_idx
  on public.audit_reports (user_id, created_at desc);
