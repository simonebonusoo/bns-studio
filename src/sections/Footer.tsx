import { Container } from "../components/Container"
import { Logo } from "../components/Logo"

import { SiInstagram, SiWhatsapp, SiLinkedin } from "react-icons/si"
import { FiMail, FiPhone } from "react-icons/fi"

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
        <div className="py-8 flex flex-col items-center text-center gap-5">
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
            <Logo />
          </div>

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