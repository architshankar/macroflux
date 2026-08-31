# Admin panel — what the backend needs to expose

This doc is for whoever builds/maintains the admin panel (separate codebase
from this repo, per `BACKEND_CHANGES.md`'s "Admin panel plan-upload path"
note). It has two parts:

1. **Part A** — the plan-upload JSON shape change (already shipped, this was
   the original content of this file).
2. **Part B** — a full inventory of admin capabilities the frontend team has
   asked for, checked against what this backend actually has today. For each
   one: what exists, what's missing, and the proposed API shape so you can
   plan the panel's screens against it.

Everything in Part B marked **NOT BUILT** doesn't exist yet — endpoints,
tables, columns, all of it. This doc proposes shapes for planning purposes;
treat them as a starting point to confirm with us, not a committed contract,
until we say a given piece has actually shipped.

---

## Part A — Plan-upload JSON: exercise-by-name, substitutions, muscle group

This backend (MacroFlux FastAPI API) changed the JSON shape a trainer/admin
plan-upload posts to build a program. This repo doesn't own the admin
panel's code, so whoever maintains that upload path needs to make the
changes below.

**Good news: this is additive.** Every new field is optional with a
server-side default, and the old field names still exist under new
semantics (see "exercise_id → exercise_name" below, which is the one
non-additive change). Old JSON payloads that predate this doc will mostly
still parse, but see that section — it's the one that needs an actual
rewrite, not just new optional fields bolted on.

### Endpoint

Unchanged: `POST /trainer/clients/{client_id}/plans`, bearer JWT of a
trainer, `client_id` in the path. Full current reference:
`WorkoutPlans/plan-json-format.md` in this repo (note: that doc predates
the `muscle_group`/`substitutions` fields below — treat this doc as the
more current source for those two, or ask us to update it in place).

Response is unchanged: just the created program's
id/title/description/plan_style/total_weeks/owner_trainer_id, not the full
nested tree.

### Change 1 — exercises are referenced by name, not by ID

**Before:** each prescription sent `exercise_id` (a UUID), which had to
already exist in the shared `exercises` table. There was never an endpoint
to create one, so in practice the table was empty and this field was
unusable — plans couldn't reference exercises that didn't exist yet.

**Now:** each prescription sends `exercise_name` (a string) plus, optionally,
that exercise's own metadata (`tutorial_url`, `tracking_type`,
`is_unilateral`, `muscle_group`). The server does a **case-insensitive
find-or-create** against the shared `exercises` table as part of the same
transaction that builds the plan:

- If an exercise with that name (case-insensitive) already exists, its
  **existing** `tutorial_url`/`tracking_type`/`is_unilateral`/`muscle_group`
  win — whatever you send for those four in *this* prescription is ignored.
  The exercises table is shared across all plans/trainers, so one upload
  can't silently redefine an exercise another plan already references.
- If it doesn't exist yet, a new row is created using whatever you sent for
  those four fields (`tracking_type` defaults `'reps'`, `is_unilateral`
  defaults `false`, `tutorial_url`/`muscle_group` default null).

**Action needed:** replace `exercise_id` with `exercise_name` in every
prescription object. This is the one change that isn't backward compatible
— an old payload with `exercise_id` and no `exercise_name` will fail
validation (`exercise_name` is required).

**Practical implication:** get the spelling and `tracking_type`/
`is_unilateral`/`muscle_group` right the first time a plan introduces an
exercise. Misspelling `"Bicep Curl"` as `"Bicept Curl"` in a later upload
creates a second, separate exercise instead of reusing the first, and
there's no endpoint to fix a wrong `tracking_type`/`is_unilateral`/
`muscle_group` after the fact short of a direct DB update — see Part B,
"Exercise library CRUD" for the admin-panel feature that would close this
gap.

### Change 2 — per-side rep targets (new, optional)

Two new optional fields per prescription: `target_reps_left`,
`target_reps_right` (strings, e.g. `"10"`/`"8"`). They override
`target_reps` for that side on a unilateral exercise (`is_unilateral:
true`). If omitted, both sides just use `target_reps`. No effect on
bilateral exercises.

### Change 3 — muscle group (new, optional)

New optional field per prescription: `muscle_group` (string, e.g.
`"quads"`, `"chest"`). Same "only applied on exercise creation" rule as
`tracking_type`/`is_unilateral` above. Backs a substitution-suggestion
feature on the client (exercises in the same muscle group are offered as
swaps even without an explicit substitution link).

