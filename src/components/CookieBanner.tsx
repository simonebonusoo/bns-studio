import { useEffect, useState } from "react"
import { Link } from "react-router-dom"

const COOKIE_BANNER_KEY = "bns_cookie_banner_accepted"

export function CookieBanner() {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    try {
      setVisible(window.localStorage.getItem(COOKIE_BANNER_KEY) !== "true")
    } catch {
      setVisible(true)
    }
  }, [])

  function acceptCookies() {
    try {
      window.localStorage.setItem(COOKIE_BANNER_KEY, "true")
    } catch {
      // Ignore storage failures and still hide the banner for this session.
    }
    setVisible(false)
  }

  if (!visible) {
    return null
  }

  return (
    <div className="fixed inset-x-0 bottom-0 z-[120] px-3 pb-3 sm:px-4 sm:pb-4">
      <div className="mx-auto flex max-w-4xl flex-col gap-3 rounded-2xl border border-black/10 bg-white px-4 py-4 text-black shadow-[0_12px_36px_rgba(0,0,0,0.16)] sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm leading-6 text-black/75">
          Questo sito usa cookie per migliorare l&apos;esperienza.{" "}
          <Link to="/privacy" className="font-semibold text-black underline underline-offset-4 transition hover:text-black/70">
            Privacy Policy
          </Link>
        </p>
        <button
          type="button"
          onClick={acceptCookies}
          className="inline-flex h-11 min-w-[88px] items-center justify-center rounded-full bg-black px-5 text-sm font-semibold text-white transition hover:bg-black/85"
        >
          OK
        </button>
      </div>
    </div>
  )
}
