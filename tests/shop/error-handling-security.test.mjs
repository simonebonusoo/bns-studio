import test from "node:test"
import assert from "node:assert/strict"

import { errorHandler } from "../../src/server/shop/middleware/error.mjs"
import { HttpError } from "../../src/server/shop/lib/http.mjs"

function createMockResponse() {
  return {
    statusCode: 200,
    payload: null,
    status(code) {
      this.statusCode = code
      return this
    },
    json(value) {
      this.payload = value
      return this
    },
  }
}

test("500 errors return a generic message without stack traces, tokens or internal paths", () => {
  const req = {
    method: "GET",
    originalUrl: "/api/test",
    url: "/api/test",
    user: null,
  }
  const res = createMockResponse()
  const error = new Error("DB failed at /srv/app with token abc123")
  error.stack = "Error: DB failed\n    at /srv/app/server.mjs:10:2"

  errorHandler(error, req, res, () => {})

  assert.equal(res.statusCode, 500)
  assert.equal(res.payload.message, "Errore interno del server")
  assert.equal(res.payload.details, null)
  assert.doesNotMatch(JSON.stringify(res.payload), /abc123|server\.mjs|stack|\/srv\/app/i)
})

test("application errors keep explicit messages while avoiding stack serialization in the response", () => {
  const req = {
    method: "PATCH",
    originalUrl: "/api/auth/profile",
    url: "/api/auth/profile",
    user: { id: 7, role: "customer" },
  }
  const res = createMockResponse()
  const error = new HttpError(401, "Password non corretta")

  errorHandler(error, req, res, () => {})

  assert.equal(res.statusCode, 401)
  assert.equal(res.payload.message, "Password non corretta")
  assert.equal(res.payload.details, null)
  assert.doesNotMatch(JSON.stringify(res.payload), /stack|passwordHash|token/i)
})
