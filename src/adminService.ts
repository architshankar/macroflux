import { apiClient, API_BASE_URL } from './apiClient';
import { UserAccount } from './types';

export interface AdminMetrics {
  totalUsers: number;
  activeWorkoutsToday: number;
  premiumSubscriberRatio: number;
  pendingTrainerApplications: number;
  activeTrainerRelationships: number;
  libraryProgramsCount: number;
  pendingNotificationBlasts: number;
}

export async function getAdminMetrics(): Promise<AdminMetrics> {
  const m = await apiClient.get<{
    total_users: number;
    active_workouts_today: number;
    premium_subscriber_ratio: number;
    pending_trainer_applications: number;
    active_trainer_relationships: number;
    library_programs_count: number;
    pending_notification_blasts: number;
  }>('/admin/metrics');

  return {
    totalUsers: m.total_users,
    activeWorkoutsToday: m.active_workouts_today,
    premiumSubscriberRatio: m.premium_subscriber_ratio,
    pendingTrainerApplications: m.pending_trainer_applications,
    activeTrainerRelationships: m.active_trainer_relationships,
    libraryProgramsCount: m.library_programs_count,
    pendingNotificationBlasts: m.pending_notification_blasts,
  };
}

export async function getUsers(page: number = 0, pageSize: number = 20): Promise<{ users: UserAccount[], total: number }> {
  const data = await apiClient.get<{ users: any[]; total: number }>(
    `/admin/users?page=${page}&page_size=${pageSize}`
  );

  const users: UserAccount[] = data.users.map((profile: any) => ({
    id: profile.id,
    name: profile.full_name || 'Unknown',
    email: profile.email || 'OAuth Login',
    registrationDate: profile.updated_at || new Date().toISOString(),
    lastActiveWorkout: profile.last_active_workout || 'N/A',
    status: profile.status || 'active',
    workoutsCount: profile.workouts_count || 0,
    caloriesBudget: profile.target_calories ? `${profile.target_calories} kcal` : '2500 kcal',
    durationMins: 0, // profile.duration_mins never existed in the schema — was already always undefined
    subscription_tier: profile.subscription_tier || 'free',
  }));

  return { users, total: data.total };
}

export async function updateUserSubscription(userId: string, subscription: 'free' | 'premium'): Promise<void> {
  await apiClient.patch(`/admin/users/${userId}/subscription`, { subscription_tier: subscription });
}

export async function toggleSuspendUser(userId: string, _currentStatus: string): Promise<void> {
  // _currentStatus kept in the signature so AdminDashboard.tsx's call site
  // doesn't need to change, but it's ignored — the backend re-reads status
  // from the DB itself rather than trusting a client-supplied value.
  await apiClient.post(`/admin/users/${userId}/toggle-suspend`);
}

export async function updateSystemConfig(configKey: string, configValue: any): Promise<void> {
  await apiClient.put(`/admin/config/${configKey}`, { value: configValue });
}

export async function getConfig(): Promise<Record<string, any>> {
  return apiClient.get('/admin/config');
}

export async function sendNotificationBlast(title: string, body: string, targetTier: string): Promise<void> {
  await apiClient.post('/admin/notifications', { title, body, target_tier: targetTier });
}

export async function getNotificationBlasts(): Promise<any[]> {
  return apiClient.get('/admin/notifications');
}

export async function getUserWorkouts(userId: string): Promise<any[]> {
  return apiClient.get(`/admin/users/${userId}/workouts`);
}

export async function deleteWorkout(workoutId: string): Promise<void> {
  await apiClient.delete(`/admin/workouts/${workoutId}`);
}

export async function updateWorkout(workoutId: string, updates: { performed_at?: string, user_summary_notes?: string }): Promise<void> {
  await apiClient.patch(`/admin/workouts/${workoutId}`, updates);
}

export async function deleteWorkoutSet(setId: string): Promise<void> {
  await apiClient.delete(`/admin/workout-sets/${setId}`);
}

// =====================================================================
// TRAINERS
// =====================================================================
export interface AdminTrainer {
  id: string;
  full_name: string | null;
  email: string | null;
  bio: string | null;
  specialties: string[];
  headline: string | null;
  years_experience: number | null;
  created_at: string | null;
  is_verified: boolean;
  bio_hidden: boolean;
}

