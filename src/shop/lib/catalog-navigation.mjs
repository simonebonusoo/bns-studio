export function scrollCatalogSectionToTop(_target, options = { behavior: "smooth" }) {
  if (typeof window !== "undefined" && typeof window.scrollTo === "function") {
    window.scrollTo({ top: 0, behavior: options?.behavior || "smooth" })
    return "window"
  }

  return "none"
}
