import { Container } from "../components/Container"
import { Logo } from "../components/Logo"

import { SiInstagram, SiWhatsapp } from "react-icons/si"
import { FiMail, FiPhone } from "react-icons/fi"
import { motion } from "framer-motion"

function PayPalMark() {
  return (
    <svg
      viewBox="0 0 124 33"
      role="img"
      aria-label="PayPal"
      className="block h-5 w-auto"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        fill="#003087"
        d="M46.63 9.18h-5.74c-.39 0-.73.29-.79.68l-2.32 14.74a.48.48 0 0 0 .47.56h2.74c.39 0 .73-.29.79-.68l.63-3.98c.06-.39.39-.68.79-.68h1.82c3.78 0 5.96-1.83 6.53-5.45.26-1.58.01-2.82-.72-3.69-.81-.98-2.26-1.5-4.2-1.5Zm.66 5.4c-.31 2.05-1.88 2.05-3.4 2.05h-.86l.61-3.86c.04-.23.23-.39.46-.39h.4c1.03 0 2 0 2.5.59.3.35.4.88.29 1.61Z"
      />
      <path
        fill="#003087"
        d="M63.77 14.5h-2.75a.48.48 0 0 0-.47.4l-.12.77-.19-.28c-.6-.87-1.94-1.16-3.28-1.16-3.07 0-5.7 2.33-6.21 5.59-.27 1.63.11 3.18 1.03 4.26.84.99 2.04 1.4 3.46 1.4 2.47 0 3.84-1.59 3.84-1.59l-.12.77a.48.48 0 0 0 .47.56h2.48c.39 0 .73-.29.79-.68l1.49-9.47a.48.48 0 0 0-.47-.56h.05Zm-3.83 5.4c-.27 1.59-1.53 2.66-3.13 2.66-.8 0-1.45-.26-1.86-.75-.4-.49-.56-1.18-.43-1.94.25-1.58 1.54-2.69 3.12-2.69.79 0 1.43.26 1.84.76.42.51.58 1.2.46 1.96Z"
      />
      <path
        fill="#003087"
        d="M78.43 14.5h-2.76c-.26 0-.51.13-.66.35l-3.81 5.61-1.61-5.39a.8.8 0 0 0-.77-.57h-2.72a.48.48 0 0 0-.45.63l3.04 8.92-2.86 4.04a.48.48 0 0 0 .39.76h2.76c.26 0 .51-.13.66-.34l9.19-13.25a.48.48 0 0 0-.4-.76Z"
      />
      <path
        fill="#009cde"
        d="M87.54 9.18h-5.74c-.39 0-.73.29-.79.68l-2.32 14.74a.48.48 0 0 0 .47.56h2.95c.27 0 .51-.2.55-.47l.66-4.19c.06-.39.39-.68.79-.68h1.82c3.78 0 5.96-1.83 6.53-5.45.26-1.58 0-2.82-.73-3.69-.8-.98-2.25-1.5-4.19-1.5h.04Zm.66 5.4c-.31 2.05-1.88 2.05-3.4 2.05h-.86l.61-3.86c.04-.23.23-.39.46-.39h.39c1.04 0 2.01 0 2.51.59.3.35.4.88.29 1.61Z"
      />
      <path
        fill="#009cde"
        d="M104.66 14.5h-2.75a.48.48 0 0 0-.47.4l-.12.77-.19-.28c-.6-.87-1.94-1.16-3.28-1.16-3.07 0-5.7 2.33-6.21 5.59-.27 1.63.11 3.18 1.03 4.26.84.99 2.04 1.4 3.46 1.4 2.47 0 3.84-1.59 3.84-1.59l-.12.77a.48.48 0 0 0 .47.56h2.48c.39 0 .73-.29.79-.68l1.49-9.47a.48.48 0 0 0-.47-.56h.05Zm-3.83 5.4c-.27 1.59-1.53 2.66-3.13 2.66-.8 0-1.45-.26-1.86-.75-.4-.49-.56-1.18-.43-1.94.25-1.58 1.54-2.69 3.12-2.69.79 0 1.43.26 1.84.76.42.51.58 1.2.46 1.96Z"
      />
      <path
        fill="#009cde"
        d="M107.86 9.58 105.5 24.6a.48.48 0 0 0 .47.56h2.37c.39 0 .73-.29.79-.68l2.33-14.74a.48.48 0 0 0-.47-.56h-2.66a.48.48 0 0 0-.47.4Z"
      />
      <path
        fill="#003087"
        d="M17.9 2.27H7.38c-.72 0-1.33.52-1.44 1.23L1.68 30.52a.87.87 0 0 0 .86 1h5.01c.72 0 1.33-.52 1.44-1.23l1.15-7.29c.11-.71.72-1.23 1.44-1.23h3.33c6.93 0 10.93-3.35 11.97-10 .47-2.9.02-5.17-1.32-6.77-1.47-1.79-4.12-2.73-7.66-2.73Z"
      />
      <path
        fill="#009cde"
        d="M29.17 13.05c-.09.58-.2 1.13-.36 1.65-1.19 5.13-5.01 7.84-11.26 7.84h-3.32c-.72 0-1.33.52-1.44 1.23l-1.46 9.18h5.39c.63 0 1.17-.46 1.27-1.08l.05-.27.73-4.62.05-.35c.1-.62.64-1.08 1.27-1.08h.8c5.5 0 9.81-2.24 11.07-8.7.52-2.69.25-4.93-1.13-6.51-.42-.48-.94-.87-1.55-1.18.06 1.21.03 2.51-.11 3.89Z"
      />
      <path
        fill="#012169"
        d="M27.7 8.59a7.4 7.4 0 0 0-1.4-.31 17.86 17.86 0 0 0-2.22-.13h-8.25c-.63 0-1.17.46-1.27 1.08l-1.67 10.57-.05.31c.11-.71.72-1.23 1.44-1.23h3.33c6.25 0 10.07-2.71 11.26-7.84.16-.52.27-1.07.36-1.65.06-1.38.02-2.68-.11-3.89a6.91 6.91 0 0 0-1.42-.91Z"
      />
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
            <SocialButton href="https://www.instagram.com/bnsstudio.it/?hl=it" label="Instagram">
              <SiInstagram className="h-5 w-5" />
            </SocialButton>

            <SocialButton href="https://wa.me/3913170206" label="WhatsApp">
              <SiWhatsapp className="h-5 w-5" />
            </SocialButton>

            <SocialButton href="mailto:bnsstudio26@gmail.com" label="Email">
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
            className="flex flex-col items-center gap-2"
          >
            <div className="text-[11px] uppercase tracking-[0.24em] text-white/45">Pagamenti accettati</div>
            <div className="inline-flex items-center justify-center rounded-xl border border-white/10 bg-white px-3.5 py-2 shadow-[0_2px_10px_rgba(0,0,0,0.25)]">
              <PayPalMark />
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
