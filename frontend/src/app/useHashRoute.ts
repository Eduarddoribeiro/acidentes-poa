import { useEffect, useState } from 'react'

export type Route = 'map' | 'methodology'

function currentRoute(): Route {
  // '#/metodologia' is the address used before the code moved to English; old links keep working.
  return /^#\/(methodology|metodologia)/.test(window.location.hash) ? 'methodology' : 'map'
}

/** Two pages only, so a hash route is enough: it works on static hosting without server rewrites. */
export function useHashRoute(): Route {
  const [route, setRoute] = useState<Route>(currentRoute)

  useEffect(() => {
    const onHashChange = () => {
      setRoute(currentRoute())
      window.scrollTo(0, 0)
    }
    window.addEventListener('hashchange', onHashChange)
    return () => window.removeEventListener('hashchange', onHashChange)
  }, [])

  return route
}
