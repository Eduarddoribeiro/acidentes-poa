import '@testing-library/jest-dom/vitest'
import { cleanup } from '@testing-library/react'
import { afterEach } from 'vitest'
import i18n from '../i18n'

i18n.changeLanguage('pt-BR')

// O jsdom não implementa rolagem de janela.
window.scrollTo = () => {}

afterEach(() => cleanup())
