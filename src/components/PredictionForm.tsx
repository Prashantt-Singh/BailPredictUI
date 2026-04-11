import React, { useState } from 'react';
import { Scale, MapPin, Clock, ShieldCheck, AlertCircle } from 'lucide-react';

export interface FormData {
  offense_type: string;
  bail_type: string;
  court_level: string;
  months_in_custody: number;
  first_offender: boolean;
  surety_available: boolean;
  state: string;
}

interface PredictionFormProps {
  onSubmit: (data: FormData) => void;
  isLoading: boolean;
}

const PredictionForm: React.FC<PredictionFormProps> = ({ onSubmit, isLoading }) => {
  const [formData, setFormData] = useState<FormData>({
    offense_type: 'Theft',
    bail_type: 'Regular',
    court_level: 'Sessions Court',
    months_in_custody: 0,
    first_offender: true,
    surety_available: true,
    state: 'Maharashtra',
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked :
              type === 'number' ? parseInt(value) || 0 : value
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="bg-darkSurface border border-slate-700 p-8 rounded-2xl shadow-xl w-full max-w-2xl">
      <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
        <Scale className="text-accentBrand" /> Case Details
      </h3>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-slate-400 mb-2">Offense Type</label>
          <select name="offense_type" value={formData.offense_type} onChange={handleChange} className="w-full bg-slate-800 border-slate-700 text-slate-200 rounded-lg p-3 focus:ring-2 focus:ring-accentBrand outline-none">
            <option>Theft</option>
            <option>Assault</option>
            <option>Fraud</option>
            <option>Drug Related</option>
          </select>
        </div>

        <div>
           <label className="block text-sm font-medium text-slate-400 mb-2">State</label>
           <div className="relative">
             <MapPin className="absolute left-3 top-3 text-slate-500 w-5 h-5" />
             <select name="state" value={formData.state} onChange={handleChange} className="w-full pl-10 bg-slate-800 border-slate-700 text-slate-200 rounded-lg p-3 focus:ring-2 focus:ring-accentBrand outline-none">
               <option>Maharashtra</option>
               <option>Delhi</option>
               <option>Karnataka</option>
               <option>Uttar Pradesh</option>
             </select>
           </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-400 mb-2">Court Level</label>
          <select name="court_level" value={formData.court_level} onChange={handleChange} className="w-full bg-slate-800 border-slate-700 text-slate-200 rounded-lg p-3 focus:ring-2 focus:ring-accentBrand outline-none">
            <option>Magistrate Court</option>
            <option>Sessions Court</option>
            <option>High Court</option>
            <option>Supreme Court</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-400 mb-2">Bail Type</label>
          <select name="bail_type" value={formData.bail_type} onChange={handleChange} className="w-full bg-slate-800 border-slate-700 text-slate-200 rounded-lg p-3 focus:ring-2 focus:ring-accentBrand outline-none">
            <option>Regular</option>
            <option>Anticipatory</option>
            <option>Interim</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-400 mb-2">Months in Custody</label>
          <div className="relative">
            <Clock className="absolute left-3 top-3 text-slate-500 w-5 h-5" />
            <input type="number" name="months_in_custody" value={formData.months_in_custody} onChange={handleChange} className="w-full pl-10 bg-slate-800 border-slate-700 text-slate-200 rounded-lg p-3 focus:ring-2 focus:ring-accentBrand outline-none" min="0" />
          </div>
        </div>
      </div>

      <div className="mt-8 space-y-4">
        <label className="flex items-center gap-3 cursor-pointer">
          <input type="checkbox" name="first_offender" checked={formData.first_offender} onChange={handleChange} className="w-5 h-5 rounded border-slate-600 text-accentBrand focus:ring-accentBrand bg-slate-800" />
          <div className="flex items-center gap-2">
            <ShieldCheck className="text-emerald-400 w-5 h-5" />
            <span className="text-slate-300">First Time Offender</span>
          </div>
        </label>

        <label className="flex items-center gap-3 cursor-pointer">
          <input type="checkbox" name="surety_available" checked={formData.surety_available} onChange={handleChange} className="w-5 h-5 rounded border-slate-600 text-accentBrand focus:ring-accentBrand bg-slate-800" />
          <div className="flex items-center gap-2">
            <AlertCircle className="text-amber-400 w-5 h-5" />
            <span className="text-slate-300">Surety Available</span>
          </div>
        </label>
      </div>

      <button type="submit" disabled={isLoading} className="mt-8 w-full bg-gradient-to-r from-accentBrand to-purple-600 hover:from-accentBrandDark hover:to-purple-700 text-white font-bold py-4 px-6 rounded-xl shadow-lg transform transition hover:-translate-y-1 hover:shadow-2xl disabled:opacity-50 disabled:cursor-not-allowed flex justify-center items-center">
        {isLoading ? (
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white"></div>
        ) : (
          'Analyze Case & Predict Bail'
        )}
      </button>
    </form>
  );
}

export default PredictionForm;
