import { useEffect, useMemo, useState } from "react"

const INITIAL_SECONDS = 12 * 60 * 60

function formatUnit(value: number) {
  return String(Math.max(0, value)).padStart(2, "0")
}

export function TopPromoBar() {
  const [remainingSeconds, setRemainingSeconds] = useState(INITIAL_SECONDS)

  useEffect(() => {
    const timer = window.setInterval(() => {
      setRemainingSeconds((current) => (current <= 1 ? INITIAL_SECONDS : current - 1))
    }, 1000)

    return () => window.clearInterval(timer)
  }, [])

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
    <div className="flex min-h-11 items-center bg-[#d32f2f] px-4 py-2 text-white">
      <div className="mx-auto flex max-w-7xl flex-col items-center justify-center gap-1 text-center sm:flex-row sm:gap-3">
        <span className="text-sm font-bold tracking-[0.18em] sm:text-base">SAVE 40% OFF</span>
        <span className="text-[11px] font-semibold uppercase tracking-[0.16em] text-white/85 sm:text-xs">Sale ends in:</span>
        <div className="flex items-center gap-2 text-sm font-bold sm:text-base">
          <span>{countdown.days}d</span>
          <span>{countdown.hours}h</span>
          <span>{countdown.minutes}m</span>
          <span>{countdown.seconds}s</span>
        </div>
      </div>
    </div>
  )
}
