import test from "node:test"
import assert from "node:assert/strict"
import fs from "node:fs"
import path from "node:path"

const root = process.cwd()

function read(file) {
  return fs.readFileSync(path.join(root, file), "utf8")
}

test("bootstrap logging redacts DATABASE_URL instead of printing the full runtime connection string", () => {
  const source = read("scripts/bootstrap-shop-server.mjs")
  assert.match(source, /function redactDatabaseUrl/)
  assert.match(source, /DATABASE_URL=\$\{redactDatabaseUrl\(databaseUrl\)\}/)
})

test("monitoring omits stack traces in production and packlink logs redact sensitive payloads", () => {
  const monitoring = read("src/server/shop/lib/monitoring.mjs")
  const packlink = read("src/server/shop/shipping/providers/packlink.mjs")
  const notifications = read("src/server/shop/services/order-notifications.mjs")

  assert.match(monitoring, /env\.nodeEnv === "production" \? null : error\.stack \|\| null/)
  assert.match(packlink, /function redactPacklinkLogDetails/)
  assert.match(packlink, /redacted\.payload = "\[redacted\]"/)
  assert.match(packlink, /redacted\.destinationZip = "\[redacted\]"/)
  assert.match(packlink, /redacted\.trackingNumber = "\[redacted\]"/)
  assert.match(notifications, /recipientConfigured: Boolean\(email\.to\)/)
  assert.doesNotMatch(notifications, /recipient: email\.to/)
})
