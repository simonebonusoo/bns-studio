import { ReactNode, forwardRef, useEffect } from "react"
import { AnimatePresence, motion } from "framer-motion"
import { XMarkIcon } from "@heroicons/react/24/outline"

import { useBodyScrollLock } from "../../hooks/useBodyScrollLock"

const overlayTransition = { duration: 0.18, ease: [0.22, 1, 0.36, 1] as const }
const drawerTransition = { duration: 0.24, ease: [0.22, 1, 0.36, 1] as const }

type MobileSheetProps = {
  open: boolean
  eyebrow: string
  title: string
  description: string
  onClose: () => void
  children: ReactNode
  footer?: ReactNode
  bodyClassName?: string
}

export const mobileSheetBodyClass =
  "min-h-0 flex-1 overflow-y-auto touch-pan-y overscroll-y-contain [-webkit-overflow-scrolling:touch]"

export const mobileSheetFooterClass =
  "shrink-0 border-t border-white/10 bg-[#0b0b0c]/96 pb-[calc(env(safe-area-inset-bottom)+0.5rem)]"

export const MobileSheet = forwardRef<HTMLDivElement, MobileSheetProps>(function MobileSheet(
  { open, eyebrow, title, description, onClose, children, footer, bodyClassName },
  ref,
) {
  useBodyScrollLock(open)

  useEffect(() => {
    if (!open) return

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose()
    }

    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [onClose, open])

  return (
    <AnimatePresence>
      {open ? (
        <>
          <motion.button
            type="button"
            aria-label="Chiudi pannello"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={overlayTransition}
            className="fixed inset-0 z-40 bg-black/45 backdrop-blur-sm"
            onClick={onClose}
          />

          <motion.aside
            ref={ref}
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 18 }}
            transition={drawerTransition}
            className="fixed inset-x-0 bottom-0 z-50 h-[calc(100svh-0.75rem)] w-full overflow-hidden rounded-t-[30px] border border-white/10 border-b-0 bg-[#0b0b0c]/96 p-5 shadow-[0_20px_80px_rgba(0,0,0,.45)] backdrop-blur-2xl will-change-transform"
          >
            <div className="flex h-full min-h-0 flex-col">
              <div className="shrink-0 border-b border-white/10 pb-5">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-xs uppercase tracking-[0.24em] text-white/45">{eyebrow}</p>
                    <h2 className="mt-3 text-2xl font-semibold text-white">{title}</h2>
                    <p className="mt-2 text-sm text-white/60">{description}</p>
                  </div>

                  <button
                    type="button"
                    onClick={onClose}
                    className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/10 text-white/55 transition hover:border-white/20 hover:text-white"
                    aria-label="Chiudi pannello"
                  >
                    <XMarkIcon className="h-5 w-5" />
                  </button>
                </div>
              </div>

              <div className={bodyClassName || `${mobileSheetBodyClass} py-6 pb-[calc(env(safe-area-inset-bottom)+1.5rem)]`}>
                {children}
              </div>

              {footer ? <div className={`${mobileSheetFooterClass} pt-5`}>{footer}</div> : null}
            </div>
          </motion.aside>
        </>
      ) : null}
    </AnimatePresence>
  )
})
