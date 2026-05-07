import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';

const LanguageSwitcher: React.FC = () => {
  const { i18n } = useTranslation();
  const [lang, setLang] = useState(() => i18n.language);

  const toggleLanguage = () => {
    const newLang = lang === 'en' ? 'hi' : 'en';
    i18n.changeLanguage(newLang);
    setLang(newLang);
    localStorage.setItem('bailpredict_lang', newLang);
  };

  useEffect(() => {
    // Sync state if language changes elsewhere
    const timer = window.setTimeout(() => setLang(i18n.language), 0);
    return () => window.clearTimeout(timer);
  }, [i18n.language]);

  return (
    <button
      onClick={toggleLanguage}
      className="relative flex items-center w-[72px] h-8 bg-[var(--bg-surface)] rounded-full p-1 cursor-pointer hover:bg-[var(--bg-elevated)] transition-colors border border-[var(--border-primary)]"
      title={lang === 'en' ? 'Switch to Hindi' : 'Switch to English'}
    >
      <div className="flex w-full justify-between px-2 z-10 text-[10px] font-black pointer-events-none">
        <span className={lang === 'en' ? 'text-white dark:text-black' : 'text-[var(--text-muted)]'}>EN</span>
        <span className={lang === 'hi' ? 'text-white dark:text-black' : 'text-[var(--text-muted)]'}>हि</span>
      </div>
      <motion.div
        className="absolute w-[32px] h-[24px] bg-[var(--text-primary)] rounded-full"
        initial={false}
        animate={{
          left: lang === 'en' ? '4px' : '34px',
        }}
        transition={{ type: "spring", stiffness: 500, damping: 30 }}
      />
    </button>
  );
};

export default LanguageSwitcher;
