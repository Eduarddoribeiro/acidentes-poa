import { useTranslation } from 'react-i18next'
import type { Meta } from '../api'
import type { Estado } from '../useDados'
import { formatarData, formatarNumero, formatarPercentual } from '../formato'
import { Carregando, ErroCarga } from './Estados'
import { Icone } from './Icone'

interface Props {
  meta: Estado<Meta>
  aoTentar: () => void
}

/** Página de metodologia (M7): fonte, período, critério, descartes e ressalva de uso (RN-06). */
export default function Metodologia({ meta, aoTentar }: Props) {
  const { t, i18n } = useTranslation()
  const idioma = i18n.language

  return (
    <main id="conteudo" className="metodologia" tabIndex={-1}>
      <a className="link-voltar" href="#/">
        <Icone nome="voltar" tamanho={18} />
        {t('metodologia.voltar')}
      </a>
      <h1>{t('metodologia.titulo')}</h1>

      <section aria-labelledby="ressalva-titulo" className="metodologia__ressalva">
        <h2 id="ressalva-titulo">{t('metodologia.ressalvaTitulo')}</h2>
        <p>{t('ressalva')}</p>
        <p>{t('metodologia.ressalvaVolume')}</p>
      </section>

      {meta.situacao === 'carregando' && <Carregando linhas={8} />}
      {meta.situacao === 'erro' && <ErroCarga aoTentar={aoTentar} />}
      {meta.situacao === 'pronto' && (
        <>
          <section aria-labelledby="fonte-titulo">
            <h2 id="fonte-titulo">{t('metodologia.fonteTitulo')}</h2>
            <p>{t('metodologia.fonteTexto')}</p>
            <p>
              {t('metodologia.extracao', {
                data: formatarData(meta.dados.carga.data_extracao, idioma),
                carga: formatarData(meta.dados.carga.data_carga, idioma),
              })}
            </p>
            <p>
              <a href={meta.dados.fonte.url} target="_blank" rel="noreferrer" className="link-externo">
                {t('metodologia.fonteLink')}
                <Icone nome="externo" tamanho={16} />
              </a>
            </p>
          </section>

          <section aria-labelledby="periodo-titulo">
            <h2 id="periodo-titulo">{t('metodologia.periodoTitulo')}</h2>
            <p>
              {t('metodologia.periodoTexto', {
                inicio: formatarData(meta.dados.periodo_base.inicio, idioma),
                fim: formatarData(meta.dados.periodo_base.fim, idioma),
                padraoInicio: formatarData(meta.dados.periodo_padrao.inicio, idioma),
                padraoFim: formatarData(meta.dados.periodo_padrao.fim, idioma),
              })}
            </p>
            <p>{t('metodologia.horarioTexto')}</p>
          </section>

          <section aria-labelledby="criterio-titulo">
            <h2 id="criterio-titulo">{t('metodologia.criterioTitulo')}</h2>
            <p>
              {t('metodologia.criterioTexto', {
                n: meta.dados.criterio.n_minimo,
                raio: meta.dados.criterio.raio_metros,
              })}
            </p>
            <p>{t('metodologia.criterioN', { n: meta.dados.criterio.n_minimo })}</p>
          </section>

          <section aria-labelledby="vias-titulo">
            <h2 id="vias-titulo">{t('metodologia.viasTitulo')}</h2>
            <p>{t('metodologia.viasTexto')}</p>
          </section>

          <section aria-labelledby="descartes-titulo">
            <h2 id="descartes-titulo">{t('metodologia.descartesTitulo')}</h2>
            <p>
              {t('metodologia.descartesTexto', {
                lidos: formatarNumero(meta.dados.carga.total_lido, idioma),
                descartados: formatarNumero(meta.dados.carga.total_descartado, idioma),
                percentual: formatarPercentual(meta.dados.carga.percentual_fora_do_mapa, idioma),
              })}
            </p>
            <table className="tabela">
              <caption className="so-leitor">{t('metodologia.descartesTitulo')}</caption>
              <tbody>
                {Object.entries(meta.dados.carga.descartes_por_motivo).map(([motivo, quantidade]) => (
                  <tr key={motivo}>
                    <th scope="row">{t(`metodologia.motivos.${motivo}`, { defaultValue: motivo })}</th>
                    <td>{formatarNumero(quantidade, idioma)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>
        </>
      )}
    </main>
  )
}
