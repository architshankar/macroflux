import * as fs from 'fs';
import * as path from 'path';
import { createClient } from '@supabase/supabase-js';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

// 1. RECREATE __dirname FOR MODERN ES MODULES (ESM)
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// 2. ENVIRONMENT CONFIGURATION
const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL || 'https://yswirdsttktrtqoxncre.supabase.co';
const SUPABASE_ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inlzd2lyZHN0dGt0cnRxb3huY3JlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzg4NjU1OTUsImV4cCI6MjA5NDQ0MTU5NX0.lOR-nZBEz6PaXtuprQPZ1ZHEPOQZhd-X5JbmfyniQU0';
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// =====================================================================
// 3. MIGRATION TRANSACTION PIPELINE LOGIC
// =====================================================================
async function runProgramMigration() {
  console.log("🚀 Starting database migration pipeline...");

  // Configured to look strictly for the exact file 'program2.json' in this directory
  const TARGET_FILE = 'program2.json';
  const jsonPath = path.join(__dirname, TARGET_FILE); 

  if (!fs.existsSync(jsonPath)) {
    console.error(`❌ Cannot find migration source file at: ${jsonPath}`);
    return;
  }
  
  const programData = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));

  try {
    // 🔲 STEP 1: PARSE AND POPULATE EXERCISES DICTIONARY
    console.log("📦 Processing master exercise rows...");
    const uniqueExercisesMap = new Map<string, { tutorial_url: string | null; substitutions: any[] }>();

    // Traverse the JSON file to parse every exercise
    for (const week of programData.weeks) {
      for (const session of week.sessions) {
        for (const ex of session.exercises) {
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

    console.log(`✨ Uploading ${uniqueExercisesMap.size} unique movements to global library...`);
    const exerciseInsertPayload = Array.from(uniqueExercisesMap.entries()).map(([name, meta]) => ({
      name,
      tutorial_url: meta.tutorial_url
    }));

    const { data: dbExercises, error: exError } = await supabase
      .from('exercises')
      .upsert(exerciseInsertPayload, { onConflict: 'name' })
      .select('id, name');

    if (exError || !dbExercises) throw new Error(`Exercise library initialization failed: ${exError?.message}`);

    const exLookup = new Map<string, string>();
    dbExercises.forEach(row => exLookup.set(row.name, row.id));

    // 🔲 STEP 2: ESTABLISH MUTUAL CO-SELECTION MAPPINGS
    console.log("🔗 Linking alternative exercise swap paths...");
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
      await supabase.from('exercise_substitutions').upsert(substitutionJunctionPayload);
    }

    // 🔲 STEP 3: CREATE PARENT PROGRAM ENVELOPE RECORD
    console.log(`💾 Writing main program row: ${programData.program_name}`);
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

    if (progError || !programRow) throw new Error(`Program entry failed: ${progError?.message}`);
    const programId = programRow.id;

    // 🔲 STEP 4: TIMELINE PARSING & UPLOAD LOOP
    console.log("⏳ Processing structural weeks, daily sessions, and sorting prescriptions...");
    
    for (const week of programData.weeks) {
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

      if (weekError || !weekRow) throw new Error(`Failed on Week ${week.week} blueprint: ${weekError?.message}`);
      const weekId = weekRow.id;

      for (const session of week.sessions) {
        const { data: sessionRow, error: sessError } = await supabase
          .from('program_sessions')
          .insert({
            week_id: weekId,
            session_number: session.session_number,
            session_label: session.session_label || null
          })
          .select('id')
          .single();

        if (sessError || !sessionRow) throw new Error(`Failed on Session ${session.session_number}: ${sessError?.message}`);
        const sessionId = sessionRow.id;

        // Build database prescription rows mapping structural array sequence seamlessly
        const prescriptionBatch = session.exercises.map((ex: any, index: number) => {
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

        const { error: prescrError } = await supabase
          .from('program_prescriptions')
          .insert(prescriptionBatch);

        if (prescrError) throw new Error(`Prescription upload failed on day loop: ${prescrError.message}`);
      }
    }

    console.log("🥇 Database migration completed with absolute structural success!");

  } catch (err: any) {
    console.error("❌ CRITICAL CONTEXT MIGRATION FAILURE:", err.message);
  }
}

runProgramMigration();