import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { ptBR } from '../i18n/pt-BR';
import { en } from '../i18n/en';

export type Language = 'pt-BR' | 'en';
type TranslationDict = Record<string, string>;

const dictionaries: Record<Language, TranslationDict> = {
  'pt-BR': ptBR,
  en: en,
};

interface LanguageState {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
}

export const useLanguageStore = create<LanguageState>()(
  persist(
    (set, get) => ({
      language: 'pt-BR',
      setLanguage: (lang) => set({ language: lang }),
      t: (key: string) => {
        const dict = dictionaries[get().language];
        return dict[key] || key;
      },
    }),
    {
      name: 'absolutsport-lang',
      partialize: (state) => ({ language: state.language }),
    },
  ),
);
