import { useEffect, useState } from "react"
import { ChevronLeftIcon, ChevronRightIcon } from "@heroicons/react/24/outline"
import { AnimatePresence, motion } from "framer-motion"

export function ShippingBar({
  enabled = true,
  text = "3-5 DAYS FREE SHIPPING WORLDWIDE",
  messages = [],
  backgroundColor = "#000000",
}: {
  enabled?: boolean
  text?: string
  messages?: string[]
  backgroundColor?: string
}) {
  const safeMessages = (messages ?? []).map((entry) => entry?.trim()).filter(Boolean)
  const resolvedMessages = safeMessages.length ? safeMessages : [text]
  const [activeIndex, setActiveIndex] = useState(0)

  useEffect(() => {
    setActiveIndex((current) => Math.min(current, Math.max(resolvedMessages.length - 1, 0)))
  }, [resolvedMessages.length])

  if (!enabled) {
    return null
  }

  const hasMultipleMessages = resolvedMessages.length > 1

  return (
    <div
      className="flex min-h-9 items-center px-4 py-2 text-white transition-colors duration-300 ease-out"
      style={{ backgroundColor }}
    >
      <div className="mx-auto grid w-full max-w-7xl grid-cols-[32px_minmax(0,1fr)_32px] items-center gap-2">
        <button
          type="button"
          aria-label="Messaggio precedente"
          disabled={!hasMultipleMessages}
          onClick={() => setActiveIndex((current) => (current - 1 + resolvedMessages.length) % resolvedMessages.length)}
          className={`inline-flex h-7 w-7 items-center justify-center rounded-full border border-white/15 transition ${
            hasMultipleMessages ? "text-white/88 hover:border-white/30 hover:text-white" : "cursor-default text-white/30"
          }`}
        >
          <ChevronLeftIcon className="h-4 w-4" />
        </button>

        <div className="relative overflow-hidden text-center text-[11px] font-semibold uppercase tracking-[0.2em] sm:text-xs">
          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key={`${activeIndex}-${resolvedMessages[activeIndex]}`}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
            >
              {resolvedMessages[activeIndex]}
            </motion.div>
          </AnimatePresence>
        </div>

        <button
          type="button"
          aria-label="Messaggio successivo"
          disabled={!hasMultipleMessages}
          onClick={() => setActiveIndex((current) => (current + 1) % resolvedMessages.length)}
          className={`inline-flex h-7 w-7 items-center justify-center justify-self-end rounded-full border border-white/15 transition ${
            hasMultipleMessages ? "text-white/88 hover:border-white/30 hover:text-white" : "cursor-default text-white/30"
          }`}
        >
          <ChevronRightIcon className="h-4 w-4" />
        </button>
      </div>
    </div>
  )
}
