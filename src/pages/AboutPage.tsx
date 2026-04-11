import { useEffect, useState } from "react"

import founderImageUrl from "../assets/founder/simone-centrale.jpeg"
import { Button, getButtonClassName } from "../components/Button"
import { Container } from "../components/Container"
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
        const nextContent = withDefaultImages(parseAboutPageContent(settings?.[ABOUT_PAGE_SETTINGS_KEY], fallbackContent))
        setContent(nextContent)
        setDraft(cloneContent(nextContent))
      })
      .catch(() => {
        if (cancelled) return
        setContent(fallbackContent)
        setDraft(cloneContent(fallbackContent))
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
      setError(err instanceof Error ? err.message : "Errore durante il caricamento della foto staff.")
    }
  }

  function addStaffMember() {
    setDraft((current) => ({
      ...current,
      staff: [
        ...current.staff,
        {
          id: `staff-${Date.now()}`,
          name: "Nuovo membro",
          role: "Ruolo",
          imageUrl: "",
        },
      ],
    }))
  }

  function removeStaffMember(index: number) {
    setDraft((current) => ({
      ...current,
      staff: current.staff.filter((_, itemIndex) => itemIndex !== index),
    }))
  }

  async function saveContent() {
    setError("")
    setMessage("")
    const nextContent = withDefaultImages(parseAboutPageContent(JSON.stringify({ ...draft, closing: "" }), fallbackContent))

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

  const displayContent = editing ? draft : content
  const serviceSectionOffset = 3
  const serviceSections = displayContent.sections.slice(serviceSectionOffset)

  return (
    <main className="pb-24 pt-14 md:pt-18">
      <Container>
        <div className="mx-auto w-full max-w-7xl space-y-16">
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

            <div className="rounded-[38px] border border-white/10 bg-white/[0.025] px-5 py-8 md:px-10 md:py-12">
              {editing ? (
                <textarea
                  className="shop-input min-h-72 text-base leading-8"
                  value={draft.intro}
                  onChange={(event) => updateDraft("intro", event.target.value)}
                  aria-label="Testo Chi siamo"
                />
              ) : (
                <p className="max-w-5xl whitespace-pre-line text-lg leading-9 text-white/72 md:text-xl">{displayContent.intro}</p>
              )}

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
                    <p className="text-xs uppercase tracking-[0.32em] text-white/40">03 / Persone</p>
                    <input
                      className="shop-input text-3xl font-semibold"
                      value={draft.staffTitle}
                      onChange={(event) => updateDraft("staffTitle", event.target.value)}
                      aria-label="Titolo staff"
                    />
                    <textarea
                      className="shop-input min-h-24 text-sm leading-7"
                      value={draft.staffIntro}
                      onChange={(event) => updateDraft("staffIntro", event.target.value)}
                      aria-label="Introduzione staff"
                    />
                  </>
                ) : (
                  <>
                    <p className="text-xs uppercase tracking-[0.32em] text-white/40">03 / Persone</p>
                    <h2 className="text-3xl font-semibold text-white md:text-5xl">{displayContent.staffTitle}</h2>
                    <p className="text-base leading-8 text-white/65">{displayContent.staffIntro}</p>
                  </>
                )}
              </div>

              {editing ? (
                <button type="button" onClick={addStaffMember} className={getButtonClassName({ variant: "profile", size: "sm" })}>
                  Aggiungi
                </button>
              ) : null}
            </div>

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {displayContent.staff.map((member, index) => (
                <article key={member.id} className="overflow-hidden rounded-[24px] border border-white/10 bg-white/[0.03]">
                  <div className="aspect-square bg-white/[0.04]">
                    {member.imageUrl ? (
                      <img src={member.imageUrl} alt={member.name} className="h-full w-full object-cover" />
                    ) : (
                      <div className="flex h-full items-center justify-center text-sm text-white/45">Foto staff</div>
                    )}
                  </div>
                  <div className="space-y-3 p-4">
                    {editing ? (
                      <>
                        <input
                          className="shop-input"
                          value={draft.staff[index]?.name || ""}
                          onChange={(event) => updateStaff(index, "name", event.target.value)}
                          aria-label={`Nome staff ${index + 1}`}
                        />
                        <input
                          className="shop-input"
                          value={draft.staff[index]?.role || ""}
                          onChange={(event) => updateStaff(index, "role", event.target.value)}
                          aria-label={`Ruolo staff ${index + 1}`}
                        />
                        <div className="flex flex-wrap gap-2">
                          <label className="inline-flex cursor-pointer rounded-full border border-white/10 px-3 py-2 text-xs text-white/72 transition hover:border-white/20 hover:text-white">
                            Carica foto
                            <input
                              type="file"
                              accept="image/*"
                              className="hidden"
                              onChange={(event) => {
                                void uploadStaffImage(index, event.target.files)
                                event.currentTarget.value = ""
                              }}
                            />
                          </label>
                          <button
                            type="button"
                            onClick={() => removeStaffMember(index)}
                            className="rounded-full border border-white/10 px-3 py-2 text-xs text-white/55 transition hover:border-white/20 hover:text-white"
                          >
                            Rimuovi
                          </button>
                        </div>
                      </>
                    ) : (
                      <>
                        <h3 className="text-base font-semibold text-white">{member.name}</h3>
                        <p className="text-xs uppercase tracking-[0.18em] text-white/50">{member.role}</p>
                      </>
                    )}
                  </div>
                </article>
              ))}
            </div>
          </section>

        </div>
      </Container>
    </main>
  )
}
