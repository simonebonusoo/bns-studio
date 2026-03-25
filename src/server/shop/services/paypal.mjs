import { prisma } from "../lib/prisma.mjs"
import { env } from "../config/env.mjs"
import { HttpError } from "../lib/http.mjs"

function money(cents) {
  return (cents / 100).toFixed(2)
}

function appendAmountToPaypalMe(link, amount, currencyCode) {
  const sanitized = link.endsWith("/") ? link.slice(0, -1) : link
  return `${sanitized}/${money(amount)}${currencyCode}`
}

function isValidPaypalMeLink(value) {
  return typeof value === "string" && /^https:\/\/(www\.)?paypal\.me\/.+/i.test(value) && !/yourbrand/i.test(value)
}

export async function buildPaypalRedirect({ orderReference, total, clientUrl }) {
  const settings = await prisma.setting.findMany({
    where: {
      key: { in: ["paypalMeLink", "paypalBusinessEmail", "currencyCode", "storeName"] },
    },
  })

  const get = (key, fallback = "") => settings.find((entry) => entry.key === key)?.value || fallback
  const paypalMeLink = get("paypalMeLink", env.paypalMeLink)
  const businessEmail = get("paypalBusinessEmail", env.paypalBusinessEmail)
  const currencyCode = get("currencyCode", env.paypalCurrencyCode || "EUR")
  const storeName = get("storeName", env.paypalStoreName || "BNS Studio Shop")

  console.log(
    `[shop] paypal config businessEmail=${businessEmail ? "present" : "missing"} paypalMeLink=${
      isValidPaypalMeLink(paypalMeLink) ? "present" : "missing"
    } currency=${currencyCode}`
  )

  if (!Number.isFinite(total) || total <= 0) {
    throw new HttpError(400, "Totale ordine non valido per il pagamento PayPal")
  }

  if (businessEmail) {
    const redirect = new URL("https://www.paypal.com/cgi-bin/webscr")
    redirect.searchParams.set("cmd", "_xclick")
    redirect.searchParams.set("business", businessEmail)
    redirect.searchParams.set("currency_code", currencyCode)
    redirect.searchParams.set("amount", money(total))
    redirect.searchParams.set("item_name", `${storeName} ordine ${orderReference}`)
    redirect.searchParams.set("invoice", orderReference)
    redirect.searchParams.set("custom", orderReference)
    redirect.searchParams.set("return", `${clientUrl}/shop/paypal-return?orderRef=${encodeURIComponent(orderReference)}`)
    redirect.searchParams.set("cancel_return", `${clientUrl}/shop/orders/${encodeURIComponent(orderReference)}?payment=cancelled`)

    return {
      redirectUrl: redirect.toString(),
      mode: "paypal_standard",
      currencyCode,
    }
  }

  if (isValidPaypalMeLink(paypalMeLink)) {
    return {
      redirectUrl: appendAmountToPaypalMe(paypalMeLink, total, currencyCode),
      mode: "paypal_me",
      currencyCode,
    }
  }

  throw new HttpError(503, "Configurazione PayPal mancante nel progetto integrato")
}
