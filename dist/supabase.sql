-- Shared CRM state for the current static frontend.
-- The browser uses only the public anon key; RLS remains enabled.
create table if not exists public.app_state (
  key text primary key check (key <> ''),
  value jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

alter table public.app_state enable row level security;

drop policy if exists "app_state_read" on public.app_state;
create policy "app_state_read" on public.app_state for select to anon, authenticated using (true);

drop policy if exists "app_state_insert" on public.app_state;
create policy "app_state_insert" on public.app_state for insert to anon, authenticated with check (true);

drop policy if exists "app_state_update" on public.app_state;
create policy "app_state_update" on public.app_state for update to anon, authenticated using (true) with check (true);

insert into public.app_state (key, value)
values
  ('milas-suppliers', '[{"id":"SUP-001","name":"Greenview Travel & Tours","type":"Tour","contact":"Mr. Rahman","coverage":"Kinabatangan","bookings":"8","status":"Active","code":"","email":"","notes":""},{"id":"SUP-002","name":"Sabah Transfer Co.","type":"Transport","contact":"+60 13-555 0192","coverage":"Sabah","bookings":"12","status":"Active","code":"","email":"","notes":""},{"id":"SUP-003","name":"Borneo Guide Network","type":"Tour Guide","contact":"hello@bguides.my","coverage":"East Sabah","bookings":"5","status":"Active","code":"","email":"","notes":""},{"id":"SUP-004","name":"STWA","type":"Tour","contact":"60172220447","coverage":"sandakan","bookings":"0","status":"Active","code":"","email":"test@gmail.com","notes":""}]'::jsonb),
  ('milas-bookings', '[]'::jsonb)
on conflict (key) do nothing;
