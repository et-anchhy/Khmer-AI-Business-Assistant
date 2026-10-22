# Khmer AI Business Assistant

A bilingual (Khmer / English) business workspace for Cambodian small businesses such as clothing shops, online sellers, cafés, beauty salons and electronics shops. Owners manage their business profile, products, customers, orders and a knowledge base. An AI assistant answers questions in Khmer or English using **only that business's own data**.

> **Status: Phase 1 of 10 is complete** (project setup, UI system, authentication). See [Roadmap](#roadmap). Sections marked _(Phase N)_ describe work that is planned but not built yet.

---

## Features

| Area | Status |
| --- | --- |
| Email/password auth: register, login, logout, forgot and reset password | ✅ Phase 1 |
| Protected dashboard routes (proxy redirect plus a server-side check) | ✅ Phase 1 |
| Khmer / English interface with a language switcher | ✅ Phase 1 |
| Responsive dashboard shell: sidebar on desktop, drawer on mobile | ✅ Phase 1 |
| Business profile and onboarding | Phase 2 |
| Products with images, stock and low-stock warnings | Phase 3 |
| Knowledge base (FAQ, delivery, return and payment policies) | Phase 4 |
| AI assistant grounded in business data, with saved conversations | Phase 5 |
| Customers with order history | Phase 6 |
| Orders with inventory-safe status changes | Phase 7 |
| Dashboard analytics | Phase 8 |

## Tech stack

- **Next.js 16** (App Router, Server Components, Server Actions, `proxy.ts`), **React 19**, **TypeScript**
- **Tailwind CSS 4** and **shadcn/ui** (Radix primitives), **Lucide** icons, **Sonner** toasts
- **Supabase**: Postgres, Auth, Storage and Row Level Security
- **Zod 4** with **react-hook-form**: the same schemas validate on the client and the server
- **OpenAI** for the assistant _(Phase 5)_ · **Recharts** for charts _(Phase 8)_
- **Vitest** for tests
- Fonts: Inter for Latin text and Kantumruy Pro for Khmer

## Requirements

- Node.js **20.9+** (developed on Node 24)
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

| Variable | Where it is used | Secret? |
| --- | --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | Browser and server | No |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Browser and server. Accepts either the anon key or a `sb_publishable_…` key. RLS protects all data. | No |
| `SUPABASE_SERVICE_ROLE_KEY` | Server only: seed script and isolation tests. Bypasses RLS. | **Yes** |
| `NEXT_PUBLIC_SITE_URL` | Base URL for links in auth emails | No |
| `OPENAI_API_KEY` | Server only, AI assistant _(Phase 5)_ | **Yes** |
| `OPENAI_MODEL` | Server only. Optional, defaults to `gpt-4.1-mini`. | No |

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

### Database migrations _(Phase 2)_

SQL migrations will live in `supabase/migrations/`. They will be applied with the Supabase CLI:

```bash
npx supabase login
npx supabase link --project-ref <your-project-ref>
npx supabase db push
```

You can also paste each migration into **SQL Editor** in order.

## OpenAI setup _(Phase 5)_

Create a key at [platform.openai.com](https://platform.openai.com/api-keys) and set `OPENAI_API_KEY`. The key is only used server-side.

## Running locally

```bash
npm run dev          # http://localhost:3000
npm test             # unit tests (Vitest)
npm run typecheck    # TypeScript
npm run lint         # ESLint
```

## Building for production

```bash
npm run build
npm start
```

## Deployment (Vercel)

1. Import the repository in Vercel.
2. Add every variable from `.env.example`. Set `NEXT_PUBLIC_SITE_URL` to your production URL.
3. In Supabase, add `https://<your-domain>/auth/callback` to Redirect URLs and update the Site URL.
4. Deploy.

Any Node host that runs `next start` also works.

## Project structure

```
app/                      Routes only: thin pages that compose features
  (auth)/                 login, register, forgot-password, reset-password
  auth/callback/          Route handler for links in auth emails
  dashboard/              Protected app (layout re-checks the session server-side)
components/
  ui/                     shadcn/ui primitives
  layout/                 App shell, sidebar, navigation config, page header
  form/                   Text field, password input, submit button
features/<feature>/       Feature code: schemas, server actions, components
  auth/
  i18n/
lib/
  supabase/               Browser, server and proxy Supabase clients
  auth/                   Route rules (pure, tested) and session helpers
  i18n/                   Locale config, dictionaries (en, km), server/client access
  ai/                     AI service (Phase 5)
  env.ts / env.server.ts  Validated public config / server-only secrets
services/                 Data-access services per domain (Phase 2+)
hooks/  types/  utils/
proxy.ts                  Session refresh and route guard (Next.js 16 "proxy", formerly middleware)
tests/                    Vitest unit tests
```

### Localization

UI strings live in `lib/i18n/dictionaries/`. `en.ts` defines the shape and `km.ts` must match it; TypeScript and `tests/i18n.test.ts` both enforce this. Server code reads strings with `getI18n()`, client code with `useI18n()`. Components never branch on the language. To add a language, add a dictionary and its code to `locales` in `lib/i18n/config.ts`.

## Security model

- **Proxy (`proxy.ts`)** refreshes the session and redirects signed-out users. This is only an optimistic check.
- **Server-side checks**: protected layouts, pages and actions call `requireUser()`, which verifies the session with Supabase Auth.
- **Database**: Row Level Security on every business-owned table is the real boundary _(Phase 2)_.
- `?next=` redirects are restricted to same-origin paths (`safeRedirectPath`), so they cannot be used as open redirects.
- The forgot-password flow gives the same response whether or not an account exists, so it cannot be used to discover emails.
- Users see friendly error messages. Details are logged server-side via `lib/logger.ts`, without passwords or tokens.

## Roadmap

1. ✅ Project setup, UI system, authentication
2. Database schema, RLS, business profile, onboarding
3. Product management and image upload
4. Knowledge base
5. AI assistant (grounded retrieval, conversation history)
6. Customer management
7. Order management and inventory
8. Dashboard analytics
9. Localization and responsive polish
10. Security tests, error handling, deployment prep
