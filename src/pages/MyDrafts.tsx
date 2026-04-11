import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { FileText, Download, Copy, Trash2, Edit3, Check, ArrowLeft, ChevronRight, Loader2 } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { jsPDF } from 'jspdf';

interface Draft {
  id: string;
  case_title: string;
  draft_text: string;
  created_at: string;
}

const MyDrafts: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [drafts, setDrafts] = useState<Draft[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDraft, setSelectedDraft] = useState<Draft | null>(null);
  const [editedText, setEditedText] = useState('');
  const [saving, setSaving] = useState(false);
  const [copied, setCopied] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  useEffect(() => {
    window.scrollTo(0, 0);
    if (user) fetchDrafts();
  }, [user]);

  const fetchDrafts = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('drafts')
      .select('*')
      .eq('user_id', user!.id)
      .order('created_at', { ascending: false });
    if (!error && data) setDrafts(data as Draft[]);
    setLoading(false);
  };

  const handleOpen = (draft: Draft) => {
    setSelectedDraft(draft);
    setEditedText(draft.draft_text);
  };

  const handleSaveEdit = async () => {
    if (!selectedDraft) return;
    setSaving(true);
    const { error } = await supabase
      .from('drafts')
      .update({ draft_text: editedText })
      .eq('id', selectedDraft.id);
    if (!error) {
      setDrafts(prev => prev.map(d => d.id === selectedDraft.id ? { ...d, draft_text: editedText } : d));
      setSelectedDraft(prev => prev ? { ...prev, draft_text: editedText } : null);
    }
    setSaving(false);
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from('drafts').delete().eq('id', id);
    if (!error) {
      setDrafts(prev => prev.filter(d => d.id !== id));
      if (selectedDraft?.id === id) setSelectedDraft(null);
    }
    setDeleteConfirm(null);
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(editedText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadPDF = () => {
    const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
    doc.setFont('times', 'normal');
    doc.setFontSize(12);
    const margin = 20;
    const maxWidth = doc.internal.pageSize.getWidth() - margin * 2;
    const lines = doc.splitTextToSize(editedText, maxWidth);
    doc.text(lines, margin, margin + 10);
    doc.save(`bail_draft_${selectedDraft?.case_title?.replace(/\s+/g, '_') || 'document'}.pdf`);
  };

  return (
    <div className="min-h-screen bg-[#F8F9FB] w-full pb-16">

      {/* PAGE HEADER */}
      <div className="border-b border-slate-100 bg-white px-6 py-14">
        <div className="max-w-6xl mx-auto">
          <span className="text-[10px] font-black uppercase tracking-[4px] text-[#C9A84C]">Workspace</span>
          <div className="mt-4 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
            <div>
              <h1 className="text-4xl font-serif font-black text-[#111]">My Drafts</h1>
              <p className="text-slate-400 font-medium mt-2">Your saved bail application drafts — edit, copy, or download anytime.</p>
            </div>
            <button
              onClick={() => navigate('/my-cases')}
              className="h-11 px-6 border border-slate-200 text-[#111] text-sm font-black rounded-lg flex items-center gap-2 hover:border-[#111] transition-all shrink-0"
            >
              <ArrowLeft size={15} /> My Cases
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 py-12">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-24">
            <Loader2 size={36} className="text-[#C9A84C] animate-spin mb-4" />
            <p className="text-slate-400 font-medium">Loading your drafts…</p>
          </div>
        ) : !selectedDraft ? (
          /* Drafts List */
          drafts.length === 0 ? (
            <div className="bg-white rounded-2xl p-20 text-center border-2 border-dashed border-slate-200">
              <div className="w-20 h-20 rounded-2xl bg-[#F8F9FB] border border-slate-100 flex items-center justify-center mx-auto mb-6">
                <FileText size={36} className="text-slate-200" />
              </div>
              <h3 className="text-xl font-black text-[#111] mb-2">No saved drafts yet</h3>
              <p className="text-slate-400 font-medium mb-8 max-w-sm mx-auto leading-relaxed">
                Generate a bail application from the Predict page and save it here for later access.
              </p>
              <button
                onClick={() => navigate('/predict')}
                className="px-10 py-4 bg-[#111] text-white text-sm font-black rounded-xl hover:bg-black hover:scale-[1.02] transition-all shadow-xl shadow-black/10"
              >
                Go to Predict →
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {drafts.map((draft, i) => (
                <motion.div
                  key={draft.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.04 }}
                  className="group bg-white rounded-xl border border-slate-100 shadow-sm hover:shadow-md hover:border-slate-200 transition-all"
                >
                  <div className="px-6 py-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-xl bg-[#F8F9FB] border border-slate-100 flex items-center justify-center shrink-0">
                        <FileText size={18} className="text-[#C9A84C]" />
                      </div>
                      <div>
                        <h3 className="font-black text-[#111]">{draft.case_title}</h3>
                        <p className="text-xs text-slate-400 font-medium mt-0.5">
                          Saved on {new Date(draft.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                      <button
                        onClick={() => handleOpen(draft)}
                        className="h-10 px-6 bg-[#111] text-white text-xs font-black uppercase tracking-widest rounded-lg hover:bg-black transition-all flex items-center gap-1.5"
                      >
                        Open <ChevronRight size={14} />
                      </button>
                      <button
                        onClick={() => setDeleteConfirm(draft.id)}
                        className="w-10 h-10 rounded-lg border border-slate-200 flex items-center justify-center text-slate-300 hover:text-red-500 hover:border-red-200 hover:bg-red-50 transition-all"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )
        ) : (
          /* Draft Editor */
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-4"
          >
            {/* Toolbar */}
            <div className="bg-white rounded-xl border border-slate-100 shadow-sm px-6 py-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setSelectedDraft(null)}
                  className="flex items-center gap-2 text-sm font-bold text-slate-400 hover:text-[#111] transition-colors"
                >
                  <ArrowLeft size={16} /> All Drafts
                </button>
                <span className="text-slate-200">|</span>
                <h3 className="font-black text-[#111] text-sm">{selectedDraft.case_title}</h3>
              </div>
              <div className="flex items-center gap-2 w-full sm:w-auto">
                <button
                  onClick={handleCopy}
                  className="flex-1 sm:flex-none h-9 px-4 border border-slate-200 text-[#111] text-xs font-black rounded-lg flex items-center justify-center gap-1.5 hover:border-[#111] transition-all"
                >
                  {copied ? <Check size={13} className="text-[#C9A84C]" /> : <Copy size={13} />}
                  {copied ? 'Copied' : 'Copy'}
                </button>
                <button
                  onClick={handleDownloadPDF}
                  className="flex-1 sm:flex-none h-9 px-4 bg-[#C9A84C] text-[#111] text-xs font-black rounded-lg flex items-center justify-center gap-1.5 hover:bg-[#b09341] transition-all"
                >
                  <Download size={13} /> PDF
                </button>
                <button
                  onClick={handleSaveEdit}
                  disabled={saving}
                  className="flex-1 sm:flex-none h-9 px-5 bg-[#111] text-white text-xs font-black rounded-lg flex items-center justify-center gap-1.5 hover:bg-black transition-all disabled:opacity-50"
                >
                  {saving ? <Loader2 size={13} className="animate-spin" /> : <Edit3 size={13} />}
                  {saving ? 'Saving…' : 'Save Edits'}
                </button>
              </div>
            </div>

            {/* Editor */}
            <div className="bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden">
              <div className="bg-slate-50 px-6 py-3 border-b border-slate-100 flex items-center justify-between">
                <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Document Editor</span>
                <Edit3 size={14} className="text-slate-300" />
              </div>
              <div className="p-6 flex justify-center bg-slate-50">
                <div className="w-full max-w-3xl bg-white shadow-sm rounded-lg">
                  <textarea
                    value={editedText}
                    onChange={(e) => setEditedText(e.target.value)}
                    className="w-full h-[700px] p-12 text-slate-800 focus:outline-none resize-y rounded-lg"
                    style={{ fontFamily: '"Times New Roman", Times, serif', fontSize: '15px', lineHeight: '1.9', whiteSpace: 'pre-wrap' }}
                    spellCheck={false}
                  />
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </div>

      {/* Delete Confirm Modal */}
      <AnimatePresence>
        {deleteConfirm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center px-4"
            onClick={() => setDeleteConfirm(null)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-2xl p-8 max-w-sm w-full shadow-2xl"
              onClick={e => e.stopPropagation()}
            >
              <h3 className="font-black text-[#111] text-lg mb-2">Delete Draft?</h3>
              <p className="text-slate-400 text-sm font-medium mb-8">This action cannot be undone. The draft will be permanently removed.</p>
              <div className="flex gap-3">
                <button onClick={() => setDeleteConfirm(null)} className="flex-1 h-11 border border-slate-200 text-slate-500 font-black text-sm rounded-xl hover:border-slate-300 transition-all">
                  Cancel
                </button>
                <button onClick={() => handleDelete(deleteConfirm)} className="flex-1 h-11 bg-red-500 text-white font-black text-sm rounded-xl hover:bg-red-600 transition-all">
                  Delete
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default MyDrafts;
