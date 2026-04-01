import { PrismaClient } from "@prisma/client"
import bcrypt from "bcryptjs"
import assert from "node:assert/strict"
import { spawn } from "node:child_process"
import { once } from "node:events"
import fs from "node:fs/promises"
import { IncomingMessage, ServerResponse } from "node:http"
import os from "node:os"
import path from "node:path"
import { Duplex } from "node:stream"
import { pathToFileURL } from "node:url"

const prisma = new PrismaClient()
const repoRoot = process.cwd()
const runId = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
const monitoringDir = path.join(os.tmpdir(), `bns-shop-security-${runId}`)
const authCookieName = process.env.AUTH_COOKIE_NAME || "bns_shop_session"
const sharedPassword = "Str0ngPass!123"
const baseUsers = {
  admin: {
    email: `security-admin-${runId}@example.test`,
    username: `security_admin_${runId}`.slice(0, 32),
    firstName: "Security",
    lastName: "Admin",
    role: "admin",
  },
  userA: {
    email: `security-a-${runId}@example.test`,
    username: `security_a_${runId}`.slice(0, 32),
    firstName: "Security",
    lastName: "UserA",
    role: "customer",
  },
  userB: {
    email: `security-b-${runId}@example.test`,
    username: `security_b_${runId}`.slice(0, 32),
    firstName: "Security",
    lastName: "UserB",
    role: "customer",
  },
}

const results = []

function pushResult(name, status, details = {}) {
  results.push({ name, outcome: status, ...details })
}

class MockSocket extends Duplex {
  constructor(remoteAddress = "127.0.0.1") {
    super()
    this.remoteAddress = remoteAddress
  }

  _read() {}

  _write(_chunk, _encoding, callback) {
    callback()
  }

  setTimeout() {}

  setNoDelay() {}

  setKeepAlive() {}

  destroySoon() {
    this.end()
  }
}

function normalizeHeaders(headers = {}) {
  return Object.fromEntries(
    Object.entries(headers).map(([key, value]) => [key.toLowerCase(), String(value)]),
  )
}

function getSetCookieHeaders(headers) {
  const setCookie = headers["set-cookie"]
  if (!setCookie) return []
  return Array.isArray(setCookie) ? setCookie : [setCookie]
}

function parseCookieHeader(setCookieValue) {
  const [pair] = String(setCookieValue || "").split(";")
  return pair || ""
}

async function performRequest(app, { method = "GET", pathname = "/", headers = {}, body = "", remoteAddress = "127.0.0.1" }) {
  const socket = new MockSocket(remoteAddress)
  const req = new IncomingMessage(socket)
  const normalizedHeaders = normalizeHeaders(headers)
  const payloadBuffer = body ? Buffer.from(body) : null

  req.method = method.toUpperCase()
  req.url = pathname
  req.headers = {
    host: "localhost",
    ...normalizedHeaders,
  }
  req.connection = socket
  req.socket = socket
  req.httpVersion = "1.1"

  if (payloadBuffer && !req.headers["content-length"]) {
    req.headers["content-length"] = String(payloadBuffer.length)
  }

  const res = new ServerResponse(req)
  const chunks = []
  const originalWrite = res.write.bind(res)
  const originalEnd = res.end.bind(res)
  let resolved = false
  let resolveCompleted = () => {}
  const completed = new Promise((resolve) => {
    resolveCompleted = () => {
      if (resolved) return
      resolved = true
      resolve()
    }
  })

  res.write = (chunk, encoding, callback) => {
    if (chunk) {
      chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk, typeof encoding === "string" ? encoding : undefined))
    }
    return originalWrite(chunk, encoding, callback)
  }

  res.end = (chunk, encoding, callback) => {
    if (chunk) {
      chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk, typeof encoding === "string" ? encoding : undefined))
    }
    const returnValue = originalEnd(chunk, encoding, callback)
    resolveCompleted()
    return returnValue
  }

  res.assignSocket(socket)
  app.handle(req, res)
  if (payloadBuffer) {
    req.push(payloadBuffer)
  }
  req.push(null)
  await completed
  res.detachSocket(socket)

  const text = Buffer.concat(chunks).toString("utf8")
  let json = null
  try {
    json = text ? JSON.parse(text) : null
  } catch {
    json = null
  }

  return {
    status: res.statusCode,
    headers: res.getHeaders(),
    text,
    json,
  }
}

