import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Mic, MicOff, Loader2, CheckCircle2, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { parseVoiceTranscript } from '../lib/gemini';
import type { VoiceParsedData } from '../lib/gemini';

type SpeechRecognitionCtor = new () => SpeechRecognitionLike;
type SpeechRecognitionLike = {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  onstart: null | (() => void);
  onend: null | (() => void);
  onerror: null | ((e: SpeechRecognitionErrorLike) => void);
  onresult: null | ((e: SpeechRecognitionResultLike) => void);
  start: () => void;
  stop: () => void;
};

type SpeechRecognitionErrorLike = { error?: string };
type SpeechRecognitionResultLike = {
  resultIndex: number;
  results: ArrayLike<{ isFinal: boolean; 0: { transcript: string } }>;
};

export interface AutoFillResult {
  data: Partial<{
    ipc: string;
    bail_type: string;
    court: string;
    custody: string;
    age: string;
    first_offender: string;
    prior_record: string;
    description: string;
  }>;
  filledFields: string[];
  missedFields: string[];
}

interface Props {
  onAutoFill: (result: AutoFillResult) => void;
}

type Step = 'idle' | 'listening' | 'parsing' | 'done' | 'error';

const FIELD_LABELS: Record<string, string> = {
  ipc: 'IPC Section',
  bail_type: 'Bail Type',
  court: 'Court',
  custody: 'Custody Duration',
  age: 'Age',
  first_offender: 'First Offender',
  prior_record: 'Prior Record',
};

