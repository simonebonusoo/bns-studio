import { useEffect, useState } from "react"

import founderImageUrl from "../assets/founder/simone-centrale.jpeg"
import { Button, getButtonClassName } from "../components/Button"
import { Container } from "../components/Container"
import { ProjectContactForm } from "../components/ProjectContactForm"
import { useShopAuth } from "../shop/context/ShopAuthProvider"
import { apiFetch } from "../shop/lib/api"
import {
  ABOUT_PAGE_SETTINGS_KEY,
  AboutPageContent,
  defaultAboutContent,
  parseAboutPageContent,
} from "./static-page-content"

function withDefaultImages(content: AboutPageContent): AboutPageContent {
  return {
    ...content,
    introImageUrl: "",
    closing: "",
    staff: content.staff.map((member) => ({
      ...member,
      imageUrl: member.imageUrl || (member.id === "simone-bonuse" ? founderImageUrl : ""),
    })),
  }
}

function cloneContent(content: AboutPageContent): AboutPageContent {
  return {
    ...content,
    sections: content.sections.map((section) => ({ ...section })),
    staff: content.staff.map((member) => ({ ...member })),
  }
}

function ensureFounderMember(content: AboutPageContent): AboutPageContent {
  if (content.staff.length > 0) return content

  return {
    ...content,
    staff: [
      {
        id: "simone-bonuse",
        name: "Simone Bonuse",
        role: "CEO & Founder",
        imageUrl: founderImageUrl,
      },
    ],
  }
}

