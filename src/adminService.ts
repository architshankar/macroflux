import { supabase } from './supabaseClient';
import { UserAccount } from './types';

export interface AdminMetrics {
  totalUsers: number;
  activeWorkoutsToday: number;
  premiumSubscriberRatio: number;
}

export async function getAdminMetrics(): Promise<AdminMetrics> {
  const [
    { count: totalUsers, error: errTotal },
    { count: premiumUsers, error: errPremium },
    { count: activeWorkoutsToday, error: errWorkouts }
  ] = await Promise.all([
    supabase.from('profiles').select('*', { count: 'exact', head: true }),
    supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('subscription_tier', 'premium'),
    supabase.from('workouts')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', new Date(new Date().setHours(0, 0, 0, 0)).toISOString())
  ]);

  if (errTotal) throw errTotal;

  const total = totalUsers || 0;
  const premium = premiumUsers || 0;

  return {
    totalUsers: total,
    activeWorkoutsToday: activeWorkoutsToday || 0,
    premiumSubscriberRatio: total > 0 ? Number(((premium / total) * 100).toFixed(1)) : 0
  };
}

export async function getUsers(page: number = 0, pageSize: number = 20): Promise<{ users: UserAccount[], total: number }> {
  const from = page * pageSize;
  const to = from + pageSize - 1;

  const { data, count, error } = await supabase
    .from('profiles')
    .select('*', { count: 'exact' })
    .range(from, to)
    .order('updated_at', { ascending: false }); // Using your updated_at instead of created_at

  if (error) throw error;

  const users: UserAccount[] = data.map((profile: any) => ({
    id: profile.id,
    name: profile.full_name || 'Unknown',
    email: profile.email || 'OAuth Login',
    registrationDate: profile.updated_at || new Date().toISOString(),
    lastActiveWorkout: profile.last_active_workout || 'N/A',
    status: profile.status || 'active',
    workoutsCount: profile.workouts_count || 0,
    caloriesBudget: profile.target_calories ? `${profile.target_calories} kcal` : '2500 kcal',
    durationMins: profile.duration_mins || 0,
    subscription_tier: profile.subscription_tier || 'free',
  }));

  return { users, total: count || 0 };
}

export async function updateUserSubscription(userId: string, subscription: 'free' | 'premium'): Promise<void> {
  const { error } = await supabase
    .from('profiles')
    .update({ subscription_tier: subscription })
    .eq('id', userId);

  if (error) throw error;
}

export async function toggleSuspendUser(userId: string, currentStatus: string): Promise<void> {
  // Remote database RPC flag when triggering a user suspension
  const { error } = await supabase.rpc('toggle_user_suspension', { p_user_id: userId, p_current_status: currentStatus });
  if (error) {
    console.error('Error with RPC, falling back to basic update', error);
    // fallback
    const { error: updateError } = await supabase
      .from('profiles')
      .update({ status: currentStatus === 'banned' ? 'active' : 'banned' })
      .eq('id', userId);
      
    if (updateError) throw updateError;
  }
}

export async function updateSystemConfig(configKey: string, configValue: any): Promise<void> {
  const { error } = await supabase
    .from('global_flags')
    .upsert({ key: configKey, value: configValue, updated_at: new Date().toISOString() }, { onConflict: 'key' });

  if (error) throw error;
}

export async function sendNotificationBlast(title: string, body: string, targetTier: string): Promise<void> {
  const { error } = await supabase
    .from('notification_blasts')
    .insert([{ title, body, target_tier: targetTier }]);

  if (error) throw error;
}

export async function getNotificationBlasts(): Promise<any[]> {
  const { data, error } = await supabase
    .from('notification_blasts')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data || [];
}

export async function getUserWorkouts(userId: string): Promise<any[]> {
  const { data, error } = await supabase
    .from('performed_workouts')
    .select(`
      id,
      performed_at,
      user_summary_notes,
      program_sessions (
        session_label
      ),
      performed_sets ( 
        id, 
        set_number, 
        set_type, 
        weight_logged, 
        reps_logged, 
        rpe_achieved,
        exercise_id,
        exercises (
          name
        )
      )
    `)
    .eq('user_id', userId)
    .order('performed_at', { ascending: false });

  if (error) throw error;
  // Sort the sets by set_number for each workout
  return (data || []).map(workout => ({
    ...workout,
    performed_sets: workout.performed_sets 
      ? workout.performed_sets.sort((a: any, b: any) => a.set_number - b.set_number)
      : []
  }));
}

export async function deleteWorkout(workoutId: string): Promise<void> {
  const { error } = await supabase
    .from('performed_workouts')
    .delete()
    .eq('id', workoutId);

  if (error) throw error;
}

export async function updateWorkout(workoutId: string, updates: { performed_at?: string, user_summary_notes?: string }): Promise<void> {
  const { error } = await supabase
    .from('performed_workouts')
    .update(updates)
    .eq('id', workoutId);

  if (error) throw error;
}

export async function deleteWorkoutSet(setId: string): Promise<void> {
  const { error } = await supabase
    .from('performed_sets')
    .delete()
    .eq('id', setId);

  if (error) throw error;
}