class CookieClient {
  constructor(app, defaultHeaders = {}) {
    this.app = app
    this.defaultHeaders = defaultHeaders
    this.cookies = new Map()
  }

  setRawCookie(headerValue) {
    const pair = parseCookieHeader(headerValue)
    if (!pair) return
    const separatorIndex = pair.indexOf("=")
    if (separatorIndex <= 0) return
    const key = pair.slice(0, separatorIndex)
    const value = pair.slice(separatorIndex + 1)
    this.cookies.set(key, value)
  }

  syncFromResponse(result) {
    for (const headerValue of getSetCookieHeaders(result.headers)) {
      this.setRawCookie(headerValue)
    }
  }

  get cookieHeader() {
    return Array.from(this.cookies.entries())
      .map(([key, value]) => `${key}=${value}`)
      .join("; ")
  }

  async request(pathname, options = {}) {
    const headers = { ...this.defaultHeaders, ...(options.headers || {}) }
    if (this.cookies.size) {
      headers.cookie = this.cookieHeader
    }
    const result = await performRequest(this.app, {
      method: options.method || "GET",
      pathname,
      headers,
      body: options.body || "",
      remoteAddress: options.remoteAddress,
    })
    this.syncFromResponse(result)
    return result
  }
}

async function createTestUsers() {
  const passwordHash = await bcrypt.hash(sharedPassword, 10)

  for (const user of Object.values(baseUsers)) {
    await prisma.user.create({
      data: {
        ...user,
        passwordHash,
        shippingCountry: "Italia",
        shippingRegion: "MI",
        shippingCity: "Milano",
        shippingAddressLine1: "Via Roma",
        shippingStreetNumber: "10",
        shippingPostalCode: "20100",
      },
    })
  }
}

async function cleanupTestUsers() {
  const emails = Object.values(baseUsers).map((user) => user.email)
  const users = await prisma.user.findMany({
    where: { email: { in: emails } },
    select: { id: true },
  })
  const userIds = users.map((user) => user.id)
  if (!userIds.length) return

  await prisma.review.deleteMany({ where: { userId: { in: userIds } } })
  await prisma.checkoutSession.deleteMany({ where: { userId: { in: userIds } } })
  await prisma.order.deleteMany({ where: { userId: { in: userIds } } })
  await prisma.backInStockSubscription.deleteMany({ where: { userId: { in: userIds } } })
  await prisma.user.deleteMany({ where: { id: { in: userIds } } })
}

async function loadAppFor(nodeEnv) {
  process.env.PORT = "4000"
  process.env.NODE_ENV = nodeEnv
  process.env.JWT_SECRET = process.env.JWT_SECRET || "security-test-secret"
  process.env.CLIENT_URL = "http://localhost:5173"
  process.env.CLIENT_ORIGINS = "http://localhost:5173"
  process.env.MONITORING_DIR = monitoringDir
  process.env.AUTH_COOKIE_NAME = authCookieName
  process.env.SHOP_ENABLE_SECURITY_TEST_ROUTES = "true"

  const appModuleUrl = pathToFileURL(path.join(repoRoot, "src/server/shop/app.mjs")).href
  const { default: app } = await import(`${appModuleUrl}?env=${nodeEnv}&ts=${Date.now()}`)
  return app
}

