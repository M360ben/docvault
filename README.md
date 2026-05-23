# DocVault — Document Portal

A full-stack document portal with user uploads, moderator review, and public/private access control.

## Tech stack
- **Frontend**: React 18 + Vite + Tailwind CSS
- **Backend/DB**: Supabase (Postgres + Auth + Storage + RLS)
- **Hosting**: Render
- **Source**: GitHub

## User roles
| Role | Can do |
|------|--------|
| `user` | Upload docs, manage own docs, view approved public/granted docs |
| `moderator` | All of above + review queue (approve/reject) |
| `admin` | All of above + manage user roles, grant private doc access |

## Local development

```bash
# 1. Clone and install
git clone https://github.com/YOUR_USERNAME/docvault.git
cd docvault
npm install

# 2. Set up environment
cp .env.example .env.local
# Fill in VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY from your Supabase project

# 3. Run the dev server
npm run dev
# Opens at http://localhost:3000
```

## Supabase setup

1. Create a project at https://supabase.com
2. Go to **SQL Editor** and run the full contents of `supabase/migrations/001_initial_schema.sql`
3. Go to **Project Settings > API** and copy:
   - Project URL → `VITE_SUPABASE_URL`
   - `anon` public key → `VITE_SUPABASE_ANON_KEY`

## First admin user

After signing up through the app, promote yourself to admin:
```sql
-- Run in Supabase SQL Editor
UPDATE public.profiles SET role = 'admin' WHERE email = 'your@email.com';
```

## Environment variables

| Variable | Where to find it |
|---|---|
| `VITE_SUPABASE_URL` | Supabase Dashboard > Settings > API > Project URL |
| `VITE_SUPABASE_ANON_KEY` | Supabase Dashboard > Settings > API > anon key |

## Deployment (Render)

See `DEPLOYMENT.md` for the full step-by-step guide.
