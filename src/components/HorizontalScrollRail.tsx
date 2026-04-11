import { ChevronLeftIcon, ChevronRightIcon } from "@heroicons/react/24/outline"
import { type ReactNode, type WheelEventHandler, useEffect, useRef, useState } from "react"

type HorizontalScrollRailProps = {
  children: ReactNode
  className?: string
  contentClassName?: string
  ariaLabel?: string
  isolateWheel?: boolean
  onWheel?: WheelEventHandler<HTMLDivElement>
}

export function HorizontalScrollRail({
  children,
  className = "",
  contentClassName = "",
  ariaLabel = "Scorri a destra",
  isolateWheel = false,
  onWheel,
}: HorizontalScrollRailProps) {
  const scrollRef = useRef<HTMLDivElement | null>(null)
  const [canScrollLeft, setCanScrollLeft] = useState(false)
  const [canScrollRight, setCanScrollRight] = useState(false)

  useEffect(() => {
    const node = scrollRef.current
    if (!node) return

    const updateScrollState = () => {
      setCanScrollLeft(node.scrollLeft > 8)
      setCanScrollRight(node.scrollLeft + node.clientWidth < node.scrollWidth - 8)
    }

    updateScrollState()
    node.addEventListener("scroll", updateScrollState, { passive: true })

    const resizeObserver = new ResizeObserver(updateScrollState)
    resizeObserver.observe(node)
    Array.from(node.children).forEach((child) => resizeObserver.observe(child))

    return () => {
      node.removeEventListener("scroll", updateScrollState)
      resizeObserver.disconnect()
    }
  }, [])

  useEffect(() => {
    const node = scrollRef.current
    if (!node || !isolateWheel) return

    const containWheel = (event: WheelEvent) => {
      event.preventDefault()
      event.stopPropagation()
      event.stopImmediatePropagation()

      const delta = Math.abs(event.deltaY) >= Math.abs(event.deltaX) ? event.deltaY : event.deltaX
      if (delta) {
        node.scrollLeft += delta
      }
    }

    node.addEventListener("wheel", containWheel, { passive: false, capture: true })

    return () => {
      node.removeEventListener("wheel", containWheel, { capture: true })
    }
  }, [isolateWheel])

  function handleScroll(delta: number) {
    const node = scrollRef.current
    if (!node) return
    node.scrollBy({ left: delta, behavior: "smooth" })
  }

  return (
    <div className={`relative ${className}`.trim()}>
      <div
        ref={scrollRef}
        className={contentClassName}
        onWheelCapture={onWheel}
        style={isolateWheel ? { overscrollBehavior: "contain" } : undefined}
      >
        {children}
      </div>

      {canScrollLeft ? (
        <div className="pointer-events-none absolute inset-y-0 left-2 z-10 flex items-center">
          <button
            type="button"
            aria-label="Scorri a sinistra"
            onClick={() => handleScroll(-Math.max(scrollRef.current?.clientWidth ? scrollRef.current.clientWidth * 0.82 : 0, 280))}
            className="pointer-events-auto inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/12 bg-black/55 text-white shadow-[0_10px_30px_rgba(0,0,0,.35)] backdrop-blur-md transition hover:border-white/24 hover:bg-black/72"
          >
            <ChevronLeftIcon className="h-5 w-5" />
          </button>
        </div>
      ) : null}

      {canScrollRight ? (
        <div className="pointer-events-none absolute inset-y-0 right-2 z-10 flex items-center">
          <button
            type="button"
            aria-label={ariaLabel}
            onClick={() => handleScroll(Math.max(scrollRef.current?.clientWidth ? scrollRef.current.clientWidth * 0.82 : 0, 280))}
            className="pointer-events-auto inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/12 bg-black/55 text-white shadow-[0_10px_30px_rgba(0,0,0,.35)] backdrop-blur-md transition hover:border-white/24 hover:bg-black/72"
          >
            <ChevronRightIcon className="h-5 w-5" />
          </button>
        </div>
      ) : null}
    </div>
  )
}
