create type meal_type as enum ('lunch', 'dinner');

create table meal_plans (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  date        date not null,
  meal_type   meal_type not null,
  recipe_id   uuid references recipes(id) on delete set null,
  created_at  timestamptz not null default now(),
  unique (user_id, date, meal_type)
);

alter table meal_plans enable row level security;

create policy "users can manage their own meal plans"
  on meal_plans for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
