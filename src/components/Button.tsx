import { PropsWithChildren, useEffect, useRef, useState } from "react"
import clsx from "clsx"
import { motion, useReducedMotion } from "framer-motion"

type Props = PropsWithChildren<{
  href?: string
  onClick?: (e: any) => void
  type?: "button" | "submit" | "reset"
  variant?: "primary" | "ghost" | "cart" | "profile"
  size?: "sm" | "md"
  className?: string
  disabled?: boolean
  /** Se children NON è stringa, passa text per lo scramble */
  text?: string
  icon?: React.ReactNode
}>

const BRAND = "#e3f503"
const CHARS = "!@#$%^&*():{};|,.<>/?"
const CYCLES_PER_LETTER = 2
const SHUFFLE_TIME = 40

function resolveVariant(variant: Props["variant"]) {
  if (variant === "ghost") return "profile"
  if (variant === "primary") return "cart"
  return variant || "cart"
}

export function getButtonClassName({
  variant = "cart",
  size = "md",
  className,
  disabled = false,
}: {
  variant?: "primary" | "ghost" | "cart" | "profile"
  size?: "sm" | "md"
  className?: string
  disabled?: boolean
}) {
  const resolvedVariant = resolveVariant(variant)
  const base =
    "group relative overflow-hidden inline-flex items-center justify-center gap-2 font-medium " +
    "transition-all active:scale-[.98] select-none"

  const sizeCls =
    size === "sm"
      ? "h-9 px-3.5 text-xs rounded-md"
      : "h-11 px-5 text-sm rounded-lg"

  const variantCls =
    resolvedVariant === "cart"
      ? "bg-white text-black hover:bg-white/90 shadow-[0_10px_30px_rgba(0,0,0,0.35)]"
      : "bg-transparent text-white/80 border border-white/15 hover:border-white/30 hover:text-white"

  const disabledCls = disabled ? "cursor-not-allowed opacity-60 hover:bg-inherit hover:border-inherit hover:text-inherit active:scale-100" : ""

  return clsx(base, sizeCls, variantCls, disabledCls, className)
}

export function getDangerButtonClassName({
  size = "md",
  className,
  disabled = false,
}: {
  size?: "sm" | "md"
  className?: string
  disabled?: boolean
}) {
  return getButtonClassName({
    variant: "profile",
    size,
    disabled,
    className: clsx(
      "danger-button !border-red-400/30 !text-red-100/95",
      !disabled && "hover:!border-red-400/75 hover:!text-red-50 hover:!bg-red-500/14",
      className,
    ),
  })
}

export function Button({
  children,
  href,
  onClick,
  type = "button",
  variant = "primary",
  size = "md",
  className,
  disabled = false,
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

  const resolvedVariant = resolveVariant(variant)
  const cls = getButtonClassName({ variant: resolvedVariant, size, className, disabled })
  const isDanger = String(className || "").includes("danger-button")

  const iconCls =
    resolvedVariant === "cart"
      ? "text-black/80"
      : clsx(
          "text-white/80 transition-colors",
          isDanger ? "group-hover:text-red-100" : "group-hover:text-[color:var(--brand)]",
        )

  const labelCls =
    "absolute left-0 top-0 whitespace-pre transition-colors " +
    (resolvedVariant === "cart"
      ? "text-black"
      : isDanger
        ? "text-white/80 group-hover:text-red-100"
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
    onMouseEnter: disabled ? undefined : scramble,
    onMouseLeave: stopScramble,
    onFocus: disabled ? undefined : scramble,
    onBlur: stopScramble,
  }

  if (href) {
    return (
      <a
        href={href}
        onClick={(event) => {
          if (disabled) {
            event.preventDefault()
            return
          }
          onClick?.(event)
        }}
        {...common}
      >
        {Inner}
      </a>
    )
  }

  return (
    <button type={type} onClick={onClick} disabled={disabled} {...common}>
      {Inner}
    </button>
  )
}
