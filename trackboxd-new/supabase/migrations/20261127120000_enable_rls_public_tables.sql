-- Enable row-level security on every public table the browser can reach.
--
-- Why: the anon key ships in the browser bundle, and until now `anon` and
-- `authenticated` held INSERT/UPDATE/DELETE/TRUNCATE on these tables with RLS
-- off, so anyone could write to them through PostgREST directly.
--
-- What this does:
--   1. Creates public.users rows from a trigger on auth.users, replacing the
--      browser-side insert in AuthModal that ran as `anon` whenever email
--      confirmation was on (no session yet).
--   2. Adds can_view_user_content(owner), which mirrors the app's own rule for
--      private profiles (owner, public profile, or accepted follower).
--   3. Enables RLS and adds policies on the 11 tables.
--   4. Revokes TRUNCATE/TRIGGER/REFERENCES/MAINTAIN from anon and authenticated, all
--      writes from anon, and column-scopes the writes `authenticated` keeps.
--   5. Revokes EXECUTE on the server-only counter RPCs from anon/authenticated.
--   6. Stops future tables in public from granting anon writes or TRUNCATE.
--
-- Server code using SUPABASE_SERVICE_ROLE_KEY (service_role, BYPASSRLS) is not
-- affected. Triggers and SECURITY DEFINER functions owned by `postgres` (table
-- owner, BYPASSRLS) are not affected either.
--
-- Rollback: supabase/rollback/20261127120000_enable_rls_public_tables.down.sql

begin;

-------------------------------------------------------------------------------
-- 1. Profile rows come from auth.users, not from the browser
-------------------------------------------------------------------------------

create or replace function public.handle_new_auth_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.users (id, email, name, created_at, updated_at)
  values (
    new.id::text,
    lower(new.email),
    coalesce(nullif(trim(new.raw_user_meta_data ->> 'name'), ''), split_part(new.email, '@', 1)),
    now(),
    now()
  )
  on conflict do nothing;
  return new;
end;
$$;

revoke execute on function public.handle_new_auth_user() from public, anon, authenticated;

-- `postgres` holds TRIGGER on auth.users but does not own it, so it can create
-- this trigger but not drop it. Create it only when missing (safe to re-run).
do $$
begin
  if not exists (
    select 1 from pg_trigger
    where tgrelid = 'auth.users'::regclass and tgname = 'on_auth_user_created'
  ) then
    create trigger on_auth_user_created
      after insert on auth.users
      for each row execute function public.handle_new_auth_user();
  end if;
end $$;

-------------------------------------------------------------------------------
-- 2. Visibility helper (SECURITY DEFINER so policies can read users/follows
--    without recursing through their own RLS)
-------------------------------------------------------------------------------

create or replace function public.can_view_user_content(owner_id text)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select
    owner_id = (select auth.uid())::text
    or exists (
      select 1 from public.users u
      where u.id = owner_id and not u.profile_private
    )
    or exists (
      select 1 from public.follows f
      where f.follower_id = (select auth.uid())::text
        and f.following_id = owner_id
        and f.accepted
    );
$$;

revoke execute on function public.can_view_user_content(text) from public;
grant execute on function public.can_view_user_content(text) to anon, authenticated, service_role;

-------------------------------------------------------------------------------
-- 3. Table privileges
-------------------------------------------------------------------------------

-- TRUNCATE/TRIGGER/REFERENCES/MAINTAIN: nobody outside the server needs them, on any
-- public table (RLS does not apply to TRUNCATE).
revoke truncate, trigger, references, maintain on all tables in schema public from anon, authenticated;

-- anon never writes. That includes journals, journal_items, email_cooldowns
-- and user_interests, which already had RLS.
revoke insert, update, delete on all tables in schema public from anon;

-- Reference data: read-only for everyone outside the server.
revoke insert, update, delete on public.spotify_items, public.profile_prompts from authenticated;

-- Column-scoped writes for authenticated, so owners cannot set counters,
-- ids, emails or timestamps they do not own. A table-level grant would cover
-- every column, so drop it first.
revoke insert, update, delete on public.users from authenticated;
grant insert (id, email, name, image_url, spotify_url, created_at, updated_at) on public.users to authenticated;
grant update (name, username, image_url, spotify_url, instagram_url, country, profile_private, updated_at, last_login)
  on public.users to authenticated;

revoke insert, update on public.reviews from authenticated;
grant insert (id, user_id, item_id, rating, text, is_public) on public.reviews to authenticated;
grant update (rating, text, is_public, updated_at) on public.reviews to authenticated;

revoke insert, update on public.annotations from authenticated;
grant insert (id, user_id, track_id, "timestamp", text, is_public) on public.annotations to authenticated;
grant update (text, "timestamp", is_public, updated_at) on public.annotations to authenticated;

revoke insert, update on public.follows from authenticated;
grant insert (follower_id, following_id, accepted) on public.follows to authenticated;
grant update (accepted) on public.follows to authenticated;

