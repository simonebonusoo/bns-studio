import puppeteer from "puppeteer-core"

const browser = await puppeteer.launch({
  executablePath: "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
  headless: "new",
  args: ["--no-sandbox", "--disable-web-security", "--disable-features=IsolateOrigins,site-per-process"],
})

const page = await browser.newPage()
const errors = []

page.on("pageerror", (error) => errors.push(`pageerror:${error.message}`))
page.on("console", (message) => {
  if (message.type() === "error") {
    errors.push(`console:${message.text()}`)
  }
})

await page.goto("http://localhost:4173/shop/print-identity-pack", {
  waitUntil: "networkidle0",
})

const title = await page.$eval("h1", (element) => element.textContent).catch(() => null)
const bodyText = await page.$eval("body", (element) => element.textContent || "")
const priceLabelCount = await page.$$eval("*", (nodes) =>
  nodes.filter((node) => (node.textContent || "").trim() === "Prezzo").length
)

console.log(
  JSON.stringify(
    {
      title,
      priceLabelCount,
      bodyIncludesProduct: bodyText.includes("Print Identity Pack"),
      bodyIncludesAvailability: bodyText.includes("Disponibilità"),
      errors,
    },
    null,
    2
  )
)

await browser.close()
