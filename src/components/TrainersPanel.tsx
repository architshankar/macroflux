import React, { useEffect, useState } from 'react';
import { Check, X, ShieldCheck, EyeOff, Eye, Ban, UserPlus, ShieldOff, Trash2 } from 'lucide-react';
import {
  AdminTrainer,
  TrainerClientRelationship,
  getAllTrainers,
  createTrainerAccount,
  verifyTrainer,
  rejectTrainer,
  revokeTrainer,
  deleteTrainerAccount,
  setTrainerBioHidden,
  getTrainerClientRelationships,
  forceCancelRelationship,
} from '../adminService';

interface TrainersPanelProps {
  showToast: (msg: string) => void;
}

const card = 'bg-[#141414] border border-[#252525] rounded-xl p-6 space-y-4';
const th = 'px-4 py-3';
const td = 'px-4 py-3';
const inputCls = 'w-full bg-[#0D0D0D] border border-zinc-800 focus:border-[#CCFF00] p-2.5 rounded-lg text-white outline-none text-xs font-mono';

const emptyNewTrainer = { email: '', password: '', full_name: '', bio: '', specialties: '' };

export function TrainersPanel({ showToast }: TrainersPanelProps) {
  const [trainers, setTrainers] = useState<AdminTrainer[]>([]);
  const [relationships, setRelationships] = useState<TrainerClientRelationship[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [newTrainer, setNewTrainer] = useState(emptyNewTrainer);
  const [isCreatingTrainer, setIsCreatingTrainer] = useState(false);

  const load = async () => {
    setIsLoading(true);
    try {
      const [trainerData, relationshipData] = await Promise.all([
        getAllTrainers(),
        getTrainerClientRelationships(),
      ]);
      setTrainers(trainerData);
      setRelationships(relationshipData);
    } catch (err) {
      console.error(err);
      showToast('Error loading trainer data');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const pending = trainers.filter((t) => !t.is_verified);
  const verified = trainers.filter((t) => t.is_verified);
  const cancelableRelationships = relationships.filter((r) => r.status === 'active' || r.status === 'pending');

  const handleVerify = async (id: string) => {
    try {
      await verifyTrainer(id);
      showToast('Trainer verified');
      load();
    } catch (err) {
      console.error(err);
      showToast('Error verifying trainer');
    }
  };

  const handleReject = async (id: string) => {
    if (!window.confirm('Reject this trainer application? They will need to re-apply.')) return;
    try {
      await rejectTrainer(id);
      showToast('Trainer application rejected');
      load();
    } catch (err) {
      console.error(err);
      showToast('Error rejecting trainer');
    }
  };

  const handleToggleBioHidden = async (t: AdminTrainer) => {
    try {
      await setTrainerBioHidden(t.id, !t.bio_hidden);
      showToast(t.bio_hidden ? 'Bio is now visible' : 'Bio is now hidden');
      load();
    } catch (err) {
      console.error(err);
      showToast('Error updating bio visibility');
    }
  };

  const handleCreateTrainer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTrainer.email.trim() || !newTrainer.password.trim()) return;
    setIsCreatingTrainer(true);
    try {
      await createTrainerAccount({
        email: newTrainer.email,
        password: newTrainer.password,
        full_name: newTrainer.full_name || undefined,
        bio: newTrainer.bio || undefined,
        specialties: newTrainer.specialties
          ? newTrainer.specialties.split(',').map((s) => s.trim()).filter(Boolean)
          : [],
      });
      showToast(`Trainer account created for ${newTrainer.email} — verified immediately`);
      setNewTrainer(emptyNewTrainer);
      load();
    } catch (err: any) {
      console.error(err);
      showToast(err.message || 'Error creating trainer account');
    } finally {
      setIsCreatingTrainer(false);
    }
  };

  const handleRevoke = async (t: AdminTrainer) => {
    if (
      !window.confirm(
        `Revoke trainer status for ${t.full_name || t.email}? Their account, workouts, and history stay intact — they'd need to re-apply to become a trainer again.`
      )
    )
      return;
    try {
      await revokeTrainer(t.id);
      showToast('Trainer status revoked');
      load();
    } catch (err) {
      console.error(err);
      showToast('Error revoking trainer status');
    }
  };

  const handleDeleteAccount = async (t: AdminTrainer) => {
    const confirmation = window.prompt(
      `This PERMANENTLY deletes ${t.full_name || t.email}'s entire account — profile, workouts, authored programs, and every client relationship (active and historical). This cannot be undone.\n\nType DELETE to confirm.`
    );
    if (confirmation === null) return;
    if (confirmation !== 'DELETE') {
      showToast('Deletion cancelled — confirmation text did not match');
      return;
    }
    try {
      await deleteTrainerAccount(t.id);
      showToast('Trainer account permanently deleted');
      load();
    } catch (err) {
      console.error(err);
      showToast('Error deleting trainer account');
    }
  };

  const handleForceCancel = async (id: string) => {
    if (!window.confirm('Force-cancel this trainer-client relationship?')) return;
    try {
      await forceCancelRelationship(id);
      showToast('Relationship cancelled');
      load();
    } catch (err) {
      console.error(err);
      showToast('Error cancelling relationship');
    }
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-display font-semibold text-2xl tracking-tight text-white">Trainer Governance</h1>
        <p className="text-[#9A9A9A] text-xs sm:text-sm mt-1">
          Review trainer applications, moderate public bios, and override stuck trainer-client relationships.
        </p>
      </div>

      {/* Direct create — bypasses the self-apply flow entirely */}
      <div className={card}>
        <h3 className="text-sm font-mono tracking-wider text-white uppercase border-b border-zinc-900 pb-3">
          Create Trainer Account
        </h3>
        <p className="text-[11px] text-zinc-500">
          Creates a brand-new login directly and marks it verified immediately — no application/review step.
        </p>
        <form onSubmit={handleCreateTrainer} className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <input required type="email" placeholder="Email" className={inputCls} value={newTrainer.email} onChange={(e) => setNewTrainer({ ...newTrainer, email: e.target.value })} />
          <input required type="password" placeholder="Password" className={inputCls} value={newTrainer.password} onChange={(e) => setNewTrainer({ ...newTrainer, password: e.target.value })} />
          <input placeholder="Full name" className={inputCls} value={newTrainer.full_name} onChange={(e) => setNewTrainer({ ...newTrainer, full_name: e.target.value })} />
          <input placeholder="Bio (optional)" className={inputCls} value={newTrainer.bio} onChange={(e) => setNewTrainer({ ...newTrainer, bio: e.target.value })} />
          <input placeholder="Specialties, comma separated" className={inputCls} value={newTrainer.specialties} onChange={(e) => setNewTrainer({ ...newTrainer, specialties: e.target.value })} />
          <button type="submit" disabled={isCreatingTrainer} className="py-2.5 bg-[#CCFF00] text-black font-display font-bold rounded-lg uppercase text-xs tracking-wider flex items-center justify-center gap-1.5 disabled:opacity-50">
            <UserPlus className="w-3.5 h-3.5" /> Create
          </button>
        </form>
      </div>

      {/* Pending applications */}
      <div className={card}>
        <h3 className="text-sm font-mono tracking-wider text-white uppercase border-b border-zinc-900 pb-3">
          Pending Applications ({pending.length})
        </h3>
        {isLoading ? (
          <p className="text-zinc-500 text-xs font-mono">Loading...</p>
        ) : pending.length === 0 ? (
          <p className="text-zinc-500 text-xs font-mono py-2">No pending applications.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left font-mono text-xs text-[#9A9A9A]">
              <thead className="bg-[#0A0A0A] text-white border-b border-[#202020] uppercase font-bold text-[10px] tracking-widest">
                <tr>
                  <th className={th}>Applicant</th>
                  <th className={th}>Bio</th>
                  <th className={th}>Specialties</th>
                  <th className={`${th} text-right`}>Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1F1F1F]">
                {pending.map((t) => (
                  <tr key={t.id} className="hover:bg-[#1A1A1A]">
                    <td className={`${td} font-sans`}>
                      <div className="text-white font-semibold text-sm">{t.full_name || 'Unknown'}</div>
                      <div className="text-zinc-500 text-xs mt-0.5">{t.email}</div>
                    </td>
                    <td className={`${td} max-w-[280px] truncate`}>{t.bio || '—'}</td>
                    <td className={td}>{t.specialties.join(', ') || '—'}</td>
                    <td className={`${td} text-right`}>
                      <div className="inline-flex gap-2">
                        <button
                          onClick={() => handleVerify(t.id)}
                          className="p-1 px-2.5 rounded bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 hover:bg-emerald-500/20 flex items-center gap-1.5"
                        >
                          <Check className="w-3.5 h-3.5" /> Verify
                        </button>
                        <button
                          onClick={() => handleReject(t.id)}
                          className="p-1 px-2.5 rounded bg-red-500/10 border border-red-500/20 text-red-400 hover:bg-red-500/20 flex items-center gap-1.5"
                        >
                          <X className="w-3.5 h-3.5" /> Reject
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

      {/* Verified trainers / bio moderation */}
      <div className={card}>
        <h3 className="text-sm font-mono tracking-wider text-white uppercase border-b border-zinc-900 pb-3">
          Verified Trainers ({verified.length})
        </h3>
        {!isLoading && verified.length === 0 ? (
          <p className="text-zinc-500 text-xs font-mono py-2">No verified trainers yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left font-mono text-xs text-[#9A9A9A]">
              <thead className="bg-[#0A0A0A] text-white border-b border-[#202020] uppercase font-bold text-[10px] tracking-widest">
                <tr>
                  <th className={th}>Trainer</th>
                  <th className={th}>Bio</th>
                  <th className={th}>Status</th>
                  <th className={`${th} text-right`}>Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1F1F1F]">
                {verified.map((t) => (
                  <tr key={t.id} className="hover:bg-[#1A1A1A]">
                    <td className={`${td} font-sans`}>
                      <div className="text-white font-semibold text-sm">{t.full_name || 'Unknown'}</div>
                      <div className="text-zinc-500 text-xs mt-0.5">{t.email}</div>
                    </td>
                    <td className={`${td} max-w-[280px] truncate`}>{t.bio || '—'}</td>
                    <td className={td}>
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-bold uppercase border ${
                        t.bio_hidden ? 'bg-amber-500/10 text-amber-500 border-amber-500/20' : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                      }`}>
                        <ShieldCheck className="w-3 h-3" /> {t.bio_hidden ? 'Bio Hidden' : 'Public'}
                      </span>
                    </td>
                    <td className={`${td} text-right`}>
                      <div className="inline-flex gap-2">
                        <button
                          onClick={() => handleToggleBioHidden(t)}
                          title={t.bio_hidden ? 'Unhide bio' : 'Hide bio'}
                          className="p-1 px-2.5 rounded bg-zinc-900 border border-zinc-800 hover:border-[#CCFF00] text-[#9A9A9A] hover:text-[#CCFF00] flex items-center gap-1.5"
                        >
                          {t.bio_hidden ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                          {t.bio_hidden ? 'Unhide' : 'Hide'}
                        </button>
                        <button
                          onClick={() => handleRevoke(t)}
                          title="Revoke trainer status (keeps account)"
                          className="p-1 px-2.5 rounded bg-amber-500/10 border border-amber-500/20 text-amber-500 hover:bg-amber-500/20 flex items-center gap-1.5"
                        >
                          <ShieldOff className="w-3.5 h-3.5" /> Revoke
                        </button>
                        <button
                          onClick={() => handleDeleteAccount(t)}
                          title="Permanently delete this trainer's account"
                          className="p-1 px-2.5 rounded bg-red-500/10 border border-red-500/20 text-red-400 hover:bg-red-500/20 flex items-center gap-1.5"
                        >
                          <Trash2 className="w-3.5 h-3.5" /> Delete
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

      {/* Trainer-client relationships */}
      <div className={card}>
        <h3 className="text-sm font-mono tracking-wider text-white uppercase border-b border-zinc-900 pb-3">
          Trainer-Client Relationships ({cancelableRelationships.length} active/pending)
        </h3>
        {!isLoading && relationships.length === 0 ? (
          <p className="text-zinc-500 text-xs font-mono py-2">No relationships found.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left font-mono text-xs text-[#9A9A9A]">
              <thead className="bg-[#0A0A0A] text-white border-b border-[#202020] uppercase font-bold text-[10px] tracking-widest">
                <tr>
                  <th className={th}>Trainer</th>
                  <th className={th}>Client</th>
                  <th className={th}>Status</th>
                  <th className={`${th} text-right`}>Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1F1F1F]">
                {relationships.map((r) => (
                  <tr key={r.id} className="hover:bg-[#1A1A1A]">
                    <td className={`${td} text-white font-sans`}>{r.trainer_full_name || r.trainer_id}</td>
                    <td className={`${td} text-white font-sans`}>{r.client_full_name || r.client_id}</td>
                    <td className={td}>{r.status}</td>
                    <td className={`${td} text-right`}>
                      {(r.status === 'active' || r.status === 'pending') && (
                        <button
                          onClick={() => handleForceCancel(r.id)}
                          className="p-1 px-2.5 rounded bg-red-500/10 border border-red-500/20 text-red-400 hover:bg-red-500/20 flex items-center gap-1.5 ml-auto"
                        >
                          <Ban className="w-3.5 h-3.5" /> Force-cancel
                        </button>
                      )}
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
