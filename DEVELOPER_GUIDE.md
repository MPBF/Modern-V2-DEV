# MPBF Developer Guide

> **MPBF** — Manufacturing Planning for Plastic Bag Factory
> An MRP system covering the full production lifecycle of a plastic-bag manufacturing plant: customers → quotes → orders → production orders → film/printing/cutting stages → warehouse → delivery, with Arabic-first UI, AI assistant, PWA, and a native mobile app.

This document is the onboarding reference for any developer joining the project. It covers what the app does, how it is built, where things live, the conventions you must respect, and how to operate it day-to-day.

---

## 1. ملخص بالعربية (Arabic Summary)

تطبيق **MPBF** هو نظام تخطيط موارد التصنيع لمصنع أكياس بلاستيكية. يدير دورة الإنتاج كاملة من العميل والعرض السعري والطلب، مرورًا بمراحل الفيلم والطباعة والقص، وصولًا إلى المخزون والتوصيل. الواجهة عربية أولاً (RTL) مع دعم إنجليزي. النظام يحتوي على:

- لوحات تحكم لحظية للمصنع والآلات والإنتاج
- وحدة موارد بشرية (حضور، إجازات، أداء)
- صيانة الآلات وإدارة قطع الغيار
- مساعد ذكي (AI Agent) قادر على الاستعلام من قاعدة البيانات وتوليد التقارير والمستندات
- تطبيق PWA وتطبيق Expo أصلي للجوال مع دعم العمل دون اتصال
- إشعارات متعددة القنوات (واتساب، SMS)

الواجهة الأمامية بـ React + Vite، الخلفية بـ Express + TypeScript، قاعدة البيانات PostgreSQL على Neon Serverless مع Drizzle ORM.

---

## 2. Tech Stack

| Layer | Technology |
|---|---|
| Frontend framework | React 18 + TypeScript + Vite |
| UI library | shadcn/ui (Radix primitives) + Tailwind CSS |
| State / data | TanStack Query v5 |
| Routing | wouter |
| Forms | react-hook-form + Zod via `@hookform/resolvers/zod` |
| Charts | Recharts |
| 3D | three.js + @react-three/fiber + @react-three/drei |
| i18n | i18next (Arabic primary, English fallback) |
| Backend | Node.js + Express 4 (TypeScript via `tsx`) |
| ORM | Drizzle ORM (`drizzle-orm`, `drizzle-zod`, `drizzle-kit push`) |
| Database | PostgreSQL via Neon Serverless (`@neondatabase/serverless` over WebSockets) |
| Sessions | `express-session` + `connect-pg-simple` (PostgreSQL session store) |
| Auth | Passport.js (session) + Replit Auth (OpenID Connect) + custom mobile bearer tokens |
| Validation | Zod |
| Object storage | Google Cloud Storage (via `@google-cloud/storage`) |
| File uploads (client) | Uppy + AWS S3 multipart |
| PDF generation | Adobe PDF Services SDK + custom `server/pdf-generator.ts` |
| Excel/Docx | `exceljs`, `docx` |
| AI | OpenAI (`gpt-4o-mini` and others) |
| Messaging | Meta WhatsApp Business API, Twilio WhatsApp, Taqnyat SMS, SendGrid email |
| MCP | `@modelcontextprotocol/sdk` (custom MCP server + OAuth 2.1 routes) |
| Mobile app | Expo (React Native) — see `MOBILE_APP_REFERENCE.md` |
| Build | Vite (frontend) + esbuild (server bundle) |
| Lint / format | ESLint + Prettier |

---

## 3. High-Level Architecture

```
┌─────────────────────┐     ┌─────────────────────┐     ┌──────────────────────┐
│  Browser (PWA)      │     │  Expo Mobile App    │     │  External Services   │
│  React + Vite       │     │  React Native       │     │  WhatsApp / SMS /    │
│                     │     │  Bearer-token auth  │     │  OpenAI / GCS / etc. │
└──────────┬──────────┘     └──────────┬──────────┘     └──────────┬───────────┘
           │ HTTP/JSON                  │ HTTP/JSON                 │
           ▼                            ▼                           │
┌─────────────────────────────────────────────────────────────┐     │
│                  Express API (server/)                      │◄────┘
│  - routes.ts (~16k lines, main REST surface)                │
│  - ai-agent-routes.ts (chat + tool execution)               │
│  - mcp-routes.ts + mcp-oauth.ts (Model Context Protocol)    │
│  - middleware: auth, validation, transaction, performance   │
│  - services: notifications, WhatsApp, SMS, AI, PDF…         │
│  - storage.ts (Drizzle data-access layer)                   │
└──────────┬──────────────────────────────────────────────────┘
           │ Drizzle ORM
           ▼
┌─────────────────────────────────────────────────────────────┐
│            PostgreSQL (Neon Serverless, ~107 tables)        │
│   Sessions also stored here via connect-pg-simple           │
└─────────────────────────────────────────────────────────────┘
```

