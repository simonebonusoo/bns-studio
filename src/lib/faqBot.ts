// src/lib/faqBot.ts
type BotReply = { text: string; ctas?: { label: string; href: string }[] }

function norm(s: string) {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // rimuove accenti
    .trim()
}

function includesAny(q: string, words: string[]) {
  return words.some((w) => q.includes(w))
}

export function getBotReply(input: string): BotReply {
  const q = norm(input)

  // SALUTI
  if (includesAny(q, ["ciao", "salve", "buongiorno", "buonasera", "hey"])) {
    return {
      text:
        "Ciao! 👋 Sono l’assistente di BNS Studio.\n\nPosso aiutarti con:\n• Servizi\n• Prezzi\n• Tempi\n• Come funziona il processo\n• Contatti / preventivo\n\nDimmi pure cosa ti serve 😊",
      ctas: [{ label: "Richiedi un preventivo", href: "#contatti" }],
    }
  }

  // SERVIZI
  if (
    includesAny(q, [
      "servizi",
      "cosa fate",
      "cosa fai",
      "offrite",
      "web design",
      "sito",
      "brand",
      "logo",
      "stampe",
      "gadget",
    ])
  ) {
    return {
      text:
        "Ecco cosa faccio in BNS Studio:\n\n• **Web Design**: siti e landing page moderni, veloci e ottimizzati.\n• **Brand Identity**: logo, palette, tipografia, kit social.\n• **Gadget e stampe**: materiali pronti per la stampa (biglietti, insegne, menù, ecc.).\n\nSe mi dici che progetto hai in mente, ti indirizzo sulla soluzione migliore.",
      ctas: [
        { label: "Vedi i servizi", href: "#servizi" },
        { label: "Apri i lavori", href: "#portfolio" },
      ],
    }
  }

  // PREZZI
  if (includesAny(q, ["prezzi", "costo", "quanto", "preventivo", "budget", "tariffe"])) {
    return {
      text:
        "Dipende da obiettivi e complessità, ma ti do una guida rapida:\n\n• **Landing page**: ideale per promozioni e acquisizione contatti.\n• **Sito vetrina**: per presentare attività + servizi.\n• **Branding**: da logo singolo a identità completa.\n\nPer un preventivo preciso mi servono 2 info:\n1) che tipo di progetto ti serve (landing/sito/branding)\n2) tempistiche (hai una scadenza?)",
      ctas: [
        { label: "Vedi i prezzi", href: "#prezzi" },
        { label: "Richiedi un preventivo", href: "#contatti" },
      ],
    }
  }

  // TEMPI
  if (includesAny(q, ["tempi", "quanto tempo", "consegna", "scadenza", "deadline"])) {
    return {
      text:
        "In media:\n\n• **Landing**: 1–2 settimane\n• **Sito**: 2–4 settimane\n• **Brand identity**: 1–3 settimane\n\nI tempi dipendono anche da contenuti (testi/foto) e feedback.\nSe mi dici cosa ti serve, ti stimo la consegna.",
      ctas: [{ label: "Contattami", href: "#contatti" }],
    }
  }

  // CONTATTI
  if (includesAny(q, ["contatti", "scriverti", "email", "whatsapp", "telefono", "parliamo"])) {
    return {
      text:
        "Certo! Puoi contattarmi dalla sezione contatti: rispondo il prima possibile.\n\nSe vuoi, dimmi qui:\n• che tipo di progetto è\n• obiettivo (vendere/contatti/brand)\n• tempistiche\n• budget indicativo",
      ctas: [{ label: "Vai ai contatti", href: "#contatti" }],
    }
  }

  // RISORSE (CV / Portfolio)
  if (includesAny(q, ["cv", "curriculum", "portfolio", "pdf", "scarica"])) {
    return {
      text:
        "Vuoi scaricare i materiali?\n\n• **Curriculum Vitae**\n• **Portfolio**\n\nLi trovi nella sezione Risorse.",
      ctas: [{ label: "Apri Risorse", href: "#risorse" }],
    }
  }

  // DEFAULT / FALLBACK
  return {
    text:
      "Ok! Per aiutarti meglio dimmi una di queste cose:\n\n• **Servizi** (sito, branding, stampe)\n• **Prezzi** (che budget hai in mente?)\n• **Tempi** (hai una scadenza?)\n• **Contatti**\n\nOppure scrivimi direttamente dalla sezione contatti 🙂",
    ctas: [{ label: "Richiedi un preventivo", href: "#contatti" }],
  }
}