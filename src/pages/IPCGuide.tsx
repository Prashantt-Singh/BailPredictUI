import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search, Book, ShieldAlert, Gavel, Scale,
  FileQuestion, Lightbulb, AlertCircle, Check, ChevronRight
} from 'lucide-react';
import { explainIPC } from '../lib/gemini';

const POPULAR = ['302', '376', '420', '498A', '307', '379', 'NDPS', '304B'];

const IPCGuide: React.FC = () => {
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState('');

  useEffect(() => { window.scrollTo(0, 0); }, []);

  const runSearch = async (q: string) => {
    const trimmed = q.trim();
    if (!trimmed) return;

    setLoading(true);
    setError('');
    setResult(null);

    try {
      const data = await explainIPC(trimmed);
      // Normalise the response so it always has predictable fields
      setResult({
        section: data?.section ?? trimmed,
        title: data?.title ?? '',
        description: data?.description ?? 'No description available.',
        punishment: data?.punishment ?? '',
        bail_eligibility: data?.bail_eligibility ?? '',
        bail_chances: data?.bail_chances ?? '',
        // key_elements is string[]
        key_elements: Array.isArray(data?.key_elements) ? data.key_elements.filter(Boolean) : [],
        // landmark_cases can be string[] OR {case, principle}[]
        landmark_cases: Array.isArray(data?.landmark_cases)
          ? data.landmark_cases.map((lc: any) =>
              typeof lc === 'string' ? lc : `${lc.case ?? ''}${lc.principle ? ` — ${lc.principle}` : ''}`
            ).filter(Boolean)
          : [],
        // API returns defense_tips OR defense_strategies
        defense_strategies: Array.isArray(data?.defense_tips)
          ? data.defense_tips.filter(Boolean)
          : Array.isArray(data?.defense_strategies)
          ? data.defense_strategies.filter(Boolean)
          : [],
        // bail_considerations as optional
        bail_considerations: Array.isArray(data?.bail_considerations)
          ? data.bail_considerations.filter(Boolean)
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
    <div className="min-h-screen bg-[#F8F9FB] w-full">

      {/* PAGE HEADER */}
      <div className="border-b border-slate-100 bg-white px-6 py-14">
        <div className="max-w-3xl mx-auto text-center">
          <span className="text-[10px] font-black uppercase tracking-[4px] text-[#C9A84C]">Legal Reference</span>
          <h1 className="mt-4 text-4xl md:text-5xl font-serif font-black text-[#111] tracking-tight mb-4">
            IPC Section Guide
          </h1>
          <p className="text-slate-400 font-medium mb-10">
            Search any IPC section for instant, AI-powered legal insights.
          </p>

          {/* Search Bar */}
          <form onSubmit={handleFormSubmit} className="relative flex items-center max-w-2xl mx-auto">
            <Search size={18} className="absolute left-5 text-slate-300 pointer-events-none" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="e.g. 302, 376, 420, NDPS..."
              className="w-full h-14 bg-[#F8F9FB] border border-slate-200 rounded-xl pl-12 pr-36 text-sm font-medium text-[#111] focus:outline-none focus:ring-4 focus:ring-[#C9A84C]/10 focus:border-[#C9A84C] transition-all placeholder:text-slate-300"
            />
            <button
              type="submit"
              disabled={loading}
              className="absolute right-1.5 h-11 px-6 bg-[#111] text-white text-sm font-black rounded-lg hover:bg-black hover:scale-[1.02] transition-all disabled:opacity-50"
            >
              {loading ? 'Searching…' : 'Search'}
            </button>
          </form>

          {/* Popular Section Chips — clean numeric labels, no symbols */}
          <div className="flex flex-wrap justify-center gap-2 mt-5">
            {POPULAR.map((sec) => (
              <button
                key={sec}
                type="button"
                onClick={() => handleChipClick(sec)}
                className="px-4 py-1.5 rounded-lg border border-slate-200 bg-white text-xs font-black text-slate-500 hover:bg-[#111] hover:text-white hover:border-[#111] transition-all"
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
              <p className="font-black text-[#111] text-lg mb-2">Analyzing Section…</p>
              <p className="text-slate-400 text-sm font-medium">Fetching legal precedents and key elements</p>
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
                Dismiss
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
              <div className="bg-white rounded-2xl p-8 border border-slate-100 shadow-sm">
                <div className="flex items-center gap-4 mb-6">
                  <div className="w-12 h-12 rounded-xl bg-[#111] flex items-center justify-center shrink-0">
                    <Book size={22} className="text-[#C9A84C]" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-black text-[#111]">
                      {result.title || `IPC Section ${result.section}`}
                    </h2>
                    <p className="text-sm text-slate-400 font-medium">Section {result.section} — Indian Penal Code</p>
                  </div>
                </div>
                <p className="text-slate-600 leading-relaxed font-medium">{result.description}</p>

                <div className="mt-6 flex flex-wrap gap-3">
                  {result.punishment && (
                    <div className="flex items-center gap-2 px-4 py-2 bg-red-50 border border-red-100 rounded-lg">
                      <ShieldAlert size={15} className="text-red-500" />
                      <span className="text-sm font-bold text-red-600">Punishment: {result.punishment}</span>
                    </div>
                  )}
                  {result.bail_eligibility && (
                    <div className="flex items-center gap-2 px-4 py-2 bg-amber-50 border border-amber-100 rounded-lg">
                      <Scale size={15} className="text-amber-600" />
                      <span className="text-sm font-bold text-amber-700">{result.bail_eligibility}</span>
                    </div>
                  )}
                  {result.bail_chances && (
                    <div className="flex items-center gap-2 px-4 py-2 bg-emerald-50 border border-emerald-100 rounded-lg">
                      <Check size={15} className="text-emerald-600" />
                      <span className="text-sm font-bold text-emerald-700">Bail Chance: {result.bail_chances}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Info Cards Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Key Elements */}
                {result.key_elements?.length > 0 && (
                  <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm">
                    <h3 className="font-black text-[#111] mb-4 flex items-center gap-2">
                      <FileQuestion size={18} className="text-[#C9A84C]" /> Key Elements
                    </h3>
                    <ul className="space-y-2">
                      {result.key_elements.map((el: string, i: number) => (
                        <li key={i} className="flex items-start gap-2 text-sm text-slate-600 font-medium">
                          <Check size={14} className="text-[#C9A84C] mt-0.5 shrink-0" />
                          {String(el)}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Defense Strategies / Tips */}
                {result.defense_strategies?.length > 0 && (
                  <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm">
                    <h3 className="font-black text-[#111] mb-4 flex items-center gap-2">
                      <Lightbulb size={18} className="text-[#C9A84C]" /> Defense Strategies
                    </h3>
                    <ul className="space-y-2">
                      {result.defense_strategies.map((s: string, i: number) => (
                        <li key={i} className="flex items-start gap-2 text-sm text-slate-600 font-medium">
                          <ChevronRight size={14} className="text-[#C9A84C] mt-0.5 shrink-0" />
                          {String(s)}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Landmark Cases */}
                {result.landmark_cases?.length > 0 && (
                  <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm">
                    <h3 className="font-black text-[#111] mb-4 flex items-center gap-2">
                      <Gavel size={18} className="text-[#C9A84C]" /> Landmark Cases
                    </h3>
                    <ul className="space-y-2">
                      {result.landmark_cases.map((c: string, i: number) => (
                        <li key={i} className="flex items-start gap-2 text-sm text-slate-600 font-medium">
                          <ChevronRight size={14} className="text-[#C9A84C] mt-0.5 shrink-0" />
                          {String(c)}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Bail Considerations */}
                {result.bail_considerations?.length > 0 && (
                  <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm">
                    <h3 className="font-black text-[#111] mb-4 flex items-center gap-2">
                      <Scale size={18} className="text-[#C9A84C]" /> Bail Considerations
                    </h3>
                    <ul className="space-y-2">
                      {result.bail_considerations.map((b: string, i: number) => (
                        <li key={i} className="flex items-start gap-2 text-sm text-slate-600 font-medium">
                          <Check size={14} className="text-[#C9A84C] mt-0.5 shrink-0" />
                          {String(b)}
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
              <div className="w-20 h-20 rounded-2xl bg-white border border-slate-100 shadow-sm flex items-center justify-center mx-auto mb-6">
                <Book size={36} className="text-slate-200" />
              </div>
              <h3 className="font-black text-[#111] text-xl mb-2">Search an IPC Section</h3>
              <p className="text-slate-400 font-medium max-w-sm mx-auto">
                Enter any section number or click a quick-access chip above to start.
              </p>
            </motion.div>
          )}

        </AnimatePresence>
      </div>
    </div>
  );
};

export default IPCGuide;
