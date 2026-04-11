import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Scale, AlertTriangle, Bookmark, ArrowRight, Copy, Sparkles, CheckCircle2, BookOpen, Check, Calendar, Loader2 } from 'lucide-react';
import { predictBail, generateArguments, explainBailDecision } from '../lib/gemini';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import ExplainabilityPanel from '../components/ExplainabilityPanel';

const IPC_CRIME_MAP: Record<string, string> = {
  "Section 302 — Murder": "Murder",
  "Section 304 — Culpable Homicide": "Murder",
  "Section 304B — Dowry Death": "Murder",
  "Section 306 — Abetment of Suicide": "Other",
  "Section 307 — Attempt to Murder": "Attempt to Murder",
  "Section 323 — Voluntarily Causing Hurt": "Assault",
  "Section 324 — Hurt by Dangerous Weapons": "Assault",
  "Section 325 — Grievous Hurt": "Assault",
  "Section 354 — Assault on Woman": "Assault",
  "Section 363 — Kidnapping": "Kidnapping",
  "Section 364 — Kidnapping for Ransom": "Kidnapping",
  "Section 366 — Abduction of Woman": "Kidnapping",
  "Section 376 — Rape": "Rape",
  "Section 378 — Theft": "Theft",
  "Section 379 — Theft (Punishment)": "Theft",
  "Section 380 — Theft in Dwelling": "Theft",
  "Section 384 — Extortion": "Theft",
  "Section 392 — Robbery": "Theft",
  "Section 395 — Dacoity": "Theft",
  "Section 406 — Criminal Breach of Trust": "Fraud/Cheating",
  "Section 409 — Breach of Trust by Public Servant": "Fraud/Cheating",
  "Section 415 — Cheating": "Fraud/Cheating",
  "Section 420 — Cheating and Fraud": "Fraud/Cheating",
  "Section 427 — Mischief causing Damage": "Other",
  "Section 447 — Criminal Trespass": "Other",
  "Section 448 — House Trespass": "Other",
  "Section 498A — Cruelty by Husband": "Domestic Violence",
  "Section 504 — Intentional Insult": "Other",
  "Section 506 — Criminal Intimidation": "Other",
  "Section 509 — Insulting Modesty of Woman": "Assault",
  "NDPS Act — Drug Offense": "Drug Offense",
  "PC Act — Prevention of Corruption": "Corruption"
};

const IPC_SECTIONS = Object.keys(IPC_CRIME_MAP);

const BAIL_TYPES = ["Regular", "Anticipatory", "Default", "Interim"];
const COURTS = ["Magistrate Court", "Sessions Court", "District Court", "High Court", "Supreme Court"];
const YES_NO = ["No", "Yes"];

const CountUp = ({ end, duration = 2.0 }: { end: number, duration?: number }) => {
   const [count, setCount] = useState(0);
   useEffect(() => {
      let startTime: number;
      let animationFrame: number;
      const step = (timestamp: number) => {
         if (!startTime) startTime = timestamp;
         const progress = Math.min((timestamp - startTime) / (duration * 1000), 1);
         setCount(progress * end);
         if (progress < 1) {
            animationFrame = window.requestAnimationFrame(step);
         }
      };
      animationFrame = window.requestAnimationFrame(step);
      return () => window.cancelAnimationFrame(animationFrame);
   }, [end, duration]);
   return <>{Math.floor(count)}</>;
};

