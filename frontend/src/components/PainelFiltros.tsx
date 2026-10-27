import { useId } from 'react'
import { useTranslation } from 'react-i18next'
import { alternar, type Filtros, periodoValido, TIPOS_VIA } from '../filtros'
import { formatarHora } from '../formato'

interface Props {
  filtros: Filtros
  aoMudar: (filtros: Filtros) => void
  aoLimpar: () => void
  periodoBase?: { inicio: string; fim: string }
  periodoPadrao?: { inicio: string; fim: string }
  /** Tipos de via que existem na base; os ausentes não aparecem. */
  viasDisponiveis?: string[]
  ativos: number
}

const HORAS = Array.from({ length: 24 }, (_, h) => h)

export default function PainelFiltros({
  filtros,
  aoMudar,
  aoLimpar,
  periodoBase,
  periodoPadrao,
  viasDisponiveis,
  ativos,
}: Props) {
  const { t, i18n } = useTranslation()
  const id = useId()
  const diasCurtos = t('dias.curto', { returnObjects: true }) as string[]
  const diasLongos = t('dias.longo', { returnObjects: true }) as string[]
  const vias = TIPOS_VIA.filter((via) => !viasDisponiveis || viasDisponiveis.includes(via))
  const inicio = filtros.inicio ?? periodoPadrao?.inicio ?? ''
  const fim = filtros.fim ?? periodoPadrao?.fim ?? ''

  return (
    <form className="filtros" onSubmit={(e) => e.preventDefault()} aria-label={t('filtros.titulo')}>
      <fieldset className="filtros__grupo">
        <legend>{t('filtros.periodo')}</legend>
        <div className="filtros__linha">
          <label className="campo">
            <span>{t('filtros.de')}</span>
            <input
              type="date"
              value={inicio}
              min={periodoBase?.inicio}
              max={periodoBase?.fim}
              onChange={(e) => aoMudar({ ...filtros, inicio: e.target.value || null })}
            />
          </label>
          <label className="campo">
            <span>{t('filtros.ate')}</span>
            <input
              type="date"
              value={fim}
              min={periodoBase?.inicio}
              max={periodoBase?.fim}
              onChange={(e) => aoMudar({ ...filtros, fim: e.target.value || null })}
            />
          </label>
        </div>
        {!periodoValido(filtros) && (
          <p className="filtros__erro" role="alert">
            {t('filtros.periodoInvalido')}
          </p>
        )}
      </fieldset>

      <fieldset className="filtros__grupo">
        <legend>{t('filtros.horario')}</legend>
        <div className="filtros__linha">
          <label className="campo">
            <span>{t('filtros.horaInicio')}</span>
            <select
              aria-describedby={`${id}-dica`}
              value={filtros.horaInicio ?? ''}
              onChange={(e) => {
                const valor = e.target.value === '' ? null : Number(e.target.value)
                aoMudar({
                  ...filtros,
                  horaInicio: valor,
                  horaFim: valor === null ? null : (filtros.horaFim ?? (valor + 1) % 24),
                })
              }}
            >
              <option value="">{t('filtros.qualquerHora')}</option>
              {HORAS.map((h) => (
                <option key={h} value={h}>
                  {formatarHora(h, i18n.language)}
                </option>
              ))}
            </select>
          </label>
          <label className="campo">
            <span>{t('filtros.horaFim')}</span>
            <select
              aria-describedby={`${id}-dica`}
              value={filtros.horaFim ?? ''}
              disabled={filtros.horaInicio === null}
              onChange={(e) => aoMudar({ ...filtros, horaFim: e.target.value === '' ? null : Number(e.target.value) })}
            >
              <option value="">{t('filtros.qualquerHora')}</option>
              {HORAS.map((h) => (
                <option key={h} value={h}>
                  {formatarHora(h, i18n.language)}
                </option>
              ))}
            </select>
          </label>
        </div>
        <p className="filtros__dica" id={`${id}-dica`}>
          {t('filtros.dicaMeiaNoite')}
        </p>
      </fieldset>

      <fieldset className="filtros__grupo">
        <legend>{t('filtros.dias')}</legend>
        <div className="opcoes opcoes--dias">
          {diasCurtos.map((curto, dia) => (
            <label key={dia} className="opcao">
              <input
                type="checkbox"
                aria-label={diasLongos[dia]}
                checked={filtros.dias.includes(dia)}
                onChange={() => aoMudar({ ...filtros, dias: alternar(filtros.dias, dia) })}
              />
              <span aria-hidden="true">{curto}</span>
            </label>
          ))}
        </div>
      </fieldset>

      <fieldset className="filtros__grupo">
        <legend>{t('filtros.vias')}</legend>
        <div className="opcoes">
          {vias.map((via) => (
            <label key={via} className="opcao">
              <input
                type="checkbox"
                checked={filtros.vias.includes(via)}
                onChange={() => aoMudar({ ...filtros, vias: alternar(filtros.vias, via) })}
              />
              <span>{t(`vias.${via}`)}</span>
            </label>
          ))}
        </div>
      </fieldset>

      <button type="button" className="botao botao--secundario" onClick={aoLimpar} disabled={ativos === 0}>
        {t('filtros.limpar')}
      </button>
    </form>
  )
}
