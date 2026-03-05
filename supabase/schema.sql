create table if not exists public.product_watch_status (
  url text primary key,
  product_name text not null,
  last_seen_state text not null check (last_seen_state in ('checking', 'non_checking', 'error')),
  stable_non_checking_count integer not null default 0,
  notified_available boolean not null default false,
  last_reason text,
  last_snapshot text,
  last_checked_at timestamptz not null default now(),
  last_changed_at timestamptz,
  error_count integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_product_watch_status_updated_at on public.product_watch_status;

create trigger trg_product_watch_status_updated_at
before update on public.product_watch_status
for each row
execute function public.set_updated_at();

create table if not exists public.line_recipients (
  id uuid primary key default gen_random_uuid(),
  line_user_id text not null unique,
  display_name text,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

drop trigger if exists trg_line_recipients_updated_at on public.line_recipients;

create trigger trg_line_recipients_updated_at
before update on public.line_recipients
for each row
execute function public.set_updated_at();
