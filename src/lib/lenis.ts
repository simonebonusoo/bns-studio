import type Lenis from "lenis"

declare global {
  interface Window {
    __lenis?: Lenis
  }
}

export function setLenis(lenis: Lenis) {
  window.__lenis = lenis
}

export function getLenis() {
  return window.__lenis
}