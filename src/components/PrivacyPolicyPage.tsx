// import React from 'react';
// import { Shield, Lock, FileText, ChevronLeft, Check } from 'lucide-react';

// const PrivacyPolicyPage: React.FC = () => {
//   return (
//     <div className="min-h-screen bg-[#0D0D0D] text-[#9A9A9A] font-sans selection:bg-[#CCFF00] selection:text-black hover:cursor-default">
//       {/* Header Navigation */}
//       <header className="sticky top-0 z-50 bg-[#141414]/90 backdrop-blur-md border-b border-[#252525]">
//         <div className="max-w-4xl mx-auto px-6 h-16 flex items-center justify-between">
//           <a 
//             href="/" 
//             className="flex items-center gap-2 text-white hover:text-[#CCFF00] transition-colors duration-200"
//             aria-label="Back to Home"
//           >
//             <ChevronLeft className="w-5 h-5" />
//             <span className="font-medium">Back to Home</span>
//           </a>
//           <div className="text-white font-bold tracking-widest uppercase text-xl">
//             Macro<span className="text-[#CCFF00]">Flux</span>
//           </div>
//         </div>
//       </header>

//       {/* Main Content */}
//       <main className="max-w-4xl mx-auto px-4 sm:px-6 py-12 md:py-16">
//         <article className="bg-[#141414] rounded-2xl border border-[#252525] p-6 sm:p-10 md:p-14 shadow-2xl">
          
//           {/* Page Title */}
//           <div className="flex items-start sm:items-center gap-5 mb-10 sm:mb-12 flex-col sm:flex-row">
//             <div className="p-4 bg-[#CCFF00]/10 rounded-xl border border-[#CCFF00]/20 shrink-0">
//               <Shield className="w-10 h-10 text-[#CCFF00]" />
//             </div>
//             <div>
//               <h1 className="text-3xl md:text-5xl font-extrabold text-white mb-2">Privacy Policy</h1>
//               <p className="text-sm font-medium tracking-wide text-[#9A9A9A]">EFFECTIVE DATE: MAY 29, 2026</p>
//             </div>
//           </div>

//           <hr className="border-[#1C1C1C] my-10" />

//           {/* Introduction Section */}
//           <section className="mb-12">
//             <div className="flex items-center gap-3 mb-6">
//               <FileText className="w-7 h-7 text-[#CCFF00]" />
//               <h2 className="text-2xl md:text-3xl font-bold text-white">Introduction</h2>
//             </div>
//             <p className="leading-loose text-lg mb-6">
//               Welcome to MacroFlux. We respect your privacy and are unyieldingly committed to protecting your personal data. 
//               MacroFlux operates as a local performance tracking workspace, meticulously engineered for athletes who demand 
//               absolute control over their Total Training Volume, sets, reps, and custom notes.
//             </p>
//             <p className="leading-loose text-lg">
//               This Privacy Policy details how your personal information and fitness metrics are collected, used, and safeguarded. 
//               By engaging with our platform, you trust us with your data, and we do not take that responsibility lightly.
//             </p>
//           </section>

//           <hr className="border-[#1C1C1C] my-10" />

//           {/* Data Collection & Usage Section */}
//           <section className="mb-12">
//             <div className="flex items-center gap-3 mb-6">
//               <Lock className="w-7 h-7 text-[#CCFF00]" />
//               <h2 className="text-2xl md:text-3xl font-bold text-white">Data Collection and Usage</h2>
//             </div>
//             <p className="leading-loose text-lg mb-8">
//               Transparency is paramount to our operational philosophy. We employ rigid data-minimization practices—meaning we only 
//               process information that is fundamentally necessary to power your tracking experience. We will never compromise your digital privacy.
//             </p>
            
//             <div className="space-y-6">
//               <div className="flex items-start gap-4 bg-[#0D0D0D] p-6 rounded-xl border border-[#252525]">
//                 <Check className="w-6 h-6 text-[#CCFF00] mt-1 shrink-0" />
//                 <div>
//                   <h3 className="text-xl font-bold text-white mb-2">Secure Metadata Handling</h3>
//                   <p className="leading-relaxed">
//                     All workout session metadata is handled securely via our dedicated database pipeline featuring Supabase integration. 
//                     Your logged workouts, progress metrics, and individualized performance notes are fully authenticated and protected in transit and at rest.
//                   </p>
//                 </div>
//               </div>

