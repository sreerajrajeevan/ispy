# ispy — Supabase setup

No Supabase project has been created by the agent. Everything below is a
step **you** run in the Supabase dashboard. About 10 minutes, done once.

## 1. Create the project

1. Go to https://supabase.com/dashboard → **New project**.
2. Name: `ispy`. Database password: pick a strong one and save it somewhere safe.
3. Region: **ap-south-1 (Mumbai)** — recommended, closest to users in India.
4. Wait for the project to finish provisioning (a couple of minutes).

## 2. Run the schema (one paste)

1. In the dashboard sidebar: **SQL Editor** → **New query**.
2. Open `supabase/migrations/00001_ispy_schema.sql` in this repo, copy the
   **whole file**, paste it into the query box.
3. Press **Run**. It should report success with no errors.
4. The file is safe to run again if you need to — tables, policies and
   buckets are created only if missing, and the 7 seeded daily clues skip
   dates that already exist.

What it creates: tables `profiles`, `daily_clues`, `clues`, `photos`,
`likes`, `comments`, `follows`, `notifications` (all with RLS on),
public Storage buckets `photos` and `avatars`, and 7 seeded daily clues
(today + the next 6 days, in IST).

Verify quickly (SQL Editor, new query):

```sql
select count(*) from public.daily_clues;   -- expect 7
select id, name, public from storage.buckets;  -- expect photos + avatars, public = true
```

## 3. Enable auth providers

Sidebar → **Authentication** → **Providers**:

- **Email**: enabled by default. Confirm "Confirm email" is ON if you want
  email verification; OTP (one-time code) sign-in works through the
  email provider — no extra setup beyond this.
- **Google**: enable it, then paste the **Client ID** and **Client Secret**
  from Google Cloud Console (APIs & Services → Credentials → OAuth 2.0
  Client ID, type "Web application"). Add the Supabase callback URL shown
  on that same provider page to the Google client's **Authorized redirect
  URIs**.

Also set the app's redirect URL: **Authentication** → **URL Configuration**
→ Site URL: your Expo dev URL while testing (e.g. `exp://...`), and later
the production scheme `ispy://`.

## 4. Check Storage

Sidebar → **Storage**: you should see two **public** buckets, `photos`
and `avatars`. (They are created by the SQL in step 2 — if either is
missing, re-run the migration file.) No manual policy setup needed; the
policies ship in the same file: anyone can read, signed-in users can
upload only into a folder named after their own user id.

## 5. Copy the keys into the app

Sidebar → **Project Settings** → **API**:

- Copy **Project URL** → `EXPO_PUBLIC_SUPABASE_URL` in `.env`
- Copy **anon public** key → `EXPO_PUBLIC_SUPABASE_ANON_KEY` in `.env`

```bash
cp .env.example .env   # then fill in the two values
```

Never paste the **service_role** key into the app — it bypasses RLS and
must stay secret. The app only ever uses the anon key.

## After setup

- The app runs in **mock mode** (local sample data) until the two `.env`
  values are set — see the repo root `README.md`.
- Daily clues: the seed covers 7 days. Before they run out, add new rows
  to `daily_clues` (one per date) from the SQL Editor, or set up a
  scheduled job later. There is no clue-rotation job yet.
- Notifications triggered by *someone else's* action (e.g. "X liked your
  photo") cannot be inserted by that other user under the current RLS
  policies — that needs a database trigger or edge function later.
  In-app, the notifications screen still works in mock mode.
