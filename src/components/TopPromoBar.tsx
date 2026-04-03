import { useEffect, useMemo, useState } from "react"

function formatUnit(value: number) {
  return String(Math.max(0, value)).padStart(2, "0")
}

export function TopPromoBar({
  enabled = true,
  title = "SAVE 40% OFF",
  subtitle = "Sale ends in:",
  backgroundColor = "#d32f2f",
  textColor = "#ffffff",
  countdownEnabled = true,
  countdownTarget,
}: {
  enabled?: boolean
  title?: string
  subtitle?: string
  backgroundColor?: string
  textColor?: string
  countdownEnabled?: boolean
  countdownTarget?: string
}) {
  const [remainingSeconds, setRemainingSeconds] = useState(0)

  useEffect(() => {
    if (!countdownEnabled) return

    const targetTimestamp = countdownTarget ? Date.parse(countdownTarget) : Number.NaN
    const safeTarget = Number.isFinite(targetTimestamp) ? targetTimestamp : Date.now() + 12 * 60 * 60 * 1000

    const updateRemaining = () => {
      setRemainingSeconds(Math.max(0, Math.floor((safeTarget - Date.now()) / 1000)))
    }

    updateRemaining()
    const timer = window.setInterval(() => {
      updateRemaining()
    }, 1000)

    return () => window.clearInterval(timer)
  }, [countdownEnabled, countdownTarget])

  if (!enabled) {
    return null
  }

  const countdown = useMemo(() => {
    const days = Math.floor(remainingSeconds / 86400)
    const hours = Math.floor((remainingSeconds % 86400) / 3600)
    const minutes = Math.floor((remainingSeconds % 3600) / 60)
    const seconds = remainingSeconds % 60

    return {
      days: formatUnit(days),
      hours: formatUnit(hours),
      minutes: formatUnit(minutes),
      seconds: formatUnit(seconds),
    }
  }, [remainingSeconds])

  return (
    <div className="flex min-h-11 items-center px-4 py-2" style={{ backgroundColor, color: textColor }}>
      <div className="mx-auto flex max-w-7xl flex-col items-center justify-center gap-1 text-center sm:flex-row sm:gap-3">
        <span className="text-sm font-bold tracking-[0.18em] sm:text-base">{title}</span>
        {subtitle ? <span className="text-[11px] font-semibold uppercase tracking-[0.16em] opacity-85 sm:text-xs">{subtitle}</span> : null}
        {countdownEnabled ? (
          <div className="flex items-center gap-2 text-sm font-bold sm:text-base">
            <span>{countdown.days}G</span>
            <span>{countdown.hours}H</span>
            <span>{countdown.minutes}M</span>
            <span>{countdown.seconds}S</span>
          </div>
        ) : null}
      </div>
    </div>
  )
}
