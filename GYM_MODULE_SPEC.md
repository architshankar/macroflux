# Gym Module — spec (v1)

This document is the single source of truth for the "onboard gyms" expansion, shared
identically across three places: this app's frontend Claude session, the admin-website
Claude session, and the common/shared backend Claude session. If any of the three needs
to deviate from this doc, that deviation should be reflected back here so the other two
stay in sync — do not let this drift into three different understandings.

Everything below was decided in a chat planning session with the product owner
(2026-09-02). Anything marked **ASSUMPTION** was not explicitly confirmed and is a
reasonable default chosen by the assistant — treat it as changeable, not settled, and
flag it back to the owner if a team disagrees with it before building on top of it.

## 1. Goal

Add a "Gym" tab to the consumer app that lets users browse nearby gyms (equipment,
amenities, staff) the way they'd browse a business listing. In exchange for being
listed, gyms display the app's QR code on-site (marketing channel, handled entirely
offline by the product owner — no backend/frontend work needed for this part). Gyms can
optionally upgrade to a paid tier that unlocks trainer bookings and gym-specific curated
training plans.

This is three pieces of work:
1. **Frontend app** — new Gym tab (browse) + trainer request flow + plan consumption.
2. **Admin panel** — a new Gyms section (manage all gyms) that bifurcates into
   gym-scoped sub-panels (manage one gym's equipment/amenities/trainers/plans/members).
3. **Shared backend** — new tables/endpoints described below.

## 2. Actors & roles

- **Super admin** (product owner) — manages everything via the existing admin panel.
  This is the only party doing gym data entry right now (see §5).
- **Gym admin** — a role scoped to one gym. Not in active use yet (the business is too
  small for gyms to self-manage), but the permission model must support it from day
  one so it's a config change, not a rebuild, when it's needed. A gym can have multiple
  gym admins later (owner + staff) — **CONFIRMED**: modeled as a
  `gym_admins (gym_id, user_id, role)` junction (migration `034_gym_admins.sql`),
  `role` CHECK'd to `'owner'|'staff'`. This is a table SEPARATE from `profiles.role`
  (which stays `client|trainer|admin`, untouched) — gym-scoped permission is
  `gym_admins` membership OR `profiles.role == 'admin'` (super admin bypasses all gym
  scoping), checked via `app/services/gym_service.py`'s `require_gym_admin(user_id,
  gym_id)` / `require_super_admin_or_any_gym_admin(user_id)`.
- **Trainer** — the existing trainer entity (`trainer_profiles`, `app/(trainer)/*`).
  Unchanged. A trainer can now additionally be *affiliated* with one or more gyms while
  still keeping independent clients outside any gym — affiliation is additive, not
  exclusive.
- **Member / user** — the existing consumer app user. Unchanged.

## 3. Gym record & lifecycle

New `gyms` table:

| column | type | notes |
|---|---|---|
| id | uuid pk | |
| owner_user_id | uuid, fk users | the account that owns/manages this gym (see `gym_admins`) |
| name | text | |
| description | text, nullable | |
| address | text | |
| lat / lng | numeric | for nearby-gym queries — see §3.1 |
| city | text, nullable | |
| phone | text, nullable | |
| tier | enum: `free`, `paid` | see §4 |
| status | enum: `pending_review`, `live`, `rejected`, `suspended` | see below |
| source | enum: `admin_added`, `self_signup` | |
| photo_url | text, nullable | **CHANGED (2026-09-03, added post-launch)** — set via a separate upload endpoint, not a create/update field. See §11's and §12's notes below. |
| created_at / updated_at | timestamptz | |

A gym is created one of two ways (both are in scope for v1 — build both):
- **Admin-added**: super admin creates it directly in the admin panel. `status` starts
  at `live` immediately — no review needed since the super admin is the one entering it.
- **Self-signup**: a gym owner signs up and creates their own listing. `status` starts
  at `pending_review` and only becomes `live` after super admin approval in the admin
  panel. **This path is built but not expected to see real traffic yet** — the product
  owner is doing all onboarding manually while the business is small (see §5).

**Chains**: one `owner_user_id` can own multiple `gyms` rows (multiple physical
locations). There is no separate "chain" entity — it's just multiple gym rows with the
same owner.

**Tier changes are always manual.** There is no in-app purchase/upgrade flow for gym
listings — the super admin flips `tier` from `free` to `paid` in the admin panel after
an offline deal is made with the gym. Do not build any billing/payment UI for this.

### 3.1 Nearby-gym queries

Needs geolocation. **CONFIRMED**: PostGIS was available on the live Supabase project
(v3.3.7, previously uninstalled) and is now enabled — `gyms` keeps plain nullable
`lat`/`lng` numeric columns for display/API convenience, plus a generated
`location geography(Point,4326)` column (`GENERATED ALWAYS AS (...) STORED`, computed
from lat/lng so it can never drift). Nearby-gym ranking is a `nearby_gyms(p_lat, p_lng,
p_radius_km, p_equipment_category_id)` SQL RPC using `ST_DWithin`/`ST_Distance` (a plain
PostgREST query can't order by a computed distance expression) — `GET /gyms/nearby`
calls it when `lat`/`lng` query params are given, and falls back to an unsorted
`status='live'` list when they're omitted (see the graceful-degradation note below).
PostGIS was installed unqualified into the `public` schema (not the `extensions` schema
like `pgcrypto`/`uuid-ossp`) so `geography`/`ST_*` stay unqualified in every RPC, matching
how every RPC in this codebase pins `SET search_path = public`. Migration:
`033_gyms_core.sql` (table + extension), RPC completed in `035_equipment_amenities_catalog.sql`
(needs `gym_equipment`/`equipment_models` to exist first for the equipment-category filter).

**Distance is computed against the user's live device location** ("X km away"), not a
manually-entered city/search location. This requires the app to request the device's
location — handled as follows, confirmed safe for Play Store publishing:

- Request **foreground-only** location (`ACCESS_COARSE_LOCATION`, add
  `ACCESS_FINE_LOCATION` only if coarse (~3km accuracy) proves insufficient) — via
  `expo-location`'s `requestForegroundPermissionsAsync()`. **Do not** request
  `ACCESS_BACKGROUND_LOCATION` — not needed for this feature, and it triggers a much
  stricter Play Console review (separate justification + sometimes a video demo). Add
  the permission usage strings in `app.json` (Android permission block, plus
  `NSLocationWhenInUseUsageDescription` if this ever ships to iOS).
- Show an in-app rationale before the OS permission prompt fires (Google's "prominent
  disclosure" expectation for location) — e.g. "Allow location to show gyms near you."
- Declare location collection in Play Console's **Data Safety** section (collected, used
  for app functionality, not shared with third parties) and mention it in the app's
  privacy policy.
- **Must degrade gracefully if the user denies the permission** — the Gym tab should
  still function (unsorted list, or manual city/pincode search) rather than being
  blocked entirely. This is both better UX and lower review risk than hard-gating the
  tab behind a permission grant.

## 4. Tiers

| | Free | Paid |
|---|---|---|
| Appears in nearby-gyms browse | yes | yes |
| Equipment carousel + full equipment list | yes | yes |
| Amenities (boxing, Zumba, steam bath, etc.) | yes | yes |
| Trainer list shown on gym page | **yes** — trainers are part of what the gym offers, shown regardless of tier | yes |
| "Ask for training" action on a trainer | **no** — browsing only | **yes** |
| Gym-specific curated plans (general + user-specific) | no | yes |

Trainers are **not** paid-tier-gated for visibility — only the ability to request
training is gated. This is the upsell: a free-tier gym's page naturally shows off its
staff, but a user can't act on it until the gym is paid.

## 5. Equipment & amenities catalog

Two-level, reusable, shared taxonomy — **not** free text typed per gym, and **not** a
flat "equipment name + gym" pairing, because different gyms carry different
brands/models of the same equipment type, and the brand/model matters (different
attachments, different exercise variations). Design:

**`equipment_categories`** — the generic tag (e.g. "Hack Squat", "Lat Pulldown",
"Bumper Plates", "Straight Bar", "Tricep Rope"). Admin-curated, fixed-ish list, used for
cross-gym filtering ("gyms near me with a hack squat").

| column | type |
|---|---|
| id | uuid pk |
| name | text, unique |

**`equipment_models`** — a specific brand/model under a category (e.g. "Technogym
Selection Pro Lat Pulldown" vs "Rogue Lat Pulldown" — both under the "Lat Pulldown"
category, but distinct entries because they come with different attachments/exercise
variations). Created once, then **reusable across any gym** that has that same
brand/model — do not duplicate a model row per gym.

| column | type |
|---|---|
| id | uuid pk |
| category_id | uuid, fk `equipment_categories` |
| brand | text |
| model_name | text |
| photo_url | text, nullable |
| created_by_user_id | uuid, fk users |
| created_at | timestamptz |

**`gym_equipment`** — junction: which gym has which model.

| column | type |
|---|---|
| id | uuid pk |
| gym_id | uuid, fk `gyms` |
| equipment_model_id | uuid, fk `equipment_models` |
| quantity | int, nullable |
| photo_url | text, nullable — gym's own on-site photo, overrides the model's default photo if set |
| created_at | timestamptz |

**`amenities`** and **`gym_amenities`** — same reusable-catalog pattern as equipment,
one level only (no brand/model distinction needed for amenities per the product owner —
"Boxing", "Zumba", "Steam Bath" don't have the equipment brand problem).

**Permissions**: creating/editing catalog entries (`equipment_categories`,
`equipment_models`, `amenities`) and attaching them to a gym (`gym_equipment`,
`gym_amenities`) must be buildable from **both** the super-admin panel and a future
gym-admin panel — same underlying write path, gated by role/gym-scope, not two separate
features. In practice, only the super admin will use this for now (manually entering
every gym's equipment), but the permission model must not assume admin-only.

**Reuse-across-gyms flow**: once the super admin creates an `equipment_models` row for
one gym (e.g. Anytime Fitness's specific lat pulldown), the UI must let them attach that
same existing model to a different gym without re-creating it — search/select existing
models before falling back to "create new model."

## 6. Machine-specific exercises

Add a nullable `equipment_model_id` (fk → `equipment_models`) column to the existing
`Exercise` table. An exercise with this set is specific to that brand/model's machine
(e.g. a lat pulldown variation only valid on a Technogym Selection Pro); an exercise
with it left null is generic (bodyweight, free-weight, or brand-agnostic) and behaves
exactly as it does today.

This is additive only — no changes to how the existing `Exercise` table is queried
outside the new gym-plan flow. Do not create a second/parallel exercise table for gyms.

## 7. Gym plans

Explicitly a **separate table set** from the existing `programs` /
`program_assignments` hierarchy — do not reuse those tables, per product owner request
("keep things organized"). Mirror the existing shape (plan → weeks → sessions →
prescriptions) so the structure is familiar, but namespaced for gyms:

`gym_plans` (id, gym_id, created_by_user_id, type: `general` | `user_specific`, title,
description, total_weeks, created_at)
→ `gym_plan_weeks` → `gym_plan_sessions` → `gym_plan_prescriptions` (same shape as
`ProgramWeek`/`ProgramSession`/`ProgramPrescription`, `exercise_id` fk's into the same
unified `Exercise` table from §6 — so a gym plan can mix generic exercises and
machine-specific ones tied to that gym's actual equipment).

**Authorship**: both plan types are hand-built by a trainer or admin using the plan
builder (not auto-generated). What makes a gym plan different from a regular program is
that its exercise pool is meant to be filtered to what that gym's `gym_equipment`
actually has, particularly the machine-specific exercises from §6.

**Assignment** — one shared table for both plan types:

`gym_plan_assignments` (id, gym_plan_id, user_id, assigned_by_user_id, assigned_at)

- `general` plans: any number of members can be assigned (this is "the paid member gets
  a curated beginner plan" the gym is selling).
- `user_specific` plans: effectively one row, but uses the same table — no separate
  mechanism needed.

This is also the mechanism behind "gym could assign certain accounts/members access to
their gym-specific paid plans" from the admin-panel side — the gym admin (or super
admin, today) picks a member account and a plan, and that's an insert here.

**Progress tracking is unified** — confirmed explicitly by the product owner, consistent
with how freeform workouts already share tracking with programmed ones. When a member
logs sets against a `gym_plan_session`, it must land in the same `PerformedWorkout` /
`PerformedSet` tables the rest of the app uses, so history/progress views don't
fragment by plan source.

**CONFIRMED**: implemented exactly as proposed, via `039_performed_workouts_gym_plan_source.sql`
— the one migration in this whole module that touches a live table with existing rows.
Added nullable `performed_workouts.gym_plan_session_id` (fk → `gym_plan_sessions`),
extended the `workout_source` CHECK from `'program'|'freeform'` to
`'program'|'freeform'|'gym_plan'`, and replaced `performed_workouts_source_session_consistency`
with a 3-way rule: exactly one of `session_id`/`gym_plan_session_id` set matching
`workout_source ∈ {'program','gym_plan'}`, both null for `'freeform'`. `POST
/workouts/start` accepts an optional `gym_plan_session_id` alongside the existing
`session_id` (a Pydantic validator rejects both being set); `workouts_service.py`'s
`start_workout`/`list_workout_history`/`get_workout_history_detail` became 3-way
branches. Applied directly against production (no branching available in this session's
environment) after confirming the actual constraint names via `pg_constraint` first, per
this doc's own PREFLIGHT convention — verified safe.

## 8. Trainer affiliation & "ask for training"

`gym_trainers` junction (id, gym_id, trainer_id, status: `active`|`inactive`,
affiliated_at). Many-to-many — **ASSUMPTION**: a trainer may be affiliated with more
than one gym (e.g. across a chain's locations, or independently with two different
gyms) since nothing said otherwise and the junction supports it for free.

A gym's trainer list on its page = its `active` `gym_trainers`, shown regardless of
tier (§4). A trainer keeps their existing independent client list untouched — gym
affiliation is purely additive.

**"Ask for training" (paid-tier only)**: clicking this on a trainer creates a
trainer-client relationship immediately, the same way a trainer manually adding a
client works today — **do not** build a separate inquiry/lead table. Reuse whatever
pending-request mechanism already exists on the trainer side (the trainer dashboard
already has a `pending_request_count` stat tile per `UI/tranierSide/API_GAPS.md` /
`TRAINER_UI_GAPS_HANDOFF.md` — confirm with that flow before adding a new one; this
request should likely land in that same pending state so it shows up next to any other
pending client requests a trainer already sees). Once accepted, the trainer can assign
`gym_plans` (§7) to that client like any other client.

**CONFIRMED**: `API_GAPS.md`/`TRAINER_UI_GAPS_HANDOFF.md` are actually at the repo root,
not `UI/tranierSide/`. The mechanism is the existing `trainer_clients` table +
`trainer_service.request_client`/`accept_client`/`decline_client` (`status`:
`pending|active|cancelled|expired`). `gym_service.ask_for_training(user_id, gym_id,
trainer_id)` checks the gym is `tier='paid'` and the trainer has an `active`
`gym_trainers` row, then calls `trainer_service.request_client` **completely
unchanged** — no new table, no new column. **Product decision made during this
build**: `trainer_clients` enforces one pending/active trainer relationship per client
*globally* (an app-level check in `request_client` plus a DB partial unique index) — the
product owner explicitly confirmed this should NOT be relaxed or scoped per-gym for this
pass. A user who already has a trainer relationship (independent or via another gym)
gets the same 409 conflict from `POST /gyms/{gym_id}/trainers/{trainer_id}/ask-for-training`
that `POST /trainer/clients/request` already returns today — this is intentional, not a
bug, and any relaxation is a future decision, not assumed here.

**Explicitly deferred, not in this pass**: actual time-slot booking / calendar / trainer
availability. "Ask for training" for now only establishes the relationship; scheduling
is a later initiative built on top of the same relationship once it exists.

## 9. Payments

**No payment integration in this pass.** All entitlements (`gym_plan_assignments`,
tier upgrades) are manual actions taken in the admin panel by a human — no Stripe/
Razorpay/in-app purchase flow to build now.

**Future** (explicitly out of scope for this doc's build, noted so schema doesn't
paint anyone into a corner): if payments are added later, it will be **Razorpay**, and
scoped specifically to **trainer bookings** (paying to book a session with a gym
trainer) — not gym listings, not general plan sales. Don't build gym-listing billing
logic expecting Stripe or a subscription model; that's not the direction.

## 10. QR codes

Out of scope for both frontend and backend. The QR is a **generic** app-download QR
(not gym-specific, no attribution/referral tracking) that the product owner generates
and prints themselves, offline. No schema, no endpoint, no per-gym QR generation needed.

## 11. Admin panel changes

New **Gyms** section, super-admin-scoped:
- List/search all gyms, filter by `status`/`tier`/`source`.
- Approve/reject `pending_review` (self-signup) gyms.
- Create a gym directly (`admin_added`, goes `live` immediately).
- Toggle `tier` (`free` ↔ `paid`) manually.
- Manage a gym's `gym_equipment`/`gym_amenities` (search-or-create against the shared
  catalog from §5).
- Manage a gym's `gym_trainers` affiliations.
- Manage a gym's `gym_plans` and `gym_plan_assignments` (assign a plan to a member
  account).

This same set of actions must also work from a **gym-scoped** view (a gym admin logging
in and seeing only their own `gym_id`'s data) — build the permission boundary now even
though, per §2, only the super admin will actually use it for a while.

> **NOTE FOR THE ADMIN-PANEL SESSION — added 2026-09-03, after this doc's initial
> handoff.** The "create a gym" flow needs a gym photo upload option. This is
> **two API calls, not one** — `POST /admin/gyms` (JSON, as already documented) creates
> the gym and returns its `id`; only then call `POST /admin/gyms/{gym_id}/photo`
> (`multipart/form-data`, field name `file`, image only — jpg/png/gif/webp, 5MB cap) to
> attach a photo. There is no `photo_url` field on the create/update JSON bodies — don't
> try to send it inline. The upload endpoint responds `{url, path}` and also updates
> `gyms.photo_url` server-side, so re-fetching the gym (`GET /admin/gyms/{gym_id}`) after
> upload will show the new `photo_url`. Auth is the same `require_gym_admin_user_id`
> gate as every other gym-scoped admin route. Build the "create gym" screen as: submit
> the form fields → on success, if a photo was selected, immediately upload it against
> the returned id → show the gym with its photo. Re-uploading on an existing gym (e.g.
> from an "edit gym" screen) replaces the photo the same way — same endpoint, no separate
> "update photo" route.

## 12. Frontend — Gym tab

- New bottom-tab or top-level section: **Gym**.
- **Nearby gyms**: list (and/or map — **ASSUMPTION**: list-first for v1, defer map view)
  sorted by distance using §3.1.
- **Gym detail page**, in this order:
  1. Equipment carousel (scrolling) — pulls from `gym_equipment` → `equipment_models`,
     shows brand/model name + photo.
  2. Amenities section (boxing, Zumba, steam bath, etc.) from `gym_amenities`.
  3. Trainer list (§8) — tappable, "ask for training" button gated to paid tier.
  4. Full equipment list at the bottom (same data as the carousel, exhaustive/listed
     form rather than carousel form).
- Members with an assigned `gym_plans` entry (§7) consume it the same way they consume
  a regular program today, logging into the same unified progress tracking.

> **NOTE FOR THE FRONTEND SESSION — added 2026-09-03, after this doc's initial
> handoff.** Gyms now carry an optional `photo_url` (plain https URL, publicly
> servable — no auth/signing needed to load it) on the `GymOut` shape returned by both
> `GET /gyms/nearby` and `GET /gyms/{gym_id}`. It's `null` for any gym the admin hasn't
> uploaded a photo for yet — render a placeholder/fallback in that case, don't assume
> it's always set. Suggested placement: a header image on the gym detail page (above the
> equipment carousel), and optionally a thumbnail on each row of the nearby-gyms list.
> Nothing else about the nearby-gyms/detail contracts changed — this is purely an added,
> nullable field.

## 12a. Gym gallery & walkthrough video (added 2026-09-07)

Decided in chat with the product owner (2026-09-07). Extends the gym detail page
(§12) with a **photo gallery** (multiple images, beyond the single `photo_url` hero
added 2026-09-03) and a **walkthrough video**. Both are additive — `gyms.photo_url`
is untouched and stays the hero image.

**Rationale (context for whoever builds this, not itself a requirement):** the
product owner doesn't want to grow Supabase Storage usage for this, so photos and
video are hosted on external free/cheap services instead of our own storage —
**Cloudinary** for gallery photos, **YouTube (unlisted)** for the walkthrough video.
Neither file ever touches our backend or Supabase Storage.

**New table `gym_gallery_photos`:**

| column | type | notes |
|---|---|---|
| id | uuid pk | |
| gym_id | uuid, fk `gyms` | |
| image_url | text | Cloudinary `secure_url` — publicly servable, no signing needed |
| cloudinary_public_id | text | Cloudinary's id for the asset; stored now even though nothing calls Cloudinary's delete API yet (see open item below) |
| position | int | display order in the gallery carousel |
| created_at | timestamptz | |

**New column:** `gyms.walkthrough_video_url` (text, nullable) — the raw YouTube URL
as pasted by the admin (unlisted video). **ASSUMPTION**: store it unvalidated/
unnormalized server-side; the video-ID extraction for embedding happens client-side.
Not a separate upload endpoint — just another field on the existing gym
create/update JSON body, since there's no file to relay.

**Upload mechanism (CONFIRMED with product owner):** Cloudinary **unsigned upload
preset** — restricted (image-only, size-capped, folder-locked per gym) and
configured directly in the Cloudinary dashboard, not via our backend. The admin
panel's browser uploads straight to Cloudinary's API using the preset name (which is
client-visible by design for unsigned uploads — the restriction is enforced
Cloudinary-side, not by secrecy) and gets `{secure_url, public_id}` back directly.
Our backend never sees the file, only the resulting URL/id pair — no signing
endpoint needed for this pass.

**New endpoints needed (admin panel, cookie auth, same gym-scoped permission model
as the rest of §11 — `require_gym_admin`/`require_super_admin_or_any_gym_admin`):**
- `POST /admin/gyms/{gym_id}/gallery` — JSON body `{image_url, cloudinary_public_id}`
  (not multipart — Cloudinary already has the file). Creates a `gym_gallery_photos`
  row, `position` = current max + 1.
- `DELETE /admin/gyms/{gym_id}/gallery/{photo_id}` — removes the row. **Open item,
  not decided**: this does not call Cloudinary's delete API in this pass, which
  leaves an orphaned asset in Cloudinary storage. Flag back to the product owner if
  that matters before building — if so, this endpoint needs Cloudinary API
  credentials backend-side to delete by `cloudinary_public_id`.
- Existing gym update endpoint (`PATCH /admin/gyms/{gym_id}`) gains
  `walkthrough_video_url` as an optional field on its JSON body.

**Member-facing read additions:**
- `GET /gyms/{gym_id}` (`GymOut`) gains `walkthrough_video_url: string | null` and
  `gallery_photos: {id, image_url, position}[]` (omit `cloudinary_public_id` from
  the member-facing shape — no reason to expose it outside the admin panel).
- **ASSUMPTION**: `GET /gyms/nearby` stays lean, unchanged — gallery/video are
  detail-page-only content, not needed in the list response.

**NOTE FOR THE ADMIN-PANEL SESSION:** needs (a) the Cloudinary cloud name + unsigned
preset name (non-secret, safe to hardcode/env in the admin panel) to call
Cloudinary's upload API directly from the browser, (b) a multi-image upload UI on
the gym edit screen — each upload calls `POST /admin/gyms/{gym_id}/gallery` with the
URL Cloudinary returns, (c) a plain text input for `walkthrough_video_url` on the
same form, (d) a delete button per gallery photo calling the `DELETE` endpoint
above.

**NOTE FOR THE FRONTEND SESSION (this session, not yet built):** gym detail page
(`app/gym/[gymId].tsx`) gets a horizontal gallery carousel (placed near the existing
hero image) and an embedded YouTube player (planned: `react-native-youtube-iframe`,
not yet a project dependency — pulls in `react-native-webview` as a peer dep) shown
only when `walkthrough_video_url` is non-null. Both sections hidden entirely when
empty — same graceful-degradation pattern already used for the nullable `photo_url`
hero (§12's 2026-09-03 note).

## 13. Explicitly out of scope for this pass

- Trainer booking/calendar/time-slot selection (§8).
- Any in-app payment (§9).
- QR attribution/referral tracking (§10).
- Auto-generated/algorithmic plan suggestions — plans are hand-built by a trainer/admin
  (§7).
- Gym reviews/ratings (not discussed — do not assume it's wanted).

## 14. Open items for whoever picks this up

*(All three resolved by the backend build — see §16's 2026-09-03 entry and the
CONFIRMED notes in §3.1/§7/§8 above.)*

- ~~Confirm the PostGIS/geo approach (§3.1) with the Supabase-owning session.~~ CONFIRMED.
- ~~Confirm the `PerformedWorkout` dual-FK approach for gym-plan set logging (§7) — this
  touches an existing table.~~ CONFIRMED.
- ~~Confirm the exact shape of the existing trainer pending-request mechanism (§8) before
  wiring "ask for training" into it, rather than assuming its schema.~~ CONFIRMED.

## 15. Build order / handoff sequence

This spec goes to three separate Claude sessions in **sequence, not parallel** —
backend, then admin panel, then frontend app — because each stage depends on real
output from the one before it:

1. **Backend session builds first.** Nothing else can meaningfully start until the
   tables (§3, §5, §6, §7, §8) and endpoints exist — the admin panel has nothing to
   build CRUD against, and the app has no real gyms to display, until this is done.
   Priority within backend: resolve the three items in §14 (geo approach, the
   `PerformedWorkout` dual-FK, the pending-request mechanism) as part of implementation,
   not before it — they're implementation details, not blockers to starting.

2. **Admin panel session builds second**, against the backend's actual finished
   endpoint contracts (not this spec's placeholder table/column names, which may shift
   slightly during backend implementation). Covers §11: gym CRUD, approve/reject
   self-signup, tier toggle, equipment/amenity catalog management, trainer affiliation
   management, plan + assignment management. **The admin panel is also how all real gym
   data gets entered** (§5 — the product owner is doing this manually for now), so at
   least one real gym should exist via the admin panel before frontend testing is
   meaningful.

3. **Frontend app session builds third** (§12 + §9's location handling), consuming the
   now-real backend endpoints and whatever test gym data exists from step 2. It can
   start UI scaffolding earlier against mocked data if useful, but end-to-end testing
   (nearby-gyms list, a real gym's equipment/amenities/trainers, requesting training,
   consuming an assigned plan) is only meaningful once steps 1 and 2 are live.

**How the doc moves between sessions**: the product owner manually shares this file
with each session in turn (no session should message another session directly about
this project). **Every session that implements part of this spec must update this same
file before handing off** — not just build silently and leave the doc stale. Two rules
for how to update it:
- If an **ASSUMPTION** in this doc turns out wrong or gets changed during
  implementation, edit that section in place and change the tag to
  **CONFIRMED** or **CHANGED (was: ...)** so the next session isn't working from a
  stale assumption.
- Add a dated entry to the implementation log below (§16) summarizing what was actually
  built, any table/column/endpoint names that ended up different from this spec's
  placeholders, and anything the next session in the chain needs to know. Keep entries
  short — this is a handoff note, not a changelog of every commit.

## 16. Implementation log

*(Each session appends here after finishing its part — do not delete prior entries.)*

### backend — 2026-09-03 — full backend build (§1–§10 tables/endpoints, §14 resolved)

Built and applied to the live Supabase project (`migrations_new_project/033`–`040`, next
number is `041`). Live-tested via direct SQL (test gym + test plan created and cleaned
up, zero rows left behind) — `nearby_gyms`, `create_gym_plan`, `update_gym_plan` all
verified working end-to-end, including cascade deletes through the whole plan tree.

**Tables** (all match this doc's placeholder names exactly, no renames):
`gyms` (+ generated `location geography(Point,4326)` from `lat`/`lng`), `gym_admins`,
`equipment_categories`, `equipment_models`, `gym_equipment` (added `UNIQUE(gym_id,
equipment_model_id)` — one row per model per gym, edited via `quantity`, not
duplicated), `amenities`, `gym_amenities`, `exercises.equipment_model_id` (nullable FK,
additive), `gym_plans`/`gym_plan_weeks`/`gym_plan_sessions`/`gym_plan_prescriptions`,
`gym_plan_assignments`, `gym_trainers` (FK's to `trainer_profiles`, not `profiles`).
`performed_workouts` gained nullable `gym_plan_session_id` + a 3-way `workout_source`
CHECK (`program|freeform|gym_plan`) — see §7's CONFIRMED note.

**RPCs**: `nearby_gyms(p_lat, p_lng, p_radius_km, p_equipment_category_id)`,
`create_gym_plan(...)`, `update_gym_plan(...)` — all mirror existing precedents
(`create_trainer_plan_library`/`update_trainer_plan`), reuse the existing unmodified
`find_or_create_exercise`.

**Endpoints**: new `app/routers/gyms.py` (member-facing, bearer auth) —
`GET /gyms/nearby`, `POST /gyms` (self-signup), `GET /gyms/{id}`,
`GET /gyms/{id}/equipment|amenities|trainers`,
`POST /gyms/{id}/trainers/{trainer_id}/ask-for-training`, `GET /client/gym-plans`,
`GET /gym-plans/{id}/days`. New `app/routers/admin_gyms.py` (admin panel, cookie auth,
prefix `/admin`) — full gym CRUD/approve/reject/suspend/tier-toggle, `gym_admins`
management (super-admin only), global equipment/amenity catalog CRUD (super-admin OR
any gym-admin), and gym-scoped equipment/amenity attach, trainer affiliation, gym-plan
CRUD, and assignment endpoints (super-admin OR that gym's `gym_admins`). Full endpoint
table is in the backend session's implementation plan, not duplicated here — read the
router files directly, they're the source of truth if anything here goes stale.

**Permission model**: `require_gym_admin(user_id, gym_id)` and
`require_super_admin_or_any_gym_admin(user_id)` in `app/services/gym_service.py` are the
two primitives. `profiles.role` is UNCHANGED (`client|trainer|admin`) — gym-admin access
is purely `gym_admins` table membership, checked in application code (this backend's
Supabase client is service-role and bypasses RLS entirely, same as every other table).

**Notable deviations from this doc's original placeholders**:
- `POST /gyms` (self-signup) lives in the member-facing bearer-auth router, not the
  admin-panel cookie-auth one — any authenticated app user can self-signup a gym listing
  (matches this doc's `owner_user_id` model). If the admin-panel or frontend session
  expected this elsewhere, flag it back here.
- Adding/removing `gym_admins` rows (`POST`/`DELETE /admin/gyms/{id}/admins[...]`) is
  **super-admin only**, not delegable to an existing gym admin — an existing gym admin
  self-escalating co-admins on their own gym is a privilege-escalation surface this doc
  doesn't address, and gym-admin isn't in active use yet (§2).
- `suspend_gym` (`live → suspended`) exists as an admin endpoint even though §11's
  bullet list didn't explicitly call it out — the `status` enum includes `suspended`
  with no stated transition path otherwise.
- A pure refactor unrelated to any behavior change: `programs_service.py`'s exercise/
  prescription embed-shaping helpers were extracted into a new shared
  `app/services/exercise_shaping.py` (also fixed `exercises_service.py`, which imported
  the old private names directly and would have broken) so `gym_plan_service.py` could
  reuse them instead of duplicating ~60 lines. `admin_service._log_admin_action` was
  renamed to `log_admin_action` (dropped the underscore) since `gym_service.py` now
  calls it too for the gym audit trail.
- PostGIS's `spatial_ref_sys` system table came back RLS-disabled on the security
  advisor after installing the extension. Enabling RLS on it failed (`must be owner of
  table` — it's owned by the extension, not the migration role) and was left as-is
  (it's static reference data, not user data) — a known Supabase+PostGIS limitation, not
  something introduced by application code. Worth knowing if the advisor flags it again.

**For the admin-panel session (next in the chain)**: the exact `require_gym_admin`/
`require_super_admin_or_any_gym_admin` semantics above determine which admin-panel
actions to show/hide per role — global catalog creation (equipment categories/models/
amenities) is available to any gym admin, not just super admin; everything else
gym-scoped requires that specific gym's `gym_admins` membership or super admin.

### backend — 2026-09-03 — follow-up: gym photo upload

Requested after the initial handoff. Added `gyms.photo_url` (nullable text,
`041_gym_photo.sql`), a new public storage bucket `gym-photos`, and
`POST /admin/gyms/{gym_id}/photo` (`multipart/form-data`, field `file`) in
`app/routers/admin_gyms.py`, reusing the existing `uploads_service.validate_and_read_image`
image-sniffing/size-limit helper (same one `POST /profile/me/avatar` uses) —
`gym_service.upload_gym_photo` uploads to Supabase Storage and updates `gyms.photo_url`
in one call, returning `{url, path}`. `photo_url` is now also in the `nearby_gyms` RPC's
return columns (required a `DROP FUNCTION`/`CREATE FUNCTION`, not `CREATE OR REPLACE`,
since its OUT-parameter list changed) and in `GymOut`/`AdminGymOut`. See the two
**NOTE FOR THE ADMIN-PANEL SESSION** / **NOTE FOR THE FRONTEND SESSION** callouts in
§11/§12 above for the exact integration contract — this is a two-call flow
(create-gym-then-upload-photo), not a field on the create/update JSON body. Verified via
`python -m` import/OpenAPI-schema build only for this follow-up (no live smoke test
re-run — the change is additive and structurally identical to the already-verified
avatar-upload pattern).

### frontend — 2026-09-03 — §12 Gym tab, plan browse, and full workout-execution wiring

Built in this repo (`C:/Projects/FitnessApp`). Verified against the live backend's actual
`/openapi.json` (not just this doc) before writing types — field names below are
confirmed live, not assumed.

**New**: `types/api.types.ts` (Gym/GymEquipment/GymAmenity/GymTrainer/GymPlan/
GymPlanWeek/GymPlanSession/GymPlanDayResponse types, `StartWorkoutInput`/`Workout`
widened for `gym_plan_session_id`/`'gym_plan'` source), `hooks/useGym.ts` (same
TanStack Query pattern as `hooks/useTrainer.ts`), a 6th bottom tab `app/(tabs)/gym.tsx`
(nearby list with foreground-only location per §3.1, graceful no-permission fallback,
"Your Plans" section), `app/gym/[gymId].tsx` (equipment carousel → amenities → trainers
w/ "Ask for training" → full equipment list, matching §12's order), `app/gym-plan/
[planId].tsx` (read-only week/session/exercise browse with a per-session "Start"
button). `app.json` gained the `expo-location` foreground-only plugin config
(`locationWhenInUsePermission`, no background permission).

**Workout execution reuse (not a stub)**: `app/workout/[dayIndex].tsx` — the app's
existing shared program/freeform execution screen — now also accepts an optional
`gymPlanId` route param. Traced every one of its 3 references to the Zustand
`program` store value before touching anything; when `gymPlanId` is present it fetches
via `fetchGymPlanDay` instead of `fetchProgramDay`, resolves `gym_plan_session_id`
instead of `session_id`, and calls `startWorkout({gym_plan_session_id})` accordingly
(same branch duplicated in the "resume stale in-progress workout" path). Everything
else — set logging (`app/workout/exercise.tsx`), the floating resume HUD, finish/
reset — reads only the generic `activeExercises`/`activeWorkoutId` store fields and
needed zero changes, confirmed by tracing every consumer, not assumed. This was
deliberately *not* done in the same pass as the rest of the tab (shipped read-only
first) — came back and wired it once asked to, specifically because it's the
highest-blast-radius single file in the app and warranted its own deliberate pass
rather than being rushed in with the rest.

**2026-09-03 follow-up — gym photo**: added `Gym.photo_url` to the type, rendered as a
background image on each `app/(tabs)/gym.tsx` nearby-gym card (`expo-image` absolutely
positioned behind the row + a left→right `expo-linear-gradient` dark overlay for text
legibility — same visual treatment `app/(tabs)/nutrition.tsx`'s preset cards already
use, `overflow:'hidden'` added to the card style so it clips to the rounded corners),
and as a hero image on `app/gym/[gymId].tsx` above the equipment carousel, per this
doc's §11/§12 photo-upload notes. Both fall back to the pre-photo look when
`photo_url` is null — never assumed non-null.

**Not built**: self-signup gym creation UI (browsing was the stated priority), and
the map-view alternative to the nearby-gyms list (§12 already flagged this as a
list-first-for-v1 ASSUMPTION — still stands).

**Unverified**: no on-device test was possible this session (no simulator/device
attached) — `npx tsc --noEmit` is clean project-wide and the code traces correctly
through every touched path, but the actual gym-plan start→log→finish flow and the
photo rendering haven't been eyeballed on a running app. First thing worth doing on
a device: assign a gym plan to a test account via the admin panel, then Start a
session from `app/gym-plan/[planId].tsx` end to end.

### frontend — 2026-09-07 — §12a gallery + walkthrough video

Verified `walkthrough_video_url`/`gallery_photos` field names directly against the
live backend's `/openapi.json` (not just this doc) before writing types — confirmed
live, matches this doc's §12a exactly, no deviations.

**New**: `lib/youtube.ts` (`extractYoutubeVideoId` — handles `watch?v=`, `youtu.be/`,
`embed/`, `shorts/` URL shapes, returns `null` on no match rather than throwing).
Added `react-native-youtube-iframe` + peer `react-native-webview` to `package.json`
(via `npx expo install`, SDK-54-compatible versions).

**Changed**: `types/api.types.ts` — `Gym` gained `walkthrough_video_url: string |
null` and `gallery_photos: GymGalleryPhoto[]` (new type: `{id, image_url,
position}`, deliberately omits `cloudinary_public_id` — member-facing app has no
use for it). `app/gym/[gymId].tsx` gained two new sections between the description
and Trainers: a `GalleryCarousel` (horizontal scroll of Cloudinary photos, sorted by
`position` client-side as a defensive measure) and `WalkthroughVideo` (embedded
`YoutubePlayer`, self-measures width via `onLayout` for a 16:9 player — same pattern
`EquipmentTypeBlock` already uses). Both sections render nothing when
empty/null/unparseable, matching the existing nullable-`photo_url` pattern.

**Not built / blocked on the admin panel**: there is no real gym with gallery
photos or a video URL yet, since the admin-panel session hasn't built the upload UI
(§12a's NOTE FOR THE ADMIN-PANEL SESSION) — this pass is type-checked
(`npx tsc --noEmit` clean) but **not** eyeballed on a running app. First thing worth
doing once the admin panel ships: upload a few gallery photos and a real unlisted
YouTube URL to a test gym, then open its detail page on a device to confirm the
carousel and player actually render/play.

### admin-panel — 2026-09-07 — §12a gallery + walkthrough video upload UI

Built in this repo (`C:/Projects/macroflux`). Confirmed the backend already had
`GET/POST /admin/gyms/{gym_id}/gallery`, `DELETE .../gallery/{photo_id}`, and
`walkthrough_video_url` on `AdminGymOut`/`AdminGymUpdateIn`/`AdminGymCreateIn` live
against the running backend's `/openapi.json` before writing any code — no
deviations from this doc's §12a contract (`GymGalleryPhotoIn` = `{image_url,
cloudinary_public_id}`, `AdminGalleryPhotoOut` adds `id`/`gym_id`/`position`/
`created_at`).

**New**: `src/cloudinaryClient.ts` — `uploadToCloudinary(file)` posts directly to
Cloudinary's unsigned upload API (`https://api.cloudinary.com/v1_1/{cloud_name}/image/upload`)
using `VITE_CLOUDINARY_CLOUD_NAME` + `VITE_CLOUDINARY_UPLOAD_PRESET` from `.env.local`
— no API key/secret in frontend code, deliberately (those are server-side-only and
irrelevant to an unsigned-preset flow; the account's key/secret were shared in chat
but not used here). `isCloudinaryConfigured()` gates the UI with a visible warning
when the preset env var is still blank, since **the unsigned preset does not exist
yet** — cloud name (`lteotohg`) is filled in, `VITE_CLOUDINARY_UPLOAD_PRESET` is a
placeholder pending the product owner creating one in the Cloudinary dashboard
(Unsigned mode, image-only, folder-locked per gym per this doc's §12a).

**Changed**: `src/adminService.ts` — `AdminGym`/`AdminGymCreatePayload`/
`AdminGymUpdatePayload` gained `walkthrough_video_url`; new `GymGalleryPhoto` type +
`listGymGallery`/`addGymGalleryPhoto`/`deleteGymGalleryPhoto`. `src/components/
GymDetailPanel.tsx`'s Info tab gained a plain text input for `walkthrough_video_url`
(saved via the existing `PATCH /admin/gyms/{id}` form, no new endpoint needed) and a
new `GalleryTab` section below it: thumbnail grid with a hover delete button per
photo, and a multi-file upload control that uploads each file to Cloudinary first,
then relays `{secure_url, public_id}` to the backend per file (sequential, not
parallel, so a partial-failure mid-batch leaves a clean prefix rather than a race).

**Not built**: the "restore/repair on partial upload failure" case (if Cloudinary
upload succeeds but the backend relay call fails, the photo exists in Cloudinary but
never gets a `gym_gallery_photos` row) — same orphan-risk shape as this doc's already-
flagged delete-side open item, not a new problem, not addressed here either.

**Blocked on product owner**: the Cloudinary unsigned upload preset itself doesn't
exist yet, so gallery upload is untestable end-to-end until one is created and
`VITE_CLOUDINARY_UPLOAD_PRESET` is filled in. `npx tsc --noEmit` and `npm run build`
are both clean; not eyeballed in a running browser this pass.


### admin-panel — 2026-11-10 — gym join codes + memberships UI

Built against the backend's 2026-11-10 "gym join codes + gym memberships" entry (that entry
lives in `FitnessAppBackend/GYM_MODULE_SPEC.md`; this copy of the doc never received it).
Endpoints/shapes checked against `app/routers/admin_gyms.py` + `app/schemas/gym_memberships.py`
— no deviations.

**New**: `src/components/GymMembersTab.tsx` — "Members & Code" tab in `GymDetailPanel`:
access-code card (generate / copy raw code / enable toggle / regenerate behind a confirm
dialog / printable poster in a pop-up window; free-tier, non-live and zero-General-plans
warnings; 409 `join_code_requires_paid_tier` mapped to the paid-tier message) and a
paginated (50), debounced-search members table with add (shared `UserPicker`, also now used
by `PlanAssignmentsModal`) and remove (404 treated as already removed). `src/dateFormat.ts`
— `formatDate`/`formatDateTime` for the IST offset-aware timestamps.

**Changed**: `src/apiClient.ts` throws `ApiError` (an `Error` subclass with `status`/`detail`,
same `message` as before). `AdminGym` gained `join_code`/`join_code_enabled`; `GymsPanel`
shows a Join code column (Active / Disabled / —).

**Not done**: there is still no gym-scoped (gym-admin) shell — `useAdminAuth` admits only
`role === 'admin'` — so the new tab is only reachable from the super-admin Gyms list; it
takes just the gym and renders 403s inline, so it drops into a gym-scoped view unchanged.
The "Add member" picker searches `getUsers(0, 100)` client-side (same limit as plan
assignments). Not exercised against a running backend (migration 054 not yet applied).
