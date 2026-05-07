import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search, Book, ShieldAlert, Gavel, Scale,
  FileQuestion, Lightbulb, AlertCircle, Check, ChevronRight
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { explainIPC } from '../lib/gemini';
import VoiceInput from '../components/VoiceInput';
import VoiceOutput from '../components/VoiceOutput';

const POPULAR = ['302', '376', '420', '498A', '307', '379', 'NDPS', '304B'];

const IPCGuide: React.FC = () => {
  const { t } = useTranslation();
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{
    section: string;
    title: string;
    description: string;
    punishment: string;
    bail_eligibility: string;
    bail_chances: string;
    key_elements: string[];
    landmark_cases: string[];
    defense_strategies: string[];
    bail_considerations: string[];
  } | null>(null);
  const [error, setError] = useState('');

  useEffect(() => { window.scrollTo(0, 0); }, []);

  const runSearch = async (q: string) => {
    const trimmed = q.trim();
    if (!trimmed) return;

    setLoading(true);
    setError('');
    setResult(null);

    try {
      const dataUnknown = await explainIPC(trimmed);
      const data = (dataUnknown ?? {}) as Record<string, unknown>;
      // Normalise the response so it always has predictable fields
      setResult({
        section: (typeof data.section === 'string' ? data.section : trimmed),
        title: (typeof data.title === 'string' ? data.title : ''),
        description: (typeof data.description === 'string' ? data.description : 'No description available.'),
        punishment: (typeof data.punishment === 'string' ? data.punishment : ''),
        bail_eligibility: (typeof data.bail_eligibility === 'string' ? data.bail_eligibility : ''),
        bail_chances: (typeof data.bail_chances === 'string' ? data.bail_chances : ''),
        // key_elements is string[]
        key_elements: Array.isArray(data.key_elements) ? (data.key_elements as unknown[]).filter((x): x is string => typeof x === 'string' && x.length > 0) : [],
        // landmark_cases can be string[] OR {case, principle}[]
        landmark_cases: Array.isArray(data.landmark_cases)
          ? (data.landmark_cases as unknown[]).map((lc) => {
              if (typeof lc === 'string') return lc;
              const obj = (lc ?? {}) as Record<string, unknown>;
              const caseName = typeof obj.case === 'string' ? obj.case : '';
              const principle = typeof obj.principle === 'string' ? obj.principle : '';
              return `${caseName}${principle ? ` — ${principle}` : ''}`.trim();
            }).filter((x): x is string => typeof x === 'string' && x.length > 0)
          : [],
        // API returns defense_tips OR defense_strategies
        defense_strategies: Array.isArray(data.defense_tips)
          ? (data.defense_tips as unknown[]).filter((x): x is string => typeof x === 'string' && x.length > 0)
          : Array.isArray(data.defense_strategies)
          ? (data.defense_strategies as unknown[]).filter((x): x is string => typeof x === 'string' && x.length > 0)
          : [],
        // bail_considerations as optional
        bail_considerations: Array.isArray(data.bail_considerations)
          ? (data.bail_considerations as unknown[]).filter((x): x is string => typeof x === 'string' && x.length > 0)
          : [],
      });
    } catch (err) {
      console.error('IPC Guide search error:', err);
      setError('Failed to fetch IPC details. Please check your network and try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    runSearch(query);
  };

  const handleChipClick = (sec: string) => {
    setQuery(sec);
    runSearch(sec);
  };

  return (
    <div className="min-h-screen bg-[var(--bg-primary)] w-full">

      {/* PAGE HEADER */}
      <div className="border-b border-[var(--border-subtle)] bg-[var(--bg-secondary)] px-6 py-14">
        <div className="max-w-3xl mx-auto text-center">
          <span className="text-[10px] font-black uppercase tracking-[4px] text-[#C9A84C]">{t('ipc.header_label')}</span>
          <h1 className="mt-4 text-4xl md:text-5xl font-serif font-black text-[var(--text-primary)] tracking-tight mb-4">
            {t('ipc.title')}
          </h1>
          <p className="text-[var(--text-muted)] font-medium mb-10">
            {t('ipc.subtitle')}
          </p>

          {/* Search Bar */}
          <form onSubmit={handleFormSubmit} className="relative flex items-center max-w-2xl mx-auto">
            <Search size={18} className="absolute left-5 text-[var(--text-muted)] pointer-events-none" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={t('ipc.search_placeholder')}
              className="w-full h-14 bg-[var(--bg-primary)] border border-[var(--border-primary)] rounded-xl pl-12 pr-[140px] text-sm font-medium text-[var(--text-primary)] focus:outline-none focus:ring-4 focus:ring-[#C9A84C]/10 focus:border-[#C9A84C] transition-all placeholder:text-[var(--text-muted)]"
            />
            <div className="absolute right-1.5 flex items-center gap-2">
              <VoiceInput onTranscript={(text) => { setQuery(text); runSearch(text); }} />
              <button
                type="submit"
                disabled={loading}
                className="h-11 px-6 bg-[var(--btn-primary-bg)] text-[var(--btn-primary-text)] text-sm font-black rounded-lg hover:bg-[var(--btn-primary-hover)] hover:scale-[1.02] transition-all disabled:opacity-50"
              >
                {loading ? t('ipc.searching') : t('ipc.search_btn')}
              </button>
            </div>
          </form>

          {/* Popular Section Chips — clean numeric labels, no symbols */}
          <div className="flex flex-wrap justify-center gap-2 mt-5">
            {POPULAR.map((sec) => (
              <button
                key={sec}
                type="button"
                onClick={() => handleChipClick(sec)}
                className="px-4 py-1.5 rounded-lg border border-[var(--border-primary)] bg-[var(--bg-secondary)] text-xs font-black text-[var(--text-secondary)] hover:bg-[var(--btn-primary-bg)] hover:text-[var(--btn-primary-text)] hover:border-[var(--btn-primary-bg)] transition-all"
              >
                {sec}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* CONTENT */}
      <div className="max-w-4xl mx-auto px-6 py-16">
        <AnimatePresence mode="wait">

          {/* Loading State */}
            {loading && (
              <motion.div
                key="loading"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex flex-col items-center justify-center py-24"
              >
                <div className="w-16 h-16 rounded-2xl border-2 border-[#C9A84C]/20 flex items-center justify-center mb-6">
                  <Search size={28} className="text-[#C9A84C] animate-pulse" />
                </div>
                <p className="font-black text-[var(--text-primary)] text-lg mb-2">{t('ipc.loading_title')}</p>
                <p className="text-[var(--text-muted)] text-sm font-medium">{t('ipc.loading_sub')}</p>
              </motion.div>
            )}

          {/* Error State */}
          {!loading && error && (
            <motion.div
              key="error"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="bg-red-50 border border-red-100 rounded-xl p-6 text-center"
            >
              <AlertCircle size={28} className="text-red-400 mx-auto mb-3" />
              <p className="font-bold text-red-600 mb-3">{error}</p>
              <button
                onClick={() => setError('')}
                className="text-xs font-black text-red-400 hover:text-red-600 transition-colors"
              >
                {t('ipc.dismiss')}
              </button>
            </motion.div>
          )}

          {/* Results */}
          {!loading && !error && result && (
            <motion.div
              key="results"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="space-y-8"
            >
              {/* Title Card */}
              <div className="bg-[var(--bg-secondary)] rounded-[2rem] p-8 md:p-10 border border-[var(--border-primary)] shadow-[0_8px_32px_rgba(0,0,0,0.12)] relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-64 h-64 bg-[#C9A84C]/5 rounded-bl-[100%] pointer-events-none transition-transform group-hover:scale-110"></div>
                
                <div className="absolute top-8 right-8 z-10">
                  <VoiceOutput text={`${result.title}. ${result.description}`} />
                </div>
                
                <div className="flex items-start gap-5 mb-8 relative z-10">
                  <div className="w-14 h-14 rounded-2xl bg-[var(--bg-primary)] border border-[var(--border-subtle)] flex items-center justify-center shrink-0 shadow-inner">
                    <Book size={24} className="text-[#C9A84C]" />
                  </div>
                  <div className="pt-1">
                    <h2 className="text-xl md:text-2xl font-serif font-bold text-[var(--text-primary)] pr-12 leading-tight tracking-tight mb-2">
                      {result.title || result.section}
                    </h2>
                    <p className="text-xs font-black uppercase tracking-[2px] text-[#C9A84C]/80">{result.section} — Indian Penal Code</p>
                  </div>
                </div>
                
                <p className="text-[var(--text-secondary)] leading-[1.8] font-medium text-sm md:text-base mb-8 relative z-10">
                  {result.description}
                </p>

                {/* Horizontal Data Grid for Stats */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 relative z-10">
                  {result.punishment && (
                    <div className="bg-[var(--bg-surface)] border border-red-500/20 rounded-xl p-4 flex flex-col gap-2 relative overflow-hidden">
                      <div className="absolute left-0 top-0 bottom-0 w-1 bg-red-500/50"></div>
                      <div className="flex items-center gap-2 text-red-400">
                        <ShieldAlert size={16} />
                        <span className="text-[10px] font-black uppercase tracking-wider">{t('ipc.result.punishment')}</span>
                      </div>
                      <span className="text-sm font-bold text-[var(--text-primary)]">{result.punishment}</span>
                    </div>
                  )}
                  {result.bail_eligibility && (
                    <div className="bg-[var(--bg-surface)] border border-amber-500/20 rounded-xl p-4 flex flex-col gap-2 relative overflow-hidden">
                      <div className="absolute left-0 top-0 bottom-0 w-1 bg-amber-500/50"></div>
                      <div className="flex items-center gap-2 text-amber-400">
                        <Scale size={16} />
                        <span className="text-[10px] font-black uppercase tracking-wider">Nature of Offense</span>
                      </div>
                      <span className="text-sm font-bold text-[var(--text-primary)]">{result.bail_eligibility}</span>
                    </div>
                  )}
                  {result.bail_chances && (
                    <div className="bg-[var(--bg-surface)] border border-emerald-500/20 rounded-xl p-4 flex flex-col gap-2 relative overflow-hidden">
                      <div className="absolute left-0 top-0 bottom-0 w-1 bg-emerald-500/50"></div>
                      <div className="flex items-center gap-2 text-emerald-400">
                        <Check size={16} />
                        <span className="text-[10px] font-black uppercase tracking-wider">{t('ipc.result.bail_chances')}</span>
                      </div>
                      <span className="text-sm font-bold text-[var(--text-primary)]">{result.bail_chances}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Info Cards Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Key Elements */}
                {result.key_elements?.length > 0 && (
                  <div className="bg-[var(--bg-secondary)] rounded-[2.5rem] p-8 border border-indigo-500/10 shadow-[0_4px_20px_rgba(79,70,229,0.05)] relative overflow-hidden group hover:border-indigo-500/30 transition-all duration-500">
                    <div className="absolute -right-4 -top-4 w-24 h-24 bg-indigo-500/5 rounded-full blur-2xl group-hover:bg-indigo-500/10 transition-colors"></div>
                    <div className="absolute top-6 right-6 z-10">
                      <VoiceOutput text={result.key_elements.join('. ')} />
                    </div>
                    <div className="flex items-center gap-3 mb-8 relative z-10">
                      <div className="w-10 h-10 rounded-xl bg-indigo-500/10 flex items-center justify-center border border-indigo-500/20 shadow-sm">
                        <FileQuestion size={20} className="text-indigo-500" />
                      </div>
                      <h3 className="font-black text-xl text-[var(--text-primary)] tracking-tight">{t('ipc.result.key_elements')}</h3>
                    </div>
                    <ul className="space-y-4 relative z-10">
                      {result.key_elements.map((el: string, i: number) => (
                        <li key={i} className="flex items-start gap-4 p-3 rounded-2xl hover:bg-indigo-500/5 transition-colors group/item">
                          <div className="w-6 h-6 rounded-lg bg-indigo-500/10 flex items-center justify-center shrink-0 mt-0.5 group-hover/item:bg-indigo-500 group-hover/item:text-white transition-all">
                            <Check size={14} className="text-indigo-500 group-hover/item:text-white" />
                          </div>
                          <span className="text-[var(--text-secondary)] font-semibold text-[15px] leading-relaxed group-hover/item:text-[var(--text-primary)] transition-colors">
                            {String(el)}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Defense Strategies / Tips */}
                {result.defense_strategies?.length > 0 && (
                  <div className="bg-[var(--bg-secondary)] rounded-[2.5rem] p-8 border border-emerald-500/10 shadow-[0_4px_20px_rgba(16,185,129,0.05)] relative overflow-hidden group hover:border-emerald-500/30 transition-all duration-500">
                    <div className="absolute -right-4 -top-4 w-24 h-24 bg-emerald-500/5 rounded-full blur-2xl group-hover:bg-emerald-500/10 transition-colors"></div>
                    <div className="absolute top-6 right-6 z-10">
                      <VoiceOutput text={result.defense_strategies.join('. ')} />
                    </div>
                    <div className="flex items-center gap-3 mb-8 relative z-10">
                      <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20 shadow-sm">
                        <Lightbulb size={20} className="text-emerald-500" />
                      </div>
                      <h3 className="font-black text-xl text-[var(--text-primary)] tracking-tight">{t('ipc.result.defense_strategies')}</h3>
                    </div>
                    <ul className="space-y-4 relative z-10">
                      {result.defense_strategies.map((s: string, i: number) => (
                        <li key={i} className="flex items-start gap-4 p-3 rounded-2xl hover:bg-emerald-500/5 transition-colors group/item">
                          <div className="w-6 h-6 rounded-lg bg-emerald-500/10 flex items-center justify-center shrink-0 mt-0.5 group-hover/item:bg-emerald-500 group-hover/item:text-white transition-all">
                            <ChevronRight size={14} className="text-emerald-500 group-hover/item:text-white" />
                          </div>
                          <span className="text-[var(--text-secondary)] font-semibold text-[15px] leading-relaxed group-hover/item:text-[var(--text-primary)] transition-colors">
                            {String(s)}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Landmark Cases */}
                {result.landmark_cases?.length > 0 && (
                  <div className="bg-[var(--bg-secondary)] rounded-[2.5rem] p-8 border border-amber-500/10 shadow-[0_4px_20px_rgba(245,158,11,0.05)] relative overflow-hidden group hover:border-amber-500/30 transition-all duration-500">
                    <div className="absolute -right-4 -top-4 w-24 h-24 bg-amber-500/5 rounded-full blur-2xl group-hover:bg-amber-500/10 transition-colors"></div>
                    <div className="absolute top-6 right-6 z-10">
                      <VoiceOutput text={result.landmark_cases.join('. ')} />
                    </div>
                    <div className="flex items-center gap-3 mb-8 relative z-10">
                      <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center border border-amber-500/20 shadow-sm">
                        <Gavel size={20} className="text-amber-500" />
                      </div>
                      <h3 className="font-black text-xl text-[var(--text-primary)] tracking-tight">{t('ipc.result.landmark_cases')}</h3>
                    </div>
                    <ul className="space-y-4 relative z-10">
                      {result.landmark_cases.map((c: string, i: number) => {
                        const [caseName, principle] = String(c).split(' — ');
                        return (
                          <li key={i} className="flex flex-col gap-2 p-4 rounded-2xl bg-[var(--bg-primary)] border border-[var(--border-subtle)] hover:border-amber-500/40 transition-all group/item shadow-sm hover:shadow-md">
                            <div className="flex items-center gap-2">
                              <div className="w-5 h-5 rounded bg-amber-500/10 flex items-center justify-center">
                                <Scale size={12} className="text-amber-500" />
                              </div>
                              <span className="font-black text-xs text-amber-600 uppercase tracking-wider">{caseName}</span>
                            </div>
                            {principle && (
                              <span className="text-[var(--text-secondary)] font-semibold text-sm leading-relaxed group-hover/item:text-[var(--text-primary)] transition-colors pl-7">
                                {principle}
                              </span>
                            )}
                          </li>
                        );
                      })}
                    </ul>
                  </div>
                )}

                {/* Bail Considerations */}
                {result.bail_considerations?.length > 0 && (
                  <div className="bg-[var(--bg-primary)]/50 rounded-[2rem] p-8 border border-[var(--border-subtle)] shadow-sm relative hover:border-[#C9A84C]/30 transition-colors">
                    <div className="absolute top-6 right-6">
                      <VoiceOutput text={result.bail_considerations.join('. ')} />
                    </div>
                    <div className="flex items-center gap-3 mb-6">
                      <div className="w-8 h-8 rounded-lg bg-[#C9A84C]/10 flex items-center justify-center border border-[#C9A84C]/20">
                        <Scale size={16} className="text-[#C9A84C]" />
                      </div>
                      <h3 className="font-bold text-lg text-[var(--text-primary)]">{t('ipc.result.bail_considerations')}</h3>
                    </div>
                    <ul className="space-y-4">
                      {result.bail_considerations.map((b: string, i: number) => (
                        <li key={i} className="flex items-start gap-3 text-sm text-[var(--text-secondary)] font-medium leading-relaxed group">
                          <Check size={16} className="text-[#C9A84C]/50 mt-0.5 shrink-0 group-hover:text-[#C9A84C] transition-colors" />
                          <span className="group-hover:text-[var(--text-primary)] transition-colors">{String(b)}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </motion.div>
          )}

          {/* Empty State */}
          {!loading && !error && !result && (
            <motion.div
              key="empty"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="py-24 text-center"
            >
              <div className="w-20 h-20 rounded-2xl bg-[var(--bg-secondary)] border border-[var(--border-subtle)] shadow-sm flex items-center justify-center mx-auto mb-6">
                <Book size={36} className="text-[var(--text-muted)]" />
              </div>
              <h3 className="font-black text-[var(--text-primary)] text-xl mb-2">{t('ipc.empty.title')}</h3>
              <p className="text-[var(--text-muted)] font-medium max-w-sm mx-auto">
                {t('ipc.empty.subtitle')}
              </p>
            </motion.div>
          )}

        </AnimatePresence>
      </div>
    </div>
  );
};

export default IPCGuide;
