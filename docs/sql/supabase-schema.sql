create extension if not exists pgcrypto;

create table if not exists public.profiles (
  id uuid primary key default gen_random_uuid(),
  auth_user_id uuid not null unique,
  kakao_nickname text not null,
  avatar_url text not null default '',
  approval_status text not null check (approval_status in ('pending', 'approved', 'rejected')),
  role text not null check (role in ('admin', 'member')) default 'member',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.events (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  event_at timestamptz not null,
  location text not null,
  what text not null,
  how text not null,
  decision_summary text not null,
  created_by uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.memories (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.events(id) on delete cascade,
  author_id uuid not null references public.profiles(id) on delete cascade,
  photo_url text not null,
  caption text not null,
  recorded_at timestamptz not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.comments (
  id uuid primary key default gen_random_uuid(),
  memory_id uuid not null references public.memories(id) on delete cascade,
  author_id uuid not null references public.profiles(id) on delete cascade,
  content text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create or replace function public.is_admin_profile()
returns boolean
language sql
stable
as $$
  select exists (
    select 1
    from public.profiles
    where auth_user_id = auth.uid()
      and role = 'admin'
      and approval_status = 'approved'
  );
$$;

create or replace function public.is_approved_profile()
returns boolean
language sql
stable
as $$
  select exists (
    select 1
    from public.profiles
    where auth_user_id = auth.uid()
      and approval_status = 'approved'
  );
$$;

create or replace function public.current_profile_id()
returns uuid
language sql
stable
as $$
  select id
  from public.profiles
  where auth_user_id = auth.uid()
  limit 1;
$$;

alter table public.profiles enable row level security;
alter table public.events enable row level security;
alter table public.memories enable row level security;
alter table public.comments enable row level security;

drop policy if exists "profiles_read_public" on public.profiles;
create policy "profiles_read_public"
on public.profiles
for select
using (true);

drop policy if exists "profiles_update_self_or_admin" on public.profiles;
create policy "profiles_update_self_or_admin"
on public.profiles
for update
using (auth.uid() = auth_user_id or public.is_admin_profile())
with check (auth.uid() = auth_user_id or public.is_admin_profile());

drop policy if exists "profiles_insert_self" on public.profiles;
create policy "profiles_insert_self"
on public.profiles
for insert
with check (auth.uid() = auth_user_id);

drop policy if exists "events_read_public" on public.events;
create policy "events_read_public"
on public.events
for select
using (true);

drop policy if exists "events_write_approved" on public.events;
create policy "events_write_approved"
on public.events
for insert
with check (public.is_approved_profile() and created_by = public.current_profile_id());

drop policy if exists "events_update_owner_or_admin" on public.events;
create policy "events_update_owner_or_admin"
on public.events
for update
using (public.is_admin_profile() or created_by = public.current_profile_id())
with check (public.is_admin_profile() or created_by = public.current_profile_id());

drop policy if exists "events_delete_admin" on public.events;
create policy "events_delete_admin"
on public.events
for delete
using (public.is_admin_profile());

drop policy if exists "memories_read_public" on public.memories;
create policy "memories_read_public"
on public.memories
for select
using (true);

drop policy if exists "memories_write_approved" on public.memories;
create policy "memories_write_approved"
on public.memories
for insert
with check (public.is_approved_profile() and author_id = public.current_profile_id());

drop policy if exists "memories_update_owner_or_admin" on public.memories;
create policy "memories_update_owner_or_admin"
on public.memories
for update
using (public.is_admin_profile() or author_id = public.current_profile_id())
with check (public.is_admin_profile() or author_id = public.current_profile_id());

drop policy if exists "memories_delete_admin" on public.memories;
create policy "memories_delete_admin"
on public.memories
for delete
using (public.is_admin_profile());

drop policy if exists "comments_read_public" on public.comments;
create policy "comments_read_public"
on public.comments
for select
using (true);

drop policy if exists "comments_write_approved" on public.comments;
create policy "comments_write_approved"
on public.comments
for insert
with check (public.is_approved_profile() and author_id = public.current_profile_id());

drop policy if exists "comments_update_owner_or_admin" on public.comments;
create policy "comments_update_owner_or_admin"
on public.comments
for update
using (public.is_admin_profile() or author_id = public.current_profile_id())
with check (public.is_admin_profile() or author_id = public.current_profile_id());

drop policy if exists "comments_delete_admin" on public.comments;
create policy "comments_delete_admin"
on public.comments
for delete
using (public.is_admin_profile());
