import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, ChevronUp, Scale, Check, X, ShieldAlert } from 'lucide-react';

interface Factor {
  label: string;
  weight: number;
  description: string;
}

interface ExplanationData {
  verdict_summary: string;
  positive_factors: Factor[];
  negative_factors: Factor[];
  risk_level: "LOW" | "MEDIUM" | "HIGH";
  judge_note: string;
}

interface ExplainabilityPanelProps {
  data: ExplanationData | null;
  loading: boolean;
}


const ExplainabilityPanel: React.FC<ExplainabilityPanelProps> = ({ data, loading }) => {
  const [expanded, setExpanded] = React.useState(true);

  if (loading) {
    return (
      <div className="bg-[var(--bg-secondary)] rounded-[2rem] p-8 shadow-[0_4px_24px_rgba(0,0,0,0.04)] border border-[var(--border-subtle)] flex flex-col mt-6 w-full animate-pulse">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-6 h-6 bg-[var(--bg-surface)] rounded-full"></div>
          <div className="h-6 bg-[var(--bg-surface)] rounded w-1/3"></div>
        </div>
        <div className="h-4 bg-[var(--bg-surface)] rounded w-full mb-2"></div>
        <div className="h-4 bg-[var(--bg-surface)] rounded w-5/6 mb-6"></div>
        <div className="space-y-4">
          <div className="h-10 bg-[var(--bg-surface)] rounded-xl"></div>
          <div className="h-10 bg-[var(--bg-surface)] rounded-xl"></div>
        </div>
      </div>
    );
  }

  if (!data) return null;

  const isLikely = (data.positive_factors || []).reduce((sum, f) => sum + (f.weight || 0), 0) > (data.negative_factors || []).reduce((sum, f) => sum + (f.weight || 0), 0);

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-[var(--bg-secondary)] rounded-[2rem] shadow-[0_8px_32px_rgba(0,0,0,0.12)] border border-[var(--border-primary)] overflow-hidden mt-6 w-full relative group"
    >
      {/* Header (Clickable to expand/collapse) */}
      <div 
        className="px-8 py-5 flex items-center justify-between cursor-pointer hover:bg-[var(--bg-surface)] transition-colors"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 bg-[var(--bg-primary)] rounded-xl flex items-center justify-center border border-[var(--border-subtle)] shadow-inner">
            <Scale size={20} className="text-[#C9A84C]" />
          </div>
          <div>
            <div className="flex items-center gap-3">
              <h3 className="text-lg font-black text-[var(--text-primary)]">Why Bail is {isLikely ? 'Likely' : 'Unlikely'}</h3>
              
              {/* Inline Risk Level Badge */}
              <div className={`flex items-center gap-1.5 px-2.5 py-0.5 rounded-md border text-[10px] font-black uppercase tracking-wider
                ${data.risk_level === 'HIGH' ? 'bg-red-500/10 border-red-500/20 text-red-500' :
                  data.risk_level === 'MEDIUM' ? 'bg-amber-500/10 border-amber-500/20 text-amber-500' : 
                  'bg-emerald-500/10 border-emerald-500/20 text-emerald-500'}`}
              >
                <ShieldAlert size={12} />
                Risk: {data.risk_level}
              </div>
            </div>
            <p className="text-xs font-semibold text-[var(--text-muted)] mt-0.5 tracking-wide">AI Explainability Engine</p>
          </div>
        </div>
        <div className="w-8 h-8 flex items-center justify-center rounded-full bg-[var(--bg-primary)] border border-[var(--border-subtle)]">
          {expanded ? <ChevronUp size={16} className="text-[var(--text-muted)]" /> : <ChevronDown size={16} className="text-[var(--text-muted)]" />}
        </div>
      </div>

      {/* Expandable Content */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden border-t border-[var(--border-subtle)] bg-[var(--bg-primary)]/30"
          >
            <div className="p-8">
              
              {/* Verdict Summary */}
              <div className="bg-[var(--bg-surface)] p-6 rounded-2xl text-sm font-medium leading-relaxed border border-[var(--border-primary)] mb-8 text-[var(--text-primary)] shadow-sm relative overflow-hidden">
                <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-[#C9A84C] to-transparent"></div>
                {data.verdict_summary}
              </div>

              <div className="flex flex-col lg:flex-row gap-10 mb-8">
                {/* Positive Factors */}
                <div className="w-full lg:w-1/2">
                  <h4 className="flex items-center gap-2 font-bold text-sm mb-5 text-[var(--text-primary)] border-b border-[var(--border-subtle)] pb-2">
                    <div className="w-6 h-6 rounded-md bg-emerald-500/10 flex items-center justify-center">
                      <Check size={14} className="text-emerald-500" />
                    </div>
                    Supporting Factors
                  </h4>
                  <div className="space-y-6">
                    {data.positive_factors.map((factor, idx) => (
                      <div key={idx} className="relative group">
                        <div className="flex justify-between items-center mb-1.5">
                          <span className="text-sm font-bold text-[var(--text-primary)]">{factor.label}</span>
                          <span className="text-xs font-black text-emerald-500 bg-emerald-500/10 px-2 py-0.5 rounded-md">+{factor.weight}%</span>
                        </div>
                        <div className="w-full h-1 bg-[var(--bg-primary)] rounded-full overflow-hidden shadow-inner">
                          <motion.div 
                            className="h-full bg-gradient-to-r from-emerald-600 to-emerald-400 rounded-full"
                            initial={{ width: 0 }}
                            animate={{ width: `${factor.weight}%` }}
                            transition={{ duration: 1, delay: 0.2 + (idx * 0.1) }}
                          />
                        </div>
                        <p className="text-sm text-[var(--text-secondary)] mt-2 leading-relaxed opacity-80 group-hover:opacity-100 transition-opacity">{factor.description}</p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Negative Factors */}
                <div className="w-full lg:w-1/2">
                  <h4 className="flex items-center gap-2 font-bold text-sm mb-5 text-[var(--text-primary)] border-b border-[var(--border-subtle)] pb-2">
                    <div className="w-6 h-6 rounded-md bg-red-500/10 flex items-center justify-center">
                      <X size={14} className="text-red-500" />
                    </div>
                    Against Factors
                  </h4>
                  <div className="space-y-6">
                    {data.negative_factors.map((factor, idx) => (
                      <div key={idx} className="relative group">
                        <div className="flex justify-between items-center mb-1.5">
                          <span className="text-sm font-bold text-[var(--text-primary)]">{factor.label}</span>
                          <span className="text-xs font-black text-red-500 bg-red-500/10 px-2 py-0.5 rounded-md">-{factor.weight}%</span>
                        </div>
                        <div className="w-full h-1 bg-[var(--bg-primary)] rounded-full overflow-hidden shadow-inner">
                          <motion.div 
                            className="h-full bg-gradient-to-r from-red-600 to-red-400 rounded-full"
                            initial={{ width: 0 }}
                            animate={{ width: `${factor.weight}%` }}
                            transition={{ duration: 1, delay: 0.2 + (idx * 0.1) }}
                          />
                        </div>
                        <p className="text-sm text-[var(--text-secondary)] mt-2 leading-relaxed opacity-80 group-hover:opacity-100 transition-opacity">{factor.description}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>



            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default ExplainabilityPanel;
