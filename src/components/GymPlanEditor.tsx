import React, { useEffect, useRef, useState } from 'react';
import { X, Plus, Trash2, Save, FileJson, Upload } from 'lucide-react';
import {
  GymPlan,
  GymPlanSubstitutionIn,
  GymPlanWeek,
  GymPlanSession,
  GymPlanPrescription,
  GymPlanExerciseOption,
  createGymPlan,
  updateGymPlan,
  listGymPlanExercises,
} from '../adminService';

interface GymPlanEditorProps {
  gymId: string;
  plan: GymPlan | null; // null = create mode
  onClose: () => void;
  onSaved: () => void;
  showToast: (msg: string) => void;
}

const inputCls = 'w-full bg-[#0D0D0D] border border-zinc-800 focus:border-[#CCFF00] p-2.5 rounded-lg text-white outline-none text-xs font-mono';

const emptyPrescription = (): GymPlanPrescription => ({
  exercise_name: '',
  warm_up_sets: '',
  working_sets: 3,
  target_reps: '8-12',
  rest_time: '90s',
  substitutions: [],
});

const emptySession = (sessionNumber: number): GymPlanSession => ({
  session_number: sessionNumber,
  session_label: '',
  prescriptions: [],
});

const emptyWeek = (weekNumber: number): GymPlanWeek => ({
  week_number: weekNumber,
  block_number: 1,
  block_label: '',
  is_deload: false,
  sessions: [],
});

// Strips local-only `id` fields (not part of the WeekIn/SessionIn/PrescriptionIn
// payload shape) before submitting — the backend ignores unknown fields, but
// this keeps the payload honest.
function stripIds(weeks: GymPlanWeek[]): GymPlanWeek[] {
  return weeks.map(({ id, sessions, ...w }) => ({
    ...w,
    sessions: sessions.map(({ id: sid, prescriptions, ...s }) => ({
      ...s,
      prescriptions: prescriptions.map(({ id: pid, ...p }) => p),
    })),
  }));
}

// ---------------------------------------------------------------------------
// JSON import — the JSON view holds the WHOLE plan (title/description/
// total_weeks/type + weeks), not just the weeks array. Accepts:
//   - a full plan object: { title | plan_name | program_name | name,
//     description | cycle_note, total_weeks, type, weeks: [...] }
//   - a bare weeks array (legacy shape of this editor)
// and normalizes field-name aliases used by the program-uploader JSON
// (week, block, exercises, name, rest, notes, string substitutions) onto the
// backend's WeekIn/SessionIn/PrescriptionIn shape. The backend silently drops
// unknown keys, so without this an aliased file saves with no exercises.
// ---------------------------------------------------------------------------
interface ParsedPlanJson {
  type?: 'general' | 'user_specific';
  title?: string;
  description?: string | null;
  total_weeks?: number | null;
  weeks: GymPlanWeek[];
}

const pick = (obj: any, ...keys: string[]) => {
  for (const k of keys) if (obj?.[k] !== undefined && obj?.[k] !== null) return obj[k];
  return undefined;
};

const toInt = (v: any): number | null => {
  if (v === undefined || v === null || v === '') return null;
  const n = typeof v === 'number' ? v : parseInt(String(v), 10);
  return Number.isFinite(n) ? n : null;
};

const toNum = (v: any): number | null => {
  if (v === undefined || v === null || v === '') return null;
  const n = typeof v === 'number' ? v : parseFloat(String(v));
  return Number.isFinite(n) ? n : null;
};

const toStr = (v: any): string | null => (v === undefined || v === null ? null : String(v));

function normalizeSubstitution(sub: any, where: string): GymPlanSubstitutionIn {
  if (typeof sub === 'string') return { name: sub };
  const name = pick(sub, 'name', 'exercise_name');
  if (!name || !String(name).trim()) throw new Error(`${where}: substitution is missing "name"`);
  const out: GymPlanSubstitutionIn = { name: String(name).trim() };
  if (sub.tutorial_url !== undefined) out.tutorial_url = sub.tutorial_url;
  if (sub.tracking_type !== undefined) out.tracking_type = sub.tracking_type;
  if (sub.is_unilateral !== undefined) out.is_unilateral = !!sub.is_unilateral;
  if (sub.muscle_group !== undefined) out.muscle_group = sub.muscle_group;
  return out;
}

