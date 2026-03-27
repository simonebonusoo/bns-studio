import app from "./app.mjs"
import { env } from "./config/env.mjs"
import { logPersistenceStatus } from "./lib/persistence-status.mjs"
import { syncAllProductMirrors } from "./lib/product-mirror.mjs"

const host = "0.0.0.0"

app.listen(env.port, host, () => {
  console.log(`Shop API running on http://localhost:${env.port}`)
  logPersistenceStatus()
  syncAllProductMirrors().catch((error) => {
    console.error("[product-mirror] Sync iniziale fallita")
    console.error(error)
  })
})
