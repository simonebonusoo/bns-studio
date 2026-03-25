import { motion, useReducedMotion } from "framer-motion"
import type { ReactNode } from "react"

export function Stagger({ children, delay = 0 }: { children: ReactNode; delay?: number }) {
  const reduce = useReducedMotion()
  const parent = {
    hidden: { opacity: 1 },
    show: {
      opacity: 1,
      transition: reduce
        ? {}
        : { staggerChildren: 0.08, delayChildren: delay },
    },
  }
  return (
    <motion.div
      variants={parent}
      initial="hidden"
      whileInView="show"
      viewport={{ once: true, margin: "-10% 0px -10% 0px" }}
    >
      {children}
    </motion.div>
  )
}

export function Item({ children }: { children: ReactNode }) {
  const reduce = useReducedMotion()
  const child = {
    hidden: reduce ? { opacity: 1 } : { opacity: 0, y: 14, filter: "blur(6px)" },
    show: reduce ? { opacity: 1 } : { opacity: 1, y: 0, filter: "blur(0px)" },
  }
  return (
    <motion.div variants={child} transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}>
      {children}
    </motion.div>
  )
}