const Predict: React.FC = () => {
   const location = useLocation();
   const navigate = useNavigate();
   const { user } = useAuth();

   const [formData, setFormData] = useState({
      ipc: IPC_SECTIONS[0],
      crime: IPC_CRIME_MAP[IPC_SECTIONS[0]],
      bail_type: BAIL_TYPES[0],
      court: COURTS[0],
      custody: '',
      age: '30',
      crime_severity: '3',
      first_offender: YES_NO[0],
      prior_record: YES_NO[0],
      description: ''
   });

   const [status, setStatus] = useState<'idle' | 'predicting' | 'drafting' | 'result' | 'error'>('idle');
   const [loadingText, setLoadingText] = useState('');
   const [predictionResult, setPredictionResult] = useState<any>(null);
   const [argumentsList, setArgumentsList] = useState<any[]>([]);
   const [errorMsg, setErrorMsg] = useState<string>('');
   const [copied, setCopied] = useState(false);
   const [saved, setSaved] = useState(false);
   const [showSaveModal, setShowSaveModal] = useState(false);
   const [hearingDate, setHearingDate] = useState('');
   const [savingCase, setSavingCase] = useState(false);
   const [saveError, setSaveError] = useState('');
   const [explanationData, setExplanationData] = useState<any>(null);
   const [explanationLoading, setExplanationLoading] = useState(false);

   useEffect(() => {
      window.scrollTo(0, 0);
      if (location.state?.prefilled) {
         setFormData(prev => ({
            ...prev,
            ipc: location.state.offense_type || prev.ipc,
            crime: location.state.crime || prev.crime,
            court: location.state.court || prev.court,
         }));
      }
   }, [location]);

   const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
      const { name, value } = e.target;
      if (name === 'ipc') {
         setFormData(prev => ({ 
            ...prev, 
            ipc: value,
            crime: IPC_CRIME_MAP[value] || prev.crime 
         }));
      } else {
         setFormData(prev => ({ ...prev, [name]: value }));
      }
   };

   const incrementStats = async (argCount: number) => {
       try {
          const { data } = await supabase.from('stats').select('id, total_predictions, arguments_generated').single();
          if (!data) return;
          await supabase.from('stats').update({
             total_predictions: (data.total_predictions || 0) + 1,
             arguments_generated: (data.arguments_generated || 0) + argCount,
          }).eq('id', data.id);
       } catch (e) {
          console.warn('[Stats] increment skipped:', e);
       }
    };

   const handlePredict = async (e: React.FormEvent) => {
      e.preventDefault();
      setStatus('predicting');
      setLoadingText('Connecting to BERT model...');
      setErrorMsg('');
      setPredictionResult(null);
      setArgumentsList([]);
      setSaved(false);
      setExplanationData(null);

      try {
         const timeoutId = setTimeout(() => {
             setLoadingText('Analyzing case with Gemini AI...');
         }, 2000);
         
         const data = await predictBail(formData);
         clearTimeout(timeoutId);
         setPredictionResult(data);

         setStatus('drafting');

         // Start explanation generation in parallel
         setExplanationLoading(true);
         explainBailDecision(formData, data)
            .then(exp => {
               setExplanationData(exp);
               setExplanationLoading(false);
            })
            .catch(err => {
               console.error("Explanation failed:", err);
               setExplanationLoading(false);
            });

         const args = await generateArguments(formData);
         setArgumentsList(args);
         
         setStatus('result');
         // ⬆ increment global stats
         incrementStats(args.length);
      } catch (error: any) {
         console.error("Prediction Error:", error);
         setErrorMsg('Prediction engines failed. Please check your network and try again.');
         setStatus('error');
      }
   };

   const handleCopyAll = () => {
       if (argumentsList.length === 0) return;
       const text = argumentsList.map((a, i) => `Ground ${i+1}: ${a.ground}\nArgument: ${a.argument}\nCitation: ${a.citation}`).join('\n\n');
       navigator.clipboard.writeText(text);
       setCopied(true);
       setTimeout(() => setCopied(false), 2000);
   };

   const handleOpenSaveModal = () => {
       if (!predictionResult) return;
       setSaveError('');
       setShowSaveModal(true);
   };

   const handleSaveCase = async () => {
       if (!predictionResult || !user) return;
       setSavingCase(true);
       setSaveError('');
       const { error } = await supabase.from('cases').insert([{
           user_id: user.id,
           ipc_section: formData.ipc,
           offense: formData.crime,
           court: formData.court,
           bail_probability: predictionResult.confidence,
           likelihood: predictionResult.likelihood ?? predictionResult.prediction,
           hearing_date: hearingDate || null,
           case_description: formData.description,
       }]);
       setSavingCase(false);
       if (error) {
           setSaveError('Failed to save. Please try again.');
       } else {
           setSaved(true);
           setShowSaveModal(false);
       }
   };

   const handleGenerateDraft = () => {
       navigate('/bail-application', { state: { caseData: formData, arguments: argumentsList } });
   };

   const inputClass = "w-full bg-white border border-slate-200 text-slate-800 rounded-lg p-3 text-sm focus:outline-none focus:border-[#C9A84C] focus:ring-1 focus:ring-[#C9A84C] transition-colors shadow-sm";
   const labelClass = "block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2";

   const isGranted = String(predictionResult?.prediction || '').toLowerCase() === 'granted' || predictionResult?.prediction === 1;

   return (
      <>
      <div className="min-h-screen bg-[#F8F9FB] w-full pb-16">

         {/* PAGE HEADER */}
         <div className="border-b border-slate-100 bg-white px-6 py-14">
            <div className="max-w-[1400px] mx-auto">
               <span className="text-[10px] font-black uppercase tracking-[4px] text-[#C9A84C]">Analysis Engine</span>
               <h1 className="mt-4 text-4xl font-serif font-black text-[#111] tracking-tight">Bail Prediction</h1>
               <p className="text-slate-400 font-medium mt-2">Fill in the case details to receive an AI-powered bail outcome prediction.</p>
            </div>
         </div>

         <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-12">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
               
               {/* LEFT SIDE: FORM */}
               <div className="lg:col-span-5 relative">
                  <form onSubmit={handlePredict} className="bg-white rounded-2xl p-8 shadow-sm border border-slate-100 sticky top-[96px]">
                     <div className="flex items-center gap-3 mb-8 pb-6 border-b border-slate-100">
                        <div className="w-11 h-11 rounded-xl bg-[#F8F9FB] flex items-center justify-center border border-slate-100">
                           <Scale className="text-[#111]" size={22} />
                        </div>
                        <div>
                           <h2 className="text-xl font-black text-[#111]">Case Details</h2>
                        </div>
                     </div>

                     <div className="space-y-6">
                        <div>
                           <label className={labelClass}>IPC Section *</label>
                           <select name="ipc" value={formData.ipc} onChange={handleChange} className={inputClass}>
                              {IPC_SECTIONS.map(ipc => <option key={ipc} value={ipc}>{ipc}</option>)}
                           </select>
                        </div>
                        <div>
                           <label className={labelClass}>Crime / Offense (Auto-filled)</label>
                           <div className="relative group">
                              <input type="text" name="crime" value={formData.crime} readOnly className={`${inputClass} bg-slate-100 border-none cursor-not-allowed text-[#0a0f1e]/60 font-black italic select-none shadow-inner`} />
                              <div className="absolute right-4 top-1/2 -translate-y-1/2 text-[10px] font-black uppercase text-slate-400 opacity-50">System Filled</div>
                           </div>
                        </div>

                        <div className="grid grid-cols-2 gap-5">
                           <div>
                              <label className={labelClass}>Bail Type *</label>
                              <select name="bail_type" value={formData.bail_type} onChange={handleChange} className={inputClass}>
                                 {BAIL_TYPES.map(b => <option key={b} value={b}>{b}</option>)}
                              </select>
                           </div>
                           <div>
                              <label className={labelClass}>Court *</label>
                              <select name="court" value={formData.court} onChange={handleChange} className={inputClass}>
                                 {COURTS.map(c => <option key={c} value={c}>{c}</option>)}
                              </select>
                           </div>
                        </div>

                        <div className="grid grid-cols-2 gap-5">
                           <div>
                              <label className={labelClass}>Custody Duration</label>
                              <div className="relative flex items-center">
                                 <input type="number" name="custody" value={formData.custody} onChange={handleChange} required min="0" placeholder="0" className={`${inputClass} pr-12`} />
                                 <div className="absolute right-3 text-[10px] font-black uppercase text-slate-400">Mo</div>
                              </div>
                           </div>
                           <div>
                              <label className={labelClass}>Accused Age</label>
                              <div className="relative flex items-center">
                                 <input type="number" name="age" value={formData.age} onChange={handleChange} required min="18" max="100" className={inputClass} />
                                 <div className="absolute right-3 text-[10px] font-black uppercase text-slate-400">Yrs</div>
                              </div>
                           </div>
                        </div>

                        <div>
                           <label className={labelClass}>Crime Severity (1=Low, 5=High) : {formData.crime_severity}</label>
                           <input 
                             type="range" 
                             name="crime_severity" 
                             min="1" 
                             max="5" 
                             step="1" 
                             value={formData.crime_severity} 
                             onChange={handleChange} 
                             className="w-full h-2 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-[#C9A84C]" 
                           />
                           <div className="flex justify-between text-[10px] font-black text-slate-400 px-1 mt-2">
                              <span>MIN</span>
                              <span>MODERATE</span>
                              <span>EXTREME</span>
                           </div>
                        </div>

                        <div className="grid grid-cols-1 gap-5">
                           <div className="flex gap-4">
                              <div className="w-1/2">
                                 <label className={labelClass}>First Offender</label>
                                 <select name="first_offender" value={formData.first_offender} onChange={handleChange} className={inputClass}>
                                    {YES_NO.map(o => <option key={o} value={o}>{o}</option>)}
                                 </select>
                              </div>
                              <div className="w-1/2">
                                 <label className={labelClass}>Prior Record</label>
                                 <select name="prior_record" value={formData.prior_record} onChange={handleChange} className={inputClass}>
                                    {YES_NO.map(o => <option key={o} value={o}>{o}</option>)}
                                 </select>
                              </div>
                           </div>
                        </div>

                        <div>
                           <label className={labelClass}>Case Description (Optional)</label>
                           <textarea name="description" value={formData.description} onChange={handleChange} rows={3} placeholder="Briefly describe the case circumstances..." className={inputClass}></textarea>
                        </div>

                        <div className="pt-4 border-t border-slate-100">
                           <button 
                              type="submit" 
                              disabled={status === 'predicting' || status === 'drafting'}
                              className="w-full bg-[#111] text-white font-black text-sm py-4 px-6 rounded-xl shadow-xl shadow-black/10 transition-all duration-300 hover:bg-black hover:scale-[1.02] active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed flex justify-center items-center gap-2 uppercase tracking-widest"
                           >
                              {(status === 'predicting' || status === 'drafting') ? 'Analyzing…' : 'Analyze & Predict →'}
                           </button>
                        </div>
                     </div>
                  </form>
               </div>

               {/* RIGHT SIDE: RESULTS */}
               <div className="lg:col-span-7 flex flex-col gap-6">
                  <AnimatePresence mode="popLayout">
                     
                     {status === 'idle' && (
                        <motion.div 
                           key="idle" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95 }}
                           className="w-full h-full min-h-[600px] flex flex-col items-center justify-center text-center p-12 bg-white rounded-[3rem] border-4 border-dashed border-slate-100 shadow-[0_30px_60px_rgba(0,0,0,0.02)] relative overflow-hidden group"
                        >
                           <div className="absolute inset-0 bg-gradient-to-br from-[#C9A84C]/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-1000"></div>
                           <div className="w-24 h-24 bg-slate-50 rounded-[2rem] flex items-center justify-center mb-8 shadow-inner group-hover:bg-[#0a0f1e] transition-colors duration-500">
                              <Scale size={48} className="text-slate-200 group-hover:text-[#C9A84C] transition-colors" />
                           </div>
                           <h3 className="text-2xl font-black text-slate-800 mb-4 tracking-tight">Ready for AI Analysis</h3>
                           <p className="text-slate-400 text-base max-w-sm mb-8 font-medium leading-relaxed italic">Configure the legal parameters on the left to activate the BERT + Gemini prediction engine.</p>
                           <div className="flex gap-2">
                              {[1,2,3].map(i => <div key={i} className="w-2 h-2 rounded-full bg-slate-100"></div>)}
                           </div>
                        </motion.div>
                     )}

                     {status === 'predicting' && (
                        <motion.div 
                           key="predicting" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}
                           className="w-full min-h-[400px] flex flex-col items-center justify-center p-12 bg-white rounded-[2rem] shadow-[0_4px_24px_rgba(0,0,0,0.04)] border border-slate-100"
                        >
                           <motion.div animate={{ rotateY: 360 }} transition={{ duration: 3, repeat: Infinity, ease: "linear" }} className="w-24 h-24 mb-8 text-[#C9A84C]">
                              <Scale size={96} strokeWidth={1} />
                           </motion.div>
                           <h3 className="text-xl font-bold mb-8 text-center text-[#C9A84C]">
                             <AnimatePresence mode="wait">
                               <motion.span key={loadingText} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="block">
                                 {loadingText}
                               </motion.span>
                             </AnimatePresence>
                           </h3>
                           <div className="w-64 h-2 bg-slate-100 rounded-full overflow-hidden relative">
                              <motion.div className="absolute top-0 left-0 h-full bg-[#C9A84C]" initial={{ width: "0%" }} animate={{ width: "100%" }} transition={{ duration: 3.5 }} />
                           </div>
                        </motion.div>
                     )}

                     {status === 'error' && (
                        <motion.div 
                           key="error" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                           className="w-full min-h-[400px] flex flex-col items-center justify-center text-center p-12 bg-white rounded-[2rem] border border-red-200 shadow-[0_4px_24px_rgba(0,0,0,0.02)]"
                        >
                           <AlertTriangle size={64} className="text-red-400 mb-6" />
                           <h3 className="text-xl font-bold text-[#0a0f1e] mb-2">Analysis Failed</h3>
                           <p className="text-slate-500 text-sm max-w-sm mb-6">{errorMsg}</p>
                           <button onClick={() => setStatus('idle')} className="bg-[#0a0f1e] text-white px-6 py-2.5 rounded-xl font-bold text-sm">Retry</button>
                        </motion.div>
                     )}

                     {(status === 'drafting' || status === 'result') && predictionResult && (
                        <motion.div key="result_step1" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-white rounded-[2rem] p-8 shadow-[0_4px_24px_rgba(0,0,0,0.04)] border border-slate-100 flex flex-col items-center py-10 relative overflow-hidden">
                           <div className="absolute top-0 left-0 w-full h-2" style={{ backgroundColor: isGranted ? '#22c55e' : '#ef4444' }} />
                           
                           <div className={`px-8 py-2.5 rounded-full font-black text-2xl mb-8 border-2 shadow-sm ${isGranted ? 'bg-emerald-50 text-emerald-600 border-emerald-200' : 'bg-red-50 text-red-600 border-red-200'}`}>
                              {isGranted ? 'GRANTED ✅' : 'REJECTED ❌'}
                           </div>

                           <div className="relative w-48 h-48 flex items-center justify-center mb-6">
                              <svg className="absolute w-full h-full transform -rotate-90">
                                 <circle cx="96" cy="96" r="88" strokeWidth="12" stroke="#f1f5f9" fill="none" />
                                 <motion.circle 
                                    initial={{ strokeDasharray: "0, 1000" }} animate={{ strokeDasharray: `${((predictionResult.confidence) / 100) * 553}, 1000` }} transition={{ duration: 1.5, ease: "easeOut" }}
                                    cx="96" cy="96" r="88" strokeWidth="12" stroke={isGranted ? '#22c55e' : '#ef4444'} fill="none" strokeLinecap="round"
                                 />
                              </svg>
                              <div className="relative z-10 flex flex-col items-center">
                                 <span className="text-5xl font-extrabold tracking-tighter" style={{ color: isGranted ? '#22c55e' : '#ef4444' }}>
                                    <CountUp end={predictionResult.confidence} duration={1.5} />%
                                 </span>
                                 <span className="text-xs font-bold text-slate-400 mt-1 uppercase tracking-wider">Confidence</span>
                              </div>
                           </div>
                           <h3 className="text-sm font-bold tracking-widest uppercase text-slate-500 bg-slate-50 px-4 py-2 rounded-lg border border-slate-100">
                              {predictionResult.likelihood} LIKELIHOOD
                           </h3>
                        </motion.div>
                     )}

                     {(status === 'drafting' || status === 'result') && predictionResult && (explanationLoading || explanationData) && (
                        <ExplainabilityPanel data={explanationData} loading={explanationLoading} />
                     )}

                     {status === 'drafting' && (
                        <motion.div key="drafting_args" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-white rounded-[2rem] p-12 shadow-[0_4px_24px_rgba(0,0,0,0.04)] border border-slate-100 flex flex-col items-center justify-center relative overflow-hidden">
                           <div className="absolute inset-0 bg-gradient-to-br from-indigo-50/50 to-white/50 pointer-events-none"></div>
                           <motion.div animate={{ rotate: 360 }} transition={{ duration: 4, repeat: Infinity, ease: "linear" }} className="w-20 h-20 mb-6 text-[#C9A84C]">
                              <Sparkles size={80} strokeWidth={1.5} />
                           </motion.div>
                           <h3 className="text-xl font-bold text-[#0a0f1e] mb-2">Gemini AI drafting arguments...</h3>
                           <p className="text-sm font-semibold text-slate-500 animate-pulse">Scanning supreme court citations and structuring logic.</p>
                        </motion.div>
                     )}

                     {status === 'result' && argumentsList.length > 0 && (
                        <motion.div key="result_step2" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-white rounded-[2rem] shadow-[0_4px_24px_rgba(0,0,0,0.04)] border border-slate-100 flex flex-col overflow-hidden">
                           <div className="p-8 pb-6 border-b border-slate-100">
                              <h3 className="text-xl font-bold text-[#0a0f1e] flex items-center gap-2">
                                 <Sparkles className="text-[#C9A84C]" size={24} /> AI Generated Legal Arguments
                              </h3>
                           </div>
                           
                           <div className="flex flex-col gap-4 p-8 bg-slate-50/50">
                              {argumentsList.map((arg, idx) => (
                                 <motion.div key={idx} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: idx * 0.1 }} className="p-6 rounded-2xl border border-slate-200 bg-white shadow-sm hover:shadow-md hover:border-[#C9A84C]/40 transition-all group relative overflow-hidden">
                                    <div className="absolute top-0 left-0 w-1.5 h-full bg-[#C9A84C]"></div>
                                    <h4 className="font-bold text-lg text-[#C9A84C] mb-2 pr-4">{arg.ground}</h4>
                                    <p className="text-sm font-medium leading-relaxed text-slate-700 mb-4">{arg.argument}</p>
                                    <div className="flex items-center gap-2 text-teal-700 bg-teal-50 px-3 py-2 rounded-lg w-fit">
                                       <BookOpen size={14} className="opacity-70" />
                                       <span className="text-xs font-bold italic">{arg.citation}</span>
                                    </div>
                                 </motion.div>
                              ))}
                           </div>

                           <div className="p-6 bg-white border-t border-slate-100 grid grid-cols-1 md:grid-cols-3 gap-4">
                              <button onClick={handleCopyAll} className="h-12 border-2 border-slate-200 text-slate-600 font-bold rounded-xl flex justify-center items-center gap-2 hover:bg-slate-50 transition-colors">
                                 {copied ? <Check size={16} className="text-emerald-500" /> : <Copy size={16} />} 
                                 {copied ? 'Copied' : 'Copy All Arguments'}
                              </button>
                               <button onClick={handleOpenSaveModal} disabled={saved} className="h-12 border-2 border-slate-200 text-slate-600 font-bold rounded-xl flex justify-center items-center gap-2 hover:bg-slate-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
                                  {saved ? <CheckCircle2 size={16} className="text-emerald-500" /> : <Bookmark size={16} />}
                                  {saved ? 'Saved to My Cases' : 'Save Case'}
                               </button>
                              <button onClick={handleGenerateDraft} className="h-12 bg-[#0a0f1e] text-[#C9A84C] font-bold rounded-xl shadow-md transition-colors flex justify-center items-center gap-2 hover:bg-black group">
                                 Generate Bail Application <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
                              </button>
                           </div>
                        </motion.div>
                     )}
                  </AnimatePresence>
               </div>

            </div>
         </div>
      </div>

      {/* ── Hearing Date Modal ── */}
      <AnimatePresence>
        {showSaveModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center px-4"
            onClick={() => setShowSaveModal(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 300, damping: 25 }}
              className="bg-white rounded-2xl p-8 max-w-md w-full shadow-2xl border border-slate-100"
              onClick={e => e.stopPropagation()}
            >
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-xl bg-[#F8F9FB] border border-slate-100 flex items-center justify-center">
                  <Calendar size={20} className="text-[#C9A84C]" />
                </div>
                <div>
                  <h3 className="font-black text-[#111] text-lg">Save Case</h3>
                  <p className="text-xs text-slate-400 font-medium">Add an optional hearing date to track this case</p>
                </div>
              </div>

              <div className="mb-8">
                <label className="block text-[10px] font-black uppercase tracking-[2px] text-slate-400 mb-2">Hearing Date <span className="text-slate-300 normal-case font-medium">(optional)</span></label>
                <input
                  type="date"
                  value={hearingDate}
                  onChange={e => setHearingDate(e.target.value)}
                  min={new Date().toISOString().split('T')[0]}
                  className="w-full h-12 bg-[#F8F9FB] border border-slate-200 rounded-xl px-4 text-sm font-medium text-[#111] focus:outline-none focus:border-[#C9A84C] focus:ring-4 focus:ring-[#C9A84C]/10 transition-all"
                />
              </div>

              {saveError && (
                <p className="text-red-500 text-xs font-semibold mb-4 text-center">{saveError}</p>
              )}

              <div className="flex gap-3">
                <button
                  onClick={() => { setShowSaveModal(false); setSaveError(''); }}
                  className="flex-1 h-12 border border-slate-200 text-slate-500 font-black text-sm rounded-xl hover:border-slate-300 transition-all"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveCase}
                  disabled={savingCase}
                  className="flex-1 h-12 bg-[#111] text-white font-black text-sm rounded-xl hover:bg-black hover:scale-[1.02] transition-all shadow-lg shadow-black/10 disabled:opacity-60 flex items-center justify-center gap-2"
                >
                  {savingCase ? <><Loader2 size={15} className="animate-spin" /> Saving…</> : 'Save Case'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
      </>
   );
};

export default Predict;