import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Mic, MicOff } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';

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
type SpeechRecognitionResultLike = { results: ArrayLike<ArrayLike<{ transcript: string }>> };

interface VoiceInputProps {
  onTranscript: (text: string) => void;
  className?: string;
}

const VoiceInput: React.FC<VoiceInputProps> = ({ onTranscript, className = '' }) => {
  const { t, i18n } = useTranslation();
  const [isListening, setIsListening] = useState(false);
  const [isSupported] = useState(() => {
    if (typeof window === 'undefined') return false;
    const w = window as unknown as Record<string, unknown>;
    return Boolean(w.SpeechRecognition || w.webkitSpeechRecognition);
  });
  const recognitionRef = useRef<SpeechRecognitionLike | null>(null);

  useEffect(() => {
    if (!isSupported) return;
    const w = window as unknown as Record<string, unknown>;
    const SpeechRecognition = (w.SpeechRecognition || w.webkitSpeechRecognition) as SpeechRecognitionCtor | undefined;
    if (!SpeechRecognition) return;

    const recog = new SpeechRecognition();
    recog.continuous = false;
    recog.interimResults = false;
    recog.onstart = () => setIsListening(true);
    recog.onresult = (event) => {
      const transcript = event.results[0][0].transcript;
      onTranscript(transcript);
    };
    recog.onerror = (event) => {
      console.error('Speech recognition error', event.error);
      setIsListening(false);
    };
    recog.onend = () => setIsListening(false);

    recognitionRef.current = recog;

    return () => {
      recog.onstart = null;
      recog.onresult = null;
      recog.onerror = null;
      recog.onend = null;
      try { recog.stop(); } catch { /* ignore */ }
      if (recognitionRef.current === recog) recognitionRef.current = null;
    };
  }, [onTranscript, isSupported]);

  const toggleListening = useCallback(() => {
    const recognition = recognitionRef.current;
    if (!recognition) return;
    
    if (isListening) {
      recognition.stop();
    } else {
      // Set language based on current i18n language
      recognition.lang = i18n.language === 'hi' ? 'hi-IN' : 'en-IN';
      try {
        recognition.start();
      } catch (e) {
        console.error(e);
      }
    }
  }, [isListening, i18n.language]);

  if (!isSupported) {
    return null;
  }

  return (
    <button
      type="button"
      onClick={toggleListening}
      className={`relative w-10 h-10 rounded-full flex items-center justify-center transition-all ${
        isListening 
          ? 'bg-red-50 text-red-500 border border-red-200' 
          : 'bg-[var(--bg-surface)] text-[var(--text-muted)] border border-[var(--border-primary)] hover:bg-[var(--bg-surface)] hover:text-[var(--text-secondary)]'
      } ${className}`}
      title={isListening ? t('voice.listening') : t('voice.speak_now')}
    >
      <AnimatePresence>
        {isListening && (
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1.5, opacity: 0 }}
            transition={{ duration: 1.5, repeat: Infinity }}
            className="absolute inset-0 bg-red-400 rounded-full -z-10"
          />
        )}
      </AnimatePresence>
      
      {isListening ? <MicOff size={18} /> : <Mic size={18} />}
    </button>
  );
};

export default VoiceInput;
