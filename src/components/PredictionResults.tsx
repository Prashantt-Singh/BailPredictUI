import React from 'react';
import { motion } from 'framer-motion';
import { CheckCircle, AlertTriangle, Info } from 'lucide-react';

interface PredictionResultsProps {
  prediction: {
    percentage: number;
    decision: string;
    keyFactors: string[];
    aiArgument: string;
    citations: string[];
  };
}

const PredictionResults: React.FC<PredictionResultsProps> = ({ prediction }) => {
  const isFavorable = prediction.percentage >= 50;

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-darkSurface border border-slate-700 p-8 rounded-2xl shadow-2xl w-full"
    >
      <div className="text-center mb-8">
        <h3 className="text-2xl font-bold text-white mb-2">Prediction Outcome</h3>
        <p className="text-slate-400">Based on historical data and deep learning models</p>
      </div>

      <div className="flex flex-col items-center justify-center mb-8">
        <div className="relative w-48 h-48 flex items-center justify-center">
          <svg className="w-full h-full transform -rotate-90">
            <circle cx="96" cy="96" r="88" strokeWidth="12" stroke="#1e293b" fill="transparent" />
            <motion.circle 
              initial={{ strokeDasharray: "0, 1000" }}
              animate={{ strokeDasharray: `${(prediction.percentage / 100) * 553}, 1000` }}
              transition={{ duration: 1.5, ease: "easeOut" }}
              cx="96" cy="96" r="88" strokeWidth="12" 
              stroke={isFavorable ? "#10b981" : "#ef4444"} 
              fill="transparent" 
              strokeLinecap="round"
            />
          </svg>
          <div className="absolute flex flex-col items-center">
            <span className="text-5xl font-black text-white">{prediction.percentage}%</span>
            <span className={`font-semibold mt-1 ${isFavorable ? 'text-emerald-400' : 'text-red-400'}`}>
              {prediction.decision}
            </span>
          </div>
        </div>
      </div>

      <div className="space-y-6">
        <div className="bg-slate-800/50 p-5 rounded-xl border border-slate-700">
          <h4 className="flex items-center gap-2 font-semibold text-white mb-3">
            <Info size={18} className="text-accentBrand" /> Key Factors
          </h4>
          <ul className="space-y-2">
            {prediction.keyFactors.map((factor, i) => (
              <li key={i} className="flex items-start gap-2 text-slate-300 text-sm">
                <CheckCircle size={16} className="text-emerald-500 mt-0.5 shrink-0" />
                <span>{factor}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="bg-slate-800/50 p-5 rounded-xl border border-slate-700">
          <h4 className="flex items-center gap-2 font-semibold text-white mb-3">
            <AlertTriangle size={18} className="text-purple-400" /> AI Legal Argument
          </h4>
          <p className="text-slate-300 text-sm leading-relaxed italic">
            "{prediction.aiArgument}"
          </p>
        </div>

        <div className="bg-slate-800/50 p-5 rounded-xl border border-slate-700">
          <h4 className="flex items-center gap-2 font-semibold text-white mb-3">
            <Info size={18} className="text-blue-400" /> Precedent Citations
          </h4>
          <ul className="list-disc pl-5 space-y-1">
            {prediction.citations.map((cite, i) => (
              <li key={i} className="text-slate-300 text-sm">{cite}</li>
            ))}
          </ul>
        </div>
      </div>
    </motion.div>
  );
};

export default PredictionResults;
