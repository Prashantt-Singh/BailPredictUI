import React, { useMemo, useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { FileText, Copy, Download, ArrowLeft, Check, Loader2, BookmarkCheck, Save } from 'lucide-react';
import { jsPDF } from 'jspdf';
import { useTranslation } from 'react-i18next';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/useAuth';

type BailArgument = { argument: string };
type CaseData = {
  ipc?: string;
  crime?: string;
  court?: string;
  bail_type?: string;
  offense?: string;
  state?: string;
  custody?: string | number;
  first_offender?: string;
  prior_record?: string;
  age?: string | number;
  crime_severity?: string | number;
};

const generateBailApplication = (caseData: CaseData, argumentsList: BailArgument[]) => {
  const today = new Date().toLocaleDateString('en-IN');
  const bailSec = caseData.bail_type === 'Anticipatory' ? '438' : '437/439';
  const argsText = argumentsList.map((arg, i) => `${i + 1}. ${arg.argument}`).join('\n\n');

  return `IN THE COURT OF ${caseData.court ? caseData.court.toUpperCase() : '__________'}

Bail Application under Section ${bailSec} CrPC

Case Details:
* Offense: Section ${caseData.ipc} - ${caseData.crime}
* Court: ${caseData.court}
* State: __________

Most Respectfully Submitted:

${argsText}

PRAYER:
It is therefore prayed that this Hon'ble Court may kindly grant bail to the applicant in the interest of justice.

Date: ${today}
Place: __________`;
};

const BailApplication: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { t } = useTranslation();

  const caseData = useMemo<CaseData | null>(() => {
    const state = location.state as { caseData?: CaseData } | null;
    return state?.caseData ?? null;
  }, [location.state]);

  const argumentsList = useMemo<BailArgument[]>(() => {
    const state = location.state as { arguments?: BailArgument[] } | null;
    return state?.arguments ?? [];
  }, [location.state]);

  const [draft, setDraft] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [draftSaved, setDraftSaved] = useState(false);
  const [savingDraft, setSavingDraft] = useState(false);

  useEffect(() => {
    window.scrollTo(0, 0);
    if (!caseData || argumentsList.length === 0) {
      navigate('/predict');
      return;
    }
    const timer = setTimeout(() => {
      setDraft(generateBailApplication(caseData, argumentsList));
      setLoading(false);
    }, 1500);
    return () => clearTimeout(timer);
  }, [caseData, argumentsList, navigate]);

  const handleCopy = () => {
    if (!draft) return;
    navigator.clipboard.writeText(draft);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadPDF = () => {
    const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
    doc.setFont('times', 'normal');
    doc.setFontSize(12);
    const margin = 20;
    const maxLineWidth = doc.internal.pageSize.getWidth() - margin * 2;
    const textLines = doc.splitTextToSize(draft, maxLineWidth);
    doc.text(textLines, margin, margin + 10);
    doc.save('bail_application.pdf');
  };

  const handleSaveDraft = async () => {
    if (!draft || !user || draftSaved) return;
    setSavingDraft(true);
    console.log('[SaveDraft] user_id:', user.id, '| draft length:', draft.length);
    const { error } = await supabase.from('drafts').insert([{
      user_id: user.id,
      case_id: null,           // no linked case from this page
      draft_text: draft,
    }]);
    if (error) {
      console.error('[SaveDraft] insert error:', error);
    } else {
      setDraftSaved(true);
    }
    setSavingDraft(false);
  };

  if (!caseData) return null;

  return (
    <div className="min-h-screen bg-[var(--bg-primary)] w-full pb-16">
      <div className="max-w-4xl mx-auto px-6 py-12">

        {/* Header */}
        <div className="flex items-center justify-between mb-10">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 text-sm font-bold text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors"
          >
            <ArrowLeft size={18} /> {t('draft.back')}
          </button>
          <div className="text-right">
            <span className="text-[10px] font-black uppercase tracking-[4px] text-[#C9A84C]">{t('draft.header_label')}</span>
            <h1 className="text-2xl font-serif font-black text-[var(--text-primary)] mt-1">{t('draft.title')}</h1>
          </div>
        </div>

        {/* Document Card */}
        <div className="bg-[var(--bg-secondary)] rounded-2xl shadow-sm border border-[var(--border-subtle)] overflow-hidden">
          {/* Toolbar */}
          <div className="flex flex-wrap items-center justify-between px-6 py-4 border-b border-[var(--border-subtle)] gap-3">
            <div className="flex items-center gap-2">
              <FileText size={18} className="text-[#C9A84C]" />
              <span className="font-black text-[var(--text-primary)] text-sm">{t('draft.editor')}</span>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <button
                onClick={handleCopy}
                disabled={loading}
                className="h-9 px-4 border border-[var(--border-primary)] text-[var(--text-primary)] text-xs font-black rounded-lg flex items-center gap-1.5 hover:border-[var(--btn-primary-bg)] transition-all disabled:opacity-40"
              >
                {copied ? <Check size={13} className="text-[#C9A84C]" /> : <Copy size={13} />}
                {copied ? t('draft.copied') : t('draft.copy')}
              </button>
              {/* Save Draft — only for logged-in users */}
              {user && (
                <button
                  onClick={handleSaveDraft}
                  disabled={loading || draftSaved || savingDraft}
                  className="h-9 px-4 border border-[var(--border-primary)] text-[var(--text-primary)] text-xs font-black rounded-lg flex items-center gap-1.5 hover:border-[var(--btn-primary-bg)] transition-all disabled:opacity-50"
                >
                  {savingDraft ? (
                    <Loader2 size={13} className="animate-spin" />
                  ) : draftSaved ? (
                    <BookmarkCheck size={13} className="text-[#C9A84C]" />
                  ) : (
                    <Save size={13} />
                  )}
                  {draftSaved ? t('draft.saved') : savingDraft ? t('draft.saving') : t('draft.save')}
                </button>
              )}
              <button
                onClick={handleDownloadPDF}
                disabled={loading}
                className="h-9 px-4 bg-[#C9A84C] text-[var(--text-primary)] text-xs font-black rounded-lg flex items-center gap-1.5 hover:bg-[#b09341] transition-all disabled:opacity-40 shadow-sm"
              >
                <Download size={13} /> {t('draft.download_pdf')}
              </button>
            </div>
          </div>

          {/* Document Area */}
          <div className="bg-[var(--bg-surface)] p-8 flex justify-center">
            {loading ? (
              <div className="w-full max-w-2xl bg-[var(--bg-secondary)] shadow-sm rounded-xl min-h-[500px] flex flex-col items-center justify-center text-center p-12">
                <Loader2 size={40} className="text-[#C9A84C] animate-spin mb-5" />
                <h3 className="text-lg font-black text-[var(--text-primary)] mb-2">{t('draft.generating')}</h3>
                <p className="text-[var(--text-muted)] text-sm font-medium">{t('draft.generating_sub')}</p>
              </div>
            ) : (
              <div className="w-full max-w-3xl bg-[var(--bg-secondary)] shadow-sm rounded-xl relative">
                <textarea
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  className="w-full h-[750px] p-12 text-[var(--text-primary)] focus:outline-none resize-y rounded-xl"
                  style={{
                    fontFamily: '"Times New Roman", Times, serif',
                    fontSize: '15px',
                    lineHeight: '1.9',
                    whiteSpace: 'pre-wrap'
                  }}
                  spellCheck={false}
                />
              </div>
            )}
          </div>
        </div>

        {/* "Saved" notification bar */}
        {draftSaved && (
          <div className="mt-5 bg-emerald-50 border border-emerald-100 rounded-xl px-6 py-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <BookmarkCheck size={20} className="text-emerald-600" />
              <span className="text-sm font-bold text-emerald-700">{t('draft.draft_saved_msg')}</span>
            </div>
            <button
              onClick={() => navigate('/my-drafts')}
              className="text-xs font-black text-emerald-600 hover:text-emerald-800 transition-colors"
            >
              {t('draft.view_drafts')} →
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default BailApplication;
