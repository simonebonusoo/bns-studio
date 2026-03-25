import { useEffect, useState } from "react"
import { motion, AnimatePresence } from "framer-motion"

export function BackToTop() {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const onScroll = () => setVisible(window.scrollY > 400)
    window.addEventListener("scroll", onScroll, { passive: true })
    return () => window.removeEventListener("scroll", onScroll)
  }, [])

  return (
    <AnimatePresence>
      {visible && (
        <motion.button
          type="button"
          aria-label="Torna in alto"
          initial={{ opacity: 0, y: 12, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 12, scale: 0.9 }}
          transition={{ duration: 0.2, ease: "easeOut" }}
          onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
          className={[
            "fixed bottom-6 left-6 z-[9999]",
            "hidden md:flex", // ✅ NASCOSTO SU MOBILE
            "h-11 w-11 rounded-2xl",
            "items-center justify-center",
            "bg-white/[0.06] backdrop-blur-2xl",
            "border border-white/20",
            "shadow-[0_18px_60px_rgba(0,0,0,.45)]",
            "text-white/85 hover:text-white transition",
          ].join(" ")}
        >
          ↑
        </motion.button>
      )}
    </AnimatePresence>
  )
}