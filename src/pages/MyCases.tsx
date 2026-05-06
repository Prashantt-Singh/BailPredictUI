import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FileText, ChevronRight, Clock, Trash2, ArrowRight, Calendar, Edit3, Loader2, AlertCircle } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';

interface CaseRow {
  id: string;
  ipc_section: string;
  offense: string;
  court: string;
  bail_probability: number;
  likelihood: string;
  hearing_date: string | null;
  case_description: string | null;
  created_at: string;
}

const MyCases: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { t, i18n } = useTranslation();
  const [savedCases, setSavedCases] = useState<CaseRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState('');

  // ── Hearing status badge helper ─────────────────────────────
  const getHearingStatus = (dateStr: string) => {
    if (!dateStr) return null;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const hearing = new Date(dateStr);
    const diffDays = Math.ceil((hearing.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    if (diffDays <= 0) return { label: t('cases.overdue'), color: 'bg-[var(--bg-surface)] text-[var(--text-secondary)] border-[var(--border-primary)]' };
    if (diffDays <= 2) return { label: `${t('cases.urgent')} · ${diffDays}d`, color: 'bg-red-50 text-red-600 border-red-200' };
    if (diffDays <= 5) return { label: `${t('cases.soon')} · ${diffDays}d`, color: 'bg-amber-50 text-amber-600 border-amber-200' };
    return { label: `${diffDays} ${t('cases.days')}`, color: 'bg-emerald-50 text-emerald-600 border-emerald-200' };
  };

  useEffect(() => {
    window.scrollTo(0, 0);
    if (user) loadCases();
  }, [user]);

  const loadCases = async () => {
    setLoading(true);
    setFetchError('');
    const { data, error } = await supabase
      .from('cases')
      .select('*')
      .eq('user_id', user!.id)
      .order('created_at', { ascending: false });
    if (error) {
      setFetchError('Failed to load cases. Please refresh and try again.');
    } else {
      setSavedCases(data as CaseRow[]);
    }
    setLoading(false);
  };

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const { error } = await supabase.from('cases').delete().eq('id', id);
    if (!error) {
      setSavedCases(prev => prev.filter(c => c.id !== id));
    }
  };

  const handleViewDetails = (c: CaseRow) => {
    navigate(`/case/${c.id}`);
  };

  return (
    <div className="min-h-screen bg-[var(--bg-primary)] w-full pb-16">

      {/* PAGE HEADER */}
      <div className="border-b border-[var(--border-subtle)] bg-[var(--bg-secondary)] px-6 py-14">
        <div className="max-w-5xl mx-auto">
          <span className="text-[10px] font-black uppercase tracking-[4px] text-[#C9A84C]">{t('cases.header_label')}</span>
          <div className="mt-4 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
            <div>
              <h1 className="text-4xl font-serif font-black text-[var(--text-primary)]">{t('cases.title')}</h1>
              <p className="text-[var(--text-muted)] font-medium mt-2">{t('cases.subtitle')}</p>
            </div>
            <div className="flex gap-3 shrink-0">
              <button
                onClick={() => navigate('/my-drafts')}
                className="h-11 px-6 border border-[var(--border-primary)] text-[var(--text-primary)] text-sm font-black rounded-lg flex items-center gap-2 hover:border-[var(--btn-primary-bg)] transition-all"
              >
                <Edit3 size={15} /> {t('cases.my_drafts')}
              </button>
              <button
                onClick={() => navigate('/predict')}
                className="group h-11 px-6 bg-[var(--btn-primary-bg)] text-[var(--btn-primary-text)] text-sm font-black rounded-lg flex items-center gap-2 hover:bg-[var(--btn-primary-hover)] hover:scale-[1.02] active:scale-95 transition-all shadow-lg shadow-black/10"
              >
                {t('cases.new_prediction')} <ArrowRight size={15} className="group-hover:translate-x-1 transition-transform" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* CASES */}
      <div className="max-w-5xl mx-auto px-6 py-12">

        {/* Loading */}
        {loading && (
          <div className="flex flex-col items-center justify-center py-24">
            <Loader2 size={36} className="text-[#C9A84C] animate-spin mb-4" />
            <p className="text-[var(--text-muted)] font-medium">{t('cases.loading')}</p>
          </div>
        )}

        {/* Error */}
        {!loading && fetchError && (
          <div className="bg-red-50 border border-red-200 rounded-2xl px-6 py-8 flex flex-col items-center text-center">
            <AlertCircle size={32} className="text-red-400 mb-3" />
            <p className="text-red-600 font-bold text-sm mb-4">{fetchError}</p>
            <button
              onClick={loadCases}
              className="px-6 py-2.5 bg-[var(--btn-primary-bg)] text-[var(--btn-primary-text)] text-sm font-black rounded-xl hover:bg-[var(--btn-primary-hover)] transition-all"
            >
              {t('cases.retry')}
            </button>
          </div>
        )}

        {/* Empty state */}
        {!loading && !fetchError && savedCases.length === 0 && (
          <div className="bg-[var(--bg-secondary)] rounded-2xl p-20 text-center border-2 border-dashed border-[var(--border-primary)]">
            <div className="w-20 h-20 rounded-2xl bg-[var(--bg-primary)] border border-[var(--border-subtle)] flex items-center justify-center mx-auto mb-6">
              <FileText size={36} className="text-slate-200" />
            </div>
            <h3 className="text-xl font-black text-[var(--text-primary)] mb-2">{t('cases.empty_title')}</h3>
            <p className="text-[var(--text-muted)] font-medium mb-8 max-w-sm mx-auto leading-relaxed">
              {t('cases.empty_sub')}
            </p>
            <button
              onClick={() => navigate('/predict')}
              className="px-10 py-4 bg-[var(--btn-primary-bg)] text-[var(--btn-primary-text)] text-sm font-black rounded-xl hover:bg-[var(--btn-primary-hover)] hover:scale-[1.02] transition-all shadow-xl shadow-black/10"
            >
              {t('cases.start_predicting')} →
            </button>
          </div>
        )}

        {/* Cases list */}
        {!loading && !fetchError && savedCases.length > 0 && (
          <div className="space-y-4">
            {savedCases.map((c, i) => {
              const isGranted = String(c.likelihood || '').toLowerCase() === 'granted' || c.likelihood === 'HIGH';
              const hearingStatus = getHearingStatus(c.hearing_date ?? '');
              const ipcShort = c.ipc_section?.split('—')[0]?.replace('Section', '').trim() || c.ipc_section;
              return (
                <motion.div
                  key={c.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.04 }}
                  className="group bg-[var(--bg-secondary)] rounded-xl border border-[var(--border-subtle)] shadow-sm hover:shadow-md hover:border-[var(--border-primary)] transition-all relative overflow-hidden"
                >
                  {/* Left status stripe */}
                  <div className={`absolute left-0 top-0 h-full w-1 ${isGranted ? 'bg-emerald-400' : 'bg-red-400'}`} />

                  <div className="px-6 py-5 pl-7 flex flex-col md:flex-row md:items-center justify-between gap-4">

                    {/* Left: case info */}
                    <div className="flex items-center gap-5">
                      <div className={`hidden sm:flex w-14 h-14 rounded-xl items-center justify-center text-lg font-black border-2 shrink-0 ${isGranted ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-red-50 text-red-500 border-red-100'}`}>
                        {Math.round(c.bail_probability ?? 0)}%
                      </div>
                      <div>
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                          <span className={`text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded-md border ${isGranted ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-red-50 text-red-500 border-red-100'}`}>
                            {c.likelihood}
                          </span>
                          {hearingStatus && (
                            <span className={`text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded-md border flex items-center gap-1 ${hearingStatus.color}`}>
                              <Calendar size={10} /> {hearingStatus.label}
                            </span>
                          )}
                          <span className="text-xs font-medium text-[var(--text-muted)] flex items-center gap-1">
                            <Clock size={11} /> {new Date(c.created_at).toLocaleDateString(i18n.language === 'hi' ? 'hi-IN' : 'en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                          </span>
                        </div>
                        <h3 className="text-base font-black text-[var(--text-primary)]">{c.offense}</h3>
                        <p className="text-xs text-[var(--text-muted)] font-medium mt-0.5">
                          {ipcShort} · {c.court}
                          {c.hearing_date && (
                            <span className="ml-2">· {t('cases.hearing')}: {new Date(c.hearing_date).toLocaleDateString(i18n.language === 'hi' ? 'hi-IN' : 'en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                          )}
                        </p>
                      </div>
                    </div>

                    {/* Right: actions */}
                    <div className="flex items-center gap-3 pl-0">
                      <button
                        onClick={() => handleViewDetails(c)}
                        className="h-10 px-6 bg-[var(--btn-primary-bg)] text-[var(--btn-primary-text)] text-xs font-black uppercase tracking-widest rounded-lg hover:bg-[var(--btn-primary-hover)] transition-all flex items-center gap-1.5 shrink-0"
                      >
                        {t('cases.details_btn')} <ChevronRight size={14} />
                      </button>
                      <button
                        onClick={(e) => handleDelete(c.id, e)}
                        className="w-10 h-10 rounded-lg border border-[var(--border-primary)] flex items-center justify-center text-slate-300 hover:text-red-500 hover:border-red-200 hover:bg-red-50 transition-all"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default MyCases;
