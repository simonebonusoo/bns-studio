export function Backdrop(){
  return (
    <div className="pointer-events-none fixed inset-0 -z-10">
      <div className="absolute inset-0" style={{
        background:
          "radial-gradient(900px 420px at 50% 0%, rgba(215,236,0,.12), transparent 60%), radial-gradient(700px 400px at 20% 10%, rgba(255,255,255,.9), transparent 65%), radial-gradient(800px 520px at 80% 12%, rgba(255,255,255,.7), transparent 70%)"
      }} />
      <div className="absolute inset-0 bg-grid opacity-70" />
      <div className="absolute inset-0 bg-gradient-to-b from-[#fafaf8] via-[#f7f7f8]/90 to-[#f3f4f6]" />
    </div>
  )
}
