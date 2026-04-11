import { Container } from "../components/Container"
import { Logo } from "../components/Logo"

import { SiInstagram, SiWhatsapp } from "react-icons/si"
import { FiMail, FiPhone } from "react-icons/fi"
import { motion } from "framer-motion"

function PayPalMark() {
  return (
    <span
      aria-hidden
      className="inline-flex h-6 items-center rounded-md bg-white px-2 text-[13px] font-bold tracking-[-0.03em] text-[#003087]"
    >
      Pay<span className="text-[#009cde]">Pal</span>
    </span>
  )
}

function SocialButton({
  href,
  label,
  children,
}: {
  href: string
  label: string
  children: React.ReactNode
}) {
  return (
    <a
      href={href}
      target={href.startsWith("http") ? "_blank" : undefined}
      rel={href.startsWith("http") ? "noreferrer" : undefined}
      aria-label={label}
      className={[
        "inline-flex items-center justify-center",
        "h-11 w-11 rounded-2xl",
        "bg-white/[0.04] border border-white/10",
        "text-white/80 hover:text-white hover:border-white/20",
        "transition",
      ].join(" ")}
    >
      <span className="h-5 w-5 flex items-center justify-center">{children}</span>
    </a>
  )
}

export function Footer() {
  return (
    <footer className="mt-24 bg-black border-t border-white/10">
      <Container>
        <div className="py-8 flex flex-col items-center text-center gap-6">
          {/* SOCIAL */}
          <div className="flex items-center gap-3">
            <SocialButton href="https://www.instagram.com/cloudgrphc/?hl=it" label="Instagram">
              <SiInstagram className="h-5 w-5" />
            </SocialButton>

            <SocialButton href="https://wa.me/3913170206" label="WhatsApp">
              <SiWhatsapp className="h-5 w-5" />
            </SocialButton>

            <SocialButton href="mailto:bnsstudio@gmail.com" label="Email">
              <FiMail className="h-5 w-5" />
            </SocialButton>

            <SocialButton href="tel:+393913170206" label="Telefono">
              <FiPhone className="h-5 w-5" />
            </SocialButton>
          </div>

          {/* LOGO */}
          <div className="mt-2">
            <Logo className="h-9 md:h-10" />
          </div>

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.4 }}
            transition={{ duration: 0.4, ease: "easeOut" }}
            className="flex flex-col items-center gap-3"
          >
            <div className="text-[11px] uppercase tracking-[0.24em] text-white/45">Pagamenti accettati</div>
            <div className="inline-flex items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3">
              <PayPalMark />
              <span className="text-sm text-white/75">Pagamento sicuro</span>
            </div>
          </motion.div>

          {/* COPYRIGHT */}
          <div className="text-sm text-white/70">© 2026 BNS Studio. All rights reserved.</div>

          {/* PRIVACY */}
          <a href="/privacy" className="text-sm text-white/45 hover:text-white/70 transition">
            Privacy Policy
          </a>
        </div>
      </Container>
    </footer>
  )
}
