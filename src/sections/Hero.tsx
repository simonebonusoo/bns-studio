import { Container } from "../components/Container"
import { Button } from "../components/Button"
import { Reveal } from "../components/Reveal"

export function Hero() {
  function openProfilePanel() {
    window.dispatchEvent(new CustomEvent("bns:open-profile"))
  }

  return (
    <section id="top" className="relative pt-20 md:pt-28 pb-6 md:pb-8">
      <Container>
        {/* HEADLINE + CTA */}
        <div className="text-center max-w-3xl mx-auto">
          <Reveal>
            <h1 className="text-4xl md:text-6xl font-semibold tracking-tight leading-[1.05]">
              Poster, stampe e oggetti
              <br />
              con l&apos;estetica <span className="text-[#e3f503]">BNS Studio</span>.
            </h1>
          </Reveal>

          <Reveal delay={0.08}>
            <p className="mt-6 text-white/70 leading-relaxed text-base md:text-lg">
              Collezioni visive pensate per scrivanie, studi creativi e spazi personali:
              poster distintivi, gadget curati e pezzi progettati per chi cerca un immaginario
              netto, contemporaneo e riconoscibile.
            </p>
          </Reveal>

          <Reveal delay={0.16}>
            <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
              <Button href="#shop">Apri shop</Button>
              <Button type="button" onClick={openProfilePanel} variant="ghost">
                Account
              </Button>
            </div>
          </Reveal>
        </div>
      </Container>
    </section>
  )
}
