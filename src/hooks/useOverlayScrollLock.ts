import { useEffect } from "react"

type Options = {
  locked: boolean
  mobile: boolean
}

export function useOverlayScrollLock({ locked, mobile }: Options) {
  useEffect(() => {
    if (!locked) return undefined

    const previousBodyOverflow = document.body.style.overflow
    const previousHtmlOverflow = document.documentElement.style.overflow
    const previousBodyPaddingRight = document.body.style.paddingRight
    const previousHtmlPaddingRight = document.documentElement.style.paddingRight
    const previousBodyPosition = document.body.style.position
    const previousBodyTop = document.body.style.top
    const previousBodyWidth = document.body.style.width
    const scrollY = window.scrollY
    const scrollbarWidth = Math.max(0, window.innerWidth - document.documentElement.clientWidth)

    if (scrollbarWidth > 0) {
      const bodyPadding = Number.parseFloat(window.getComputedStyle(document.body).paddingRight || "0")
      const htmlPadding = Number.parseFloat(window.getComputedStyle(document.documentElement).paddingRight || "0")
      document.body.style.paddingRight = `${bodyPadding + scrollbarWidth}px`
      document.documentElement.style.paddingRight = `${htmlPadding + scrollbarWidth}px`
    }

    if (mobile) {
      document.body.style.position = "fixed"
      document.body.style.top = `-${scrollY}px`
      document.body.style.width = "100%"
      document.body.style.overflow = "hidden"
      document.documentElement.style.overflow = "hidden"
    } else {
      document.body.style.overflow = "hidden"
      document.documentElement.style.overflow = "hidden"
    }

    window.__lenis?.stop?.()

    return () => {
      document.body.style.overflow = previousBodyOverflow
      document.documentElement.style.overflow = previousHtmlOverflow
      document.body.style.paddingRight = previousBodyPaddingRight
      document.documentElement.style.paddingRight = previousHtmlPaddingRight
      document.body.style.position = previousBodyPosition
      document.body.style.top = previousBodyTop
      document.body.style.width = previousBodyWidth
      if (mobile) {
        window.scrollTo(0, scrollY)
      }
      window.__lenis?.start?.()
    }
  }, [locked, mobile])
}