export async function getAllTrainers(): Promise<AdminTrainer[]> {
  return apiClient.get('/admin/trainers');
}

export async function createTrainerAccount(payload: {
  email: string;
  password: string;
  full_name?: string;
  bio?: string;
  specialties?: string[];
}): Promise<AdminTrainer> {
  return apiClient.post('/admin/trainers', payload);
}

export async function verifyTrainer(trainerId: string): Promise<void> {
  await apiClient.post(`/admin/trainers/${trainerId}/verify`);
}

export async function rejectTrainer(trainerId: string): Promise<void> {
  await apiClient.post(`/admin/trainers/${trainerId}/reject`);
}

export async function revokeTrainer(trainerId: string): Promise<void> {
  await apiClient.post(`/admin/trainers/${trainerId}/revoke`);
}

export async function deleteTrainerAccount(trainerId: string): Promise<void> {
  await apiClient.delete(`/admin/trainers/${trainerId}`);
}

export async function setTrainerBioHidden(trainerId: string, hidden: boolean): Promise<void> {
  await apiClient.patch(`/admin/trainers/${trainerId}/bio-hidden`, { bio_hidden: hidden });
}

// =====================================================================
// TRAINER-CLIENT RELATIONSHIPS
// =====================================================================
export interface TrainerClientRelationship {
  id: string;
  trainer_id: string;
  client_id: string;
  status: string;
  trainer_full_name: string | null;
  client_full_name: string | null;
  started_at: string | null;
  ended_at: string | null;
  created_at: string;
}

export async function getTrainerClientRelationships(): Promise<TrainerClientRelationship[]> {
  return apiClient.get('/admin/trainer-clients');
}

export async function forceCancelRelationship(relationshipId: string): Promise<void> {
  await apiClient.post(`/admin/trainer-clients/${relationshipId}/force-cancel`);
}

// =====================================================================
// EXERCISE LIBRARY
// =====================================================================
export interface AdminExercise {
  id: string;
  name: string;
  tutorial_url: string | null;
  tracking_type: string;
  is_unilateral: boolean;
  muscle_group: string | null;
  is_retired: boolean;
}

export async function getAdminExercises(
  search: string = '',
  page: number = 0,
  pageSize: number = 20
): Promise<{ exercises: AdminExercise[]; total: number }> {
  const params = new URLSearchParams({ page: String(page), page_size: String(pageSize) });
  if (search) params.set('search', search);
  return apiClient.get(`/admin/exercises?${params.toString()}`);
}

export async function createExercise(payload: {
  name: string;
  tutorial_url?: string | null;
  tracking_type?: string;
  is_unilateral?: boolean;
  muscle_group?: string | null;
}): Promise<AdminExercise> {
  return apiClient.post('/admin/exercises', payload);
}

export async function updateExercise(exerciseId: string, updates: Partial<AdminExercise>): Promise<AdminExercise> {
  return apiClient.patch(`/admin/exercises/${exerciseId}`, updates);
}

// =====================================================================
// EXERCISE MEDIA MATCHING
// =====================================================================
export interface ExerciseMedia {
  id: string;
  source_name: string;
  body_part: string | null;
  equipment: string | null;
  muscle_group: string | null;
  target: string | null;
  image_path: string;
  gif_path: string;
  image_url: string | null;
  gif_url: string | null;
}

export async function getExerciseMedia(search: string = '', page: number = 0): Promise<{ media: ExerciseMedia[]; total: number }> {
  const params = new URLSearchParams({ page: String(page), page_size: '24' });
  // Single free-text box in the UI maps to whichever facet looks like a match;
  // body_part is the most commonly useful one, so that's what search targets.
  if (search) params.set('body_part', search);
  return apiClient.get(`/admin/exercise-media?${params.toString()}`);
}

export async function matchExerciseMedia(exerciseId: string, mediaId: string): Promise<AdminExercise> {
  return apiClient.post(`/admin/exercises/${exerciseId}/media-match`, { media_id: mediaId });
}

// =====================================================================
// PROGRAM LIBRARY / FEATURED
// =====================================================================
export interface AdminProgram {
  id: string;
  title: string;
  description: string | null;
  plan_style: string | null;
  total_weeks: number;
  is_featured: boolean;
  // false = hidden from the app catalog, day fetches and new trainer assignments (056)
  is_enabled: boolean;
}

