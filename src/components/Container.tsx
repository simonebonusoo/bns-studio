import type { ReactNode } from "react"

export function Container({ children }: { children: ReactNode }) {
  return (
    <div className="mx-auto w-full max-w-[96rem] px-4 sm:px-6 lg:px-10 xl:px-14">
      {children}
    </div>
  )
}
