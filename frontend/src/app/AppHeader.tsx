import { useTranslation } from 'react-i18next'
import { LANGUAGES } from '../shared/i18n'
import styles from './AppHeader.module.css'
import type { Route } from './useHashRoute'

/** Header shaped like a street sign: ink background, light letters. */
export function AppHeader({ route }: { route: Route }) {
  const { t, i18n } = useTranslation()
  return (
    <header className={styles.header}>
      {/* Only one title shows at a time; the other has display: none, out of the screen reader. */}
      <a className={styles.brand} href="#/">
        <span className={styles.title}>{t('app.title')}</span>
        <span className={styles.shortTitle}>{t('app.shortTitle')}</span>
      </a>
      <nav className={styles.nav} aria-label={t('nav.map')}>
        <a href="#/" aria-current={route === 'map' ? 'page' : undefined}>
          {t('nav.map')}
        </a>
        <a href="#/methodology" aria-current={route === 'methodology' ? 'page' : undefined}>
          {t('nav.methodology')}
        </a>
      </nav>
      <label className={styles.language}>
        <span className="visually-hidden">{t('nav.language')}</span>
        <select value={i18n.language} onChange={(e) => i18n.changeLanguage(e.target.value)}>
          {LANGUAGES.map((language) => (
            <option key={language} value={language}>
              {language === 'pt-BR' ? 'PT' : 'EN'}
            </option>
          ))}
        </select>
      </label>
    </header>
  )
}
