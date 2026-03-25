function SocialButton({ href, label, children }) {
  const external = href.startsWith("http");
  return (
    <a
      href={href}
      target={external ? "_blank" : undefined}
      rel={external ? "noreferrer" : undefined}
      aria-label={label}
      className="social-button"
    >
      <span>{children}</span>
    </a>
  );
}

export default function Footer() {
  return (
    <footer className="site-footer">
      <div className="footer-inner">
        <div className="footer-socials">
          <SocialButton href="https://www.instagram.com/cloudgrphc/?hl=it" label="Instagram">
            IG
          </SocialButton>
          <SocialButton href="https://wa.me/3913170206" label="WhatsApp">
            WA
          </SocialButton>
          <SocialButton href="mailto:bnsstudio@gmail.com" label="Email">
            @
          </SocialButton>
          <SocialButton href="tel:+393913170206" label="Telefono">
            TEL
          </SocialButton>
          <SocialButton href="https://www.linkedin.com" label="LinkedIn">
            IN
          </SocialButton>
        </div>

        <div className="footer-branding">
          <img className="brand-logo" src="/brand/logo.png" alt="Logo bns studio" />
          <strong>BNS Studio</strong>
        </div>

        <div className="footer-copy">© 2026 BNS Studio. Tutti i diritti riservati.</div>

        <a href="/privacy" className="footer-privacy">
          Informativa privacy
        </a>
      </div>
    </footer>
  );
}
