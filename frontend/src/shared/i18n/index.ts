import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import { readStorage, writeStorage } from '../lib/storage'
import en from './locales/en.json'
import ptBR from './locales/pt-BR.json'

export const LANGUAGES = ['pt-BR', 'en'] as const
export type Language = (typeof LANGUAGES)[number]

const LANGUAGE_KEY = 'acidentes-poa:language'

function initialLanguage(): Language {
  const saved = readStorage(LANGUAGE_KEY)
  if (saved === 'pt-BR' || saved === 'en') return saved
  return navigator.language?.toLowerCase().startsWith('pt') ? 'pt-BR' : navigator.language ? 'en' : 'pt-BR'
}

i18n.use(initReactI18next).init({
  resources: {
    'pt-BR': { translation: ptBR },
    en: { translation: en },
  },
  lng: initialLanguage(),
  fallbackLng: 'pt-BR',
  interpolation: { escapeValue: false },
})

function applyLanguage(language: string) {
  document.documentElement.lang = language
  // Without storage, the language only lasts for this visit.
  writeStorage(LANGUAGE_KEY, language)
}

applyLanguage(i18n.language)
i18n.on('languageChanged', applyLanguage)

export default i18n
