import { useEffect, useState } from "react"

const HOVER_QUERY = "(hover: hover) and (pointer: fine)"

export function useCanHover() {
  const [canHover, setCanHover] = useState(false)

  useEffect(() => {
    if (typeof window === "undefined" || typeof window.matchMedia !== "function") {
      return undefined
    }

    const mediaQuery = window.matchMedia(HOVER_QUERY)
    const sync = () => setCanHover(mediaQuery.matches)

    sync()

    if (typeof mediaQuery.addEventListener === "function") {
      mediaQuery.addEventListener("change", sync)
      return () => mediaQuery.removeEventListener("change", sync)
    }

    mediaQuery.addListener(sync)
    return () => mediaQuery.removeListener(sync)
  }, [])

  return canHover
}
