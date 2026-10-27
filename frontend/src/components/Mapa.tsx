import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { CircleMarker, MapContainer, Marker, TileLayer, useMap, useMapEvents, ZoomControl } from 'react-leaflet'
import type { PontoCritico, RespostaCalor } from '../api'
import { GRADIENTE_CALOR } from './gradiente'

// leaflet.heat se registra no L global; por isso o L é exposto antes de carregar o plugin.
;(window as unknown as { L: typeof L }).L = L
const plugin = import('leaflet.heat')

// Quanto mais perto, mais pontos aparecem: placas numeradas para os primeiros lugares
// e pontos leves (desenhados em canvas) para o restante, só de perto.
function visiveis(zoom: number) {
  if (zoom >= 15) return { placas: 50, pontos: true }
  if (zoom >= 13) return { placas: 50, pontos: false }
  return { placas: 20, pontos: false }
}

function useZoom(inicial: number) {
  const [zoom, setZoom] = useState(inicial)
  const mapa = useMapEvents({ zoomend: () => setZoom(mapa.getZoom()) })
  return zoom
}

const CENTRO_POA: [number, number] = [-30.05, -51.19]
const LIMITES_POA = L.latLngBounds([-30.28, -51.32], [-29.93, -51.0])

function CamadaCalor({ calor }: { calor: RespostaCalor['pontos'] }) {
  const mapa = useMap()
  useEffect(() => {
    let camada: L.Layer | undefined
    let cancelado = false
    plugin.then(() => {
      if (cancelado) return
      const maximo = Math.max(1, ...calor.map((p) => p[2]))
      camada = (L as unknown as { heatLayer: (d: unknown, o: unknown) => L.Layer }).heatLayer(calor, {
        radius: 14,
        blur: 16,
        minOpacity: 0.25,
        max: Math.min(maximo, 6),
        gradient: GRADIENTE_CALOR,
      })
      camada.addTo(mapa)
    })
    return () => {
      cancelado = true
      camada?.remove()
    }
  }, [calor, mapa])
  return null
}

/** Leva o mapa ao ponto escolhido. No celular, sobe o ponto para ele não ficar atrás da folha de ranking. */
function Enquadrar({ selecionado, deslocamentoY }: { selecionado: PontoCritico | null; deslocamentoY: number }) {
  const mapa = useMap()
  useEffect(() => {
    if (!selecionado) return
    const reduzir = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
    const zoom = Math.max(mapa.getZoom(), 16)
    const alvo = mapa.unproject(
      mapa.project([selecionado.latitude, selecionado.longitude], zoom).add([0, deslocamentoY]),
      zoom,
    )
    if (reduzir) mapa.setView(alvo, zoom)
    else mapa.flyTo(alvo, zoom, { duration: 0.6 })
  }, [selecionado, mapa, deslocamentoY])
  return null
}

function iconeDoPonto(posicao: number, ativo: boolean) {
  return L.divIcon({
    className: '',
    // A placa tem 28 px, mas a área de toque tem 44 px.
    html: `<span class="marcador-alvo"><span class="marcador${ativo ? ' marcador--ativo' : ''}">${posicao}</span></span>`,
    iconSize: [44, 44],
    iconAnchor: [22, 22],
  })
}

interface Props {
  pontos: PontoCritico[]
  calor: RespostaCalor['pontos']
  selecionado: PontoCritico | null
  aoSelecionar: (ponto: PontoCritico) => void
  /** Pixels que o centro do mapa desce ao enquadrar um ponto (área coberta pela folha no celular). */
  deslocamentoY?: number
}

export default function Mapa({ pontos, calor, selecionado, aoSelecionar, deslocamentoY = 0 }: Props) {
  const { t } = useTranslation()

  return (
    <MapContainer
      center={CENTRO_POA}
      zoom={12}
      minZoom={11}
      maxBounds={LIMITES_POA.pad(0.3)}
      className="mapa"
      preferCanvas
      zoomControl={false}
      attributionControl
      aria-label={t('mapa.rotulo')}
    >
      <TileLayer
        url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        maxZoom={19}
      />
      <ZoomControl position="topright" />
      <CamadaCalor calor={calor} />
      <Marcadores pontos={pontos} selecionado={selecionado} aoSelecionar={aoSelecionar} />
      <Enquadrar selecionado={selecionado} deslocamentoY={deslocamentoY} />
    </MapContainer>
  )
}

function Marcadores({ pontos, selecionado, aoSelecionar }: Omit<Props, 'calor' | 'deslocamentoY'>) {
  const { t } = useTranslation()
  const mapa = useMap()
  const zoom = useZoom(12)
  const { placas, pontos: mostrarPontos } = visiveis(zoom)
  const icones = useMemo(
    () => new Map(pontos.map((p) => [p.id, iconeDoPonto(p.posicao, p.id === selecionado?.id)])),
    [pontos, selecionado],
  )
  // Placas não se sobrepõem: na ordem do ranking, uma placa que encostaria numa já colocada fica de fora
  // até o zoom abrir espaço. O ponto selecionado sempre aparece.
  const comPlaca = useMemo(() => {
    const colocadas: L.Point[] = []
    const ids = new Set<string>()
    const candidatos = pontos.filter((p) => p.posicao <= placas || p.id === selecionado?.id)
    const ordem = [...candidatos].sort((a, b) =>
      a.id === selecionado?.id ? -1 : b.id === selecionado?.id ? 1 : a.posicao - b.posicao,
    )
    for (const ponto of ordem) {
      const xy = mapa.project([ponto.latitude, ponto.longitude], zoom)
      if (
        ponto.id !== selecionado?.id &&
        colocadas.some((c) => Math.abs(c.x - xy.x) < 32 && Math.abs(c.y - xy.y) < 32)
      ) {
        continue
      }
      colocadas.push(xy)
      ids.add(ponto.id)
    }
    return ids
  }, [pontos, placas, selecionado, mapa, zoom])
  return (
    <>
      {mostrarPontos &&
        pontos
          .filter((ponto) => ponto.posicao > placas && ponto.id !== selecionado?.id)
          .map((ponto) => (
            <CircleMarker
              key={ponto.id}
              center={[ponto.latitude, ponto.longitude]}
              radius={5}
              pathOptions={{ color: '#EEF0EC', weight: 1.5, fillColor: '#1B2A33', fillOpacity: 1 }}
              eventHandlers={{ click: () => aoSelecionar(ponto) }}
            />
          ))}
      {pontos
        .filter((ponto) => comPlaca.has(ponto.id))
        .map((ponto) => (
          <Marker
            key={ponto.id}
            position={[ponto.latitude, ponto.longitude]}
            icon={icones.get(ponto.id)}
            title={t('mapa.pontoRotulo', { posicao: ponto.posicao, nome: ponto.nome, total: ponto.total })}
            alt={t('mapa.pontoRotulo', { posicao: ponto.posicao, nome: ponto.nome, total: ponto.total })}
            keyboard
            zIndexOffset={ponto.id === selecionado?.id ? 1000 : -ponto.posicao}
            eventHandlers={{ click: () => aoSelecionar(ponto) }}
          />
        ))}
    </>
  )
}
