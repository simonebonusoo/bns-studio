type ProductMediaManagerProps = {
  images: string[]
  existingImageUrls: string[]
  disabled?: boolean
  onFileChange: (files: FileList | null) => void
  onMakePrimary: (imageUrl: string) => void
  onMoveBackward: (imageUrl: string) => void
  onMoveForward: (imageUrl: string) => void
  onRemoveExisting: (imageUrl: string) => void
}

export function ProductMediaManager({
  images,
  existingImageUrls,
  disabled = false,
  onFileChange,
  onMakePrimary,
  onMoveBackward,
  onMoveForward,
  onRemoveExisting,
}: ProductMediaManagerProps) {
  const coverImage = images[0] || ""

  return (
    <div className="space-y-4 rounded-2xl border border-white/10 p-4">
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-white">Immagini prodotto</p>
          <p className="mt-1 text-xs text-white/55">La cover pubblica è sempre la prima immagine. Puoi riordinarle senza cambiare gli URL già salvati.</p>
        </div>
        <label className={`rounded-full border border-white/10 px-4 py-2 text-sm transition ${disabled ? "cursor-not-allowed text-white/35" : "text-white/75 hover:border-white/25 hover:text-white"}`}>
          Carica immagini
          <input type="file" multiple accept="image/*" className="hidden" disabled={disabled} onChange={(event) => onFileChange(event.target.files)} />
        </label>
      </div>

      {images.length ? (
        <div className="grid gap-4 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)]">
          <div className="rounded-[24px] border border-white/10 bg-white/[0.02] p-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-xs uppercase tracking-[0.22em] text-white/45">Cover</p>
                <p className="mt-1 text-sm text-white/65">Questa immagine apre le card e la scheda prodotto.</p>
              </div>
              <span className="rounded-full bg-[#e3f503] px-3 py-1 text-[11px] font-medium uppercase tracking-[0.16em] text-black">
                Principale
              </span>
            </div>
            <div className="mt-4 overflow-hidden rounded-[20px] border border-white/10 bg-black/15">
              <img src={coverImage} alt="" className="aspect-[4/3] w-full object-cover" />
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between gap-3">
              <p className="text-xs uppercase tracking-[0.22em] text-white/45">Gallery ordinata</p>
              <span className="text-xs text-white/45">{images.length} immagini</span>
            </div>
            <div className="space-y-3">
              {images.map((image, index) => (
                <div key={image} className="grid gap-3 rounded-2xl border border-white/10 p-3 sm:grid-cols-[96px_minmax(0,1fr)]">
                  <img src={image} alt="" className="h-24 w-full rounded-xl object-cover" />
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-white">Immagine {index + 1}</p>
                        <p className="truncate text-xs text-white/45">
                          {index === 0 ? "Cover corrente" : "Immagine secondaria"}
                        </p>
                      </div>
                      {index === 0 ? (
                        <span className="rounded-full bg-[#e3f503] px-3 py-1 text-[11px] font-medium uppercase tracking-[0.16em] text-black">
                          Cover
                        </span>
                      ) : null}
                    </div>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {index !== 0 ? (
                        <button type="button" onClick={() => onMakePrimary(image)} className="rounded-full border border-white/10 px-3 py-1 text-xs text-white/70">
                          Imposta cover
                        </button>
                      ) : null}
                      <button type="button" onClick={() => onMoveBackward(image)} disabled={disabled || index === 0} className="rounded-full border border-white/10 px-3 py-1 text-xs text-white/70 disabled:cursor-not-allowed disabled:opacity-40">
                        Su
                      </button>
                      <button type="button" onClick={() => onMoveForward(image)} disabled={disabled || index === images.length - 1} className="rounded-full border border-white/10 px-3 py-1 text-xs text-white/70 disabled:cursor-not-allowed disabled:opacity-40">
                        Giu
                      </button>
                      {existingImageUrls.includes(image) ? (
                        <button type="button" onClick={() => onRemoveExisting(image)} disabled={disabled} className="rounded-full border border-white/10 px-3 py-1 text-xs text-white/70 disabled:cursor-not-allowed disabled:opacity-40">
                          Rimuovi
                        </button>
                      ) : null}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : (
        <p className="text-sm text-white/50">Nessuna immagine caricata.</p>
      )}
    </div>
  )
}
