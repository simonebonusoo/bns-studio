type ProductMediaManagerProps = {
  images: string[]
  existingImageUrls: string[]
  onFileChange: (files: FileList | null) => void
  onMakePrimary: (imageUrl: string) => void
  onRemoveExisting: (imageUrl: string) => void
}

export function ProductMediaManager({
  images,
  existingImageUrls,
  onFileChange,
  onMakePrimary,
  onRemoveExisting,
}: ProductMediaManagerProps) {
  return (
    <div className="space-y-3 rounded-2xl border border-white/10 p-4">
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-white">Immagini prodotto</p>
          <p className="mt-1 text-xs text-white/55">La cover è sempre la prima immagine dell'array salvato.</p>
        </div>
        <label className="rounded-full border border-white/10 px-4 py-2 text-sm text-white/75 transition hover:border-white/25 hover:text-white">
          Carica immagini
          <input type="file" multiple accept="image/*" className="hidden" onChange={(event) => onFileChange(event.target.files)} />
        </label>
      </div>

      {images.length ? (
        <div className="grid gap-3 sm:grid-cols-2">
          {images.map((image, index) => (
            <div key={image} className="rounded-2xl border border-white/10 p-3">
              <img src={image} alt="" className="aspect-[4/3] w-full rounded-xl object-cover" />
              <div className="mt-3 flex flex-wrap gap-2">
                {index !== 0 ? (
                  <button type="button" onClick={() => onMakePrimary(image)} className="rounded-full border border-white/10 px-3 py-1 text-xs text-white/70">
                    Imposta cover
                  </button>
                ) : (
                  <span className="rounded-full bg-[#e3f503] px-3 py-1 text-xs font-medium text-black">Cover</span>
                )}
                {existingImageUrls.includes(image) ? (
                  <button type="button" onClick={() => onRemoveExisting(image)} className="rounded-full border border-white/10 px-3 py-1 text-xs text-white/70">
                    Rimuovi
                  </button>
                ) : null}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-sm text-white/50">Nessuna immagine caricata.</p>
      )}
    </div>
  )
}
