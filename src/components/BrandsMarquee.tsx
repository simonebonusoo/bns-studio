import { motion } from "framer-motion"

const BRAND_COUNT = 11

export function BrandsMarquee() {
  const brands = Array.from({ length: BRAND_COUNT }, (_, i) => i + 1)
  const row = [...brands, ...brands]

  return (
    <section aria-label="Brand partners">
      <motion.p
        className="text-center text-xs tracking-[0.25em] uppercase text-white/45"
        initial={{ opacity: 0, y: 10 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.6 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
      >
        Alcuni brand con cui abbiamo lavorato
      </motion.p>

      <motion.div
        className="relative mt-4 overflow-hidden"
        initial={{ opacity: 0, y: 12 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.35 }}
        transition={{ duration: 0.55, ease: "easeOut" }}
      >
        {/* fade ai bordi */}
        <div className="pointer-events-none absolute inset-y-0 left-0 w-24 z-10 bg-gradient-to-r from-[#0b0b0c] to-transparent" />
        <div className="pointer-events-none absolute inset-y-0 right-0 w-24 z-10 bg-gradient-to-l from-[#0b0b0c] to-transparent" />

        <motion.div
          className="inline-flex items-center gap-6 md:gap-8 py-6 min-w-max"
          animate={{ x: ["0%", "-50%"] }}
          transition={{ duration: 40, ease: "linear", repeat: Infinity }}
          style={{ willChange: "transform" }}
        >
          {row.map((n, i) => (
            <div
              key={`${n}-${i}`}
              className="flex items-center justify-center h-28 md:h-36 shrink-0"
            >
              <img
                src={`/brands/${n}.png`}
                alt={`Brand ${n}`}
                draggable={false}
                className="h-20 md:h-24 w-auto object-contain opacity-65 grayscale transition hover:opacity-100 hover:grayscale-0"
              />
            </div>
          ))}
        </motion.div>
      </motion.div>
    </section>
  )
}