/** Joins the truthy class names: cx('a', active && 'b') → 'a b'. */
export function cx(...names: (string | false | null | undefined)[]): string {
  return names.filter(Boolean).join(' ')
}
