import React, { useState, useEffect, useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Scale, 
  AlertTriangle, 
  Bookmark, 
  ArrowRight, 
  Copy, 
  CheckCircle2, 
  BookOpen, 
  Check, 
  Calendar, 
  Loader2, 
  FileText, 
  ShieldCheck, 
  Zap, 
  BrainCircuit,
  LayoutDashboard
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { predictBail, generateArguments, explainBailDecision, parseLegalDocument, generateAnalysisFromOcr, analyzePdfDirectly } from '../lib/gemini';
import type { VoiceParsedData } from '../lib/gemini';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/useAuth';
import ExplainabilityPanel from '../components/ExplainabilityPanel';
import SmartVoiceAutoFill from '../components/SmartVoiceAutoFill';
import type { AutoFillResult } from '../components/SmartVoiceAutoFill';
import PdfUploader from '../components/PdfUploader';
import PdfAnalysisResultView from '../components/PdfAnalysisResultView';
import { analyzePdf } from '../lib/pdfAnalysis';
import type { PdfAnalysisResult } from '../lib/pdfAnalysis';
import { extractPdfText } from '../lib/pdfText';

const SectionLabel: React.FC<{ label: string; icon?: React.ReactNode }> = ({ label, icon }) => (
  <div className="flex items-center gap-3 mb-6 pb-4 border-b border-[var(--border-subtle)]">
    {icon && <div className="text-[#C9A84C]">{icon}</div>}
    <span className="text-[10px] font-black uppercase tracking-[4px] text-[var(--text-muted)]">{label}</span>
  </div>
);

const VoiceBadge: React.FC = () => (
  <span className="ml-2 inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-black uppercase tracking-wider bg-emerald-500/15 text-emerald-500 border border-emerald-500/30">
    <CheckCircle2 size={9} /> Voice
  </span>
);

const PdfBadge: React.FC = () => (
  <span className="ml-2 inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-black uppercase tracking-wider bg-amber-500/15 text-amber-500 border border-amber-500/30">
    <FileText size={9} /> PDF
  </span>
);

const IPC_CRIME_MAP: Record<string, string> = {
  "Section 279 — Rash Driving": "Other",
  "Section 304A — Death by Negligence": "Other",
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

const Quadrant: React.FC<{ children: React.ReactNode; className?: string; delay?: number }> = ({ children, className, delay = 0 }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.5, delay }}
    className={`bg-[var(--bg-secondary)] rounded-3xl p-8 border border-[var(--border-subtle)] shadow-sm ${className}`}
  >
    {children}
  </motion.div>
);

