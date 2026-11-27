-- Rollback for migrations/20261127120000_enable_rls_public_tables.sql
--
-- Puts the database back to its state before that migration, as captured from
-- production on 2026-11-27: RLS off on the 11 tables, anon and authenticated
-- holding every table privilege on all 15 public tables, counter RPCs
-- executable by everyone, and no auth.users trigger.
--
-- This reopens the hole the migration closed. Run it only to unblock a broken
-- release, and re-apply the migration (fixed) as soon as possible.

begin;

-- 1. Policies and RLS --------------------------------------------------------

drop policy if exists users_select on public.users;
drop policy if exists users_insert_own on public.users;
drop policy if exists users_update_own on public.users;

drop policy if exists reviews_select on public.reviews;
drop policy if exists reviews_insert_own on public.reviews;
drop policy if exists reviews_update_own on public.reviews;
drop policy if exists reviews_delete_own on public.reviews;

drop policy if exists annotations_select on public.annotations;
drop policy if exists annotations_insert_own on public.annotations;
drop policy if exists annotations_update_own on public.annotations;
drop policy if exists annotations_delete_own on public.annotations;

drop policy if exists likes_select on public.likes;
drop policy if exists likes_insert_own on public.likes;
drop policy if exists likes_delete_own on public.likes;

drop policy if exists activity_select on public.activity;
drop policy if exists activity_insert_own on public.activity;
drop policy if exists activity_delete_own on public.activity;

drop policy if exists notifications_select_own on public.notifications;
drop policy if exists notifications_update_own on public.notifications;
drop policy if exists notifications_delete_own on public.notifications;

drop policy if exists follows_select on public.follows;
drop policy if exists follows_insert_own on public.follows;
drop policy if exists follows_accept_own on public.follows;
drop policy if exists follows_delete_either_side on public.follows;

drop policy if exists spotify_items_select on public.spotify_items;
drop policy if exists profile_prompts_select on public.profile_prompts;

drop policy if exists user_favorite_tracks_select on public.user_favorite_tracks;
drop policy if exists user_favorite_tracks_insert_own on public.user_favorite_tracks;
drop policy if exists user_favorite_tracks_delete_own on public.user_favorite_tracks;

drop policy if exists user_profile_responses_select on public.user_profile_responses;
drop policy if exists user_profile_responses_insert_own on public.user_profile_responses;
drop policy if exists user_profile_responses_update_own on public.user_profile_responses;
drop policy if exists user_profile_responses_delete_own on public.user_profile_responses;

alter table public.users                  disable row level security;
alter table public.reviews                disable row level security;
alter table public.annotations            disable row level security;
alter table public.likes                  disable row level security;
alter table public.activity               disable row level security;
alter table public.notifications          disable row level security;
alter table public.follows                disable row level security;
alter table public.spotify_items          disable row level security;
alter table public.profile_prompts        disable row level security;
alter table public.user_favorite_tracks   disable row level security;
alter table public.user_profile_responses disable row level security;

-- 2. Table privileges ---------------------------------------------------------
-- Revoking at table level also clears the column-level grants the migration
-- added; then restore the original full grant (arwdDxtm).

revoke all on all tables in schema public from anon, authenticated;
grant all on all tables in schema public to anon, authenticated;

alter default privileges for role postgres in schema public
  grant all on tables to anon, authenticated;

-- 3. Counter RPCs -------------------------------------------------------------

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
    execute format('grant execute on function %s to public, anon, authenticated', fn);
  end loop;
end $$;

-- 4. Helper and auth trigger --------------------------------------------------
-- Dropping the trigger hands profile creation back to the browser insert in
-- AuthModal, which works again once the grants above are restored.
-- `postgres` does not own auth.users, so DROP TRIGGER would fail; dropping the
-- function (which postgres owns) with CASCADE removes the trigger with it.

drop function if exists public.can_view_user_content(text);
drop function if exists public.handle_new_auth_user() cascade;

commit;
