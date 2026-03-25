import { prisma } from "../lib/prisma.js";
import { env } from "../config/env.js";

function money(cents) {
  return (cents / 100).toFixed(2);
}

function appendAmountToPaypalMe(link, amount, currencyCode) {
  const sanitized = link.endsWith("/") ? link.slice(0, -1) : link;
  return `${sanitized}/${money(amount)}${currencyCode}`;
}

export async function buildPaypalRedirect({ orderReference, total }) {
  const settings = await prisma.setting.findMany({
    where: {
      key: { in: ["paypalMeLink", "paypalBusinessEmail", "currencyCode", "storeName"] }
    }
  });

  const get = (key, fallback = "") => settings.find((entry) => entry.key === key)?.value || fallback;
  const paypalMeLink = get("paypalMeLink", env.paypalMeLink);
  const businessEmail = get("paypalBusinessEmail", env.paypalBusinessEmail);
  const currencyCode = get("currencyCode", "EUR");
  const storeName = get("storeName", "bns studio");

  if (businessEmail) {
    const redirect = new URL("https://www.paypal.com/cgi-bin/webscr");
    redirect.searchParams.set("cmd", "_xclick");
    redirect.searchParams.set("business", businessEmail);
    redirect.searchParams.set("currency_code", currencyCode);
    redirect.searchParams.set("amount", money(total));
    redirect.searchParams.set("item_name", `${storeName} order ${orderReference}`);
    redirect.searchParams.set("invoice", orderReference);
    redirect.searchParams.set("custom", orderReference);
    redirect.searchParams.set("return", `${env.clientUrl}/paypal-return?orderRef=${encodeURIComponent(orderReference)}`);
    redirect.searchParams.set("cancel_return", `${env.clientUrl}/checkout?orderRef=${encodeURIComponent(orderReference)}`);
    return {
      redirectUrl: redirect.toString(),
      mode: "paypal_standard",
      currencyCode
    };
  }

  return {
    redirectUrl: appendAmountToPaypalMe(paypalMeLink, total, currencyCode),
    mode: "paypal_me",
    currencyCode
  };
}
