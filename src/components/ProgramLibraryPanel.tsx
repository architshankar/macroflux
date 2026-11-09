import React, { useEffect, useState } from 'react';
import { Star } from 'lucide-react';
import { AdminProgram, getAdminPrograms, toggleFeatureProgram, setProgramEnabled } from '../adminService';

interface ProgramLibraryPanelProps {
  showToast: (msg: string) => void;
}

export function ProgramLibraryPanel({ showToast }: ProgramLibraryPanelProps) {
  const [programs, setPrograms] = useState<AdminProgram[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [togglingId, setTogglingId] = useState<string | null>(null);

  const load = async () => {
    setIsLoading(true);
    try {
      const data = await getAdminPrograms();
      setPrograms(data.programs);
    } catch (err) {
      console.error(err);
      showToast('Error loading program library');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const handleToggleFeature = async (program: AdminProgram) => {
    try {
      await toggleFeatureProgram(program.id);
      showToast(program.is_featured ? `"${program.title}" unfeatured` : `"${program.title}" featured`);
      setPrograms((prev) =>
        prev
          .map((p) => (p.id === program.id ? { ...p, is_featured: !p.is_featured } : p))
          .sort((a, b) => Number(b.is_featured) - Number(a.is_featured))
      );
    } catch (err) {
      console.error(err);
      showToast('Error updating featured status');
    }
  };

  const handleToggleEnabled = async (program: AdminProgram) => {
    const enable = program.is_enabled === false;
    if (
      !enable &&
      !window.confirm(
        `Disable "${program.title}"? It disappears from the app's program catalog, can't be opened, and trainers ` +
          "can't assign it. Nothing is deleted — users' workout history is kept, and you can enable it again any time."
      )
    )
      return;
    setTogglingId(program.id);
    try {
      const res = await setProgramEnabled(program.id, enable);
      setPrograms((prev) => prev.map((p) => (p.id === program.id ? { ...p, is_enabled: res.is_enabled } : p)));
      showToast(enable ? `"${program.title}" enabled — back in the app catalog` : `"${program.title}" disabled — hidden from the app`);
    } catch (err: any) {
      console.error(err);
      showToast(err.message || 'Error updating program');
    } finally {
      setTogglingId(null);
    }
  };

  return (
    <div className="bg-[#141414] border border-[#252525] rounded-xl overflow-hidden">
      <div className="p-6 border-b border-zinc-900">
        <h3 className="text-sm font-mono tracking-wider text-white uppercase">Program Library ({programs.length})</h3>
        <p className="text-[11px] text-zinc-500 mt-1">
          Enable or disable shared programs in the app catalog, and choose which ones get sorted first (Featured).
        </p>
      </div>
      {isLoading ? (
        <p className="text-zinc-500 text-xs font-mono p-6">Loading...</p>
      ) : programs.length === 0 ? (
        <p className="text-zinc-500 text-xs font-mono p-6 text-center">No library programs yet — upload one below.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left font-mono text-xs text-[#9A9A9A]">
            <thead className="bg-[#0A0A0A] text-white border-b border-[#202020] uppercase font-bold text-[10px] tracking-widest">
              <tr>
                <th className="px-4 py-3">Title</th>
                <th className="px-4 py-3">Style</th>
                <th className="px-4 py-3">Weeks</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-right">Featured</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1F1F1F]">
              {programs.map((p) => (
                <tr key={p.id} className={`hover:bg-[#1A1A1A] ${p.is_enabled === false ? 'opacity-60' : ''}`}>
                  <td className="px-4 py-3 text-white font-sans font-semibold">{p.title}</td>
                  <td className="px-4 py-3">{p.plan_style || '—'}</td>
                  <td className="px-4 py-3">{p.total_weeks}</td>
                  <td className="px-4 py-3">
                    <button
                      type="button"
                      role="switch"
                      aria-checked={p.is_enabled !== false}
                      aria-label={`${p.is_enabled === false ? 'Enable' : 'Disable'} ${p.title}`}
                      onClick={() => handleToggleEnabled(p)}
                      disabled={togglingId === p.id}
                      title={p.is_enabled === false ? 'Hidden from the app — click to enable' : 'Visible in the app — click to disable'}
                      className="flex items-center gap-2 disabled:opacity-50"
                    >
                      <span className={`relative w-8 h-[18px] rounded-full transition-colors ${p.is_enabled !== false ? 'bg-emerald-500' : 'bg-zinc-700'}`}>
                        <span
                          className={`absolute top-0.5 w-3.5 h-3.5 rounded-full bg-black transition-all ${p.is_enabled !== false ? 'left-[16px]' : 'left-0.5'}`}
                        />
                      </span>
                      <span className={`text-[9px] font-bold uppercase ${p.is_enabled !== false ? 'text-emerald-400' : 'text-zinc-500'}`}>
                        {togglingId === p.id ? '...' : p.is_enabled !== false ? 'Enabled' : 'Disabled'}
                      </span>
                    </button>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button
                      onClick={() => handleToggleFeature(p)}
                      className={`p-1 px-2.5 rounded border inline-flex items-center gap-1.5 ${
                        p.is_featured
                          ? 'bg-[#CCFF00]/10 border-[#CCFF00]/30 text-[#CCFF00]'
                          : 'bg-zinc-900 border-zinc-800 text-zinc-500 hover:text-zinc-300'
                      }`}
                    >
                      <Star className="w-3.5 h-3.5" fill={p.is_featured ? 'currentColor' : 'none'} />
                      {p.is_featured ? 'Featured' : 'Feature'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
