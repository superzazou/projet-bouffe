create type ingredient_unit as enum ('pieces', 'grammes', 'millilitres');

create table recipes (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  title       text not null,
  steps       jsonb not null default '[]',
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create table recipe_ingredients (
  id          uuid primary key default gen_random_uuid(),
  recipe_id   uuid not null references recipes(id) on delete cascade,
  text        text not null,
  quantity    integer not null,
  unit        ingredient_unit not null
);

alter table recipes enable row level security;
alter table recipe_ingredients enable row level security;

create policy "users can manage their own recipes"
  on recipes for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "users can manage ingredients of their recipes"
  on recipe_ingredients for all
  using (
    exists (
      select 1 from recipes
      where recipes.id = recipe_ingredients.recipe_id
        and recipes.user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from recipes
      where recipes.id = recipe_ingredients.recipe_id
        and recipes.user_id = auth.uid()
    )
  );