export function AboutPage() {
  const { user } = useShopAuth()
  const isAdmin = user?.role === "admin"
  const fallbackContent = withDefaultImages(defaultAboutContent)
  const [content, setContent] = useState<AboutPageContent>(fallbackContent)
  const [draft, setDraft] = useState<AboutPageContent>(fallbackContent)
  const [editing, setEditing] = useState(false)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState("")
  const [error, setError] = useState("")

  useEffect(() => {
    let cancelled = false

    apiFetch<Record<string, string>>("/store/settings")
      .then((settings) => {
        if (cancelled) return
        const nextContent = ensureFounderMember(withDefaultImages(parseAboutPageContent(settings?.[ABOUT_PAGE_SETTINGS_KEY], fallbackContent)))
        setContent(nextContent)
        setDraft(cloneContent(nextContent))
      })
      .catch(() => {
        if (cancelled) return
        const nextContent = ensureFounderMember(fallbackContent)
        setContent(nextContent)
        setDraft(cloneContent(nextContent))
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [])

  function updateDraft(key: keyof AboutPageContent, value: string) {
    setDraft((current) => ({ ...current, [key]: value }))
  }

  function updateSection(index: number, key: "title" | "body", value: string) {
    setDraft((current) => ({
      ...current,
      sections: current.sections.map((section, itemIndex) =>
        itemIndex === index ? { ...section, [key]: value } : section,
      ),
    }))
  }

  function addSection() {
    setDraft((current) => ({
      ...current,
      sections: [
        ...current.sections,
        {
          title: "Nuova sezione",
          body: "Scrivi qui il testo della nuova sezione editoriale.",
        },
      ],
    }))
  }

  function removeSection(index: number) {
    setDraft((current) => ({
      ...current,
      sections: current.sections.filter((_, itemIndex) => itemIndex !== index),
    }))
  }

  function moveSection(index: number, direction: -1 | 1) {
    setDraft((current) => {
      const targetIndex = index + direction
      if (targetIndex < 0 || targetIndex >= current.sections.length) return current
      const nextSections = [...current.sections]
      const [moved] = nextSections.splice(index, 1)
      nextSections.splice(targetIndex, 0, moved)
      return {
        ...current,
        sections: nextSections,
      }
    })
  }

  function updateStaff(index: number, key: "name" | "role" | "imageUrl", value: string) {
    setDraft((current) => ({
      ...current,
      staff: current.staff.map((member, itemIndex) => (itemIndex === index ? { ...member, [key]: value } : member)),
    }))
  }

  async function uploadImage(file: File) {
    const formData = new FormData()
    formData.append("images", file)
    const data = await apiFetch<{ files: { url: string }[] }>("/admin/uploads", {
      method: "POST",
      body: formData,
    })
    return data.files?.[0]?.url || ""
  }

  async function uploadStaffImage(index: number, files: FileList | null) {
    const file = files?.[0]
    if (!file) return
    setError("")
    try {
      const imageUrl = await uploadImage(file)
      if (imageUrl) updateStaff(index, "imageUrl", imageUrl)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Errore durante il caricamento della foto founder.")
    }
  }

  async function saveContent() {
    setError("")
    setMessage("")
    const nextContent = ensureFounderMember(withDefaultImages(parseAboutPageContent(JSON.stringify({ ...draft, closing: "" }), fallbackContent)))

    try {
      setSaving(true)
      await apiFetch("/admin/settings", {
        method: "PUT",
        body: JSON.stringify([{ key: ABOUT_PAGE_SETTINGS_KEY, value: JSON.stringify(nextContent) }]),
      })
      setContent(nextContent)
      setDraft(cloneContent(nextContent))
      setEditing(false)
      setMessage("Pagina Chi siamo salvata correttamente.")
    } catch (err) {
      setError(err instanceof Error ? err.message : "Errore durante il salvataggio della pagina Chi siamo.")
    } finally {
      setSaving(false)
    }
  }

  function cancelEdit() {
    setDraft(cloneContent(content))
    setEditing(false)
    setError("")
    setMessage("")
  }

  const displayContent = ensureFounderMember(editing ? draft : content)
  const aboutDetailSections = displayContent.sections.slice(0, 2)
  const serviceSectionOffset = 3
  const serviceSections = displayContent.sections.slice(serviceSectionOffset)
  const founderMember = displayContent.staff[0] || fallbackContent.staff[0]

  return (
    <main className="pb-24 pt-14 md:pt-18">
      <Container>
        <div className="w-full space-y-16">
          <section className="space-y-8">
            <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
              <div>
                <p className="text-xs uppercase tracking-[0.32em] text-white/40">01 / Chi siamo</p>
                {editing ? (
                  <input
                    className="shop-input mt-3 text-4xl font-semibold md:text-6xl"
                    value={draft.title}
                    onChange={(event) => updateDraft("title", event.target.value)}
                    aria-label="Titolo Chi siamo"
                  />
                ) : (
                  <h1 className="mt-3 text-5xl font-semibold tracking-tight text-white md:text-7xl">{displayContent.title}</h1>
                )}
              </div>

              {isAdmin ? (
                <div className="flex flex-wrap gap-3 md:justify-end">
                  {editing ? (
                    <>
                      <button
                        type="button"
                        onClick={saveContent}
                        disabled={saving}
                        className={getButtonClassName({ variant: "cart", size: "sm", disabled: saving })}
                      >
                        {saving ? "Salvataggio..." : "Salva"}
                      </button>
                      <button
                        type="button"
                        onClick={cancelEdit}
                        disabled={saving}
                        className={getButtonClassName({ variant: "profile", size: "sm", disabled: saving })}
                      >
                        Annulla
                      </button>
                    </>
                  ) : (
                    <Button type="button" variant="cart" size="sm" onClick={() => setEditing(true)}>
                      Modifica
                    </Button>
                  )}
                </div>
              ) : null}
            </div>

            <div className="w-full space-y-8 rounded-[38px] border border-white/10 bg-white/[0.025] px-5 py-8 md:px-10 md:py-12">
              <article className="grid gap-4 md:grid-cols-[minmax(170px,0.22fr)_minmax(0,1fr)]">
                {editing ? (
                  <>
                    <input
                      className="shop-input text-xl font-semibold"
                      value={draft.eyebrow}
                      onChange={(event) => updateDraft("eyebrow", event.target.value)}
                      aria-label="Sottotitolo mission"
                    />
                    <textarea
                      className="shop-input min-h-40 text-base leading-8"
                      value={draft.intro}
                      onChange={(event) => updateDraft("intro", event.target.value)}
                      aria-label="Testo mission"
                    />
                  </>
                ) : (
                  <>
                    <h2 className="text-xl font-semibold text-white md:text-2xl">{displayContent.eyebrow}</h2>
                    <p className="w-full whitespace-pre-line text-base leading-8 text-white/70 md:text-lg">{displayContent.intro}</p>
                  </>
                )}
              </article>

              {aboutDetailSections.map((section, index) => (
                <article
                  key={`${section.title}-${index}`}
                  className="grid gap-4 border-t border-white/10 pt-8 md:grid-cols-[minmax(170px,0.22fr)_minmax(0,1fr)]"
                >
                  {editing ? (
                    <>
                      <input
                        className="shop-input text-xl font-semibold"
                        value={draft.sections[index]?.title || ""}
                        onChange={(event) => updateSection(index, "title", event.target.value)}
                        aria-label={`Sottotitolo Chi siamo ${index + 1}`}
                      />
                      <textarea
                        className="shop-input min-h-36 text-base leading-8"
                        value={draft.sections[index]?.body || ""}
                        onChange={(event) => updateSection(index, "body", event.target.value)}
                        aria-label={`Testo Chi siamo ${index + 1}`}
                      />
                    </>
                  ) : (
                    <>
                      <h2 className="text-xl font-semibold text-white md:text-2xl">{section.title}</h2>
                      <p className="w-full whitespace-pre-line text-base leading-8 text-white/70 md:text-lg">{section.body}</p>
                    </>
                  )}
                </article>
              ))}

              {loading ? <p className="text-sm text-white/45">Caricamento contenuti...</p> : null}
              {message ? <p className="text-sm text-emerald-200/80">{message}</p> : null}
              {error ? <p className="text-sm text-red-200/80">{error}</p> : null}
            </div>
          </section>

          <section className="space-y-8 border-t border-white/10 pt-14">
            <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
              <div>
                <p className="text-xs uppercase tracking-[0.32em] text-white/40">02 / Offerta</p>
                <h2 className="mt-3 text-3xl font-semibold text-white md:text-5xl">Servizi</h2>
              </div>
              {editing ? (
                <button type="button" onClick={addSection} className={getButtonClassName({ variant: "profile", size: "sm" })}>
                  Aggiungi sezione
                </button>
              ) : null}
            </div>

            <div className="grid gap-5 lg:grid-cols-2">
              {serviceSections.map((section, serviceIndex) => {
                const index = serviceIndex + serviceSectionOffset

                return (
                  <article
                    key={`${section.title}-${index}`}
                    className="rounded-[28px] border border-white/10 bg-white/[0.03] p-5 md:p-6"
                  >
                    {editing ? (
                      <div className="space-y-4">
                        <input
                          className="shop-input text-xl font-semibold"
                          value={draft.sections[index]?.title || ""}
                          onChange={(event) => updateSection(index, "title", event.target.value)}
                          aria-label={`Titolo servizio ${serviceIndex + 1}`}
                        />
                        <textarea
                          className="shop-input min-h-36 text-sm leading-7"
                          value={draft.sections[index]?.body || ""}
                          onChange={(event) => updateSection(index, "body", event.target.value)}
                          aria-label={`Testo servizio ${serviceIndex + 1}`}
                        />
                        <div className="flex flex-wrap gap-2">
                          <button type="button" onClick={() => moveSection(index, -1)} className="rounded-full border border-white/10 px-3 py-2 text-xs text-white/60 transition hover:border-white/20 hover:text-white">
                            Su
                          </button>
                          <button type="button" onClick={() => moveSection(index, 1)} className="rounded-full border border-white/10 px-3 py-2 text-xs text-white/60 transition hover:border-white/20 hover:text-white">
                            Giu
                          </button>
                          <button type="button" onClick={() => removeSection(index)} className="rounded-full border border-white/10 px-3 py-2 text-xs text-white/60 transition hover:border-white/20 hover:text-white">
                            Rimuovi
                          </button>
                        </div>
                      </div>
                    ) : (
                      <>
                        <h3 className="text-xl font-semibold text-white md:text-2xl">{section.title}</h3>
                        <p className="mt-4 whitespace-pre-line text-sm leading-7 text-white/64 md:text-base">{section.body}</p>
                      </>
                    )}
                  </article>
                )
              })}
            </div>
          </section>

          <section className="space-y-8 border-t border-white/10 pt-14">
            <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
              <div className="max-w-3xl space-y-3">
                {editing ? (
                  <>
                    <input
                      className="shop-input max-w-xs text-xs uppercase tracking-[0.28em]"
                      value={draft.founderSectionLabel}
                      onChange={(event) => updateDraft("founderSectionLabel", event.target.value)}
                      aria-label="Label sezione founder"
                    />
                    <input
                      className="shop-input text-3xl font-semibold"
                      value={draft.founderTitle}
                      onChange={(event) => updateDraft("founderTitle", event.target.value)}
                      aria-label="Titolo founder section"
                    />
                    <textarea
                      className="shop-input min-h-24 text-sm leading-7"
                      value={draft.founderIntro}
                      onChange={(event) => updateDraft("founderIntro", event.target.value)}
                      aria-label="Introduzione founder section"
                    />
                  </>
                ) : (
                  <>
                    <p className="text-xs uppercase tracking-[0.32em] text-white/40">{displayContent.founderSectionLabel}</p>
                    <h2 className="max-w-4xl text-3xl font-semibold leading-tight text-white md:text-5xl">{displayContent.founderTitle}</h2>
                    <p className="max-w-3xl text-base leading-8 text-white/65">{displayContent.founderIntro}</p>
                  </>
                )}
              </div>
            </div>

            <article className="rounded-[34px] border border-white/10 bg-white/[0.03] p-6 md:p-8 lg:p-10">
              <div className="space-y-8">
                <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
                  <div className="max-w-3xl space-y-5">
                    <div className="space-y-3">
                      {editing ? (
                        <>
                          <input
                            className="shop-input max-w-md text-2xl font-semibold"
                            value={draft.staff[0]?.name || ""}
                            onChange={(event) => updateStaff(0, "name", event.target.value)}
                            aria-label="Nome founder"
                          />
                          <input
                            className="shop-input max-w-sm"
                            value={draft.staff[0]?.role || ""}
                            onChange={(event) => updateStaff(0, "role", event.target.value)}
                            aria-label="Ruolo founder"
                          />
                        </>
                      ) : (
                        <>
                          <p className="text-xs uppercase tracking-[0.18em] text-white/45">{displayContent.founderProfileLabel}</p>
                          <h3 className="text-3xl font-semibold tracking-tight text-white md:text-4xl">{founderMember.name}</h3>
                          <p className="text-sm uppercase tracking-[0.22em] text-white/52">{founderMember.role}</p>
                        </>
                      )}
                    </div>

                    <div className="space-y-5 text-base leading-8 text-white/68">
                      {editing ? (
                        <>
                          <input
                            className="shop-input max-w-sm text-xs uppercase tracking-[0.28em]"
                            value={draft.founderProfileLabel}
                            onChange={(event) => updateDraft("founderProfileLabel", event.target.value)}
                            aria-label="Label profilo founder"
                          />
                          <textarea
                            className="shop-input min-h-32 text-base leading-8"
                            value={draft.founderDescriptionPrimary}
                            onChange={(event) => updateDraft("founderDescriptionPrimary", event.target.value)}
                            aria-label="Testo founder principale"
                          />
                          <textarea
                            className="shop-input min-h-28 text-base leading-8"
                            value={draft.founderDescriptionSecondary}
                            onChange={(event) => updateDraft("founderDescriptionSecondary", event.target.value)}
                            aria-label="Testo founder secondario"
                          />
                        </>
                      ) : (
                        <>
                          <p>{displayContent.founderDescriptionPrimary}</p>
                          <p>{displayContent.founderDescriptionSecondary}</p>
                        </>
                      )}
                    </div>
                  </div>

                  <div className="shrink-0">
                    <div className="w-[128px] overflow-hidden rounded-[26px] border border-white/10 bg-white/[0.04] sm:w-[148px]">
                      <div className="relative aspect-[4/5]">
                        {founderMember?.imageUrl ? (
                          <>
                            <img src={founderMember.imageUrl} alt={founderMember.name} className="h-full w-full object-cover object-[center_18%]" />
                            <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,rgba(7,7,8,0.04)_0%,rgba(7,7,8,0.18)_100%)]" />
                          </>
                        ) : (
                          <div className="flex h-full items-center justify-center text-sm text-white/45">Foto founder</div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {editing ? (
                  <div className="flex flex-wrap gap-2 border-t border-white/10 pt-6">
                    <label className="inline-flex cursor-pointer rounded-full border border-white/10 px-3 py-2 text-xs text-white/72 transition hover:border-white/20 hover:text-white">
                      Carica foto
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(event) => {
                          void uploadStaffImage(0, event.target.files)
                          event.currentTarget.value = ""
                        }}
                      />
                    </label>
                  </div>
                ) : (
                  <div className="flex flex-wrap gap-3 border-t border-white/10 pt-6">
                    <div className="rounded-full border border-white/10 px-4 py-2 text-xs uppercase tracking-[0.2em] text-white/55">
                      Creativita
                    </div>
                    <div className="rounded-full border border-white/10 px-4 py-2 text-xs uppercase tracking-[0.2em] text-white/55">
                      Direzione
                    </div>
                    <div className="rounded-full border border-white/10 px-4 py-2 text-xs uppercase tracking-[0.2em] text-white/55">
                      Operativita
                    </div>
                  </div>
                )}
              </div>
            </article>
          </section>

          <ProjectContactForm className="border-t border-white/10 pt-14" />

        </div>
      </Container>
    </main>
  )
}
