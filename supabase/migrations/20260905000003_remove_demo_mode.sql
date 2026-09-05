-- Demo mode removed: purge every demo row and drop the flag on settings.
delete from public.transactions where is_demo;
delete from public.budgets where is_demo;
delete from public.recurring_expenses where is_demo;
delete from public.savings_goals where is_demo;
delete from public.debts where is_demo;
delete from public.income where is_demo;
delete from public.accounts where is_demo;
-- Re-activate a user's own salary if the demo had paused it
update public.income set is_active = true where type = 'salary' and not is_demo and not is_active;
alter table public.settings drop column if exists demo_loaded;
