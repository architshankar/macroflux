import React, { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Users, 
  TrendingUp, 
  Activity, 
  Server, 
  Settings, 
  Search, 
  UserMinus, 
  Edit3, 
  Bell, 
  Check, 
  Save, 
  Sliders, 
  ShieldAlert, 
  ArrowLeft, 
  ExternalLink,
  Plus,
  Trash2,
  RefreshCw,
  Clock,
  Heart,
  Eye,
  AlertTriangle,
  X,
  Database
} from 'lucide-react';
import { UserAccount, MetricCard, SystemNotification, SystemSettings } from '../types';
import { INITIAL_NOTIFICATIONS, DEFAULT_SETTINGS } from '../data';
import { useAdminAuth } from '../hooks/useAdminAuth';
import { getAdminMetrics, getUsers, toggleSuspendUser, updateSystemConfig, updateUserSubscription, sendNotificationBlast, getNotificationBlasts } from '../adminService';

interface AdminDashboardProps {
  onBackToLanding: () => void;
  onNavigateToLogin?: () => void; // Support for redirecting
}

export function AdminDashboard({ onBackToLanding, onNavigateToLogin }: AdminDashboardProps) {
  const { isAdmin, isLoading: isAuthLoading } = useAdminAuth();

  // Load State
  const [users, setUsers] = useState<UserAccount[]>([]);
  const [totalUsers, setTotalUsers] = useState<number>(0);
  const [dashboardMetrics, setDashboardMetrics] = useState<any>(null);
  const [isLoadingData, setIsLoadingData] = useState<boolean>(true);
  const [usersPage, setUsersPage] = useState<number>(0);

  const [notifications, setNotifications] = useState<SystemNotification[]>(INITIAL_NOTIFICATIONS);
  const [settings, setSettings] = useState<SystemSettings>(DEFAULT_SETTINGS);

  useEffect(() => {
    if (!isAuthLoading && !isAdmin) {
      if (onNavigateToLogin) {
        onNavigateToLogin();
      } else {
        // Fallback simple redirect if not provided via props
        window.location.href = '/login';
      }
    }
  }, [isAuthLoading, isAdmin, onNavigateToLogin]);

  useEffect(() => {
    if (isAdmin) {
      loadDashboardData();
    }
  }, [isAdmin, usersPage]);

  const loadDashboardData = async () => {
    setIsLoadingData(true);
    try {
      const [metrics, usersData, blastsData] = await Promise.all([
        getAdminMetrics(),
        getUsers(usersPage, 10),
        getNotificationBlasts().catch(() => []) // fail gracefully if table doesn't exist yet
      ]);
      setDashboardMetrics(metrics);
      setUsers(usersData.users);
      setTotalUsers(usersData.total);
      setPastBlasts(blastsData);
    } catch (err) {
      console.error('Failed to load admin data:', err);
      showToast('Error loading dashboard data');
    } finally {
      setIsLoadingData(false);
    }
  };

  // Router Sidebar Tab Active ID
  const [activeTab, setActiveTab] = useState<'overview' | 'users' | 'operations'>('overview');

  // Search User Query
  const [searchUserQuery, setSearchUserQuery] = useState<string>('');
  const [userFilterStatus, setUserFilterStatus] = useState<string>('all');

  // Edit User Modal State
  const [editingUser, setEditingUser] = useState<UserAccount | null>(null);

  // View Activity Log State
  const [selectedLogUser, setSelectedLogUser] = useState<UserAccount | null>(null);

  // New Push Notification Inputs
  const [notifTitle, setNotifTitle] = useState<string>('');
  const [notifMessage, setNotifMessage] = useState<string>('');
  const [notifTarget, setNotifTarget] = useState<string>('all');
  const [isPublishing, setIsPublishing] = useState<boolean>(false);
  const [pastBlasts, setPastBlasts] = useState<any[]>([]);

  // Toast indicator state
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 4000);
  };

  // Toggle Ban User Account
  const handleToggleBan = async (userId: string) => {
    const userToUpdate = users.find((u: { id: string; }) => u.id === userId);
    if (!userToUpdate) return;
    
    try {
      await toggleSuspendUser(userId, userToUpdate.status);
      const nextStatus = userToUpdate.status === 'banned' ? 'active' : 'banned';
      setUsers((prevUsers) => 
        prevUsers.map((u) => u.id === userId ? { ...u, status: nextStatus } : u)
      );
      showToast(`Athlete "${userToUpdate.name}" account is now ${nextStatus.toUpperCase()}`);
    } catch (err) {
      console.error(err);
      showToast('Error modifying athlete status');
    }
  };

  // Open User Edit Modal
  const handleOpenEdit = (user: UserAccount) => {
    setEditingUser({ ...user });
  };

  // Save Configured User Changes
  const handleSaveUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;

    try {
      if (editingUser.subscription_tier) {
        await updateUserSubscription(editingUser.id, editingUser.subscription_tier);
      }
      
      setUsers((prevUsers) =>
        prevUsers.map((u) => u.id === editingUser.id ? editingUser : u)
      );
      showToast(`Successfully updated athlete settings for ${editingUser.name}`);
      setEditingUser(null);
    } catch (err) {
      console.error(err);
      showToast('Error saving user data');
    }
  };

  // Generic Config Wrapper Handler
  const handleToggleConfig = async (key: keyof SystemSettings, newValue: any) => {
    try {
      await updateSystemConfig(key, newValue);
      setSettings({ ...settings, [key]: newValue });
    } catch (err) {
      console.error(err);
      showToast('Error syncing config to database');
    }
  };

  // Submit System Notification Pushed Out to active clients
  const handleSendNotification = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!notifTitle.trim() || !notifMessage.trim()) {
      showToast('Please specify a title & messaging body before deploying notification.');
      return;
    }

    setIsPublishing(true);
    try {
      await sendNotificationBlast(notifTitle, notifMessage, notifTarget);
      showToast(`System notification deployed out to target group: ${notifTarget}`);
      
      // Update local state without refetching
      setPastBlasts(prev => [
        {
          id: `temp-${Date.now()}`,
          title: notifTitle,
          body: notifMessage,
          target_tier: notifTarget,
          created_at: new Date().toISOString()
        },
        ...prev
      ]);

      // Clear inputs
      setNotifTitle('');
      setNotifMessage('');
    } catch (err) {
      console.error(err);
      showToast('Error deploying notification broadcast');
    } finally {
      setIsPublishing(false);
    }
  };

  // Delete notification from list
  const handleDeleteNotif = (notifId: string) => {
    setNotifications((prev: any[]) => prev.filter((n: { id: string; }) => n.id !== notifId));
    showToast('Telemetry bulletin notification cleared from active queue.');
  };

  // Trigger simulated synchronization
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const triggerSync = () => {
    setIsSyncing(true);
    setTimeout(() => {
      setIsSyncing(false);
      showToast('All smartwatch sync endpoints synchronized correctly.');
    }, 1500);
  };

  // Filter athletes table
  const filteredUsers = useMemo(() => {
    return users.filter((user: { name: string; email: string; lastActiveWorkout: string; status: any; }) => {
      const matchQuery = 
        user.name.toLowerCase().includes(searchUserQuery.toLowerCase()) ||
        user.email.toLowerCase().includes(searchUserQuery.toLowerCase()) ||
        user.lastActiveWorkout.toLowerCase().includes(searchUserQuery.toLowerCase());
      
      const matchStatus = userFilterStatus === 'all' ? true : user.status === userFilterStatus;
      return matchQuery && matchStatus;
    });
  }, [users, searchUserQuery, userFilterStatus]);

  // Quick Stats Computations based on current users list
  const activeAthletesCount = useMemo(() => users.filter((u: { status: string; }) => u.status === 'active').length, [users]);
  const bannedAthletesCount = useMemo(() => users.filter((u: { status: string; }) => u.status === 'banned').length, [users]);

  // custom SVG Interactive line chart setup
  const [activeChartPoint, setActiveChartPoint] = useState<{ index: number; value: number } | null>(null);
  const chartHistoryData = [12000, 12600, 13100, 13700, 14200, 14842, 15124];
  const chartLabels = ["Jan", "Feb", "Mar", "Apr", "May", "Current", "Target"];

  if (isAuthLoading) {
    return (
      <div className="bg-[#0D0D0D] min-h-screen text-[#CCFF00] flex items-center justify-center font-display text-xl">
        <div className="animate-pulse flex items-center gap-4">
          <Activity className="animate-spin" />
          <span>Verifying Clearance...</span>
        </div>
      </div>
    );
  }

  if (!isAdmin) {
    return null; // The useEffect will handle the redirect
  }

  return (
    <div className="bg-[#0D0D0D] min-h-screen text-white font-sans flex selection:bg-[#CCFF00] selection:text-black">
      
      {/* Toast Alert Banner */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div 
            initial={{ opacity: 0, y: 50, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className="fixed bottom-6 right-6 bg-[#CCFF00] text-black px-5 py-4 rounded-lg flex items-center gap-3 z-50 font-display font-bold shadow-2xl text-sm border-2 border-black"
          >
            <Check className="w-5 h-5" />
            <span>{toastMessage}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Sticky High-Performance Sidebar Router */}
      <aside className="w-68 border-r border-[#1C1C1C] bg-[#0A0A0A] hidden md:flex flex-col justify-between sticky top-0 h-screen p-6 select-none shrink-0">
        
        {/* Sidebar Header Logo */}
        <div className="space-y-8">
          <div className="flex items-center space-x-3 cursor-pointer" onClick={onBackToLanding}>
            <div className="w-7 h-7 rounded-md bg-gradient-to-tr from-black to-[#202020] border border-[#CCFF00]/50 flex items-center justify-center p-1">
              <span className="text-[#CCFF00] font-black font-mono text-[10px]">MF</span>
            </div>
            <div>
              <span className="font-display font-medium text-sm tracking-wider text-[#9A9A9A]">MACRO</span>
              <span className="font-display font-black text-sm tracking-widest text-[#CCFF00]">FLUX</span>
            </div>
          </div>

          <div className="bg-[#141414] border border-[#202020] rounded-lg p-3 text-center">
            <span className="text-[10px] font-mono text-zinc-500 block uppercase mb-1">COACH SIGNATURE</span>
            <span className="text-xs font-semibold text-white truncate block">archits0809@gmail.com</span>
            <span className="text-[9px] font-mono text-[#CCFF00] bg-[#CCFF00]/10 border border-[#CCFF00]/20 px-2 py-0.5 mt-2 rounded-full inline-block">
              SYSTEM MANAGER LEVEL
            </span>
          </div>

          {/* Navigation Items */}
          <nav className="space-y-1">
            <button
              onClick={() => setActiveTab('overview')}
              className={`w-full text-left py-2.5 px-4 rounded-lg font-mono text-xs font-medium tracking-wide flex items-center justify-between transition-all ${
                activeTab === 'overview' 
                  ? 'bg-[#141414] border border-[#252525] text-[#CCFF00]' 
                  : 'text-[#9A9A9A] hover:text-white bg-transparent border border-transparent'
              }`}
            >
              <div className="flex items-center space-x-2.5">
                <Activity className="w-4 h-4" />
                <span>Engine Overview</span>
              </div>
              <span className="text-[9px] bg-[#222]/50 px-1.5 py-0.5 rounded text-zinc-500">TAB_1</span>
            </button>

            <button
              onClick={() => setActiveTab('users')}
              className={`w-full text-left py-2.5 px-4 rounded-lg font-mono text-xs font-medium tracking-wide flex items-center justify-between transition-all ${
                activeTab === 'users' 
                  ? 'bg-[#141414] border border-[#252525] text-[#CCFF00]' 
                  : 'text-[#9A9A9A] hover:text-white bg-transparent border border-transparent'
              }`}
            >
              <div className="flex items-center space-x-2.5">
                <Users className="w-4 h-4" />
                <span>Athletes Console</span>
              </div>
              <span className="text-[9px] bg-[#222]/50 px-1.5 py-0.5 rounded text-zinc-500">TAB_2</span>
            </button>

            <button
              onClick={() => setActiveTab('operations')}
              className={`w-full text-left py-2.5 px-4 rounded-lg font-mono text-xs font-medium tracking-wide flex items-center justify-between transition-all ${
                activeTab === 'operations' 
                  ? 'bg-[#141414] border border-[#252525] text-[#CCFF00]' 
                  : 'text-[#9A9A9A] hover:text-white bg-transparent border border-transparent'
              }`}
            >
              <div className="flex items-center space-x-2.5">
                <Settings className="w-4 h-4" />
                <span>Operational Control</span>
              </div>
              <span className="text-[9px] bg-[#222]/50 px-1.5 py-0.5 rounded text-zinc-500">TAB_3</span>
            </button>
          </nav>
        </div>

        {/* Sidebar Footer Back button */}
        <div className="space-y-4">
          <button 
            onClick={triggerSync}
            disabled={isSyncing}
            className="w-full py-2 px-3 bg-[#141414] border border-[#202020] hover:border-zinc-700 text-[10px] font-mono rounded-lg flex items-center justify-center space-x-2 text-zinc-400 font-semibold cursor-pointer disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-[#CCFF00] ${isSyncing ? 'animate-spin' : ''}`} />
            <span>{isSyncing ? 'SYNCING API DAEMONS...' : 'FORCE DAEMON RE-SYNC'}</span>
          </button>

          <button 
            onClick={onBackToLanding}
            className="w-full py-2.5 px-4 bg-transparent border border-[#252525] hover:bg-[#141414] font-mono text-xs text-[#9A9A9A] hover:text-white rounded-lg flex items-center justify-center space-x-2 transition-all cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>MacroFlux Website</span>
          </button>
        </div>
      </aside>

      {/* Main Dynamic View Content Container */}
      <main className="flex-1 min-w-0 flex flex-col min-h-screen">
        
        {/* Global sticky small dashboard navbar header */}
        <header className="border-b border-[#1C1C1C] bg-[#0A0A0A]/50 backdrop-blur-md px-6 py-4 flex items-center justify-between sticky top-0 z-20">
          <div className="flex items-center space-x-4">
            <span className="text-sm font-mono text-[#9A9A9A] hidden sm:inline md:hidden border border-zinc-800 bg-zinc-900 px-2 py-1 rounded">
              MacroFlux Console
            </span>
            <div className="flex items-center space-x-2">
              <span className="text-xs font-mono text-[#CCFF00]">STATUS:</span>
              <span className="text-xs font-mono text-white flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block"></span>
                ACTIVE PIPELINE
              </span>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            {/* Small Mobile Responsive Tabs Toggles */}
            <div className="flex md:hidden border border-zinc-800 rounded-lg p-0.5 overflow-hidden">
              <button 
                onClick={() => setActiveTab('overview')} 
                className={`px-2.5 py-1 text-[10px] font-mono font-bold rounded ${activeTab === 'overview' ? 'bg-[#CCFF00] text-black' : 'text-[#9A9A9A]'}`}
              >
                Overview
              </button>
              <button 
                onClick={() => setActiveTab('users')} 
                className={`px-2.5 py-1 text-[10px] font-mono font-bold rounded ${activeTab === 'users' ? 'bg-[#CCFF00] text-black' : 'text-[#9A9A9A]'}`}
              >
                Athletes
              </button>
              <button 
                onClick={() => setActiveTab('operations')} 
                className={`px-2.5 py-1 text-[10px] font-mono font-bold rounded ${activeTab === 'operations' ? 'bg-[#CCFF00] text-black' : 'text-[#9A9A9A]'}`}
              >
                Settings
              </button>
            </div>

            <button 
              onClick={onBackToLanding}
              className="md:hidden py-1.5 px-3 rounded-lg border border-[#252525] text-xs font-mono text-[#9A9A9A] hover:text-white"
            >
              Exit
            </button>

            <span className="text-xs font-mono text-[#9A9A9A] bg-[#141414] px-3 py-1 rounded border border-[#202020] sm:inline hidden">
              System Time: <span className="text-[#CCFF00]">2026-05-26 09:28 UTC</span>
            </span>
          </div>
        </header>

        {/* Dynamic Route Content Viewer */}
        <div className="p-6 sm:p-8 max-w-7xl w-full mx-auto space-y-8 flex-1">
          
          <AnimatePresence mode="wait">
            
            {/* TAB 1: OVERVIEW COMPONENT */}
            {activeTab === 'overview' && (
              <motion.div
                key="overview"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                transition={{ duration: 0.2 }}
                className="space-y-8"
              >
                {/* Header Title strip */}
                <div>
                  <h1 className="font-display font-semibold text-2xl sm:text-3xl tracking-tight text-white">
                    Operational Engine Telemetry Overview
                  </h1>
                  <p className="text-[#9A9A9A] text-xs sm:text-sm mt-1">
                    Analyzing active physical biometric pipelines, athlete signups, and financial recurring parameters.
                  </p>
                </div>

                {/* Analytical Stats blocks */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                  
                  {/* Stat Card 1 - Total Athletes */}
                  <div className="bg-[#141414] border border-[#252525] rounded-xl p-5 hover:border-zinc-700 transition-all relative overflow-hidden group">
                    <div className="flex justify-between items-start">
                      <span className="text-xs font-mono text-[#9A9A9A] uppercase tracking-wider">Total Athletes Logged</span>
                    </div>
                    <div className="mt-4 flex items-baseline space-x-2">
                      <span className="text-3xl font-display font-extrabold text-[#CCFF00]">
                        {isLoadingData ? (
                          <span className="animate-pulse bg-zinc-800 w-16 h-8 inline-block rounded"></span>
                        ) : (dashboardMetrics?.totalUsers ?? '0')}
                      </span>
                      <span className="text-[10px] font-mono text-zinc-500">LIVE SYNCED</span>
                    </div>
                    <p className="text-[10px] text-zinc-500 mt-2 font-mono">
                      Active: {activeAthletesCount} / Accounts Banned: {bannedAthletesCount}
                    </p>
                  </div>

                  {/* Stat Card 2 - Premium Subscribers */}
                  <div className="bg-[#141414] border border-[#252525] rounded-xl p-5 hover:border-zinc-700 transition-all relative overflow-hidden">
                    <div className="flex justify-between items-start">
                      <span className="text-xs font-mono text-[#9A9A9A] uppercase tracking-wider">Premium Subscribers Target</span>
                    </div>
                    <div className="mt-4 flex items-baseline space-x-2">
                      <span className="text-3xl font-display font-extrabold text-white">
                        {isLoadingData ? (
                          <span className="animate-pulse bg-zinc-800 w-16 h-8 inline-block rounded"></span>
                        ) : `${dashboardMetrics?.premiumSubscriberRatio ?? '0'}%`}
                      </span>
                      <span className="text-[10px] font-mono text-zinc-500">PRO MEMBERS</span>
                    </div>
                    <p className="text-[10px] text-zinc-500 mt-2 font-mono">
                      Syndicate Seats: 18 Committed Accounts
                    </p>
                  </div>

                  {/* Stat Card 3 - Daily Workouts */}
                  <div className="bg-[#141414] border border-[#252525] rounded-xl p-5 hover:border-zinc-700 transition-all relative overflow-hidden">
                    <div className="flex justify-between items-start">
                      <span className="text-xs font-mono text-[#9A9A9A] uppercase tracking-wider">Active Daily Workouts</span>
                    </div>
                    <div className="mt-4 flex items-baseline space-x-2">
                      <span className="text-3xl font-display font-extrabold text-white">
                        {isLoadingData ? (
                          <span className="animate-pulse bg-zinc-800 w-16 h-8 inline-block rounded"></span>
                        ) : (dashboardMetrics?.activeWorkoutsToday ?? '0')}
                      </span>
                      <span className="text-[10px] font-mono text-zinc-500">LOGGED 24H</span>
                    </div>
                    <p className="text-[10px] text-zinc-500 mt-2 font-mono">
                      Avg Session Duration: 52 minutes
                    </p>
                  </div>

                  {/* Stat Card 4 - Server status */}
                  <div className="bg-[#141414] border border-[#252525] rounded-xl p-5 hover:border-zinc-700 transition-all relative overflow-hidden">
                    <div className="flex justify-between items-start">
                      <span className="text-xs font-mono text-[#9A9A9A] uppercase tracking-wider">Server Telemetry Status</span>
                      <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded">
                        OPERATIONAL
                      </span>
                    </div>
                    <div className="mt-4 flex items-baseline space-x-2">
                      <span className="text-2xl font-mono font-bold text-white uppercase text-glow">{settings.serverRegion}</span>
                    </div>
                    <p className="text-[10px] text-zinc-500 mt-3 font-mono">
                      Latency: 1.2ms / Signups Status: {settings.allowSignups ? 'ALLOWING_NEW' : 'BLOCKING_SIGNUPS'}
                    </p>
                  </div>

                </div>

                {/* Performance Chart & Metric Diagnostics Section */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  
                  {/* High Contrast Custom SVG Chart */}
                  <div className="bg-[#141414] border border-[#252525] rounded-xl p-6 lg:col-span-2 space-y-4">
                    <div className="flex justify-between items-center">
                      <div>
                        <h3 className="text-sm font-mono tracking-wider text-white uppercase">Athlete Acquisition Metrics Trend</h3>
                        <p className="text-[11px] text-zinc-500 mt-0.5">Bi-hourly aggregate calculation mapping physical licenses issued</p>
                      </div>
                      <div className="flex items-center space-x-2 text-[10px] font-mono text-[#9A9A9A]">
                        <span className="w-2 h-2 rounded bg-[#CCFF00]"></span>
                        <span>Telemetry Indexes</span>
                      </div>
                    </div>

                    {/* Interactive Chart Workspace */}
                    <div className="relative pt-6 h-56 border border-[#202020] rounded-lg bg-[#0D0D0D] p-4 flex flex-col justify-between">
                      
                      {/* Grid background overlay */}
                      <div className="absolute inset-x-0 top-6 bottom-14 flex flex-col justify-between pointer-events-none opacity-40">
                        <div className="border-b border-zinc-900 w-full"></div>
                        <div className="border-b border-zinc-900 w-full"></div>
                        <div className="border-b border-zinc-900 w-full"></div>
                        <div className="border-b border-zinc-900 w-full"></div>
                      </div>

                      {/* Line Curve rendered as responsive SVG */}
                      <div className="relative w-full h-full flex-1">
                        <svg className="w-full h-full" viewBox="0 0 540 140" preserveAspectRatio="none">
                          {/* Main stroke curve path */}
                          <path
                            d="M 10,130 C 80,110 160,88 240,65 S 320,45 400,32 T 520,10"
                            fill="none"
                            stroke="#CCFF00"
                            strokeWidth="3.5"
                            className="drop-shadow-[0_4px_10px_rgba(204,255,0,0.4)]"
                          />
                          
                          {/* Grid points interaction dots mapping overlay */}
                          {chartHistoryData.map((val, idx) => {
                            const x = 10 + (idx / (chartHistoryData.length - 1)) * 500;
                            // Map min 11000 to height 130, max 16000 to height 10
                            const y = 130 - ((val - 11500) / 4000) * 110;
                            const isActive = activeChartPoint?.index === idx;

                            return (
                              <g key={idx} className="cursor-pointer" onMouseEnter={() => setActiveChartPoint({ index: idx, value: val })} onMouseLeave={() => setActiveChartPoint(null)}>
                                <circle
                                  cx={x}
                                  cy={y}
                                  r={isActive ? 7 : 4}
                                  fill={isActive ? "#CCFF00" : "#141414"}
                                  stroke="#CCFF00"
                                  strokeWidth="2.5"
                                  style={{ transition: "all 0.2s" }}
                                />
                                {isActive && (
                                  <line x1={x} y1={y} x2={x} y2="140" stroke="#CCFF00" strokeWidth="1" strokeDasharray="3 3" />
                                )}
                              </g>
                            );
                          })}
                        </svg>

                        {/* Hover coordinates interactive box */}
                        {activeChartPoint !== null && (
                          <div className="absolute top-2 left-6 bg-[#141414] border border-[#252525] p-2.5 rounded shadow-2xl font-mono text-[10px]">
                            <span className="text-[#CCFF55] uppercase block block font-bold mb-0.5">METRIC DETAIL</span>
                            <div className="text-white flex justify-between gap-5 font-semibold">
                              <span>Month: {chartLabels[activeChartPoint.index]}</span>
                              <span>Athletes: {activeChartPoint.value.toLocaleString()}</span>
                            </div>
                          </div>
                        )}
                      </div>

                      {/* X-axis custom labels values */}
                      <div className="flex justify-between text-[10px] font-mono text-zinc-500 pt-2 border-t border-zinc-900 mt-2">
                        {chartLabels.map((lbl, i) => (
                          <span key={i}>{lbl}</span>
                        ))}
                      </div>

                    </div>
                  </div>

                  {/* Telemetry Operational Log Feed */}
                  <div className="bg-[#141414] border border-[#252525] rounded-xl p-6 space-y-4">
                    <div className="flex items-center justify-between border-b border-zinc-900 pb-3">
                      <div>
                        <h3 className="text-sm font-mono tracking-wider text-white uppercase">Daemon Log Outputs</h3>
                        <p className="text-[10px] text-zinc-500">High-frequency background process outputs</p>
                      </div>
                      <span className="w-2 h-2 rounded-full bg-[#CCFF00] animate-pulse"></span>
                    </div>

                    <div className="space-y-3 max-h-48 overflow-y-auto pr-1">
                      <div className="font-mono text-[9px] text-[#9A9A9A] bg-[#0D0D0D] border border-zinc-800 p-2 rounded relative">
                        <div className="text-[#CCFF00] font-bold">2026-05-26 09:28:12 INFO</div>
                        <p className="text-white mt-1">GCP ingest queue drained successfully. Registered 14 new workouts from Garmin Connected athletes pipeline.</p>
                      </div>

                      <div className="font-mono text-[9px] text-[#9A9A9A] bg-[#0D0D0D] border border-zinc-800 p-2 rounded">
                        <div className="text-zinc-500 font-bold">2026-05-26 09:24:05 WARN</div>
                        <p className="text-white mt-1">API rate warnings exceeded on client ID user-chloelin. Throttling sync window threshold factor securely.</p>
                      </div>

                      <div className="font-mono text-[9px] text-[#9A9A9A] bg-[#0D0D0D] border border-zinc-800 p-2 rounded">
                        <div className="text-[#CCFF00] font-bold">2026-05-26 09:12:45 INFO</div>
                        <p className="text-white mt-1">Successfully deployed system micro macro engine calculation improvements telemetry pipeline.</p>
                      </div>
                    </div>
                  </div>

                </div>

                {/* Notifications bulletin board displays */}
                <div className="bg-[#141414] border border-[#252525] rounded-xl p-6 space-y-4">
                  <div className="flex items-center justify-between border-b border-zinc-900 pb-3">
                    <div>
                      <h3 className="text-sm font-mono tracking-wider text-white uppercase">Deployed Client Bulletins</h3>
                      <p className="text-[11px] text-[#9A9A9A] mt-0.5">Active notifications pushed straight to registered athlete smartphones</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {notifications.map((notif: { id: string; targetGroup: any; sentAt: any; title: any; message: any; }) => (
                      <div key={notif.id} className="bg-[#0D0D0D] border border-[#252525] rounded-lg p-4 flex gap-4 justify-between items-start group">
                        <div className="space-y-1.5 flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-[9px] font-mono text-[#CCFF00] bg-[#CCFF00]/10 px-1.5 py-0.5 rounded uppercase">
                              {notif.targetGroup}
                            </span>
                            <span className="text-[9px] font-mono text-zinc-500">{notif.sentAt}</span>
                          </div>
                          <h4 className="text-xs font-bold text-white truncate">{notif.title}</h4>
                          <p className="text-[11px] text-zinc-400 leading-relaxed">{notif.message}</p>
                        </div>
                        <button 
                          onClick={() => handleDeleteNotif(notif.id)}
                          className="p-1 rounded hover:bg-red-500/10 text-zinc-500 hover:text-red-400 transition-colors"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>

                </div>

              </motion.div>
            )}

            {/* TAB 2: USER MANAGEMENT COMPONENT */}
            {activeTab === 'users' && (
              <motion.div
                key="users"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                transition={{ duration: 0.2 }}
                className="space-y-8"
              >
                {/* Header Title block */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  <div>
                    <h1 className="font-display font-semibold text-2xl tracking-tight text-white">
                      Registered Athletes Management Console
                    </h1>
                    <p className="text-[#9A9A9A] text-xs sm:text-sm mt-1">
                      Monitor workout stats, apply strict account flags or ban lists, and configure customized fuel indexes.
                    </p>
                  </div>
                  <div className="inline-flex items-center space-x-2 bg-[#141414] border border-[#252525] rounded-lg px-4 py-2">
                    <span className="text-xs font-mono text-[#9A9A9A]">ATHLETES REGISTERED:</span>
                    <span className="text-xs font-mono font-bold text-[#CCFF00]">{users.length}</span>
                  </div>
                </div>

                {/* Filter / Search bars */}
                <div className="flex flex-col sm:flex-row gap-4 justify-between bg-[#141414] border border-[#252525] p-4 rounded-xl">
                  {/* Search query input */}
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                    <input 
                      type="text"
                      placeholder="Search athletes by title name, email identifier, or active workout logs..."
                      value={searchUserQuery}
                      onChange={(e: { target: { value: any; }; }) => setSearchUserQuery(e.target.value)}
                      className="w-full pl-9 pr-4 py-2 bg-[#0D0D0D] border border-[#252525] hover:border-zinc-700 focus:border-[#CCFF00] rounded-lg text-xs font-mono transition-colors outline-none text-white placeholder-zinc-600"
                    />
                  </div>

                  {/* Filter tabs select options */}
                  <div className="flex items-center space-x-2">
                    <span className="text-[10px] font-mono text-[#9A9A9A] uppercase tracking-wider hidden lg:inline">Status Filter:</span>
                    <div className="flex border border-zinc-800 rounded-lg p-0.5 overflow-hidden text-xs bg-[#0D0D0D]">
                      <button 
                        onClick={() => setUserFilterStatus('all')}
                        className={`px-3 py-1.5 rounded font-mono text-[11px] uppercase tracking-wider font-semibold ${userFilterStatus === 'all' ? 'bg-[#CCFF00] text-black' : 'text-zinc-500'}`}
                      >
                        All
                      </button>
                      <button 
                        onClick={() => setUserFilterStatus('active')}
                        className={`px-3 py-1.5 rounded font-mono text-[11px] uppercase tracking-wider font-semibold ${userFilterStatus === 'active' ? 'bg-emerald-500/20 text-emerald-400' : 'text-zinc-500'}`}
                      >
                        Active
                      </button>
                      <button 
                        onClick={() => setUserFilterStatus('inactive')}
                        className={`px-3 py-1.5 rounded font-mono text-[11px] uppercase tracking-wider font-semibold ${userFilterStatus === 'inactive' ? 'bg-amber-500/20 text-amber-500' : 'text-zinc-500'}`}
                      >
                        Inactive
                      </button>
                      <button 
                        onClick={() => setUserFilterStatus('banned')}
                        className={`px-3 py-1.5 rounded font-mono text-[11px] uppercase tracking-wider font-semibold ${userFilterStatus === 'banned' ? 'bg-red-500/20 text-red-500' : 'text-zinc-500'}`}
                      >
                        Banned
                      </button>
                    </div>
                  </div>
                </div>

                {/* Main Athletes Data Grid Table */}
                <div className="bg-[#141414] border border-[#252525] rounded-xl overflow-hidden shadow-2xl">
                  {filteredUsers.length === 0 ? (
                    <div className="p-12 text-center text-zinc-500 font-mono text-xs">
                      No athlete records matched the filter parameter search bounds.
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-left font-mono text-xs text-[#9A9A9A]">
                        
                        {/* Table Headings */}
                        <thead className="bg-[#0A0A0A] text-white border-b border-[#202020] uppercase font-bold text-[10px] tracking-widest">
                          <tr>
                            <th className="px-6 py-4">Athlete Identity</th>
                            <th className="px-6 py-4 hidden sm:table-cell">Date Registered</th>
                            <th className="px-6 py-4">Active Telemetry Logs</th>
                            <th className="px-6 py-4">Status Flag</th>
                            <th className="px-6 py-4 text-right">Actions Queue</th>
                          </tr>
                        </thead>

                        {/* Table Rows */}
                        <tbody className="divide-y divide-[#1F1F1F]">
                          {isLoadingData ? (
                            Array.from({ length: 5 }).map((_, idx) => (
                              <tr key={`skeleton-${idx}`} className="animate-pulse">
                                <td className="px-6 py-4"><div className="h-4 bg-zinc-800 rounded w-3/4"></div></td>
                                <td className="px-6 py-4 hidden sm:table-cell"><div className="h-4 bg-zinc-800 rounded w-1/2"></div></td>
                                <td className="px-6 py-4"><div className="h-4 bg-zinc-800 rounded w-1/4"></div></td>
                                <td className="px-6 py-4"><div className="h-4 bg-zinc-800 rounded w-1/3"></div></td>
                                <td className="px-6 py-4"><div className="h-4 bg-zinc-800 rounded w-full pr-4"></div></td>
                              </tr>
                            ))
                          ) : filteredUsers.map((user: UserAccount) => (
                            <tr key={user.id} className="hover:bg-[#1A1A1A] transition-colors">
                              
                              {/* Athlete Identity column */}
                              <td className="px-6 py-4 font-sans">
                                <div>
                                  <div className="font-semibold text-white text-sm">{user.name}</div>
                                  <div className="font-mono text-xs text-zinc-500 mt-0.5">{user.email}</div>
                                </div>
                              </td>

                              {/* Date Registered */}
                              <td className="px-6 py-4 text-zinc-400 font-mono hidden sm:table-cell">
                                {user.registrationDate}
                              </td>

                              {/* Active Telemetry Logs */}
                              <td className="px-6 py-4">
                                <div className="space-y-1 max-w-[280px]">
                                  <div className="text-white truncate font-medium">{user.lastActiveWorkout}</div>
                                  <div className="flex items-center space-x-3 text-[10px] text-zinc-500">
                                    <span>Workouts: <b className="text-zinc-400">{user.workoutsCount}</b></span>
                                    <span>•</span>
                                    <span>Fuel Budget: <b className="text-[#CCFF00]">{user.caloriesBudget}</b></span>
                                  </div>
                                </div>
                              </td>

                              {/* Status Flag badge */}
                              <td className="px-6 py-4">
                                <span className={`inline-flex items-center space-x-1 px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-widest border ${
                                  user.status === 'active' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' :
                                  user.status === 'inactive' ? 'bg-amber-500/10 text-amber-500 border-amber-500/20' :
                                  'bg-red-500/10 text-red-500 border-red-500/20 text-glow'
                                }`}>
                                  <span className={`w-1 h-1 rounded-full ${
                                    user.status === 'active' ? 'bg-emerald-400 animate-pulse' :
                                    user.status === 'inactive' ? 'bg-amber-500' :
                                    'bg-red-500'
                                  }`}></span>
                                  <span>{user.status}</span>
                                </span>
                              </td>

                              {/* Actions Queue triggers */}
                              <td className="px-6 py-4 text-right">
                                <div className="inline-flex gap-2">
                                  {/* View Activity Log */}
                                  <button
                                    onClick={() => setSelectedLogUser(user)}
                                    title="View Athlete Activity Log Feed"
                                    className="p-1 px-2.5 rounded bg-zinc-900 border border-zinc-800 hover:border-zinc-700 text-zinc-400 text-[10px] uppercase font-bold tracking-wider hover:text-white transition-all flex items-center gap-1.5"
                                  >
                                    <Eye className="w-3.5 h-3.5" />
                                    <span className="hidden lg:inline">Logs</span>
                                  </button>

                                  {/* Edit Profile */}
                                  <button
                                    onClick={() => handleOpenEdit(user)}
                                    title="Configure Athlete Preferences"
                                    className="p-1 px-2 rounded bg-zinc-900 border border-zinc-800 hover:border-[#CCFF00] text-[#9A9A9A] hover:text-[#CCFF00] transition-all"
                                  >
                                    <Edit3 className="w-3.5 h-3.5" />
                                  </button>

                                  {/* Toggle Ban */}
                                  <button
                                    onClick={() => handleToggleBan(user.id)}
                                    title={`${user.status === 'banned' ? 'Pardon Athlete Account' : 'Restrict / Ban Athlete'}`}
                                    className={`p-1 px-2 rounded border transition-all ${
                                      user.status === 'banned'
                                        ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400 hover:bg-emerald-500/20'
                                        : 'bg-red-500/10 border-red-500/20 text-red-400 hover:bg-red-500/20'
                                    }`}
                                  >
                                    <UserMinus className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              </td>

                            </tr>
                          ))}
                        </tbody>

                      </table>
                      
                      {/* Pagination Controls */}
                      <div className="flex items-center justify-between px-6 py-4 border-t border-[#202020]">
                        <span className="text-xs text-zinc-500 font-mono">
                          Showing {users.length} of {totalUsers}
                        </span>
                        <div className="flex gap-2">
                          <button 
                            disabled={usersPage === 0}
                            onClick={() => setUsersPage((p: number) => Math.max(0, p - 1))}
                            className="px-3 py-1 bg-zinc-900 border border-zinc-700 text-zinc-300 text-xs rounded hover:bg-zinc-800 disabled:opacity-50"
                          >
                            Prev
                          </button>
                          <button 
                            disabled={(usersPage + 1) * 10 >= totalUsers}
                            onClick={() => setUsersPage((p: number) => p + 1)}
                            className="px-3 py-1 bg-zinc-900 border border-zinc-700 text-zinc-300 text-xs rounded hover:bg-zinc-800 disabled:opacity-50"
                          >
                            Next
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Edit modal or inline overlay drawer (AnimatePresence) */}
                <AnimatePresence>
                  {editingUser && (
                    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-6 z-50">
                      <motion.div 
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        className="bg-[#141414] border-2 border-[#252525] rounded-xl p-6 sm:p-8 w-full max-w-lg relative max-h-[90vh] overflow-y-auto"
                      >
                        <button 
                          type="button" 
                          onClick={() => setEditingUser(null)}
                          className="absolute top-4 right-4 text-zinc-500 hover:text-white"
                        >
                          <X className="w-5 h-5" />
                        </button>

                        <h3 className="font-display font-bold text-lg text-white mb-1">
                          Configure Athlete Preferences
                        </h3>
                        <p className="text-zinc-500 font-mono text-[10px] uppercase mb-6 tracking-wider">
                          Modifying: {editingUser.name} ({editingUser.id})
                        </p>

                        <form onSubmit={handleSaveUser} className="space-y-4 text-xs font-mono">
                          
                          <div>
                            <label className="text-[#9A9A9A] tracking-wider block mb-1">Full Athletic Title Name</label>
                            <input 
                              type="text" 
                              required
                              value={editingUser.name} 
                              onChange={(e: { target: { value: any; }; }) => setEditingUser({ ...editingUser, name: e.target.value })}
                              className="w-full bg-[#0D0D0D] border border-zinc-800 focus:border-[#CCFF00] p-3 rounded-lg text-white outline-none"
                            />
                          </div>

                          <div>
                            <label className="text-[#9A9A9A] tracking-wider block mb-1">Email Coordinates Address</label>
                            <input 
                              type="email" 
                              required
                              value={editingUser.email} 
                              onChange={(e: { target: { value: any; }; }) => setEditingUser({ ...editingUser, email: e.target.value })}
                              className="w-full bg-[#0D0D0D] border border-zinc-800 focus:border-[#CCFF00] p-3 rounded-lg text-white outline-none"
                            />
                          </div>

                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <label className="text-[#9A9A9A] tracking-wider block mb-1">Current Fuel Budget</label>
                              <input 
                                type="text" 
                                required
                                value={editingUser.caloriesBudget} 
                                onChange={(e: { target: { value: any; }; }) => setEditingUser({ ...editingUser, caloriesBudget: e.target.value })}
                                className="w-full bg-[#0D0D0D] border border-zinc-800 focus:border-[#CCFF00] p-3 rounded-lg text-white outline-none"
                              />
                            </div>
                            <div>
                              <label className="text-[#9A9A9A] tracking-wider block mb-1">Subscription Tier</label>
                              <select 
                                value={editingUser.subscription_tier || 'free'} 
                                onChange={(e: { target: { value: string; }; }) => setEditingUser({ ...editingUser, subscription_tier: e.target.value as 'free' | 'premium' })}
                                className="w-full bg-[#0D0D0D] border border-zinc-800 focus:border-[#CCFF00] p-3 rounded-lg text-white outline-none"
                              >
                                <option value="free">Free</option>
                                <option value="premium">Premium</option>
                              </select>
                            </div>
                          </div>

                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <label className="text-[#9A9A9A] tracking-wider block mb-1">Session Duration (mins)</label>
                              <input 
                                type="number" 
                                required
                                value={editingUser.durationMins} 
                                onChange={(e: { target: { value: string; }; }) => setEditingUser({ ...editingUser, durationMins: parseInt(e.target.value) || 0 })}
                                className="w-full bg-[#0D0D0D] border border-zinc-800 focus:border-[#CCFF00] p-3 rounded-lg text-white outline-none"
                              />
                            </div>
                            <div>
                              <label className="text-[#9A9A9A] tracking-wider block mb-1">System Status</label>
                              <select 
                                value={editingUser.status} 
                                onChange={(e: { target: { value: any; }; }) => setEditingUser({ ...editingUser, status: e.target.value as any })}
                                className="w-full bg-[#0D0D0D] border border-zinc-800 focus:border-[#CCFF00] p-3 rounded-lg text-white outline-none"
                              >
                                <option value="active">Active</option>
                                <option value="inactive">Inactive</option>
                                <option value="banned">Banned</option>
                              </select>
                            </div>
                          </div>

                          <div className="pt-4 flex gap-3">
                            <button 
                              type="button" 
                              onClick={() => setEditingUser(null)}
                              className="flex-1 py-3 border border-zinc-800 hover:bg-[#1A1A1A] rounded-lg text-[#9A9A9A] tracking-widest font-bold font-display"
                            >
                              CANCEL
                            </button>
                            <button 
                              type="submit" 
                              className="flex-1 py-3 bg-[#CCFF00] text-black hover:brightness-110 rounded-lg tracking-widest font-bold font-display flex items-center justify-center space-x-1"
                            >
                              <Save className="w-4 h-4" />
                              <span>SAVE ATHLETE</span>
                            </button>
                          </div>

                        </form>
                      </motion.div>
                    </div>
                  )}
                </AnimatePresence>

                {/* Activity log drawer visual overlay (AnimatePresence) */}
                <AnimatePresence>
                  {selectedLogUser && (
                    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-6 z-50">
                      <motion.div 
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        className="bg-[#141414] border-2 border-[#252525] rounded-xl p-6 sm:p-8 w-full max-w-lg relative"
                      >
                        <button 
                          type="button" 
                          onClick={() => setSelectedLogUser(null)}
                          className="absolute top-4 right-4 text-zinc-500 hover:text-white"
                        >
                          <X className="w-5 h-5" />
                        </button>

                        <div className="flex items-center gap-3 mb-1">
                          <Activity className="w-5 h-5 text-[#CCFF00]" />
                          <h3 className="font-display font-bold text-lg text-white">
                            Athlete Biometric Activity Logs
                          </h3>
                        </div>
                        <p className="text-zinc-500 font-mono text-[10px] uppercase mb-6 tracking-wider">
                          Audit Trail mapping output indicators for: {selectedLogUser.name}
                        </p>

                        <div className="space-y-4 max-h-80 overflow-y-auto pr-1 text-xs font-mono text-zinc-400">
                          
                          <div className="bg-[#0D0D0D] border border-zinc-800 p-3 rounded">
                            <div className="text-emerald-400 font-semibold text-[10px] flex justify-between">
                              <span>METRIC_INGEST_OK</span>
                              <span>2026-05-26 09:12</span>
                            </div>
                            <p className="text-zinc-300 mt-1">Ingested heart rate strain average of 142 BPM during: <span className="text-white font-bold">{selectedLogUser.lastActiveWorkout}</span>. Calculated peak kinetic workload ratio at 1.05.</p>
                          </div>

                          <div className="bg-[#0D0D0D] border border-zinc-800 p-3 rounded">
                            <div className="text-emerald-400 font-semibold text-[10px] flex justify-between">
                              <span>MACRO_ENGINE_CALIBRATE</span>
                              <span>2026-05-25 18:40</span>
                            </div>
                            <p className="text-zinc-300 mt-1">Calibrated daily macro budgets securely. Protein set target at 185g, Carbs target set at 220g. Calorie boundary recalculated to: <span className="text-[#CCFF00] font-bold">{selectedLogUser.caloriesBudget}</span>.</p>
                          </div>

                          <div className="bg-[#0D0D0D] border border-zinc-800 p-3 rounded">
                            <div className="text-sky-400 font-semibold text-[10px] flex justify-between">
                              <span>HARDWARE_SYNC_OK</span>
                              <span>2026-05-24 07:15</span>
                            </div>
                            <p className="text-zinc-300 mt-1">Initiated smartwatch local sync payload. Completed data ingestion in 0.8ms. Discharged 0 duplicate biometric records.</p>
                          </div>

                          <div className="bg-[#0D0D0D] border border-zinc-800 p-3 rounded">
                            <div className="text-zinc-500 font-semibold text-[10px] flex justify-between">
                              <span>ACCOUNT_REGISTRY_INIT</span>
                              <span>{selectedLogUser.registrationDate}</span>
                            </div>
                            <p className="text-zinc-300 mt-1">Constructed raw database indexes for athletic identifier. Assigned security token and launched starting default metabolic calculations rules pipeline.</p>
                          </div>

                        </div>

                        <div className="mt-6 pt-4 border-t border-zinc-900">
                          <button 
                            onClick={() => setSelectedLogUser(null)}
                            className="w-full py-3 bg-[#CCFF00] text-black hover:brightness-110 rounded-lg tracking-widest font-bold font-display"
                          >
                            CLOSE ACTIVITY DESK
                          </button>
                        </div>
                      </motion.div>
                    </div>
                  )}
                </AnimatePresence>

              </motion.div>
            )}

            {/* TAB 3: OPERATIONAL CONTROLS COMPONENT */}
            {activeTab === 'operations' && (
              <motion.div
                key="operations"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                transition={{ duration: 0.2 }}
                className="grid grid-cols-1 lg:grid-cols-3 gap-8"
              >
                
                {/* Visual Settings Column (Left 2/3s) */}
                <div className="lg:col-span-2 space-y-8">
                  
                  {/* Header Titles */}
                  <div>
                    <h1 className="font-display font-semibold text-2xl tracking-tight text-white">
                      Operational Settings Control Panel
                    </h1>
                    <p className="text-[#9A9A9A] text-xs sm:text-sm mt-1">
                      Configure high-performance server parameters, adjust synchronicity thresholds, and tweak developer flags.
                    </p>
                  </div>

                  {/* Settings Toggles List block */}
                  <div className="bg-[#141414] border border-[#252525] rounded-xl p-6 sm:p-8 space-y-6">
                    <div className="border-b border-zinc-900 pb-4 flex items-center gap-2">
                      <Sliders className="w-5 h-5 text-[#CCFF00]" />
                      <h3 className="text-sm font-mono tracking-wider text-white uppercase">System Setting Nodes</h3>
                    </div>

                    <div className="space-y-5 text-xs font-mono">
                      
                      {/* Allow Athlete registrations */}
                      <div className="flex items-center justify-between p-4 bg-[#0D0D0D] border border-zinc-900 rounded-lg hover:border-zinc-800 transition-colors">
                        <div className="space-y-1 pr-4">
                          <span className="text-white font-bold block">Allow Athlete Signup Credentials</span>
                          <p className="text-zinc-500 text-[10px] leading-relaxed">
                            Control whether new athlete files are generated into the central database. Disabling halts external registrations.
                          </p>
                        </div>
                        <button 
                          onClick={() => {
                            const newValue = !settings.allowSignups;
                            handleToggleConfig('allowSignups', newValue);
                            showToast(`Signups have been ${newValue ? 'ENABLED' : 'PAUSED'}`);
                          }}
                          className={`w-16 h-8 rounded-full transition-all relative ${settings.allowSignups ? 'bg-[#CCFF00]' : 'bg-zinc-800'}`}
                        >
                          <div className={`w-6 h-6 rounded-full bg-black absolute top-1 transition-all ${settings.allowSignups ? 'left-9' : 'left-1'}`}></div>
                        </button>
                      </div>

                      {/* Active Feature testing */}
                      <div className="flex items-center justify-between p-4 bg-[#0D0D0D] border border-zinc-900 rounded-lg hover:border-zinc-800 transition-colors">
                        <div className="space-y-1 pr-4">
                          <span className="text-white font-bold block">Experimental Biomorphic Waveform Engine</span>
                          <p className="text-zinc-500 text-[10px] leading-relaxed">
                            Activate experimental high-frequency continuous heart rate analysis overlays for active running athletes.
                          </p>
                        </div>
                        <button 
                          onClick={() => {
                            const newValue = !settings.activeFeatureTesting;
                            handleToggleConfig('activeFeatureTesting', newValue);
                            showToast(`Biomorphic Engine target is now ${newValue ? 'ACTIVE' : 'OFFLINE'}`);
                          }}
                          className={`w-16 h-8 rounded-full transition-all relative ${settings.activeFeatureTesting ? 'bg-[#CCFF00]' : 'bg-zinc-800'}`}
                        >
                          <div className={`w-6 h-6 rounded-full bg-black absolute top-1 transition-all ${settings.activeFeatureTesting ? 'left-9' : 'left-1'}`}></div>
                        </button>
                      </div>

                      {/* Maintenance mode lockout */}
                      <div className="flex items-center justify-between p-4 bg-[#0D0D0D] border border-zinc-900 rounded-lg hover:border-zinc-800 transition-colors">
                        <div className="space-y-1 pr-4">
                          <div className="flex items-center gap-2">
                            <span className="text-white font-bold">System Maintenance Mode (Lockout)</span>
                            {settings.maintenanceMode && <ShieldAlert className="w-4 h-4 text-red-500 text-glow animate-pulse" />}
                          </div>
                          <p className="text-zinc-500 text-[10px] leading-relaxed">
                            Enforcing central lock downs. Restricts active smart watch sync processes down completely except for administrative developers.
                          </p>
                        </div>
                        <button 
                          onClick={() => {
                            const newValue = !settings.maintenanceMode;
                            handleToggleConfig('maintenanceMode', newValue);
                            showToast(`System Lockout mode is now ${newValue ? 'ACTIVE (RESTRICTED)' : 'COMPLETED'}`);
                          }}
                          className={`w-16 h-8 rounded-full transition-all relative ${settings.maintenanceMode ? 'bg-red-500' : 'bg-zinc-800'}`}
                        >
                          <div className={`w-6 h-6 rounded-full bg-black absolute top-1 transition-all ${settings.maintenanceMode ? 'left-9' : 'left-1'}`}></div>
                        </button>
                      </div>

                      {/* Sync Interval Slider */}
                      <div className="p-4 bg-[#0D0D0D] border border-zinc-900 rounded-lg space-y-3">
                        <div className="flex justify-between items-center text-xs">
                          <span className="text-white font-bold">Smartwatch Sync Interval</span>
                          <span className="text-[#CCFF00] font-bold font-mono">{settings.dataSyncInterval} seconds</span>
                        </div>
                        <p className="text-zinc-500 text-[10px] leading-relaxed">
                          Define server polling loops timing specifications for connected wearable biometric payloads. Lower interval yields more precise real-time graph lines but raises background computing loads.
                        </p>
                        <input 
                          type="range"
                          min="5"
                          max="120"
                          value={settings.dataSyncInterval}
                          onMouseUp={() => handleToggleConfig('dataSyncInterval', settings.dataSyncInterval)} /* Sync to backend only on drag finish */
                          onChange={(e: { target: { value: string; }; }) => setSettings({ ...settings, dataSyncInterval: parseInt(e.target.value) || 15 })}
                          className="w-full accent-[#CCFF00] bg-[#1C1C1C] h-1.5 rounded-lg cursor-pointer pt-2"
                        />
                      </div>

                      {/* Logging Levels & Region displays */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="p-4 bg-[#0D0D0D] border border-zinc-900 rounded-lg space-y-2">
                          <span className="text-white font-bold block">Developer Log Verbosity</span>
                          <select
                            value={settings.apiLogLevel}
                            onChange={(e: { target: { value: any; }; }) => handleToggleConfig('apiLogLevel', e.target.value)}
                            className="w-full bg-[#141414] border border-zinc-800 p-2 rounded text-zinc-300 focus:border-[#CCFF00]"
                          >
                            <option value="info">INFO (Verbose Outputs)</option>
                            <option value="warn">WARN (State changes only)</option>
                            <option value="error">ERROR (System failures)</option>
                            <option value="debug">DEBUG (Deep VM variables)</option>
                          </select>
                        </div>

                        <div className="p-4 bg-[#0D0D0D] border border-zinc-900 rounded-lg space-y-2">
                          <span className="text-white font-bold block">Central Server Region</span>
                          <input 
                            type="text"
                            value={settings.serverRegion}
                            onChange={(e: { target: { value: any; }; }) => setSettings({ ...settings, serverRegion: e.target.value })}
                            onBlur={() => handleToggleConfig('serverRegion', settings.serverRegion)}
                            className="w-full bg-[#141414] border border-zinc-800 p-2 rounded text-zinc-300 focus:border-[#CCFF00] outline-none"
                          />
                        </div>
                      </div>

                    </div>
                  </div>

                </div>

                {/* Right Notification Deploy Form Column (1/3) */}
                <div className="space-y-8">
                  
                  {/* Heading header title */}
                  <div>
                    <h3 className="font-display font-semibold text-lg text-white">
                      Push Notifications Telemetry Desk
                    </h3>
                    <p className="text-[#9A9A9A] text-xs mt-1">
                      Draft bullet files and dispatch notifications directly to targeted client devices.
                    </p>
                  </div>

                  {/* notification form box */}
                  <div className="bg-[#141414] border border-[#252525] rounded-xl p-6 space-y-6">
                    <div className="border-b border-zinc-900 pb-4 flex items-center gap-2">
                      <Bell className="w-5 h-5 text-[#CCFF00]" />
                      <span className="text-xs font-mono tracking-wider text-white uppercase">Dispatch Bulletin Form</span>
                    </div>

                    <form onSubmit={handleSendNotification} className="space-y-4 font-mono text-xs">
                      
                      <div>
                        <label className="text-[#9A9A9A] tracking-wider block mb-1">Notification Headline</label>
                        <input
                          type="text"
                          required
                          placeholder="e.g. Server optimization update"
                          value={notifTitle}
                          onChange={(e: { target: { value: any; }; }) => setNotifTitle(e.target.value)}
                          className="w-full bg-[#0D0D0D] border border-zinc-900 focus:border-[#CCFF00] p-3 rounded-lg text-white outline-none placeholder-zinc-700"
                        />
                      </div>

                      <div>
                        <label className="text-[#9A9A9A] tracking-wider block mb-1">Target Athlete Demographics</label>
                        <select
                          value={notifTarget}
                          onChange={(e: any) => setNotifTarget(e.target.value)}
                          className="w-full bg-[#0D0D0D] border border-zinc-900 focus:border-[#CCFF00] p-3 rounded-lg text-white outline-none"
                        >
                          <option value="all">All Registered Athletes</option>
                          <option value="free">Free Tier Athletes</option>
                          <option value="premium">Premium Subscribed Data Athletes</option>
                        </select>
                      </div>

                      <div>
                        <label className="text-[#9A9A9A] tracking-wider block mb-1">Bulletin Body Messaging</label>
                        <textarea
                          required
                          rows={4}
                          placeholder="Write concise athletic technical specifications or notifications message coordinates here..."
                          value={notifMessage}
                          onChange={(e: any) => setNotifMessage(e.target.value)}
                          className="w-full bg-[#0D0D0D] border border-zinc-900 focus:border-[#CCFF00] p-3 rounded-lg text-white outline-none placeholder-zinc-700 resize-none"
                        ></textarea>
                      </div>

                      <div className="pt-2">
                        <button
                          type="submit"
                          disabled={isPublishing}
                          className="w-full py-3.5 bg-[#CCFF00] text-black hover:brightness-110 font-display font-bold rounded-lg uppercase tracking-wider flex items-center justify-center space-x-2 border border-black shadow disabled:opacity-50"
                        >
                          <Bell className={`w-4 h-4 text-black ${isPublishing ? 'animate-bounce' : ''}`} />
                          <span>{isPublishing ? 'Transmitting Overrides...' : 'Dispatch Live Bulletin'}</span>
                        </button>
                      </div>

                    </form>
                  </div>

                  {/* Past Blasts Grid */}
                  <div className="bg-[#141414] border border-[#252525] rounded-xl p-6 sm:p-8 space-y-6">
                    <div className="border-b border-zinc-900 pb-4 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Database className="w-5 h-5 text-[#CCFF00]" />
                        <h3 className="text-sm font-mono tracking-wider text-white uppercase">Historical Transmission Logs</h3>
                      </div>
                      <span className="text-xs font-mono text-zinc-500">{pastBlasts.length} Records</span>
                    </div>
                    
                    <div className="overflow-x-auto">
                      <table className="w-full text-left font-mono text-xs text-[#9A9A9A]">
                        <thead className="bg-[#0A0A0A] text-white border-b border-[#202020] uppercase font-bold text-[10px] tracking-widest">
                          <tr>
                            <th className="px-4 py-3">Timestamp</th>
                            <th className="px-4 py-3">Transmission Title</th>
                            <th className="px-4 py-3">Target Scope</th>
                            <th className="px-4 py-3 text-right">Status</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-[#1F1F1F]">
                          {pastBlasts.length === 0 ? (
                            <tr>
                              <td colSpan={4} className="px-4 py-8 text-center text-zinc-500 italic">No historical broadcasts found</td>
                            </tr>
                          ) : (
                            pastBlasts.map((blast) => (
                              <tr key={blast.id} className="hover:bg-[#1A1A1A] transition-colors">
                                <td className="px-4 py-3 text-[10px]">
                                  {new Date(blast.created_at).toLocaleString()}
                                </td>
                                <td className="px-4 py-3 font-semibold text-white">
                                  {blast.title}
                                </td>
                                <td className="px-4 py-3 uppercase tracking-wider text-[10px]">
                                  <span className={`px-2 py-0.5 rounded ${blast.target_tier === 'premium' ? 'bg-[#CCFF00]/10 text-[#CCFF00] border border-[#CCFF00]/20' : blast.target_tier === 'free' ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20' : 'bg-purple-500/10 text-purple-400 border border-purple-500/20'}`}>
                                    {blast.target_tier}
                                  </span>
                                </td>
                                <td className="px-4 py-3 text-right text-emerald-400 text-[10px] uppercase font-bold">
                                  Dispatched
                                </td>
                              </tr>
                            ))
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* System statistics tracker mockup widget */}
                  <div className="bg-[#141414] border border-[#252525] rounded-xl p-5 font-mono text-[10px] space-y-3">
                    <div className="flex justify-between items-center text-[#9A9A9A] border-b border-zinc-900 pb-2">
                      <span>DAEMON SYSTEM HEALTH</span>
                      <span className="text-emerald-400 font-bold uppercase">SECURED ACCELERATION</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-zinc-500">DATABASE LATENCY:</span>
                      <span className="text-white font-bold">0.42ms (optimal)</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-zinc-500">NOTIFICATION SOCKETS:</span>
                      <span className="text-white font-bold">{users.length} connected</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-zinc-500">WEARABLE INGEST BUFFERS:</span>
                      <span className="text-white font-bold">3,124 packets / min</span>
                    </div>
                  </div>

                </div>

              </motion.div>
            )}

          </AnimatePresence>

        </div>

      </main>

    </div>
  );
}
