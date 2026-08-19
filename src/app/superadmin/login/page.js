'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { verifySuperAdminLogin } from '@/app/actions/adminActions';

export default function SuperAdminLogin() {
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
      await verifySuperAdminLogin(email, password);
      router.push('/superadmin');
    } catch (err) {
      setError(err.message || 'Failed to login.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-[#0a0a0a]">
      <motion.form 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        onSubmit={handleLogin}
        className="bg-[#111814] p-8 rounded-[32px] w-full max-w-md border border-neutral-800 shadow-2xl"
      >
        <div className="mb-8 text-center">
          <h2 className="text-[10px] font-bold tracking-widest text-amber-500 uppercase mb-2">MenuHub</h2>
          <h1 className="text-2xl font-bold text-white tracking-tight">Super Admin Login</h1>
        </div>

        {error && (
          <div className="mb-6 bg-red-900/30 text-red-400 text-[12px] font-bold p-3 rounded-xl border border-red-900/50">
            {error}
          </div>
        )}

        <div className="space-y-5">
          <div>
            <label className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest block mb-2">Email</label>
            <input 
              type="email" 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-neutral-900 border border-neutral-800 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-amber-500 transition-colors"
              required
            />
          </div>
          <div>
            <label className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest block mb-2">Password</label>
            <input 
              type="password" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-neutral-900 border border-neutral-800 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-amber-500 transition-colors"
              required
            />
          </div>
          <button 
            type="submit" 
            disabled={isLoading}
            className="w-full bg-amber-500 hover:bg-amber-400 text-[#111814] font-bold text-sm tracking-wider uppercase py-4 rounded-xl transition-colors disabled:opacity-50 mt-4"
          >
            {isLoading ? 'Authenticating...' : 'Secure Login'}
          </button>
        </div>
      </motion.form>
    </div>
  );
}
