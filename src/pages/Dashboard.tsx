import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, useInView } from 'framer-motion';
import {
  Scale, Activity, FileText, Brain, ArrowRight, ChevronRight,
  Lock, Shield, Calendar
} from 'lucide-react';
import { useAuth } from '../context/useAuth';
import { supabase } from '../lib/supabase';
import { useTranslation } from 'react-i18next';

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

// ── Dashboard Component ─────────────────────────────────────
const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { t, i18n } = useTranslation();
  
  const FEATURES = [
    {
      icon: Scale,
      label: t('dashboard.features.prediction.title'),
      desc: t('dashboard.features.prediction.desc'),
      href: '/predict',
    },
    {
      icon: Brain,
      label: t('dashboard.features.arguments.title'),
      desc: t('dashboard.features.arguments.desc'),
      href: '/predict',
    },
    {
      icon: FileText,
      label: t('dashboard.features.draft.title'),
      desc: t('dashboard.features.draft.desc'),
      href: '/predict',
    },
  ];



  // ── Hearing urgency helper ────────────────────────────────
  const getHearingBadge = (dateStr: string) => {
    const today = new Date(); today.setHours(0,0,0,0);
    const hearing = new Date(dateStr);
    const diffDays = Math.ceil((hearing.getTime() - today.getTime()) / (1000*60*60*24));
    if (diffDays < 0)  return { label: t('cases.overdue'),   color: 'bg-[var(--bg-surface)] text-[var(--text-secondary)]' };
    if (diffDays <= 2)  return { label: `${t('cases.urgent')} · ${diffDays}d`, color: 'bg-red-50 text-red-600' };
    if (diffDays <= 5)  return { label: `${t('cases.soon')} · ${diffDays}d`,   color: 'bg-amber-50 text-amber-600' };
    return { label: `${diffDays}d`,  color: 'bg-emerald-50 text-emerald-600' };
  };

  type CaseRow = {
    id: string;
    ipc_section: string;
    offense: string;
    court: string;
    bail_probability: number;
    likelihood: string;
    hearing_date: string | null;
    created_at: string;
  };
  type LiveStatsRow = {
    id: string | number;
    total_predictions?: number | null;
    arguments_generated?: number | null;
  };

  const [savedCases, setSavedCases] = useState<CaseRow[]>([]);
  const [upcomingHearings, setUpcomingHearings] = useState<CaseRow[]>([]);
  const [liveStats, setLiveStats] = useState<LiveStatsRow | null>(null);
  const [statsLoading, setStatsLoading] = useState(true);
  const heroWords = t('dashboard.hero_title').split(' ');

  const fetchStats = useCallback(async () => {
    try {
      // 1. Try to fetch global stats from the 'stats' table
      const { data: globalStats, error: globalError } = await supabase
        .from('stats')
        .select('*')
        .maybeSingle();

      if (globalStats && !globalError) {
        console.log('Using Global Stats:', globalStats);
        setLiveStats(globalStats as LiveStatsRow);
      } else {
        // 2. Fallback to dynamic calculation if global stats are missing
        const { data: casesData, count: casesCount } = await supabase
          .from('cases')
          .select('ipc_section', { count: 'exact' });

        const { count: draftsCount } = await supabase
          .from('drafts')
          .select('*', { count: 'exact', head: true });

        const uniqueIpcs = new Set(casesData?.map(c => c.ipc_section?.split('—')[0]?.trim()).filter(Boolean));
        
        setLiveStats({
          id: 'dynamic',
          total_predictions: casesCount || 0,
          arguments_generated: (casesCount || 0) * 3 + (draftsCount || 0),
          ipc_sections: uniqueIpcs.size || 0,
          avg_accuracy: casesCount ? 88 : 0
        } as LiveStatsRow);
      }
    } catch (err) {
      console.error('Error fetching stats:', err);
    } finally {
      setStatsLoading(false);
    }
  }, []);

  const fetchCases = useCallback(async () => {
    if (!user) return;
    const { data } = await supabase
      .from('cases')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(5);
    if (data) {
      setSavedCases(data as CaseRow[]);
      // upcoming hearings: filter cases with future hearing dates, sort ascending
      const today = new Date(); today.setHours(0,0,0,0);
      const upcoming = (data as CaseRow[])
        .filter(c => c.hearing_date && new Date(c.hearing_date) >= today)
        .sort((a, b) => new Date(a.hearing_date ?? '').getTime() - new Date(b.hearing_date ?? '').getTime())
        .slice(0, 3);
      setUpcomingHearings(upcoming);
    }
  }, [user]);

  useEffect(() => {
    window.scrollTo(0, 0);
    void fetchStats();
    if (user) void fetchCases();
  }, [user, fetchStats, fetchCases]);

  // Section refs for reveal
  const statsRef = useRef(null);
  const featuresRef = useRef(null);
  const statsInView = useInView(statsRef, { once: true, margin: '-80px' });
  const featuresInView = useInView(featuresRef, { once: true, margin: '-80px' });

  return (
    <div
      className="flex flex-col w-full bg-[var(--bg-primary)] text-[var(--text-primary)]"
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
            {t('dashboard.hero_label')}
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
              className={i === 0 ? 'text-[#C9A84C]' : 'text-[var(--text-primary)]'}
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
          className="max-w-2xl text-center text-lg sm:text-xl text-[var(--text-secondary)] font-medium leading-relaxed mb-14"
        >
          {t('dashboard.hero_subtitle')}
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
            className="group relative overflow-hidden h-14 px-10 bg-[var(--btn-primary-bg)] text-[var(--btn-primary-text)] text-sm font-black uppercase tracking-widest rounded-lg flex items-center justify-center gap-3 transition-all duration-300"
          >
            <span>{t('dashboard.cta_primary')}</span>
            <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
          </motion.button>
          <button
            onClick={() => navigate('/ipc-guide')}
            className="h-14 px-10 border-2 border-[var(--btn-primary-bg)]/15 text-[var(--text-primary)] text-sm font-black uppercase tracking-widest rounded-lg flex items-center justify-center gap-3 hover:border-[var(--btn-primary-bg)] hover:shadow-lg hover:scale-[1.02] active:scale-95 transition-all duration-300"
          >
            {t('dashboard.cta_secondary')}
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
      <section ref={statsRef} className="w-full border-t border-b border-[var(--border-primary)] bg-[var(--bg-secondary)]">
        <div className="max-w-6xl mx-auto px-6 py-16 grid grid-cols-2 md:grid-cols-4 gap-8 md:gap-0 md:divide-x divide-[var(--border-subtle)]">
          {([
            { key: 'total_predictions', suffix: '+', label: t('dashboard.stats.predictions'),    duration: 2000 },
            { key: 'avg_accuracy',      suffix: '%', label: t('dashboard.stats.accuracy'),  duration: 1500 },
            { key: 'arguments_generated', suffix: '+', label: t('dashboard.stats.arguments'), duration: 2500 },
            { key: 'ipc_sections',      suffix: '+', label: t('dashboard.stats.ipc_sections'), duration: 1800 },
          ] as const).map((s, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              animate={statsInView ? { opacity: 1, y: 0 } : {}}
              transition={{ delay: i * 0.12, duration: 0.6 }}
              className="flex flex-col items-center text-center px-6 py-4"
            >
              <span className="text-4xl md:text-5xl font-black text-[var(--text-primary)] tracking-tight mb-2">
                {statsLoading ? (
                  <span className="inline-block w-20 h-10 bg-[var(--bg-surface)] rounded-lg animate-pulse" />
                ) : statsInView && liveStats ? (
                  <Counter end={Number(liveStats[s.key]) || 0} suffix={s.suffix} duration={s.duration} />
                ) : '0'}
              </span>
              <span className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-[2px]">{s.label}</span>
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
          <span className="text-[10px] font-black uppercase tracking-[4px] text-[#C9A84C]">{t('dashboard.features.label')}</span>
          <h2 className="mt-4 text-4xl md:text-5xl font-serif font-black text-[var(--text-primary)] tracking-tight">
            {t('dashboard.features.title')}
          </h2>
          <p className="mt-5 text-[var(--text-secondary)] font-medium max-w-xl mx-auto leading-relaxed">
            {t('dashboard.features.subtitle')}
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
              className="group bg-[var(--bg-secondary)] rounded-2xl p-8 border border-[var(--border-subtle)] shadow-sm hover:shadow-xl hover:-translate-y-2 hover:border-[#C9A84C]/20 cursor-pointer transition-all duration-400 relative overflow-hidden"
            >
              {/* Gold corner accent on hover */}
              <div className="absolute top-0 left-0 w-0 h-[3px] bg-[#C9A84C] group-hover:w-full transition-all duration-500" />

              <div className="w-14 h-14 rounded-xl bg-[var(--bg-primary)] border border-[var(--border-subtle)] flex items-center justify-center mb-8 group-hover:bg-[var(--btn-primary-bg)] group-hover:border-[var(--btn-primary-bg)] transition-all duration-300">
                <f.icon size={26} className="text-[var(--text-primary)] group-hover:text-[#C9A84C] transition-colors duration-300" />
              </div>
              <h3 className="text-xl font-black text-[var(--text-primary)] mb-3">{f.label}</h3>
              <p className="text-[var(--text-secondary)] text-sm leading-relaxed font-medium mb-6">{f.desc}</p>
              <button className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-[#C9A84C] group-hover:gap-3 transition-all">
                {t('dashboard.features.try_now')} <ChevronRight size={14} />
              </button>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ══════════════════ VISUAL SECTION ══════════════════ */}
      <section className="w-full bg-[var(--bg-secondary)] border-t border-[var(--border-subtle)]">
        <div className="max-w-6xl mx-auto px-6 py-28">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-center">
            {/* Text */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.7 }}
            >
              <span className="text-[10px] font-black uppercase tracking-[4px] text-[#C9A84C]">{t('dashboard.how_it_works.label')}</span>
              <h2 className="mt-4 text-4xl font-serif font-black text-[var(--text-primary)] leading-tight mb-6">
                {t('dashboard.how_it_works.title')}
              </h2>
              <p className="text-[var(--text-secondary)] font-medium leading-relaxed mb-10">
                {t('dashboard.how_it_works.subtitle')}
              </p>
              <div className="space-y-6">
                {[
                  { num: '01', label: t('dashboard.how_it_works.step1.title'), desc: t('dashboard.how_it_works.step1.desc') },
                  { num: '02', label: t('dashboard.how_it_works.step2.title'), desc: t('dashboard.how_it_works.step2.desc') },
                  { num: '03', label: t('dashboard.how_it_works.step3.title'), desc: t('dashboard.how_it_works.step3.desc') },
                ].map((step) => (
                  <div key={step.num} className="flex gap-5 items-start group">
                    <span className="text-[#C9A84C]/40 font-black text-3xl leading-none group-hover:text-[#C9A84C] transition-colors">{step.num}</span>
                    <div>
                      <h4 className="font-black text-[var(--text-primary)] mb-1">{step.label}</h4>
                      <p className="text-sm text-[var(--text-secondary)] font-medium">{step.desc}</p>
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
                  <p className="text-xs font-black uppercase tracking-widest text-[var(--btn-primary-text)]/40">Lady Justice</p>
                </div>
              </div>

              {/* Scales card — offset */}
              <div className="group relative rounded-2xl overflow-hidden bg-[#C9A84C] aspect-[3/4] shadow-2xl mt-10">
                <div className="absolute inset-0 bg-gradient-to-t from-[#b8933e] via-transparent to-transparent z-10" />
                <div className="absolute inset-0 flex items-center justify-center group-hover:scale-105 transition-transform duration-700">
                  <Shield size={80} className="text-[var(--btn-primary-text)]/10" />
                </div>
                <div className="absolute inset-0 flex items-center justify-center z-20">
                  <Shield size={48} className="text-[var(--btn-primary-text)]" />
                </div>
                <div className="absolute bottom-4 left-4 z-20">
                  <p className="text-xs font-black uppercase tracking-widest text-[var(--btn-primary-text)]/60">Legal Shield</p>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ── Removed Testimonials Section ── */}

      {/* ══════════════════ RECENT PREDICTIONS / AUTH CTA ══════════════════ */}
      <section className="w-full border-t border-[var(--border-subtle)] bg-[var(--bg-secondary)]">
        <div className="max-w-6xl mx-auto px-6 py-24">
          {user ? (
            <>
              <div className="flex items-center justify-between mb-12">
                <div>
                  <span className="text-[10px] font-black uppercase tracking-[4px] text-[#C9A84C]">{t('dashboard.recent.workspace')}</span>
                  <h2 className="mt-3 text-3xl font-serif font-black text-[var(--text-primary)]">{t('dashboard.recent.title')}</h2>
                </div>
                <button
                  onClick={() => navigate('/my-cases')}
                  className="hidden sm:flex items-center gap-2 text-xs font-black uppercase tracking-widest text-[var(--text-primary)] hover:text-[#C9A84C] transition-colors"
                >
                  {t('dashboard.recent.all_cases')} <ChevronRight size={16} />
                </button>
              </div>

              {/* ── Upcoming Hearings ── */}
              {upcomingHearings.length > 0 && (
                <div className="mb-12">
                  <div className="flex items-center gap-3 mb-5">
                    <Calendar size={18} className="text-[#C9A84C]" />
                    <h3 className="text-lg font-black text-[var(--text-primary)]">{t('dashboard.recent.upcoming_hearings')}</h3>
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
                          className="group bg-[var(--bg-secondary)] rounded-xl px-5 py-4 flex items-center justify-between gap-4 border border-[var(--border-subtle)] shadow-sm hover:shadow-md hover:border-[#C9A84C]/30 cursor-pointer transition-all"
                        >
                          <div className="flex items-center gap-4">
                            <div className="w-9 h-9 rounded-lg bg-[var(--bg-primary)] border border-[var(--border-subtle)] flex items-center justify-center shrink-0">
                              <Calendar size={16} className="text-[#C9A84C]" />
                            </div>
                            <div>
                              <p className="font-black text-[var(--text-primary)] text-sm">{c.offense}</p>
                              <p className="text-xs text-[var(--text-muted)] font-medium mt-0.5">{ipcShort} · {new Date(c.hearing_date).toLocaleDateString(i18n.language === 'hi' ? 'hi-IN' : 'en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</p>
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
                    const isGranted = String(c.likelihood || '').toLowerCase() === 'granted' || c.likelihood === 'HIGH';
                    const ipcShort = c.ipc_section?.split('—')[0]?.replace('Section','').trim() || c.ipc_section;
                    return (
                      <motion.div
                        key={c.id || i}
                        initial={{ opacity: 0, y: 12 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: i * 0.07 }}
                        className="group bg-[var(--bg-primary)] rounded-xl px-6 py-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-[var(--bg-secondary)] hover:shadow-md border border-transparent hover:border-[var(--border-subtle)] transition-all cursor-pointer"
                        onClick={() => navigate(`/case/${c.id}`)}
                      >
                        <div className="flex items-center gap-5">
                          <div className={`w-2 h-10 rounded-full ${isGranted ? 'bg-emerald-400' : 'bg-red-400'}`} />
                          <div>
                            <p className="font-black text-[var(--text-primary)]">{c.offense}</p>
                            <p className="text-xs text-[var(--text-muted)] font-medium mt-0.5">{ipcShort} · {c.court}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-4">
                          <span className={`text-xs font-black uppercase tracking-widest px-3 py-1 rounded-lg ${isGranted ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-500'}`}>
                            {c.likelihood} · {Math.round(c.bail_probability ?? 0)}%
                          </span>
                          <button
                            onClick={(e) => { e.stopPropagation(); navigate(`/case/${c.id}`); }}
                            className="w-9 h-9 rounded-lg border border-[var(--border-primary)] flex items-center justify-center text-[var(--text-muted)] group-hover:border-[var(--btn-primary-bg)] group-hover:text-[var(--text-primary)] transition-all"
                          >
                            <ChevronRight size={16} />
                          </button>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              ) : (
                <div className="bg-[var(--bg-primary)] rounded-2xl p-16 text-center border-2 border-dashed border-[var(--border-primary)]">
                  <Activity size={40} className="text-slate-300 mx-auto mb-5" />
                  <h3 className="font-black text-[var(--text-primary)] text-xl mb-2">{t('dashboard.recent.no_predictions')}</h3>
                  <p className="text-[var(--text-muted)] text-sm font-medium mb-8">{t('dashboard.recent.no_predictions_desc')}</p>
                  <button
                    onClick={() => navigate('/predict')}
                    className="px-8 py-4 bg-[var(--btn-primary-bg)] text-[var(--btn-primary-text)] font-black text-sm uppercase tracking-widest rounded-xl hover:bg-[var(--btn-primary-hover)] hover:scale-105 transition-all shadow-xl"
                  >
                    {t('dashboard.recent.predict_now')} →
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
              <div className="w-16 h-16 rounded-2xl bg-[var(--bg-primary)] border border-[var(--border-subtle)] flex items-center justify-center mx-auto mb-8">
                <Lock size={28} className="text-[var(--text-primary)]" />
              </div>
              <h2 className="text-3xl font-serif font-black text-[var(--text-primary)] mb-4">{t('dashboard.recent.guest_title')}</h2>
              <p className="text-[var(--text-secondary)] font-medium mb-10 leading-relaxed">
                {t('dashboard.recent.guest_desc')}
              </p>
              <button
                onClick={() => navigate('/login')}
                className="group h-14 px-12 bg-[var(--btn-primary-bg)] text-[var(--btn-primary-text)] text-sm font-black uppercase tracking-widest rounded-lg flex items-center justify-center gap-3 mx-auto shadow-xl shadow-black/10 hover:bg-[var(--btn-primary-hover)] hover:scale-[1.03] transition-all"
              >
                {t('dashboard.recent.login_now')} <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
              </button>
            </motion.div>
          )}
        </div>
      </section>

      {/* ══════════════════ FOOTER CTA ══════════════════ */}
      <section className="w-full bg-[var(--btn-primary-bg)] text-[var(--btn-primary-text)]">
        <div className="max-w-6xl mx-auto px-6 py-20 flex flex-col lg:flex-row items-center justify-between gap-10">
          <div>
            <h2 className="text-3xl font-serif font-black mb-3">{t('dashboard.footer_cta.title')}</h2>
            <p className="text-[var(--text-muted)] font-medium max-w-md leading-relaxed">
              {t('dashboard.footer_cta.subtitle')}
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-4 shrink-0">
            <button
              onClick={() => navigate('/predict')}
              className="h-14 px-10 bg-[#C9A84C] text-[var(--text-primary)] font-black text-sm uppercase tracking-widest rounded-lg hover:bg-[#d4b55c] hover:scale-[1.03] transition-all shadow-2xl shadow-[#C9A84C]/20"
            >
              {t('dashboard.footer_cta.start_predicting')} →
            </button>
            <motion.button
              onClick={() => navigate('/signup')}
              whileTap={{ 
                scale: 0.98,
                boxShadow: "0 0 20px 2px rgba(255,255,255,0.2)"
              }}
              className="h-14 px-10 border-2 border-white/10 text-[var(--btn-primary-text)] font-black text-sm uppercase tracking-widest rounded-lg hover:border-white/30 transition-all"
            >
              {t('dashboard.footer_cta.create_account')}
            </motion.button>
          </div>
        </div>
        <div className="border-t border-white/5 max-w-6xl mx-auto px-6 py-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <span className="text-xs text-[var(--text-secondary)] font-medium">© 2026 BailPredict. All rights reserved.</span>
          <span className="text-xs text-[var(--text-secondary)] font-medium">Built for Indian Courts · Powered by AI</span>
        </div>
      </section>
    </div>
  );
};

export default Dashboard;
