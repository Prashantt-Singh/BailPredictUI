import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, ChevronDown, ChevronUp, Scale, Info, Check, X } from 'lucide-react';

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
      <div className="bg-white rounded-[2rem] p-8 shadow-[0_4px_24px_rgba(0,0,0,0.04)] border border-slate-100 flex flex-col mt-6 w-full animate-pulse">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-6 h-6 bg-slate-200 rounded-full"></div>
          <div className="h-6 bg-slate-200 rounded w-1/3"></div>
        </div>
        <div className="h-4 bg-slate-100 rounded w-full mb-2"></div>
        <div className="h-4 bg-slate-100 rounded w-5/6 mb-6"></div>
        
        <div className="space-y-4">
          <div className="h-10 bg-slate-50 rounded-xl"></div>
          <div className="h-10 bg-slate-50 rounded-xl"></div>
        </div>
      </div>
    );
  }

  if (!data) return null;

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-[2rem] shadow-[0_4px_24px_rgba(0,0,0,0.04)] border border-slate-100 overflow-hidden mt-6 w-full relative group"
    >
      {/* Header (Clickable to expand/collapse) */}
      <div 
        className="px-8 py-5 flex items-center justify-between cursor-pointer hover:bg-slate-50 transition-colors"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-[#f8fbff] rounded-xl flex items-center justify-center border border-[#e5edff]">
            <Scale size={20} className="text-blue-600" />
          </div>
          <div>
            <h3 className="text-lg font-black text-[#0a0f1e]">Why Bail is {data.positive_factors.reduce((sum, f) => sum + f.weight, 0) > data.negative_factors.reduce((sum, f) => sum + f.weight, 0) ? 'Likely' : 'Unlikely'}</h3>
            <p className="text-xs font-semibold text-slate-400">AI Explainability Engine</p>
          </div>
        </div>
        <div>
          {expanded ? <ChevronUp className="text-slate-400" /> : <ChevronDown className="text-slate-400" />}
        </div>
      </div>

      {/* Expandable Content */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden border-t border-slate-100"
          >
            <div className="p-8">
              
              {/* Verdict Summary */}
              <div className="bg-[#f8fbff] text-blue-900 p-5 rounded-2xl text-sm font-medium leading-relaxed border border-[#e5edff] mb-8">
                {data.verdict_summary}
              </div>

              <div className="flex flex-col lg:flex-row gap-8 mb-8">
                {/* Positive Factors */}
                <div className="w-full lg:w-1/2">
                  <h4 className="flex items-center gap-2 font-bold text-slate-800 mb-4 bg-emerald-50 w-fit px-3 py-1 rounded-lg text-emerald-700">
                    <Check size={16} /> Supporting Factors
                  </h4>
                  <div className="space-y-4">
                    {data.positive_factors.map((factor, idx) => (
                      <div key={idx} className="relative">
                        <div className="flex justify-between items-center mb-1">
                          <span className="text-xs font-bold text-slate-700">{factor.label}</span>
                          <span className="text-xs font-black text-emerald-600">+{factor.weight}%</span>
                        </div>
                        <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                          <motion.div 
                            className="h-full bg-emerald-500 rounded-full"
                            initial={{ width: 0 }}
                            animate={{ width: `${factor.weight}%` }}
                            transition={{ duration: 1, delay: 0.2 + (idx * 0.1) }}
                          />
                        </div>
                        <p className="text-[10px] text-slate-500 mt-1 mt-1 leading-tight">{factor.description}</p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Negative Factors */}
                <div className="w-full lg:w-1/2">
                  <h4 className="flex items-center gap-2 font-bold text-slate-800 mb-4 bg-red-50 w-fit px-3 py-1 rounded-lg text-red-700">
                    <X size={16} /> Against Factors
                  </h4>
                  <div className="space-y-4">
                    {data.negative_factors.map((factor, idx) => (
                      <div key={idx} className="relative">
                        <div className="flex justify-between items-center mb-1">
                          <span className="text-xs font-bold text-slate-700">{factor.label}</span>
                          <span className="text-xs font-black text-red-600">-{factor.weight}%</span>
                        </div>
                        <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                          <motion.div 
                            className="h-full bg-red-500 rounded-full"
                            initial={{ width: 0 }}
                            animate={{ width: `${factor.weight}%` }}
                            transition={{ duration: 1, delay: 0.2 + (idx * 0.1) }}
                          />
                        </div>
                        <p className="text-[10px] text-slate-500 mt-1 leading-tight">{factor.description}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Footer row: Risk Level + Note */}
              <div className="flex flex-col md:flex-row items-center gap-4 border-t border-slate-100 pt-6">
                <div className="flex items-center gap-2 px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 whitespace-nowrap">
                  <AlertTriangle size={18} className={
                    data.risk_level === 'HIGH' ? 'text-red-500' :
                    data.risk_level === 'MEDIUM' ? 'text-orange-500' : 'text-emerald-500'
                  } />
                  <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Risk Level:</span>
                  <span className={`text-sm font-black ${
                    data.risk_level === 'HIGH' ? 'text-red-600' :
                    data.risk_level === 'MEDIUM' ? 'text-orange-600' : 'text-emerald-600'
                  }`}>
                    {data.risk_level}
                  </span>
                </div>
                
                <div className="flex-1 bg-amber-50/50 border border-amber-100 p-4 rounded-xl flex items-start gap-3 w-full">
                  <Info size={18} className="text-amber-500 shrink-0 mt-0.5" />
                  <div>
                    <span className="text-xs font-black text-amber-800 uppercase tracking-wider block mb-1">Judge's Note</span>
                    <p className="text-xs font-medium text-amber-900/80 italic">{data.judge_note}</p>
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
