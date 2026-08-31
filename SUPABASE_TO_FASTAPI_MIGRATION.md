# Migration Plan: Direct Supabase Client → FastAPI Backend

**Goal:** The React admin panel currently talks to Supabase directly from the
browser (`@supabase/supabase-js`, anon key shipped in the frontend bundle).
After this migration, the frontend talks **only** to your FastAPI backend.
FastAPI becomes the sole owner of the Supabase connection (auth + database),
using a service-role key that never reaches the browser.

---

## 1. Why this matters (current exposure)

- `VITE_SUPABASE_ANON_KEY` is embedded in every JS bundle shipped to the
  browser (`.env.local`, read via `import.meta.env` in `src/supabaseClient.ts:3-4`).
  Anyone can extract it from devtools/network tab.
- Every write today (suspend user, change subscription, blast notifications,
  edit system config, mutate workouts) relies entirely on **Postgres Row Level
  Security (RLS)** policies to stop a non-admin from calling these same
  Supabase endpoints directly with their own session token. If any RLS policy
  is missing or misconfigured, it's a direct data breach — there is no
  server-side gate today besides `useAdminAuth.ts:35`'s client-side
  `isAdmin` check, which is cosmetic (UI-only), not a security boundary.
- Moving to FastAPI means: FastAPI holds the Supabase **service role key**
  (server-side only, bypasses RLS entirely), and FastAPI itself becomes the
  authorization boundary — it decides whether the caller is allowed to do
  the thing, in application code, before touching Postgres.

---

## 2. Current state audit — every Supabase touchpoint

