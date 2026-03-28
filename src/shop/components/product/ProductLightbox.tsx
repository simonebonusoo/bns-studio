type ProductLightboxProps = {
  open: boolean
  image: string
  title: string
  onClose: () => void
}

export function ProductLightbox({ open, image, title, onClose }: ProductLightboxProps) {
  if (!open) return null

  return (
    <div
      className="fixed inset-0 z-[90] flex items-center justify-center bg-black/85 px-4 py-6 backdrop-blur-sm"
      onClick={onClose}
    >
      <button
        type="button"
        aria-label="Chiudi anteprima immagine"
        onClick={onClose}
        className="absolute right-5 top-5 rounded-full border border-white/15 px-4 py-2 text-sm text-white/75 transition hover:border-white/30 hover:text-white"
      >
        Chiudi
      </button>
      <img
        src={image}
        alt={title}
        onClick={(event) => event.stopPropagation()}
        className="max-h-[88vh] max-w-[92vw] object-contain shadow-[0_24px_80px_rgba(0,0,0,0.45)]"
      />
    </div>
  )
}
