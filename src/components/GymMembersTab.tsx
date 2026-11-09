import React, { useEffect, useRef, useState } from 'react';
import {
  KeyRound,
  Copy,
  Check,
  RefreshCw,
  Printer,
  AlertTriangle,
  Search,
  UserPlus,
  Trash2,
  X,
  ChevronLeft,
  ChevronRight,
  Ban,
} from 'lucide-react';
import {
  AdminGym,
  GymJoinCode,
  GymMember,
  JOIN_CODE_REQUIRES_PAID_TIER,
  getGymJoinCode,
  regenerateGymJoinCode,
  setGymJoinCodeEnabled,
  listGymMembers,
  addGymMember,
  removeGymMember,
  listGymPlans,
  getUsers,
} from '../adminService';
import { isApiError } from '../apiClient';
import { UserAccount } from '../types';
import { formatDate, formatDateTime } from '../dateFormat';

const card = 'bg-[#141414] border border-[#252525] rounded-xl p-6 space-y-4';
const th = 'px-4 py-3';
const td = 'px-4 py-3';

const PAID_TIER_MESSAGE = 'Join codes are available for paid-tier gyms';
const FORBIDDEN_MESSAGE = "You don't have permission to manage this gym";
const MEMBERS_PAGE_SIZE = 50;

type ShowToast = (msg: string) => void;

export const formatCodeForDisplay = (code: string) => (code.length === 8 ? `${code.slice(0, 4)} ${code.slice(4)}` : code);

function errorMessage(err: unknown, fallback: string): string {
  if (isApiError(err, 403)) return FORBIDDEN_MESSAGE;
  if (isApiError(err, 409) && err.detail === JOIN_CODE_REQUIRES_PAID_TIER) return PAID_TIER_MESSAGE;
  return (err as Error)?.message || fallback;
}