const SmartVoiceAutoFill: React.FC<Props> = ({ onAutoFill }) => {
  const [isSupported] = useState(() => {
    if (typeof window === 'undefined') return false;
    const w = window as unknown as Record<string, unknown>;
    return Boolean(w.SpeechRecognition || w.webkitSpeechRecognition);
  });
  const [step, setStep] = useState<Step>('idle');
  const [lang, setLang] = useState<'en' | 'hi'>('en');
  const recognitionRef = useRef<SpeechRecognitionLike | null>(null);
  const transcriptRef = useRef<string>('');

  useEffect(() => {
    if (!isSupported) return;
    const w = window as unknown as Record<string, unknown>;
    const SpeechRecognition = (w.SpeechRecognition || w.webkitSpeechRecognition) as SpeechRecognitionCtor | undefined;
    if (!SpeechRecognition) return;
    const recog = new SpeechRecognition();
    recog.continuous = true;
    recog.interimResults = true;
    recognitionRef.current = recog;
  }, [isSupported]);

  const handleTranscript = useCallback(async (transcript: string) => {
    setStep('parsing');
    let parsed: VoiceParsedData;
    try {
      parsed = await parseVoiceTranscript(transcript, lang);
    } catch {
      parsed = {
        ipc_section: null, bail_type: null, court: null,
        custody_months: null, accused_age: null,
        first_offender: null, prior_record: null,
        description: transcript
      };
    }

    // Map parsed fields to form data
    const data: AutoFillResult['data'] = { description: parsed.description };
    const filledFields: string[] = [];
    const ALL_FIELDS = ['ipc', 'bail_type', 'court', 'custody', 'age', 'first_offender', 'prior_record'];

    if (parsed.ipc_section) { data.ipc = parsed.ipc_section; filledFields.push('ipc'); }
    if (parsed.bail_type) { data.bail_type = parsed.bail_type; filledFields.push('bail_type'); }
    if (parsed.court) { data.court = parsed.court; filledFields.push('court'); }
    if (parsed.custody_months !== null) { data.custody = String(parsed.custody_months); filledFields.push('custody'); }
    if (parsed.accused_age !== null) { data.age = String(parsed.accused_age); filledFields.push('age'); }
    if (parsed.first_offender) { data.first_offender = parsed.first_offender; filledFields.push('first_offender'); }
    if (parsed.prior_record) { data.prior_record = parsed.prior_record; filledFields.push('prior_record'); }

    const missedFields = ALL_FIELDS.filter(f => !filledFields.includes(f)).map(f => FIELD_LABELS[f]);

    onAutoFill({ data, filledFields, missedFields: missedFields });
    setStep('done');
    setTimeout(() => setStep('idle'), 3000);
  }, [lang, onAutoFill]);

  const startListening = useCallback(() => {
    const recog = recognitionRef.current;
    if (!recog) return;
    recog.lang = lang === 'hi' ? 'hi-IN' : 'en-IN';

    recog.onstart = () => {
      setStep('listening');
      transcriptRef.current = '';
    };
    recog.onend = () => { 
      // onend is called when speech recognition stops (either automatically or via stop())
      // We will handle the transcript processing in stopListening, or here if it stopped automatically.
      const text = transcriptRef.current.trim();
      if (text) {
        void handleTranscript(text);
        transcriptRef.current = ''; // prevent double processing
      } else {
        setStep(prev => prev === 'listening' ? 'idle' : prev);
      }
    };
    recog.onerror = (e) => {
      if (e.error === 'no-speech') {
        // do nothing, let it keep listening or handle timeout gracefully
      } else {
        setStep('idle');
      }
    };
    recog.onresult = (e) => {
      let final = '';
      for (let i = e.resultIndex; i < e.results.length; ++i) {
        if (e.results[i].isFinal) {
          final += e.results[i][0].transcript;
        } else {
          // ignore interim transcript for auto-fill
        }
      }
      if (final) {
        transcriptRef.current += final + ' ';
      }
    };

    try { recog.start(); } catch { setStep('idle'); }
  }, [lang, handleTranscript]);

  const stopListening = useCallback(() => {
    recognitionRef.current?.stop();
    const text = transcriptRef.current.trim();
    if (text) {
      handleTranscript(text);
      transcriptRef.current = '';
    } else {
      setStep('idle');
    }
  }, [handleTranscript]);

  if (!isSupported) return null;

  return (
    <div className="flex items-center gap-2 relative">
      {/* Language Toggle */}
      <div className="flex rounded-lg overflow-hidden border border-[var(--border-primary)] text-[11px] font-black">
        <button
          type="button"
          onClick={() => setLang('en')}
          className={`px-2 py-1 transition-colors ${lang === 'en' ? 'bg-[var(--gold)] text-black' : 'bg-[var(--bg-surface)] text-[var(--text-muted)] hover:text-[var(--text-primary)]'}`}
        >EN</button>
        <button
          type="button"
          onClick={() => setLang('hi')}
          className={`px-2 py-1 transition-colors ${lang === 'hi' ? 'bg-[var(--gold)] text-black' : 'bg-[var(--bg-surface)] text-[var(--text-muted)] hover:text-[var(--text-primary)]'}`}
        >हि</button>
      </div>

      {/* Mic Button */}
      <div className="relative">
        {/* Pulse ring when listening */}
        <AnimatePresence>
          {step === 'listening' && (
            <>
              <motion.div
                key="pulse1"
                initial={{ scale: 1, opacity: 0.6 }}
                animate={{ scale: 2.2, opacity: 0 }}
                transition={{ duration: 1.2, repeat: Infinity, ease: 'easeOut' }}
                className="absolute inset-0 bg-red-500 rounded-full pointer-events-none"
              />
              <motion.div
                key="pulse2"
                initial={{ scale: 1, opacity: 0.4 }}
                animate={{ scale: 1.7, opacity: 0 }}
                transition={{ duration: 1.2, repeat: Infinity, ease: 'easeOut', delay: 0.4 }}
                className="absolute inset-0 bg-red-400 rounded-full pointer-events-none"
              />
            </>
          )}
        </AnimatePresence>

        <button
          type="button"
          onClick={step === 'listening' ? stopListening : startListening}
          disabled={step === 'parsing'}
          title={
            step === 'listening'
              ? (lang === 'hi' ? 'सुन रहा है... रोकने के लिए क्लिक करें' : 'Listening… click to stop')
              : (lang === 'hi' ? 'बोलकर फॉर्म भरें' : 'Auto-fill form by voice')
          }
          className={`relative z-10 w-10 h-10 rounded-full flex items-center justify-center transition-all border ${
            step === 'listening'
              ? 'bg-red-600 border-red-500 text-white shadow-lg shadow-red-500/40'
              : step === 'parsing'
              ? 'bg-[var(--bg-surface)] border-[var(--border-primary)] text-[var(--gold)] cursor-wait'
              : step === 'done'
              ? 'bg-emerald-600 border-emerald-500 text-white'
              : step === 'error'
              ? 'bg-red-100 border-red-300 text-red-500'
              : 'bg-[var(--bg-surface)] border-[var(--border-primary)] text-[var(--text-muted)] hover:text-[var(--gold)] hover:border-[var(--gold)]'
          }`}
        >
          {step === 'parsing' && <Loader2 size={18} className="animate-spin" />}
          {step === 'listening' && <MicOff size={18} />}
          {step === 'done' && <CheckCircle2 size={18} />}
          {step === 'error' && <AlertCircle size={18} />}
          {step === 'idle' && <Mic size={18} />}
        </button>
      </div>

      {/* Status label next to button */}
      <AnimatePresence>
        {step === 'listening' && (
          <motion.span
            initial={{ opacity: 0, x: -6 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -6 }}
            className="text-[11px] font-black text-red-500 whitespace-nowrap"
          >
            {lang === 'hi' ? 'सुन रहा है...' : 'Listening...'}
          </motion.span>
        )}
        {step === 'parsing' && (
          <motion.span
            initial={{ opacity: 0, x: -6 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -6 }}
            className="text-[11px] font-black text-[var(--gold)] whitespace-nowrap"
          >
            Parsing with AI...
          </motion.span>
        )}
      </AnimatePresence>
    </div>
  );
};

export default SmartVoiceAutoFill;
