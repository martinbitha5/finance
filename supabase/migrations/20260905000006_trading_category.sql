-- Catégorie « Trading » (📈) : ajoutée aux catégories par défaut des nouveaux
-- comptes et insérée pour les comptes existants. « Autres » passe en dernier.
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
    (p_user, 'Trading',              '📈', '#16A34A', 'expense', 'trading',       true, 12),
    (p_user, 'Autres',               '💳', '#94A3B8', 'expense', 'other',         true, 13),
    (p_user, 'Salaire',              '💰', '#22C55E', 'income',  'salary',        true, 20),
    (p_user, 'Bonus',                '🎁', '#84CC16', 'income',  'bonus',         true, 21),
    (p_user, 'Freelance',            '💻', '#0EA5E9', 'income',  'freelance',     true, 22),
    (p_user, 'Business',             '🏪', '#A855F7', 'income',  'business',      true, 23),
    (p_user, 'Gains trading',        '💹', '#16A34A', 'income',  'trading_income', true, 24),
    (p_user, 'Cadeau',               '🎀', '#F472B6', 'income',  'gift',          true, 25),
    (p_user, 'Autre revenu',         '➕', '#64748B', 'income',  'other_income',  true, 26),
    (p_user, 'Épargne',              '🎯', '#EAB308', 'saving',  'saving',        true, 30)
  on conflict do nothing;
end $$;

-- Comptes existants : Trading (dépense) et Gains trading (revenu)
insert into public.categories (user_id, name, icon, color, kind, slug, is_default, sort_order)
select u.id, 'Trading', '📈', '#16A34A', 'expense', 'trading', true, 12
from auth.users u
where not exists (
  select 1 from public.categories c where c.user_id = u.id and c.slug = 'trading'
);

insert into public.categories (user_id, name, icon, color, kind, slug, is_default, sort_order)
select u.id, 'Gains trading', '💹', '#16A34A', 'income', 'trading_income', true, 24
from auth.users u
where not exists (
  select 1 from public.categories c where c.user_id = u.id and c.slug = 'trading_income'
);

-- « Autres » repasse en dernière position des dépenses
update public.categories set sort_order = 13 where slug = 'other' and is_default and sort_order = 11;
