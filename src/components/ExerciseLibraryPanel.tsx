import React, { useEffect, useState } from 'react';
import { Search, Plus, Pencil, X, Archive, ArchiveRestore, ImagePlus } from 'lucide-react';
import {
  AdminExercise,
  ExerciseMedia,
  getAdminExercises,
  createExercise,
  updateExercise,
  getExerciseMedia,
  matchExerciseMedia,
} from '../adminService';

interface ExerciseLibraryPanelProps {
  showToast: (msg: string) => void;
}

const inputCls = 'w-full bg-[#0D0D0D] border border-zinc-800 focus:border-[#CCFF00] p-2.5 rounded-lg text-white outline-none text-xs font-mono';

const emptyNewExercise = { name: '', tutorial_url: '', tracking_type: 'reps', is_unilateral: false, muscle_group: '' };

export function ExerciseLibraryPanel({ showToast }: ExerciseLibraryPanelProps) {
  const [exercises, setExercises] = useState<AdminExercise[]>([]);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [editingExercise, setEditingExercise] = useState<AdminExercise | null>(null);
  const [newExercise, setNewExercise] = useState(emptyNewExercise);
  const [isCreating, setIsCreating] = useState(false);

  const [mediaTargetExerciseId, setMediaTargetExerciseId] = useState<string | null>(null);
  const [mediaSearch, setMediaSearch] = useState('');
  const [mediaResults, setMediaResults] = useState<ExerciseMedia[]>([]);
  const [isLoadingMedia, setIsLoadingMedia] = useState(false);

  const load = async (searchValue: string = search) => {
    setIsLoading(true);
    try {
      const data = await getAdminExercises(searchValue, 0, 50);
      setExercises(data.exercises);
      setTotal(data.total);
    } catch (err) {
      console.error(err);
      showToast('Error loading exercise library');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    load(search);
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newExercise.name.trim()) return;
    setIsCreating(true);
    try {
      await createExercise({
        name: newExercise.name,
        tutorial_url: newExercise.tutorial_url || null,
        tracking_type: newExercise.tracking_type,
        is_unilateral: newExercise.is_unilateral,
        muscle_group: newExercise.muscle_group || null,
      });
      showToast(`Exercise "${newExercise.name}" created`);
      setNewExercise(emptyNewExercise);
      load();
    } catch (err: any) {
      console.error(err);
      showToast(err.message || 'Error creating exercise');
    } finally {
      setIsCreating(false);
    }
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingExercise) return;
    try {
      await updateExercise(editingExercise.id, {
        name: editingExercise.name,
        tutorial_url: editingExercise.tutorial_url,
        tracking_type: editingExercise.tracking_type,
        is_unilateral: editingExercise.is_unilateral,
        muscle_group: editingExercise.muscle_group,
      });
      showToast(`Updated "${editingExercise.name}"`);
      setEditingExercise(null);
      load();
    } catch (err: any) {
      console.error(err);
      showToast(err.message || 'Error updating exercise');
    }
  };

  const handleToggleRetired = async (ex: AdminExercise) => {
    try {
      await updateExercise(ex.id, { is_retired: !ex.is_retired });
      showToast(ex.is_retired ? `"${ex.name}" restored` : `"${ex.name}" retired`);
      load();
    } catch (err) {
      console.error(err);
      showToast('Error updating exercise');
    }
  };

  const openMediaMatch = async (exerciseId: string) => {
    setMediaTargetExerciseId(exerciseId);
    setMediaSearch('');
    setIsLoadingMedia(true);
    try {
      const data = await getExerciseMedia('', 0);
      setMediaResults(data.media);
    } catch (err) {
      console.error(err);
      showToast('Error loading media library');
    } finally {
      setIsLoadingMedia(false);
    }
  };

  const handleMediaSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoadingMedia(true);
    try {
      const data = await getExerciseMedia(mediaSearch, 0);
      setMediaResults(data.media);
    } catch (err) {
      console.error(err);
      showToast('Error searching media library');
    } finally {
      setIsLoadingMedia(false);
    }
  };

  const handleMatch = async (mediaId: string) => {
    if (!mediaTargetExerciseId) return;
    try {
      await matchExerciseMedia(mediaTargetExerciseId, mediaId);
      showToast('Media matched to exercise');
      setMediaTargetExerciseId(null);
      load();
    } catch (err) {
      console.error(err);
      showToast('Error matching media');
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="font-display font-semibold text-2xl tracking-tight text-white">Exercise Library</h1>
          <p className="text-[#9A9A9A] text-xs sm:text-sm mt-1">
            Direct CRUD on the shared exercise table, plus manual matching against the exercise-media dataset.
          </p>
        </div>
        <div className="inline-flex items-center space-x-2 bg-[#141414] border border-[#252525] rounded-lg px-4 py-2">
          <span className="text-xs font-mono text-[#9A9A9A]">EXERCISES:</span>
          <span className="text-xs font-mono font-bold text-[#CCFF00]">{total}</span>
        </div>
      </div>

      {/* Create form */}
      <div className="bg-[#141414] border border-[#252525] rounded-xl p-6 space-y-4">
        <h3 className="text-sm font-mono tracking-wider text-white uppercase border-b border-zinc-900 pb-3">
          Add New Exercise
        </h3>
        <form onSubmit={handleCreate} className="grid grid-cols-1 sm:grid-cols-6 gap-3 items-end">
          <div className="sm:col-span-2">
            <label className="text-[#9A9A9A] text-[10px] uppercase block mb-1">Name</label>
            <input required className={inputCls} value={newExercise.name} onChange={(e) => setNewExercise({ ...newExercise, name: e.target.value })} />
          </div>
          <div>
            <label className="text-[#9A9A9A] text-[10px] uppercase block mb-1">Muscle Group</label>
            <input className={inputCls} value={newExercise.muscle_group} onChange={(e) => setNewExercise({ ...newExercise, muscle_group: e.target.value })} />
          </div>
          <div>
            <label className="text-[#9A9A9A] text-[10px] uppercase block mb-1">Tracking</label>
            <select className={inputCls} value={newExercise.tracking_type} onChange={(e) => setNewExercise({ ...newExercise, tracking_type: e.target.value })}>
              <option value="reps">Reps</option>
              <option value="time">Time</option>
            </select>
          </div>
          <div className="pb-2.5">
            <label className="flex items-center gap-2 text-[#9A9A9A] text-[10px] uppercase">
              <input type="checkbox" checked={newExercise.is_unilateral} onChange={(e) => setNewExercise({ ...newExercise, is_unilateral: e.target.checked })} />
              Unilateral
            </label>
          </div>
          <div>
            <button type="submit" disabled={isCreating} className="w-full py-2.5 bg-[#CCFF00] text-black font-display font-bold rounded-lg uppercase text-xs tracking-wider flex items-center justify-center gap-1.5 disabled:opacity-50">
              <Plus className="w-3.5 h-3.5" /> Add
            </button>
          </div>
        </form>
      </div>

      {/* Search + table */}
      <div className="bg-[#141414] border border-[#252525] rounded-xl overflow-hidden">
        <form onSubmit={handleSearch} className="flex gap-3 p-4 border-b border-zinc-900">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
            <input
              type="text"
              placeholder="Search exercises by name..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-[#0D0D0D] border border-[#252525] focus:border-[#CCFF00] rounded-lg text-xs font-mono outline-none text-white"
            />
          </div>
          <button type="submit" className="px-4 py-2 bg-zinc-900 border border-zinc-800 rounded-lg text-xs font-mono text-zinc-300 hover:border-zinc-700">
            Search
          </button>
        </form>

        {isLoading ? (
          <p className="text-zinc-500 text-xs font-mono p-6">Loading...</p>
        ) : exercises.length === 0 ? (
          <p className="text-zinc-500 text-xs font-mono p-6 text-center">No exercises matched.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left font-mono text-xs text-[#9A9A9A]">
              <thead className="bg-[#0A0A0A] text-white border-b border-[#202020] uppercase font-bold text-[10px] tracking-widest">
                <tr>
                  <th className="px-4 py-3">Name</th>
                  <th className="px-4 py-3">Muscle Group</th>
                  <th className="px-4 py-3">Tracking</th>
                  <th className="px-4 py-3">Unilateral</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1F1F1F]">
                {exercises.map((ex) => (
                  <tr key={ex.id} className={`hover:bg-[#1A1A1A] ${ex.is_retired ? 'opacity-50' : ''}`}>
                    <td className="px-4 py-3 text-white font-sans font-semibold">{ex.name}</td>
                    <td className="px-4 py-3">{ex.muscle_group || '—'}</td>
                    <td className="px-4 py-3">{ex.tracking_type}</td>
                    <td className="px-4 py-3">{ex.is_unilateral ? 'Yes' : 'No'}</td>
                    <td className="px-4 py-3">{ex.is_retired ? 'Retired' : 'Active'}</td>
                    <td className="px-4 py-3 text-right">
                      <div className="inline-flex gap-2">
                        <button onClick={() => setEditingExercise({ ...ex })} title="Edit name, muscle group, tracking, unilateral" className="p-1 px-2 rounded bg-zinc-900 border border-zinc-800 hover:border-[#CCFF00] text-[#9A9A9A] hover:text-[#CCFF00]">
                          <Pencil className="w-3.5 h-3.5" />
                        </button>
                        <button onClick={() => openMediaMatch(ex.id)} title="Match media" className="p-1 px-2 rounded bg-zinc-900 border border-zinc-800 hover:border-[#CCFF00] text-[#9A9A9A] hover:text-[#CCFF00]">
                          <ImagePlus className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleToggleRetired(ex)}
                          title={ex.is_retired ? 'Restore' : 'Retire'}
                          className={`p-1 px-2 rounded border ${ex.is_retired ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' : 'bg-red-500/10 border-red-500/20 text-red-400'}`}
                        >
                          {ex.is_retired ? <ArchiveRestore className="w-3.5 h-3.5" /> : <Archive className="w-3.5 h-3.5" />}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Edit modal */}
      {editingExercise && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-6 z-50">
          <div className="bg-[#141414] border-2 border-[#252525] rounded-xl p-6 sm:p-8 w-full max-w-lg relative">
            <button type="button" onClick={() => setEditingExercise(null)} className="absolute top-4 right-4 text-zinc-500 hover:text-white">
              <X className="w-5 h-5" />
            </button>
            <h3 className="font-display font-bold text-lg text-white mb-6">Edit Exercise</h3>
            <form onSubmit={handleSaveEdit} className="space-y-4 text-xs font-mono">
              <div>
                <label className="text-[#9A9A9A] block mb-1">Name</label>
                <input required className={inputCls} value={editingExercise.name} onChange={(e) => setEditingExercise({ ...editingExercise, name: e.target.value })} />
              </div>
              <div>
                <label className="text-[#9A9A9A] block mb-1">Tutorial URL</label>
                <input className={inputCls} value={editingExercise.tutorial_url || ''} onChange={(e) => setEditingExercise({ ...editingExercise, tutorial_url: e.target.value })} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[#9A9A9A] block mb-1">Muscle Group</label>
                  <input className={inputCls} value={editingExercise.muscle_group || ''} onChange={(e) => setEditingExercise({ ...editingExercise, muscle_group: e.target.value })} />
                </div>
                <div>
                  <label className="text-[#9A9A9A] block mb-1">Tracking Type</label>
                  <select className={inputCls} value={editingExercise.tracking_type} onChange={(e) => setEditingExercise({ ...editingExercise, tracking_type: e.target.value })}>
                    <option value="reps">Reps</option>
                    <option value="time">Time</option>
                  </select>
                </div>
              </div>
              <label className="flex items-center gap-2 text-[#9A9A9A]">
                <input type="checkbox" checked={editingExercise.is_unilateral} onChange={(e) => setEditingExercise({ ...editingExercise, is_unilateral: e.target.checked })} />
                Unilateral (per-side reps)
              </label>
              <div className="pt-4 flex gap-3">
                <button type="button" onClick={() => setEditingExercise(null)} className="flex-1 py-3 border border-zinc-800 hover:bg-[#1A1A1A] rounded-lg text-[#9A9A9A] tracking-widest font-bold font-display">
                  CANCEL
                </button>
                <button type="submit" className="flex-1 py-3 bg-[#CCFF00] text-black hover:brightness-110 rounded-lg tracking-widest font-bold font-display">
                  SAVE
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Media match modal */}
      {mediaTargetExerciseId && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-6 z-50">
          <div className="bg-[#141414] border-2 border-[#252525] rounded-xl p-6 sm:p-8 w-full max-w-2xl relative max-h-[85vh] overflow-y-auto">
            <button type="button" onClick={() => setMediaTargetExerciseId(null)} className="absolute top-4 right-4 text-zinc-500 hover:text-white">
              <X className="w-5 h-5" />
            </button>
            <h3 className="font-display font-bold text-lg text-white mb-4">Match Exercise Media</h3>
            <form onSubmit={handleMediaSearch} className="flex gap-3 mb-4">
              <input
                type="text"
                placeholder="Filter by body part (e.g. chest, back)..."
                value={mediaSearch}
                onChange={(e) => setMediaSearch(e.target.value)}
                className={inputCls}
              />
              <button type="submit" className="px-4 py-2 bg-zinc-900 border border-zinc-800 rounded-lg text-xs font-mono text-zinc-300 hover:border-zinc-700 shrink-0">
                Filter
              </button>
            </form>
            {isLoadingMedia ? (
              <p className="text-zinc-500 text-xs font-mono">Loading...</p>
            ) : mediaResults.length === 0 ? (
              <p className="text-zinc-500 text-xs font-mono">No media entries matched.</p>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {mediaResults.map((m) => (
                  <button
                    key={m.id}
                    onClick={() => handleMatch(m.id)}
                    className="bg-[#0D0D0D] border border-zinc-800 hover:border-[#CCFF00] rounded-lg overflow-hidden text-left text-xs font-mono text-zinc-300 group"
                  >
                    <div className="aspect-square bg-black/40 overflow-hidden">
                      {m.gif_url || m.image_url ? (
                        <img
                          src={m.image_url || m.gif_url || ''}
                          onMouseEnter={(e) => { if (m.gif_url) (e.currentTarget as HTMLImageElement).src = m.gif_url; }}
                          onMouseLeave={(e) => { if (m.image_url) (e.currentTarget as HTMLImageElement).src = m.image_url; }}
                          alt={m.source_name}
                          className="w-full h-full object-cover"
                          loading="lazy"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-zinc-700 text-[10px]">No preview</div>
                      )}
                    </div>
                    <div className="p-3">
                      <div className="text-white font-semibold truncate">{m.source_name}</div>
                      <div className="text-zinc-500 text-[10px] mt-1">{m.body_part} · {m.target}</div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
