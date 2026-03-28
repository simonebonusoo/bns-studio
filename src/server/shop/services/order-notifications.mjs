import { env } from "../config/env.mjs"
import { logInfo, logWarning, reportError } from "../lib/monitoring.mjs"
import { sendEmail } from "./email.mjs"

function formatCurrency(cents) {
  return new Intl.NumberFormat("it-IT", {
    style: "currency",
    currency: "EUR",
  }).format((Number(cents) || 0) / 100)
}

export function buildAdminOrderCompletedEmail({ order, user }) {
  const customerLabel =
    user?.username ||
    [order.firstName, order.lastName].filter(Boolean).join(" ").trim() ||
    order.email

  const orderDate = new Date(order.createdAt)
  const formattedDate = orderDate.toLocaleDateString("it-IT")
  const formattedTime = orderDate.toLocaleTimeString("it-IT", {
    hour: "2-digit",
    minute: "2-digit",
  })

  const itemsText = order.items
    .map(
      (item) =>
        `- ${item.title}${item.variantLabel || item.format ? ` / ${item.variantLabel || item.format}` : ""} · qty ${item.quantity} · ${formatCurrency(item.lineTotal)}`
    )
    .join("\n")

  const subject = `Nuovo ordine effettuato da ${customerLabel}`
  const text = [
    "Pagamento completato.",
    "",
    `Ordine: ${order.orderReference}`,
    `Cliente: ${customerLabel}`,
    `Email cliente: ${order.email}`,
    `Data: ${formattedDate}`,
    `Ora: ${formattedTime}`,
    `Totale: ${formatCurrency(order.total)}`,
    "",
    "Prodotti ordinati:",
    itemsText,
    "",
    "Spedizione:",
    `${order.firstName} ${order.lastName}`,
    order.addressLine1,
    order.addressLine2,
    `${order.postalCode} ${order.city}`,
    order.country,
    "",
    "Pagamento completato: si",
  ]
    .filter(Boolean)
    .join("\n")

  const html = `
    <div style="font-family:Arial,sans-serif;line-height:1.5;color:#111">
      <h2>Nuovo ordine completato</h2>
      <p><strong>Ordine:</strong> ${order.orderReference}</p>
      <p><strong>Cliente:</strong> ${customerLabel}<br />
      <strong>Email:</strong> ${order.email}<br />
      <strong>Data:</strong> ${formattedDate}<br />
      <strong>Ora:</strong> ${formattedTime}<br />
      <strong>Totale:</strong> ${formatCurrency(order.total)}</p>
      <h3>Prodotti</h3>
      <ul>
        ${order.items
          .map(
            (item) =>
              `<li>${item.title}${item.variantLabel || item.format ? ` / ${item.variantLabel || item.format}` : ""} · qty ${item.quantity} · ${formatCurrency(item.lineTotal)}</li>`
          )
          .join("")}
      </ul>
      <h3>Spedizione</h3>
      <p>
        ${order.firstName} ${order.lastName}<br />
        ${order.addressLine1}<br />
        ${order.addressLine2 ? `${order.addressLine2}<br />` : ""}
        ${order.postalCode} ${order.city}<br />
        ${order.country}
      </p>
      <p><strong>Pagamento completato:</strong> si</p>
    </div>
  `

  return {
    to: env.adminNotificationEmail,
    subject,
    text,
    html,
  }
}

export async function notifyAdminOrderCompleted({ order, user }) {
  const email = buildAdminOrderCompletedEmail({ order, user })

  try {
    const result = await sendEmail(email)
    if (result.sent) {
      logInfo("admin_order_completed_email_sent", {
        orderReference: order.orderReference,
        recipient: email.to,
      })
    } else {
      logWarning("admin_order_completed_email_skipped", {
        orderReference: order.orderReference,
        recipient: email.to,
        reason: result.reason,
      })
    }
    return result
  } catch (error) {
    reportError(error, {
      event: "admin_order_completed_email_failed",
      orderReference: order.orderReference,
      recipient: email.to,
    })
    return {
      sent: false,
      error: error instanceof Error ? error.message : String(error),
    }
  }
}
