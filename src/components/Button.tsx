import { PropsWithChildren, useEffect, useRef, useState } from "react"
import clsx from "clsx"
import { motion, useReducedMotion } from "framer-motion"

type Props = PropsWithChildren<{
  href?: string
  onClick?: (e: any) => void
  type?: "button" | "submit" | "reset"
  variant?: "primary" | "ghost"
  size?: "sm" | "md"
  className?: string
  /** Se children NON è stringa, passa text per lo scramble */
  text?: string
  icon?: React.ReactNode
}>

const BRAND = "#e3f503"
const CHARS = "!@#$%^&*():{};|,.<>/?"
const CYCLES_PER_LETTER = 2
const SHUFFLE_TIME = 40

export function Button({
  children,
  href,
  onClick,
  type = "button",
  variant = "primary",
  size = "md",
  className,
  text,
  icon,
}: Props) {
  const reduce = useReducedMotion()
  const intervalRef = useRef<number | null>(null)

  const targetText = text ?? (typeof children === "string" ? children : "")
  const [label, setLabel] = useState(targetText)

  useEffect(() => {
    setLabel(targetText)
  }, [targetText])

  const stopScramble = () => {
    if (intervalRef.current) window.clearInterval(intervalRef.current)
    intervalRef.current = null
    setLabel(targetText)
  }

  const scramble = () => {
    if (reduce) return
    if (!targetText) return

    let pos = 0
    if (intervalRef.current) window.clearInterval(intervalRef.current)

    intervalRef.current = window.setInterval(() => {
      const scrambled = targetText
        .split("")
        .map((_, i) => {
          if (pos / CYCLES_PER_LETTER > i) return targetText[i]
          return CHARS[Math.floor(Math.random() * CHARS.length)]
        })
        .join("")

      setLabel(scrambled)
      pos++

      if (pos >= targetText.length * CYCLES_PER_LETTER) stopScramble()
    }, SHUFFLE_TIME)
  }

  useEffect(() => {
    return () => stopScramble()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const base =
    "group relative overflow-hidden inline-flex items-center justify-center gap-2 font-medium " +
    "transition-all active:scale-[.98] select-none"

  const sizeCls =
    size === "sm"
      ? "h-9 px-3.5 text-xs rounded-md"
      : "h-11 px-5 text-sm rounded-lg"

  const variantCls =
    variant === "primary"
      ? "bg-white text-black hover:bg-white/90 shadow-[0_10px_30px_rgba(0,0,0,0.35)]"
      : "bg-transparent text-white/80 border border-white/15 hover:border-white/30 hover:text-white"

  const cls = clsx(base, sizeCls, variantCls, className)

  const iconCls =
    variant === "primary"
      ? "text-black/80"
      : "text-white/80 group-hover:text-[color:var(--brand)] transition-colors"

  const labelCls =
    "absolute left-0 top-0 whitespace-pre transition-colors " +
    (variant === "primary"
      ? "text-black"
      : "text-white/80 group-hover:text-[color:var(--brand)]")

  const Inner = (
    <>
      <span
        className="relative z-10 inline-flex items-center gap-2"
        style={{ ["--brand" as any]: BRAND } as any}
      >
        {icon ? <span className={iconCls}>{icon}</span> : null}

        {targetText ? (
          <span className="relative inline-block uppercase tracking-wide">
            {/* spazio riservato: evita resize */}
            <span className="invisible whitespace-pre">{targetText}</span>

            {/* testo reale (scramble) */}
            <span className={labelCls}>{label}</span>
          </span>
        ) : (
          <span>{children}</span>
        )}
      </span>

      {/* scanline glow (palette) */}
      <motion.span
        aria-hidden
        initial={{ y: "100%" }}
        animate={reduce ? { y: "100%" } : { y: "-100%" }}
        transition={
          reduce
            ? {}
            : { repeat: Infinity, repeatType: "mirror", duration: 1.05, ease: "linear" }
        }
        style={{ ["--brand" as any]: BRAND } as any}
        className={
          "absolute inset-0 z-0 scale-125 opacity-0 transition-opacity duration-300 " +
          "bg-gradient-to-t from-[color:var(--brand)]/0 from-40% via-[color:var(--brand)]/65 to-[color:var(--brand)]/0 to-60% " +
          "group-hover:opacity-100"
        }
      />

      {/* depth */}
      <span
        aria-hidden
        className="pointer-events-none absolute inset-0 z-0 shadow-[inset_-1px_-1px_1px_rgba(255,255,255,0.06),inset_1px_1px_1px_rgba(0,0,0,0.9)]"
      />
    </>
  )

  const common = {
    className: cls,
    onMouseEnter: scramble,
    onMouseLeave: stopScramble,
    onFocus: scramble,
    onBlur: stopScramble,
  }

  if (href) {
    return (
      <a href={href} {...common}>
        {Inner}
      </a>
    )
  }

  return (
    <button type={type} onClick={onClick} {...common}>
      {Inner}
    </button>
  )
}