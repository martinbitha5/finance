-- ============================================================
-- MONY — Personal finance schema (applied to Supabase project "finance")
-- ============================================================
create extension if not exists "pgcrypto";

-- ---------- Enums ----------
create type public.transaction_type as enum ('expense', 'income', 'saving');
create type public.payment_method as enum ('cash', 'card', 'mobile_money', 'transfer', 'other');
create type public.category_kind as enum ('expense', 'income', 'saving');
create type public.recurrence_frequency as enum ('daily', 'weekly', 'monthly', 'yearly');
create type public.income_type as enum ('salary', 'bonus', 'freelance', 'business', 'gift', 'other');
create type public.goal_kind as enum ('phone', 'car', 'travel', 'house', 'emergency', 'custom');
create type public.account_type as enum ('cash', 'bank', 'mobile_money', 'other');
create type public.notification_severity as enum ('info', 'success', 'warning', 'danger');
create type public.currency_code as enum ('USD', 'CDF', 'EUR', 'GBP');

-- ---------- Helpers ----------
create or replace function public.set_updated_at()
returns trigger language plpgsql set search_path = public as $$
begin
  new.updated_at = now();
  return new;
end $$;

-- ---------- profiles ----------
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  onboarding_completed boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create trigger profiles_updated_at before update on public.profiles
  for each row execute function public.set_updated_at();

