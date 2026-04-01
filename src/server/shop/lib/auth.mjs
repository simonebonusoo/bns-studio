import crypto from "node:crypto"
import jwt from "jsonwebtoken"
import { env } from "../config/env.mjs"

const AUTH_COOKIE_MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000

function buildSessionFingerprintSource(req) {
  const userAgent = String(req?.headers?.["user-agent"] || "").trim().toLowerCase()
  const acceptLanguage = String(req?.headers?.["accept-language"] || "").trim().toLowerCase()
  return `${userAgent || "unknown-client"}|${acceptLanguage || "unknown-language"}`
}

export function hashSessionFingerprint(req) {
  return crypto.createHash("sha256").update(buildSessionFingerprintSource(req)).digest("hex")
}

export function createSessionState(req) {
  return {
    sessionNonce: crypto.randomUUID(),
    sessionFingerprintHash: hashSessionFingerprint(req),
  }
}

export function signToken(user, sessionNonce = user.sessionNonce) {
  return jwt.sign(
    {
      sub: user.id,
      email: user.email,
      role: user.role,
      sid: sessionNonce,
    },
    env.jwtSecret,
    { expiresIn: "7d" }
  )
}

export function verifyToken(token) {
  return jwt.verify(token, env.jwtSecret)
}

export function parseRequestCookies(headerValue = "") {
  return String(headerValue || "")
    .split(";")
    .map((chunk) => chunk.trim())
    .filter(Boolean)
    .reduce((acc, entry) => {
      const separatorIndex = entry.indexOf("=")
      if (separatorIndex <= 0) return acc
      const key = entry.slice(0, separatorIndex).trim()
      const value = entry.slice(separatorIndex + 1).trim()
      acc[key] = decodeURIComponent(value)
      return acc
    }, {})
}

export function getAuthCookieOptions() {
  return {
    httpOnly: true,
    secure: env.authCookieSecure,
    sameSite: env.authCookieSameSite,
    maxAge: AUTH_COOKIE_MAX_AGE_MS,
    path: "/",
  }
}

export function setAuthCookie(res, token) {
  res.cookie(env.authCookieName, token, getAuthCookieOptions())
}

export function clearAuthCookie(res) {
  res.clearCookie(env.authCookieName, {
    httpOnly: true,
    secure: env.authCookieSecure,
    sameSite: env.authCookieSameSite,
    path: "/",
  })
}
