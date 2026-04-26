create table shopping_lists (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  status text not null default 'active' check (status in ('active', 'archived')),
  items jsonb not null default '[]',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index shopping_lists_user_id_idx on shopping_lists(user_id);

alter table shopping_lists enable row level security;

create policy "users can manage their own shopping lists"
  on shopping_lists
  for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create or replace function update_shopping_lists_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger shopping_lists_updated_at
  before update on shopping_lists
  for each row execute function update_shopping_lists_updated_at();
