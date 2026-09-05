-- Épargne dès la paie : montant fixe ou pourcentage du salaire, protégé du "reste à dépenser",
-- et optionnellement mis de côté automatiquement quand le salaire est enregistré.
alter table public.settings
  add column savings_mode text not null default 'none' check (savings_mode in ('none', 'amount', 'percent')),
  add column savings_value numeric(14,2) not null default 0 check (savings_value >= 0),
  add column savings_auto boolean not null default false;

-- Lien entre une épargne créée automatiquement et le salaire qui l'a déclenchée
alter table public.transactions
  add column auto_from_transaction_id uuid references public.transactions(id) on delete cascade;
create index transactions_auto_from_idx on public.transactions(auto_from_transaction_id);