// =====================================================================
// Shared bits
// =====================================================================
export function ConfirmDialog({
  title,
  message,
  confirmLabel,
  danger,
  isBusy,
  onConfirm,
  onCancel,
}: {
  title: string;
  message: React.ReactNode;
  confirmLabel: string;
  danger?: boolean;
  isBusy?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && !isBusy && onCancel();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isBusy, onCancel]);

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-6 z-50" role="dialog" aria-modal="true">
      <div className="bg-[#141414] border-2 border-[#252525] rounded-xl p-6 w-full max-w-md space-y-4">
        <h3 className="font-display font-bold text-lg text-white">{title}</h3>
        <div className="text-[#CBCBCB] text-sm leading-relaxed">{message}</div>
        <div className="flex justify-end gap-2 pt-2">
          <button
            type="button"
            onClick={onCancel}
            disabled={isBusy}
            className="px-4 py-2 bg-zinc-900 border border-zinc-800 rounded-lg text-xs font-mono text-zinc-300 hover:border-zinc-600 disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isBusy}
            autoFocus
            className={`px-4 py-2 rounded-lg text-xs font-display font-bold uppercase tracking-wider disabled:opacity-50 ${
              danger ? 'bg-red-500 text-white hover:bg-red-400' : 'bg-[#CCFF00] text-black'
            }`}
          >
            {isBusy ? 'Working...' : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

// Search-as-you-type picker over the panel's user list (getUsers, first 100).
// Shared by the plan-assignments modal and the Members tab's "Add member".
export function UserPicker({
  users,
  excludeIds,
  onPick,
  actionLabel,
  placeholder = 'Search members by name/email...',
  isLoading,
}: {
  users: UserAccount[];
  excludeIds?: Set<string>;
  onPick: (user: UserAccount) => void;
  actionLabel: string;
  placeholder?: string;
  isLoading?: boolean;
}) {
  const [search, setSearch] = useState('');
  const q = search.trim().toLowerCase();
  const candidates = q
    ? users.filter((u) => !excludeIds?.has(u.id) && (u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q)))
    : [];

  return (
    <div className="space-y-2">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
        <input
          type="text"
          placeholder={placeholder}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-9 pr-4 py-2 bg-[#0D0D0D] border border-[#252525] focus:border-[#CCFF00] rounded-lg text-xs font-mono outline-none text-white"
        />
      </div>
      {isLoading && <p className="text-zinc-500 text-xs font-mono">Loading users...</p>}
      {!isLoading && q && (
        <div className="space-y-2 max-h-48 overflow-y-auto">
          {candidates.length === 0 ? (
            <p className="text-zinc-500 text-xs font-mono">No matching members.</p>
          ) : (
            candidates.map((u) => (
              <div key={u.id} className="flex items-center justify-between bg-[#0D0D0D] border border-zinc-800 rounded-lg p-2.5 text-xs font-mono">
                <div>
                  <div className="text-white font-semibold">{u.name}</div>
                  <div className="text-zinc-500 text-[10px]">{u.email}</div>
                </div>
                <button
                  onClick={() => {
                    onPick(u);
                    setSearch('');
                  }}
                  className="px-2.5 py-1 rounded bg-[#CCFF00]/10 border border-[#CCFF00]/20 text-[#CCFF00] hover:bg-[#CCFF00]/20"
                >
                  {actionLabel}
                </button>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}

function Notice({ tone, children }: { tone: 'amber' | 'red' | 'zinc'; children: React.ReactNode }) {
  const tones = {
    amber: 'text-amber-400/90 bg-amber-400/10 border-amber-400/20',
    red: 'text-red-400 bg-red-500/10 border-red-500/20',
    zinc: 'text-zinc-300 bg-zinc-800/40 border-zinc-700',
  };
  return (
    <div className={`flex items-start gap-2 text-[11px] font-mono border rounded-lg p-2.5 ${tones[tone]}`}>
      <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-px" />
      <div>{children}</div>
    </div>
  );
}

function MemberAvatar({ member }: { member: GymMember }) {
  const [failed, setFailed] = useState(false);
  const source = (member.full_name || member.email || '?').trim();
  const initials =
    source
      .split(/[\s@._-]+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((p) => p[0]!.toUpperCase())
      .join('') || '?';

  if (member.avatar_url && !failed) {
    return (
      <img
        src={member.avatar_url}
        alt=""
        onError={() => setFailed(true)}
        className="w-8 h-8 rounded-full object-cover bg-zinc-900 border border-zinc-800 shrink-0"
      />
    );
  }
  return (
    <div className="w-8 h-8 rounded-full bg-zinc-800 border border-zinc-700 text-zinc-300 text-[10px] font-bold flex items-center justify-center shrink-0">
      {initials}
    </div>
  );
}

const escapeHtml = (s: string) =>
  s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!);

// Printable poster in its own window so the dashboard chrome never prints.
export function openJoinCodePoster(gymName: string, code: string): boolean {
  const w = window.open('', '_blank', 'width=720,height=960');
  if (!w) return false;
  w.document.write(`<!doctype html>
<html><head><meta charset="utf-8"><title>${escapeHtml(gymName)} — gym code</title>
<style>
  @page { size: A4 portrait; margin: 18mm; }
  * { box-sizing: border-box; }
  body { margin: 0; font-family: system-ui, -apple-system, "Segoe UI", sans-serif; color: #111; background: #fff;
         min-height: 100vh; display: flex; align-items: center; justify-content: center; text-align: center; }
  .wrap { padding: 48px 32px; max-width: 620px; }
  .eyebrow { font-size: 14px; letter-spacing: .2em; text-transform: uppercase; color: #555; }
  h1 { font-size: 40px; margin: 12px 0 40px; line-height: 1.15; }
  .code { font-family: ui-monospace, "SF Mono", Consolas, monospace; font-size: 76px; font-weight: 700;
          letter-spacing: .12em; border: 4px solid #111; border-radius: 20px; padding: 28px 24px; white-space: nowrap; }
  .steps { margin-top: 40px; font-size: 22px; line-height: 1.5; }
  .steps b { white-space: nowrap; }
  .note { margin-top: 28px; font-size: 15px; color: #555; }
  .print { margin-top: 32px; padding: 10px 22px; font-size: 15px; cursor: pointer; }
  @media print { .print { display: none; } }
</style></head>
<body><div class="wrap">
  <div class="eyebrow">Member access</div>
  <h1>${escapeHtml(gymName)}</h1>
  <div class="code">${escapeHtml(formatCodeForDisplay(code))}</div>
  <div class="steps">Open the app → <b>Workout</b> → <b>Have a gym code?</b><br/>and enter the code above.</div>
  <div class="note">Unlocks all of this gym's plans in the app.</div>
  <button class="print" onclick="window.print()">Print</button>
</div></body></html>`);
  w.document.close();
  w.focus();
  return true;
}

export async function copyToClipboard(text: string): Promise<boolean> {
  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch {
    /* fall through to the legacy path */
  }
  try {
    const ta = document.createElement('textarea');
    ta.value = text;
    ta.style.position = 'fixed';
    ta.style.opacity = '0';
    document.body.appendChild(ta);
    ta.select();
    const ok = document.execCommand('copy');
    document.body.removeChild(ta);
    return ok;
  } catch {
    return false;
  }
}

// =====================================================================
// MEMBERS TAB — join code card + member list. Owns the join-code state so
// member_count stays in sync after add/remove (and the list after code actions).
// =====================================================================
export function GymMembersTab({
  gym,
  showToast,
  onGymPatched,
  onGoToPlans,
}: {
  gym: AdminGym;
  showToast: ShowToast;
  onGymPatched: (patch: Partial<AdminGym>) => void;
  onGoToPlans: () => void;
}) {
  const [joinCode, setJoinCode] = useState<GymJoinCode | null>(null);
  const [joinCodeLoading, setJoinCodeLoading] = useState(true);
  const [joinCodeError, setJoinCodeError] = useState<unknown>(null);
  const [generalPlanCount, setGeneralPlanCount] = useState<number | null>(null);
  const [membersReloadKey, setMembersReloadKey] = useState(0);

  const applyJoinCode = (jc: GymJoinCode) => {
    setJoinCode(jc);
    setJoinCodeError(null);
    onGymPatched({ join_code: jc.code, join_code_enabled: jc.enabled });
  };

  const loadJoinCode = async (opts: { silent?: boolean } = {}) => {
    if (!opts.silent) setJoinCodeLoading(true);
    try {
      applyJoinCode(await getGymJoinCode(gym.id));
    } catch (err) {
      console.error(err);
      if (!opts.silent) setJoinCodeError(err);
    } finally {
      if (!opts.silent) setJoinCodeLoading(false);
    }
  };

  useEffect(() => {
    loadJoinCode();
    listGymPlans(gym.id)
      .then((plans) => setGeneralPlanCount(plans.filter((p) => p.type === 'general' && p.is_enabled !== false).length))
      .catch((err) => {
        console.error(err);
        setGeneralPlanCount(null); // unknown — don't show a possibly-wrong "zero plans" warning
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gym.id]);

  return (
    <div className="space-y-6">
      <JoinCodeCard
        gym={gym}
        joinCode={joinCode}
        isLoading={joinCodeLoading}
        loadError={joinCodeError}
        generalPlanCount={generalPlanCount}
        onRetry={() => loadJoinCode()}
        onChanged={(jc) => {
          applyJoinCode(jc);
          setMembersReloadKey((k) => k + 1);
        }}
        onGoToPlans={onGoToPlans}
        showToast={showToast}
      />
      <MembersSection
        gymId={gym.id}
        reloadKey={membersReloadKey}
        onMembershipChanged={() => loadJoinCode({ silent: true })}
        showToast={showToast}
      />
    </div>
  );
}

// =====================================================================
// JOIN CODE CARD
// =====================================================================
function JoinCodeCard({
  gym,
  joinCode,
  isLoading,
  loadError,
  generalPlanCount,
  onRetry,
  onChanged,
  onGoToPlans,
  showToast,
}: {
  gym: AdminGym;
  joinCode: GymJoinCode | null;
  isLoading: boolean;
  loadError: unknown;
  generalPlanCount: number | null;
  onRetry: () => void;
  onChanged: (jc: GymJoinCode) => void;
  onGoToPlans: () => void;
  showToast: ShowToast;
}) {
  const [busy, setBusy] = useState<'regenerate' | 'toggle' | null>(null);
  const [confirmRegenerate, setConfirmRegenerate] = useState(false);
  const [copied, setCopied] = useState(false);
  const copiedTimer = useRef<number | undefined>(undefined);

  useEffect(() => () => window.clearTimeout(copiedTimer.current), []);

  const isFree = gym.tier === 'free';
  const isLive = gym.status === 'live';

  const handleRegenerate = async () => {
    setBusy('regenerate');
    try {
      const hadCode = !!joinCode?.code;
      const jc = await regenerateGymJoinCode(gym.id);
      onChanged(jc);
      setConfirmRegenerate(false);
      showToast(hadCode ? 'New code generated — the old one no longer works' : 'Join code generated');
    } catch (err) {
      console.error(err);
      setConfirmRegenerate(false);
      showToast(errorMessage(err, 'Error generating join code'));
    } finally {
      setBusy(null);
    }
  };

  const handleToggle = async () => {
    if (!joinCode) return;
    setBusy('toggle');
    try {
      const jc = await setGymJoinCodeEnabled(gym.id, !joinCode.enabled);
      onChanged(jc);
      showToast(jc.enabled ? 'Join code enabled' : 'Join code disabled — new members can no longer join');
    } catch (err) {
      console.error(err);
      showToast(errorMessage(err, 'Error updating join code'));
    } finally {
      setBusy(null);
    }
  };

  const handleCopy = async () => {
    if (!joinCode?.code) return;
    if (await copyToClipboard(joinCode.code)) {
      setCopied(true);
      window.clearTimeout(copiedTimer.current);
      copiedTimer.current = window.setTimeout(() => setCopied(false), 2000);
    } else {
      showToast('Could not copy — select the code and copy it manually');
    }
  };

  const handlePoster = () => {
    if (!joinCode?.code) return;
    if (!openJoinCodePoster(gym.name, joinCode.code)) showToast('Allow pop-ups for this site to open the printable poster');
  };

  const header = (
    <h3 className="text-sm font-mono tracking-wider text-white uppercase border-b border-zinc-900 pb-3 flex items-center gap-2">
      <KeyRound className="w-4 h-4" /> Member access code
    </h3>
  );

  if (isLoading) {
    return (
      <div className={card}>
        {header}
        <p className="text-zinc-500 text-xs font-mono">Loading...</p>
      </div>
    );
  }

  if (loadError || !joinCode) {
    return (
      <div className={card}>
        {header}
        {isApiError(loadError, 403) ? (
          <p className="text-zinc-500 text-xs font-mono">{FORBIDDEN_MESSAGE}'s access code.</p>
        ) : (
          <div className="flex items-center gap-3">
            <p className="text-red-400 text-xs font-mono">{errorMessage(loadError, 'Error loading join code')}</p>
            <button onClick={onRetry} className="px-3 py-1.5 bg-zinc-900 border border-zinc-800 rounded-lg text-xs font-mono text-zinc-300 hover:border-zinc-600">
              Retry
            </button>
          </div>
        )}
      </div>
    );
  }

  const hasCode = !!joinCode.code;
  const helperText = (
    <p className="text-zinc-400 text-[11px] leading-relaxed">
      Members who join with this code get every <span className="text-blue-400">General</span> plan at this gym —
      including ones added later. Individually assigned plans are managed separately.{' '}
      <button onClick={onGoToPlans} className="text-[#CCFF00] hover:underline">
        Manage this gym's plans →
      </button>
    </p>
  );

  return (
    <div className={card}>
      {header}

      {isFree && (
        <Notice tone="amber">
          {PAID_TIER_MESSAGE}.{hasCode && " Members won't see this gym's plans while it's on the free tier."}
        </Notice>
      )}
      {!isLive && (
        <Notice tone="amber">
          This gym is <b>{gym.status.replace('_', ' ')}</b>. Members won't see its plans until it's live (membership
          plans require the gym to be live and paid-tier).
        </Notice>
      )}
      {generalPlanCount === 0 && (
        <Notice tone="amber">
          This gym has no enabled General plans, so members who join won't get any plans.{' '}
          <button onClick={onGoToPlans} className="underline hover:text-amber-300">
            Create one in Plans
          </button>
          .
        </Notice>
      )}

      {!hasCode ? (
        <div className="space-y-4">
          <p className="text-[#CBCBCB] text-sm leading-relaxed">
            Give your members a single 8-character code. They enter it in the app (Workout → <i>Have a gym code?</i>) to
            join this gym and unlock its plans — no need to assign plans one by one.
          </p>
          {helperText}
          <button
            onClick={handleRegenerate}
            disabled={isFree || busy !== null}
            title={isFree ? PAID_TIER_MESSAGE : undefined}
            className="py-2.5 px-4 bg-[#CCFF00] text-black font-display font-bold rounded-lg uppercase text-xs tracking-wider flex items-center gap-1.5 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <KeyRound className="w-3.5 h-3.5" /> {busy === 'regenerate' ? 'Generating...' : 'Generate code'}
          </button>
          {joinCode.member_count > 0 && (
            <p className="text-zinc-500 text-[11px] font-mono">{joinCode.member_count} existing member(s) added by an admin.</p>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {!joinCode.enabled && (
            <div className="flex items-start gap-2 text-xs font-mono border rounded-lg p-3 text-red-300 bg-red-500/10 border-red-500/30">
              <Ban className="w-4 h-4 shrink-0" />
              <div>
                <div className="font-bold uppercase tracking-wider text-[11px]">Code disabled</div>
                New members can't join with this code. Existing members are unaffected and keep their access.
              </div>
            </div>
          )}

          <div className="flex flex-col lg:flex-row lg:items-center gap-4">
            <div
              className={`font-mono font-bold text-4xl sm:text-5xl tracking-[0.15em] px-5 py-4 rounded-xl border bg-[#0D0D0D] select-all w-fit ${
                joinCode.enabled ? 'text-[#CCFF00] border-[#CCFF00]/30' : 'text-zinc-600 border-zinc-800 line-through decoration-2'
              }`}
              aria-label={`Join code ${joinCode.code!.split('').join(' ')}`}
            >
              {formatCodeForDisplay(joinCode.code!)}
            </div>
            <div className="flex flex-wrap gap-2">
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
              <button
                onClick={() => setConfirmRegenerate(true)}
                disabled={isFree || busy !== null}
                title={isFree ? PAID_TIER_MESSAGE : undefined}
                className="px-3 py-2 bg-zinc-900 border border-zinc-800 rounded-lg text-xs font-mono text-zinc-300 hover:border-amber-500 hover:text-amber-400 flex items-center gap-1.5 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:border-zinc-800 disabled:hover:text-zinc-300"
              >
                <RefreshCw className="w-3.5 h-3.5" /> Regenerate
              </button>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-x-6 gap-y-3 text-xs font-mono">
            <button
              type="button"
              role="switch"
              aria-checked={joinCode.enabled}
              onClick={handleToggle}
              disabled={busy !== null}
              className="flex items-center gap-2 disabled:opacity-50"
            >
              <span className={`relative w-9 h-5 rounded-full transition-colors ${joinCode.enabled ? 'bg-[#CCFF00]' : 'bg-zinc-700'}`}>
                <span
                  className={`absolute top-0.5 w-4 h-4 rounded-full bg-black transition-all ${joinCode.enabled ? 'left-[18px]' : 'left-0.5'}`}
                />
              </span>
              <span className={joinCode.enabled ? 'text-white' : 'text-zinc-400'}>
                {busy === 'toggle' ? 'Saving...' : joinCode.enabled ? 'Enabled' : 'Disabled'}
              </span>
            </button>
            <span className="text-zinc-500">
              Last changed <span className="text-zinc-300">{formatDateTime(joinCode.updated_at)}</span>
            </span>
            <span className="text-zinc-500">
              Members <span className="text-zinc-300">{joinCode.member_count}</span>
              <span className="text-zinc-600"> ({joinCode.code_member_count} via code)</span>
            </span>
          </div>

          {helperText}
        </div>
      )}

      {confirmRegenerate && (
        <ConfirmDialog
          title="Regenerate join code?"
          message="The current code will stop working immediately. Existing members keep their access."
          confirmLabel="Regenerate"
          danger
          isBusy={busy === 'regenerate'}
          onConfirm={handleRegenerate}
          onCancel={() => setConfirmRegenerate(false)}
        />
      )}
    </div>
  );
}

// =====================================================================
// MEMBERS LIST
// =====================================================================
function MembersSection({
  gymId,
  reloadKey,
  onMembershipChanged,
  showToast,
}: {
  gymId: string;
  reloadKey: number;
  onMembershipChanged: () => void;
  showToast: ShowToast;
}) {
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [offset, setOffset] = useState(0);
  const [members, setMembers] = useState<GymMember[]>([]);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<unknown>(null);
  const [localReload, setLocalReload] = useState(0);
  const requestSeq = useRef(0);

  const [showAdd, setShowAdd] = useState(false);
  const [users, setUsers] = useState<UserAccount[] | null>(null);
  const [usersLoading, setUsersLoading] = useState(false);
  const [addingUserId, setAddingUserId] = useState<string | null>(null);

  const [removeTarget, setRemoveTarget] = useState<GymMember | null>(null);
  const [isRemoving, setIsRemoving] = useState(false);

  // Debounce search; a new search always restarts from page 1.
  useEffect(() => {
    const t = window.setTimeout(() => {
      setSearch(searchInput.trim());
      setOffset(0);
    }, 300);
    return () => window.clearTimeout(t);
  }, [searchInput]);

  useEffect(() => {
    const seq = ++requestSeq.current;
    setIsLoading(true);
    listGymMembers(gymId, { search: search || undefined, limit: MEMBERS_PAGE_SIZE, offset })
      .then((res) => {
        if (seq !== requestSeq.current) return; // a newer request superseded this one
        // Removing the last row of a later page leaves it empty — step back a page.
        if (res.items.length === 0 && offset > 0 && res.total > 0) {
          setOffset(Math.max(0, Math.floor((res.total - 1) / MEMBERS_PAGE_SIZE) * MEMBERS_PAGE_SIZE));
          return;
        }
        setMembers(res.items);
        setTotal(res.total);
        setLoadError(null);
      })
      .catch((err) => {
        if (seq !== requestSeq.current) return;
        console.error(err);
        setLoadError(err);
      })
      .finally(() => {
        if (seq === requestSeq.current) setIsLoading(false);
      });
  }, [gymId, search, offset, reloadKey, localReload]);

  const refetch = () => setLocalReload((n) => n + 1);

  const openAdd = async () => {
    setShowAdd((v) => !v);
    if (users !== null || usersLoading) return;
    setUsersLoading(true);
    try {
      const res = await getUsers(0, 100);
      setUsers(res.users);
    } catch (err) {
      console.error(err);
      showToast('Error loading users');
    } finally {
      setUsersLoading(false);
    }
  };

  const handleAdd = async (user: UserAccount) => {
    setAddingUserId(user.id);
    try {
      await addGymMember(gymId, user.id);
      showToast(`${user.name} is a member of this gym`);
      refetch();
      onMembershipChanged();
    } catch (err) {
      console.error(err);
      showToast(errorMessage(err, 'Error adding member'));
    } finally {
      setAddingUserId(null);
    }
  };

  const handleRemove = async () => {
    if (!removeTarget) return;
    setIsRemoving(true);
    const name = removeTarget.full_name || removeTarget.email || 'Member';
    try {
      await removeGymMember(gymId, removeTarget.user_id);
      showToast(`${name} removed from this gym`);
    } catch (err) {
      // 404 = already removed (another admin, or the member left) — just resync.
      if (!isApiError(err, 404)) {
        console.error(err);
        showToast(errorMessage(err, 'Error removing member'));
      }
    } finally {
      setIsRemoving(false);
      setRemoveTarget(null);
      refetch();
      onMembershipChanged();
    }
  };

  const pageStart = total === 0 ? 0 : offset + 1;
  const pageEnd = Math.min(offset + members.length, total);
  const forbidden = isApiError(loadError, 403);

  return (
    <div className={card}>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-zinc-900 pb-3">
        <h3 className="text-sm font-mono tracking-wider text-white uppercase">Members ({total})</h3>
        {!forbidden && (
          <button
            onClick={openAdd}
            className="py-2 px-4 bg-[#CCFF00] text-black font-display font-bold rounded-lg uppercase text-xs tracking-wider flex items-center gap-1.5 w-fit"
          >
            {showAdd ? <X className="w-3.5 h-3.5" /> : <UserPlus className="w-3.5 h-3.5" />} {showAdd ? 'Close' : 'Add member'}
          </button>
        )}
      </div>

      {showAdd && (
        <div className="bg-[#0D0D0D]/60 border border-zinc-800 rounded-lg p-4 space-y-2">
          <p className="text-zinc-500 text-[10px] uppercase tracking-wider">
            Add a member directly (works on any tier/status){addingUserId ? ' — adding...' : ''}
          </p>
          <UserPicker users={users || []} isLoading={usersLoading} onPick={handleAdd} actionLabel="Add" placeholder="Search users by name/email to add..." />
        </div>
      )}

      {!forbidden && (
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
          <input
            type="text"
            placeholder="Search members by name or email..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-[#0D0D0D] border border-[#252525] focus:border-[#CCFF00] rounded-lg text-xs font-mono outline-none text-white"
          />
        </div>
      )}

      {forbidden ? (
        <p className="text-zinc-500 text-xs font-mono py-2">{FORBIDDEN_MESSAGE}'s members.</p>
      ) : loadError && members.length === 0 ? (
        <div className="flex items-center gap-3 py-2">
          <p className="text-red-400 text-xs font-mono">{errorMessage(loadError, 'Error loading members')}</p>
          <button onClick={refetch} className="px-3 py-1.5 bg-zinc-900 border border-zinc-800 rounded-lg text-xs font-mono text-zinc-300 hover:border-zinc-600">
            Retry
          </button>
        </div>
      ) : isLoading && members.length === 0 ? (
        <p className="text-zinc-500 text-xs font-mono">Loading...</p>
      ) : members.length === 0 ? (
        <p className="text-zinc-500 text-xs font-mono py-2">
          {search ? `No members match "${search}".` : 'No members yet — share the code with your members.'}
        </p>
      ) : (
        <>
          <div className={`overflow-x-auto transition-opacity ${isLoading ? 'opacity-50' : ''}`}>
            <table className="w-full text-left font-mono text-xs text-[#9A9A9A]">
              <thead className="bg-[#0A0A0A] text-white border-b border-[#202020] uppercase font-bold text-[10px] tracking-widest">
                <tr>
                  <th className={th}>Member</th>
                  <th className={th}>Email</th>
                  <th className={th}>Joined via</th>
                  <th className={th}>Joined</th>
                  <th className={`${th} text-right`}>Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1F1F1F]">
                {members.map((m) => (
                  <tr key={m.user_id} className="hover:bg-[#1A1A1A]">
                    <td className={td}>
                      <div className="flex items-center gap-3">
                        <MemberAvatar member={m} />
                        <span className="text-white font-sans font-semibold">{m.full_name || 'Unnamed member'}</span>
                      </div>
                    </td>
                    <td className={td}>{m.email || '—'}</td>
                    <td className={td}>
                      <span
                        className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase border ${
                          m.joined_via === 'code'
                            ? 'bg-[#CCFF00]/10 text-[#CCFF00] border-[#CCFF00]/20'
                            : 'bg-zinc-800 text-zinc-300 border-zinc-700'
                        }`}
                      >
                        {m.joined_via === 'code' ? 'Code' : 'Admin'}
                      </span>
                    </td>
                    <td className={td} title={formatDateTime(m.joined_at)}>
                      {formatDate(m.joined_at)}
                    </td>
                    <td className={`${td} text-right`}>
                      <button
                        onClick={() => setRemoveTarget(m)}
                        className="p-1 px-2.5 rounded bg-red-500/10 border border-red-500/20 text-red-400 hover:bg-red-500/20 inline-flex items-center gap-1.5"
                      >
                        <Trash2 className="w-3.5 h-3.5" /> Remove
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {total > MEMBERS_PAGE_SIZE && (
            <div className="flex items-center justify-between text-xs font-mono text-zinc-500">
              <span>
                {pageStart}–{pageEnd} of {total}
              </span>
              <div className="flex gap-2">
                <button
                  onClick={() => setOffset((o) => Math.max(0, o - MEMBERS_PAGE_SIZE))}
                  disabled={offset === 0 || isLoading}
                  className="px-2.5 py-1.5 bg-zinc-900 border border-zinc-800 rounded-lg hover:border-zinc-600 disabled:opacity-30 flex items-center gap-1"
                >
                  <ChevronLeft className="w-3.5 h-3.5" /> Prev
                </button>
                <button
                  onClick={() => setOffset((o) => o + MEMBERS_PAGE_SIZE)}
                  disabled={offset + MEMBERS_PAGE_SIZE >= total || isLoading}
                  className="px-2.5 py-1.5 bg-zinc-900 border border-zinc-800 rounded-lg hover:border-zinc-600 disabled:opacity-30 flex items-center gap-1"
                >
                  Next <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          )}
        </>
      )}

      {removeTarget && (
        <ConfirmDialog
          title={`Remove ${removeTarget.full_name || removeTarget.email || 'this member'}?`}
          message="They lose access to this gym's General plans. Their workout history and any individually assigned plans are kept."
          confirmLabel="Remove member"
          danger
          isBusy={isRemoving}
          onConfirm={handleRemove}
          onCancel={() => setRemoveTarget(null)}
        />
      )}
    </div>
  );
}
