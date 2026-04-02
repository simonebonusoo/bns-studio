import { getButtonClassName, getDangerButtonClassName } from "../../../components/Button"

type ConfirmActionModalProps = {
  open: boolean
  title?: string
  description: string
  confirmLabel?: string
  cancelLabel?: string
  loading?: boolean
  loadingLabel?: string
  confirmVariant?: "danger" | "cart"
  onCancel: () => void
  onConfirm: () => void | Promise<void>
}

export function ConfirmActionModal({
  open,
  title = "Conferma eliminazione",
  description,
  confirmLabel = "Elimina",
  cancelLabel = "Annulla",
  loading = false,
  loadingLabel = "Eliminazione...",
  confirmVariant = "danger",
  onCancel,
  onConfirm,
}: ConfirmActionModalProps) {
  if (!open) return null

  return (
    <div className="fixed inset-0 z-[90] flex items-center justify-center bg-black/60 px-4 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-[28px] border border-white/10 bg-[#0b0b0c]/96 p-6 shadow-[0_30px_90px_rgba(0,0,0,.45)]">
        <p className="text-xs uppercase tracking-[0.2em] text-white/42">Conferma</p>
        <h3 className="mt-3 text-2xl font-semibold text-white">{title}</h3>
        <p className="mt-3 text-sm leading-7 text-white/65">{description}</p>
        <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <button type="button" onClick={onCancel} className={getButtonClassName({ variant: "profile", size: "sm" })}>
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={() => void onConfirm()}
            className={
              confirmVariant === "cart"
                ? getButtonClassName({ variant: "cart", size: "sm" })
                : getDangerButtonClassName({ size: "sm" })
            }
            disabled={loading}
          >
            {loading ? loadingLabel : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  )
}
