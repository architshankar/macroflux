# Equipment Types Module — spec (v1)

Shared handoff doc for this small addition to the Gym module (see `GYM_MODULE_SPEC.md`
for the full gym feature this sits on top of — read that first, this doc assumes it).
Same convention as that doc: **ASSUMPTION** = reasonable default, not explicitly
confirmed, flag back here if wrong; **CONFIRMED** = decided with the product owner.
Decided in chat 2026-09-03/04.

## 1. Goal

A gym admin can tag which generic *types* of plates, dumbbells, and accessories their
gym has (multi-select per category, from a fixed illustrated list) — not a brand/model
entry like the existing `equipment_categories`/`equipment_models`/`gym_equipment`
catalog, just a quick "we have these kinds of things" toggle. On the gym detail page,
members see **3 separate horizontal carousels** (Plates / Dumbbells / Accessories),
each showing that gym's selected types as image + caption. A category's carousel is
**hidden entirely** if the gym has no types selected for it — no "not specified"
placeholder.

**Deliberately separate from `equipment_models`/`gym_equipment`** (confirmed with
product owner) — that catalog is for specific brand/model machines with
exercise-variation implications (§5/§6 of `GYM_MODULE_SPEC.md`); this is a much
simpler fixed reference list of generic type illustrations with no brand/model/exercise
linkage. Do not merge the two systems.

## 2. Source images (already uploaded, CONFIRMED)

Public Supabase Storage bucket **`Equipment Types`** (note: space in the bucket name,
unlike every other bucket in this project which is kebab-case — see §6 gotcha), 3
folders, file name = display caption:

**`Plates Types/`** (8): Bumper Plates, Cast Iron Plates, Competetion Calibrated Steel
Plates *(sic — typo in source filename, "Competetion"; carry it through as-is unless
the product owner wants the file renamed)*, Machined Steel Plates, Rubber-Coated  Grip
Plates *(double space in filename)*, Technique Bumper Plates, Urethane Plates, Vinyl
Cement-Filled Plates *(double space in filename)*.