async function runDevelopmentAudit() {
  const app = await loadAppFor("development")
  const anon = new CookieClient(app, { "user-agent": "security-anon-client", "accept-language": "it-IT" })
  const customer = new CookieClient(app, { "user-agent": "security-customer-client", "accept-language": "it-IT" })
  const admin = new CookieClient(app, { "user-agent": "security-admin-client", "accept-language": "it-IT" })
  const attacker = new CookieClient(app, { "user-agent": "security-attacker-client", "accept-language": "en-US" })
  const userB = new CookieClient(app, { "user-agent": "security-user-b-client", "accept-language": "it-IT" })

  const customerLogin = await customer.request("/api/auth/login", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ identifier: baseUsers.userA.email, password: sharedPassword }),
  })
  assert.equal(customerLogin.status, 200)
  const customerCookie = getSetCookieHeaders(customerLogin.headers)[0] || ""
  assert.match(customerCookie, /HttpOnly/i)
  assert.match(customerCookie, /SameSite=/i)
  pushResult("customer_login_success", "passed", { status: customerLogin.status })
  pushResult("cookie_flags_dev", "passed", { setCookie: customerCookie })

  const adminLogin = await admin.request("/api/auth/login", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ identifier: baseUsers.admin.email, password: sharedPassword }),
  })
  assert.equal(adminLogin.status, 200)
  pushResult("admin_login_success", "passed", { status: adminLogin.status })

  const unauthenticatedMe = await anon.request("/api/auth/me")
  assert.equal(unauthenticatedMe.status, 401)
  pushResult("missing_cookie_denied", "passed", { status: unauthenticatedMe.status })

  attacker.setRawCookie(`${authCookieName}=tampered.invalid.value`)
  const tamperedMe = await attacker.request("/api/auth/me")
  assert.equal(tamperedMe.status, 401)
  pushResult("tampered_cookie_denied", "passed", { status: tamperedMe.status })

  const hijackReplay = new CookieClient(app, { "user-agent": "security-attacker-client", "accept-language": "en-US" })
  hijackReplay.setRawCookie(customerCookie)
  const hijackResult = await hijackReplay.request("/api/auth/me")
  pushResult("session_replay_with_stolen_cookie", hijackResult.status === 200 ? "failed" : "passed", {
    status: hijackResult.status,
    note: "A copied valid session cookie was replayed from a second client.",
  })

  const sqlInjectionAttempt = await anon.request("/api/auth/login", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-forwarded-for": "203.0.113.10",
    },
    body: JSON.stringify({ identifier: "' OR 1=1 --", password: sharedPassword }),
    remoteAddress: "203.0.113.10",
  })
  assert.equal(sqlInjectionAttempt.status, 401)
  assert.equal(sqlInjectionAttempt.json?.message, "Credenziali non valide")
  pushResult("sql_injection_login_attempt", "passed", { status: sqlInjectionAttempt.status })

  const nonexistentLogin = await anon.request("/api/auth/login", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-forwarded-for": "203.0.113.11",
    },
    body: JSON.stringify({ identifier: "missing@example.test", password: sharedPassword }),
    remoteAddress: "203.0.113.11",
  })
  assert.equal(nonexistentLogin.status, 401)
  assert.equal(nonexistentLogin.json?.message, "Credenziali non valide")
  pushResult("nonexistent_email_login", "passed", {
    status: nonexistentLogin.status,
    message: nonexistentLogin.json?.message,
  })

  const crossOriginLogin = await anon.request("/api/auth/login", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      origin: "https://evil.example",
    },
    body: JSON.stringify({ identifier: baseUsers.userA.email, password: sharedPassword }),
  })
  assert.equal(crossOriginLogin.status, 403)
  pushResult("csrf_origin_guard", "passed", { status: crossOriginLogin.status })

  const publicProducts = await performRequest(app, { pathname: "/api/store/products?pageSize=1" })
  const firstProduct = publicProducts.json?.items?.[0]
  assert.ok(firstProduct?.id, "Missing public product for checkout test")

  const checkoutResponse = await customer.request("/api/orders/checkout", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      origin: "http://localhost:5173",
    },
    body: JSON.stringify({
      email: baseUsers.userA.email,
      firstName: "Security",
      lastName: "UserA",
      phone: "+39000000000",
      region: "MI",
      addressLine1: "Via Roma",
      streetNumber: "10",
      addressLine2: "",
      staircase: "",
      apartment: "",
      floor: "",
      intercom: "",
      deliveryNotes: "",
      city: "Milano",
      postalCode: "20100",
      country: "Italia",
      shippingMethod: "economy",
      items: [{ productId: firstProduct.id, quantity: 1, format: "A4" }],
    }),
  })
  assert.equal(checkoutResponse.status, 201)
  const orderReference = checkoutResponse.json?.order?.orderReference
  assert.ok(orderReference)
  pushResult("checkout_session_created", "passed", { orderReference })

  const userBLogin = await userB.request("/api/auth/login", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ identifier: baseUsers.userB.email, password: sharedPassword }),
  })
  assert.equal(userBLogin.status, 200)

  const otherReceiptAttempt = await userB.request(`/api/orders/receipt/${orderReference}`)
  assert.equal(otherReceiptAttempt.status, 403)
  pushResult("order_isolation_between_users", "passed", { status: otherReceiptAttempt.status })

  const userBMe = await userB.request("/api/auth/me")
  assert.equal(userBMe.status, 200)
  assert.equal(userBMe.json?.user?.email, baseUsers.userB.email)
  pushResult("profile_me_scoped_to_authenticated_user", "passed", { email: userBMe.json?.user?.email })

  const adminOrdersForbidden = await customer.request("/api/admin/orders")
  assert.equal(adminOrdersForbidden.status, 403)
  const adminProductsPostForbidden = await customer.request("/api/admin/products", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      origin: "http://localhost:5173",
    },
    body: JSON.stringify({}),
  })
  assert.equal(adminProductsPostForbidden.status, 403)
  const adminProductDeleteForbidden = await customer.request("/api/admin/products/1", {
    method: "DELETE",
    headers: { origin: "http://localhost:5173" },
  })
  assert.equal(adminProductDeleteForbidden.status, 403)
  pushResult("admin_routes_block_customer", "passed", {
    statuses: [adminOrdersForbidden.status, adminProductsPostForbidden.status, adminProductDeleteForbidden.status],
  })

  const reviewXssAttempt = await customer.request("/api/reviews", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      origin: "http://localhost:5173",
    },
    body: JSON.stringify({
      rating: 5,
      title: "<script>alert(1)</script> Poster stupendo",
      body: "<script>alert(1)</script> Questo poster e bellissimo, davvero curato, ben stampato e arrivato rapidamente senza problemi di qualità o imballaggio.",
      tag: "Poster arrivato",
    }),
  })
  assert.equal(reviewXssAttempt.status, 201)
  assert.doesNotMatch(reviewXssAttempt.json?.review?.title || "", /<script>/i)
  assert.doesNotMatch(reviewXssAttempt.json?.review?.body || "", /<script>/i)
  pushResult("xss_payload_sanitized", "passed", { title: reviewXssAttempt.json?.review?.title })

  const profileUpdate = await customer.request("/api/auth/profile", {
    method: "PATCH",
    headers: {
      "content-type": "application/json",
      origin: "http://localhost:5173",
    },
    body: JSON.stringify({ firstName: "Security Updated" }),
  })
  assert.equal(profileUpdate.status, 200)
  pushResult("profile_update_success", "passed", { status: profileUpdate.status })

  const internalError = await performRequest(app, { pathname: "/api/__security/boom" })
  assert.equal(internalError.status, 500)
  assert.equal(internalError.json?.message, "Errore interno del server")
  assert.ok(!/stack|security_test_boom/i.test(JSON.stringify(internalError.json)))
  pushResult("generic_500_error_response", "passed", { status: internalError.status })

  const bruteForceStatuses = []
  for (let attempt = 0; attempt < 20; attempt += 1) {
    const bruteForce = await anon.request("/api/auth/login", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-forwarded-for": "198.51.100.99",
      },
      body: JSON.stringify({ identifier: baseUsers.userA.email, password: "wrong-password" }),
      remoteAddress: "198.51.100.99",
    })
    bruteForceStatuses.push(bruteForce.status)
  }
  assert.ok(bruteForceStatuses.includes(429))
  pushResult("auth_rate_limiting_bruteforce", "passed", { statuses: bruteForceStatuses })

  const logFiles = (await fs.readdir(monitoringDir)).filter((entry) => entry.endsWith(".jsonl"))
  assert.ok(logFiles.length > 0, "No monitoring log file generated")
  const logContent = await fs.readFile(path.join(monitoringDir, logFiles[0]), "utf8")
  assert.match(logContent, /auth_login_failed/)
  assert.match(logContent, /auth_login_success/)
  assert.match(logContent, /admin_access_denied/)
  assert.match(logContent, /profile_updated/)
  assert.doesNotMatch(logContent, /Str0ngPass!123|tampered\.invalid\.value|bns_shop_session=/)
  pushResult("security_logs_written_without_secrets", "passed", { file: logFiles[0] })
}

