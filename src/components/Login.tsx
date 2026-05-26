import React, { useState } from 'react';
import { supabase } from '../supabaseClient';
import { ArrowLeft, Lock, Loader2 } from 'lucide-react';

interface LoginProps {
  onBack: () => void;
  onSuccess: () => void;
}

export function Login({ onBack, onSuccess }: LoginProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    
    // First clear any existing sessions securely
    await supabase.auth.signOut();

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setError(error.message);
      setIsLoading(false);
    } else {
      setIsLoading(false);
      onSuccess();
    }
  };

  return (
    <div className="bg-[#0D0D0D] min-h-screen text-white font-sans flex flex-col items-center justify-center p-6 selection:bg-[#CCFF00] selection:text-black relative">
      <button 
        onClick={onBack}
        className="absolute top-8 left-8 flex items-center gap-2 text-zinc-500 hover:text-white transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        <span className="text-xs font-mono uppercase tracking-wider font-bold">Back to Landing</span>
      </button>

      <div className="w-full max-w-sm bg-[#141414] border border-[#252525] rounded-xl p-8 relative overflow-hidden">
        <div className="flex flex-col items-center mb-8">
          <div className="w-12 h-12 rounded-lg bg-gradient-to-tr from-black to-[#202020] border border-[#CCFF00]/50 flex items-center justify-center p-2 mb-4">
            <span className="text-[#CCFF00] font-black font-mono text-lg">MF</span>
          </div>
          <h2 className="font-display font-semibold text-2xl tracking-tight text-white">System Gateway</h2>
          <p className="text-zinc-500 text-xs mt-1 font-mono uppercase tracking-widest text-center">Authorized Access Only</p>
        </div>

        {error && (
          <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-xs p-3 rounded mb-6 font-mono text-center">
            {error}
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="text-[#9A9A9A] text-[10px] uppercase font-mono tracking-widest block mb-2">Clearance Credentials</label>
            <input 
              type="email" 
              placeholder="admin@macroflux.com"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-[#0A0A0A] border border-zinc-800 focus:border-[#CCFF00] p-3 rounded-lg text-white outline-none font-mono text-sm transition-colors"
            />
          </div>

          <div>
            <label className="text-[#9A9A9A] text-[10px] uppercase font-mono tracking-widest block mb-2">Access Key</label>
            <input 
              type="password" 
              placeholder="••••••••"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-[#0A0A0A] border border-zinc-800 focus:border-[#CCFF00] p-3 rounded-lg text-white outline-none font-mono text-sm transition-colors"
            />
          </div>

          <button 
            type="submit"
            disabled={isLoading}
            className="w-full bg-[#CCFF00] hover:bg-[#b3ff00] text-black font-bold font-display uppercase tracking-wider py-3 px-4 rounded-lg flex items-center justify-center transition-all disabled:opacity-50 mt-4 group"
          >
            {isLoading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <>
                <Lock className="w-4 h-4 mr-2 group-hover:scale-110 transition-transform" />
                Authenticate
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
