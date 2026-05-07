import React, { useState, useEffect, useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Scale, AlertTriangle, Bookmark, ArrowRight, Copy, Sparkles, CheckCircle2, BookOpen, Check, Calendar, Loader2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { predictBail, generateArguments, explainBailDecision } from '../lib/gemini';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/useAuth';
import ExplainabilityPanel from '../components/ExplainabilityPanel';
import SmartVoiceAutoFill from '../components/SmartVoiceAutoFill';
import type { AutoFillResult } from '../components/SmartVoiceAutoFill';
import VoiceOutput from '../components/VoiceOutput';

const VoiceBadge: React.FC = () => (
  <span className="ml-2 inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-black uppercase tracking-wider bg-emerald-500/15 text-emerald-500 border border-emerald-500/30">
    <CheckCircle2 size={9} /> Voice
  </span>
);

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
  "PC Act — Prevention of Corruption": "Corruption",
  "Other / Custom": "Other"
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
   const { t } = useTranslation();

   const [formData, setFormData] = useState({
      ipc: IPC_SECTIONS[0],
      custom_ipc: '',
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
   const [predictionResult, setPredictionResult] = useState<{
      prediction?: string;
      confidence: number;
      likelihood?: string;
      source?: React.ReactNode;
   } | null>(null);
   const [argumentsList, setArgumentsList] = useState<Array<{
      ground: string;
      argument: string;
      citation?: string;
   }>>([]);
   const [errorMsg, setErrorMsg] = useState<string>('');
   const [copied, setCopied] = useState(false);
   const [saved, setSaved] = useState(false);
   const [showSaveModal, setShowSaveModal] = useState(false);
   const [hearingDate, setHearingDate] = useState('');
   const [savingCase, setSavingCase] = useState(false);
   const [saveError, setSaveError] = useState('');
   const [explanationData, setExplanationData] = useState<any>(null);
   const [explanationLoading, setExplanationLoading] = useState(false);
   const [voiceFilledFields, setVoiceFilledFields] = useState<string[]>([]);

   // Helper: check if a field was voice-filled
   const isVoiceFilled = (field: string) => voiceFilledFields.includes(field);

   useEffect(() => {
      window.scrollTo(0, 0);
      const state = location.state as Record<string, unknown> | null;
      if (!state?.prefilled) return;
      const offenseType = typeof state.offense_type === 'string' ? state.offense_type : undefined;
      const crime = typeof state.crime === 'string' ? state.crime : undefined;
      const court = typeof state.court === 'string' ? state.court : undefined;

      // Avoid synchronous setState within effect body (eslint rule)
      const timer = window.setTimeout(() => {
        setFormData(prev => ({
          ...prev,
          ipc: offenseType || prev.ipc,
          crime: crime || prev.crime,
          court: court || prev.court,
        }));
      }, 0);

      return () => window.clearTimeout(timer);
   }, [location.state]);

   const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
      const { name, value } = e.target;
      // When user manually changes a field, clear its voice-filled badge
      setVoiceFilledFields(prev => prev.filter(f => f !== name));
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

   const handleAutoFill = useCallback((result: AutoFillResult) => {
      setFormData(prev => {
        const next = { ...prev };
        if (result.data.ipc) {
          next.ipc = result.data.ipc;
          next.crime = IPC_CRIME_MAP[result.data.ipc] || prev.crime;
        }
        if (result.data.bail_type) next.bail_type = result.data.bail_type;
        if (result.data.court) next.court = result.data.court;
        if (result.data.custody) next.custody = result.data.custody;
        if (result.data.age) next.age = result.data.age;
        if (result.data.first_offender) next.first_offender = result.data.first_offender;
        if (result.data.prior_record) next.prior_record = result.data.prior_record;
        if (result.data.description) next.description = result.data.description;
        return next;
      });
      setVoiceFilledFields(result.filledFields);
   }, []);



   const handlePredict = async (e: React.FormEvent) => {
      e.preventDefault();
      setStatus('predicting');
      setLoadingText(t('predict.loading.connecting'));
      setErrorMsg('');
      setPredictionResult(null);
      setArgumentsList([]);
      setSaved(false);
      setExplanationData(null);

      try {
         const timeoutId = setTimeout(() => {
             setLoadingText(t('predict.loading.analyzing'));
         }, 2000);
         
         const finalFormData = { ...formData, ipc: formData.ipc === "Other / Custom" ? formData.custom_ipc : formData.ipc };
         const data = await predictBail(finalFormData);
         clearTimeout(timeoutId);
         setPredictionResult(data);

         setStatus('drafting');

         // Start explanation generation in parallel
         setExplanationLoading(true);
         explainBailDecision(finalFormData, data)
            .then(exp => {
               setExplanationData(exp);
               setExplanationLoading(false);
            })
            .catch(err => {
               console.error("Explanation failed:", err);
               setExplanationLoading(false);
            });

         const args = await generateArguments(finalFormData);
         setArgumentsList(args);
         
         setStatus('result');
         
         // ⬆ increment global stats
         try {
            const { data: stats } = await supabase.from('stats').select('*').single();
            if (stats && args && Array.isArray(args)) {
               await supabase.from('stats').update({
                  total_predictions: (stats.total_predictions || 0) + 1,
                  arguments_generated: (stats.arguments_generated || 0) + args.length
               }).eq('id', stats.id);
            }
         } catch (err) {
            console.error("Failed to update stats:", err);
         }
      } catch (error: unknown) {
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
           ipc_section: formData.ipc === "Other / Custom" ? formData.custom_ipc : formData.ipc,
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
       const finalFormData = { ...formData, ipc: formData.ipc === "Other / Custom" ? formData.custom_ipc : formData.ipc };
       navigate('/bail-application', { state: { caseData: finalFormData, arguments: argumentsList } });
   };

   const inputClass = "w-full bg-[var(--bg-secondary)] border border-[var(--border-primary)] text-[var(--text-primary)] rounded-lg p-3 text-sm focus:outline-none focus:border-[var(--gold)] focus:ring-1 focus:ring-[var(--gold)] transition-colors shadow-sm";
   const labelClass = "block text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider mb-2";

   const isGranted = String(predictionResult?.prediction || '').toLowerCase() === 'granted' || Number(predictionResult?.prediction) === 1;

   return (
      <>
      <div className="min-h-screen bg-[var(--bg-primary)] w-full pb-16">

         {/* PAGE HEADER */}
         <div className="border-b border-[var(--border-subtle)] bg-[var(--bg-secondary)] px-6 py-14">
            <div className="max-w-[1400px] mx-auto">
               <span className="text-[10px] font-black uppercase tracking-[4px] text-[#C9A84C]">{t('predict.header_label')}</span>
               <h1 className="mt-4 text-4xl font-serif font-black text-[var(--text-primary)] tracking-tight">{t('predict.title')}</h1>
               <p className="text-[var(--text-muted)] font-medium mt-2">{t('predict.subtitle')}</p>
            </div>
         </div>

         <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-12">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
               
               {/* LEFT SIDE: FORM */}
               <div className="lg:col-span-5 relative">
                  <form onSubmit={handlePredict} className="bg-[var(--bg-secondary)] rounded-2xl p-8 shadow-sm border border-[var(--border-subtle)] sticky top-[96px]">
                     <div className="flex items-center gap-3 mb-8 pb-6 border-b border-[var(--border-subtle)]">
                        <div className="w-11 h-11 rounded-xl bg-[var(--bg-primary)] flex items-center justify-center border border-[var(--border-subtle)]">
                           <Scale className="text-[var(--text-primary)]" size={22} />
                        </div>
                        <div>
                           <h2 className="text-xl font-black text-[var(--text-primary)]">{t('predict.form.case_details')}</h2>
                        </div>
                     </div>

                     <div className="space-y-6">
                        <div>
                           <label className={labelClass}>
                              {t('predict.form.ipc_section')}
                              {isVoiceFilled('ipc') && <VoiceBadge />}
                           </label>
                           <select name="ipc" value={formData.ipc} onChange={handleChange} className={inputClass}>
                              {IPC_SECTIONS.map(ipc => <option key={ipc} value={ipc}>{ipc.replace('Section ', '')}</option>)}
                           </select>
                           {formData.ipc === "Other / Custom" && (
                              <input
                                 type="text"
                                 name="custom_ipc"
                                 value={formData.custom_ipc}
                                 onChange={handleChange}
                                 placeholder="Enter custom IPC or law section"
                                 className={`mt-3 ${inputClass}`}
                                 required
                              />
                           )}
                        </div>
                        <div>
                           <label className={labelClass}>{t('predict.form.crime')}</label>
                           <div className="relative group">
                              <input type="text" name="crime" value={formData.crime} readOnly className={`${inputClass} bg-[var(--bg-surface)] border-none cursor-not-allowed text-[#0a0f1e]/60 font-black italic select-none shadow-inner`} />
                              <div className="absolute right-4 top-1/2 -translate-y-1/2 text-[10px] font-black uppercase text-[var(--text-muted)] opacity-50">{t('predict.form.system_filled')}</div>
                           </div>
                        </div>

                        <div className="grid grid-cols-2 gap-5">
                           <div>
                              <label className={labelClass}>
                                 {t('predict.form.bail_type')}
                                 {isVoiceFilled('bail_type') && <VoiceBadge />}
                              </label>
                              <select name="bail_type" value={formData.bail_type} onChange={handleChange} className={inputClass}>
                                 {BAIL_TYPES.map(b => <option key={b} value={b}>{b}</option>)}
                              </select>
                           </div>
                           <div>
                              <label className={labelClass}>
                                 {t('predict.form.court')}
                                 {isVoiceFilled('court') && <VoiceBadge />}
                              </label>
                              <select name="court" value={formData.court} onChange={handleChange} className={inputClass}>
                                 {COURTS.map(c => <option key={c} value={c}>{c}</option>)}
                              </select>
                           </div>
                        </div>

                        <div className="grid grid-cols-2 gap-5">
                           <div>
                              <label className={labelClass}>
                                 {t('predict.form.custody')}
                                 {isVoiceFilled('custody') && <VoiceBadge />}
                              </label>
                              <div className="relative flex items-center">
                                 <input type="number" name="custody" value={formData.custody} onChange={handleChange} required min="0" placeholder="0" className={`${inputClass} pr-16`} />
                                 <div className="absolute right-3 text-[10px] font-black uppercase text-[var(--text-muted)] pointer-events-none">{t('predict.form.months')}</div>
                              </div>
                           </div>
                           <div>
                              <label className={labelClass}>
                                 {t('predict.form.age')}
                                 {isVoiceFilled('age') && <VoiceBadge />}
                              </label>
                              <div className="relative flex items-center">
                                 <input type="number" name="age" value={formData.age} onChange={handleChange} required min="18" max="100" className={`${inputClass} pr-16`} />
                                 <div className="absolute right-8 text-[10px] font-black uppercase text-[var(--text-muted)] pointer-events-none">{t('predict.form.years')}</div>
                              </div>
                           </div>
                        </div>



                        <div className="grid grid-cols-1 gap-5">
                           <div className="flex gap-4">
                              <div className="w-1/2">
                                 <label className={labelClass}>
                                    {t('predict.form.first_offender')}
                                    {isVoiceFilled('first_offender') && <VoiceBadge />}
                                 </label>
                                 <select name="first_offender" value={formData.first_offender} onChange={handleChange} className={inputClass}>
                                    {YES_NO.map(o => <option key={o} value={o}>{o}</option>)}
                                 </select>
                              </div>
                              <div className="w-1/2">
                                 <label className={labelClass}>
                                    {t('predict.form.prior_record')}
                                    {isVoiceFilled('prior_record') && <VoiceBadge />}
                                 </label>
                                 <select name="prior_record" value={formData.prior_record} onChange={handleChange} className={inputClass}>
                                    {YES_NO.map(o => <option key={o} value={o}>{o}</option>)}
                                 </select>
                              </div>
                           </div>
                        </div>

                        <div>
                           <div className="flex justify-between items-center mb-2">
                              <label className={`${labelClass} mb-0`}>
                                {t('predict.form.description')}
                              </label>
                              <SmartVoiceAutoFill onAutoFill={handleAutoFill} />
                           </div>
                           <textarea name="description" value={formData.description} onChange={handleChange} rows={3} placeholder={t('predict.form.description')} className={inputClass}></textarea>
                        </div>

                        <div className="pt-4 border-t border-[var(--border-subtle)]">
                           <button 
                              type="submit" 
                              disabled={status === 'predicting' || status === 'drafting'}
                              className="w-full bg-[var(--btn-primary-bg)] text-[var(--btn-primary-text)] font-black text-sm py-4 px-6 rounded-xl shadow-xl shadow-black/10 transition-all duration-300 hover:bg-[var(--btn-primary-hover)] hover:scale-[1.02] active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed flex justify-center items-center gap-2 uppercase tracking-widest"
                           >
                              {(status === 'predicting' || status === 'drafting') ? t('predict.form.analyzing') : t('predict.form.submit')}
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
                           className="w-full h-full min-h-[600px] flex flex-col items-center justify-center text-center p-12 bg-[var(--bg-secondary)] rounded-[3rem] border-4 border-dashed border-[var(--border-subtle)] shadow-[0_30px_60px_rgba(0,0,0,0.02)] relative overflow-hidden group"
                        >
                           <div className="absolute inset-0 bg-gradient-to-br from-[#C9A84C]/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-1000"></div>
                           <div className="w-24 h-24 bg-[var(--bg-surface)] rounded-[2rem] flex items-center justify-center mb-8 shadow-inner group-hover:bg-[#0a0f1e] transition-colors duration-500">
                              <Scale size={48} className="text-slate-200 group-hover:text-[#C9A84C] transition-colors" />
                           </div>
                           <h3 className="text-2xl font-black text-[var(--text-primary)] mb-4 tracking-tight">{t('predict.idle.title')}</h3>
                           <p className="text-[var(--text-muted)] text-base max-w-sm mb-8 font-medium leading-relaxed italic">{t('predict.idle.subtitle')}</p>
                           <div className="flex gap-2">
                              {[1,2,3].map(i => <div key={i} className="w-2 h-2 rounded-full bg-[var(--bg-surface)]"></div>)}
                           </div>
                        </motion.div>
                     )}

                     {status === 'predicting' && (
                        <motion.div 
                           key="predicting" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}
                           className="w-full min-h-[400px] flex flex-col items-center justify-center p-12 bg-[var(--bg-secondary)] rounded-[2rem] shadow-[0_4px_24px_rgba(0,0,0,0.04)] border border-[var(--border-subtle)]"
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
                           <div className="w-64 h-2 bg-[var(--bg-surface)] rounded-full overflow-hidden relative">
                              <motion.div className="absolute top-0 left-0 h-full bg-[#C9A84C]" initial={{ width: "0%" }} animate={{ width: "100%" }} transition={{ duration: 3.5 }} />
                           </div>
                        </motion.div>
                     )}

                     {status === 'error' && (
                        <motion.div 
                           key="error" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                           className="w-full min-h-[400px] flex flex-col items-center justify-center text-center p-12 bg-[var(--bg-secondary)] rounded-[2rem] border border-red-200 shadow-[0_4px_24px_rgba(0,0,0,0.02)]"
                        >
                           <AlertTriangle size={64} className="text-red-400 mb-6" />
                           <h3 className="text-xl font-bold text-[#0a0f1e] mb-2">Analysis Failed</h3>
                           <p className="text-[var(--text-secondary)] text-sm max-w-sm mb-6">{errorMsg}</p>
                           <button onClick={() => setStatus('idle')} className="bg-[#0a0f1e] text-[var(--btn-primary-text)] px-6 py-2.5 rounded-xl font-bold text-sm">Retry</button>
                        </motion.div>
                     )}

                     {(status === 'drafting' || status === 'result') && predictionResult && (
                        <motion.div key="result_step1" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-[var(--bg-secondary)] rounded-[2rem] p-8 shadow-[0_4px_24px_rgba(0,0,0,0.04)] border border-[var(--border-subtle)] flex flex-col items-center py-10 relative overflow-hidden">
                           <div className="absolute top-0 left-0 w-full h-2" style={{ backgroundColor: isGranted ? '#22c55e' : '#ef4444' }} />
                           
                           <div className={`px-8 py-2.5 rounded-full font-black text-2xl mb-8 border-2 shadow-sm ${isGranted ? 'bg-emerald-50 text-emerald-600 border-emerald-200' : 'bg-red-50 text-red-600 border-red-200'}`}>
                              {isGranted ? `${t('predict.result.granted')} ✅` : `${t('predict.result.rejected')} ❌`}
                           </div>

                           <div className="relative w-48 h-48 flex items-center justify-center mb-6">
                              <svg className="absolute w-full h-full transform -rotate-90">
                                 <circle cx="96" cy="96" r="88" strokeWidth="12" stroke="#f1f5f9" fill="none" />
                                 <motion.circle 
                                    initial={{ strokeDasharray: "0, 1000" }} animate={{ strokeDasharray: `${((Number(predictionResult.confidence) || 0) / 100) * 553}, 1000` }} transition={{ duration: 1.5, ease: "easeOut" }}
                                    cx="96" cy="96" r="88" strokeWidth="12" stroke={isGranted ? '#22c55e' : '#ef4444'} fill="none" strokeLinecap="round"
                                 />
                              </svg>
                              <div className="relative z-10 flex flex-col items-center">
                                 <span className="text-5xl font-extrabold tracking-tighter" style={{ color: isGranted ? '#22c55e' : '#ef4444' }}>
                                    <CountUp end={Number(predictionResult.confidence) || 0} duration={1.5} />%
                                 </span>
                                 <span className="text-xs font-bold text-[var(--text-muted)] mt-1 uppercase tracking-wider">{t('predict.result.confidence')}</span>
                              </div>
                           </div>
                           <h3 className="text-sm font-bold tracking-widest uppercase text-[var(--text-secondary)] bg-[var(--bg-surface)] px-4 py-2 rounded-lg border border-[var(--border-subtle)] flex items-center gap-3">
                              {predictionResult.likelihood} {t('predict.result.likelihood')}
                              <VoiceOutput text={`${isGranted ? t('predict.result.granted') : t('predict.result.rejected')}, ${predictionResult.confidence} percent confidence, ${predictionResult.likelihood} likelihood.`} />
                           </h3>
                        </motion.div>
                     )}

                     {(status === 'drafting' || status === 'result') && predictionResult && (explanationLoading || explanationData) && (
                        <ExplainabilityPanel data={explanationData} loading={explanationLoading} />
                     )}

                     {status === 'drafting' && (
                        <motion.div key="drafting_args" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-[var(--bg-secondary)] rounded-[2rem] p-12 shadow-[0_4px_24px_rgba(0,0,0,0.04)] border border-[var(--border-subtle)] flex flex-col items-center justify-center relative overflow-hidden">
                           <div className="absolute inset-0 bg-gradient-to-br from-indigo-50/50 to-white/50 pointer-events-none"></div>
                           <motion.div animate={{ rotate: 360 }} transition={{ duration: 4, repeat: Infinity, ease: "linear" }} className="w-20 h-20 mb-6 text-[#C9A84C]">
                              <Sparkles size={80} strokeWidth={1.5} />
                           </motion.div>
                           <h3 className="text-xl font-bold text-[#0a0f1e] mb-2">{t('predict.loading.drafting')}</h3>
                           <p className="text-sm font-semibold text-[var(--text-secondary)] animate-pulse">{t('predict.loading.drafting_sub')}</p>
                        </motion.div>
                     )}

                     {status === 'result' && argumentsList.length > 0 && (
                        <motion.div key="result_step2" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-[var(--bg-secondary)] rounded-[2rem] shadow-[0_8px_32px_rgba(0,0,0,0.12)] border border-[var(--border-primary)] flex flex-col overflow-hidden">
                           <div className="p-8 pb-6 border-b border-[var(--border-subtle)] flex justify-between items-center bg-[var(--bg-primary)]/30">
                              <h3 className="text-xl font-black text-[var(--text-primary)] flex items-center gap-3">
                                 <div className="flex flex-col">
                                    <span className="text-xl font-black text-[var(--text-primary)]">{t('predict.result.arguments_title')}</span>
                                    <p className="text-sm font-bold text-[var(--text-secondary)] mt-1">{t('predict.result.arguments_desc')}</p>
                                 </div>
                              </h3>
                              <VoiceOutput text={argumentsList.map((a, i) => `Argument ${i+1}. ${a.ground}. ${a.argument}`).join('. ')} />
                           </div>
                           
                           <div className="flex flex-col gap-6 p-8 bg-[var(--bg-primary)]/10">
                              {argumentsList.map((arg, idx) => (
                                 <motion.div key={idx} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: idx * 0.1 }} className="p-6 rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] shadow-[0_2px_12px_rgba(0,0,0,0.03)] hover:shadow-lg hover:border-[#C9A84C]/30 transition-all group relative overflow-hidden">
                                    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-[#C9A84C] to-transparent opacity-70"></div>
                                    <h4 className="font-bold text-lg text-[#C9A84C] mb-3 pr-4 flex items-center gap-2">
                                      <span className="text-xs font-black bg-[#C9A84C]/10 text-[#C9A84C] px-2 py-0.5 rounded border border-[#C9A84C]/20">{idx + 1}</span>
                                      {arg.ground}
                                    </h4>
                                    <p className="text-[15px] font-medium leading-[1.8] text-[var(--text-primary)] mb-5">{arg.argument}</p>
                                    
                                    <div className="flex items-start gap-2 pt-4 border-t border-[var(--border-subtle)]/50">
                                       <div className="mt-0.5">
                                         <BookOpen size={14} className="text-[#C9A84C]/70" />
                                       </div>
                                       <span className="text-xs font-bold italic text-[var(--text-muted)] group-hover:text-[var(--text-primary)] transition-colors">{arg.citation}</span>
                                    </div>
                                 </motion.div>
                              ))}
                           </div>

                           <div className="p-6 bg-[var(--bg-primary)]/30 border-t border-[var(--border-subtle)] flex flex-wrap lg:flex-nowrap gap-4">
                              <button onClick={handleCopyAll} className="flex-1 h-12 bg-[var(--bg-surface)] border border-[var(--border-subtle)] text-[var(--text-primary)] font-bold rounded-xl flex justify-center items-center gap-2 hover:bg-[var(--bg-secondary)] hover:border-[#C9A84C]/50 transition-all shadow-sm">
                                 {copied ? <Check size={16} className="text-emerald-500" /> : <Copy size={16} className="text-[var(--text-muted)]" />} 
                                 {copied ? t('predict.result.copied') : t('predict.result.copy_all')}
                              </button>
                              <button onClick={handleOpenSaveModal} disabled={saved} className="flex-1 h-12 bg-[var(--bg-surface)] border border-[var(--border-subtle)] text-[var(--text-primary)] font-bold rounded-xl flex justify-center items-center gap-2 hover:bg-[var(--bg-secondary)] hover:border-[#C9A84C]/50 transition-all shadow-sm disabled:opacity-50 disabled:cursor-not-allowed">
                                 {saved ? <CheckCircle2 size={16} className="text-emerald-500" /> : <Bookmark size={16} className="text-[var(--text-muted)]" />}
                                 {saved ? t('predict.result.saved') : t('predict.result.save_case')}
                              </button>
                              <button onClick={handleGenerateDraft} className="flex-[2] h-12 bg-[var(--btn-primary-bg)] text-[var(--btn-primary-text)] font-black tracking-wider uppercase text-sm rounded-xl shadow-lg shadow-black/10 transition-all flex justify-center items-center gap-2 hover:bg-[var(--btn-primary-hover)] hover:scale-[1.02] group">
                                 {t('predict.result.generate_draft')} <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
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
              className="bg-[var(--bg-secondary)] rounded-2xl p-8 max-w-md w-full shadow-2xl border border-[var(--border-subtle)]"
              onClick={e => e.stopPropagation()}
            >
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-xl bg-[var(--bg-primary)] border border-[var(--border-subtle)] flex items-center justify-center">
                  <Calendar size={20} className="text-[#C9A84C]" />
                </div>
                <div>
                  <h3 className="font-black text-[var(--text-primary)] text-lg">{t('predict.save_modal.title')}</h3>
                  <p className="text-xs text-[var(--text-muted)] font-medium">{t('predict.save_modal.subtitle')}</p>
                </div>
              </div>

              <div className="mb-8">
                <label className="block text-[10px] font-black uppercase tracking-[2px] text-[var(--text-muted)] mb-2">{t('predict.save_modal.hearing_date')} <span className="text-slate-300 normal-case font-medium">{t('predict.save_modal.optional')}</span></label>
                <input
                  type="date"
                  value={hearingDate}
                  onChange={e => setHearingDate(e.target.value)}
                  min={new Date().toISOString().split('T')[0]}
                  className="w-full h-12 bg-[var(--bg-primary)] border border-[var(--border-primary)] rounded-xl px-4 text-sm font-medium text-[var(--text-primary)] focus:outline-none focus:border-[#C9A84C] focus:ring-4 focus:ring-[#C9A84C]/10 transition-all"
                />
              </div>

              {saveError && (
                <p className="text-red-500 text-xs font-semibold mb-4 text-center">{saveError}</p>
              )}

              <div className="flex gap-3">
                <button
                  onClick={() => { setShowSaveModal(false); setSaveError(''); }}
                  className="flex-1 h-12 border border-[var(--border-primary)] text-[var(--text-secondary)] font-black text-sm rounded-xl hover:border-[var(--border-primary)] transition-all"
                >
                  {t('predict.save_modal.cancel')}
                </button>
                <button
                  onClick={handleSaveCase}
                  disabled={savingCase}
                  className="flex-1 h-12 bg-[var(--btn-primary-bg)] text-[var(--btn-primary-text)] font-black text-sm rounded-xl hover:bg-[var(--btn-primary-hover)] hover:scale-[1.02] transition-all shadow-lg shadow-black/10 disabled:opacity-60 flex items-center justify-center gap-2"
                >
                  {savingCase ? <><Loader2 size={15} className="animate-spin" /> {t('predict.save_modal.saving')}</> : t('predict.save_modal.save')}
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