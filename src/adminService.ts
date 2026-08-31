import { apiClient } from './apiClient';
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
}

export async function getAdminPrograms(): Promise<{ programs: AdminProgram[]; total: number }> {
  return apiClient.get('/admin/programs?page=0&page_size=100');
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
