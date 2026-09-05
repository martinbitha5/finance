-- ============================================================
-- Debts: money I owe (owed) and money lent to others (lent)
-- ============================================================
create type public.debt_direction as enum ('owed', 'lent');

create table public.debts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  direction public.debt_direction not null default 'owed',
  name text not null check (char_length(name) between 1 and 60),
  counterparty text check (counterparty is null or char_length(counterparty) <= 60),
  principal numeric(14,2) not null check (principal > 0),
  currency public.currency_code not null default 'USD',
  start_date date not null default current_date,
  due_date date,
  monthly_payment numeric(14,2) check (monthly_payment is null or monthly_payment >= 0),
  notes text check (notes is null or char_length(notes) <= 500),
  is_settled boolean not null default false,
  settled_at date,
  is_demo boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index debts_user_idx on public.debts(user_id);
create trigger debts_updated_at before update on public.debts
  for each row execute function public.set_updated_at();

alter table public.debts enable row level security;
create policy "debts: own" on public.debts for all to authenticated
  using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);

-- Repayments / disbursements are transactions linked to a debt
alter table public.transactions add column debt_id uuid references public.debts(id) on delete set null;
create index transactions_debt_idx on public.transactions(debt_id);

-- Default categories for debts (seed function updated: 'debt' expense + 'debt_income' income),
-- then backfilled for every existing user.
insert into public.categories (user_id, name, icon, color, kind, slug, is_default, sort_order)
select p.id, 'Dettes', '🧾', '#DC2626', 'expense', 'debt', true, 11 from public.profiles p
on conflict do nothing;
insert into public.categories (user_id, name, icon, color, kind, slug, is_default, sort_order)
select p.id, 'Emprunt / remboursement reçu', '🤝', '#0D9488', 'income', 'debt_income', true, 25 from public.profiles p
on conflict do nothing;
