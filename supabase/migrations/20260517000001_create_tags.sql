create table tags (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references auth.users(id) on delete cascade,
  name       text not null,
  created_at timestamptz not null default now(),
  unique (user_id, name)
);

alter table tags enable row level security;

create policy "users can manage their own tags"
  on tags for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create table recipe_tags (
  recipe_id uuid not null references recipes(id) on delete cascade,
  tag_id    uuid not null references tags(id) on delete cascade,
  primary key (recipe_id, tag_id)
);

alter table recipe_tags enable row level security;

create policy "users can manage their own recipe tags"
  on recipe_tags for all
  using (
    exists (
      select 1 from recipes
      where recipes.id = recipe_tags.recipe_id
        and recipes.user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from recipes
      where recipes.id = recipe_tags.recipe_id
        and recipes.user_id = auth.uid()
    )
  );
