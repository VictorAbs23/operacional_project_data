import { useLanguageStore, type Language } from '../../stores/languageStore';

export function LanguageToggle() {
  const { language, setLanguage } = useLanguageStore();

  const toggle = () => {
    const next: Language = language === 'pt-BR' ? 'en' : 'pt-BR';
    setLanguage(next);
  };

  return (
    <button
      onClick={toggle}
      className="flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold bg-neutral-100 hover:bg-neutral-200 transition-colors text-neutral-600"
    >
      <span className={language === 'pt-BR' ? 'text-primary-600' : 'text-neutral-400'}>PT</span>
      <span className="text-neutral-300">|</span>
      <span className={language === 'en' ? 'text-primary-600' : 'text-neutral-400'}>EN</span>
    </button>
  );
}
