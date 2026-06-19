-- ============================================================
--  INVOYR — Full Schema + RLS
--  Run this entire file once in Supabase SQL Editor.
-- ============================================================

create extension if not exists "pgcrypto";

-- ----------------------------------------------------------------
-- 0. AUTH TRIGGER — auto-create a profile row on signup
-- ----------------------------------------------------------------
create table if not exists public.profiles (
  id                   uuid primary key references auth.users(id) on delete cascade,
  full_name            text,
  avatar_url           text,
  onboarding_completed boolean not null default false,
  created_at           timestamptz not null default now()
);

create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, full_name)
  values (new.id, coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email,'@',1)))
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ----------------------------------------------------------------
-- 1. ORGANISATIONS
-- ----------------------------------------------------------------
create table if not exists public.organisations (
  id                  uuid primary key default gen_random_uuid(),
  name                text not null,
  slug                text unique not null,
  logo_url            text,
  address_line1       text,
  address_line2       text,
  city                text,
  postcode            text,
  country             text default 'GB',
  vat_number          text,
  email               text,
  phone               text,
  website             text,
  accent_color        text default '#111827',
  invoice_prefix      text not null default 'INV',
  next_invoice_number integer not null default 1,
  default_terms       text,
  default_notes       text,
  stripe_account_id   text,
  stripe_customer_id  text,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);

-- ----------------------------------------------------------------
-- 2. ORG_MEMBERS
-- ----------------------------------------------------------------
create table if not exists public.org_members (
  id              bigint generated always as identity primary key,
  org_id          uuid not null references public.organisations(id) on delete cascade,
  user_id         uuid not null references auth.users(id) on delete cascade,
  role            text not null default 'owner',
  created_at      timestamptz not null default now(),
  unique (org_id, user_id)
);

create index if not exists org_members_user_idx on public.org_members(user_id);
create index if not exists org_members_org_idx  on public.org_members(org_id);

-- ----------------------------------------------------------------
-- SECURITY HELPERS
-- ----------------------------------------------------------------
create or replace function public.is_org_member(p_org_id uuid)
returns boolean language sql security definer stable set search_path = public as $$
  select exists (
    select 1 from public.org_members
    where org_id = p_org_id and user_id = auth.uid()
  );
$$;

create or replace function public.is_org_owner(p_org_id uuid)
returns boolean language sql security definer stable set search_path = public as $$
  select exists (
    select 1 from public.org_members
    where org_id = p_org_id and user_id = auth.uid() and role = 'owner'
  );
$$;

