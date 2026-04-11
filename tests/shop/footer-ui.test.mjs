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
  assert.match(footer, /className="block h-8 w-auto"/)
  assert.doesNotMatch(footer, /Pagamento sicuro/)
  assert.match(footer, /fill="#003087"/)
  assert.match(footer, /fill="#009cde"/)
  assert.doesNotMatch(footer, /rounded-2xl border border-white\/10 bg-white\/\[0\.04\] px-3\.5 py-3/)
  assert.doesNotMatch(footer, /rounded-md bg-white px-2\.5/)
  assert.doesNotMatch(footer, /SiLinkedin/)
  assert.doesNotMatch(footer, /LinkedIn/)
  assert.doesNotMatch(footer, /linkedin\.com/)
  assert.doesNotMatch(footer, /viewBox="0 0 48 32"/)
})
