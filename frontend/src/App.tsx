import { useTranslation } from 'react-i18next'

export default function App() {
  const { t } = useTranslation()

  return (
    <main className="pagina">
      <h1>{t('app.titulo')}</h1>
      <p>{t('app.status')}</p>
    </main>
  )
}
