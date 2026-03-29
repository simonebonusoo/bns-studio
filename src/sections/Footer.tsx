import { Container } from "../components/Container"
import { Logo } from "../components/Logo"

import { SiInstagram, SiWhatsapp, SiLinkedin } from "react-icons/si"
import { FiMail, FiPhone } from "react-icons/fi"
import { motion } from "framer-motion"

function PayPalMark() {
  return (
    <svg viewBox="0 0 48 32" aria-hidden className="h-5 w-auto">
      <path fill="#253B80" d="M19.2 6.1c.2-1.1 0-1.9-.5-2.5-.7-.8-2-1.2-3.8-1.2H9.8c-.4 0-.7.3-.8.7L6.2 20.7c-.1.4.2.8.6.8h3.1l.8-5.1-.1.2c.1-.4.4-.7.8-.7h1.7c3.4 0 6.1-1.4 6.9-5.4.3-1.7.1-3-.8-3.9z" />
      <path fill="#179BD7" d="M39.3 12.5c-.2 0-.4.2-.4.4l-.1.9-.2-.3c-.6-.9-1.9-1.2-3.2-1.2-3 0-5.6 2.3-6.1 5.5-.3 1.6.1 3.1.9 4.1.8 1 2 1.4 3.5 1.4 2.5 0 3.9-1.6 3.9-1.6l-.1.9c0 .3.2.5.4.5h2.8c.4 0 .7-.3.8-.6l1.7-10c.1-.2-.2-.4-.5-.4h-3.4z" />
      <path fill="#222D65" d="M23.7 12.7c-.5 3.2-3.1 5.5-6.1 5.5h-1.7c-.4 0-.7.3-.8.7l-1 6.3-.3 1.8c-.1.4.2.8.6.8h2.9c.3 0 .6-.2.7-.5v-.1l.5-3.3v-.2c.1-.3.4-.5.7-.5h.5c2.8 0 4.9-1.1 5.6-4.4.3-1.4.1-2.6-.6-3.4-.3-.3-.6-.6-1-.7z" />
    </svg>
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

            {/* se vuoi anche LinkedIn */}
            <SocialButton href="https://www.linkedin.com" label="LinkedIn">
              <SiLinkedin className="h-5 w-5" />
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
              <span className="text-sm text-white/75">PayPal</span>
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
