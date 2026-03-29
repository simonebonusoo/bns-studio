type LogoProps = {
  className?: string
}

export function Logo({ className = "h-8 md:h-10" }: LogoProps) {
  return (
    <img
      src="/logo-bns-cropped.png"
      alt="BNS Studio"
      draggable={false}
      className={`${className} w-auto object-contain shrink-0`}
    />
  )
}
