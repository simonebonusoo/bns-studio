import { Container } from "../components/Container"
import { Backdrop } from "../components/Backdrop"
import { Button } from "../components/Button"
import { Reveal } from "../components/Reveal"

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
              nasce da un <span className="text-white">design</span> chiaro.
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
              <Button href="#shop">Apri shop</Button>
              <Button href="/shop/auth" variant="ghost">
                Accedi al profilo
              </Button>
            </div>
          </Reveal>
        </div>
      </Container>
    </section>
  )
}