function normalizePrescription(p: any, where: string, index: number): GymPlanPrescription {
  if (!p || typeof p !== 'object') throw new Error(`${where}: each exercise must be an object`);
  const name = pick(p, 'exercise_name', 'name', 'exercise');
  if (!name || !String(name).trim()) throw new Error(`${where}: exercise is missing "exercise_name"`);
  const out: GymPlanPrescription = {
    exercise_name: String(name).trim(),
    sequence_order: toInt(pick(p, 'sequence_order', 'order')) ?? index + 1,
    warm_up_sets: pick(p, 'warm_up_sets', 'warmup_sets') ?? null,
    working_sets: pick(p, 'working_sets', 'sets') ?? null,
    target_reps: toStr(pick(p, 'target_reps', 'reps')),
    target_reps_left: toStr(p.target_reps_left),
    target_reps_right: toStr(p.target_reps_right),
    early_set_rpe: toNum(p.early_set_rpe),
    last_set_rpe: toNum(p.last_set_rpe),
    rest_time: toStr(pick(p, 'rest_time', 'rest')),
    intensity_technique: toStr(p.intensity_technique),
    prescription_notes: toStr(pick(p, 'prescription_notes', 'notes')),
    substitutions: (Array.isArray(p.substitutions) ? p.substitutions : []).map((s: any) => normalizeSubstitution(s, where)),
  };
  if (p.tutorial_url !== undefined) out.tutorial_url = p.tutorial_url;
  if (p.tracking_type !== undefined) out.tracking_type = p.tracking_type;
  if (p.is_unilateral !== undefined) out.is_unilateral = !!p.is_unilateral;
  if (p.muscle_group !== undefined) out.muscle_group = p.muscle_group;
  return out;
}

function normalizeWeeks(rawWeeks: any): GymPlanWeek[] {
  if (!Array.isArray(rawWeeks)) throw new Error('"weeks" must be an array');
  return rawWeeks.map((w: any, wi: number) => {
    if (!w || typeof w !== 'object') throw new Error(`Week ${wi + 1}: must be an object`);
    const weekNumber = toInt(pick(w, 'week_number', 'week')) ?? wi + 1;
    const rawSessions = pick(w, 'sessions', 'days') ?? [];
    if (!Array.isArray(rawSessions)) throw new Error(`Week ${weekNumber}: "sessions" must be an array`);
    return {
      week_number: weekNumber,
      block_number: toInt(pick(w, 'block_number', 'block')),
      block_label: toStr(w.block_label),
      is_deload: !!w.is_deload,
      sessions: rawSessions.map((s: any, si: number) => {
        if (!s || typeof s !== 'object') throw new Error(`Week ${weekNumber}, session ${si + 1}: must be an object`);
        const sessionNumber = toInt(pick(s, 'session_number', 'session', 'day')) ?? si + 1;
        const where = `Week ${weekNumber}, session ${sessionNumber}`;
        const rawPrescriptions = pick(s, 'prescriptions', 'exercises') ?? [];
        if (!Array.isArray(rawPrescriptions)) throw new Error(`${where}: "prescriptions" must be an array`);
        return {
          session_number: sessionNumber,
          session_label: toStr(pick(s, 'session_label', 'label', 'name')),
          prescriptions: rawPrescriptions.map((p: any, pi: number) => normalizePrescription(p, where, pi)),
        };
      }),
    };
  });
}

function parsePlanJson(text: string): ParsedPlanJson {
  const data = JSON.parse(text);
  if (Array.isArray(data)) return { weeks: normalizeWeeks(data) };
  if (!data || typeof data !== 'object') throw new Error('Expected a plan object (or an array of weeks)');

  const out: ParsedPlanJson = { weeks: normalizeWeeks(data.weeks ?? []) };
  const title = pick(data, 'title', 'plan_name', 'program_name', 'name');
  if (title !== undefined) out.title = String(title);
  const description = pick(data, 'description', 'cycle_note');
  if (description !== undefined) out.description = String(description);
  if ('total_weeks' in data) out.total_weeks = toInt(data.total_weeks);
  if (data.type !== undefined) {
    if (data.type !== 'general' && data.type !== 'user_specific') {
      throw new Error('"type" must be "general" or "user_specific"');
    }
    out.type = data.type;
  }
  return out;
}

