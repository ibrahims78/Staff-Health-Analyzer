# Employee HR Management System (نظام إدارة الموظفين)

## Overview

This is a full-stack Employee HR Management System designed for a Health Engineering Office (القسم الهندسي الصحي). It manages employee records including personal information, professional details, employment history, and document uploads. The application is built with an Arabic RTL interface and features a dashboard, employee CRUD operations, user management with role-based access, audit logging, and data export capabilities (Excel/Word).

The app runs on port 5000. Default admin credentials: `admin` / `123456`.

**Note:** The `1Staff Health Engineering Office/` and `unzipped_app/` directories are duplicate copies of the main project and should be ignored. The active codebase lives at the repository root.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Overall Structure
The project follows a monorepo pattern with three main directories:
- **`client/`** — React frontend (SPA)
- **`server/`** — Express.js backend API
- **`shared/`** — Shared types, schemas, and route definitions used by both client and server

### Frontend (`client/src/`)
- **Framework:** React with TypeScript, built with Vite
- **Routing:** Wouter (lightweight client-side router)
- **State/Data Fetching:** TanStack React Query for server state management
- **UI Components:** shadcn/ui (New York style) built on Radix UI primitives
- **Styling:** Tailwind CSS with CSS variables for theming, supports dark mode via `next-themes`
- **Forms:** React Hook Form with Zod validation via `@hookform/resolvers`
- **Charts:** Recharts for dashboard visualizations
- **Exports:** `xlsx` for Excel export, `docx` + `file-saver` for Word document generation
- **Language/Direction:** Arabic (RTL), using Tajawal font
- **Path aliases:** `@/` maps to `client/src/`, `@shared/` maps to `shared/`

### Backend (`server/`)
- **Framework:** Express.js with TypeScript, run via `tsx`
- **Authentication:** Custom session-based auth using Passport.js with local strategy. Passwords hashed with scrypt. Sessions stored in PostgreSQL via `connect-pg-simple`.
- **Authorization:** Role-based (`admin` / `employee`). Admin-only routes for user management and audit logs.
- **File Uploads:** Multer with disk storage in `storage/` directory. Allowed types: PDF, JPEG, PNG, DOCX, XLSX. Max 10MB per file.
- **Rate Limiting:** `express-rate-limit` on login endpoint (5 attempts per 15 minutes)
- **API Pattern:** REST API under `/api/` prefix. Route definitions shared between client and server via `shared/routes.ts`.
- **Build:** esbuild bundles server to `dist/index.cjs` for production; Vite builds client to `dist/public/`

### Database
- **Database:** PostgreSQL (required, via `DATABASE_URL` environment variable)
- **ORM:** Drizzle ORM with `drizzle-zod` for schema-to-validation integration
- **Schema location:** `shared/schema.ts`
- **Migrations:** Drizzle Kit with `drizzle-kit push` command (no migration files approach)
- **Tables:**
  - `users` — System users with UUID primary keys, username/password, role, online status tracking
  - `employees` — Employee records with personal info (name, DOB, national ID, gender), professional info (certificates, job title, category, employment status, appointment details, work assignments), contact info, document paths (JSONB), and soft-delete support
  - `auditLogs` — Tracks all system operations (CREATE, UPDATE, DELETE, LOGIN, LOGOUT) with user reference and cascade delete

### Key Design Decisions
1. **Shared schema between client and server** — The `shared/` directory contains both the Drizzle schema and Zod validation schemas derived from it, ensuring type safety across the full stack.
2. **Soft deletes for employees** — Employees are never hard-deleted; `isDeleted` flag and `deletedAt` timestamp are used instead.
3. **Cascade delete on audit logs** — When a user is deleted, their audit log entries are handled via cascade to prevent orphaned records.
4. **Session-based auth over JWT** — Sessions stored in PostgreSQL for persistence across server restarts.
5. **File storage on disk** — Uploaded documents stored in `storage/` directory on the filesystem, paths stored as JSONB in the database.

### Environment Variables
- `DATABASE_URL` — PostgreSQL connection string (required)
- `SESSION_SECRET` — Secret for session encryption (recommended, auto-generated if missing)
- `NODE_ENV` — Set to `production` for production builds

### Scripts
- `npm run dev` — Start development server with hot reload
- `npm run build` — Build for production (client + server)
- `npm start` — Run production build
- `npm run db:push` — Push schema changes to database
- `npm run check` — TypeScript type checking

