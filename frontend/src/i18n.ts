import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import ptBR from './locales/pt-BR.json'
import en from './locales/en.json'

export const IDIOMAS = ['pt-BR', 'en'] as const
export type Idioma = (typeof IDIOMAS)[number]

const CHAVE_IDIOMA = 'acidentes-poa:idioma'

function idiomaInicial(): Idioma {
  try {
    const salvo = localStorage.getItem(CHAVE_IDIOMA)
    if (salvo === 'pt-BR' || salvo === 'en') return salvo
  } catch {
    // Armazenamento indisponível: segue com o idioma do navegador.
  }
  return navigator.language?.toLowerCase().startsWith('pt') ? 'pt-BR' : navigator.language ? 'en' : 'pt-BR'
}

i18n.use(initReactI18next).init({
  resources: {
    'pt-BR': { translation: ptBR },
    en: { translation: en },
  },
  lng: idiomaInicial(),
  fallbackLng: 'pt-BR',
  interpolation: { escapeValue: false },
})

function aplicarIdioma(idioma: string) {
  document.documentElement.lang = idioma
  try {
    localStorage.setItem(CHAVE_IDIOMA, idioma)
  } catch {
    // Sem armazenamento, o idioma vale só nesta visita.
  }
}

aplicarIdioma(i18n.language)
i18n.on('languageChanged', aplicarIdioma)

export default i18n