The Vite dev server is mounted **inside** the Express server (`server/vite.ts`) so frontend and backend share one port (5000, mirrored on 8000). This avoids a CORS/proxy setup in dev.

---

## 4. Repository Layout

```
.
├── client/                       # Frontend (React + Vite)
│   ├── index.html
│   └── src/
│       ├── App.tsx               # Routing tree, lazy pages
│       ├── main.tsx              # Entry point
│       ├── pages/                # ~50 route-level pages
│       ├── components/
│       │   ├── ui/               # shadcn/ui primitives
│       │   └── layout/           # Header, Sidebar, MobileShell
│       ├── hooks/                # use-auth, use-company-logo, use-toast…
│       ├── contexts/             # LanguageContext, ThemeContext
│       ├── i18n/locales/         # ar.json, en.json
│       ├── config/               # navigationConfig.ts, chromeRoutes.ts
│       ├── lib/                  # queryClient.ts, utils
│       └── types/
├── server/                       # Backend (Express + TypeScript)
│   ├── index.ts                  # Entry point
│   ├── routes.ts                 # Main REST API (HUGE — ~16,700 lines)
│   ├── ai-agent-routes.ts        # AI chat + tool execution
│   ├── mcp-routes.ts             # Model Context Protocol HTTP routes
│   ├── mcp-server.ts             # MCP server implementation
│   ├── mcp-oauth.ts              # OAuth 2.1 for MCP clients
│   ├── storage.ts                # Drizzle data-access layer (~8,700 lines)
│   ├── db.ts                     # Neon pool + drizzle instance
│   ├── legacy-db.ts              # Read-only legacy DB connection
│   ├── replitAuth.ts             # OpenID Connect (Replit Auth)
│   ├── vite.ts                   # Vite middleware mount (DO NOT MODIFY)
│   ├── pdf-generator.ts          # Quote / report PDF generator
│   ├── adobe-pdf-service.ts      # Adobe PDF Services wrapper
│   ├── factory-location.ts       # Geofencing for attendance
│   ├── middleware/
│   │   ├── auth.ts               # requireAuth, requirePermission
│   │   ├── session-auth.ts       # Session resolver
│   │   ├── validation.ts         # Zod request validators
│   │   ├── transaction.ts        # DB transaction wrapper
│   │   ├── database-monitor.ts   # Connection / query metrics
│   │   ├── performance-monitor.ts # Slow-route warning logs
│   │   └── memory-monitor.ts     # 30s memory snapshot
│   ├── services/
│   │   ├── meta-whatsapp.ts
│   │   ├── taqnyat-sms.ts
│   │   ├── notification-manager.ts
│   │   ├── notification-service.ts
│   │   ├── alert-manager.ts
│   │   ├── event-trigger-service.ts
│   │   ├── arabic-text-service.ts
│   │   ├── data-validator.ts
│   │   ├── system-health-monitor.ts
│   │   ├── code-health-checker.ts
│   │   └── error-learning-enhancer.ts
│   ├── replit_integrations/      # Object storage helpers
│   ├── routes/                   # Route subgroups
│   ├── lib/                      # Server utilities
│   ├── auth/                     # Auth helpers
│   ├── fonts/                    # Arabic fonts for PDFs
│   └── types/
├── shared/                       # Code shared between client and server
│   ├── schema.ts                 # Drizzle tables + Zod insert schemas (~4,500 lines)
│   ├── permissions.ts            # RBAC permission definitions
│   ├── id-generator.ts
│   ├── decimal-utils.ts, number-utils.ts, quantity-utils.ts
│   ├── validation-utils.ts
│   ├── models/
│   ├── NumberInput.tsx, MachineSelect.tsx, ProductionOrderSelect.tsx
├── migrations/                   # Drizzle migration history
├── public/                       # Static assets, PWA manifest, service worker
├── attached_assets/              # User-uploaded references, screenshots
│   └── MOBILE_APP_API_CONTRACT.md  # Mobile API contract — DO NOT BREAK
├── apps/, packages/              # Workspace folders
├── scripts/                      # Maintenance and ops scripts
├── docs/                         # Long-form internal docs
├── dist/                         # Production build output
├── exports/                      # Generated reports
├── replit.md                     # Project README + user preferences
├── threat_model.md               # Security threat model
├── DEVELOPER_GUIDE.md            # ← this file
├── MOBILE_APP_REFERENCE.md       # Mobile app reference (large)
├── package.json
├── vite.config.ts                # DO NOT MODIFY
├── drizzle.config.ts             # DO NOT MODIFY
└── tsconfig.json
```