const Predict: React.FC = () => {
   const location = useLocation();
   const navigate = useNavigate();
   const { user } = useAuth();
   const { t } = useTranslation();

   const [formData, setFormData] = useState({
      ipc: '',
      custom_ipc: '',
      crime: '',
      bail_type: '',
      court: '',
      custody: '',
      age: '',
      crime_severity: '3',
      first_offender: '',
      prior_record: '',
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
   const [pdfFilledFields, setPdfFilledFields] = useState<string[]>([]);

   // PDF Analysis State
   const [pdfResult, setPdfResult] = useState<PdfAnalysisResult | null>(null);
   const [isPdfAnalyzing, setIsPdfAnalyzing] = useState(false);
   const [pdfError, setPdfError] = useState<string | null>(null);

   const isVoiceFilled = (field: string) => voiceFilledFields.includes(field);
   const isPdfFilled = (field: string) => pdfFilledFields.includes(field);

   const mapRawIpcToSection = useCallback((raw: string | null | undefined): string => {
      if (!raw || typeof raw !== 'string') return '';
      const trimmed = raw.trim();
      if (!trimmed) return '';
      
      // Try exact match
      if (IPC_CRIME_MAP[trimmed]) return trimmed;
      
      // Try finding by section number (robust regex-like check)
      const found = IPC_SECTIONS.find(s => {
         const sectionNum = s.split(' — ')[0].replace('Section ', '').trim();
         return trimmed.includes(sectionNum) || sectionNum.includes(trimmed);
      });
      return found || '';
   }, []);

   useEffect(() => {
      window.scrollTo(0, 0);
      const state = location.state as Record<string, unknown> | null;
      if (!state?.prefilled) return;
      const timer = window.setTimeout(() => {
        setFormData(prev => ({
          ...prev,
          ipc: (state.offense_type as string) || prev.ipc,
          crime: (state.crime as string) || prev.crime,
          court: (state.court as string) || prev.court,
        }));
      }, 0);
      return () => window.clearTimeout(timer);
   }, [location.state]);

   const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
      const { name, value } = e.target;
      setVoiceFilledFields(prev => prev.filter(f => f !== name));
      setPdfFilledFields(prev => prev.filter(f => f !== name));
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

   const handleAutoFill = useCallback((result: AutoFillResult, type: 'voice' | 'pdf' = 'voice') => {
      setFormData(prev => {
        const next = { ...prev };
        if (result.data.ipc) { 
           const mappedIpc = mapRawIpcToSection(result.data.ipc);
           if (mappedIpc) {
              next.ipc = mappedIpc; 
              next.crime = IPC_CRIME_MAP[mappedIpc] || prev.crime; 
           } else if (result.data.ipc.length > 0) {
              // If not found in map but not empty, use custom
              next.ipc = "Other / Custom";
              next.custom_ipc = result.data.ipc;
              next.crime = "Other";
           }
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
      if (type === 'voice') {
         setVoiceFilledFields(result.filledFields);
      } else {
         setPdfFilledFields(result.filledFields);
      }
    }, [mapRawIpcToSection]);

   const handlePdfSelect = async (file: File) => {
      setIsPdfAnalyzing(true);
      setPdfError(null);
      setPdfResult(null); // Clear previous results
      
      try {
         console.log("Starting Fat & Correct Analysis Pipeline for:", file.name);
         
         // STAGE 1: Primary API Attempt (OCR + Fast Analysis)
         let apiResult = null;
         let ocrText = "";
         try {
            console.log("Stage 1: Hitting PDF Analyzer API at", import.meta.env.VITE_PDF_ANALYZER_API_URL);
            apiResult = await analyzePdf(file);
            console.log("Stage 1 (HF API) Success. Data received:", apiResult);
            ocrText = apiResult?.ocr_text || "";
         } catch (apiErr: any) {
            console.warn("Stage 1 (HF API) Failed, proceeding to Stage 2 Deep AI Analysis:", apiErr.message);
         }

         // STAGE 2: Deep Context AI Analysis (Gemini Multimodal)
         // If HF API failed to give us OCR text, extract text locally (pdf.js) and analyze that.
         let aiAnalysis = null;
         if (!ocrText) {
            console.log("No OCR text available. Extracting PDF text locally...");
            try {
              const localText = await extractPdfText(file);
              if (localText) {
                console.log("Local PDF text extracted. Generating summary via Gemini...");
                ocrText = localText;
                aiAnalysis = await generateAnalysisFromOcr(localText);
              } else if (apiResult?.analysis?.summary) {
                console.log("Local text empty. Using HF summary for Gemini analysis...");
                aiAnalysis = await generateAnalysisFromOcr(String(apiResult.analysis.summary));
              } else {
                console.log("Local PDF text extraction empty. Falling back to direct Gemini PDF scan...");
                aiAnalysis = await analyzePdfDirectly(file);
              }
            } catch (e) {
              console.warn("Local PDF text extraction failed. Falling back to HF summary / direct scan.", e);
              if (apiResult?.analysis?.summary) {
                aiAnalysis = await generateAnalysisFromOcr(String(apiResult.analysis.summary));
              } else {
                aiAnalysis = await analyzePdfDirectly(file);
              }
            }
         } else {
            console.log("OCR text available. Generating summary via Gemini...");
            aiAnalysis = await generateAnalysisFromOcr(ocrText);
         }
         
         if (!aiAnalysis) {
            throw new Error("AI Intelligence Engine failed to process the extracted text.");
         }

         // Merge results: Prefer HF API data directly if available, fallback to Gemini
         const finalAnalysis = {
            ...(aiAnalysis || {}),
            ...(apiResult?.analysis || {})
         };
         
         if (!finalAnalysis.summary) {
            finalAnalysis.summary = apiResult?.analysis?.summary || aiAnalysis?.summary || "Summary generation failed.";
         }

         const finalResult = {
            ocr_text: ocrText || "Text extraction details limited.",
            analysis: finalAnalysis
         };

         setPdfResult(finalResult as any);

         // STAGE 3: Full Form Auto-Fill
         const parsed: VoiceParsedData = await parseLegalDocument(ocrText || finalAnalysis.summary, finalAnalysis.summary);
         console.log("Stage 3 (Auto-Fill) Data:", parsed);
         
         const mappedIpc = mapRawIpcToSection(parsed.ipc_section);
         
         handleAutoFill({
            data: {
               ipc: mappedIpc || undefined,
               bail_type: parsed.bail_type || undefined,
               court: parsed.court || undefined,
               custody: parsed.custody_months !== null ? String(parsed.custody_months) : "0",
               age: parsed.accused_age !== null ? String(parsed.accused_age) : "30",
               first_offender: parsed.first_offender || "No",
               prior_record: parsed.prior_record || "No",
               description: finalAnalysis.summary
            },
            filledFields: [
               ...(mappedIpc ? ['ipc'] : []),
               ...(parsed.bail_type ? ['bail_type'] : []),
               ...(parsed.court ? ['court'] : []),
               ...(parsed.custody_months !== null ? ['custody'] : []),
               ...(parsed.accused_age !== null ? ['age'] : []),
               ...(parsed.first_offender ? ['first_offender'] : []),
               ...(parsed.prior_record ? ['prior_record'] : []),
               'description'
            ],
            missedFields: []
         }, 'pdf');

      } catch (err: any) {
         console.error("Fat Analysis Pipeline Error:", err);
         setPdfError(err.message || "AI Analysis Engine failed. Please verify your API Key in .env.");
      } finally {
         setIsPdfAnalyzing(false);
      }
   };

   const handlePredict = async (e: React.FormEvent) => {
      e.preventDefault();
      if (!formData.ipc || !formData.bail_type || !formData.court || !formData.age || !formData.custody || !formData.first_offender || !formData.prior_record) {
         setErrorMsg('Please fill in all required fields before running the analysis.');
         setStatus('error');
         return;
      }

      setStatus('predicting');
      setLoadingText(t('predict.loading.connecting'));
      setErrorMsg('');
      setPredictionResult(null);
      setArgumentsList([]);
      setSaved(false);
      setExplanationData(null);

      try {
         const finalFormData = { ...formData, ipc: formData.ipc === "Other / Custom" ? formData.custom_ipc : formData.ipc };
         const data = await predictBail(finalFormData);
         setPredictionResult(data);
         setStatus('drafting');
         setExplanationLoading(true);
         explainBailDecision(finalFormData, data).then(exp => {
            setExplanationData(exp);
            setExplanationLoading(false);
         }).catch(() => setExplanationLoading(false));
         const args = await generateArguments(finalFormData);
         setArgumentsList(args);
         setStatus('result');
      } catch (error: unknown) {
         setErrorMsg('Prediction engines failed. Please check your network and try again.');
         setStatus('error');
      }
   };

   const handleCopyAll = () => {
       const text = argumentsList.map((a, i) => `Ground ${i+1}: ${a.ground}\nArgument: ${a.argument}`).join('\n\n');
       navigator.clipboard.writeText(text);
       setCopied(true);
       setTimeout(() => setCopied(false), 2000);
   };

   const handleSaveCase = async () => {
       if (!predictionResult || !user) return;
       setSavingCase(true);
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
       if (error) setSaveError('Failed to save.'); else { setSaved(true); setShowSaveModal(false); }
   };

   const inputClass = "w-full bg-[var(--bg-primary)] border border-[var(--border-subtle)] text-[var(--text-primary)] rounded-xl p-3.5 text-sm focus:outline-none focus:border-[#C9A84C] focus:ring-1 focus:ring-[#C9A84C] transition-all shadow-sm font-medium";
   const labelClass = "block text-[10px] font-black text-[var(--text-muted)] uppercase tracking-wider mb-2 flex items-center";
   const isGranted = String(predictionResult?.prediction || '').toLowerCase() === 'granted' || Number(predictionResult?.prediction) === 1;

   return (
      <div className="min-h-screen bg-[var(--bg-primary)] w-full pb-20">
         {/* HEADER */}
         <div className="bg-[var(--bg-secondary)] border-b border-[var(--border-subtle)] py-16 px-6 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-1/3 h-full bg-gradient-to-l from-[#C9A84C]/5 to-transparent"></div>
            <div className="max-w-[1400px] mx-auto relative z-10">
               <motion.span initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="text-[10px] font-black uppercase tracking-[6px] text-[#C9A84C] block mb-4">{t('predict.header_label')}</motion.span>
               <motion.h1 initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="text-5xl font-serif font-black text-[var(--text-primary)] tracking-tight">{t('predict.title')}</motion.h1>
               <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }} className="text-[var(--text-muted)] font-medium mt-4 text-lg max-w-2xl leading-relaxed">{t('predict.subtitle')}</motion.p>
            </div>
         </div>

         <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 -mt-10 relative z-20">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
               
               {/* QUADRANT A: PDF UPLOADER */}
               <Quadrant className="lg:col-span-5 h-full flex flex-col" delay={0.1}>
                  <SectionLabel label="Quadrant A: Document Input" icon={<FileText size={16} />} />
                  <div className="flex-1 flex flex-col justify-center">
                     <PdfUploader onFileSelect={handlePdfSelect} isProcessing={isPdfAnalyzing} />
                     {pdfError && (
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-4 p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-500 text-xs font-bold flex items-center gap-2">
                           <AlertTriangle size={14} /> {pdfError}
                        </motion.div>
                     )}
                  </div>
               </Quadrant>

               {/* QUADRANT B: DOCUMENT INTELLIGENCE */}
               <Quadrant className="lg:col-span-7 h-full min-h-[400px] flex flex-col" delay={0.2}>
                  <SectionLabel label="Quadrant B: Document Intelligence" icon={<BrainCircuit size={16} />} />
                  <div className="flex-1 overflow-y-auto custom-scrollbar pr-2">
                     <AnimatePresence mode="wait">
                        {isPdfAnalyzing ? (
                           <motion.div key="analyzing" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="h-full flex flex-col items-center justify-center gap-6">
                              <div className="relative">
                                 <Loader2 size={64} className="text-[#C9A84C] animate-spin" />
                                 <BrainCircuit size={32} className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-[#C9A84C]/50" />
                              </div>
                              <div className="text-center">
                                 <h3 className="text-xl font-black text-[var(--text-primary)]">AI Document Scan in Progress</h3>
                                 <p className="text-sm text-[var(--text-muted)] mt-2 animate-pulse font-medium">Extracting legal entities and risk factors...</p>
                              </div>
                           </motion.div>
                        ) : pdfResult ? (
                           <motion.div key="result" initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} className="w-full">
                              <PdfAnalysisResultView result={pdfResult} compact={true} />
                           </motion.div>
                        ) : (
                           <motion.div key="idle" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="h-full flex flex-col items-center justify-center text-center opacity-40 grayscale group hover:grayscale-0 hover:opacity-100 transition-all duration-700">
                              <div className="w-24 h-24 rounded-[2rem] bg-[var(--bg-primary)] border border-dashed border-[var(--border-subtle)] flex items-center justify-center mb-6 group-hover:scale-110 group-hover:rotate-12 transition-all">
                                 <ShieldCheck size={48} className="text-[var(--text-muted)] group-hover:text-[#C9A84C]" />
                              </div>
                              <h3 className="text-lg font-bold text-[var(--text-primary)]">Intelligence Engine Idle</h3>
                              <p className="text-xs text-[var(--text-muted)] max-w-[240px] mt-2 font-medium">Upload a legal document in Quadrant A to activate deep behavioral risk assessment.</p>
                              {/* Animated particles background could go here */}
                           </motion.div>
                        )}
                     </AnimatePresence>
                  </div>
               </Quadrant>

               {/* QUADRANT C: CASE DETAILS FORM */}
               <Quadrant className="lg:col-span-5" delay={0.3}>
                  <SectionLabel label="Quadrant C: Case Parameters" icon={<LayoutDashboard size={16} />} />
                  <form onSubmit={handlePredict} className="space-y-6">
                     <div>
                        <label className={labelClass}>
                           {t('predict.form.ipc_section')}
                           {isVoiceFilled('ipc') && <VoiceBadge />}
                           {isPdfFilled('ipc') && <PdfBadge />}
                        </label>
                        <select name="ipc" value={formData.ipc} onChange={handleChange} className={inputClass} required>
                           <option value="" disabled>Select IPC Section</option>
                           {IPC_SECTIONS.map(ipc => <option key={ipc} value={ipc}>{ipc.replace('Section ', '')}</option>)}
                        </select>
                        {formData.ipc === "Other / Custom" && (
                           <input type="text" name="custom_ipc" value={formData.custom_ipc} onChange={handleChange} placeholder="Custom Section" className={`mt-3 ${inputClass}`} required />
                        )}
                     </div>

                     <div className="grid grid-cols-2 gap-4">
                        <div>
                           <label className={labelClass}>
                              {t('predict.form.bail_type')}
                              {isPdfFilled('bail_type') && <PdfBadge />}
                           </label>
                           <select name="bail_type" value={formData.bail_type} onChange={handleChange} className={inputClass} required>
                              <option value="" disabled>Select Type</option>
                              {BAIL_TYPES.map(b => <option key={b} value={b}>{b}</option>)}
                           </select>
                        </div>
                        <div>
                           <label className={labelClass}>
                              {t('predict.form.court')}
                              {isPdfFilled('court') && <PdfBadge />}
                           </label>
                           <select name="court" value={formData.court} onChange={handleChange} className={inputClass} required>
                              <option value="" disabled>Select Court</option>
                              {COURTS.map(c => <option key={c} value={c}>{c}</option>)}
                           </select>
                        </div>
                     </div>

                     <div className="grid grid-cols-2 gap-4">
                        <div>
                           <label className={labelClass}>
                              {t('predict.form.custody')}
                              {isPdfFilled('custody') && <PdfBadge />}
                           </label>
                           <div className="relative flex items-center">
                              <input type="number" name="custody" value={formData.custody} onChange={handleChange} required min="0" placeholder="0" className={`${inputClass} pr-16`} />
                              <div className="absolute right-4 text-[10px] font-black uppercase text-[var(--text-muted)] opacity-50">Mos</div>
                           </div>
                        </div>
                        <div>
                           <label className={labelClass}>
                              {t('predict.form.age')}
                              {isPdfFilled('age') && <PdfBadge />}
                           </label>
                           <div className="relative flex items-center">
                              <input type="number" name="age" value={formData.age} onChange={handleChange} required min="18" max="100" className={`${inputClass} pr-16`} />
                              <div className="absolute right-4 text-[10px] font-black uppercase text-[var(--text-muted)] opacity-50">Yrs</div>
                           </div>
                        </div>
                     </div>

                     <div className="grid grid-cols-2 gap-4">
                        <div>
                           <label className={labelClass}>
                              {t('predict.form.first_offender')}
                              {isPdfFilled('first_offender') && <PdfBadge />}
                           </label>
                           <select name="first_offender" value={formData.first_offender} onChange={handleChange} className={inputClass} required>
                              <option value="" disabled>Select</option>
                              {YES_NO.map(o => <option key={o} value={o}>{o}</option>)}
                           </select>
                        </div>
                        <div>
                           <label className={labelClass}>
                              {t('predict.form.prior_record')}
                              {isPdfFilled('prior_record') && <PdfBadge />}
                           </label>
                           <select name="prior_record" value={formData.prior_record} onChange={handleChange} className={inputClass} required>
                              <option value="" disabled>Select</option>
                              {YES_NO.map(o => <option key={o} value={o}>{o}</option>)}
                           </select>
                        </div>
                     </div>

                     <div>
                        <div className="flex justify-between items-center mb-2">
                           <label className={`${labelClass} mb-0`}>{t('predict.form.description')}</label>
                           <SmartVoiceAutoFill onAutoFill={(res) => handleAutoFill(res, 'voice')} />
                        </div>
                        <textarea name="description" value={formData.description} onChange={handleChange} rows={3} placeholder="Brief case overview..." className={inputClass}></textarea>
                     </div>

                     <div className="pt-4">
                        <button type="submit" disabled={status === 'predicting' || status === 'drafting'} className="w-full bg-[var(--btn-primary-bg)] text-[var(--btn-primary-text)] font-black text-sm py-4.5 px-6 rounded-2xl shadow-xl shadow-[#C9A84C]/10 transition-all duration-300 hover:bg-[var(--btn-primary-hover)] hover:scale-[1.02] active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed flex justify-center items-center gap-3 uppercase tracking-[2px]">
                           {status === 'predicting' ? <><Loader2 size={18} className="animate-spin" /> {t('predict.form.analyzing')}</> : <><Zap size={18} fill="currentColor" /> Run Bail Analysis</>}
                        </button>
                     </div>
                  </form>
               </Quadrant>

               {/* QUADRANT D: BAIL PREDICTION OUTPUT */}
               <Quadrant className="lg:col-span-7 flex flex-col" delay={0.4}>
                  <SectionLabel label="Quadrant D: Prediction Engine" icon={<Scale size={16} />} />
                  <div className="flex-1 overflow-y-auto custom-scrollbar pr-2">
                     <AnimatePresence mode="wait">
                        {status === 'idle' ? (
                           <motion.div key="idle" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="h-full flex flex-col items-center justify-center text-center opacity-40 group hover:opacity-100 transition-all duration-500">
                              <div className="relative mb-8">
                                 <motion.div animate={{ rotate: 360 }} transition={{ duration: 10, repeat: Infinity, ease: "linear" }} className="w-32 h-32 rounded-full border-2 border-dashed border-[#C9A84C]/30"></motion.div>
                                 <Scale size={48} className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-[#C9A84C]" />
                              </div>
                              <h3 className="text-xl font-black text-[var(--text-primary)] tracking-tight">Ready for Legal Analysis</h3>
                              <p className="text-sm text-[var(--text-muted)] max-w-xs mt-3 font-medium leading-relaxed italic">Complete case parameters in Quadrant C and click "Run Analysis" to generate verdict and legal grounds.</p>
                           </motion.div>
                        ) : status === 'predicting' || status === 'drafting' ? (
                           <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="h-full flex flex-col items-center justify-center p-12">
                              <motion.div animate={{ scale: [1, 1.1, 1] }} transition={{ repeat: Infinity, duration: 2 }} className="w-24 h-24 rounded-3xl bg-[#C9A84C]/10 flex items-center justify-center mb-8">
                                 <BrainCircuit size={48} className="text-[#C9A84C]" />
                              </motion.div>
                              <h3 className="text-2xl font-black text-[#C9A84C] mb-4">{loadingText || "Processing Case Data..."}</h3>
                              <div className="w-64 h-1.5 bg-[var(--bg-primary)] rounded-full overflow-hidden">
                                 <motion.div initial={{ width: 0 }} animate={{ width: "100%" }} transition={{ duration: 4 }} className="h-full bg-[#C9A84C] shadow-[0_0_15px_rgba(201,168,76,0.5)]" />
                              </div>
                           </motion.div>
                        ) : status === 'result' && predictionResult ? (
                           <motion.div key="result" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-8">
                              {/* Verdict Chip */}
                              <div className="flex justify-center">
                                 <motion.div initial={{ scale: 0.8 }} animate={{ scale: 1 }} className={`px-12 py-4 rounded-full font-black text-3xl shadow-xl border-2 flex items-center gap-4 ${isGranted ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' : 'bg-red-500/10 text-red-500 border-red-500/20'}`}>
                                    {isGranted ? 'Bail Granted' : 'Bail Rejected'}
                                    {isGranted ? <CheckCircle2 size={32} /> : <AlertTriangle size={32} />}
                                 </motion.div>
                              </div>

                              {/* Confidence Gauge */}
                              <div className="flex flex-col items-center">
                                 <div className="relative w-48 h-48 flex items-center justify-center">
                                    <svg className="absolute w-full h-full transform -rotate-90">
                                       <circle cx="96" cy="96" r="88" strokeWidth="12" stroke="var(--border-subtle)" fill="none" />
                                       <motion.circle 
                                          initial={{ strokeDasharray: "0, 553" }} 
                                          animate={{ strokeDasharray: `${(predictionResult.confidence / 100) * 553}, 553` }} 
                                          transition={{ duration: 2, ease: "easeOut" }}
                                          cx="96" cy="96" r="88" strokeWidth="12" stroke={isGranted ? '#10b981' : '#ef4444'} fill="none" strokeLinecap="round" 
                                       />
                                    </svg>
                                    <div className="relative z-10 flex flex-col items-center">
                                       <span className="text-5xl font-black tracking-tighter" style={{ color: isGranted ? '#10b981' : '#ef4444' }}>
                                          <CountUp end={predictionResult.confidence} />%
                                       </span>
                                       <span className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-widest mt-1">Confidence</span>
                                    </div>
                                 </div>
                                 <p className="mt-4 text-sm font-bold text-[var(--text-secondary)] bg-[var(--bg-primary)] px-4 py-2 rounded-full border border-[var(--border-subtle)]">
                                    {predictionResult.likelihood} Likelihood
                                 </p>
                              </div>

                              {/* Explainability */}
                              <ExplainabilityPanel data={explanationData} loading={explanationLoading} />

                              {/* Arguments */}
                              {argumentsList.length > 0 && (
                                 <div className="mt-10">
                                    <h3 className="text-sm font-black uppercase tracking-[3px] text-[var(--text-muted)] mb-6 flex items-center gap-2">
                                       <BookOpen size={16} /> AI Generated Legal Grounds
                                    </h3>
                                    <div className="space-y-4">
                                       {argumentsList.map((arg, idx) => (
                                          <motion.div key={idx} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: idx * 0.1 }} className="p-6 rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-primary)]/50 hover:bg-[var(--bg-primary)] transition-all group relative overflow-hidden">
                                             <div className="absolute left-0 top-0 bottom-0 w-1 bg-[#C9A84C]/30 group-hover:bg-[#C9A84C] transition-all" />
                                             <h4 className="font-bold text-[#C9A84C] mb-2 flex items-center gap-2">
                                                <span className="text-[10px] font-black bg-[#C9A84C]/10 px-2 py-0.5 rounded">{idx + 1}</span>
                                                {arg.ground}
                                             </h4>
                                             <p className="text-sm font-medium leading-relaxed text-[var(--text-primary)]">{arg.argument}</p>
                                          </motion.div>
                                       ))}
                                    </div>
                                 </div>
                              )}

                              {/* Action Buttons */}
                              {errorMsg && (
                                 <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-500 text-xs font-bold flex items-center gap-2 mb-4">
                                    <AlertTriangle size={14} /> {errorMsg}
                                 </div>
                              )}
                              <div className="flex flex-wrap gap-4 pt-6">
                                 <button onClick={handleCopyAll} className="flex-1 h-14 bg-[var(--bg-primary)] border border-[var(--border-subtle)] text-[var(--text-primary)] font-black text-xs rounded-2xl flex justify-center items-center gap-2 hover:bg-[var(--bg-secondary)] transition-all uppercase tracking-widest">
                                    {copied ? <Check size={16} className="text-emerald-500" /> : <Copy size={16} />} {copied ? 'Copied' : 'Copy All'}
                                 </button>
                                 <button onClick={() => setShowSaveModal(true)} disabled={saved} className="flex-1 h-14 bg-[var(--bg-primary)] border border-[var(--border-subtle)] text-[var(--text-primary)] font-black text-xs rounded-2xl flex justify-center items-center gap-2 hover:bg-[var(--bg-secondary)] transition-all uppercase tracking-widest disabled:opacity-50">
                                    {saved ? <CheckCircle2 size={16} className="text-emerald-500" /> : <Bookmark size={16} />} {saved ? 'Saved' : 'Save Case'}
                                 </button>
                                 <button onClick={() => navigate('/bail-application', { state: { caseData: formData, arguments: argumentsList } })} className="w-full h-14 bg-[var(--btn-primary-bg)] text-[var(--btn-primary-text)] font-black text-xs rounded-2xl flex justify-center items-center gap-2 hover:bg-[var(--btn-primary-hover)] transition-all uppercase tracking-[2px] shadow-lg">
                                    Generate Legal Draft <ArrowRight size={18} />
                                 </button>
                              </div>
                           </motion.div>
                        ) : null}
                     </AnimatePresence>
                  </div>
               </Quadrant>

            </div>
         </div>

         {/* SAVE MODAL */}
         <AnimatePresence>
            {showSaveModal && (
               <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/60 backdrop-blur-md z-[100] flex items-center justify-center p-4">
                  <motion.div initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} className="bg-[var(--bg-secondary)] rounded-[2.5rem] p-10 max-w-md w-full shadow-2xl border border-white/10">
                     <SectionLabel label="Save to Repository" icon={<Calendar size={18} />} />
                     <div className="space-y-6">
                        <div>
                           <label className={labelClass}>Upcoming Hearing Date (Optional)</label>
                           <input type="date" value={hearingDate} onChange={e => setHearingDate(e.target.value)} className={inputClass} />
                        </div>
                        {saveError && <p className="text-red-500 text-xs font-bold">{saveError}</p>}
                        <div className="flex gap-4">
                           <button onClick={() => setShowSaveModal(false)} className="flex-1 h-14 border border-[var(--border-subtle)] text-[var(--text-secondary)] font-black text-xs rounded-2xl uppercase tracking-widest">Cancel</button>
                           <button onClick={handleSaveCase} disabled={savingCase} className="flex-1 h-14 bg-[#C9A84C] text-black font-black text-xs rounded-2xl uppercase tracking-widest hover:bg-[#b89640] transition-all flex items-center justify-center gap-2">
                              {savingCase ? <Loader2 size={16} className="animate-spin" /> : 'Confirm Save'}
                           </button>
                        </div>
                     </div>
                  </motion.div>
               </motion.div>
            )}
         </AnimatePresence>
      </div>
   );
};

export default Predict;