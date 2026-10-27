import { useCallback, useEffect, useState } from 'react'
import { api, type Meta, type RespostaCalor, type RespostaPontos } from './api'
import { type Filtros, periodoValido } from './filtros'

const CHAVE_DATA_BASE = 'acidentes-poa:data-base'

/** Data de extração da última base que carregou, para a mensagem de erro quando a API não responde. */
export function ultimaDataBase(): string | null {
  try {
    return localStorage.getItem(CHAVE_DATA_BASE)
  } catch {
    return null
  }
}

function guardarDataBase(meta: Meta) {
  try {
    if (meta.carga.data_extracao) localStorage.setItem(CHAVE_DATA_BASE, meta.carga.data_extracao)
  } catch {
    // Sem armazenamento, a mensagem de erro sai sem a data.
  }
}

export type Estado<T> = { situacao: 'carregando' } | { situacao: 'erro' } | { situacao: 'pronto'; dados: T }

export function useMeta() {
  const [estado, setEstado] = useState<Estado<Meta>>({ situacao: 'carregando' })
  const [tentativa, setTentativa] = useState(0)

  useEffect(() => {
    const controle = new AbortController()
    setEstado({ situacao: 'carregando' })
    api
      .meta(controle.signal)
      .then((dados) => {
        guardarDataBase(dados)
        setEstado({ situacao: 'pronto', dados })
      })
      .catch((erro: unknown) => {
        if (!controle.signal.aborted) {
          console.error(erro)
          setEstado({ situacao: 'erro' })
        }
      })
    return () => controle.abort()
  }, [tentativa])

  return { estado, recarregar: useCallback(() => setTentativa((n) => n + 1), []) }
}

export interface DadosMapa {
  pontos: RespostaPontos
  calor: RespostaCalor
}

/** Pontos críticos e calor do recorte. Pedidos antigos são cancelados quando os filtros mudam. */
export function useDadosMapa(filtros: Filtros, ativo: boolean) {
  const [estado, setEstado] = useState<Estado<DadosMapa>>({ situacao: 'carregando' })
  const [tentativa, setTentativa] = useState(0)
  const chave = JSON.stringify(filtros)

  useEffect(() => {
    if (!ativo || !periodoValido(filtros)) return
    const controle = new AbortController()
    setEstado({ situacao: 'carregando' })
    // Pequena espera para não disparar um pedido a cada tecla nos campos de data.
    const espera = window.setTimeout(() => {
      Promise.all([api.pontos(filtros, controle.signal), api.calor(filtros, controle.signal)])
        .then(([pontos, calor]) => setEstado({ situacao: 'pronto', dados: { pontos, calor } }))
        .catch((erro: unknown) => {
          if (!controle.signal.aborted) {
            console.error(erro)
            setEstado({ situacao: 'erro' })
          }
        })
    }, 250)
    return () => {
      window.clearTimeout(espera)
      controle.abort()
    }
  }, [chave, ativo, tentativa])

  return { estado, recarregar: useCallback(() => setTentativa((n) => n + 1), []) }
}
