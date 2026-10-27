import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import Metodologia from './components/Metodologia'
import PainelPrincipal from './components/PainelPrincipal'
import { IDIOMAS } from './i18n'
import { useMeta } from './useDados'

type Rota = 'mapa' | 'metodologia'

function rotaAtual(): Rota {
  return window.location.hash.startsWith('#/metodologia') ? 'metodologia' : 'mapa'
}

export default function App() {
  const { t, i18n } = useTranslation()
  const [rota, setRota] = useState<Rota>(rotaAtual)
  const meta = useMeta()

  useEffect(() => {
    const aoMudar = () => {
      setRota(rotaAtual())
      window.scrollTo(0, 0)
    }
    window.addEventListener('hashchange', aoMudar)
    return () => window.removeEventListener('hashchange', aoMudar)
  }, [])

  useEffect(() => {
    document.title = rota === 'metodologia' ? `${t('metodologia.titulo')} · ${t('app.titulo')}` : t('app.titulo')
  }, [rota, t])

  return (
    <div className={`app app--${rota}`}>
      <a className="pular" href="#conteudo" onClick={(e) => {
        e.preventDefault()
        document.getElementById('conteudo')?.focus()
      }}>
        {t('app.pularParaConteudo')}
      </a>
      <header className="cabecalho">
        {/* Só um dos títulos aparece por vez; o outro fica com display: none, fora do leitor de tela. */}
        <a className="cabecalho__marca" href="#/">
          <span className="cabecalho__titulo">{t('app.titulo')}</span>
          <span className="cabecalho__titulo-curto">{t('app.tituloCurto')}</span>
        </a>
        <nav className="cabecalho__nav" aria-label={t('nav.mapa')}>
          <a href="#/" aria-current={rota === 'mapa' ? 'page' : undefined}>
            {t('nav.mapa')}
          </a>
          <a href="#/metodologia" aria-current={rota === 'metodologia' ? 'page' : undefined}>
            {t('nav.metodologia')}
          </a>
        </nav>
        <label className="idioma">
          <span className="so-leitor">{t('nav.idioma')}</span>
          <select value={i18n.language} onChange={(e) => i18n.changeLanguage(e.target.value)}>
            {IDIOMAS.map((idioma) => (
              <option key={idioma} value={idioma}>
                {idioma === 'pt-BR' ? 'PT' : 'EN'}
              </option>
            ))}
          </select>
        </label>
      </header>

      {rota === 'metodologia' ? (
        <Metodologia meta={meta.estado} aoTentar={meta.recarregar} />
      ) : (
        <PainelPrincipal meta={meta.estado} aoTentarMeta={meta.recarregar} />
      )}
    </div>
  )
}