-- ---------- settings ----------
create table public.settings (
  user_id uuid primary key references auth.users(id) on delete cascade,
  currency public.currency_code not null default 'USD',
  locale text not null default 'fr',
  theme text not null default 'system' check (theme in ('light', 'dark', 'system')),
  -- units of each currency per 1 USD
  exchange_rates jsonb not null default '{"USD": 1, "CDF": 2850, "EUR": 0.92, "GBP": 0.79}'::jsonb,
  notifications_enabled boolean not null default true,
  demo_loaded boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create trigger settings_updated_at before update on public.settings
  for each row execute function public.set_updated_at();

-- ---------- accounts ----------
create table public.accounts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null check (char_length(name) between 1 and 60),
  type public.account_type not null default 'cash',
  currency public.currency_code not null default 'USD',
  initial_balance numeric(14,2) not null default 0,
  is_default boolean not null default false,
  is_demo boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index accounts_user_idx on public.accounts(user_id);
create trigger accounts_updated_at before update on public.accounts
  for each row execute function public.set_updated_at();

-- ---------- categories ----------
create table public.categories (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null check (char_length(name) between 1 and 40),
  icon text not null default '💳',
  color text not null default '#94A3B8',
  kind public.category_kind not null default 'expense',
  slug text,
  is_default boolean not null default false,
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);
create index categories_user_idx on public.categories(user_id);
create unique index categories_user_slug_idx on public.categories(user_id, slug) where slug is not null;

-- ---------- income (sources: salary, bonus, ...) ----------
create table public.income (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  type public.income_type not null default 'salary',
  label text not null check (char_length(label) between 1 and 60),
  amount numeric(14,2) not null check (amount >= 0),
  currency public.currency_code not null default 'USD',
  is_recurring boolean not null default false,
  frequency public.recurrence_frequency,
  pay_day smallint check (pay_day between 1 and 31),
  is_variable boolean not null default false,
  is_active boolean not null default true,
  is_demo boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index income_user_idx on public.income(user_id);
create trigger income_updated_at before update on public.income
  for each row execute function public.set_updated_at();

-- ---------- recurring_expenses ----------
create table public.recurring_expenses (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null check (char_length(name) between 1 and 60),
  amount numeric(14,2) not null check (amount > 0),
  currency public.currency_code not null default 'USD',
  category_id uuid references public.categories(id) on delete set null,
  frequency public.recurrence_frequency not null default 'monthly',
  day_of_month smallint check (day_of_month between 1 and 31),
  next_date date not null default current_date,
  payment_method public.payment_method not null default 'card',
  is_active boolean not null default true,
  is_demo boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index recurring_user_idx on public.recurring_expenses(user_id);
create trigger recurring_updated_at before update on public.recurring_expenses
  for each row execute function public.set_updated_at();

-- ---------- savings_goals ----------
create table public.savings_goals (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null check (char_length(name) between 1 and 60),
  icon text not null default '🎯',
  kind public.goal_kind not null default 'custom',
  target_amount numeric(14,2) not null check (target_amount > 0),
  initial_amount numeric(14,2) not null default 0 check (initial_amount >= 0),
  currency public.currency_code not null default 'USD',
  target_date date,
  monthly_contribution numeric(14,2) check (monthly_contribution is null or monthly_contribution >= 0),
  is_completed boolean not null default false,
  is_archived boolean not null default false,
  is_demo boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index goals_user_idx on public.savings_goals(user_id);
create trigger goals_updated_at before update on public.savings_goals
  for each row execute function public.set_updated_at();

-- ---------- transactions ----------
create table public.transactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  account_id uuid references public.accounts(id) on delete set null,
  category_id uuid references public.categories(id) on delete set null,
  type public.transaction_type not null,
  amount numeric(14,2) not null check (amount > 0 and amount < 1000000000),
  currency public.currency_code not null default 'USD',
  description text not null default '' check (char_length(description) <= 120),
  notes text check (notes is null or char_length(notes) <= 500),
  date date not null default current_date,
  payment_method public.payment_method not null default 'cash',
  savings_goal_id uuid references public.savings_goals(id) on delete set null,
  recurring_expense_id uuid references public.recurring_expenses(id) on delete set null,
  income_id uuid references public.income(id) on delete set null,
  is_demo boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index transactions_user_date_idx on public.transactions(user_id, date desc);
create index transactions_user_category_idx on public.transactions(user_id, category_id);
create index transactions_goal_idx on public.transactions(savings_goal_id);
create trigger transactions_updated_at before update on public.transactions
  for each row execute function public.set_updated_at();

-- ---------- budgets ----------
create table public.budgets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  category_id uuid not null references public.categories(id) on delete cascade,
  amount numeric(14,2) not null check (amount > 0),
  currency public.currency_code not null default 'USD',
  alert_threshold smallint not null default 80 check (alert_threshold between 50 and 100),
  is_demo boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, category_id)
);
create index budgets_user_idx on public.budgets(user_id);
create trigger budgets_updated_at before update on public.budgets
  for each row execute function public.set_updated_at();

-- ---------- notifications ----------
create table public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  kind text not null,
  severity public.notification_severity not null default 'info',
  title text not null,
  body text not null default '',
  dedupe_key text not null,
  is_read boolean not null default false,
  created_at timestamptz not null default now(),
  unique (user_id, dedupe_key)
);
create index notifications_user_idx on public.notifications(user_id, created_at desc);

-- ============================================================
-- Row Level Security — every user only sees their own rows
-- ============================================================
alter table public.profiles enable row level security;
alter table public.settings enable row level security;
alter table public.accounts enable row level security;
alter table public.categories enable row level security;
alter table public.income enable row level security;
alter table public.recurring_expenses enable row level security;
alter table public.savings_goals enable row level security;
alter table public.transactions enable row level security;
alter table public.budgets enable row level security;
alter table public.notifications enable row level security;

create policy "profiles: own" on public.profiles for all to authenticated
  using ((select auth.uid()) = id) with check ((select auth.uid()) = id);
create policy "settings: own" on public.settings for all to authenticated
  using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "accounts: own" on public.accounts for all to authenticated
  using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "categories: own" on public.categories for all to authenticated
  using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "income: own" on public.income for all to authenticated
  using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "recurring_expenses: own" on public.recurring_expenses for all to authenticated
  using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "savings_goals: own" on public.savings_goals for all to authenticated
  using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "transactions: own" on public.transactions for all to authenticated
  using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "budgets: own" on public.budgets for all to authenticated
  using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "notifications: own" on public.notifications for all to authenticated
  using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);

