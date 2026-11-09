import React, { useEffect, useRef, useState } from 'react';
import { KeyRound, Copy, Check, Printer, RefreshCw, LogOut, Loader2, AlertTriangle, Ban, Users, MapPin } from 'lucide-react';
import { MyAdminGym, GymJoinCode, listMyGyms, getGymJoinCode, logoutPanel } from '../adminService';
import { isApiError } from '../apiClient';
import { useAdminAuth } from '../hooks/useAdminAuth';
import { formatDateTime } from '../dateFormat';
import { copyToClipboard, formatCodeForDisplay, openJoinCodePoster } from './GymMembersTab';

// Read-only gym-manager view (gym_admins login). Shows the gym's join code
// and how many members joined with it. Managers can't regenerate/disable the
// code or add/remove members — the backend rejects those for non-super-admins.

const card = 'bg-[#141414] border border-[#252525] rounded-xl p-6';

interface GymManagerPageProps {
  onNavigateToLogin: () => void;
  onNavigateToAdmin: () => void;
}

export function GymManagerPage({ onNavigateToLogin, onNavigateToAdmin }: GymManagerPageProps) {
  const { userId, isAdmin, isLoading: isAuthLoading } = useAdminAuth();
  const [gyms, setGyms] = useState<MyAdminGym[] | null>(null);
  const [gymsError, setGymsError] = useState<string | null>(null);
  const [selectedGymId, setSelectedGymId] = useState<string | null>(null);

  useEffect(() => {
    if (isAuthLoading) return;
    if (!userId) onNavigateToLogin();
  }, [isAuthLoading, userId, onNavigateToLogin]);

  const loadGyms = async () => {
    setGymsError(null);
    try {
      const list = await listMyGyms();
      setGyms(list);
      setSelectedGymId((cur) => (cur && list.some((g) => g.id === cur) ? cur : list[0]?.id ?? null));
    } catch (err) {
      console.error(err);
      if (isApiError(err, 401)) return onNavigateToLogin();
      setGymsError((err as Error).message || 'Could not load your gyms');
    }
  };

  useEffect(() => {
    if (userId) loadGyms();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  const handleLogout = async () => {
    try {
      await logoutPanel();
    } catch (err) {
      console.error(err);
    }
    onNavigateToLogin();
  };

  if (isAuthLoading || !userId) {
    return (
      <div className="bg-[#0D0D0D] min-h-screen flex items-center justify-center">
        <Loader2 className="w-6 h-6 text-[#CCFF00] animate-spin" />
      </div>
    );
  }

  const selectedGym = gyms?.find((g) => g.id === selectedGymId) ?? null;

  return (
    <div className="bg-[#0D0D0D] min-h-screen text-white font-sans selection:bg-[#CCFF00] selection:text-black">
      <header className="border-b border-[#1F1F1F] px-4 sm:px-8 py-4 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-gradient-to-tr from-black to-[#202020] border border-[#CCFF00]/50 flex items-center justify-center">
            <span className="text-[#CCFF00] font-black font-mono text-sm">MF</span>
          </div>
          <div>
            <div className="font-display font-semibold tracking-tight">Gym Manager</div>
            <div className="text-zinc-500 text-[10px] font-mono uppercase tracking-widest">Member access</div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {isAdmin && (
            <button onClick={onNavigateToAdmin} className="px-3 py-2 bg-zinc-900 border border-zinc-800 rounded-lg text-xs font-mono text-zinc-300 hover:border-[#CCFF00] hover:text-[#CCFF00]">
              Admin dashboard
            </button>
          )}
          <button onClick={handleLogout} className="px-3 py-2 bg-zinc-900 border border-zinc-800 rounded-lg text-xs font-mono text-zinc-300 hover:border-zinc-600 flex items-center gap-1.5">
            <LogOut className="w-3.5 h-3.5" /> Sign out
          </button>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 sm:px-8 py-8 space-y-6">
        {gymsError ? (
          <div className={`${card} flex items-center gap-3`}>
            <p className="text-red-400 text-sm font-mono flex-1">{gymsError}</p>
            <button onClick={loadGyms} className="px-3 py-1.5 bg-zinc-900 border border-zinc-800 rounded-lg text-xs font-mono text-zinc-300 hover:border-zinc-600">
              Retry
            </button>
          </div>
        ) : gyms === null ? (
          <p className="text-zinc-500 text-xs font-mono">Loading your gyms...</p>
        ) : gyms.length === 0 ? (
          <div className={`${card} text-center space-y-2`}>
            <h1 className="font-display font-semibold text-xl">No gyms linked to this account</h1>
            <p className="text-zinc-400 text-sm">
              Ask the Macroflux team to add you as an admin of your gym, then sign in again.
            </p>
          </div>
        ) : (
          <>
            {gyms.length > 1 && (
              <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                <label htmlFor="gym-select" className="text-zinc-500 text-[10px] uppercase font-mono tracking-widest">
                  Gym
                </label>
                <select
                  id="gym-select"
                  value={selectedGymId ?? ''}
                  onChange={(e) => setSelectedGymId(e.target.value)}
                  className="bg-[#0D0D0D] border border-zinc-800 focus:border-[#CCFF00] p-2.5 rounded-lg text-white outline-none text-sm font-mono sm:w-80"
                >
                  {gyms.map((g) => (
                    <option key={g.id} value={g.id}>
                      {g.name}
                      {g.city ? ` — ${g.city}` : ''}
                    </option>
                  ))}
                </select>
              </div>
            )}
            {selectedGym && <GymAccessCard key={selectedGym.id} gym={selectedGym} onUnauthorized={onNavigateToLogin} />}
          </>
        )}
      </main>
    </div>
  );
}

function GymAccessCard({ gym, onUnauthorized }: { gym: MyAdminGym; onUnauthorized: () => void }) {
  const [joinCode, setJoinCode] = useState<GymJoinCode | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const copiedTimer = useRef<number | undefined>(undefined);

  useEffect(() => () => window.clearTimeout(copiedTimer.current), []);

  const load = async () => {
    setIsLoading(true);
    setError(null);
    try {
      setJoinCode(await getGymJoinCode(gym.id));
    } catch (err) {
      console.error(err);
      if (isApiError(err, 401)) return onUnauthorized();
      setError(isApiError(err, 403) ? "You're no longer an admin of this gym." : (err as Error).message || 'Could not load the code');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gym.id]);

  const handleCopy = async () => {
    if (!joinCode?.code) return;
    if (await copyToClipboard(joinCode.code)) {
      setCopied(true);
      setNotice(null);
      window.clearTimeout(copiedTimer.current);
      copiedTimer.current = window.setTimeout(() => setCopied(false), 2000);
    } else {
      setNotice('Could not copy — select the code and copy it manually.');
    }
  };

  const handlePoster = () => {
    if (joinCode?.code && !openJoinCodePoster(gym.name, joinCode.code)) {
      setNotice('Allow pop-ups for this site to open the printable poster.');
    }
  };

  const isFree = gym.tier === 'free';
  const isLive = gym.status === 'live';

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display font-semibold text-2xl tracking-tight">{gym.name}</h1>
        <p className="text-zinc-400 text-xs sm:text-sm mt-1 flex items-center gap-1.5">
          <MapPin className="w-3.5 h-3.5 shrink-0" />
          {gym.city ? `${gym.city} — ` : ''}
          {gym.address}
        </p>
      </div>

      <div className={`${card} space-y-5`}>
        <div className="flex items-center justify-between border-b border-zinc-900 pb-3">
          <h2 className="text-sm font-mono tracking-wider uppercase flex items-center gap-2">
            <KeyRound className="w-4 h-4" /> Member access code
          </h2>
          <button onClick={load} disabled={isLoading} title="Refresh" className="text-zinc-500 hover:text-white disabled:opacity-40">
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
        </div>

        {isLoading && !joinCode ? (
          <p className="text-zinc-500 text-xs font-mono">Loading...</p>
        ) : error ? (
          <div className="flex items-center gap-3">
            <p className="text-red-400 text-xs font-mono">{error}</p>
            <button onClick={load} className="px-3 py-1.5 bg-zinc-900 border border-zinc-800 rounded-lg text-xs font-mono text-zinc-300 hover:border-zinc-600">
              Retry
            </button>
          </div>
        ) : joinCode ? (
          <>
            {isFree && (
              <Warning>Join codes are available for paid-tier gyms. Contact the Macroflux team to upgrade.</Warning>
            )}
            {!isLive && (
              <Warning>
                Your gym is <b>{gym.status.replace('_', ' ')}</b>. Members won't see its plans until it's live.
              </Warning>
            )}

            {!joinCode.code ? (
              <p className="text-zinc-400 text-sm">
                No code has been created for your gym yet. Ask the Macroflux team to generate one.
              </p>
            ) : (
              <>
                {!joinCode.enabled && (
                  <div className="flex items-start gap-2 text-xs font-mono border rounded-lg p-3 text-red-300 bg-red-500/10 border-red-500/30">
                    <Ban className="w-4 h-4 shrink-0" />
                    <div>
                      <div className="font-bold uppercase tracking-wider text-[11px]">Code disabled</div>
                      New members can't join with this code right now. Existing members keep their access.
                    </div>
                  </div>
                )}
                <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                  <div
                    className={`font-mono font-bold text-4xl sm:text-5xl tracking-[0.15em] px-5 py-4 rounded-xl border bg-[#0D0D0D] select-all w-fit ${
                      joinCode.enabled ? 'text-[#CCFF00] border-[#CCFF00]/30' : 'text-zinc-600 border-zinc-800 line-through decoration-2'
                    }`}
                    aria-label={`Join code ${joinCode.code.split('').join(' ')}`}
                  >
                    {formatCodeForDisplay(joinCode.code)}
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={handleCopy}
                      className="px-3 py-2 bg-zinc-900 border border-zinc-800 rounded-lg text-xs font-mono text-zinc-300 hover:border-[#CCFF00] hover:text-[#CCFF00] flex items-center gap-1.5"
                    >
                      {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                      {copied ? 'Copied' : 'Copy'}
                    </button>
                    <button
                      onClick={handlePoster}
                      className="px-3 py-2 bg-zinc-900 border border-zinc-800 rounded-lg text-xs font-mono text-zinc-300 hover:border-[#CCFF00] hover:text-[#CCFF00] flex items-center gap-1.5"
                    >
                      <Printer className="w-3.5 h-3.5" /> Poster
                    </button>
                  </div>
                </div>
                <p className="text-zinc-400 text-xs leading-relaxed">
                  Members open the app → <b>Workout</b> → <b>Have a gym code?</b> and enter this code to unlock your gym's
                  plans.
                </p>
                <p className="text-zinc-500 text-[11px] font-mono">Code last changed {formatDateTime(joinCode.updated_at)}</p>
              </>
            )}
            {notice && <p className="text-amber-400/90 text-[11px] font-mono">{notice}</p>}
          </>
        ) : null}
      </div>

      {joinCode && !error && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className={card}>
            <div className="text-zinc-500 text-[10px] font-mono uppercase tracking-widest flex items-center gap-1.5">
              <KeyRound className="w-3.5 h-3.5" /> Joined with the code
            </div>
            <div className="font-display font-bold text-5xl text-[#CCFF00] mt-3">{joinCode.code_member_count}</div>
          </div>
          <div className={card}>
            <div className="text-zinc-500 text-[10px] font-mono uppercase tracking-widest flex items-center gap-1.5">
              <Users className="w-3.5 h-3.5" /> Total members
            </div>
            <div className="font-display font-bold text-5xl mt-3">{joinCode.member_count}</div>
            {joinCode.member_count > joinCode.code_member_count && (
              <div className="text-zinc-500 text-[11px] font-mono mt-1">
                incl. {joinCode.member_count - joinCode.code_member_count} added by the Macroflux team
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function Warning({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-start gap-2 text-[11px] font-mono border rounded-lg p-2.5 text-amber-400/90 bg-amber-400/10 border-amber-400/20">
      <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-px" />
      <div>{children}</div>
    </div>
  );
}
