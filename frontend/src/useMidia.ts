import { useEffect, useState } from 'react'

export function useMidia(consulta: string): boolean {
  const [corresponde, setCorresponde] = useState(() => window.matchMedia?.(consulta).matches ?? false)
  useEffect(() => {
    const lista = window.matchMedia?.(consulta)
    if (!lista) return
    const aoMudar = () => setCorresponde(lista.matches)
    aoMudar()
    lista.addEventListener('change', aoMudar)
    return () => lista.removeEventListener('change', aoMudar)
  }, [consulta])
  return corresponde
}

export const DESKTOP = '(min-width: 900px)'
