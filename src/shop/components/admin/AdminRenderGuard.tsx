import { Component, type ErrorInfo, type ReactNode } from "react"

type AdminRenderGuardProps = {
  title?: string
  children: ReactNode
}

type AdminRenderGuardState = {
  hasError: boolean
}

export class AdminRenderGuard extends Component<AdminRenderGuardProps, AdminRenderGuardState> {
  state: AdminRenderGuardState = {
    hasError: false,
  }

  static getDerivedStateFromError() {
    return { hasError: true }
  }

  componentDidCatch(error: unknown, info: ErrorInfo) {
    console.error("[AdminRenderGuard]", error, info)
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="shop-card h-full space-y-3 p-6">
          <p className="text-xs uppercase tracking-[0.32em] text-white/45">
            {this.props.title || "Errore sezione"}
          </p>
          <h2 className="text-xl font-semibold text-white">Impossibile aprire il form prodotto.</h2>
          <p className="text-sm leading-6 text-white/60">
            Il resto della pagina admin resta disponibile. Ricarica il prodotto o aggiorna la pagina per riprovare.
          </p>
        </div>
      )
    }

    return this.props.children
  }
}