### Change 4 — inline substitutions (new, optional)

New optional field per prescription: `substitutions`, an array of objects
shaped exactly like a lightweight exercise reference:

```json
"substitutions": [
  {
    "name": "Hack Squat",
    "tutorial_url": null,
    "tracking_type": "reps",
    "is_unilateral": false,
    "muscle_group": null
  }
]
```

Each entry goes through the same case-insensitive find-or-create as the
main `exercise_name` (note the key is `name`, not `exercise_name`, inside a
substitution object) and gets linked to the parent prescription's exercise
via `exercise_substitutions`. Previously this table existed and was already
read by the client, but nothing ever wrote to it — there was no way to
author a substitution list at all. Omit the field (or send `[]`) if a
prescription has no substitutions; defaults to `[]`.

### Full current shape

```json
{
  "title": "8-Week Strength Block",
  "description": "optional",
  "plan_style": "optional, e.g. 'push/pull/legs'",
  "total_weeks": 8,
  "weeks": [
    {
      "week_number": 1,
      "block_number": 1,
      "block_label": "optional",
      "is_deload": false,
      "sessions": [
        {
          "session_number": 1,
          "session_label": "optional",
          "prescriptions": [
            {
              "exercise_name": "Back Squat",
              "tutorial_url": "https://youtu.be/...",
              "tracking_type": "reps",
              "is_unilateral": false,
              "muscle_group": "quads",
              "sequence_order": 1,
              "warm_up_sets": "2-3",
              "working_sets": 4,
              "target_reps": "5",
              "target_reps_left": null,
              "target_reps_right": null,
              "early_set_rpe": 7.5,
              "last_set_rpe": 9,
              "rest_time": "3-4 min",
              "intensity_technique": "optional",
              "prescription_notes": "optional",
              "substitutions": [
                { "name": "Hack Squat", "tutorial_url": null, "tracking_type": "reps", "is_unilateral": false, "muscle_group": null }
              ]
            }
          ]
        }
      ]
    }
  ]
}
```

`title` is the only required top-level field; `week_number`/`session_number`/
`exercise_name` are the only required nested fields. Everything else is
optional with the defaults noted above.

### Open item — no endpoint yet for "create from scratch" (no client)

`POST /trainer/clients/{client_id}/plans` always requires a real `client_id`
and an active trainer↔client relationship, and always creates a private
plan (`owner_trainer_id` = that trainer) plus an assignment row linking it
to that one client. There's a second RPC already written at the DB level,
`create_shared_program` (same JSON body, minus `client_id`, creates a
public/library program with `owner_trainer_id = NULL` and no assignment —
these are what `GET /programs` serves to every user), **but it isn't wired
to any HTTP endpoint in this FastAPI backend yet.**

This is exactly the gap the admin panel's "Program/plan upload" need (Part
B) runs into — see that section for the proposed `POST /admin/programs`
route backed by this same RPC.

---

## Part B — Admin capability inventory

### 0. Prerequisite: admin auth doesn't exist yet — **needs a decision**

Every capability below needs the API to know "this caller is an admin."
Right now it can't:

- `profiles.role` is `CHECK (role IN ('client', 'trainer'))` — there is no
  `'admin'` value, and no admin-equivalent table.
- The only two auth patterns in this backend today are (a) a normal
  Supabase JWT resolved to a `profiles.id` + role check (see
  `require_trainer` in `app/services/trainer_service.py`, which every
  trainer-only route depends on), and (b) a single shared static secret via
  `X-Internal-Secret` header (`verify_internal_secret` in
  `app/core/auth.py`), used only by the cron-triggered `/internal/*` routes
  — not tied to an individual user, no audit trail of *who* triggered it.

Admin actions (verifying a trainer, banning a user, force-cancelling a
relationship) are exactly the kind of thing you want attributable to a
specific staff member, not a shared secret. **Proposed default** (confirm
with us before building against it): add `'admin'` to the `profiles.role`
CHECK constraint, admins log in the same Supabase-JWT way as everyone else,
and every `/admin/*` route gets a `require_admin` dependency mirroring
`require_trainer` — plus an `admin_actions` audit log table
(actor_id, action, target_table, target_id, detail jsonb, created_at) so
every capability below has a "who did this and when" trail for free. This
also means promoting someone to admin is itself a manual DB update (or a
`/admin/admins` endpoint bootstrapped by whoever holds direct DB access
first) — no self-serve signup path, by design.