//               <div className="flex items-start gap-4 bg-[#0D0D0D] p-6 rounded-xl border border-[#252525]">
//                 <Check className="w-6 h-6 text-[#CCFF00] mt-1 shrink-0" />
//                 <div>
//                   <h3 className="text-xl font-bold text-white mb-2">Zero Tracking or Monetization</h3>
//                   <p className="leading-relaxed">
//                     We do not display advertisements. We do not utilize intrusive tracking scripts or pixel trackers. Most importantly, 
//                     we do not sell or distribute biometrics metrics to third-party ad networks, data brokers, or marketing partners. 
//                     Your fitness journey is yours alone.
//                   </p>
//                 </div>
//               </div>
//             </div>
//           </section>

//           <hr className="border-[#1C1C1C] my-10" />

//           {/* Age Demographics Section */}
//           <section className="mb-12">
//             <h2 className="text-2xl md:text-3xl font-bold text-white mb-6">Age Groups and Children's Privacy</h2>
//             <p className="leading-loose text-lg mb-6">
//               MacroFlux is a sophisticated training ecosystem deliberately built and intended for adult athletes and gym-goers. 
//               Our application distinctly targets users who are 18 and older. 
//             </p>
//             <p className="leading-loose text-lg">
//               We emphatically do not knowingly collect, maintain, or request information from children. If we discover that an individual under the age of 18 
//               has bypassed our registration terms and provided personal or biometric data, we will immediately initiate a complete hard-deletion of 
//               their information from our database infrastructure.
//             </p>
//           </section>

//           <hr className="border-[#1C1C1C] my-10" />

//           {/* Contact & Modifications Section */}
//           <section>
//             <h2 className="text-2xl md:text-3xl font-bold text-white mb-6">Policy Modifications</h2>
//             <p className="leading-loose text-lg mb-6">
//               We reserve the right to continually review and update this Privacy Policy. Any substantial operational changes to how we 
//               leverage our Supabase pipeline or protect your metadata will be accompanied by a prominent in-app notification. 
//             </p>
//             <p className="leading-loose text-lg">
//               Continued utilization of the MacroFlux tracking workspace post-update constitutes a deliberate agreement to our modernized privacy frameworks.
//             </p>
//           </section>
//         </article>
//       </main>

//       {/* Footer */}
//       <footer className="py-10 text-center text-sm border-t border-[#252525] bg-[#0D0D0D] mt-8">
//         <p className="text-[#555555] font-medium tracking-wide">
//           &copy; {new Date().getFullYear()} MACROFLUX &mdash; PERFORMANCE TRACKING WORKSPACE. ALL RIGHTS RESERVED.
//         </p>
//       </footer>
//     </div>
//   );
// };

// export default PrivacyPolicyPage;





























import React, { useState, useEffect } from 'react';
import { Shield, Lock, FileText, ChevronLeft, Check, Eye, Users, RefreshCw } from 'lucide-react';