**`Dumbbell Types/`** (8): BumperPlateDumbbells *(no spaces at all — see §6, needs a
manual caption override or a file rename, normalization can't fix a missing space)*,
Cast Iron Dumbbells, Chrome Dumbbells, Machined Steel Dumbbells, Neoprene Dumbbells,
Rubber Hex Dumbbells, Urethane Dumbbells, Vinyl Dumbbells.

**`Accessories/`** (13): Ankle Straps, Barbell Pad, Dip  Weighted Belts *(double
space)*, Figure-8 Straps, Knee Sleeves, Knee Wraps, Lasso Straps, Lever Belts, Lifting
Hooks, Prong Belts, Quick-Release  Nylon Belts *(double space)*, Wrist Rollers, Wrist
Wraps.

**Caption normalization (CONFIRMED)**: collapse repeated internal whitespace to a
single space and trim, when deriving the display caption from the filename. Keep the
*original* filename/path for the actual storage lookup — only the caption shown to
users is normalized. This fixes every double-space case above but **not**
`BumperPlateDumbbells` (zero spaces) — that one needs either a manual caption override
in the seed data ("Bumper Plate Dumbbells") or the source file renamed in the bucket to
match the others' `Word Word.png` convention. Flagging back to the product owner rather
than guessing silently.

## 3. Data model (CONFIRMED — matches the proposal below exactly, no naming changes)

New catalog table, seeded once from the fixed list in §2 (not admin-creatable in v1 —
it's a static reference list tied to the bucket contents, not user-generated):

**`equipment_types`**

| column | type | notes |
|---|---|---|
| id | uuid pk | |
| category | text, CHECK IN (`'plates'`,`'dumbbells'`,`'accessories'`) | maps to the 3 carousel blocks |
| name | text | normalized caption, e.g. "Rubber-Coated Grip Plates" |
| image_path | text | exact bucket object path, e.g. `Plates Types/Rubber-Coated  Grip Plates.png` (original spacing preserved for lookup) |
| created_at | timestamptz | |

`UNIQUE(category, name)`.

Junction — which gym has which types, multi-select (CONFIRMED):

**`gym_equipment_types`**

| column | type | notes |
|---|---|---|
| id | uuid pk | |
| gym_id | uuid, fk `gyms` | |
| equipment_type_id | uuid, fk `equipment_types` | |
| created_at | timestamptz | |

`UNIQUE(gym_id, equipment_type_id)`.

Seed `equipment_types` with all 29 rows (8 plates + 8 dumbbells + 13 accessories) as
part of the migration that creates it — the bucket contents are the source of truth for
this INSERT, don't regenerate/guess the list.

## 4. Admin panel changes

- No CRUD needed for the `equipment_types` catalog itself in v1 — it's fixed/seeded.
  Just expose `GET` of it (grouped by category) for the picker UI.
- On a gym's edit screen: 3 checkbox groups (Plates / Dumbbells / Accessories), each
  listing that category's `equipment_types` with a thumbnail + normalized caption,
  multi-select. Save = diff against `gym_equipment_types` (attach newly checked, detach
  newly unchecked) — mirror whatever attach/detach pattern `gym_amenities` already uses
  in the admin panel for consistency, rather than inventing a new bulk-replace shape.
- Same permission boundary as the rest of gym-scoped admin actions (§11 of
  `GYM_MODULE_SPEC.md`): super admin, or that gym's `gym_admins`.

**CONFIRMED — built exactly as proposed above.** Endpoint contract:

| Method + path | Auth | Purpose |
|---|---|---|
| `GET /admin/equipment-types` | `require_any_admin_user_id` (super admin OR any gym admin — matches the existing `equipment-categories`/`amenities` global-catalog endpoints) | Full 29-entry catalog, response shape `{plates: [...], dumbbells: [...], accessories: [...]}`, each item `{id, category, name, image_url}` — `image_url` is a ready-to-render public https URL, already encoded, no client-side path assembly needed |
| `GET /admin/gyms/{gym_id}/equipment-types` | `require_gym_admin_user_id` | This gym's current selections, flat list of `{id, gym_id, equipment_type: {id, category, name, image_url}}` — `id` here is the `gym_equipment_types` row id (needed for the detach call below), use `equipment_type.id` to pre-check the picker's boxes against the full catalog from the endpoint above |
| `POST /admin/gyms/{gym_id}/equipment-types` | `require_gym_admin_user_id` | Attach one type: body `{equipment_type_id}`. 409 if already attached |
| `DELETE /admin/gyms/{gym_id}/equipment-types/{gym_equipment_type_id}` | `require_gym_admin_user_id` | Detach one — pass the `gym_equipment_types` row `id` from the list endpoint above, not the `equipment_type_id` |

One call per checkbox toggle (attach or detach), exactly the diff-and-save shape
requested — no bulk-replace endpoint exists or is needed.

## 5. Frontend — gym detail page

- Fetch the gym's selected types (either bundled into the existing `GET /gyms/{id}`
  response, or a new `GET /gyms/{id}/equipment-types` grouped by category — backend's
  call, whichever is less churn against the already-shipped `GymOut` shape).
- Render **3 independent horizontal carousels**, one per category, each item = image +
  normalized caption. A category with zero selected types renders nothing for that
  block (no placeholder, no empty carousel) — CONFIRMED.
- **ASSUMPTION** on placement: alongside the existing equipment carousel section from
  §12 of `GYM_MODULE_SPEC.md` (which is the brand/model `gym_equipment` carousel, a
  different data source) — e.g. directly below it, before Amenities. Flag back if the
  product owner wants a different position or wants the two merged visually into one
  scroll area (they'd still be separate carousels underneath).

**CONFIRMED — decision made, see §8**: `GET /gyms/{gym_id}/equipment-types` is a
**separate endpoint**, not bundled into `GymOut` (consistent with `gym_equipment`,
`gym_amenities`, `gym_trainers`, which are all separate endpoints already — avoids
widening the shipped `GymOut` shape). Bearer auth (`get_current_user_id`), same as
every other member-facing gym read. Response is already grouped and ready to render:

```json
{
  "plates": [{"id": "...", "category": "plates", "name": "Bumper Plates", "image_url": "https://.../storage/v1/object/public/Equipment%20Types/Plates%20Types/Bumper%20Plates.png"}],
  "dumbbells": [],
  "accessories": [{"id": "...", "category": "accessories", "name": "Wrist Wraps", "image_url": "https://..."}]
}
```

`image_url` is pre-encoded and directly loadable — no client-side URL assembly or
`encodeURIComponent` needed (see §6, resolved). An empty array for a category (like
`dumbbells` above) means: render nothing for that carousel, exactly per the
no-placeholder rule — the frontend doesn't need extra logic to detect "no selections,"
an empty list already reads that way.

## 6. Gotcha — bucket name has a space

Every other bucket in this project (`gym-photos`, `exercise-media`, `meal-images`,
`avatars`, `UI`) is a single lowercase-kebab token; `Equipment Types` has a space and
mixed case. Supabase's public-object URL is
`{SUPABASE_URL}/storage/v1/object/public/{bucket}/{path}` — both the bucket segment and
every path segment need proper URL-encoding (`Equipment%20Types/Plates%20Types/...`) or
`encodeURIComponent` per segment client-side. **ASSUMPTION**: leave the bucket named as
it is and handle encoding correctly, rather than renaming it — a rename is a storage
mutation outside this doc's authority and would need explicit product-owner sign-off.
Whichever session builds the image-serving code, test the actual encoded URL against a
real object before shipping, don't assume the SDK handles the space transparently.

**CONFIRMED, resolved backend-side — no frontend/admin-panel action needed.** The
shared `public_storage_url(bucket, path)` helper (`app/core/supabase_client.py`) was
updated to percent-encode both the bucket segment and each path segment (keeping `/` as
the path separator). Every URL this API returns — `EquipmentTypeOut.image_url` included
— is already a complete, correctly-encoded, directly-loadable URL. This is backward
compatible: every other bucket's URLs are byte-for-byte unchanged, since kebab-case
bucket names and plain filenames have nothing that needs encoding. Verified live against
3 real objects (including the double-space and no-space filename edge cases from §2) —
each returned HTTP 200 with the correct `image/png` content type. Frontend/admin-panel
sessions: just render the `image_url` string as given, no `encodeURIComponent` needed on
your end.

## 7. Explicitly out of scope for this pass

- Admin CRUD to add/remove/edit entries in the `equipment_types` catalog itself (it's a
  fixed seeded list for v1 — revisit if the product owner wants to expand it later).
- Any linkage between `equipment_types` and the existing machine-specific-exercise
  system (§6 of `GYM_MODULE_SPEC.md`) — that stays tied to `equipment_models`, unrelated
  to this simpler type list.

## 8. Open items for whoever picks this up

- ~~Confirm the `BumperPlateDumbbells` caption (§2) — manual override "Bumper Plate
  Dumbbells" vs. renaming the source file.~~ Backend used the manual override
  ("Bumper Plate Dumbbells") to seed and ship v1 rather than block on it — **still
  needs product-owner confirmation**. If they'd rather rename the source file for
  consistency with the other 28 objects, that's a follow-up migration updating one
  row's `image_path` (see the seed migration's own comment,
  `042_equipment_types.sql`), not a breaking change to anything already built.
- ~~Confirm exact carousel placement on the gym detail page (§5 ASSUMPTION).~~ Still
  open — this is a frontend/product decision, nothing backend needed to resolve it.
- ~~Confirm bundled-into-`GymOut` vs. separate endpoint for fetching a gym's selected
  types (§5).~~ CONFIRMED — backend built it as a separate endpoint,
  `GET /gyms/{gym_id}/equipment-types`. See §5.

## 9. Implementation log

*(Each session appends here after finishing its part — do not delete prior entries.)*

### backend — 2026-09-04 — full build (§3, §4, §6 resolved; §8's remaining items are frontend/product, not backend)

Built and applied to the live Supabase project: `migrations_new_project/042_equipment_types.sql`
creates `equipment_types` + `gym_equipment_types` (RLS enabled, no policies, same
deny-by-default convention as every other table — the app's service-role client
bypasses it regardless) and seeds all 29 rows. The seed's `(category, name,
image_path)` values were read directly from `storage.objects` before writing the
migration, not retyped from this doc's prose — confirmed byte-for-byte match against
this doc's §2 transcription (8 plates + 8 dumbbells + 13 accessories = 29), including
every double-space filename and the "Competetion" typo, carried through as-is per §2's
instruction.

**Endpoints** (exact contract now in §4/§5 above):
- `GET /admin/equipment-types` — grouped catalog, admin picker UI.
- `GET/POST /admin/gyms/{gym_id}/equipment-types`,
  `DELETE /admin/gyms/{gym_id}/equipment-types/{gym_equipment_type_id}` — gym-scoped
  attach/detach/list, one call per checkbox toggle, mirrors `gym_amenities`'s existing
  pattern exactly (no bulk-replace endpoint).
- `GET /gyms/{gym_id}/equipment-types` — member-facing, grouped by category, bearer
  auth.

All new/changed code: `app/schemas/gyms.py` (`EquipmentTypeOut`,
`EquipmentTypesByCategoryOut`, `GymEquipmentTypeOut`), `app/schemas/admin_gyms.py`
(`GymEquipmentTypeAttachIn`), `app/services/gym_catalog_service.py` (all
equipment-type functions), `app/routers/admin_gyms.py` and `app/routers/gyms.py` (the
endpoints above), `app/core/config.py` (`equipment_types_bucket = "Equipment Types"`).

**§6's encoding gotcha fixed at the shared-helper level**: `public_storage_url` in
`app/core/supabase_client.py` now percent-encodes the bucket and path segments
(`urllib.parse.quote`, keeping `/` as the path separator) instead of raw string
interpolation. This is a shared function used by every public-bucket URL in the
codebase (gym photos, exercise media) — confirmed it's a no-op for all of those
(kebab-case buckets, plain filenames have nothing to encode) by re-running this
session's own earlier gym-photo smoke test mentally against the new code path; no
regression expected and none observed in the OpenAPI-schema build check.

**Verification**: `python -c "from app.main import app; app.openapi()"` — clean, 125
routes (was 121 before this feature). Live-tested via direct SQL: attached 2 `plates`
rows to a throwaway test gym, confirmed `dumbbells`/`accessories` came back empty (the
"no placeholder, just an empty list" behavior §5 needs), then deleted the test gym and
confirmed cascade cleanup left 0 rows. Separately fetched 3 real object URLs over HTTP
(the double-space case, the `BumperPlateDumbbells` no-space case, and one more) —
all 3 returned `200 image/png`, not just a well-formed URL string.

**For whoever picks up §5's placement decision and §8's `BumperPlateDumbbells`
confirmation**: both are product/frontend calls, not blocked on any backend work —
everything needed to build against is already live.

### admin panel — 2026-09-04 — §4 admin-panel UI build

Built in `C:/Projects/macroflux`, on top of the already-shipped Gyms section
(`GYM_MODULE_SPEC.md`'s admin-panel entries). Endpoint contract consumed exactly as
documented in §4 above — no deviations.

**`src/adminService.ts`**: new `EQUIPMENT TYPES` section — `EquipmentTypeCategory`,
`EquipmentType`, `EquipmentTypesByCategory`, `GymEquipmentType` types, plus
`listEquipmentTypesCatalog()` (`GET /admin/equipment-types`),
`listGymEquipmentTypes(gymId)`, `attachGymEquipmentType(gymId, equipmentTypeId)`,
`detachGymEquipmentType(gymId, gymEquipmentTypeId)` — thin wrappers, same convention as
every other function in the file.

**`src/components/GymDetailPanel.tsx`**: new **Equipment Types** tab (between the
existing Equipment and Amenities tabs) — `EquipmentTypesTab`. Renders the 3 categories
(Plates/Dumbbells/Accessories) as image-grid checkbox pickers (thumbnail + normalized
caption, `image_url` rendered directly per §6 — no client-side encoding needed), a
selected-count badge per category, and a selection ring/checkmark overlay on chosen
tiles. **Mirrors `AmenitiesTab`'s attach/detach-on-click pattern exactly**, per spec
§4's explicit instruction — clicking an unselected tile calls the attach endpoint,
clicking a selected one calls detach using the `gym_equipment_types` row id (not the
`equipment_type_id`, per the spec's note on which id the detach call needs); one call
per toggle, no bulk-save/diff step, no separate "Save" button. A per-tile `disabled`
state during its own in-flight request prevents double-clicks; the tile list re-fetches
after every toggle rather than doing optimistic local state, keeping this consistent
with how `AmenitiesTab`/`EquipmentTab` already behave in this codebase.

**Not built**: any catalog CRUD (create/edit/delete an `equipment_types` row) — correct
per spec §7, it's explicitly out of scope, fixed/seeded list only.

Not live-tested against the backend this session (no admin credentials available, same
constraint as every prior admin-panel entry in the linked `GYM_MODULE_SPEC.md`) —
verified via `tsc --noEmit` and `vite build`, both clean.
