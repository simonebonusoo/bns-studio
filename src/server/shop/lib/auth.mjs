import jwt from "jsonwebtoken"
import { env } from "../config/env.mjs"

export function signToken(user) {
  return jwt.sign(
    {
      sub: user.id,
      email: user.email,
      role: user.role,
    },
    env.jwtSecret,
    { expiresIn: "7d" }
  )
}

export function verifyToken(token) {
  return jwt.verify(token, env.jwtSecret)
}
