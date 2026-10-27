import { lazy, Suspense, useCallback, useEffect, useRef, useState, type PointerEvent } from 'react'
import { useTranslation } from 'react-i18next'
import type { Meta, PontoCritico } from '../api'
import { contarAtivos, type Filtros, filtrosVazios } from '../filtros'
import { type Estado, ultimaDataBase, useDadosMapa } from '../useDados'
import { DESKTOP, useMidia } from '../useMidia'
import DetalhePonto from './DetalhePonto'
import { Carregando, ErroCarga, Vazio } from './Estados'
import { Icone } from './Icone'
import { CORES_CALOR } from './gradiente'
import PainelFiltros from './PainelFiltros'
import Ranking from './Ranking'
import TabelaPontos from './TabelaPontos'

const Mapa = lazy(() => import('./Mapa'))

/** Três alturas da folha de ranking no celular. */
const ALTURAS = ['baixa', 'media', 'alta'] as const
type Altura = (typeof ALTURAS)[number]

interface Props {
  meta: Estado<Meta>
  aoTentarMeta: () => void
}

export default function PainelPrincipal({ meta, aoTentarMeta }: Props) {
  const { t } = useTranslation()
  const desktop = useMidia(DESKTOP)
  const [filtros, setFiltros] = useState<Filtros>(filtrosVazios)
  const [selecionado, setSelecionado] = useState<PontoCritico | null>(null)
  const [altura, setAltura] = useState<Altura>('baixa')
  const [gavetaAberta, setGavetaAberta] = useState(false)
  const botaoFiltros = useRef<HTMLButtonElement>(null)
  const lateral = useRef<HTMLElement>(null)
  const cabecaLateral = useRef<HTMLDivElement>(null)
  // Faixa que abriu o detalhe, para devolver o foco a ela quando o detalhe fechar.
  const [focarFaixa, setFocarFaixa] = useState<string | null>(null)

  const metaPronta = meta.situacao === 'pronto' ? meta.dados : undefined
  const dados = useDadosMapa(filtros, meta.situacao === 'pronto')
  const ativos = contarAtivos(filtros, metaPronta?.periodo_padrao)
  const pontos = dados.estado.situacao === 'pronto' ? dados.estado.dados.pontos.pontos : []
  const calor = dados.estado.situacao === 'pronto' ? dados.estado.dados.calor.pontos : []
  const raio = metaPronta?.criterio.raio_metros ?? 100
  const n = metaPronta?.criterio.n_minimo ?? 0

  const limpar = useCallback(() => setFiltros(filtrosVazios()), [])

  // Um ponto selecionado some quando os filtros mudam e ele deixa de existir no recorte.
  useEffect(() => {
    if (selecionado && dados.estado.situacao === 'pronto' && !pontos.some((p) => p.id === selecionado.id)) {
      setSelecionado(null)
    }
  }, [pontos, selecionado, dados.estado.situacao])

  // No desktop, o detalhe aparece no topo do painel, sem ficar abaixo dos filtros.
  useEffect(() => {
    if (!desktop || !selecionado || !lateral.current || !cabecaLateral.current) return
    lateral.current.scrollTop = cabecaLateral.current.offsetTop
  }, [desktop, selecionado])

  useEffect(() => {
    if (selecionado || !focarFaixa) return
    lateral.current?.querySelector<HTMLElement>(`[data-ponto="${CSS.escape(focarFaixa)}"]`)?.focus()
    setFocarFaixa(null)
  }, [selecionado, focarFaixa])

  const fecharDetalhe = useCallback(() => {
    setFocarFaixa(selecionado?.id ?? null)
    setSelecionado(null)
  }, [selecionado])

  const selecionar = useCallback(
    (ponto: PontoCritico) => {
      setSelecionado(ponto)
      if (!desktop) setAltura((atual) => (atual === 'baixa' ? 'media' : atual))
    },
    [desktop],
  )

  const fecharGaveta = useCallback(() => {
    setGavetaAberta(false)
    botaoFiltros.current?.focus()
  }, [])

  // Arrastar a alça da folha para cima ou para baixo troca de altura.
  const inicioArraste = useRef<number | null>(null)
  const aoApertar = (e: PointerEvent) => {
    inicioArraste.current = e.clientY
  }
  const aoSoltar = (e: PointerEvent) => {
    if (inicioArraste.current === null) return
    const delta = e.clientY - inicioArraste.current
    inicioArraste.current = null
    if (Math.abs(delta) < 24) return
    const indice = ALTURAS.indexOf(altura)
    const proximo = delta < 0 ? Math.min(indice + 1, 2) : Math.max(indice - 1, 0)
    setAltura(ALTURAS[proximo])
  }
  const alternarAltura = () => {
    const indice = ALTURAS.indexOf(altura)
    setAltura(ALTURAS[indice === 2 ? 0 : indice + 1])
  }

  const painelFiltros = (
    <PainelFiltros
      filtros={filtros}
      aoMudar={setFiltros}
      aoLimpar={limpar}
      periodoBase={metaPronta?.periodo_base}
      periodoPadrao={metaPronta?.periodo_padrao}
      viasDisponiveis={metaPronta ? Object.keys(metaPronta.tipos_via) : undefined}
      ativos={ativos}
    />
  )

  const erro = meta.situacao === 'erro' || dados.estado.situacao === 'erro'
  const carregando = !erro && (meta.situacao === 'carregando' || dados.estado.situacao === 'carregando')

  let conteudo
  if (erro) {
    conteudo = (
      <ErroCarga
        dataBase={metaPronta?.carga.data_extracao ?? ultimaDataBase()}
        aoTentar={meta.situacao === 'erro' ? aoTentarMeta : dados.recarregar}
      />
    )
  } else if (carregando) {
    conteudo = <Carregando />
  } else if (selecionado) {
    conteudo = <DetalhePonto ponto={selecionado} raio={raio} aoFechar={fecharDetalhe} />
  } else if (pontos.length === 0) {
    conteudo = <Vazio n={n} aoLimpar={limpar} />
  } else {
    conteudo = <Ranking pontos={pontos} selecionado={selecionado} aoVerNoMapa={selecionar} />
  }

  const totalRecorte = dados.estado.situacao === 'pronto' ? dados.estado.dados.calor.total : null

  return (
    <main id="conteudo" className="painel" tabIndex={-1}>
      <div className="painel__mapa">
        <Suspense fallback={<div className="mapa mapa--carregando" />}>
          <Mapa
            pontos={pontos}
            calor={calor}
            selecionado={selecionado}
            aoSelecionar={selecionar}
            deslocamentoY={desktop ? 0 : Math.round(window.innerHeight * 0.26)}
          />
        </Suspense>
        <div className="legenda" aria-hidden="true">
          <span>{t('mapa.legenda')}</span>
          <span
            className="legenda__escala"
            style={{
              background: `linear-gradient(to right, ${CORES_CALOR.join(', ')})`,
            }}
          />
          <span className="legenda__extremos">
            <span>{t('mapa.menos')}</span>
            <span>{t('mapa.mais')}</span>
          </span>
        </div>
      </div>

      <aside ref={lateral} className={`lateral lateral--${altura}`} aria-labelledby="lateral-titulo">
        {!desktop && (
          <button
            type="button"
            className="lateral__alca"
            onClick={alternarAltura}
            onPointerDown={aoApertar}
            onPointerUp={aoSoltar}
            aria-label={altura === 'alta' ? t('ranking.recolher') : t('ranking.expandir')}
          >
            <span aria-hidden="true" />
          </button>
        )}

        {desktop && <div className="lateral__filtros">{painelFiltros}</div>}

        <div ref={cabecaLateral} className="lateral__cabeca">
          <div>
            <h2 id="lateral-titulo">{t('ranking.titulo')}</h2>
            {dados.estado.situacao === 'pronto' && (
              <p className="lateral__resumo">
                {t('ranking.resumo', { count: pontos.length, n, raio })}
                {totalRecorte !== null && (
                  <>
                    <br />
                    {t('ranking.totalRecorte', { count: totalRecorte })}
                  </>
                )}
              </p>
            )}
          </div>
          {!desktop && (
            <button
              ref={botaoFiltros}
              type="button"
              className="botao botao--filtros"
              onClick={() => setGavetaAberta(true)}
              aria-haspopup="dialog"
              aria-label={ativos ? t('filtros.abrirComContagem', { count: ativos }) : t('filtros.abrir')}
            >
              <Icone nome="filtro" />
              {t('filtros.abrir')}
              {ativos > 0 && (
                <span className="contador" aria-hidden="true">
                  {ativos}
                </span>
              )}
            </button>
          )}
        </div>

        <div className="lateral__conteudo" aria-live="polite" aria-busy={carregando}>
          {conteudo}
        </div>
        <p className="lateral__ressalva">{t('ressalva')}</p>
      </aside>

      {dados.estado.situacao === 'pronto' && <TabelaPontos pontos={pontos} />}

      {!desktop && gavetaAberta && <Gaveta aoFechar={fecharGaveta}>{painelFiltros}</Gaveta>}
    </main>
  )
}

