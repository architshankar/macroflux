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
    supabase.from('performed_workouts')
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

// =====================================================================
// PROGRAM MIGRATION LOGIC (Moved from seedProgram.ts)
// =====================================================================
export async function uploadProgramMigration(programData: any, onProgress: (msg: string) => void): Promise<void> {
  try {
    // 🔲 STEP 1: PARSE AND POPULATE EXERCISES DICTIONARY
    onProgress("📦 Processing master exercise rows...");
    const uniqueExercisesMap = new Map<string, { tutorial_url: string | null; substitutions: any[] }>();

    for (const week of programData.weeks || []) {
      for (const session of week.sessions || []) {
        for (const ex of session.exercises || []) {
          if (!uniqueExercisesMap.has(ex.name)) {
            uniqueExercisesMap.set(ex.name, { 
              tutorial_url: ex.tutorial_url || null, 
              substitutions: ex.substitutions || [] 
            });
          }
          for (const sub of ex.substitutions || []) {
            if (!uniqueExercisesMap.has(sub.name)) {
              uniqueExercisesMap.set(sub.name, { tutorial_url: sub.tutorial_url || null, substitutions: [] });
            }
          }
        }
      }
    }

    onProgress(`✨ Uploading ${uniqueExercisesMap.size} unique movements to global library...`);
    const exerciseInsertPayload = Array.from(uniqueExercisesMap.entries()).map(([name, meta]) => ({
      name,
      tutorial_url: meta.tutorial_url
    }));

    const { data: dbExercises, error: exError } = await supabase
      .from('exercises')
      .upsert(exerciseInsertPayload, { onConflict: 'name' })
      .select('id, name');

    if (exError || !dbExercises) throw new Error(`Exercise library initialization failed: ${exError?.message || 'Unknown'}`);

    const exLookup = new Map<string, string>();
    dbExercises.forEach((row: any) => exLookup.set(row.name, row.id));

    // 🔲 STEP 2: ESTABLISH MUTUAL CO-SELECTION MAPPINGS
    onProgress("🔗 Linking alternative exercise swap paths...");
    const substitutionJunctionPayload: any[] = [];
    for (const [name, meta] of uniqueExercisesMap.entries()) {
      const parentId = exLookup.get(name);
      for (const sub of meta.substitutions) {
        const subId = exLookup.get(sub.name);
        if (parentId && subId) {
          substitutionJunctionPayload.push({ exercise_id: parentId, substitution_id: subId });
        }
      }
    }

    if (substitutionJunctionPayload.length > 0) {
      const { error: subError } = await supabase.from('exercise_substitutions').upsert(substitutionJunctionPayload);
      if (subError) throw new Error(`Substitution setup failed: ${subError.message}`);
    }

    // 🔲 STEP 3: CREATE PARENT PROGRAM ENVELOPE RECORD
    onProgress(`💾 Writing main program row: ${programData.program_name}`);
    const { data: programRow, error: progError } = await supabase
      .from('programs')
      .insert({
        title: programData.program_name,
        description: programData.cycle_note || "Routine Layout Portfolio Block",
        plan_style: "PPL",
        total_weeks: programData.total_weeks
      })
      .select('id')
      .single();

    if (progError || !programRow) throw new Error(`Program entry failed: ${progError?.message || 'Unknown'}`);
    const programId = programRow.id;

    // 🔲 STEP 4: TIMELINE PARSING & UPLOAD LOOP
    onProgress("⏳ Processing structural weeks, daily sessions, and sorting prescriptions...");
    
    for (const week of programData.weeks || []) {
      const { data: weekRow, error: weekError } = await supabase
        .from('program_weeks')
        .insert({
          program_id: programId,
          week_number: week.week,
          block_number: week.block || null,
          block_label: week.block_label || null,
          is_deload: week.is_deload || false
        })
        .select('id')
        .single();

      if (weekError || !weekRow) throw new Error(`Failed on Week ${week.week} blueprint: ${weekError?.message || 'Unknown'}`);
      const weekId = weekRow.id;

      for (const session of week.sessions || []) {
        const { data: sessionRow, error: sessError } = await supabase
          .from('program_sessions')
          .insert({
            week_id: weekId,
            session_number: session.session_number,
            session_label: session.session_label || null
          })
          .select('id')
          .single();

        if (sessError || !sessionRow) throw new Error(`Failed on Session ${session.session_number}: ${sessError?.message || 'Unknown'}`);
        const sessionId = sessionRow.id;

        // Build database prescription rows mapping structural array sequence seamlessly
        const prescriptionBatch = (session.exercises || []).map((ex: any, index: number) => {
          const matchedExId = exLookup.get(ex.name);
          if (!matchedExId) throw new Error(`Critical reference fault: ${ex.name} missing lookup UUID.`);
          
          return {
            session_id: sessionId,
            exercise_id: matchedExId,
            sequence_order: index + 1,
            warm_up_sets: ex.warm_up_sets || null,
            working_sets: ex.working_sets || null,
            target_reps: ex.target_reps || null,
            early_set_rpe: ex.early_set_rpe || null,
            last_set_rpe: ex.last_set_rpe || null,
            rest_time: ex.rest || null,
            intensity_technique: ex.intensity_technique || null,
            prescription_notes: ex.notes || null
          };
        });

        if (prescriptionBatch.length > 0) {
          const { error: prescrError } = await supabase
            .from('program_prescriptions')
            .insert(prescriptionBatch);

          if (prescrError) throw new Error(`Prescription upload failed on day loop: ${prescrError.message}`);
        }
      }
    }

    onProgress("🥇 Database migration completed with absolute structural success!");

  } catch (err: any) {
    throw new Error(`CRITICAL CONTEXT MIGRATION FAILURE: ${err.message}`);
  }
}



