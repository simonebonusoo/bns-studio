import test from "node:test"
import assert from "node:assert/strict"

import { buildAdminOrderCompletedEmail } from "../../src/server/shop/services/order-notifications.mjs"

test("buildAdminOrderCompletedEmail includes business summary and never includes passwords", () => {
  const email = buildAdminOrderCompletedEmail({
    user: {
      username: "simone",
      email: "cliente@example.com",
    },
    order: {
      orderReference: "BNS-ORDER-001",
      email: "cliente@example.com",
      firstName: "Simone",
      lastName: "Rossi",
      addressLine1: "Via Roma 1",
      addressLine2: "",
      city: "Milano",
      postalCode: "20100",
      country: "Italia",
      total: 3900,
      createdAt: "2026-03-28T10:30:00.000Z",
      items: [
        {
          title: "Poster Identity",
          variantLabel: "A3",
          format: "A3",
          quantity: 2,
          lineTotal: 3900,
        },
      ],
    },
  })

  assert.match(email.subject, /Nuovo ordine effettuato da simone/)
  assert.match(email.text, /Pagamento completato/)
  assert.match(email.text, /Poster Identity/)
  assert.match(email.text, /cliente@example.com/)
  assert.doesNotMatch(email.text, /password/i)
  assert.doesNotMatch(email.html, /password/i)
})
