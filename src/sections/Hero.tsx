import { Container } from "../components/Container"
import { Backdrop } from "../components/Backdrop"
import { Button } from "../components/Button"
import { Reveal } from "../components/Reveal"
import { BrandsMarquee } from "../components/BrandsMarquee"

export function Hero() {
  return (
    <section id="top" className="relative pt-20 md:pt-28 pb-6 md:pb-8">
      <Backdrop />

      <Container>
        {/* HEADLINE + CTA */}
        <div className="text-center max-w-3xl mx-auto">
          <Reveal>
            <h1 className="text-4xl md:text-6xl font-semibold tracking-tight leading-[1.05]">
              Ogni grande{" "}
              <span className="text-[#e3f503]">brand</span>
              <br />
              parte da un <span className="text-white">design</span> chiaro.
            </h1>
          </Reveal>

          <Reveal delay={0.08}>
            <p className="mt-6 text-white/70 leading-relaxed text-base md:text-lg">
              BNS Studio crea identità visive, siti web e prodotti digitali con
              un&apos;estetica essenziale, animazioni fluide e performance reali.
            </p>
          </Reveal>

          <Reveal delay={0.16}>
            <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
              <Button href="#prezzi">Vedi prezzi</Button>
              <Button href="#portfolio" variant="ghost">
                Guarda portfolio
              </Button>
            </div>
          </Reveal>
        </div>

        {/* BRAND MARQUEE – spacing gestito qui (non dentro BrandsMarquee) */}
        <div className="mt-6 md:mt-8">
          <BrandsMarquee />
        </div>
      </Container>
    </section>
  )
}