---

## 5. Run & Operate

### Local dev

```bash
npm run dev      # Express + Vite together on port 5000 (also 8000)
```

The app boots, verifies the database, runs auto-migration if the DB is empty (or critical tables are missing), starts memory monitoring, and registers MCP + OAuth routes. Logs are colour-coded and bilingual.

### Production build

```bash
npm run build    # vite build (client) + esbuild bundle (server)
npm start        # node dist/index.js
```

### Other scripts

```bash
npm run check    # tsc type-check
npm run lint     # ESLint (--max-warnings=0)
npm run lint:fix # ESLint autofix
npm run db:push  # drizzle-kit push (schema sync — careful in prod)
```

### Required environment variables

Set via Replit Secrets — **never** commit to `.env`:

| Variable | Purpose |
|---|---|
| `DATABASE_URL` | PostgreSQL connection string (Neon) |
| `SESSION_SECRET` | Express session signing secret |
| `META_WHATSAPP_TOKEN`, `META_WHATSAPP_PHONE_ID` | Meta WhatsApp Business API |
| `TAQNYAT_API_KEY`, `TAQNYAT_SENDER_NAME` | Taqnyat SMS gateway |
| `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, `TWILIO_WHATSAPP_NUMBER` | Twilio WhatsApp |
| `ADOBE_CLIENT_ID`, `ADOBE_CLIENT_SECRET` | Adobe PDF Services |
| `OPENAI_API_KEY` | AI agent + translation |
| `SENDGRID_API_KEY` | Email |
| `PUBLIC_OBJECT_SEARCH_PATHS`, `PRIVATE_OBJECT_DIR` | Replit object storage |
| `REPL_ID`, `REPLIT_DOMAINS`, `ISSUER_URL` | Replit Auth (OpenID Connect) |

To add a new secret: ask the user via the Replit secrets panel — never hard-code values or print them in logs.

---

## 6. Database

- **Engine**: PostgreSQL (Neon serverless, WebSocket transport).
- **ORM**: Drizzle. Schema is the single source of truth at `shared/schema.ts` (~107 tables).
- **Pool**: max 5 connections, 5 s idle timeout (`server/db.ts`). Neon idle disconnects appear as `57P01` and are non-fatal — the pool reconnects on next query.
- **Auto-migration on boot**: `server/index.ts` runs `drizzle-kit push --force` only when the DB has zero tables, or when adding **new** missing critical tables. It **never drops or alters existing data**.
- **Manual migrations**: `npm run db:push`. Treat this as destructive in production — review the diff first.
- **Sessions**: stored in PostgreSQL via `connect-pg-simple` so they persist across restarts.
- **Legacy DB**: `server/legacy-db.ts` connects read-only to a legacy database for the legacy customer products / cliché views.

### Schema conventions

For each table in `shared/schema.ts`:

```ts
export const products = pgTable('products', { … });

