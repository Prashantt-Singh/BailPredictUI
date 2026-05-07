import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  ArrowLeft, Scale, Calendar, Gavel, FileText,
  CheckCircle2, XCircle, AlertCircle, Clock, Loader2
} from 'lucide-react';
import { supabase } from '../lib/supabase';

// ── Hearing urgency helper ───────────────────────────────────
const getHearingStatus = (dateStr: string) => {
  if (!dateStr) return null;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const hearing = new Date(dateStr);
  const diffDays = Math.ceil((hearing.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
  if (diffDays < 0)  return { label: 'Overdue',              cls: 'bg-[var(--bg-surface)] text-[var(--text-secondary)] border-[var(--border-primary)]' };
  if (diffDays <= 2)  return { label: `URGENT · ${diffDays}d`, cls: 'bg-red-50 text-red-600 border-red-200' };
  if (diffDays <= 5)  return { label: `SOON · ${diffDays}d`,   cls: 'bg-amber-50 text-amber-600 border-amber-200' };
  return { label: `${diffDays} days away`, cls: 'bg-emerald-50 text-emerald-600 border-emerald-200' };
};

const CaseDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [caseData, setCaseData] = useState<{
    id: string;
    ipc_section: string;
    offense: string;
    court: string;
    likelihood: string;
    bail_probability: number;
    hearing_date: string | null;
    created_at: string;
    case_description?: string | null;
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  const fetchCase = useCallback(async () => {
    if (!id) return;
    console.log('[CaseDetails] fetching id:', id);
    const { data, error } = await supabase
      .from('cases')
      .select('*')
      .eq('id', id)
      .single();
    console.log('[CaseDetails] data:', data, 'error:', error);
    if (error || !data) {
      setNotFound(true);
    } else {
      setCaseData(data);
    }
    setLoading(false);
  }, [id]);

  useEffect(() => {
    window.scrollTo(0, 0);
    if (!id) { setNotFound(true); setLoading(false); return; }
    const timer = window.setTimeout(() => { void fetchCase(); }, 0);
    return () => window.clearTimeout(timer);
  }, [id, fetchCase]);

  // ── Loading ───────────────────────────────────────────────
  if (loading) {
    return (
      <div className="min-h-screen bg-[var(--bg-primary)] flex items-center justify-center">
        <Loader2 size={32} className="text-[#C9A84C] animate-spin" />
      </div>
    );
  }

  // ── Not found ─────────────────────────────────────────────
  if (notFound) {
    return (
      <div className="min-h-screen bg-[var(--bg-primary)] flex flex-col items-center justify-center px-6 text-center">
        <div className="w-20 h-20 rounded-2xl bg-[var(--bg-secondary)] border border-[var(--border-subtle)] shadow-sm flex items-center justify-center mb-6">
          <AlertCircle size={36} className="text-[var(--text-muted)]" />
        </div>
        <h2 className="text-xl font-black text-[var(--text-primary)] mb-2">Case Not Found</h2>
        <p className="text-[var(--text-muted)] font-medium mb-8">
          This case may have been deleted or the link is incorrect.
        </p>
        <button
          onClick={() => navigate('/my-cases')}
          className="px-8 py-3 bg-[var(--btn-primary-bg)] text-[var(--btn-primary-text)] text-sm font-black rounded-xl hover:bg-[var(--btn-primary-hover)] transition-all"
        >
          ← My Cases
        </button>
      </div>
    );
  }

  const isGranted = caseData?.likelihood?.toLowerCase() === 'granted';
  const hearingStatus = caseData?.hearing_date ? getHearingStatus(caseData.hearing_date) : null;
  const ipcShort = caseData?.ipc_section?.split('—')[0]?.replace('Section', '').trim() || caseData?.ipc_section || '—';

  // ── Case detail rows ───────────────────────────────────────
  const rows = [
    { icon: <FileText size={16} className="text-[#C9A84C]" />, label: 'IPC Section',    value: ipcShort },
    { icon: <Scale     size={16} className="text-[#C9A84C]" />, label: 'Offense / Crime', value: caseData?.offense || '—' },
    { icon: <Gavel     size={16} className="text-[#C9A84C]" />, label: 'Court',          value: caseData?.court || '—' },
    { icon: <Clock     size={16} className="text-[#C9A84C]" />, label: 'Saved On',       value: caseData?.created_at ? new Date(caseData.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '—' },
  ];

  return (
    <div className="min-h-screen bg-[var(--bg-primary)] w-full pb-20">

      {/* PAGE HEADER */}
      <div className="border-b border-[var(--border-subtle)] bg-[var(--bg-secondary)] px-6 py-14">
        <div className="max-w-3xl mx-auto">
          <span className="text-[10px] font-black uppercase tracking-[4px] text-[#C9A84C]">Workspace</span>
          <div className="mt-4 flex items-center justify-between gap-4">
            <h1 className="text-4xl font-serif font-black text-[var(--text-primary)]">Case Details</h1>
            <button
              onClick={() => navigate('/my-cases')}
              className="flex items-center gap-2 text-sm font-bold text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors shrink-0"
            >
              <ArrowLeft size={18} /> My Cases
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-6 py-12 space-y-6">

        {/* Prediction Result Card */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-[var(--bg-secondary)] rounded-2xl border border-[var(--border-subtle)] shadow-sm overflow-hidden"
        >
          {/* Top stripe */}
          <div className={`h-1.5 w-full ${isGranted ? 'bg-emerald-400' : 'bg-red-400'}`} />

          <div className="p-8 flex flex-col sm:flex-row sm:items-center gap-6">
            {/* Confidence circle */}
            <div className={`w-24 h-24 rounded-2xl flex flex-col items-center justify-center border-2 shrink-0 ${isGranted ? 'bg-emerald-50 border-emerald-100' : 'bg-red-50 border-red-100'}`}>
              <span className={`text-3xl font-black ${isGranted ? 'text-emerald-600' : 'text-red-500'}`}>
                {Math.round(caseData?.bail_probability ?? 0)}%
              </span>
              <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)] mt-0.5">confidence</span>
            </div>

            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2 flex-wrap">
                {isGranted
                  ? <CheckCircle2 size={18} className="text-emerald-500" />
                  : <XCircle size={18} className="text-red-500" />}
                <span className={`font-black text-2xl ${isGranted ? 'text-emerald-600' : 'text-red-500'}`}>
                  Bail {caseData?.likelihood || '—'}
                </span>
              </div>
              <p className="text-sm text-[var(--text-muted)] font-medium">
                AI-predicted outcome based on case parameters.
              </p>

              {/* Hearing badge */}
              {hearingStatus && caseData?.hearing_date && (
                <div className={`mt-4 inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border text-xs font-black ${hearingStatus.cls}`}>
                  <Calendar size={12} /> Hearing: {new Date(caseData.hearing_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })} — {hearingStatus.label}
                </div>
              )}
            </div>
          </div>
        </motion.div>

        {/* Case Info Rows */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.08 }}
          className="bg-[var(--bg-secondary)] rounded-2xl border border-[var(--border-subtle)] shadow-sm divide-y divide-slate-50"
        >
          {rows.map(({ icon, label, value }) => (
            <div key={label} className="flex items-center gap-4 px-8 py-5">
              <div className="w-8 h-8 rounded-lg bg-[var(--bg-primary)] border border-[var(--border-subtle)] flex items-center justify-center shrink-0">
                {icon}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[10px] font-black uppercase tracking-widest text-[var(--text-muted)] mb-0.5">{label}</p>
                <p className="text-sm font-bold text-[var(--text-primary)] truncate">{value || '—'}</p>
              </div>
            </div>
          ))}

          {/* Hearing date row */}
          {caseData?.hearing_date && (
            <div className="flex items-center gap-4 px-8 py-5">
              <div className="w-8 h-8 rounded-lg bg-[var(--bg-primary)] border border-[var(--border-subtle)] flex items-center justify-center shrink-0">
                <Calendar size={16} className="text-[#C9A84C]" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[10px] font-black uppercase tracking-widest text-[var(--text-muted)] mb-0.5">Hearing Date</p>
                <p className="text-sm font-bold text-[var(--text-primary)]">
                  {new Date(caseData.hearing_date).toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
                </p>
              </div>
            </div>
          )}

          {/* Case description */}
          {caseData?.case_description && (
            <div className="flex items-start gap-4 px-8 py-5">
              <div className="w-8 h-8 rounded-lg bg-[var(--bg-primary)] border border-[var(--border-subtle)] flex items-center justify-center shrink-0 mt-0.5">
                <FileText size={16} className="text-[#C9A84C]" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[10px] font-black uppercase tracking-widest text-[var(--text-muted)] mb-0.5">Case Description</p>
                <p className="text-sm font-medium text-[var(--text-secondary)] leading-relaxed">{caseData.case_description}</p>
              </div>
            </div>
          )}
        </motion.div>

        {/* Action Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.14 }}
          className="flex flex-col sm:flex-row gap-3"
        >
          <button
            onClick={() => navigate('/predict', {
              state: {
                prefilled: true,
                offense_type: caseData?.ipc_section,
                crime: caseData?.offense,
                court: caseData?.court,
              }
            })}
            className="flex-1 h-12 bg-[var(--btn-primary-bg)] text-[var(--btn-primary-text)] text-sm font-black rounded-xl flex items-center justify-center gap-2 hover:bg-[var(--btn-primary-hover)] hover:scale-[1.01] transition-all shadow-lg shadow-black/10"
          >
            Re-run Prediction →
          </button>
          <button
            onClick={() => navigate('/my-cases')}
            className="flex-1 h-12 border border-[var(--border-primary)] text-[var(--text-primary)] text-sm font-black rounded-xl flex items-center justify-center gap-2 hover:border-[var(--btn-primary-bg)] transition-all"
          >
            ← Back to My Cases
          </button>
        </motion.div>

      </div>
    </div>
  );
};

export default CaseDetails;
