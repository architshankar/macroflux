import React, { useEffect, useState } from 'react';
import { Search, Plus, Check, X, Ban, Settings2, ArrowUpCircle, ImagePlus } from 'lucide-react';
import {
  AdminGym,
  listGymsAdmin,
  createGymAdmin,
  approveGym,
  rejectGym,
  suspendGym,
  toggleGymTier,
  uploadGymPhoto,
} from '../adminService';
import { GymDetailPanel } from './GymDetailPanel';

interface GymsPanelProps {
  showToast: (msg: string) => void;
}

const card = 'bg-[#141414] border border-[#252525] rounded-xl p-6 space-y-4';
const th = 'px-4 py-3';
const td = 'px-4 py-3';
const inputCls = 'w-full bg-[#0D0D0D] border border-zinc-800 focus:border-[#CCFF00] p-2.5 rounded-lg text-white outline-none text-xs font-mono';

const emptyNewGym = { name: '', description: '', address: '', lat: '', lng: '', city: '', phone: '', owner_user_id: '' };

const statusBadge = (status: AdminGym['status']) => {
  const map: Record<string, string> = {
    live: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
    pending_review: 'bg-amber-500/10 text-amber-500 border-amber-500/20',
    rejected: 'bg-red-500/10 text-red-500 border-red-500/20',
    suspended: 'bg-zinc-700/30 text-zinc-400 border-zinc-600/40',
  };
  return `inline-flex items-center px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-widest border ${map[status] || map.suspended}`;
};

