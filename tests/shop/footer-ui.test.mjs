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
  assert.match(footer, /viewBox="0 0 124 33"/)
  assert.match(footer, /aria-label="PayPal"/)
  assert.match(footer, /className="block h-5 w-auto"/)
  assert.doesNotMatch(footer, /Pagamento sicuro/)
  assert.match(footer, /fill="#003087"/)
  assert.match(footer, /fill="#009cde"/)
  assert.match(footer, /rounded-xl border border-white\/10 bg-white px-3\.5 py-2/)
  assert.match(footer, /shadow-\[0_2px_10px_rgba\(0,0,0,0\.25\)\]/)
  assert.doesNotMatch(footer, /bg-white\/\[0\.04\] px-3\.5 py-3/)
  assert.doesNotMatch(footer, /rounded-md bg-white px-2\.5/)
  assert.doesNotMatch(footer, /SiLinkedin/)
  assert.doesNotMatch(footer, /LinkedIn/)
  assert.doesNotMatch(footer, /linkedin\.com/)
  assert.doesNotMatch(footer, /viewBox="0 0 48 32"/)
})
