create table if not exists public.user_memories (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  kind text not null check (kind in ('fact', 'preference', 'goal', 'behavior')),
  memory_key text not null,
  content text not null check (char_length(content) between 3 and 240),
  confidence double precision not null check (confidence between 0 and 1),
  source text not null,
  source_message_id text,
  valid_from timestamptz not null default now(),
  valid_to timestamptz,
  supersedes_memory_id uuid references public.user_memories(id) on delete set null,
  created_at timestamptz not null default now(),
  check (valid_to is null or valid_to >= valid_from)
);

create unique index if not exists user_memories_active_key_idx
  on public.user_memories (user_id, memory_key)
  where valid_to is null;

create index if not exists user_memories_active_lookup_idx
  on public.user_memories (user_id, created_at desc)
  where valid_to is null;

alter table public.user_memories enable row level security;

create policy "users manage their own memories"
  on public.user_memories
  for all
  to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

grant select, insert, update, delete
  on public.user_memories
  to authenticated;

create table if not exists public.user_personalization (
  user_id uuid primary key references auth.users(id) on delete cascade,
  memory_enabled boolean not null default true,
  humor_enabled boolean not null default true,
  roast_level smallint not null default 0 check (roast_level in (0, 1)),
  updated_at timestamptz not null default now()
);

alter table public.user_personalization enable row level security;

create policy "users manage their own personalization"
  on public.user_personalization
  for all
  to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

grant select, insert, update, delete
  on public.user_personalization
  to authenticated;
