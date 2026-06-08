'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      if (data.user) {
        // Success! Redirect to the admin dashboard
        router.push('/admin');
      }
    } catch (err) {
      setError(err.message || "Failed to log in.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] flex justify-center items-center p-6 antialiased">
      <motion.div 
        initial={{ opacity: 0, y: 20 }} 
        animate={{ opacity: 1, y: 0 }} 
        className="w-full max-w-[400px] bg-[#F8F7F4] rounded-[32px] p-8 shadow-[0_20px_80px_-15px_rgba(255,255,255,0.1)]"
      >
        <div className="mb-8 text-center">
          <h2 className="text-[10px] font-bold tracking-widest text-neutral-400 uppercase mb-2">MenuHub</h2>
          <h1 className="text-2xl font-bold tracking-tight text-[#111814]">Admin Login</h1>
        </div>

        {error && (
          <div className="mb-6 bg-red-50 text-red-600 text-[12px] font-bold p-3 rounded-xl border border-red-100 flex items-center gap-2">
            <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            {error}
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-6">
          <div>
            <label className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest block mb-2">Email Address</label>
            <input 
              type="email" 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="admin@cafename.com" 
              className="w-full pb-2 border-b border-neutral-300 text-[15px] font-medium text-black focus:outline-none focus:border-black rounded-none bg-transparent transition-colors"
              required
            />
          </div>

          <div>
            <label className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest block mb-2">Password</label>
            <input 
              type="password" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••" 
              className="w-full pb-2 border-b border-neutral-300 text-[15px] font-medium text-black focus:outline-none focus:border-black rounded-none bg-transparent transition-colors"
              required
            />
          </div>

          <button 
            type="submit" 
            disabled={isLoading}
            className="w-full py-4 rounded-2xl font-bold text-[13px] tracking-wider uppercase text-white bg-[#111814] hover:bg-neutral-800 transition-colors disabled:opacity-70 flex justify-center items-center"
          >
            {isLoading ? (
              <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: "linear" }} className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full" />
            ) : (
              "Sign In"
            )}
          </button>
        </form>
      </motion.div>
    </div>
  );
}