revoke insert, update on public.notifications from authenticated;
grant update (is_read) on public.notifications to authenticated;

revoke update on public.likes, public.activity, public.user_favorite_tracks from authenticated;

-------------------------------------------------------------------------------
-- 4. Row-level security and policies
-------------------------------------------------------------------------------

-- users -----------------------------------------------------------------------
-- Every profile row is readable: private profiles still show name and avatar;
-- profile_private hides their content, not the profile.
alter table public.users enable row level security;

drop policy if exists users_select on public.users;
create policy users_select on public.users
  for select to anon, authenticated
  using (true);

drop policy if exists users_insert_own on public.users;
create policy users_insert_own on public.users
  for insert to authenticated
  with check (
    id = (select auth.uid())::text
    and lower(email) = lower((select auth.email()))
  );

drop policy if exists users_update_own on public.users;
create policy users_update_own on public.users
  for update to authenticated
  using (id = (select auth.uid())::text)
  with check (id = (select auth.uid())::text);

-- reviews ---------------------------------------------------------------------
alter table public.reviews enable row level security;

drop policy if exists reviews_select on public.reviews;
create policy reviews_select on public.reviews
  for select to anon, authenticated
  using (
    user_id = (select auth.uid())::text
    or (is_public and public.can_view_user_content(user_id))
  );

drop policy if exists reviews_insert_own on public.reviews;
create policy reviews_insert_own on public.reviews
  for insert to authenticated
  with check (user_id = (select auth.uid())::text);

drop policy if exists reviews_update_own on public.reviews;
create policy reviews_update_own on public.reviews
  for update to authenticated
  using (user_id = (select auth.uid())::text)
  with check (user_id = (select auth.uid())::text);

drop policy if exists reviews_delete_own on public.reviews;
create policy reviews_delete_own on public.reviews
  for delete to authenticated
  using (user_id = (select auth.uid())::text);

-- annotations -----------------------------------------------------------------
alter table public.annotations enable row level security;

drop policy if exists annotations_select on public.annotations;
create policy annotations_select on public.annotations
  for select to anon, authenticated
  using (
    user_id = (select auth.uid())::text
    or (is_public and public.can_view_user_content(user_id))
  );

drop policy if exists annotations_insert_own on public.annotations;
create policy annotations_insert_own on public.annotations
  for insert to authenticated
  with check (user_id = (select auth.uid())::text);

drop policy if exists annotations_update_own on public.annotations;
create policy annotations_update_own on public.annotations
  for update to authenticated
  using (user_id = (select auth.uid())::text)
  with check (user_id = (select auth.uid())::text);

drop policy if exists annotations_delete_own on public.annotations;
create policy annotations_delete_own on public.annotations
  for delete to authenticated
  using (user_id = (select auth.uid())::text);

-- likes -----------------------------------------------------------------------
alter table public.likes enable row level security;

drop policy if exists likes_select on public.likes;
create policy likes_select on public.likes
  for select to anon, authenticated
  using (public.can_view_user_content(user_id));

drop policy if exists likes_insert_own on public.likes;
create policy likes_insert_own on public.likes
  for insert to authenticated
  with check (user_id = (select auth.uid())::text);

drop policy if exists likes_delete_own on public.likes;
create policy likes_delete_own on public.likes
  for delete to authenticated
  using (user_id = (select auth.uid())::text);

-- activity --------------------------------------------------------------------
alter table public.activity enable row level security;

drop policy if exists activity_select on public.activity;
create policy activity_select on public.activity
  for select to anon, authenticated
  using (public.can_view_user_content(user_id));

drop policy if exists activity_insert_own on public.activity;
create policy activity_insert_own on public.activity
  for insert to authenticated
  with check (user_id = (select auth.uid())::text);

drop policy if exists activity_delete_own on public.activity;
create policy activity_delete_own on public.activity
  for delete to authenticated
  using (user_id = (select auth.uid())::text);

-- notifications ---------------------------------------------------------------
-- Recipient only. Notifications are created by the server for other people,
-- so there is no insert policy.
alter table public.notifications enable row level security;

drop policy if exists notifications_select_own on public.notifications;
create policy notifications_select_own on public.notifications
  for select to authenticated
  using (user_id = (select auth.uid())::text);

drop policy if exists notifications_update_own on public.notifications;
create policy notifications_update_own on public.notifications
  for update to authenticated
  using (user_id = (select auth.uid())::text)
  with check (user_id = (select auth.uid())::text);

drop policy if exists notifications_delete_own on public.notifications;
create policy notifications_delete_own on public.notifications
  for delete to authenticated
  using (user_id = (select auth.uid())::text);

-- follows ---------------------------------------------------------------------
-- Owner column is follower_id for creating/removing a follow, following_id for
-- accepting or removing a follower.
alter table public.follows enable row level security;

