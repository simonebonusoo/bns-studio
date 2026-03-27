import app from "./app.mjs"
import { env } from "./config/env.mjs"
import { logPersistenceStatus } from "./lib/persistence-status.mjs"

const host = "0.0.0.0"

app.listen(env.port, host, () => {
  console.log(`Shop API running on http://localhost:${env.port}`)
  logPersistenceStatus()
})
