import '@testing-library/jest-dom/vitest'
import { cleanup } from '@testing-library/react'
import { afterEach } from 'vitest'
import i18n from '../shared/i18n'

i18n.changeLanguage('pt-BR')

// jsdom does not implement window scrolling.
window.scrollTo = () => {}

afterEach(() => cleanup())
