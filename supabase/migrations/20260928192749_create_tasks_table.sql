-- タスク看板のタスクを保存するテーブル
create table public.tasks (
  id uuid primary key default gen_random_uuid(),
  title text not null check (char_length(btrim(title)) between 1 and 100),
  description text not null default '' check (char_length(description) <= 1000),
  status text not null default 'todo' check (status in ('todo', 'in_progress', 'done')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index tasks_status_created_at_idx on public.tasks (status, created_at);

-- 更新時に updated_at を自動で書き換える
create function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

revoke execute on function public.set_updated_at() from public, anon, authenticated;

create trigger tasks_set_updated_at
before update on public.tasks
for each row execute function public.set_updated_at();

-- 認証導入前のため anon / authenticated に全操作を許可する（認証導入時にポリシーを締めること）
grant select, insert, update, delete on table public.tasks to anon, authenticated;
grant select, insert, update, delete on table public.tasks to service_role;

alter table public.tasks enable row level security;

create policy "tasks_select_all" on public.tasks
  for select to anon, authenticated using (true);

create policy "tasks_insert_all" on public.tasks
  for insert to anon, authenticated with check (true);

create policy "tasks_update_all" on public.tasks
  for update to anon, authenticated using (true) with check (true);

create policy "tasks_delete_all" on public.tasks
  for delete to anon, authenticated using (true);
