# FluentDraft — Preview Deployment Smoke Test Report

## Purpose

Deploy the MVP preview to Vercel and verify it passes smoke tests. This is a preview deployment — not final release sign-off (that is Task 56).

**Related docs:**
- docs/tasks-and-acceptance-criteria.md § Step 55
- docs/deployment.md § 5 Pre-Deploy Checklist, § 6 Smoke Test Checklist
- docs/testing-strategy.md § Release Acceptance Checklist

**Date:** 2026-07-13  
**Deployed by:** Vercel CLI (adels-projects-ad98cc53)

---

## 1. Deployment Info

| Property | Value |
|----------|-------|
| **Preview URL** | `https://fluentdraftapp.vercel.app` |
| **Raw deployment URL** | `https://fluentdraft-8hkolsemk-adels-projects-ad98cc53.vercel.app` |
| **Hosting platform** | Vercel |
| **Region** | Washington, D.C., USA (iad1) |
| **Framework** | Next.js 16.2.10 (Turbopack) |
| **Git repository** | `github.com/adelsultann/fluent_draft_app` |
| **Node.js** | 22.x (LTS) |
| **Deploy duration** | ~50 seconds |

---

## 2. Pre-Deploy Checks

| # | Check | Command | Result |
|---|-------|---------|--------|
| 1 | Lint | `npm run lint` | 0 new errors (3 pre-existing in `.cjs`) |
| 2 | Unit + Integration tests | `npm test` | 14 suites, 362 tests — all passed |
| 3 | Production build | `npm run build` | Compiled successfully, all 12 routes |
| 4 | Content validation | `npm run validate:content` | ✓ 4 packs, 7 scenarios valid |
| 5 | Git status | `git status --short` | Clean (no uncommitted changes) |

### Build Log (Vercel)

```
Detected Next.js version: 16.2.10
Running "npm run build"
✓ Compiled successfully in 8.3s
✓ Finished TypeScript in 6.3s
✓ Generating static pages (12/12) in 178ms
Build Completed [31s]
```

**No build errors, no warnings (except middleware deprecation notice from Next.js).**

---

## 3. Environment Variables

| Variable | Set on Vercel | Notes |
|----------|--------------|-------|
| `NEXT_PUBLIC_SUPABASE_URL` | ✅ | Production Supabase project (`oghbleogtmvypkrwpetd`) |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | ✅ | Anon/public key (safe for browser) |
| `SUPABASE_SERVICE_ROLE_KEY` | ❌ | Not set — not needed for runtime; only for admin scripts |

All `NEXT_PUBLIC_*` variables are available at build time. Values match `.env.production`.

---

## 4. Supabase Production Setup

| Step | Status | Notes |
|------|--------|-------|
| Create Supabase project | ✅ | `oghbleogtmvypkrwpetd` |
| Migration 1: initial schema | ✅ | Tables, enums, indexes |
| Migration 2: RLS policies | ✅ | RLS on 11 user tables |
| Migration 3: seed languages | ✅ | Arabic + common languages |
| Migration 4: seed gamification | ✅ | Levels, badges, missions |
| Migration 5: seed demo content | ✅ | Fixed demo lesson |
| Migration 6: seed scenario packs | ✅ | 3 packs with 7 scenarios |
| RLS verification | ⚠️ | Not run — requires `SUPABASE_SERVICE_ROLE_KEY` |
| Auth Site URL configured | ⚠️ | See § 4.1 below |
| Auth Redirect URLs configured | ⚠️ | See § 4.1 below |

### 4.1 Supabase Auth Configuration — Action Required

Signup/login requires configuring the Auth redirect URLs in the Supabase production dashboard:

