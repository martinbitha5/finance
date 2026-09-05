-- Weekly recurring expenses can target several weekdays (ISO 1 = lundi … 7 = dimanche).
-- null = once a week, on the weekday of next_date.
alter table public.recurring_expenses
  add column weekdays smallint[] check (weekdays is null or (array_length(weekdays, 1) between 1 and 7 and weekdays <@ array[1,2,3,4,5,6,7]::smallint[]));
