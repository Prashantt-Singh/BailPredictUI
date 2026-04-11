import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { FileText, Copy, Download, ArrowLeft, Check, Loader2, BookmarkCheck, Save } from 'lucide-react';
import { jsPDF } from 'jspdf';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';

const generateBailApplication = (caseData: any, argumentsList: any[]) => {
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

  const caseData: any = location.state?.caseData;
  const argumentsList: any[] = location.state?.arguments || [];

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
    <div className="min-h-screen bg-[#F8F9FB] w-full pb-16">
      <div className="max-w-4xl mx-auto px-6 py-12">

        {/* Header */}
        <div className="flex items-center justify-between mb-10">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 text-sm font-bold text-slate-400 hover:text-[#111] transition-colors"
          >
            <ArrowLeft size={18} /> Back
          </button>
          <div className="text-right">
            <span className="text-[10px] font-black uppercase tracking-[4px] text-[#C9A84C]">Document</span>
            <h1 className="text-2xl font-serif font-black text-[#111] mt-1">Bail Application Draft</h1>
          </div>
        </div>

        {/* Document Card */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
          {/* Toolbar */}
          <div className="flex flex-wrap items-center justify-between px-6 py-4 border-b border-slate-100 gap-3">
            <div className="flex items-center gap-2">
              <FileText size={18} className="text-[#C9A84C]" />
              <span className="font-black text-[#111] text-sm">Legal Draft Editor</span>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <button
                onClick={handleCopy}
                disabled={loading}
                className="h-9 px-4 border border-slate-200 text-[#111] text-xs font-black rounded-lg flex items-center gap-1.5 hover:border-[#111] transition-all disabled:opacity-40"
              >
                {copied ? <Check size={13} className="text-[#C9A84C]" /> : <Copy size={13} />}
                {copied ? 'Copied' : 'Copy'}
              </button>
              {/* Save Draft — only for logged-in users */}
              {user && (
                <button
                  onClick={handleSaveDraft}
                  disabled={loading || draftSaved || savingDraft}
                  className="h-9 px-4 border border-slate-200 text-[#111] text-xs font-black rounded-lg flex items-center gap-1.5 hover:border-[#111] transition-all disabled:opacity-50"
                >
                  {savingDraft ? (
                    <Loader2 size={13} className="animate-spin" />
                  ) : draftSaved ? (
                    <BookmarkCheck size={13} className="text-[#C9A84C]" />
                  ) : (
                    <Save size={13} />
                  )}
                  {draftSaved ? 'Draft Saved' : savingDraft ? 'Saving…' : 'Save Draft'}
                </button>
              )}
              <button
                onClick={handleDownloadPDF}
                disabled={loading}
                className="h-9 px-4 bg-[#C9A84C] text-[#111] text-xs font-black rounded-lg flex items-center gap-1.5 hover:bg-[#b09341] transition-all disabled:opacity-40 shadow-sm"
              >
                <Download size={13} /> Download PDF
              </button>
            </div>
          </div>

          {/* Document Area */}
          <div className="bg-slate-50 p-8 flex justify-center">
            {loading ? (
              <div className="w-full max-w-2xl bg-white shadow-sm rounded-xl min-h-[500px] flex flex-col items-center justify-center text-center p-12">
                <Loader2 size={40} className="text-[#C9A84C] animate-spin mb-5" />
                <h3 className="text-lg font-black text-[#111] mb-2">Generating draft…</h3>
                <p className="text-slate-400 text-sm font-medium">Drafting formal bail application clauses.</p>
              </div>
            ) : (
              <div className="w-full max-w-3xl bg-white shadow-sm rounded-xl">
                <textarea
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  className="w-full h-[750px] p-12 text-slate-800 focus:outline-none resize-y rounded-xl"
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
              <span className="text-sm font-bold text-emerald-700">Draft saved to your account.</span>
            </div>
            <button
              onClick={() => navigate('/my-drafts')}
              className="text-xs font-black text-emerald-600 hover:text-emerald-800 transition-colors"
            >
              View My Drafts →
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default BailApplication;
