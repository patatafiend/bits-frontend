# BITS Frontend — Documentation

---

## 1. Overview

BITS Frontend is a **Next.js 16 (App Router)** single web app that serves multiple internal user roles from one codebase, gated by route + permission checks rather than separate apps:

- **Admin console** (`/client/admin/...`) — user management, roles/permissions, billing receiver management.
- **Billing workspace** (`/client/bill-management/...`) — transmittals and billing statements, for billing admin/audit roles.
- **Operations workspace** (`/client/operations/...`) — transmittal handling for operations admins.
- **Outbound / delivery workspace** (`/client/outbound/...`) — sending transmittals to receivers, for billing officers.
- **Shared management** (`/client/management/...`) — receiver management and reports.
- **Auth pages** (`/signin`, `/auth/...`) — sign-in, MFA, forgot/reset password.

It also embeds a small **prebuilt static SPA** ("OpenAPI Explorer") served at `/api/explorer`, and ships its own Next.js API routes for S3 file uploads (used by transmittal item attachments, profile photos, etc.) independent of the backend's own S3 endpoints.

---

## 2. Tech Stack

| Concern | Library |
|---|---|
| Framework | Next.js 16.1 (App Router, React 19, React Compiler enabled), standalone output |
| Styling | Tailwind CSS v4, `tailwindcss-animate`, shadcn/ui ("new-york" style, Radix UI primitives) |
| Forms/validation | `react-hook-form` + `zod` + `@hookform/resolvers` |
| Tables | `@tanstack/react-table` |
| State | React Context (`AuthProvider`, `GlobalFilterProvider`) + `zustand` |
| Dates | `date-fns`, `date-fns-tz` (app is Asia/Manila-timezone-aware — see `formatDate` in `src/lib/utils.ts`) |
| File uploads | `react-dropzone`, `browser-image-compression`, AWS S3 SDK v3 (`@aws-sdk/client-s3`, presigner) |
| PDF export | `@react-pdf/renderer` |
| MFA UI | `input-otp`, `qrcode.react` / `react-qr-code` |
| HTTP | native `fetch` via a hand-rolled wrapper (no axios usage found despite it being a dependency) |
| Rate limiting (edge) | `rate-limiter-flexible` |
| UA parsing | `ua-parser-js` |
| Package manager | Bun (`bun.lock` present; `package-lock.json` is also committed, so npm works too) |

---

## 3. Project Structure

```
bits-frontend/
├── next.config.ts            # standalone output, React Compiler, S3 image remote patterns
├── components.json           # shadcn/ui config
├── scripts/deploy.ps1        # build → tar → scp → PM2 reload deploy script (Windows/PowerShell)
├── public/
│   └── dist/                 # prebuilt static SPA ("OpenAPI Explorer"), served via /api/explorer
└── src/
    ├── app.config.ts         # app-wide constants: date ranges, number/currency format, backend URL
    ├── proxy.ts               # Next.js "proxy" (the new name for middleware, see §7) — rate limiting, blocked paths, request logging
    ├── app/
    │   ├── layout.tsx         # root layout: fonts, ThemeProvider, AuthProvider, GlobalFilterProvider, Toaster
    │   ├── page.tsx            # landing/root page
    │   ├── api/
    │   │   ├── explorer/route.ts               # serves the embedded static SPA
    │   │   └── s3/
    │   │       ├── upload/route.ts              # direct S3 upload (marked as a fallback, not primary path)
    │   │       ├── delete/route.ts              # S3 object deletion
    │   │       └── upload/signed-url/{billing-statements,profiles,transmittal-proofs}/route.ts
    │   │                                        # presigned-URL issuance per upload category (token-verified)
    │   ├── signin/                              # sign-in + MFA challenge pages
    │   ├── auth/                                # forgot-password, verify (reset), mfa setup/verify pages
    │   └── client/
    │       ├── layout.tsx                        # sidebar shell (AppSidebar, theme toggle, client selector)
    │       ├── page.tsx                           # /client home
    │       ├── admin/                             # user mgmt, roles, billing mgmt, (client mgmt — disabled)
    │       ├── bill-management/                   # transmittals + bill statements (billing workspace)
    │       ├── operations/                        # operations workspace
    │       ├── outbound/                           # send/deliver transmittals (billing officer workspace)
    │       └── management/                         # shared: manage receivers, reports
    ├── components/
    │   ├── app-sidebar.tsx      # role/permission-driven nav config + rendering
    │   ├── login-form.tsx, otp-form.tsx
    │   ├── *-combobox.tsx, business-units.tsx, status-badge.tsx, ...  # shared domain widgets
    │   ├── providers/
    │   │   ├── auth-provider.tsx          # current-user context + all auth hooks
    │   │   └── global-filter-provider.tsx # shared filter state (date range, client, etc.)
    │   └── ui/                   # shadcn/ui primitives (button, dialog, table, sidebar, form, ...)
    ├── hooks/                    # one file per backend domain — thin wrappers over useServerFetch/useServerAction
    │   ├── use-user.ts, use-role-permission.ts, use-client.ts, use-receiver.ts
    │   ├── use-transmittal.ts, use-invoice.ts, use-report.ts, use-media.ts, use-mfa.ts
    │   ├── use-file-upload.ts, use-multi-file-upload.ts   # presigned-upload orchestration
    │   ├── use-server.ts         # generic fetch/action hooks (see §5)
    │   └── use-mobile.ts
    └── lib/
        ├── utils.ts               # cn(), formatters, serverFetch client, BACKEND config
        ├── refresh-token-manager.ts  # client-side access-token refresh scheduling
        ├── auth-server.ts         # server-side token verification helper (used by S3 signed-url routes)
        ├── jwt.ts                 # server-only current-user fetch helper (currently unused — see §9)
        ├── helper.ts               # tryCatch() and misc helpers
        └── types.ts                 # shared TypeScript types mirroring backend schemas
```

