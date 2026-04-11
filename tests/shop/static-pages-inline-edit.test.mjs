import test from "node:test"
import assert from "node:assert/strict"
import fs from "node:fs"
import path from "node:path"

const root = process.cwd()

function read(file) {
  return fs.readFileSync(path.join(root, file), "utf8")
}

test("static pages expose wider editorial layouts and admin inline editing", () => {
  const editor = read("src/pages/EditableStaticPage.tsx")
  const about = read("src/pages/AboutPage.tsx")
  const privacy = read("src/pages/PrivacyPolicyPage.tsx")

  assert.match(editor, /max-w-7xl/)
  assert.match(editor, /Modifica/)
  assert.match(editor, /Salva/)
  assert.match(editor, /Annulla/)
  assert.match(editor, /user\?\.role === "admin"/)
  assert.match(editor, /\/store\/settings/)
  assert.match(editor, /\/admin\/settings/)
  assert.match(editor, /textarea/)
  assert.match(editor, /JSON\.stringify\(nextContent\)/)

  assert.match(about, /ABOUT_PAGE_SETTINGS_KEY/)
  assert.match(about, /defaultAboutContent/)
  assert.match(about, /founder\/simone-centrale\.jpeg/)
  assert.match(about, /Il nostro staff|staffTitle/)
  assert.match(about, /Aggiungi/)
  assert.match(about, /Aggiungi sezione/)
  assert.match(about, /moveSection/)
  assert.match(about, /Carica foto/)
  assert.doesNotMatch(about, /Sostituisci immagine intro/)
  assert.match(about, /\/admin\/uploads/)
  assert.match(about, /FormData/)
  assert.match(about, /max-w-7xl/)
  assert.doesNotMatch(about, /displayContent\.introImageUrl/)
  assert.doesNotMatch(about, /displayContent\.closing/)
  assert.doesNotMatch(about, /EditableStaticPage/)
  assert.match(privacy, /PRIVACY_PAGE_SETTINGS_KEY/)
  assert.match(privacy, /defaultPrivacyContent/)
})

test("static page fallbacks cover real about and privacy content", () => {
  const content = read("src/pages/static-page-content.ts")

  assert.match(content, /ABOUT_PAGE_SETTINGS_KEY = "staticPage\.about"/)
  assert.match(content, /PRIVACY_PAGE_SETTINGS_KEY = "staticPage\.privacy"/)
  assert.match(content, /Cosa facciamo/)
  assert.match(content, /Brand & Identity/)
  assert.match(content, /AI Visual Production/)
  assert.match(content, /Web & Digital/)
  assert.match(content, /Products & Shop/)
  assert.match(content, /Software & AI Tools/)
  assert.match(content, /Il nostro staff/)
  assert.match(content, /Simone Bonuse/)
  assert.match(content, /CEO & Founder/)
  assert.match(content, /trasformare idee in realta concrete/)
  assert.match(content, /identita visive/)
  assert.doesNotMatch(content, /BNS Studio lavora su progetti digitali che devono essere belli da vedere/)
  assert.match(content, /parseAboutPageContent/)
  assert.match(content, /Account e autenticazione/)
  assert.match(content, /Ordini, spedizioni e ricevute/)
  assert.match(content, /Pagamenti/)
  assert.match(content, /non ha accesso libero ai dati completi della carta/)
  assert.match(content, /bnsstudio26@gmail\.com/)
  assert.match(content, /parseStaticPageContent/)
})
