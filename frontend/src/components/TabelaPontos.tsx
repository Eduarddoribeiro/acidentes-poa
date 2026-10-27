import { useTranslation } from 'react-i18next'
import type { PontoCritico } from '../api'
import { formatarData, formatarNumero } from '../formato'

/** Versão em tabela dos pontos críticos, para leitor de tela (seção 9.1). */
export default function TabelaPontos({ pontos }: { pontos: PontoCritico[] }) {
  const { t, i18n } = useTranslation()
  const idioma = i18n.language
  return (
    // A tabela fica dentro de um bloco oculto: tabelas ignoram largura de 1px e alargariam a página.
    <div className="so-leitor">
      <table>
        <caption>{t('tabela.legenda')}</caption>
        <thead>
          <tr>
            <th scope="col">{t('tabela.posicao')}</th>
            <th scope="col">{t('tabela.local')}</th>
            <th scope="col">{t('tabela.total')}</th>
            <th scope="col">{t('detalhe.semVitimas')}</th>
            <th scope="col">{t('detalhe.comFeridos')}</th>
            <th scope="col">{t('detalhe.comMortos')}</th>
            <th scope="col">{t('detalhe.periodo')}</th>
          </tr>
        </thead>
        <tbody>
          {pontos.map((p) => (
            <tr key={p.id}>
              <td>{p.posicao}</td>
              <th scope="row">{p.nome}</th>
              <td>{formatarNumero(p.total, idioma)}</td>
              <td>{formatarNumero(p.sem_vitimas, idioma)}</td>
              <td>{formatarNumero(p.com_feridos, idioma)}</td>
              <td>{formatarNumero(p.com_mortos, idioma)}</td>
              <td>
                {t('detalhe.periodoValor', {
                  inicio: formatarData(p.data_inicio, idioma),
                  fim: formatarData(p.data_fim, idioma),
                })}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
