import { useEffect, useState } from "react"

const MOBILE_QUERY = "(max-width: 767px)"

export function useIsMobileViewport() {
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    if (typeof window === "undefined" || typeof window.matchMedia !== "function") {
      return undefined
    }

    const mediaQuery = window.matchMedia(MOBILE_QUERY)
    const sync = () => setIsMobile(mediaQuery.matches)

    sync()

    if (typeof mediaQuery.addEventListener === "function") {
      mediaQuery.addEventListener("change", sync)
      return () => mediaQuery.removeEventListener("change", sync)
    }

    mediaQuery.addListener(sync)
    return () => mediaQuery.removeListener(sync)
  }, [])

  return isMobile
}