async function runProductionCookieAudit() {
  const appUrl = pathToFileURL(path.join(repoRoot, "src/server/shop/app.mjs")).href
  const inlineScript = `
    import { IncomingMessage, ServerResponse } from "node:http"
    import { Duplex } from "node:stream"
    class MockSocket extends Duplex {
      constructor(remoteAddress = "127.0.0.1") { super(); this.remoteAddress = remoteAddress }
      _read() {}
      _write(_chunk, _encoding, callback) { callback() }
      setTimeout() {}
      setNoDelay() {}
      setKeepAlive() {}
      destroySoon() { this.end() }
    }
    function normalizeHeaders(headers = {}) {
      return Object.fromEntries(Object.entries(headers).map(([key, value]) => [key.toLowerCase(), String(value)]))
    }
    async function performRequest(app, { method = "GET", pathname = "/", headers = {}, body = "" }) {
      const socket = new MockSocket()
      const req = new IncomingMessage(socket)
      const normalizedHeaders = normalizeHeaders(headers)
      const payloadBuffer = body ? Buffer.from(body) : null
      req.method = method.toUpperCase()
      req.url = pathname
      req.headers = { host: "localhost", ...normalizedHeaders }
      req.connection = socket
      req.socket = socket
      if (payloadBuffer && !req.headers["content-length"]) {
        req.headers["content-length"] = String(payloadBuffer.length)
      }
      const res = new ServerResponse(req)
      let resolved = false
      let resolveCompleted = () => {}
      const completed = new Promise((resolve) => {
        resolveCompleted = () => {
          if (resolved) return
          resolved = true
          resolve()
        }
      })
      const originalEnd = res.end.bind(res)
      res.end = (chunk, encoding, callback) => {
        const returnValue = originalEnd(chunk, encoding, callback)
        resolveCompleted()
        return returnValue
      }
      res.assignSocket(socket)
      app.handle(req, res)
      if (payloadBuffer) req.push(payloadBuffer)
      req.push(null)
      await completed
      res.detachSocket(socket)
      return { status: res.statusCode, headers: res.getHeaders() }
    }
    process.env.PORT = "4000"
    process.env.NODE_ENV = "production"
    process.env.JWT_SECRET = ${JSON.stringify(process.env.JWT_SECRET || "security-test-secret")}
    process.env.CLIENT_URL = "http://localhost:5173"
    process.env.CLIENT_ORIGINS = "http://localhost:5173"
    process.env.MONITORING_DIR = ${JSON.stringify(monitoringDir)}
    process.env.AUTH_COOKIE_NAME = ${JSON.stringify(authCookieName)}
    const { default: app } = await import(${JSON.stringify(`${appUrl}?prod=1&ts=`)} + Date.now())
    const response = await performRequest(app, {
      method: "POST",
      pathname: "/api/auth/login",
      headers: {
        "content-type": "application/json",
        origin: "http://localhost:5173",
      },
      body: JSON.stringify({
        identifier: ${JSON.stringify(baseUsers.userA.email)},
        password: ${JSON.stringify(sharedPassword)},
      }),
    })
    const setCookie = Array.isArray(response.headers["set-cookie"]) ? response.headers["set-cookie"][0] : response.headers["set-cookie"] || ""
    console.log(JSON.stringify({ status: response.status, setCookie }))
  `

  const child = spawn(process.execPath, ["--input-type=module", "--eval", inlineScript], {
    cwd: repoRoot,
    env: { ...process.env },
    stdio: ["ignore", "pipe", "pipe"],
  })

  let stdout = ""
  let stderr = ""
  child.stdout.on("data", (chunk) => {
    stdout += chunk.toString()
  })
  child.stderr.on("data", (chunk) => {
    stderr += chunk.toString()
  })

  const [exitCode] = await once(child, "exit")
  if (exitCode !== 0) {
    throw new Error(`Production cookie audit failed: ${stderr || stdout}`)
  }

  const payload = JSON.parse(stdout.trim().split("\n").pop())
  assert.equal(payload.status, 200)
  assert.match(payload.setCookie, /HttpOnly/i)
  assert.match(payload.setCookie, /Secure/i)
  assert.match(payload.setCookie, /SameSite=/i)
  pushResult("cookie_flags_production", "passed", { setCookie: payload.setCookie })
}

async function main() {
  await fs.mkdir(monitoringDir, { recursive: true })
  await cleanupTestUsers()
  await createTestUsers()

  let exitCode = 0
  try {
    await runDevelopmentAudit()
    await runProductionCookieAudit()
  } catch (error) {
    exitCode = 1
    pushResult("unexpected_failure", "failed", {
      error: error instanceof Error ? `${error.message}\n${error.stack || ""}` : String(error),
    })
  } finally {
    await cleanupTestUsers()
    await prisma.$disconnect()
  }

  const summary = {
    runId,
    monitoringDir,
    passed: results.filter((entry) => entry.outcome === "passed").length,
    failed: results.filter((entry) => entry.outcome === "failed").length,
    results,
  }

  console.log(JSON.stringify(summary, null, 2))
  process.exitCode = exitCode
}

await main()
