'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { verifyStaffPasscode } from '@/app/actions/adminActions';

export default function LoginPage() {
  const [loginMethod, setLoginMethod] = useState('password'); // 'password' or 'passcode'
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [passcode, setPasscode] = useState('');
  const [staffPasscode, setStaffPasscode] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  // Smart initialization: Check for active Supabase session
  useEffect(() => {
    const initializeAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (session) {
        // App is authenticated, just locked. Default to PIN pad.
        setEmail(session.user.email);
        setLoginMethod('passcode');
      } else {
        // Completely logged out. Check for a remembered email for convenience.
        const savedEmail = localStorage.getItem('menuhub_email');
        if (savedEmail) {
          setEmail(savedEmail);
        }
        setLoginMethod('password');
      }
    };
    
    initializeAuth();
  }, []);

  const handlePasswordLogin = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
      
      if (data.user) {
        localStorage.setItem('menuhub_email', email); 
        sessionStorage.setItem('dashboard_unlocked', 'true'); // Flag as unlocked
        router.push('/admin');
      }
    } catch (err) {
      setError(err.message || "Failed to log in.");
    } finally {
      setIsLoading(false);
    }
  };

  const handlePasscodeLogin = React.useCallback(async () => {
    if (!email) {
      setError('Please enter your email first.');
      setPasscode('');
      return;
    }

    setError('');
    setIsLoading(true);

    try {
      const { data, error: rpcError } = await supabase.rpc('verify_cafe_passcode', {
        p_email: email,
        p_passcode: passcode
      });

      if (rpcError) throw rpcError;

      if (data.success) {
        localStorage.setItem('menuhub_email', email);
        sessionStorage.setItem('dashboard_unlocked', 'true'); // Flag as unlocked
        router.push('/admin');
      } else {
        setError('Invalid Passcode.');
        setPasscode('');
      }
    } catch (err) {
      console.error("PIN Error:", err);
      setError('Verification failed.');
      setPasscode('');
    } finally {
      setIsLoading(false);
    }
  }, [email, passcode, router]);

  const handleStaffLogin = React.useCallback(async () => {
    if (!email) {
      setError('Please enter your email first.');
      setStaffPasscode('');
      return;
    }
    setError('');
    setIsLoading(true);
    try {
      const res = await verifyStaffPasscode(email, staffPasscode);
      if (res.success) {
        localStorage.setItem('menuhub_email', email);
        sessionStorage.setItem('dashboard_unlocked', 'staff');
        router.push('/admin');
      } else {
        setError(res.message || 'Invalid Staff PIN.');
        setStaffPasscode('');
      }
    } catch (err) {
      console.error(err);
      setError('Verification failed.');
      setStaffPasscode('');
    } finally {
      setIsLoading(false);
    }
  }, [email, staffPasscode, router]);

  // Auto-submit when passcode reaches 4 digits
  useEffect(() => {
    let timer;
    if (loginMethod === 'passcode' && passcode.length === 4) {
      timer = setTimeout(() => {
        handlePasscodeLogin();
      }, 0);
    }
    if (loginMethod === 'staff' && staffPasscode.length === 4) {
      timer = setTimeout(() => {
        handleStaffLogin();
      }, 0);
    }
    return () => {
      if (timer) clearTimeout(timer);
    };
  }, [passcode, staffPasscode, loginMethod, handlePasscodeLogin, handleStaffLogin]);

  const handleNumberClick = (num) => {
    if (loginMethod === 'staff') {
      if (staffPasscode.length < 4) {
        setStaffPasscode(prev => prev + num);
        setError('');
      }
    } else {
      if (passcode.length < 4) {
        setPasscode(prev => prev + num);
        setError('');
      }
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
          <h1 className="text-2xl font-bold tracking-tight text-[#111814]">
            {loginMethod === 'password' ? 'Admin Login' : loginMethod === 'passcode' ? 'Quick Unlock' : 'Staff Login'}
          </h1>
        </div>

        <div className="flex bg-neutral-200 p-1 rounded-xl mb-8 relative">
          <button type="button" onClick={() => { setLoginMethod('password'); setError(''); }} className={`flex-1 py-2 text-xs font-bold z-10 transition-colors ${loginMethod === 'password' ? 'text-black' : 'text-neutral-500'}`}>Admin</button>
          <button type="button" onClick={() => { setLoginMethod('passcode'); setError(''); setPasscode(''); }} className={`flex-1 py-2 text-xs font-bold z-10 transition-colors ${loginMethod === 'passcode' ? 'text-black' : 'text-neutral-500'}`}>Quick PIN</button>
          <button type="button" onClick={() => { setLoginMethod('staff'); setError(''); setStaffPasscode(''); }} className={`flex-1 py-2 text-xs font-bold z-10 transition-colors ${loginMethod === 'staff' ? 'text-black' : 'text-neutral-500'}`}>Staff PIN</button>
          <motion.div
            layout
            className="absolute top-1 bottom-1 w-[calc(33.33%-4px)] bg-white rounded-lg shadow-sm"
            initial={false}
            animate={{ left: loginMethod === 'password' ? '4px' : loginMethod === 'passcode' ? 'calc(33.33% + 2px)' : 'calc(66.66% + 0px)' }}
            transition={{ type: "spring", stiffness: 400, damping: 30 }}
          />
        </div>

        {error && (
          <div className="mb-6 bg-red-50 text-red-600 text-[12px] font-bold p-3 rounded-xl border border-red-100 flex items-center gap-2">
            <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            {error}
          </div>
        )}

        <div className="space-y-6">
          <div className={loginMethod !== 'password' ? 'opacity-50 pointer-events-none' : ''}>
            <label className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest block mb-2">Email Address</label>
            <input 
              type="email" 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="admin@cafename.com" 
              className="w-full pb-2 border-b border-neutral-300 text-[15px] font-medium text-black focus:outline-none focus:border-black rounded-none bg-transparent transition-colors"
              readOnly={loginMethod !== 'password'}
            />
          </div>

          <AnimatePresence mode="wait">
            {loginMethod === 'password' ? (
              <motion.form 
                key="password-form"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ duration: 0.2 }}
                onSubmit={handlePasswordLogin}
                className="space-y-6"
              >
                <div>
                  <label className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest block mb-2">Password</label>
                  <input 
                    type="password" 
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••" 
                    className="w-full pb-2 border-b border-neutral-300 text-[15px] font-medium text-black focus:outline-none focus:border-black rounded-none bg-transparent transition-colors"
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
              </motion.form>
            ) : (
              <motion.div 
                key="passcode-form"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.2 }}
                className="flex flex-col items-center"
              >
                <div className="flex gap-4 mb-6 mt-2">
                  {[0, 1, 2, 3].map((index) => {
                    const currentLen = loginMethod === 'staff' ? staffPasscode.length : passcode.length;
                    return (
                      <motion.div 
                        key={index}
                        animate={{ 
                          scale: currentLen > index ? 1.2 : 1,
                          backgroundColor: currentLen > index ? '#111814' : '#E5E5E5'
                        }}
                        className="w-3 h-3 rounded-full transition-colors duration-200"
                      />
                    );
                  })}
                </div>

                <div className="grid grid-cols-3 gap-3 w-full">
                  {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
                    <button
                      key={num}
                      type="button"
                      onClick={() => handleNumberClick(num.toString())}
                      disabled={isLoading}
                      className="h-12 rounded-xl bg-white text-xl font-bold text-[#111814] shadow-sm hover:bg-neutral-50 active:scale-95 transition-all"
                    >
                      {num}
                    </button>
                  ))}
                  <div className="col-start-2">
                    <button
                      type="button"
                      onClick={() => handleNumberClick('0')}
                      disabled={isLoading}
                      className="h-12 w-full rounded-xl bg-white text-xl font-bold text-[#111814] shadow-sm hover:bg-neutral-50 active:scale-95 transition-all"
                    >
                      0
                    </button>
                  </div>
                  <div className="col-start-3">
                    <button
                      type="button"
                      onClick={() => loginMethod === 'staff' ? setStaffPasscode(prev => prev.slice(0, -1)) : setPasscode(prev => prev.slice(0, -1))}
                      disabled={isLoading || (loginMethod === 'staff' ? staffPasscode.length === 0 : passcode.length === 0)}
                      className="h-12 w-full rounded-xl bg-transparent text-sm font-bold text-neutral-500 hover:text-[#111814] active:scale-95 transition-all flex justify-center items-center"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  );
}