function Gaveta({ aoFechar, children }: { aoFechar: () => void; children: React.ReactNode }) {
  const { t } = useTranslation()
  const caixa = useRef<HTMLDivElement>(null)

  useEffect(() => {
    caixa.current?.querySelector<HTMLElement>('input, select, button')?.focus()
    const aoTeclar = (e: KeyboardEvent) => {
      if (e.key === 'Escape') aoFechar()
      if (e.key !== 'Tab' || !caixa.current) return
      // Mantém o foco dentro da gaveta enquanto ela está aberta.
      const focaveis = caixa.current.querySelectorAll<HTMLElement>('input, select, button:not([disabled]), a[href]')
      const primeiro = focaveis[0]
      const ultimo = focaveis[focaveis.length - 1]
      if (e.shiftKey && document.activeElement === primeiro) {
        e.preventDefault()
        ultimo.focus()
      } else if (!e.shiftKey && document.activeElement === ultimo) {
        e.preventDefault()
        primeiro.focus()
      }
    }
    document.addEventListener('keydown', aoTeclar)
    return () => document.removeEventListener('keydown', aoTeclar)
  }, [aoFechar])

  return (
    <div className="gaveta" onClick={(e) => e.target === e.currentTarget && aoFechar()}>
      <div ref={caixa} className="gaveta__caixa" role="dialog" aria-modal="true" aria-labelledby="gaveta-titulo">
        <div className="gaveta__cabeca">
          <h2 id="gaveta-titulo">{t('filtros.titulo')}</h2>
          <button type="button" className="botao-icone" onClick={aoFechar} aria-label={t('filtros.fechar')}>
            <Icone nome="fechar" />
          </button>
        </div>
        <div className="gaveta__corpo">{children}</div>
        <div className="gaveta__rodape">
          <button type="button" className="botao" onClick={aoFechar}>
            {t('filtros.verResultados')}
          </button>
        </div>
      </div>
    </div>
  )
}
