import { useTranslation } from 'react-i18next'
import type { PontoCritico } from '../api'
import { formatarNumero } from '../formato'

interface Props {
  pontos: PontoCritico[]
  selecionado: PontoCritico | null
  aoVerNoMapa: (ponto: PontoCritico) => void
}

/** Ranking em faixas numeradas de 1 a N, do maior para o menor número de acidentes. */
export default function Ranking({ pontos, selecionado, aoVerNoMapa }: Props) {
  const { t, i18n } = useTranslation()
  return (
    <ol className="ranking" aria-label={t('ranking.titulo')}>
      {pontos.map((ponto) => {
        const ativo = ponto.id === selecionado?.id
        return (
          <li key={ponto.id} className={`faixa${ativo ? ' faixa--ativa' : ''}`}>
            <button
              type="button"
              className="faixa__botao"
              data-ponto={ponto.id}
              aria-current={ativo ? 'true' : undefined}
              onClick={() => aoVerNoMapa(ponto)}
            >
              <span className="faixa__numero" aria-hidden="true">
                {ponto.posicao}
              </span>
              <span className="faixa__nome">
                {ponto.nome}
                <span className="so-leitor">
                  , {t('ranking.acidentes', { count: ponto.total })}. {t('ranking.verNoMapa')}
                </span>
              </span>
              <span className="faixa__total" aria-hidden="true">
                {formatarNumero(ponto.total, i18n.language)}
              </span>
            </button>
          </li>
        )
      })}
    </ol>
  )
}
