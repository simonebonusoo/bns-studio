type ProductGalleryProps = {
  title: string
  images: string[]
  selectedImage: string
  onSelectImage: (image: string) => void
  onOpenLightbox: () => void
}

export function ProductGallery({
  title,
  images,
  selectedImage,
  onSelectImage,
  onOpenLightbox,
}: ProductGalleryProps) {
  const activeImage = selectedImage || images[0] || ""

  return (
    <div className="min-w-0 grid gap-4 md:grid-cols-[minmax(0,1fr)_92px] md:items-start">
      <button
        type="button"
        onClick={onOpenLightbox}
        className="shop-card block overflow-hidden text-left transition hover:border-white/20"
      >
        <div className="flex min-h-[360px] items-center justify-center bg-white/[0.02] p-4 md:min-h-[460px]">
          {activeImage ? (
            <img src={activeImage} alt={title} className="max-h-[420px] w-full object-contain md:max-h-[520px]" />
          ) : (
            <div className="text-sm text-white/45">Nessuna immagine disponibile</div>
          )}
        </div>
      </button>
      <div className="grid grid-cols-4 gap-3 md:grid-cols-1">
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
