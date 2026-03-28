import { env } from "../config/env.mjs"
import { HttpError } from "../lib/http.mjs"

export async function sendEmail({ to, subject, text, html }) {
  if (!env.resendApiKey || !env.notificationEmailFrom) {
    return {
      sent: false,
      provider: "resend",
      skipped: true,
      reason: "missing_email_configuration",
    }
  }

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${env.resendApiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: env.notificationEmailFrom,
      to: Array.isArray(to) ? to : [to],
      subject,
      text,
      html,
    }),
  })

  if (!response.ok) {
    const errorBody = await response.text().catch(() => "")
    throw new HttpError(502, `Invio email fallito: ${errorBody || response.statusText}`)
  }

  const payload = await response.json().catch(() => ({}))
  return {
    sent: true,
    provider: "resend",
    payload,
  }
}