export function GymPlanEditor({ gymId, plan, onClose, onSaved, showToast }: GymPlanEditorProps) {
  const isEdit = !!plan;
  const [type, setType] = useState<'general' | 'user_specific'>(plan?.type || 'general');
  const [title, setTitle] = useState(plan?.title || '');
  const [description, setDescription] = useState(plan?.description || '');
  const [totalWeeks, setTotalWeeks] = useState<string>(plan?.total_weeks != null ? String(plan.total_weeks) : '');
  const [weeks, setWeeks] = useState<GymPlanWeek[]>(plan?.weeks?.length ? plan.weeks : []);
  const [isSaving, setIsSaving] = useState(false);
  const [exerciseOptions, setExerciseOptions] = useState<GymPlanExerciseOption[]>([]);
  const [showJson, setShowJson] = useState(false);
  const [jsonText, setJsonText] = useState('');
  const [jsonError, setJsonError] = useState('');
  const jsonFileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    listGymPlanExercises(gymId)
      .then(setExerciseOptions)
      .catch((err) => console.error('Error loading plan-builder exercise pool', err));
  }, [gymId]);

  const updateWeek = (wi: number, patch: Partial<GymPlanWeek>) => {
    setWeeks((prev) => prev.map((w, i) => (i === wi ? { ...w, ...patch } : w)));
  };

  const addWeek = () => setWeeks((prev) => [...prev, emptyWeek(prev.length + 1)]);
  const removeWeek = (wi: number) => setWeeks((prev) => prev.filter((_, i) => i !== wi));

  const addSession = (wi: number) => {
    setWeeks((prev) =>
      prev.map((w, i) => (i === wi ? { ...w, sessions: [...w.sessions, emptySession(w.sessions.length + 1)] } : w))
    );
  };
  const removeSession = (wi: number, si: number) => {
    setWeeks((prev) => prev.map((w, i) => (i === wi ? { ...w, sessions: w.sessions.filter((_, j) => j !== si) } : w)));
  };
  const updateSession = (wi: number, si: number, patch: Partial<GymPlanSession>) => {
    setWeeks((prev) =>
      prev.map((w, i) =>
        i === wi ? { ...w, sessions: w.sessions.map((s, j) => (j === si ? { ...s, ...patch } : s)) } : w
      )
    );
  };

  const addPrescription = (wi: number, si: number) => {
    setWeeks((prev) =>
      prev.map((w, i) =>
        i === wi
          ? { ...w, sessions: w.sessions.map((s, j) => (j === si ? { ...s, prescriptions: [...s.prescriptions, emptyPrescription()] } : s)) }
          : w
      )
    );
  };
  const removePrescription = (wi: number, si: number, pi: number) => {
    setWeeks((prev) =>
      prev.map((w, i) =>
        i === wi
          ? {
              ...w,
              sessions: w.sessions.map((s, j) => (j === si ? { ...s, prescriptions: s.prescriptions.filter((_, k) => k !== pi) } : s)),
            }
          : w
      )
    );
  };
  const updatePrescription = (wi: number, si: number, pi: number, patch: Partial<GymPlanPrescription>) => {
    setWeeks((prev) =>
      prev.map((w, i) =>
        i === wi
          ? {
              ...w,
              sessions: w.sessions.map((s, j) =>
                j === si ? { ...s, prescriptions: s.prescriptions.map((p, k) => (k === pi ? { ...p, ...patch } : p)) } : s
              ),
            }
          : w
      )
    );
  };

  // The JSON view shows the whole plan, starting at the plan name.
  const openJsonView = () => {
    const doc: Record<string, any> = {
      title,
      description: description || null,
      total_weeks: totalWeeks ? parseInt(totalWeeks, 10) : null,
    };
    if (!isEdit) doc.type = type; // type is immutable after creation
    doc.weeks = stripIds(weeks);
    setJsonText(JSON.stringify(doc, null, 2));
    setJsonError('');
    setShowJson(true);
  };

  // Parses the JSON box and pushes it into the form state. Returns the parsed
  // plan (so save can use it directly, without waiting on a state update), or
  // null if it's invalid.
  const applyJsonText = (text: string): ParsedPlanJson | null => {
    try {
      const parsed = parsePlanJson(text);
      if (isEdit && parsed.type && parsed.type !== type) {
        throw new Error(`"type" can't be changed after creation (this plan is "${type}")`);
      }
      setWeeks(parsed.weeks);
      if (parsed.title !== undefined) setTitle(parsed.title);
      if (parsed.description !== undefined) setDescription(parsed.description ?? '');
      if (parsed.total_weeks !== undefined) setTotalWeeks(parsed.total_weeks != null ? String(parsed.total_weeks) : '');
      if (parsed.type && !isEdit) setType(parsed.type);
      setJsonError('');
      return parsed;
    } catch (err: any) {
      setJsonError(err.message || 'Invalid JSON');
      return null;
    }
  };

  const applyJson = () => {
    if (applyJsonText(jsonText)) setShowJson(false);
  };

  const handleJsonFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = ''; // allow re-selecting the same file
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const text = String(reader.result ?? '');
      setJsonText(text);
      setShowJson(true);
      const parsed = applyJsonText(text);
      if (parsed) showToast(`Loaded ${parsed.weeks.length} week(s) from ${file.name}`);
    };
    reader.onerror = () => setJsonError(`Could not read ${file.name}`);
    reader.readAsText(file);
  };

  const handleSave = async () => {
    // If the JSON view is open, it is the source of truth — previously its
    // contents were silently dropped unless "Apply JSON" was clicked first,
    // so the plan was saved with no weeks.
    let current = {
      type,
      title,
      description,
      totalWeeks: totalWeeks ? parseInt(totalWeeks, 10) : null,
      weeks,
    };
    if (showJson) {
      const parsed = applyJsonText(jsonText);
      if (!parsed) {
        showToast('Fix the JSON errors before saving');
        return;
      }
      current = {
        type: parsed.type && !isEdit ? parsed.type : type,
        title: parsed.title ?? title,
        description: parsed.description !== undefined ? parsed.description ?? '' : description,
        totalWeeks: parsed.total_weeks !== undefined ? parsed.total_weeks : current.totalWeeks,
        weeks: parsed.weeks,
      };
    }

    if (!current.title.trim()) {
      showToast('Give this plan a title first');
      return;
    }
    const missingName = current.weeks.some((w) => w.sessions.some((s) => s.prescriptions.some((p) => !p.exercise_name?.trim())));
    if (missingName) {
      showToast('Every exercise needs a name');
      return;
    }

    setIsSaving(true);
    try {
      const cleanWeeks = stripIds(current.weeks);
      const totalWeeksOut = current.totalWeeks ?? (cleanWeeks.length || null);
      if (isEdit && plan) {
        await updateGymPlan(gymId, plan.id, {
          title: current.title,
          description: current.description || null,
          total_weeks: totalWeeksOut,
          weeks: cleanWeeks,
        });
        showToast(`"${current.title}" updated`);
      } else {
        await createGymPlan(gymId, {
          type: current.type,
          title: current.title,
          description: current.description || null,
          total_weeks: totalWeeksOut,
          weeks: cleanWeeks,
        });
        showToast(`"${current.title}" created`);
      }
      onSaved();
    } catch (err: any) {
      console.error(err);
      showToast(err.message || 'Error saving plan');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-[#141414] border-2 border-[#252525] rounded-xl p-6 sm:p-8 w-full max-w-4xl relative max-h-[90vh] overflow-y-auto space-y-6">
        <button type="button" onClick={onClose} className="absolute top-4 right-4 text-zinc-500 hover:text-white">
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center justify-between pr-8">
          <h3 className="font-display font-bold text-lg text-white">{isEdit ? `Edit Plan — ${plan!.title}` : 'New Gym Plan'}</h3>
          <div className="flex items-center gap-2">
            <button onClick={() => jsonFileRef.current?.click()} className="text-xs font-mono text-zinc-400 hover:text-white flex items-center gap-1.5 border border-zinc-800 px-3 py-1.5 rounded">
              <Upload className="w-3.5 h-3.5" /> Load .json file
            </button>
            <input ref={jsonFileRef} type="file" accept=".json,application/json" className="hidden" onChange={handleJsonFile} />
            <button onClick={showJson ? applyJson : openJsonView} className="text-xs font-mono text-zinc-400 hover:text-white flex items-center gap-1.5 border border-zinc-800 px-3 py-1.5 rounded">
              <FileJson className="w-3.5 h-3.5" /> {showJson ? 'Apply JSON' : 'Edit as JSON'}
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
          <div>
            <label className="text-[#9A9A9A] text-[10px] uppercase block mb-1">Type</label>
            <select disabled={isEdit} className={`${inputCls} disabled:opacity-50`} value={type} onChange={(e) => setType(e.target.value as 'general' | 'user_specific')}>
              <option value="general">General</option>
              <option value="user_specific">User-specific</option>
            </select>
          </div>
          <div className="sm:col-span-2">
            <label className="text-[#9A9A9A] text-[10px] uppercase block mb-1">Title</label>
            <input required className={inputCls} value={title} onChange={(e) => setTitle(e.target.value)} />
          </div>
          <div>
            <label className="text-[#9A9A9A] text-[10px] uppercase block mb-1">Total Weeks</label>
            <input type="number" className={inputCls} value={totalWeeks} onChange={(e) => setTotalWeeks(e.target.value)} />
          </div>
          <div className="sm:col-span-4">
            <label className="text-[#9A9A9A] text-[10px] uppercase block mb-1">Description</label>
            <input className={inputCls} value={description} onChange={(e) => setDescription(e.target.value)} />
          </div>
        </div>

        {showJson ? (
          <div className="space-y-2">
            <textarea
              value={jsonText}
              onChange={(e) => setJsonText(e.target.value)}
              className="w-full h-96 bg-[#0A0A0A] border border-[#252525] focus:border-[#CCFF00] rounded-lg p-4 font-mono text-xs text-white resize-y outline-none"
            />
            {jsonError && <p className="text-red-400 text-xs font-mono">{jsonError}</p>}
            <p className="text-zinc-600 text-[10px] font-mono">
              Paste the whole plan: {'{ "title", "description", "total_weeks", "type", "weeks": [ { "week_number", "sessions": [ { "session_number", "session_label", "prescriptions": [ { "exercise_name", ... } ] } ] } ] }'}.
              Aliases like program_name, week, exercises, name, rest and notes are accepted. SAVE PLAN uses this JSON directly.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            <datalist id="gym-plan-exercise-options">
              {exerciseOptions.map((ex) => (
                <option key={ex.id} value={ex.name} />
              ))}
            </datalist>

            <div className="flex justify-between items-center">
              <h4 className="text-zinc-500 text-[10px] uppercase tracking-wider">Weeks ({weeks.length})</h4>
              <button onClick={addWeek} className="text-[10px] uppercase font-mono text-[#CCFF00] hover:bg-[#CCFF00]/10 px-2 py-1 rounded border border-[#CCFF00]/30 flex items-center gap-1">
                <Plus className="w-3 h-3" /> Week
              </button>
            </div>

            {weeks.map((week, wi) => (
              <div key={wi} className="bg-[#0D0D0D] border border-[#252525] rounded-xl overflow-hidden">
                <div className="bg-[#1A1A1A] p-3 flex items-center justify-between border-b border-[#252525] gap-3 flex-wrap">
                  <div className="flex gap-3 items-center flex-wrap">
                    <div>
                      <span className="text-[9px] text-zinc-500 font-mono block">Week #</span>
                      <input type="number" value={week.week_number} onChange={(e) => updateWeek(wi, { week_number: parseInt(e.target.value) || 0 })} className="w-14 bg-black border border-[#333] rounded px-2 py-1 text-xs text-white font-mono text-center" />
                    </div>
                    <div>
                      <span className="text-[9px] text-zinc-500 font-mono block">Block #</span>
                      <input type="number" value={week.block_number ?? ''} onChange={(e) => updateWeek(wi, { block_number: parseInt(e.target.value) || null })} className="w-14 bg-black border border-[#333] rounded px-2 py-1 text-xs text-white font-mono text-center" />
                    </div>
                    <div>
                      <span className="text-[9px] text-zinc-500 font-mono block">Block Label</span>
                      <input value={week.block_label ?? ''} onChange={(e) => updateWeek(wi, { block_label: e.target.value })} className="w-32 bg-black border border-[#333] rounded px-2 py-1 text-xs text-white font-mono" />
                    </div>
                    <label className="flex items-center gap-1.5 text-[10px] text-zinc-400 font-mono">
                      <input type="checkbox" checked={!!week.is_deload} onChange={(e) => updateWeek(wi, { is_deload: e.target.checked })} /> Deload
                    </label>
                  </div>
                  <div className="flex items-center gap-2">
                    <button onClick={() => addSession(wi)} className="text-[10px] uppercase font-mono text-[#CCFF00] hover:bg-[#CCFF00]/10 px-2 py-1 rounded border border-[#CCFF00]/30 flex items-center gap-1">
                      <Plus className="w-3 h-3" /> Session
                    </button>
                    <button onClick={() => removeWeek(wi)} className="text-red-500 hover:text-red-400 p-1" title="Remove week">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <div className="p-3 space-y-3">
                  {week.sessions.length === 0 && <div className="text-zinc-600 text-xs font-mono text-center py-2">No sessions in this week</div>}
                  {week.sessions.map((session, si) => (
                    <div key={si} className="bg-[#111] border border-[#2a2a2a] rounded-lg">
                      <div className="flex items-center justify-between p-2.5 border-b border-[#2a2a2a] flex-wrap gap-2">
                        <div className="flex items-center gap-2">
                          <input type="number" value={session.session_number} onChange={(e) => updateSession(wi, si, { session_number: parseInt(e.target.value) || 0 })} className="w-12 bg-black border border-[#333] rounded px-1 text-xs text-white font-mono text-center" />
                          <input placeholder="Session label" value={session.session_label ?? ''} onChange={(e) => updateSession(wi, si, { session_label: e.target.value })} className="bg-black border border-[#333] rounded px-2 py-1 text-xs text-[#CCFF00] font-mono outline-none" />
                        </div>
                        <div className="flex gap-2">
                          <button onClick={() => addPrescription(wi, si)} className="text-[10px] bg-[#222] hover:bg-[#333] text-white px-2 py-1 rounded border border-[#444] flex items-center gap-1 font-mono">
                            <Plus className="w-3 h-3" /> Exercise
                          </button>
                          <button onClick={() => removeSession(wi, si)} className="text-zinc-500 hover:text-red-500 p-1">
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      </div>

                      <div className="divide-y divide-[#1e1e1e]">
                        {session.prescriptions.map((p, pi) => (
                          <div key={pi} className="p-3 hover:bg-[#151515] flex flex-col md:flex-row gap-3">
                            <div className="flex-1 space-y-2">
                              <input
                                list="gym-plan-exercise-options"
                                placeholder="Exercise name (find-or-create)"
                                value={p.exercise_name}
                                onChange={(e) => updatePrescription(wi, si, pi, { exercise_name: e.target.value })}
                                className="w-full bg-black border border-[#333] rounded px-2 py-1 text-sm font-semibold text-white outline-none focus:border-[#CCFF00]"
                              />
                              <div className="flex flex-wrap gap-2 text-[10px] font-mono">
                                <FieldTag label="Warm-up">
                                  <input value={p.warm_up_sets ?? ''} onChange={(e) => updatePrescription(wi, si, pi, { warm_up_sets: e.target.value })} className="w-12 bg-[#222] rounded px-1 text-xs text-white border border-transparent focus:border-[#CCFF00]" />
                                </FieldTag>
                                <FieldTag label="Working">
                                  <input value={p.working_sets ?? ''} onChange={(e) => updatePrescription(wi, si, pi, { working_sets: e.target.value })} className="w-12 bg-[#222] rounded px-1 text-xs text-white border border-transparent focus:border-[#CCFF00]" />
                                </FieldTag>
                                <FieldTag label="Reps">
                                  <input value={p.target_reps ?? ''} onChange={(e) => updatePrescription(wi, si, pi, { target_reps: e.target.value })} className="w-16 bg-[#222] rounded px-1 text-xs text-white border border-transparent focus:border-[#CCFF00]" />
                                </FieldTag>
                                <FieldTag label="L/R Reps">
                                  <input placeholder="L" value={p.target_reps_left ?? ''} onChange={(e) => updatePrescription(wi, si, pi, { target_reps_left: e.target.value })} className="w-12 bg-[#222] rounded px-1 text-xs text-white border border-transparent focus:border-[#CCFF00]" />
                                  <input placeholder="R" value={p.target_reps_right ?? ''} onChange={(e) => updatePrescription(wi, si, pi, { target_reps_right: e.target.value })} className="w-12 bg-[#222] rounded px-1 text-xs text-white border border-transparent focus:border-[#CCFF00] ml-1" />
                                </FieldTag>
                                <FieldTag label="Rest">
                                  <input value={p.rest_time ?? ''} onChange={(e) => updatePrescription(wi, si, pi, { rest_time: e.target.value })} className="w-16 bg-[#222] rounded px-1 text-xs text-white border border-transparent focus:border-[#CCFF00]" />
                                </FieldTag>
                                <FieldTag label="RPE">
                                  <input placeholder="early" value={p.early_set_rpe ?? ''} onChange={(e) => updatePrescription(wi, si, pi, { early_set_rpe: e.target.value ? parseFloat(e.target.value) : null })} className="w-10 bg-[#222] rounded px-1 text-xs text-white border border-transparent focus:border-[#CCFF00]" />
                                  <input placeholder="last" value={p.last_set_rpe ?? ''} onChange={(e) => updatePrescription(wi, si, pi, { last_set_rpe: e.target.value ? parseFloat(e.target.value) : null })} className="w-10 bg-[#222] rounded px-1 text-xs text-white border border-transparent focus:border-[#CCFF00] ml-1" />
                                </FieldTag>
                              </div>
                              <input placeholder="Intensity technique (optional)" value={p.intensity_technique ?? ''} onChange={(e) => updatePrescription(wi, si, pi, { intensity_technique: e.target.value })} className="w-full bg-[#222] rounded px-2 py-1 text-xs text-white border border-transparent focus:border-[#CCFF00]" />
                              <input placeholder="Notes (optional)" value={p.prescription_notes ?? ''} onChange={(e) => updatePrescription(wi, si, pi, { prescription_notes: e.target.value })} className="w-full bg-[#222] rounded px-2 py-1 text-xs text-white border border-transparent focus:border-[#CCFF00]" />
                            </div>
                            <div className="md:w-10 flex items-center justify-center border-t md:border-t-0 md:border-l border-[#222] pt-2 md:pt-0 pl-0 md:pl-2">
                              <button onClick={() => removePrescription(wi, si, pi)} className="text-zinc-600 hover:text-red-500 p-2 rounded hover:bg-[#222]">
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        ))}
                        {session.prescriptions.length === 0 && <div className="text-zinc-600 text-[10px] font-mono p-2">No exercises configured.</div>}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="pt-4 border-t border-zinc-900 flex gap-3 sticky bottom-0 bg-[#141414]">
          <button onClick={onClose} className="flex-1 py-3 border border-zinc-800 hover:bg-[#1A1A1A] rounded-lg text-[#9A9A9A] tracking-widest font-bold font-display">
            CANCEL
          </button>
          <button onClick={handleSave} disabled={isSaving} className="flex-1 py-3 bg-[#CCFF00] text-black hover:brightness-110 rounded-lg tracking-widest font-bold font-display flex items-center justify-center gap-2 disabled:opacity-50">
            <Save className="w-4 h-4" /> {isSaving ? 'SAVING...' : 'SAVE PLAN'}
          </button>
        </div>
      </div>
    </div>
  );
}

function FieldTag({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-1">
      <span className="text-zinc-500">{label}:</span>
      {children}
    </div>
  );
}
