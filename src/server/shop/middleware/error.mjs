import { reportError } from "../lib/monitoring.mjs"

export function errorHandler(error, _req, res, _next) {
  reportError(error, {
    event: "api_request_failed",
    method: _req.method,
    path: _req.originalUrl || _req.url,
    userId: _req.user?.id || null,
    role: _req.user?.role || null,
  })

  if (error instanceof SyntaxError && "body" in error) {
    return res.status(400).json({
      message: "JSON non valido nella richiesta",
      details: null,
    })
  }

  if (error?.name === "ZodError") {
    return res.status(400).json({
      message: "I dati inviati non sono validi",
      details: error.issues || null,
    })
  }

  if (error?.code === "P2002") {
    return res.status(409).json({
      message: "Esiste già un elemento con questo valore",
      details: null,
    })
  }

  const status = error.status || 500
  const isExpected = Boolean(error?.status)

  res.status(status).json({
    message: isExpected || status < 500 ? error.message || "Operazione non riuscita" : "Errore interno del server",
    details: error.details || null,
  })
}