---

## 4. Getting Started

### 4.1 Prerequisites
- Node.js 20+ (or Bun, which the project is primarily set up for)
- A running instance of [`bits-backend`](../bits-backend) reachable over HTTP

### 4.2 Install

```bash
git clone https://github.com/patatafiend/bits-frontend.git
cd bits-frontend
bun install        # or: npm install
```

### 4.3 Configure environment

Create `.env.local` (git-ignored) with the variables below. Only two are documented anywhere in the repo (`NEXT_PUBLIC_BACKEND_URL` in `app.config.ts`); the rest were found by grepping `process.env` usage across the codebase.

```dotenv
# Backend API base URL — must include whatever path prefix the backend expects
# (bits-backend routes live under /v1, e.g. https://api.example.com/v1)
NEXT_PUBLIC_BACKEND_URL=http://localhost:8000/v1

# AWS S3 — used by this app's own /api/s3/* routes for direct/presigned uploads.
# Same bucket as bits-backend typically, but configured independently here.
AWS_S3_REGION=ap-southeast-1
AWS_S3_ACCESS_KEY_ID=
AWS_S3_SECRET_ACCESS_KEY=
AWS_S3_BUCKET_NAME=
NEXT_PUBLIC_AWS_S3_BUCKET=        # public bucket name, used client-side when recording uploaded file metadata

# Request logging (proxy.ts posts structured logs to an external Meilisearch instance)
MEILI_MASTER_KEY=
```

> `next.config.ts` also whitelists `bits-staging-bucket.s3.amazonaws.com` and `bits-production-bucket.s3.amazonaws.com` (plus any `*.s3.amazonaws.com` / `*.s3.*.amazonaws.com`) as allowed `next/image` remote sources — a hint at the staging/production bucket naming convention.

### 4.4 Run

```bash
bun dev             # http://localhost:3000, Turbopack/webpack dev server
```

### 4.5 Build & run standalone

```bash
bun run build                 # next build (output: "standalone")
bun start:standalone          # bun .next/standalone/server.js
```

### 4.6 Lint

```bash
bun run lint
```

---

## 5. Data Layer: How the Frontend Talks to the Backend

There is no code-generated API client; instead, every backend domain has a matching `src/hooks/use-<domain>.ts` file exposing typed wrappers around two generic hooks in `src/hooks/use-server.ts`:

- **`useServerFetch<T>(url, options)`** — for `GET`-style reads. Supports `fetchImmediately`, `initialQuery`/`initialParams`, and a `refetch()` escape hatch for manual re-fetching with new params.
- **`useServerAction<T, TBody>(url, options)`** — for mutations (`POST`/`PUT`/`DELETE`), exposing an `execute({ body, query, params })` function.

Both ultimately call `serverFetch.service.public()` in `src/lib/utils.ts`, which:
1. Calls `TokenRefreshManager.ensureValidToken()` — checks an `exp` timestamp cached in `localStorage` and, if the access token is near/past expiry, calls `POST {NEXT_PUBLIC_BACKEND_URL}/user/refresh_token` before proceeding (deduplicating concurrent refresh attempts).
2. Issues the actual `fetch(BACKEND_URL + route, { credentials: "include", ... })` — auth is carried via the backend's httponly cookies, not an `Authorization` header, for normal app usage.
3. Normalizes backend error responses (`{ detail, status }`) into a consistent `{ data, error }` shape.

This means: **the backend's cookie domain (`COOKIE_DOMAIN`) must be a domain the frontend can share cookies with**, and CORS on the backend (`FRONTEND_URL` origin) must match where this app is actually hosted.

Domain hooks (non-exhaustive, mirroring `bits-backend` routers 1:1):

| Hook file | Backend module |
|---|---|
| `use-user.ts` | `/user` — user CRUD, activation |
| `use-role-permission.ts` | `/role_permission` — roles & permissions |
| `use-client.ts` | `/clients` — clients & business units |
| `use-receiver.ts` | `/transmittals/receivers`, `/invoices/receivers` — billing receiver contacts |
| `use-transmittal.ts` | `/transmittals` — full transmittal lifecycle |
| `use-invoice.ts` | `/invoices` — legacy invoicing flow |
| `use-report.ts` | `/reports` — summary/trend/export jobs |
| `use-media.ts` | `/media/image/{key}` — presigned view URLs |
| `use-mfa.ts` | `/user/mfa/*` |

