# MPBF Mobile (Expo)

Native iOS / Android client for the MPBF plastic-bag-factory MRP system. Mirrors the
core capabilities of the web app while providing a mobile-native UX (touch-optimized
lists, RTL Arabic by default, secure on-device token storage, pull-to-refresh, dark mode).

## Stack

- **Expo SDK 52** + **Expo Router 4** (file-based routing)
- **React Native 0.76** with the new architecture enabled
- **TypeScript** (strict)
- **TanStack Query v5** for server-state caching and refetching
- **axios** with interceptors for bearer-token auth + silent refresh
- **expo-secure-store** for on-device token persistence (iOS Keychain / Android Keystore)
- **i18next** + **expo-localization** for Arabic (default) / English
- **@expo/vector-icons** (Ionicons)

## Monorepo layout

```
apps/mobile/      this Expo app
packages/shared/  cross-platform types, endpoints, status labels, permission helpers
```

`metro.config.js` watches the workspace root and resolves the `@mpbf/shared` workspace
package directly from source — no build step required.

## Setup

```bash
cd apps/mobile
cp .env.example .env        # then set EXPO_PUBLIC_API_BASE_URL
npm install                 # installs only the mobile deps inside apps/mobile
npx expo start              # opens the Metro dev server
```

> **Local dev tip:** `localhost` from a phone won't reach your dev machine. Replace
> `EXPO_PUBLIC_API_BASE_URL` with your machine's LAN IP (e.g. `http://192.168.1.10:5000`)
> or use the production URL.

## Architecture

### Auth (Bearer token, mobile-only endpoints)

- `src/auth/storage.ts` — secure persistence for `token`, `refresh_token`, `user`.
- `src/auth/AuthContext.tsx` — exposes `login`, `logout`, `refreshUser`,
  `isAuthenticated`. Calls `POST /api/mobile/login`, `POST /api/mobile/logout`.
- `src/api/client.ts` — Axios instance attaches `Authorization: Bearer <token>` on
  every request and, on a `401`, transparently calls `POST /api/mobile/refresh-token`
  and retries. Refresh requests are de-duplicated via a singleton in-flight promise.

### API hooks

`src/api/hooks/*` provides typed React-Query hooks for the screens we need now:

| Hook                    | Endpoint                                |
|-------------------------|-----------------------------------------|
| `useDashboard`          | `/api/mobile/dashboard`                 |
| `useDashboardStats`     | `/api/dashboard/stats`                  |
| `useOrders`             | `/api/orders`                           |
| `useMyOrders`           | `/api/my-orders`                        |
| `useOrder(id)`          | `/api/orders/:id`                       |
| `useProductionOrders`   | `/api/production-orders`                |
| `useRolls`              | `/api/rolls?stage=…`                    |
| `useUpdateRoll`         | `PATCH /api/rolls/:id`                  |
| `useMarkPrinted`        | `POST /api/rolls/:id/mark-printed`      |
| `useInventory`          | `/api/inventory`                        |
| `useNotifications`      | `/api/notifications/user`               |
| `useDeleteNotification` | `DELETE /api/notifications/delete/:id`  |
| `useMaintenanceRequests`| `/api/maintenance-requests`             |
| `useQualityIssues`      | `/api/quality-issues`                   |

Each hook normalizes the backend's various response shapes
(`[]` vs `{ data: [] }` vs `{ success, data }`) so screens never have to.

### Routing (Expo Router file-tree)

```
app/
  _layout.tsx             root providers (Auth, QueryClient, i18n, theme, RTL)
  index.tsx               redirect: → /(app)/home or /(auth)/login
  (auth)/
    _layout.tsx
    login.tsx             username + password → /api/mobile/login
  (app)/
    _layout.tsx           bottom tabs + auth guard
    home.tsx              KPI tiles + quick actions + recent notifications
    notifications.tsx     pull-to-refresh notifications list
    profile.tsx           user profile + logout
    orders/
      _layout.tsx
      index.tsx           filtered/searchable list of all orders
      [id].tsx            order detail
      my-orders.tsx       user-scoped orders
    production/
      _layout.tsx
      index.tsx           production-orders list + roll shortcut
      rolls.tsx           rolls list filtered by stage (film/printing/cutting)
      roll-update.tsx     update weight/waste/cut + mark-as-printed
    warehouse/
      _layout.tsx
      index.tsx           inventory lookup with low-stock badge
    hr/                   scaffolded (uses ScaffoldScreen)
    maintenance/          maintenance requests list
    quality/              quality issues list
    more/
      _layout.tsx
      index.tsx           menu: profile / hr / maintenance / quality / reports / settings
      reports.tsx         scaffolded
      settings.tsx        scaffolded
```

### Theme

- Light / dark are derived from the OS via `useColorScheme()`.
- All component styles consume `useTheme().colors` instead of hard-coded values.
- RTL is forced on first launch via `I18nManager.forceRTL(true)` so the Arabic UI
  flows correctly.

### Components

- `Button`, `Input`, `Card`, `Badge`, `StatTile`, `EmptyState`, `Loader`
- `Screen` wraps `SafeAreaView` + `ScrollView` with optional pull-to-refresh
- `ScaffoldScreen` is a consistent placeholder for screens that are wired into
  navigation but whose detail UI is scheduled for a later round (HR, Reports,
  Settings). They keep the same headers, theming, and back-button behavior so
  end-users get a predictable shell while the rest is built out.

## Backend assumptions

This client expects the existing backend to be reachable at
`EXPO_PUBLIC_API_BASE_URL` and does not modify any web-app code (`client/`,
`server/`, `shared/`). It uses only documented mobile endpoints and the
already-existing JSON APIs the web app consumes.

## What's intentionally NOT in this round

- Push notifications / device-token registration (endpoint exists, UI hookup pending)
- Offline action queue (`/api/mobile/sync/actions`) — the storage and endpoints
  are ready, the UI plumbing comes next
- Camera/photo upload (`/api/mobile/upload/image`)
- Full HR attendance / leave UI
- Reports & settings detail screens

These are scaffolded so the route exists, the back button works, and the next
implementation round can drop in real UI without touching navigation.
