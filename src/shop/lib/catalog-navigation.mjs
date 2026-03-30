export function scrollCatalogSectionToTop(target, options = { behavior: "smooth", block: "start" }) {
  if (target && typeof target.scrollIntoView === "function") {
    target.scrollIntoView(options)
    return "element"
  }

  if (typeof window !== "undefined" && typeof window.scrollTo === "function") {
    window.scrollTo({ top: 0, behavior: options?.behavior || "smooth" })
    return "window"
  }

  return "none"
}