| File | Supabase calls | What it does |
|---|---|---|
| `src/supabaseClient.ts` | `createClient(url, anonKey)` | Client init, imported everywhere else |
| `src/components/Login.tsx:22,24` | `auth.signOut()`, `auth.signInWithPassword()` | Admin login |
| `src/hooks/useAdminAuth.ts:12,18,27` | `auth.getSession()`, `auth.onAuthStateChange()` | Session state + `isAdmin` flag from `app_metadata.role` / `user_metadata.is_admin` |
| `src/adminService.ts:10` `getAdminMetrics` | `profiles` count, `performed_workouts` count | Dashboard KPIs |
| `src/adminService.ts:35` `getUsers` | `profiles` select w/ range+order | Paginated user table |
| `src/adminService.ts:63` `updateUserSubscription` | `profiles` update | Change free/premium |
| `src/adminService.ts:72` `toggleSuspendUser` | RPC `toggle_user_suspension`, fallback `profiles` update | Ban/unban user |
| `src/adminService.ts:87` `updateSystemConfig` | `global_flags` upsert | Feature flags / config |
| `src/adminService.ts:95` `sendNotificationBlast` | `notification_blasts` insert | Push/notification blast |
| `src/adminService.ts:103` `getNotificationBlasts` | `notification_blasts` select | Blast history |
| `src/adminService.ts:113` `getUserWorkouts` | `performed_workouts` select w/ nested joins | Per-user workout drilldown |
| `src/adminService.ts:149` `deleteWorkout` | `performed_workouts` delete | — |
| `src/adminService.ts:158` `updateWorkout` | `performed_workouts` update | — |
| `src/adminService.ts:167` `deleteWorkoutSet` | `performed_sets` delete | — |
| `src/adminService.ts:179` `uploadProgramMigration` | Multi-table insert/upsert: `exercises`, `exercise_substitutions`, `programs`, `program_weeks`, `program_sessions`, `program_prescriptions` | Bulk program JSON import (used by `ProgramUploader.tsx`) |
| `src/components/seedProgram.ts` | Standalone Node script, own `createClient` | One-off CLI seeding tool — **not part of the shipped app**, decide separately whether to keep as a local admin script (fine, it's server-side already) or fold into a FastAPI CLI command |

Every one of these must get a FastAPI endpoint except `seedProgram.ts`, which
already runs server-side and isn't a security concern.

---

## 3. Target architecture

```
Browser (React/Vite)
   │  fetch()/axios, Authorization: Bearer <token>, NO supabase-js, NO anon key
   ▼
FastAPI backend
   │  supabase-py or SQLAlchemy/asyncpg, SUPABASE_SERVICE_ROLE_KEY (secret, server env only)
   ▼
Supabase (Postgres + Auth)
```

The browser never imports `@supabase/supabase-js` again. `src/supabaseClient.ts`
gets deleted. `VITE_SUPABASE_URL` / `VITE_SUPABASE_ANON_KEY` are removed from
frontend env entirely.

---

## 4. Key decision: what happens to Supabase Auth?

You have two options. **Recommend Option A** — it's the smaller, safer lift.

### Option A (recommended): Keep Supabase Auth, proxy it through FastAPI
- `POST /auth/login` on FastAPI receives `{email, password}`, calls Supabase's
  Auth REST API (`POST {SUPABASE_URL}/auth/v1/token?grant_type=password`)
  server-side using the anon key (yes, the anon key still exists, but now it
  lives only in FastAPI's env, never in the browser).
- Supabase returns an `access_token` (JWT) + `refresh_token`. FastAPI passes
  these back to the frontend (JSON body, or set as httpOnly cookies — cookies
  are the better choice, see §8).
- On every subsequent request, FastAPI verifies the Supabase JWT itself
  (HS256, verify against `SUPABASE_JWT_SECRET` from Supabase project settings
  → API → JWT Settings) instead of trusting the client. Decode `app_metadata.role`
  from the verified token to re-implement the `isAdmin` check **server-side**,
  as a FastAPI dependency (`require_admin`), not just client-side like today.
- You keep Supabase's user management, email confirmation, password reset
  flows for free.

### Option B: Full custom auth (bigger lift, do later if ever)
- Own `users` table, `passlib`/`bcrypt` hashing, FastAPI-issued JWTs, your own
  password-reset email flow. Only worth it if you want to fully decouple from
  Supabase Auth long-term. Not required to satisfy "frontend never talks to
  Supabase directly" — Option A already achieves that.

This doc assumes **Option A** going forward. If you want Option B, say so and
this plan's auth section changes; the data-endpoint section (§6) is identical
either way.

---

## 5. Backend project setup

```
backend/
├── app/
│   ├── main.py                # FastAPI() app, CORS, router includes
│   ├── config.py              # pydantic-settings: env vars
│   ├── deps.py                # get_current_user, require_admin dependencies
│   ├── supabase_client.py     # service-role client, server-side only
│   ├── auth/
│   │   ├── router.py          # /auth/login, /auth/logout, /auth/refresh
│   │   └── jwt.py             # verify Supabase JWT
│   ├── admin/
│   │   ├── router.py          # /admin/* endpoints (mirrors adminService.ts 1:1)
│   │   └── schemas.py         # Pydantic models
│   └── programs/
│       ├── router.py          # /admin/programs/upload
│       └── service.py         # port of uploadProgramMigration logic
├── requirements.txt
└── .env                       # SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, SUPABASE_JWT_SECRET, SUPABASE_ANON_KEY, ALLOWED_ORIGINS
```

`requirements.txt` essentials:
```
fastapi
uvicorn[standard]
pydantic-settings
supabase           # supabase-py, for service-role DB/auth calls
python-jose[cryptography]   # verify Supabase JWTs
httpx               # if proxying auth REST calls manually instead of supabase-py
```

### `app/supabase_client.py`
```python
from supabase import create_client
from app.config import settings

supabase_admin = create_client(
    settings.SUPABASE_URL,
    settings.SUPABASE_SERVICE_ROLE_KEY,  # bypasses RLS — server only, never log this
)
```

### `app/deps.py` — the server-side authorization boundary
```python
from fastapi import Depends, HTTPException, Header
from jose import jwt, JWTError
from app.config import settings

def get_current_claims(authorization: str = Header(...)) -> dict:
    token = authorization.removeprefix("Bearer ").strip()
    try:
        return jwt.decode(
            token, settings.SUPABASE_JWT_SECRET,
            algorithms=["HS256"], audience="authenticated",
        )
    except JWTError:
        raise HTTPException(401, "Invalid or expired token")

def require_admin(claims: dict = Depends(get_current_claims)) -> dict:
    app_meta = claims.get("app_metadata", {})
    user_meta = claims.get("user_metadata", {})
    if app_meta.get("role") != "admin" and user_meta.get("is_admin") is not True:
        raise HTTPException(403, "Admin privileges required")
    return claims
```
Every `/admin/*` route depends on `require_admin`. This is the check that
today only exists client-side in `useAdminAuth.ts:35` — moving it here is the
actual security fix this migration buys you, not just an architecture change.

### `app/auth/router.py`
```python
import httpx
from fastapi import APIRouter, HTTPException
from app.config import settings

router = APIRouter(prefix="/auth", tags=["auth"])

@router.post("/login")
async def login(payload: LoginRequest):
    async with httpx.AsyncClient() as client:
        r = await client.post(
            f"{settings.SUPABASE_URL}/auth/v1/token?grant_type=password",
            headers={"apikey": settings.SUPABASE_ANON_KEY},
            json={"email": payload.email, "password": payload.password},
        )
    if r.status_code != 200:
        raise HTTPException(401, "Invalid login credentials")
    data = r.json()
    # Recommended: set httpOnly, Secure, SameSite=Lax cookies here instead of
    # returning tokens in the JSON body — see §8.
    return {"access_token": data["access_token"], "refresh_token": data["refresh_token"]}
```

---

## 6. Endpoint map — 1:1 replacement for `adminService.ts`

| Old (frontend → Supabase) | New (frontend → FastAPI) | Backend notes |
|---|---|---|
| `auth.signInWithPassword` | `POST /auth/login` | See §5 |
| `auth.signOut` | `POST /auth/logout` | Clear cookie server-side; optionally call Supabase logout too |
| `auth.getSession` / `onAuthStateChange` | `GET /auth/me` | Decode+return claims from cookie/header token; frontend polls this once on mount instead of subscribing to Supabase's client-side listener |
| `getAdminMetrics()` | `GET /admin/metrics` | Two counts + a ratio, straight port |
| `getUsers(page, pageSize)` | `GET /admin/users?page=&pageSize=` | Same range/order logic |
| `updateUserSubscription(userId, tier)` | `PATCH /admin/users/{userId}/subscription` | Body: `{tier}` |
| `toggleSuspendUser(userId, status)` | `POST /admin/users/{userId}/toggle-suspend` | Keep the RPC call server-side (`supabase_admin.rpc(...)`), same fallback logic |
| `updateSystemConfig(key, value)` | `PUT /admin/config/{key}` | Body: `{value}` |
| `sendNotificationBlast(title, body, tier)` | `POST /admin/notifications` | |
| `getNotificationBlasts()` | `GET /admin/notifications` | |
| `getUserWorkouts(userId)` | `GET /admin/users/{userId}/workouts` | Port the nested-select + sort-by-set_number logic verbatim |
| `deleteWorkout(workoutId)` | `DELETE /admin/workouts/{workoutId}` | |
| `updateWorkout(workoutId, updates)` | `PATCH /admin/workouts/{workoutId}` | |
| `deleteWorkoutSet(setId)` | `DELETE /admin/workout-sets/{setId}` | |
| `uploadProgramMigration(programData, onProgress)` | `POST /admin/programs/upload` | See §6.1 — the `onProgress` callback pattern doesn't translate directly to a single request/response |

### 6.1 `uploadProgramMigration` needs special handling

The current function (`adminService.ts:179-321`) streams progress messages
back to the UI via a callback (`onProgress`) while it does ~6 sequential
Supabase writes. A single FastAPI request/response can't stream incremental
text the same way without extra plumbing. Two options:

- **Simplest:** make the endpoint synchronous — frontend shows an
  indeterminate spinner instead of the step-by-step progress text, backend
  does all 6 steps in one request and returns success/failure at the end.
  Recommended unless the progress UI is something users specifically rely on.
- **If you want to keep live progress:** use a FastAPI `StreamingResponse`
  (newline-delimited JSON) or a WebSocket, and rewrite the frontend's
  `onProgress` handler to read from that stream instead. More work — only do
  this if the step-by-step feedback in `ProgramUploader.tsx` is a hard
  requirement.

Either way, port the exercise-dedup / substitution-junction / weeks/sessions/
prescriptions insert logic (`adminService.ts:181-315`) into
`app/programs/service.py` essentially unchanged, just swapping
`supabase.from(...)` (browser client) for `supabase_admin.table(...)`
(service-role client) or raw SQL via SQLAlchemy if you'd rather have
transactional guarantees (the current code has **no transaction** — a failure
partway through step 4 leaves orphaned `programs`/`program_weeks` rows; this
is a good opportunity to wrap the whole thing in a single DB transaction on
the backend, which the Supabase JS client couldn't easily give you anyway).

---

## 7. Frontend changes

### 7.1 New `src/apiClient.ts` (replaces `supabaseClient.ts`)
```ts
const API_BASE = import.meta.env.VITE_API_BASE_URL;

async function apiFetch(path: string, options: RequestInit = {}) {
  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    credentials: 'include', // send httpOnly auth cookie
    headers: { 'Content-Type': 'application/json', ...options.headers },
  });
  if (!res.ok) throw new Error((await res.json().catch(() => ({}))).detail || res.statusText);
  return res.status === 204 ? null : res.json();
}

export const api = {
  get: (path: string) => apiFetch(path),
  post: (path: string, body?: unknown) => apiFetch(path, { method: 'POST', body: JSON.stringify(body) }),
  patch: (path: string, body?: unknown) => apiFetch(path, { method: 'PATCH', body: JSON.stringify(body) }),
  put: (path: string, body?: unknown) => apiFetch(path, { method: 'PUT', body: JSON.stringify(body) }),
  delete: (path: string) => apiFetch(path, { method: 'DELETE' }),
};
```

### 7.2 Rewrite `src/adminService.ts`
Every function's body becomes a one-line `api.*` call instead of a
`supabase.from(...)` chain, e.g.:
```ts
export async function getUsers(page = 0, pageSize = 20) {
  return api.get(`/admin/users?page=${page}&pageSize=${pageSize}`);
}
export async function toggleSuspendUser(userId: string, currentStatus: string) {
  return api.post(`/admin/users/${userId}/toggle-suspend`, { currentStatus });
}
```
Function signatures stay identical, so `AdminDashboard.tsx`'s imports
(`AdminDashboard.tsx:35`) and every call site **don't need to change at all**
— this is the payoff of the existing `adminService.ts` abstraction layer
already being in place.

### 7.3 Rewrite `src/hooks/useAdminAuth.ts`
```ts
export function useAdminAuth() {
  const [user, setUser] = useState<{ email: string; isAdmin: boolean } | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    api.get('/auth/me')
      .then(setUser)
      .catch(() => setUser(null))
      .finally(() => setIsLoading(false));
  }, []);

  return { user, isAdmin: user?.isAdmin ?? false, isLoading };
}
```

### 7.4 Rewrite `src/components/Login.tsx`
Replace `supabase.auth.signOut()` + `supabase.auth.signInWithPassword()`
(`Login.tsx:22-27`) with:
```ts
await api.post('/auth/login', { email, password });
```
Error handling stays the same shape (`error.message` → `err.message`).

### 7.5 Env vars
- **Remove** from frontend `.env.local` / Vercel env: `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`
- **Add** to frontend: `VITE_API_BASE_URL=https://your-fastapi-host.com`
- **Add** to FastAPI backend `.env` (never committed, never in frontend):
  `SUPABASE_URL`, `SUPABASE_ANON_KEY` (used only for the login proxy),
  `SUPABASE_SERVICE_ROLE_KEY`, `SUPABASE_JWT_SECRET`, `ALLOWED_ORIGINS`

### 7.6 Cleanup
- `npm uninstall @supabase/supabase-js` from the frontend once nothing imports it.
- Delete `src/supabaseClient.ts`.

---

## 8. Cookies vs bearer tokens (pick one, affects §5 and §7.1)

- **httpOnly cookie (recommended):** FastAPI's `/auth/login` sets
  `Set-Cookie: access_token=...; HttpOnly; Secure; SameSite=Lax`. Frontend
  never touches the token (can't be stolen via XSS). `apiFetch` just needs
  `credentials: 'include'`. Requires FastAPI CORS to allow credentials and
  the frontend origin explicitly (not `*`).
- **Bearer token in JS memory/localStorage:** simpler to wire up, but
  vulnerable to XSS token theft and you're back to manually attaching
  `Authorization` headers everywhere. Not recommended for an admin panel.

---

## 9. CORS on FastAPI
```python
from fastapi.middleware.cors import CORSMiddleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["https://your-vercel-domain.vercel.app", "http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

---

## 10. Rollout plan (do this incrementally, not as one big-bang PR)

1. Stand up FastAPI backend with `/auth/*` + `/admin/metrics` and
   `/admin/users` only. Deploy it somewhere reachable (Railway/Render/Fly/your
   own VPS — pick based on where you're already hosting things).
2. Add `require_admin` dependency and confirm a non-admin Supabase user
   genuinely gets a 403 — this is the actual security win, verify it works
   before trusting it.
3. Migrate the frontend's `Login.tsx` + `useAdminAuth.ts` to hit FastAPI.
   Keep every other `adminService.ts` function on Supabase for now (frontend
   is temporarily hybrid — that's fine, ship it).
4. Port remaining `adminService.ts` functions one at a time, each as its own
   small PR: metrics → users list → subscription/suspend → config →
   notifications → workouts CRUD → program upload (the biggest, do it last).
5. Once every `adminService.ts` function calls FastAPI, delete
   `src/supabaseClient.ts`, remove `@supabase/supabase-js` from
   `package.json`, remove `VITE_SUPABASE_*` env vars from Vercel.
6. Rotate the Supabase anon key after confirming nothing in the frontend
   bundle references it anymore (old deployed bundles/CDN caches may still
   have it embedded — treat the old anon key as compromised once you remove
   it from source, and rotate in Supabase dashboard → Settings → API).

---

## 11. Testing checklist per migrated endpoint
- [ ] Logged-in admin can call it and gets correct data
- [ ] Logged-in non-admin gets 403
- [ ] No auth / expired token gets 401
- [ ] Response shape matches what the existing React component expects (no
      frontend changes needed beyond `adminService.ts` internals)
- [ ] For writes: verify the row actually changed in Supabase table editor

---

## 12. Rollback
Since `adminService.ts` function signatures don't change (§7.2), rollback
per-function is just reverting that one function's body back to its Supabase
call — keep the git history granular (small PRs per §10) specifically so this
is cheap.
