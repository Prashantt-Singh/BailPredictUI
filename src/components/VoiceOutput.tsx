import React, { useState, useEffect, useCallback } from 'react';
import { Volume2, Square } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface VoiceOutputProps {
  text: string;
  className?: string;
  buttonText?: boolean;
}

const VoiceOutput: React.FC<VoiceOutputProps> = ({ text, className = '', buttonText = false }) => {
  const { t, i18n } = useTranslation();
  const [isPlaying, setIsPlaying] = useState(false);
  const [isSupported, setIsSupported] = useState(true);

  useEffect(() => {
    if (typeof window === 'undefined' || !window.speechSynthesis) {
      setIsSupported(false);
    }
    
    // Cleanup on unmount
    return () => {
      if (window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  const toggleSpeech = useCallback(() => {
    if (!window.speechSynthesis) return;

    if (isPlaying) {
      window.speechSynthesis.cancel();
      setIsPlaying(false);
    } else {
      window.speechSynthesis.cancel(); // stop any ongoing speech
      
      const utterance = new SpeechSynthesisUtterance(text);
      
      // Set language based on current i18n language
      utterance.lang = i18n.language === 'hi' ? 'hi-IN' : 'en-IN';
      
      // Try to find a good voice
      const voices = window.speechSynthesis.getVoices();
      const preferredVoice = voices.find(v => v.lang.includes(i18n.language === 'hi' ? 'hi' : 'en-IN')) 
                          || voices.find(v => v.lang.includes('en'));
      
      if (preferredVoice) {
        utterance.voice = preferredVoice;
      }
      
      utterance.onstart = () => setIsPlaying(true);
      utterance.onend = () => setIsPlaying(false);
      utterance.onerror = () => setIsPlaying(false);
      
      window.speechSynthesis.speak(utterance);
    }
  }, [text, isPlaying, i18n.language]);

  if (!isSupported) {
    return null;
  }

  return (
    <button
      type="button"
      onClick={toggleSpeech}
      className={`flex items-center justify-center gap-2 transition-all ${
        isPlaying 
          ? 'text-[#C9A84C] border-[#C9A84C]/50' 
          : 'text-[var(--text-muted)] hover:text-[var(--text-secondary)] border-transparent'
      } ${className}`}
      title={isPlaying ? t('voice.stop') : t('voice.play')}
    >
      {isPlaying ? <Square size={16} className="fill-current" /> : <Volume2 size={16} />}
      {buttonText && <span className="text-sm font-bold">{isPlaying ? t('voice.stop') : t('voice.play')}</span>}
    </button>
  );
};

export default VoiceOutput;
