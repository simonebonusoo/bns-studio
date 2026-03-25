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
        "bg-white border border-zinc-200",
        "text-zinc-600 hover:text-zinc-950 hover:border-zinc-300",
        "transition",
      ].join(" ")}
    >
      <span className="h-5 w-5 flex items-center justify-center">{children}</span>
    </a>
  )
}

export function Footer() {
  return (
    <footer className="mt-24 border-t border-zinc-200 bg-[#f3f4f6]">
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
          <div className="text-sm text-zinc-600">© 2026 BNS Studio. All rights reserved.</div>

          {/* PRIVACY */}
          <a href="/privacy" className="text-sm text-zinc-500 transition hover:text-zinc-800">
            Privacy Policy
          </a>
        </div>
      </Container>
    </footer>
  )
}
