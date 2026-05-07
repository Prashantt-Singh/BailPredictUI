import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Mail, Lock, ShieldCheck, ArrowRight, RefreshCw, CheckCircle2, Scale } from 'lucide-react';
import { supabase } from '../lib/supabase';

const Signup: React.FC = () => {
  const navigate = useNavigate();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // Clear autofill on mount
  useEffect(() => {
    const timer = setTimeout(() => {
      setFullName('');
      setEmail('');
      setPassword('');
    }, 100);
    return () => clearTimeout(timer);
  }, []);

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: window.location.origin,
          data: {
            full_name: fullName,
          }
        }
      });

      if (error) {
        const status = (error as { status?: number } | null)?.status;
        if (error.message.includes('User already registered') || 
            error.message.includes('already registered') ||
            status === 400) {
          setError('This email is already registered. Please sign in instead.');
          return;
        }
        setError(error.message || 'Signup failed. Please try again.');
        return;
      }

      // Supabase sometimes returns user with identities = []
      // when user already exists — check for this case
      if (data?.user && data.user.identities && data.user.identities.length === 0) {
        setError('This email is already registered. Please sign in instead.');
        return;
      }

      setSuccess(true);
    } catch (err: unknown) {
      const msg = (err as { message?: string } | null)?.message;
      setError(msg || 'Signup failed. Please try again.');
    } finally {
      setLoading(false);
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
            
            <AnimatePresence mode="wait">
              {!success ? (
                <motion.div
                  key="signup-form"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                >
                  <div className="mb-10 text-center lg:text-left">
                    <h2 className="text-3xl font-serif font-black text-[var(--text-primary)] mb-3">Create Account</h2>
                    <p className="text-[var(--text-secondary)] font-medium tracking-tight">Join the next generation of legal tech.</p>
                  </div>

                  <form onSubmit={handleSignup} className="space-y-6">
                    {/* Honeypot to trap autofill */}
                    <div className="absolute -top-[1000px] -left-[1000px] w-1 h-1 overflow-hidden opacity-0 pointer-events-none">
                      <input type="text" name="user_name" tabIndex={-1} autoComplete="on" />
                      <input type="email" name="user_email" tabIndex={-1} autoComplete="on" />
                      <input type="password" name="user_pass" tabIndex={-1} autoComplete="on" />
                    </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-[2px] ml-1">Full Name</label>
                        <div className="relative group">
                          <CheckCircle2 className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--text-muted)] group-focus-within:text-[#C9A84C] transition-colors" size={20} />
                          <input 
                            type="text"
                            value={fullName}
                            onChange={(e) => setFullName(e.target.value)}
                            placeholder="Aisha Sharma"
                            autoComplete="new-password"
                            required
                            className="w-full bg-[var(--bg-surface)] border border-[var(--border-subtle)] rounded-2xl py-4 pl-12 pr-4 text-sm font-bold focus:outline-none focus:ring-4 focus:ring-[#C9A84C]/10 focus:bg-[var(--bg-secondary)] focus:border-[#C9A84C] transition-all"
                          />
                        </div>
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
                            autoComplete="off"
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
                          autoComplete="off"
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
                          Sign Up Free
                          <ArrowRight className="group-hover:translate-x-1 transition-transform" size={20} />
                        </>
                      )}
                    </motion.button>
                  </form>

                  <div className="mt-8 text-center font-bold text-sm text-[var(--text-muted)]">
                    Already have an account? {' '}
                    <Link to="/login" className="text-[var(--text-primary)] hover:text-[#C9A84C] transition-colors underline underline-offset-4 decoration-2 decoration-slate-100">Log In</Link>
                  </div>
                </motion.div>
              ) : (
                <motion.div
                  key="signup-success"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="text-center py-8"
                >
                  <div className="w-20 h-20 bg-emerald-50 rounded-full flex items-center justify-center mx-auto mb-6 border border-emerald-100">
                    <CheckCircle2 className="text-emerald-500" size={40} />
                  </div>
                  <h3 className="text-2xl font-serif font-black text-[#0a0f1e] mb-4">Check Your Email</h3>
                  <p className="text-[var(--text-secondary)] font-medium mb-8">
                    We've sent a verification link to <span className="text-[#0a0f1e] font-bold">{email}</span>. Click the link to activate your account.
                  </p>
                  <button 
                    onClick={() => navigate('/login')}
                    className="w-full bg-[#0a0f1e] text-[#C9A84C] py-4 rounded-2xl font-black text-sm uppercase tracking-widest shadow-xl shadow-black/10 hover:bg-[var(--btn-primary-hover)] transition-all"
                  >
                    Back to Log In
                  </button>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Error Message */}
            <AnimatePresence>
              {error && (
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="mt-8 p-4 bg-red-50 rounded-xl border border-red-200 flex flex-col items-center gap-3"
                >
                  <p className="text-sm font-bold text-red-600 text-center">{error}</p>
                  {error === 'This email is already registered. Please sign in instead.' && (
                    <Link 
                      to="/login" 
                      className="text-sm font-black text-red-700 hover:text-red-900 flex items-center gap-1 transition-colors"
                    >
                      Sign In instead <ArrowRight size={16} />
                    </Link>
                  )}
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

export default Signup;
