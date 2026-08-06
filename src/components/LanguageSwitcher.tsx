import React, { useEffect, useState } from 'react';
import { Globe, X } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';

export function LanguageSwitcher() {
  const [currentLang, setCurrentLang] = useState('en');
  const [isOpen, setIsOpen] = useState(false);
  const [warningMessage, setWarningMessage] = useState<string | null>(null);

  useEffect(() => {
    // Check if a language is already selected in cookies
    const match = document.cookie.match(/googtrans=\/en\/([^;]+)/);
    if (match) {
      setCurrentLang(match[1]);
    }
  }, []);

  const changeLanguage = (langCode: string) => {
    const select = document.querySelector('.goog-te-combo') as HTMLSelectElement;
    if (select) {
      select.value = langCode;
      select.dispatchEvent(new Event('change'));
      setCurrentLang(langCode);
      setIsOpen(false);

      if (langCode === 'fr') {
        setWarningMessage("Attention : La langue originale des livres restera l'anglais.");
      } else if (langCode === 'ar') {
        setWarningMessage("تنبيه: ستبقى اللغة الأصلية للكتب باللغة الإنجليزية.");
      }
    }
  };

  const languages = [
    { code: 'en', label: 'English' },
    { code: 'fr', label: 'Français' },
    { code: 'ar', label: 'العربية' }
  ];

  return (
    <>
      <div className="relative">
        <button 
          onClick={() => setIsOpen(!isOpen)}
          className="flex items-center space-x-2 text-white/80 hover:text-white transition-colors p-2 rounded-full hover:bg-white/10"
          title="Translate"
        >
          <Globe className="w-5 h-5" />
          <span className="text-sm font-medium uppercase">{currentLang}</span>
        </button>

        {isOpen && (
          <>
            <div 
              className="fixed inset-0 z-40"
              onClick={() => setIsOpen(false)}
            />
            <div className="absolute right-0 mt-2 w-32 bg-[#1a1a1a] border border-white/10 rounded-xl shadow-xl z-50 overflow-hidden">
              {languages.map((lang) => (
                <button
                  key={lang.code}
                  onClick={() => changeLanguage(lang.code)}
                  className={`w-full text-left px-4 py-2 text-sm transition-colors ${
                    currentLang === lang.code 
                      ? 'bg-primary/20 text-primary-light font-bold' 
                      : 'text-white/80 hover:bg-white/5 hover:text-white'
                  }`}
                >
                  {lang.label}
                </button>
              ))}
            </div>
          </>
        )}
      </div>

      <AnimatePresence>
        {warningMessage && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
              onClick={() => setWarningMessage(null)}
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative bg-ink border border-white/10 p-6 rounded-2xl shadow-2xl max-w-sm w-full text-center"
            >
              <button 
                onClick={() => setWarningMessage(null)}
                className="absolute top-4 right-4 text-white/40 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
              <div className="w-12 h-12 bg-yellow-500/20 text-yellow-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <Globe className="w-6 h-6" />
              </div>
              <p className="text-white font-medium text-lg mb-6">{warningMessage}</p>
              <button 
                onClick={() => setWarningMessage(null)}
                className="w-full py-3 bg-white/10 hover:bg-white/20 text-white rounded-xl font-bold transition-colors"
              >
                OK
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
