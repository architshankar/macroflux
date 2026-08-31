import React, { useEffect, useState } from 'react';
import { Star } from 'lucide-react';
import { AdminProgram, getAdminPrograms, toggleFeatureProgram } from '../adminService';

interface ProgramLibraryPanelProps {
  showToast: (msg: string) => void;
}

export function ProgramLibraryPanel({ showToast }: ProgramLibraryPanelProps) {
  const [programs, setPrograms] = useState<AdminProgram[]>([]);
  const [isLoading, setIsLoading] = useState(true);

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

  return (
    <div className="bg-[#141414] border border-[#252525] rounded-xl overflow-hidden">
      <div className="p-6 border-b border-zinc-900">
        <h3 className="text-sm font-mono tracking-wider text-white uppercase">Program Library ({programs.length})</h3>
        <p className="text-[11px] text-zinc-500 mt-1">Toggle which shared programs get sorted first in the client-facing catalog.</p>
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
                <th className="px-4 py-3 text-right">Featured</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1F1F1F]">
              {programs.map((p) => (
                <tr key={p.id} className="hover:bg-[#1A1A1A]">
                  <td className="px-4 py-3 text-white font-sans font-semibold">{p.title}</td>
                  <td className="px-4 py-3">{p.plan_style || '—'}</td>
                  <td className="px-4 py-3">{p.total_weeks}</td>
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
