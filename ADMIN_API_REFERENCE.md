# Admin panel — full endpoint reference

Cross-check doc, generated from the actual code (`app/routers/admin.py`,
`app/routers/auth.py`, `app/services/admin_service.py`,
`app/schemas/admin.py`) as of this pass. Supersedes
`ADMIN_PANEL_JSON_CHANGES.md` Part B for anything marked built there — that
doc was written before most of this existed and is now stale.

## Auth

All `/admin/*` routes require an httpOnly session cookie (`mf_admin_session`),
set by login and re-validated against `profiles.role == 'admin'` on **every**
request (never cached/trusted from the token). This is a separate auth path
from the mobile app's `Authorization: Bearer <jwt>` header flow.

| Method | Path | Body | Response | Notes |
|---|---|---|---|---|
| POST | `/auth/login` | `{email, password}` | `{user_id, role}` | Sets `mf_admin_session` + `mf_admin_refresh` cookies. 403s if the account's role isn't `admin`. |
| POST | `/auth/logout` | — | `{detail}` | Deletes both cookies. |
| GET | `/auth/me` | — | `{user_id, role}` | Cookie-auth session check, used by the frontend's `useAdminAuth` hook. |

## Metrics

| Method | Path | Response (`AdminMetricsOut`) |
|---|---|---|
| GET | `/admin/metrics` | `total_users, active_workouts_today, premium_subscriber_ratio, pending_trainer_applications, active_trainer_relationships, library_programs_count, pending_notification_blasts` |

## Users

| Method | Path | Body | Response | Notes |
|---|---|---|---|---|
| GET | `/admin/users?page=&page_size=` | — | `{users: AdminUserOut[], total}` | `AdminUserOut`: `id, full_name, email, updated_at, last_active_workout, status, workouts_count, target_calories, subscription_tier`. |
| PATCH | `/admin/users/{user_id}/subscription` | `{subscription_tier}` | `{detail}` | `'free' \| 'premium'`, DB CHECK-enforced. |
| POST | `/admin/users/{user_id}/toggle-suspend` | — | `{status}` | Flips `active` ↔ `banned` server-side (re-reads current status, ignores any client-supplied value). |
| GET | `/admin/users/{user_id}/workouts` | — | `AdminWorkoutOut[]` | Full workout + set history for one user. |
| PATCH | `/admin/workouts/{workout_id}` | `{performed_at?, user_summary_notes?}` | `{detail}` | |
| DELETE | `/admin/workouts/{workout_id}` | — | `{detail}` | |
| DELETE | `/admin/workout-sets/{set_id}` | — | `{detail}` | |

## Config (`global_flags`)

| Method | Path | Body | Response | Notes |
|---|---|---|---|---|
| GET | `/admin/config` | — | `{[key]: value}` | Only known keys are ever written (see PUT); missing keys just aren't in the response. |
| PUT | `/admin/config/{key}` | `{value}` | `{detail}` | `key` must be one of: `allowSignups, activeFeatureTesting, maintenanceMode, dataSyncInterval, apiLogLevel, serverRegion` — 400 otherwise. |

## Notifications

| Method | Path | Body | Response (`NotificationBlastOut`) | Notes |
|---|---|---|---|---|
| POST | `/admin/notifications` | `{title, body, target_tier="all"}` | `id, title, body, target_tier, created_at, sent_status` | Inserts the row **and** sends via Expo push to every profile with a token (filtered by `subscription_tier` unless `target_tier == "all"`). `sent_status` becomes `"sent"` or `"failed"`. |
| GET | `/admin/notifications` | — | `NotificationBlastOut[]` | Full history, newest first. |

## Programs

| Method | Path | Body | Response | Notes |
|---|---|---|---|---|
| POST | `/admin/programs/upload` | `AdminProgramUploadIn` (see below) | `ProgramOut` | Builds a shared/library program via the `create_shared_program` RPC. |
| GET | `/admin/programs?page=&page_size=` | — | `{programs: [{id, title, description, plan_style, total_weeks, is_featured}], total}` | Library (`owner_trainer_id IS NULL`) programs only, featured first. |
| PATCH | `/admin/programs/{program_id}/feature` | — | `{is_featured}` | Toggles. `GET /programs` (client-facing) now sorts featured programs first. |

**`AdminProgramUploadIn` shape** (matches `ProgramUploader.tsx`'s JSON editor
exactly — "old" field names, transformed server-side into the canonical
trainer-plan shape before hitting the RPC):
```json
{
  "program_name": "string",
  "cycle_note": "string | null",
  "plan_style": "string | null",
  "total_weeks": 8,
  "weeks": [{
    "week": 1, "block": 1, "block_label": null, "is_deload": false,
    "sessions": [{
      "session_number": 1, "session_label": null,
      "exercises": [{
        "name": "Back Squat", "tutorial_url": null,
        "warm_up_sets": "2-3", "working_sets": 4, "target_reps": "5",
        "early_set_rpe": 7.5, "last_set_rpe": 9, "rest": "3 min",
        "intensity_technique": null, "notes": null,
        "substitutions": [{"name": "Hack Squat", "tutorial_url": null}]
      }]
    }]
  }]
}
```

