import React, { useEffect, useState } from 'react';
import { X, Plus, Trash2, Save, FileJson } from 'lucide-react';
import {
  GymPlan,
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

  const openJsonView = () => {
    setJsonText(JSON.stringify(stripIds(weeks), null, 2));
    setJsonError('');
    setShowJson(true);
  };

  const applyJson = () => {
    try {
      const parsed = JSON.parse(jsonText);
      if (!Array.isArray(parsed)) throw new Error('Expected a JSON array of weeks');
      setWeeks(parsed);
      setShowJson(false);
      setJsonError('');
    } catch (err: any) {
      setJsonError(err.message || 'Invalid JSON');
    }
  };

  const handleSave = async () => {
    if (!title.trim()) {
      showToast('Give this plan a title first');
      return;
    }
    setIsSaving(true);
    try {
      const cleanWeeks = stripIds(weeks);
      if (isEdit && plan) {
        await updateGymPlan(gymId, plan.id, {
          title,
          description: description || null,
          total_weeks: totalWeeks ? parseInt(totalWeeks, 10) : null,
          weeks: cleanWeeks,
        });
        showToast(`"${title}" updated`);
      } else {
        await createGymPlan(gymId, {
          type,
          title,
          description: description || null,
          total_weeks: totalWeeks ? parseInt(totalWeeks, 10) : null,
          weeks: cleanWeeks,
        });
        showToast(`"${title}" created`);
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
          <button onClick={showJson ? applyJson : openJsonView} className="text-xs font-mono text-zinc-400 hover:text-white flex items-center gap-1.5 border border-zinc-800 px-3 py-1.5 rounded">
            <FileJson className="w-3.5 h-3.5" /> {showJson ? 'Apply JSON' : 'Edit as JSON'}
          </button>
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
