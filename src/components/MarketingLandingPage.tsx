import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Flame, 
  TrendingUp, 
  Activity, 
  Sparkles, 
  Dumbbell, 
  ChevronRight, 
  Check, 
  Heart, 
  Apple, 
  Zap, 
  Timer, 
  Gauge, 
  Cpu, 
  Play, 
  Pause, 
  ArrowRight, 
  Clock, 
  Database,
  Users
} from 'lucide-react';

interface MarketingLandingPageProps {
  onLaunchAdmin: () => void;
}

export function MarketingLandingPage({ onLaunchAdmin }: MarketingLandingPageProps) {
  // Mini interactive macro calculator states
  const [protein, setProtein] = useState<number>(180); // grams
  const [carbs, setCarbs] = useState<number>(240); // grams
  const [fats, setFats] = useState<number>(70); // grams
  const calorieBudget = protein * 4 + carbs * 4 + fats * 9;

  // Treadmill simulation state
  const [treadmillActive, setTreadmillActive] = useState<boolean>(false);
  const [treadmillSpeed, setTreadmillSpeed] = useState<number>(11.5); // km/h
  const [treadmillDistance, setTreadmillDistance] = useState<number>(3.45); // km
  const [treadmillTime, setTreadmillTime] = useState<number>(1042); // seconds

  // Biometrics simulation
  const [heartRate, setHeartRate] = useState<number>(142);
  const [hrHistory, setHrHistory] = useState<number[]>([120, 125, 130, 128, 135, 142, 140, 145, 142]);

  // Treadmill timer effect
  useEffect(() => {
    let interval: any = null;
    if (treadmillActive) {
      interval = setInterval(() => {
        setTreadmillTime((prev) => prev + 1);
        // Speed conversion to delta distance every second
        // 11.5 km/h = 11.5 * 1000m / 3600s = ~3.19 meters per second
        const speedMps = (treadmillSpeed * 1000) / 3600;
        setTreadmillDistance((prev) => prev + speedMps / 1000);
        // fluctuates heart-rate slightly on activity
        setHeartRate((prev) => {
          const delta = Math.floor(Math.random() * 5) - 2;
          const nextHr = Math.min(Math.max(prev + delta, 130), 178);
          setHrHistory((prevArr) => [...prevArr.slice(1), nextHr]);
          return nextHr;
        });
      }, 1000);
    } else {
      clearInterval(interval);
    }
    return () => clearInterval(interval);
  }, [treadmillActive, treadmillSpeed]);

  // Kinetic Turbine hover coordinate mapping for the Interactive SVG
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const turbineRef = useRef<HTMLDivElement>(null);
  
  const handleMouseMove = (e: React.MouseEvent) => {
    if (!turbineRef.current) return;
    const rect = turbineRef.current.getBoundingClientRect();
    const x = (e.clientX - rect.left - rect.width / 2) / (rect.width / 2);
    const y = (e.clientY - rect.top - rect.height / 2) / (rect.height / 2);
    setMousePos({ x, y });
  };

  const handleMouseLeave = () => {
    setMousePos({ x: 0, y: 0 });
  };

  // Format time (seconds to MM:SS)
  const formatTime = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const rem = secs % 60;
    return `${mins.toString().padStart(2, '0')}:${rem.toString().padStart(2, '0')}`;
  };

  return (
    <div className="bg-[#0D0D0D] min-h-screen text-white font-sans relative overflow-hidden bg-grid selection:bg-[#CCFF00] selection:text-black">
      
      {/* Premium Top Navigation Bar */}
      <header className="border-b border-[#1C1C1C] bg-[#0D0D0D]/80 backdrop-blur-md sticky top-0 z-50 px-4 sm:px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-3 group cursor-pointer" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
            <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-black to-[#1A1A1A] border border-[#CCFF00]/50 flex items-center justify-center p-1 relative overflow-hidden">
              <span className="text-[#CCFF00] font-black text-xs font-mono group-hover:scale-110 transition-transform">MF</span>
              <div className="absolute inset-0 bg-[#CCFF00]/10 opacity-0 group-hover:opacity-100 transition-opacity"></div>
            </div>
            <div>
              <span className="font-display font-bold text-base sm:text-lg tracking-wider bg-gradient-to-r from-white to-[#BFBFBF] bg-clip-text text-transparent">MACRO</span>
              <span className="font-display font-black text-base sm:text-lg tracking-wider text-[#CCFF00] text-glow">FLUX</span>
            </div>
          </div>
          
          <nav className="hidden lg:flex items-center space-x-8 text-sm font-medium text-[#9A9A9A]">
            <a href="#features" className="hover:text-[#CCFF00] transition-colors">Performance Grid</a>
            <a href="#biometrics" className="hover:text-[#CCFF00] transition-colors">Interactive Kinetic Core</a>
            <a href="#pricing" className="hover:text-[#CCFF00] transition-colors">Syndicate Levels</a>
          </nav>

          <div className="flex items-center space-x-2 sm:space-x-3">
            <button 
              onClick={onLaunchAdmin}
              className="py-1.5 px-2.5 sm:px-3 rounded-md bg-[#141414] border border-[#252525] text-[11px] sm:text-xs font-mono font-semibold hover:border-[#CCFF00] text-[#9A9A9A] hover:text-[#CCFF00] transition-all flex items-center space-x-1"
              id="btn-admin-access"
            >
              <Users className="w-3.5 h-3.5 mr-0.5 sm:mr-1" />
              <span className="hidden xs:inline">Admin Panel</span>
              <span className="xs:hidden">Admin</span>
            </button>
            <a 
              href="#pricing"
              className="py-1.5 px-3 sm:px-4 rounded-md bg-[#CCFF00] text-black text-[11px] sm:text-xs font-bold font-display hover:brightness-110 transition-all glow-btn"
              id="nav-get-started"
            >
              Initialize App
            </a>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative pt-12 sm:pt-20 pb-16 sm:pb-24 px-4 sm:px-6 max-w-7xl mx-auto flex flex-col lg:flex-row items-center gap-10 lg:gap-16 z-10">
        
        {/* Glow ambient spots */}
        <div className="absolute -top-40 -left-40 w-96 h-96 bg-[#CCFF00]/5 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute right-0 top-1/4 w-80 h-80 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none"></div>

        <div className="flex-1 text-center lg:text-left w-full">
          <div className="inline-flex items-center space-x-2 bg-[#141414] border border-[#252525] rounded-full px-3 py-1 mb-6">
            <span className="w-1.5 h-1.5 bg-[#CCFF00] rounded-full animate-ping"></span>
            <span className="text-[10px] sm:text-[11px] font-mono tracking-widest text-[#9A9A9A] uppercase">MacroFlux Core Operational Engine v2.4</span>
          </div>

          <h1 className="font-display font-extrabold text-3xl sm:text-5xl lg:text-6xl tracking-tight leading-tight mb-6">
            Precision Fueling.<br />
            <span className="text-[#CCFF00] text-glow bg-gradient-to-r from-[#CCFF00] to-[#E6FF80] bg-clip-text text-transparent">High-Fidelity</span> Performance Tracking.
          </h1>

          <p className="text-sm sm:text-base lg:text-lg text-[#9A9A9A] font-light max-w-xl mx-auto lg:mx-0 mb-8 leading-relaxed">
            Eliminate cognitive friction. Align custom metabolic algorithms with high-frequency kinetic tracking. Real-time glycogen simulation, live metric indexing, and biomechanical velocity analytics.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4">
            <a
              href="#pricing"
              className="w-full sm:w-auto text-center bg-[#CCFF00] text-black px-8 py-3.5 rounded-lg font-display font-bold text-sm hover:brightness-110 tracking-wide transition-all duration-300 shadow-lg shadow-[#CCFF00]/10 flex items-center justify-center space-x-2"
              id="hero-cta"
            >
              <span>Get Started</span>
              <ChevronRight className="w-4 h-4 text-black" />
            </a>
            <button
              onClick={onLaunchAdmin}
              className="w-full sm:w-auto text-center bg-transparent border border-[#252525] text-white px-8 py-3.5 rounded-lg font-mono text-xs hover:bg-[#141414] hover:border-[#CCFF00] tracking-wider transition-all duration-300 flex items-center justify-center space-x-2"
              id="hero-demo"
            >
              <span>Launch Admin Panel Workspace</span>
              <ArrowRight className="w-4 h-4 text-[#CCFF00]" />
            </button>
          </div>

          {/* Minimal Specs */}
          <div className="grid grid-cols-3 gap-2 sm:gap-6 mt-12 pt-8 border-t border-[#1C1C1C] max-w-lg mx-auto lg:mx-0">
            <div>
              <div className="font-mono text-[#CCFF00] text-base sm:text-lg font-bold">1.2ms</div>
              <div className="text-[9px] sm:text-[10px] uppercase tracking-wider text-[#9A9A9A] mt-1">Sync Latency</div>
            </div>
            <div>
              <div className="font-mono text-white text-base sm:text-lg font-bold">99.8%</div>
              <div className="text-[9px] sm:text-[10px] uppercase tracking-wider text-[#9A9A9A] mt-1">Accuracy Index</div>
            </div>
            <div>
              <div className="font-mono text-white text-base sm:text-lg font-bold">14.8K+</div>
              <div className="text-[9px] sm:text-[10px] uppercase tracking-wider text-[#9A9A9A] mt-1">Athletes Logged</div>
            </div>
          </div>
        </div>

        {/* Minimal High-Fidelity Mockup (Interactive Component 1 Mockup) */}
        <div className="flex-1 w-full max-w-lg relative block group">
          <div className="absolute inset-0 bg-gradient-to-tr from-[#CCFF00]/10 to-transparent rounded-2xl filter blur-xl opacity-30 group-hover:opacity-60 transition-opacity"></div>
          
          {/* Glass Device Frame */}
          <div className="relative bg-[#141414] border-2 border-[#252525] rounded-2xl p-4 sm:p-6 shadow-2xl glass-box overflow-hidden">
            {/* Top Device Notch Style */}
            <div className="flex items-center justify-between border-b border-[#252525]/80 pb-4 mb-5">
              <div className="flex items-center space-x-2">
                <span className="w-3 h-3 rounded-full bg-red-500/20 border border-red-500/40"></span>
                <span className="w-3 h-3 rounded-full bg-yellow-500/20 border border-yellow-500/40"></span>
                <span className="w-3 h-3 rounded-full bg-[#CCFF00]/20 border border-[#CCFF00]/40"></span>
              </div>
              <div className="font-mono text-[10px] text-[#9A9A9A] bg-[#1F1F1F] px-2 py-0.5 rounded-md border border-[#2D2D2D] flex items-center gap-1.5">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></div>
                <span>LIVE CORE SIGNAL</span>
              </div>
            </div>

            {/* Simulated Live User Stat Widgets */}
            <div className="space-y-4">
              
              {/* Widget 1: Live Protein Synthesis tracker */}
              <div className="bg-[#0D0D0D] border border-[#252525] rounded-xl p-4 flex items-center justify-between relative overflow-hidden">
                <div className="space-y-1">
                  <span className="text-[11px] font-mono tracking-widest text-[#9A9A9A] block uppercase">CALORIC EXPEDITION BOUNDS</span>
                  <span className="text-xl font-display font-extrabold text-white">{calorieBudget.toLocaleString()} kcal</span>
                </div>
                <div className="text-right">
                  <span className="text-[10px] font-mono text-[#CCFF00] bg-[#CCFF00]/10 border border-[#CCFF00]/30 px-2 py-0.5 rounded-full">ACTIVE DEFICIT</span>
                  <span className="text-xs text-[#9A9A9A] block mt-1 font-mono">{protein}p / {carbs}c / {fats}f</span>
                </div>
                <div className="absolute top-0 right-0 w-24 h-full pointer-events-none opacity-20">
                  <svg viewBox="0 0 100 100" className="w-full h-full text-[#CCFF00]">
                    <path d="M 0,80 Q 20,40 40,60 T 80,20 T 100,60" fill="none" stroke="currentColor" strokeWidth="4" />
                  </svg>
                </div>
              </div>

              {/* Widget 2: Heart rate & stress telemetry with SVG Waveform pulse */}
              <div className="bg-[#0D0D0D] border border-[#252525] rounded-xl p-4">
                <div className="flex justify-between items-center mb-3">
                  <div className="flex items-center space-x-2">
                    <Heart className="w-4 h-4 text-red-500 animate-pulse" />
                    <span className="text-[11px] font-mono text-[#9A9A9A] uppercase tracking-wider">High-Freq Heart Rate Feed</span>
                  </div>
                  <span className="font-mono text-xs font-semibold text-[#CCFF00]">{heartRate} BPM</span>
                </div>
                
                {/* SVG waveform */}
                <div className="h-10 w-full">
                  <svg className="w-full h-full" viewBox="0 0 160 40" preserveAspectRatio="none">
                    <polyline
                      fill="none"
                      stroke="#CCFF00"
                      strokeWidth="2.5"
                      points={hrHistory.map((val, idx) => {
                        // Map index to X and val to Y
                        const x = (idx / (hrHistory.length - 1)) * 160;
                        const y = 40 - ((val - 110) / 70) * 35; // map 110-180 BPM to Y height
                        return `${x},${y}`;
                      }).join(' ')}
                    />
                    {/* Glowing effect inside SVG */}
                    <polyline
                      fill="none"
                      stroke="#CCFF00"
                      strokeWidth="6"
                      strokeOpacity="0.2"
                      points={hrHistory.map((val, idx) => {
                        const x = (idx / (hrHistory.length - 1)) * 160;
                        const y = 40 - ((val - 110) / 70) * 35;
                        return `${x},${y}`;
                      }).join(' ')}
                    />
                  </svg>
                </div>
              </div>

              {/* Widget 3: Gym Active Speed Tracking */}
              <div className="bg-[#0D0D0D] border border-[#252525] rounded-xl p-4">
                <div className="flex justify-between items-center mb-3">
                  <div className="flex items-center space-x-2">
                    <Activity className="w-4 h-4 text-[#CCFF00]" />
                    <span className="text-[11px] font-mono text-[#9A9A9A] uppercase tracking-wider">Biomechanical Run Logs</span>
                  </div>
                  <button 
                    onClick={() => setTreadmillActive(!treadmillActive)}
                    className={`font-mono text-[10px] px-2.5 py-1 rounded-md border flex items-center gap-1 transition-all ${
                      treadmillActive 
                        ? 'bg-red-500/10 text-red-500 border-red-500/20' 
                        : 'bg-[#CCFF00]/10 text-[#CCFF00] border-[#CCFF00]/20'
                    }`}
                  >
                    {treadmillActive ? <Pause className="w-2.5 h-2.5"/> : <Play className="w-2.5 h-2.5"/>}
                    <span>{treadmillActive ? 'PAUSE WORKOUT' : 'SIMULATE ACTIVE RUN'}</span>
                  </button>
                </div>
                
                <div className="grid grid-cols-3 gap-2 text-center">
                  <div className="bg-[#141414] rounded-lg p-2.5 border border-[#202020]">
                    <span className="text-[9px] font-mono text-[#9A9A9A] uppercase tracking-wider block">CADENCE PACE</span>
                    <span className="text-sm font-mono font-bold text-white text-glow">{treadmillSpeed.toFixed(1)} km/h</span>
                  </div>
                  <div className="bg-[#141414] rounded-lg p-2.5 border border-[#202020]">
                    <span className="text-[9px] font-mono text-[#9A9A9A] uppercase tracking-wider block">DISPLACEMENT</span>
                    <span className="text-sm font-mono font-bold text-white">{treadmillDistance.toFixed(2)} km</span>
                  </div>
                  <div className="bg-[#141414] rounded-lg p-2.5 border border-[#202020]">
                    <span className="text-[9px] font-mono text-[#9A9A9A] uppercase tracking-wider block">ELAPSED TIME</span>
                    <span className="text-sm font-mono font-bold text-white text-[#CCFF00]">{formatTime(treadmillTime)}</span>
                  </div>
                </div>
              </div>

            </div>

            <div className="mt-5 pt-4 border-t border-[#252525]/80 flex items-center justify-between text-xs text-[#9A9A9A] font-mono">
              <span>ACTIVE USER: G_COACH_STATION</span>
              <span>TOKEN SECURE</span>
            </div>
          </div>
        </div>

      </section>

      {/* Feature Grid Section (Bento-grid) */}
      <section id="features" className="py-16 sm:py-24 px-4 sm:px-6 border-t border-[#1C1C1C] bg-[#0A0A0A] relative z-10">
        <div className="max-w-7xl mx-auto">
          
          <div className="text-center md:text-left mb-16 md:flex md:items-end md:justify-between">
            <div className="max-w-xl">
              <span className="text-xs font-mono text-[#CCFF00] uppercase tracking-widest font-semibold block mb-2">BENTO COMPONENT SUITE</span>
              <h2 className="font-display font-bold text-3xl sm:text-4xl tracking-tight text-white mb-4">
                Designed for Biomechanical Sovereignty.
              </h2>
              <p className="text-[#9A9A9A] text-sm sm:text-base leading-relaxed">
                Take command of complex fueling guidelines and muscular overload cycles within a beautifully condensed responsive system structure.
              </p>
            </div>
            <div className="mt-6 md:mt-0 flex justify-center md:justify-start">
              <span className="text-xs font-mono text-[#9A9A9A] border border-[#252525] bg-[#141414] px-4 py-2 rounded-lg inline-flex items-center gap-2">
                <span className="w-1.5 h-1.5 bg-[#CCFF00] rounded-full"></span> Zero dependency on external cloud sync loops.
              </span>
            </div>
          </div>

          {/* Sleek Bento Grid: 3 columns/cards with distinct sizing */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
            
            {/* Bento Card 1: Interactive Caloric Budget Slider Panel (Grid Span-7) */}
            <div className="md:col-span-7 bg-[#141414] border border-[#252525] rounded-xl p-5 sm:p-8 flex flex-col justify-between transition-all hover:border-[#CCFF00]/40 group relative overflow-hidden">
              
              <div className="absolute top-0 right-0 w-36 h-36 bg-[#CCFF00]/5 rounded-full blur-3xl pointer-events-none group-hover:bg-[#CCFF00]/10 transition-colors"></div>

              <div>
                <div className="flex items-center space-x-2 text-glow mb-4">
                  <Apple className="w-5 h-5 text-[#CCFF00]" />
                  <span className="text-xs font-mono tracking-widest uppercase text-[#CCFF00]">Algorithmic Micro Fueling</span>
                </div>
                <h3 className="text-xl font-display font-medium text-white mb-2">High-Fidelity Macro Budgeting</h3>
                <p className="text-sm text-[#9A9A9A] leading-relaxed max-w-md mb-8">
                  Adjust custom nutrient margins using precision-response algorithms. Instantly forecast caloric outputs on continuous intake schedules.
                </p>
              </div>

              {/* Interactive sliders container */}
              <div className="bg-[#0D0D0D] border border-[#252525] rounded-lg p-4 sm:p-5 space-y-5">
                <div className="flex justify-between items-center border-b border-[#1A1A1A] pb-3">
                  <span className="text-xs font-mono text-[#9A9A9A] uppercase tracking-wider">Dynamic Total Formula</span>
                  <div className="text-right">
                    <span className="text-lg font-mono font-extrabold text-[#CCFF00]">{calorieBudget}</span>
                    <span className="text-[10px] font-mono text-[#9A9A9A] ml-1">KCAL / DAY</span>
                  </div>
                </div>

                {/* Protein Slider */}
                <div className="space-y-2">
                  <div className="flex justify-between text-xs font-mono">
                    <span className="text-[#CCFF00]">Protein (4 kcal/g)</span>
                    <span className="text-white font-medium">{protein} g</span>
                  </div>
                  <input 
                    type="range" 
                    min="100" 
                    max="300"
                    value={protein} 
                    onChange={(e) => setProtein(parseInt(e.target.value))}
                    className="w-full accent-[#CCFF00] bg-[#252525] h-1 rounded-lg cursor-pointer" 
                  />
                </div>

                {/* Carbs Slider */}
                <div className="space-y-2">
                  <div className="flex justify-between text-xs font-mono">
                    <span className="text-sky-400">Carbohydrates (4 kcal/g)</span>
                    <span className="text-white font-medium">{carbs} g</span>
                  </div>
                  <input 
                    type="range" 
                    min="100" 
                    max="500"
                    value={carbs} 
                    onChange={(e) => setCarbs(parseInt(e.target.value))}
                    className="w-full accent-sky-400 bg-[#252525] h-1 rounded-lg cursor-pointer" 
                  />
                </div>

                {/* Fats Slider */}
                <div className="space-y-2">
                  <div className="flex justify-between text-xs font-mono">
                    <span className="text-pink-400">Fats (9 kcal/g)</span>
                    <span className="text-white font-medium">{fats} g</span>
                  </div>
                  <input 
                    type="range" 
                    min="30" 
                    max="150"
                    value={fats} 
                    onChange={(e) => setFats(parseInt(e.target.value))}
                    className="w-full accent-pink-400 bg-[#252525] h-1 rounded-lg cursor-pointer" 
                  />
                </div>
              </div>
            </div>

            {/* Bento Card 2: Dynamic Workout Strength Logging (Grid Span-5) */}
            <div className="md:col-span-5 bg-[#141414] border border-[#252525] rounded-xl p-5 sm:p-8 flex flex-col justify-between transition-all hover:border-[#CCFF00]/40 group relative overflow-hidden">
              <div className="absolute top-0 right-0 w-36 h-36 bg-pink-500/5 rounded-full blur-3xl pointer-events-none"></div>
              
              <div>
                <div className="flex items-center space-x-2 text-glow mb-4">
                  <Dumbbell className="w-5 h-5 text-[#CCFF00]" />
                  <span className="text-xs font-mono tracking-widest uppercase text-[#9A9A9A]">Biomechanical Overload</span>
                </div>
                <h3 className="text-xl font-display font-medium text-white mb-2">Atheletic Workout Logging</h3>
                <p className="text-sm text-[#9A9A9A] leading-relaxed mb-6">
                  Log volume metrics, mechanical output levels, treadmill velocity bounds, and dynamic reps in real-time.
                </p>
              </div>

              {/* Workout Stat Mockup */}
              <div className="bg-[#0D0D0D] border border-[#252525] rounded-lg p-4 sm:p-5">
                <div className="font-mono text-[10px] text-zinc-500 mb-2">CURRENT SET TIMELINE</div>
                <div className="flex items-center justify-between border-b border-[#1A1A1A] pb-3 mb-3">
                  <div>
                    <span className="text-sm text-white font-bold block">Deadlift Series</span>
                    <span className="text-[10px] font-mono text-[#9A9A9A]">Target Level: 85% 1RM</span>
                  </div>
                  <div className="text-right">
                    <span className="text-xs font-mono font-bold text-[#CCFF00] block">180 kg</span>
                    <span className="text-[10px] font-mono text-[#9A9A9A]">4 Sets × 5 Reps</span>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono text-[#9A9A9A]">Volume Registered</span>
                  <span className="text-[#CCFF00] font-mono text-sm font-bold">3,600 kg</span>
                </div>

                <div className="mt-4 flex gap-1">
                  <span className="h-1.5 flex-1 bg-[#CCFF00] rounded-full"></span>
                  <span className="h-1.5 flex-1 bg-[#CCFF00] rounded-full"></span>
                  <span className="h-1.5 flex-1 bg-[#CCFF00] rounded-full"></span>
                  <span className="h-1.5 flex-1 bg-[#CCFF00] rounded-full"></span>
                  <span className="h-1.5 flex-1 bg-[#252525] rounded-full"></span>
                </div>
              </div>
            </div>

            {/* Bento Card 3: Biometric sync telemetry details (Span-5) */}
            <div className="md:col-span-5 bg-[#141414] border border-[#252525] rounded-xl p-5 sm:p-8 flex flex-col justify-between transition-all hover:border-[#CCFF00]/40 group relative overflow-hidden">
              <div className="absolute top-0 right-0 w-36 h-36 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none"></div>

              <div>
                <div className="flex items-center space-x-2 text-glow mb-4">
                  <Timer className="w-5 h-5 text-[#CCFF00]" />
                  <span className="text-xs font-mono tracking-widest uppercase text-[#9A9A9A]">Hardware Integration</span>
                </div>
                <h3 className="text-xl font-display font-medium text-white mb-2">Autonomous Biometric Sync</h3>
                <p className="text-sm text-[#9A9A9A] leading-relaxed mb-6">
                  Deploy low-overhead API bridges directly synchronized with standard Apple Watch or Garmin activity datasets.
                </p>
              </div>

              {/* Stat dashboard elements */}
              <div className="grid grid-cols-2 gap-2 sm:gap-3">
                <div className="bg-[#0D0D0D] border border-[#252525] rounded-lg p-2.5 sm:p-3">
                  <span className="text-[9px] font-mono text-zinc-500 uppercase block mb-1">HRV Base</span>
                  <span className="text-sm sm:text-base font-mono font-bold text-emerald-400">78ms</span>
                </div>
                <div className="bg-[#0D0D0D] border border-[#252525] rounded-lg p-2.5 sm:p-3">
                  <span className="text-[9px] font-mono text-zinc-500 uppercase block mb-1">Vo2 Max</span>
                  <span className="text-sm sm:text-base font-mono font-bold text-white">58.4</span>
                </div>
                <div className="bg-[#0D0D0D] border border-[#252525] rounded-lg p-2.5 sm:p-3">
                  <span className="text-[9px] font-mono text-zinc-500 uppercase block mb-1">Basal Metabolic</span>
                  <span className="text-sm sm:text-base font-mono font-bold text-[#CCFF00]">1,980 kcal</span>
                </div>
                <div className="bg-[#0D0D0D] border border-[#252525] rounded-lg p-2.5 sm:p-3">
                  <span className="text-[9px] font-mono text-zinc-500 uppercase block mb-1">Active Strain</span>
                  <span className="text-sm sm:text-base font-mono font-bold text-white">16.8 / 21</span>
                </div>
              </div>
            </div>

            {/* Bento Card 4: Interactive Kinetic Waveform Tracker (Span-7) */}
            <div className="md:col-span-7 bg-[#141414] border border-[#252525] rounded-xl p-5 sm:p-8 flex flex-col justify-between transition-all hover:border-[#CCFF00]/40 group relative overflow-hidden">
              <div className="absolute top-0 right-0 w-36 h-36 bg-[#CCFF00]/5 rounded-full blur-3xl pointer-events-none"></div>

              <div>
                <div className="flex items-center space-x-2 text-glow mb-4">
                  <Gauge className="w-5 h-5 text-[#CCFF00]" />
                  <span className="text-xs font-mono tracking-widest uppercase text-[#CCFF00]">Precision Engine telemetry</span>
                </div>
                <h3 className="text-xl font-display font-medium text-white mb-2">High-Frequency Telemetry Ingest</h3>
                <p className="text-sm text-[#9A9A9A] leading-relaxed max-w-md mb-6">
                  Aggregate telemetry data points without heavy frame drops. Track cellular glycogen reserves and dynamic muscular response ratios.
                </p>
              </div>

              {/* Graphic/Interactive block simulating telemetry stream */}
              <div className="bg-[#0D0D0D] border border-[#252525] rounded-lg p-3 sm:p-4 font-mono text-[10px] space-y-2">
                <div className="flex justify-between text-zinc-500 border-b border-[#1A1A1A] pb-2">
                  <span>METRIC PACKETS RECIEVED</span>
                  <span className="text-emerald-400">ONLINE</span>
                </div>
                <div className="space-y-1.5">
                  <div className="flex justify-between">
                    <span className="text-white">SYS_GLYCOGEN_STORES</span>
                    <span className="text-[#CCFF00]">92% / MAXIMUM SATURATION</span>
                  </div>
                  <div className="w-full bg-[#1A1A1A] h-1.5 rounded-full overflow-hidden">
                    <div className="w-[92%] bg-[#CCFF00] h-full"></div>
                  </div>
                </div>
                <div className="space-y-1.5 pt-1">
                  <div className="flex justify-between">
                    <span className="text-white">LACTATE_ACCUMULATION_EST</span>
                    <span className="text-amber-400">2.1 mmol/L</span>
                  </div>
                  <div className="w-full bg-[#1A1A1A] h-1.5 rounded-full overflow-hidden">
                    <div className="w-[45%] bg-amber-400 h-full"></div>
                  </div>
                </div>
                <div className="space-y-1.5 pt-1">
                  <div className="flex justify-between">
                    <span className="text-white">ATP_RE_SYNTH_RATIO</span>
                    <span className="text-sky-400">1.04v INDEXED ACCELERATION</span>
                  </div>
                  <div className="w-full bg-[#1A1A1A] h-1.5 rounded-full overflow-hidden">
                    <div className="w-[78%] bg-sky-400 h-full"></div>
                  </div>
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* Interactive SVG Element Section */}
      <section id="biometrics" className="py-16 sm:py-24 px-4 sm:px-6 border-t border-[#1C1C1C] relative z-10">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center gap-10 md:gap-16">
          <div className="flex-1 space-y-6 text-center md:text-left flex flex-col items-center md:items-start">
            <span className="text-xs font-mono text-[#CCFF00] bg-[#CCFF00]/10 border border-[#CCFF00]/20 rounded-full px-3 py-1 inline-block uppercase tracking-wider font-semibold">
              Kinetic Fuel Core
            </span>
            <h2 className="font-display font-medium text-3xl sm:text-4xl text-white tracking-tight">
              Physical Kinetic Energy Core Graphic
            </h2>
            <p className="text-[#9A9A9A] text-sm sm:text-base leading-relaxed max-w-xl">
              Hover over and interact with the physical vector graphic representation of kinetic magnetic motion. Built completely out of custom mathematical SVG patterns, simulating dynamic bio-energetic fields alignment.
            </p>
            <div className="space-y-3 font-mono text-xs text-[#9A9A9A] text-left">
              <div className="flex items-center gap-2">
                <Check className="w-4 h-4 text-[#CCFF00] shrink-0" />
                <span>Responsive trackpad coordinate alignment: X: {mousePos.x.toFixed(2)}, Y: {mousePos.y.toFixed(2)}</span>
              </div>
              <div className="flex items-center gap-2">
                <Check className="w-4 h-4 text-[#CCFF00] shrink-0" />
                <span>Visual acceleration changes proportional to alignment delta.</span>
              </div>
            </div>
          </div>

          {/* Interactive SVG Component Canvas */}
          <div className="flex-1 flex items-center justify-center w-full">
            <div 
              ref={turbineRef}
              onMouseMove={handleMouseMove}
              onMouseLeave={handleMouseLeave}
              className="relative w-full max-w-sm aspect-square bg-[#141414] border border-[#252525] rounded-xl p-4 sm:p-6 flex flex-col items-center justify-center group cursor-crosshair shadow-inner overflow-hidden"
            >
              {/* Radial gradient glow in background */}
              <div 
                className="absolute inset-0 bg-radial-gradient from-[#CCFF00]/10 to-transparent transition-opacity duration-300 pointer-events-none"
                style={{
                  background: `radial-gradient(circle at ${50 + mousePos.x * 30}% ${50 + mousePos.y * 30}%, rgba(204, 255, 0, 0.15) 0%, transparent 70%)`
                }}
              ></div>

              {/* Kinetic Vector Turbine Graphic inside SVG */}
              <svg 
                className="w-full max-w-[240px] aspect-square select-none pointer-events-none transition-transform duration-300 ease-out"
                viewBox="0 0 200 200"
                style={{
                  transform: `perspective(600px) rotateY(${mousePos.x * 20}deg) rotateX(${-mousePos.y * 20}deg)`
                }}
              >
                {/* Outer grid orbits */}
                <circle cx="100" cy="100" r="90" fill="none" stroke="#252525" strokeWidth="1" strokeDasharray="3 3" />
                <circle cx="100" cy="100" r="75" fill="none" stroke="#252525" strokeWidth="1.5" />
                <circle cx="100" cy="100" r="50" fill="none" stroke="#CCFF00" strokeWidth="0.5" strokeOpacity="0.3" strokeDasharray="5 5" />
                
                {/* Axis indicators */}
                <line x1="10" y1="100" x2="190" y2="100" stroke="#222" strokeWidth="1" />
                <line x1="100" y1="10" x2="100" y2="190" stroke="#222" strokeWidth="1" />

                {/* Kinetic turbine arms */}
                <g style={{ transformOrigin: '100px 100px', animation: `spin ${treadmillActive ? '2s' : '9s'} linear infinite` }}>
                  {/* Neon Lime kinetic blades */}
                  <path d="M 100,100 L 100,30 A 20,20 0 0,1 120,50 Z" fill="#CCFF00" fillOpacity="0.8" />
                  <path d="M 100,100 L 170,100 A 20,20 0 0,1 150,120 Z" fill="#CCFF00" fillOpacity="0.6" />
                  <path d="M 100,100 L 100,170 A 20,20 0 0,1 80,150 Z" fill="#CCFF00" fillOpacity="0.4" />
                  <path d="M 100,100 L 30,100 A 20,20 0 0,1 50,80 Z" fill="#CCFF00" fillOpacity="0.2" />

                  {/* Inner planetary dots */}
                  <circle cx="100" cy="50" r="4" fill="#CCFF00" />
                  <circle cx="150" cy="100" r="4" fill="#CCFF00" />
                  <circle cx="100" cy="150" r="4" fill="#CCFF00" />
                  <circle cx="50" cy="100" r="4" fill="#CCFF00" />
                </g>

                {/* Center glowing metabolic core hub */}
                <circle cx="100" cy="100" r="18" fill="#141414" stroke="#CCFF00" strokeWidth="2.5" />
                <circle cx="100" cy="100" r="10" fill="#CCFF00" className="animate-pulse" />

                {/* Coordinates tracking dots */}
                <circle cx={100 + mousePos.x * 75} cy={100 + mousePos.y * 75} r="5" fill="#FFF" stroke="#CCFF00" strokeWidth="1.5" />
                <line x1="100" y1="100" x2={100 + mousePos.x * 75} y2={100 + mousePos.y * 75} stroke="#CCFF00" strokeWidth="1.5" strokeDasharray="3 3" />
              </svg>

              <div className="absolute bottom-4 left-6 right-6 flex justify-between items-center text-[10px] font-mono text-[#9A9A9A] tracking-wider uppercase">
                <span>Core Turbine System</span>
                <span className="text-[#CCFF00]">{treadmillActive ? 'ACCELERATED SPEED' : 'IDLE INTENSITY'}</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* PRICING AND SOCIAL PROOF SECTION */}
      <section id="pricing" className="py-16 sm:py-24 px-4 sm:px-6 border-t border-[#1C1C1C] bg-[#0A0A0A] relative z-10">
        <div className="max-w-7xl mx-auto">
          
          <div className="text-center max-w-xl mx-auto mb-16">
            <span className="text-xs font-mono text-[#CCFF00] uppercase tracking-widest block mb-2">SYNDICATE ENROLLMENT</span>
            <h2 className="font-display font-medium text-3xl sm:text-4xl text-white tracking-tight">
              Simple Pricing. Custom Syndicate Licensing.
            </h2>
            <p className="text-[#9A9A9A] text-sm sm:text-base leading-relaxed mt-4">
              Unlock total biometric indexing capabilities. Choose a telemetry tier tuned to your mechanical output.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
            
            {/* Pricing Card 1 */}
            <div className="bg-[#141414] border border-[#252525] rounded-xl p-5 sm:p-8 flex flex-col justify-between transition-all hover:border-[#252525]/80 relative group">
              <div>
                <span className="font-mono text-xs uppercase tracking-widest text-[#9A9A9A] block mb-2">STARTING LEVEL</span>
                <h3 className="font-display font-bold text-2xl text-white mb-2">Athletic Basic</h3>
                <p className="text-[#9A9A9A] text-xs leading-relaxed mb-6">Simple standard metric telemetry logs with low history depth indexing features.</p>
                
                <div className="flex items-baseline mb-6 font-mono">
                  <span className="text-3xl font-extrabold text-[#CCFF00]">$0</span>
                  <span className="text-sm text-zinc-500 ml-1">/ PERPETUAL LICENSE</span>
                </div>

                <div className="space-y-3.5 text-xs text-[#BFBFBF]">
                  <div className="flex items-center gap-2.5">
                    <Check className="w-4 h-4 text-[#CCFF00]" />
                    <span>7-Day Workout Logs history</span>
                  </div>
                  <div className="flex items-center gap-2.5">
                    <Check className="w-4 h-4 text-[#CCFF00]" />
                    <span>Caloric & macro threshold slider access</span>
                  </div>
                  <div className="flex items-center gap-2.5">
                    <Check className="w-4 h-4 text-[#CCFF00]" />
                    <span>Standard single device export mode</span>
                  </div>
                </div>
              </div>

              <div className="mt-8">
                <button 
                  onClick={onLaunchAdmin}
                  className="w-full py-3 px-4 rounded-lg bg-[#202020] hover:bg-[#2A2A2A] text-white text-xs font-semibold font-mono tracking-wider transition-all"
                >
                  INITIALIZE ATHLETE APP
                </button>
              </div>
            </div>

            {/* Pricing Card 2 - Active Premium Selection */}
            <div className="bg-[#141414] border-2 border-[#CCFF00] rounded-xl p-5 sm:p-8 flex flex-col justify-between transition-all relative group neon-glow">
              <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-[#CCFF00] text-black font-mono text-[9px] font-bold tracking-widest uppercase px-3 py-1 rounded-full shadow-lg">
                MOST ACTIVE CHOICE
              </div>

              <div>
                <span className="font-mono text-xs uppercase tracking-widest text-[#CCFF00] block mb-2">HIGH PERFORMANCE NETWORK</span>
                <h3 className="font-display font-bold text-2xl text-white mb-2">MacroFlux Elite</h3>
                <p className="text-[#9A9A9A] text-xs leading-relaxed mb-6">Unrestricted telemetry streams, biochemical analytics, high-frequency synchronization bridges.</p>
                
                <div className="flex items-baseline mb-6 font-mono">
                  <span className="text-3xl font-extrabold text-[#CCFF00]">$29</span>
                  <span className="text-sm text-zinc-500 ml-1">/ MONTHLY COMMITTED</span>
                </div>

                <div className="space-y-3.5 text-xs text-[#BFBFBF]">
                  <div className="flex items-center gap-2.5">
                    <Check className="w-4 h-4 text-[#CCFF00]" />
                    <span>Infinite telemetry storage depth</span>
                  </div>
                  <div className="flex items-center gap-2.5">
                    <Check className="w-4 h-4 text-[#CCFF00]" />
                    <span>Real-time glycogen projection charts</span>
                  </div>
                  <div className="flex items-center gap-2.5">
                    <Check className="w-4 h-4 text-[#CCFF00]" />
                    <span>Low-overhead smartwatch sync daemon</span>
                  </div>
                  <div className="flex items-center gap-2.5">
                    <Check className="w-4 h-4 text-[#CCFF00]" />
                    <span>Integrated coach administrative dashboards</span>
                  </div>
                </div>
              </div>

              <div className="mt-8">
                <button 
                  onClick={onLaunchAdmin}
                  className="w-full py-3 px-4 rounded-lg bg-[#CCFF00] hover:brightness-110 text-black text-xs font-bold font-display tracking-wider transition-all"
                >
                  DEPLOY WORKSPACE SUITE
                </button>
              </div>
            </div>

            {/* Pricing Card 3 */}
            <div className="bg-[#141414] border border-[#252525] rounded-xl p-5 sm:p-8 flex flex-col justify-between transition-all hover:border-[#252525]/80 relative group">
              <div>
                <span className="font-mono text-xs uppercase tracking-widest text-[#9A9A9A] block mb-2">HIGH-TIER PLATFORMS</span>
                <h3 className="font-display font-bold text-2xl text-white mb-2">Syndicate Custom</h3>
                <p className="text-[#9A9A9A] text-xs leading-relaxed mb-6">Designed directly for teams, athletic gyms, and high-tier medical metabolic workspaces.</p>
                
                <div className="flex items-baseline mb-6 font-mono">
                  <span className="text-3xl font-extrabold text-[#CCFF00]">Custom</span>
                  <span className="text-sm text-zinc-500 ml-1">/ SLA SYNDICATE</span>
                </div>

                <div className="space-y-3.5 text-xs text-[#BFBFBF]">
                  <div className="flex items-center gap-2.5">
                    <Check className="w-4 h-4 text-[#CCFF00]" />
                    <span>Bulk athlete provisioning limits</span>
                  </div>
                  <div className="flex items-center gap-2.5">
                    <Check className="w-4 h-4 text-[#CCFF00]" />
                    <span>Direct GCP infrastructure provisioning options</span>
                  </div>
                  <div className="flex items-center gap-2.5">
                    <Check className="w-4 h-4 text-[#CCFF00]" />
                    <span>Custom client whitelabel apps</span>
                  </div>
                </div>
              </div>

              <div className="mt-8">
                <button 
                  onClick={onLaunchAdmin}
                  className="w-full py-3 px-4 rounded-lg bg-[#202020] hover:bg-[#2A2A2A] text-white text-xs font-semibold font-mono tracking-wider transition-all"
                >
                  CONTACT INTEGRATION REP
                </button>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* Styled conversion footer */}
      <footer className="border-t border-[#1C1C1C] py-12 px-4 sm:px-6 bg-[#0D0D0D]">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between text-xs text-[#9A9A9A] font-mono gap-6">
          <div className="flex items-center gap-6">
            <div className="flex items-center space-x-1">
              <span className="text-white font-bold">MacroFlux</span>
              <span className="text-[#CCFF00]">Performance</span>
            </div>
            <span>© 2026 MacroFlux Corp.</span>
          </div>
          <div className="flex items-center space-x-6">
            <span className="hover:text-white cursor-pointer transition-colors" onClick={onLaunchAdmin}>System Status Admin Portal</span>
            <span>Uptime: 99.98%</span>
            <span>Region: us-east1-gcp</span>
          </div>
        </div>
      </footer>

      {/* CSS Spin Keyframes utility code */}
      <style>{`
        @keyframes spin {
          from {
            transform: rotate(0deg);
          }
          to {
            transform: rotate(360deg);
          }
        }
      `}</style>
    </div>
  );
}
