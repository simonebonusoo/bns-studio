import { useEffect } from "react"
import { useParams } from "react-router-dom"

import { BRService } from "./BRService"
import { UmaniProject } from "./UmaniProject"
import { ZuccalaGiacomo } from "./ZuccalaGiacomo"
import { AGMViaggi } from "./AGMViaggi"
import { MamoCafe } from "./MamoCafe"
import { BacinoGrande } from "./BacinoGrande"

export function CaseStudyPage() {
  const { slug } = useParams<{ slug: string }>()

  useEffect(() => {
    window.scrollTo(0, 0)
  }, [slug])

  if (!slug) return null

  switch (slug) {
    case "br-service":
      return <BRService />

    case "umani-project":
      return <UmaniProject />

    case "zuccala-giacomo":
      return <ZuccalaGiacomo />

    case "agm-viaggi":
      return <AGMViaggi />

    case "mamo-cafe":
      return <MamoCafe />
      
    case "bacino-grande":
      return <BacinoGrande />

    default:
      return (
        <section className="pt-28 pb-24">
          <div className="text-center text-white/70">Case study non trovato.</div>
        </section>
      )
  }
}