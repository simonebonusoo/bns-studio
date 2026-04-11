import test from "node:test"
import assert from "node:assert/strict"
import fs from "node:fs"
import path from "node:path"

const root = process.cwd()

function read(file) {
  return fs.readFileSync(path.join(root, file), "utf8")
}

test("footer keeps clean PayPal mark and removes LinkedIn social icon", () => {
  const footer = read("src/sections/Footer.tsx")

  assert.match(footer, /function PayPalMark/)
  assert.match(footer, /h-7/)
  assert.doesNotMatch(footer, /Pagamento sicuro/)
  assert.match(footer, /text-\[#003087\]/)
  assert.match(footer, /text-\[#009cde\]/)
  assert.doesNotMatch(footer, /SiLinkedin/)
  assert.doesNotMatch(footer, /LinkedIn/)
  assert.doesNotMatch(footer, /linkedin\.com/)
  assert.doesNotMatch(footer, /viewBox="0 0 48 32"/)
})