---

## 6. Authentication in the Frontend

- **`AuthProvider`** (`src/components/providers/auth-provider.tsx`) wraps the whole app in `layout.tsx`. On mount it calls `GET /user/current_user` (cookie-authenticated) and exposes `{ user, loading, refetchUser }` via context (`useCurrentUser()`, `useRefetchUser()`).
- The current user's `exp` (access-token expiry, embedded in the backend's JWT payload) is cached to `localStorage` and read by `TokenRefreshManager` on every subsequent API call to decide whether to proactively refresh.
- **Sign-in** (`src/app/signin/page.tsx` + `login-form.tsx`) calls `useSignIn()` → `POST /user/signin`. If the backend responds `{ mfa_required: true }`, the user is routed to the MFA challenge (`/signin/mfa`, using `otp-form.tsx` + `useMfaSignIn()` → `POST /user/mfa/signin`).
- **MFA enrollment** (`/auth/mfa`, `/auth/mfa/verify`) uses `qrcode.react` to render the TOTP secret from `POST /user/mfa/setup` for scanning, then confirms via `POST /user/mfa/verify`.
- **Password reset**: `/auth/forgot_password` triggers `POST /user/forgot_password`; the emailed link lands on `/auth/verify`, which collects a new password and calls `usePasswordReset()` → `POST /user/password_reset` with the reset token from the URL query string.
- **Sign-out**: `useSignOut()` → `POST /user/signout`, clearing backend cookies.

For the Next.js **API routes** (`/api/s3/upload/signed-url/*`), auth is verified server-side per request using `verifyTokenAndGetUser()` (`src/lib/auth-server.ts`), which extracts a bearer token or `access_token` cookie from the incoming request and calls the backend's `/user/current_user` itself — since these are server-side route handlers, they can't rely on the browser having already attached cookies the way client components can.

---

## 7. Routing, Roles & the "Proxy" (Middleware)

### 7.1 Role/permission-gated navigation
`app-sidebar.tsx` defines two navigation trees (`navMain` for the general workspace, `adminMain` for the admin console) where each item can declare `accountTypes`, `roles`, and/or `permission`. A `canAccess()` helper filters the tree against the current user from `AuthProvider` before rendering — this is navigation-level gating only; it doesn't stop someone from hitting a URL directly; page-level authorization still ultimately depends on the backend rejecting unauthorized API calls.

Observed role names gating nav items: `admin`, `billing admin`, `billing admin MWFL`, `audit`, `operations admin`, `operations admin MWFL`, `billing officer`. Permission strings follow the backend's `resource:action` convention (e.g. `billing:read`, `receiver:read`, `report:read`, `user:read`, `role:read`).

A workspace switcher (Admin / Billing Management) is shown only to users whose `account_type` is `admin_account`, `company_account`, or `super_admin_account`.

### 7.2 `src/proxy.ts`
Next.js 16 renamed the `middleware.ts` convention to `proxy.ts` — this file fills that role (matches all paths except static assets, per its `config.matcher`). It:
- Rate-limits by IP (100 requests / 60s) using an in-memory limiter — note this resets on every server restart/instance and isn't shared across multiple app instances behind a load balancer.
- Blocks requests to a small denylist of suspicious paths (`/env`, `/.env`, `/config`, `.php`, `.exe`, `.sh`, etc.) with a 404.
- In production, logs every request (method, path, IP, referrer, parsed user-agent/device info) to an external Meilisearch endpoint (`https://meilisearch.y3eet.me/indexes/logs/documents`), authenticated with `MEILI_MASTER_KEY`.

---

## 8. File Uploads

Two S3 upload paths exist side by side:

1. **`POST /api/s3/upload`** — uploads the file bytes directly through the Next.js server using long-term AWS credentials. Explicitly commented in the source as a fallback ("just use the presigning ones... incase some shit aint working"), not the primary path.
2. **Presigned URL routes** — `POST /api/s3/upload/signed-url/{billing-statements|profiles|transmittal-proofs}` verify the caller's backend token, then return a short-lived (1 hour) S3 `PutObject` presigned URL scoped to a category-prefixed key (e.g. `billing-statements/<timestamp>-<filename>`), so the actual file bytes go straight from the browser to S3.

`use-file-upload.ts` and `use-multi-file-upload.ts` orchestrate this: request the presigned URL, `PUT` the (optionally `browser-image-compression`-compressed) file directly to S3, then hand the resulting key back to the relevant backend endpoint (e.g. attaching it to a transmittal item). Viewing an uploaded file later goes through the backend's presigned **read** URL (`GET /v1/media/image/{key}`, wrapped by `use-media.ts`), not this app's own S3 routes.