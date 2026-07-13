# FluentDraft — Production Deployment Guide

## Purpose

This document defines how to configure and prepare the FluentDraft MVP for production deployment. It covers environment variables, Supabase project setup, hosting configuration, and pre-deploy verification.

**This is a configuration and preparation guide only.** Actual deployment to a preview/production URL is Task 55.

**Related docs:**
- docs/tasks-and-acceptance-criteria.md § Steps 54–55
- docs/architecture.md § High-Level System
- docs/system-design.md § Security And Privacy
- docs/database.md
- supabase/migrations/ (6 migration files)
- .env.example

**Date:** 2026-07-13

---

## 1. Architecture Overview (Production)

```
┌──────────────────────────────────────────────────────────┐
│  Vercel (or Next.js hosting)                              │
│  ┌────────────────────────────────────────────────────┐  │
│  │  Next.js App Router                                 │  │
│  │  - Server Components & Server Actions               │  │
│  │  - Route Handlers                                   │  │
│  │  - Middleware (session refresh)                     │  │
│  └────────────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────────┘
           │                        │
     HTTPS │              HTTPS     │
           ▼                        ▼
┌──────────────────┐    ┌──────────────────────┐
│  Supabase Auth    │    │  Supabase Postgres    │
│  - User accounts  │    │  - Seeded content     │
│  - JWT sessions   │    │  - User learning data │
│  - OAuth (future) │    │  - RLS policies       │
│                    │    │  - Leaderboards       │
└──────────────────┘    └──────────────────────┘
```

Everything is Supabase-first for MVP. No VPS, Redis, Stripe, or external APIs are needed. The browser's Web Speech API handles pronunciation locally (no server-side audio processing).

---

## 2. Environment Variables

### 2.1 Required Variables

| Variable | Purpose | Visibility | Source |
|----------|---------|-----------|--------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL | Browser + Server | Supabase Dashboard > Project Settings > API > Project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anon/public key | Browser + Server | Supabase Dashboard > Project Settings > API > anon public |

### 2.2 Optional Variables

| Variable | Purpose | Visibility | When Required |
|----------|---------|-----------|---------------|
| `SUPABASE_SERVICE_ROLE_KEY` | Admin-level database access | **Server-only, never exposed** | `npm run verify:rls`, admin scripts, future seed/backfill operations |

### 2.3 Key Security Rules

1. **Never** set `SUPABASE_SERVICE_ROLE_KEY` with the `NEXT_PUBLIC_` prefix — it would be bundled into browser JavaScript.
2. **Never** commit actual values to version control. `.env.local` is already in `.gitignore`.
3. The `NEXT_PUBLIC_SUPABASE_ANON_KEY` is **safe to expose in the browser** — RLS policies ensure users can only access their own data.
4. The service role key bypasses RLS completely. Only use it in server-side scripts (e.g., `scripts/verify-rls.ts`) or within trusted admin contexts.

### 2.4 How Variables Are Consumed

| File | Variables Used | Context |
|------|---------------|---------|
| `lib/supabase/client.ts` | `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Browser client |
| `lib/supabase/server.ts` | `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Server Components / Actions |
| `middleware.ts` | `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Session refresh middleware |
| `lib/config/env.ts` | `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Typed env access |
| `scripts/verify-rls.ts` | All three | RLS verification (requires service role) |

### 2.5 Environment Variable Placement by Host

**Vercel:**
- Project Settings > Environment Variables
- Add all three variables (URL, anon key, service role key)
- Mark `NEXT_PUBLIC_*` as available in all environments
- Only set `SUPABASE_SERVICE_ROLE_KEY` if RLS verification or admin scripts are needed on CI

