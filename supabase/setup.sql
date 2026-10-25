-- Selah: Supabase setup
-- Paste this into Supabase → SQL Editor → New query, then press Run.
-- Safe to run more than once.

-- One row per person holds their synced Selah data.
create table if not exists public.user_state (
  user_id    uuid primary key references auth.users(id) on delete cascade,
  data       jsonb not null default '{}'::jsonb,  -- goals, saved verses, settings, etc.
  enc        text,                                -- end-to-end encrypted private data (optional)
  enc_salt   text,                                -- salt for the user's passphrase (not secret)
  enc_check  text,                                -- lets a new device check the passphrase
  device     text,
  updated_at timestamptz not null default now()
);

-- Row level security: each signed-in person can only see and change their own row.
alter table public.user_state enable row level security;
grant select, insert, update, delete on public.user_state to authenticated;

drop policy if exists "Read own state"   on public.user_state;
drop policy if exists "Insert own state" on public.user_state;
drop policy if exists "Update own state" on public.user_state;
drop policy if exists "Delete own state" on public.user_state;

create policy "Read own state"   on public.user_state for select to authenticated using ((select auth.uid()) = user_id);
create policy "Insert own state" on public.user_state for insert to authenticated with check ((select auth.uid()) = user_id);
create policy "Update own state" on public.user_state for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "Delete own state" on public.user_state for delete to authenticated using ((select auth.uid()) = user_id);

-- The server stamps the time of every save, so devices can tell which copy is newer.
create or replace function public.touch_user_state()
returns trigger language plpgsql set search_path = '' as $$
begin
  new.updated_at := now();
  return new;
end $$;

drop trigger if exists user_state_touch on public.user_state;
create trigger user_state_touch before insert or update on public.user_state
for each row execute function public.touch_user_state();

-- Lets a signed-in person delete their own account (and, through the cascade, their data).
-- Intentionally SECURITY DEFINER: `authenticated` has no DELETE on auth.users and must not
-- have. Supabase's advisor flags this as lint 0029; it is expected here. The function takes
-- no arguments and deletes only auth.uid(), so a caller cannot name another account.
drop function if exists public.delete_my_account();

create function public.delete_my_account()
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  caller uuid := auth.uid();
begin
  if caller is null then
    raise exception 'delete_my_account: no signed-in user'
      using errcode = '42501';
  end if;

  delete from auth.users where id = caller;
end
$$;

revoke all on function public.delete_my_account() from public, anon, authenticated;
grant execute on function public.delete_my_account() to authenticated;

comment on function public.delete_my_account() is
  'Intentional SECURITY DEFINER (Supabase advisor lint 0029). Takes no arguments and '
  'deletes only auth.uid(), so a caller cannot name another account. Raises if there is '
  'no signed-in user. EXECUTE is granted to authenticated only. Reviewed 2026-10-19.';
