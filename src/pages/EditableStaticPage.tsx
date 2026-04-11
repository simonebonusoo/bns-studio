import { useEffect, useState } from "react"

import { Button, getButtonClassName } from "../components/Button"
import { Container } from "../components/Container"
import { useShopAuth } from "../shop/context/ShopAuthProvider"
import { apiFetch } from "../shop/lib/api"
import { parseStaticPageContent, StaticPageContent } from "./static-page-content"

type EditableStaticPageProps = {
  settingsKey: string
  fallbackContent: StaticPageContent
}

function cloneContent(content: StaticPageContent): StaticPageContent {
  return {
    ...content,
    sections: content.sections.map((section) => ({ ...section })),
  }
}

export function EditableStaticPage({ settingsKey, fallbackContent }: EditableStaticPageProps) {
  const { user } = useShopAuth()
  const isAdmin = user?.role === "admin"
  const [content, setContent] = useState<StaticPageContent>(fallbackContent)
  const [draft, setDraft] = useState<StaticPageContent>(fallbackContent)
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
        const nextContent = parseStaticPageContent(settings?.[settingsKey], fallbackContent)
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
  }, [fallbackContent, settingsKey])

  function updateDraft(key: keyof StaticPageContent, value: string) {
    setDraft((current) => ({
      ...current,
      [key]: value,
    }))
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
          body: "Scrivi qui il testo della nuova sezione.",
        },
      ],
    }))
  }

  function removeSection(index: number) {
    const confirmed = window.confirm("Eliminare questa sezione?")
    if (!confirmed) return

    setDraft((current) => ({
      ...current,
      sections: current.sections.filter((_, itemIndex) => itemIndex !== index),
    }))
  }

  async function saveContent() {
    setError("")
    setMessage("")
    const nextContent = parseStaticPageContent(JSON.stringify(draft), fallbackContent)

    try {
      setSaving(true)
      await apiFetch("/admin/settings", {
        method: "PUT",
        body: JSON.stringify([{ key: settingsKey, value: JSON.stringify(nextContent) }]),
      })
      setContent(nextContent)
      setDraft(cloneContent(nextContent))
      setEditing(false)
      setMessage("Contenuto salvato correttamente.")
    } catch (err) {
      setError(err instanceof Error ? err.message : "Errore durante il salvataggio del contenuto.")
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

  return (
    <main className="pb-24 pt-14 md:pt-18">
      <Container>
        <div className="w-full space-y-8">
          <div className="w-full rounded-[36px] border border-white/10 bg-white/[0.035] p-6 shadow-[0_24px_80px_rgba(0,0,0,.22)] md:p-10">
            <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
              <div className="w-full space-y-4">
                {editing ? (
                  <input
                    className="shop-input max-w-sm text-xs uppercase tracking-[0.28em]"
                    value={draft.eyebrow}
                    onChange={(event) => updateDraft("eyebrow", event.target.value)}
                    aria-label="Eyebrow pagina"
                  />
                ) : (
                  <p className="text-xs uppercase tracking-[0.32em] text-white/45">{displayContent.eyebrow}</p>
                )}

                {editing ? (
                  <input
                    className="shop-input text-3xl font-semibold text-white md:text-5xl"
                    value={draft.title}
                    onChange={(event) => updateDraft("title", event.target.value)}
                    aria-label="Titolo pagina"
                  />
                ) : (
                  <h1 className="text-4xl font-semibold tracking-tight text-white md:text-6xl">{displayContent.title}</h1>
                )}

                {editing ? (
                  <textarea
                    className="shop-input min-h-28 text-base leading-7"
                    value={draft.intro}
                    onChange={(event) => updateDraft("intro", event.target.value)}
                    aria-label="Introduzione pagina"
                  />
                ) : (
                  <p className="w-full text-base leading-8 text-white/70 md:text-lg">{displayContent.intro}</p>
                )}
              </div>

              {isAdmin ? (
                <div className="flex flex-wrap gap-3 lg:justify-end">
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

            {loading ? <p className="mt-6 text-sm text-white/45">Caricamento contenuti...</p> : null}
            {message ? <p className="mt-6 text-sm text-emerald-200/80">{message}</p> : null}
            {error ? <p className="mt-6 text-sm text-red-200/80">{error}</p> : null}
          </div>

          {editing ? (
            <div className="flex justify-end">
              <button type="button" onClick={addSection} className={getButtonClassName({ variant: "profile", size: "sm" })}>
                Aggiungi sezione
              </button>
            </div>
          ) : null}

          <section className="grid gap-5 lg:grid-cols-2">
            {displayContent.sections.map((section, index) => (
              <article key={`${section.title}-${index}`} className="rounded-[30px] border border-white/10 bg-white/[0.03] p-6 md:p-7">
                {editing ? (
                  <div className="space-y-4">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                      <input
                        className="shop-input text-xl font-semibold"
                        value={draft.sections[index]?.title || ""}
                        onChange={(event) => updateSection(index, "title", event.target.value)}
                        aria-label={`Titolo sezione ${index + 1}`}
                      />
                      <button
                        type="button"
                        onClick={() => removeSection(index)}
                        className="rounded-full border border-red-200/20 px-3 py-2 text-xs font-semibold uppercase tracking-[0.14em] text-red-100/75 transition hover:border-red-200/40 hover:text-red-50"
                      >
                        Elimina
                      </button>
                    </div>
                    <textarea
                      className="shop-input min-h-44 text-sm leading-7"
                      value={draft.sections[index]?.body || ""}
                      onChange={(event) => updateSection(index, "body", event.target.value)}
                      aria-label={`Contenuto sezione ${index + 1}`}
                    />
                  </div>
                ) : (
                  <>
                    <h2 className="text-xl font-semibold text-white">{section.title}</h2>
                    <p className="mt-4 whitespace-pre-line text-sm leading-7 text-white/66 md:text-[15px]">{section.body}</p>
                  </>
                )}
              </article>
            ))}
          </section>

        </div>
      </Container>
    </main>
  )
}