export async function getAdminPrograms(): Promise<{ programs: AdminProgram[]; total: number }> {
  return apiClient.get('/admin/programs?page=0&page_size=100');
}

export async function setProgramEnabled(programId: string, enabled: boolean): Promise<{ is_enabled: boolean }> {
  return apiClient.patch(`/admin/programs/${programId}/enabled`, { enabled });
}

export async function toggleFeatureProgram(programId: string): Promise<{ is_featured: boolean }> {
  return apiClient.patch(`/admin/programs/${programId}/feature`);
}

// =====================================================================
// PROGRAM UPLOAD
// =====================================================================
// Signature change from before: no onProgress callback. The old function
// did 6 sequential, non-transactional Supabase writes with incremental
// progress messages; the backend now does this as one atomic RPC call
// (POST /admin/programs/upload -> create_shared_program), so there are no
// real incremental steps left to report.
export async function uploadProgramMigration(programData: any): Promise<void> {
  await apiClient.post('/admin/programs/upload', programData);
}

// =====================================================================
// GYMS — GYM_MODULE_SPEC.md §11
// =====================================================================
export interface AdminGym {
  id: string;
  owner_user_id: string | null;
  name: string;
  description: string | null;
  address: string;
  lat: number | null;
  lng: number | null;
  city: string | null;
  phone: string | null;
  tier: 'free' | 'paid';
  status: 'pending_review' | 'live' | 'rejected' | 'suspended';
  source: 'admin_added' | 'self_signup';
  photo_url: string | null;
  walkthrough_video_url: string | null;
  // Admin-only (AdminGymOut) — the member-facing GymOut never carries these.
  join_code: string | null;
  join_code_enabled: boolean;
  created_at: string;
  updated_at: string;
}

export interface AdminGymCreatePayload {
  name: string;
  description?: string | null;
  address: string;
  lat?: number | null;
  lng?: number | null;
  city?: string | null;
  phone?: string | null;
  owner_user_id?: string | null;
  walkthrough_video_url?: string | null;
}

export interface AdminGymUpdatePayload {
  name?: string;
  description?: string | null;
  address?: string;
  lat?: number | null;
  lng?: number | null;
  city?: string | null;
  phone?: string | null;
  walkthrough_video_url?: string | null;
}

export async function listGymsAdmin(filters: { status?: string; tier?: string; source?: string } = {}): Promise<AdminGym[]> {
  const params = new URLSearchParams();
  if (filters.status) params.set('status', filters.status);
  if (filters.tier) params.set('tier', filters.tier);
  if (filters.source) params.set('source', filters.source);
  const qs = params.toString();
  return apiClient.get(`/admin/gyms${qs ? `?${qs}` : ''}`);
}

export async function createGymAdmin(payload: AdminGymCreatePayload): Promise<AdminGym> {
  return apiClient.post('/admin/gyms', payload);
}

export async function getGymAdmin(gymId: string): Promise<AdminGym> {
  return apiClient.get(`/admin/gyms/${gymId}`);
}

export async function updateGymAdmin(gymId: string, payload: AdminGymUpdatePayload): Promise<AdminGym> {
  return apiClient.patch(`/admin/gyms/${gymId}`, payload);
}

export async function approveGym(gymId: string): Promise<AdminGym> {
  return apiClient.post(`/admin/gyms/${gymId}/approve`);
}

export async function rejectGym(gymId: string): Promise<AdminGym> {
  return apiClient.post(`/admin/gyms/${gymId}/reject`);
}

export async function suspendGym(gymId: string): Promise<AdminGym> {
  return apiClient.post(`/admin/gyms/${gymId}/suspend`);
}

export async function toggleGymTier(gymId: string): Promise<AdminGym> {
  return apiClient.patch(`/admin/gyms/${gymId}/tier`);
}

// --- Gym gallery (spec §12a) — Cloudinary hosts the file, we only store the URL/id ---
export interface GymGalleryPhoto {
  id: string;
  gym_id: string;
  image_url: string;
  cloudinary_public_id: string;
  position: number;
  created_at: string;
}

export async function listGymGallery(gymId: string): Promise<GymGalleryPhoto[]> {
  return apiClient.get(`/admin/gyms/${gymId}/gallery`);
}

export async function addGymGalleryPhoto(
  gymId: string,
  payload: { image_url: string; cloudinary_public_id: string }
): Promise<GymGalleryPhoto> {
  return apiClient.post(`/admin/gyms/${gymId}/gallery`, payload);
}

