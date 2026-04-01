function stripTagLikeContent(value) {
  return String(value || "").replace(/<[^>]*>/g, " ")
}

function normalizeWhitespace(value) {
  return value.replace(/\s+/g, " ").trim()
}

export function sanitizePlainText(value) {
  return normalizeWhitespace(stripTagLikeContent(value))
}

export function sanitizeMultilineText(value) {
  return String(value || "")
    .split(/\r?\n/)
    .map((line) => sanitizePlainText(line))
    .filter(Boolean)
    .join("\n")
    .trim()
}