export function GymsPanel({ showToast }: GymsPanelProps) {
  const [gyms, setGyms] = useState<AdminGym[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [tierFilter, setTierFilter] = useState<string>('');
  const [sourceFilter, setSourceFilter] = useState<string>('');
  const [search, setSearch] = useState('');
  const [newGym, setNewGym] = useState(emptyNewGym);
  const [newGymPhoto, setNewGymPhoto] = useState<File | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [selectedGym, setSelectedGym] = useState<AdminGym | null>(null);

  const load = async () => {
    setIsLoading(true);
    try {
      const data = await listGymsAdmin({
        status: statusFilter || undefined,
        tier: tierFilter || undefined,
        source: sourceFilter || undefined,
      });
      setGyms(data);
    } catch (err) {
      console.error(err);
      showToast('Error loading gyms');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statusFilter, tierFilter, sourceFilter]);

  const filteredGyms = gyms.filter(
    (g) =>
      g.name.toLowerCase().includes(search.toLowerCase()) ||
      (g.city || '').toLowerCase().includes(search.toLowerCase()) ||
      g.address.toLowerCase().includes(search.toLowerCase())
  );

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newGym.name.trim() || !newGym.address.trim()) return;
    setIsCreating(true);
    try {
      const created = await createGymAdmin({
        name: newGym.name,
        description: newGym.description || null,
        address: newGym.address,
        lat: newGym.lat ? parseFloat(newGym.lat) : null,
        lng: newGym.lng ? parseFloat(newGym.lng) : null,
        city: newGym.city || null,
        phone: newGym.phone || null,
        owner_user_id: newGym.owner_user_id || null,
      });
      if (newGymPhoto) {
        try {
          await uploadGymPhoto(created.id, newGymPhoto);
        } catch (photoErr: any) {
          console.error(photoErr);
          showToast(`Gym created, but photo upload failed: ${photoErr.message || 'unknown error'}`);
        }
      }
      showToast(`Gym "${newGym.name}" created and live`);
      setNewGym(emptyNewGym);
      setNewGymPhoto(null);
      setShowCreateForm(false);
      load();
    } catch (err: any) {
      console.error(err);
      showToast(err.message || 'Error creating gym');
    } finally {
      setIsCreating(false);
    }
  };

  const handleApprove = async (gym: AdminGym) => {
    try {
      await approveGym(gym.id);
      showToast(`"${gym.name}" approved and now live`);
      load();
    } catch (err) {
      console.error(err);
      showToast('Error approving gym');
    }
  };

  const handleReject = async (gym: AdminGym) => {
    if (!window.confirm(`Reject "${gym.name}"'s self-signup listing?`)) return;
    try {
      await rejectGym(gym.id);
      showToast(`"${gym.name}" rejected`);
      load();
    } catch (err) {
      console.error(err);
      showToast('Error rejecting gym');
    }
  };

  const handleSuspend = async (gym: AdminGym) => {
    if (!window.confirm(`Suspend "${gym.name}"? It will stop appearing in the app's gym browse.`)) return;
    try {
      await suspendGym(gym.id);
      showToast(`"${gym.name}" suspended`);
      load();
    } catch (err) {
      console.error(err);
      showToast('Error suspending gym');
    }
  };

  const handleToggleTier = async (gym: AdminGym) => {
    try {
      const updated = await toggleGymTier(gym.id);
      showToast(`"${gym.name}" tier is now ${updated.tier.toUpperCase()}`);
      load();
    } catch (err) {
      console.error(err);
      showToast('Error toggling tier');
    }
  };

  if (selectedGym) {
    return (
      <GymDetailPanel
        gym={selectedGym}
        onBack={() => {
          setSelectedGym(null);
          load();
        }}
        showToast={showToast}
      />
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="font-display font-semibold text-2xl tracking-tight text-white">Gyms</h1>
          <p className="text-[#9A9A9A] text-xs sm:text-sm mt-1">
            Manage gym listings, approve self-signups, toggle paid tier, and drill into a gym's equipment, amenities,
            trainers, and plans.
          </p>
        </div>
        <button
          onClick={() => setShowCreateForm((v) => !v)}
          className="py-2.5 px-4 bg-[#CCFF00] text-black font-display font-bold rounded-lg uppercase text-xs tracking-wider flex items-center justify-center gap-1.5"
        >
          <Plus className="w-3.5 h-3.5" /> {showCreateForm ? 'Cancel' : 'Add Gym'}
        </button>
      </div>

      {showCreateForm && (
        <div className={card}>
          <h3 className="text-sm font-mono tracking-wider text-white uppercase border-b border-zinc-900 pb-3">
            Create Gym (admin-added, goes live immediately)
          </h3>
          <form onSubmit={handleCreate} className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <input required placeholder="Name" className={inputCls} value={newGym.name} onChange={(e) => setNewGym({ ...newGym, name: e.target.value })} />
            <input required placeholder="Address" className={inputCls} value={newGym.address} onChange={(e) => setNewGym({ ...newGym, address: e.target.value })} />
            <input placeholder="City" className={inputCls} value={newGym.city} onChange={(e) => setNewGym({ ...newGym, city: e.target.value })} />
            <input placeholder="Phone" className={inputCls} value={newGym.phone} onChange={(e) => setNewGym({ ...newGym, phone: e.target.value })} />
            <input placeholder="Latitude" type="number" step="any" className={inputCls} value={newGym.lat} onChange={(e) => setNewGym({ ...newGym, lat: e.target.value })} />
            <input placeholder="Longitude" type="number" step="any" className={inputCls} value={newGym.lng} onChange={(e) => setNewGym({ ...newGym, lng: e.target.value })} />
            <input placeholder="Owner user_id (optional)" className={inputCls} value={newGym.owner_user_id} onChange={(e) => setNewGym({ ...newGym, owner_user_id: e.target.value })} />
            <input placeholder="Description (optional)" className={`${inputCls} sm:col-span-2`} value={newGym.description} onChange={(e) => setNewGym({ ...newGym, description: e.target.value })} />
            <div className="sm:col-span-3">
              <label className="text-[#9A9A9A] text-[10px] uppercase flex items-center gap-1.5 mb-1">
                <ImagePlus className="w-3.5 h-3.5" /> Gym photo (optional — uploaded right after the gym is created)
              </label>
              <input
                type="file"
                accept="image/png,image/jpeg,image/gif,image/webp"
                onChange={(e) => setNewGymPhoto(e.target.files?.[0] || null)}
                className="w-full bg-[#0D0D0D] border border-zinc-800 rounded-lg p-2 text-white text-xs font-mono file:mr-3 file:py-1 file:px-3 file:rounded file:border-0 file:bg-zinc-800 file:text-zinc-300 file:text-xs"
              />
            </div>
            <button type="submit" disabled={isCreating} className="py-2.5 bg-[#CCFF00] text-black font-display font-bold rounded-lg uppercase text-xs tracking-wider flex items-center justify-center gap-1.5 disabled:opacity-50 sm:col-span-3">
              <Plus className="w-3.5 h-3.5" /> Create Gym
            </button>
          </form>
        </div>
      )}

      <div className={card}>
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
            <input
              type="text"
              placeholder="Search by name, city, or address..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-[#0D0D0D] border border-[#252525] focus:border-[#CCFF00] rounded-lg text-xs font-mono outline-none text-white"
            />
          </div>
          <select className={`${inputCls} sm:w-44`} value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
            <option value="">All statuses</option>
            <option value="live">Live</option>
            <option value="pending_review">Pending review</option>
            <option value="rejected">Rejected</option>
            <option value="suspended">Suspended</option>
          </select>
          <select className={`${inputCls} sm:w-32`} value={tierFilter} onChange={(e) => setTierFilter(e.target.value)}>
            <option value="">All tiers</option>
            <option value="free">Free</option>
            <option value="paid">Paid</option>
          </select>
          <select className={`${inputCls} sm:w-40`} value={sourceFilter} onChange={(e) => setSourceFilter(e.target.value)}>
            <option value="">All sources</option>
            <option value="admin_added">Admin-added</option>
            <option value="self_signup">Self-signup</option>
          </select>
        </div>
      </div>

      <div className="bg-[#141414] border border-[#252525] rounded-xl overflow-hidden">
        {isLoading ? (
          <p className="text-zinc-500 text-xs font-mono p-6">Loading...</p>
        ) : filteredGyms.length === 0 ? (
          <p className="text-zinc-500 text-xs font-mono p-6 text-center">No gyms matched.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left font-mono text-xs text-[#9A9A9A]">
              <thead className="bg-[#0A0A0A] text-white border-b border-[#202020] uppercase font-bold text-[10px] tracking-widest">
                <tr>
                  <th className={th}>Gym</th>
                  <th className={th}>Tier</th>
                  <th className={th}>Status</th>
                  <th className={th}>Source</th>
                  <th className={th}>Join code</th>
                  <th className={`${th} text-right`}>Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1F1F1F]">
                {filteredGyms.map((gym) => (
                  <tr key={gym.id} className="hover:bg-[#1A1A1A]">
                    <td className={`${td} font-sans`}>
                      <div className="flex items-center gap-3">
                        <div
                          className="w-10 h-10 rounded-lg bg-zinc-900 border border-zinc-800 bg-cover bg-center shrink-0"
                          style={gym.photo_url ? { backgroundImage: `url(${gym.photo_url})` } : undefined}
                        />
                        <div>
                          <div className="text-white font-semibold text-sm">{gym.name}</div>
                          <div className="text-zinc-500 text-xs mt-0.5">{gym.city ? `${gym.city} — ` : ''}{gym.address}</div>
                        </div>
                      </div>
                    </td>
                    <td className={td}>
                      <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase border ${gym.tier === 'paid' ? 'bg-[#CCFF00]/10 text-[#CCFF00] border-[#CCFF00]/20' : 'bg-zinc-800 text-zinc-400 border-zinc-700'}`}>
                        {gym.tier}
                      </span>
                    </td>
                    <td className={td}>
                      <span className={statusBadge(gym.status)}>{gym.status.replace('_', ' ')}</span>
                    </td>
                    <td className={td}>{gym.source === 'admin_added' ? 'Admin-added' : 'Self-signup'}</td>
                    <td className={td}>
                      {!gym.join_code ? (
                        <span className="text-zinc-600">—</span>
                      ) : (
                        <span
                          title={gym.join_code_enabled ? 'Members can join with this code' : 'Code disabled — new members cannot join'}
                          className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase border whitespace-nowrap ${
                            gym.join_code_enabled
                              ? 'bg-[#CCFF00]/10 text-[#CCFF00] border-[#CCFF00]/20'
                              : 'bg-zinc-800 text-zinc-500 border-zinc-700 line-through'
                          }`}
                        >
                          {gym.join_code_enabled ? 'Active' : 'Disabled'}
                        </span>
                      )}
                    </td>
                    <td className={`${td} text-right`}>
                      <div className="inline-flex gap-2 flex-wrap justify-end">
                        {gym.status === 'pending_review' && (
                          <>
                            <button onClick={() => handleApprove(gym)} className="p-1 px-2.5 rounded bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 hover:bg-emerald-500/20 flex items-center gap-1.5">
                              <Check className="w-3.5 h-3.5" /> Approve
                            </button>
                            <button onClick={() => handleReject(gym)} className="p-1 px-2.5 rounded bg-red-500/10 border border-red-500/20 text-red-400 hover:bg-red-500/20 flex items-center gap-1.5">
                              <X className="w-3.5 h-3.5" /> Reject
                            </button>
                          </>
                        )}
                        {gym.status === 'live' && (
                          <button onClick={() => handleSuspend(gym)} title="Suspend" className="p-1 px-2.5 rounded bg-amber-500/10 border border-amber-500/20 text-amber-500 hover:bg-amber-500/20 flex items-center gap-1.5">
                            <Ban className="w-3.5 h-3.5" /> Suspend
                          </button>
                        )}
                        <button onClick={() => handleToggleTier(gym)} title="Toggle tier" className="p-1 px-2.5 rounded bg-zinc-900 border border-zinc-800 hover:border-[#CCFF00] text-[#9A9A9A] hover:text-[#CCFF00] flex items-center gap-1.5">
                          <ArrowUpCircle className="w-3.5 h-3.5" /> {gym.tier === 'paid' ? 'Set Free' : 'Set Paid'}
                        </button>
                        <button onClick={() => setSelectedGym(gym)} title="Manage gym" className="p-1 px-2.5 rounded bg-zinc-900 border border-zinc-800 hover:border-[#CCFF00] text-[#9A9A9A] hover:text-[#CCFF00] flex items-center gap-1.5">
                          <Settings2 className="w-3.5 h-3.5" /> Manage
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
    </div>
  );
}
