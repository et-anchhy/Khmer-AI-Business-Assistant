# Khmer AI Business Assistant

A bilingual (Khmer / English) business workspace for Cambodian small businesses such as clothing shops, online sellers, cafés, beauty salons and electronics shops. Owners manage their business profile, products, customers, orders and a knowledge base. An AI assistant answers questions in Khmer or English using **only that business's own data**.

> **Status: Phases 1–2 of 10 are complete** (setup, UI system, authentication, database schema with RLS, business onboarding and settings). See [Roadmap](#roadmap). Sections marked _(Phase N)_ describe work that is planned but not built yet.

---

## Features

| Area                                                                    | Status     |
| ----------------------------------------------------------------------- | ---------- |
| Email/password auth: register, login, logout, forgot and reset password | ✅ Phase 1 |
| Protected dashboard routes (proxy redirect plus a server-side check)    | ✅ Phase 1 |
| Khmer / English interface with a language switcher                      | ✅ Phase 1 |
| Responsive dashboard shell: sidebar on desktop, drawer on mobile        | ✅ Phase 1 |
| Database schema with Row Level Security, plus cross-business isolation tests | ✅ Phase 2 |
| Business onboarding and settings                                        | ✅ Phase 2 |
| Demo seed data (Angkor Fashion)                                         | ✅ Phase 2 |
| Products with images, stock and low-stock warnings                      | Phase 3    |
| Knowledge base (FAQ, delivery, return and payment policies)             | Phase 4    |
| AI assistant grounded in business data, with saved conversations        | Phase 5    |
| Customers with order history                                            | Phase 6    |
| Orders with inventory-safe status changes                               | Phase 7    |
| Dashboard analytics                                                     | Phase 8    |

## Tech stack

- **Next.js 16** (App Router, Server Components, Server Actions, `proxy.ts`), **React 19**, **TypeScript**
- **Tailwind CSS 4** and **shadcn/ui** (Radix primitives), **Lucide** icons, **Sonner** toasts
- **Supabase**: Postgres, Auth, Storage and Row Level Security
- **Zod 4** with **react-hook-form**: the same schemas validate on the client and the server
- **OpenAI** for the assistant _(Phase 5)_ · **Recharts** for charts _(Phase 8)_
- **Vitest** for tests
- Fonts: Inter for Latin text and Kantumruy Pro for Khmer

## Requirements

- Node.js **22+** (developed on Node 24)
- npm 10+
- A Supabase project (the free tier is fine)
- An OpenAI API key _(needed from Phase 5)_

## Installation

```bash
git clone <repo-url> khmer-ai-business-assistant
cd khmer-ai-business-assistant
npm install
cp .env.example .env.local   # then fill in the values
```

## Environment variables

| Variable                          | Where it is used                                                                                       | Secret?       |
| --------------------------------- | ------------------------------------------------------------------------------------------------------ | ------------- |
| `NEXT_PUBLIC_SUPABASE_URL`      | Browser and server                                                                                     | No            |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Browser and server. Accepts either the anon key or a `sb_publishable_…` key. RLS protects all data. | No            |
| `SUPABASE_SERVICE_ROLE_KEY`     | Server only: seed script and isolation tests. Bypasses RLS.                                            | **Yes** |
| `NEXT_PUBLIC_SITE_URL`          | Base URL for links in auth emails                                                                      | No            |
| `OPENAI_API_KEY`                | Server only, AI assistant _(Phase 5)_                                                                | **Yes** |
| `OPENAI_MODEL`                  | Server only. Optional, defaults to `gpt-4.1-mini`.                                                   | No            |
| `SEED_DEMO_PASSWORD`            | Seed script only. Optional demo password.                                                             | No            |

Server-only secrets are read through `lib/env.server.ts`, which imports `server-only`. If a Client Component imports it, the build fails, so these values cannot be bundled for the browser. Never commit `.env.local`.

## Supabase setup

1. Create a project at [supabase.com](https://supabase.com).
2. **Project Settings → API**: copy the Project URL and the anon (or publishable) key into `.env.local`. Copy the service-role (or secret) key into `SUPABASE_SERVICE_ROLE_KEY`.
3. **Authentication → URL Configuration**:
   - Site URL: `http://localhost:3000` (your production URL when deployed)
   - Redirect URLs: add `http://localhost:3000/auth/callback` and `https://<your-domain>/auth/callback`
4. **Authentication → Providers → Email**: email/password is enabled by default.
   - With **Confirm email** on (recommended), new users get a link that goes through `/auth/callback`.
   - With it off, users are signed in straight after registering.
5. Optional: **Authentication → SMTP Settings**. Supabase's built-in email sender is heavily rate-limited, so configure your own SMTP before going live.

Supabase's default email templates work as-is: `/auth/callback` handles both the PKCE `?code=` links and `?token_hash=&type=` links.

### Database migrations

Migrations live in `supabase/migrations/` and run in filename order:

| File | Contents |
| --- | --- |
| `…_initial_schema.sql` | Enums, tables, constraints, indexes, `updated_at` triggers, profile-on-signup trigger, per-business order numbers |
| `…_row_level_security.sql` | `is_business_owner()` helper, RLS policies on every table, column-level grants, no access for `anon` |
| `…_storage.sql` | `product-images` bucket (5 MB, JPEG/PNG/WebP); uploads allowed only under `<business_id>/` |

**Option A: Supabase CLI**

```bash
npx supabase login
npx supabase link --project-ref <your-project-ref>
npx supabase db push
```

**Option B: SQL Editor.** Paste each file into **SQL Editor** in order and run it.

After changing the schema, update `types/database.ts`. You can regenerate it with `npx supabase gen types typescript --linked > types/database.ts`.

### Demo data

```bash
npm run seed -- --yes
```

This creates the fictional **Angkor Fashion** business with 8 products, 5 customers, 6 orders and 8 knowledge-base entries, mixing Khmer and English. You can log in as `demo@angkor-fashion.test` with password `angkor-demo-2026` (override it with `SEED_DEMO_PASSWORD`). The script needs the service-role key and refuses to run with `NODE_ENV=production`. Re-running it deletes and recreates the demo business. Use it only in development projects.

## OpenAI setup _(Phase 5)_

Create a key at [platform.openai.com](https://platform.openai.com/api-keys) and set `OPENAI_API_KEY`. The key is only used server-side.

## Running locally

```bash
npm run dev          # http://localhost:3000
npm test             # unit + database tests (Vitest)
npm run typecheck    # TypeScript
npm run lint         # ESLint
```

### Tests

`npm test` needs no Supabase project or Docker. The database tests in `tests/db/` start an in-memory Postgres ([PGlite](https://pglite.dev)), load a small stand-in for Supabase's `auth`/`storage` schemas and roles, apply every migration, and then query as the `authenticated` role with JWT claims set. That is the same path the Supabase API uses.

`tests/db/rls-isolation.test.ts` is the key security test. It checks that a user from Business A cannot read, update, delete, insert into, re-parent rows into, or link to Business B's products, customers, orders, order items, knowledge base, conversations, messages or images.

## Building for production

```bash
npm run build
npm start
```

## Deployment (Vercel)

1. Import the repository in Vercel.
2. Add every variable from `.env.example`. Set `NEXT_PUBLIC_SITE_URL` to your production URL.
3. In Supabase, add `https://<your-domain>/auth/callback` to Redirect URLs and update the Site URL.
4. Apply the migrations to the production project (`npx supabase db push`). Do not run the seed there.
5. Deploy.

Any Node host that runs `next start` also works.

## Project structure

```
app/                      Routes only: thin pages that compose features
  (auth)/                 login, register, forgot-password, reset-password
  auth/callback/          Route handler for links in auth emails
  onboarding/             Business setup for new accounts
  dashboard/              Protected app (layout requires a user *and* a business)
components/
  ui/                     shadcn/ui primitives
  layout/                 App shell, sidebar, navigation config, page header
  form/                   Text field, generic form field, password input, submit button
features/<feature>/       Feature code: schemas, server actions, components
  auth/
  business/               Onboarding/settings form, schema, actions
  i18n/
lib/
  supabase/               Browser, server and proxy Supabase clients
  auth/                   Route rules (pure, tested) and session helpers
  i18n/                   Locale config, dictionaries (en, km), server/client access
  ai/                     AI service (Phase 5)
  env.ts / env.server.ts  Validated public config / server-only secrets
services/                 Data access per domain; takes the request's RLS-bound client
types/database.ts         Typed schema for supabase-js
supabase/migrations/      SQL migrations (schema, RLS, storage)
scripts/                  Demo seed script and data
hooks/  utils/
proxy.ts                  Session refresh and route guard (Next.js 16 "proxy", formerly middleware)
tests/                    Vitest unit tests; tests/db/ = migrations + RLS on PGlite
```

### Localization

UI strings live in `lib/i18n/dictionaries/`. `en.ts` defines the shape and `km.ts` must match it; TypeScript and `tests/i18n.test.ts` both enforce this. Server code reads strings with `getI18n()`, client code with `useI18n()`. Components never branch on the language. To add a language, add a dictionary and its code to `locales` in `lib/i18n/config.ts`.

## Security model

- **Proxy (`proxy.ts`)** refreshes the session and redirects signed-out users. This is only an optimistic check.
- **Server-side checks**: protected layouts, pages and actions call `requireUser()` / `requireBusiness()`. These verify the session with Supabase Auth and load the user's business. Server code takes the business ID only from there, never from the request.
- **Database (the real boundary)**: RLS is enabled on every table. A row is visible or writable only when `is_business_owner(business_id)` is true. `anon` has no table access.
- **Composite foreign keys**: child rows reference `(id, business_id)` of their parent, so an order item, message or order can't point at another business's data.
- **Column grants**: owners can't change `owner_id` or the order counter, and order numbers are always assigned by a trigger.
- **Storage**: uploads must sit under the uploader's own `<business_id>/` folder.
- `?next=` redirects are restricted to same-origin paths (`safeRedirectPath`), so they cannot be used as open redirects.
- The forgot-password flow gives the same response whether or not an account exists, so it cannot be used to discover emails.
- Users see friendly error messages. Details are logged server-side via `lib/logger.ts`, without passwords or tokens.

## Roadmap

1. ✅ Project setup, UI system, authentication
2. ✅ Database schema, RLS, business profile, onboarding
3. Product management and image upload
4. Knowledge base
5. AI assistant (grounded retrieval, conversation history)
6. Customer management
7. Order management and inventory
8. Dashboard analytics
9. Localization and responsive polish
10. Security tests, error handling, deployment prep