const PrivacyPolicyPage: React.FC = () => {
  const [scrolled, setScrolled] = useState(false);
  const [activeSection, setActiveSection] = useState(0);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const sections = [
    { id: 'introduction', label: 'Introduction' },
    { id: 'data', label: 'Data Usage' },
    { id: 'age', label: 'Age Policy' },
    { id: 'modifications', label: 'Modifications' },
  ];

  return (
    <div className="min-h-screen bg-[#0A0A0A] text-[#888] font-sans selection:bg-[#CCFF00] selection:text-black"
      style={{ fontFamily: "'DM Sans', system-ui, sans-serif" }}>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600;700&family=Bebas+Neue&display=swap');

        .noise-bg::before {
          content: '';
          position: fixed;
          inset: 0;
          background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='0.03'/%3E%3C/svg%3E");
          pointer-events: none;
          z-index: 0;
          opacity: 0.4;
        }

        .glow-line {
          background: linear-gradient(90deg, transparent, #CCFF00, transparent);
          height: 1px;
          opacity: 0.3;
        }

        .section-card {
          position: relative;
          overflow: hidden;
          transition: border-color 0.3s ease;
        }
        .section-card::before {
          content: '';
          position: absolute;
          top: 0; left: 0;
          width: 3px; height: 100%;
          background: #CCFF00;
          opacity: 0;
          transition: opacity 0.3s ease;
        }
        .section-card:hover::before {
          opacity: 1;
        }
        .section-card:hover {
          border-color: #2A2A2A !important;
        }

        .tag-pill {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          background: rgba(204, 255, 0, 0.07);
          border: 1px solid rgba(204, 255, 0, 0.15);
          color: #CCFF00;
          font-size: 11px;
          font-weight: 600;
          letter-spacing: 0.08em;
          padding: 4px 10px;
          border-radius: 999px;
        }

        .nav-dot {
          width: 6px; height: 6px;
          border-radius: 50%;
          background: #333;
          transition: all 0.3s ease;
          cursor: pointer;
        }
        .nav-dot.active {
          background: #CCFF00;
          width: 20px;
          border-radius: 3px;
        }

        .hero-number {
          font-family: 'Bebas Neue', sans-serif;
          font-size: clamp(80px, 15vw, 160px);
          line-height: 0.85;
          color: rgba(204, 255, 0, 0.04);
          position: absolute;
          right: -10px;
          top: -20px;
          pointer-events: none;
          user-select: none;
          letter-spacing: -2px;
        }

        .check-item {
          display: flex;
          gap: 14px;
          align-items: flex-start;
          padding: 18px 20px;
          background: #0D0D0D;
          border-radius: 12px;
          border: 1px solid #1A1A1A;
          transition: border-color 0.2s;
        }
        .check-item:hover { border-color: #2A2A2A; }

        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(16px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .fade-up { animation: fadeUp 0.5s ease forwards; }
        .fade-up-1 { animation-delay: 0.05s; opacity: 0; }
        .fade-up-2 { animation-delay: 0.12s; opacity: 0; }
        .fade-up-3 { animation-delay: 0.19s; opacity: 0; }
        .fade-up-4 { animation-delay: 0.26s; opacity: 0; }

        hr.styled {
          border: none;
          height: 1px;
          background: linear-gradient(90deg, transparent, #1E1E1E 20%, #1E1E1E 80%, transparent);
          margin: 40px 0;
        }
      `}</style>

      <div className="noise-bg" />

      {/* Sticky Header */}
      <header className={`sticky top-0 z-50 transition-all duration-300 ${scrolled ? 'bg-[#0A0A0A]/95 backdrop-blur-lg border-b border-[#181818]' : 'bg-transparent'}`}>
        <div className="max-w-5xl mx-auto px-6 h-16 flex items-center justify-between">
          <a
            href="/"
            className="flex items-center gap-2 text-[#555] hover:text-white transition-colors duration-200 text-sm font-medium group"
          >
            <ChevronLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
            Back
          </a>

          <div style={{ fontFamily: "'Bebas Neue', sans-serif" }} className="text-white tracking-widest text-xl">
            MACRO<span className="text-[#CCFF00]">FLUX</span>
          </div>

          <div className="flex items-center gap-2">
            {sections.map((s, i) => (
              <div key={i} className={`nav-dot ${activeSection === i ? 'active' : ''}`}
                onClick={() => {
                  document.getElementById(s.id)?.scrollIntoView({ behavior: 'smooth' });
                  setActiveSection(i);
                }} />
            ))}
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-14 md:py-20 relative z-10">

        {/* Hero Block */}
        <div className="fade-up fade-up-1 mb-16">
          <div className="relative bg-[#111] rounded-2xl border border-[#1C1C1C] p-8 sm:p-12 overflow-hidden">
            <div className="hero-number">PRIV</div>

            <div className="flex flex-col sm:flex-row sm:items-center gap-6 mb-8">
              <div className="w-14 h-14 rounded-xl bg-[#CCFF00]/10 border border-[#CCFF00]/20 flex items-center justify-center shrink-0">
                <Shield className="w-7 h-7 text-[#CCFF00]" />
              </div>
              <div>
                <div className="flex items-center gap-3 mb-2 flex-wrap">
                  <h1 style={{ fontFamily: "'Bebas Neue', sans-serif", letterSpacing: '0.04em' }}
                    className="text-4xl md:text-6xl text-white leading-none">
                    PRIVACY POLICY
                  </h1>
                  <span className="tag-pill">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#CCFF00] animate-pulse" />
                    LIVE DOC
                  </span>
                </div>
                <p className="text-xs tracking-[0.15em] text-[#444] font-medium uppercase">
                  Effective Date — May 29, 2026
                </p>
              </div>
            </div>

            <div className="glow-line mb-8" />

            <p className="text-[#666] text-base leading-relaxed max-w-2xl">
              We built MacroFlux for athletes who value control — over their training, their data, and their privacy.
              This document tells you exactly what we collect, why, and what we will never do with it.
            </p>

            {/* Stat strip */}
            <div className="grid grid-cols-3 gap-3 mt-8">
              {[
                { label: 'Ads Served', value: '0' },
                { label: 'Data Sold', value: '0' },
                { label: 'Trackers', value: '0' },
              ].map((item, i) => (
                <div key={i} className="bg-[#0D0D0D] border border-[#1A1A1A] rounded-xl p-4 text-center">
                  <div style={{ fontFamily: "'Bebas Neue', sans-serif" }}
                    className="text-3xl md:text-4xl text-[#CCFF00] leading-none mb-1">{item.value}</div>
                  <div className="text-[10px] uppercase tracking-widest text-[#444] font-semibold">{item.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Section: Introduction */}
        <section id="introduction" className="fade-up fade-up-2 mb-10 scroll-mt-24">
          <div className="section-card bg-[#111] rounded-2xl border border-[#1C1C1C] p-8 sm:p-10">
            <div className="relative">
              <div className="hero-number" style={{ fontSize: 'clamp(60px,10vw,120px)', top: -10 }}>01</div>
              <div className="flex items-center gap-3 mb-6">
                <FileText className="w-5 h-5 text-[#CCFF00]" />
                <span className="text-[10px] tracking-[0.2em] text-[#CCFF00] font-bold uppercase">Introduction</span>
              </div>
              <h2 className="text-2xl md:text-3xl font-bold text-white mb-6 leading-tight">
                What MacroFlux Is — and Isn't
              </h2>
            </div>

            <hr className="styled" />

            <div className="space-y-4 text-[15px] leading-loose">
              <p>
                MacroFlux is a local performance tracking workspace engineered for athletes who demand absolute control over their
                Total Training Volume, sets, reps, macro intake, and custom training notes.
              </p>
              <p>
                This Privacy Policy details how your personal information and fitness metrics are collected, used, and protected.
                By using our platform, you place your trust in us — and we do not take that lightly.
              </p>
            </div>
          </div>
        </section>

        {/* Section: Data Collection */}
        <section id="data" className="fade-up fade-up-3 mb-10 scroll-mt-24">
          <div className="section-card bg-[#111] rounded-2xl border border-[#1C1C1C] p-8 sm:p-10">
            <div className="relative">
              <div className="hero-number" style={{ fontSize: 'clamp(60px,10vw,120px)', top: -10 }}>02</div>
              <div className="flex items-center gap-3 mb-6">
                <Lock className="w-5 h-5 text-[#CCFF00]" />
                <span className="text-[10px] tracking-[0.2em] text-[#CCFF00] font-bold uppercase">Data Collection & Usage</span>
              </div>
              <h2 className="text-2xl md:text-3xl font-bold text-white mb-3 leading-tight">
                Minimum Data. Maximum Respect.
              </h2>
              <p className="text-[15px] leading-relaxed mb-8">
                We employ rigid data-minimisation practices — we only process information fundamentally necessary to power your tracking experience.
              </p>
            </div>

            <div className="space-y-3">
              <div className="check-item">
                <div className="w-8 h-8 rounded-lg bg-[#CCFF00]/10 flex items-center justify-center shrink-0 mt-0.5">
                  <Check className="w-4 h-4 text-[#CCFF00]" />
                </div>
                <div>
                  <h3 className="text-white font-semibold text-base mb-1">Secure Metadata Handling</h3>
                  <p className="text-[14px] leading-relaxed">
                    All workout session metadata is handled securely via Supabase. Your logged workouts, progress metrics, and performance
                    notes are fully authenticated and encrypted in transit and at rest.
                  </p>
                </div>
              </div>

              <div className="check-item">
                <div className="w-8 h-8 rounded-lg bg-[#CCFF00]/10 flex items-center justify-center shrink-0 mt-0.5">
                  <Eye className="w-4 h-4 text-[#CCFF00]" />
                </div>
                <div>
                  <h3 className="text-white font-semibold text-base mb-1">Zero Tracking or Monetisation</h3>
                  <p className="text-[14px] leading-relaxed">
                    No advertisements. No tracking scripts. No pixel trackers. We do not sell or share biometric data with third-party
                    ad networks, data brokers, or marketing partners. Your fitness journey belongs to you alone.
                  </p>
                </div>
              </div>

              <div className="check-item">
                <div className="w-8 h-8 rounded-lg bg-[#CCFF00]/10 flex items-center justify-center shrink-0 mt-0.5">
                  <Lock className="w-4 h-4 text-[#CCFF00]" />
                </div>
                <div>
                  <h3 className="text-white font-semibold text-base mb-1">Data You Control</h3>
                  <p className="text-[14px] leading-relaxed">
                    You may request deletion of your account and all associated data at any time by contacting our support team.
                    We will process deletion requests within 30 days.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Section: Age Policy */}
        <section id="age" className="fade-up fade-up-3 mb-10 scroll-mt-24">
          <div className="section-card bg-[#111] rounded-2xl border border-[#1C1C1C] p-8 sm:p-10">
            <div className="relative">
              <div className="hero-number" style={{ fontSize: 'clamp(60px,10vw,120px)', top: -10 }}>03</div>
              <div className="flex items-center gap-3 mb-6">
                <Users className="w-5 h-5 text-[#CCFF00]" />
                <span className="text-[10px] tracking-[0.2em] text-[#CCFF00] font-bold uppercase">Age Groups</span>
              </div>
              <h2 className="text-2xl md:text-3xl font-bold text-white mb-3 leading-tight">
                Built for Adults. Period.
              </h2>
            </div>

            <hr className="styled" />

            <div className="space-y-4 text-[15px] leading-loose">
              <p>
                MacroFlux is a training ecosystem built and intended exclusively for users 18 years and older.
              </p>
              <p>
                We do not knowingly collect, maintain, or request information from anyone under 18. If we discover that a minor has
                provided personal or biometric data, we will immediately initiate a complete hard-deletion of their information from
                all of our infrastructure.
              </p>
            </div>

            <div className="mt-6 flex items-center gap-3 bg-[#0D0D0D] border border-[#1E1E1E] rounded-xl px-5 py-4">
              <div className="w-2 h-2 rounded-full bg-[#CCFF00]" />
              <p className="text-sm text-[#666]">
                To report a suspected underage account, email{' '}
                <a href="mailto:marcoflux.support@gmail.com" className="text-[#CCFF00] hover:underline">
                  marcoflux.support@gmail.com
                </a>
              </p>
            </div>
          </div>
        </section>

        {/* Section: Modifications */}
        <section id="modifications" className="fade-up fade-up-4 mb-10 scroll-mt-24">
          <div className="section-card bg-[#111] rounded-2xl border border-[#1C1C1C] p-8 sm:p-10">
            <div className="relative">
              <div className="hero-number" style={{ fontSize: 'clamp(60px,10vw,120px)', top: -10 }}>04</div>
              <div className="flex items-center gap-3 mb-6">
                <RefreshCw className="w-5 h-5 text-[#CCFF00]" />
                <span className="text-[10px] tracking-[0.2em] text-[#CCFF00] font-bold uppercase">Policy Modifications</span>
              </div>
              <h2 className="text-2xl md:text-3xl font-bold text-white mb-3 leading-tight">
                We'll Tell You When Things Change
              </h2>
            </div>

            <hr className="styled" />

            <div className="space-y-4 text-[15px] leading-loose">
              <p>
                We reserve the right to review and update this Privacy Policy. Any substantial changes to how we handle your data
                will be accompanied by a prominent in-app notification.
              </p>
              <p>
                Continued use of MacroFlux after an update constitutes acceptance of the revised policy.
              </p>
            </div>
          </div>
        </section>

        {/* Contact CTA */}
        <div className="fade-up fade-up-4 mt-4">
          <div className="bg-[#CCFF00]/5 border border-[#CCFF00]/15 rounded-2xl p-8 flex flex-col sm:flex-row sm:items-center justify-between gap-6">
            <div>
              <h3 className="text-white font-bold text-lg mb-1">Questions about your data?</h3>
              <p className="text-[14px] text-[#666]">We respond to all privacy inquiries within 48 hours.</p>
            </div>
            <a
              href="mailto:marcoflux.support@gmail.com"
              className="shrink-0 bg-[#CCFF00] text-black font-bold text-sm px-6 py-3 rounded-xl hover:bg-white transition-colors duration-200 text-center"
            >
              Contact Us
            </a>
          </div>
        </div>

      </main>

      {/* Footer */}
      <footer className="relative z-10 mt-16 border-t border-[#141414] bg-[#0A0A0A] py-10">
        <div className="max-w-5xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div style={{ fontFamily: "'Bebas Neue', sans-serif" }} className="text-[#333] tracking-widest text-lg">
            MACRO<span className="text-[#CCFF00]/40">FLUX</span>
          </div>
          <p className="text-[#333] text-xs font-medium tracking-wide text-center">
            &copy; {new Date().getFullYear()} MACROFLUX — ALL RIGHTS RESERVED.
          </p>
          <a href="/" className="text-[#333] text-xs hover:text-[#CCFF00] transition-colors">
            Back to Home →
          </a>
        </div>
      </footer>
    </div>
  );
};

export default PrivacyPolicyPage;