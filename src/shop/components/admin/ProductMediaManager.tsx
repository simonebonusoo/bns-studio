import { Button } from "../../../components/Button"
import { useState } from "react"

type ProductMediaManagerProps = {
  images: string[]
  disabled?: boolean
  onFileChange: (files: FileList | null) => void
  onReorder: (nextImages: string[]) => void
  onRemoveImage: (imageUrl: string) => void
}

export function ProductMediaManager({
  images,
  disabled = false,
  onFileChange,
  onReorder,
  onRemoveImage,
}: ProductMediaManagerProps) {
  const [draggedImage, setDraggedImage] = useState<string | null>(null)

  function reorderImage(targetImage: string) {
    if (!draggedImage || draggedImage === targetImage) return

    const currentIndex = images.indexOf(draggedImage)
    const targetIndex = images.indexOf(targetImage)
    if (currentIndex === -1 || targetIndex === -1) return

    const next = [...images]
    const [moved] = next.splice(currentIndex, 1)
    next.splice(targetIndex, 0, moved)
    onReorder(next)
  }

  return (
    <div className="space-y-4 rounded-2xl border border-white/10 p-4">
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-white">Immagini prodotto</p>
          <p className="mt-1 text-xs text-white/55">La prima immagine della lista verrà usata automaticamente come cover.</p>
        </div>
        <label className={disabled ? "pointer-events-none opacity-45" : ""}>
          <Button type="button" size="sm" text="Carica immagini" className="pointer-events-none">
            Carica immagini
          </Button>
          <input type="file" multiple accept="image/*" className="hidden" disabled={disabled} onChange={(event) => onFileChange(event.target.files)} />
        </label>
      </div>

      {images.length ? (
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {images.map((image, index) => (
            <div
              key={image}
              draggable={!disabled}
              onDragStart={() => setDraggedImage(image)}
              onDragOver={(event) => {
                event.preventDefault()
                if (!disabled) {
                  event.dataTransfer.dropEffect = "move"
                }
              }}
              onDrop={(event) => {
                event.preventDefault()
                if (!disabled) {
                  reorderImage(image)
                }
                setDraggedImage(null)
              }}
              onDragEnd={() => setDraggedImage(null)}
              className={`rounded-2xl border border-white/10 p-3 transition ${draggedImage === image ? "opacity-50" : "opacity-100"}`}
            >
              <div className="overflow-hidden rounded-[18px] border border-white/10 bg-black/10">
                <img src={image} alt="" className="aspect-square w-full object-cover" />
              </div>
              <div className="mt-3 flex items-center justify-between gap-3">
                <div className="text-xs text-white/45">
                  {index === 0 ? "Cover" : "Trascina per riordinare"}
                </div>
                {index === 0 ? (
                  <span className="rounded-full bg-[#e3f503] px-3 py-1 text-[11px] font-medium uppercase tracking-[0.16em] text-black">
                    Cover
                  </span>
                ) : null}
              </div>
              <div className="mt-3 flex justify-end">
                <Button
                  type="button"
                  size="sm"
                  text="Rimuovi"
                  onClick={() => onRemoveImage(image)}
                  disabled={disabled}
                  className="min-w-[110px] justify-center"
                >
                  Rimuovi
                </Button>
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