## Trainers

| Method | Path | Body | Response | Notes |
|---|---|---|---|---|
| GET | `/admin/trainers` | — | `AdminTrainerOut[]` | **All** applications, verified + unverified. Fields: `id, full_name, email, bio, specialties, headline, years_experience, created_at, is_verified, bio_hidden`. |
| GET | `/admin/trainers/pending` | — | `PendingTrainerOut[]` | Unverified only (same fields minus `is_verified`/`bio_hidden`). |
| POST | `/admin/trainers/{trainer_id}/verify` | — | `{detail}` | Sets `is_verified = true`. |
| POST | `/admin/trainers/{trainer_id}/reject` | — | `{detail}` | **Deletes** the `trainer_profiles` row (only if still unverified) — applicant would need to re-apply. Does not touch `profiles.role`. |
| PATCH | `/admin/trainers/{trainer_id}/bio-hidden` | `{bio_hidden: bool}` | `{detail}` | Blanks the bio in the client-facing `GET /trainers` directory without touching `is_verified`. |

## Trainer-client relationships

| Method | Path | Body | Response (`TrainerClientRelationshipOut`) | Notes |
|---|---|---|---|---|
| GET | `/admin/trainer-clients?status=` | — | `id, trainer_id, client_id, status, trainer_full_name, client_full_name, started_at, ended_at, created_at` | `status` query param optional (`pending`/`active`/`cancelled`/`expired`). |
| POST | `/admin/trainer-clients/{relationship_id}/force-cancel` | — | `{status: "cancelled"}` | Only works on a currently `active` or `pending` row; sets `status='cancelled', ended_at=now()`. Frees the client for a new trainer request. |

## Exercise library (shared `exercises` table)

| Method | Path | Body / Query | Response (`AdminExerciseOut`) | Notes |
|---|---|---|---|---|
| GET | `/admin/exercises?search=&page=&page_size=` | — | `{exercises: [...], total}` | `search` does a case-insensitive `ilike` on name. Fields: `id, name, tutorial_url, tracking_type, is_unilateral, muscle_group, is_retired`. |
| POST | `/admin/exercises` | `AdminExerciseCreateIn` | `AdminExerciseOut` | Direct create (bypasses plan-upload find-or-create). `name` is DB-UNIQUE. |
| PATCH | `/admin/exercises/{exercise_id}` | `AdminExerciseUpdateIn` (any subset) | `AdminExerciseOut` | `is_retired: true` is how you remove an exercise from client-facing lists — hard delete isn't offered (FK from `program_prescriptions`). |

`AdminExerciseCreateIn`: `{name, tutorial_url?, tracking_type="reps", is_unilateral=false, muscle_group?}`
`AdminExerciseUpdateIn`: any subset of `{name, tutorial_url, tracking_type, is_unilateral, muscle_group, is_retired}`

## Exercise media matching

| Method | Path | Body / Query | Response | Notes |
|---|---|---|---|---|
| GET | `/admin/exercise-media?body_part=&muscle_group=&target=&page=&page_size=` | — | `{media: [{id, source_name, body_part, equipment, muscle_group, target, image_path, gif_path}], total}` | Browses `exercise_media_library` (the seeded reference dataset). |
| POST | `/admin/exercises/{exercise_id}/media-match` | `{media_id}` | `AdminExerciseOut` | Sets `exercises.exercise_media_id` — the manual review step; resolves `thumbnail_url`/`gif_url` everywhere the exercise is later read. |

## Everything here writes to `admin_actions`

Every mutating route above (verify/reject, force-cancel, exercise create/
update/retire, media match, feature toggle, bio-hidden, subscription/
suspend/config/notification/workout/program actions) logs one row to
`admin_actions` (`actor_id, action, target_table, target_id, detail,
created_at`) — best-effort, never blocks the actual action if logging
fails. No admin-facing UI reads this table yet; it's a DB-level trail only.

## Explicitly not built (confirmed gap, not a doc error)

- **Progress-photo moderation** — no `/admin/progress-photos` route exists.
  Deliberately skipped: the original doc flags this as a privacy-surface
  decision to confirm before building, not a default.

## Migration

All of the above (except the pre-existing metrics/users/config/notifications/
workouts/program-upload routes) depend on `migrations_new_project/
032_admin_capabilities.sql` — already applied to the live Supabase project
(new `admin_actions` table; `exercises.is_retired`, `programs.is_featured`,
`trainer_profiles.bio_hidden` columns).