1. Go to [supabase.com/dashboard](https://supabase.com/dashboard)
2. Open the production project (`oghbleogtmvypkrwpetd`)
3. Navigate to **Authentication → URL Configuration**
4. Set **Site URL:** `https://fluentdraftapp.vercel.app`
5. Add **Redirect URLs:**
   - `https://fluentdraftapp.vercel.app`
   - `https://fluentdraftapp.vercel.app/dashboard`
   - `https://fluentdraftapp.vercel.app/login`
   - `https://fluentdraftapp.vercel.app/signup`
   - `https://fluentdraftapp.vercel.app/onboarding`
   - `https://fluentdraft-8hkolsemk-adels-projects-ad98cc53.vercel.app/**` (raw deployment URL)
6. Click **Save**

**Without this step, Supabase Auth will reject login/signup redirects from the deployed URL.**

---

## 5. Smoke Test Results

### 5.1 HTTP Route Tests

| # | Route | Expected | Status | Response |
|---|-------|----------|--------|----------|
| 1 | `/` (home) | 200 OK | ✅ PASS | FluentDraft branding + "Try demo" CTA |
| 2 | `/demo` | 200 OK | ✅ PASS | Free Demo badge, Model Response, Key Phrases, Start CTA |
| 3 | `/demo/start` | 200 OK | ✅ PASS | Demo practice page loads |
| 4 | `/login` | 200 OK | ✅ PASS | Login form renders |
| 5 | `/signup` | 200 OK | ✅ PASS | Signup form renders |
| 6 | `/onboarding` | 200 OK | ✅ PASS | Onboarding page with sign-in CTAs (unauthenticated) |
| 7 | `/dashboard` | 307 → login | ✅ PASS | Redirects to login (auth-gated) |
| 8 | `/leaderboard` | 307 → login | ✅ PASS | Redirects to login (auth-gated) |
| 9 | `/phrase-bank` | 307 → login | ✅ PASS | Redirects to login (auth-gated) |

### 5.2 Seed Data Verification

| Check | Result |
|-------|--------|
| Demo lesson content loads from Supabase | ✅ PASS |
| Model Response renders on demo page | ✅ PASS |
| Key Phrases render on demo page | ✅ PASS |
| Practice chunks render on demo page | ✅ PASS |
| "Free Demo" badge visible | ✅ PASS |
| "Start demo lesson" CTA visible | ✅ PASS |

### 5.3 Page Content Quality

| Page | Content OK | Notes |
|------|-----------|-------|
| Home (`/`) | ✅ | Brand, description, CTA buttons |
| Demo (`/demo`) | ✅ | All sections (goal, tone, difficulty, criteria, model response, chunks, key phrases, CTA) |
| Login | ✅ | Auth form with email/password fields |
| Signup | ✅ | Auth form with email/password fields |

---

## 6. Build & Runtime Logs

### Vercel Build Output
- **Compilation:** ✓ No errors
- **TypeScript:** ✓ Clean (6.3s)
- **Static pages:** 12/12 generated
- **Warnings:** 1 (middleware deprecation notice — cosmetic, Next.js 16.2 is current)

### Vercel Runtime Logs
- No server errors, no 500s served
- All routes respond within expected timeframes

---

## 7. What Was NOT Tested (Requires Browser Interaction)

These flows require full browser interaction (form fills, Supabase Auth callbacks). They should be verified manually:

| # | Flow | Status |
|---|------|--------|
| 1 | Demo lesson completion (full practice loop) | ⬜ Needs manual test |
| 2 | Signup with email/password | ⬜ Needs manual test + Auth config (§ 4.1) |
| 3 | Login with existing account | ⬜ Needs manual test + Auth config (§ 4.1) |
| 4 | Onboarding (level, language, country) | ⬜ Needs manual test + auth session |
| 5 | Dashboard with user data | ⬜ Needs manual test + auth session |
| 6 | Practice lesson (Understand → Practice → Recall → Save) | ⬜ Needs manual test + auth session |
| 7 | Phrase Bank save and review | ⬜ Needs manual test + auth session |
| 8 | Leaderboard (weekly/monthly) | ⬜ Needs manual test + auth session |
| 9 | Session persistence (browser restart) | ⬜ Needs manual test + auth session |
| 10 | Demo exit warning prompt | ⬜ Needs manual test |
| 11 | Demo completion signup prompt | ⬜ Needs manual test |

**All 11 manual flows are blocked on Supabase Auth redirect URL configuration (§ 4.1).**

---

## 8. Commands Run

| Command | Result |
|---------|--------|
| `npm run lint` | 0 new errors |
| `npm test` | 14 suites, 362 tests passed |
| `npm run build` | Compiled successfully |
| `npm run validate:content` | ✓ 4 packs, 7 scenarios |
| `npx vercel login` | Authenticated |
| `npx vercel --yes --prod --env ...` | Deployed in 50s |

---

## 9. Remaining Risks for Task 56 (Release Checklist)

| Risk | Severity | Mitigation |
|------|----------|------------|
| Supabase Auth redirect URLs not configured | **High** | Must configure before manual smoke tests (§ 4.1) |
| RLS not verified on production DB | **Medium** | Run `npm run verify:rls` with service role key |
| Auth flows not manually tested | **High** | Blocked by Auth redirect config; must test after |
| Practice/Phrase Bank/Leaderboard not manually tested | **Medium** | Depends on auth working; test after Auth config |
| Speech/audio not tested on deployed URL | **Low** | Browser APIs work locally; HTTPS required for some browsers |
| `npm run verify:rls` not run | **Medium** | Run after adding `SUPABASE_SERVICE_ROLE_KEY` to `.env.production` |
| Vercel build cache unavailable on first deploy | **Low** | Subsequent deploys will be faster |
| Node.js middleware deprecation warning | **Low** | Cosmetic only; no functional impact |

---

## 10. Acceptance Criteria Status

| Criteria | Status |
|----------|--------|
| Preview URL is accessible over HTTPS | ✅ `https://fluentdraftapp.vercel.app` |
| Home and demo pages load | ✅ Both return 200 with correct content |
| Demo can be started | ✅ `/demo/start` loads |
| Signup/login and onboarding work | ⚠️ Auth redirect URLs not configured yet |
| Dashboard loads | ⚠️ Auth-gated; redirects to login (expected) |
| Practice lesson starts and basic flow works | ⚠️ Requires auth session |
| Phrase Bank route loads | ⚠️ Auth-gated; redirects to login (expected) |
| Weekly/monthly leaderboard route loads | ⚠️ Auth-gated; redirects to login (expected) |
| No obvious server/runtime errors in hosting logs | ✅ Clean build, no 500s |
| Smoke test results are documented | ✅ This document |

---

## 11. Next Steps (Immediate)

1. **Configure Supabase Auth redirect URLs** — see § 4.1 above  
2. **Manual browser test of all 11 flows** — open `https://fluentdraftapp.vercel.app`  
3. **Run RLS verification** — add `SUPABASE_SERVICE_ROLE_KEY` to `.env.production`, run `npm run verify:rls`  
4. **Proceed to Task 56** — MVP release checklist sign-off