-- ============================================================
-- New user bootstrap: profile, settings, default account, categories
-- ============================================================
create or replace function public.seed_default_categories(p_user uuid)
returns void language plpgsql security definer set search_path = public as $$
begin
  insert into public.categories (user_id, name, icon, color, kind, slug, is_default, sort_order) values
    (p_user, 'Nourriture',           '🍔', '#F59E0B', 'expense', 'food',          true, 1),
    (p_user, 'Transport',            '🚕', '#3B82F6', 'expense', 'transport',     true, 2),
    (p_user, 'Logement',             '🏠', '#8B5CF6', 'expense', 'housing',       true, 3),
    (p_user, 'Téléphone / Internet', '📱', '#06B6D4', 'expense', 'phone',         true, 4),
    (p_user, 'Shopping',             '🛍️', '#EC4899', 'expense', 'shopping',      true, 5),
    (p_user, 'Loisirs',              '🎮', '#10B981', 'expense', 'leisure',       true, 6),
    (p_user, 'Santé',                '💊', '#EF4444', 'expense', 'health',        true, 7),
    (p_user, 'Famille',              '👨‍👩‍👧', '#F97316', 'expense', 'family',        true, 8),
    (p_user, 'Éducation',            '📚', '#6366F1', 'expense', 'education',     true, 9),
    (p_user, 'Abonnements',          '📺', '#14B8A6', 'expense', 'subscriptions', true, 10),
    (p_user, 'Autres',               '💳', '#94A3B8', 'expense', 'other',         true, 11),
    (p_user, 'Salaire',              '💰', '#22C55E', 'income',  'salary',        true, 20),
    (p_user, 'Bonus',                '🎁', '#84CC16', 'income',  'bonus',         true, 21),
    (p_user, 'Freelance',            '💻', '#0EA5E9', 'income',  'freelance',     true, 22),
    (p_user, 'Business',             '🏪', '#A855F7', 'income',  'business',      true, 23),
    (p_user, 'Cadeau',               '🎀', '#F472B6', 'income',  'gift',          true, 24),
    (p_user, 'Autre revenu',         '➕', '#64748B', 'income',  'other_income',  true, 25),
    (p_user, 'Épargne',              '🎯', '#EAB308', 'saving',  'saving',        true, 30)
  on conflict do nothing;
end $$;

create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, display_name)
  values (new.id, coalesce(new.raw_user_meta_data->>'display_name', split_part(new.email, '@', 1)))
  on conflict (id) do nothing;
  insert into public.settings (user_id) values (new.id) on conflict (user_id) do nothing;
  insert into public.accounts (user_id, name, type, is_default) values (new.id, 'Principal', 'cash', true);
  perform public.seed_default_categories(new.id);
  return new;
end $$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Self-heal bootstrap for users that exist without profile rows (callable by the user)
create or replace function public.ensure_user_bootstrap()
returns void language plpgsql security definer set search_path = public as $$
declare
  uid uuid := auth.uid();
begin
  if uid is null then
    raise exception 'not authenticated';
  end if;
  insert into public.profiles (id) values (uid) on conflict (id) do nothing;
  insert into public.settings (user_id) values (uid) on conflict (user_id) do nothing;
  if not exists (select 1 from public.accounts where user_id = uid) then
    insert into public.accounts (user_id, name, type, is_default) values (uid, 'Principal', 'cash', true);
  end if;
  if not exists (select 1 from public.categories where user_id = uid) then
    perform public.seed_default_categories(uid);
  end if;
end $$;

revoke all on function public.seed_default_categories(uuid) from public, anon, authenticated;
revoke all on function public.handle_new_user() from public, anon, authenticated;
revoke execute on function public.ensure_user_bootstrap() from public, anon;
grant execute on function public.ensure_user_bootstrap() to authenticated;