export async function deleteGymGalleryPhoto(gymId: string, photoId: string): Promise<void> {
  await apiClient.delete(`/admin/gyms/${gymId}/gallery/${photoId}`);
}

// Multipart upload — bypasses apiClient (which always sends JSON) since this
// needs a browser-set multipart/form-data boundary. Two-call flow per
// GYM_MODULE_SPEC.md §11: create the gym first, then upload its photo against
// the returned id. Re-uploading on an existing gym replaces the photo (same
// endpoint, no separate "update photo" route).
export async function uploadGymPhoto(gymId: string, file: File): Promise<{ url: string; path: string }> {
  const formData = new FormData();
  formData.append('file', file);
  const res = await fetch(`${API_BASE_URL}/admin/gyms/${gymId}/photo`, {
    method: 'POST',
    credentials: 'include',
    headers: {
      'ngrok-skip-browser-warning': 'true',
    },
    body: formData,
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.detail || `Request failed: ${res.status}`);
  }
  return res.json();
}

// --- Gym admins (gym_admins junction — super-admin only to add/remove) ---
export interface GymAdminRow {
  id: string;
  gym_id: string;
  user_id: string;
  role: 'owner' | 'staff';
  created_at: string;
  email: string | null;
  full_name: string | null;
}

export async function listGymAdmins(gymId: string): Promise<GymAdminRow[]> {
  return apiClient.get(`/admin/gyms/${gymId}/admins`);
}

export async function addGymAdmin(gymId: string, payload: { user_id: string; role?: 'owner' | 'staff' }): Promise<GymAdminRow> {
  return apiClient.post(`/admin/gyms/${gymId}/admins`, payload);
}

// Super-admin only: creates a pre-confirmed email/password login and makes it
// this gym's admin. 409 if the email is already registered (link by user ID instead).
export async function createGymManagerAccount(
  gymId: string,
  payload: { email: string; password: string; full_name?: string | null; role: 'owner' | 'staff' }
): Promise<GymAdminRow> {
  return apiClient.post(`/admin/gyms/${gymId}/admins/account`, payload);
}

export async function removeGymAdmin(gymId: string, userId: string): Promise<void> {
  await apiClient.delete(`/admin/gyms/${gymId}/admins/${userId}`);
}

// --- Equipment / amenity catalog (shared/reusable across gyms — spec §5) ---
export interface EquipmentCategory {
  id: string;
  name: string;
}

export interface EquipmentModel {
  id: string;
  category_id: string;
  category_name: string;
  brand: string;
  model_name: string;
  photo_url: string | null;
}

export interface AmenityIcon {
  id: string;
  name: string;
  image_url: string | null;
}

export interface Amenity {
  id: string;
  name: string;
  icon: AmenityIcon | null;
}

export async function listEquipmentCategories(search?: string): Promise<EquipmentCategory[]> {
  const qs = search ? `?search=${encodeURIComponent(search)}` : '';
  return apiClient.get(`/admin/equipment-categories${qs}`);
}

export async function createEquipmentCategory(name: string): Promise<EquipmentCategory> {
  return apiClient.post('/admin/equipment-categories', { name });
}

export async function listEquipmentModels(search?: string, categoryId?: string): Promise<EquipmentModel[]> {
  const params = new URLSearchParams();
  if (search) params.set('search', search);
  if (categoryId) params.set('category_id', categoryId);
  const qs = params.toString();
  return apiClient.get(`/admin/equipment-models${qs ? `?${qs}` : ''}`);
}

export async function createEquipmentModel(payload: {
  category_id: string;
  brand: string;
  model_name: string;
  photo_url?: string | null;
}): Promise<EquipmentModel> {
  return apiClient.post('/admin/equipment-models', payload);
}

export async function listAmenityCatalog(search?: string): Promise<Amenity[]> {
  const qs = search ? `?search=${encodeURIComponent(search)}` : '';
  return apiClient.get(`/admin/amenities${qs}`);
}

export async function createAmenityCatalog(name: string, iconId?: string | null): Promise<Amenity> {
  return apiClient.post('/admin/amenities', { name, icon_id: iconId || undefined });
}