**Other hosts (Railway, Render, Fly.io, custom VPS):**
- Set environment variables in the host's dashboard or `.env` file
- Ensure `NEXT_PUBLIC_*` variables are available at **build time** (they're inlined during Next.js build)
- The service role key is only needed at **runtime** if admin operations are performed

---

## 3. Supabase Production Setup

### 3.1 Create or Select a Supabase Project

1. Go to [supabase.com/dashboard](https://supabase.com/dashboard)
2. Create a **new project** or use an existing one
3. Choose a region close to your primary user base
4. Set a secure database password (store it in a password manager)
5. Wait for the project to provision (usually 1-2 minutes)

### 3.2 Apply Migrations

The project has 6 sequential migration files under `supabase/migrations/`:

| # | File | Contents |
|---|------|----------|
| 1 | `20260709000000_initial_schema.sql` | Tables, enum types, indexes, triggers |
| 2 | `20260709000001_rls_policies.sql` | RLS policies for all 11 user-owned tables |
| 3 | `20260709000002_seed_languages.sql` | Supported translation languages |
| 4 | `20260709000003_seed_gamification.sql` | Levels, badges, missions, XP thresholds |
| 5 | `20260711000000_seed_demo_content.sql` | Fixed demo lesson with chunks, key phrases, translations |
| 6 | `20260712000000_seed_scenario_packs.sql` | Job Hunt & Career, Daily Workplace, Daily Life & Adulting packs |

**How to apply migrations:**

**Option A — Supabase CLI (recommended):**
```bash
# Install Supabase CLI if not already installed
npm install supabase --save-dev

# Link to your Supabase project
npx supabase link --project-ref <your-project-ref>

# Push migrations (creates tables, RLS, seed data)
npx supabase db push

# Verify
npx supabase db dump --local -f /dev/null  # spot-check
```

**Option B — Supabase Dashboard SQL Editor:**
1. Open Supabase Dashboard > SQL Editor
2. Run each migration file in order (00000 → 00001 → 00002 → ...)
3. Copy the full file contents and paste into the SQL Editor
4. Execute each migration sequentially

**Option C — Direct psql:**
```bash
# Get connection string from Supabase Dashboard > Project Settings > Database > Connection string
# Use the "Session" or "Transaction" mode connection string

psql "<connection-string>" -f supabase/migrations/20260709000000_initial_schema.sql
psql "<connection-string>" -f supabase/migrations/20260709000001_rls_policies.sql
# ... repeat for all 6 files in order
```

### 3.3 Verify RLS Policies

After migrations are applied, verify that Row Level Security is enforced:

```bash
# Using the verify:rls script (requires SUPABASE_SERVICE_ROLE_KEY in .env.local)
npm run verify:rls
```

Or run the verification SQL directly in Supabase Dashboard > SQL Editor:
- Open `supabase/verification/rls-verification.sql`
- Run the entire script
- All checks should pass (the script creates test users, checks RLS, and cleans up)

**RLS verification checks:**
- User A cannot read User B's profile
- User A cannot read User B's lesson attempts
- User A cannot read User B's phrase bank items
- User A cannot read User B's phrase reviews
- User A cannot read User B's streaks, badges, missions, scores
- Public leaderboard views expose only allowed fields
- Lesson content is read-only for regular users
- Admin tables (if any) are protected from regular users

### 3.4 Configure Auth Redirect URLs

Once the hosting URL is known (from Task 55), configure Supabase Auth:

1. Go to Supabase Dashboard > Authentication > URL Configuration
2. Set **Site URL** to your production URL (e.g., `https://fluentdraft.vercel.app`)
3. Add **Redirect URLs** for all auth-related paths:
   - `https://fluentdraft.vercel.app` (home)
   - `https://fluentdraft.vercel.app/dashboard`
   - `https://fluentdraft.vercel.app/login`
   - `https://fluentdraft.vercel.app/signup`
   - `https://fluentdraft.vercel.app/onboarding`
4. For preview deployments, add the preview URL patterns:
   - `https://*.vercel.app` (if using Vercel's wildcard preview URLs)

### 3.5 Supabase Project Checklist

| Step | Status | Notes |
|------|--------|-------|
| [ ] Create Supabase project | ⬜ | Choose region, set DB password |
| [ ] Apply migration 1: initial schema | ⬜ | Tables, enums, indexes |
| [ ] Apply migration 2: RLS policies | ⬜ | Must run after schema exists |
| [ ] Apply migration 3: seed languages | ⬜ | Arabic + common languages |
| [ ] Apply migration 4: seed gamification | ⬜ | Levels, badges, missions |
| [ ] Apply migration 5: seed demo content | ⬜ | Fixed demo lesson |
| [ ] Apply migration 6: seed scenario packs | ⬜ | 3 packs with lessons |
| [ ] Run RLS verification | ⬜ | `npm run verify:rls` or manual SQL |
| [ ] Configure Auth Site URL | ⬜ | After hosting URL is known (Task 55) |
| [ ] Configure Auth Redirect URLs | ⬜ | Add production and preview URLs |
| [ ] Copy env vars to hosting platform | ⬜ | URL, anon key, service role key |
| [ ] Test auth flow (signup/login) | ⬜ | After deploy (Task 55) |

---

## 4. Hosting Configuration

### 4.1 Hosting Platform

FluentDraft is a standard Next.js App Router application. Any platform that supports Next.js will work:

| Platform | Recommendation |
|----------|---------------|
| **Vercel** | First choice — native Next.js support, zero-config, Supabase integration guide available |
| Netlify | Works with `@netlify/plugin-nextjs` |
| Railway / Render / Fly.io | Works with `next start` in a Docker container |
| Custom VPS (Contabo) | Reserved for future workers/services — not recommended for the main app during MVP |

For the MVP, **Vercel** is the recommended hosting platform.

### 4.2 Build & Runtime Settings (Vercel)

| Setting | Value |
|---------|-------|
| Framework | Next.js (auto-detected) |
| Build Command | `npm run build` (runs `next build`) |
| Install Command | `npm install` |
| Output Directory | `.next` (auto-detected) |
| Node.js Version | 20.x or 22.x (LTS) |
| Root Directory | `/` (project root) |

Vercel automatically detects Next.js projects and applies these defaults. No additional configuration is typically needed.

### 4.3 Build & Runtime Settings (Other Platforms)

| Setting | Value |
|---------|-------|
| Build Command | `npm run build` |
| Output Directory | `.next` |
| Start Command | `npm start` (runs `next start`) |
| Runtime | Node.js 20+ |
| Port | `3000` (default, configurable via `PORT` env var) |

### 4.4 Environment Variables on Hosting

All three env vars must be set in the hosting platform's environment variable dashboard:

1. `NEXT_PUBLIC_SUPABASE_URL`
2. `NEXT_PUBLIC_SUPABASE_ANON_KEY`
3. `SUPABASE_SERVICE_ROLE_KEY` (optional — only if running admin scripts)

**Important:** `NEXT_PUBLIC_*` variables are **inlined at build time** by Next.js. If you change them, you must redeploy (rebuild). Non-`NEXT_PUBLIC_` variables (like `SUPABASE_SERVICE_ROLE_KEY`) are read at runtime and can be changed without a rebuild.

### 4.5 Domain & HTTPS

- MVP can use the default Vercel domain (e.g., `fluentdraft.vercel.app`)
- Custom domain setup is optional for MVP
- HTTPS is automatically provisioned by Vercel
- Supabase already enforces HTTPS for all connections

---

## 5. Pre-Deploy Checklist

Complete these checks **before** deploying (Task 55):

### 5.1 Code Quality

```bash
npm run lint          # Should pass with 0 errors
npm test              # All 14 test suites, 362 tests should pass
npm run build         # Must compile successfully
npm run validate:content  # Content seed validation (if scenario data changed)
```

### 5.2 Security

- [ ] `.env.local` is git-ignored (confirmed in `.gitignore`)
- [ ] No hardcoded secrets in source code
- [ ] `SUPABASE_SERVICE_ROLE_KEY` is never prefixed with `NEXT_PUBLIC_`
- [ ] `NEXT_PUBLIC_SUPABASE_ANON_KEY` uses the anon key, not the service role key
- [ ] RLS policies are verified (`npm run verify:rls`)

### 5.3 Functional

- [ ] Demo lesson works without registration
- [ ] Signup and login work with production Supabase project
- [ ] Onboarding (level, language, country) completes successfully
- [ ] Registered practice lesson completes end-to-end
- [ ] Phrase Bank saves and reviews phrases
- [ ] Leaderboard shows weekly and monthly rankings
- [ ] Dashboard loads with user summary data

### 5.4 UI

- [ ] Responsive layout verified at 375px, 768px, 1440px (Task 53)
- [ ] No text overlap or cramped controls
- [ ] Audio/speech controls work or degrade gracefully (Task 52)

---

## 6. Smoke Test Checklist (Post-Deploy — Task 55)

After deploying the preview, run these quick checks:

| # | Check | Expected |
|---|-------|----------|
| 1 | Load home page (`/`) | FluentDraft landing page with Get started / Try demo buttons |
| 2 | Load demo page (`/demo`) | Demo lesson overview with all sections, "Start demo lesson" CTA |
| 3 | Complete demo (`/demo/start`) | Practice loop works, signup prompt at end |
| 4 | Sign up | Account created, redirected to onboarding |
| 5 | Complete onboarding | English level, language, country saved |
| 6 | Dashboard loads | Streak, XP, rank, review count, recommendations visible |
| 7 | Start a practice lesson | Navigate through Understand → Practice → Recall → Save |
| 8 | Save phrases | Phrases appear in Phrase Bank |
| 9 | Review a phrase | Review flow works, mastery updates |
| 10 | View leaderboard | Weekly/monthly rankings visible with display name and country |
| 11 | Login again | Session persists across browser restart |

---

## 7. Rollback Plan

If the deployment has critical issues:

1. **Vercel:** Use "Instant Rollback" to revert to the previous successful deployment
2. **Supabase:** Migrations are forward-only. Do not revert migrations. Fix forward instead.
3. **Data integrity:** RLS policies prevent data corruption between users even if the app has bugs

---

## 8. Monitoring (MVP)

For MVP, minimal monitoring is sufficient:

- **Vercel Analytics** (free tier): deployment status, basic traffic
- **Supabase Dashboard**: database health, query performance, auth activity
- **Supabase Logs**: check for RLS errors, failed auth attempts, unusual patterns

No external monitoring services are needed for MVP.

---

## 9. Related Docs

- [Docs index](./README.md)
- [plan.md](../plan.md)
- [architecture.md](./architecture.md)
- [system-design.md](./system-design.md)
- [database.md](./database.md)
- [database-schema.md](./database-schema.md)
- [tasks-and-acceptance-criteria.md](./tasks-and-acceptance-criteria.md)
- [testing-strategy.md](./testing-strategy.md)
