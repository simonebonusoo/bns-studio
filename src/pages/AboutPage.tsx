import { EditableStaticPage } from "./EditableStaticPage"
import { ABOUT_PAGE_SETTINGS_KEY, defaultAboutContent } from "./static-page-content"

export function AboutPage() {
  return <EditableStaticPage settingsKey={ABOUT_PAGE_SETTINGS_KEY} fallbackContent={defaultAboutContent} />
}