export async function updateAmenityCatalog(
  amenityId: string,
  payload: { name?: string; icon_id?: string | null }
): Promise<Amenity> {
  return apiClient.patch(`/admin/amenities/${amenityId}`, payload);
}

// --- Amenity icon library (not gym-scoped, shared across all amenities) ---
export async function listAmenityIcons(): Promise<AmenityIcon[]> {
  return apiClient.get('/admin/amenity-icons');
}

export async function createAmenityIcon(name: string): Promise<AmenityIcon> {
  return apiClient.post('/admin/amenity-icons', { name });
}

// Multipart upload — same create-then-upload shape as uploadGymPhoto above.
// Re-uploading on an existing icon replaces its image.
export async function uploadAmenityIconPhoto(iconId: string, file: File): Promise<{ url: string; path: string }> {
  const formData = new FormData();
  formData.append('file', file);
  const res = await fetch(`${API_BASE_URL}/admin/amenity-icons/${iconId}/photo`, {
    method: 'POST',
    credentials: 'include',
    headers: {
      'ngrok-skip-browser-warning': 'true',
    },
    body: formData,
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.detail || `Request failed: ${res.status}`);
  }
  return res.json();
}

// --- Gym-scoped equipment / amenities ---
export interface GymEquipment {
  id: string;
  gym_id: string;
  quantity: number | null;
  photo_url: string | null;
  equipment_model: EquipmentModel;
}

export interface GymAmenity {
  id: string;
  gym_id: string;
  amenity: Amenity;
}

export async function listGymEquipment(gymId: string): Promise<GymEquipment[]> {
  return apiClient.get(`/admin/gyms/${gymId}/equipment`);
}

export async function attachGymEquipment(
  gymId: string,
  payload: { equipment_model_id: string; quantity?: number | null; photo_url?: string | null }
): Promise<GymEquipment> {
  return apiClient.post(`/admin/gyms/${gymId}/equipment`, payload);
}

export async function updateGymEquipment(
  gymId: string,
  gymEquipmentId: string,
  payload: { quantity?: number | null; photo_url?: string | null }
): Promise<GymEquipment> {
  return apiClient.patch(`/admin/gyms/${gymId}/equipment/${gymEquipmentId}`, payload);
}

export async function detachGymEquipment(gymId: string, gymEquipmentId: string): Promise<void> {
  await apiClient.delete(`/admin/gyms/${gymId}/equipment/${gymEquipmentId}`);
}

export async function listGymAmenities(gymId: string): Promise<GymAmenity[]> {
  return apiClient.get(`/admin/gyms/${gymId}/amenities`);
}

export async function attachGymAmenity(gymId: string, amenityId: string): Promise<GymAmenity> {
  return apiClient.post(`/admin/gyms/${gymId}/amenities`, { amenity_id: amenityId });
}

export async function detachGymAmenity(gymId: string, gymAmenityId: string): Promise<void> {
  await apiClient.delete(`/admin/gyms/${gymId}/amenities/${gymAmenityId}`);
}

// --- Gym trainer affiliation (spec §8) ---
export interface GymTrainerAffiliation {
  id: string;
  gym_id: string;
  status: 'active' | 'inactive';
  affiliated_at: string;
  trainer: {
    id: string;
    full_name: string | null;
    avatar_url: string | null;
    bio: string | null;
    specialties: string[];
    is_verified: boolean;
    headline: string | null;
    years_experience: number | null;
  };
}

export async function listGymTrainers(gymId: string, status: string = 'active'): Promise<GymTrainerAffiliation[]> {
  return apiClient.get(`/admin/gyms/${gymId}/trainers?status=${encodeURIComponent(status)}`);
}

export async function affiliateGymTrainer(gymId: string, trainerId: string): Promise<GymTrainerAffiliation> {
  return apiClient.post(`/admin/gyms/${gymId}/trainers`, { trainer_id: trainerId });
}

export async function setGymTrainerStatus(
  gymId: string,
  gymTrainerId: string,
  status: 'active' | 'inactive'
): Promise<GymTrainerAffiliation> {
  return apiClient.patch(`/admin/gyms/${gymId}/trainers/${gymTrainerId}`, { status });
}

// --- Gym plans (spec §7 — separate table set from programs, same tree shape) ---
export interface GymPlanSubstitutionIn {
  name: string;
  tutorial_url?: string | null;
  tracking_type?: string;
  is_unilateral?: boolean;
  muscle_group?: string | null;
}