-- ----------------------------------------------------------------
-- 3. CLIENTS
-- ----------------------------------------------------------------
create table if not exists public.clients (
  id              uuid primary key default gen_random_uuid(),
  org_id          uuid not null references public.organisations(id) on delete cascade,
  name            text not null,
  email           text,
  phone           text,
  company_name    text,
  address_line1   text,
  address_line2   text,
  city            text,
  postcode        text,
  country         text default 'GB',
  vat_number      text,
  notes           text,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

create index if not exists clients_org_idx on public.clients(org_id);

-- ----------------------------------------------------------------
-- 4. INVOICES
-- ----------------------------------------------------------------
do $$ begin
  create type public.invoice_status as enum ('draft', 'issued', 'sent', 'paid', 'overdue', 'void');
exception when duplicate_object then null;
end $$;

do $$ begin
  create type public.invoice_template as enum ('tjn_classic', 'clean_minimal', 'bold_split', 'modern_studio');
exception when duplicate_object then null;
end $$;

create table if not exists public.invoices (
  id                  uuid primary key default gen_random_uuid(),
  org_id              uuid not null references public.organisations(id) on delete cascade,
  client_id           uuid references public.clients(id) on delete set null,
  invoice_number      text not null,
  status              public.invoice_status not null default 'draft',
  template            public.invoice_template not null default 'tjn_classic',
  issue_date          date not null default current_date,
  due_date            date,
  currency            text not null default 'GBP',
  subtotal            numeric(12,2) not null default 0,
  vat_amount          numeric(12,2) not null default 0,
  total               numeric(12,2) not null default 0,
  amount_paid         numeric(12,2) not null default 0,
  notes               text,
  terms               text,
  stripe_payment_link text,
  public_token        text unique default encode(gen_random_bytes(24), 'base64url'),
  sent_at             timestamptz,
  paid_at             timestamptz,
  voided_at           timestamptz,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now(),
  unique (org_id, invoice_number)
);

create index if not exists invoices_org_idx       on public.invoices(org_id);
create index if not exists invoices_client_idx    on public.invoices(client_id);
create index if not exists invoices_status_idx    on public.invoices(status);
create index if not exists invoices_due_date_idx  on public.invoices(due_date);
create index if not exists invoices_token_idx     on public.invoices(public_token);

-- ----------------------------------------------------------------
-- 5. INVOICE_ITEMS
-- ----------------------------------------------------------------
create table if not exists public.invoice_items (
  id              bigint generated always as identity primary key,
  invoice_id      uuid not null references public.invoices(id) on delete cascade,
  description     text not null,
  quantity        numeric(12,4) not null default 1,
  unit_price      numeric(12,2) not null,
  vat_rate        numeric(5,2) not null default 0,
  line_total      numeric(12,2) generated always as (quantity * unit_price) stored,
  sort_order      integer not null default 0
);

create index if not exists items_invoice_idx on public.invoice_items(invoice_id);

-- ----------------------------------------------------------------
-- 6. PAYMENTS
-- ----------------------------------------------------------------
do $$ begin
  create type public.payment_method as enum ('stripe', 'bank_transfer', 'cash', 'cheque', 'other');
exception when duplicate_object then null;
end $$;

create table if not exists public.payments (
  id                  uuid primary key default gen_random_uuid(),
  org_id              uuid not null references public.organisations(id) on delete cascade,
  invoice_id          uuid not null references public.invoices(id) on delete cascade,
  amount              numeric(12,2) not null,
  currency            text not null default 'GBP',
  method              public.payment_method not null default 'bank_transfer',
  reference           text,
  stripe_payment_intent_id text,
  paid_at             timestamptz not null default now(),
  created_at          timestamptz not null default now()
);

-- ----------------------------------------------------------------
-- 7. SUBSCRIPTIONS
-- ----------------------------------------------------------------
do $$ begin
  create type public.subscription_status as enum ('trialing', 'active', 'past_due', 'canceled', 'incomplete');
exception when duplicate_object then null;
end $$;

create table if not exists public.subscriptions (
  id                      uuid primary key default gen_random_uuid(),
  org_id                  uuid not null unique references public.organisations(id) on delete cascade,
  stripe_subscription_id  text unique,
  stripe_price_id         text,
  status                  public.subscription_status not null default 'trialing',
  trial_ends_at           timestamptz,
  current_period_start    timestamptz,
  current_period_end      timestamptz,
  cancel_at_period_end    boolean not null default false,
  created_at              timestamptz not null default now(),
  updated_at              timestamptz not null default now()
);

-- ----------------------------------------------------------------
-- 8. AUDIT_LOGS
-- ----------------------------------------------------------------
create table if not exists public.audit_logs (
  id          bigint generated always as identity primary key,
  org_id      uuid not null references public.organisations(id) on delete cascade,
  user_id     uuid references auth.users(id) on delete set null,
  action      text not null,
  entity_type text not null,
  entity_id   text,
  meta        jsonb,
  created_at  timestamptz not null default now()
);

create index if not exists audit_org_idx  on public.audit_logs(org_id);
create index if not exists audit_time_idx on public.audit_logs(created_at desc);

-- ----------------------------------------------------------------
-- 9. EMAIL_LOGS
-- ----------------------------------------------------------------
do $$ begin
  create type public.email_log_status as enum ('sent', 'delivered', 'bounced', 'failed');
exception when duplicate_object then null;
end $$;

create table if not exists public.email_logs (
  id              bigint generated always as identity primary key,
  org_id          uuid references public.organisations(id) on delete cascade,
  user_id         uuid references auth.users(id) on delete set null,
  invoice_id      uuid references public.invoices(id) on delete set null,
  resend_id       text,
  to_email        text not null,
  subject         text not null,
  template_name   text not null,
  status          public.email_log_status not null default 'sent',
  opened_at       timestamptz,
  created_at      timestamptz not null default now()
);

-- ----------------------------------------------------------------
-- 10. EMAIL_PREFERENCES
-- ----------------------------------------------------------------
create table if not exists public.email_preferences (
  id                  uuid primary key default gen_random_uuid(),
  user_id             uuid not null references auth.users(id) on delete cascade,
  marketing_consent   boolean not null default false,
  unsubscribe_token   text not null unique default encode(gen_random_bytes(32), 'hex'),
  unsubscribed_at     timestamptz,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now(),
  constraint email_preferences_user_unique unique (user_id)
);

-- ----------------------------------------------------------------
-- 11. MARKETING_CONTACTS
-- ----------------------------------------------------------------
create table if not exists public.marketing_contacts (
  id                  uuid primary key default gen_random_uuid(),
  user_id             uuid references auth.users(id) on delete set null,
  email               text not null unique,
  first_name          text,
  last_name           text,
  resend_contact_id   text,
  subscribed          boolean not null default true,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);

-- ----------------------------------------------------------------
-- TRIGGERS — updated_at
-- ----------------------------------------------------------------
create or replace function public.touch_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end;
$$;

do $$ begin
  if not exists (select 1 from pg_trigger where tgname = 'trg_orgs_updated_at') then
    create trigger trg_orgs_updated_at before update on public.organisations
      for each row execute function public.touch_updated_at();
  end if;
  if not exists (select 1 from pg_trigger where tgname = 'trg_clients_updated_at') then
    create trigger trg_clients_updated_at before update on public.clients
      for each row execute function public.touch_updated_at();
  end if;
  if not exists (select 1 from pg_trigger where tgname = 'trg_invoices_updated_at') then
    create trigger trg_invoices_updated_at before update on public.invoices
      for each row execute function public.touch_updated_at();
  end if;
  if not exists (select 1 from pg_trigger where tgname = 'trg_subs_updated_at') then
    create trigger trg_subs_updated_at before update on public.subscriptions
      for each row execute function public.touch_updated_at();
  end if;
end $$;

-- ----------------------------------------------------------------
-- ROW-LEVEL SECURITY
-- ----------------------------------------------------------------
alter table public.profiles      enable row level security;
alter table public.organisations  enable row level security;
alter table public.org_members    enable row level security;
alter table public.clients        enable row level security;
alter table public.invoices       enable row level security;
alter table public.invoice_items  enable row level security;
alter table public.payments       enable row level security;
alter table public.subscriptions  enable row level security;
alter table public.audit_logs          enable row level security;
alter table public.email_logs          enable row level security;
alter table public.email_preferences   enable row level security;
alter table public.marketing_contacts  enable row level security;

-- PROFILES
drop policy if exists profiles_select on public.profiles;
create policy profiles_select on public.profiles for select to authenticated using (id = auth.uid());
drop policy if exists profiles_update on public.profiles;
create policy profiles_update on public.profiles for update to authenticated using (id = auth.uid()) with check (id = auth.uid());

-- ORGANISATIONS
drop policy if exists orgs_select on public.organisations;
create policy orgs_select on public.organisations for select to authenticated using (is_org_member(id));
drop policy if exists orgs_insert on public.organisations;
create policy orgs_insert on public.organisations for insert to authenticated with check (true);
drop policy if exists orgs_update on public.organisations;
create policy orgs_update on public.organisations for update to authenticated using (is_org_owner(id)) with check (is_org_owner(id));
drop policy if exists orgs_delete on public.organisations;
create policy orgs_delete on public.organisations for delete to authenticated using (is_org_owner(id));

-- ORG_MEMBERS
drop policy if exists members_select on public.org_members;
create policy members_select on public.org_members for select to authenticated using (is_org_member(org_id));
drop policy if exists members_insert on public.org_members;
create policy members_insert on public.org_members for insert to authenticated with check (user_id = auth.uid() or is_org_owner(org_id));
drop policy if exists members_delete on public.org_members;
create policy members_delete on public.org_members for delete to authenticated using (is_org_owner(org_id) or user_id = auth.uid());

-- CLIENTS
drop policy if exists clients_select on public.clients;
create policy clients_select on public.clients for select to authenticated using (is_org_member(org_id));
drop policy if exists clients_insert on public.clients;
create policy clients_insert on public.clients for insert to authenticated with check (is_org_member(org_id));
drop policy if exists clients_update on public.clients;
create policy clients_update on public.clients for update to authenticated using (is_org_member(org_id)) with check (is_org_member(org_id));
drop policy if exists clients_delete on public.clients;
create policy clients_delete on public.clients for delete to authenticated using (is_org_member(org_id));

-- INVOICES
drop policy if exists invoices_select on public.invoices;
create policy invoices_select on public.invoices for select to authenticated using (is_org_member(org_id));
drop policy if exists invoices_insert on public.invoices;
create policy invoices_insert on public.invoices for insert to authenticated with check (is_org_member(org_id));
drop policy if exists invoices_update on public.invoices;
create policy invoices_update on public.invoices for update to authenticated using (is_org_member(org_id)) with check (is_org_member(org_id));
drop policy if exists invoices_delete on public.invoices;
create policy invoices_delete on public.invoices for delete to authenticated using (is_org_member(org_id));
drop policy if exists invoices_public_token on public.invoices;
create policy invoices_public_token on public.invoices for select to anon using (public_token is not null);

-- INVOICE_ITEMS
drop policy if exists items_select on public.invoice_items;
create policy items_select on public.invoice_items for select to authenticated
  using (exists (select 1 from public.invoices i where i.id = invoice_id and is_org_member(i.org_id)));
drop policy if exists items_insert on public.invoice_items;
create policy items_insert on public.invoice_items for insert to authenticated
  with check (exists (select 1 from public.invoices i where i.id = invoice_id and is_org_member(i.org_id)));
drop policy if exists items_update on public.invoice_items;
create policy items_update on public.invoice_items for update to authenticated
  using (exists (select 1 from public.invoices i where i.id = invoice_id and is_org_member(i.org_id)));
drop policy if exists items_delete on public.invoice_items;
create policy items_delete on public.invoice_items for delete to authenticated
  using (exists (select 1 from public.invoices i where i.id = invoice_id and is_org_member(i.org_id)));
drop policy if exists items_public_token on public.invoice_items;
create policy items_public_token on public.invoice_items for select to anon
  using (exists (select 1 from public.invoices i where i.id = invoice_id and i.public_token is not null));

-- PAYMENTS
drop policy if exists payments_select on public.payments;
create policy payments_select on public.payments for select to authenticated using (is_org_member(org_id));
drop policy if exists payments_insert on public.payments;
create policy payments_insert on public.payments for insert to authenticated with check (is_org_member(org_id));

-- SUBSCRIPTIONS
drop policy if exists subs_select on public.subscriptions;
create policy subs_select on public.subscriptions for select to authenticated using (is_org_member(org_id));

-- AUDIT_LOGS
drop policy if exists audit_select on public.audit_logs;
create policy audit_select on public.audit_logs for select to authenticated using (is_org_member(org_id));

-- EMAIL_LOGS
drop policy if exists email_select on public.email_logs;
create policy email_select on public.email_logs for select to authenticated
  using (
    (org_id is not null and is_org_member(org_id))
    or (user_id = auth.uid())
  );

-- EMAIL_PREFERENCES
drop policy if exists email_prefs_select on public.email_preferences;
create policy email_prefs_select on public.email_preferences for select to authenticated using (user_id = auth.uid());
drop policy if exists email_prefs_insert on public.email_preferences;
create policy email_prefs_insert on public.email_preferences for insert to authenticated with check (user_id = auth.uid());
drop policy if exists email_prefs_update on public.email_preferences;
create policy email_prefs_update on public.email_preferences for update to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());

-- MARKETING_CONTACTS (service-role only — no authenticated user policies needed)
drop policy if exists marketing_contacts_none on public.marketing_contacts;
create policy marketing_contacts_none on public.marketing_contacts for all to authenticated using (false);
