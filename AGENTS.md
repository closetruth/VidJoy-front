# AGENTS.md

This file provides guidance to Codex (Codex.ai/code) when working with code in this repository.

## Project Overview

VidJoy is a video-sharing platform with two separate Vite + Vue 3 front-end projects in this repo:

| Project | Directory | Dev Port | Backend Proxy | Description |
|---------|-----------|----------|---------------|-------------|
| Main web app | `./web` | 3000 | `http://localhost:7071` | User-facing video platform |
| Admin panel | `./admin` | 3001 | `http://localhost:7070` | Admin management backend |

Both projects share the same tech stack: Vue 3 (Composition API / `<script setup>`), Vite 6, Pinia, Vue Router 4, Axios, SCSS. They have separate `node_modules` and must be built independently.

The repo root `package.json` is an orchestrator only (no dependencies). Use root scripts to start either app.

## Commands

### From repo root

```bash
npm run dev:web       # Start web app on port 3000
npm run build:web     # Production build to web/dist/
npm run preview:web   # Preview web production build
npm run dev:admin     # Start admin on port 3001
npm run build:admin   # Production build to admin/dist/
npm run preview:admin # Preview admin production build
npm run dev           # Alias for dev:web
npm run build         # Alias for build:web
```

### Main web app (`web/`)

```bash
npm run dev --prefix web
npm run build --prefix web
npm run preview --prefix web
# or: cd web && npm run dev
```

### Admin panel (`admin/`)

```bash
npm run dev --prefix admin
npm run build --prefix admin
# or: cd admin && npm run dev
```

## Architecture

### Path alias

`@` maps to `./src` in both projects (configured in each project's `vite.config.js`). Always use `@/` imports.

### API layer

**Request client** (`web/src/utils/request.js` / `admin/src/utils/request.js`):
- Axios instance with `baseURL: '/api'` (main) or `'/api/admin'` (admin), `withCredentials: true` for cookie auth, 30s timeout
- Response interceptor normalizes three possible success patterns: `res.code === 200`, `res.code === 0`, or `res.status === 'success'`
- Admin interceptor additionally handles auth errors (code 901/403, or 401 HTTP status) by clearing admin info and redirecting to login

**API modules** (`web/src/api/index.js` / `admin/src/api/index.js`):
- All calls go through the request instance above; no raw axios calls
- Main app APIs: `account`, `category`, `video`, `comment`, `danmu`, `userAction`, `history`, `message`, `uhome` (user profile pages), `ucenter` (creator center), `sys` (system settings)
- Admin APIs: `account`, `category`, `video` (videoInfo endpoints), `index` (dashboard stats), `setting`, `interact` (danmu + comments), `user`, `file`

### Auth flow

**Main app**: Cookie-based auto-login. On app startup (`web/src/main.js`), `userStore.ensureAuth()` calls `/account/autoLogin` using the session cookie. If it succeeds, user info is stored in both Pinia state and localStorage. Router guards check `requiresAuth` meta and redirect unauthenticated users to `/?login=1&redirect=...`.

**Admin**: Simpler localStorage-based auth. On login, admin info is saved to `localStorage 'adminInfo'`. The router guard checks for its existence via `isAdminLoggedIn()`. No auto-login — if the cookie expires, the next API call triggers a redirect to `/admin/login`.

### State management (Pinia)

**Main app stores** (`web/src/stores/index.js`):
- `useUserStore`: user info, login state, auto-login with dedup (`authPromise` prevents concurrent auth calls), unread message count
- `useCategoryStore`: cached category list with `loaded` flag to avoid re-fetching

**Admin store** (`admin/src/stores/index.js`):
- `useAdminStore`: admin info from localStorage, login/logout

### Route structure

**Main app**: Lazy-loaded routes. `/account/*` routes share an `AccountLayout` wrapper and require auth. `/video/:videoId`, `/search`, `/user/:userId`, `/upload` are top-level. `/history` and `/message` redirect to their `/account/*` equivalents (legacy path compatibility).

**Admin**: All routes under `/admin/*` with `AdminLayout` wrapper, all require auth except `/admin/login`. Top-level short paths (`/dashboard`, `/category`, etc.) redirect to the full `/admin/*` path. Catch-all redirects to `/admin/dashboard`.

### Video playback

`VideoPlayer.vue` uses `hls.js` to play HLS/m3u8 streams. It auto-detects whether the source URL requires HLS (`src.includes('.m3u8') || src.includes('videoResource')`). The player also renders a danmu (bullet comment) overlay that syncs with `currentTime` — danmu items are matched to the video timestamp within 0.5s tolerance.

### Resource URLs

Images and files returned by the API are stored as `sourceName` strings. Always use `getResourceUrl(sourceName)` from `@/utils/format.js` to resolve them — it prepends `/api/file/getResource?sourceName=` for relative paths and passes through full URLs as-is.

### API response shapes

The backend wraps responses in one of these formats:
- `{ code: 200, data: ... }` — standard success
- `{ code: 0, data: ... }` — alternative success convention
- `{ status: "success", ... }` / `{ info: "success", ... }` — string-based success

The auth module (`normalizeUserInfo`) is designed to handle multiple field name conventions (e.g., `userId` / `user_id` / `id`, `nickName` / `nick_name` / `nickname`) because the backend may return either camelCase or snake_case.

### Styling conventions

CSS custom properties are defined in `web/src/styles/global.scss` with `--bili-*` prefix (e.g., `--bili-pink: #fb7299`, `--bili-text`, `--bili-bg`). Common utility classes: `.container` (max-width 1400px centered), `.btn-primary`, `.btn-outline`, `.loading-spinner`. The design follows Bilibili's pink-themed visual style.