## External Dependencies

### Database
- **PostgreSQL** — Primary data store. Connected via `pg` Pool using `DATABASE_URL`. Sessions also stored in PostgreSQL via `connect-pg-simple`.

### Key NPM Packages
- **drizzle-orm / drizzle-kit** — ORM and migration tooling for PostgreSQL
- **express / express-session** — HTTP server and session management
- **passport / passport-local** — Authentication framework
- **multer** — Multipart file upload handling
- **express-rate-limit** — API rate limiting
- **@tanstack/react-query** — Client-side data fetching and caching
- **recharts** — Dashboard chart visualizations
- **xlsx** — Excel file generation for data export
- **docx / file-saver** — Word document generation and client-side file saving
- **zod / drizzle-zod** — Runtime validation with schema derivation from database schema
- **validator** — Input validation (IP address checks, etc.)

### External Services
- **Google Fonts** — Tajawal font for Arabic text, plus DM Sans and other fonts
- **Cloudflare Tunnel** — Optional deployment mechanism for exposing local server (documented in deployment guide, not integrated in code)

### Replit-Specific
- **@replit/vite-plugin-runtime-error-modal** — Error overlay in development
- **@replit/vite-plugin-cartographer** — Development tooling (dev only)
- **@replit/vite-plugin-dev-banner** — Development banner (dev only)

## API Key Management System (March 2026)

Added a full dynamic API key management system:

### New Files
- **`server/apiKeyAuth.ts`** — `authenticateAPI` middleware that checks `x-api-key` header against the database, validating existence, active status, and expiry. Returns precise Arabic error messages (401) on failure.

### Database
- **`api_keys` table** — Stores keys with: `key_value` (64-char hex via `crypto.randomBytes(32)`), `description`, `key_type` (`human` | `machine`), `expiry_date`, `is_active`, `created_at`, `created_by`.

### Backend Routes
- `GET /api/api-keys` — List all keys (masked, admin only)
- `POST /api/api-keys` — Create new key (generates crypto key server-side, shows full key once)
- `PATCH /api/api-keys/:id` — Toggle active/inactive or update
- `DELETE /api/api-keys/:id` — Delete key
- `POST /api/auth/api-key-login` — Validate API key (for programmatic services)
- `GET /api/v1/employees` — Example protected route requiring `x-api-key` header

### Frontend
- **`Settings.tsx`** — New `ApiKeysCard` component with table, create modal, reveal-once dialog, toggle active/inactive, delete confirmation
- **`Login.tsx`** — Added tab system: "دخول المستخدمين" (username/password) + "مفتاح API" (validate API key for programmatic services)

### Key Types (`key_type`)
- **`human`** — Used for browser login (username + password + key). Can also be used via `x-api-key` header.
- **`machine`** — Blocked from browser login with HTTP 403. Can only be used via `x-api-key` header for programmatic API access.
- Login route rejects machine keys with a clear Arabic error message.
- `/api/v1/*` routes bypass session auth middleware; protected only by `authenticateAPI` (x-api-key).

### Bootstrap Mode
- When `api_keys` table is empty, login is allowed without a key so admin can create the first key.
- `GET /api/auth/setup-status` returns `{ apiKeyRequired: boolean }` — the login page adapts UI accordingly.

### Security
- Keys never logged to console
- Full key shown only once at creation time; masked in all list views
- try/catch on all DB operations to prevent server crashes

## Recent Fixes (March 2026)

### TypeScript Errors Fixed (0 errors now)
1. **`AuditLogs.tsx`** — Fixed `unknown` type being passed to JSX by converting to boolean (`!!log.oldValues || !!log.newValues`)
2. **`use-users.tsx`** — Fixed `id` type from `number` to `string` for UUID user IDs in both `updateMutation` and `deleteMutation`
3. **`storage.ts`** — Added `as any` cast to `db.insert(employees).values(employee as any)` to resolve optional field type mismatch with Drizzle's strict types
4. **`Sidebar.tsx`** — Removed nested `<a>` inside `<Link>` (wouter renders Link as `<a>` itself); now passes `className` directly to `<Link>` component

### Build Status
- TypeScript: ✅ 0 errors
- Production build: ✅ Success (client + server bundles generated)
- Runtime: ✅ Running on port 5000