drop policy if exists follows_select on public.follows;
create policy follows_select on public.follows
  for select to anon, authenticated
  using (
    follower_id = (select auth.uid())::text
    or following_id = (select auth.uid())::text
    or (
      accepted
      and (public.can_view_user_content(follower_id) or public.can_view_user_content(following_id))
    )
  );

drop policy if exists follows_insert_own on public.follows;
create policy follows_insert_own on public.follows
  for insert to authenticated
  with check (
    follower_id = (select auth.uid())::text
    and (
      not accepted
      or exists (
        select 1 from public.users u
        where u.id = following_id and not u.profile_private
      )
    )
  );

drop policy if exists follows_accept_own on public.follows;
create policy follows_accept_own on public.follows
  for update to authenticated
  using (following_id = (select auth.uid())::text)
  with check (following_id = (select auth.uid())::text);

drop policy if exists follows_delete_either_side on public.follows;
create policy follows_delete_either_side on public.follows
  for delete to authenticated
  using (
    follower_id = (select auth.uid())::text
    or following_id = (select auth.uid())::text
  );

-- spotify_items ---------------------------------------------------------------
-- Public catalogue cache. Written only by the server (service_role).
alter table public.spotify_items enable row level security;

drop policy if exists spotify_items_select on public.spotify_items;
create policy spotify_items_select on public.spotify_items
  for select to anon, authenticated
  using (true);

-- profile_prompts -------------------------------------------------------------
alter table public.profile_prompts enable row level security;

drop policy if exists profile_prompts_select on public.profile_prompts;
create policy profile_prompts_select on public.profile_prompts
  for select to anon, authenticated
  using (true);

-- user_favorite_tracks --------------------------------------------------------
alter table public.user_favorite_tracks enable row level security;

drop policy if exists user_favorite_tracks_select on public.user_favorite_tracks;
create policy user_favorite_tracks_select on public.user_favorite_tracks
  for select to anon, authenticated
  using (public.can_view_user_content(user_id));

drop policy if exists user_favorite_tracks_insert_own on public.user_favorite_tracks;
create policy user_favorite_tracks_insert_own on public.user_favorite_tracks
  for insert to authenticated
  with check (user_id = (select auth.uid())::text);

drop policy if exists user_favorite_tracks_delete_own on public.user_favorite_tracks;
create policy user_favorite_tracks_delete_own on public.user_favorite_tracks
  for delete to authenticated
  using (user_id = (select auth.uid())::text);

-- user_profile_responses ------------------------------------------------------
alter table public.user_profile_responses enable row level security;

drop policy if exists user_profile_responses_select on public.user_profile_responses;
create policy user_profile_responses_select on public.user_profile_responses
  for select to anon, authenticated
  using (public.can_view_user_content(user_id));

drop policy if exists user_profile_responses_insert_own on public.user_profile_responses;
create policy user_profile_responses_insert_own on public.user_profile_responses
  for insert to authenticated
  with check (user_id = (select auth.uid())::text);

drop policy if exists user_profile_responses_update_own on public.user_profile_responses;
create policy user_profile_responses_update_own on public.user_profile_responses
  for update to authenticated
  using (user_id = (select auth.uid())::text)
  with check (user_id = (select auth.uid())::text);

drop policy if exists user_profile_responses_delete_own on public.user_profile_responses;
create policy user_profile_responses_delete_own on public.user_profile_responses
  for delete to authenticated
  using (user_id = (select auth.uid())::text);

-------------------------------------------------------------------------------
-- 5. Counter RPCs are server-only
-------------------------------------------------------------------------------
-- They are SECURITY INVOKER (except recompute_item_stats), so with RLS on they
-- would silently update nothing for anon/authenticated anyway. Revoking makes
-- that explicit and stops anyone calling recompute_item_stats (DEFINER) at will.

do $$
declare
  fn regprocedure;
begin
  for fn in
    select p.oid::regprocedure
    from pg_proc p
    where p.pronamespace = 'public'::regnamespace
      and p.proname in (
        'increment_like_count', 'decrement_like_count',
        'increment_review_count', 'decrement_review_count',
        'increment_annotation_count', 'decrement_annotation_count',
        'increment_review_like_count', 'decrement_review_like_count',
        'increment_annotation_like_count', 'decrement_annotation_like_count',
        'increment_spotify_item_like_count', 'decrement_spotify_item_like_count',
        'update_avg_rating', 'recompute_item_stats'
      )
  loop
    execute format('revoke execute on function %s from public, anon, authenticated', fn);
    execute format('grant execute on function %s to service_role', fn);
  end loop;
end $$;

-------------------------------------------------------------------------------
-- 6. Future tables created by postgres in public
-------------------------------------------------------------------------------

alter default privileges for role postgres in schema public
  revoke truncate, trigger, references, maintain on tables from anon, authenticated;
alter default privileges for role postgres in schema public
  revoke insert, update, delete on tables from anon;

commit;
