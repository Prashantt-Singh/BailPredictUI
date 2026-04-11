import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, useInView, AnimatePresence } from 'framer-motion';
import {
  Scale, Activity, FileText, Brain, ArrowRight, ChevronRight,
  ChevronLeft, Lock, Shield, Star, Quote, Calendar
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';

// ── Variants ────────────────────────────────────────────────
// ── Counter ──────────────────────────────────────────────────
const Counter: React.FC<{ end: number; suffix?: string; prefix?: string; duration?: number }> = ({
  end, suffix = '', prefix = '', duration = 2000
}) => {
  const [count, setCount] = useState(0);
  const ref = useRef(null);
  const inView = useInView(ref, { once: true });

  useEffect(() => {
    if (!inView) return;
    let start = 0;
    const frames = Math.floor(duration / 16);
    const inc = end / frames;
    const timer = setInterval(() => {
      start += inc;
      if (start >= end) { setCount(end); clearInterval(timer); }
      else { setCount(Math.floor(start)); }
    }, 16);
    return () => clearInterval(timer);
  }, [inView, end, duration]);

  return <span ref={ref}>{prefix}{count.toLocaleString()}{suffix}</span>;
};

// ── Data ────────────────────────────────────────────────────
const FEATURES = [
  {
    icon: Scale,
    label: 'Bail Prediction',
    desc: 'Predict bail outcomes with high-accuracy AI models trained on thousands of Indian court cases across all major sections.',
    href: '/predict',
  },
  {
    icon: Brain,
    label: 'AI Legal Arguments',
    desc: 'Generate context-aware, court-ready legal arguments tailored to your case specifics in seconds.',
    href: '/predict',
  },
  {
    icon: FileText,
    label: 'Draft Generator',
    desc: 'Produce professional bail application drafts in standard legal format — ready to submit to any Indian court.',
    href: '/predict',
  },
];

// STATS are now fetched live from Supabase — no static fallback needed

const TESTIMONIALS = [
  {
    quote: "BailPredict transformed how I approach bail applications. The AI arguments are sophisticated, accurate, and genuinely admissible.",
    name: "Adv. Priya Singh",
    role: "Senior Criminal Advocate, Delhi High Court",
    rating: 5,
  },
  {
    quote: "The draft generator alone saves me hours per case. This is the kind of legal tech India has been waiting for.",
    name: "Adv. Rahul Mehra",
    role: "Defense Counsel, Bombay High Court",
    rating: 5,
  },
  {
    quote: "Incredibly precise bail probability estimates. I use it to counsel clients before presenting arguments — it sets the right expectations.",
    name: "Adv. Kavitha Nair",
    role: "Criminal Defense Attorney, Kerala",
    rating: 5,
  },
];

// ── Dashboard Component ─────────────────────────────────────
// ── Hearing urgency helper ────────────────────────────────
const getHearingBadge = (dateStr: string) => {
  const today = new Date(); today.setHours(0,0,0,0);
  const hearing = new Date(dateStr);
  const diffDays = Math.ceil((hearing.getTime() - today.getTime()) / (1000*60*60*24));
  if (diffDays <= 0)  return { label: 'Overdue',   color: 'bg-slate-100 text-slate-500' };
  if (diffDays <= 2)  return { label: `URGENT · ${diffDays}d`, color: 'bg-red-50 text-red-600' };
  if (diffDays <= 5)  return { label: `SOON · ${diffDays}d`,   color: 'bg-amber-50 text-amber-600' };
  return { label: `${diffDays}d`,  color: 'bg-emerald-50 text-emerald-600' };
};

const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [savedCases, setSavedCases] = useState<any[]>([]);
  const [upcomingHearings, setUpcomingHearings] = useState<any[]>([]);
  const [liveStats, setLiveStats] = useState<any>(null);
  const [statsLoading, setStatsLoading] = useState(true);
  const [testimonialIdx, setTestimonialIdx] = useState(0);
  const heroWords = "AI-Powered Bail Prediction for Indian Courts".split(' ');

  useEffect(() => {
    window.scrollTo(0, 0);
    fetchStats();
    if (user) fetchCases();
    const t = setInterval(() => setTestimonialIdx(i => (i + 1) % TESTIMONIALS.length), 5000);
    return () => clearInterval(t);
  }, [user]);

  const fetchStats = async () => {
    const { data } = await supabase.from('stats').select('*').single();
    if (data) setLiveStats(data);
    setStatsLoading(false);
  };

  const fetchCases = async () => {
    const { data } = await supabase
      .from('cases')
      .select('*')
      .eq('user_id', user!.id)
      .order('created_at', { ascending: false })
      .limit(5);
    if (data) {
      setSavedCases(data);
      // upcoming hearings: filter cases with future hearing dates, sort ascending
      const today = new Date(); today.setHours(0,0,0,0);
      const upcoming = data
        .filter(c => c.hearing_date && new Date(c.hearing_date) >= today)
        .sort((a, b) => new Date(a.hearing_date).getTime() - new Date(b.hearing_date).getTime())
        .slice(0, 3);
      setUpcomingHearings(upcoming);
    }
  };

  const prevTestimonial = useCallback(() => setTestimonialIdx(i => (i - 1 + TESTIMONIALS.length) % TESTIMONIALS.length), []);
  const nextTestimonial = useCallback(() => setTestimonialIdx(i => (i + 1) % TESTIMONIALS.length), []);

  // Section refs for reveal
  const statsRef = useRef(null);
  const featuresRef = useRef(null);
  const statsInView = useInView(statsRef, { once: true, margin: '-80px' });
  const featuresInView = useInView(featuresRef, { once: true, margin: '-80px' });

  return (
    <div
      className="flex flex-col w-full bg-[#F8F9FB] text-[#111]"
      style={{ scrollBehavior: 'smooth' }}
    >
      {/* ── Grain Texture Overlay ── */}
      <div
        className="pointer-events-none fixed inset-0 z-[9999] opacity-[0.02]"
        style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=\'0 0 256 256\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'noise\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.9\' numOctaves=\'4\' stitchTiles=\'stitch\'/%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23noise)\'/%3E%3C/svg%3E")', backgroundRepeat: 'repeat', backgroundSize: '200px 200px' }}
      />

      {/* ══════════════════ HERO ══════════════════ */}
      <section className="relative min-h-screen flex flex-col items-center justify-center px-6 pt-32 pb-24 overflow-hidden">
        {/* Subtle radial gradient */}
        <div className="absolute inset-0 pointer-events-none" style={{ background: 'radial-gradient(ellipse 80% 60% at 50% 0%, rgba(201,168,76,0.06) 0%, transparent 70%)' }} />

        {/* Horizontal rule lines */}
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[#C9A84C]/20 to-transparent" />
        <div className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-slate-200 to-transparent" />

        {/* Small Label */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="mb-10 flex items-center gap-3"
        >
          <div className="h-px w-10 bg-[#C9A84C]" />
          <span className="text-[11px] font-black uppercase tracking-[4px] text-[#C9A84C]">
            Securing Legal Intelligence
          </span>
          <div className="h-px w-10 bg-[#C9A84C]" />
        </motion.div>

        {/* Hero Heading — word by word */}
        <h1 className="max-w-5xl text-center text-5xl sm:text-6xl lg:text-7xl font-serif font-black leading-[1.08] tracking-tight mb-10 flex flex-wrap items-center justify-center gap-x-4 gap-y-2">
          {heroWords.map((word, i) => (
            <motion.span
              key={i}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.55, delay: 0.35 + i * 0.08, ease: [0.22, 1, 0.36, 1] }}
              className={word === 'AI-Powered' ? 'text-[#C9A84C]' : 'text-[#111]'}
            >
              {word}
            </motion.span>
          ))}
        </h1>

        {/* Subheading */}
        <motion.p
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 1.1 }}
          className="max-w-2xl text-center text-lg sm:text-xl text-slate-500 font-medium leading-relaxed mb-14"
        >
          Predict bail outcomes, generate legal arguments, and draft applications instantly — powered by advanced AI trained on Indian jurisprudence.
        </motion.p>

        {/* CTA Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 1.3 }}
          className="flex flex-col sm:flex-row gap-4"
        >
          <motion.button
            onClick={() => navigate('/predict')}
            whileTap={{ 
              scale: 0.98,
              boxShadow: "0 0 25px 5px rgba(0,0,0,0.4)"
            }}
            className="group relative overflow-hidden h-14 px-10 bg-[#111] text-white text-sm font-black uppercase tracking-widest rounded-lg flex items-center justify-center gap-3 transition-all duration-300"
          >
            <span>Get Started</span>
            <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
          </motion.button>
          <button
            onClick={() => navigate('/ipc-guide')}
            className="h-14 px-10 border-2 border-[#111]/15 text-[#111] text-sm font-black uppercase tracking-widest rounded-lg flex items-center justify-center gap-3 hover:border-[#111] hover:shadow-lg hover:scale-[1.02] active:scale-95 transition-all duration-300"
          >
            Explore Features
          </button>
        </motion.div>

        {/* Scroll indicator */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 2 }}
          className="absolute bottom-10 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2"
        >
          <motion.div
            animate={{ y: [0, 8, 0] }}
            transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
            className="w-px h-10 bg-gradient-to-b from-[#C9A84C]/50 to-transparent"
          />
        </motion.div>
      </section>

      {/* ══════════════════ STATS ══════════════════ */}
      <section ref={statsRef} className="w-full border-t border-b border-slate-200 bg-white">
        <div className="max-w-6xl mx-auto px-6 py-16 grid grid-cols-2 md:grid-cols-4 gap-8 md:gap-0 md:divide-x divide-slate-100">
          {([
            { key: 'total_predictions', suffix: '+', label: 'Predictions Made',    duration: 2000 },
            { key: 'avg_accuracy',      suffix: '%', label: 'Avg. Bail Accuracy',  duration: 1500 },
            { key: 'arguments_generated', suffix: '+', label: 'Arguments Generated', duration: 2500 },
            { key: 'ipc_sections',      suffix: '+', label: 'IPC Sections Covered', duration: 1800 },
          ] as const).map((s, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              animate={statsInView ? { opacity: 1, y: 0 } : {}}
              transition={{ delay: i * 0.12, duration: 0.6 }}
              className="flex flex-col items-center text-center px-6 py-4"
            >
              <span className="text-4xl md:text-5xl font-black text-[#111] tracking-tight mb-2">
                {statsLoading ? (
                  <span className="inline-block w-20 h-10 bg-slate-100 rounded-lg animate-pulse" />
                ) : statsInView && liveStats ? (
                  <Counter end={Number(liveStats[s.key]) || 0} suffix={s.suffix} duration={s.duration} />
                ) : '0'}
              </span>
              <span className="text-xs font-bold text-slate-400 uppercase tracking-[2px]">{s.label}</span>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ══════════════════ FEATURE CARDS ══════════════════ */}
      <section ref={featuresRef} className="max-w-6xl mx-auto px-6 py-28 w-full">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={featuresInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="text-center mb-20"
        >
          <span className="text-[10px] font-black uppercase tracking-[4px] text-[#C9A84C]">What We Offer</span>
          <h2 className="mt-4 text-4xl md:text-5xl font-serif font-black text-[#111] tracking-tight">
            Built for Legal Professionals
          </h2>
          <p className="mt-5 text-slate-500 font-medium max-w-xl mx-auto leading-relaxed">
            Three powerful tools that work together to give advocates and law firms an unfair advantage in the courtroom.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {FEATURES.map((f, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 30 }}
              animate={featuresInView ? { opacity: 1, y: 0 } : {}}
              transition={{ delay: 0.1 + i * 0.15, duration: 0.65, ease: [0.22, 1, 0.36, 1] }}
              onClick={() => navigate(f.href)}
              className="group bg-white rounded-2xl p-8 border border-slate-100 shadow-sm hover:shadow-xl hover:-translate-y-2 hover:border-[#C9A84C]/20 cursor-pointer transition-all duration-400 relative overflow-hidden"
            >
              {/* Gold corner accent on hover */}
              <div className="absolute top-0 left-0 w-0 h-[3px] bg-[#C9A84C] group-hover:w-full transition-all duration-500" />

              <div className="w-14 h-14 rounded-xl bg-[#F8F9FB] border border-slate-100 flex items-center justify-center mb-8 group-hover:bg-[#111] group-hover:border-[#111] transition-all duration-300">
                <f.icon size={26} className="text-[#111] group-hover:text-[#C9A84C] transition-colors duration-300" />
              </div>
              <h3 className="text-xl font-black text-[#111] mb-3">{f.label}</h3>
              <p className="text-slate-500 text-sm leading-relaxed font-medium mb-6">{f.desc}</p>
              <button className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-[#C9A84C] group-hover:gap-3 transition-all">
                Try Now <ChevronRight size={14} />
              </button>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ══════════════════ VISUAL SECTION ══════════════════ */}
      <section className="w-full bg-white border-t border-slate-100">
        <div className="max-w-6xl mx-auto px-6 py-28">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-center">
            {/* Text */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.7 }}
            >
              <span className="text-[10px] font-black uppercase tracking-[4px] text-[#C9A84C]">How It Works</span>
              <h2 className="mt-4 text-4xl font-serif font-black text-[#111] leading-tight mb-6">
                From Case Details to Court-Ready Documents
              </h2>
              <p className="text-slate-500 font-medium leading-relaxed mb-10">
                Enter your case specifics and our dual AI engine — combining BERT legal classification with Gemini's reasoning — delivers probability scores, strong arguments, and professional drafts in seconds.
              </p>
              <div className="space-y-6">
                {[
                  { num: '01', label: 'Enter Case Details', desc: 'IPC section, court level, offense type, and custody duration.' },
                  { num: '02', label: 'AI Analysis', desc: 'Dual-model pipeline evaluates precedents and calculates bail probability.' },
                  { num: '03', label: 'Receive Outputs', desc: 'Get your prediction, arguments, and a formatted draft instantly.' },
                ].map((step) => (
                  <div key={step.num} className="flex gap-5 items-start group">
                    <span className="text-[#C9A84C]/40 font-black text-3xl leading-none group-hover:text-[#C9A84C] transition-colors">{step.num}</span>
                    <div>
                      <h4 className="font-black text-[#111] mb-1">{step.label}</h4>
                      <p className="text-sm text-slate-500 font-medium">{step.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>

            {/* Images */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.7, delay: 0.15 }}
              className="grid grid-cols-2 gap-4"
            >
              {/* Lady Justice card */}
              <div className="group relative rounded-2xl overflow-hidden bg-[#0a0f1e] aspect-[3/4] shadow-2xl">
                <div className="absolute inset-0 bg-gradient-to-t from-[#0a0f1e] via-transparent to-transparent z-10" />
                <div className="absolute inset-0 flex items-center justify-center group-hover:scale-105 transition-transform duration-700">
                  <Scale size={80} className="text-[#C9A84C]/20" />
                </div>
                <div className="absolute inset-0 flex items-center justify-center z-20">
                  <Scale size={48} className="text-[#C9A84C]" />
                </div>
                <div className="absolute bottom-4 left-4 z-20">
                  <p className="text-xs font-black uppercase tracking-widest text-white/40">Lady Justice</p>
                </div>
              </div>

              {/* Scales card — offset */}
              <div className="group relative rounded-2xl overflow-hidden bg-[#C9A84C] aspect-[3/4] shadow-2xl mt-10">
                <div className="absolute inset-0 bg-gradient-to-t from-[#b8933e] via-transparent to-transparent z-10" />
                <div className="absolute inset-0 flex items-center justify-center group-hover:scale-105 transition-transform duration-700">
                  <Shield size={80} className="text-white/10" />
                </div>
                <div className="absolute inset-0 flex items-center justify-center z-20">
                  <Shield size={48} className="text-white" />
                </div>
                <div className="absolute bottom-4 left-4 z-20">
                  <p className="text-xs font-black uppercase tracking-widest text-white/60">Legal Shield</p>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ══════════════════ TESTIMONIALS ══════════════════ */}
      <section className="max-w-6xl mx-auto px-6 py-28 w-full">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <span className="text-[10px] font-black uppercase tracking-[4px] text-[#C9A84C]">Testimonials</span>
          <h2 className="mt-4 text-4xl font-serif font-black text-[#111]">Trusted by Legal Professionals</h2>
        </motion.div>

        <div className="relative max-w-3xl mx-auto">
          <AnimatePresence mode="wait">
            <motion.div
              key={testimonialIdx}
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -30 }}
              transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
              className="bg-white rounded-2xl p-10 shadow-sm border border-slate-100"
            >
              <Quote size={32} className="text-[#C9A84C]/30 mb-6" />
              <div className="flex gap-1 mb-6">
                {[...Array(TESTIMONIALS[testimonialIdx].rating)].map((_, i) => (
                  <Star key={i} size={16} className="fill-[#C9A84C] text-[#C9A84C]" />
                ))}
              </div>
              <p className="text-[#111] text-xl font-medium leading-relaxed mb-8 italic">
                "{TESTIMONIALS[testimonialIdx].quote}"
              </p>
              <div>
                <p className="font-black text-[#111]">{TESTIMONIALS[testimonialIdx].name}</p>
                <p className="text-xs text-slate-400 font-medium mt-1 uppercase tracking-widest">{TESTIMONIALS[testimonialIdx].role}</p>
              </div>
            </motion.div>
          </AnimatePresence>

          {/* Navigation arrows */}
          <div className="flex items-center justify-between mt-8">
            <div className="flex gap-2">
              {TESTIMONIALS.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setTestimonialIdx(i)}
                  className={`h-1 rounded-full transition-all duration-300 ${i === testimonialIdx ? 'w-8 bg-[#111]' : 'w-3 bg-slate-200'}`}
                />
              ))}
            </div>
            <div className="flex gap-3">
              <button
                onClick={prevTestimonial}
                className="w-11 h-11 rounded-xl border-2 border-slate-200 flex items-center justify-center text-slate-500 hover:border-[#111] hover:text-[#111] transition-all"
              >
                <ChevronLeft size={20} />
              </button>
              <button
                onClick={nextTestimonial}
                className="w-11 h-11 rounded-xl border-2 border-slate-200 flex items-center justify-center text-slate-500 hover:border-[#111] hover:text-[#111] transition-all"
              >
                <ChevronRight size={20} />
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* ══════════════════ RECENT PREDICTIONS / AUTH CTA ══════════════════ */}
      <section className="w-full border-t border-slate-100 bg-white">
        <div className="max-w-6xl mx-auto px-6 py-24">
          {user ? (
            <>
              <div className="flex items-center justify-between mb-12">
                <div>
                  <span className="text-[10px] font-black uppercase tracking-[4px] text-[#C9A84C]">Your Workspace</span>
                  <h2 className="mt-3 text-3xl font-serif font-black text-[#111]">Recent Predictions</h2>
                </div>
                <button
                  onClick={() => navigate('/my-cases')}
                  className="hidden sm:flex items-center gap-2 text-xs font-black uppercase tracking-widest text-[#111] hover:text-[#C9A84C] transition-colors"
                >
                  All Cases <ChevronRight size={16} />
                </button>
              </div>

              {/* ── Upcoming Hearings ── */}
              {upcomingHearings.length > 0 && (
                <div className="mb-12">
                  <div className="flex items-center gap-3 mb-5">
                    <Calendar size={18} className="text-[#C9A84C]" />
                    <h3 className="text-lg font-black text-[#111]">Upcoming Hearings</h3>
                  </div>
                  <div className="space-y-3">
                    {upcomingHearings.map((c, i) => {
                      const badge = getHearingBadge(c.hearing_date);
                      const ipcShort = c.ipc_section?.split('—')[0]?.replace('Section','').trim() || c.ipc_section;
                      return (
                        <motion.div
                          key={c.id}
                          initial={{ opacity: 0, x: -12 }}
                          whileInView={{ opacity: 1, x: 0 }}
                          viewport={{ once: true }}
                          transition={{ delay: i * 0.06 }}
                          onClick={() => navigate(`/case/${c.id}`)}
                          className="group bg-white rounded-xl px-5 py-4 flex items-center justify-between gap-4 border border-slate-100 shadow-sm hover:shadow-md hover:border-[#C9A84C]/30 cursor-pointer transition-all"
                        >
                          <div className="flex items-center gap-4">
                            <div className="w-9 h-9 rounded-lg bg-[#F8F9FB] border border-slate-100 flex items-center justify-center shrink-0">
                              <Calendar size={16} className="text-[#C9A84C]" />
                            </div>
                            <div>
                              <p className="font-black text-[#111] text-sm">{c.offense}</p>
                              <p className="text-xs text-slate-400 font-medium mt-0.5">IPC §{ipcShort} · {new Date(c.hearing_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</p>
                            </div>
                          </div>
                          <span className={`text-[10px] font-black uppercase tracking-widest px-2.5 py-1 rounded-lg ${badge.color}`}>
                            {badge.label}
                          </span>
                        </motion.div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* ── Recent Predictions ── */}
              {savedCases.length > 0 ? (
                <div className="space-y-4">
                  {savedCases.map((c, i) => {
                    const isGranted = c.likelihood?.toLowerCase() === 'granted';
                    const ipcShort = c.ipc_section?.split('—')[0]?.replace('Section','').trim() || c.ipc_section;
                    return (
                      <motion.div
                        key={c.id || i}
                        initial={{ opacity: 0, y: 12 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: i * 0.07 }}
                        className="group bg-[#F8F9FB] rounded-xl px-6 py-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-white hover:shadow-md border border-transparent hover:border-slate-100 transition-all cursor-pointer"
                        onClick={() => navigate(`/case/${c.id}`)}
                      >
                        <div className="flex items-center gap-5">
                          <div className={`w-2 h-10 rounded-full ${isGranted ? 'bg-emerald-400' : 'bg-red-400'}`} />
                          <div>
                            <p className="font-black text-[#111]">{c.offense}</p>
                            <p className="text-xs text-slate-400 font-medium mt-0.5">IPC §{ipcShort} · {c.court}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-4">
                          <span className={`text-xs font-black uppercase tracking-widest px-3 py-1 rounded-lg ${isGranted ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-500'}`}>
                            {c.likelihood} · {Math.round(c.bail_probability ?? 0)}%
                          </span>
                          <button
                            onClick={(e) => { e.stopPropagation(); navigate(`/case/${c.id}`); }}
                            className="w-9 h-9 rounded-lg border border-slate-200 flex items-center justify-center text-slate-400 group-hover:border-[#111] group-hover:text-[#111] transition-all"
                          >
                            <ChevronRight size={16} />
                          </button>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              ) : (
                <div className="bg-[#F8F9FB] rounded-2xl p-16 text-center border-2 border-dashed border-slate-200">
                  <Activity size={40} className="text-slate-300 mx-auto mb-5" />
                  <h3 className="font-black text-[#111] text-xl mb-2">No predictions yet</h3>
                  <p className="text-slate-400 text-sm font-medium mb-8">Run your first analysis to start building your case archive.</p>
                  <button
                    onClick={() => navigate('/predict')}
                    className="px-8 py-4 bg-[#111] text-white font-black text-sm uppercase tracking-widest rounded-xl hover:bg-black hover:scale-105 transition-all shadow-xl"
                  >
                    Predict Now →
                  </button>
                </div>
              )}
            </>
          ) : (
            /* Auth CTA for guests */
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="max-w-2xl mx-auto text-center"
            >
              <div className="w-16 h-16 rounded-2xl bg-[#F8F9FB] border border-slate-100 flex items-center justify-center mx-auto mb-8">
                <Lock size={28} className="text-[#111]" />
              </div>
              <h2 className="text-3xl font-serif font-black text-[#111] mb-4">Access Your Prediction History</h2>
              <p className="text-slate-500 font-medium mb-10 leading-relaxed">
                Sign in to view saved cases, prediction results, and AI-generated application drafts from your previous sessions.
              </p>
              <button
                onClick={() => navigate('/login')}
                className="group h-14 px-12 bg-[#111] text-white text-sm font-black uppercase tracking-widest rounded-lg flex items-center justify-center gap-3 mx-auto shadow-xl shadow-black/10 hover:bg-black hover:scale-[1.03] transition-all"
              >
                Login Now <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
              </button>
            </motion.div>
          )}
        </div>
      </section>

      {/* ══════════════════ FOOTER CTA ══════════════════ */}
      <section className="w-full bg-[#111] text-white">
        <div className="max-w-6xl mx-auto px-6 py-20 flex flex-col lg:flex-row items-center justify-between gap-10">
          <div>
            <h2 className="text-3xl font-serif font-black mb-3">Ready to Predict Your First Case?</h2>
            <p className="text-slate-400 font-medium max-w-md leading-relaxed">
              Join advocates across India who trust BailPredict for precision legal AI.
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-4 shrink-0">
            <button
              onClick={() => navigate('/predict')}
              className="h-14 px-10 bg-[#C9A84C] text-[#111] font-black text-sm uppercase tracking-widest rounded-lg hover:bg-[#d4b55c] hover:scale-[1.03] transition-all shadow-2xl shadow-[#C9A84C]/20"
            >
              Start Predicting →
            </button>
            <motion.button
              onClick={() => navigate('/signup')}
              whileTap={{ 
                scale: 0.98,
                boxShadow: "0 0 20px 2px rgba(255,255,255,0.2)"
              }}
              className="h-14 px-10 border-2 border-white/10 text-white font-black text-sm uppercase tracking-widest rounded-lg hover:border-white/30 transition-all"
            >
              Create Account
            </motion.button>
          </div>
        </div>
        <div className="border-t border-white/5 max-w-6xl mx-auto px-6 py-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <span className="text-xs text-slate-600 font-medium">© 2026 BailPredict. All rights reserved.</span>
          <span className="text-xs text-slate-600 font-medium">Built for Indian Courts · Powered by AI</span>
        </div>
      </section>
    </div>
  );
};

export default Dashboard;
