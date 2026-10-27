import { useEffect, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import type { PontoCritico } from '../api'
import { formatarData, formatarNumero } from '../formato'
import { Icone } from './Icone'

interface Props {
  ponto: PontoCritico
  raio: number
  aoFechar: () => void
}

/** Detalhe de um ponto: quantidade, composição por gravidade e período (fluxo 3.1, passo 4). */
export default function DetalhePonto({ ponto, raio, aoFechar }: Props) {
  const { t, i18n } = useTranslation()
  const titulo = useRef<HTMLHeadingElement>(null)
  const idioma = i18n.language

  useEffect(() => {
    // Sem rolar: o painel cuida de mostrar o detalhe no lugar certo.
    titulo.current?.focus({ preventScroll: true })
  }, [ponto.id])

  const composicao = [
    { chave: 'semVitimas', valor: ponto.sem_vitimas, classe: 'sem' },
    { chave: 'comFeridos', valor: ponto.com_feridos, classe: 'feridos' },
    { chave: 'comMortos', valor: ponto.com_mortos, classe: 'mortos' },
  ] as const

  return (
    <section className="detalhe" aria-labelledby="detalhe-titulo">
      <div className="detalhe__topo">
        <span className="detalhe__posicao" aria-hidden="true">
          {ponto.posicao}
        </span>
        <h2 id="detalhe-titulo" ref={titulo} tabIndex={-1}>
          <span className="so-leitor">{t('ranking.posicao', { posicao: ponto.posicao })} </span>
          {ponto.nome}
        </h2>
        <button type="button" className="botao-icone" onClick={aoFechar} aria-label={t('detalhe.fechar')}>
          <Icone nome="fechar" />
        </button>
      </div>

      <p className="detalhe__total">
        <span className="detalhe__numero">{formatarNumero(ponto.total, idioma)}</span>
        <span>{t('detalhe.total', { raio })}</span>
      </p>

      <h3 className="detalhe__subtitulo">{t('detalhe.composicao')}</h3>
      <div className="barra" aria-hidden="true">
        {composicao.map(
          ({ chave, valor, classe }) =>
            valor > 0 && <span key={chave} className={`barra__parte barra__parte--${classe}`} style={{ flexGrow: valor }} />,
        )}
      </div>
      <dl className="detalhe__lista">
        {composicao.map(({ chave, valor, classe }) => (
          <div key={chave}>
            <dt>
              <span className={`amostra amostra--${classe}`} aria-hidden="true" />
              {t(`detalhe.${chave}`)}
            </dt>
            <dd>{formatarNumero(valor, idioma)}</dd>
          </div>
        ))}
      </dl>

      <dl className="detalhe__lista detalhe__lista--meta">
        <div>
          <dt>{t('detalhe.periodo')}</dt>
          <dd>
            {t('detalhe.periodoValor', {
              inicio: formatarData(ponto.data_inicio, idioma),
              fim: formatarData(ponto.data_fim, idioma),
            })}
          </dd>
        </div>
        {ponto.regiao && (
          <div>
            <dt>{t('detalhe.regiao')}</dt>
            <dd>{ponto.regiao.charAt(0) + ponto.regiao.slice(1).toLowerCase()}</dd>
          </div>
        )}
      </dl>
      <p className="detalhe__ressalva">{t('detalhe.ressalva')}</p>
    </section>
  )
}
