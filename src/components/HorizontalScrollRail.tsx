import { ChevronRightIcon } from "@heroicons/react/24/outline"
import { type ReactNode, type WheelEventHandler, useEffect, useRef, useState } from "react"

type HorizontalScrollRailProps = {
  children: ReactNode
  className?: string
  contentClassName?: string
  ariaLabel?: string
  onWheel?: WheelEventHandler<HTMLDivElement>
}

export function HorizontalScrollRail({
  children,
  className = "",
  contentClassName = "",
  ariaLabel = "Scorri a destra",
  onWheel,
}: HorizontalScrollRailProps) {
  const scrollRef = useRef<HTMLDivElement | null>(null)
  const [canScrollRight, setCanScrollRight] = useState(false)

  useEffect(() => {
    const node = scrollRef.current
    if (!node) return

    const updateScrollState = () => {
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

  function handleScrollRight() {
    const node = scrollRef.current
    if (!node) return
    node.scrollBy({ left: Math.max(node.clientWidth * 0.82, 280), behavior: "smooth" })
  }

  return (
    <div className={`relative ${className}`.trim()}>
      <div ref={scrollRef} className={contentClassName} onWheel={onWheel}>
        {children}
      </div>

      {canScrollRight ? (
        <button
          type="button"
          aria-label={ariaLabel}
          onClick={handleScrollRight}
          className="absolute right-2 top-1/2 z-10 inline-flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full border border-white/12 bg-black/55 text-white shadow-[0_10px_30px_rgba(0,0,0,.35)] backdrop-blur-md transition hover:border-white/24 hover:bg-black/72"
        >
          <ChevronRightIcon className="h-5 w-5" />
        </button>
      ) : null}
    </div>
  )
}