export interface GymPlanPrescription {
  id?: string;
  exercise_name: string;
  tutorial_url?: string | null;
  tracking_type?: string;
  is_unilateral?: boolean;
  muscle_group?: string | null;
  sequence_order?: number | null;
  warm_up_sets?: number | string | null;
  working_sets?: number | string | null;
  target_reps?: string | null;
  target_reps_left?: string | null;
  target_reps_right?: string | null;
  early_set_rpe?: number | null;
  last_set_rpe?: number | null;
  rest_time?: string | null;
  intensity_technique?: string | null;
  prescription_notes?: string | null;
  substitutions?: GymPlanSubstitutionIn[];
}

export interface GymPlanSession {
  id?: string;
  session_number: number;
  session_label?: string | null;
  prescriptions: GymPlanPrescription[];
}

export interface GymPlanWeek {
  id?: string;
  week_number: number;
  block_number?: number | null;
  block_label?: string | null;
  is_deload?: boolean;
  sessions: GymPlanSession[];
}

export interface GymPlan {
  id: string;
  gym_id: string;
  created_by_user_id: string | null;
  type: 'general' | 'user_specific';
  title: string;
  description: string | null;
  total_weeks: number | null;
  // false = hidden from members (assigned + membership); nothing is deleted
  is_enabled: boolean;
  weeks: GymPlanWeek[];
}

export interface GymPlanCreatePayload {
  type: 'general' | 'user_specific';
  title: string;
  description?: string | null;
  total_weeks?: number | null;
  weeks: GymPlanWeek[];
}

export interface GymPlanUpdatePayload {
  title: string;
  description?: string | null;
  total_weeks?: number | null;
  weeks: GymPlanWeek[];
}

export interface GymPlanAssignment {
  id: string;
  gym_plan_id: string;
  user_id: string;
  assigned_by_user_id: string | null;
  assigned_at: string;
}

export interface GymPlanExerciseOption {
  id: string;
  name: string;
  tutorial_url: string | null;
  tracking_type: string;
  is_unilateral: boolean;
  muscle_group: string | null;
  equipment_model_id: string | null;
}

export async function listGymPlans(gymId: string): Promise<GymPlan[]> {
  return apiClient.get(`/admin/gyms/${gymId}/plans`);
}

export async function createGymPlan(gymId: string, payload: GymPlanCreatePayload): Promise<GymPlan> {
  return apiClient.post(`/admin/gyms/${gymId}/plans`, payload);
}

export async function updateGymPlan(gymId: string, planId: string, payload: GymPlanUpdatePayload): Promise<GymPlan> {
  return apiClient.put(`/admin/gyms/${gymId}/plans/${planId}`, payload);
}

export async function setGymPlanEnabled(gymId: string, planId: string, enabled: boolean): Promise<GymPlan> {
  return apiClient.patch(`/admin/gyms/${gymId}/plans/${planId}/enabled`, { enabled });
}

export async function deleteGymPlan(gymId: string, planId: string): Promise<void> {
  await apiClient.delete(`/admin/gyms/${gymId}/plans/${planId}`);
}

export async function listGymPlanAssignments(gymId: string, planId: string): Promise<GymPlanAssignment[]> {
  return apiClient.get(`/admin/gyms/${gymId}/plans/${planId}/assignments`);
}

export async function assignGymPlan(gymId: string, planId: string, userId: string): Promise<GymPlanAssignment> {
  return apiClient.post(`/admin/gyms/${gymId}/plans/${planId}/assignments`, { user_id: userId });
}

export async function unassignGymPlan(gymId: string, planId: string, assignmentId: string): Promise<void> {
  await apiClient.delete(`/admin/gyms/${gymId}/plans/${planId}/assignments/${assignmentId}`);
}

export async function listGymPlanExercises(gymId: string, search?: string): Promise<GymPlanExerciseOption[]> {
  const qs = search ? `?search=${encodeURIComponent(search)}` : '';
  return apiClient.get(`/admin/gyms/${gymId}/plan-exercises${qs}`);
}

// --- Gym join code & memberships (GYM_MODULE_SPEC.md §16, 2026-11-10 entry) ---
// Timestamps are offset-aware ISO strings in IST (+05:30) — parse with
// new Date(iso) (honours the offset) and format via ./dateFormat.
export const JOIN_CODE_REQUIRES_PAID_TIER = 'join_code_requires_paid_tier';