export const insertProductSchema = createInsertSchema(products).omit({
  id: true,
  created_at: true,
});
export type InsertProduct = z.infer<typeof insertProductSchema>;
export type Product = typeof products.$inferSelect;
```

- Numeric columns are typically `decimal/numeric` and **come back as strings**. Use the helpers in `shared/decimal-utils.ts` and `shared/number-utils.ts` rather than raw `parseFloat`.
- Array columns use `text().array()` (method on the column, not a wrapper).

---

## 7. Authentication & Authorization

Two authentication mechanisms exist in production:

1. **Browser sessions** — `express-session` with PostgreSQL store. Login via username/password (Passport local) or Replit OpenID Connect (`server/replitAuth.ts`).
2. **Mobile bearer tokens** — issued at login and verified per-request for the Expo app.

Both resolve a `req.user` that downstream middleware uses.

### RBAC

`shared/permissions.ts` defines the full permission catalogue (e.g. `manage_orders`, `manage_settings`, `manage_ai_agent`, `manage_hr`, `view_*`, `use_*`, …) and the role → permissions mapping.

In routes:

```ts
app.post(
  '/api/orders',
  requireAuth,
  requirePermission('manage_orders'),
  validateRequest({ body: insertNewOrderSchema }),
  async (req, res) => { … }
);
```

> **Critical rule**: every protected route **must** server-side enforce both `requireAuth` and the matching `requirePermission(...)`. The frontend hides pages, but that is not a security boundary — see `threat_model.md`.

### AI agent boundary

The AI agent can execute tools, including database queries. Each tool is independently authorized and dangerous SQL keywords are blocked at the tool layer:

- `DROP`, `DELETE`, `TRUNCATE`, `ALTER` are blocked in `execute_database_query`.
- Any new AI tool must add its own permission check. **Do not** rely on the chat session's auth to cover tool actions transitively.

---

## 8. Backend Conventions

### Routes (`server/routes.ts`)

- Routes are thin: parse → validate → call `storage.*` → format response.
- Validate inputs with Zod schemas from `shared/schema.ts` (or extensions thereof).
- Standard response shape:
  ```json
  { "data": <payload>, "message": "…", "success": true }
  ```
- Error responses: HTTP status + `{ message: '…', success: false }`. **Error messages for end users must be in Arabic.**
- Wrap multi-step write operations in the transaction helper from `server/middleware/transaction.ts` and use `pg_advisory_xact_lock(...)` when generating sequential numbers (orders, production orders, customers).
- Never log sensitive data (passwords, tokens, full request bodies that contain credentials).

### Storage layer (`server/storage.ts`)

- Single class implementing the `IStorage` interface. All CRUD goes through it.
- Methods return typed entities derived from `shared/schema.ts`.
- Centralised business invariants: stage transitions, completion-percentage math, weight calculations, etc.
- When you need a new query, prefer adding a method here over scattering raw `db.select()` calls in routes.

### Caching

In-memory module-scoped caches are used for hot, low-cardinality reads:

- `companyLogoCache` — 5 min TTL.
- `translateNameCache` — 24 h TTL, 1000-entry LRU cap, per-language case-insensitive key.

When invalidation is needed, clear the cache in the corresponding mutation route.

### Performance monitoring

`server/middleware/performance-monitor.ts` logs every slow request:

- ≥ 500 ms → ⚠️ WARNING
- ≥ 2000 ms → ⚠️ CRITICAL

Use these logs as the first signal when tuning endpoints.

### MCP server

`server/mcp-server.ts` exposes tools to external MCP clients over `/mcp` with OAuth 2.1 (`server/mcp-oauth.ts`). Treat MCP tools with the same care as AI-agent tools.

---

## 9. Frontend Conventions

### Routing

- `wouter` with `<Switch>` / `<Route>` in `client/src/App.tsx`.
- Pages are lazy-loaded via `lazyWithRetry` (handles chunk-load failures after deploys).
- Layout chrome (Header, Sidebar, MobileShell) is mounted by `PersistentChrome` and gated by `shouldShowChrome(location)` (`client/src/config/chromeRoutes.ts`) so login/setup screens render fullscreen.
- Navigation items live in `client/src/config/navigationConfig.ts`.
- Always use `<Link>` or `useLocation()` from wouter — never mutate `window.location` directly.

### Data fetching

- TanStack Query v5 only — object form: `useQuery({ queryKey: [...] })`.
- The default fetcher is configured globally in `client/src/lib/queryClient.ts` — queries do **not** define their own `queryFn`.
- Hierarchical keys are arrays: `['/api/orders', id]` (so invalidation by prefix works).
- After mutations, invalidate **every** affected key, e.g. `['/api/orders']`, `['/api/production-orders']`, `['/api/dashboard/stats']`. Look at `client/src/pages/orders.tsx` for the canonical example.
- Mutations call `apiRequest` from `@/lib/queryClient` (POST/PATCH/DELETE).

### Forms

- shadcn `useForm` + `Form` from `@/components/ui/form` (wraps `react-hook-form`).
- Validate with `zodResolver(insertSchema.extend({...}))`.
- Always pass `defaultValues` (forms are controlled).
- If a form silently fails to submit, log `form.formState.errors` — usually a hidden field is invalid.

### Styling & Theming

- Tailwind + shadcn. Custom design tokens in `client/src/index.css` using **HSL syntax** (`hsl(20 14.3% 4.1%)`).
- High-contrast variant: `client/src/index-high-contrast.css`.
- Print stylesheet: `client/src/print.css`.
- Dark mode is class-based (`darkMode: ['class']` in `tailwind.config.ts`); the toggle lives in `ThemeContext`.
- Icons: `lucide-react` for actions/UI, `react-icons/si` for brand logos.

### Internationalisation (RTL-first)

- `react-i18next` with `client/src/i18n/locales/ar.json` (primary) and `en.json`.
- The HTML `dir` is switched by `LanguageContext`. Tailwind `rtl:`/`ltr:` variants are used for direction-sensitive layout.
- **End-user-facing strings must have Arabic translations.** Server-emitted error messages must already be in Arabic.
- Number formatting follows project preferences: 2 decimals for weight, 1–2 for percentages.

### Attached assets

User-supplied images in `attached_assets/` are imported via the `@assets/...` alias:

```ts
import logo from '@assets/MPBF11_1769101097739.png';
```

### PWA

- Service worker + manifest in `public/`.
- `<InstallPrompt />` (`client/src/components/pwa/`) handles the install banner.
- Offline support is more aggressive on the Expo app (attendance and action queue) than the web PWA.

---

## 10. Mobile App

A separate Expo (React Native) app consumes the same backend via the **mobile bearer-token** auth path.

- API contract: `attached_assets/MOBILE_APP_API_CONTRACT.md` — **do not change field names, types, or remove fields without updating this file**. The Expo client is built and signed against it.
- Reference implementation overview: `MOBILE_APP_REFERENCE.md`.
- The mobile app implements offline-first attendance sync and an action queue, so endpoints it consumes must remain idempotent where reasonable.

---

## 11. AI Agent

The AI agent (`server/ai-agent-routes.ts`) acts as a digital executive assistant. It can:

- Chat with the user (Arabic-aware system prompt).
- Maintain a persistent knowledge base (`ai_agent_knowledge`) and feature instructions (`ai_agent_feature_instructions`).
- Execute typed **tools** — querying the database (read-only enforcement), generating PDFs/Excel, sending notifications, etc.
- Be configured via the Settings page (`ai-agent-settings.tsx`).

When you add a new tool:

1. Define its Zod schema (input + output).
2. Add an explicit permission check (do **not** assume the user’s session covers it).
3. Sanitise / parameterise any DB access.
4. Block dangerous SQL verbs as already done in `execute_database_query`.

---

## 12. Notifications & Messaging

| Channel | Service | File |
|---|---|---|
| WhatsApp (preferred) | Meta Cloud API | `server/services/meta-whatsapp.ts` |
| WhatsApp (alt) | Twilio | service module + `twilio-content-template.tsx` |
| SMS (KSA) | Taqnyat | `server/services/taqnyat-sms.ts` |
| Email | SendGrid | `@sendgrid/mail` |
| In-app | Notification manager | `server/services/notification-manager.ts` |

Templates and webhooks for WhatsApp have dedicated setup pages (`whatsapp-*.tsx`).

---

## 13. PDF, Excel, Documents

- **Quote PDFs**: `server/pdf-generator.ts` + `server/adobe-pdf-service.ts`. Arabic shaping via `arabic-reshaper` and `bidi-js`. Fonts in `server/fonts/`.
- **Excel exports**: `exceljs` (helpers `addJsonSheet` / `parseExcelBuffer` at the top of `server/routes.ts`).
- **Word docs**: `docx` package.
- Generated outputs land under `exports/` or in object storage.

> Public download links for sensitive documents must use unguessable tokens or require authentication. Sequential IDs and document numbers are **not** access controls (see threat model).

---

## 14. Object Storage

- Backend: Google Cloud Storage via Replit's object-storage integration (`server/replit_integrations/`).
- Two zones: `public/` (assets served unrestricted) and `.private/` (per-user uploads).
- Frontend uploads go through Uppy → AWS S3 multipart endpoint exposed by the server.
- Large generated PDFs are stored privately and served via short-lived signed URLs.

---

## 15. Operational Notes & Gotchas

- **Forbidden edits**: `vite.config.ts`, `server/vite.ts`, `drizzle.config.ts`, `package.json`. To add a dependency, use the package management tool — do not edit `package.json` by hand.
- **Mobile API contract**: any change to a field name/type or removal **must** be reflected in `attached_assets/MOBILE_APP_API_CONTRACT.md` first.
- **AI SQL safety**: `DROP`, `DELETE`, `TRUNCATE`, `ALTER` are blocked in `execute_database_query`. Don't loosen this without a security review.
- **Auto-migration**: on startup, `drizzle-kit push --force` runs for empty databases or to add missing critical tables. **Never drops existing data**, but be mindful when introducing schema changes.
- **Order numbering**: order / production-order numbers are generated under a Postgres advisory lock. If you add a new entity with sequential numbers, follow the same pattern in `storage.ts`.
- **Decimal columns**: come back as strings from PostgreSQL. Convert deliberately — don't assume `Number(...)` will preserve precision for weight/price math.
- **57P01 errors**: Neon idle disconnects. The pool reconnects on next query. Don't treat them as bugs.
- **Long routes file**: `server/routes.ts` is huge by design (single registration function). When adding new groups, consider splitting into `server/routes/<area>.ts` and re-exporting.

---

## 16. Logging, Monitoring, Health

- **Performance**: `server/middleware/performance-monitor.ts` (warning thresholds 500 ms / 2000 ms).
- **Memory**: `server/middleware/memory-monitor.ts` snapshot every 30 s.
- **DB**: `server/middleware/database-monitor.ts` tracks pool/query metrics.
- **Health endpoints**: surfaced in the SystemHealth page (`client/src/pages/SystemHealth.tsx`).
- **Code health**: `server/services/code-health-checker.ts` periodically inspects route handlers.
- **Error learning**: `server/services/error-learning-enhancer.ts` accumulates patterns to surface in the AI agent.

---

## 17. Security (read `threat_model.md` in full)

Quick checklist when adding a route:

1. `requireAuth` present?
2. `requirePermission(...)` matches the action?
3. Inputs validated with Zod?
4. Any IDs from the URL re-checked against the caller's scope?
5. Public links use random tokens, not sequential IDs?
6. Rate limit on auth-adjacent endpoints (login, password reset, public webhooks)?
7. External calls (OpenAI, WhatsApp, GCS) have timeouts and bounded payloads?
8. No secrets in logs or in client-bundled code?

---

## 18. Testing & Quality

- TypeScript strict-ish — keep `npm run check` green before merging.
- ESLint `--max-warnings=0` — no warnings allowed.
- Manual testing is the norm; automated test runner is currently disabled in this environment.
- When you change a flow that has heavy business invariants (orders, rolls, stage transitions, completion %), exercise it manually end-to-end on the affected page **and** on the corresponding API directly.

---

## 19. Where to Start (New Developer Checklist)

1. Read `replit.md` (project root — project overview + user preferences).
2. Read this file end to end.
3. Read `threat_model.md`.
4. Skim `shared/schema.ts` to learn the data model.
5. Skim `shared/permissions.ts` to learn the role model.
6. Open `client/src/App.tsx` and trace one page (e.g. `orders.tsx`) from route → query → mutation → backend route → storage method → DB.
7. Boot the app (`npm run dev`) and log in. Inspect the network tab; every API call should be one of `/api/...`.
8. Before changing the mobile-facing API, open `attached_assets/MOBILE_APP_API_CONTRACT.md`.
9. When in doubt, look for an existing pattern in `server/routes.ts` or `client/src/pages/` and follow it.

---

## 20. Useful References

- TanStack Query: <https://tanstack.com/query/latest>
- Drizzle ORM: <https://orm.drizzle.team/>
- Zod: <https://zod.dev/>
- shadcn/ui: <https://ui.shadcn.com/>
- Recharts: <https://recharts.org/en-US/>
- three.js: <https://threejs.org/>
- i18next: <https://www.i18next.com/>
- Neon serverless driver: <https://neon.tech/docs/serverless/serverless-driver>
- Meta WhatsApp Cloud API: <https://developers.facebook.com/docs/whatsapp/cloud-api>
- Model Context Protocol: <https://modelcontextprotocol.io/>
