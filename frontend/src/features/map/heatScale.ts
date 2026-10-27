// Sequential heatmap scale, from #FBE3A1 to #7A0F1F (section 9.1), readable for color-blind people.
export const HEAT_GRADIENT: Record<number, string> = {
  0.15: '#FBE3A1',
  0.4: '#F2B263',
  0.6: '#DC6B33',
  0.8: '#B02E26',
  1: '#7A0F1F',
}

/** Colors in ascending order. Keys like "1" come before "0.15" in JS property order. */
export const HEAT_COLORS = Object.entries(HEAT_GRADIENT)
  .sort(([a], [b]) => Number(a) - Number(b))
  .map(([, color]) => color)
