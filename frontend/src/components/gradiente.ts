// Escala sequencial do mapa de calor, de #FBE3A1 a #7A0F1F (seção 9.1), legível para daltônicos.
export const GRADIENTE_CALOR: Record<number, string> = {
  0.15: '#FBE3A1',
  0.4: '#F2B263',
  0.6: '#DC6B33',
  0.8: '#B02E26',
  1: '#7A0F1F',
}

/** Cores em ordem crescente. Chaves como "1" vêm antes de "0.15" na ordem das propriedades em JS. */
export const CORES_CALOR = Object.entries(GRADIENTE_CALOR)
  .sort(([a], [b]) => Number(a) - Number(b))
  .map(([, cor]) => cor)
