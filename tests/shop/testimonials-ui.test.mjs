import test from "node:test"
import assert from "node:assert/strict"
import fs from "node:fs"
import path from "node:path"

const root = process.cwd()

function read(file) {
  return fs.readFileSync(path.join(root, file), "utf8")
}

test("review form uses clean star rating UI and keeps numeric rating payload", () => {
  const testimonials = read("src/sections/Testimonials.tsx")

  assert.match(testimonials, /function StarRatingInput/)
  assert.match(testimonials, /hoverRating/)
  assert.match(testimonials, /onChange=\{\(rating\) => setForm\(\(current\) => \(\{ \.\.\.current, rating \}\)\)\}/)
  assert.match(testimonials, /body: JSON\.stringify\(form\)/)
  assert.match(testimonials, /Titolo della tua esperienza/)
  assert.match(testimonials, /Scrivi la tua esperienza con BNS Studio\.\.\./)
  assert.match(testimonials, /resize-none/)
  assert.doesNotMatch(testimonials, /Lascia una recensione/)
  assert.doesNotMatch(testimonials, /Tag recensione/)
  assert.doesNotMatch(testimonials, /value=\{form\.rating\}[\s\S]*<select/)
})
