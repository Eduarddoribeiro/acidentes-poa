import { useTranslation } from 'react-i18next'
import { formatarData } from '../formato'

export function Carregando({ linhas = 6 }: { linhas?: number }) {
  const { t } = useTranslation()
  return (
    <div className="carregando" role="status">
      <span className="so-leitor">{t('estados.carregando')}</span>
      {Array.from({ length: linhas }, (_, i) => (
        <span key={i} className="carregando__bloco" aria-hidden="true" />
      ))}
    </div>
  )
}

export function Vazio({ n, aoLimpar }: { n: number; aoLimpar: () => void }) {
  const { t } = useTranslation()
  return (
    <div className="aviso" role="status">
      <h3>{t('estados.vazioTitulo')}</h3>
      <p>{t('estados.vazioTexto', { n })}</p>
      <button type="button" className="botao" onClick={aoLimpar}>
        {t('filtros.limpar')}
      </button>
    </div>
  )
}

export function ErroCarga({ dataBase, aoTentar }: { dataBase?: string | null; aoTentar: () => void }) {
  const { t, i18n } = useTranslation()
  return (
    <div className="aviso aviso--erro" role="alert">
      <h3>{t('estados.erroTitulo')}</h3>
      <p>{t('estados.erroTexto')}</p>
      {dataBase && <p>{t('estados.erroBase', { data: formatarData(dataBase, i18n.language) })}</p>}
      <button type="button" className="botao" onClick={aoTentar}>
        {t('estados.tentarDeNovo')}
      </button>
    </div>
  )
}
