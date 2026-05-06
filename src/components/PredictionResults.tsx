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
      className="card"
    >
      <div className="text-center mb-8">
        <h3 className="text-heading mb-2">Prediction Outcome</h3>
        <p className="text-[var(--text-muted)] text-base">Based on historical data and advanced AI models</p>
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
            <span className="text-5xl font-black text-[var(--text-primary)]">{prediction.percentage}%</span>
            <span className={`font-semibold mt-1 ${isFavorable ? 'text-emerald-400' : 'text-red-400'}`}>
              {prediction.decision}
            </span>
          </div>
        </div>
      </div>

      <div className="space-y-6">
        {/* Key Factors */}
        <div className="card">
          <h4 className="flex items-center gap-2 font-semibold text-heading mb-3">
            <Info size={18} className="text-accentBrand" /> Key Factors
          </h4>
          <ul className="space-y-2 list-disc pl-5 text-[var(--text-secondary)]">
            {prediction.keyFactors.map((factor, i) => (
              <li key={i} className="flex items-start gap-2 text-sm hover:text-[var(--text-primary)] transition-colors">
                <CheckCircle size={16} className="text-emerald-500 mt-0.5 shrink-0" />
                <span>{factor}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* AI Legal Argument */}
        <div className="card">
          <h4 className="flex items-center gap-2 font-semibold text-heading mb-3">
            <AlertTriangle size={18} className="text-purple-400" /> AI Legal Argument
          </h4>
          <p className="text-[var(--text-secondary)] text-sm leading-relaxed italic">
            {prediction.aiArgument}
          </p>
        </div>

        {/* Precedent Citations */}
        <div className="card">
          <h4 className="flex items-center gap-2 font-semibold text-heading mb-3">
            <Info size={18} className="text-blue-400" /> Precedent Citations
          </h4>
          <ul className="list-disc pl-5 space-y-1 text-[var(--text-secondary)]">
            {prediction.citations.map((cite, i) => (
              <li key={i} className="text-sm hover:text-[var(--text-primary)] transition-colors">{cite}</li>
            ))}
          </ul>
        </div>
      </div>
    </motion.div>
  );
};

export default PredictionResults;