Nothing past this point works without this decision landing first.

---

### 1. People & access

#### 1a. Verify / reject trainer applications
**Status: NOT BUILT.** `trainer_profiles.is_verified` exists (defaults
`false` on `POST /trainers/apply`) and is already read — `GET /trainers`
(the client-facing trainer directory) filters `is_verified = true` — but
nothing in this codebase ever flips it to `true`. A trainer who applies is
stuck invisible forever unless someone runs a manual DB update.

Proposed:
- `GET /admin/trainers/pending` — list `trainer_profiles` where
  `is_verified = false`, joined with `profiles` (name/email) and whatever
  the applicant submitted (`bio`, `specialties`, and — once migration 027
  is live — `headline`/`years_experience`).
- `POST /admin/trainers/{trainer_id}/verify` → sets `is_verified = true`.
- `POST /admin/trainers/{trainer_id}/reject` → your call whether "reject"
  means deleting the `trainer_profiles` row (they'd need to reapply) or
  adding a `rejected` state. Nothing in the schema distinguishes
  "never reviewed" from "reviewed and rejected" today — flag if you want
  that distinction and we'll add a column rather than overload
  `is_verified`.

#### 1b. Suspend / ban a user account
**Status: NOT BUILT.** `profiles.status` exists, defaults `'active'`, but
has **no CHECK constraint** — any string is currently valid, and no code
anywhere reads or writes it except the default. There's no enforcement
today of what "suspended" even means (can a suspended user still log in and
hit the API? get 403'd on every route? just get hidden from trainer
directories?).

Proposed, pending that decision:
- `PATCH /admin/users/{user_id}/status` body `{"status": "active" |
  "suspended" | "banned"}`.
- We'd add the CHECK constraint at the same time (`status IN ('active',
  'suspended', 'banned')`) and add a status check into `get_current_user_id`
  or a shared dependency so a suspended/banned user's JWT stops working
  against the API immediately, not just cosmetically in the panel.
- Needs your input on whether "suspended" (temporary, reversible) and
  "banned" (terminal) should behave differently, or if one flag with two
  values covering both is enough.

#### 1c. Override / reassign a stuck `trainer_clients` relationship
**Status: NOT BUILT.** Today the only state transitions on `trainer_clients`
are client-initiated (`POST /trainer/clients/request`) or trainer-initiated
(`accept`/`decline`, which sets `cancelled`). There is no path — client,
trainer, or admin — to end an `active` relationship once it exists (e.g. a
trainer goes inactive and a client is permanently stuck with
`trainer_clients_one_active_per_client`'s unique index blocking a new
match).

Proposed:
- `POST /admin/trainer-clients/{relationship_id}/force-cancel` → sets
  `status = 'cancelled'`, `ended_at = now()`. Frees the client to be
  requested by a new trainer (the partial unique index only blocks a
  *second* `active` row per client, so this alone unblocks them).
- Optional combo action `POST /admin/trainer-clients/{relationship_id}/reassign`
  body `{"new_trainer_id": ...}` — cancels the old row and creates a new
  `active` one in one call, if you want reassignment to skip the normal
  request/accept flow entirely. Confirm you actually want admin-initiated
  relationships to bypass trainer acceptance before we build this variant.

#### 1d. Change a user's `subscription_tier`
**Status: NOT BUILT.** `profiles.subscription_tier` exists, defaults
`'free'`, also has **no CHECK constraint** — same situation as `status`.
Nothing reads or writes it anywhere in the current codebase besides the
default (it's not even clear yet what tiers exist or what they gate,
since no route checks it — worth confirming tiers/gating logic exists
somewhere before this becomes a real lever).

Proposed: `PATCH /admin/users/{user_id}/subscription-tier` body
`{"subscription_tier": "..."}`, once you tell us the actual set of valid
tier values so we can add the CHECK constraint and this endpoint's
validation together.

---

### 2. Content library

#### 2a. Exercise library CRUD
**Status: NOT BUILT** for the shared `exercises` table. What exists today
(`app/routers/exercises.py`) is per-user `user_exercises` CRUD
(`POST/PUT/DELETE /exercises/custom/...`) — private to the creating user,
never touches the shared 335-row `exercises` table. The shared table is
currently only ever written to indirectly, via the plan-upload
find-or-create in Part A — there's no direct create/edit/retire path, which
is exactly the gap Part A's "Practical implication" note flags (a
misspelled or wrong-metadata exercise has no fix path today short of a
manual DB update).

Proposed:
- `GET /admin/exercises` — full shared library, paginated/searchable.
- `POST /admin/exercises` — direct create, bypassing the find-or-create
  (admin explicitly wants a new row).
- `PATCH /admin/exercises/{exercise_id}` — edit `name`/`tutorial_url`/
  `tracking_type`/`is_unilateral`/`muscle_group`. Since these are shared
  across every plan that already references the exercise, an edit here
  changes what every client sees immediately — no versioning today, flag if
  that's a concern.
- Retire, not delete: `exercises.id` is referenced by
  `program_prescriptions.exercise_id` (`NOT NULL`, no `ON DELETE` override
  specified, so a hard delete of a referenced exercise would currently
  error out at the DB level). Add an `is_retired boolean DEFAULT false`
  column and filter it out of client-facing lists rather than exposing a
  real DELETE.

#### 2b. Exercise media library management
**Status: NOT BUILT** for admin-facing CRUD. `exercise_media_library`
exists (a large reference table — body_part, equipment, muscle_group,
target, secondary_muscles, image/gif paths) and
`exercises.exercise_media_id` is a nullable FK for matching one to the
other, but per that migration's own comment, matching is "still-manual,
review-pending" and nothing populates it — it's backfilled by a script
(`scripts/backfill_exercise_media.py`), not reviewed anywhere in-app.

Proposed:
- `GET /admin/exercise-media` — browse/search the media library (by
  `body_part`/`muscle_group`/`target`, already indexed).
- `POST /admin/exercises/{exercise_id}/media-match` body
  `{"media_id": "..."}` → sets `exercises.exercise_media_id`, the manual
  review step the migration comment describes but nothing currently does.
- Whether admins also need to *add new* media library rows (vs. just
  matching against the existing seeded dataset) — flag if so, since that's
  new upload/storage-bucket work (`exercise-media` bucket per migration
  023) rather than just a DB write.

#### 2c. Program/plan upload — bulk-import / author from scratch
**Status: PARTIALLY BUILT.** The full plan-JSON shape (Part A) is real and
working for the trainer-facing, per-client path
(`POST /trainer/clients/{client_id}/plans`). What's missing for an admin
"catalog authoring" flow is exactly the gap already flagged in Part A's
"Open item": `create_shared_program`, the DB-level RPC that builds a
public/library program (`owner_trainer_id = NULL`, no client assignment —
what `GET /programs` serves to everyone) exists but has no HTTP route.

Proposed: `POST /admin/programs`, same request body as
`POST /trainer/clients/{client_id}/plans` minus `client_id`, backed by
`create_shared_program`. This is the "bulk-import or hand-author programs
into the library" capability — confirm this is the flow you want and we'll
wire it up; it's a thin route, most of the work (the JSON shape, the
find-or-create exercise logic) already exists.

#### 2d. Feature / pin certain programs ("staff picks")
**Status: NOT BUILT.** No `is_featured`/pinned column exists on `programs`
today, and nothing in `GET /programs` sorts or filters on any such flag.

Proposed: add `programs.is_featured boolean NOT NULL DEFAULT false` (or,
if you want ordering rather than a boolean, a nullable
`featured_rank integer` instead — tell us which), plus
`PATCH /admin/programs/{program_id}/feature` to toggle it, and have
`GET /programs` sort featured programs first (or expose a
`?featured=true` filter, whichever the client screen needs — worth
confirming with the client/frontend side since this changes their existing
`GET /programs` consumers, not just adding a new admin route).

---

### 3. Comms & ops

#### 3a. Notification blasts
**Status: NOT BUILT**, but the hard part already exists. `notification_blasts`
(`title`, `body`, `target_tier`, `sent_status`) has existed since migration
008 and nothing reads or writes it — confirmed, no route or service
references it anywhere in this codebase. What *does* exist and is directly
reusable: `push_service.send_expo_push()`, the batch-send-to-Expo function
already used by the Wednesday weigh-in reminder cron
(`app/services/push_service.py`), which every user's `expo_push_token`
already flows through (`profiles.expo_push_token`, set via
`POST /push` from the app).

Proposed:
- `POST /admin/notifications/blasts` body `{"title", "body", "target_tier"}`
  → inserts a row (`sent_status = 'pending'`).
- `POST /admin/notifications/blasts/{blast_id}/send` → loads the row,
  resolves the target audience (all profiles with a non-null
  `expo_push_token`, filtered by `subscription_tier` if `target_tier !=
  'all'` — this is also blocked on 1d above, since `subscription_tier`
  isn't a real enforced value yet), calls `send_expo_push`, sets
  `sent_status = 'sent'`.
- `GET /admin/notifications/blasts` — history/status list for the composer
  screen.
- Whether send should be synchronous on that POST or fire-and-forget via a
  background task — given `send_expo_push` is already just a best-effort
  fire-and-forget HTTP call with no receipt polling (see its docstring),
  synchronous is probably fine unless blast audiences get large enough to
  matter.

#### 3b. Dashboard landing page (aggregate stats)
**Status: NOT BUILT.** No existing endpoint aggregates anything
admin-shaped. `trainer_service.dashboard_summary` exists but is scoped to
one trainer's own clients (`GET /trainer/dashboard/summary`), not a
platform-wide view — different endpoint, not reusable as-is.

Proposed: `GET /admin/dashboard/summary` returning counts worth having on a
landing page — total users, users by `status`, pending trainer applications
(1a's count), active `trainer_clients` relationships, programs in the
shared library, pending notification blasts. Tell us if there's a
specific set of numbers the panel's first version actually needs; happy to
start narrow rather than guess a big aggregate query no screen uses yet.

---

### 4. Moderation

#### 4a. Review/remove inappropriate progress photos
**Status: NOT BUILT**, and worth double-checking whether it's needed yet.
Progress photos (`app/routers/progress_photos.py`) are currently private by
design — a user only sees/deletes their own (`GET/POST/DELETE
/progress-photos`), and the *only* other party with any visibility is a
client's own trainer, via `GET /trainer/clients/{client_id}/photos`. There
is no admin route, no public/shared surface for photos at all today. The
frontend's own note flags this as relevant "if this ever goes
multi-tenant/public-facing" — since nothing today makes a photo visible
beyond its owner and their trainer, there may be nothing to moderate yet.
Confirm this is still wanted for v1 before we build a
`GET /admin/progress-photos` + delete route — it's a real privacy-surface
increase (admin visibility into private body photos) worth deciding
deliberately rather than defaulting into.

#### 4b. Review/remove inappropriate trainer bios
**Status: NOT BUILT.** `trainer_profiles.bio` is free text, editable only
by the trainer themselves via `PATCH /trainers/me`, no moderation state or
flagging mechanism. Lower-stakes than 4a (bios are already public via
`GET /trainers`, so there's no new privacy exposure), but no "flagged" or
"hidden" state exists to unpublish a bio without also un-verifying the
trainer entirely.

Proposed, if wanted for v1: `PATCH /admin/trainers/{trainer_id}/bio` (blunt
overwrite/clear) or a lighter-weight `trainer_profiles.bio_hidden boolean`
that blanks the bio in `GET /trainers` responses without touching
`is_verified`. Tell us which behavior you want — full edit access vs. just
hide/unhide — before we build it.

---

## Summary — what's real today vs. proposed

| Area | Exists now | Needs building |
|---|---|---|
| Admin auth itself | Nothing | Everything (§0) — blocks all rows below |
| Trainer verification | `is_verified` column, read in one query | List/verify/reject endpoints |
| User suspend/ban | `status` column, unenforced | CHECK constraint, enforcement in auth, endpoint |
| Trainer-client override | Client/trainer-driven states only | Admin force-cancel/reassign endpoint |
| Subscription tier | `subscription_tier` column, unenforced | Valid-tier decision, CHECK constraint, endpoint |
| Exercise library CRUD | Per-user `user_exercises` only | Shared-table CRUD + retire flag |
| Exercise media matching | Table + FK column exist, script-seeded | Browse/match endpoints |
| Plan/program upload (per-client) | Fully working (Part A) | — |
| Plan/program upload (library, no client) | DB RPC written, unwired | One HTTP route |
| Featured/pinned programs | Nothing | New column + endpoint + `GET /programs` change |
| Notification blasts | Table + send-function both exist, unconnected | Endpoints wiring them together |
| Admin dashboard | Trainer-scoped version only | Platform-wide aggregate endpoint |
| Progress photo moderation | Fully private, no admin path | Confirm it's wanted, then build |
| Trainer bio moderation | Fully open, no flagging | Confirm scope, then build |
