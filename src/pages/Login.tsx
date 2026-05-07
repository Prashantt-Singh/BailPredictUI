import React, { useState, useEffect } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Mail, Lock, ShieldCheck, RefreshCw, LogIn, Scale } from 'lucide-react';
import { supabase } from '../lib/supabase';

const Login: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from?.pathname || '/';
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Clear autofill on mount
  useEffect(() => {
    const timer = setTimeout(() => {
      setEmail('');
      setPassword('');
    }, 100);
    return () => clearTimeout(timer);
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;
      navigate(from, { replace: true });
    } catch (err: unknown) {
      const msg = (err as { message?: string } | null)?.message;
      setError(msg || 'Invalid login credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: window.location.origin,
        },
      });
      if (error) throw error;
    } catch (err: unknown) {
      const msg = (err as { message?: string } | null)?.message;
      setError(msg || 'Google sign-in failed.');
    }
  };

  return (
    <div className="min-h-screen w-full flex overflow-hidden bg-[var(--bg-secondary)]">
      {/* Left Side: Branding Side */}
      <div className="hidden lg:flex w-1/2 bg-[#0a0f1e] relative overflow-hidden flex-col items-center justify-center p-12">
        {/* Animated Background Elements */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          {[...Array(6)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute bg-[#C9A84C] rounded-full opacity-[0.03] blur-[100px]"
              animate={{
                x: [Math.random() * 100 + '%', Math.random() * 100 + '%'],
                y: [Math.random() * 100 + '%', Math.random() * 100 + '%'],
                scale: [1, 1.2, 1],
              }}
              transition={{
                duration: 20 + i * 5,
                repeat: Infinity,
                ease: "linear"
              }}
              style={{
                width: 300 + i * 100,
                height: 300 + i * 100,
                left: -100,
                top: -100,
              }}
            />
          ))}
        </div>

        <div className="relative z-10 text-center max-w-lg">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="w-24 h-24 bg-[var(--bg-secondary)]/5 backdrop-blur-xl rounded-[2.5rem] flex items-center justify-center mx-auto mb-10 border border-white/10 shadow-2xl relative"
          >
            <Scale className="text-[#C9A84C]" size={48} />
            <div className="absolute inset-0 bg-[#C9A84C]/20 blur-3xl rounded-full -z-10 animate-pulse"></div>
          </motion.div>

          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-5xl font-serif font-black text-[var(--btn-primary-text)] mb-6 leading-tight"
          >
            AI-Powered <br />
            <span className="text-[#C9A84C]">Legal Intelligence</span>
          </motion.h1>

          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="text-[var(--text-muted)] text-xl font-medium leading-relaxed"
          >
            Predict bail outcomes, generate arguments, and draft applications instantly with our high-end neural engine.
          </motion.p>
        </div>

        {/* Floating Tags */}
        <div className="absolute bottom-20 left-0 right-0 flex justify-center gap-4 opacity-30">
          <div className="px-4 py-2 rounded-full border border-white/10 text-[var(--btn-primary-text)] text-xs font-black uppercase tracking-widest">Case Analysis</div>
          <div className="px-4 py-2 rounded-full border border-white/10 text-[var(--btn-primary-text)] text-xs font-black uppercase tracking-widest">Draft Generation</div>
          <div className="px-4 py-2 rounded-full border border-white/10 text-[var(--btn-primary-text)] text-xs font-black uppercase tracking-widest">IPC Intelligence</div>
        </div>
      </div>

      {/* Right Side: Auth Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 bg-[var(--bg-primary)] relative">
        {/* Subtle glow for mobile */}
        <div className="lg:hidden absolute top-0 left-1/2 -translate-x-1/2 w-64 h-64 bg-[#C9A84C]/10 blur-[100px] pointer-events-none"></div>

        <motion.div 
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="max-w-md w-full"
        >
          <div className="bg-[var(--bg-secondary)] backdrop-blur-2xl rounded-[3rem] p-10 lg:p-12 shadow-2xl border border-[var(--border-subtle)] relative overflow-hidden">
            
            <div className="mb-10 text-center lg:text-left">
              <h2 className="text-3xl font-serif font-black text-[var(--text-primary)] mb-3">Welcome Back</h2>
              <p className="text-[var(--text-secondary)] font-medium tracking-tight">Log in to your professional legal workspace.</p>
            </div>

            <form onSubmit={handleLogin} className="space-y-6">
              {/* Honeypot to trap autofill */}
              <div className="absolute -top-[1000px] -left-[1000px] w-1 h-1 overflow-hidden opacity-0 pointer-events-none">
                <input type="text" name="user_name" tabIndex={-1} autoComplete="on" />
                <input type="email" name="user_email" tabIndex={-1} autoComplete="on" />
                <input type="password" name="user_pass" tabIndex={-1} autoComplete="on" />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-[2px] ml-1">Email Address</label>
                <div className="relative group">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--text-muted)] group-focus-within:text-[#C9A84C] transition-colors" size={20} />
                  <input 
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="advocate@example.com"
                    autoComplete="new-password"
                    required
                    className="w-full bg-[var(--bg-surface)] border border-[var(--border-subtle)] rounded-2xl py-4 pl-12 pr-4 text-sm font-bold focus:outline-none focus:ring-4 focus:ring-[#C9A84C]/10 focus:bg-[var(--bg-secondary)] focus:border-[#C9A84C] transition-all"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-[2px] ml-1">Password</label>
                <div className="relative group">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--text-muted)] group-focus-within:text-[#C9A84C] transition-colors" size={20} />
                  <input 
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    autoComplete="new-password"
                    required
                    className="w-full bg-[var(--bg-surface)] border border-[var(--border-subtle)] rounded-2xl py-4 pl-12 pr-4 text-sm font-bold focus:outline-none focus:ring-4 focus:ring-[#C9A84C]/10 focus:bg-[var(--bg-secondary)] focus:border-[#C9A84C] transition-all"
                  />
                </div>
              </div>

              <motion.button 
                type="submit"
                disabled={loading}
                whileTap={{ 
                  scale: 0.98,
                  boxShadow: "0 0 20px 2px rgba(0,0,0,0.8)",
                }}
                className="w-full bg-[#0a0f1e] text-[#C9A84C] py-5 rounded-2xl font-black text-sm uppercase tracking-widest hover:bg-[var(--btn-primary-hover)] transition-all flex items-center justify-center gap-3 group disabled:opacity-50"
              >
                {loading ? <RefreshCw className="animate-spin text-[#C9A84C]" size={20} /> : (
                  <>
                    Sign In to Workspace
                    <LogIn className="group-hover:translate-x-1 transition-transform" size={20} />
                  </>
                )}
              </motion.button>

              <div className="relative py-4 text-center">
                <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-[var(--border-subtle)]"></div></div>
                <span className="relative z-10 bg-[var(--bg-secondary)] px-4 text-[10px] uppercase font-black tracking-widest text-[var(--text-muted)]">Or continue with</span>
              </div>

              <button 
                type="button"
                onClick={handleGoogleLogin}
                className="w-full bg-[var(--bg-secondary)] border-2 border-[var(--border-subtle)] text-[var(--text-secondary)] py-4 rounded-2xl font-bold text-sm hover:bg-[var(--bg-surface)] hover:border-[var(--border-primary)] transition-all flex items-center justify-center gap-3 group"
              >
                <img src="https://www.google.com/favicon.ico" alt="Google" className="w-4 h-4 group-hover:scale-110 transition-transform" />
                Google Account
              </button>
            </form>

            <div className="mt-8 text-center font-bold text-sm text-[var(--text-muted)]">
              Don't have an account? {' '}
              <Link to="/signup" className="text-[var(--text-primary)] hover:text-[#C9A84C] transition-colors underline underline-offset-4 decoration-2 decoration-slate-100">Sign Up Free</Link>
            </div>

            {/* Error Message */}
            <AnimatePresence>
              {error && (
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="mt-8 p-4 bg-red-50 rounded-xl border border-red-100"
                >
                  <p className="text-xs font-bold text-red-600 text-center">{error}</p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.div>

        {/* Floating Legal Icons in background */}
        <div className="absolute top-1/2 left-0 right-0 -translate-y-1/2 flex items-center justify-between px-10 pointer-events-none opacity-[0.03]">
           <ShieldCheck size={120} />
           <Scale size={120} />
        </div>
      </div>
    </div>
  );
};

export default Login;