export interface GymJoinCode {
  code: string | null; // null until the first regenerate
  enabled: boolean;
  updated_at: string | null;
  member_count: number; // all members (code + admin-added)
  code_member_count: number; // only those who joined with the code
}

export interface GymMember {
  user_id: string;
  full_name: string | null;
  email: string | null;
  avatar_url: string | null;
  joined_via: 'code' | 'admin';
  joined_at: string;
}

export interface GymMemberList {
  items: GymMember[];
  total: number;
}

// Gyms the logged-in user manages (gym_admins rows) — gym-manager login landing.
export interface MyAdminGym {
  id: string;
  name: string;
  city: string | null;
  address: string;
  photo_url: string | null;
  tier: 'free' | 'paid';
  status: AdminGym['status'];
  admin_role: 'owner' | 'staff';
}

export async function listMyGyms(): Promise<MyAdminGym[]> {
  return apiClient.get('/admin/my-gyms');
}

export async function logoutPanel(): Promise<void> {
  await apiClient.post('/auth/logout');
}

export async function getGymJoinCode(gymId: string): Promise<GymJoinCode> {
  return apiClient.get(`/admin/gyms/${gymId}/join-code`);
}

// Also creates the very first code. 409 join_code_requires_paid_tier on free-tier gyms.
export async function regenerateGymJoinCode(gymId: string): Promise<GymJoinCode> {
  return apiClient.post(`/admin/gyms/${gymId}/join-code/regenerate`);
}

export async function setGymJoinCodeEnabled(gymId: string, enabled: boolean): Promise<GymJoinCode> {
  return apiClient.patch(`/admin/gyms/${gymId}/join-code`, { enabled });
}

export async function listGymMembers(
  gymId: string,
  opts: { search?: string; limit?: number; offset?: number } = {}
): Promise<GymMemberList> {
  const params = new URLSearchParams({ limit: String(opts.limit ?? 50), offset: String(opts.offset ?? 0) });
  if (opts.search) params.set('search', opts.search);
  return apiClient.get(`/admin/gyms/${gymId}/members?${params.toString()}`);
}

// Idempotent — re-adding returns the existing row with its original joined_via/joined_at.
export async function addGymMember(gymId: string, userId: string): Promise<GymMember> {
  return apiClient.post(`/admin/gyms/${gymId}/members`, { user_id: userId });
}

export async function removeGymMember(gymId: string, userId: string): Promise<void> {
  await apiClient.delete(`/admin/gyms/${gymId}/members/${userId}`);
}

// =====================================================================
// EQUIPMENT TYPES — EQUIPMENT_TYPES_MODULE_SPEC.md
// Fixed/seeded reference list (plates/dumbbells/accessories) — distinct from
// the brand/model equipment_categories/equipment_models/gym_equipment catalog
// above. No admin CRUD on the catalog itself in v1, just attach/detach per gym.
// =====================================================================
export type EquipmentTypeCategory = 'plates' | 'dumbbells' | 'accessories';

export interface EquipmentType {
  id: string;
  category: EquipmentTypeCategory;
  name: string;
  image_url: string;
}

export interface EquipmentTypesByCategory {
  plates: EquipmentType[];
  dumbbells: EquipmentType[];
  accessories: EquipmentType[];
}

export interface GymEquipmentType {
  id: string; // gym_equipment_types row id — pass this to the detach call, not equipment_type.id
  gym_id: string;
  equipment_type: EquipmentType;
}

export async function listEquipmentTypesCatalog(): Promise<EquipmentTypesByCategory> {
  return apiClient.get('/admin/equipment-types');
}

export async function listGymEquipmentTypes(gymId: string): Promise<GymEquipmentType[]> {
  return apiClient.get(`/admin/gyms/${gymId}/equipment-types`);
}

export async function attachGymEquipmentType(gymId: string, equipmentTypeId: string): Promise<GymEquipmentType> {
  return apiClient.post(`/admin/gyms/${gymId}/equipment-types`, { equipment_type_id: equipmentTypeId });
}

export async function detachGymEquipmentType(gymId: string, gymEquipmentTypeId: string): Promise<void> {
  await apiClient.delete(`/admin/gyms/${gymId}/equipment-types/${gymEquipmentTypeId}`);
}
