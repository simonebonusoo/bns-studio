export function ShippingBar({ enabled = true, text = "3-5 DAYS FREE SHIPPING WORLDWIDE" }: { enabled?: boolean; text?: string }) {
  if (!enabled) {
    return null
  }

  return (
    <div className="flex min-h-9 items-center bg-black px-4 py-2 text-white">
      <div className="mx-auto max-w-7xl text-center text-[11px] font-semibold uppercase tracking-[0.2em] sm:text-xs">
        {text}
      </div>
    </div>
  )
}
