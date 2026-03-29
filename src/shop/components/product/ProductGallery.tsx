type ProductGalleryProps = {
  title: string
  images: string[]
  selectedImage: string
  lockedHeight?: number | null
  onSelectImage: (image: string) => void
  onOpenLightbox: () => void
}

export function ProductGallery({
  title,
  images,
  selectedImage,
  lockedHeight,
  onSelectImage,
  onOpenLightbox,
}: ProductGalleryProps) {
  const activeImage = selectedImage || images[0] || ""

  return (
    <div
      className="grid min-w-0 gap-3 md:grid-cols-[minmax(0,1fr)_84px] md:items-stretch lg:h-[var(--gallery-height)]"
      style={{ ["--gallery-height" as string]: lockedHeight ? `${lockedHeight}px` : "auto" }}
    >
      <button
        type="button"
        onClick={onOpenLightbox}
        className="shop-card grid min-w-0 overflow-hidden p-0 text-left transition hover:border-white/20 lg:h-full"
      >
        <div className="relative min-h-[360px] bg-white/[0.02] md:min-h-[470px] lg:h-full">
          {activeImage ? (
            <img
              src={activeImage}
              alt={title}
              className="absolute inset-0 h-full w-full object-cover object-center"
            />
          ) : (
            <div className="grid h-full w-full place-items-center text-sm text-white/45">Nessuna immagine disponibile</div>
          )}
        </div>
      </button>
      <div className="grid h-full grid-cols-4 content-start gap-2.5 md:grid-cols-1">
        {images.map((image, index) => (
          <button
            key={image}
            type="button"
            onClick={() => onSelectImage(image)}
            className={`overflow-hidden rounded-[20px] border text-left ${activeImage === image ? "border-[#e3f503]" : "border-white/10"}`}
          >
            <img src={image} alt={title} className="aspect-square w-full object-cover" />
            <div className="border-t border-white/10 px-2 py-2 text-[10px] uppercase tracking-[0.16em] text-white/55">
              {index === 0 ? "Cover" : `${index + 1}`}
            </div>
          </button>
        ))}
      </div>
    </div>
  )
}
