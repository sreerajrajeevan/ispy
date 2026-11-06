-- ============================================================================
-- ispy — 00001_ispy_schema.sql
-- ONE bundled file. Sree: paste this whole file into the Supabase dashboard
-- SQL Editor (https://supabase.com/dashboard) and press Run. Run it once;
-- it is safe to run again (idempotent where practical).
--
-- What this creates:
--   * 9 tables (profiles, daily_clues, clues, photos, likes, comments,
--     follows, notifications) with Row Level Security (RLS) enabled
--   * 2 public Storage buckets: photos, avatars (+ storage policies)
--   * 7 seeded daily clues (today + next 6 days)
--
-- What this does NOT do:
--   * It does NOT create a Supabase project, enable Google/Email auth, or
--     set any secrets. Those are dashboard steps — see supabase/README.md.
--   * It does NOT rotate the daily clue. The 7 seeds cover a week; after
--     that, add new rows to daily_clues (one per day) or add a scheduled
--     job later. The app reads the row whose date = today (Asia/Kolkata).
--
-- CAMERA-ONLY / LIVE PHOTO NOTE (important):
--   * "Live camera only" is enforced APP-SIDE, not in the database: the
--     Camera screen uses expo-camera and never opens the photo library
--     (no gallery picker anywhere in the app). There is no reliable way
--     for Postgres to prove a photo came from a camera.
--   * photos.taken_at is set by the database (default now()) at insert
--     time, and photos.live_photo defaults to true. The app should upload
--     within minutes of taking the photo; if you later want a hard check,
--     enforce in the app that upload happens shortly after capture (or add
--     a trigger rejecting rows where taken_at is far in the past — not
--     added here, because clock skew on devices would false-reject).
-- ============================================================================

create extension if not exists pgcrypto;

-- ---------------------------------------------------------------------------
-- profiles: one row per auth user. Created by the app after sign-up/sign-in.
-- ---------------------------------------------------------------------------
create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  username text unique,
  display_name text,
  bio text,
  avatar_color text,
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- daily_clues: the ONE clue everyone sees each day. date is unique so there
-- can only ever be one clue per day. expires_at = midnight IST at the end
-- of that date (the app reads it; the app computes "today" in Asia/Kolkata).
-- Only the SQL editor / service role inserts rows here — app users cannot.
-- ---------------------------------------------------------------------------
create table if not exists public.daily_clues (
  id uuid primary key default gen_random_uuid(),
  date date not null unique,
  text text not null,
  hint text,
  category text,
  expires_at timestamptz,
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- clues: user-posted clues. Public — anyone can post one, anyone can answer
-- it by commenting with a picture.
-- ---------------------------------------------------------------------------
create table if not exists public.clues (
  id uuid primary key default gen_random_uuid(),
  author_id uuid not null references public.profiles (id) on delete cascade,
  text text not null,
  hint text,
  category text,
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- photos: a live photo answering a clue. Either daily_clue_id (the daily
-- clue) or clue_id (a user-posted clue) is set. storage_path is the path in
-- the 'photos' bucket, e.g. '<user-id>/<timestamp>.jpg'. live_photo is
-- always true from the app; taken_at defaults to insert time (see note
-- at the top — recency is enforced app-side, not here).
-- ---------------------------------------------------------------------------
create table if not exists public.photos (
  id uuid primary key default gen_random_uuid(),
  author_id uuid not null references public.profiles (id) on delete cascade,
  daily_clue_id uuid references public.daily_clues (id) on delete set null,
  clue_id uuid references public.clues (id) on delete set null,
  storage_path text not null,
  caption text,
  live_photo boolean not null default true,
  taken_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- likes: one like per (photo, user).
-- ---------------------------------------------------------------------------
create table if not exists public.likes (
  id uuid primary key default gen_random_uuid(),
  photo_id uuid not null references public.photos (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (photo_id, user_id)
);

-- ---------------------------------------------------------------------------
-- comments: on a photo or on a clue. target_kind defaults to 'photo'
-- because the app's comment insert only sends target_id + text.
-- photo_path is set when the comment answers a clue with a picture
-- (the picture itself lives in the 'photos' bucket).
-- ---------------------------------------------------------------------------
create table if not exists public.comments (
  id uuid primary key default gen_random_uuid(),
  target_id uuid not null,
  target_kind text not null default 'photo' check (target_kind in ('photo', 'clue')),
  author_id uuid not null references public.profiles (id) on delete cascade,
  text text,
  photo_path text,
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- follows: follower_id follows following_id.
-- ---------------------------------------------------------------------------
create table if not exists public.follows (
  follower_id uuid not null references public.profiles (id) on delete cascade,
  following_id uuid not null references public.profiles (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (follower_id, following_id)
);

-- ---------------------------------------------------------------------------
-- notifications: inbox rows for a user (likes, comments, follows, ...).
-- The app only ever reads its own user's rows. NOTE: with the policy
-- below, a user can only insert notifications addressed to themselves, so
-- notifications triggered by *someone else's* action (e.g. "X liked your
-- photo") need a database trigger or a service-role/edge-function path
-- later — they cannot be inserted directly by the other user.
-- ---------------------------------------------------------------------------
create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  kind text not null,
  title text not null,
  body text,
  read boolean not null default false,
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- Indexes for the feed / thread queries the app runs.
-- ---------------------------------------------------------------------------
create index if not exists photos_author_id_idx on public.photos (author_id);
create index if not exists photos_daily_clue_id_idx on public.photos (daily_clue_id);
create index if not exists photos_clue_id_idx on public.photos (clue_id);
create index if not exists photos_created_at_idx on public.photos (created_at desc);
create index if not exists likes_photo_id_idx on public.likes (photo_id);
create index if not exists comments_target_id_idx on public.comments (target_id);
create index if not exists follows_following_id_idx on public.follows (following_id);
create index if not exists notifications_user_id_idx on public.notifications (user_id);

-- ---------------------------------------------------------------------------
-- Row Level Security. Public feed = everyone (anon + authenticated) can
-- READ daily_clues, clues, photos, likes, comments. Writes are always
-- "only your own rows" (auth.uid() = author_id / user_id / follower_id).
-- ---------------------------------------------------------------------------
alter table public.profiles enable row level security;
alter table public.daily_clues enable row level security;
alter table public.clues enable row level security;
alter table public.photos enable row level security;
alter table public.likes enable row level security;
alter table public.comments enable row level security;
alter table public.follows enable row level security;
alter table public.notifications enable row level security;

-- profiles
drop policy if exists "profiles_select_public" on public.profiles;
create policy "profiles_select_public" on public.profiles
  for select using (true);
drop policy if exists "profiles_insert_own" on public.profiles;
create policy "profiles_insert_own" on public.profiles
  for insert with check (auth.uid() = id);
drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_update_own" on public.profiles
  for update using (auth.uid() = id) with check (auth.uid() = id);
drop policy if exists "profiles_delete_own" on public.profiles;
create policy "profiles_delete_own" on public.profiles
  for delete using (auth.uid() = id);

-- daily_clues: public read; no app-side writes (seeded via SQL editor).
drop policy if exists "daily_clues_select_public" on public.daily_clues;
create policy "daily_clues_select_public" on public.daily_clues
  for select using (true);

-- clues
drop policy if exists "clues_select_public" on public.clues;
create policy "clues_select_public" on public.clues
  for select using (true);
drop policy if exists "clues_insert_own" on public.clues;
create policy "clues_insert_own" on public.clues
  for insert with check (auth.uid() = author_id);
drop policy if exists "clues_update_own" on public.clues;
create policy "clues_update_own" on public.clues
  for update using (auth.uid() = author_id) with check (auth.uid() = author_id);
drop policy if exists "clues_delete_own" on public.clues;
create policy "clues_delete_own" on public.clues
  for delete using (auth.uid() = author_id);

-- photos
drop policy if exists "photos_select_public" on public.photos;
create policy "photos_select_public" on public.photos
  for select using (true);
drop policy if exists "photos_insert_own" on public.photos;
create policy "photos_insert_own" on public.photos
  for insert with check (auth.uid() = author_id);
drop policy if exists "photos_update_own" on public.photos;
create policy "photos_update_own" on public.photos
  for update using (auth.uid() = author_id) with check (auth.uid() = author_id);
drop policy if exists "photos_delete_own" on public.photos;
create policy "photos_delete_own" on public.photos
  for delete using (auth.uid() = author_id);

-- likes
drop policy if exists "likes_select_public" on public.likes;
create policy "likes_select_public" on public.likes
  for select using (true);
drop policy if exists "likes_insert_own" on public.likes;
create policy "likes_insert_own" on public.likes
  for insert with check (auth.uid() = user_id);
drop policy if exists "likes_delete_own" on public.likes;
create policy "likes_delete_own" on public.likes
  for delete using (auth.uid() = user_id);

-- comments
drop policy if exists "comments_select_public" on public.comments;
create policy "comments_select_public" on public.comments
  for select using (true);
drop policy if exists "comments_insert_own" on public.comments;
create policy "comments_insert_own" on public.comments
  for insert with check (auth.uid() = author_id);
drop policy if exists "comments_update_own" on public.comments;
create policy "comments_update_own" on public.comments
  for update using (auth.uid() = author_id) with check (auth.uid() = author_id);
drop policy if exists "comments_delete_own" on public.comments;
create policy "comments_delete_own" on public.comments
  for delete using (auth.uid() = author_id);

-- follows
drop policy if exists "follows_select_public" on public.follows;
create policy "follows_select_public" on public.follows
  for select using (true);
drop policy if exists "follows_insert_own" on public.follows;
create policy "follows_insert_own" on public.follows
  for insert with check (auth.uid() = follower_id);
drop policy if exists "follows_delete_own" on public.follows;
create policy "follows_delete_own" on public.follows
  for delete using (auth.uid() = follower_id);

-- notifications: a user reads/updates only their own inbox rows.
drop policy if exists "notifications_select_own" on public.notifications;
create policy "notifications_select_own" on public.notifications
  for select using (auth.uid() = user_id);
drop policy if exists "notifications_insert_own" on public.notifications;
create policy "notifications_insert_own" on public.notifications
  for insert with check (auth.uid() = user_id);
drop policy if exists "notifications_update_own" on public.notifications;
create policy "notifications_update_own" on public.notifications
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
drop policy if exists "notifications_delete_own" on public.notifications;
create policy "notifications_delete_own" on public.notifications
  for delete using (auth.uid() = user_id);

-- ---------------------------------------------------------------------------
-- Storage buckets (public, so feed images load without auth) + policies.
-- Files are stored under a folder named after the uploader's user id,
-- e.g. photos/<user-id>/<timestamp>.jpg — the upload policies enforce
-- that folder name equals the signed-in user's id.
-- ---------------------------------------------------------------------------
insert into storage.buckets (id, name, public)
values ('photos', 'photos', true)
on conflict (id) do update set public = excluded.public;

insert into storage.buckets (id, name, public)
values ('avatars', 'avatars', true)
on conflict (id) do update set public = excluded.public;

drop policy if exists "photos_public_read" on storage.objects;
create policy "photos_public_read" on storage.objects
  for select using (bucket_id = 'photos');

drop policy if exists "avatars_public_read" on storage.objects;
create policy "avatars_public_read" on storage.objects
  for select using (bucket_id = 'avatars');

drop policy if exists "photos_upload_own_folder" on storage.objects;
create policy "photos_upload_own_folder" on storage.objects
  for insert with check (
    bucket_id = 'photos'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

drop policy if exists "avatars_upload_own_folder" on storage.objects;
create policy "avatars_upload_own_folder" on storage.objects
  for insert with check (
    bucket_id = 'avatars'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

drop policy if exists "photos_update_own" on storage.objects;
create policy "photos_update_own" on storage.objects
  for update using (
    bucket_id = 'photos'
    and auth.uid()::text = (storage.foldername(name))[1]
  ) with check (
    bucket_id = 'photos'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

drop policy if exists "photos_delete_own" on storage.objects;
create policy "photos_delete_own" on storage.objects
  for delete using (
    bucket_id = 'photos'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

drop policy if exists "avatars_delete_own" on storage.objects;
create policy "avatars_delete_own" on storage.objects
  for delete using (
    bucket_id = 'avatars'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

-- ---------------------------------------------------------------------------
-- Seed: 7 daily clues, today + the next 6 days. Safe to re-run — rows for
-- dates that already exist are skipped. Add more rows any time with the
-- same pattern (one row per date). expires_at = midnight IST at the end
-- of the clue's date (IST = UTC+5:30). Dates are computed in IST, not in
-- the SQL editor session's timezone, so a run near midnight still seeds
-- the right days.
-- ---------------------------------------------------------------------------
insert into public.daily_clues (date, text, hint, category, expires_at)
select d, t, h, c, (d + 1) at time zone 'Asia/Kolkata'
from (values
  (0, 'Something yellow', 'Look for the sunniest thing around you', 'Colour'),
  (1, 'Something round', 'Circles are everywhere — find your favourite one', 'Shape'),
  (2, 'A tiny thing', 'The smaller, the better. Get close!', 'Size'),
  (3, 'Something blue', 'Sky, water, or something you own', 'Colour'),
  (4, 'Something that makes you smile', 'Anything at all — if it makes you grin, it counts', 'Feeling'),
  (5, 'Something old', 'The older the story, the better the photo', 'Time'),
  (6, 'Something shiny', 'Catch the light — reflections count too', 'Light')
) as s (offset_days, t, h, c)
cross join lateral (
  select ((now() at time zone 'Asia/Kolkata')::date + s.offset_days) as d
) as dt
on conflict (date) do nothing;
