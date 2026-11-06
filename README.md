# ispy

A cute, pastel social app built around the **I Spy** game: every day,
everyone gets the **same clue** — and you answer it by taking a **live
photo** with your camera. No gallery, no old photos. The feed is public:
everyone can see, like, and comment on photos.

> Status: **built, typecheck clean (2026-11-06).** `npx tsc --noEmit`
> passes with zero errors, and `npm install` was verified in this
> sandbox (see the note in [How to run](#how-to-run)). The app runs in
> mock mode (local sample data, no backend needed). The Supabase backend
> in `supabase/` is ready to connect — see [Backend setup](#backend-setup-supabase).
> No Expo/device run and no EAS build have been done yet; nothing here has been
> submitted to the Play Store.

## The locked spec

- **One daily clue for everyone**, same clue all day, resets at midnight IST.
- **Friends can also send clues** — and anyone can post a clue publicly;
  others answer it by commenting with a picture.
- **Photos are LIVE camera only**, enforced app-side (expo-camera, no
  gallery picker anywhere). The database stores `taken_at` / `live_photo`
  but cannot prove a photo came from a camera — see the note at the top
  of `supabase/migrations/00001_ispy_schema.sql`.
- **Public feed** with likes and text/photo comments.
- **Auth:** Google OAuth + email OTP (Supabase Auth).
- **Mock mode:** when `EXPO_PUBLIC_SUPABASE_URL` / `EXPO_PUBLIC_SUPABASE_ANON_KEY`
  are empty, the app runs on local sample data so every screen works offline.

## Design

Cute and Pinterest-like: soft lavender background (`#F3EFFF`), pastel
blocks (lavender, butter yellow, baby blue, blush pink, mint), big rounded
cards, friendly rounded type (Quicksand headings, Nunito body), floating
dark-plum pill bottom nav with a raised pink camera button. The design
tokens live in `src/theme/index.ts`.

## Tech stack

| Piece | Version |
| --- | --- |
| Expo (SDK) | ~52.0.0 |
| React | 18.3.1 |
| React Native | 0.76.5 |
| @supabase/supabase-js | ^2.47.0 |
| @react-navigation/native | ^7.0.14 |
| @react-navigation/bottom-tabs | ^7.2.0 |
| @react-navigation/native-stack | ^7.2.0 |
| expo-camera | ~16.0.0 |
| expo-image-picker | ~16.0.0 |
| TypeScript | ^5.3.3 |

Backend: **Supabase** (Postgres + Auth + Storage), project region
ap-south-1 (Mumbai) recommended. Android package `com.sree.ispy`,
iOS bundle id `com.sree.ispy`, deep-link scheme `ispy`.

## How to run

```bash
npm install
cp .env.example .env   # fill in Supabase values, or leave empty for mock mode
npx expo start         # scan the QR with Expo Go, or press `a` for Android
```

- **Sandbox note (2026-11-06):** plain `npm install` fails in this
  sandbox with `EPERM: chown` on a bin file (the same limitation Nearry
  hit). The workaround that worked here is
  `npm install --no-bin-links --ignore-scripts` (915 packages installed,
  then `npx tsc --noEmit` clean). On Sree's own machine plain
  `npm install` should work as normal.

- **Mock mode (no setup):** leave `.env` empty. The app runs on local
  sample data — every screen works, nothing leaves the device.
- **Real backend:** follow `supabase/README.md`, then fill in
  `EXPO_PUBLIC_SUPABASE_URL` and `EXPO_PUBLIC_SUPABASE_ANON_KEY` in `.env`
  and restart Expo. Google sign-in additionally needs the Google provider
  enabled in Supabase (step 3 of that guide) and the client IDs in `.env`.
- Typecheck: `npx tsc --noEmit`.

## Backend setup (Supabase)

Full steps: [`supabase/README.md`](supabase/README.md). Short version:

1. Create a Supabase project (region **ap-south-1 Mumbai**).
2. SQL Editor → paste `supabase/migrations/00001_ispy_schema.sql` → Run.
   (One file: 8 tables with RLS, `photos` + `avatars` Storage buckets,
   7 seeded daily clues. Safe to re-run.)
3. Auth → enable **Google** + **Email** (OTP).
4. Storage → check the `photos` and `avatars` buckets exist (public).
5. Project Settings → API → copy the URL + anon key into `.env`.

Nothing in this repo creates a Supabase project for you — that step is
always yours, in the dashboard.

## How to build an APK / AAB (EAS)

`eas.json` has three profiles (same pattern as the Nearry app):

| Profile | Output | Command |
| --- | --- | --- |
| `development` | dev client (internal) | `eas build -p android --profile development` |
| `preview` | APK (internal) | `eas build -p android --profile preview` |
| `production` | **AAB** (`app-bundle`) | `eas build -p android --profile production` |

```bash
npm install -g eas-cli
eas login
eas build -p android --profile production   # produces the AAB for Play Console
```

EAS builds and Play Console submission are **Sree's steps, on his machine**
— no build has been run from this sandbox, and no AAB exists yet. A
production build also needs the 5 `EXPO_PUBLIC_*` variables set in EAS
(project settings → Environment variables) before building, and Google
sign-in needs the OAuth client IDs configured as above.

## Project structure

```
ispy/
├── app.json                  # Expo config (name, package, camera permission)
├── eas.json                  # EAS build profiles (dev / preview APK / prod AAB)
├── package.json
├── .env.example              # Supabase + Google OAuth keys (copy to .env)
├── src/
│   ├── theme/                # Pastel design tokens (colors, radii, fonts)
│   ├── types.ts              # Shared types (Profile, DailyClue, PhotoPost, ...)
│   ├── mock/                 # Sample data used in mock mode
│   ├── context/              # AuthContext (Google + email OTP)
│   ├── services/             # supabase client + data layer (mock or Supabase)
│   ├── components/           # Shared UI
│   └── screens/              # The 9 screens (see below)
├── supabase/
│   ├── README.md             # Backend setup steps (Sree's checklist)
│   └── migrations/
│       ├── 00001_ispy_schema.sql   # The whole backend, one paste
│       └── run-all.sql             # Pointer to 00001 (SQL Editor is the path)
└── assets/                   # Placeholder pastel icon / splash (replace with a real icon before Play)
```

## Screens (9, per the approved plan)

1. **Today / Home** — today's clue, countdown to midnight IST, your streak.
2. **Live Camera** — expo-camera capture for the daily clue (no gallery).
3. **Preview & Post** — review the shot, add a caption, post.
4. **Public Feed** — everyone's photos, newest / most-liked, like + comment.
5. **Clue Thread** — a user-posted clue and all its photo answers.
6. **Create a Clue** — post your own clue publicly.
7. **Friends & Inbox** — friends, follows, and clue invites from friends.
8. **Post & Comments** — one photo, its likes and text/photo comments.
9. **Profile & Streak** — your photos, streak, followers / following.

## Known limits

- **Mock-mode data is local only** — likes, posts and comments made in mock
  mode live on the device and never sync anywhere.
- **Camera needs a real device** — the live-photo flow does not work in a
  simulator/emulator without a camera, or on web.
- **Google OAuth needs Supabase provider setup** — without the Google
  provider + client IDs configured (see `supabase/README.md` step 3),
  only email OTP sign-in works.
- **No iOS build path in this sandbox** — Android via EAS only; an iOS
  build needs Xcode on a Mac or Expo cloud build plus an Apple developer
  account.
- **Daily clues are seeded for 7 days only** — add more rows to
  `daily_clues` before they run out; there is no rotation job yet.
- **Notifications from other users' actions** (e.g. "X liked your photo")
  need a database trigger or edge function later — the current RLS
  policies only let a user write notifications addressed to themselves.
- **No Expo/device run or EAS build yet** — typecheck (`npx tsc --noEmit`,
  clean, 2026-11-06) and `npm install` were verified in this sandbox, but
  the app has not been run on a phone and no APK/AAB exists yet. That is
  Sree's next step (EAS preview build, then device test).
