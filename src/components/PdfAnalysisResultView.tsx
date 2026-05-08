import React, { useState } from 'react';
import { 
  ShieldCheck, 
  Scale, 
  AlertTriangle, 
  CheckCircle2, 
  XCircle, 
  ChevronDown, 
  ChevronUp,
  FileText,
  Search
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import type { PdfAnalysisResult } from '../lib/pdfAnalysis';

interface Props {
  result: PdfAnalysisResult;
  compact?: boolean;
}

const PdfAnalysisResultView: React.FC<Props> = ({ result, compact = false }) => {
  const [showOcr, setShowOcr] = useState(false);
  
  // Extremely defensive data extraction
  const analysis = result?.analysis || {
    summary: 'Analysis unavailable.',
    violence_score: 0,
    intent_score: 0,
    weapon_involved: false,
    evidence_strength: 0,
    witness_tampering_risk: 0,
    repeat_behavior_risk: 0,
    organized_crime_risk: 0,
    cooperation_score: 0,
    supporting_factors: [],
    opposing_factors: [],
    risk_adjustment: 0
  };
  
  const ocr_text = result?.ocr_text || '';

  const ScoreCard = ({ label, score, icon: Icon }: { label: string, score: number, icon: any }) => {
    const safeScore = typeof score === 'number' ? score : 0;
    const getIntensity = (val: number) => {
      if (val <= 3) return 'text-emerald-500 bg-emerald-500/10';
      if (val <= 6) return 'text-amber-500 bg-amber-500/10';
      return 'text-red-500 bg-red-500/10';
    };

    return (
      <div className="bg-[var(--bg-secondary)] border border-[var(--border-subtle)] p-5 rounded-2xl flex flex-col gap-3">
        <div className="flex justify-between items-center">
          <div className="p-2 rounded-lg bg-[var(--bg-primary)]">
            <Icon size={18} className="text-[#C9A84C]" />
          </div>
          <span className={`text-lg font-black px-3 py-0.5 rounded-full ${getIntensity(safeScore)}`}>
            {safeScore}/10
          </span>
        </div>
        <div className="text-[10px] font-black uppercase tracking-[1px] text-[var(--text-muted)]">
          {label}
        </div>
        <div className="w-full h-1.5 bg-[var(--bg-primary)] rounded-full overflow-hidden">
          <motion.div 
            initial={{ width: 0 }}
            animate={{ width: `${safeScore * 10}%` }}
            transition={{ duration: 1, ease: "easeOut" }}
            className={`h-full ${safeScore > 6 ? 'bg-red-500' : safeScore > 3 ? 'bg-amber-500' : 'bg-emerald-500'}`}
          />
        </div>
      </div>
    );
  };

  return (
    <div className="flex flex-col gap-8 w-full max-w-5xl mx-auto">
      
      {/* SUMMARY SECTION */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-[#0a0f1e] text-white rounded-[2rem] p-10 relative overflow-hidden group border border-white/5"
      >
        <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:rotate-12 transition-transform duration-700">
          <Scale size={120} />
        </div>
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-accentBrand/20 flex items-center justify-center border border-accentBrand/30">
              <ShieldCheck className="text-accentBrand" size={20} />
            </div>
            <h2 className="text-2xl font-serif font-black tracking-tight">Executive AI Summary</h2>
          </div>
          <p className="text-slate-300 leading-[1.8] text-lg font-medium italic">
            "{analysis.summary || 'Summary unavailable.'}"
          </p>
          
          <div className="mt-8 pt-8 border-t border-white/10 flex flex-wrap gap-6">
             <div className="flex items-center gap-2">
                <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">Weapon Involved:</span>
                <span className={`text-xs font-bold px-3 py-1 rounded-full ${analysis.weapon_involved ? 'bg-red-500/20 text-red-400' : 'bg-emerald-500/20 text-emerald-400'}`}>
                  {analysis.weapon_involved ? 'YES' : 'NO'}
                </span>
             </div>
             <div className="flex items-center gap-2">
                <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">Risk Adjustment:</span>
                <span className={`text-xs font-bold flex items-center gap-1 ${analysis.risk_adjustment > 0 ? 'text-red-400' : 'text-emerald-400'}`}>
                  {analysis.risk_adjustment > 0 ? '▲' : '▼'} {analysis.risk_adjustment || 0} pts
                </span>
             </div>
          </div>
        </div>
      </motion.div>

      {/* SCORE GRID */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <ScoreCard label="Violence Intensity" score={analysis.violence_score} icon={AlertTriangle} />
        <ScoreCard label="Criminal Intent" score={analysis.intent_score} icon={Search} />
        <ScoreCard label="Evidence Strength" score={analysis.evidence_strength} icon={FileText} />
        <ScoreCard label="Cooperation Level" score={analysis.cooperation_score} icon={CheckCircle2} />
        <ScoreCard label="Witness Risk" score={analysis.witness_tampering_risk} icon={AlertTriangle} />
        <ScoreCard label="Habitual Offender Risk" score={analysis.repeat_behavior_risk} icon={Scale} />
        <ScoreCard label="Organized Crime Risk" score={analysis.organized_crime_risk} icon={AlertTriangle} />
        <ScoreCard label="Overall Risk Adjust" score={Math.abs(analysis.risk_adjustment || 0)} icon={AlertTriangle} />
      </div>

      {/* FACTORS SECTION */}
      {!compact && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Supporting */}
          <div className="card p-8">
            <div className="flex items-center gap-2 mb-6">
              <CheckCircle2 className="text-emerald-500" size={20} />
              <h3 className="font-black text-[var(--text-primary)] uppercase tracking-wider text-sm">Supporting Factors</h3>
            </div>
            <ul className="space-y-3">
              {(analysis.supporting_factors || []).map((f, i) => (
                <li key={i} className="flex items-start gap-3 text-sm text-[var(--text-secondary)] bg-[var(--bg-primary)] p-3 rounded-xl border border-[var(--border-subtle)]">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-1.5 flex-shrink-0"></span>
                  {f}
                </li>
              ))}
            </ul>
          </div>

          {/* Opposing */}
          <div className="card p-8">
            <div className="flex items-center gap-2 mb-6">
              <XCircle className="text-red-500" size={20} />
              <h3 className="font-black text-[var(--text-primary)] uppercase tracking-wider text-sm">Opposing Factors</h3>
            </div>
            <ul className="space-y-3">
              {(analysis.opposing_factors || []).map((f, i) => (
                <li key={i} className="flex items-start gap-3 text-sm text-[var(--text-secondary)] bg-[var(--bg-primary)] p-3 rounded-xl border border-[var(--border-subtle)]">
                  <span className="w-1.5 h-1.5 rounded-full bg-red-500 mt-1.5 flex-shrink-0"></span>
                  {f}
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}

      {/* OCR TEXT SECTION */}
      {!compact && (
        <div className="bg-[var(--bg-secondary)] border border-[var(--border-subtle)] rounded-2xl overflow-hidden shadow-sm">
          <button 
            onClick={() => setShowOcr(!showOcr)}
            className="w-full px-8 py-4 flex justify-between items-center hover:bg-[var(--bg-primary)] transition-colors"
          >
            <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[3px] text-[var(--text-muted)]">
              <FileText size={16} />
              Extracted OCR Document Text
            </div>
            {showOcr ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
          </button>
          <AnimatePresence>
            {showOcr && (
              <motion.div 
                initial={{ height: 0 }}
                animate={{ height: 'auto' }}
                exit={{ height: 0 }}
                className="overflow-hidden"
              >
                <div className="p-8 pt-0 border-t border-[var(--border-subtle)]">
                  <div className="bg-[var(--bg-primary)] p-6 rounded-xl border border-[var(--border-subtle)] max-h-[400px] overflow-y-auto custom-scrollbar">
                    <pre className="text-xs text-[var(--text-secondary)] leading-relaxed font-sans whitespace-pre-wrap">
                      {ocr_text}
                    </pre>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}

    </div>
  );
};

export default PdfAnalysisResultView;
